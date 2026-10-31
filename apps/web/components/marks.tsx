import Link from "next/link";
import { resLabel, resNote } from "@/lib/format";

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

export function Tip({ text }: { text: string }) {
  return (
    <span className="tip-q" data-tip={text} tabIndex={0} aria-label={text}>
      ?
    </span>
  );
}
