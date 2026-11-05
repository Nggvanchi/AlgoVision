import test from 'node:test'
import assert from 'node:assert/strict'
import * as binaryModule from '../src/algorithms/binarySearch.js'

// Giới hạn số bước: bước đầu + tối đa ⌊log2 n⌋ + 1 lần so sánh (mỗi lần một bước) + bước kết luận "không tìm thấy".
test('giới hạn số bước Binary Search theo số dò tay: ⌊log2 n⌋ + 3, mảng rỗng 2', () => {
  const cases = [[0, 2], [1, 3], [2, 4], [3, 4], [7, 5], [8, 6], [12, 6], [1000, 12], [2 ** 20, 23]]
  for (const [length, expected] of cases) {
    assert.equal(binaryModule.binarySearchStepLimit(length), expected, `n = ${length}`)
  }
})

test('mọi n 0..300 × mọi target (gồm không có): số bước ≤ giới hạn, và có target đạt đúng giới hạn', () => {
  for (let length = 0; length <= 300; length++) {
    const numbers = Array.from({ length }, (_, index) => 2 * index)
    const limit = binaryModule.binarySearchStepLimit(length)
    let worst = 0
    for (let target = -1; target <= 2 * length; target++) {
      const count = binaryModule.generateBinarySearchSteps(numbers, target).length
      assert.ok(count <= limit, `n = ${length}, target ${target}: ${count} bước vượt giới hạn ${limit}`)
      worst = Math.max(worst, count)
    }
    assert.equal(worst, limit, `n = ${length}: số bước xấu nhất phải đúng bằng giới hạn`)
  }
})
