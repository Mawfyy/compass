import Link from "next/link";

export function Landing() {
  return (
    <div className="lw-root">
      <div className="lw-texture" aria-hidden="true" />

      <header className="lw-nav">
        <div className="lw-brand">
          <span className="lw-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
            </svg>
          </span>
          <span className="lw-brand-name">Compass</span>
        </div>
        <nav className="lw-nav-links">
          <Link href="/why">Why Compass</Link>
          <Link href="/how">How it works</Link>
        </nav>
      </header>

      <main className="lw-main">
        <section className="lw-hero">
          <h1 className="lw-headline">
            A personalized <em>Study Guide</em>
            <br />
            tailored to your goals
          </h1>
          <p className="lw-subtitle">
            Describe your destination, and let Compass write a clear, ordered plan to get there.
          </p>

          <Link href="/guide" className="lw-cta">
            Get started
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>

      <footer className="lw-footer">
        <span>Compass — build clarity into what you learn</span>
        <span className="lw-footer-muted">Powered by AI</span>
      </footer>
    </div>
  );
}
