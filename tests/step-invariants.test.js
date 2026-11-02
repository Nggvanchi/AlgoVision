import test from 'node:test'
import assert from 'node:assert/strict'
import * as invariants from './helpers/step-invariants.js'

// Cấu hình mẫu: snapshot là { items: { id: … } }, trường tham chiếu currentId, đường đi pathIds.
const hasItem = (step, id) => Object.hasOwn(step.snapshot.items, id)
const options = {
  references: [{ field: 'currentId', exists: hasItem }],
  paths: [{ field: 'pathIds', exists: hasItem }],
  constantFields: ['operation'],
}

function makeSteps() {
  const items = { a: {}, b: {} }
  return [
    { snapshot: { items }, currentId: null, pathIds: [], operation: 'x', pseudocodeLine: null, finished: false },
    { snapshot: { items }, currentId: 'a', pathIds: ['a'], operation: 'x', pseudocodeLine: 1, finished: false },
    { snapshot: { items }, currentId: 'b', pathIds: ['a', 'b'], operation: 'x', pseudocodeLine: 2, finished: true },
  ]
}

test('assertStepInvariants chấp nhận mảng bước hợp lệ', () => {
  invariants.assertStepInvariants(makeSteps(), options)
})

test('assertStepInvariants báo lỗi khi trường tham chiếu trỏ tới id không có trong snapshot', () => {
  const steps = makeSteps()
  steps[1].currentId = 'ghost'
  assert.throws(() => invariants.assertStepInvariants(steps, options), /currentId = ghost/)
})

test('assertStepInvariants báo lỗi khi đường đi chứa id treo', () => {
  const steps = makeSteps()
  steps[2].pathIds = ['a', 'ghost']
  assert.throws(() => invariants.assertStepInvariants(steps, options), /pathIds chứa id treo ghost/)
})

test('assertStepInvariants báo lỗi khi đường đi làm mất phần tử vẫn còn trong snapshot', () => {
  const steps = makeSteps()
  steps[2].pathIds = ['b']
  assert.throws(() => invariants.assertStepInvariants(steps, options), /pathIds làm mất a/)
})

test('assertStepInvariants cho phép đường đi bỏ phần tử đã biến mất khỏi snapshot', () => {
  const steps = makeSteps()
  steps[2].snapshot = { items: { b: {} } }
  steps[2].pathIds = ['b']
  invariants.assertStepInvariants(steps, options)
})

// Trường dạng đối tượng (Graph): currentEdge { from, to } và matrixCell { rowId, colId }; idsOf trích các id cần kiểm.
const objectOptions = {
  references: [
    { field: 'currentEdge', exists: hasItem, idsOf: (edge) => [edge.from, edge.to] },
    { field: 'matrixCell', exists: hasItem, idsOf: (cell) => [cell.rowId, cell.colId] },
  ],
}

function makeObjectSteps() {
  const items = { a: {}, b: {} }
  return [
    { snapshot: { items }, currentEdge: null, matrixCell: null, pseudocodeLine: null, finished: false },
    { snapshot: { items }, currentEdge: { from: 'a', to: 'b' }, matrixCell: { rowId: 'b', colId: 'a' }, pseudocodeLine: 1, finished: true },
  ]
}

test('assertStepInvariants: trường đối tượng hợp lệ (idsOf) được chấp nhận', () => {
  invariants.assertStepInvariants(makeObjectSteps(), objectOptions)
})

test('assertStepInvariants: currentEdge treo báo đúng id, không phải [object Object]', () => {
  const steps = makeObjectSteps()
  steps[1].currentEdge = { from: 'a', to: 'ghost' }
  assert.throws(() => invariants.assertStepInvariants(steps, objectOptions), /bước 1: currentEdge chứa id ghost/)
})

test('assertStepInvariants: matrixCell treo báo đúng id, không phải [object Object]', () => {
  const steps = makeObjectSteps()
  steps[1].matrixCell = { rowId: 'ghost', colId: 'a' }
  assert.throws(() => invariants.assertStepInvariants(steps, objectOptions), /bước 1: matrixCell chứa id ghost/)
})

test('assertStepInvariants báo lỗi khi trường hằng bị đổi, finished sai hoặc bước 0 tô mã giả', () => {
  const changed = makeSteps()
  changed[1].operation = 'y'
  assert.throws(() => invariants.assertStepInvariants(changed, options), /operation bị đổi/)

  const early = makeSteps()
  early[1].finished = true
  assert.throws(() => invariants.assertStepInvariants(early, options), /finished sai/)

  const highlighted = makeSteps()
  highlighted[0].pseudocodeLine = 1
  assert.throws(() => invariants.assertStepInvariants(highlighted, options), /bước 0 không tô/)
})
