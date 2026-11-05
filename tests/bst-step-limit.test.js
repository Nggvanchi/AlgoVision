import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTree } from '../src/structures/bst.js'
import * as searchModule from '../src/algorithms/bstSearch.js'
import * as insertModule from '../src/algorithms/bstInsert.js'
import * as deleteModule from '../src/algorithms/bstDelete.js'
import * as minMaxModule from '../src/algorithms/bstMinMax.js'

// Giới hạn số bước (n = số nút, k ≤ n = số nút trên đường đi):
// Search 1 + k + 1 ≤ n + 2; Min/Max 1 + 1 + (k − 1) + 1 ≤ n + 2; Delete ≤ n + 2 (không tìm thấy 1 + k + 1;
// hai con d + m + 5 với d tổ tiên, m bước tìm successor, d + m + 3 ≤ n); Insert 1 + 2k ≤ 2n + 1, cây rỗng 2 bước.
const limitsOf = (tree) => ({
  search: searchModule.bstSearchStepLimit(tree),
  insert: insertModule.bstInsertStepLimit(tree),
  delete: deleteModule.bstDeleteStepLimit(tree),
  minMax: minMaxModule.bstMinMaxStepLimit(tree),
})

function permutations(values) {
  if (values.length <= 1) return [values]
  return values.flatMap((value, index) => permutations([...values.slice(0, index), ...values.slice(index + 1)])
    .map((rest) => [value, ...rest]))
}

test('giới hạn số bước BST theo số dò tay: cây rỗng, một nút, chuỗi 3 nút, cây 6 nút', () => {
  assert.deepEqual(limitsOf(buildTree([])), { search: 2, insert: 2, delete: 2, minMax: 2 })
  assert.deepEqual(limitsOf(buildTree([50])), { search: 3, insert: 3, delete: 3, minMax: 3 })
  assert.deepEqual(limitsOf(buildTree([10, 20, 30])), { search: 5, insert: 7, delete: 5, minMax: 5 })
  assert.deepEqual(limitsOf(buildTree([40, 20, 60, 10, 30, 50])), { search: 8, insert: 13, delete: 8, minMax: 8 })
})

test('mọi cây từ 720 hoán vị của 6 giá trị × mọi giá trị 5..75: số bước ≤ giới hạn; dạng xấu nhất đạt đúng giới hạn', () => {
  const values = [10, 20, 30, 40, 50, 60]
  const queries = Array.from({ length: 15 }, (_, index) => 5 * (index + 1))
  const worst = { search: 0, insert: 0, delete: 0, minMax: 0 }

  for (const order of permutations(values)) {
    const tree = buildTree(order)
    const limits = limitsOf(tree)
    const record = (operation, steps, where) => {
      assert.ok(steps.length <= limits[operation], `${operation} ${where} trên [${order}]: ${steps.length} > ${limits[operation]}`)
      worst[operation] = Math.max(worst[operation], steps.length)
    }
    for (const value of queries) {
      record('search', searchModule.generateBstSearchSteps(tree, value), value)
      record('insert', insertModule.generateBstInsertSteps(tree, value), value)
      record('delete', deleteModule.generateBstDeleteSteps(tree, value), value)
    }
    record('minMax', minMaxModule.generateBstMinMaxSteps(tree, 'min'), 'min')
    record('minMax', minMaxModule.generateBstMinMaxSteps(tree, 'max'), 'max')
  }
  // Cây 6 nút: giới hạn n + 2 = 8, Insert 2n + 1 = 13; cây chuỗi đạt đúng các số này.
  assert.deepEqual(worst, { search: 8, insert: 13, delete: 8, minMax: 8 })
})
