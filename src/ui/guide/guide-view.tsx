"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Markdown } from "./markdown";
import { ThemeToggle } from "@/ui/theme/theme-toggle";
import { serializeGuide, serializeGuideToIcs, extractPhaseTasks, slugify } from "./serialize";
import { parseSSEStream } from "./chat-stream";
import {
  loadHistory,
  saveHistory,
  deleteHistoryEntry,
  HISTORY_LIMIT,
  type HistoryEntry,
} from "./history";
import type { StudyGuide } from "@/domain/guide/schemas";

const DONE_KEY = "compass:guide-done:";
const TASKS_KEY = "compass:guide-tasks:";

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

function tasksKey(goal: string): string {
  return TASKS_KEY + encodeURIComponent(goal);
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export function GuideView({ initialGoal = "" }: { initialGoal?: string }) {
  const [goal, setGoal] = useState(initialGoal);
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [tasksDone, setTasksDone] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // chat state
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      const rawTasks = localStorage.getItem(tasksKey(goal.trim()));
      if (rawTasks) setTasksDone(new Set(JSON.parse(rawTasks) as string[]));
    } catch {
      // ignore malformed stored state
    }
    setOpen(new Set([guide.phases[0]?.id].filter(Boolean) as string[]));
  }, [guide, goal]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const persist = (next: Set<string>) => {
    setDone(next);
    try {
      localStorage.setItem(doneKey(goal.trim()), JSON.stringify([...next]));
    } catch {
      // ignore quota/private-mode errors
    }
  };

  const persistTasks = (next: Set<string>) => {
    setTasksDone(next);
    try {
      localStorage.setItem(tasksKey(goal.trim()), JSON.stringify([...next]));
    } catch {
      // ignore quota/private-mode errors
    }
  };

  const toggleTask = (phaseId: string, taskIdx: number, totalTasks: number) => {
    const key = `${phaseId}:${taskIdx}`;
    const nextTasks = new Set(tasksDone);
    if (nextTasks.has(key)) {
      nextTasks.delete(key);
    } else {
      nextTasks.add(key);
    }
    persistTasks(nextTasks);

    let completedCount = 0;
    for (let i = 0; i < totalTasks; i++) {
      if (nextTasks.has(`${phaseId}:${i}`)) {
        completedCount++;
      }
    }

    const nextDone = new Set(done);
    if (completedCount === totalTasks && totalTasks > 0) {
      nextDone.add(phaseId);
    } else {
      nextDone.delete(phaseId);
    }
    persist(nextDone);
  };

  const toggleDone = (phaseId: string, phaseBody: string) => {
    const next = new Set(done);
    const isDone = next.has(phaseId);
    const nextTasks = new Set(tasksDone);
    const tasks = extractPhaseTasks(phaseBody);

    if (isDone) {
      next.delete(phaseId);
      tasks.forEach((_, i) => nextTasks.delete(`${phaseId}:${i}`));
    } else {
      next.add(phaseId);
      tasks.forEach((_, i) => nextTasks.add(`${phaseId}:${i}`));
    }

    persist(next);
    persistTasks(nextTasks);
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
    const text = inputValue.trim();
    if (!text) return;

    // if guide is active, this is a chat message
    if (guide) {
      await sendChat(text);
      return;
    }

    // otherwise, generate a guide
    const existing = history.find(
      (e) => e.goal.trim().toLowerCase() === text.toLowerCase(),
    );
    if (existing) {
      openHistory(existing);
      setInputValue("");
      return;
    }

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
      setInputValue("");
    }
  };

  const sendChat = async (text: string) => {
    const userMsg: ChatMsg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputValue("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, guide, messages: nextMessages }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Chat failed (${res.status})`);
      }

      if (!res.body) throw new Error("No response body");

      // start streaming
      let assistantContent = "";
      setMessages([...nextMessages, { role: "assistant", content: "" }]);

      for await (const chunk of parseSSEStream(res.body)) {
        assistantContent += chunk;
        setMessages([...nextMessages, { role: "assistant", content: assistantContent }]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Chat failed";
      setMessages([...nextMessages, { role: "assistant", content: `*Error: ${errorMsg}*` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const openHistory = (entry: HistoryEntry) => {
    setGoal(entry.goal);
    setGuide(entry.guide);
    setMessages([]);
    setInputValue("");
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

  const downloadCalendar = () => {
    if (!guide) return;
    const blob = new Blob([serializeGuideToIcs(goal, guide)], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(goal).replace(/\.md$/, "")}.ics`;
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
    setTasksDone(new Set());
    setOpen(new Set());
    setMessages([]);
    setInputValue("");
    setSidebarOpen(false);
  };

  const completedCount = guide ? guide.phases.filter((p) => done.has(p.id)).length : 0;
  const isChatMode = !!guide;

  const allTasks = guide
    ? guide.phases.flatMap((p) => {
        const tasks = extractPhaseTasks(p.body);
        return tasks.map((_, i) => `${p.id}:${i}`);
      })
    : [];

  const totalTaskCount = allTasks.length;
  const completedTaskCount = allTasks.filter((k) => tasksDone.has(k)).length;
  const totalPhases = guide ? guide.phases.length : 0;

  const overallPercent = totalTaskCount > 0
    ? Math.round((completedTaskCount / totalTaskCount) * 100)
    : totalPhases > 0
    ? Math.round((completedCount / totalPhases) * 100)
    : 0;

  return (
    <div className="guide-shell">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`guide-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <span>Guides</span>
          <div className="sidebar-head-actions">
            {history.length > 0 && (
              <button type="button" className="sidebar-clear" onClick={clearHistory}>
                Clear all
              </button>
            )}
            <button
              type="button"
              className="sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4L4 12M4 4l8 8" />
              </svg>
            </button>
          </div>
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
        <div className="guide-inner-content">
        <header className="guide-header">
          <div className="guide-header-top">
            <Link href="/" className="back-link">
              <span className="back-arrow">←</span>
              <span>Back</span>
            </Link>
            <div className="guide-header-controls">
              <ThemeToggle />
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
            </div>
          </div>
          <div className="guide-header-title">
            <h1>Study Guide</h1>
            <p className="guide-subtitle">
              Ask for a written guide and get a clear, personalized plan.
            </p>
          </div>
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
                <div className="guide-progress-labels">
                  <span>
                    {totalTaskCount > 0
                      ? `${completedTaskCount}/${totalTaskCount} tasks completed`
                      : `${completedCount}/${totalPhases} phases complete`}
                  </span>
                  <span className="progress-percent">{overallPercent}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${overallPercent}%` }}
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
                <button
                  type="button"
                  className="action-btn action-btn-primary"
                  onClick={downloadCalendar}
                  title="Export study schedule to Apple/Google Calendar"
                >
                  Calendar (.ics)
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
                const phaseTasks = extractPhaseTasks(phase.body);
                const phaseTasksCompleted = phaseTasks.filter((_, i) => tasksDone.has(`${phase.id}:${i}`)).length;
                const isPhaseDone = done.has(phase.id);
                const isOpen = open.has(phase.id);

                return (
                  <li key={phase.id} className={`phase ${isPhaseDone ? "phase-done" : ""}`}>
                    <div className="phase-head">
                      <button
                        type="button"
                        className={`phase-check ${isPhaseDone ? "checked" : ""}`}
                        onClick={() => toggleDone(phase.id, phase.body)}
                        aria-pressed={isPhaseDone}
                        aria-label={`Mark ${phase.title} complete`}
                      >
                        {isPhaseDone ? "✓" : ""}
                      </button>
                      <button type="button" className="phase-title" onClick={() => toggleOpen(phase.id)}>
                        {phase.title}
                      </button>
                      {phaseTasks.length > 0 && (
                        <span className="phase-task-badge">
                          {phaseTasksCompleted}/{phaseTasks.length} tasks
                        </span>
                      )}
                      {phase.duration && <span className="phase-duration">{phase.duration}</span>}
                      <button type="button" className="phase-chevron" onClick={() => toggleOpen(phase.id)}>
                        {isOpen ? "−" : "+"}
                      </button>
                    </div>
                    {isOpen && (
                      <div className="phase-body">
                        {phaseTasks.length > 0 ? (
                          <div className="phase-tasks-container">
                            <ul className="phase-task-list">
                              {phaseTasks.map((taskText, idx) => {
                                const taskKey = `${phase.id}:${idx}`;
                                const isTaskChecked = tasksDone.has(taskKey);
                                return (
                                  <li key={taskKey}>
                                    <label className={`phase-task-item ${isTaskChecked ? "checked" : ""}`}>
                                      <input
                                        type="checkbox"
                                        checked={isTaskChecked}
                                        onChange={() => toggleTask(phase.id, idx, phaseTasks.length)}
                                        className="task-checkbox-input"
                                      />
                                      <span className="task-checkbox-custom" aria-hidden="true">
                                        {isTaskChecked ? "✓" : ""}
                                      </span>
                                      <span className="task-text">{taskText}</span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : (
                          <Markdown>{phase.body}</Markdown>
                        )}

                        {phase.resources && phase.resources.length > 0 && (
                          <ul className="resource-list">
                            {phase.resources.map((resource) => (
                              <li className="resource" key={resource.name}>
                                <span className="resource-kind">{resource.kind}</span>
                                {resource.url ? (
                                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="resource-name resource-link">
                                    {resource.name}
                                  </a>
                                ) : (
                                  <span className="resource-name">{resource.name}</span>
                                )}
                                {resource.note && (
                                  <span className="resource-note">{resource.note}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
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

        {isChatMode && messages.length > 0 && (
          <div className="chat-thread">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg chat-${msg.role}`}>
                {msg.role === "assistant" ? (
                  <Markdown>{msg.content}</Markdown>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
            ))}
            {chatLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="chat-msg chat-assistant chat-thinking">Thinking…</div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
        </div>
        </div>

        <div className="guide-form-bar">
          <form className="guide-form" onSubmit={submit}>
            <input
              type="text"
              name="goal"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={
                isChatMode
                  ? "Ask about this guide…"
                  : 'e.g. "guide to become an ML engineer"'
              }
              autoComplete="off"
            />
            <button type="submit" className="submit-btn" disabled={loading || chatLoading} aria-label={isChatMode ? "Send message" : "Generate guide"}>
              {loading || chatLoading ? <span className="spinner" /> : (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8h10" />
                  <path d="M9 4l4 4-4 4" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
