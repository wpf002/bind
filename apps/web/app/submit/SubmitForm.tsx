"use client";
import { useState } from "react";
import { submissionSchema } from "@bind/shared";
import { INCLUSION_CRITERIA } from "@bind/core";

type Shape = { slug: string; name: string; ordinal: number };
type Errors = Partial<Record<string, string[]>>;

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4300";

function Field(props: {
  name: string;
  label: string;
  errors: Errors;
  textarea?: boolean;
  min?: number;
  optional?: boolean;
  type?: string;
  placeholder?: string;
}) {
  const [len, setLen] = useState(0);
  const err = props.errors[props.name]?.[0];
  const Tag = props.textarea ? "textarea" : "input";
  return (
    <div className="field">
      <label htmlFor={props.name}>
        {props.label}
        <span className="req">{props.optional ? "Optional" : "Required"}</span>
      </label>
      <Tag
        id={props.name}
        name={props.name}
        type={props.textarea ? undefined : props.type ?? "text"}
        placeholder={props.placeholder}
        aria-invalid={!!err}
        onChange={(e) => setLen(e.currentTarget.value.length)}
      />
      {props.min ? (
        <span className={`meter${len >= props.min ? " ok" : ""}`}>
          {len} / {props.min}
        </span>
      ) : null}
      {err ? <span className="err">{err}</span> : null}
    </div>
  );
}

export function SubmitForm({ shapes }: { shapes: Shape[] }) {
  const [errors, setErrors] = useState<Errors>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [state, setState] = useState<"idle" | "sending" | "failed" | { id: string }>("idle");
  const allChecked = INCLUSION_CRITERIA.every((c) => checks[c.key]);

  if (typeof state === "object") {
    return (
      <div className="receipt">
        <span className="eyebrow">Received</span>
        <h2>In The Review Queue</h2>
        <span className="id">{state.id}</span>
        <p className="muted" style={{ fontSize: 14 }}>
          Two reviewers will run the inclusion test. The outcome is published either way.
        </p>
      </div>
    );
  }

  return (
    <form
      className="form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(
          [...new FormData(e.currentTarget)].filter(([, v]) => v !== "").map(([k, v]) => [k, String(v)])
        );
        const parsed = submissionSchema.safeParse(data);
        if (!parsed.success) return setErrors(parsed.error.flatten().fieldErrors);
        setErrors({});
        setState("sending");
        try {
          const res = await fetch(`${API}/submissions`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(parsed.data),
          });
          if (res.status === 422) {
            setErrors((await res.json()).error.fieldErrors);
            return setState("idle");
          }
          if (!res.ok) throw new Error(String(res.status));
          setState(await res.json());
        } catch {
          setState("failed");
        }
      }}
    >
      <fieldset className="fieldset">
        <legend>
          <span className="n">01</span>The Conflict
        </legend>
        <Field name="title" label="Title" errors={errors} placeholder="Erasure against append-only logs" />
        <Field name="statement" label="Statement" errors={errors} textarea min={40} />
        <div className="field">
          <label htmlFor="proposedShape">
            Shape
            <span className="req">Optional</span>
          </label>
          <select id="proposedShape" name="proposedShape" defaultValue="">
            <option value="">Unsure</option>
            {shapes.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.ordinal}. {s.name}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>
          <span className="n">02</span>Both Sides
        </legend>
        <div className="two">
          <Field name="legalCitation" label="Provision" errors={errors} placeholder="GDPR Art. 17(1)" />
          <Field name="legalUrl" label="Primary Source URL" errors={errors} type="url" placeholder="https://eur-lex.europa.eu/…" />
        </div>
        <Field name="architecturalProperty" label="Architectural Property" errors={errors} placeholder="Append-only integrity" />
      </fieldset>

      <fieldset className="fieldset">
        <legend>
          <span className="n">03</span>Inclusion Test
        </legend>
        <div className="checks">
          {INCLUSION_CRITERIA.map((c) => (
            <label className="check" key={c.key}>
              <input
                type="checkbox"
                checked={!!checks[c.key]}
                onChange={(e) => setChecks({ ...checks, [c.key]: e.target.checked })}
              />
              <span>
                <b>{c.label}</b>
                <span>{c.question}</span>
              </span>
            </label>
          ))}
        </div>
        <Field name="inclusionArgument" label="Why Unlimited Budget Fails" errors={errors} textarea min={80} />
      </fieldset>

      <fieldset className="fieldset">
        <legend>
          <span className="n">04</span>Attribution
        </legend>
        <div className="two">
          <Field name="submitterName" label="Name" errors={errors} />
          <Field name="submitterEmail" label="Email" errors={errors} type="email" />
        </div>
        <Field name="submitterAffiliation" label="Affiliation" errors={errors} optional />
      </fieldset>

      <div className="form-foot">
        <button className="btn-primary btn" type="submit" disabled={!allChecked || state === "sending"}>
          {state === "sending" ? "Sending" : "Submit Case"}
        </button>
        <span className="muted" style={{ fontSize: 12 }}>
          {allChecked ? "All five criteria affirmed" : `${INCLUSION_CRITERIA.filter((c) => checks[c.key]).length} / 5 criteria affirmed`}
        </span>
        {state === "failed" ? <span className="err" style={{ color: "var(--accent)", fontSize: 12 }}>API Unreachable</span> : null}
      </div>
    </form>
  );
}
