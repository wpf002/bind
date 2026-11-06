/**
 * Contribution review. A submission is decided when two reviewers agree.
 * One accept and one reject leaves it open for a third reviewer.
 */
import { z } from "zod";
import type { Recommendation, SubmissionStatus } from "@bind/shared";

export const REVIEWS_REQUIRED = 2;

/** Slug prefix for rejections that came from a submission. The seed leaves these rows alone. */
export const INTAKE_REJECTION_PREFIX = "sub-";

const MIN_TOKEN_LENGTH = 32;

export function decideSubmission(reviews: { recommendation: Recommendation }[]): SubmissionStatus {
  const count = (r: Recommendation) => reviews.filter((x) => x.recommendation === r).length;
  if (count("accept") >= REVIEWS_REQUIRED) return "accepted";
  if (count("reject") >= REVIEWS_REQUIRED) return "rejected";
  return reviews.length > 0 ? "in_review" : "pending";
}

const reviewerSchema = z.object({
  name: z.string().min(2),
  token: z.string().min(MIN_TOKEN_LENGTH),
});
export type Reviewer = z.infer<typeof reviewerSchema>;

/**
 * Parses the REVIEWERS env var, "name:token,name:token". Throws on a malformed entry,
 * a repeated name or token, or fewer reviewers than a decision needs. Messages never
 * include a token.
 */
export function parseReviewers(raw: string): Reviewer[] {
  const reviewers = raw.split(",").map((entry, i) => {
    const parts = entry.trim().split(":");
    const parsed = reviewerSchema.safeParse({ name: parts[0]?.trim(), token: parts[1]?.trim() });
    if (parts.length !== 2 || !parsed.success) {
      throw new Error(`REVIEWERS entry ${i + 1} must be name:token with a token of ${MIN_TOKEN_LENGTH}+ characters`);
    }
    return parsed.data;
  });
  const distinct = (key: keyof Reviewer) => new Set(reviewers.map((r) => r[key])).size === reviewers.length;
  if (!distinct("name") || !distinct("token")) throw new Error("REVIEWERS repeats a name or a token");
  if (reviewers.length < REVIEWS_REQUIRED) throw new Error(`REVIEWERS needs at least ${REVIEWS_REQUIRED} reviewers`);
  return reviewers;
}
