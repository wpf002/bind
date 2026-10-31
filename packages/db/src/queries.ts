import type { CaseQuery } from "@bind/shared";
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
    orderBy: { createdAt: "asc" },
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

export async function getCase(slug: string) {
  const c = await prisma.case.findUnique({ where: { slug }, include: caseInclude });
  if (!c) return null;
  const cites = await citationsFor([c.id]);
  const [prev, next] = await Promise.all([
    prisma.case.findFirst({ where: { status: previewDrafts ? undefined : "published", sortKey: { lt: c.sortKey } }, orderBy: { sortKey: "desc" }, select: { slug: true, title: true } }),
    prisma.case.findFirst({ where: { status: previewDrafts ? undefined : "published", sortKey: { gt: c.sortKey } }, orderBy: { sortKey: "asc" }, select: { slug: true, title: true } }),
  ]);
  return { ...decorate(c, cites.get(c.id) ?? []), prev, next };
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

export async function getShape(slug: string) {
  const shape = await prisma.shape.findUnique({ where: { slug }, include: { audits: { orderBy: { runAt: "desc" } } } });
  if (!shape) return null;
  const cases = await listCases({ shape: slug }, { includeDrafts: true });
  return { ...shape, cases };
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

export async function listRejections() {
  return prisma.rejection.findMany({ orderBy: { decidedAt: "desc" } });
}

export async function stats() {
  const [total, published, byRes, byResolution, unverified, rejections, shapes, transitions] = await Promise.all([
    prisma.case.count(),
    prisma.case.count({ where: { status: "published" } }),
    prisma.case.groupBy({ by: ["resolvability"], where: { status: "published" }, _count: true }),
    prisma.case.groupBy({ by: ["resolution"], _count: true }),
    prisma.citation.count({ where: { verificationStatus: { in: ["unverified", "disputed"] } } }),
    prisma.rejection.count(),
    prisma.shape.count({ where: { retiredAt: null } }),
    prisma.caseTransition.count(),
  ]);
  const res = Object.fromEntries(byResolution.map((r) => [r.resolution, r._count]));
  return {
    total,
    published,
    held: total - published,
    gate: 40,
    shapes,
    rejections,
    unverifiedCitations: unverified,
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

export async function listTransitions() {
  return prisma.caseTransition.findMany({
    orderBy: { occurredAt: "desc" },
    include: { case: { select: { slug: true, title: true, corpusRef: true } } },
  });
}
