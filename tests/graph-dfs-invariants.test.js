import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGraph, cloneGraph, listVertices } from '../src/structures/graph.js'
import * as invariants from './helpers/graph-step-invariants.js'

// Bộ bước DFS dựng tay trên đồ thị A – B, nguồn A, danh sách kề (không dùng generator, để kiểm riêng helper):
// bước 0, vào A, đọc B, gọi DFS(B), vào B, đọc A, ra B, ra A (bước cuối).
function makeDfsSteps() {
  const graph = buildGraph(false, 2, [[0, 1]])
  const [a, b] = listVertices(graph).map((vertex) => vertex.id)
  // Hàm (không phải một đối tượng dùng chung): structuredClone giữ nguyên tham chiếu chung bên trong một lần sao chép,
  // nên discovery/finish/parentIds phải là ba đối tượng khác nhau ngay từ đầu.
  const empty = () => ({ [a]: null, [b]: null })
  const base = {
    operation: 'dfs',
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
    callStackIds: [],
    finishedIds: [],
    discovery: empty(),
    finish: empty(),
    parentIds: empty(),
  }
  // Sao chép sâu: mỗi bước có đối tượng riêng, sửa một bước trong test không lan sang bước khác.
  const step = (fields) => ({ ...structuredClone(base), graph: cloneGraph(graph), ...structuredClone(fields) })
  const inA = { visitedIds: [a], callStackIds: [a], currentVertexId: a, discovery: { [a]: 1, [b]: null } }
  const called = { ...inA, parentIds: { [a]: null, [b]: a } }
  const inB = {
    ...called, visitedIds: [a, b], callStackIds: [a, b], currentVertexId: b, discovery: { [a]: 1, [b]: 2 },
  }

  const steps = [
    step({ pseudocodeLine: null }),
    step({ ...inA, pseudocodeLine: 2 }),
    step({ ...inA, currentEdge: { from: a, to: b }, reads: 1, pseudocodeLine: 4 }),
    step({ ...called, currentEdge: { from: a, to: b }, reads: 1, pseudocodeLine: 5 }),
    step({ ...inB, reads: 1, pseudocodeLine: 2 }),
    step({ ...inB, currentEdge: { from: b, to: a }, reads: 2, pseudocodeLine: 4 }),
    step({
      ...inB, callStackIds: [a], currentVertexId: a, finishedIds: [b], finish: { [a]: null, [b]: 3 }, reads: 2, pseudocodeLine: 6,
    }),
    step({
      ...inB,
      callStackIds: [],
      currentVertexId: null,
      finishedIds: [b, a],
      finish: { [a]: 4, [b]: 3 },
      reads: 2,
      pseudocodeLine: 6,
      finished: true,
      result: { reachable: 2, maxStackDepth: 2 },
    }),
  ]
  return { steps, a, b }
}

const assertDfs = (steps) => invariants.assertDfsStepInvariants(steps)

test('assertDfsStepInvariants chấp nhận bộ bước DFS hợp lệ (parent gán ở bước gọi khi đích chưa thăm)', () => {
  assertDfs(makeDfsSteps().steps)
})

test('assertGraphStepInvariants vẫn nhận bộ bước DFS với lời gọi cũ (không có tham số thêm)', () => {
  invariants.assertGraphStepInvariants(makeDfsSteps().steps)
})

test('assertDfsStepInvariants: callStackIds chứa id treo thì báo lỗi', () => {
  const { steps } = makeDfsSteps()
  steps[4].callStackIds = ['v99']
  assert.throws(() => assertDfs(steps), /callStackIds chứa id v99/)
})

test('assertDfsStepInvariants: finishedIds làm mất đỉnh thì báo lỗi (chỉ tăng)', () => {
  const { steps, a } = makeDfsSteps()
  steps[7].finishedIds = [a]
  assert.throws(() => assertDfs(steps), /finishedIds làm mất/)
})

test('assertDfsStepInvariants: quên pop (ngăn xếp còn đỉnh đã đóng) thì báo lỗi', () => {
  const { steps, a, b } = makeDfsSteps()
  steps[6].callStackIds = [a, b]
  steps[6].currentVertexId = b
  assert.throws(() => assertDfs(steps), /callStackIds phải bằng các đỉnh đã thăm chưa đóng/)
})

test('assertDfsStepInvariants: ngăn xếp không phải đường đi theo parentIds thì báo lỗi', () => {
  const { steps, b } = makeDfsSteps()
  for (const step of steps.slice(4)) step.parentIds[b] = b
  assert.throws(() => assertDfs(steps), /callStackIds phải là đường đi từ nguồn theo parentIds/)
})

test('assertDfsStepInvariants: currentVertexId khác đỉnh ngăn xếp thì báo lỗi', () => {
  const { steps, b } = makeDfsSteps()
  steps[2].currentVertexId = b
  assert.throws(() => assertDfs(steps), /currentVertexId phải là đỉnh của ngăn xếp/)
})

test('assertDfsStepInvariants: discovery có giá trị khi chưa thăm thì báo lỗi', () => {
  const { steps, b } = makeDfsSteps()
  steps[3].discovery[b] = 2
  assert.throws(() => assertDfs(steps), /discovery khác null khi và chỉ khi đã thăm/)
})

test('assertDfsStepInvariants: quên ghi mốc ra (đã đóng mà finish null) thì báo lỗi', () => {
  const { steps, b } = makeDfsSteps()
  steps[6].finish[b] = null
  assert.throws(() => assertDfs(steps), /finish khác null khi và chỉ khi đã đóng/)
})

test('assertDfsStepInvariants: mốc đã gán bị đổi ở bước sau thì báo lỗi', () => {
  const { steps, b } = makeDfsSteps()
  steps[7].finish[b] = 5
  assert.throws(() => assertDfs(steps), /finish\[v2\] bị đổi/)
})

test('assertDfsStepInvariants: mốc thời gian nhảy cóc (không phải 1..k) thì báo lỗi', () => {
  const { steps, b } = makeDfsSteps()
  for (const step of steps.slice(4)) step.discovery[b] = 3
  steps[6].finish[b] = 4
  steps[7].finish = { ...steps[7].finish, [b]: 4 }
  assert.throws(() => assertDfs(steps), /mốc thời gian phải là 1\.\.k/)
})

test('assertDfsStepInvariants: parent gán ở bước không phải bước gọi mà đích chưa thăm thì báo lỗi', () => {
  const { steps, a, b } = makeDfsSteps()
  steps[2].parentIds[b] = a
  assert.throws(() => assertDfs(steps), /parent của v2 được gán nhưng v2 chưa thăm và không phải đích của bước gọi/)
})

test('assertDfsStepInvariants: đỉnh đã thăm khác nguồn mà không có parent thì báo lỗi', () => {
  const { steps, b } = makeDfsSteps()
  steps[7].parentIds[b] = null
  assert.throws(() => assertDfs(steps), /v2 đã thăm nhưng không có parent/)
})

test('assertDfsStepInvariants: đỉnh thăm đầu tiên không phải nguồn thì báo lỗi', () => {
  const { steps, b } = makeDfsSteps()
  for (const step of steps) step.sourceId = b
  assert.throws(() => assertDfs(steps), /đỉnh thăm đầu tiên phải là nguồn/)
})
