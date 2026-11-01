/**
 * Model-drafted cases (claude-opus-5-5, 2026-10-31). The roadmap rules out LLM-generated
 * cases as a source of truth, so every one seeds as a draft and needs a human reviewer before
 * publication. Drafts that failed the inclusion test become rejections, not cases.
 */
import type { SeedCase } from "../corpus";
import * as a from "./drafts-a";
import * as b from "./drafts-b";

export const draftInstruments = { ...a.draftInstruments, ...b.draftInstruments };
export const draftVerifications = { ...a.draftVerifications, ...b.draftVerifications };

const all: SeedCase[] = [...a.draftCases, ...b.draftCases];
export const draftCases = all.filter((c) => c.inclusionVerdict !== "fails");

/** Failed leads. Reason per the drafting agent's finding. */
const reasonFor: Record<string, "merely_expensive" | "resolved_by_known_technique"> = { N10: "merely_expensive" };
export const draftRejections = all
  .filter((c) => c.inclusionVerdict === "fails")
  .map((c) => ({
    slug: `reject-${c.ref.toLowerCase()}`,
    title: c.title,
    claim: c.statement,
    reason: reasonFor[c.ref] ?? ("resolved_by_known_technique" as const),
    reasoning: c.inclusionReasoning ?? "",
  }));
