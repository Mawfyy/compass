import type { ReactNode } from "react";
import Link from "next/link";

export function WarmShell({
  children,
  active,
}: {
  children: ReactNode;
  active?: "why" | "how";
}) {
  return (
    <div className="lw-root">
      <div className="lw-texture" aria-hidden="true" />

      <header className="lw-nav">
        <Link href="/" className="lw-brand">
          <span className="lw-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
            </svg>
          </span>
          <span className="lw-brand-name">Compass</span>
        </Link>
        <nav className="lw-nav-links">
          <Link href="/why" className={active === "why" ? "is-active" : ""}>Why Compass</Link>
          <Link href="/how" className={active === "how" ? "is-active" : ""}>How it works</Link>
        </nav>
      </header>

      {children}

      <footer className="lw-footer">
        <span>Compass — build clarity into what you learn</span>
        <span className="lw-footer-muted">Powered by AI</span>
      </footer>
    </div>
  );
}