import { PrismaClient } from "@prisma/client";
import { audits, cases, instruments, jurisdictions, rejections, shapes } from "./corpus";

const prisma = new PrismaClient();
const slugOf = (i: number) => `bind-${String(i + 1).padStart(4, "0")}`;

async function main() {
  // Order matters: children first, Restrict relations last.
  await prisma.citation.deleteMany();
  await prisma.submissionReview.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.case.deleteMany();
  await prisma.adversarialAudit.deleteMany();
  await prisma.shape.deleteMany();
  await prisma.legalInstrument.deleteMany();
  await prisma.jurisdiction.deleteMany();
  await prisma.architecturalProperty.deleteMany();
  await prisma.rejection.deleteMany();

  const jur = new Map<string, string>();
  for (const j of jurisdictions) jur.set(j.code, (await prisma.jurisdiction.create({ data: j })).id);

  const inst = new Map<string, string>();
  for (const [key, i] of Object.entries(instruments)) {
    const { jurisdiction, ...rest } = i;
    const row = await prisma.legalInstrument.create({ data: { ...rest, sourceUrl: "", jurisdictionId: jur.get(jurisdiction)! } });
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

    // Every source citation is unverified, so every case seeds as a draft.
    const row = await prisma.case.create({
      data: {
        slug,
        corpusRef: c.ref,
        title: c.title,
        statement: c.statement,
        analysis: c.analysis,
        inclusionVerdict: c.inclusionVerdict,
        inclusionReasoning: c.inclusionReasoning,
        resolvability: c.resolvability,
        resolution: c.resolution ?? "none",
        resolvedBy: c.resolvedBy,
        status: "draft",
        firstSeenAt: seenAt,
        sortKey: i + 1,
        shapes: { create: c.shapes.map((s, n) => ({ shapeId: shape.get(s)!, isPrimary: n === 0 })) },
        instruments: { create: c.instruments.map((x) => ({ instrumentId: inst.get(x.key)!, role: x.role, note: x.note })) },
        properties: propertyId ? { create: [{ propertyId }] } : undefined,
        paperingOvers: { create: c.paperingOvers ?? [] },
      },
    });

    const cites = [
      ...c.instruments.map((x) => {
        const d = instruments[x.key]!;
        return { label: `${d.instrument}, ${d.provision}`, note: c.flags?.[x.key] };
      }),
      ...(c.sources ?? []),
    ];
    for (const s of cites) {
      await prisma.citation.create({
        data: {
          targetType: "case",
          targetId: row.id,
          label: s.label,
          url: "",
          verificationStatus: "unverified",
          verificationNote: s.note ?? "Source states citations are from working memory and need verification.",
        },
      });
      citations++;
    }
  }

  for (const [i, r] of rejections.entries()) {
    await prisma.rejection.create({ data: { ...r, decidedAt: new Date(base + (i * 5 + 2) * 86_400_000) } });
  }

  console.log(`seeded ${shapes.length} shapes, ${cases.length} cases (0 published), ${citations} unverified citations, ${rejections.length} rejections`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
