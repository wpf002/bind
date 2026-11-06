import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { TEST_DATABASE_NAME, assertTestDatabase } from "./database";
import { DRAFT_SLUG, PUBLISHED_SLUG, SHAPE_SLUG, buildTestApp, seedCorpus } from "./fixtures";

type CaseList = { count: number; cases: { slug: string; citations: { label: string }[]; jurisdictions: string[] }[] };

let app: Awaited<ReturnType<typeof buildTestApp>>;

beforeAll(async () => {
  app = await buildTestApp();
});
afterAll(() => app.close());
beforeEach(async () => {
  await seedCorpus();
});

const get = (url: string) => app.inject({ method: "GET", url });

describe("test database guard", () => {
  it("accepts a URL that names the test database", () => {
    const url = `postgresql://localhost:5432/${TEST_DATABASE_NAME}?schema=public`;
    expect(assertTestDatabase(url)).toBe(url);
  });

  it.each(["postgresql://localhost:5432/bind", "postgresql://localhost:5432/bind_test_2", undefined])("refuses %s", (url) => {
    expect(() => assertTestDatabase(url)).toThrow(/Refusing to run/);
  });
});

describe("GET /health", () => {
  it("answers ok", async () => {
    const res = await get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });
});

describe("GET /cases", () => {
  it("lists published cases with their citations and jurisdictions", async () => {
    const res = await get("/cases");
    expect(res.statusCode).toBe(200);
    const body = res.json<CaseList>();
    expect(body.count).toBe(1);
    expect(body.cases.map((c) => c.slug)).toEqual([PUBLISHED_SLUG]);
    expect(body.cases[0]?.citations.map((c) => c.label)).toEqual(["GDPR Art. 17(1)"]);
    expect(body.cases[0]?.jurisdictions).toEqual(["EU"]);
  });

  it("filters by search term, shape and jurisdiction", async () => {
    expect((await get("/cases?q=ledger")).json<CaseList>().count).toBe(1);
    expect((await get("/cases?q=nothing-matches")).json<CaseList>().count).toBe(0);
    expect((await get(`/cases?shape=${SHAPE_SLUG}&jurisdiction=eu`)).json<CaseList>().count).toBe(1);
    expect((await get("/cases?jurisdiction=us")).json<CaseList>().count).toBe(0);
  });

  it.each(["draft", "in_review", "withdrawn"])("keeps held cases out when asked for status=%s", async (status) => {
    const res = await get(`/cases?status=${status}`);
    expect(res.statusCode).toBe(200);
    expect(res.json<CaseList>().cases.map((c) => c.slug)).not.toContain(DRAFT_SLUG);
  });

  it.each(["limit=0", "limit=201", "limit=abc", "resolvability=bogus", "status=bogus", "verification=bogus", "q=a&q=b"])(
    "rejects ?%s with 400",
    async (query) => {
      expect((await get(`/cases?${query}`)).statusCode).toBe(400);
    }
  );

  it("rejects a NUL byte in the search term with a 4xx", async () => {
    const res = await get("/cases?q=%00");
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });
});

describe("GET /cases/:slug", () => {
  it("returns a published case with its citation string and BibTeX", async () => {
    const res = await get(`/cases/${PUBLISHED_SLUG}`);
    expect(res.statusCode).toBe(200);
    const body = res.json<{ slug: string; citation: string; bibtex: string }>();
    expect(body.slug).toBe(PUBLISHED_SLUG);
    expect(body.citation).toContain(PUBLISHED_SLUG);
    expect(body.bibtex).toContain("@misc{bind:0001,");
  });

  it.each([DRAFT_SLUG, "bind-9999"])("answers 404 for %s", async (slug) => {
    const res = await get(`/cases/${slug}`);
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: "not_found" });
  });

  it("answers a NUL byte in the slug with a 4xx", async () => {
    const res = await get("/cases/bind%00");
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });
});

describe("GET /shapes", () => {
  it("lists shapes with published counts and no held case", async () => {
    const res = await get("/shapes");
    expect(res.statusCode).toBe(200);
    const shapes = res.json<{ slug: string; published: number; cases: { slug: string }[] }[]>();
    expect(shapes.map((s) => s.slug)).toEqual([SHAPE_SLUG]);
    expect(shapes[0]?.published).toBe(1);
    expect(shapes[0]?.cases.map((c) => c.slug)).toEqual([PUBLISHED_SLUG]);
  });
});

describe("GET /shapes/:slug", () => {
  it("returns the shape with its published cases only", async () => {
    const res = await get(`/shapes/${SHAPE_SLUG}`);
    expect(res.statusCode).toBe(200);
    const body = res.json<{ slug: string; cases: { slug: string }[] }>();
    expect(body.slug).toBe(SHAPE_SLUG);
    expect(body.cases.map((c) => c.slug)).toEqual([PUBLISHED_SLUG]);
  });

  it("answers 404 for an unknown shape", async () => {
    const res = await get("/shapes/no-such-shape");
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: "not_found" });
  });

  it("answers a NUL byte in the slug with a 4xx", async () => {
    const res = await get("/shapes/shape%00");
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });
});

describe("GET /jurisdictions", () => {
  it("counts instruments and published cases per jurisdiction", async () => {
    const res = await get("/jurisdictions");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject([{ code: "EU", name: "European Union", instruments: 1, cases: 1 }]);
  });
});

describe("GET /rejections", () => {
  it("lists the rejection log", async () => {
    const res = await get("/rejections");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject([{ slug: "rej-0001", reason: "merely_expensive" }]);
  });
});

describe("GET /transitions", () => {
  it("lists published cases' transitions with the case they belong to, and no held case's", async () => {
    const res = await get("/transitions");
    expect(res.statusCode).toBe(200);
    const rows = res.json<{ toState: string; case: { slug: string; corpusRef: string } }[]>();
    expect(rows).toMatchObject([{ fromState: "open", toState: "contested", case: { slug: PUBLISHED_SLUG, corpusRef: "A1" } }]);
    expect(rows.map((t) => t.case.slug)).not.toContain(DRAFT_SLUG);
  });
});

describe("GET /stats", () => {
  it("counts the corpus", async () => {
    const res = await get("/stats");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      total: 2,
      published: 1,
      held: 1,
      shapes: 1,
      rejections: 1,
      transitions: 2,
      unverifiedCitations: 0,
      byResolvability: { unresolvable: 1 },
    });
  });
});

describe("GET /export/bibtex", () => {
  it("exports published cases and their sources as BibTeX", async () => {
    const res = await get("/export/bibtex");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/x-bibtex; charset=utf-8");
    expect(res.body).toContain("@misc{bind:0001,");
    expect(res.body).toContain("@misc{bind:0001:src1,");
    expect(res.body).not.toContain("bind:0002");
  });
});

describe("GET /export/latex", () => {
  it("exports the shapes table by default", async () => {
    const res = await get("/export/latex");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/x-tex; charset=utf-8");
    expect(res.body).toContain("\\label{tab:shapes}");
    expect(res.body).toContain("Immutability vs Erasure");
  });

  it("exports published cases with ?table=cases", async () => {
    const res = await get("/export/latex?table=cases");
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("\\label{tab:corpus}");
    expect(res.body).toContain("A1 & Erasure on a public ledger");
    expect(res.body).not.toContain("Held draft");
  });
});
