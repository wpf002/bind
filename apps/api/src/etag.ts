import { createHash } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Strong ETags on the documents a client polls for a new corpus version. The tag is the SHA-256 of
 * the bytes sent, so it changes with the version and with nothing else; a matching If-None-Match
 * gets 304 with no body, with the handler's cache-control header kept.
 */

declare module "fastify" {
  interface FastifyContextConfig {
    /** Set on a route to send an ETag and answer If-None-Match with 304. */
    etag?: boolean;
  }
}

const ETAG_HASH = "sha256";
const NOT_MODIFIED = 304;
const OK = 200;
/** RFC 9110 §13.1.2: `*` matches any current representation. */
const ANY_ETAG = "*";
/** A weak validator never matches under the strong comparison used here. */
const WEAK_PREFIX = "W/";

export const strongEtag = (body: string | Buffer) => `"${createHash(ETAG_HASH).update(body).digest("hex")}"`;

/** True when an If-None-Match header names `etag` (strong comparison) or is `*`. */
export function ifNoneMatchMatches(header: string | undefined, etag: string): boolean {
  if (!header) return false;
  return header
    .split(",")
    .map((tag) => tag.trim())
    .some((tag) => tag === ANY_ETAG || (!tag.startsWith(WEAK_PREFIX) && tag === etag));
}

/** onSend hook: on a 200 GET of a route with `config.etag`, tag the body and turn a match into 304. */
export async function etagOnSend(req: FastifyRequest, reply: FastifyReply, payload: unknown): Promise<unknown> {
  if (!req.routeOptions.config.etag || req.method !== "GET" || reply.statusCode !== OK) return payload;
  if (typeof payload !== "string" && !Buffer.isBuffer(payload)) return payload;
  const etag = strongEtag(payload);
  reply.header("etag", etag);
  if (!ifNoneMatchMatches(req.headers["if-none-match"], etag)) return payload;
  reply.code(NOT_MODIFIED);
  return "";
}
