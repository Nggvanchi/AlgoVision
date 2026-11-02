import test from 'node:test'
import assert from 'node:assert/strict'

import * as minMax from '../src/algorithms/bstMinMax.js'
import * as height from '../src/algorithms/bstHeight.js'
import { buildTree, createTree, getHeight, toInorderIds } from '../src/structures/bst.js'
import { assertBstStepInvariants, lineText } from './helpers/bst-step-invariants.js'

const BALANCED_VALUES = [50, 30, 70, 20, 40, 60, 80]
const DEGENERATE_VALUES = Array.from({ length: 15 }, (_, index) => index + 1)

function lines(steps) {
  return steps.slice(1).map((step) => step.pseudocodeLine)
}

function postorderIds(tree, nodeId = tree.rootId, ids = []) {
  if (nodeId === null) return ids
  postorderIds(tree, tree.nodes[nodeId].left, ids)
  postorderIds(tree, tree.nodes[nodeId].right, ids)
  ids.push(nodeId)
  return ids
}

test('Min: đi trái từ gốc tới nút không còn con trái', () => {
  const tree = buildTree(BALANCED_VALUES)
  const steps = minMax.generateBstMinMaxSteps(tree, 'min')
  const last = steps.at(-1)

  assert.deepEqual(lines(steps), [2, 4, 4, 5])
  assert.match(lineText(minMax.bstMinMaxPseudocode.min, steps[2]), /cur = cur\.left/)
  assert.equal(last.result, 20)
  assert.equal(last.tree.nodes[last.foundId].value, 20)
  assert.deepEqual(last.pathIds.map((id) => tree.nodes[id].value), [50, 30, 20])
  assertBstStepInvariants(steps)
})

test('Max: đi phải từ gốc', () => {
  const tree = buildTree(BALANCED_VALUES)
  const steps = minMax.generateBstMinMaxSteps(tree, 'max')

  assert.deepEqual(lines(steps), [2, 4, 4, 5])
  assert.match(lineText(minMax.bstMinMaxPseudocode.max, steps[2]), /cur = cur\.right/)
  assert.equal(steps.at(-1).result, 80)
  assertBstStepInvariants(steps)
})

test('Min/Max cây rỗng: dòng 1, kết quả null', () => {
  for (const kind of ['min', 'max']) {
    const steps = minMax.generateBstMinMaxSteps(createTree(), kind)

    assert.deepEqual(lines(steps), [1])
    assert.equal(steps.at(-1).result, null)
    assertBstStepInvariants(steps)
  }
})

test('Min/Max cây một nút: kết quả là gốc, không đi xuống', () => {
  const steps = minMax.generateBstMinMaxSteps(buildTree([42]), 'max')

  assert.deepEqual(lines(steps), [2, 5])
  assert.equal(steps.at(-1).result, 42)
})

test('Max trên cây suy biến 15 nút đi xuống 14 lần', () => {
  const tree = buildTree(DEGENERATE_VALUES)
  const steps = minMax.generateBstMinMaxSteps(tree, 'max')

  assert.equal(lines(steps).filter((line) => line === 4).length, 14)
  assert.equal(steps.at(-1).result, 15)
  // Min của cây suy biến tăng dần là chính gốc.
  assert.deepEqual(lines(minMax.generateBstMinMaxSteps(tree, 'min')), [2, 5])
})

test('Kiểu Min/Max không hợp lệ bị từ chối', () => {
  assert.throws(() => minMax.generateBstMinMaxSteps(createTree(), 'median'), RangeError)
})

test('Height cây rỗng: dòng 2, kết quả -1', () => {
  const steps = height.generateBstHeightSteps(createTree())

  assert.deepEqual(lines(steps), [2])
  assert.match(lineText(height.bstHeightPseudocode, steps[1]), /return -1/)
  assert.equal(steps.at(-1).result, -1)
  assertBstStepInvariants(steps)
})

test('Height cây một nút là 0', () => {
  const tree = buildTree([42])
  const steps = height.generateBstHeightSteps(tree)

  assert.deepEqual(lines(steps), [3])
  assert.equal(steps.at(-1).result, 0)
  assert.deepEqual(steps.at(-1).heights, { [tree.rootId]: 0 })
})

test('Height tính theo hậu tự, heights tích lũy từng nút một', () => {
  const tree = buildTree(BALANCED_VALUES)
  const steps = height.generateBstHeightSteps(tree)

  assert.deepEqual(steps.slice(1).map((step) => step.currentId), postorderIds(tree))
  steps.slice(1).forEach((step, index) => {
    assert.equal(step.pseudocodeLine, 3)
    assert.match(lineText(height.bstHeightPseudocode, step), /1 \+ max/)
    const previous = steps[index].heights
    assert.equal(Object.keys(step.heights).length, Object.keys(previous).length + 1)
    Object.entries(previous).forEach(([id, value]) => assert.equal(step.heights[id], value))
    assert.equal(step.heights[step.currentId], getHeight(tree, step.currentId))
  })

  assert.equal(steps.at(-1).result, 2)
  assertBstStepInvariants(steps)
})

test('Height cây suy biến n nút là n - 1', () => {
  const tree = buildTree(DEGENERATE_VALUES)
  const steps = height.generateBstHeightSteps(tree)

  assert.equal(steps.at(-1).result, 14)
  assert.equal(steps.length - 1, toInorderIds(tree).length)
})
