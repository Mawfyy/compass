"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadHistory, type HistoryEntry } from "./guide/history";

const EXAMPLES = [
  "Mastering Python for Data Science",
  "I want to become an ML engineer. I know Python but my math is weak.",
  "I want to learn distributed systems from fundamentals.",
  "I want to learn Rust and systems programming.",
  "Building a mobile app",
];

export function Landing() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [recent, setRecent] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setRecent(loadHistory());
  }, []);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = data.get("goal")?.toString().trim() ?? "";
    if (!text) return;
    router.push(`/guide?goal=${encodeURIComponent(text)}`);
  };

  const openRecent = (entry: HistoryEntry) => {
    router.push(`/guide?goal=${encodeURIComponent(entry.goal)}`);
  };

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
        <a href="/guide" className="lw-login">Log In</a>
      </header>

      <main className="lw-main">
        <section className="lw-hero">
          <h1 className="lw-headline">
            A personalized <em>Learning Path</em>
            <br />
            and your definitive <em>Study Guide</em>
          </h1>
          <p className="lw-subtitle">
            Describe your destination, and let Compass map your journey to knowledge.
          </p>

          <form className="lw-card" onSubmit={submit}>
            <div className="lw-input-row">
              <input
                type="text"
                name="goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder='e.g., "Mastering Python for Data Science"'
                autoFocus
              />
              <button type="submit" className="lw-cta">
                Map My Goal
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="lw-chips">
              {EXAMPLES.map((example) => (
                <button
                  type="button"
                  key={example}
                  className="lw-chip"
                  onClick={() => setGoal(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </form>
        </section>

        {recent.length > 0 && (
          <aside className="lw-recent">
            <span className="lw-recent-head">Recent guides</span>
            <ul className="lw-recent-list">
              {recent.map((entry) => (
                <li key={entry.createdAt}>
                  <button type="button" onClick={() => openRecent(entry)}>
                    <span className="lw-recent-goal">{entry.goal}</span>
                    <span className="lw-recent-arrow" aria-hidden="true">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </main>

      <footer className="lw-footer">
        <span>Compass — build clarity into what you learn</span>
        <span className="lw-footer-muted">Powered by AI</span>
      </footer>
    </div>
  );
}