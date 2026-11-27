import test from 'node:test'
import assert from 'node:assert/strict'
import { deepFreeze } from './helpers/deep-freeze.js'
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

test('EDU4: oracle literal 10 rows, trace và owned snapshot isolation', () => {
  // Fixture F dò tay trong hồ sơ P1; v5 cô lập. Số trong cursor là ID, không phải slot/nhãn.
  const graph = deepFreeze({
    directed: true, nextId: 6,
    vertices: {
      v1: { id: 'v1', slot: 0, label: 'A' }, v2: { id: 'v2', slot: 1, label: 'B' },
      v3: { id: 'v3', slot: 2, label: 'C' }, v4: { id: 'v4', slot: 3, label: 'D' },
      v5: { id: 'v5', slot: 4, label: 'E' },
    },
    adjacency: { v1: ['v2', 'v3'], v2: ['v4'], v3: ['v4'], v4: ['v2'], v5: [] },
  })
  const original = JSON.stringify(graph)
  const z = [null, null, null, null, null]
  const ids = (digits) => [...digits].map((digit) => `v${digit}`)
  const map = (values) => Object.fromEntries(values.map((value, i) => [`v${i + 1}`, value]))
  const parent = (values) => map(values.map((value) => value === null ? null : `v${value}`))
  // Literal phases: visited, FIFO, dequeue order, dist, parent. Không suy expected từ generator.
  const bfs = [
    ['', '', '', z, z], ['1', '1', '', [0, null, null, null, null], z],
    ['1', '', '1', [0, null, null, null, null], z],
    ['12', '2', '1', [0, 1, null, null, null], [null, 1, null, null, null]],
    ['123', '23', '1', [0, 1, 1, null, null], [null, 1, 1, null, null]],
    ['123', '3', '12', [0, 1, 1, null, null], [null, 1, 1, null, null]],
    ['1234', '34', '12', [0, 1, 1, 2, null], [null, 1, 1, 2, null]],
    ['1234', '4', '123', [0, 1, 1, 2, null], [null, 1, 1, 2, null]],
    ['1234', '', '1234', [0, 1, 1, 2, null], [null, 1, 1, 2, null]],
  ]
  // Literal phases: visited, explicit frames, finished, discovery, finish, parent.
  const dfs = [
    ['', '', '', z, z, z], ['1', '1', '', [1, null, null, null, null], z, z],
    ['1', '1', '', [1, null, null, null, null], z, [null, 1, null, null, null]],
    ['12', '12', '', [1, 2, null, null, null], z, [null, 1, null, null, null]],
    ['12', '12', '', [1, 2, null, null, null], z, [null, 1, null, 2, null]],
    ['124', '124', '', [1, 2, null, 3, null], z, [null, 1, null, 2, null]],
    ['124', '12', '4', [1, 2, null, 3, null], [null, null, null, 4, null], [null, 1, null, 2, null]],
    ['124', '1', '42', [1, 2, null, 3, null], [null, 5, null, 4, null], [null, 1, null, 2, null]],
    ['124', '1', '42', [1, 2, null, 3, null], [null, 5, null, 4, null], [null, 1, 1, 2, null]],
    ['1243', '13', '42', [1, 2, 6, 3, null], [null, 5, null, 4, null], [null, 1, 1, 2, null]],
    ['1243', '1', '423', [1, 2, 6, 3, null], [null, 5, 7, 4, null], [null, 1, 1, 2, null]],
    ['1243', '', '4231', [1, 2, 6, 3, null], [8, 5, 7, 4, null], [null, 1, 1, 2, null]],
  ]
  // Mỗi tuple = [line, reads, currentVertex, edgeTo, matrixColumn, phase/output].
  const cases = [
    { op: 'has-edge', rep: 'list', target: 'v3', result: true, trace: [
      [null, 0, null, null, null, ''], [2, 1, 2, 2, null, ''], [2, 2, 3, 3, null, ''],
    ] },
    { op: 'has-edge', rep: 'list', target: 'v4', result: false, trace: [
      [null, 0, null, null, null, ''], [2, 1, 2, 2, null, ''], [2, 2, 3, 3, null, ''], [3, 2, null, null, null, ''],
    ] },
    { op: 'has-edge', rep: 'matrix', target: 'v3', result: true, trace: [
      [null, 0, null, null, null, ''], [1, 1, null, 3, 3, ''],
    ] },
    { op: 'has-edge', rep: 'matrix', target: 'v4', result: false, trace: [
      [null, 0, null, null, null, ''], [1, 1, null, null, 4, ''],
    ] },
    { op: 'neighbors', rep: 'list', result: 2, trace: [
      [null, 0, null, null, null, ''], [1, 0, null, null, null, ''],
      [3, 1, 2, 2, null, '2'], [3, 2, 3, 3, null, '23'], [4, 2, null, null, null, '23'],
    ] },
    { op: 'neighbors', rep: 'matrix', result: 2, trace: [
      [null, 0, null, null, null, ''], [1, 0, null, null, null, ''],
      [3, 1, 1, null, 1, ''], [3, 2, 2, 2, 2, ''], [4, 2, 2, 2, 2, '2'],
      [3, 3, 3, 3, 3, '2'], [4, 3, 3, 3, 3, '23'], [3, 4, 4, null, 4, '23'],
      [3, 5, 5, null, 5, '23'], [5, 5, null, null, null, '23'],
    ] },
    { op: 'bfs', rep: 'list', result: { reachable: 4 }, trace: [
      [null, 0, null, null, null, 0], [1, 0, null, null, null, 1], [3, 0, 1, null, null, 2],
      [5, 1, 1, 2, null, 2], [6, 1, 1, 2, null, 3], [5, 2, 1, 3, null, 3], [6, 2, 1, 3, null, 4],
      [3, 2, 2, null, null, 5], [5, 3, 2, 4, null, 5], [6, 3, 2, 4, null, 6],
      [3, 3, 3, null, null, 7], [5, 4, 3, 4, null, 7], [3, 4, 4, null, null, 8],
      [5, 5, 4, 2, null, 8], [7, 5, null, null, null, 8],
    ] },
    { op: 'bfs', rep: 'matrix', result: { reachable: 4 }, trace: [
      [null, 0, null, null, null, 0], [1, 0, null, null, null, 1], [3, 0, 1, null, null, 2],
      [5, 1, 1, null, 1, 2], [5, 2, 1, 2, 2, 2], [6, 2, 1, 2, 2, 3],
      [5, 3, 1, 3, 3, 3], [6, 3, 1, 3, 3, 4], [5, 4, 1, null, 4, 4], [5, 5, 1, null, 5, 4],
      [3, 5, 2, null, null, 5], [5, 6, 2, null, 1, 5], [5, 7, 2, null, 2, 5],
      [5, 8, 2, null, 3, 5], [5, 9, 2, 4, 4, 5], [6, 9, 2, 4, 4, 6], [5, 10, 2, null, 5, 6],
      [3, 10, 3, null, null, 7], [5, 11, 3, null, 1, 7], [5, 12, 3, null, 2, 7],
      [5, 13, 3, null, 3, 7], [5, 14, 3, 4, 4, 7], [5, 15, 3, null, 5, 7],
      [3, 15, 4, null, null, 8], [5, 16, 4, null, 1, 8], [5, 17, 4, 2, 2, 8],
      [5, 18, 4, null, 3, 8], [5, 19, 4, null, 4, 8], [5, 20, 4, null, 5, 8], [7, 20, null, null, null, 8],
    ] },
    { op: 'dfs', rep: 'list', result: { reachable: 4, maxStackDepth: 3 }, trace: [
      [null, 0, null, null, null, 0], [2, 0, 1, null, null, 1], [4, 1, 1, 2, null, 1],
      [5, 1, 1, 2, null, 2], [2, 1, 2, null, null, 3], [4, 2, 2, 4, null, 3],
      [5, 2, 2, 4, null, 4], [2, 2, 4, null, null, 5], [4, 3, 4, 2, null, 5],
      [6, 3, 2, null, null, 6], [6, 3, 1, null, null, 7], [4, 4, 1, 3, null, 7],
      [5, 4, 1, 3, null, 8], [2, 4, 3, null, null, 9], [4, 5, 3, 4, null, 9],
      [6, 5, 1, null, null, 10], [6, 5, null, null, null, 11],
    ] },
    { op: 'dfs', rep: 'matrix', result: { reachable: 4, maxStackDepth: 3 }, trace: [
      [null, 0, null, null, null, 0], [2, 0, 1, null, null, 1], [4, 1, 1, null, 1, 1],
      [4, 2, 1, 2, 2, 1], [5, 2, 1, 2, 2, 2], [2, 2, 2, null, null, 3],
      [4, 3, 2, null, 1, 3], [4, 4, 2, null, 2, 3], [4, 5, 2, null, 3, 3],
      [4, 6, 2, 4, 4, 3], [5, 6, 2, 4, 4, 4], [2, 6, 4, null, null, 5],
      [4, 7, 4, null, 1, 5], [4, 8, 4, 2, 2, 5], [4, 9, 4, null, 3, 5],
      [4, 10, 4, null, 4, 5], [4, 11, 4, null, 5, 5], [6, 11, 2, null, null, 6],
      [4, 12, 2, null, 5, 6], [6, 12, 1, null, null, 7], [4, 13, 1, 3, 3, 7],
      [5, 13, 1, 3, 3, 8], [2, 13, 3, null, null, 9], [4, 14, 3, null, 1, 9],
      [4, 15, 3, null, 2, 9], [4, 16, 3, null, 3, 9], [4, 17, 3, 4, 4, 9],
      [4, 18, 3, null, 5, 9], [6, 18, 1, null, null, 10], [4, 19, 1, null, 4, 10],
      [4, 20, 1, null, 5, 10], [6, 20, null, null, null, 11],
    ] },
  ]
  assert.equal(cases.length, 10)
  const generate = { 'has-edge': generateGraphHasEdgeSteps, neighbors: generateGraphNeighborsSteps, bfs: generateGraphBfsSteps, dfs: generateGraphDfsSteps }
  for (const row of cases) {
    const steps = row.op === 'has-edge' ? generate[row.op](graph, 'v1', row.target, row.rep) : generate[row.op](graph, 'v1', row.rep)
    const context = `${row.op}/${row.rep}/${row.target ?? 'v1'}`
    assert.equal(steps.length, row.trace.length, context)
    row.trace.forEach(([line, reads, vertex, edgeTo, column, phase], index) => {
      const step = steps[index], done = index === row.trace.length - 1
      assert.deepEqual([step.operation, step.representation, step.sourceId, step.targetId], [row.op, row.rep, 'v1', row.target ?? null], context)
      assert.deepEqual([step.pseudocodeLine, step.reads, step.currentVertexId], [line, reads, vertex === null ? null : `v${vertex}`], `${context} bước ${index}`)
      const edgeFrom = row.op === 'has-edge' || row.op === 'neighbors' ? 'v1' : `v${vertex}`
      assert.deepEqual(step.currentEdge, edgeTo === null ? null : { from: edgeFrom, to: `v${edgeTo}` }, context)
      assert.deepEqual(step.matrixCell, column === null ? null : { rowId: row.op === 'bfs' || row.op === 'dfs' ? `v${vertex}` : 'v1', colId: `v${column}` }, context)
      assert.deepEqual([step.finished, step.result], [done, done ? row.result : null], context)
      assert.equal(typeof step.message, 'string')
      assert.ok(step.message.length > 0)
      assert.deepEqual(step.graph, graph)
      assert.deepEqual(step.outputIds, row.op === 'neighbors' ? ids(phase) : [])
      if (row.op === 'bfs') {
        const [visited, queue, order, distance, parents] = bfs[phase]
        assert.deepEqual([step.visitedIds, step.frontierIds, step.orderIds], [ids(visited), ids(queue), ids(order)])
        assert.deepEqual(step.distance, map(distance), `${context} dist bước ${index}`)
        assert.deepEqual(step.parentIds, parent(parents))
      } else if (row.op === 'dfs') {
        const [visited, stack, finished, discovery, finish, parents] = dfs[phase]
        assert.deepEqual([step.visitedIds, step.callStackIds, step.finishedIds], [ids(visited), ids(stack), ids(finished)])
        assert.deepEqual([step.discovery, step.finish, step.parentIds], [map(discovery), map(finish), parent(parents)])
      }
    })
    // Owned snapshots tách riêng; không ép cursor currentEdge/matrixCell khác identity giữa check/enqueue/call.
    const owned = ['graph', 'outputIds', ...(row.op === 'bfs' ? ['visitedIds', 'frontierIds', 'orderIds', 'distance', 'parentIds'] : row.op === 'dfs' ? ['visitedIds', 'callStackIds', 'finishedIds', 'discovery', 'finish', 'parentIds'] : [])]
    for (const field of owned) assert.equal(new Set(steps.map((step) => step[field])).size, steps.length, `${context} owned ${field}`)
    const earlier = JSON.stringify(steps.slice(0, -1))
    steps.at(-1).graph.vertices.v1.label = 'Bản sao độc lập'
    steps.at(-1).outputIds.push('v5')
    assert.equal(JSON.stringify(steps.slice(0, -1)), earlier, 'sửa snapshot cuối không làm đổi bước cũ')
    assert.equal(JSON.stringify(graph), original, 'input đóng băng giữ nguyên')
    deepFreeze(steps)
    const preserved = JSON.stringify(steps)
    if (row.op === 'has-edge') generate[row.op](graph, 'v1', row.target, row.rep)
    else generate[row.op](graph, 'v1', row.rep)
    assert.equal(JSON.stringify(steps), preserved, 'lần sinh sau không sửa trace cũ')
  }
})
