# Bind

A registry of legal–architectural incompatibilities: cases where a legal requirement and a technical architecture give contradictory mandates that no engineering effort resolves. Each case cites the provisions it relies on, and each citation stores the URL, the quoted passage and the date it was verified.

## Requirements

- Node 20 or later
- pnpm 10.28 (`corepack enable` picks up the version in `package.json`)
- Postgres running locally
- `pdftotext` (poppler), only for `check-sources`

## Setup

```bash
pnpm install
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to a database you own, then create it and load the corpus:

```bash
createdb bind
set -a && source .env && set +a
pnpm db:push
pnpm db:seed
```

The schema is applied with `prisma db push`. There is no migrations directory.

## Run

```bash
pnpm dev
```

| App | URL |
|---|---|
| Web (Next.js) | http://localhost:3300 |
| API (Fastify) | http://127.0.0.1:4300, health check at `/health` |

## Checks

```bash
pnpm typecheck
pnpm test
```

## Corpus Scripts

Run these from `packages/db` with the environment loaded (`set -a && source ../../.env && set +a`).

| Command | What it does |
|---|---|
| `pnpm seed` | Rebuilds the database from `prisma/corpus.ts`, `prisma/drafts/` and the verification maps |
| `pnpm roundtrip` | Compares the database with the source text in `PARADOX-CORPUS.md` and reports mismatches |
| `pnpm export` | Writes the published cases and shapes to `corpus/` |
| `pnpm prior-art` | Runs the adversarial prior-art audit. Needs `AUDIT_API_BASE`, `AUDIT_API_KEY` and `AUDIT_MODEL` |
| `pnpm check-sources` | Re-fetches every verified citation and looks for its stored quote |

### Source Check

`check-sources` records one of four results per citation:

| Result | Meaning |
|---|---|
| `current` | The quote is at the URL, or in the Internet Archive's latest capture of a URL that refuses scripts. The check date is then the capture date |
| `changed` | An earlier run found the quote at the URL and this run didn't |
| `blocked` | The publisher refuses scripts (HTTP 401 or 403) and no Internet Archive capture holds the quote |
| `unreachable` | The fetch failed another way, or the quote has never been found at the URL |

Results are written to the `Citation` rows and to `packages/db/prisma/ledger/source-checks.json`. The seed re-applies that file, so commit it after a run. The script only reports. It never edits a case.

It makes one request per URL with a 30 second timeout and three attempts, and fetches four hosts at a time. EUR-Lex, eCFR and Hansard pages are read through the publishers' own interfaces for scripts (Cellar, the eCFR renderer API and the Hansard API). A citation whose quote joins passages from two documents has a `secondUrl`; both are fetched and the quote must be found across them. It's a one-shot command, so schedule it with cron or launchd if you want it periodic.

## Layout

| Path | Contents |
|---|---|
| `apps/web` | Next.js site |
| `apps/api` | Fastify API over the same read layer |
| `packages/core` | Pure logic and its unit tests |
| `packages/db` | Prisma schema, read queries, seed and corpus scripts |
| `packages/shared` | Request schemas shared by the API and the web app |
| `corpus/` | Exported cases and shapes |
| `docs/paper` | The paper and its BibTeX |

## Environment

`.env.example` lists every variable. `DATABASE_URL` is the only one needed to run the site. `REVIEWERS` turns on the review queue. `BIND_PREVIEW_DRAFTS=1` shows held drafts and must stay off anywhere public.
