import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@bind/db";
import { buildTestApp, validSubmission } from "./fixtures";

let app: Awaited<ReturnType<typeof buildTestApp>>;

beforeAll(async () => {
  app = await buildTestApp();
});
afterAll(() => app.close());

const post = (payload: unknown) => app.inject({ method: "POST", url: "/submissions", payload: payload as object });

describe("POST /submissions", () => {
  it("stores the submission as pending and returns its id", async () => {
    const res = await post(validSubmission);
    expect(res.statusCode).toBe(201);
    const body = res.json<{ id: string; status: string; submittedAt: string }>();
    expect(body.status).toBe("pending");

    const rows = await prisma.submission.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ ...validSubmission, id: body.id, status: "pending" });
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
    ["a missing inclusion argument", { ...validSubmission, inclusionArgument: undefined }],
    ["a short title", { ...validSubmission, title: "Short" }],
    ["a title over the limit", { ...validSubmission, title: "x".repeat(161) }],
    ["a short statement", { ...validSubmission, statement: "Too short." }],
    ["an invalid email", { ...validSubmission, submitterEmail: "not-an-email" }],
    ["a legal URL that isn't a URL", { ...validSubmission, legalUrl: "eur-lex" }],
    ["a number where a string belongs", { ...validSubmission, submitterName: 42 }],
    ["an array", [validSubmission]],
    ["a javascript: legal URL", { ...validSubmission, legalUrl: "javascript:alert(document.cookie)" }],
    ["a legal URL that isn't http or https", { ...validSubmission, legalUrl: "ftp://example.com/act.pdf" }],
    ["fields made of spaces", { ...validSubmission, title: " ".repeat(8), statement: " ".repeat(40), inclusionArgument: " ".repeat(80) }],
  ])("rejects %s with 422 and writes nothing", async (_label, payload) => {
    const res = await post(payload);
    expect(res.statusCode).toBe(422);
    expect(await prisma.submission.count()).toBe(0);
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
