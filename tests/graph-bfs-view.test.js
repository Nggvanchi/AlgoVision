import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

import * as bfsView from '../src/graph-bfs-view.js'
import { buildGraph, listVertices } from '../src/structures/graph.js'
import { generateGraphBfsSteps } from '../src/algorithms/graphBfs.js'

// Mẫu vô hướng: A–B, A–C, B–C, C–D, E–F, G cô lập. Bước BFS danh sách từ A (xem tests/graph-bfs.test.js):
// 4 enqueue B, 6 enqueue C (hàng đợi B, C), 7 dequeue B, 8 đọc A trong Adj[B], 9 đọc C trong Adj[B], 17 kết thúc.
const SAMPLE_PAIRS = [[0, 1], [0, 2], [1, 2], [2, 3], [4, 5]]
const sample = () => buildGraph(false, 7, SAMPLE_PAIRS)
const idOf = (graph, label) => listVertices(graph).find((vertex) => vertex.label === label).id
const labelsOf = (graph, ids) => [...ids].map((id) => graph.vertices[id].label)
const bfsFromA = (representation) => {
  const graph = sample()
  return { graph, steps: generateGraphBfsSteps(graph, idOf(graph, 'A'), representation) }
}

// Cửa sổ happy-dom chỉ được giải phóng khi close() (abort() không giải phóng DOM): đóng sau mỗi test.
const openWindows = []
afterEach(() => Promise.all(openWindows.splice(0).map((window) => window.happyDOM.close())))

function createDocument() {
  const window = new Window()
  openWindows.push(window)
  return { window, document: window.document }
}

test('graph-bfs-view.js không import ngược src/graph.js (tránh vòng import)', async () => {
  const source = await readFile(new URL('../src/graph-bfs-view.js', import.meta.url), 'utf8')
  const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])

  assert.ok(imports.length > 0)
  assert.ok(!imports.some((path) => /(^|\/)graph\.js$/.test(path) && !path.includes('structures/')), imports.join(', '))
})

test('formatDistance: null là "—", số giữ nguyên', () => {
  assert.equal(bfsView.formatDistance(null), '—')
  assert.equal(bfsView.formatDistance(undefined), '—')
  assert.equal(bfsView.formatDistance(0), '0')
  assert.equal(bfsView.formatDistance(2), '2')
})

test('bfsVertexMarks giữa chừng (dequeue B): đã xử lý A; u = B chưa có ✓; hàng đợi C; nhãn s·0, d=1', () => {
  const { graph, steps } = bfsFromA('list')
  const marks = bfsView.bfsVertexMarks(steps[7])

  assert.deepEqual(labelsOf(graph, marks.doneIds), ['A'])
  assert.deepEqual(labelsOf(graph, marks.queuedIds), ['C'])
  assert.deepEqual(Object.fromEntries([...marks.badges].map(([id, text]) => [graph.vertices[id].label, text])), {
    A: 's·0', B: 'd=1', C: 'd=1',
  })
})

test('bfsVertexMarks bước kết thúc: mọi đỉnh của orderIds đã xử lý, hàng đợi rỗng', () => {
  const { graph, steps } = bfsFromA('list')
  const marks = bfsView.bfsVertexMarks(steps.at(-1))

  assert.deepEqual(labelsOf(graph, marks.doneIds), ['A', 'B', 'C', 'D'])
  assert.equal(marks.queuedIds.size, 0)
  assert.equal(marks.badges.get(idOf(graph, 'D')), 'd=2')
  assert.equal(marks.badges.has(idOf(graph, 'E')), false)
})

test('bfsVertexMarks bước 0: chỉ nguồn có nhãn "s"', () => {
  const { graph, steps } = bfsFromA('list')
  const marks = bfsView.bfsVertexMarks(steps[0])

  assert.equal(marks.doneIds.size, 0)
  assert.deepEqual([...marks.badges], [[idOf(graph, 'A'), 's']])
})

// Bước BFS có id lạ ở mọi trường tham chiếu: phải bỏ qua, không lỗi.
function strangeStep() {
  const graph = buildGraph(false, 3, [[0, 1]])
  return {
    graph,
    operation: 'bfs',
    representation: 'list',
    sourceId: 'v1',
    currentVertexId: 'v98',
    currentEdge: { from: 'v1', to: 'v97' },
    matrixCell: { rowId: 'v1', colId: 'v95' },
    visitedIds: ['v1', 'v2', 'v99'],
    frontierIds: ['v2', 'v99'],
    orderIds: ['v1', 'v98'],
    distance: { v1: 0, v2: 1, v99: 3 },
    parentIds: { v1: null, v2: 'v1', v3: 'v96', v99: 'v1' },
    reads: 1,
    finished: true,
    result: { reachable: 9 },
  }
}

test('bfsVertexMarks, bfsTreeEdges bỏ qua id lạ', () => {
  const step = strangeStep()
  const marks = bfsView.bfsVertexMarks(step)

  assert.deepEqual([...marks.doneIds], ['v1'])
  assert.deepEqual([...marks.queuedIds], ['v2'])
  assert.deepEqual([...marks.badges.keys()].sort(), ['v1', 'v2'])
  assert.deepEqual(bfsView.bfsTreeEdges(step), [{ from: 'v1', to: 'v2' }])
})

test('bfsTreeEdges: cây BFS của Mẫu vô hướng từ A là A–B, A–C, C–D; isBfsTreeEdge khớp cả hai chiều khi vô hướng', () => {
  const { graph, steps } = bfsFromA('list')
  const last = steps.at(-1)
  const tree = bfsView.bfsTreeEdges(last).map(({ from, to }) => `${graph.vertices[from].label}${graph.vertices[to].label}`)
  const [a, b, c] = ['A', 'B', 'C'].map((label) => idOf(graph, label))

  assert.deepEqual(tree.sort(), ['AB', 'AC', 'CD'])
  assert.equal(bfsView.isBfsTreeEdge(last, { from: b, to: a }), true)
  assert.equal(bfsView.isBfsTreeEdge(last, { from: b, to: c }), false)
})

test('isBfsTreeEdge có hướng: chỉ khớp đúng chiều parent → con', () => {
  const graph = buildGraph(true, 2, [[0, 1], [1, 0]])
  const [a, b] = listVertices(graph).map((vertex) => vertex.id)
  const last = generateGraphBfsSteps(graph, a, 'list').at(-1)

  assert.equal(bfsView.isBfsTreeEdge(last, { from: a, to: b }), true)
  assert.equal(bfsView.isBfsTreeEdge(last, { from: b, to: a }), false)
})

test('bfsListReadState (đọc C trong Adj[B]): hàng A đã đọc hết, B: A đã đọc, C đang đọc; hàng C chưa đọc', () => {
  const { graph, steps } = bfsFromA('list')
  const step = steps[9]
  const state = (owner, index) => bfsView.bfsListReadState(step, idOf(graph, owner), graph.adjacency[idOf(graph, owner)][index], index)

  assert.deepEqual([state('A', 0), state('A', 1)], ['read', 'read'])
  assert.deepEqual([state('B', 0), state('B', 1)], ['read', 'current'])
  assert.deepEqual([state('C', 0), state('C', 1), state('C', 2)], [null, null, null])
  assert.deepEqual([bfsView.bfsListReadState(steps[7], idOf(graph, 'B'), idOf(graph, 'A'), 0)], [null], 'vừa dequeue B: chưa đọc gì')
})

test('bfsMatrixReadState (đọc M[B][C]): hàng A đọc hết 7 ô, hàng B đọc 2 ô trước C, ô C đang đọc; biểu diễn danh sách thì không tô', () => {
  const { graph, steps } = bfsFromA('matrix')
  const [, b, c] = ['A', 'B', 'C'].map((label) => idOf(graph, label))
  const step = steps.find((candidate) => candidate.matrixCell?.rowId === b && candidate.matrixCell?.colId === c)
  const ids = listVertices(graph).map((vertex) => vertex.id)
  const row = (label) => ids.map((columnId, index) => bfsView.bfsMatrixReadState(step, idOf(graph, label), columnId, index))

  assert.deepEqual(row('A'), Array(7).fill('read'))
  assert.deepEqual(row('B'), ['read', 'read', 'current', null, null, null, null])
  assert.deepEqual(row('C'), Array(7).fill(null))
  assert.equal(bfsView.bfsListReadState(step, b, ids[0], 0), null)
})

test('renderBfsQueue: đầu/cuối có nhãn chữ, aria-label theo thứ tự; hàng rỗng ghi "(rỗng)"; bỏ qua id lạ', () => {
  const { document } = createDocument()
  const list = document.createElement('ol')
  const { steps } = bfsFromA('list')

  bfsView.renderBfsQueue(list, steps[6])
  const items = [...list.querySelectorAll('.graph-bfs-queue-item')]
  assert.deepEqual(items.map((item) => item.querySelector('.graph-bfs-queue-label').textContent), ['B', 'C'])
  assert.deepEqual(items.map((item) => item.querySelector('.graph-bfs-queue-tag')?.textContent ?? null), ['đầu', 'cuối'])
  assert.equal(list.getAttribute('aria-label'), 'Hàng đợi (đầu → cuối): B, C.')

  bfsView.renderBfsQueue(list, steps[2])
  assert.equal(list.querySelector('.graph-bfs-queue-empty').textContent, '(rỗng)')
  assert.equal(list.getAttribute('aria-label'), 'Hàng đợi rỗng.')

  bfsView.renderBfsQueue(list, steps[1])
  assert.equal(list.querySelector('.graph-bfs-queue-tag').textContent, 'đầu · cuối')

  bfsView.renderBfsQueue(list, strangeStep())
  assert.equal(list.querySelectorAll('.graph-bfs-queue-item').length, 1)
})

test('renderBfsOrder: thứ tự lấy khỏi hàng đợi (orderIds); u đang xử lý có ▶ và aria-current', () => {
  const { document } = createDocument()
  const list = document.createElement('ol')
  const { steps } = bfsFromA('list')

  bfsView.renderBfsOrder(list, steps[9])
  const items = [...list.querySelectorAll('.graph-bfs-order-item')]
  assert.deepEqual(items.map((item) => item.dataset.label), ['A', 'B'])
  assert.equal(items[1].getAttribute('aria-current'), 'true')
  assert.equal(items[1].querySelector('.graph-entry-marker').textContent, '▶')
  assert.equal(list.getAttribute('aria-label'), 'Đã lấy khỏi hàng đợi (đã xử lý): A, B.')

  bfsView.renderBfsOrder(list, steps[0])
  assert.equal(list.querySelector('.graph-bfs-order-empty').textContent, '(chưa có)')
})

test('renderBfsTable: mỗi đỉnh một hàng dist / parent, không tới được là "—"; parent lạ là "—"', () => {
  const { document } = createDocument()
  const table = document.createElement('table')
  const { steps } = bfsFromA('list')
  const rows = () => [...table.querySelectorAll('tbody tr')].map((row) => [...row.children].map((cell) => cell.textContent))

  bfsView.renderBfsTable(table, steps.at(-1))
  assert.deepEqual(rows(), [
    ['A', '0', '—'], ['B', '1', 'A'], ['C', '1', 'A'], ['D', '2', 'C'], ['E', '—', '—'], ['F', '—', '—'], ['G', '—', '—'],
  ])
  assert.ok(table.querySelector('caption').textContent.includes('—'))

  bfsView.renderBfsTable(table, strangeStep())
  assert.deepEqual(rows(), [['A', '0', '—'], ['B', '1', 'A'], ['C', '—', '—']])
})

test('formatBfsResult và formatDequeueCount', () => {
  const { steps } = bfsFromA('list')

  assert.equal(bfsView.formatBfsResult(steps[5]), 'Chưa có')
  assert.equal(bfsView.formatBfsResult(steps.at(-1)), 'Tới được 4/7 đỉnh: A, B, C, D')
  assert.equal(bfsView.formatDequeueCount(steps[7]), '2')
  assert.equal(bfsView.formatDequeueCount(steps.at(-1)), '4')
  assert.equal(bfsView.formatDequeueCount({ operation: 'neighbors' }), '—')
})

// describeBfsCost theo từng trạng thái hiển thị: bước 0 (chưa đánh dấu đỉnh nào) → "chưa bắt đầu",
// từ bước 1 trở đi → "đang chạy", bước cuối → kết luận Big-O. Nhánh "đã kết thúc" xét trước nhánh bước 0.
test('describeBfsCost bước 0: "chưa bắt đầu", không nói "đang chạy" (danh sách kề và ma trận kề)', () => {
  const list = bfsFromA('list').steps
  const matrix = bfsFromA('matrix').steps
  assert.equal(bfsView.describeBfsCost(list[0]), 'BFS từ A chưa bắt đầu (danh sách kề): 0 lần dequeue, đã đọc 0 phần tử.')
  assert.equal(bfsView.describeBfsCost(matrix[0]), 'BFS từ A chưa bắt đầu (ma trận kề): 0 lần dequeue, đã đọc 0 ô.')
})

test('describeBfsCost bước 1 (đã đánh dấu nguồn, chưa dequeue): đã bắt đầu nên là "đang chạy"', () => {
  assert.equal(bfsView.describeBfsCost(bfsFromA('list').steps[1]),
    'BFS từ A đang chạy (danh sách kề): đã 0 lần dequeue, đã đọc 0 phần tử.')
  assert.equal(bfsView.describeBfsCost(bfsFromA('matrix').steps[1]),
    'BFS từ A đang chạy (ma trận kề): đã 0 lần dequeue, đã đọc 0 ô.')
})

test('describeBfsCost bước đã kết thúc mà chưa có đỉnh nào (đồ thị rỗng / nguồn lạ): kết luận Big-O, không "chưa bắt đầu"', () => {
  for (const representation of ['list', 'matrix']) {
    const last = bfsFromA(representation).steps.at(-1)
    const empty = { ...last, graph: buildGraph(false, 0, []), sourceId: 'khong-ton-tai', visitedIds: [], orderIds: [], reads: 0 }
    const text = bfsView.describeBfsCost(empty)
    assert.ok(!/chưa bắt đầu|đang chạy/.test(text), `bước đã kết thúc không được ghi trạng thái chạy dở: "${text}"`)
    assert.ok(text.includes(representation === 'list' ? 'O(V + E)' : 'O(V²)'), `phải có kết luận Big-O: "${text}"`)
    assert.ok(text.includes('R = 0 lần dequeue'), `phải ghi R = 0: "${text}"`)
  }
})
