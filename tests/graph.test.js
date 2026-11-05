import test from 'node:test'
import assert from 'node:assert/strict'
import * as graphModule from '../src/structures/graph.js'
import { deepFreeze } from './helpers/deep-freeze.js'

// Preset Mẫu (theo slot): A–B, A–C, B–C, C–D, E–F; G cô lập.
const SAMPLE_PAIRS = [[0, 1], [0, 2], [1, 2], [2, 3], [4, 5]]

const build = (directed, vertexCount, pairs) => graphModule.buildGraph(directed, vertexCount, pairs)
const idOf = (graph, label) => Object.values(graph.vertices).find((vertex) => vertex.label === label).id
const labelsOf = (graph, ids) => ids.map((id) => graph.vertices[id].label)
const adjacencyLabels = (graph, label) => labelsOf(graph, graph.adjacency[idOf(graph, label)])

// Không id nào trong danh sách kề trỏ tới đỉnh không tồn tại; mỗi đỉnh có đúng một danh sách.
function assertNoDanglingIds(graph) {
  assert.deepEqual(Object.keys(graph.adjacency).sort(), Object.keys(graph.vertices).sort())
  for (const [ownerId, list] of Object.entries(graph.adjacency)) {
    for (const id of list) {
      assert.ok(graph.vertices[id], `Adj[${ownerId}] chứa id treo ${id}`)
    }
  }
}

function assertSymmetric(graph) {
  for (const [ownerId, list] of Object.entries(graph.adjacency)) {
    for (const id of list) {
      assert.ok(graph.adjacency[id].includes(ownerId), `vô hướng: ${ownerId} ∈ Adj, nhưng ${ownerId} ∉ Adj[${id}]`)
    }
  }
}

test('labelForSlot: A–Z rồi V26, V27…', () => {
  assert.equal(graphModule.labelForSlot(0), 'A')
  assert.equal(graphModule.labelForSlot(7), 'H')
  assert.equal(graphModule.labelForSlot(25), 'Z')
  assert.equal(graphModule.labelForSlot(26), 'V26')
})

test('createGraph tạo đồ thị rỗng, cờ directed phải là boolean', () => {
  const graph = graphModule.createGraph(true)

  assert.deepEqual(graph, { directed: true, vertices: {}, adjacency: {}, nextId: 1 })
  assert.equal(graphModule.createGraph().directed, false)
  assert.throws(() => graphModule.createGraph('yes'), TypeError)
  assert.equal(graphModule.countVertices(graph), 0)
  assert.equal(graphModule.countEdges(graph), 0)
})

test('addVertex cấp id mới, slot trống nhỏ nhất và nhãn theo slot', () => {
  const first = graphModule.addVertex(graphModule.createGraph())
  const second = graphModule.addVertex(first.graph)

  assert.equal(first.id, 'v1')
  assert.equal(second.id, 'v2')
  assert.deepEqual(second.graph.vertices.v2, { id: 'v2', slot: 1, label: 'B' })
  assert.deepEqual(second.graph.adjacency.v2, [])
  assert.equal(second.graph.nextId, 3)
})

test('preset Mẫu vô hướng: V = 7, E = 5, bậc và danh sách kề sắp theo slot', () => {
  const graph = build(false, 7, SAMPLE_PAIRS)

  assert.equal(graphModule.countVertices(graph), 7)
  assert.equal(graphModule.countEdges(graph), 5)
  assert.deepEqual(adjacencyLabels(graph, 'A'), ['B', 'C'])
  assert.deepEqual(adjacencyLabels(graph, 'C'), ['A', 'B', 'D'])
  assert.deepEqual(adjacencyLabels(graph, 'G'), [])
  assert.equal(graphModule.outDegree(graph, idOf(graph, 'C')), 3)
  assert.equal(graphModule.inDegree(graph, idOf(graph, 'C')), 3)
  assert.equal(graphModule.adjacencyListSize(graph), 17)
  assertSymmetric(graph)
})

test('preset Mẫu có hướng (thêm C→A): V = 7, E = 6, danh sách 13, bậc ra/vào khác nhau', () => {
  const graph = build(true, 7, [...SAMPLE_PAIRS, [2, 0]])
  const c = idOf(graph, 'C')

  assert.equal(graphModule.countEdges(graph), 6)
  assert.equal(graphModule.adjacencyListSize(graph), 13)
  assert.deepEqual(adjacencyLabels(graph, 'C'), ['A', 'D'])
  assert.deepEqual(adjacencyLabels(graph, 'D'), [])
  assert.equal(graphModule.outDegree(graph, c), 2)
  assert.equal(graphModule.inDegree(graph, c), 2)
  assert.equal(graphModule.inDegree(graph, idOf(graph, 'A')), 1)
})

test('K6: vô hướng E = 15, danh sách 36 = V²; có hướng E = 15, danh sách 21', () => {
  const pairs = []
  for (let u = 0; u < 6; u++) {
    for (let v = u + 1; v < 6; v++) pairs.push([u, v])
  }
  const undirected = build(false, 6, pairs)
  const directed = build(true, 6, pairs)

  assert.equal(graphModule.countEdges(undirected), 15)
  assert.equal(graphModule.adjacencyListSize(undirected), 36)
  assert.equal(graphModule.countEdges(directed), 15)
  assert.equal(graphModule.adjacencyListSize(directed), 21)
})

test('addEdge từ chối cạnh trùng, khuyên và đỉnh không tồn tại (đồ thị giữ nguyên)', () => {
  const graph = build(false, 3, [[0, 1]])
  const [a, b] = ['A', 'B'].map((label) => idOf(graph, label))

  const reversed = graphModule.addEdge(graph, b, a)
  assert.equal(reversed.added, false)
  assert.equal(reversed.reason, 'duplicate')
  assert.deepEqual(reversed.graph, graph)

  assert.equal(graphModule.addEdge(graph, a, a).reason, 'self-loop')
  assert.equal(graphModule.addEdge(graph, a, 'v99').reason, 'missing-vertex')
  assert.equal(graphModule.addEdge(graph, 'v99', a).reason, 'missing-vertex')
})

test('có hướng: A→B và B→A là hai cạnh khác nhau', () => {
  const graph = build(true, 2, [[0, 1]])
  const [a, b] = ['A', 'B'].map((label) => idOf(graph, label))
  const result = graphModule.addEdge(graph, b, a)

  assert.equal(result.added, true)
  assert.equal(result.reason, null)
  assert.equal(graphModule.countEdges(result.graph), 2)
  assert.equal(graphModule.hasEdge(result.graph, a, b), true)
  assert.equal(graphModule.hasEdge(result.graph, b, a), true)
  assert.equal(graphModule.addEdge(result.graph, a, b).reason, 'duplicate')
})

test('vô hướng lưu hai chiều: hasEdge đúng cả hai phía, removeEdge xóa cả hai danh sách', () => {
  const graph = build(false, 4, SAMPLE_PAIRS.slice(0, 4))
  const [a, c] = ['A', 'C'].map((label) => idOf(graph, label))

  assert.equal(graphModule.hasEdge(graph, c, a), true)

  const result = graphModule.removeEdge(graph, c, a)
  assert.equal(result.removed, true)
  assert.equal(graphModule.hasEdge(result.graph, a, c), false)
  assert.equal(graphModule.hasEdge(result.graph, c, a), false)
  assert.equal(graphModule.countEdges(result.graph), 3)
  assertSymmetric(result.graph)

  assert.equal(graphModule.removeEdge(result.graph, a, c).removed, false)
})

test('có hướng: removeEdge chỉ xóa đúng chiều', () => {
  const graph = build(true, 2, [[0, 1], [1, 0]])
  const [a, b] = ['A', 'B'].map((label) => idOf(graph, label))
  const result = graphModule.removeEdge(graph, a, b)

  assert.equal(graphModule.hasEdge(result.graph, a, b), false)
  assert.equal(graphModule.hasEdge(result.graph, b, a), true)
})

test('vô hướng: removeVertex xóa đỉnh khỏi danh sách của mọi đỉnh kề (không id treo, vẫn đối xứng)', () => {
  const graph = build(false, 7, SAMPLE_PAIRS)
  const result = graphModule.removeVertex(graph, idOf(graph, 'C'))

  assert.equal(result.removed, true)
  assertNoDanglingIds(result.graph)
  assertSymmetric(result.graph)
  assert.deepEqual(adjacencyLabels(result.graph, 'A'), ['B'])
  assert.deepEqual(adjacencyLabels(result.graph, 'D'), [])
  assert.equal(graphModule.countVertices(result.graph), 6)
  assert.equal(graphModule.countEdges(result.graph), 2)
})

test('có hướng: removeVertex xóa cả cạnh đi ra lẫn cạnh đi vào', () => {
  const graph = build(true, 7, [...SAMPLE_PAIRS, [2, 0]])
  const result = graphModule.removeVertex(graph, idOf(graph, 'C'))

  assertNoDanglingIds(result.graph)
  // A→C và B→C là cạnh đi vào C; C→A, C→D là cạnh đi ra.
  assert.deepEqual(adjacencyLabels(result.graph, 'A'), ['B'])
  assert.deepEqual(adjacencyLabels(result.graph, 'B'), [])
  assert.equal(graphModule.countEdges(result.graph), 2)
  assert.equal(graphModule.inDegree(result.graph, idOf(result.graph, 'A')), 0)
})

test('removeVertex với id không tồn tại: removed = false, đồ thị giữ nguyên', () => {
  const graph = build(false, 2, [[0, 1]])
  const result = graphModule.removeVertex(graph, 'v99')

  assert.equal(result.removed, false)
  assert.deepEqual(result.graph, graph)
})

test('xóa đỉnh giữa rồi thêm đỉnh mới: dùng lại slot và nhãn cũ, id mới, danh sách kề vẫn sắp theo slot', () => {
  const sample = build(false, 7, SAMPLE_PAIRS)
  const [a, g] = ['A', 'G'].map((label) => idOf(sample, label))
  let graph = graphModule.removeVertex(sample, idOf(sample, 'C')).graph
  graph = graphModule.addEdge(graph, a, g).graph

  const added = graphModule.addVertex(graph)
  assert.equal(added.id, 'v8')
  assert.deepEqual(added.graph.vertices.v8, { id: 'v8', slot: 2, label: 'C' })

  graph = graphModule.addEdge(added.graph, a, added.id).graph
  // Sắp theo slot (B=1, C=2, G=6), không theo id (v2, v7, v8).
  assert.deepEqual(adjacencyLabels(graph, 'A'), ['B', 'C', 'G'])
  assert.deepEqual(graph.adjacency[a], ['v2', 'v8', 'v7'])
  assertSymmetric(graph)
})

test('toAdjacencyMatrix: hàng/cột theo slot, sau khi xóa đỉnh có đúng V hàng và V cột', () => {
  const sample = build(false, 7, SAMPLE_PAIRS)
  const matrix = graphModule.toAdjacencyMatrix(sample)

  assert.deepEqual(labelsOf(sample, matrix.ids), ['A', 'B', 'C', 'D', 'E', 'F', 'G'])
  assert.deepEqual(matrix.cells[2], [1, 1, 0, 1, 0, 0, 0])
  assert.equal(matrix.cells.length * matrix.cells[0].length, 49)

  const removed = graphModule.removeVertex(sample, idOf(sample, 'C')).graph
  const smaller = graphModule.toAdjacencyMatrix(removed)
  assert.deepEqual(labelsOf(removed, smaller.ids), ['A', 'B', 'D', 'E', 'F', 'G'])
  assert.equal(smaller.cells.length, 6)
  smaller.cells.forEach((row) => assert.equal(row.length, 6))
  assert.deepEqual(smaller.cells[0], [0, 1, 0, 0, 0, 0])
})

test('toAdjacencyMatrix có hướng không đối xứng; đồ thị rỗng cho ma trận 0×0', () => {
  const graph = build(true, 2, [[0, 1]])
  assert.deepEqual(graphModule.toAdjacencyMatrix(graph).cells, [[0, 1], [0, 0]])
  assert.deepEqual(graphModule.toAdjacencyMatrix(graphModule.createGraph()), { ids: [], cells: [] })
})

test('listVertices trả đỉnh theo slot', () => {
  const graph = graphModule.removeVertex(build(false, 3, []), 'v1').graph
  const readded = graphModule.addVertex(graph).graph

  assert.deepEqual(graphModule.listVertices(readded).map((vertex) => vertex.label), ['A', 'B', 'C'])
  assert.deepEqual(graphModule.listVertices(readded).map((vertex) => vertex.id), ['v4', 'v2', 'v3'])
})

test('neighbors trả bản sao; đỉnh không tồn tại bị từ chối', () => {
  const graph = build(false, 3, [[0, 1], [0, 2]])
  const list = graphModule.neighbors(graph, 'v1')

  assert.deepEqual(list, ['v2', 'v3'])
  list.push('v99')
  assert.deepEqual(graph.adjacency.v1, ['v2', 'v3'])
  assert.throws(() => graphModule.neighbors(graph, 'v99'), RangeError)
  assert.throws(() => graphModule.outDegree(graph, 'v99'), RangeError)
  assert.equal(graphModule.hasEdge(graph, 'v99', 'v1'), false)
})

test('không hàm nào sửa đồ thị đầu vào, kết quả là bản sao độc lập', () => {
  const graph = deepFreeze(build(false, 7, SAMPLE_PAIRS))
  const directed = deepFreeze(build(true, 7, [...SAMPLE_PAIRS, [2, 0]]))

  for (const source of [graph, directed]) {
    const added = graphModule.addVertex(source)
    added.graph.adjacency.v1.push('x')
    graphModule.addEdge(source, 'v1', 'v7').graph.adjacency.v7.push('x')
    graphModule.removeEdge(source, 'v1', 'v2').graph.adjacency.v1.push('x')
    graphModule.removeVertex(source, 'v3').graph.adjacency.v1.push('x')
    graphModule.addEdge(source, 'v1', 'v2')
    graphModule.toAdjacencyMatrix(source)
    graphModule.listVertices(source)
    graphModule.neighbors(source, 'v3')
    graphModule.inDegree(source, 'v3')
  }

  assert.deepEqual(graph.adjacency.v1, ['v2', 'v3'])
})

test('quy mô lớn: đường thẳng 1000 đỉnh, tầng structures không giới hạn số đỉnh', () => {
  const pairs = Array.from({ length: 999 }, (_, index) => [index, index + 1])
  const graph = build(false, 1000, pairs)

  assert.equal(graphModule.countVertices(graph), 1000)
  assert.equal(graphModule.countEdges(graph), 999)
  assert.equal(graphModule.adjacencyListSize(graph), 1000 + 1998)
  assert.equal(graph.vertices.v1000.label, 'V999')

  const removed = graphModule.removeVertex(graph, 'v500').graph
  assert.equal(graphModule.countEdges(removed), 997)
  assertNoDanglingIds(removed)
})

test('buildGraph từ chối cặp slot ngoài phạm vi', () => {
  assert.throws(() => build(false, 2, [[0, 2]]), RangeError)
})
