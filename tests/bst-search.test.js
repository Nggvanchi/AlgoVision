import test from 'node:test'
import assert from 'node:assert/strict'

import * as search from '../src/algorithms/bstSearch.js'
import { buildTree, createTree, findNodeId } from '../src/structures/bst.js'
import { assertBstStepInvariants, lineText } from './helpers/bst-step-invariants.js'

const BALANCED_VALUES = [50, 30, 70, 20, 40, 60, 80]

function generate(tree, value) {
  return search.generateBstSearchSteps(tree, value)
}

function valuesOnPath(steps) {
  return steps.slice(1)
    .filter((step) => step.currentId !== null)
    .map((step) => step.tree.nodes[step.currentId].value)
}

test('Search export mã giả', () => {
  assert.equal(search.bstSearchPseudocode.length, 6)
})

test('Search tìm thấy: đi trái ở dòng 4, đi phải ở dòng 5, tìm thấy ở dòng 3', () => {
  const tree = buildTree(BALANCED_VALUES)
  const steps = generate(tree, 40)

  assert.deepEqual(valuesOnPath(steps), [50, 30, 40])
  assert.deepEqual(steps.slice(1).map((step) => step.pseudocodeLine), [4, 5, 3])
  assert.match(lineText(search.bstSearchPseudocode, steps[1]), /cur = cur\.left/)
  assert.match(lineText(search.bstSearchPseudocode, steps[2]), /cur = cur\.right/)
  assert.match(lineText(search.bstSearchPseudocode, steps[3]), /return cur/)

  const last = steps.at(-1)
  assert.equal(last.result, 'found')
  assert.equal(last.foundId, findNodeId(tree, 40))
  assert.equal(last.comparisons, 3)
  assertBstStepInvariants(steps)
})

test('Search không tìm thấy: bước kết luận riêng ở dòng 6, không tăng comparisons', () => {
  const steps = generate(buildTree(BALANCED_VALUES), 65)
  const last = steps.at(-1)
  const beforeLast = steps.at(-2)

  assert.deepEqual(valuesOnPath(steps), [50, 70, 60])
  assert.match(lineText(search.bstSearchPseudocode, last), /return null/)
  assert.equal(last.result, 'not-found')
  assert.equal(last.currentId, null)
  assert.equal(last.foundId, null)
  assert.equal(last.comparisons, beforeLast.comparisons)
  assert.equal(last.comparisons, 3)
  assertBstStepInvariants(steps)
})

test('Search: comparisons tăng đúng 1 mỗi bước, trừ bước kết luận "không tìm thấy"', () => {
  const tree = buildTree(BALANCED_VALUES)

  for (const value of [...BALANCED_VALUES, 10, 35, 65, 90]) {
    const steps = generate(tree, value)

    steps.slice(1).forEach((step, index) => {
      const expected = step.result === 'not-found' ? 0 : 1
      assert.equal(step.comparisons - steps[index].comparisons, expected, `tìm ${value}, bước ${index + 1}`)
    })
  }
})

test('Search trên cây rỗng: không so sánh, kết luận ngay', () => {
  const steps = generate(createTree(), 5)

  assert.equal(steps.length, 2)
  assert.equal(steps[1].pseudocodeLine, 6)
  assert.equal(steps[1].comparisons, 0)
  assertBstStepInvariants(steps)
})

test('Search giữ nguyên cây ở mọi bước và chốt value', () => {
  const tree = buildTree(BALANCED_VALUES)
  const before = structuredClone(tree)
  const steps = generate(tree, 80)

  assert.deepEqual(tree, before)
  steps.forEach((step) => {
    assert.equal(step.tree, tree)
    assert.equal(step.operation, 'search')
    assert.equal(step.value, 80)
  })
})
