"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["/properties", "Properties"],
  ["/check", "Check"],
  ["/", "Cases"],
  ["/shapes", "Shapes"],
  ["/matrix", "Matrix"],
  ["/resolutions", "Resolutions"],
  ["/changes", "Changes"],
  ["/rejections", "Rejections"],
  ["/method", "Method"],
  ["/export", "Export"],
  ["/submit", "Submit"],
] as const;

export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Primary">
      {ITEMS.map(([href, label]) => {
        const on = href === "/" ? path === "/" || path.startsWith("/case/") : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={on ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
