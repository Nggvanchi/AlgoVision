import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGraph, listVertices } from '../src/structures/graph.js'
import * as dfsModule from '../src/algorithms/graphDfs.js'
import { assertDfsStepInvariants, lineText } from './helpers/graph-step-invariants.js'
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
const run = (graph, label, representation) => dfsModule.generateGraphDfsSteps(graph, idOf(graph, label), representation)

// DFS ĐỆ QUY độc lập (không dùng generator): thứ tự thăm, mốc vào/ra, parent, độ sâu ngăn xếp tối đa (số khung).
function recursiveDfs(graph, sourceId) {
  const ids = Object.keys(graph.vertices)
  const result = {
    order: [],
    discovery: Object.fromEntries(ids.map((id) => [id, null])),
    finish: Object.fromEntries(ids.map((id) => [id, null])),
    parent: Object.fromEntries(ids.map((id) => [id, null])),
    maxDepth: 0,
  }
  let clock = 0
  const visit = (vertexId, depth) => {
    result.order.push(vertexId)
    result.discovery[vertexId] = ++clock
    result.maxDepth = Math.max(result.maxDepth, depth)
    for (const neighborId of graph.adjacency[vertexId]) {
      if (result.discovery[neighborId] !== null) continue
      result.parent[neighborId] = vertexId
      visit(neighborId, depth + 1)
    }
    result.finish[vertexId] = ++clock
  }
  visit(sourceId, 1)
  return result
}

// "A(1,14) B(2,7) …": mốc vào/ra theo nhãn ở bước cuối, chỉ các đỉnh đã thăm.
function stampsText(step) {
  return listVertices(step.graph)
    .filter((vertex) => step.discovery[vertex.id] !== null)
    .map((vertex) => `${vertex.label}(${step.discovery[vertex.id]},${step.finish[vertex.id]})`)
    .join(' ')
}

// Số lần mỗi đỉnh được đẩy vào ngăn xếp, đọc thẳng từ callStackIds giữa hai bước liên tiếp.
function pushCounts(steps) {
  const counts = {}
  steps.forEach((step, index) => {
    const before = index === 0 ? [] : steps[index - 1].callStackIds
    if (step.callStackIds.length > before.length) {
      const id = step.callStackIds.at(-1)
      counts[id] = (counts[id] ?? 0) + 1
    }
  })
  return counts
}

const maxStackLength = (steps) => Math.max(...steps.map((step) => step.callStackIds.length))

test('mã giả DFS: danh sách kề và ma trận kề cùng 6 dòng, chỉ khác dòng 3–4', () => {
  assert.deepEqual(dfsModule.listDfsPseudocode, [
    'DFS(u):',
    '  visited[u] ← true; t ← t + 1; vào[u] ← t',
    '  for each w in Adj[u]:',
    '    if not visited[w]:',
    '      parent[w] ← u; DFS(w)',
    '  t ← t + 1; ra[u] ← t; return',
  ])
  assert.deepEqual(dfsModule.matrixDfsPseudocode, [
    'DFS(u):',
    '  visited[u] ← true; t ← t + 1; vào[u] ← t',
    '  for each w in V:',
    '    if M[u][w] = 1 and not visited[w]:',
    '      parent[w] ← u; DFS(w)',
    '  t ← t + 1; ra[u] ← t; return',
  ])
})

// Số dò tay ở bước lập kế hoạch. Số bước: danh sách 3R + D, ma trận 3R + R·V (R đỉnh tới được, D = reads danh sách).
const expectations = [
  { name: 'Mẫu vô hướng', make: () => presets.sample(false), order: 'A B C D', depth: 4, list: [8, 20], matrix: [28, 40] },
  { name: 'Cây vô hướng', make: () => presets.tree(false), order: 'A B D E C F G', depth: 3, list: [12, 33], matrix: [49, 70] },
  { name: 'K6 vô hướng', make: () => presets.complete(false), order: 'A B C D E F', depth: 6, list: [30, 48], matrix: [36, 54] },
  { name: 'Mẫu có hướng', make: () => presets.sample(true), order: 'A B C D', depth: 4, list: [5, 17], matrix: [28, 40] },
  { name: 'C5 vô hướng', make: () => presets.cycle5(false), order: 'A B C D E', depth: 5, list: [10, 25], matrix: [25, 40] },
  { name: 'Một đỉnh', make: () => presets.single(false), order: 'A', depth: 1, list: [0, 3], matrix: [1, 4] },
]

for (const { name, make, order, depth, list, matrix } of expectations) {
  test(`${name}, nguồn A: thứ tự ${order}; ngăn xếp sâu nhất ${depth}; danh sách reads ${list[0]} / ${list[1]} bước; ma trận reads ${matrix[0]} / ${matrix[1]} bước`, () => {
    const graph = make()
    for (const [representation, [reads, stepCount]] of [['list', list], ['matrix', matrix]]) {
      const steps = run(graph, 'A', representation)
      const last = steps.at(-1)

      assertDfsStepInvariants(steps)
      assert.equal(labelsOf(graph, last.visitedIds).join(' '), order, representation)
      assert.equal(last.reads, reads, representation)
      assert.equal(steps.length, stepCount, representation)
      assert.equal(maxStackLength(steps), depth, representation)
      assert.deepEqual(last.result, { reachable: last.visitedIds.length, maxStackDepth: depth }, representation)
    }
  })
}

test('Mốc vào/ra: Cây từ A là A(1,14) B(2,7) D(3,4) E(5,6) C(8,13) F(9,10) G(11,12); Mẫu từ A là A(1,8) B(2,7) C(3,6) D(4,5)', () => {
  for (const representation of ['list', 'matrix']) {
    assert.equal(stampsText(run(presets.tree(false), 'A', representation).at(-1)),
      'A(1,14) B(2,7) C(8,13) D(3,4) E(5,6) F(9,10) G(11,12)', representation)
    assert.equal(stampsText(run(presets.sample(false), 'A', representation).at(-1)),
      'A(1,8) B(2,7) C(3,6) D(4,5)', representation)
  }
})

test('Cây và C5 phân biệt DFS với BFS: Cây A B D E C F G (BFS: A B C D E F G); C5 A B C D E (BFS: A B E C D)', () => {
  for (const representation of ['list', 'matrix']) {
    const tree = presets.tree(false)
    const cycle = presets.cycle5(false)
    assert.deepEqual(labelsOf(tree, run(tree, 'A', representation).at(-1).visitedIds), ['A', 'B', 'D', 'E', 'C', 'F', 'G'])
    assert.deepEqual(labelsOf(cycle, run(cycle, 'A', representation).at(-1).visitedIds), ['A', 'B', 'C', 'D', 'E'])
  }
})

test('Mẫu vô hướng, nguồn G (cô lập): chỉ thăm G; danh sách 3 bước reads 0, ma trận 10 bước reads 7', () => {
  const graph = presets.sample(false)
  const list = run(graph, 'G', 'list')
  const matrix = run(graph, 'G', 'matrix')

  for (const steps of [list, matrix]) {
    assertDfsStepInvariants(steps)
    assert.deepEqual(labelsOf(graph, steps.at(-1).visitedIds), ['G'])
    assert.equal(stampsText(steps.at(-1)), 'G(1,2)')
  }
  assert.deepEqual([list.length, list.at(-1).reads], [3, 0])
  assert.deepEqual([matrix.length, matrix.at(-1).reads], [10, 7])
})

test('Mẫu vô hướng, danh sách, nguồn A: dãy dòng mã giả, reads, ngăn xếp và chữ của dòng được tô', () => {
  const graph = presets.sample(false)
  const steps = run(graph, 'A', 'list')

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 2, 4, 5, 2, 4, 4, 5, 2, 4, 4, 4, 5, 2, 4, 6, 6, 6, 4, 6])
  assert.deepEqual(steps.map((step) => step.reads), [0, 0, 1, 1, 1, 2, 3, 3, 3, 4, 5, 6, 6, 6, 7, 7, 7, 7, 8, 8])
  assert.deepEqual(steps.map((step) => labelsOf(graph, step.callStackIds).join('')),
    ['', 'A', 'A', 'A', 'AB', 'AB', 'AB', 'AB', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABCD', 'ABCD', 'ABC', 'AB', 'A', 'A', ''])
  assert.equal(lineText(dfsModule.listDfsPseudocode, steps[1]), '  visited[u] ← true; t ← t + 1; vào[u] ← t')
  assert.equal(lineText(dfsModule.listDfsPseudocode, steps[2]), '    if not visited[w]:')
  assert.equal(lineText(dfsModule.listDfsPseudocode, steps[3]), '      parent[w] ← u; DFS(w)')
  assert.equal(lineText(dfsModule.listDfsPseudocode, steps.at(-1)), '  t ← t + 1; ra[u] ← t; return')

  assert.equal(steps[4].message, 'Vào DFS(B): đánh dấu B, vào[B] = 2. Ngăn xếp (đáy → đỉnh): A, B.')
  assert.equal(steps[5].message, 'A đã được thăm: bỏ qua.')
  assert.equal(steps[6].message, 'C chưa được thăm.')
  assert.equal(steps[7].message, 'parent[C] = B; gọi DFS(C).')
  assert.equal(steps[15].message, 'Đọc hết Adj[D]: ra[D] = 5, trả về C.')
  assert.equal(steps.at(-1).message, 'Đọc hết Adj[A]: ra[A] = 8, DFS(A) trả về, ngăn xếp rỗng. Đã thăm 4/7 đỉnh (đã đọc 8).')
})

test('Bước "gọi": parent[w] đã gán khi w CHƯA thăm, currentEdge = (u, w); bước "vào w" ngay sau mới thăm w, currentEdge = null', () => {
  const graph = presets.sample(false)
  const [a, b] = listVertices(graph).map((vertex) => vertex.id)
  const steps = run(graph, 'A', 'list')
  const [call, enter] = [steps[3], steps[4]]

  assert.equal(call.parentIds[b], a)
  assert.equal(call.visitedIds.includes(b), false)
  assert.equal(call.discovery[b], null)
  assert.deepEqual(call.currentEdge, { from: a, to: b })
  assert.deepEqual(call.callStackIds, [a])
  assert.equal(call.currentVertexId, a)

  assert.equal(enter.visitedIds.includes(b), true)
  assert.equal(enter.currentEdge, null)
  assert.deepEqual(enter.callStackIds, [a, b])
  assert.equal(enter.currentVertexId, b)
})

test('Bước "ra u": u đã đóng và rời ngăn xếp, currentVertexId là đỉnh cha (đỉnh mới của ngăn xếp)', () => {
  const graph = presets.sample(false)
  const steps = run(graph, 'A', 'list')
  const finishD = steps[15]

  assert.deepEqual(labelsOf(graph, finishD.finishedIds), ['D'])
  assert.deepEqual(labelsOf(graph, finishD.callStackIds), ['A', 'B', 'C'])
  assert.equal(finishD.currentVertexId, idOf(graph, 'C'))
  assert.deepEqual([finishD.currentEdge, finishD.matrixCell], [null, null])
})

test('Bước cuối là bước ra(s): finished, dòng 6, currentVertexId/currentEdge/matrixCell null, ngăn xếp rỗng, mọi đỉnh đã thăm đã đóng', () => {
  for (const representation of ['list', 'matrix']) {
    const steps = run(presets.sample(false), 'A', representation)
    const last = steps.at(-1)
    assert.equal(last.finished, true)
    assert.equal(last.pseudocodeLine, 6)
    assert.deepEqual([last.currentVertexId, last.currentEdge, last.matrixCell], [null, null, null])
    assert.deepEqual(last.callStackIds, [])
    assert.deepEqual([...last.finishedIds].sort(), [...last.visitedIds].sort())
    assert.equal(steps.filter((step) => step.finished).length, 1)
  }
})

test('Ma trận, đồ thị một đỉnh: 4 bước, đọc đúng ô M[A][A] (bằng 0, không có cạnh)', () => {
  const graph = presets.single(false)
  const steps = run(graph, 'A', 'matrix')
  const [a] = listVertices(graph).map((vertex) => vertex.id)

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 2, 4, 6])
  assert.deepEqual(steps.map((step) => step.reads), [0, 0, 1, 1])
  assert.deepEqual([steps[2].matrixCell, steps[2].currentEdge], [{ rowId: a, colId: a }, null])
  assert.equal(steps[2].message, 'M[A][A] = 0: bỏ qua.')
  assert.equal(lineText(dfsModule.matrixDfsPseudocode, steps[2]), '    if M[u][w] = 1 and not visited[w]:')
})

test('Ma trận, Mẫu vô hướng nguồn A: ô 0 không có currentEdge; ô 1 có; bước gọi giữ ô đang đọc; bước vào bỏ ô', () => {
  const graph = presets.sample(false)
  const steps = run(graph, 'A', 'matrix')
  const [a, b] = listVertices(graph).map((vertex) => vertex.id)

  // Bước 2: M[A][A] = 0. Bước 3: M[A][B] = 1, B chưa thăm. Bước 4: gọi DFS(B). Bước 5: vào B.
  assert.deepEqual([steps[2].matrixCell, steps[2].currentEdge], [{ rowId: a, colId: a }, null])
  assert.deepEqual([steps[3].matrixCell, steps[3].currentEdge], [{ rowId: a, colId: b }, { from: a, to: b }])
  assert.equal(steps[3].message, 'M[A][B] = 1, B chưa được thăm.')
  assert.deepEqual([steps[4].pseudocodeLine, steps[4].matrixCell, steps[4].currentEdge], [5, { rowId: a, colId: b }, { from: a, to: b }])
  assert.deepEqual([steps[5].pseudocodeLine, steps[5].matrixCell, steps[5].currentEdge], [2, null, null])
})

test('Có hướng chỉ đi theo cạnh ra: Mẫu có hướng nguồn B → B C A D; nguồn D chỉ có D; nguồn E → E F', () => {
  const graph = presets.sample(true)
  const orderFrom = (label) => labelsOf(graph, run(graph, label, 'list').at(-1).visitedIds).join(' ')

  assert.equal(orderFrom('B'), 'B C A D')
  assert.equal(orderFrom('D'), 'D')
  assert.equal(orderFrom('E'), 'E F')
})

// Mọi nguồn × 5 đồ thị × 2 chế độ × 2 biểu diễn, đối chiếu với DFS đệ quy độc lập.
for (const [presetName, make] of Object.entries(presets)) {
  for (const directed of [false, true]) {
    for (const representation of ['list', 'matrix']) {
      const mode = directed ? 'có hướng' : 'vô hướng'

      test(`${presetName} ${mode}, ${representation}, mọi nguồn: bất biến, khớp DFS đệ quy, mỗi đỉnh vào ngăn xếp đúng một lần, mốc lồng nhau, reads, số bước`, () => {
        const graph = make(directed)
        const vertexCount = listVertices(graph).length

        for (const { id: sourceId } of listVertices(graph)) {
          const steps = dfsModule.generateGraphDfsSteps(graph, sourceId, representation)
          const last = steps.at(-1)
          const expected = recursiveDfs(graph, sourceId)
          const reachable = expected.order
          const where = `nguồn ${graph.vertices[sourceId].label}`

          assertDfsStepInvariants(steps)
          assert.deepEqual(last.visitedIds, expected.order, `${where}: thứ tự thăm khác DFS đệ quy`)
          assert.deepEqual(last.discovery, expected.discovery, `${where}: mốc vào`)
          assert.deepEqual(last.finish, expected.finish, `${where}: mốc ra`)
          assert.deepEqual(last.parentIds, expected.parent, `${where}: parent`)
          assert.deepEqual(pushCounts(steps), Object.fromEntries(reachable.map((id) => [id, 1])), `${where}: số lần vào ngăn xếp`)
          assert.equal(maxStackLength(steps), expected.maxDepth, `${where}: độ sâu ngăn xếp tối đa`)
          assert.equal(last.result.maxStackDepth, expected.maxDepth, `${where}: result.maxStackDepth`)

          // Mốc lồng nhau: khoảng [vào, ra] của con nằm trong khoảng của cha.
          for (const id of reachable) {
            const parentId = last.parentIds[id]
            if (parentId === null) continue
            assert.ok(last.discovery[parentId] < last.discovery[id] && last.finish[id] < last.finish[parentId],
              `${where}: khoảng của ${graph.vertices[id].label} không nằm trong khoảng của cha`)
          }

          const outDegreeSum = reachable.reduce((total, id) => total + graph.adjacency[id].length, 0)
          const reads = representation === 'list' ? outDegreeSum : reachable.length * vertexCount
          assert.equal(last.reads, reads, `${where}: reads`)
          assert.equal(steps.length, 3 * reachable.length + reads, `${where}: số bước`)
        }
      })
    }
  }
}

test('Độ sâu ngăn xếp mỗi bước = độ sâu theo parent của đỉnh ngăn xếp + 1 (Cây, nguồn A)', () => {
  const graph = presets.tree(false)
  const steps = run(graph, 'A', 'list')
  const depthOf = (step, id) => {
    let depth = 0
    for (let current = id; current !== null; current = step.parentIds[current]) depth++
    return depth
  }

  for (const step of steps) {
    if (step.currentVertexId === null) continue
    assert.equal(step.callStackIds.length, depthOf(step, step.currentVertexId))
  }
})

test('Không sửa đồ thị đầu vào (deepFreeze); mỗi bước giữ đồ thị và mảng/đối tượng riêng', () => {
  const graph = deepFreeze(presets.sample(false))
  const steps = run(graph, 'A', 'list')

  for (let index = 1; index < steps.length; index++) {
    const [previous, current] = [steps[index - 1], steps[index]]
    assert.notEqual(current.graph, previous.graph)
    assert.notEqual(current.graph, graph)
    for (const field of ['visitedIds', 'callStackIds', 'finishedIds', 'discovery', 'finish', 'parentIds']) {
      assert.notEqual(current[field], previous[field], `bước ${index}: ${field} dùng chung với bước trước`)
    }
  }

  steps[4].discovery[idOf(graph, 'B')] = 99
  steps[4].callStackIds.push('v7')
  assert.equal(steps[5].discovery[idOf(graph, 'B')], 2)
  assert.deepEqual(labelsOf(graph, steps[5].callStackIds), ['A', 'B'])
})

test('Nguồn không có trong đồ thị hoặc cách biểu diễn lạ thì ném RangeError', () => {
  const graph = presets.sample(false)
  assert.throws(() => dfsModule.generateGraphDfsSteps(graph, 'v99', 'list'), RangeError)
  assert.throws(() => dfsModule.generateGraphDfsSteps(graph, idOf(graph, 'A'), 'grid'), RangeError)
})
