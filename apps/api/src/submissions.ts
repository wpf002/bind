import type { Prisma } from "@bind/db";
import type { ReviewQueue, SubmissionInput } from "@bind/shared";

type QueuedSubmission = ReviewQueue["submissions"][number];

/** The two rules are nested in the API and flat columns in the table. */
export function toSubmissionRow(input: SubmissionInput): Prisma.SubmissionCreateInput {
  const { requiredBy, blockedBy, jurisdictions, ...rest } = input;
  return {
    ...rest,
    jurisdictions: [...new Set(jurisdictions)],
    requiredByCitation: requiredBy.citation,
    requiredByUrl: requiredBy.url,
    blockedByCitation: blockedBy.citation,
    blockedByUrl: blockedBy.url,
  };
}

export type SubmissionColumns = {
  requiredByCitation: string;
  requiredByUrl: string;
  blockedByCitation: string;
  blockedByUrl: string;
};

export function fromSubmissionRow<T extends SubmissionColumns>(row: T): Omit<T, keyof SubmissionColumns> & Pick<QueuedSubmission, "requiredBy" | "blockedBy"> {
  const { requiredByCitation, requiredByUrl, blockedByCitation, blockedByUrl, ...rest } = row;
  return {
    ...rest,
    requiredBy: { citation: requiredByCitation, url: requiredByUrl },
    blockedBy: { citation: blockedByCitation, url: blockedByUrl },
  };
}
