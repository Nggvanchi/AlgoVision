import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

import * as dfsView from '../src/graph-dfs-view.js'
import { buildGraph, listVertices } from '../src/structures/graph.js'
import { generateGraphDfsSteps } from '../src/algorithms/graphDfs.js'

// Mẫu vô hướng: A–B, A–C, B–C, C–D, E–F, G cô lập. Bước DFS danh sách từ A (xem tests/graph-dfs.test.js):
// 3 gọi DFS(B), 4 vào B, 13 vào D (ngăn xếp A B C D), 15 ra D, 19 ra A (bước cuối).
// Cây: A–B, A–C, B–D, B–E, C–F, C–G; DFS danh sách từ A: 6 đọc D trong Adj[B], 8 vào D, 10 ra D.
const SAMPLE_PAIRS = [[0, 1], [0, 2], [1, 2], [2, 3], [4, 5]]
const TREE_PAIRS = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]]
const idOf = (graph, label) => listVertices(graph).find((vertex) => vertex.label === label).id
const labelsOf = (graph, ids) => [...ids].map((id) => graph.vertices[id].label)
const dfsFromA = (pairs, representation) => {
  const graph = buildGraph(false, 7, pairs)
  return { graph, steps: generateGraphDfsSteps(graph, idOf(graph, 'A'), representation) }
}

function createDocument() {
  const window = new Window()
  return { window, document: window.document }
}

test('graph-dfs-view.js không import ngược src/graph.js (tránh vòng import)', async () => {
  const source = await readFile(new URL('../src/graph-dfs-view.js', import.meta.url), 'utf8')
  const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])

  assert.ok(imports.length > 0)
  assert.ok(!imports.some((path) => /(^|\/)graph\.js$/.test(path) && !path.includes('structures/')), imports.join(', '))
})

test('dfsVertexStatus suy từ dữ liệu: chưa thăm / đang mở / đã đóng', () => {
  const { graph, steps } = dfsFromA(SAMPLE_PAIRS, 'list')
  const status = (step, label) => dfsView.dfsVertexStatus(step, idOf(graph, label))

  assert.deepEqual(['A', 'B', 'D'].map((label) => status(steps[13], label)), ['open', 'open', 'open'])
  assert.deepEqual(['D', 'C', 'E'].map((label) => status(steps[15], label)), ['closed', 'open', 'unvisited'])
  assert.equal(dfsView.dfsStatusText.closed, 'đã đóng')
})

test('dfsVertexMarks giữa chừng (vào D): A, B, C, D đang mở; chưa đỉnh nào đóng; nhãn mốc s·1/–, 2/–, 3/–, 4/–', () => {
  const { graph, steps } = dfsFromA(SAMPLE_PAIRS, 'list')
  const marks = dfsView.dfsVertexMarks(steps[13])

  assert.deepEqual(labelsOf(graph, marks.openIds), ['A', 'B', 'C', 'D'])
  assert.equal(marks.doneIds.size, 0)
  assert.equal(marks.queuedIds.size, 0)
  assert.deepEqual(Object.fromEntries([...marks.badges].map(([id, text]) => [graph.vertices[id].label, text])), {
    A: 's·1/–', B: '2/–', C: '3/–', D: '4/–',
  })
})

test('dfsVertexMarks bước cuối: mọi đỉnh đã thăm đã đóng, không còn đỉnh mở; bước 0 chỉ nguồn có nhãn "s"', () => {
  const { graph, steps } = dfsFromA(SAMPLE_PAIRS, 'list')
  const last = dfsView.dfsVertexMarks(steps.at(-1))

  assert.deepEqual(labelsOf(graph, last.doneIds), ['D', 'C', 'B', 'A'])
  assert.equal(last.openIds.size, 0)
  assert.equal(last.badges.get(idOf(graph, 'A')), 's·1/8')
  assert.equal(last.badges.get(idOf(graph, 'D')), '4/5')
  assert.equal(last.badges.has(idOf(graph, 'E')), false)

  assert.deepEqual([...dfsView.dfsVertexMarks(steps[0]).badges], [[idOf(graph, 'A'), 's']])
})

// Bước DFS có id lạ ở mọi trường tham chiếu: phải bỏ qua, không lỗi.
function strangeStep() {
  const graph = buildGraph(false, 3, [[0, 1]])
  return {
    graph,
    operation: 'dfs',
    representation: 'list',
    sourceId: 'v1',
    currentVertexId: 'v98',
    currentEdge: { from: 'v1', to: 'v97' },
    matrixCell: { rowId: 'v1', colId: 'v95' },
    visitedIds: ['v1', 'v2', 'v99'],
    callStackIds: ['v1', 'v99', 'v2'],
    finishedIds: ['v98'],
    discovery: { v1: 1, v2: 2, v99: 3 },
    finish: { v1: null, v2: null, v99: null },
    parentIds: { v1: null, v2: 'v1', v3: 'v96', v99: 'v1' },
    reads: 1,
    finished: true,
    result: { reachable: 9, maxStackDepth: 9 },
  }
}

test('dfsVertexMarks, renderDfsStack, renderDfsOrder, renderDfsTable bỏ qua id lạ', () => {
  const { document } = createDocument()
  const step = strangeStep()
  const marks = dfsView.dfsVertexMarks(step)

  assert.deepEqual([...marks.openIds], ['v1', 'v2'])
  assert.equal(marks.doneIds.size, 0)
  assert.deepEqual([...marks.badges.keys()].sort(), ['v1', 'v2'])

  const stack = document.createElement('ol')
  dfsView.renderDfsStack(stack, step)
  assert.deepEqual([...stack.querySelectorAll('.graph-dfs-stack-item')].map((item) => item.dataset.label), ['B', 'A'])

  const order = document.createElement('ol')
  dfsView.renderDfsOrder(order, step)
  assert.deepEqual([...order.querySelectorAll('.graph-dfs-order-item')].map((item) => item.dataset.label), ['A', 'B'])

  const table = document.createElement('table')
  dfsView.renderDfsTable(table, step)
  assert.deepEqual([...table.querySelectorAll('tbody tr')].map((row) => [...row.children].map((cell) => cell.textContent)), [
    ['A', '1', '—', '—', 'đang mở'], ['B', '2', '—', 'A', 'đang mở'], ['C', '—', '—', '—', 'chưa thăm'],
  ])
})

const listRow = (graph, step, owner) => graph.adjacency[idOf(graph, owner)]
  .map((neighborId, index) => dfsView.dfsListReadState(step, idOf(graph, owner), neighborId, index))

test('dfsListReadState Cây sau khi vào D: A đọc tới và gồm B; B đọc tới và gồm D; D chưa đọc; C chưa đọc', () => {
  const { graph, steps } = dfsFromA(TREE_PAIRS, 'list')
  const step = steps[8]
  assert.equal(step.message.startsWith('Vào DFS(D)'), true)

  assert.deepEqual(listRow(graph, step, 'A'), ['read', null])
  assert.deepEqual(listRow(graph, step, 'B'), ['read', 'read', null])
  assert.deepEqual(listRow(graph, step, 'D'), [null])
  assert.deepEqual(listRow(graph, step, 'C'), [null, null, null])
})

test('dfsListReadState Cây khi đọc D trong Adj[B]: B có A đã đọc, D đang đọc; sau khi ra D: D đọc hết, B đọc tới D', () => {
  const { graph, steps } = dfsFromA(TREE_PAIRS, 'list')

  assert.deepEqual(listRow(graph, steps[6], 'B'), ['read', 'current', null])
  assert.deepEqual(listRow(graph, steps[6], 'A'), ['read', null])
  assert.equal(steps[10].message.startsWith('Đọc hết Adj[D]'), true)
  assert.deepEqual(listRow(graph, steps[10], 'D'), ['read'])
  assert.deepEqual(listRow(graph, steps[10], 'B'), ['read', 'read', null])
})

test('dfsMatrixReadState Cây sau khi vào D: hàng A đọc tới cột B, hàng B đọc tới cột D; biểu diễn danh sách thì không tô', () => {
  const { graph, steps } = dfsFromA(TREE_PAIRS, 'matrix')
  const step = steps.find((candidate) => candidate.message.startsWith('Vào DFS(D)'))
  const ids = listVertices(graph).map((vertex) => vertex.id)
  const row = (label) => ids.map((columnId, index) => dfsView.dfsMatrixReadState(step, idOf(graph, label), columnId, index))

  assert.deepEqual(row('A'), ['read', 'read', null, null, null, null, null])
  assert.deepEqual(row('B'), ['read', 'read', 'read', 'read', null, null, null])
  assert.deepEqual(row('D'), Array(7).fill(null))
  assert.equal(dfsView.dfsListReadState(step, idOf(graph, 'A'), idOf(graph, 'B'), 0), null)
})

test('renderDfsStack: cột dọc đỉnh ở trên, nhãn "đỉnh"/"đáy", ▶ và aria-current ở khung đỉnh; rỗng ghi "(rỗng)"', () => {
  const { document } = createDocument()
  const list = document.createElement('ol')
  const { steps } = dfsFromA(SAMPLE_PAIRS, 'list')

  dfsView.renderDfsStack(list, steps[13])
  const items = [...list.querySelectorAll('.graph-dfs-stack-item')]
  assert.deepEqual(items.map((item) => item.querySelector('.graph-dfs-stack-call').textContent), ['DFS(D)', 'DFS(C)', 'DFS(B)', 'DFS(A)'])
  assert.deepEqual(items.map((item) => item.querySelector('.graph-dfs-stack-time').textContent), ['vào 4', 'vào 3', 'vào 2', 'vào 1'])
  assert.deepEqual(items.map((item) => item.querySelector('.graph-dfs-stack-tag')?.textContent ?? null), ['đỉnh', null, null, 'đáy'])
  assert.equal(items[0].getAttribute('aria-current'), 'true')
  assert.equal(items[0].querySelector('.graph-entry-marker').textContent, '▶')
  assert.equal(items[1].hasAttribute('aria-current'), false)
  assert.equal(list.getAttribute('aria-label'), 'Ngăn xếp gọi (đỉnh → đáy): D, C, B, A.')

  dfsView.renderDfsStack(list, steps[1])
  assert.equal(list.querySelector('.graph-dfs-stack-tag').textContent, 'đỉnh · đáy')

  dfsView.renderDfsStack(list, steps[0])
  assert.equal(list.querySelector('.graph-dfs-stack-empty').textContent, '(rỗng)')
  assert.equal(list.getAttribute('aria-label'), 'Ngăn xếp gọi rỗng.')
})

test('renderDfsOrder: thứ tự thăm (visitedIds); đỉnh ngăn xếp có ▶ và aria-current', () => {
  const { document } = createDocument()
  const list = document.createElement('ol')
  const { steps } = dfsFromA(SAMPLE_PAIRS, 'list')

  dfsView.renderDfsOrder(list, steps[15])
  const items = [...list.querySelectorAll('.graph-dfs-order-item')]
  assert.deepEqual(items.map((item) => item.dataset.label), ['A', 'B', 'C', 'D'])
  assert.equal(items[2].getAttribute('aria-current'), 'true')
  assert.equal(list.getAttribute('aria-label'), 'Thứ tự thăm (lúc vào): A, B, C, D.')

  dfsView.renderDfsOrder(list, steps[0])
  assert.equal(list.querySelector('.graph-dfs-order-empty').textContent, '(chưa có)')
})

test('renderDfsTable: vào / ra / parent / trạng thái bằng chữ; ở bước "gọi DFS(B)" B còn "chưa thăm" nhưng đã có parent A (chủ ý)', () => {
  const { document } = createDocument()
  const table = document.createElement('table')
  const { steps } = dfsFromA(SAMPLE_PAIRS, 'list')
  const rows = () => [...table.querySelectorAll('tbody tr')].map((row) => [...row.children].map((cell) => cell.textContent))

  dfsView.renderDfsTable(table, steps.at(-1))
  assert.deepEqual(rows(), [
    ['A', '1', '8', '—', 'đã đóng'], ['B', '2', '7', 'A', 'đã đóng'], ['C', '3', '6', 'B', 'đã đóng'], ['D', '4', '5', 'C', 'đã đóng'],
    ['E', '—', '—', '—', 'chưa thăm'], ['F', '—', '—', '—', 'chưa thăm'], ['G', '—', '—', '—', 'chưa thăm'],
  ])
  assert.deepEqual([...table.querySelectorAll('thead th')].map((cell) => cell.textContent), ['Đỉnh', 'vào', 'ra', 'parent', 'trạng thái'])

  dfsView.renderDfsTable(table, steps[3])
  assert.deepEqual(rows()[1], ['B', '—', '—', 'A', 'chưa thăm'])
  dfsView.renderDfsTable(table, steps[4])
  assert.deepEqual(rows()[1], ['B', '2', '—', 'A', 'đang mở'])
  assert.ok(table.querySelector('tbody tr.is-current').dataset.id === idOf(steps[4].graph, 'B'))
})

test('formatDfsResult', () => {
  const { steps } = dfsFromA(SAMPLE_PAIRS, 'list')

  assert.equal(dfsView.formatDfsResult(steps[5]), 'Chưa có')
  assert.equal(dfsView.formatDfsResult(steps.at(-1)), 'Tới được 4/7 đỉnh: A, B, C, D')
})
