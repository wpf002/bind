import type { CaseQuery, Resolution, Resolvability } from "@bind/shared";
import { groupByPrimaryShape, summariseProperty } from "@bind/core";
import { prisma } from "./client";

/** Read layer shared by the API and the web app. Published cases only unless asked. */

const caseInclude = {
  shapes: { where: { supersededAt: null }, include: { shape: true }, orderBy: { isPrimary: "desc" } },
  instruments: { include: { instrument: { include: { jurisdiction: true } } } },
  properties: { include: { property: true } },
  paperingOvers: true,
  transitions: { orderBy: { occurredAt: "asc" } },
} as const;

async function citationsFor(ids: string[]) {
  if (!ids.length) return new Map<string, Awaited<ReturnType<typeof prisma.citation.findMany>>>();
  const rows = await prisma.citation.findMany({
    where: { targetType: "case", targetId: { in: ids } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const by = new Map<string, typeof rows>();
  for (const r of rows) by.set(r.targetId, [...(by.get(r.targetId) ?? []), r]);
  return by;
}

function decorate<T extends { id: string; instruments: { instrument: { jurisdiction: { code: string } } }[] }>(
  c: T,
  cites: Awaited<ReturnType<typeof prisma.citation.findMany>>
) {
  const unverified = cites.filter((x) => x.verificationStatus === "unverified" || x.verificationStatus === "disputed");
  return {
    ...c,
    citations: cites,
    jurisdictions: [...new Set(c.instruments.map((i) => i.instrument.jurisdiction.code))],
    verification: unverified.length ? ("unverified" as const) : ("verified" as const),
    changedSources: cites.filter((x) => x.sourceCheck === "changed").length,
  };
}

/** Local review only: shows held drafts. Never set where the site is public. */
export const previewDrafts = process.env.BIND_PREVIEW_DRAFTS === "1";

export async function listCases(q: Partial<CaseQuery> = {}, opts: { includeDrafts?: boolean } = {}) {
  const term = q.q?.trim();
  const rows = await prisma.case.findMany({
    where: {
      status: q.status ?? ((opts.includeDrafts ?? previewDrafts) ? undefined : "published"),
      resolvability: q.resolvability,
      shapes: q.shape ? { some: { supersededAt: null, shape: { slug: q.shape } } } : undefined,
      instruments: q.jurisdiction
        ? { some: { instrument: { jurisdiction: { code: q.jurisdiction.toUpperCase() } } } }
        : undefined,
      OR: term
        ? [
            { title: { contains: term, mode: "insensitive" } },
            { statement: { contains: term, mode: "insensitive" } },
            { slug: { contains: term, mode: "insensitive" } },
            { corpusRef: { equals: term.toUpperCase() } },
            { instruments: { some: { instrument: { shortName: { contains: term, mode: "insensitive" } } } } },
          ]
        : undefined,
    },
    include: caseInclude,
    orderBy: { sortKey: "asc" },
    take: q.limit ?? 200,
  });
  const cites = await citationsFor(rows.map((r) => r.id));
  const out = rows.map((r) => decorate(r, cites.get(r.id) ?? []));
  return q.verification ? out.filter((c) => c.verification === q.verification) : out;
}

export type CaseRow = Awaited<ReturnType<typeof listCases>>[number];

/** Cases listed beside a case from its primary shape. */
const RELATED_CASE_LIMIT = 5;

export async function getCase(slug: string) {
  const c = await prisma.case.findUnique({ where: { slug }, include: caseInclude });
  if (!c) return null;
  const cites = await citationsFor([c.id]);
  const status = previewDrafts ? undefined : ("published" as const);
  const brief = { slug: true, title: true } as const;
  const primaryShapeId = c.shapes[0]?.shapeId;
  const [prev, next, related] = await Promise.all([
    prisma.case.findFirst({ where: { status, sortKey: { lt: c.sortKey } }, orderBy: { sortKey: "desc" }, select: brief }),
    prisma.case.findFirst({ where: { status, sortKey: { gt: c.sortKey } }, orderBy: { sortKey: "asc" }, select: brief }),
    primaryShapeId
      ? prisma.case.findMany({
          where: { status, id: { not: c.id }, shapes: { some: { shapeId: primaryShapeId, supersededAt: null } } },
          orderBy: { sortKey: "asc" },
          take: RELATED_CASE_LIMIT,
          select: { ...brief, resolvability: true },
        })
      : [],
  ]);
  return { ...decorate(c, cites.get(c.id) ?? []), prev, next, related };
}

export type CaseDetail = NonNullable<Awaited<ReturnType<typeof getCase>>>;

export async function listShapes(opts: { includeRetired?: boolean } = {}) {
  const shapes = await prisma.shape.findMany({
    where: opts.includeRetired ? undefined : { retiredAt: null },
    orderBy: { ordinal: "asc" },
    include: {
      audits: { orderBy: { runAt: "desc" }, take: 1 },
      assignments: {
        where: { supersededAt: null },
        include: { case: { select: { slug: true, resolvability: true, status: true, corpusRef: true, title: true } } },
      },
    },
  });
  return shapes.map(({ assignments, audits, ...s }) => {
    const all = assignments.map((a) => a.case).sort((a, b) => a.slug.localeCompare(b.slug));
    const published = all.filter((c) => c.status === "published");
    return {
      ...s,
      audit: audits[0] ?? null,
      cases: all,
      total: all.length,
      published: published.length,
      byResolvability: {
        unresolvable: all.filter((c) => c.resolvability === "unresolvable").length,
        resolvable_costly: all.filter((c) => c.resolvability === "resolvable_costly").length,
        tech_gap: all.filter((c) => c.resolvability === "tech_gap").length,
      },
    };
  });
}

export type ShapeRow = Awaited<ReturnType<typeof listShapes>>[number];

/** Auditor columns in the paper's shapes table, in display order. */
const PAPER_AUDITORS = [
  { model: "gpt-5", label: "gpt-5" },
  { model: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" },
] as const;

/** Rows and auditor labels for shapeTableTeX: each shape's latest verdict per auditor. */
export async function shapeTableInput() {
  const [shapes, audits] = await Promise.all([listShapes(), prisma.adversarialAudit.findMany({ orderBy: { runAt: "desc" } })]);
  const latest = (shapeId: string, model: string) => audits.find((a) => a.shapeId === shapeId && a.model === model)?.verdict ?? null;
  const rows = shapes.map((s) => ({
    ordinal: s.ordinal,
    name: s.name,
    family: s.family,
    cases: s.published,
    verdicts: PAPER_AUDITORS.map((a) => latest(s.id, a.model)),
  }));
  return [rows, PAPER_AUDITORS.map((a) => a.label)] as const;
}

export async function getShape(slug: string) {
  const shape = await prisma.shape.findUnique({ where: { slug }, include: { audits: { orderBy: { runAt: "desc" } } } });
  if (!shape) return null;
  const cases = await listCases({ shape: slug }, { includeDrafts: true });
  return { ...shape, cases };
}

const propertyCaseInclude = {
  shapes: { where: { supersededAt: null }, include: { shape: true }, orderBy: { isPrimary: "desc" } },
  instruments: { include: { instrument: { include: { jurisdiction: true } } } },
} as const;

type PropertyCaseRow = {
  slug: string;
  title: string;
  statement: string;
  corpusRef: string | null;
  sortKey: number;
  status: string;
  resolvability: Resolvability;
  resolution: Resolution;
  shapes: { shape: { slug: string; name: string; ordinal: number } }[];
  instruments: { instrument: { jurisdiction: { code: string } } }[];
};

/** Flattens a case row to the shape the core property aggregation reads. */
function toPropertyCase<T extends PropertyCaseRow>(c: T) {
  return {
    ...c,
    shapes: c.shapes.map(({ shape }) => ({ slug: shape.slug, name: shape.name, ordinal: shape.ordinal })),
    jurisdictions: [...new Set(c.instruments.map((i) => i.instrument.jurisdiction.code))].sort(),
  };
}

/** Every architectural property with its published cases rolled up. Drafts only with includeDrafts. */
export async function listProperties(opts: { includeDrafts?: boolean } = {}) {
  const status = (opts.includeDrafts ?? previewDrafts) ? undefined : ("published" as const);
  const rows = await prisma.architecturalProperty.findMany({
    orderBy: { name: "asc" },
    include: { cases: { where: { case: { status } }, include: { case: { include: propertyCaseInclude } } } },
  });
  return rows.map(({ cases, ...p }) => {
    const flat = cases.map(({ case: c, note }) => ({ ...toPropertyCase(c), note })).sort((a, b) => a.sortKey - b.sortKey);
    return { ...p, ...summariseProperty(flat), caseRows: flat };
  });
}

export type PropertyRow = Awaited<ReturnType<typeof listProperties>>[number];

/** One property with its cases grouped by primary shape. Null when the slug is unknown. */
export async function getProperty(slug: string, opts: { includeDrafts?: boolean } = {}) {
  const status = (opts.includeDrafts ?? previewDrafts) ? undefined : ("published" as const);
  const p = await prisma.architecturalProperty.findUnique({
    where: { slug },
    include: { cases: { where: { case: { status } }, include: { case: { include: propertyCaseInclude } } } },
  });
  if (!p) return null;
  const { cases, ...rest } = p;
  const flat = cases.map(({ case: c, note }) => ({ ...toPropertyCase(c), note })).sort((a, b) => a.sortKey - b.sortKey);
  return { ...rest, ...summariseProperty(flat), groups: groupByPrimaryShape(flat) };
}

export async function listJurisdictions() {
  const rows = await prisma.jurisdiction.findMany({
    orderBy: { code: "asc" },
    include: { instruments: { include: { cases: { include: { case: { select: { id: true, status: true } } } } } } },
  });
  return rows.map(({ instruments, ...j }) => {
    const ids = new Set(instruments.flatMap((i) => i.cases.filter((c) => c.case.status === "published").map((c) => c.case.id)));
    return { ...j, instruments: instruments.length, cases: ids.size };
  });
}

/** Published cases that stopped being live, oldest resolution first. */
export async function listResolutions() {
  return prisma.case.findMany({
    where: { status: "published", resolution: { not: "none" }, resolvedAt: { not: null } },
    orderBy: [{ resolvedAt: "asc" }, { sortKey: "asc" }],
    select: {
      slug: true,
      title: true,
      resolution: true,
      resolvedAt: true,
      resolvedBy: true,
      transitions: { orderBy: { occurredAt: "desc" }, take: 1, select: { trigger: true, triggerUrl: true } },
    },
  });
}

export async function listRejections() {
  return prisma.rejection.findMany({ orderBy: { decidedAt: "desc" } });
}

/** Cases the taxonomy needed before publishing. The gate grows with the corpus once met. */
const PUBLICATION_GATE = 40;

export async function stats() {
  const [total, published, byRes, byResolution, unverified, changedSources, rejections, shapes, transitions] = await Promise.all([
    prisma.case.count(),
    prisma.case.count({ where: { status: "published" } }),
    prisma.case.groupBy({ by: ["resolvability"], where: { status: "published" }, _count: true }),
    prisma.case.groupBy({ by: ["resolution"], _count: true }),
    prisma.citation.count({ where: { verificationStatus: { in: ["unverified", "disputed"] } } }),
    prisma.citation.count({ where: { targetType: "case", sourceCheck: "changed" } }),
    prisma.rejection.count(),
    prisma.shape.count({ where: { retiredAt: null } }),
    prisma.caseTransition.count(),
  ]);
  const res = Object.fromEntries(byResolution.map((r) => [r.resolution, r._count]));
  return {
    total,
    published,
    held: total - published,
    gate: Math.max(PUBLICATION_GATE, total),
    shapes,
    rejections,
    unverifiedCitations: unverified,
    changedSources,
    transitions,
    byResolvability: Object.fromEntries(byRes.map((r) => [r.resolvability, r._count])) as Record<string, number>,
    resolvedBy: {
      engineering: res.engineering ?? 0,
      legislative: res.legislative ?? 0,
      judicial: res.judicial ?? 0,
      abandonment: res.abandonment ?? 0,
    },
  };
}

export type Stats = Awaited<ReturnType<typeof stats>>;

/** Transitions of published cases, newest first. Held cases' transitions show only in draft preview. */
export async function listTransitions() {
  return prisma.caseTransition.findMany({
    where: previewDrafts ? undefined : { case: { status: "published" } },
    orderBy: { occurredAt: "desc" },
    include: { case: { select: { slug: true, title: true, corpusRef: true } } },
  });
}
