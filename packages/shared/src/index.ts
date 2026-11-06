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

/// The inclusion test as a form. Every field is required because the test is the gate.
export const submissionSchema = z.object({
  title: z.string().trim().min(8).max(160),
  statement: z.string().trim().min(40, "State both mandates and why they cannot both hold."),
  inclusionArgument: z
    .string()
    .trim()
    .min(80, "Explain why a competent engineer with unlimited budget still fails."),
  legalCitation: z.string().trim().min(4),
  legalUrl: z
    .string()
    .url("Primary sources only: EUR-Lex, eCFR, CourtListener, official gazettes.")
    .regex(HTTP_URL, "The source URL starts with http:// or https://."),
  architecturalProperty: z.string().trim().min(8),
  proposedShape: z.string().optional(),
  submitterName: z.string().trim().min(2),
  submitterEmail: z.string().email(),
  submitterAffiliation: z.string().optional(),
});
export type SubmissionInput = z.infer<typeof submissionSchema>;

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
      statement: z.string(),
      inclusionArgument: z.string(),
      legalCitation: z.string(),
      legalUrl: z.string(),
      architecturalProperty: z.string(),
      proposedShape: z.string().nullable(),
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
