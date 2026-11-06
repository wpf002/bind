import { SIGNOFF_NOTE, signoffFor } from "./signoff";
import { PrismaClient } from "@prisma/client";
import { AMENDMENT_NOTE_PREFIX, INTAKE_REJECTION_PREFIX, REVIEW_NOTE_PREFIX, isPublishable } from "@bind/core";
import { CORPUS_AUTHOR, audits, cases as corpusCases, instruments as corpusInstruments, jurisdictions, rejections as corpusRejections, shapes } from "./corpus";
import { draftCases, draftInstruments, draftRejections, draftSourceVerifications, draftVerifications } from "./drafts";
import { instrumentVerifications, sourceVerifications, type Verification } from "./verifications";
const sv: Record<string, Verification> = { ...sourceVerifications, ...draftSourceVerifications };

// Corpus cases are the source author's own text. Model-drafted cases carry no contributor and cite as the registry.
const cases = [...corpusCases.map((c) => ({ contributor: CORPUS_AUTHOR, ...c })), ...draftCases];
const instruments: Record<string, (typeof corpusInstruments)[string]> = { ...corpusInstruments, ...draftInstruments };
const iv: Record<string, Verification> = { ...instrumentVerifications, ...draftVerifications };
const rejections = [...corpusRejections, ...draftRejections];

const prisma = new PrismaClient();
const slugOf = (i: number) => `bind-${String(i + 1).padStart(4, "0")}`;

async function main() {
  // Order matters: children first, Restrict relations last.
  await prisma.citation.deleteMany();
  await prisma.case.deleteMany();
  await prisma.adversarialAudit.deleteMany();
  await prisma.shape.deleteMany();
  await prisma.legalInstrument.deleteMany();
  await prisma.jurisdiction.deleteMany();
  await prisma.architecturalProperty.deleteMany();
  // Submissions and the rejections that came from them aren't seed data.
  await prisma.rejection.deleteMany({ where: { NOT: { slug: { startsWith: INTAKE_REJECTION_PREFIX } } } });

  const jur = new Map<string, string>();
  for (const j of jurisdictions) jur.set(j.code, (await prisma.jurisdiction.create({ data: j })).id);

  const inst = new Map<string, string>();
  for (const [key, i] of Object.entries(instruments)) {
    const { jurisdiction, ...rest } = i;
    const v = iv[key];
    const row = await prisma.legalInstrument.create({
      data: { ...rest, provision: v?.provision ?? rest.provision, sourceUrl: v?.url ?? "", jurisdictionId: jur.get(jurisdiction)! },
    });
    inst.set(key, row.id);
  }

  const shape = new Map<string, string>();
  for (const s of shapes) shape.set(s.slug, (await prisma.shape.create({ data: s })).id);

  for (const a of audits) {
    const { shape: slug, ...rest } = a;
    await prisma.adversarialAudit.create({ data: { ...rest, priorArt: rest.priorArt ?? undefined, shapeId: shape.get(slug)! } });
  }

  const base = Date.UTC(2026, 0, 12);
  let citations = 0;
  const held: string[] = [];
  for (const [i, c] of cases.entries()) {
    const slug = slugOf(i);
    const seenAt = new Date(base + i * 3 * 86_400_000);
    const propertyId = c.property
      ? (
          await prisma.architecturalProperty.create({
            data: { slug: `${c.ref.toLowerCase()}-property`, name: c.property.name, threatModel: c.property.text, defeatNote: c.property.defeat ?? "", exemplars: [] },
          })
        ).id
      : null;

    const cites = [
      ...c.instruments.map((x) => {
        const d = instruments[x.key]!;
        const v = iv[x.key];
        return { label: `${d.instrument}, ${v?.provision ?? d.provision}`, note: c.flags?.[x.key], v };
      }),
      ...(c.sources ?? []).map((s) => ({ ...s, v: sv[s.label] })),
    ] as { label: string; note?: string; v?: Verification }[];

    // The owner sign-off covering the case (signoff.ts) publishes it only if it clears the gate.
    const gate = isPublishable({
      inclusionVerdict: c.inclusionVerdict,
      citations: cites.map((s) => ({ verificationStatus: s.v?.status ?? "unverified" })),
    });
    if (!gate.ok) held.push(`${c.ref}: ${gate.blockers.join("; ")}`);
    const row = await prisma.case.create({
      data: {
        slug,
        corpusRef: c.ref,
        title: c.title,
        statement: c.statement,
        contributor: c.contributor,
        analysis: [c.analysis, c.review && `${REVIEW_NOTE_PREFIX}${c.review}`, amended(c)].filter(Boolean).join("\n\n") || undefined,
        inclusionVerdict: c.inclusionVerdict,
        inclusionReasoning: c.inclusionReasoning,
        resolvability: c.resolvability,
        resolution: c.resolution ?? "none",
        resolvedBy: c.resolvedBy,
        status: gate.ok ? "published" : "draft",
        publishedAt: gate.ok ? new Date(signoffFor(c.ref).at) : null,
        firstSeenAt: seenAt,
        sortKey: i + 1,
        shapes: {
          create: [
            ...c.shapes.map((s, n) => ({ shapeId: shape.get(s)!, isPrimary: n === 0, rationale: c.shapeRationale, taxonomyVersion: c.shapeRationale || c.shapeHistory ? "v2" : "v1" })),
            ...(c.shapeHistory ?? []).map((h) => ({ shapeId: shape.get(h.shape)!, isPrimary: true, rationale: h.rationale, taxonomyVersion: "v1", assignedAt: new Date(h.from), supersededAt: new Date(h.until) })),
          ],
        },
        instruments: { create: c.instruments.map((x) => ({ instrumentId: inst.get(x.key)!, role: x.role, note: x.note })) },
        properties: propertyId ? { create: [{ propertyId }] } : undefined,
        paperingOvers: { create: c.paperingOvers ?? [] },
        transitions: { create: (c.transitions ?? []).map((t) => ({ fromState: t.from, toState: t.to, trigger: t.trigger, triggerUrl: t.url, occurredAt: new Date(t.at) })) },
      },
    });

    for (const s of cites) {
      await prisma.citation.create({
        data: {
          targetType: "case",
          targetId: row.id,
          label: s.label,
          url: s.v?.url ?? "",
          publisher: s.v?.publisher,
          quote: s.v?.quote,
          retrieved: s.v ? new Date(s.v.verifiedAt) : undefined,
          verificationStatus: s.v?.status ?? "unverified",
          verifiedAt: s.v ? new Date(s.v.verifiedAt) : undefined,
          verifiedBy: s.v?.verifiedBy,
          verificationNote: s.v?.note ?? s.note ?? "Source states citations are from working memory and need verification.",
        },
      });
      if (!s.v) citations++;
    }
  }

  for (const [i, r] of rejections.entries()) {
    await prisma.rejection.create({ data: { ...r, decidedAt: new Date(base + (i * 5 + 2) * 86_400_000) } });
  }

  console.log(`seeded ${shapes.length} shapes, ${cases.length} cases (${cases.length - held.length} published), ${citations} unverified citations, ${Object.keys(iv).length + Object.keys(sv).length} ledger entries, ${rejections.length} rejections`);
  for (const h of held) console.log(`held as draft: ${h}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/** Declared departures from v0.1, kept in the case text so the old wording stays on record. */
function amended(c: (typeof cases)[number]) {
  if (!c.amendments?.length) return undefined;
  return [
    `${AMENDMENT_NOTE_PREFIX}v0.1 by claude-opus-5-5, 2026-10-31. ${SIGNOFF_NOTE}`,
    ...c.amendments.map((a) => `${a.field}: "${a.from}" ${a.reason}`),
  ].join("\n");
}
