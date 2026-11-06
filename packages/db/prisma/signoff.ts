/** Owner sign-off. Will Foti approved the whole corpus for publication on claude-opus-5-5's source verification, without an independent case-by-case human check. */
export const SIGNOFF = { by: "Will Foti", at: "2026-11-01" } as const;
export const SIGNOFF_NOTE = `Signed off by ${SIGNOFF.by}, ${SIGNOFF.at}, on claude-opus-5-5's source verification.`;

/** Second sign-off. Will Foti approved N23 and N24 on claude-fable-5-1's source verification, without domain review. */
export const SIGNOFF_FABLE = { by: "Will Foti", at: "2026-11-06", refs: ["N23", "N24"] } as const;
export const SIGNOFF_FABLE_NOTE = `Signed off by ${SIGNOFF_FABLE.by} without domain review, ${SIGNOFF_FABLE.at}, on claude-fable-5-1's source verification.`;

/** The sign-off that covers a case. */
export const signoffFor = (ref: string): { by: string; at: string } =>
  (SIGNOFF_FABLE.refs as readonly string[]).includes(ref) ? SIGNOFF_FABLE : SIGNOFF;
