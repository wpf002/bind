import { XMLParser, XMLValidator } from "fast-xml-parser";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@bind/db";
import { DRAFT_SLUG, PUBLISHED_SLUG, seedCorpus } from "./fixtures";
import { buildApp } from "../src/app";
import { changeListSchema } from "../src/schemas";

const SITE_URL = "https://bind.example";
const PUBLISHED_AT = new Date("2025-06-01T09:00:00.000Z");
const SOURCE_CHECKED_AT = new Date("2025-11-02T06:00:00.000Z");

type Entry = { id: string; title: string; updated: string; summary: string; link: { "@_href": string; "@_rel": string } };
type Feed = { feed: { id: string; title: string; updated: string; link: { "@_rel": string; "@_href": string }[]; entry?: Entry | Entry[] } };

let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  app = await buildApp({ reviewers: [], logLevel: "silent", siteUrl: SITE_URL });
});
afterAll(() => app.close());

/** The fixture corpus with a publish date on the published case and a failed source check on its citation. */
beforeEach(async () => {
  await seedCorpus();
  await prisma.case.update({ where: { slug: PUBLISHED_SLUG }, data: { publishedAt: PUBLISHED_AT } });
  await prisma.case.update({ where: { slug: DRAFT_SLUG }, data: { publishedAt: new Date("2025-07-01") } });
  await prisma.citation.updateMany({ where: { targetType: "case" }, data: { sourceCheck: "changed", sourceCheckedAt: SOURCE_CHECKED_AT } });
});

const get = (url: string) => app.inject({ method: "GET", url });

describe("GET /changes", () => {
  it("lists the published case's events newest first, with absolute links", async () => {
    const res = await get("/changes");
    expect(res.statusCode).toBe(200);
    const events = changeListSchema.parse(res.json());
    expect(events.map((e) => e.kind)).toEqual(["source_changed", "case_published", "case_transition"]);
    expect(events.map((e) => e.occurredAt)).toEqual([SOURCE_CHECKED_AT.toISOString(), PUBLISHED_AT.toISOString(), "2024-03-01T00:00:00.000Z"]);
    expect(events.every((e) => e.url === `${SITE_URL}/case/${PUBLISHED_SLUG}`)).toBe(true);
    expect(events[0]).toMatchObject({ id: `source_changed:${PUBLISHED_SLUG}:${SOURCE_CHECKED_AT.toISOString()}:gdpr-art-17-1`, title: "Source changed: GDPR Art. 17(1)" });
  });

  it("leaves the held draft's publish date and transitions out", async () => {
    const body = JSON.stringify((await get("/changes")).json());
    expect(body).not.toContain(DRAFT_SLUG);
    expect(body).not.toContain("Draft trigger");
  });

  it("drops the source event once the check is current again", async () => {
    await prisma.citation.updateMany({ where: { targetType: "case" }, data: { sourceCheck: "current" } });
    const events = changeListSchema.parse((await get("/changes")).json());
    expect(events.map((e) => e.kind)).toEqual(["case_published", "case_transition"]);
  });
});

describe("GET /changes.atom", () => {
  const parser = new XMLParser({ ignoreAttributes: false, isArray: (name) => name === "link" });

  it("serves well-formed Atom 1.0 with the feed fields", async () => {
    const res = await get("/changes.atom");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/atom+xml; charset=utf-8");
    expect(XMLValidator.validate(res.body)).toBe(true);
    const { feed } = parser.parse(res.body) as Feed;
    expect(feed.id).toBe("http://localhost:80/changes.atom");
    expect(feed.title).toBe("Bind Changes");
    expect(feed.updated).toBe(SOURCE_CHECKED_AT.toISOString());
    expect(feed.link).toContainEqual(expect.objectContaining({ "@_rel": "self", "@_href": "http://localhost:80/changes.atom" }));
  });

  it("has one entry per event, in the same order as /changes", async () => {
    const events = changeListSchema.parse((await get("/changes")).json());
    const { feed } = parser.parse((await get("/changes.atom")).body) as Feed;
    const entries = [feed.entry ?? []].flat();
    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.id)).toEqual(events.map((e) => `urn:bind:change:${e.id}`));
    expect(entries.map((e) => e.updated)).toEqual(events.map((e) => e.occurredAt));
    for (const entry of entries) {
      expect(entry.title).toBeTruthy();
      expect(entry.summary).toBeTruthy();
      expect(entry.link).toContainEqual(expect.objectContaining({ "@_rel": "alternate", "@_href": `${SITE_URL}/case/${PUBLISHED_SLUG}` }));
    }
  });

  it("names no held case", async () => {
    expect((await get("/changes.atom")).body).not.toContain(DRAFT_SLUG);
  });
});
