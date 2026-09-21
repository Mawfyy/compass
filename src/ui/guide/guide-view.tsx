"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Markdown } from "./markdown";
import { serializeGuide, slugify } from "./serialize";
import {
  loadHistory,
  saveHistory,
  HISTORY_LIMIT,
  type HistoryEntry,
} from "./history";
import type { StudyGuide } from "@/domain/guide/schemas";

const DONE_KEY = "compass:guide-done:";

function doneKey(goal: string): string {
  return DONE_KEY + encodeURIComponent(goal);
}

export function GuideView({ initialGoal = "" }: { initialGoal?: string }) {
  const router = useRouter();
  const [goal, setGoal] = useState(initialGoal);
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState(false);

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

  const openAsMap = () => {
    if (!goal.trim()) return;
    const params = new URLSearchParams();
    params.set("goal", goal.trim());
    router.push(`/map?${params.toString()}`);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const completedCount = guide ? guide.phases.filter((p) => done.has(p.id)).length : 0;

  return (
    <div className="guide-shell">
      <div className="guide-inner">
      <header className="guide-header">
        <Link href="/" className="back-link">← Back</Link>
        <div>
          <h1>Study Guide</h1>
          <p className="guide-subtitle">
            Ask for a written guide and get a clear, ordered plan — in plain text.
          </p>
        </div>
      </header>

      <form className="guide-form" onSubmit={submit}>
        <textarea
          name="goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder={'e.g. "guide to become an ML engineer"'}
          autoFocus
        />
        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Writing your guide…" : "Generate guide"}
          {!loading && <span className="btn-arrow">→</span>}
        </button>
      </form>

      {error && <div className="guide-error">{error}</div>}

      {!guide && !loading && history.length > 0 && (
        <div className="guide-history">
          <div className="history-head">
            <span>Recent guides</span>
            <button type="button" className="history-clear" onClick={clearHistory}>
              Clear
            </button>
          </div>
          <ul>
            {history.map((entry) => (
              <li key={entry.createdAt}>
                <button type="button" onClick={() => openHistory(entry)}>
                  {entry.goal}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

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
              <button type="button" className="action-btn action-btn-primary" onClick={openAsMap}>
                Open as map
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
    </div>
  );
}