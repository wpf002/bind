import Link from "next/link";
import { fmtDate, resLabel, resNote } from "@/lib/format";

export function Res({ r, short }: { r: string; short?: boolean }) {
  return (
    <span className={`res res-${r}`} data-tip={resNote(r)}>
      <span className="res-glyph" aria-hidden />
      {short ? null : resLabel(r)}
      {short ? <span className="sr">{resLabel(r)}</span> : null}
    </span>
  );
}

export function Jur({ code, link }: { code: string; link?: boolean }) {
  return link ? (
    <Link className="jur" href={`/?jurisdiction=${code}`}>
      {code}
    </Link>
  ) : (
    <span className="jur">{code}</span>
  );
}

export function Ord({ n, lg }: { n: number; lg?: boolean }) {
  return <span className={lg ? "ord ord-lg" : "ord"}>{n}</span>;
}

export function ShapeTag({ shape }: { shape: { slug: string; name: string; ordinal: number } }) {
  return (
    <Link className="shape-tag" href={`/shapes/${shape.slug}`}>
      <Ord n={shape.ordinal} />
      {shape.name}
    </Link>
  );
}

const VERIFY: Record<string, [string, string]> = {
  verified: ["chip-ok", "Verified"],
  corrected: ["chip-ok", "Corrected"],
  unverified: ["chip-warn", "Unverified"],
  disputed: ["chip-accent", "Disputed"],
};

export function Verify({ s }: { s: string }) {
  const [cls, label] = VERIFY[s] ?? ["chip-plain", s];
  return (
    <span className={`chip ${cls}`}>
      <span className="dot" aria-hidden />
      {label}
    </span>
  );
}

const SOURCE_CHECK: Record<string, [string, string, string]> = {
  current: ["mono muted", "Current", "Quote found at the source on this date"],
  changed: ["chip chip-accent", "Changed", "Quote no longer at the source on this date"],
  unreachable: ["mono muted", "Unreachable", "Source could not be read on this date"],
};

/** Result of the last re-fetch of a citation's source. Renders nothing for a citation never checked. */
export function SourceCheck({ status, at }: { status: string | null; at: Date | string | null }) {
  const [cls, label, tip] = (status ? SOURCE_CHECK[status] : undefined) ?? [];
  if (!label) return null;
  return (
    <span className={cls} data-tip={tip} tabIndex={0}>
      {label} {fmtDate(at)}
    </span>
  );
}

export function Tip({ text }: { text: string }) {
  return (
    <span className="tip-q" data-tip={text} tabIndex={0} aria-label={text}>
      ?
    </span>
  );
}
