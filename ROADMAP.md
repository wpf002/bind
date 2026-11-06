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

## Next

In order. Each item ships on its own.

### 1. Case page for the engineer

Put what an engineer needs at the top of each case: the property that
triggers it, the jurisdictions, what people do instead (`PaperingOver`, labelled
Workarounds in the UI), and what resolved it if anything did. Legal analysis,
inclusion reasoning and citations move below.

Done when: the top block of a case page answers "does this break my design,
and what did others do" without scrolling, on desktop and phone.

### 2. Design check

A page where the engineer picks properties and jurisdictions and gets the shapes
and cases they'll hit, from the data that already drives the Matrix. No model
calls; it's a query.

Done when: picking any property and jurisdiction pair returns the same cases
the Matrix shows for that cell, with an empty state for no match.

### 3. API and JSON export

Engineers integrate rather than browse. Publish an OpenAPI document for the
read routes in `apps/api`, serve it at `/openapi.json`, and add a JSON export
beside the BibTeX and LaTeX exports.

Done when: the OpenAPI document validates, every read route is in it, and
`GET /export/json` returns every published case with its properties, shapes,
instruments, citations and transitions.

### 4. Changes feed

Expose what changed: new cases, resolutions, and citations the source check
flagged. An Atom feed and a Changes page, both from the ledger and transition
data already stored.

Done when: a feed reader shows an entry for each event since the corpus was
published, newest first, and the source check adds an entry when a quote
changes.

### 5. Submit for engineers

Refocus the Submit form on the conflict an engineer hit: what they were
building, which rule blocked it, which rule required it. Review stays as is.

Done when: a submission from the form reaches the review queue with those
fields and the API tests cover the new schema.

## Not planned

- More cases from the leads list. All six were drafted and rejected
  (PARADOX-CORPUS.md, Rejected section). New cases come from submissions.
- Legal advice, opinions or a rating of how likely enforcement is.
- Deployment and hosting until the items above are done.
