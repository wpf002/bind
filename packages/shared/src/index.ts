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

/// The inclusion test as a form. Every field is required because the test is the gate.
export const submissionSchema = z.object({
  title: z.string().min(8).max(160),
  statement: z.string().min(40, "State both mandates and why they cannot both hold."),
  inclusionArgument: z
    .string()
    .min(80, "Explain why a competent engineer with unlimited budget still fails."),
  legalCitation: z.string().min(4),
  legalUrl: z.string().url("Primary sources only: EUR-Lex, eCFR, CourtListener, official gazettes."),
  architecturalProperty: z.string().min(8),
  proposedShape: z.string().optional(),
  submitterName: z.string().min(2),
  submitterEmail: z.string().email(),
  submitterAffiliation: z.string().optional(),
});
export type SubmissionInput = z.infer<typeof submissionSchema>;
