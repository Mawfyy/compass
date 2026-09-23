"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/ui/theme/theme-toggle";

export function WarmShell({
  children,
  active,
}: {
  children: ReactNode;
  active?: "why" | "how";
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="lw-root">
      <div className="lw-texture" aria-hidden="true" />

      <header className="lw-nav">
        <Link href="/" className="lw-brand" onClick={() => setMenuOpen(false)}>
          <span className="lw-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
            </svg>
          </span>
          <span className="lw-brand-name">Compass</span>
        </Link>

        <div className="lw-nav-actions">
          <nav className={`lw-nav-links ${menuOpen ? "is-open" : ""}`}>
            <Link
              href="/why"
              className={active === "why" ? "is-active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              Why Compass
            </Link>
            <Link
              href="/how"
              className={active === "how" ? "is-active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              How it works
            </Link>
            <Link
              href="/guide"
              className="lw-nav-cta-mobile"
              onClick={() => setMenuOpen(false)}
            >
              Get started →
            </Link>
          </nav>
          <ThemeToggle />
          <button
            type="button"
            className="lw-menu-toggle"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {children}

      <footer className="lw-footer">
        <span className="lw-footer-muted">made by mawfy with &lt;3</span>
      </footer>
    </div>
  );
}