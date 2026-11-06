import { describe, expect, it } from "vitest";
import { decideSubmission, parseReviewers } from "./review";

const token = (c: string) => c.repeat(32);

describe("decideSubmission", () => {
  it("is pending with no reviews", () => {
    expect(decideSubmission([])).toBe("pending");
  });
  it("stays in review after one accept", () => {
    expect(decideSubmission([{ recommendation: "accept" }])).toBe("in_review");
  });
  it("accepts on two accepts", () => {
    expect(decideSubmission([{ recommendation: "accept" }, { recommendation: "accept" }])).toBe("accepted");
  });
  it("rejects on two rejects", () => {
    expect(decideSubmission([{ recommendation: "reject" }, { recommendation: "reject" }])).toBe("rejected");
  });
  it("stays in review when reviewers split", () => {
    expect(decideSubmission([{ recommendation: "accept" }, { recommendation: "reject" }])).toBe("in_review");
  });
  it("doesn't count needs_work toward either outcome", () => {
    expect(decideSubmission([{ recommendation: "needs_work" }, { recommendation: "needs_work" }])).toBe("in_review");
  });
  it("lets a third reviewer break a split", () => {
    expect(decideSubmission([{ recommendation: "accept" }, { recommendation: "reject" }, { recommendation: "reject" }])).toBe("rejected");
  });
});

describe("parseReviewers", () => {
  it("parses two reviewers", () => {
    expect(parseReviewers(`ada:${token("a")}, grace:${token("b")}`)).toEqual([
      { name: "ada", token: token("a") },
      { name: "grace", token: token("b") },
    ]);
  });
  it("rejects a single reviewer", () => {
    expect(() => parseReviewers(`ada:${token("a")}`)).toThrow(/at least 2/);
  });
  it("rejects a short token without echoing it", () => {
    expect(() => parseReviewers(`ada:shortsecret,grace:${token("b")}`)).toThrow(/entry 1/);
    expect(() => parseReviewers(`ada:shortsecret,grace:${token("b")}`)).not.toThrow(/shortsecret/);
  });
  it("rejects a shared token", () => {
    expect(() => parseReviewers(`ada:${token("a")},grace:${token("a")}`)).toThrow(/repeats/);
  });
  it("rejects a repeated name", () => {
    expect(() => parseReviewers(`ada:${token("a")},ada:${token("b")}`)).toThrow(/repeats/);
  });
});
