import type { Edge, Node } from "@xyflow/react";
import type { MapNodeData, MapNodeStatus, MapNodeType } from "./types";

export interface FlowNodeData extends Record<string, unknown> {
  title: string;
  nodeType: MapNodeType;
  status: MapNodeStatus;
  expanded: boolean;
  childCount: number;
  toggleExpand: () => void;
}

export type FlowNode = Node<FlowNodeData, "map">;

const VERTICAL_GAP = 150;
const HORIZONTAL_GAP = 250;

export function flattenMap(root: MapNodeData): Map<string, MapNodeData> {
  const map = new Map<string, MapNodeData>();
  const walk = (node: MapNodeData) => {
    map.set(node.id, node);
    node.children?.forEach(walk);
  };
  walk(root);
  return map;
}

export function buildFlow(
  root: MapNodeData,
  expanded: Set<string>,
  statuses: Record<string, MapNodeStatus>,
  toggleExpand: (id: string) => void,
): { nodes: FlowNode[]; edges: Edge[] } {
  const byDepth = new Map<number, FlowNode[]>();
  const edgeList: Edge[] = [];
  const visibleIds = new Set<string>();

  const visit = (node: MapNodeData, depth: number) => {
    visibleIds.add(node.id);
    const isExpanded = expanded.has(node.id);
    const flowNode: FlowNode = {
      id: node.id,
      type: "map",
      position: { x: 0, y: depth * VERTICAL_GAP },
      data: {
        title: node.title,
        nodeType: node.type,
        status: statuses[node.id] ?? "ready",
        expanded: isExpanded,
        childCount: node.children?.length ?? 0,
        toggleExpand: () => toggleExpand(node.id),
      },
    };
    const row = byDepth.get(depth) ?? [];
    row.push(flowNode);
    byDepth.set(depth, row);

    if (isExpanded && node.children) {
      for (const child of node.children) {
        edgeList.push({
          id: `part:${node.id}:${child.id}`,
          source: node.id,
          target: child.id,
          type: "smoothstep",
        });
        visit(child, depth + 1);
      }
    }
  };

  visit(root, 0);

  // Center each depth row horizontally.
  for (const [depth, row] of byDepth) {
    const total = row.length;
    row.forEach((node, index) => {
      node.position = {
        x: (index - (total - 1) / 2) * HORIZONTAL_GAP,
        y: depth * VERTICAL_GAP,
      };
    });
  }

  const nodes = [...byDepth.values()].flat();

  // Add prerequisite (cross-cutting dependency) edges between visible nodes.
  const all = flattenMap(root);
  for (const id of visibleIds) {
    const node = all.get(id);
    for (const prereqId of node?.prerequisites ?? []) {
      if (visibleIds.has(prereqId) && prereqId !== id) {
        edgeList.push({
          id: `prereq:${prereqId}:${id}`,
          source: prereqId,
          target: id,
          type: "smoothstep",
          className: "react-flow__edge--prereq",
        });
      }
    }
  }

  return { nodes, edges: edgeList };
}

export const NODE_TYPE_COLORS: Record<MapNodeType, string> = {
  goal: "#e8b33b",
  area: "#4f8cff",
  topic: "#9d6bff",
  subtopic: "#34c77b",
  skill: "#4aa8d8",
  concept: "#4aa8d8",
  tool: "#6c7a93",
  project: "#ff7a45",
  milestone: "#34c77b",
  course: "#5b8def",
  reading: "#b481ff",
  exercise: "#35c9a1",
  "case-study": "#e07a9b",
  certification: "#e8b33b",
};
