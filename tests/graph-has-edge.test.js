import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGraph, listVertices } from '../src/structures/graph.js'
import * as hasEdgeModule from '../src/algorithms/graphHasEdge.js'
import { assertGraphStepInvariants, lineText } from './helpers/graph-step-invariants.js'

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(deepFreeze)
  }
  return value
}

// Preset Mẫu (theo slot): A–B, A–C, B–C, C–D, E–F; G cô lập. Có hướng thêm C→A.
const SAMPLE_PAIRS = [[0, 1], [0, 2], [1, 2], [2, 3], [4, 5]]
const undirectedSample = () => buildGraph(false, 7, SAMPLE_PAIRS)
const directedSample = () => buildGraph(true, 7, [...SAMPLE_PAIRS, [2, 0]])
const idOf = (graph, label) => listVertices(graph).find((vertex) => vertex.label === label).id

function run(graph, from, to, representation) {
  return hasEdgeModule.generateGraphHasEdgeSteps(graph, idOf(graph, from), idOf(graph, to), representation)
}

const listLines = () => hasEdgeModule.listHasEdgePseudocode
const matrixLines = () => hasEdgeModule.matrixHasEdgePseudocode

test('mã giả Kiểm tra kề: danh sách kề 3 dòng, ma trận kề 1 dòng', () => {
  assert.deepEqual(listLines(), [
    'for each w in Adj[u]:',
    '  if w = v: return true',
    'return false',
  ])
  assert.deepEqual(matrixLines(), ['return M[u][v] = 1'])
})

test('vô hướng, danh sách: (A, C) → 3 bước, reads 2, true; bước khớp là bước cuối', () => {
  const graph = undirectedSample()
  const steps = run(graph, 'A', 'C', 'list')

  assertGraphStepInvariants(steps)
  assert.equal(steps.length, 3)
  assert.deepEqual(steps.map((step) => step.reads), [0, 1, 2])
  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 2, 2])
  assert.deepEqual(steps[1].currentEdge, { from: idOf(graph, 'A'), to: idOf(graph, 'B') })
  assert.equal(steps[2].currentVertexId, idOf(graph, 'C'))
  assert.equal(lineText(listLines(), steps[2]), '  if w = v: return true')
  assert.equal(steps.at(-1).result, true)
  assert.equal(steps[0].result, null)
})

test('vô hướng, danh sách: (A, D) → 4 bước, reads 2, false; bước kết luận không tăng reads', () => {
  const steps = run(undirectedSample(), 'A', 'D', 'list')

  assertGraphStepInvariants(steps)
  assert.equal(steps.length, 4)
  assert.deepEqual(steps.map((step) => step.reads), [0, 1, 2, 2])
  assert.equal(lineText(listLines(), steps.at(-1)), 'return false')
  assert.equal(steps.at(-1).currentEdge, null)
  assert.equal(steps.at(-1).result, false)
})

test('vô hướng, danh sách: (G, A) với Adj[G] rỗng → 2 bước, reads 0, false', () => {
  const steps = run(undirectedSample(), 'G', 'A', 'list')

  assertGraphStepInvariants(steps)
  assert.equal(steps.length, 2)
  assert.equal(steps.at(-1).reads, 0)
  assert.equal(steps.at(-1).result, false)
})

test('(u, u): danh sách đọc hết Adj[u] (reads = deg(u)), ma trận đọc M[u][u] = 0; đều false, không lỗi', () => {
  const list = run(undirectedSample(), 'C', 'C', 'list')
  const matrix = run(undirectedSample(), 'C', 'C', 'matrix')

  assertGraphStepInvariants(list)
  assert.equal(list.length, 5)
  assert.equal(list.at(-1).reads, 3)
  assert.equal(list.at(-1).result, false)

  assertGraphStepInvariants(matrix)
  assert.equal(matrix.at(-1).reads, 1)
  assert.equal(matrix.at(-1).result, false)
  assert.equal(matrix.at(-1).currentEdge, null)
})

test('vô hướng, ma trận: luôn 2 bước, reads 1; có cạnh thì currentEdge là cạnh đó', () => {
  const graph = undirectedSample()
  const found = run(graph, 'A', 'C', 'matrix')
  const missing = run(graph, 'A', 'D', 'matrix')

  for (const steps of [found, missing]) {
    assertGraphStepInvariants(steps)
    assert.equal(steps.length, 2)
    assert.deepEqual(steps.map((step) => step.reads), [0, 1])
    assert.equal(lineText(matrixLines(), steps[1]), 'return M[u][v] = 1')
  }

  assert.deepEqual(found[1].matrixCell, { rowId: idOf(graph, 'A'), colId: idOf(graph, 'C') })
  assert.deepEqual(found[1].currentEdge, { from: idOf(graph, 'A'), to: idOf(graph, 'C') })
  assert.equal(found[1].result, true)
  assert.equal(missing[1].currentEdge, null)
  assert.equal(missing[1].result, false)
})

test('có hướng: (C, A) có cạnh C→A; (D, C) không có dù có C→D (Adj[D] rỗng, reads 0)', () => {
  const graph = directedSample()

  const back = run(graph, 'C', 'A', 'list')
  assertGraphStepInvariants(back)
  assert.equal(back.length, 2)
  assert.equal(back.at(-1).reads, 1)
  assert.equal(back.at(-1).result, true)

  const reverse = run(graph, 'D', 'C', 'list')
  assertGraphStepInvariants(reverse)
  assert.equal(reverse.at(-1).reads, 0)
  assert.equal(reverse.at(-1).result, false)

  assert.equal(run(graph, 'D', 'C', 'matrix').at(-1).result, false)
  assert.equal(run(graph, 'C', 'D', 'matrix').at(-1).result, true)
})

test('mọi cặp đỉnh, cả hai chế độ và hai cách biểu diễn: bất biến bước đúng, kết quả khớp nhau', () => {
  for (const graph of [undirectedSample(), directedSample()]) {
    const ids = listVertices(graph).map((vertex) => vertex.id)
    for (const from of ids) {
      for (const to of ids) {
        const list = hasEdgeModule.generateGraphHasEdgeSteps(graph, from, to, 'list')
        const matrix = hasEdgeModule.generateGraphHasEdgeSteps(graph, from, to, 'matrix')
        assertGraphStepInvariants(list)
        assertGraphStepInvariants(matrix)
        assert.equal(list.at(-1).result, matrix.at(-1).result)
        assert.equal(list.at(-1).result, graph.adjacency[from].includes(to))
      }
    }
  }
})

test('trường đầu vào chốt trong mọi bước; bước chỉ lưu dữ liệu', () => {
  const graph = undirectedSample()
  const steps = run(graph, 'A', 'C', 'list')

  for (const step of steps) {
    assert.equal(step.operation, 'has-edge')
    assert.equal(step.representation, 'list')
    assert.equal(step.sourceId, idOf(graph, 'A'))
    assert.equal(step.targetId, idOf(graph, 'C'))
    assert.deepEqual(step.outputIds, [])
    assert.equal(typeof step.message, 'string')
  }
})

test('không sửa đồ thị đầu vào; mỗi bước giữ snapshot riêng', () => {
  const graph = deepFreeze(undirectedSample())
  const steps = hasEdgeModule.generateGraphHasEdgeSteps(graph, 'v1', 'v4', 'list')

  steps[1].graph.adjacency.v1.push('x')
  assert.deepEqual(steps[2].graph.adjacency.v1, ['v2', 'v3'])
  assert.deepEqual(graph.adjacency.v1, ['v2', 'v3'])
})

test('đỉnh không tồn tại hoặc cách biểu diễn lạ bị từ chối', () => {
  const graph = undirectedSample()
  assert.throws(() => hasEdgeModule.generateGraphHasEdgeSteps(graph, 'v99', 'v1', 'list'), RangeError)
  assert.throws(() => hasEdgeModule.generateGraphHasEdgeSteps(graph, 'v1', 'v99', 'matrix'), RangeError)
  assert.throws(() => hasEdgeModule.generateGraphHasEdgeSteps(graph, 'v1', 'v2', 'grid'), RangeError)
})
