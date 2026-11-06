"use client";
import { Fragment, useState } from "react";
import {
  RECOMMENDATION,
  RECOMMENDATION_LABEL,
  REJECTION_REASON,
  reviewQueueSchema,
  reviewSchema,
  type Recommendation,
  type ReviewQueue as ReviewQueueResponse,
} from "@bind/shared";
import { fmtDate, titleCase } from "@/lib/format";
import { API_URL } from "@/lib/api";

const REQUEST_TIMEOUT_MS = 10_000;

type Queue = ReviewQueueResponse;
type QueuedSubmission = Queue["submissions"][number];
type GateState = "idle" | "loading" | "unauthorized" | "disabled" | "failed";

const GATE_MESSAGE: Partial<Record<GateState, string>> = {
  unauthorized: "Token Not Recognized",
  disabled: "Review Is Off",
  failed: "API Unreachable",
};
const STATUS_TO_GATE: Record<number, GateState> = { 401: "unauthorized", 503: "disabled" };

function request(token: string, path: string, body?: unknown) {
  return fetch(`${API_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

async function fetchQueue(token: string): Promise<Queue | GateState> {
  try {
    const res = await request(token, "/review/queue");
    if (!res.ok) return STATUS_TO_GATE[res.status] ?? "failed";
    return reviewQueueSchema.parse(await res.json());
  } catch (error) {
    console.error("review queue request failed", error);
    return "failed";
  }
}

function ReviewForm(props: { token: string; submission: QueuedSubmission; onRecorded: () => void }) {
  const { submission } = props;
  const [recommendation, setRecommendation] = useState<Recommendation>(submission.mine?.recommendation ?? "accept");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const field = (name: string) => `${name}-${submission.id}`;

  async function record(form: HTMLFormElement) {
    const data = Object.fromEntries([...new FormData(form)].filter(([, v]) => v !== ""));
    const parsed = reviewSchema.safeParse(data);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid Review");
    setError(null);
    setSending(true);
    try {
      const res = await request(props.token, `/review/submissions/${submission.id}/reviews`, parsed.data);
      if (!res.ok) throw new Error(String(res.status));
      props.onRecorded();
    } catch (cause) {
      console.error("review request failed", cause);
      setError("Not Recorded");
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      className="form review-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void record(e.currentTarget);
      }}
    >
      <div className="field">
        <label htmlFor={field("recommendation")}>Recommendation</label>
        <select
          id={field("recommendation")}
          name="recommendation"
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value as Recommendation)}
        >
          {RECOMMENDATION.map((r) => (
            <option key={r} value={r}>
              {RECOMMENDATION_LABEL[r]}
            </option>
          ))}
        </select>
      </div>
      {recommendation === "reject" ? (
        <div className="field">
          <label htmlFor={field("rejectionReason")}>Failed Criterion</label>
          <select id={field("rejectionReason")} name="rejectionReason" defaultValue="">
            <option value="" disabled>
              Choose
            </option>
            {REJECTION_REASON.map((r) => (
              <option key={r} value={r}>
                {titleCase(r)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="field">
        <label htmlFor={field("notes")}>Notes</label>
        <textarea id={field("notes")} name="notes" defaultValue={submission.mine?.notes ?? ""} />
        {error ? <span className="err">{error}</span> : null}
      </div>
      <button className="btn btn-primary" type="submit" disabled={sending}>
        {submission.mine ? "Update Review" : "Record Review"}
      </button>
    </form>
  );
}

/** A rule as a link to its source. Rows migrated from the old form carry no required-by source, so the citation stands alone. */
function RuleLink({ rule }: { rule: { citation: string; url: string } }) {
  if (!rule.url) return <>{rule.citation}</>;
  return (
    <a href={rule.url} target="_blank" rel="noreferrer noopener">
      {rule.citation}
    </a>
  );
}

function SubmissionCard(props: { token: string; required: number; submission: QueuedSubmission; onRecorded: () => void }) {
  const s = props.submission;
  return (
    <article className="panel">
      <div className="panel-h">
        <b>{s.title}</b>
        <span className={`chip ${s.mine ? "chip-ok" : "chip-plain"}`}>
          {s.reviewCount} / {props.required} Reviews
        </span>
      </div>
      <div className="panel-b review-card">
        <dl className="kv">
          <dt>Building</dt>
          <dd className="rej-claim">{s.building}</dd>
          <dt>Property</dt>
          <dd>{titleCase(s.property.replace(/-/g, "_"))}</dd>
          <dt>Jurisdictions</dt>
          <dd className="jur-row">
            {s.jurisdictions.map((code) => (
              <span key={code} className="jur">
                {code}
              </span>
            ))}
          </dd>
          <dt>Required By</dt>
          <dd>
            <RuleLink rule={s.requiredBy} />
          </dd>
          <dt>Blocked By</dt>
          <dd>
            <RuleLink rule={s.blockedBy} />
          </dd>
          <dt>Workaround</dt>
          <dd>{s.workaround}</dd>
          <dt>Submitted</dt>
          <dd>
            {[s.submitterName, s.submitterAffiliation, fmtDate(s.submittedAt)].filter(Boolean).join(" · ")}
          </dd>
          {s.others.map((o) => (
            <Fragment key={o.reviewer}>
              <dt>{o.reviewer}</dt>
              <dd>
                <span className="chip chip-plain">{RECOMMENDATION_LABEL[o.recommendation]}</span> {o.notes}
              </dd>
            </Fragment>
          ))}
        </dl>
        <ReviewForm token={props.token} submission={s} onRecorded={props.onRecorded} />
      </div>
    </article>
  );
}

export function ReviewQueue() {
  // The token lives in component state only. It is never written to storage.
  const [token, setToken] = useState("");
  const [queue, setQueue] = useState<Queue | null>(null);
  const [gate, setGate] = useState<GateState>("idle");

  async function load() {
    setGate("loading");
    const result = await fetchQueue(token);
    if (typeof result === "string") {
      setQueue(null);
      return setGate(result);
    }
    setQueue(result);
    setGate("idle");
  }

  if (!queue) {
    return (
      <form
        className="review-gate"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <div className="field">
          <label htmlFor="token">Reviewer Token</label>
          <input
            id="token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          {GATE_MESSAGE[gate] ? <span className="err">{GATE_MESSAGE[gate]}</span> : null}
        </div>
        <button className="btn btn-primary" type="submit" disabled={!token || gate === "loading"}>
          Open Queue
        </button>
      </form>
    );
  }

  return (
    <div className="queue">
      <p className="eyebrow">
        {queue.reviewer} · {queue.submissions.length} Open
      </p>
      {queue.submissions.length === 0 ? <p className="empty">Queue Empty</p> : null}
      {queue.submissions.map((s) => (
        <SubmissionCard
          key={`${s.id}-${s.reviewCount}-${s.mine?.recommendation ?? "none"}`}
          token={token}
          required={queue.required}
          submission={s}
          onRecorded={() => void load()}
        />
      ))}
    </div>
  );
}
