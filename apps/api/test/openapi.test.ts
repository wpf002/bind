import { Validator } from "@seriousme/openapi-schema-validator";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FIXTURE_RELEASE, PUBLISHED_SLUG, buildTestApp, seedCorpus } from "./fixtures";
import { caseDetailSchema, caseListSchema, shapeListSchema, statsSchema, versionSchema } from "../src/schemas";

type OpenApiDocument = { openapi: string; info: { version: string }; paths: Record<string, Record<string, unknown>> };

let app: Awaited<ReturnType<typeof buildTestApp>>;

beforeAll(async () => {
  app = await buildTestApp();
});
afterAll(() => app.close());

const get = (url: string) => app.inject({ method: "GET", url });

/** `/cases/:slug` as Fastify spells it is `/cases/{slug}` in OpenAPI. */
const toOpenApiPath = (url: string) => url.replace(/:([A-Za-z]+)/g, "{$1}");

describe("GET /openapi.json", () => {
  it("serves a valid OpenAPI 3.1 document", async () => {
    const res = await get("/openapi.json");
    expect(res.statusCode).toBe(200);
    const doc = res.json<OpenApiDocument>();
    expect(doc.openapi).toBe("3.1.0");
    const result = await new Validator().validate(doc);
    expect(result.errors).toBeUndefined();
    expect(result.valid).toBe(true);
  });

  it("is versioned by the corpus", async () => {
    const doc = (await get("/openapi.json")).json<OpenApiDocument>();
    expect(doc.info.version).toBe(FIXTURE_RELEASE.version);
  });

  it("lists every registered GET route and nothing that writes", async () => {
    const doc = (await get("/openapi.json")).json<OpenApiDocument>();
    const documented = Object.keys(doc.paths).sort();
    expect(app.readRoutes.length).toBeGreaterThan(10);
    for (const route of app.readRoutes) {
      expect(documented).toContain(toOpenApiPath(route));
      expect(doc.paths[toOpenApiPath(route)]).toHaveProperty("get");
    }
    expect(app.readRoutes).not.toContain("/review/queue");
    expect(documented).not.toContain("/submissions");
    expect(documented.filter((p) => p.startsWith("/review"))).toEqual([]);
    expect(Object.values(doc.paths).flatMap((methods) => Object.keys(methods))).toEqual(
      Object.values(doc.paths).map(() => "get")
    );
  });

  it("writes nullable fields the 3.1 way, as a type list", async () => {
    const doc = (await get("/openapi.json")).json<OpenApiDocument>();
    expect(JSON.stringify(doc)).not.toContain('"nullable"');
    expect(JSON.stringify(doc)).toContain('"type":["string","null"]');
  });
});

describe("responses match their declared schemas", () => {
  beforeEach(seedCorpus);

  it("GET /cases/:slug", async () => {
    const res = await get(`/cases/${PUBLISHED_SLUG}`);
    expect(res.statusCode).toBe(200);
    expect(caseDetailSchema.strict().safeParse(res.json()).success).toBe(true);
  });

  it("GET /cases", async () => {
    expect(caseListSchema.strict().safeParse((await get("/cases")).json()).success).toBe(true);
  });

  it("GET /shapes", async () => {
    expect(shapeListSchema.safeParse((await get("/shapes")).json()).success).toBe(true);
  });

  it("GET /stats", async () => {
    expect(statsSchema.strict().safeParse((await get("/stats")).json()).success).toBe(true);
  });

  it("GET /version", async () => {
    const res = await get("/version");
    expect(res.statusCode).toBe(200);
    expect(versionSchema.strict().parse(res.json())).toEqual(FIXTURE_RELEASE);
  });

  it("answers a bad query with the documented 400 body", async () => {
    const res = await get("/cases?limit=abc");
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: "validation", issues: [{ path: "/limit" }] });
  });
});
