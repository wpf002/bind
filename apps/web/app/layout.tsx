import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { listCases, listShapes, previewDrafts, stats } from "@bind/db";
import { Nav } from "@/components/Nav";
import { ThemeToggle, themeScript } from "@/components/ThemeToggle";
import { CommandPalette, type PalItem } from "@/components/CommandPalette";
import { resLabel } from "@/lib/format";
import "./globals.css";

export const dynamic = "force-dynamic";

const newsreader = Newsreader({ subsets: ["latin"], variable: "--f-newsreader", style: ["normal", "italic"], weight: ["400", "500"] });
const plex = IBM_Plex_Sans({ subsets: ["latin"], variable: "--f-plex", weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--f-plex-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "Bind", template: "%s · Bind" },
  description: "A registry of legal–architectural incompatibilities.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [s, cases, shapes] = await Promise.all([stats(), listCases(), listShapes()]);
  const items: PalItem[] = [
    ...cases.map((c) => ({
      href: `/case/${c.slug}`,
      id: c.slug,
      label: c.title,
      meta: c.jurisdictions.join(" "),
      group: "Cases",
      keywords: [c.slug, c.corpusRef, c.title, c.statement, resLabel(c.resolvability), ...c.jurisdictions, ...c.instruments.map((i) => `${i.instrument.shortName} ${i.instrument.provision}`), ...c.shapes.map((x) => x.shape.name)].join(" ").toLowerCase(),
    })),
    ...shapes.map((sh) => ({
      href: `/shapes/${sh.slug}`,
      id: `Shape ${sh.ordinal}`,
      label: sh.name,
      meta: `${sh.published}`,
      group: "Shapes",
      keywords: `${sh.slug} ${sh.name} ${sh.definition} shape`.toLowerCase(),
    })),
  ];

  return (
    <html lang="en" className={`${newsreader.variable} ${plex.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {previewDrafts ? <div className="preview-bar">Draft Preview · Unverified Cases Visible</div> : null}
        <header className="mast">
          <div className="wrap mast-row">
            <Link href="/" className="brand" aria-label="Bind Home">
              <span className="brand-mark" aria-hidden>⊥</span>
              <span className="brand-name">Bind</span>
              <span className="brand-sub">Legal–Architectural Incompatibilities</span>
            </Link>
            <Nav />
            <div className="mast-tools">
              <CommandPalette items={items} />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="ledger">
          <div className="wrap ledger-row">
            <span><b>{s.published}</b> Published</span>
            <span className="ledger-sep" />
            <span><b>{s.held}</b> Held At Gate</span>
            <span className="ledger-sep" />
            <span><b>{s.shapes}</b> Shapes</span>
            <span className="ledger-sep" />
            <span><b>{s.rejections}</b> Rejected</span>
            <span className="ledger-sep" />
            <span><b>{s.changedSources}</b> Sources Changed</span>
            <span className="ledger-sep" />
            <span className="zero"><b>{s.resolvedBy.engineering}</b> Resolved By Engineering</span>
            <span className="ledger-end">Taxonomy v1 · Gate {s.published}/{s.gate}</span>
          </div>
        </div>
        <main>{children}</main>
        <footer className="foot">
          <div className="wrap foot-row">
            <span>Bind · Every case human-written and verified against a primary source.</span>
            <span>
              <Link href="/method">Method</Link> · <Link href="/export">BibTeX</Link> · <Link href="/rejections">Rejection Log</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
