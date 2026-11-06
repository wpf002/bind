"use client";
import { useState } from "react";
import { buildSubmissionSchema, SUBMISSION_TEXT_MIN, suggestSubmissionTitle } from "@bind/shared";
import { INCLUSION_CRITERIA } from "@bind/core";
import { API_URL } from "@/lib/api";

export type PropertyOption = { slug: string; name: string };
export type JurisdictionOption = { code: string; name: string };
/** Error messages keyed by field path, `requiredBy.url` for the nested rules. */
type Errors = Record<string, string>;

const field = (prefix: string, key: string) => `${prefix}.${key}`;

function Field(props: {
  name: string;
  label: string;
  errors: Errors;
  textarea?: boolean;
  min?: number;
  optional?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [len, setLen] = useState(0);
  const err = props.errors[props.name];
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
        type={props.textarea ? undefined : (props.type ?? "text")}
        placeholder={props.placeholder}
        title={props.hint}
        aria-invalid={!!err}
        value={props.value}
        onChange={(e) => {
          setLen(e.currentTarget.value.length);
          props.onChange?.(e.currentTarget.value);
        }}
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

/** A rule as citation and primary source, side by side. */
function RuleFields(props: { prefix: string; label: string; hint: string; errors: Errors }) {
  return (
    <div className="two">
      <Field name={field(props.prefix, "citation")} label={`${props.label} Provision`} errors={props.errors} placeholder="GDPR Art. 17(1)" hint={props.hint} />
      <Field
        name={field(props.prefix, "url")}
        label={`${props.label} Source URL`}
        errors={props.errors}
        type="url"
        placeholder="https://eur-lex.europa.eu/…"
        hint="Primary source: EUR-Lex, eCFR, CourtListener or an official gazette."
      />
    </div>
  );
}

function readForm(form: HTMLFormElement) {
  const data = new FormData(form);
  const text = (name: string) => String(data.get(name) ?? "");
  const rule = (prefix: string) => ({ citation: text(field(prefix, "citation")), url: text(field(prefix, "url")) });
  const affiliation = text("submitterAffiliation");
  return {
    title: text("title"),
    building: text("building"),
    property: text("property"),
    jurisdictions: data.getAll("jurisdictions").map(String),
    requiredBy: rule("requiredBy"),
    blockedBy: rule("blockedBy"),
    workaround: text("workaround"),
    submitterName: text("submitterName"),
    submitterEmail: text("submitterEmail"),
    submitterAffiliation: affiliation === "" ? undefined : affiliation,
  };
}

/** Zod issues by field path. The API's 422 carries flattened field errors, keyed by top-level field. */
const byPath = (issues: { path: (string | number)[]; message: string }[]): Errors =>
  Object.fromEntries(issues.map((i) => [i.path.join("."), i.message]).reverse());
const byField = (fieldErrors: Record<string, string[] | undefined>): Errors =>
  Object.fromEntries(Object.entries(fieldErrors).flatMap(([k, v]) => (v?.[0] ? [[k, v[0]]] : [])));

export function SubmitForm({ properties, jurisdictions }: { properties: PropertyOption[]; jurisdictions: JurisdictionOption[] }) {
  const schema = buildSubmissionSchema({ properties: properties.map((p) => p.slug), jurisdictions: jurisdictions.map((j) => j.code) });
  const [errors, setErrors] = useState<Errors>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [property, setProperty] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [ownTitle, setOwnTitle] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "failed" | { id: string }>("idle");
  const allChecked = INCLUSION_CRITERIA.every((c) => checks[c.key]);
  const affirmed = INCLUSION_CRITERIA.filter((c) => checks[c.key]).length;

  const propertyName = properties.find((p) => p.slug === property)?.name;
  const suggested = suggestSubmissionTitle(
    propertyName,
    jurisdictions.filter((j) => picked.includes(j.code)).map((j) => j.name),
  );
  const title = ownTitle === "" ? suggested : ownTitle;
  // Fields the form has no slot for, such as a whole rule the API refused.
  const fieldless = Object.entries(errors).filter(([k]) => ["requiredBy", "blockedBy"].includes(k));

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
        const parsed = schema.safeParse(readForm(e.currentTarget));
        if (!parsed.success) return setErrors(byPath(parsed.error.issues));
        setErrors({});
        setState("sending");
        try {
          const res = await fetch(`${API_URL}/submissions`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(parsed.data),
          });
          if (res.status === 422) {
            setErrors(byField((await res.json()).error.fieldErrors));
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
          <span className="n">01</span>The Design
        </legend>
        <Field
          name="building"
          label="Building"
          errors={errors}
          textarea
          min={SUBMISSION_TEXT_MIN}
          placeholder="A hash-chained audit log for a payments ledger. No record is rewritten or removed."
          hint="The system and the architectural choice it depends on."
        />
        <div className="field">
          <label htmlFor="property">
            Property
            <span className="req">Required</span>
          </label>
          <select
            id="property"
            name="property"
            value={property}
            aria-invalid={!!errors.property}
            title="The property the design relies on."
            onChange={(e) => setProperty(e.target.value)}
          >
            <option value="" disabled>
              Choose
            </option>
            {properties.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.property ? <span className="err">{errors.property}</span> : null}
        </div>
        <div className="field">
          <span className="field-label">
            Jurisdictions
            <span className="req">Required</span>
          </span>
          <div className="jur-picks" title="Where the design runs.">
            {jurisdictions.map((j) => (
              <label className="jur-pick" key={j.code}>
                <input
                  type="checkbox"
                  name="jurisdictions"
                  value={j.code}
                  checked={picked.includes(j.code)}
                  onChange={(e) => setPicked(e.target.checked ? [...picked, j.code] : picked.filter((c) => c !== j.code))}
                />
                <span className="jur">{j.code}</span>
                <span>{j.name}</span>
              </label>
            ))}
          </div>
          {errors.jurisdictions ? <span className="err">{errors.jurisdictions}</span> : null}
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>
          <span className="n">02</span>Both Rules
        </legend>
        <RuleFields prefix="requiredBy" label="Required By" hint="The rule that forces the choice." errors={errors} />
        <RuleFields prefix="blockedBy" label="Blocked By" hint="The rule that forbids the choice." errors={errors} />
      </fieldset>

      <fieldset className="fieldset">
        <legend>
          <span className="n">03</span>The Case
        </legend>
        <Field
          name="workaround"
          label="Workaround"
          errors={errors}
          textarea
          min={SUBMISSION_TEXT_MIN}
          placeholder="Tombstoning keeps the chain but leaves the ciphertext the erasure order covers."
          hint="What you tried or considered, and why it fails."
        />
        <Field name="title" label="Title" errors={errors} value={title} onChange={setOwnTitle} hint="Suggested from the property and jurisdictions. Edit it." />
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

      <fieldset className="fieldset">
        <legend>
          <span className="n">05</span>Inclusion Test
        </legend>
        <div className="checks">
          {INCLUSION_CRITERIA.map((c) => (
            <label className="check" key={c.key}>
              <input type="checkbox" checked={!!checks[c.key]} onChange={(e) => setChecks({ ...checks, [c.key]: e.target.checked })} />
              <span>
                <b>{c.label}</b>
                <span>{c.question}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-foot">
        <button className="btn-primary btn" type="submit" disabled={!allChecked || state === "sending"}>
          {state === "sending" ? "Sending" : "Submit Case"}
        </button>
        <span className="muted" style={{ fontSize: 12 }}>
          {allChecked ? "All five criteria affirmed" : `${affirmed} / ${INCLUSION_CRITERIA.length} criteria affirmed`}
        </span>
        {fieldless.map(([k, message]) => (
          <span key={k} className="err" style={{ color: "var(--accent)", fontSize: 12 }}>
            {message}
          </span>
        ))}
        {state === "failed" ? <span className="err" style={{ color: "var(--accent)", fontSize: 12 }}>API Unreachable</span> : null}
      </div>
    </form>
  );
}
