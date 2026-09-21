"use client";

import type { MapNodeData, MapNodeStatus } from "./types";

interface NodeDrawerProps {
  node: MapNodeData | null;
  status: MapNodeStatus;
  onSetStatus: (status: MapNodeStatus) => void;
}

const STATUS_OPTIONS: { value: MapNodeStatus; label: string }[] = [
  { value: "ready", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export function NodeDrawer({ node, status, onSetStatus }: NodeDrawerProps) {
  if (!node) {
    return (
      <aside className="drawer">
        <div className="drawer-empty">
          Select a node to see its purpose, prerequisites, resources, and project.
        </div>
      </aside>
    );
  }

  return (
    <aside className="drawer">
      <span className="dtype">{node.type}</span>
      <h2>{node.title}</h2>

      <section>
        <h3>Progress</h3>
        <div className="status-row">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${status === option.value ? "active" : ""} ${
                option.value === "completed" ? "completed" : ""
              }`}
              onClick={() => onSetStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {node.purpose && (
        <section>
          <h3>Purpose</h3>
          <p>{node.purpose}</p>
        </section>
      )}

      {node.difficulty && (
        <section>
          <h3>Estimated difficulty</h3>
          <p>{node.difficulty}</p>
        </section>
      )}

      {node.prerequisites && node.prerequisites.length > 0 && (
        <section>
          <h3>Prerequisites</h3>
          <ul>
            {node.prerequisites.map((prereq) => (
              <li key={prereq}>{prereq}</li>
            ))}
          </ul>
        </section>
      )}

      {node.subtopics && node.subtopics.length > 0 && (
        <section>
          <h3>You should learn</h3>
          <ul>
            {node.subtopics.map((subtopic) => (
              <li key={subtopic}>{subtopic}</li>
            ))}
          </ul>
        </section>
      )}

      {node.resources && node.resources.length > 0 && (
        <section>
          <h3>Recommended resources</h3>
          {node.resources.map((resource) => (
            <div className="resource" key={resource.title}>
              <span className="rtype">{resource.type}</span>
              <div className="rtitle">{resource.title}</div>
              <div className="rmeta">
                {resource.author && <span>{resource.author} · </span>}
                {resource.difficulty && <span>{resource.difficulty}</span>}
              </div>
              {resource.chapters && (
                <div className="rmeta">Focus: {resource.chapters}</div>
              )}
              {resource.why && <div className="rwhy">Why: {resource.why}</div>}
            </div>
          ))}
        </section>
      )}

      {node.project && (
        <section>
          <h3>Project</h3>
          <div className="resource">
            <span className="rtype">project</span>
            <div className="rtitle">{node.project.title}</div>
            <div className="rmeta">{node.project.brief}</div>
          </div>
        </section>
      )}

      {node.next && node.next.length > 0 && (
        <section>
          <h3>Next</h3>
          {node.next.map((title) => (
            <span className="badge" key={title}>
              {title}
            </span>
          ))}
        </section>
      )}
    </aside>
  );
}
