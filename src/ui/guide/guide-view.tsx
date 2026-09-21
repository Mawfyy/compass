"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Markdown } from "./markdown";
import { serializeGuide, slugify } from "./serialize";
import {
  loadHistory,
  saveHistory,
  deleteHistoryEntry,
  HISTORY_LIMIT,
  type HistoryEntry,
} from "./history";
import type { StudyGuide } from "@/domain/guide/schemas";

const DONE_KEY = "compass:guide-done:";

function GuideSkeleton() {
  return (
    <div className="guide-skeleton">
      <div className="skel-line skel-w80" />
      <div className="skel-line skel-w60" />
      <div className="skel-spacer" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div className="skel-row" key={i}>
          <div className="skel-circle" />
          <div className="skel-line skel-flex" />
          <div className="skel-line skel-w20" />
        </div>
      ))}
      <div className="skel-spacer" />
      <div className="skel-line skel-w40" />
      <div className="skel-line skel-w70" />
      <div className="skel-line skel-w50" />
    </div>
  );
}

function doneKey(goal: string): string {
  return DONE_KEY + encodeURIComponent(goal);
}

export function GuideView({ initialGoal = "" }: { initialGoal?: string }) {
  const [goal, setGoal] = useState(initialGoal);
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const entries = loadHistory();
    setHistory(entries);
    if (initialGoal.trim()) {
      const match = entries.find(
        (e) => e.goal.trim().toLowerCase() === initialGoal.trim().toLowerCase(),
      );
      if (match) setGuide(match.guide);
    }
  }, [initialGoal]);

  useEffect(() => {
    if (!guide) return;
    try {
      const raw = localStorage.getItem(doneKey(goal.trim()));
      if (raw) setDone(new Set(JSON.parse(raw) as string[]));
    } catch {
      // ignore malformed stored state
    }
    setOpen(new Set([guide.phases[0]?.id].filter(Boolean) as string[]));
  }, [guide, goal]);

  const persist = (next: Set<string>) => {
    setDone(next);
    try {
      localStorage.setItem(doneKey(goal.trim()), JSON.stringify([...next]));
    } catch {
      // ignore quota/private-mode errors
    }
  };

  const toggleDone = (id: string) => {
    const next = new Set(done);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    persist(next);
  };

  const toggleOpen = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addToHistory = (g: string, generated: StudyGuide) => {
    const entry: HistoryEntry = { goal: g, guide: generated, createdAt: Date.now() };
    const next = [
      entry,
      ...history.filter((e) => e.goal.toLowerCase() !== g.toLowerCase()),
    ].slice(0, HISTORY_LIMIT);
    setHistory(next);
    saveHistory(next);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = data.get("goal")?.toString().trim() ?? "";
    if (!text) return;

    setGoal(text);
    setLoading(true);
    setError(null);
    setGuide(null);
    setDone(new Set());
    setSidebarOpen(false);
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: text }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      const result = (await res.json()) as { guide?: StudyGuide };
      if (result.guide) {
        setGuide(result.guide);
        addToHistory(text, result.guide);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate guide");
    } finally {
      setLoading(false);
    }
  };

  const openHistory = (entry: HistoryEntry) => {
    setGoal(entry.goal);
    setGuide(entry.guide);
    setError(null);
    setSidebarOpen(false);
  };

  const copyGuide = async () => {
    if (!guide) return;
    try {
      await navigator.clipboard.writeText(serializeGuide(guide));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  const downloadGuide = () => {
    if (!guide) return;
    const blob = new Blob([serializeGuide(guide)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = slugify(goal);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const deleteEntry = (createdAt: number) => {
    deleteHistoryEntry(createdAt);
    setHistory(loadHistory());
  };

  const newGuide = () => {
    setGoal("");
    setGuide(null);
    setError(null);
    setDone(new Set());
    setOpen(new Set());
    setSidebarOpen(false);
  };

  const completedCount = guide ? guide.phases.filter((p) => done.has(p.id)).length : 0;

  return (
    <div className="guide-shell">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`guide-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <span>Guides</span>
          {history.length > 0 && (
            <button type="button" className="sidebar-clear" onClick={clearHistory}>
              Clear all
            </button>
          )}
        </div>
        <button type="button" className="sidebar-new" onClick={newGuide}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v10" />
            <path d="M3 8h10" />
          </svg>
          New guide
        </button>
        <ul className="sidebar-list">
          {history.map((entry) => (
            <li
              key={entry.createdAt}
              className={entry.goal.trim().toLowerCase() === goal.trim().toLowerCase() ? "active" : ""}
            >
              <button type="button" className="sidebar-item" onClick={() => openHistory(entry)}>
                {entry.goal}
              </button>
              <button
                type="button"
                className="sidebar-delete"
                onClick={(e) => { e.stopPropagation(); deleteEntry(entry.createdAt); }}
                aria-label={`Delete ${entry.goal}`}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 4h10" />
                  <path d="M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" />
                  <path d="M4.5 4l.5 9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-9" />
                </svg>
              </button>
            </li>
          ))}
          {history.length === 0 && (
            <li className="sidebar-empty">No guides yet</li>
          )}
        </ul>
      </aside>

      <div className="guide-main">
        <div className="guide-inner">
        <header className="guide-header">
          <Link href="/" className="back-link">← Back</Link>
          <div>
            <h1>Study Guide</h1>
            <p className="guide-subtitle">
              Ask for a written guide and get a clear, personalized plan.
            </p>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle guides sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </svg>
          </button>
        </header>

        {error && <div className="guide-error">{error}</div>}

        {!guide && !loading && (
          <div className="guide-empty">
            <p>Generate a guide to get started.</p>
          </div>
        )}

        {loading && !guide && <GuideSkeleton />}

        {guide && (
          <div className="guide-result">
            <div className="guide-actions">
              <div className="guide-progress">
                <span>
                  {completedCount}/{guide.phases.length} phases complete
                </span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(completedCount / guide.phases.length) * 100}%` }}
                  />
                </div>
              </div>
              <div className="guide-action-buttons">
                <button type="button" className="action-btn" onClick={copyGuide}>
                  {copied ? "Copied" : "Copy"}
                </button>
                <button type="button" className="action-btn" onClick={downloadGuide}>
                  Download
                </button>
              </div>
            </div>

            <div className="guide-intro">
              <Markdown>{guide.intro}</Markdown>
            </div>

            {guide.prerequisites && (
              <div className="guide-prereq">
                <span className="prereq-label">Prerequisites</span>
                <Markdown>{guide.prerequisites}</Markdown>
              </div>
            )}

            <ol className="guide-phases">
              {guide.phases.map((phase) => {
                const isOpen = open.has(phase.id);
                return (
                  <li key={phase.id} className={`phase ${done.has(phase.id) ? "phase-done" : ""}`}>
                    <div className="phase-head">
                      <button
                        type="button"
                        className={`phase-check ${done.has(phase.id) ? "checked" : ""}`}
                        onClick={() => toggleDone(phase.id)}
                        aria-pressed={done.has(phase.id)}
                        aria-label={`Mark ${phase.title} complete`}
                      >
                        {done.has(phase.id) ? "✓" : ""}
                      </button>
                      <button type="button" className="phase-title" onClick={() => toggleOpen(phase.id)}>
                        {phase.title}
                      </button>
                      {phase.duration && <span className="phase-duration">{phase.duration}</span>}
                      <button type="button" className="phase-chevron" onClick={() => toggleOpen(phase.id)}>
                        {isOpen ? "−" : "+"}
                      </button>
                    </div>
                    {isOpen && (
                      <div className="phase-body">
                        <Markdown>{phase.body}</Markdown>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="guide-milestones">
              <h2>Suggested milestones</h2>
              <Markdown>{guide.milestones}</Markdown>
            </div>
          </div>
        )}
        </div>

        <div className="guide-form-bar">
          <form className="guide-form" onSubmit={submit}>
            <textarea
              name="goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder={'e.g. "guide to become an ML engineer"'}
            />
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Writing your guide…" : "Generate guide"}
              {!loading && <span className="btn-arrow">→</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
