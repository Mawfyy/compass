"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLES = [
  "I want to become an ML engineer. I know Python but my math is weak.",
  "I want to learn distributed systems from fundamentals.",
  "I want to learn Rust and systems programming.",
  "I want to learn cybersecurity from scratch.",
  "I want to learn computer graphics.",
];

export function Landing() {
  const router = useRouter();
  const [goal, setGoal] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const text = data.get("goal")?.toString().trim() ?? "";
    if (text) params.set("goal", text);
    params.set("level", data.get("level")?.toString() ?? "beginner");
    params.set("goalKind", data.get("goalKind")?.toString() ?? "career");
    params.set("depth", data.get("depth")?.toString() ?? "balanced");
    params.set("hours", data.get("hours")?.toString() ?? "10");
    router.push(`/map?${params.toString()}`);
  };

  return (
    <div className="landing">
      <h1>StudyGraph</h1>
      <p className="subtitle">
        Tell me what you want to learn, and I&apos;ll build you a visual map of
        the knowledge you need — in the order you should learn it, with
        resources and projects at every step.
      </p>
      <form className="prompt-card" onSubmit={submit}>
        <textarea
          name="goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="What do you want to learn?"
          autoFocus
        />
        <div className="chips">
          {EXAMPLES.map((example) => (
            <button
              type="button"
              key={example}
              className="chip"
              onClick={() => setGoal(example)}
            >
              {example}
            </button>
          ))}
        </div>
        <div className="structured">
          <div className="field">
            <label>Current level</label>
            <select name="level" defaultValue="beginner">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="field">
            <label>Goal</label>
            <select name="goalKind" defaultValue="career">
              <option value="career">Career</option>
              <option value="academic">Academic</option>
              <option value="hobby">Hobby</option>
              <option value="project">Project</option>
              <option value="deep-understanding">Deep Understanding</option>
            </select>
          </div>
          <div className="field">
            <label>Depth</label>
            <select name="depth" defaultValue="balanced">
              <option value="practical">Practical</option>
              <option value="balanced">Balanced</option>
              <option value="deep">Deep</option>
            </select>
          </div>
          <div className="field">
            <label>Hours per week</label>
            <select name="hours" defaultValue="10">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20+</option>
            </select>
          </div>
        </div>
        <button type="submit" className="primary-btn">
          Generate my learning map
        </button>
      </form>
    </div>
  );
}
