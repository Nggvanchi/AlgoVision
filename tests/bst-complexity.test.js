import test from 'node:test'
import assert from 'node:assert/strict'
import { deepFreeze } from './helpers/deep-freeze.js'
import { assertBstStepInvariants } from './helpers/bst-step-invariants.js'

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

// Expected dò tay từ hồ sơ OP-21–29, không dùng API/generator tạo expected.
test('BST literal oracle: 9 OP, frozen input và bảo toàn bước cũ', () => {
  const tree = deepFreeze({ rootId: 1, nextId: 6, nodes: {
    1: { id: 1, value: 4, left: 2, right: 3 },
    2: { id: 2, value: 2, left: null, right: null },
    3: { id: 3, value: 6, left: 4, right: 5 },
    4: { id: 4, value: 5, left: null, right: null },
    5: { id: 5, value: 7, left: null, right: null },
  } })
  const input = JSON.stringify(tree)
  const fixtures = [
    { op: 'insert', value: 3, run: () => generateBstInsertSteps(tree, 3), c: 2, lines: [null, 6, 8, 6, 10], found: 6, result: 'inserted' },
    { op: 'search', value: 5, run: () => generateBstSearchSteps(tree, 5), c: 3, lines: [null, 5, 4, 3], found: 4, result: 'found' },
    { op: 'delete', value: 4, run: () => generateBstDeleteSteps(tree, 4), c: 1, lines: [null, 10, 11, 11, 12, 13], found: 1, result: 'deleted' },
    { op: 'inorder', value: null, run: () => generateBstTraversalSteps(tree, 'inorder'), c: 0, lines: [null, 4, 4, 4, 4, 4], ids: [2, 1, 4, 3, 5], result: [2, 4, 5, 6, 7] },
    { op: 'preorder', value: null, run: () => generateBstTraversalSteps(tree, 'preorder'), c: 0, lines: [null, 3, 3, 3, 3, 3], ids: [1, 2, 3, 4, 5], result: [4, 2, 6, 5, 7] },
    { op: 'postorder', value: null, run: () => generateBstTraversalSteps(tree, 'postorder'), c: 0, lines: [null, 5, 5, 5, 5, 5], ids: [2, 4, 5, 3, 1], result: [2, 5, 7, 6, 4] },
    { op: 'min', value: null, run: () => generateBstMinMaxSteps(tree, 'min'), c: 0, lines: [null, 2, 4, 5], found: 2, result: 2 },
    { op: 'max', value: null, run: () => generateBstMinMaxSteps(tree, 'max'), c: 0, lines: [null, 2, 4, 4, 5], found: 5, result: 7 },
    { op: 'height', value: null, run: () => generateBstHeightSteps(tree), c: 0, lines: [null, 3, 3, 3, 3, 3], ids: [2, 4, 5, 3, 1], result: 2 },
  ]
  const saved = []
  for (const fixture of fixtures) {
    const steps = fixture.run()
    const last = steps.at(-1)
    assertBstStepInvariants(steps)
    assert.equal(last.comparisons, fixture.c, fixture.op + ' C literal')
    assert.deepEqual(steps.map(step => step.pseudocodeLine), fixture.lines, fixture.op + ' mã giả/S')
    assert.deepEqual(last.result, fixture.result, fixture.op + ' kết quả literal')
    assert.ok(steps.every(step => step.operation === fixture.op && step.value === fixture.value), fixture.op + ' input chốt')
    if (fixture.found !== undefined) assert.equal(last.foundId, fixture.found, fixture.op + ' ID literal')
    if (fixture.ids) assert.deepEqual(steps.slice(1).map(step => step.currentId), fixture.ids, fixture.op + ' thứ tự ID')
    if (Array.isArray(fixture.result)) assert.deepEqual(last.output, fixture.result, fixture.op + ' output')
    if (fixture.op === 'insert') {
      assert.equal(last.tree.nodes[2].right, 6)
      assert.deepEqual(last.tree.nodes[6], { id: 6, value: 3, left: null, right: null })
      assert.equal(last.tree.nextId, 7)
    }
    if (fixture.op === 'delete') {
      const copied = steps.find(step => step.pseudocodeLine === 12)
      assert.equal(copied.tree.nodes[1].value, 5, 'COPY giữ ID z')
      assert.equal(copied.tree.nodes[4].value, 5, 'COPY tạm trùng khóa')
      assert.equal(last.tree.rootId, 1)
      assert.equal(last.tree.nodes[1].value, 5)
      assert.equal(last.tree.nodes[3].left, null)
      assert.ok(!Object.hasOwn(last.tree.nodes, 4), 'gỡ ID successor')
      assert.equal(last.tree.nextId, 6)
      assert.equal(last.successorId, null)
    }
    if (fixture.op === 'height') assert.deepEqual(last.heights, { 1: 2, 2: 0, 3: 1, 4: 0, 5: 0 })
    assert.equal(JSON.stringify(tree), input, fixture.op + ' không mutation input')
    saved.push({ steps: deepFreeze(steps), bytes: JSON.stringify(steps) })
  }
  generateBstInsertSteps(tree, 8)
  for (const old of saved) assert.equal(JSON.stringify(old.steps), old.bytes, 'thao tác sau không sửa bước cũ')
})
