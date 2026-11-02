import test from 'node:test'
import assert from 'node:assert/strict'

import { generateBstInsertSteps } from '../src/algorithms/bstInsert.js'
import { generateBstSearchSteps } from '../src/algorithms/bstSearch.js'
import { generateBstDeleteSteps } from '../src/algorithms/bstDelete.js'
import { generateBstMinMaxSteps } from '../src/algorithms/bstMinMax.js'
import { generateBstHeightSteps } from '../src/algorithms/bstHeight.js'
import { generateBstTraversalSteps } from '../src/algorithms/bstTraversal.js'
import {
  buildTree,
  findNodeId,
  getDepth,
  getHeight,
  insertValue,
} from '../src/structures/bst.js'

// Đối chiếu Big-O O(h) hiển thị trên Learning Panel với số phép so sánh generator thực sự đếm.
// Preset cây suy biến 1..15 nằm trong giới hạn 1–99 của giao diện.
const n = 15
const DEGENERATE_VALUES = Array.from({ length: n }, (_, index) => index + 1)
const BALANCED_VALUES = [50, 30, 70, 20, 40, 60, 80, 10, 25, 35, 45, 55, 65, 75, 85]
const ABSENT_VALUES = [5, 15, 22, 27, 33, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 90]

function lastComparisons(steps) {
  return steps.at(-1).comparisons
}

test('Cây suy biến 1..15: h = n - 1', () => {
  assert.equal(getHeight(buildTree(DEGENERATE_VALUES)), n - 1)
  assert.equal(generateBstHeightSteps(buildTree(DEGENERATE_VALUES)).at(-1).result, n - 1)
})

test('Cây suy biến: Search giá trị lớn nhất cần đúng n phép so sánh (O(n))', () => {
  const tree = buildTree(DEGENERATE_VALUES)

  assert.equal(lastComparisons(generateBstSearchSteps(tree, n)), n)
  assert.equal(lastComparisons(generateBstSearchSteps(tree, n + 1)), n)
  assert.equal(lastComparisons(generateBstSearchSteps(tree, 1)), 1, 'tốt nhất O(1): gặp ngay ở gốc')
})

test('Cây suy biến: Insert và Delete ở cuối nhánh cũng tốn n phép so sánh', () => {
  const tree = buildTree(DEGENERATE_VALUES)

  assert.equal(lastComparisons(generateBstInsertSteps(tree, n + 1)), n)
  assert.equal(lastComparisons(generateBstDeleteSteps(tree, n)), n)
})

test('Cây suy biến: Max xét đủ n nút', () => {
  const tree = buildTree(DEGENERATE_VALUES)

  assert.equal(generateBstMinMaxSteps(tree, 'max').at(-1).pathIds.length, n)
})

test('Cây cân bằng 15 nút (h = 3): mọi Search, Insert, Delete tốn ≤ h + 1 = 4 phép so sánh', () => {
  const tree = buildTree(BALANCED_VALUES)
  assert.equal(getHeight(tree), 3)

  for (const value of [...BALANCED_VALUES, ...ABSENT_VALUES]) {
    assert.ok(lastComparisons(generateBstSearchSteps(tree, value)) <= 4, `Search ${value}`)
    assert.ok(lastComparisons(generateBstInsertSteps(tree, value)) <= 4, `Insert ${value}`)
    assert.ok(lastComparisons(generateBstDeleteSteps(tree, value)) <= 4, `Delete ${value}`)
  }
})

test('Search tìm thấy x ở độ sâu d tốn đúng d + 1 phép so sánh', () => {
  const tree = buildTree([42, 7, 93, 15, 3, 61, 88, 1, 99, 50, 77, 64])

  for (const node of Object.values(tree.nodes)) {
    assert.equal(
      lastComparisons(generateBstSearchSteps(tree, node.value)),
      getDepth(tree, node.id) + 1,
    )
  }
})

test('Insert: comparisons = độ sâu của nút mới = số nút từ gốc tới cha', () => {
  const tree = buildTree(BALANCED_VALUES)

  for (const value of ABSENT_VALUES) {
    const { tree: nextTree, id } = insertValue(tree, value)
    assert.equal(lastComparisons(generateBstInsertSteps(tree, value)), getDepth(nextTree, id), `Insert ${value}`)
  }
})

test('Delete: comparisons = độ sâu của z + 1 (đếm giống Search)', () => {
  const tree = buildTree(BALANCED_VALUES)

  for (const value of BALANCED_VALUES) {
    assert.equal(
      lastComparisons(generateBstDeleteSteps(tree, value)),
      getDepth(tree, findNodeId(tree, value)) + 1,
      `Delete ${value}`,
    )
  }
})

test('Duyệt cây và Height luôn thăm đủ n nút (O(n)) dù cây cân bằng hay suy biến', () => {
  for (const values of [BALANCED_VALUES, DEGENERATE_VALUES]) {
    const tree = buildTree(values)

    for (const order of ['inorder', 'preorder', 'postorder']) {
      assert.equal(generateBstTraversalSteps(tree, order).length - 1, n)
    }

    assert.equal(generateBstHeightSteps(tree).length - 1, n)
  }
})
