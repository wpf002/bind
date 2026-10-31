import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap page" style={{ minHeight: "50vh", display: "grid", alignContent: "center", gap: 16 }}>
      <span className="case-id">404</span>
      <h1 className="case-title">No Published Entry</h1>
      <p className="muted">Cases held at the citation gate have no public page.</p>
      <div>
        <Link className="btn" href="/">
          All Cases
        </Link>
      </div>
    </div>
  );
}
