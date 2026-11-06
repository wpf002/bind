"use client";

export function ThemeToggle() {
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label="Toggle Theme"
      onClick={() => {
        const root = document.documentElement;
        const dark =
          root.dataset.theme === "dark" ||
          (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
        root.dataset.theme = dark ? "light" : "dark";
        try {
          localStorage.setItem("bind-theme", root.dataset.theme);
        } catch (error) {
          // Storage can be blocked or full. The theme still applies to this page view.
          console.warn("Theme preference not saved", error);
        }
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 1a6 6 0 0 1 0 12z" fill="currentColor" />
      </svg>
    </button>
  );
}

export const themeScript = `try{var t=localStorage.getItem("bind-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;
