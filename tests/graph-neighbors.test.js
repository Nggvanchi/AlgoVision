import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGraph, inDegree, listVertices, toAdjacencyMatrix } from '../src/structures/graph.js'
import * as neighborsModule from '../src/algorithms/graphNeighbors.js'
import { assertGraphStepInvariants, lineText } from './helpers/graph-step-invariants.js'
import { deepFreeze } from './helpers/deep-freeze.js'

// Preset Mẫu (theo slot): A–B, A–C, B–C, C–D, E–F; G cô lập. Có hướng thêm C→A.
const SAMPLE_PAIRS = [[0, 1], [0, 2], [1, 2], [2, 3], [4, 5]]
const undirectedSample = () => buildGraph(false, 7, SAMPLE_PAIRS)
const directedSample = () => buildGraph(true, 7, [...SAMPLE_PAIRS, [2, 0]])
const completeK6 = (directed) => {
  const pairs = []
  for (let u = 0; u < 6; u++) {
    for (let v = u + 1; v < 6; v++) pairs.push([u, v])
  }
  return buildGraph(directed, 6, pairs)
}
const idOf = (graph, label) => listVertices(graph).find((vertex) => vertex.label === label).id
const labelsOf = (graph, ids) => ids.map((id) => graph.vertices[id].label)

const run = (graph, label, representation) => (
  neighborsModule.generateGraphNeighborsSteps(graph, idOf(graph, label), representation)
)
const listLines = () => neighborsModule.listNeighborsPseudocode
const matrixLines = () => neighborsModule.matrixNeighborsPseudocode

test('mã giả Đỉnh kề: danh sách kề 4 dòng, ma trận kề 5 dòng', () => {
  assert.deepEqual(listLines(), [
    'deg ← 0',
    'for each w in Adj[u]:',
    '  ghi nhận w; deg ← deg + 1',
    'return deg',
  ])
  assert.deepEqual(matrixLines(), [
    'deg ← 0',
    'for each w in V:',
    '  if M[u][w] = 1:',
    '    ghi nhận w; deg ← deg + 1',
    'return deg',
  ])
})

test('vô hướng, danh sách: C → 6 bước, reads 3, đỉnh kề A, B, D, bậc 3', () => {
  const graph = undirectedSample()
  const steps = run(graph, 'C', 'list')

  assertGraphStepInvariants(steps)
  assert.equal(steps.length, 6)
  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 3, 3, 3, 4])
  assert.deepEqual(steps.map((step) => step.reads), [0, 0, 1, 2, 3, 3])
  assert.deepEqual(labelsOf(graph, steps.at(-1).outputIds), ['A', 'B', 'D'])
  assert.deepEqual(steps[3].currentEdge, { from: idOf(graph, 'C'), to: idOf(graph, 'B') })
  assert.equal(lineText(listLines(), steps[2]), '  ghi nhận w; deg ← deg + 1')
  assert.equal(lineText(listLines(), steps.at(-1)), 'return deg')
  assert.equal(steps.at(-1).result, 3)
  assert.equal(steps.at(-2).result, null)
})

test('vô hướng, ma trận: C → 13 bước (bước 0, deg ← 0, 7 ô, 3 ô bằng 1, return), reads 7', () => {
  const graph = undirectedSample()
  const steps = run(graph, 'C', 'matrix')

  assertGraphStepInvariants(steps)
  assert.equal(steps.length, 1 + 1 + 7 + 3 + 1)
  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 3, 4, 3, 4, 3, 3, 4, 3, 3, 3, 5])
  assert.equal(steps.at(-1).reads, 7)
  assert.equal(steps.filter((step) => step.pseudocodeLine === 3).length, 7)
  assert.equal(steps.filter((step) => step.pseudocodeLine === 4).length, 3)
  assert.deepEqual(labelsOf(graph, steps.at(-1).outputIds), ['A', 'B', 'D'])
  assert.equal(steps.at(-1).result, 3)

  // Mỗi bước dòng 3 đọc một ô của hàng C, theo thứ tự cột A..G.
  const readColumns = steps.filter((step) => step.pseudocodeLine === 3).map((step) => step.matrixCell.colId)
  assert.deepEqual(labelsOf(graph, readColumns), ['A', 'B', 'C', 'D', 'E', 'F', 'G'])
  steps.filter((step) => step.matrixCell).forEach((step) => assert.equal(step.matrixCell.rowId, idOf(graph, 'C')))
  assert.equal(lineText(matrixLines(), steps[3]), '    ghi nhận w; deg ← deg + 1')
})

test('ma trận: đường chéo luôn 0 ở đồ thị đơn; đọc M[u][u] không ghi nhận u', () => {
  for (const graph of [undirectedSample(), directedSample(), completeK6(false), completeK6(true)]) {
    const { cells } = toAdjacencyMatrix(graph)
    cells.forEach((row, index) => assert.equal(row[index], 0))

    for (const vertex of listVertices(graph)) {
      const steps = neighborsModule.generateGraphNeighborsSteps(graph, vertex.id, 'matrix')
      const diagonal = steps.findIndex((step) => step.matrixCell?.colId === vertex.id)

      assert.equal(steps[diagonal].currentEdge, null)
      assert.notEqual(steps[diagonal + 1].pseudocodeLine, 4)
      assert.ok(!steps.at(-1).outputIds.includes(vertex.id))
    }
  }
})

test('có hướng: Đỉnh kề của C chỉ liệt kê đỉnh kề ra Adj[C] = [A, D], bậc ra 2; bậc vào 2 qua inDegree', () => {
  const graph = directedSample()
  const list = run(graph, 'C', 'list')
  const matrix = run(graph, 'C', 'matrix')

  for (const steps of [list, matrix]) {
    assertGraphStepInvariants(steps)
    assert.deepEqual(labelsOf(graph, steps.at(-1).outputIds), ['A', 'D'])
    assert.equal(steps.at(-1).result, 2)
  }
  assert.equal(list.length, 5)
  assert.equal(list.at(-1).reads, 2)
  assert.equal(matrix.length, 1 + 1 + 7 + 2 + 1)
  assert.equal(matrix.at(-1).reads, 7)
  // A → C và B → C: không xuất hiện trong Đỉnh kề của C.
  assert.equal(inDegree(graph, idOf(graph, 'C')), 2)
})

test('đỉnh cô lập G: danh sách 3 bước, reads 0; ma trận vẫn đọc cả hàng (reads 7), bậc 0', () => {
  const list = run(undirectedSample(), 'G', 'list')
  const matrix = run(undirectedSample(), 'G', 'matrix')

  assertGraphStepInvariants(list)
  assert.equal(list.length, 3)
  assert.equal(list.at(-1).reads, 0)
  assert.equal(list.at(-1).result, 0)

  assertGraphStepInvariants(matrix)
  assert.equal(matrix.length, 1 + 1 + 7 + 0 + 1)
  assert.equal(matrix.at(-1).reads, 7)
  assert.equal(matrix.at(-1).result, 0)
})

test('mọi đỉnh, cả hai chế độ và hai cách biểu diễn: bất biến đúng, hai cách cho cùng kết quả; bước return không tăng reads', () => {
  for (const graph of [undirectedSample(), directedSample(), completeK6(false), completeK6(true)]) {
    const vertexCount = listVertices(graph).length

    for (const vertex of listVertices(graph)) {
      const list = neighborsModule.generateGraphNeighborsSteps(graph, vertex.id, 'list')
      const matrix = neighborsModule.generateGraphNeighborsSteps(graph, vertex.id, 'matrix')
      const degree = graph.adjacency[vertex.id].length

      assertGraphStepInvariants(list)
      assertGraphStepInvariants(matrix)
      assert.deepEqual(list.at(-1).outputIds, graph.adjacency[vertex.id])
      assert.deepEqual(matrix.at(-1).outputIds, graph.adjacency[vertex.id])
      assert.equal(list.at(-1).reads, degree)
      assert.equal(matrix.at(-1).reads, vertexCount)
      for (const steps of [list, matrix]) {
        assert.equal(steps.at(-1).reads, steps.at(-2).reads, 'bước return deg tăng reads')
        assert.equal(steps.at(-1).result, degree)
      }
    }
  }
})

test('trường đầu vào chốt: operation neighbors, targetId null', () => {
  const steps = run(undirectedSample(), 'A', 'list')

  for (const step of steps) {
    assert.equal(step.operation, 'neighbors')
    assert.equal(step.representation, 'list')
    assert.equal(step.targetId, null)
  }
})

test('không sửa đồ thị đầu vào; mỗi bước giữ snapshot riêng; outputIds của bước cũ không bị đổi', () => {
  const graph = deepFreeze(undirectedSample())
  const steps = neighborsModule.generateGraphNeighborsSteps(graph, 'v3', 'list')

  steps[1].graph.adjacency.v3.push('x')
  assert.deepEqual(steps[2].graph.adjacency.v3, ['v1', 'v2', 'v4'])
  assert.deepEqual(steps[2].outputIds, ['v1'])
  assert.deepEqual(steps.at(-1).outputIds, ['v1', 'v2', 'v4'])
})

test('đỉnh không tồn tại hoặc cách biểu diễn lạ bị từ chối', () => {
  const graph = undirectedSample()
  assert.throws(() => neighborsModule.generateGraphNeighborsSteps(graph, 'v99', 'list'), RangeError)
  assert.throws(() => neighborsModule.generateGraphNeighborsSteps(graph, 'v1', 'grid'), RangeError)
})
