import { describe, expect, it } from "vitest";
import { isPublishable, runInclusionTest } from "./inclusion";

const allTrue = { bindingMandate: true, namedProperty: true, budgetImmunity: true, notAnImplementationDefect: true, primarySource: true };

describe("runInclusionTest", () => {
  it("passes only when every criterion holds", () => {
    expect(runInclusionTest(allTrue)).toEqual({ verdict: "passes", failures: [] });
  });

  it("reports each failed criterion with its rejection reason", () => {
    const result = runInclusionTest({ ...allTrue, budgetImmunity: false });
    expect(result.verdict).toBe("fails");
    expect(result.failures).toEqual([{ key: "budgetImmunity", label: "Budget Immunity", rejectionReason: "merely_expensive" }]);
  });

  it("treats a missing answer as a failure", () => {
    expect(runInclusionTest({}).failures).toHaveLength(5);
  });
});

describe("isPublishable", () => {
  it("blocks unverified and disputed citations", () => {
    const result = isPublishable({ inclusionVerdict: "passes", citations: [{ verificationStatus: "unverified" }, { verificationStatus: "disputed" }] });
    expect(result).toEqual({ ok: false, blockers: ["2 citation(s) not verified"] });
  });

  it("allows a passing case with verified citations", () => {
    expect(isPublishable({ inclusionVerdict: "passes", citations: [{ verificationStatus: "verified" }] }).ok).toBe(true);
  });

  it("allows a failing boundary case with verified citations", () => {
    expect(isPublishable({ inclusionVerdict: "fails", citations: [{ verificationStatus: "verified" }] }).ok).toBe(true);
  });

  it("blocks an undecided verdict", () => {
    expect(isPublishable({ inclusionVerdict: "undecided", citations: [{ verificationStatus: "verified" }] }).blockers).toEqual(["Inclusion verdict undecided"]);
  });
});
