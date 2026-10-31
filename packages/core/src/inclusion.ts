/**
 * The inclusion test. A case qualifies only if a competent engineer with
 * unlimited budget still cannot satisfy both sides.
 *
 * Five criteria, all required. Failing any one is a rejection, and the failure
 * reason is what outsiders learn the test from.
 */

export const INCLUSION_CRITERIA = [
  {
    key: "bindingMandate",
    label: "Binding Mandate",
    question: "Does a legal instrument in force actually command the thing?",
    failsAs: "not_a_binding_mandate",
  },
  {
    key: "namedProperty",
    label: "Named Property",
    question: "Is the architectural property named, with the threat model it serves?",
    failsAs: "out_of_scope",
  },
  {
    key: "budgetImmunity",
    label: "Budget Immunity",
    question: "Does the conflict survive unlimited engineering budget?",
    failsAs: "merely_expensive",
  },
  {
    key: "notAnImplementationDefect",
    label: "Not A Defect",
    question: "Would a correct reimplementation still fail?",
    failsAs: "implementation_defect",
  },
  {
    key: "primarySource",
    label: "Primary Source",
    question: "Is there a primary-source citation for the provision?",
    failsAs: "no_primary_source",
  },
] as const;

export type CriterionKey = (typeof INCLUSION_CRITERIA)[number]["key"];
export type InclusionAnswers = Record<CriterionKey, boolean>;

export type InclusionResult = {
  verdict: "passes" | "fails";
  failures: { key: CriterionKey; label: string; rejectionReason: string }[];
};

export function runInclusionTest(answers: Partial<InclusionAnswers>): InclusionResult {
  const failures = INCLUSION_CRITERIA.filter((c) => answers[c.key] !== true).map((c) => ({
    key: c.key,
    label: c.label,
    rejectionReason: c.failsAs,
  }));
  return { verdict: failures.length === 0 ? "passes" : "fails", failures };
}

/**
 * Publication gate. Unverified citations keep a case unpublished.
 * No provisional tier, no exceptions.
 */
export function isPublishable(input: {
  inclusionVerdict: string;
  citations: { verificationStatus: string }[];
}): { ok: boolean; blockers: string[] } {
  const blockers: string[] = [];
  if (input.inclusionVerdict !== "passes") blockers.push("Inclusion test not passed");
  if (input.citations.length === 0) blockers.push("No citations");
  const unverified = input.citations.filter(
    (c) => c.verificationStatus === "unverified" || c.verificationStatus === "disputed"
  ).length;
  if (unverified > 0) blockers.push(`${unverified} citation(s) not verified`);
  return { ok: blockers.length === 0, blockers };
}
