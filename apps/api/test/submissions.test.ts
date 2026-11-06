import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@bind/db";
import { buildTestApp, seedCorpus, submissionRow, validSubmission } from "./fixtures";

let app: Awaited<ReturnType<typeof buildTestApp>>;

beforeAll(async () => {
  app = await buildTestApp();
});
afterAll(() => app.close());
// The property and jurisdiction a submission names are checked against the corpus.
beforeEach(() => seedCorpus());

const post = (payload: unknown) => app.inject({ method: "POST", url: "/submissions", payload: payload as object });

describe("POST /submissions", () => {
  it("stores the submission as pending and returns its id", async () => {
    const res = await post(validSubmission);
    expect(res.statusCode).toBe(201);
    const body = res.json<{ id: string; status: string; submittedAt: string }>();
    expect(body.status).toBe("pending");

    const rows = await prisma.submission.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ ...submissionRow, id: body.id, status: "pending" });
  });

  it("ignores a status and id sent by the client", async () => {
    const res = await post({ ...validSubmission, id: "chosen-by-client", status: "accepted" });
    expect(res.statusCode).toBe(201);
    const row = await prisma.submission.findFirstOrThrow();
    expect(row.status).toBe("pending");
    expect(row.id).not.toBe("chosen-by-client");
  });

  it.each([
    ["an empty object", {}],
    ["a short title", { ...validSubmission, title: "Short" }],
    ["a title over the limit", { ...validSubmission, title: "x".repeat(161) }],
    ["a missing building", { ...validSubmission, building: undefined }],
    ["a short building", { ...validSubmission, building: "A ledger." }],
    ["a building made of spaces", { ...validSubmission, building: " ".repeat(40) }],
    ["a missing property", { ...validSubmission, property: undefined }],
    ["a property made of spaces", { ...validSubmission, property: " " }],
    ["an unknown property", { ...validSubmission, property: "warp-drive" }],
    ["the migrated-row property sentinel", { ...validSubmission, property: "unknown" }],
    ["missing jurisdictions", { ...validSubmission, jurisdictions: undefined }],
    ["no jurisdictions", { ...validSubmission, jurisdictions: [] }],
    ["a jurisdiction made of spaces", { ...validSubmission, jurisdictions: [" "] }],
    ["an unknown jurisdiction", { ...validSubmission, jurisdictions: ["EU", "XX"] }],
    ["jurisdictions as a string", { ...validSubmission, jurisdictions: "EU" }],
    ["a missing required-by rule", { ...validSubmission, requiredBy: undefined }],
    ["a required-by citation made of spaces", { ...validSubmission, requiredBy: { ...validSubmission.requiredBy, citation: " ".repeat(6) } }],
    ["a required-by URL that isn't a URL", { ...validSubmission, requiredBy: { ...validSubmission.requiredBy, url: "eur-lex" } }],
    ["a required-by URL that isn't http or https", { ...validSubmission, requiredBy: { ...validSubmission.requiredBy, url: "ftp://example.com/act.pdf" } }],
    ["a missing blocked-by rule", { ...validSubmission, blockedBy: undefined }],
    ["a blocked-by citation made of spaces", { ...validSubmission, blockedBy: { ...validSubmission.blockedBy, citation: " ".repeat(6) } }],
    ["a blocked-by URL that isn't a URL", { ...validSubmission, blockedBy: { ...validSubmission.blockedBy, url: "eur-lex" } }],
    ["a javascript: blocked-by URL", { ...validSubmission, blockedBy: { ...validSubmission.blockedBy, url: "javascript:alert(document.cookie)" } }],
    ["a missing workaround", { ...validSubmission, workaround: undefined }],
    ["a short workaround", { ...validSubmission, workaround: "Tombstones." }],
    ["a workaround made of spaces", { ...validSubmission, workaround: " ".repeat(40) }],
    ["an invalid email", { ...validSubmission, submitterEmail: "not-an-email" }],
    ["a number where a string belongs", { ...validSubmission, submitterName: 42 }],
    ["an array", [validSubmission]],
    ["fields made of spaces", { ...validSubmission, title: " ".repeat(8), building: " ".repeat(40), workaround: " ".repeat(40) }],
  ])("rejects %s with 422 and writes nothing", async (_label, payload) => {
    const res = await post(payload);
    expect(res.statusCode).toBe(422);
    expect(await prisma.submission.count()).toBe(0);
  });

  it("stores each jurisdiction once", async () => {
    const res = await post({ ...validSubmission, jurisdictions: ["EU", "EU"] });
    expect(res.statusCode).toBe(201);
    expect((await prisma.submission.findFirstOrThrow()).jurisdictions).toEqual(["EU"]);
  });

  it("rejects a NUL byte with a 4xx and writes nothing", async () => {
    const res = await post({ ...validSubmission, title: "Erasure against\u0000 an audit log" });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
    expect(await prisma.submission.count()).toBe(0);
  });

  it("rejects malformed JSON with 400 and writes nothing", async () => {
    const res = await app.inject({ method: "POST", url: "/submissions", headers: { "content-type": "application/json" }, payload: "{not json" });
    expect(res.statusCode).toBe(400);
    expect(await prisma.submission.count()).toBe(0);
  });

  it("rejects a request with no body with a 4xx and writes nothing", async () => {
    const res = await app.inject({ method: "POST", url: "/submissions" });
    expect(res.statusCode).toBe(422);
    expect(await prisma.submission.count()).toBe(0);
  });
});
