import { z } from "zod";
import { CHANGE_KINDS } from "@bind/core";
import {
  CASE_STATUS,
  INSTRUMENT_ROLE,
  LEGAL_STANDING,
  REJECTION_REASON,
  RESOLUTION,
  RESOLVABILITY,
  SHAPE_FAMILY,
  SOURCE_CHECK,
  VERIFICATION,
  isoDate,
} from "@bind/shared";

/**
 * Response, query and param schemas for every read route. The OpenAPI document is
 * generated from these, and the serializer strips any field a schema doesn't name,
 * so each schema lists the full row the query layer returns.
 */

/** Prisma enums the read routes expose and the shared package doesn't already name. */
const INCLUSION_VERDICT = ["passes", "fails", "undecided"] as const;
const CITATION_TARGET = ["case", "shape", "instrument", "property", "papering_over", "rejection"] as const;
const ADVERSARIAL_VERDICT = ["novel", "partial", "rebrand", "inconclusive"] as const;

const nullableString = z.string().nullable();
const nullableDate = isoDate.nullable();
const count = z.number().int();

export const slugParamsSchema = z.object({ slug: z.string().min(1) });

export const notFoundSchema = z.object({ error: z.literal("not_found") });
/** 400s: a failed query or param validation lists its issues; a NUL byte in the input carries none. */
export const badRequestSchema = z.object({
  error: z.enum(["validation", "nul_byte"]),
  issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export const healthSchema = z.object({ ok: z.literal(true) });

const shapeBriefSchema = z.object({ slug: z.string(), name: z.string(), ordinal: count });

export const shapeSchema = z.object({
  id: z.string(),
  slug: z.string(),
  ordinal: count,
  name: z.string(),
  family: z.enum(SHAPE_FAMILY),
  definition: z.string(),
  boundaryCriteria: z.string(),
  provenanceNote: nullableString,
  taxonomyVersion: z.string(),
  retiredAt: nullableDate,
  retiredNote: nullableString,
  createdAt: isoDate,
  updatedAt: isoDate,
});

const shapeAssignmentSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  shapeId: z.string(),
  taxonomyVersion: z.string(),
  rationale: nullableString,
  isPrimary: z.boolean(),
  assignedAt: isoDate,
  supersededAt: nullableDate,
  shape: shapeSchema,
});

const jurisdictionSchema = z.object({ id: z.string(), code: z.string(), name: z.string(), level: z.string() });

const instrumentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  regime: z.string(),
  instrument: z.string(),
  shortName: z.string(),
  provision: z.string(),
  mandate: z.string(),
  inForceSince: nullableDate,
  amendedAt: nullableDate,
  jurisdictionId: z.string(),
  sourceUrl: z.string(),
  sourceKind: z.string(),
  createdAt: isoDate,
  jurisdiction: jurisdictionSchema,
});

const caseInstrumentSchema = z.object({
  caseId: z.string(),
  instrumentId: z.string(),
  role: z.enum(INSTRUMENT_ROLE),
  note: nullableString,
  instrument: instrumentSchema,
});

export const propertySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  threatModel: z.string(),
  defeatNote: z.string(),
  exemplars: z.array(z.string()),
  createdAt: isoDate,
});

const casePropertySchema = z.object({ caseId: z.string(), propertyId: z.string(), note: nullableString, property: propertySchema });

const paperingOverSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  technique: z.string(),
  description: z.string(),
  standing: z.enum(LEGAL_STANDING),
  residual: z.string(),
  createdAt: isoDate,
});

export const transitionSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  fromState: z.string(),
  toState: z.string(),
  trigger: z.string(),
  triggerUrl: nullableString,
  occurredAt: isoDate,
  recordedAt: isoDate,
});

export const citationSchema = z.object({
  id: z.string(),
  targetType: z.enum(CITATION_TARGET),
  targetId: z.string(),
  label: z.string(),
  url: z.string(),
  secondUrl: nullableString,
  publisher: nullableString,
  quote: nullableString,
  retrieved: nullableDate,
  verificationStatus: z.enum(VERIFICATION),
  verifiedAt: nullableDate,
  verifiedBy: nullableString,
  verificationNote: nullableString,
  sourceCheck: z.enum(SOURCE_CHECK).nullable(),
  sourceCheckedAt: nullableDate,
  createdAt: isoDate,
  updatedAt: isoDate,
});

const caseScalarsSchema = z.object({
  id: z.string(),
  slug: z.string(),
  corpusRef: z.string(),
  title: z.string(),
  statement: z.string(),
  analysis: nullableString,
  inclusionVerdict: z.enum(INCLUSION_VERDICT),
  inclusionReasoning: nullableString,
  resolvability: z.enum(RESOLVABILITY),
  resolution: z.enum(RESOLUTION),
  resolvedAt: nullableDate,
  resolvedBy: nullableString,
  status: z.enum(CASE_STATUS),
  publishedAt: nullableDate,
  firstSeenAt: nullableDate,
  contributor: nullableString,
  sortKey: count,
  createdAt: isoDate,
  updatedAt: isoDate,
});

/** A case as `listCases` returns it: relations plus the citation roll-up. */
export const caseSchema = caseScalarsSchema.extend({
  shapes: z.array(shapeAssignmentSchema),
  instruments: z.array(caseInstrumentSchema),
  properties: z.array(casePropertySchema),
  paperingOvers: z.array(paperingOverSchema),
  transitions: z.array(transitionSchema),
  citations: z.array(citationSchema),
  jurisdictions: z.array(z.string()),
  verification: z.enum(["verified", "unverified"]),
  changedSources: count,
});

export const caseListSchema = z.object({ count, cases: z.array(caseSchema) });

const caseLinkSchema = z.object({ slug: z.string(), title: z.string() });

export const caseDetailSchema = caseSchema.extend({
  prev: caseLinkSchema.nullable(),
  next: caseLinkSchema.nullable(),
  related: z.array(caseLinkSchema.extend({ resolvability: z.enum(RESOLVABILITY) })),
  citation: z.string(),
  bibtex: z.string(),
});

const byResolvabilitySchema = z.object({ unresolvable: count, resolvable_costly: count, tech_gap: count });

const auditSchema = z.object({
  id: z.string(),
  shapeId: z.string(),
  model: z.string(),
  promptVersion: z.string(),
  verdict: z.enum(ADVERSARIAL_VERDICT),
  priorArt: nullableString,
  reasoning: z.string(),
  runAt: isoDate,
});

export const shapeListSchema = z.array(
  shapeSchema.extend({
    audit: auditSchema.nullable(),
    cases: z.array(
      z.object({ slug: z.string(), resolvability: z.enum(RESOLVABILITY), status: z.enum(CASE_STATUS), corpusRef: z.string(), title: z.string() })
    ),
    total: count,
    published: count,
    byResolvability: byResolvabilitySchema,
  })
);

export const shapeDetailSchema = shapeSchema.extend({ audits: z.array(auditSchema), cases: z.array(caseSchema) });

/** A case as the property and check views carry it: scalars, brief shapes, instruments, jurisdictions. */
const propertyCaseSchema = caseScalarsSchema.extend({
  shapes: z.array(shapeBriefSchema),
  instruments: z.array(caseInstrumentSchema),
  jurisdictions: z.array(z.string()),
});

const propertySummarySchema = propertySchema.extend({
  cases: count,
  shapes: z.array(shapeBriefSchema),
  jurisdictions: z.array(z.string()),
  resolved: z.boolean(),
  byResolvability: byResolvabilitySchema,
});

const propertyCaseRowSchema = propertyCaseSchema.extend({ note: nullableString });

export const propertyListSchema = z.array(propertySummarySchema.extend({ caseRows: z.array(propertyCaseRowSchema) }));

export const propertyDetailSchema = propertySummarySchema.extend({
  groups: z.array(z.object({ shape: shapeBriefSchema.nullable(), cases: z.array(propertyCaseRowSchema) })),
});

export const checkResponseSchema = z.object({
  selection: z.object({ properties: z.array(z.string()), jurisdictions: z.array(z.string()) }),
  count,
  shapes: z.array(
    z.object({ shape: shapeBriefSchema.nullable(), cases: z.array(propertyCaseSchema.extend({ properties: z.array(z.string()) })) })
  ),
});

export const jurisdictionListSchema = z.array(jurisdictionSchema.extend({ instruments: count, cases: count }));

/** Provision rows sharing a short name roll up into one instrument: /instruments/{slug}. */
const instrumentSummarySchema = z.object({
  slug: z.string(),
  shortName: z.string(),
  instruments: z.array(z.string()),
  regimes: z.array(z.string()),
  provisions: count,
  cases: count,
});

export const instrumentListSchema = z.array(jurisdictionSchema.extend({ instruments: z.array(instrumentSummarySchema) }));

const instrumentProvisionCaseSchema = z.object({
  role: z.enum(INSTRUMENT_ROLE),
  note: nullableString,
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  corpusRef: z.string(),
  sortKey: count,
  status: z.enum(CASE_STATUS),
  resolvability: z.enum(RESOLVABILITY),
  resolution: z.enum(RESOLUTION),
});

const instrumentProvisionSchema = instrumentSchema
  .omit({ jurisdiction: true })
  .extend({ anchor: z.string(), cases: z.array(instrumentProvisionCaseSchema) });

export const instrumentDetailSchema = instrumentSummarySchema.extend({
  jurisdictions: z.array(jurisdictionSchema),
  provisions: z.array(instrumentProvisionSchema),
});

export const rejectionListSchema = z.array(
  z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    claim: z.string(),
    reason: z.enum(REJECTION_REASON),
    reasoning: z.string(),
    submittedBy: nullableString,
    decidedAt: isoDate,
  })
);

export const transitionListSchema = z.array(
  transitionSchema.extend({ case: z.object({ slug: z.string(), title: z.string(), corpusRef: z.string() }) })
);

export const changeSchema = z.object({
  id: z.string(),
  kind: z.enum(CHANGE_KINDS),
  occurredAt: z.string().datetime(),
  title: z.string(),
  summary: z.string(),
  url: z.string().url(),
});

export const changeListSchema = z.array(changeSchema);

export const statsSchema = z.object({
  total: count,
  published: count,
  held: count,
  gate: count,
  shapes: count,
  rejections: count,
  unverifiedCitations: count,
  changedSources: count,
  transitions: count,
  byResolvability: z.record(z.string(), count),
  resolvedBy: z.object({ engineering: count, legislative: count, judicial: count, abandonment: count }),
});

export const LATEX_TABLES = ["shapes", "cases"] as const;
export const latexQuerySchema = z.object({ table: z.enum(LATEX_TABLES).default("shapes") });

/** The OpenAPI document itself. Its shape is the OpenAPI 3.1 specification's, not ours to restate. */
export const openApiDocumentSchema = z.record(z.string(), z.unknown());
