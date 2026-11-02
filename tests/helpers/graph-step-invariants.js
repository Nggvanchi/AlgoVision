import assert from 'node:assert/strict'
import { hasEdge, hasVertex } from '../../src/structures/graph.js'
import { assertStepInvariants, lineText } from './step-invariants.js'

// Bất biến cho mọi mảng bước Graph, dựa trên bộ kiểm chung step-invariants.js:
// - currentVertexId, currentEdge { from, to }, matrixCell { rowId, colId } là null hoặc chỉ chứa id đỉnh
//   có trong đồ thị của CHÍNH bước đó; currentEdge còn phải là cạnh có thật của đồ thị đó;
// - outputIds chỉ tăng (trừ đỉnh bị xóa);
// - operation, representation, sourceId, targetId giống nhau ở mọi bước; chỉ bước cuối finished; bước 0 không tô mã giả;
// - reads không giảm; cờ directed không đổi; đồ thị vô hướng luôn đối xứng.
const vertexExists = (step, id) => hasVertex(step.graph, id)

const graphOptions = {
  references: [
    { field: 'currentVertexId', exists: vertexExists },
    { field: 'currentEdge', exists: vertexExists, idsOf: (edge) => [edge.from, edge.to] },
    { field: 'matrixCell', exists: vertexExists, idsOf: (cell) => [cell.rowId, cell.colId] },
  ],
  paths: [{ field: 'outputIds', exists: vertexExists }],
  constantFields: ['operation', 'representation', 'sourceId', 'targetId'],
}

function assertSymmetric(graph, where) {
  for (const [ownerId, list] of Object.entries(graph.adjacency)) {
    for (const id of list) {
      assert.ok(graph.adjacency[id]?.includes(ownerId), `${where}: vô hướng nhưng thiếu ${ownerId} trong Adj[${id}]`)
    }
  }
}

export function assertGraphStepInvariants(steps) {
  assertStepInvariants(steps, graphOptions)

  steps.forEach((step, index) => {
    const where = `bước ${index}`
    const { currentEdge } = step

    if (currentEdge !== null) {
      assert.ok(hasEdge(step.graph, currentEdge.from, currentEdge.to), `${where}: currentEdge không phải cạnh có thật`)
    }
    assert.equal(step.graph.directed, steps[0].graph.directed, `${where}: cờ directed bị đổi`)
    if (!step.graph.directed) assertSymmetric(step.graph, where)
    if (index > 0) {
      assert.ok(step.reads >= steps[index - 1].reads, `${where}: reads giảm`)
    }
  })
}

export { lineText }
