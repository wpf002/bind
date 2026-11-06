import { z } from "zod";

export const RESOLVABILITY = ["unresolvable", "resolvable_costly", "tech_gap"] as const;
export const RESOLUTION = ["none", "engineering", "legislative", "judicial", "abandonment"] as const;
export const VERIFICATION = ["unverified", "verified", "corrected", "disputed"] as const;
export const SHAPE_FAMILY = ["architectural", "conflict_of_law", "drafting_error", "research_gap"] as const;
export const CASE_STATUS = ["draft", "in_review", "published", "withdrawn"] as const;

export type Resolvability = (typeof RESOLVABILITY)[number];
export type Resolution = (typeof RESOLUTION)[number];
export type Verification = (typeof VERIFICATION)[number];
export type ShapeFamily = (typeof SHAPE_FAMILY)[number];

export const RESOLVABILITY_LABEL: Record<Resolvability, string> = {
  unresolvable: "Unresolvable",
  resolvable_costly: "Resolvable, Costly",
  tech_gap: "Open Problem",
};

export const RESOLVABILITY_NOTE: Record<Resolvability, string> = {
  unresolvable: "No engineering effort satisfies both sides.",
  resolvable_costly: "Satisfiable, at a cost the parties will not bear.",
  tech_gap: "Satisfying both is an unsolved research problem.",
};

export const FAMILY_LABEL: Record<ShapeFamily, string> = {
  architectural: "Architectural",
  conflict_of_law: "Conflict Of Law",
  drafting_error: "Drafting Error",
  research_gap: "Research Gap",
};

export const caseQuerySchema = z.object({
  shape: z.string().optional(),
  jurisdiction: z.string().optional(),
  resolvability: z.enum(RESOLVABILITY).optional(),
  status: z.enum(CASE_STATUS).optional(),
  verification: z.enum(VERIFICATION).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
export type CaseQuery = z.infer<typeof caseQuerySchema>;

/// The review page renders the source URL as a link, so schemes like javascript: are refused.
const HTTP_URL = /^https?:\/\//i;

/** Shortest answer accepted for what was built and what was tried. */
export const SUBMISSION_TEXT_MIN = 40;
/** Property slug stored for submissions migrated from the free-text form. Never offered by the form. */
export const UNKNOWN_PROPERTY = "unknown";

/// A rule by citation and primary source.
const ruleSchema = z.object({
  citation: z.string().trim().min(4, "Cite the provision."),
  url: z
    .string()
    .url("Primary sources only: EUR-Lex, eCFR, CourtListener, official gazettes.")
    .regex(HTTP_URL, "The source URL starts with http:// or https://."),
});
export type RuleInput = z.infer<typeof ruleSchema>;

export type SubmissionOptions = {
  /** Slugs of the registry's properties. */
  properties: readonly string[];
  /** Codes of the corpus's jurisdictions. */
  jurisdictions: readonly string[];
};

/// The conflict an engineer hit, as a form. Property and jurisdictions are checked against the corpus.
export function buildSubmissionSchema(options: SubmissionOptions) {
  const properties = new Set(options.properties);
  const jurisdictions = new Set(options.jurisdictions);
  return z.object({
    title: z.string().trim().min(8).max(160),
    building: z.string().trim().min(SUBMISSION_TEXT_MIN, "Name the system and the architectural choice."),
    property: z.string().refine((slug) => properties.has(slug), "Pick one of the registry's properties."),
    jurisdictions: z
      .array(z.string())
      .min(1, "Pick at least one jurisdiction.")
      .refine((codes) => codes.every((code) => jurisdictions.has(code)), "Pick jurisdictions from the corpus."),
    requiredBy: ruleSchema,
    blockedBy: ruleSchema,
    workaround: z.string().trim().min(SUBMISSION_TEXT_MIN, "Say what you tried and why it fails."),
    submitterName: z.string().trim().min(2),
    submitterEmail: z.string().email(),
    submitterAffiliation: z.string().optional(),
  });
}
export type SubmissionInput = z.infer<ReturnType<typeof buildSubmissionSchema>>;

/** Title the form offers before the submitter edits it: the property and where the design runs. */
export function suggestSubmissionTitle(propertyName: string | undefined, jurisdictionNames: string[]) {
  if (!propertyName) return "";
  if (jurisdictionNames.length === 0) return propertyName;
  const where = jurisdictionNames.length === 1 ? jurisdictionNames[0] : `${jurisdictionNames.slice(0, -1).join(", ")} and ${jurisdictionNames.at(-1)}`;
  return `${propertyName} under ${where} rules`;
}

export const RECOMMENDATION = ["accept", "reject", "needs_work"] as const;
export const SUBMISSION_STATUS = ["pending", "in_review", "accepted", "rejected"] as const;
export const REJECTION_REASON = [
  "merely_expensive",
  "implementation_defect",
  "no_primary_source",
  "not_a_binding_mandate",
  "duplicate_of_existing",
  "out_of_scope",
  "resolved_by_known_technique",
] as const;

export type Recommendation = (typeof RECOMMENDATION)[number];
export type SubmissionStatus = (typeof SUBMISSION_STATUS)[number];
export type RejectionReason = (typeof REJECTION_REASON)[number];

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  accept: "Accept",
  reject: "Reject",
  needs_work: "Needs Work",
};

/// One reviewer's verdict on a submission. A rejection has to name the criterion it failed.
export const reviewSchema = z
  .object({
    recommendation: z.enum(RECOMMENDATION),
    notes: z.string().trim().min(40, "Say which criterion decided it and why."),
    rejectionReason: z.enum(REJECTION_REASON).optional(),
  })
  .refine((r) => r.recommendation !== "reject" || r.rejectionReason !== undefined, {
    path: ["rejectionReason"],
    message: "A rejection names the criterion it failed.",
  });
export type ReviewInput = z.infer<typeof reviewSchema>;

const filedReviewSchema = z.object({
  reviewer: z.string(),
  recommendation: z.enum(RECOMMENDATION),
  notes: z.string(),
});

/** Response of GET /review/queue, parsed by the Review page. */
export const reviewQueueSchema = z.object({
  reviewer: z.string(),
  required: z.number(),
  submissions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      building: z.string(),
      property: z.string(),
      jurisdictions: z.array(z.string()),
      requiredBy: ruleSchema,
      blockedBy: ruleSchema,
      workaround: z.string(),
      submitterName: z.string(),
      submitterAffiliation: z.string().nullable(),
      submittedAt: z.string(),
      reviewCount: z.number(),
      mine: filedReviewSchema.nullable(),
      others: z.array(filedReviewSchema),
    })
  ),
});
export type ReviewQueue = z.infer<typeof reviewQueueSchema>;

/**
 * A corpus version: the year and month of the release, with `.2`, `.3`… when a month has
 * more than one (`2026.11`, `2026.11.2`). Integrators pin it; every export carries it.
 */
export const RELEASE_VERSION = /^\d{4}\.(0[1-9]|1[0-2])(\.[2-9]\d*)?$/;

export const releaseSchema = z.object({
  version: z.string().regex(RELEASE_VERSION, "A version is YYYY.MM, with .2, .3… for a second release in the month."),
  /** ISO 8601, UTC. */
  releasedAt: z.string().datetime(),
  /** Published cases at the release. */
  cases: z.number().int().nonnegative(),
  note: z.string().optional(),
});
export type Release = z.infer<typeof releaseSchema>;

/** packages/db/prisma/ledger/releases.json. The last entry is the current version. */
export const releasesLedgerSchema = z.object({ releases: z.array(releaseSchema).min(1) });
export type ReleasesLedger = z.infer<typeof releasesLedgerSchema>;

/** Enum values the JSON export carries. Each mirrors a Prisma enum of the same name. */
export const INSTRUMENT_ROLE = ["mandating", "conflicting", "context"] as const;
export const LEGAL_STANDING = ["untested", "endorsed_by_regulator", "rejected_by_regulator", "litigated_unresolved", "academic_only"] as const;
export const SOURCE_CHECK = ["current", "changed", "blocked", "unreachable"] as const;

/** Accepts a Date when serialising and an ISO string when reading the export back. */
export const isoDate = z.coerce.date();

export const exportCaseSchema = z.object({
  slug: z.string(),
  corpusRef: z.string(),
  title: z.string(),
  statement: z.string(),
  analysis: z.string().nullable(),
  inclusionReasoning: z.string().nullable(),
  resolvability: z.enum(RESOLVABILITY),
  resolution: z.enum(RESOLUTION),
  resolvedAt: isoDate.nullable(),
  resolvedBy: z.string().nullable(),
  status: z.enum(CASE_STATUS),
  publishedAt: isoDate.nullable(),
  firstSeenAt: isoDate.nullable(),
  jurisdictions: z.array(z.string()),
  properties: z.array(z.object({ slug: z.string(), name: z.string(), note: z.string().nullable() })),
  shapes: z.array(z.object({ slug: z.string(), name: z.string(), ordinal: z.number().int(), isPrimary: z.boolean(), rationale: z.string().nullable() })),
  instruments: z.array(
    z.object({
      role: z.enum(INSTRUMENT_ROLE),
      note: z.string().nullable(),
      /** The provision row's slug (`gdpr17`). */
      slug: z.string(),
      /** The instrument page's slug (`gdpr`): /instruments/{instrumentSlug}. */
      instrumentSlug: z.string(),
      regime: z.string(),
      instrument: z.string(),
      shortName: z.string(),
      provision: z.string(),
      mandate: z.string(),
      jurisdiction: z.string(),
      sourceUrl: z.string(),
    })
  ),
  citations: z.array(
    z.object({
      label: z.string(),
      url: z.string(),
      secondUrl: z.string().nullable(),
      publisher: z.string().nullable(),
      quote: z.string().nullable(),
      retrieved: isoDate.nullable(),
      verificationStatus: z.enum(VERIFICATION),
      sourceCheck: z.enum(SOURCE_CHECK).nullable(),
      sourceCheckedAt: isoDate.nullable(),
    })
  ),
  paperingOvers: z.array(z.object({ technique: z.string(), description: z.string(), standing: z.enum(LEGAL_STANDING), residual: z.string() })),
  transitions: z.array(
    z.object({ fromState: z.string(), toState: z.string(), trigger: z.string(), triggerUrl: z.string().nullable(), occurredAt: isoDate })
  ),
});
export type ExportCase = z.infer<typeof exportCaseSchema>;

/** The whole published corpus as one document: GET /export/json and corpus/bind-corpus.json. */
export const corpusExportSchema = z.object({
  generatedAt: isoDate,
  corpus: z.object({
    /** The corpus version at generation, from the releases ledger. */
    version: z.string().regex(RELEASE_VERSION),
    cases: z.number().int(),
    shapes: z.number().int(),
    properties: z.number().int(),
  }),
  cases: z.array(exportCaseSchema),
});
export type CorpusExport = z.infer<typeof corpusExportSchema>;
