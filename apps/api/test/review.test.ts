import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@bind/db";
import { bearer, buildTestApp, createReviewers, PROPERTY_SLUG, seedCorpus, submissionRow, validSubmission } from "./fixtures";

const [ada, grace] = createReviewers();
const NOTES = "Fails criterion two: the audit rule allows redaction by tombstone.";

type Queue = {
  reviewer: string;
  required: number;
  submissions: { id: string; reviewCount: number; mine: { recommendation: string } | null; others: { reviewer: string }[] }[];
};

let app: Awaited<ReturnType<typeof buildTestApp>>;
let disabled: Awaited<ReturnType<typeof buildTestApp>>;

beforeAll(async () => {
  app = await buildTestApp([ada, grace]);
  disabled = await buildTestApp([]);
});
afterAll(async () => {
  await app.close();
  await disabled.close();
});

// seedCorpus holds the property an accepted submission links its draft case to. It also seeds one
// rejection of its own, so the assertions below look only at rejections that came from a submission.
beforeEach(() => seedCorpus());

const intakeRejections = () => prisma.rejection.findMany({ where: { slug: { startsWith: "sub-" } } });

const createSubmission = () => prisma.submission.create({ data: submissionRow });

const queue = (headers: Record<string, string>) => app.inject({ method: "GET", url: "/review/queue", headers });

const review = (id: string, headers: Record<string, string>, payload: unknown) =>
  app.inject({ method: "POST", url: `/review/submissions/${id}/reviews`, headers, payload: payload as object });

/** Header sets that must not authenticate: none, an unknown token, the wrong scheme, a bare token. */
const REJECTED_CREDENTIALS: [string, Record<string, string>][] = [
  ["no token", {}],
  ["a wrong token", bearer("0".repeat(48))],
  ["a token cut short", bearer(ada.token.slice(0, -1))],
  ["a Basic header", { authorization: `Basic ${ada.token}` }],
  ["a token without the Bearer prefix", { authorization: ada.token }],
];

async function expectNothingWritten(submissionId: string) {
  expect(await prisma.submissionReview.count()).toBe(0);
  expect(await intakeRejections()).toEqual([]);
  expect((await prisma.submission.findUniqueOrThrow({ where: { id: submissionId } })).status).toBe("pending");
}

describe("GET /review/queue", () => {
  it("lists open submissions for the reviewer, without the submitter's email", async () => {
    const open = await createSubmission();
    await prisma.submission.create({ data: { ...submissionRow, status: "accepted" } });

    const res = await queue(bearer(ada.token));
    expect(res.statusCode).toBe(200);
    const body = res.json<Queue>();
    expect(body.reviewer).toBe("ada");
    expect(body.required).toBe(2);
    expect(body.submissions.map((s) => s.id)).toEqual([open.id]);
    expect(body.submissions[0]).toMatchObject({
      title: validSubmission.title,
      building: validSubmission.building,
      property: validSubmission.property,
      jurisdictions: validSubmission.jurisdictions,
      requiredBy: validSubmission.requiredBy,
      blockedBy: validSubmission.blockedBy,
      workaround: validSubmission.workaround,
      reviewCount: 0,
      mine: null,
      others: [],
    });
    expect(res.body).not.toContain(validSubmission.submitterEmail);
  });

  it("hides the other reviewer's verdict until this reviewer has filed", async () => {
    const submission = await createSubmission();
    await review(submission.id, bearer(ada.token), { recommendation: "accept", notes: NOTES });

    const before = (await queue(bearer(grace.token))).json<Queue>().submissions[0];
    expect(before).toMatchObject({ reviewCount: 1, mine: null, others: [] });

    await review(submission.id, bearer(grace.token), { recommendation: "needs_work", notes: NOTES });
    const after = (await queue(bearer(grace.token))).json<Queue>().submissions[0];
    expect(after?.mine?.recommendation).toBe("needs_work");
    expect(after?.others.map((r) => r.reviewer)).toEqual(["ada"]);
  });

  it.each(REJECTED_CREDENTIALS)("answers 401 to %s", async (_label, headers) => {
    await createSubmission();
    const res = await queue(headers);
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: "unauthorized" });
  });

  it("answers 503 when no reviewers are configured", async () => {
    const res = await disabled.inject({ method: "GET", url: "/review/queue", headers: bearer(ada.token) });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({ error: "review_disabled" });
  });
});

describe("POST /review/submissions/:id/reviews", () => {
  it("records the review and moves the submission to in_review", async () => {
    const submission = await createSubmission();
    const res = await review(submission.id, bearer(ada.token), { recommendation: "accept", notes: NOTES });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({ status: "in_review", reviewCount: 1 });

    const rows = await prisma.submissionReview.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ submissionId: submission.id, reviewer: "ada", recommendation: "accept", notes: NOTES });
    expect((await prisma.submission.findUniqueOrThrow({ where: { id: submission.id } })).status).toBe("in_review");
  });

  it("accepts the submission on the second accept and opens a draft case carrying the property", async () => {
    const submission = await createSubmission();
    await review(submission.id, bearer(ada.token), { recommendation: "accept", notes: NOTES });
    const res = await review(submission.id, bearer(grace.token), { recommendation: "accept", notes: NOTES });
    expect(res.json()).toEqual({ status: "accepted", reviewCount: 2 });
    expect((await prisma.submission.findUniqueOrThrow({ where: { id: submission.id } })).status).toBe("accepted");
    expect(await intakeRejections()).toEqual([]);

    const draft = await prisma.case.findUniqueOrThrow({
      where: { corpusRef: `SUB-${submission.id.slice(-10)}` },
      include: { properties: { include: { property: { select: { slug: true } } } } },
    });
    expect(draft).toMatchObject({
      slug: "bind-0003",
      title: validSubmission.title,
      status: "draft",
      inclusionVerdict: "undecided",
      inclusionReasoning: validSubmission.workaround,
      contributor: validSubmission.submitterName,
    });
    expect(draft.statement).toBe(
      `${validSubmission.building} ${validSubmission.requiredBy.citation} requires it and ${validSubmission.blockedBy.citation} forbids it.`,
    );
    expect(draft.properties.map((p) => p.property.slug)).toEqual([PROPERTY_SLUG]);
  });

  it("opens the draft case without a property when the submission carries the migrated-row sentinel", async () => {
    const submission = await prisma.submission.create({ data: { ...submissionRow, property: "unknown" } });
    await review(submission.id, bearer(ada.token), { recommendation: "accept", notes: NOTES });
    await review(submission.id, bearer(grace.token), { recommendation: "accept", notes: NOTES });
    const draft = await prisma.case.findUniqueOrThrow({ where: { corpusRef: `SUB-${submission.id.slice(-10)}` }, include: { properties: true } });
    expect(draft.properties).toEqual([]);
  });

  it("opens no draft case while the submission is still in review", async () => {
    const submission = await createSubmission();
    await review(submission.id, bearer(ada.token), { recommendation: "accept", notes: NOTES });
    expect(await prisma.case.count({ where: { status: "draft", corpusRef: { startsWith: "SUB-" } } })).toBe(0);
  });

  it("rejects the submission on the second reject and writes the rejection log entry", async () => {
    const submission = await createSubmission();
    const first = "Ada: a tombstone record satisfies both rules here.";
    const second = "Grace: agreed, redaction by tombstone resolves it.";
    await review(submission.id, bearer(ada.token), { recommendation: "reject", notes: first, rejectionReason: "out_of_scope" });
    const res = await review(submission.id, bearer(grace.token), {
      recommendation: "reject",
      notes: second,
      rejectionReason: "resolved_by_known_technique",
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({ status: "rejected", reviewCount: 2 });

    expect((await prisma.submission.findUniqueOrThrow({ where: { id: submission.id } })).status).toBe("rejected");
    const rejections = await intakeRejections();
    expect(rejections).toHaveLength(1);
    expect(rejections[0]).toMatchObject({
      slug: `sub-${submission.id.slice(-10)}`,
      title: validSubmission.title,
      claim: validSubmission.building,
      reason: "resolved_by_known_technique",
      reasoning: `${first}\n\n${second}`,
      submittedBy: validSubmission.submitterName,
    });
  });

  it("replaces the reviewer's earlier review when they file again", async () => {
    const submission = await createSubmission();
    await review(submission.id, bearer(ada.token), { recommendation: "needs_work", notes: NOTES });
    const res = await review(submission.id, bearer(ada.token), { recommendation: "accept", notes: NOTES });
    expect(res.json()).toEqual({ status: "in_review", reviewCount: 1 });
    const rows = await prisma.submissionReview.findMany();
    expect(rows.map((r) => r.recommendation)).toEqual(["accept"]);
  });

  it.each(REJECTED_CREDENTIALS)("answers 401 to %s and writes nothing", async (_label, headers) => {
    const submission = await createSubmission();
    const res = await review(submission.id, headers, { recommendation: "accept", notes: NOTES });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: "unauthorized" });
    await expectNothingWritten(submission.id);
  });

  it("answers 503 when no reviewers are configured and writes nothing", async () => {
    const submission = await createSubmission();
    const res = await disabled.inject({
      method: "POST",
      url: `/review/submissions/${submission.id}/reviews`,
      headers: bearer(ada.token),
      payload: { recommendation: "accept", notes: NOTES },
    });
    expect(res.statusCode).toBe(503);
    await expectNothingWritten(submission.id);
  });

  it.each([
    ["an empty object", {}],
    ["an unknown recommendation", { recommendation: "approve", notes: NOTES }],
    ["short notes", { recommendation: "accept", notes: "Looks fine." }],
    ["notes made of spaces", { recommendation: "accept", notes: " ".repeat(40) }],
    ["a reject without a reason", { recommendation: "reject", notes: NOTES }],
    ["an unknown rejection reason", { recommendation: "reject", notes: NOTES, rejectionReason: "disliked" }],
  ])("rejects %s with 422 and writes nothing", async (_label, payload) => {
    const submission = await createSubmission();
    const res = await review(submission.id, bearer(ada.token), payload);
    expect(res.statusCode).toBe(422);
    await expectNothingWritten(submission.id);
  });

  it("rejects a NUL byte in the notes with a 4xx and writes nothing", async () => {
    const submission = await createSubmission();
    const res = await review(submission.id, bearer(ada.token), { recommendation: "accept", notes: `${NOTES}\u0000` });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
    await expectNothingWritten(submission.id);
  });

  it("answers 404 for an unknown submission and writes nothing", async () => {
    const res = await review("no-such-submission", bearer(ada.token), { recommendation: "accept", notes: NOTES });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: "not_found" });
    expect(await prisma.submissionReview.count()).toBe(0);
  });

  it("answers 409 once the submission is decided and writes nothing", async () => {
    const decided = await prisma.submission.create({ data: { ...submissionRow, status: "accepted" } });
    const res = await review(decided.id, bearer(ada.token), { recommendation: "reject", notes: NOTES, rejectionReason: "out_of_scope" });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({ error: "already_decided" });
    expect(await prisma.submissionReview.count()).toBe(0);
    expect(await intakeRejections()).toEqual([]);
    expect((await prisma.submission.findUniqueOrThrow({ where: { id: decided.id } })).status).toBe("accepted");
  });
});
