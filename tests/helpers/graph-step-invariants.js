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

// extra: { references, paths } gộp thêm vào cấu hình Graph (BFS dùng để kiểm các trường riêng của nó).
export function assertGraphStepInvariants(steps, extra = {}) {
  assertStepInvariants(steps, {
    ...graphOptions,
    references: [...graphOptions.references, ...(extra.references ?? [])],
    paths: [...graphOptions.paths, ...(extra.paths ?? [])],
  })

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

// Bất biến riêng của BFS (thêm vào bất biến Graph ở trên):
// - frontierIds, key/giá trị của distance và parentIds chỉ chứa id đỉnh của đồ thị của bước; visitedIds, orderIds chỉ tăng;
// - distance, parentIds có key cho đúng mọi đỉnh; distance[x] khác null ⇔ x đã đánh dấu; giá trị đã gán không đổi;
// - visitedIds không trùng, đỉnh đầu tiên là nguồn, và visitedIds = orderIds nối frontierIds (hàng đợi FIFO);
// - currentVertexId là null hoặc đỉnh vừa lấy ra (phần tử cuối của orderIds);
// - parent của w (nếu có) đã được lấy khỏi hàng đợi và dist[w] = dist[parent] + 1; nguồn và đỉnh khác đã đánh dấu:
//   nguồn không có parent, đỉnh khác phải có.
const bfsOptions = {
  references: [
    { field: 'frontierIds', exists: vertexExists, idsOf: (ids) => ids },
    { field: 'distance', exists: vertexExists, idsOf: (map) => Object.keys(map) },
    {
      field: 'parentIds',
      exists: vertexExists,
      idsOf: (map) => [...Object.keys(map), ...Object.values(map).filter((id) => id !== null)],
    },
  ],
  paths: [
    { field: 'visitedIds', exists: vertexExists },
    { field: 'orderIds', exists: vertexExists },
  ],
}

const sortedKeys = (map) => Object.keys(map).sort()

function assertBfsStep(step, previous, where) {
  const { distance, parentIds, visitedIds, orderIds, frontierIds, sourceId } = step
  const vertexIds = Object.keys(step.graph.vertices).sort()

  assert.deepEqual(sortedKeys(distance), vertexIds, `${where}: distance phải có key cho mọi đỉnh`)
  assert.deepEqual(sortedKeys(parentIds), vertexIds, `${where}: parentIds phải có key cho mọi đỉnh`)
  assert.equal(new Set(visitedIds).size, visitedIds.length, `${where}: visitedIds có phần tử trùng`)
  if (visitedIds.length > 0) {
    assert.equal(visitedIds[0], sourceId, `${where}: đỉnh đầu tiên được đánh dấu phải là nguồn`)
  }
  assert.deepEqual(visitedIds, [...orderIds, ...frontierIds], `${where}: visitedIds phải bằng orderIds nối frontierIds`)

  if (step.currentVertexId !== null) {
    assert.equal(step.currentVertexId, orderIds.at(-1), `${where}: currentVertexId phải là đỉnh vừa lấy ra`)
  }

  for (const id of vertexIds) {
    assert.equal(distance[id] !== null, visitedIds.includes(id), `${where}: distance khác null khi và chỉ khi đã đánh dấu (${id})`)
    if (previous && Object.hasOwn(previous.distance, id) && previous.distance[id] !== null) {
      assert.equal(distance[id], previous.distance[id], `${where}: distance[${id}] bị đổi`)
    }
  }

  for (const id of vertexIds) {
    const parentId = parentIds[id]
    if (parentId === null) {
      if (id !== sourceId && visitedIds.includes(id)) assert.fail(`${where}: ${id} đã đánh dấu nhưng không có parent`)
      continue
    }
    assert.ok(orderIds.includes(parentId), `${where}: parent ${parentId} của ${id} chưa được lấy khỏi hàng đợi`)
    assert.equal(distance[id], distance[parentId] + 1, `${where}: dist[${id}] phải bằng dist[parent] + 1`)
  }
}

export function assertBfsStepInvariants(steps) {
  assertGraphStepInvariants(steps, bfsOptions)
  steps.forEach((step, index) => assertBfsStep(step, steps[index - 1], `bước ${index}`))
}

export { lineText }
