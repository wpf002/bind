import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FIXTURE_RELEASE, buildTestApp, seedCorpus } from "./fixtures";
import { ifNoneMatchMatches, strongEtag } from "../src/etag";

/** Every document a client polls for a new corpus version. */
const CACHED_ROUTES = ["/export/json", "/export/bibtex", "/export/latex", "/openapi.json", "/changes.atom", "/changes", "/version"];
const SHA256_HEX_LENGTH = 64;

let app: Awaited<ReturnType<typeof buildTestApp>>;

beforeAll(async () => {
  app = await buildTestApp();
});
afterAll(() => app.close());
beforeEach(seedCorpus);

const get = (url: string, headers: Record<string, string> = {}) => app.inject({ method: "GET", url, headers });

describe("strongEtag", () => {
  it("is the quoted SHA-256 of the body", () => {
    expect(strongEtag("abc")).toBe('"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"');
    expect(strongEtag(Buffer.from("abc"))).toBe(strongEtag("abc"));
  });
});

describe("ifNoneMatchMatches", () => {
  const etag = strongEtag("body");

  it("matches the tag itself, a list holding it, and the wildcard", () => {
    expect(ifNoneMatchMatches(etag, etag)).toBe(true);
    expect(ifNoneMatchMatches(`"other", ${etag}`, etag)).toBe(true);
    expect(ifNoneMatchMatches("*", etag)).toBe(true);
  });

  it("does not match a missing header, another tag, or a weak tag", () => {
    expect(ifNoneMatchMatches(undefined, etag)).toBe(false);
    expect(ifNoneMatchMatches('"other"', etag)).toBe(false);
    expect(ifNoneMatchMatches(`W/${etag}`, etag)).toBe(false);
  });
});

describe.each(CACHED_ROUTES)("GET %s", (route) => {
  it("sends a strong ETag for the body", async () => {
    const res = await get(route);
    expect(res.statusCode).toBe(200);
    expect(res.headers.etag).toMatch(new RegExp(`^"[0-9a-f]{${SHA256_HEX_LENGTH}}"$`));
    expect(res.headers.etag).toBe(strongEtag(res.body));
  });

  it("answers a matching If-None-Match with 304 and no body, keeping cache-control", async () => {
    const first = await get(route);
    const res = await get(route, {
      "if-none-match": String(first.headers.etag),
    });
    expect(res.statusCode).toBe(304);
    expect(res.body).toBe("");
    expect(res.headers.etag).toBe(first.headers.etag);
    expect(res.headers["cache-control"]).toBe(first.headers["cache-control"]);
  });

  it("answers a stale If-None-Match with 200 and the body", async () => {
    const res = await get(route, { "if-none-match": strongEtag("stale") });
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toBe("");
  });
});

describe("a new corpus version", () => {
  it("changes the ETag of every cached document", async () => {
    const dir = await mkdtemp(join(tmpdir(), "bind-releases-"));
    const path = join(dir, "releases.json");
    const next = {
      version: "2026.01",
      releasedAt: "2026-01-09T00:00:00.000Z",
      cases: 1,
    };
    await writeFile(path, JSON.stringify({ releases: [FIXTURE_RELEASE, next] }));
    const bumped = await buildTestApp([], path);
    try {
      for (const route of CACHED_ROUTES) {
        const before = await get(route);
        const after = await bumped.inject({ method: "GET", url: route });
        expect(after.statusCode).toBe(200);
        expect(after.headers.etag).not.toBe(before.headers.etag);
        expect(
          (
            await bumped.inject({
              method: "GET",
              url: route,
              headers: { "if-none-match": String(before.headers.etag) },
            })
          ).statusCode,
        ).toBe(200);
      }
    } finally {
      await bumped.close();
    }
  });
});
