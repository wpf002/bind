import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { TEST_DATABASE_NAME, assertTestDatabase } from "./database";
import {
  DRAFT_SLUG,
  PROPERTY_SLUG,
  PUBLISHED_SLUG,
  SECOND_PROPERTY_SLUG,
  SECOND_SHAPE_SLUG,
  SECOND_SLUG,
  SHAPE_SLUG,
  THIRD_SLUG,
  buildTestApp,
  seedCorpus,
  seedSecondCorner,
} from "./fixtures";

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

describe("GET /properties", () => {
  it("lists properties with published cases only", async () => {
    const res = await get("/properties");
    expect(res.statusCode).toBe(200);
    const props = res.json<{ slug: string; cases: number; resolved: boolean; shapes: { slug: string }[]; jurisdictions: string[]; caseRows: { slug: string }[] }[]>();
    expect(props.map((p) => p.slug)).toEqual([PROPERTY_SLUG]);
    expect(props[0]).toMatchObject({ cases: 1, resolved: false, jurisdictions: ["EU"] });
    expect(props[0]?.shapes.map((s) => s.slug)).toEqual([SHAPE_SLUG]);
    expect(props[0]?.caseRows.map((c) => c.slug)).toEqual([PUBLISHED_SLUG]);
  });
});

describe("GET /properties/:slug", () => {
  it("returns the property with its published cases grouped by shape", async () => {
    const res = await get(`/properties/${PROPERTY_SLUG}`);
    expect(res.statusCode).toBe(200);
    const body = res.json<{ slug: string; cases: number; groups: { shape: { slug: string } | null; cases: { slug: string }[] }[] }>();
    expect(body.slug).toBe(PROPERTY_SLUG);
    expect(body.cases).toBe(1);
    expect(body.groups.map((g) => g.shape?.slug)).toEqual([SHAPE_SLUG]);
    expect(body.groups[0]?.cases.map((c) => c.slug)).toEqual([PUBLISHED_SLUG]);
  });

  it("answers 404 for an unknown property", async () => {
    const res = await get("/properties/no-such-property");
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: "not_found" });
  });

  it("answers a NUL byte in the slug with a 4xx", async () => {
    const res = await get("/properties/property%00");
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

type CheckBody = {
  selection: { properties: string[]; jurisdictions: string[] };
  count: number;
  shapes: { shape: { slug: string } | null; cases: { slug: string; resolution: string }[] }[];
};
type MatrixCase = { slug: string; jurisdictions: string[]; shapes: { shape: { slug: string } }[]; properties: { property: { slug: string } }[] };

describe("GET /check", () => {
  beforeEach(seedSecondCorner);

  const slugsUnder = (body: CheckBody, shape: string) => body.shapes.find((g) => g.shape?.slug === shape)?.cases.map((c) => c.slug) ?? [];

  it("lists every shape with its published cases when nothing is picked", async () => {
    const res = await get("/check");
    expect(res.statusCode).toBe(200);
    const body = res.json<CheckBody>();
    expect(body.selection).toEqual({ properties: [], jurisdictions: [] });
    expect(body.count).toBe(3);
    expect(body.shapes.map((g) => g.shape?.slug)).toEqual([SHAPE_SLUG, SECOND_SHAPE_SLUG]);
    expect(slugsUnder(body, SHAPE_SLUG)).toEqual([PUBLISHED_SLUG]);
    expect(slugsUnder(body, SECOND_SHAPE_SLUG)).toEqual([SECOND_SLUG, THIRD_SLUG]);
    expect(body.shapes.flatMap((g) => g.cases.map((c) => c.slug))).not.toContain(DRAFT_SLUG);
  });

  it("carries the resolution for the chip", async () => {
    const body = (await get("/check")).json<CheckBody>();
    expect(body.shapes.flatMap((g) => g.cases).find((c) => c.slug === THIRD_SLUG)?.resolution).toBe("engineering");
  });

  it("matches the Matrix cell for every property and jurisdiction pair", async () => {
    const all = (await get("/cases")).json<{ cases: MatrixCase[] }>().cases;
    const shapes = [SHAPE_SLUG, SECOND_SHAPE_SLUG];
    for (const p of [undefined, PROPERTY_SLUG, SECOND_PROPERTY_SLUG]) {
      for (const j of [undefined, "EU", "US"]) {
        const qs = new URLSearchParams();
        if (p) qs.set("p", p);
        if (j) qs.set("j", j);
        const res = await get(`/check?${qs}`);
        expect(res.statusCode).toBe(200);
        const body = res.json<CheckBody>();
        for (const shape of shapes) {
          const cell = all
            .filter((c) => c.shapes[0]?.shape.slug === shape)
            .filter((c) => !j || c.jurisdictions.includes(j))
            .filter((c) => !p || c.properties.some((x) => x.property.slug === p))
            .map((c) => c.slug);
          expect(slugsUnder(body, shape), `${p ?? "any"} × ${j ?? "any"} under ${shape}`).toEqual(cell);
        }
        expect(body.count).toBe(body.shapes.reduce((n, g) => n + g.cases.length, 0));
      }
    }
  });

  it("returns no shapes when nothing matches", async () => {
    const body = (await get(`/check?p=${PROPERTY_SLUG}&j=US`)).json<CheckBody>();
    expect(body).toEqual({ selection: { properties: [PROPERTY_SLUG], jurisdictions: ["US"] }, count: 0, shapes: [] });
  });

  it("ignores unknown values and keeps corpus order", async () => {
    const body = (await get(`/check?p=nope,${SECOND_PROPERTY_SLUG},${PROPERTY_SLUG}&j=zz,us,eu`)).json<CheckBody>();
    expect(body.selection).toEqual({ properties: [PROPERTY_SLUG, SECOND_PROPERTY_SLUG], jurisdictions: ["EU", "US"] });
  });

  it("answers a NUL byte in the query with a 4xx", async () => {
    const res = await get("/check?p=%00");
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });
});
