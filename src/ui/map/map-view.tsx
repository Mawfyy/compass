"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  type OnNodesChange,
  type OnEdgesChange,
  type Edge,
} from "@xyflow/react";
import { SAMPLE_MAP } from "./sample-map";
import { buildFlow, flattenMap, type FlowNode } from "./graph";
import { MapNode } from "./nodes";
import { NodeDrawer } from "./drawer";
import type { MapNodeData, MapNodeStatus } from "./types";

const nodeTypes = { map: MapNode };

interface MapViewProps {
  goal: string;
  level?: string;
  goalKind?: string;
  depth?: string;
  hours?: string;
}

export function MapView({ goal, level, goalKind, depth, hours }: MapViewProps) {
  const [mapData, setMapData] = useState<MapNodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Record<string, MapNodeStatus>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/map", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal: goal.trim() || "Learn something new",
            level: level ?? "beginner",
            goalKind: goalKind ?? "career",
            depth: depth ?? "balanced",
            hoursPerWeek: hours ? Number(hours) : 10,
          }),
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = (await res.json()) as { map?: { root?: MapNodeData } };
        if (cancelled) return;
        const root = data.map?.root;
        setMapData(root ?? SAMPLE_MAP);
        const id = root?.id ?? SAMPLE_MAP.id;
        setExpanded(new Set([id]));
        setSelectedId(id);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load map");
        setMapData(SAMPLE_MAP);
        setExpanded(new Set([SAMPLE_MAP.id]));
        setSelectedId(SAMPLE_MAP.id);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [goal, level, goalKind, depth, hours]);

  const dataIndex = useMemo(
    () => (mapData ? flattenMap(mapData) : new Map<string, MapNodeData>()),
    [mapData],
  );

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const built = useMemo(
    () =>
      mapData
        ? buildFlow(mapData, expanded, statuses, toggleExpand)
        : { nodes: [] as FlowNode[], edges: [] as Edge[] },
    [mapData, expanded, statuses, toggleExpand],
  );

  useEffect(() => {
    setNodes(built.nodes);
    setEdges(built.edges);
  }, [built]);

  const onNodesChange: OnNodesChange<FlowNode> = (changes) => {
    setNodes((prev) => applyNodeChanges(changes, prev));
  };
  const onEdgesChange: OnEdgesChange = (changes) => {
    setEdges((prev) => applyEdgeChanges(changes, prev));
  };

  const selectedNode = selectedId ? (dataIndex.get(selectedId) ?? null) : null;

  const setStatus = (id: string) => (status: MapNodeStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  };

  return (
    <div className="map-shell">
      <div className="map-main">
        <div className="map-topbar">
          <span className="goal">{mapData?.title ?? goal ?? "Learning Map"}</span>
          <span className="hint">
            Click a node for details · use + / − to expand branches · drag to
            pan · scroll to zoom
          </span>
        </div>
        {loading ? (
          <div className="map-loading">Building your map…</div>
        ) : (
          <>
            {error && <div className="map-error">Using a sample map: {error}</div>}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_, node) => setSelectedId(node.id)}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              defaultEdgeOptions={{ style: { stroke: "#3a4152", strokeWidth: 2 } }}
              proOptions={{ hideAttribution: true }}
              minZoom={0.2}
              maxZoom={2}
            >
              <Background color="#1d2230" gap={24} />
              <Controls />
              <MiniMap
                pannable
                zoomable
                maskColor="rgba(15, 17, 21, 0.7)"
                nodeColor={() => "#3a4152"}
              />
            </ReactFlow>
          </>
        )}
      </div>
      <NodeDrawer
        node={selectedNode}
        status={selectedId ? (statuses[selectedId] ?? "ready") : "ready"}
        onSetStatus={selectedId ? setStatus(selectedId) : () => undefined}
      />
    </div>
  );
}
