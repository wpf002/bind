import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { corpusExport, corpusExportText } from "@bind/db";
import { corpusExportSchema } from "@bind/shared";
import { DRAFT_SLUG, FIXTURE_RELEASE, PUBLISHED_SLUG, RELEASES_FIXTURE_PATH, buildTestApp, seedCorpus, seedSecondCorner } from "./fixtures";

let app: Awaited<ReturnType<typeof buildTestApp>>;

beforeAll(async () => {
  app = await buildTestApp();
});
afterAll(() => app.close());
beforeEach(async () => {
  await seedCorpus();
  await seedSecondCorner();
});

const get = (url: string) => app.inject({ method: "GET", url });

describe("GET /export/json", () => {
  it("downloads the published corpus with cache headers", async () => {
    const res = await get("/export/json");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/json; charset=utf-8");
    expect(res.headers["content-disposition"]).toBe('attachment; filename="bind-corpus.json"');
    expect(res.headers["cache-control"]).toBe("public, max-age=3600");
  });

  it("carries every published case in full and no draft", async () => {
    const body = corpusExportSchema.parse((await get("/export/json")).json());
    const slugs = body.cases.map((c) => c.slug);
    expect(slugs).toContain(PUBLISHED_SLUG);
    expect(slugs).not.toContain(DRAFT_SLUG);
    expect(body.corpus).toEqual({ version: FIXTURE_RELEASE.version, cases: slugs.length, shapes: 2, properties: 2 });

    const published = body.cases.find((c) => c.slug === PUBLISHED_SLUG);
    expect(published).toMatchObject({ corpusRef: "A1", resolvability: expect.any(String), jurisdictions: ["EU"] });
    expect(published?.properties.map((p) => p.slug)).toEqual(["append-only-integrity"]);
    expect(published?.shapes.map((s) => s.slug)).toEqual(["immutability-vs-erasure"]);
    expect(published?.instruments.map((i) => i.role)).toEqual(["mandating"]);
    expect(published?.citations.map((c) => c.label)).toEqual(["GDPR Art. 17(1)"]);
    expect(published).toHaveProperty("paperingOvers");
    expect(published).toHaveProperty("transitions");
  });

  it("is the export script's document byte for byte", async () => {
    const res = await get("/export/json");
    const { generatedAt } = res.json<{ generatedAt: string }>();
    expect(res.body).toBe(corpusExportText(await corpusExport({ generatedAt: new Date(generatedAt), releasesPath: RELEASES_FIXTURE_PATH })));
  });
});
