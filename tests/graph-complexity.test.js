import test from 'node:test'
import assert from 'node:assert/strict'
import { adjacencyListSize, buildGraph, listVertices, toAdjacencyMatrix } from '../src/structures/graph.js'
import { generateGraphHasEdgeSteps } from '../src/algorithms/graphHasEdge.js'
import { generateGraphNeighborsSteps } from '../src/algorithms/graphNeighbors.js'

// Đối chiếu số lần đọc thực tế (reads) và kích thước bộ nhớ với Big-O hiển thị trong Learning Panel:
// - Kiểm tra (u, v): danh sách O(deg(u)) (tốt nhất 1), ma trận O(1);
// - Đỉnh kề của u: danh sách Θ(deg(u)), ma trận Θ(V);
// - Không gian / duyệt mọi cạnh (lý thuyết, BFS/DFS sẽ đo): danh sách Θ(V + E), ma trận Θ(V²).
const SAMPLE_PAIRS = [[0, 1], [0, 2], [1, 2], [2, 3], [4, 5]]
const TREE_PAIRS = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]]
const COMPLETE_PAIRS = []
for (let u = 0; u < 6; u++) {
  for (let v = u + 1; v < 6; v++) COMPLETE_PAIRS.push([u, v])
}

const presets = {
  sample: (directed) => buildGraph(directed, 7, directed ? [...SAMPLE_PAIRS, [2, 0]] : SAMPLE_PAIRS),
  tree: (directed) => buildGraph(directed, 7, TREE_PAIRS),
  complete: (directed) => buildGraph(directed, 6, COMPLETE_PAIRS),
}

const finalReads = (steps) => steps.at(-1).reads
const matrixCellCount = (graph) => {
  const { cells } = toAdjacencyMatrix(graph)
  return cells.reduce((total, row) => total + row.length, 0)
}
const allPairs = (graph) => {
  const ids = listVertices(graph).map((vertex) => vertex.id)
  return ids.flatMap((from) => ids.map((to) => [from, to]))
}

for (const directed of [false, true]) {
  const mode = directed ? 'có hướng' : 'vô hướng'

  test(`${mode}: Kiểm tra (u, v) — danh sách reads = vị trí của v trong Adj[u] (vắng: deg(u)), ma trận luôn 1`, () => {
    for (const make of Object.values(presets)) {
      const graph = make(directed)
      for (const [from, to] of allPairs(graph)) {
        const position = graph.adjacency[from].indexOf(to)
        const expected = position === -1 ? graph.adjacency[from].length : position + 1

        assert.equal(finalReads(generateGraphHasEdgeSteps(graph, from, to, 'list')), expected)
        assert.equal(finalReads(generateGraphHasEdgeSteps(graph, from, to, 'matrix')), 1)
      }
    }
  })

  test(`${mode}: Đỉnh kề của u — danh sách reads = deg(u), ma trận reads = V`, () => {
    for (const make of Object.values(presets)) {
      const graph = make(directed)
      const vertexCount = listVertices(graph).length

      for (const { id } of listVertices(graph)) {
        assert.equal(finalReads(generateGraphNeighborsSteps(graph, id, 'list')), graph.adjacency[id].length)
        assert.equal(finalReads(generateGraphNeighborsSteps(graph, id, 'matrix')), vertexCount)
      }
    }
  })
}

test('vô hướng: kích thước danh sách V + 2E / ma trận V² — Mẫu 17/49, Cây 19/49, K6 36/36', () => {
  const sizes = Object.fromEntries(Object.entries(presets).map(([name, make]) => {
    const graph = make(false)
    return [name, [adjacencyListSize(graph), matrixCellCount(graph)]]
  }))

  assert.deepEqual(sizes, { sample: [17, 49], tree: [19, 49], complete: [36, 36] })
})

test('có hướng: kích thước danh sách V + E — Mẫu 13, Cây 13, K6 21 (ma trận vẫn V²: 49, 49, 36)', () => {
  const sizes = Object.fromEntries(Object.entries(presets).map(([name, make]) => {
    const graph = make(true)
    return [name, [adjacencyListSize(graph), matrixCellCount(graph)]]
  }))

  assert.deepEqual(sizes, { sample: [13, 49], tree: [13, 49], complete: [21, 36] })
})

test('vô hướng: duyệt mọi cạnh (lý thuyết) — Σ reads của Đỉnh kề cho mọi u: danh sách 2E, ma trận V²', () => {
  for (const make of Object.values(presets)) {
    const graph = make(false)
    const vertices = listVertices(graph)
    const sum = (representation) => vertices
      .reduce((total, { id }) => total + finalReads(generateGraphNeighborsSteps(graph, id, representation)), 0)

    // Danh sách: V đầu danh sách + 2E phần tử = adjacencyListSize; ma trận: V² ô.
    assert.equal(vertices.length + sum('list'), adjacencyListSize(graph))
    assert.equal(sum('matrix'), matrixCellCount(graph))
  }
})

test('vô hướng K6, Kiểm tra kề theo danh sách: tốt nhất 1, xấu nhất 5, trung bình 3 (mọi cặp u ≠ v)', () => {
  const graph = presets.complete(false)
  const reads = allPairs(graph)
    .filter(([from, to]) => from !== to)
    .map(([from, to]) => finalReads(generateGraphHasEdgeSteps(graph, from, to, 'list')))

  assert.equal(reads.length, 30)
  assert.equal(Math.min(...reads), 1)
  assert.equal(Math.max(...reads), 5)
  assert.equal(reads.reduce((total, value) => total + value, 0) / reads.length, 3)
})

// 300 đỉnh thay vì 1000: mỗi bước giữ bản sao đồ thị riêng nên k bước tốn O(k·(V + E));
// với 1000 đỉnh riêng test này mất ~4,7 s, với 300 đỉnh ~0,5 s mà vẫn tách rõ deg(u) với V.
test('vô hướng, quy mô lớn — đồ thị sao (tâm + 299 lá): Kiểm tra (tâm, lá cuối) 299/1; Đỉnh kề của lá 1/300', () => {
  const pairs = Array.from({ length: 299 }, (_, index) => [0, index + 1])
  const graph = buildGraph(false, 300, pairs)
  const [center] = listVertices(graph)
  const lastLeaf = listVertices(graph).at(-1)

  assert.equal(finalReads(generateGraphHasEdgeSteps(graph, center.id, lastLeaf.id, 'list')), 299)
  assert.equal(finalReads(generateGraphHasEdgeSteps(graph, center.id, lastLeaf.id, 'matrix')), 1)
  assert.equal(finalReads(generateGraphNeighborsSteps(graph, lastLeaf.id, 'list')), 1)
  assert.equal(finalReads(generateGraphNeighborsSteps(graph, lastLeaf.id, 'matrix')), 300)
})
