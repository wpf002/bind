"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export type PalItem = { href: string; id: string; label: string; meta: string; group: string; keywords: string };

export function CommandPalette({ items }: { items: PalItem[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !open && !(e.target as HTMLElement).closest("input,textarea,select")) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items.slice(0, 40);
    const terms = t.split(/\s+/);
    return items.filter((i) => terms.every((w) => i.keywords.includes(w))).slice(0, 40);
  }, [q, items]);

  const go = (i?: PalItem) => {
    if (!i) return;
    setOpen(false);
    router.push(i.href);
  };

  let lastGroup = "";
  return (
    <>
      <button type="button" className="kbd-btn" onClick={() => setOpen(true)} aria-label="Search The Registry">
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 8l3 3" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span className="lbl">Find Case</span>
        <kbd>⌘K</kbd>
      </button>
      {open ? (
        <div className="pal-scrim" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="pal" role="dialog" aria-label="Find">
            <div className="pal-input">
              <span className="id muted">⊥</span>
              <input
                ref={input}
                value={q}
                placeholder="bind-0004, Article 17, append-only…"
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSel((s) => Math.min(s + 1, results.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSel((s) => Math.max(s - 1, 0));
                  } else if (e.key === "Enter") go(results[sel]);
                }}
              />
            </div>
            <ul className="pal-list" role="listbox">
              {results.length === 0 ? <li className="pal-group muted">No Matches</li> : null}
              {results.map((r, i) => {
                const head = r.group !== lastGroup ? (lastGroup = r.group) : null;
                return (
                  <li key={r.href} role="none">
                    {head ? <div className="pal-group eyebrow">{head}</div> : null}
                    <div
                      className="pal-item"
                      role="option"
                      aria-selected={i === sel}
                      onMouseEnter={() => setSel(i)}
                      onClick={() => go(r)}
                    >
                      <span className="id">{r.id}</span>
                      <span>{r.label}</span>
                      <span className="muted mono">{r.meta}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="pal-foot">
              <span><kbd>↑</kbd> <kbd>↓</kbd> Move</span>
              <span><kbd>↵</kbd> Open</span>
              <span><kbd>Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
