import test from 'node:test'
import assert from 'node:assert/strict'

import * as layout from '../src/tree-layout.js'
import { generateBstDeleteSteps } from '../src/algorithms/bstDelete.js'
import { buildTree, createTree, getHeight, toInorderIds } from '../src/structures/bst.js'

const BALANCED_VALUES = [50, 30, 70, 20, 40, 60, 80]
const { COLUMN_WIDTH, ROW_HEIGHT } = layout.TREE_LAYOUT

test('Cây rỗng: không có vị trí, kích thước 0', () => {
  assert.deepEqual(layout.computeTreeLayout(createTree()), { positions: {}, width: 0, height: 0 })
})

test('x theo thứ hạng inorder: mỗi nút một cột riêng, tăng dần', () => {
  const tree = buildTree([42, 7, 93, 15, 3, 61, 88, 1, 99, 50])
  const { positions } = layout.computeTreeLayout(tree)
  const xs = toInorderIds(tree).map((id) => positions[id].x)

  xs.forEach((x, rank) => assert.equal(x, rank * COLUMN_WIDTH + COLUMN_WIDTH / 2))
  assert.equal(new Set(xs).size, xs.length)
})

test('y theo độ sâu', () => {
  const tree = buildTree(BALANCED_VALUES)
  const { positions } = layout.computeTreeLayout(tree)
  const root = tree.nodes[tree.rootId]

  assert.equal(positions[tree.rootId].y, ROW_HEIGHT / 2)
  assert.equal(positions[root.left].y, ROW_HEIGHT + ROW_HEIGHT / 2)
  assert.equal(positions[tree.nodes[root.left].left].y, 2 * ROW_HEIGHT + ROW_HEIGHT / 2)
})

test('Con trái nằm bên trái cha, con phải nằm bên phải cha', () => {
  const tree = buildTree([42, 7, 93, 15, 3, 61, 88, 1, 99, 50])
  const { positions } = layout.computeTreeLayout(tree)

  for (const node of Object.values(tree.nodes)) {
    if (node.left !== null) assert.ok(positions[node.left].x < positions[node.id].x)
    if (node.right !== null) assert.ok(positions[node.right].x > positions[node.id].x)
  }
})

test('Kích thước khung: rộng n cột, cao h + 1 hàng', () => {
  const tree = buildTree(BALANCED_VALUES)
  const result = layout.computeTreeLayout(tree)

  assert.equal(result.width, 7 * COLUMN_WIDTH)
  assert.equal(result.height, (getHeight(tree) + 1) * ROW_HEIGHT)
})

test('Cây 15 nút rộng tối đa 600px', () => {
  const values = Array.from({ length: 15 }, (_, index) => index + 1)

  assert.equal(layout.computeTreeLayout(buildTree(values)).width, 600)
})

test('Cây có giá trị trùng tạm thời (bước 12 của Delete) vẫn có vị trí cho mọi nút', () => {
  const steps = generateBstDeleteSteps(buildTree([50, 30, 80, 70, 90, 60, 65]), 50)
  const copyStep = steps.find((step) => step.pseudocodeLine === 12)
  const { positions } = layout.computeTreeLayout(copyStep.tree)

  assert.deepEqual(
    Object.keys(positions).sort(),
    Object.keys(copyStep.tree.nodes).sort(),
  )
  assert.ok(positions[copyStep.foundId].x < positions[copyStep.successorId].x)
})
