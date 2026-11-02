import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGraph, cloneGraph, listVertices } from '../src/structures/graph.js'
import * as invariants from './helpers/graph-step-invariants.js'

// Bộ bước BFS dựng tay trên đồ thị A – B, nguồn A, danh sách kề (generator chưa dùng ở đây,
// để kiểm riêng helper): bước 0, khởi tạo, dequeue A, đọc B, enqueue B, dequeue B, đọc A, return.
function makeBfsSteps() {
  const graph = buildGraph(false, 2, [[0, 1]])
  const [a, b] = listVertices(graph).map((vertex) => vertex.id)
  const base = {
    operation: 'bfs',
    representation: 'list',
    sourceId: a,
    targetId: null,
    currentVertexId: null,
    currentEdge: null,
    matrixCell: null,
    outputIds: [],
    reads: 0,
    message: '',
    finished: false,
    result: null,
    visitedIds: [],
    frontierIds: [],
    orderIds: [],
    distance: { [a]: null, [b]: null },
    parentIds: { [a]: null, [b]: null },
  }
  // Sao chép sâu cả fields: mỗi bước có distance/parentIds riêng, sửa một bước trong test không lan sang bước khác.
  const step = (fields) => ({ ...structuredClone(base), graph: cloneGraph(graph), ...structuredClone(fields) })
  const afterInit = { visitedIds: [a], distance: { [a]: 0, [b]: null } }
  const afterEnqueue = { visitedIds: [a, b], distance: { [a]: 0, [b]: 1 }, parentIds: { [a]: null, [b]: a } }

  const steps = [
    step({ pseudocodeLine: null }),
    step({ ...afterInit, frontierIds: [a], pseudocodeLine: 1 }),
    step({ ...afterInit, orderIds: [a], currentVertexId: a, pseudocodeLine: 3 }),
    step({ ...afterInit, orderIds: [a], currentVertexId: a, currentEdge: { from: a, to: b }, reads: 1, pseudocodeLine: 5 }),
    step({
      ...afterEnqueue, frontierIds: [b], orderIds: [a], currentVertexId: a, currentEdge: { from: a, to: b }, reads: 1, pseudocodeLine: 6,
    }),
    step({ ...afterEnqueue, orderIds: [a, b], currentVertexId: b, reads: 1, pseudocodeLine: 3 }),
    step({ ...afterEnqueue, orderIds: [a, b], currentVertexId: b, currentEdge: { from: b, to: a }, reads: 2, pseudocodeLine: 5 }),
    step({ ...afterEnqueue, orderIds: [a, b], reads: 2, pseudocodeLine: 7, finished: true, result: { reachable: 2 } }),
  ]
  return { steps, a, b }
}

const assertBfs = (steps) => invariants.assertBfsStepInvariants(steps)

test('assertBfsStepInvariants chấp nhận bộ bước BFS hợp lệ', () => {
  assertBfs(makeBfsSteps().steps)
})

test('assertGraphStepInvariants vẫn nhận lời gọi cũ (không có tham số thêm)', () => {
  invariants.assertGraphStepInvariants(makeBfsSteps().steps)
})

test('assertBfsStepInvariants: frontierIds chứa id treo thì báo lỗi', () => {
  const { steps } = makeBfsSteps()
  steps[4].frontierIds = ['v99']
  assert.throws(() => assertBfs(steps), /frontierIds chứa id v99/)
})

test('assertBfsStepInvariants: visitedIds làm mất đỉnh thì báo lỗi (chỉ tăng)', () => {
  const { steps, b } = makeBfsSteps()
  steps[6].visitedIds = [b]
  assert.throws(() => assertBfs(steps), /visitedIds làm mất/)
})

test('assertBfsStepInvariants: frontierIds khác visitedIds bỏ đi orderIds (sai FIFO) thì báo lỗi', () => {
  const { steps } = makeBfsSteps()
  steps[4].frontierIds = []
  assert.throws(() => assertBfs(steps), /visitedIds phải bằng orderIds nối frontierIds/)
})

test('assertBfsStepInvariants: một đỉnh được đánh dấu hai lần thì báo lỗi', () => {
  const { steps, b } = makeBfsSteps()
  steps[7].visitedIds = [...steps[7].visitedIds, b]
  steps[7].frontierIds = [b]
  assert.throws(() => assertBfs(steps), /visitedIds có phần tử trùng/)
})

test('assertBfsStepInvariants: distance thiếu key của một đỉnh thì báo lỗi', () => {
  const { steps, a } = makeBfsSteps()
  steps[3].distance = { [a]: 0 }
  assert.throws(() => assertBfs(steps), /distance phải có key cho mọi đỉnh/)
})

test('assertBfsStepInvariants: đỉnh đã đánh dấu mà distance null (hoặc ngược lại) thì báo lỗi', () => {
  const { steps, b } = makeBfsSteps()
  steps[3].distance[b] = 1
  assert.throws(() => assertBfs(steps), /distance khác null khi và chỉ khi đã đánh dấu/)
})

test('assertBfsStepInvariants: distance đã gán bị đổi ở bước sau thì báo lỗi', () => {
  const { steps, b } = makeBfsSteps()
  steps[7].distance[b] = 2
  steps[7].parentIds[b] = null
  assert.throws(() => assertBfs(steps), /distance\[v2\] bị đổi/)
})

test('assertBfsStepInvariants: distance không khớp parent (dist[w] ≠ dist[parent] + 1) thì báo lỗi', () => {
  const { steps, b } = makeBfsSteps()
  for (const step of steps.slice(4)) step.distance[b] = 2
  assert.throws(() => assertBfs(steps), /dist\[v2\] phải bằng dist\[parent\] \+ 1/)
})

test('assertBfsStepInvariants: parent chưa được lấy khỏi hàng đợi thì báo lỗi', () => {
  const { steps, a, b } = makeBfsSteps()
  steps[4].parentIds = { [a]: b, [b]: a }
  assert.throws(() => assertBfs(steps), /parent .* chưa được lấy khỏi hàng đợi/)
})

test('assertBfsStepInvariants: currentVertexId khác đỉnh vừa lấy ra thì báo lỗi', () => {
  const { steps, b } = makeBfsSteps()
  steps[3].currentVertexId = b
  assert.throws(() => assertBfs(steps), /currentVertexId phải là đỉnh vừa lấy ra/)
})

test('assertBfsStepInvariants: đỉnh đầu tiên được đánh dấu không phải nguồn thì báo lỗi', () => {
  const { steps, b } = makeBfsSteps()
  for (const step of steps) step.sourceId = b
  assert.throws(() => assertBfs(steps), /đỉnh đầu tiên được đánh dấu phải là nguồn/)
})
