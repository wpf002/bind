"use client";
import { useState } from "react";
import { DESIGN_NOTE_FILENAME } from "@bind/core";

const COPIED_FOR_MS = 2000;

/** Copy Note puts the API's Markdown note on the clipboard; without a clipboard it opens the note instead. */
export function NoteActions({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const clipboard = navigator.clipboard;
    if (!clipboard?.writeText) return window.open(href, "_blank", "noopener");
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error(`GET ${href} answered ${res.status}`);
      await clipboard.writeText(await res.text());
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FOR_MS);
    } catch {
      window.open(href, "_blank", "noopener");
    }
  };

  return (
    <div className="page-actions">
      <button type="button" className="btn" onClick={copy}>
        {copied ? "Copied" : "Copy Note"}
      </button>
      <a className="btn" href={href} download={DESIGN_NOTE_FILENAME}>
        Download
      </a>
    </div>
  );
}
