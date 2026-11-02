import { hasEdge, hasVertex } from './structures/graph.js'

// Phần hiển thị dùng chung cho BFS và DFS: cạnh cây suy từ parentIds của bước đang hiển thị.
// File này KHÔNG import src/graph.js (graph.js import các file view) để tránh vòng import.

// Cạnh cây: (parent[w], w) khi cả hai đỉnh và cạnh đều có trong đồ thị của bước.
export function treeEdges(step) {
  const { graph } = step
  return Object.entries(step.parentIds ?? {})
    .filter(([childId, parentId]) => parentId !== null && hasVertex(graph, childId) && hasEdge(graph, parentId, childId))
    .map(([childId, parentId]) => ({ from: parentId, to: childId }))
}

// edge là cạnh của layout ({ from, to }); vô hướng khớp cả hai chiều, có hướng chỉ khớp chiều parent → con.
export function isTreeEdge(step, edge) {
  return treeEdges(step).some(({ from, to }) => (
    (from === edge.from && to === edge.to) || (!step.graph.directed && from === edge.to && to === edge.from)
  ))
}
