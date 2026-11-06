import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { INCLUSION_CRITERIA, caseToBibTeX, splitAnalysis, suggestedCitation } from "@bind/core";
import { getCase, previewDrafts, type CaseDetail } from "@bind/db";
import { CopyButton } from "@/components/CopyButton";
import { Jur, Res, ShapeTag, SourceCheck, Tip, Verify } from "@/components/marks";
import { fmtDate, titleCase } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const c = await getCase(slug);
  // No provisional tier: anything short of published does not exist publicly.
  return c && (c.status === "published" || previewDrafts) ? c : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await load((await params).slug);
  return c ? { title: `${c.slug} ${c.title}`, description: c.statement } : { title: "Not Found" };
}

type Inst = CaseDetail["instruments"][number];

const REGISTRY_CONTRIBUTOR = "Bind Registry";
const UNCHECKED_STATUSES = ["unverified", "disputed"];
const NOTE_LABEL = { review: "Review", amendment: "Amendment" } as const;

function Provision({ i }: { i: Inst }) {
  const x = i.instrument;
  return (
    <div className="provision">
      <div className="provision-name">
        <Jur code={x.jurisdiction.code} link />
        <h3>
          {x.shortName} {x.provision}
        </h3>
      </div>
      <div className="provision-instr">{x.instrument}</div>
      <blockquote className="mandate">{x.mandate}</blockquote>
      {i.note ? <div className="provision-instr">{i.note}</div> : null}
      {x.sourceUrl ? (
        <a className="source-link" href={x.sourceUrl} target="_blank" rel="noreferrer">
          {x.sourceUrl.replace(/^https?:\/\//, "")} ↗
        </a>
      ) : (
        <span className="source-link muted">No Source Yet</span>
      )}
    </div>
  );
}

export default async function CasePage({ params }: Props) {
  const c = await load((await params).slug);
  if (!c) notFound();

  const primary = c.shapes[0]?.shape;
  const conflictOfLaw = primary?.family === "conflict_of_law";
  const binding = c.instruments.filter((i) => i.role !== "context");
  const context = c.instruments.filter((i) => i.role === "context");
  const left = conflictOfLaw ? binding.slice(0, 1) : binding;
  const right = conflictOfLaw ? binding.slice(1) : [];
  const cite = { slug: c.slug, title: c.title, updatedAt: c.updatedAt, contributor: c.contributor };
  const citation = suggestedCitation(cite);
  const bibtex = caseToBibTeX(cite);
  const { body: paragraphs, notes } = splitAnalysis(c.analysis);
  const passes = c.inclusionVerdict === "passes";
  const checked = c.citations.filter((s) => !UNCHECKED_STATUSES.includes(s.verificationStatus)).length;
  const sections = [
    paragraphs.length || notes.length ? "analysis" : null,
    "inclusion",
    c.paperingOvers.length ? "papering" : null,
    "record",
    "sources",
  ].filter((k) => k !== null);
  const mark = (key: string) => `§${sections.indexOf(key) + 1}`;

  // Transitions are dated by the legal event, which can precede the case's entry into the corpus.
  const enteredAt = c.firstSeenAt?.getTime() ?? 0;
  const transitionItem = (t: (typeof c.transitions)[number]) => (
    <li key={t.id}>
      <time>{fmtDate(t.occurredAt)}</time>
      <span className="node node-accent" />
      <span>
        <span className="from-to">
          {t.fromState} → {t.toState}
        </span>
        <br />
        {t.triggerUrl ? (
          <a href={t.triggerUrl} target="_blank" rel="noreferrer">
            {t.trigger}
          </a>
        ) : (
          t.trigger
        )}
      </span>
    </li>
  );

  return (
    <article className="wrap case">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Cases</Link>
        <span>/</span>
        {primary ? <Link href={`/shapes/${primary.slug}`}>{primary.name}</Link> : null}
        <span>/</span>
        <span className="id">{c.slug}</span>
      </nav>

      <header className="case-head">
        <div className="case-meta">
          <span className="case-id">{c.slug}</span>
          <span className="id muted">{c.corpusRef}</span>
          <Res r={c.resolvability} />
          <span className="jurs">
            {c.jurisdictions.map((j) => (
              <Jur key={j} code={j} link />
            ))}
          </span>
        </div>
        <h1 className="case-title">{c.title}</h1>
        <p className="lede">{c.statement}</p>
        <dl className="record">
          <div>
            <dt>Shape</dt>
            <dd className="record-shapes">
              {c.shapes.map((a) => (
                <ShapeTag key={a.shape.slug} shape={a.shape} />
              ))}
            </dd>
          </div>
          <div>
            <dt>Sources</dt>
            <dd>
              <a href="#sources" className="mono">
                {checked} / {c.citations.length} Verified
              </a>
              {c.changedSources ? <span className="chip chip-accent record-flag">{c.changedSources} Changed</span> : null}
            </dd>
          </div>
          <div>
            <dt>Contributor</dt>
            <dd>{c.contributor ?? REGISTRY_CONTRIBUTOR}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd className="mono">{fmtDate(c.updatedAt)}</dd>
          </div>
          <div>
            <dt>Taxonomy</dt>
            <dd className="mono">{c.shapes[0]?.taxonomyVersion ?? "v1"}</dd>
          </div>
        </dl>
        {c.resolution !== "none" ? (
          <div className="resolved">
            <b>Resolved · {titleCase(c.resolution)}</b>
            <span>
              {fmtDate(c.resolvedAt)}
              {c.resolvedBy ? ` · ${c.resolvedBy}` : ""}
            </span>
          </div>
        ) : null}
      </header>

      <section className="contra" aria-label="The Contradiction">
        <div className="side side-law">
          <div className="side-head">
            <span className="side-kicker">{conflictOfLaw ? "Mandate A" : "The Law Requires"}</span>
          </div>
          {left.map((i) => (
            <Provision key={i.instrumentId} i={i} />
          ))}
        </div>
        <div className="seam" aria-hidden>
          <span>⊥</span>
        </div>
        <div className="side side-arch">
          <div className="side-head">
            <span className="side-kicker">{conflictOfLaw ? "Mandate B" : "The System Relies On"}</span>
          </div>
          {right.map((i) => (
            <Provision key={i.instrumentId} i={i} />
          ))}
          {(conflictOfLaw ? [] : c.properties).map(({ property: p, note }) => (
            <div className="provision" key={p.slug}>
              <div className="provision-name">
                <h3>{p.name}</h3>
              </div>
              <blockquote className="mandate">{p.threatModel}</blockquote>
              <dl className="kv">
                {p.defeatNote ? (
                  <>
                    <dt>If Abandoned</dt>
                    <dd>{p.defeatNote}</dd>
                  </>
                ) : null}
                {note ? (
                  <>
                    <dt>Here</dt>
                    <dd>{note}</dd>
                  </>
                ) : null}
                {p.exemplars.length ? (
                  <>
                    <dt>Relied On By</dt>
                    <dd className="exemplars">
                      {p.exemplars.map((e) => (
                        <span key={e} className="chip chip-plain">
                          {e}
                        </span>
                      ))}
                    </dd>
                  </>
                ) : null}
              </dl>
            </div>
          ))}
        </div>
      </section>
      {context.length || (conflictOfLaw && c.properties.length) ? (
        <div>
          {context.map((i) => (
            <div className="context-row" key={i.instrumentId}>
              <span className="eyebrow">Context</span>
              <Jur code={i.instrument.jurisdiction.code} />
              {i.instrument.sourceUrl ? (
                <a href={i.instrument.sourceUrl} target="_blank" rel="noreferrer">
                  {i.instrument.shortName} {i.instrument.provision}
                </a>
              ) : (
                <b style={{ fontWeight: 500 }}>
                  {i.instrument.shortName} {i.instrument.provision}
                </b>
              )}
              <span className="muted">{i.note ?? i.instrument.mandate}</span>
            </div>
          ))}
          {conflictOfLaw
            ? c.properties.map(({ property: p }) => (
                <div className="context-row" key={p.slug}>
                  <span className="eyebrow">Property</span>
                  <b style={{ fontWeight: 500 }}>{p.name}</b>
                  <span className="muted">{p.threatModel}</span>
                </div>
              ))
            : null}
        </div>
      ) : null}

      <div className="case-body">
        <div>
          {sections.includes("analysis") ? (
            <section className="sect">
              <div className="sect-h">
                <span className="n">{mark("analysis")}</span>
                <h2>{paragraphs.length ? "Analysis" : "Notes"}</h2>
              </div>
              {paragraphs.map((t, i) => (
                <p key={i} className="prose">
                  {t}
                </p>
              ))}
              {notes.map((n, i) => (
                <div key={i} className="note">
                  <span className="eyebrow">{NOTE_LABEL[n.kind]}</span>
                  <p>{n.text}</p>
                </div>
              ))}
            </section>
          ) : null}

          <section className="sect">
            <div className="sect-h">
              <span className="n">{mark("inclusion")}</span>
              <h2>Inclusion Test</h2>
              <Tip text="A case qualifies only if a competent engineer with unlimited budget still cannot satisfy both sides." />
            </div>
            <div className="test">
              {INCLUSION_CRITERIA.map((k) => (
                <div className="test-row" key={k.key}>
                  <span className={`test-mark${passes ? "" : " pending"}`}>{passes ? "✓" : "…"}</span>
                  <span className="test-label">{k.label}</span>
                  <span className="test-q">{k.question}</span>
                </div>
              ))}
              <div className="test-verdict">
                <span className="eyebrow">Verdict</span>
                <span className={`chip ${passes ? "chip-ok" : "chip-warn"}`}>{titleCase(c.inclusionVerdict)}</span>
              </div>
            </div>
            {c.inclusionReasoning ? <p className="reasoning">{c.inclusionReasoning}</p> : null}
          </section>

          {c.paperingOvers.length ? (
            <section className="sect">
              <div className="sect-h">
                <span className="n">{mark("papering")}</span>
                <h2>Papering Over</h2>
                <Tip text="Documented workarounds. A workaround is not a resolution; the residual column records what it gives up." />
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Technique</th>
                    <th>Standing</th>
                    <th>Residual</th>
                  </tr>
                </thead>
                <tbody>
                  {c.paperingOvers.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <div className="strong">{w.technique}</div>
                        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                          {w.description}
                        </div>
                      </td>
                      <td>
                        <span className={`chip ${w.standing === "endorsed_by_regulator" ? "chip-ok" : w.standing === "rejected_by_regulator" ? "chip-accent" : "chip-plain"}`}>
                          {titleCase(w.standing)}
                        </span>
                      </td>
                      <td>{w.residual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}

          <section className="sect">
            <div className="sect-h">
              <span className="n">{mark("record")}</span>
              <h2>Record</h2>
            </div>
            <ol className="timeline">
              {c.transitions.filter((t) => t.occurredAt.getTime() < enteredAt).map(transitionItem)}
              <li>
                <time>{fmtDate(c.firstSeenAt)}</time>
                <span className="node" />
                <span>Entered corpus as {c.corpusRef}</span>
              </li>
              <li>
                <time>{fmtDate(c.publishedAt)}</time>
                <span className="node" />
                <span>Published after citation verification</span>
              </li>
              {c.transitions.filter((t) => t.occurredAt.getTime() >= enteredAt).map(transitionItem)}
            </ol>
          </section>

          <section className="sect" id="sources">
            <div className="sect-h">
              <span className="n">{mark("sources")}</span>
              <h2>Sources</h2>
            </div>
            <ol className="sources">
              {c.citations.map((s) => (
                <li key={s.id}>
                  <div>
                    {s.url ? (
                      <a className="label" href={s.url} target="_blank" rel="noreferrer">
                        {s.label}
                      </a>
                    ) : (
                      <span className="label">{s.label}</span>
                    )}
                    {s.verificationNote ? <div className="meta muted">{s.verificationNote}</div> : null}
                    {s.quote ? <div className="quote">“{s.quote}”</div> : null}
                    <div className="meta">
                      {s.publisher ? <span className="muted">{s.publisher}</span> : null}
                      {s.verifiedAt ? <span className="mono muted">Checked {fmtDate(s.verifiedAt)}</span> : null}
                      {s.verifiedBy ? <span className="muted">{s.verifiedBy}</span> : null}
                      <SourceCheck status={s.sourceCheck} at={s.sourceCheckedAt} />
                    </div>
                  </div>
                  <span />
                  <Verify s={s.verificationStatus} />
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="aside">
          <div className="panel">
            <div className="panel-h">
              <span className="eyebrow">Cite</span>
              <CopyButton text={citation} />
            </div>
            <div className="panel-b" style={{ display: "grid", gap: 12 }}>
              <p className="cite-text">{citation}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="eyebrow">BibTeX</span>
                <CopyButton text={bibtex} />
              </div>
              <pre className="bib">{bibtex}</pre>
            </div>
          </div>

          {primary && c.related.length ? (
            <div className="panel">
              <div className="panel-h">
                <span className="eyebrow">Same Shape</span>
                <Link className="id" href={`/shapes/${primary.slug}`}>
                  All →
                </Link>
              </div>
              <ul className="related">
                {c.related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/case/${r.slug}`}>
                      <span className="id">{r.slug}</span>
                      <span>{r.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <nav className="pager" aria-label="Adjacent Cases">
            {c.prev ? (
              <Link href={`/case/${c.prev.slug}`}>
                <span className="id">← {c.prev.slug}</span>
                <span>{c.prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {c.next ? (
              <Link href={`/case/${c.next.slug}`}>
                <span className="id">{c.next.slug} →</span>
                <span>{c.next.title}</span>
              </Link>
            ) : null}
          </nav>
        </aside>
      </div>
    </article>
  );
}
