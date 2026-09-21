"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NODE_TYPE_COLORS, type FlowNode } from "./graph";

export function MapNode({ data, selected }: NodeProps<FlowNode>) {
  const color = NODE_TYPE_COLORS[data.nodeType];
  return (
    <div
      className={`map-node ${data.status === "completed" ? "completed" : ""} ${
        data.status === "locked" ? "locked" : ""
      } ${selected ? "selected" : ""}`}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div className="map-node-head">
        <span className="map-node-dot" style={{ background: color }} />
        <span className="map-node-title">{data.title}</span>
        {data.childCount > 0 && (
          <button
            type="button"
            className="map-node-toggle"
            title={data.expanded ? "Collapse" : "Expand"}
            onClick={(event) => {
              event.stopPropagation();
              data.toggleExpand();
            }}
          >
            {data.expanded ? "\u2212" : "+"}
          </button>
        )}
      </div>
      <div className="map-node-meta">
        <span className="map-node-type">{data.nodeType}</span>
        {data.status !== "ready" && (
          <span className={`map-node-status ${data.status}`}>
            {data.status.replace("_", " ")}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}
