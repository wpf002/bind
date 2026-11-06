import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { decideSubmission, draftStatement, INTAKE_CASE_PREFIX, INTAKE_REJECTION_PREFIX, REVIEWS_REQUIRED, type Reviewer } from "@bind/core";
import { reviewSchema, type Recommendation } from "@bind/shared";
import { prisma, type Prisma, type Submission } from "@bind/db";
import { fromSubmissionRow } from "./submissions";

const BEARER = /^Bearer (.+)$/;
const OPEN_STATUSES = ["pending", "in_review"] as const;
/** Trailing characters of the submission id used in a rejection slug. */
const INTAKE_SLUG_LENGTH = 10;

const digest = (value: string) => createHash("sha256").update(value).digest();

const SLUG_PREFIX = "bind-";
const SLUG_DIGITS = 4;

/** The next citable slug after the highest one in the table. Slugs are zero-padded, so the string order is the numeric order. */
async function nextCaseSlug(tx: Prisma.TransactionClient) {
  const last = await tx.case.findFirst({ where: { slug: { startsWith: SLUG_PREFIX } }, orderBy: { slug: "desc" }, select: { slug: true } });
  const n = last ? Number(last.slug.slice(SLUG_PREFIX.length)) + 1 : 1;
  return `${SLUG_PREFIX}${String(n).padStart(SLUG_DIGITS, "0")}`;
}

/**
 * An accepted submission opens a draft case for the reviewers to finish: statement from what was built and the two rules,
 * the workaround as the inclusion reasoning, the submitter as contributor, and the property linked when the slug is known.
 */
async function openDraftCase(tx: Prisma.TransactionClient, submission: Submission) {
  const property = await tx.architecturalProperty.findUnique({ where: { slug: submission.property }, select: { id: true } });
  const last = await tx.case.aggregate({ _max: { sortKey: true } });
  await tx.case.create({
    data: {
      slug: await nextCaseSlug(tx),
      corpusRef: `${INTAKE_CASE_PREFIX}${submission.id.slice(-INTAKE_SLUG_LENGTH)}`,
      title: submission.title,
      statement: draftStatement(submission),
      inclusionReasoning: submission.workaround,
      resolvability: "unresolvable",
      status: "draft",
      contributor: submission.submitterName,
      sortKey: (last._max.sortKey ?? 0) + 1,
      properties: property ? { create: { propertyId: property.id } } : undefined,
    },
  });
}

/**
 * Review queue. Reviewers authenticate with a bearer token from REVIEWERS.
 * With no reviewers configured the routes answer 503.
 */
export function registerReviewRoutes(app: FastifyInstance, reviewers: Reviewer[]) {
  const known = reviewers.map((r) => ({ name: r.name, digest: digest(r.token) }));

  /** Returns the reviewer's name, or sends the error reply and returns null. */
  function authenticate(req: FastifyRequest, reply: FastifyReply): string | null {
    if (known.length === 0) {
      reply.code(503).send({ error: "review_disabled" });
      return null;
    }
    const token = BEARER.exec(req.headers.authorization ?? "")?.[1];
    const given = token ? digest(token) : null;
    const reviewer = given ? known.find((r) => timingSafeEqual(r.digest, given)) : undefined;
    if (!reviewer) {
      reply.code(401).send({ error: "unauthorized" });
      return null;
    }
    return reviewer.name;
  }

  app.get("/review/queue", { schema: { hide: true } }, async (req, reply) => {
    const reviewer = authenticate(req, reply);
    if (!reviewer) return reply;
    const rows = await prisma.submission.findMany({
      where: { status: { in: [...OPEN_STATUSES] } },
      orderBy: { submittedAt: "asc" },
      // No submitter email: reviewers don't need it to run the inclusion test.
      select: {
        id: true,
        title: true,
        building: true,
        property: true,
        jurisdictions: true,
        requiredByCitation: true,
        requiredByUrl: true,
        blockedByCitation: true,
        blockedByUrl: true,
        workaround: true,
        submitterName: true,
        submitterAffiliation: true,
        status: true,
        submittedAt: true,
        reviews: { select: { reviewer: true, recommendation: true, notes: true }, orderBy: { reviewedAt: "asc" } },
      },
    });
    const submissions = rows.map(({ reviews, ...submission }) => {
      const mine = reviews.find((r) => r.reviewer === reviewer) ?? null;
      // Other reviewers' verdicts stay hidden until this reviewer has filed, so the two reviews are independent.
      return { ...fromSubmissionRow(submission), reviewCount: reviews.length, mine, others: mine ? reviews.filter((r) => r !== mine) : [] };
    });
    return { reviewer, required: REVIEWS_REQUIRED, submissions };
  });

  app.post<{ Params: { id: string } }>("/review/submissions/:id/reviews", { schema: { hide: true } }, async (req, reply) => {
    const reviewer = authenticate(req, reply);
    if (!reviewer) return reply;
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(422).send({ error: parsed.error.flatten() });
    const { recommendation, notes, rejectionReason } = parsed.data;
    const submissionId = req.params.id;

    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.findUnique({ where: { id: submissionId } });
      if (!submission) return { ok: false, error: "not_found", code: 404 } as const;
      if (!(OPEN_STATUSES as readonly string[]).includes(submission.status)) return { ok: false, error: "already_decided", code: 409 } as const;

      await tx.submissionReview.upsert({
        where: { submissionId_reviewer: { submissionId, reviewer } },
        create: { submissionId, reviewer, recommendation, notes },
        update: { recommendation, notes, reviewedAt: new Date() },
      });
      const reviews = await tx.submissionReview.findMany({ where: { submissionId }, orderBy: { reviewedAt: "asc" } });
      const status = decideSubmission(reviews.map((r) => ({ recommendation: r.recommendation as Recommendation })));
      await tx.submission.update({ where: { id: submissionId }, data: { status } });

      if (status === "accepted") await openDraftCase(tx, submission);

      // The log takes the closing review's reason and publishes every rejecting reviewer's notes.
      if (status === "rejected" && rejectionReason) {
        await tx.rejection.create({
          data: {
            slug: `${INTAKE_REJECTION_PREFIX}${submissionId.slice(-INTAKE_SLUG_LENGTH)}`,
            title: submission.title,
            claim: submission.building,
            reason: rejectionReason,
            reasoning: reviews.filter((r) => r.recommendation === "reject").map((r) => r.notes).join("\n\n"),
            submittedBy: submission.submitterName,
          },
        });
      }
      return { ok: true, status, reviewCount: reviews.length } as const;
    });

    if (!result.ok) return reply.code(result.code).send({ error: result.error });
    req.log.info({ submissionId, reviewer, recommendation, status: result.status }, "review recorded");
    return reply.code(201).send({ status: result.status, reviewCount: result.reviewCount });
  });
}
