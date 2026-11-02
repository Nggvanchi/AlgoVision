import test from 'node:test'
import assert from 'node:assert/strict'
import { adjacencyListSize, buildGraph, listVertices, toAdjacencyMatrix } from '../src/structures/graph.js'
import { generateGraphHasEdgeSteps } from '../src/algorithms/graphHasEdge.js'
import { generateGraphNeighborsSteps } from '../src/algorithms/graphNeighbors.js'
import { generateGraphBfsSteps } from '../src/algorithms/graphBfs.js'
import { generateGraphDfsSteps } from '../src/algorithms/graphDfs.js'

// Đối chiếu số lần đọc thực tế (reads) và kích thước bộ nhớ với Big-O hiển thị trong Learning Panel:
// - Kiểm tra (u, v): danh sách O(deg(u)) (tốt nhất 1), ma trận O(1);
// - Đỉnh kề của u: danh sách Θ(deg(u)), ma trận Θ(V);
// - Không gian: danh sách Θ(V + E), ma trận Θ(V²);
// - BFS từ s (đo thật): danh sách R lần dequeue + tổng bậc (ra) của R đỉnh tới được → O(V + E);
//   ma trận R·V ô, tối đa V² → O(V²).
// - DFS từ s (đo thật): R lần gọi + cùng số reads với BFS (mỗi đỉnh tới được được mở đúng một lần) → O(V + E) / O(V²);
//   ngăn xếp gọi sâu nhất ≤ V khung → bộ nhớ phụ O(V) (xấu nhất: đường thẳng, nguồn ở đầu).
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

// ---- BFS từ s: đo cả hai phần của Big-O. Phần V là số lần dequeue (= R đỉnh tới được),
// phần cạnh là reads (danh sách: tổng bậc ra của R đỉnh; ma trận: R·V ô).
const bfsCost = (graph, sourceId, representation) => {
  const last = generateGraphBfsSteps(graph, sourceId, representation).at(-1)
  return { dequeues: last.orderIds.length, reads: last.reads }
}
const firstId = (graph) => listVertices(graph)[0].id

test('BFS nguồn A — số lần dequeue và reads: vô hướng Mẫu 4/8/28, Cây 7/12/49, K6 6/30/36 (dequeue/danh sách/ma trận)', () => {
  const costs = Object.fromEntries(Object.entries(presets).map(([name, make]) => {
    const graph = make(false)
    const list = bfsCost(graph, firstId(graph), 'list')
    const matrix = bfsCost(graph, firstId(graph), 'matrix')
    assert.equal(list.dequeues, matrix.dequeues)
    return [name, [list.dequeues, list.reads, matrix.reads]]
  }))

  assert.deepEqual(costs, { sample: [4, 8, 28], tree: [7, 12, 49], complete: [6, 30, 36] })
})

test('BFS nguồn A — có hướng (reads danh sách = tổng bậc RA): Mẫu 4/5/28, Cây 7/6/49, K6 6/15/36', () => {
  const costs = Object.fromEntries(Object.entries(presets).map(([name, make]) => {
    const graph = make(true)
    const list = bfsCost(graph, firstId(graph), 'list')
    const matrix = bfsCost(graph, firstId(graph), 'matrix')
    return [name, [list.dequeues, list.reads, matrix.reads]]
  }))

  assert.deepEqual(costs, { sample: [4, 5, 28], tree: [7, 6, 49], complete: [6, 15, 36] })
})

test('BFS vô hướng liên thông (Cây, K6): danh sách reads = 2E, ma trận reads = V², dequeue = V', () => {
  for (const make of [presets.tree, presets.complete]) {
    const graph = make(false)
    const vertexCount = listVertices(graph).length
    const edgeCount = (adjacencyListSize(graph) - vertexCount) / 2

    for (const { id } of listVertices(graph)) {
      assert.deepEqual(bfsCost(graph, id, 'list'), { dequeues: vertexCount, reads: 2 * edgeCount })
      assert.deepEqual(bfsCost(graph, id, 'matrix'), { dequeues: vertexCount, reads: vertexCount * vertexCount })
    }
  }
})

// Quy mô lớn CHỈ cho danh sách kề: 300 đỉnh tạo 1200 bước. Ma trận kề tạo 2R + R·V + 2 bước (300 đỉnh ≈ 90 600 bước,
// mỗi bước giữ một bản sao đồ thị) nên chỉ đo ở 50 đỉnh.
const levelCounts = (distance) => Object.values(distance).reduce((counts, value) => {
  counts[value] = (counts[value] ?? 0) + 1
  return counts
}, {})

test('BFS danh sách, đường thẳng 300 đỉnh, nguồn ở đầu: 300 dequeue, reads 598 = 2E, mức cuối 299, 1200 bước', () => {
  const graph = buildGraph(false, 300, Array.from({ length: 299 }, (_, index) => [index, index + 1]))
  const steps = generateGraphBfsSteps(graph, firstId(graph), 'list')
  const last = steps.at(-1)

  assert.equal(last.orderIds.length, 300)
  assert.equal(last.reads, 598)
  assert.equal(last.distance[listVertices(graph).at(-1).id], 299)
  assert.equal(steps.length, 1200)
})

test('BFS danh sách, sao 300 đỉnh: nguồn ở tâm → mức {0: 1, 1: 299}; nguồn ở lá → {0: 1, 1: 1, 2: 298}; cả hai reads 598', () => {
  const graph = buildGraph(false, 300, Array.from({ length: 299 }, (_, index) => [0, index + 1]))
  const vertices = listVertices(graph)
  const center = generateGraphBfsSteps(graph, vertices[0].id, 'list').at(-1)
  const leaf = generateGraphBfsSteps(graph, vertices.at(-1).id, 'list').at(-1)

  assert.deepEqual(levelCounts(center.distance), { 0: 1, 1: 299 })
  assert.deepEqual(levelCounts(leaf.distance), { 0: 1, 1: 1, 2: 298 })
  assert.equal(leaf.distance[vertices[0].id], 1)
  for (const last of [center, leaf]) {
    assert.equal(last.orderIds.length, 300)
    assert.equal(last.reads, 598)
  }
})

test('BFS ma trận, đường thẳng 50 đỉnh: 50 dequeue, reads 2500 = V², 2602 bước (danh sách: 98 reads, 200 bước)', () => {
  const graph = buildGraph(false, 50, Array.from({ length: 49 }, (_, index) => [index, index + 1]))
  const matrix = generateGraphBfsSteps(graph, firstId(graph), 'matrix')
  const list = generateGraphBfsSteps(graph, firstId(graph), 'list')

  assert.deepEqual([matrix.at(-1).orderIds.length, matrix.at(-1).reads, matrix.length], [50, 2500, 2602])
  assert.deepEqual([list.at(-1).reads, list.length], [98, 200])
})

// ---- DFS từ s: đo số lần gọi (= R, mỗi lần vào một đỉnh là một lần gọi DFS), reads và độ sâu ngăn xếp tối đa (số khung).
const dfsCost = (graph, sourceId, representation) => {
  const steps = generateGraphDfsSteps(graph, sourceId, representation)
  const last = steps.at(-1)
  return {
    calls: last.visitedIds.length,
    reads: last.reads,
    depth: Math.max(...steps.map((step) => step.callStackIds.length)),
    steps: steps.length,
    result: last.result,
  }
}
const CYCLE5_PAIRS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]
const traversalPresets = {
  ...presets,
  cycle5: (directed) => buildGraph(directed, 5, CYCLE5_PAIRS),
  single: (directed) => buildGraph(directed, 1, []),
}

for (const directed of [false, true]) {
  const mode = directed ? 'có hướng' : 'vô hướng'
  const expected = directed
    ? { sample: [4, 5, 28, 4], tree: [7, 6, 49, 3], complete: [6, 15, 36, 6] }
    : { sample: [4, 8, 28, 4], tree: [7, 12, 49, 3], complete: [6, 30, 36, 6] }
  const text = Object.entries(expected).map(([name, values]) => `${name} ${values.join('/')}`).join(', ')

  test(`DFS nguồn A — ${mode} (gọi/reads danh sách/reads ma trận/độ sâu): ${text}`, () => {
    const costs = Object.fromEntries(Object.entries(presets).map(([name, make]) => {
      const graph = make(directed)
      const list = dfsCost(graph, firstId(graph), 'list')
      const matrix = dfsCost(graph, firstId(graph), 'matrix')
      assert.deepEqual([matrix.calls, matrix.depth], [list.calls, list.depth])
      assert.deepEqual(list.result, { reachable: list.calls, maxStackDepth: list.depth })
      return [name, [list.calls, list.reads, matrix.reads, list.depth]]
    }))

    assert.deepEqual(costs, expected)
  })
}

test('DFS và BFS đọc cùng số phần tử / ô: mọi đồ thị mẫu × mọi nguồn × hai chế độ × hai biểu diễn; số lần gọi = số lần dequeue = R', () => {
  for (const make of Object.values(traversalPresets)) {
    for (const directed of [false, true]) {
      const graph = make(directed)
      for (const { id, label } of listVertices(graph)) {
        for (const representation of ['list', 'matrix']) {
          const dfs = dfsCost(graph, id, representation)
          const bfs = bfsCost(graph, id, representation)
          assert.deepEqual([dfs.calls, dfs.reads], [bfs.dequeues, bfs.reads], `${label}, ${directed}, ${representation}`)
        }
      }
    }
  }
})

test('DFS danh sách, đường thẳng 300 đỉnh, nguồn ở đầu: 300 lần gọi, reads 598 = 2E, ngăn xếp sâu 300 = V, 1498 bước', () => {
  const graph = buildGraph(false, 300, Array.from({ length: 299 }, (_, index) => [index, index + 1]))
  const cost = dfsCost(graph, firstId(graph), 'list')

  assert.deepEqual([cost.calls, cost.reads, cost.depth, cost.steps], [300, 598, 300, 1498])
  assert.deepEqual(cost.result, { reachable: 300, maxStackDepth: 300 })
})

test('DFS danh sách, sao 300 đỉnh: nguồn ở tâm sâu 2; nguồn ở lá sâu 3; cả hai 300 lần gọi, reads 598', () => {
  const graph = buildGraph(false, 300, Array.from({ length: 299 }, (_, index) => [0, index + 1]))
  const vertices = listVertices(graph)
  const center = dfsCost(graph, vertices[0].id, 'list')
  const leaf = dfsCost(graph, vertices.at(-1).id, 'list')

  assert.deepEqual([center.calls, center.reads, center.depth], [300, 598, 2])
  assert.deepEqual([leaf.calls, leaf.reads, leaf.depth], [300, 598, 3])
})

// Ma trận chỉ đo ở 50 đỉnh: tạo 3R + R·V bước, mỗi bước giữ một bản sao đồ thị (300 đỉnh ≈ 90 900 bước, tràn bộ nhớ).
test('DFS ma trận, đường thẳng 50 đỉnh: 50 lần gọi, reads 2500 = V², sâu 50, 2650 bước (danh sách: 98 reads, 248 bước)', () => {
  const graph = buildGraph(false, 50, Array.from({ length: 49 }, (_, index) => [index, index + 1]))
  const matrix = dfsCost(graph, firstId(graph), 'matrix')
  const list = dfsCost(graph, firstId(graph), 'list')

  assert.deepEqual([matrix.calls, matrix.reads, matrix.depth, matrix.steps], [50, 2500, 50, 2650])
  assert.deepEqual([list.reads, list.depth, list.steps], [98, 50, 248])
})
