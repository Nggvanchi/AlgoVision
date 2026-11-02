import test from 'node:test'
import assert from 'node:assert/strict'

import * as traversal from '../src/algorithms/bstTraversal.js'
import { buildTree, createTree } from '../src/structures/bst.js'
import { assertBstStepInvariants, lineText } from './helpers/bst-step-invariants.js'

const BALANCED_VALUES = [50, 30, 70, 20, 40, 60, 80]

// Dò tay trên cây 50 / (30: 20, 40) / (70: 60, 80).
const EXPECTED = {
  inorder: { output: [20, 30, 40, 50, 60, 70, 80], visitLine: 4 },
  preorder: { output: [50, 30, 20, 40, 70, 60, 80], visitLine: 3 },
  postorder: { output: [20, 40, 30, 60, 80, 70, 50], visitLine: 5 },
}

function pseudocodeOf(order) {
  return traversal.bstTraversalPseudocode[order]
}

for (const [order, expected] of Object.entries(EXPECTED)) {
  test(`${order}: thứ tự output khớp bảng dò tay`, () => {
    const steps = traversal.generateBstTraversalSteps(buildTree(BALANCED_VALUES), order)

    assert.deepEqual(steps.at(-1).output, expected.output)
    assert.deepEqual(steps.at(-1).result, expected.output)
    assertBstStepInvariants(steps)
  })

  test(`${order}: mỗi bước visit ở đúng dòng và output tăng đúng 1 phần tử`, () => {
    const steps = traversal.generateBstTraversalSteps(buildTree(BALANCED_VALUES), order)

    steps.slice(1).forEach((step, index) => {
      assert.equal(step.pseudocodeLine, expected.visitLine)
      assert.match(lineText(pseudocodeOf(order), step), /visit\(node\)/)
      assert.equal(step.output.length, index + 1)
      assert.deepEqual(step.output.slice(0, -1), steps[index].output)
      assert.equal(step.tree.nodes[step.currentId].value, step.output.at(-1))
    })
  })

  test(`${order}: mỗi nút được thăm đúng một lần`, () => {
    const tree = buildTree([42, 7, 93, 15, 3, 61, 88, 1, 99, 50])
    const steps = traversal.generateBstTraversalSteps(tree, order)
    const visitedIds = steps.slice(1).map((step) => step.currentId)

    assert.equal(visitedIds.length, 10)
    assert.equal(new Set(visitedIds).size, 10)
  })

  test(`${order}: cây rỗng kết thúc ở dòng node == null`, () => {
    const steps = traversal.generateBstTraversalSteps(createTree(), order)

    assert.equal(steps.length, 2)
    assert.match(lineText(pseudocodeOf(order), steps[1]), /node == null/)
    assert.deepEqual(steps[1].output, [])
    assertBstStepInvariants(steps)
  })
}

test('Inorder của BST luôn tăng dần', () => {
  const tree = buildTree([42, 7, 93, 15, 3, 61, 88, 1, 99, 50])
  const output = traversal.generateBstTraversalSteps(tree, 'inorder').at(-1).output

  assert.deepEqual(output, [...output].sort((a, b) => a - b))
})

test('Duyệt cây không thay đổi cây và không so sánh khóa', () => {
  const tree = buildTree(BALANCED_VALUES)
  const before = structuredClone(tree)
  const steps = traversal.generateBstTraversalSteps(tree, 'preorder')

  assert.deepEqual(tree, before)
  steps.forEach((step) => {
    assert.equal(step.tree, tree)
    assert.equal(step.comparisons, 0)
    assert.equal(step.operation, 'preorder')
  })
})

test('Kiểu duyệt không hợp lệ bị từ chối', () => {
  assert.throws(
    () => traversal.generateBstTraversalSteps(createTree(), 'levelorder'),
    RangeError,
  )
})
