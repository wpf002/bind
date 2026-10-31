"use client";
import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

export function DownloadButton({ text, filename, label = "Download" }: { text: string; filename: string; label?: string }) {
  return (
    <button
      type="button"
      className="btn"
      onClick={() => {
        const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
        const a = Object.assign(document.createElement("a"), { href: url, download: filename });
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      {label}
    </button>
  );
}
