import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { archiveCaptureOf, checkQuote, combineSources, countSourceChecks, htmlToText, jsonToText, sourceCheckKey, type ArchiveCapture, type FetchedSource, type SourceCheckEntry, type SourceCheckLedger } from "@bind/core";
import { prisma } from "../src/client";
import { SOURCE_CHECK_LEDGER_PATH, readSourceChecks } from "./source-checks";

/**
 * Re-fetches the source of every verified citation and tests whether its stored quote is still
 * there. Writes the result to the Citation rows and to ledger/source-checks.json, which the seed
 * re-applies. Run it by hand or from cron: `pnpm --filter @bind/db run check-sources`.
 *
 * "changed" means the quote was found at the URL on an earlier run and is gone now. A quote that
 * has never been found is "unreachable": the page may be a search form or a licence gate.
 * "blocked" means the publisher keeps the text from scripts (an HTTP 401 or 403) and the Internet
 * Archive has no capture holding the quote. A quote found in a capture is "current" as of the capture date.
 * It only reports. A "changed" result needs someone to reread the provision; nothing here edits a case.
 */

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 2_000;
/** Hosts fetched at once. Requests to one host run one after another. */
const HOST_CONCURRENCY = 4;
const MAX_BODY_BYTES = 40 * 1024 * 1024;
const PDF_TO_TEXT_TIMEOUT_MS = 60_000;
const PDF_MAGIC = "%PDF";
const JSON_CONTENT_TYPE = /^application\/(?:[\w.-]+\+)?json\b/i;
const USER_AGENT = "bind-source-check/1.0 (citation currency check)";
const CHECKED_STATUSES = ["verified", "corrected"] as const;

/** EUR-Lex HTML sits behind a bot challenge. The Publications Office serves the same text by CELEX number. */
const EUR_LEX_HOST = "eur-lex.europa.eu";
const CELEX_IN_URL = /CELEX:([0-9A-Z()]+)/i;
const cellarUrl = (celex: string) => `http://publications.europa.eu/resource/celex/${celex}`;
/** Older acts have no XHTML rendition, so plain HTML is accepted second. */
const CELLAR_HEADERS = { Accept: "application/xhtml+xml, text/html;q=0.9", "Accept-Language": "eng" };

/** eCFR's reader pages redirect scripts to a block page that names its API as the route for them. */
const ECFR_HOST = "www.ecfr.gov";
const ECFR_SECTION_PATH = /^\/current\/title-(\d+)\/(?:.*\/)?section-([\w.-]+)$/;
const ecfrApiUrl = (title: string, section: string) =>
  `https://${ECFR_HOST}/api/renderer/v1/content/enhanced/current/title-${title}?part=${section.split(".")[0]}&section=${section}`;

/** Hansard's reader pages answer scripts with a bot challenge. Parliament's Hansard API serves the same debate as JSON. */
const HANSARD_HOST = "hansard.parliament.uk";
const HANSARD_DEBATE_PATH = /\/debates\/([0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12})\//i;
const hansardApiUrl = (debateId: string) => `https://hansard-api.parliament.uk/debates/debate/${debateId}.json`;
const JSON_HEADERS = { Accept: "application/json" };

/** The Internet Archive shows a capture inside its own page frame. The `id_` form returns the captured bytes. */
const WAYBACK_CAPTURE_URL = /^(https:\/\/web\.archive\.org\/web\/\d{14})(\/.+)$/;

/** Returns the Internet Archive's most recent capture of a URL. */
const WAYBACK_AVAILABILITY_URL = "https://archive.org/wayback/available";

/** Statuses a server uses to refuse the client, as opposed to a missing page or a fault. */
const REFUSED_STATUSES = [401, 403];

const DEFAULT_HEADERS = { Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5" };

type Request = { url: string; headers: Record<string, string> };

/** The request that returns a citation's text: the cited URL, or the publisher's interface for scripts. */
function requestFor(citationUrl: string): Request {
  const parsed = new URL(citationUrl);
  if (parsed.host === EUR_LEX_HOST) {
    const celex = decodeURIComponent(parsed.search).match(CELEX_IN_URL)?.[1];
    if (celex) return { url: cellarUrl(celex), headers: CELLAR_HEADERS };
  }
  if (parsed.host === ECFR_HOST) {
    const section = parsed.pathname.match(ECFR_SECTION_PATH);
    if (section) return { url: ecfrApiUrl(section[1]!, section[2]!), headers: DEFAULT_HEADERS };
  }
  if (parsed.host === HANSARD_HOST) {
    const debateId = parsed.pathname.match(HANSARD_DEBATE_PATH)?.[1];
    if (debateId) return { url: hansardApiUrl(debateId), headers: JSON_HEADERS };
  }
  const capture = citationUrl.match(WAYBACK_CAPTURE_URL);
  if (capture) return { url: `${capture[1]}id_${capture[2]}`, headers: DEFAULT_HEADERS };
  return { url: citationUrl, headers: DEFAULT_HEADERS };
}

const siteOf = (url: string) => new URL(url).host.replace(/^www\./, "");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const retryable = (status: number) => status === 429 || status >= 500;

function pdfToText(pdf: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile("pdftotext", ["-q", "-", "-"], { timeout: PDF_TO_TEXT_TIMEOUT_MS, maxBuffer: MAX_BODY_BYTES }, (error, stdout) =>
      error ? reject(error) : resolve(stdout)
    );
    // pdftotext can exit before reading all of stdin; the exit error above is the one that matters.
    child.stdin?.on("error", () => undefined);
    child.stdin?.end(pdf);
  });
}

function charsetOf(contentType: string, body: Buffer): string {
  const declared = contentType.match(/charset=["']?([\w-]+)/i)?.[1] ?? body.subarray(0, 4096).toString("latin1").match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
  return declared ?? "utf-8";
}

async function bodyToText(contentType: string, body: Buffer): Promise<FetchedSource> {
  if (body.subarray(0, PDF_MAGIC.length).toString("latin1") === PDF_MAGIC) {
    try {
      return { ok: true, text: await pdfToText(body) };
    } catch (error) {
      const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
      return { ok: false, reason: missing ? "pdftotext not installed" : `PDF text extraction failed: ${(error as Error).message.split("\n")[0]}` };
    }
  }
  let decoder: TextDecoder;
  try {
    decoder = new TextDecoder(charsetOf(contentType, body));
  } catch {
    return { ok: false, reason: `unsupported charset in ${contentType}` };
  }
  if (!JSON_CONTENT_TYPE.test(contentType)) return { ok: true, text: htmlToText(decoder.decode(body)) };
  try {
    return { ok: true, text: jsonToText(decoder.decode(body)) };
  } catch {
    return { ok: false, reason: "invalid JSON body" };
  }
}

async function fetchOnce(request: Request): Promise<FetchedSource & { retry?: boolean }> {
  let response: Response;
  try {
    response = await fetch(request.url, {
      headers: { "User-Agent": USER_AGENT, ...request.headers },
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const cause = (error as { cause?: { code?: string } }).cause?.code;
    const reason = (error as Error).name === "TimeoutError" ? "timeout" : `network error${cause ? ` ${cause}` : ""}`;
    return { ok: false, reason, retry: true };
  }
  // Only a plain 200 counts. A 202 is how a bot challenge answers, and the challenge page isn't the source.
  if (response.status !== 200) {
    await response.body?.cancel();
    return { ok: false, reason: `HTTP ${response.status}`, blocked: REFUSED_STATUSES.includes(response.status), retry: retryable(response.status) };
  }
  // A redirect to another site is a block or consent page, not the cited document.
  if (siteOf(response.url) !== siteOf(request.url)) {
    await response.body?.cancel();
    return { ok: false, reason: `redirected to ${new URL(response.url).host}` };
  }
  let body: Buffer;
  try {
    body = Buffer.from(await response.arrayBuffer());
  } catch {
    return { ok: false, reason: "body read failed", retry: true };
  }
  if (body.byteLength > MAX_BODY_BYTES) return { ok: false, reason: "body too large" };
  return bodyToText(response.headers.get("content-type") ?? "", body);
}

async function fetchWithRetries(request: Request): Promise<FetchedSource> {
  let last: FetchedSource = { ok: false, reason: "not attempted" };
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { retry, ...result } = await fetchOnce(request);
    last = result;
    if (result.ok || !retry) break;
    if (attempt < MAX_ATTEMPTS) await sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1));
  }
  return last;
}

/** The Internet Archive's latest capture of a URL, or null when it has none or can't be asked. */
async function findArchiveCapture(citationUrl: string): Promise<ArchiveCapture | null> {
  try {
    const response = await fetch(`${WAYBACK_AVAILABILITY_URL}?url=${encodeURIComponent(citationUrl)}`, {
      headers: { "User-Agent": USER_AGENT, ...JSON_HEADERS },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.status !== 200) {
      await response.body?.cancel();
      return null;
    }
    return archiveCaptureOf(citationUrl, await response.text());
  } catch (error) {
    console.warn(`archive lookup failed for ${citationUrl}: ${(error as Error).message.split("\n")[0]}`);
    return null;
  }
}

/**
 * The cited page, or the Internet Archive's latest capture of it when the publisher refuses
 * scripts. The archive read the same URL, so its copy is the source as of the capture time.
 */
async function fetchSource(citationUrl: string): Promise<FetchedSource> {
  const live = await fetchWithRetries(requestFor(citationUrl));
  if (live.ok || !live.blocked) return live;
  const capture = await findArchiveCapture(citationUrl);
  if (!capture) return live;
  const archived = await fetchWithRetries({ url: capture.url, headers: DEFAULT_HEADERS });
  return archived.ok ? { ...archived, capturedAt: capture.capturedAt } : live;
}

/** One fetch per URL per run. A second document is often one that other citations cite directly. */
const fetched = new Map<string, Promise<FetchedSource>>();
function fetchSourceOnce(citationUrl: string): Promise<FetchedSource> {
  const pending = fetched.get(citationUrl) ?? fetchSource(citationUrl);
  fetched.set(citationUrl, pending);
  return pending;
}

/** Runs `work` over `items` with at most `limit` in flight. */
async function inPool<T>(items: T[], limit: number, work: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await work(item);
    })
  );
}

type Target = { url: string; secondUrl?: string; quote: string; label: string };

async function loadTargets() {
  const citations = await prisma.citation.findMany({
    where: { targetType: "case", verificationStatus: { in: [...CHECKED_STATUSES] } },
    orderBy: [{ url: "asc" }, { label: "asc" }],
  });
  const targets = new Map<string, Target>();
  let skipped = 0;
  for (const c of citations) {
    if (!c.url || !c.quote?.trim()) skipped++;
    else if (!targets.has(sourceCheckKey(c.url, c.quote))) targets.set(sourceCheckKey(c.url, c.quote), { url: c.url, secondUrl: c.secondUrl ?? undefined, quote: c.quote, label: c.label });
  }
  return { targets: [...targets.values()], citations: citations.length, skipped };
}

function byHost(targets: Target[]): Target[][][] {
  const hosts = new Map<string, Map<string, Target[]>>();
  for (const target of targets) {
    const host = new URL(target.url).host;
    const urls = hosts.get(host) ?? new Map<string, Target[]>();
    urls.set(target.url, [...(urls.get(target.url) ?? []), target]);
    hosts.set(host, urls);
  }
  return [...hosts.values()].map((urls) => [...urls.values()]);
}

async function main() {
  const { targets, citations, skipped } = await loadTargets();
  const previous = readSourceChecks();
  const checks: SourceCheckEntry[] = [];

  await inPool(byHost(targets), HOST_CONCURRENCY, async (urlGroups) => {
    for (const group of urlGroups) {
      const first = await fetchSourceOnce(group[0]!.url);
      const fetchedAt = new Date().toISOString();
      for (const target of group) {
        const source = target.secondUrl ? combineSources([first, await fetchSourceOnce(target.secondUrl)]) : first;
        // A capture shows the source as it was when the archive read it, so that is the check's date.
        const checkedAt = (source.ok && source.capturedAt) || fetchedAt;
        const foundAt = previous.get(sourceCheckKey(target.url, target.quote))?.foundAt;
        const result = checkQuote(target.quote, source, foundAt !== undefined);
        checks.push({ ...target, ...result, checkedAt, foundAt: result.status === "current" ? checkedAt : foundAt });
      }
    }
  });

  checks.sort((a, b) => sourceCheckKey(a.url, a.quote).localeCompare(sourceCheckKey(b.url, b.quote)));
  for (const check of checks) {
    await prisma.citation.updateMany({
      where: { targetType: "case", url: check.url, quote: check.quote },
      data: { sourceCheck: check.status, sourceCheckedAt: new Date(check.checkedAt) },
    });
  }
  const ledger: SourceCheckLedger = { checks };
  await writeFile(SOURCE_CHECK_LEDGER_PATH, JSON.stringify(ledger, null, 2) + "\n");

  const counts = countSourceChecks(checks.map((check) => check.status));
  console.log(`checked ${checks.length} quotes from ${citations} citations (${skipped} skipped, no url or quote): ${counts.current} current, ${counts.changed} changed, ${counts.blocked} blocked, ${counts.unreachable} unreachable`);
  for (const check of checks) {
    if (check.status !== "current") console.log(`${check.status}: ${check.label} <${check.url}>${check.detail ? ` (${check.detail})` : ""}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
