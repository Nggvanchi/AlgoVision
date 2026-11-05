import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGraph, listVertices } from '../src/structures/graph.js'
import * as bfsModule from '../src/algorithms/graphBfs.js'
import { assertBfsStepInvariants, lineText } from './helpers/graph-step-invariants.js'
import { deepFreeze } from './helpers/deep-freeze.js'

// Preset theo slot (giống src/graph.js): Mẫu A–B, A–C, B–C, C–D, E–F, G cô lập (có hướng thêm C→A);
// Cây A–B, A–C, B–D, B–E, C–F, C–G; K6 mọi cặp u < v. C5: chu trình A–B–C–D–E–A.
const SAMPLE_PAIRS = [[0, 1], [0, 2], [1, 2], [2, 3], [4, 5]]
const TREE_PAIRS = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]]
const COMPLETE_PAIRS = []
for (let u = 0; u < 6; u++) {
  for (let v = u + 1; v < 6; v++) COMPLETE_PAIRS.push([u, v])
}
const CYCLE5_PAIRS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]

const presets = {
  sample: (directed) => buildGraph(directed, 7, directed ? [...SAMPLE_PAIRS, [2, 0]] : SAMPLE_PAIRS),
  tree: (directed) => buildGraph(directed, 7, TREE_PAIRS),
  complete: (directed) => buildGraph(directed, 6, COMPLETE_PAIRS),
  cycle5: (directed) => buildGraph(directed, 5, CYCLE5_PAIRS),
  single: (directed) => buildGraph(directed, 1, []),
}

const idOf = (graph, label) => listVertices(graph).find((vertex) => vertex.label === label).id
const labelsOf = (graph, ids) => ids.map((id) => graph.vertices[id].label)
const run = (graph, label, representation) => bfsModule.generateGraphBfsSteps(graph, idOf(graph, label), representation)

// "A0 B1 … E—": khoảng cách theo nhãn ở bước cuối, null hiển thị "—".
function distanceText(step) {
  return listVertices(step.graph)
    .map((vertex) => `${vertex.label}${step.distance[vertex.id] ?? '—'}`)
    .join(' ')
}

// Khoảng cách ngắn nhất tính độc lập, KHÔNG dùng hàng đợi: lặp nới cạnh tới khi ổn định (kiểu Bellman–Ford, trọng số 1).
function shortestDistances(graph, sourceId) {
  const distance = Object.fromEntries(Object.keys(graph.vertices).map((id) => [id, null]))
  distance[sourceId] = 0
  let changed = true
  while (changed) {
    changed = false
    for (const [from, list] of Object.entries(graph.adjacency)) {
      if (distance[from] === null) continue
      for (const to of list) {
        if (distance[to] === null || distance[from] + 1 < distance[to]) {
          distance[to] = distance[from] + 1
          changed = true
        }
      }
    }
  }
  return distance
}

// Số lần mỗi đỉnh vào hàng đợi và dãy lấy ra, đọc thẳng từ frontierIds giữa hai bước liên tiếp:
// hàng dài thêm = enqueue phần tử cuối; hàng ngắn đi = dequeue phần tử đầu của bước trước.
function queueEvents(steps) {
  const enqueues = {}
  const dequeues = []
  steps.forEach((step, index) => {
    const before = index === 0 ? [] : steps[index - 1].frontierIds
    const after = step.frontierIds
    if (after.length > before.length) {
      const id = after.at(-1)
      enqueues[id] = (enqueues[id] ?? 0) + 1
    } else if (after.length < before.length) {
      dequeues.push(before[0])
    }
  })
  return { enqueues, dequeues }
}

test('mã giả BFS: danh sách kề và ma trận kề cùng 7 dòng, chỉ khác dòng 4–5', () => {
  assert.deepEqual(bfsModule.listBfsPseudocode, [
    'visited[s] ← true; dist[s] ← 0; Q ← [s]',
    'while Q không rỗng:',
    '  u ← dequeue(Q)',
    '  for each w in Adj[u]:',
    '    if not visited[w]:',
    '      visited[w] ← true; dist[w] ← dist[u] + 1; parent[w] ← u; enqueue(Q, w)',
    'return dist, parent',
  ])
  assert.deepEqual(bfsModule.matrixBfsPseudocode, [
    'visited[s] ← true; dist[s] ← 0; Q ← [s]',
    'while Q không rỗng:',
    '  u ← dequeue(Q)',
    '  for each w in V:',
    '    if M[u][w] = 1 and not visited[w]:',
    '      visited[w] ← true; dist[w] ← dist[u] + 1; parent[w] ← u; enqueue(Q, w)',
    'return dist, parent',
  ])
})

// Số dò tay ở bước lập kế hoạch. Số bước: danh sách 2R + D + 2, ma trận 2R + R·V + 2 (R đỉnh tới được, D = reads danh sách).
const expectations = [
  { name: 'Mẫu vô hướng', make: () => presets.sample(false), order: 'A B C D', distance: 'A0 B1 C1 D2 E— F— G—', list: [8, 18], matrix: [28, 38] },
  { name: 'Cây vô hướng', make: () => presets.tree(false), order: 'A B C D E F G', distance: 'A0 B1 C1 D2 E2 F2 G2', list: [12, 28], matrix: [49, 65] },
  { name: 'K6 vô hướng', make: () => presets.complete(false), order: 'A B C D E F', distance: 'A0 B1 C1 D1 E1 F1', list: [30, 44], matrix: [36, 50] },
  { name: 'Mẫu có hướng', make: () => presets.sample(true), order: 'A B C D', distance: 'A0 B1 C1 D2 E— F— G—', list: [5, 15], matrix: [28, 38] },
  { name: 'Một đỉnh', make: () => presets.single(false), order: 'A', distance: 'A0', list: [0, 4], matrix: [1, 5] },
]

for (const { name, make, order, distance, list, matrix } of expectations) {
  test(`${name}, nguồn A: thứ tự ${order}; ${distance}; danh sách reads ${list[0]} / ${list[1]} bước; ma trận reads ${matrix[0]} / ${matrix[1]} bước`, () => {
    const graph = make()
    for (const [representation, [reads, stepCount]] of [['list', list], ['matrix', matrix]]) {
      const steps = run(graph, 'A', representation)
      const last = steps.at(-1)

      assertBfsStepInvariants(steps)
      assert.equal(labelsOf(graph, last.orderIds).join(' '), order, representation)
      assert.equal(distanceText(last), distance, representation)
      assert.equal(last.reads, reads, representation)
      assert.equal(steps.length, stepCount, representation)
      assert.deepEqual(last.result, { reachable: last.orderIds.length })
    }
  })
}

test('Mẫu vô hướng, nguồn G (cô lập): chỉ thăm G; danh sách 4 bước reads 0, ma trận 11 bước reads 7', () => {
  const graph = presets.sample(false)
  const list = run(graph, 'G', 'list')
  const matrix = run(graph, 'G', 'matrix')

  for (const steps of [list, matrix]) {
    assertBfsStepInvariants(steps)
    assert.deepEqual(labelsOf(graph, steps.at(-1).orderIds), ['G'])
    assert.equal(distanceText(steps.at(-1)), 'A— B— C— D— E— F— G0')
  }
  assert.deepEqual([list.length, list.at(-1).reads], [4, 0])
  assert.deepEqual([matrix.length, matrix.at(-1).reads], [11, 7])
})

test('Mẫu vô hướng, danh sách, nguồn A: dãy dòng mã giả, reads và chữ của dòng được tô', () => {
  const graph = presets.sample(false)
  const steps = run(graph, 'A', 'list')

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 3, 5, 6, 5, 6, 3, 5, 5, 3, 5, 5, 5, 6, 3, 5, 7])
  assert.deepEqual(steps.map((step) => step.reads), [0, 0, 0, 1, 1, 2, 2, 2, 3, 4, 4, 5, 6, 7, 7, 7, 8, 8])
  assert.equal(lineText(bfsModule.listBfsPseudocode, steps[2]), '  u ← dequeue(Q)')
  assert.equal(lineText(bfsModule.listBfsPseudocode, steps[3]), '    if not visited[w]:')
  assert.equal(lineText(bfsModule.listBfsPseudocode, steps[4]).trim().startsWith('visited[w] ← true'), true)
  assert.equal(lineText(bfsModule.listBfsPseudocode, steps.at(-1)), 'return dist, parent')

  // Bước 7: lấy B khỏi hàng đợi. Bước 3: đọc B trong Adj[A].
  assert.equal(steps[7].message, 'Q không rỗng: lấy B khỏi đầu hàng đợi (dist = 1). Hàng đợi còn: C.')
  assert.equal(steps[7].currentVertexId, idOf(graph, 'B'))
  assert.equal(steps[7].currentEdge, null)
  assert.deepEqual(steps[3].currentEdge, { from: idOf(graph, 'A'), to: idOf(graph, 'B') })
  assert.deepEqual(labelsOf(graph, steps[4].frontierIds), ['B'])
  assert.equal(steps[15].message, 'Q không rỗng: lấy D khỏi đầu hàng đợi (dist = 2). Hàng đợi còn: (rỗng).')
})

test('Ma trận, đồ thị một đỉnh: 5 bước, đọc đúng ô M[A][A] (bằng 0, không có cạnh)', () => {
  const graph = presets.single(false)
  const steps = run(graph, 'A', 'matrix')
  const [a] = listVertices(graph).map((vertex) => vertex.id)

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 3, 5, 7])
  assert.deepEqual(steps.map((step) => step.reads), [0, 0, 0, 1, 1])
  assert.deepEqual(steps[3].matrixCell, { rowId: a, colId: a })
  assert.equal(steps[3].currentEdge, null)
  assert.equal(lineText(bfsModule.matrixBfsPseudocode, steps[3]), '    if M[u][w] = 1 and not visited[w]:')
})

test('Ma trận, Mẫu vô hướng nguồn A: ô bằng 1 có currentEdge, ô bằng 0 thì không; đỉnh mới thêm bước dòng 6', () => {
  const graph = presets.sample(false)
  const steps = run(graph, 'A', 'matrix')
  const [a, b] = listVertices(graph).map((vertex) => vertex.id)

  // Bước 3: M[A][A] = 0. Bước 4: M[A][B] = 1, B chưa đánh dấu. Bước 5: enqueue B.
  assert.deepEqual([steps[3].matrixCell, steps[3].currentEdge], [{ rowId: a, colId: a }, null])
  assert.deepEqual([steps[4].matrixCell, steps[4].currentEdge], [{ rowId: a, colId: b }, { from: a, to: b }])
  assert.deepEqual([steps[4].pseudocodeLine, steps[5].pseudocodeLine], [5, 6])
  assert.deepEqual(steps[5].frontierIds, [b])
})

test('Bước kết thúc: currentVertexId, currentEdge, matrixCell đều null; chỉ bước cuối finished', () => {
  for (const representation of ['list', 'matrix']) {
    const last = run(presets.sample(false), 'A', representation).at(-1)
    assert.deepEqual([last.currentVertexId, last.currentEdge, last.matrixCell], [null, null, null])
    assert.equal(last.finished, true)
    assert.deepEqual(last.frontierIds, [])
  }
})

test('C5 vô hướng, nguồn A: thứ tự A, B, E, C, D; dist C = 2 và D = 2 (dùng ngăn xếp sẽ ra C = 3)', () => {
  const graph = presets.cycle5(false)
  for (const representation of ['list', 'matrix']) {
    const last = run(graph, 'A', representation).at(-1)
    assert.deepEqual(labelsOf(graph, last.orderIds), ['A', 'B', 'E', 'C', 'D'])
    assert.equal(distanceText(last), 'A0 B1 C2 D2 E1')
  }
})

test('Có hướng chỉ đi theo cạnh ra: Mẫu có hướng nguồn B → B, C, A, D; nguồn D chỉ có D; nguồn E → E, F', () => {
  const graph = presets.sample(true)
  const orderFrom = (label) => labelsOf(graph, run(graph, label, 'list').at(-1).orderIds).join(' ')

  assert.equal(orderFrom('B'), 'B C A D')
  assert.equal(distanceText(run(graph, 'B', 'list').at(-1)), 'A2 B0 C1 D2 E— F— G—')
  assert.equal(orderFrom('D'), 'D')
  assert.equal(orderFrom('E'), 'E F')
})

// Mọi nguồn × 5 đồ thị × 2 chế độ × 2 biểu diễn.
for (const [presetName, make] of Object.entries(presets)) {
  for (const directed of [false, true]) {
    for (const representation of ['list', 'matrix']) {
      const mode = directed ? 'có hướng' : 'vô hướng'

      test(`${presetName} ${mode}, ${representation}, mọi nguồn: bất biến, mỗi đỉnh vào hàng đợi đúng một lần, dist ngắn nhất, reads, số bước`, () => {
        const graph = make(directed)
        const vertexCount = listVertices(graph).length

        for (const { id: sourceId } of listVertices(graph)) {
          const steps = bfsModule.generateGraphBfsSteps(graph, sourceId, representation)
          const last = steps.at(-1)
          const expected = shortestDistances(graph, sourceId)
          const reachable = Object.keys(expected).filter((id) => expected[id] !== null)
          const { enqueues, dequeues } = queueEvents(steps)
          const where = `nguồn ${graph.vertices[sourceId].label}`

          assertBfsStepInvariants(steps)
          assert.deepEqual(last.distance, expected, `${where}: dist khác đường đi ngắn nhất`)
          assert.deepEqual(enqueues, Object.fromEntries(reachable.map((id) => [id, 1])), `${where}: số lần enqueue`)
          assert.deepEqual(dequeues, last.orderIds, `${where}: thứ tự dequeue khác orderIds`)
          assert.deepEqual([...last.visitedIds].sort(), [...reachable].sort(), `${where}: tập đỉnh tới được`)

          const outDegreeSum = reachable.reduce((total, id) => total + graph.adjacency[id].length, 0)
          const reads = representation === 'list' ? outDegreeSum : reachable.length * vertexCount
          assert.equal(last.reads, reads, `${where}: reads`)
          assert.equal(steps.length, 2 * reachable.length + reads + 2, `${where}: số bước`)
        }
      })
    }
  }
}

test('Không sửa đồ thị đầu vào (deepFreeze); mỗi bước giữ đồ thị và mảng/đối tượng riêng', () => {
  const graph = deepFreeze(presets.sample(false))
  const steps = run(graph, 'A', 'list')

  for (let index = 1; index < steps.length; index++) {
    const [previous, current] = [steps[index - 1], steps[index]]
    assert.notEqual(current.graph, previous.graph)
    assert.notEqual(current.graph, graph)
    for (const field of ['visitedIds', 'frontierIds', 'orderIds', 'distance', 'parentIds']) {
      assert.notEqual(current[field], previous[field], `bước ${index}: ${field} dùng chung với bước trước`)
    }
  }

  steps[4].distance[idOf(graph, 'B')] = 99
  steps[4].frontierIds.push('v1')
  assert.equal(steps[5].distance[idOf(graph, 'B')], 1)
  assert.deepEqual(labelsOf(graph, steps[5].frontierIds), ['B'])
})

test('Nguồn không có trong đồ thị hoặc cách biểu diễn lạ thì ném RangeError', () => {
  const graph = presets.sample(false)
  assert.throws(() => bfsModule.generateGraphBfsSteps(graph, 'v99', 'list'), RangeError)
  assert.throws(() => bfsModule.generateGraphBfsSteps(graph, idOf(graph, 'A'), 'grid'), RangeError)
})
