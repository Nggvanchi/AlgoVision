import test from 'node:test'
import assert from 'node:assert/strict'

import * as remove from '../src/algorithms/bstDelete.js'
import {
  buildTree,
  createTree,
  findNodeId,
  getNodeCount,
  isValidBst,
  toInorderValues,
} from '../src/structures/bst.js'
import { assertBstStepInvariants, lineText } from './helpers/bst-step-invariants.js'

const BALANCED_VALUES = [50, 30, 70, 20, 40, 60, 80]
const BALANCED_15 = [50, 30, 70, 20, 40, 60, 80, 10, 25, 35, 45, 55, 65, 75, 85]

function generate(tree, value) {
  return remove.generateBstDeleteSteps(tree, value)
}

function lines(steps) {
  return steps.slice(1).map((step) => step.pseudocodeLine)
}

function valuesOf(tree) {
  return Object.values(tree.nodes).map((node) => node.value)
}

test('Delete export mã giả 13 dòng', () => {
  assert.equal(remove.bstDeletePseudocode.length, 13)
})

test('Delete giá trị không tồn tại: kết luận ở dòng 5, cây giữ nguyên', () => {
  const tree = buildTree(BALANCED_VALUES)
  const steps = generate(tree, 65)
  const last = steps.at(-1)

  assert.deepEqual(lines(steps), [4, 4, 4, 5])
  assert.match(lineText(remove.bstDeletePseudocode, last), /z == null/)
  assert.equal(last.result, 'not-found')
  assert.equal(last.comparisons, 3)
  assert.equal(last.comparisons, steps.at(-2).comparisons)
  assert.deepEqual(last.tree, tree)
  assertBstStepInvariants(steps)
})

test('Delete trên cây rỗng: kết luận ngay, không so sánh', () => {
  const steps = generate(createTree(), 10)

  assert.deepEqual(lines(steps), [5])
  assert.equal(steps.at(-1).comparisons, 0)
  assertBstStepInvariants(steps)
})

test('comparisons của Delete đếm như Search: mỗi nút được xét 1, gồm nút tìm thấy', () => {
  const tree = buildTree(BALANCED_VALUES)

  assert.equal(generate(tree, 50).at(-1).comparisons, 1)
  assert.equal(generate(tree, 30).at(-1).comparisons, 2)
  assert.equal(generate(tree, 40).at(-1).comparisons, 3)
  assert.equal(generate(tree, 45).at(-1).comparisons, 3)
})

test('TH1 xóa lá: dòng 6 rồi 7, nút bị xóa khỏi cây', () => {
  const tree = buildTree(BALANCED_VALUES)
  const leafId = findNodeId(tree, 20)
  const steps = generate(tree, 20)
  const last = steps.at(-1)

  assert.deepEqual(lines(steps), [4, 4, 6, 7])
  assert.equal(steps.at(-2).foundId, leafId)
  assert.match(lineText(remove.bstDeletePseudocode, last), /thay z bằng null/)
  assert.equal(Object.hasOwn(last.tree.nodes, leafId), false)
  assert.equal(last.tree.nodes[findNodeId(tree, 30)].left, null)
  assert.equal(last.result, 'deleted')
  assertBstStepInvariants(steps)
})

test('TH2 xóa nút chỉ có con trái: con trái được nối lên cha', () => {
  const tree = buildTree([50, 30, 70, 20])
  const steps = generate(tree, 30)
  const last = steps.at(-1)

  assert.deepEqual(lines(steps), [4, 8, 9])
  assert.match(lineText(remove.bstDeletePseudocode, last), /con duy nhất/)
  assert.equal(last.tree.nodes[last.tree.rootId].left, findNodeId(tree, 20))
  assert.deepEqual(toInorderValues(last.tree), [20, 50, 70])
  assertBstStepInvariants(steps)
})

test('TH2 xóa nút chỉ có con phải: con phải được nối lên cha', () => {
  const tree = buildTree([50, 30, 70, 40])
  const last = generate(tree, 30).at(-1)

  assert.equal(last.tree.nodes[last.tree.rootId].left, findNodeId(tree, 40))
  assert.deepEqual(toInorderValues(last.tree), [40, 50, 70])
})

test('TH2 xóa gốc có một con: con trở thành gốc', () => {
  const tree = buildTree([50, 70, 60])
  const last = generate(tree, 50).at(-1)

  assert.equal(last.tree.rootId, findNodeId(tree, 70))
  assert.deepEqual(toInorderValues(last.tree), [60, 70])
})

test('TH1 xóa gốc duy nhất: cây rỗng', () => {
  const last = generate(buildTree([50]), 50).at(-1)

  assert.equal(last.tree.rootId, null)
  assert.equal(getNodeCount(last.tree), 0)
})

test('TH3 successor sâu nhiều mức: trace dòng 10, 11×3, 12, 13', () => {
  // 50 → phải 80 → trái 70 → trái 60 (successor, có con phải 65).
  const tree = buildTree([50, 30, 80, 70, 90, 60, 65])
  const rootId = tree.rootId
  const successorId = findNodeId(tree, 60)
  const steps = generate(tree, 50)

  assert.deepEqual(lines(steps), [10, 11, 11, 11, 12, 13])
  assert.deepEqual(
    steps.slice(2, 5).map((step) => step.tree.nodes[step.successorId].value),
    [80, 70, 60],
  )
  // Đi tìm successor không phải phép so sánh khóa.
  steps.slice(1).forEach((step) => assert.equal(step.comparisons, 1))

  const last = steps.at(-1)
  assert.equal(last.tree.rootId, rootId, 'id của z giữ nguyên')
  assert.equal(last.tree.nodes[rootId].value, 60)
  assert.equal(last.foundId, rootId)
  assert.equal(Object.hasOwn(last.tree.nodes, successorId), false)
  assert.equal(last.tree.nodes[findNodeId(tree, 70)].left, findNodeId(tree, 65))
  assert.deepEqual(toInorderValues(last.tree), [30, 60, 65, 70, 80, 90])
  assert.equal(isValidBst(last.tree), true)
  assertBstStepInvariants(steps)
})

test('TH3 successor là con phải trực tiếp của z', () => {
  const tree = buildTree([50, 30, 70, 80])
  const steps = generate(tree, 50)
  const last = steps.at(-1)

  assert.deepEqual(lines(steps), [10, 11, 12, 13])
  assert.equal(last.tree.nodes[tree.rootId].value, 70)
  assert.equal(last.tree.nodes[tree.rootId].right, findNodeId(tree, 80))
  assert.equal(isValidBst(last.tree), true)
})

test('TH3 bước 12: giá trị trùng tạm thời giữa z và s', () => {
  const tree = buildTree([50, 30, 80, 70, 90, 60, 65])
  const steps = generate(tree, 50)
  const copyStep = steps.find((step) => step.pseudocodeLine === 12)

  assert.match(lineText(remove.bstDeletePseudocode, copyStep), /z\.value = s\.value/)
  assert.equal(copyStep.tree.nodes[copyStep.foundId].value, 60)
  assert.equal(copyStep.tree.nodes[copyStep.successorId].value, 60)
  assert.notEqual(copyStep.foundId, copyStep.successorId)
  assert.equal(valuesOf(copyStep.tree).filter((value) => value === 60).length, 2)
})

test('TH3 bước 13: xóa s theo id chứ không theo giá trị', () => {
  const tree = buildTree([50, 30, 80, 70, 90, 60, 65])
  const zId = tree.rootId
  const sId = findNodeId(tree, 60)
  const steps = generate(tree, 50)
  const removeStep = steps.at(-1)

  assert.equal(removeStep.pseudocodeLine, 13)
  assert.equal(Object.hasOwn(removeStep.tree.nodes, sId), false, 's bị xóa')
  assert.equal(Object.hasOwn(removeStep.tree.nodes, zId), true, 'z còn nguyên')
  assert.equal(removeStep.successorId, null, 's đã biến mất nên successorId = null')
  assert.equal(valuesOf(removeStep.tree).filter((value) => value === 60).length, 1)
})

test('Mọi phép xóa trên cây 15 nút: hợp lệ BST, n - 1 nút, inorder bỏ đúng x, id giữ nguyên', () => {
  const tree = buildTree(BALANCED_15)
  const before = structuredClone(tree)
  const originalIds = Object.keys(tree.nodes)

  for (const value of BALANCED_15) {
    const steps = generate(tree, value)
    const last = steps.at(-1)

    assertBstStepInvariants(steps)
    assert.equal(isValidBst(last.tree), true, `xóa ${value}`)
    assert.equal(getNodeCount(last.tree), 14)
    assert.deepEqual(
      toInorderValues(last.tree),
      toInorderValues(tree).filter((item) => item !== value),
    )
    Object.keys(last.tree.nodes).forEach((id) => assert.ok(originalIds.includes(id)))
  }

  assert.deepEqual(tree, before, 'không thay đổi cây đầu vào')
})

test('Bước làm nút biến mất đặt foundId = null', () => {
  const tree = buildTree(BALANCED_VALUES)

  for (const value of [20, 30, 50]) {
    const last = generate(tree, value).at(-1)

    if (last.foundId !== null) {
      assert.ok(Object.hasOwn(last.tree.nodes, last.foundId))
    }
  }

  assert.equal(generate(tree, 20).at(-1).foundId, null)
})
