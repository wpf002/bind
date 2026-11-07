# Roadmap

Bind is built for privacy and security engineers who pick architectures under
regulation: the person deciding on an append-only ledger, end-to-end
encryption, a data-residency boundary or a log-retention window, who needs to
know before building whether two rules make that choice impossible.

Lawyers, academics and regulators can read it. The product decisions below are
made for engineers.

## Done

| Item | Landed |
|---|---|
| 40-case corpus, every citation verified against its source | d558117 |
| Resolution counts by year and the Resolutions page | e2a1d1b |
| Source check that flags a citation whose quote left its source | 628d0ab, 013728d |
| ESLint, API integration tests, Prisma migrations | a60d989, ac43b70, c57b4f6 |
| Publication gate derived from corpus size | 5fb810d |
| Properties as the entry point: 10 shared properties, Properties pages, API routes, home and nav | 4d6596c, d2f45c9 |
| Case page for the engineer: properties, jurisdictions, instruments, workarounds and outcome above the fold | ed1b740 |
| Design check: Check page, GET /check, matcher in core, Matrix consistency test | fb80122, a664141, 95ef3d6, a88be0c |
| API and JSON export: OpenAPI at /openapi.json from the route schemas, GET /export/json, JSON on the Export page | 2ff3608, 8408858, 6ea008f, 7484b8b |
| Changes feed: publishes, transitions and failed source checks as events, GET /changes, Atom at /changes.atom, Changes page | a5d5559, 7755bb3, c598d4b, d573dc1 |
| Submit for engineers: building, property, jurisdictions, the required-by and blocked-by rules with sources, workaround; accept opens a draft case with the property linked | 055555c, d85a34e, f739cfa, 82953f3, e379a4f |
| Instruments: a slug per provision, Instruments index by jurisdiction, one page per instrument with its provisions and cases by role, GET /instruments and GET /instruments/:slug, case page links | eb96962, 7213e39, ef4809a, 0148243 |
| Corpus versions: releases ledger (`2026.11`, `.2` for a second release in a month), `pnpm release`, `corpus_released` change event, the version in /export/json, /openapi.json, the Atom feed, BibTeX and LaTeX headers, the site footer and GET /version; strong ETags with 304 on the exports, the OpenAPI document and the changes | 1373357, ff0f6fa, 3e9c0be, c4500ec, e95c067 |

## Next

In order. Each item ships on its own.

### 1. Design note

The Check result has to leave the site and land in a design review. Add
`GET /check.md` and a Copy Note button on the Check page that produce a
Markdown note for the selection: the properties and jurisdictions picked,
each shape, each case with its citations, workarounds and outcome, and the
corpus version and date.

Done when: the note for a selection names the same cases as the page, pastes
into a GitHub comment without broken formatting, and a test asserts the two
agree for every property and jurisdiction pair.

## Not planned

- More cases from the leads list. All six were drafted and rejected
  (PARADOX-CORPUS.md, Rejected section). New cases come from submissions.
- Legal advice, opinions or a rating of how likely enforcement is.
- Deployment and hosting until the owner says the app is ready to ship.
