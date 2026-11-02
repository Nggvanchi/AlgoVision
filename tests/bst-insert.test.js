import test from 'node:test'
import assert from 'node:assert/strict'

import * as insert from '../src/algorithms/bstInsert.js'
import {
  buildTree,
  createTree,
  findNodeId,
  isValidBst,
  toInorderValues,
} from '../src/structures/bst.js'
import { assertBstStepInvariants, lineText } from './helpers/bst-step-invariants.js'

const BALANCED_VALUES = [50, 30, 70, 20, 40, 60, 80]

function generate(tree, value) {
  return insert.generateBstInsertSteps(tree, value)
}

test('Insert export mã giả', () => {
  assert.ok(Array.isArray(insert.bstInsertPseudocode))
  assert.equal(insert.bstInsertPseudocode.length, 11)
})

test('Insert vào cây rỗng: tạo gốc ở dòng 2, comparisons = 0', () => {
  const steps = generate(createTree(), 42)
  const last = steps.at(-1)

  assert.equal(steps.length, 2)
  assert.match(lineText(insert.bstInsertPseudocode, last), /root = new Node/)
  assert.equal(last.comparisons, 0)
  assert.equal(last.result, 'inserted')
  assert.equal(last.tree.nodes[last.tree.rootId].value, 42)
  assert.equal(last.foundId, last.tree.rootId)
  assertBstStepInvariants(steps)
})

test('Insert 45: trace so sánh và đi xuống khớp mã giả', () => {
  const tree = buildTree(BALANCED_VALUES)
  const steps = generate(tree, 45)

  assert.deepEqual(
    steps.slice(1).map((step) => [step.pseudocodeLine, step.comparisons]),
    [
      [6, 1], // so sánh 45 với 50
      [8, 1], // cur = cur.left (30)
      [6, 2], // so sánh với 30
      [11, 2], // cur = cur.right (40)
      [6, 3], // so sánh với 40
      [10, 3], // cur.right = new Node(45)
    ],
  )
  assert.match(lineText(insert.bstInsertPseudocode, steps.at(-1)), /cur\.right = new Node/)
  assert.match(lineText(insert.bstInsertPseudocode, steps[2]), /cur = cur\.left/)
  assertBstStepInvariants(steps)
})

test('comparisons của Insert = số nút từ gốc tới cha của nút mới', () => {
  const tree = buildTree(BALANCED_VALUES)

  // Cha của 10 là 20 (độ sâu 2): đi qua 50, 30, 20.
  assert.equal(generate(tree, 10).at(-1).comparisons, 3)
  // Cha của 75 là 80: đi qua 50, 70, 80.
  assert.equal(generate(tree, 75).at(-1).comparisons, 3)
  // Cây một nút: cha là gốc.
  assert.equal(generate(buildTree([50]), 10).at(-1).comparisons, 1)
})

test('Insert giá trị trùng ở độ sâu d: dòng 5, comparisons = d + 1, cây giữ nguyên', () => {
  const tree = buildTree(BALANCED_VALUES)

  const atDepth2 = generate(tree, 40)
  const last = atDepth2.at(-1)
  assert.match(lineText(insert.bstInsertPseudocode, last), /x == cur\.value/)
  assert.equal(last.comparisons, 3)
  assert.equal(last.result, 'duplicate')
  assert.equal(last.foundId, findNodeId(tree, 40))
  assert.deepEqual(last.tree, tree)
  assertBstStepInvariants(atDepth2)

  assert.equal(generate(tree, 50).at(-1).comparisons, 1)
})

test('Nút mới được chèn đúng phía của cha', () => {
  const tree = buildTree(BALANCED_VALUES)

  const left = generate(tree, 15).at(-1)
  assert.equal(left.pseudocodeLine, 7)
  assert.equal(left.tree.nodes[findNodeId(left.tree, 20)].left, left.foundId)

  const right = generate(tree, 85).at(-1)
  assert.equal(right.pseudocodeLine, 10)
  assert.equal(right.tree.nodes[findNodeId(right.tree, 80)].right, right.foundId)
})

test('Insert: cây cuối hợp lệ BST, không thay đổi cây đầu vào', () => {
  const tree = buildTree(BALANCED_VALUES)
  const before = structuredClone(tree)

  const last = generate(tree, 65).at(-1)

  assert.deepEqual(tree, before)
  assert.equal(isValidBst(last.tree), true)
  assert.deepEqual(toInorderValues(last.tree), [20, 30, 40, 50, 60, 65, 70, 80])
})

test('Các bước trước khi chèn giữ cây cũ, chỉ bước chèn có nút mới', () => {
  const tree = buildTree(BALANCED_VALUES)
  const steps = generate(tree, 65)

  steps.slice(0, -1).forEach((step) => assert.deepEqual(step.tree, tree))
  assert.equal(Object.keys(steps.at(-1).tree.nodes).length, 8)
})

test('Insert chốt operation và value ở mọi bước', () => {
  const steps = generate(buildTree(BALANCED_VALUES), 65)

  steps.forEach((step) => {
    assert.equal(step.operation, 'insert')
    assert.equal(step.value, 65)
  })
})

test('Insert từ chối giá trị không phải số nguyên', () => {
  assert.throws(() => generate(createTree(), 2.5), TypeError)
})
