import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { DESIGN_NOTE_FILENAME, DESIGN_NOTE_TITLE } from "@bind/core";
import { DRAFT_SLUG, PROPERTY_SLUG, PUBLISHED_SLUG, SECOND_PROPERTY_SLUG, SECOND_SLUG, THIRD_SLUG, buildTestApp, seedCorpus, seedSecondCorner } from "./fixtures";

type CheckBody = { shapes: { cases: { slug: string }[] }[] };

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

/** Every case heading is a link whose text starts with the slug: `### [bind-0001 Title](url)`. */
const H3_LINK = /^### \[(\S+) .*\]\((\S+)\)$/gm;
const headingSlugs = (md: string) => [...md.matchAll(H3_LINK)].map((m) => m[1]);
const checkSlugs = (body: CheckBody) => body.shapes.flatMap((g) => g.cases.map((c) => c.slug));

describe("GET /check.md", () => {
  it("serves Markdown inline under the note's filename", async () => {
    const res = await get("/check.md");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("text/markdown; charset=utf-8");
    expect(res.headers["content-disposition"]).toBe(`inline; filename="${DESIGN_NOTE_FILENAME}"`);
    expect(res.headers["cache-control"]).toBe("public, max-age=3600");
    expect(res.body.startsWith(`# ${DESIGN_NOTE_TITLE}\n`)).toBe(true);
  });

  it("names every published case and no draft when nothing is picked", async () => {
    const md = (await get("/check.md?p=&j=")).body;
    expect(headingSlugs(md)).toEqual([PUBLISHED_SLUG, SECOND_SLUG, THIRD_SLUG]);
    expect(md).not.toContain(DRAFT_SLUG);
    expect(md).toContain("Properties: All. Jurisdictions: All. Bind corpus 2025.12, released 2025-12-01.");
  });

  it("links each case heading to its page on the site", async () => {
    const md = (await get("/check.md")).body;
    for (const [, slug, url] of md.matchAll(H3_LINK)) expect(url).toBe(`http://localhost:3300/case/${slug}`);
  });

  it("names the same cases as GET /check for every property and jurisdiction pair", async () => {
    for (const p of [undefined, PROPERTY_SLUG, SECOND_PROPERTY_SLUG]) {
      for (const j of [undefined, "EU", "US"]) {
        const qs = new URLSearchParams();
        if (p) qs.set("p", p);
        if (j) qs.set("j", j);
        const [note, check] = await Promise.all([get(`/check.md?${qs}`), get(`/check?${qs}`)]);
        expect(note.statusCode).toBe(200);
        expect(headingSlugs(note.body), `${p ?? "any"} × ${j ?? "any"}`).toEqual(checkSlugs(check.json<CheckBody>()));
      }
    }
  });

  it("writes the selection as display names", async () => {
    const md = (await get(`/check.md?p=${PROPERTY_SLUG}&j=EU`)).body;
    expect(md).toMatch(/^Properties: (?!All)[^.]+\. Jurisdictions: (?!EU\.)[^.]+\. Bind corpus/m);
  });
});
