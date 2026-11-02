import test from 'node:test'
import assert from 'node:assert/strict'

import { generateHashTableInsertSteps } from '../src/algorithms/hashTableInsert.js'
import { generateHashTableSearchSteps } from '../src/algorithms/hashTableSearch.js'
import { generateHashTableDeleteSteps } from '../src/algorithms/hashTableDelete.js'
import { buildHashTable, loadFactor } from '../src/structures/hashTable.js'

// Đối chiếu Big-O trên Learning Panel với số phép so sánh khóa generator thực sự đếm (chaining).
// Search/Insert/Delete đều so khóa với từng phần tử của đúng một chain, nên chi phí = độ dài chain đã duyệt:
// tốt nhất O(1), phân tán tốt O(1 + α), mọi khóa va chạm O(n).
const comparisonsOf = (steps) => steps.at(-1).comparisons

test('Tốt nhất: m = 7, khóa 0..6 (mỗi ô một khóa), mọi Search tốn đúng 1 phép so sánh', () => {
  const table = buildHashTable(7, [0, 1, 2, 3, 4, 5, 6])

  for (let key = 0; key < 7; key++) {
    assert.equal(comparisonsOf(generateHashTableSearchSteps(table, key)), 1, `khóa ${key}`)
  }
  assert.equal(loadFactor(table), 1)
})

test('Phân tán đều: m = 7, khóa 0..13 (α = 2), chain dài đúng 2 nên tốn 1 hoặc 2, khóa vắng tốn đúng α', () => {
  const table = buildHashTable(7, Array.from({ length: 14 }, (_, key) => key))
  assert.equal(loadFactor(table), 2)

  for (let key = 0; key < 7; key++) {
    assert.equal(comparisonsOf(generateHashTableSearchSteps(table, key)), 1, `khóa đầu chain ${key}`)
    assert.equal(comparisonsOf(generateHashTableSearchSteps(table, key + 7)), 2, `khóa cuối chain ${key + 7}`)
    assert.equal(comparisonsOf(generateHashTableSearchSteps(table, key + 14)), 2, `khóa vắng ${key + 14}`)
    assert.equal(comparisonsOf(generateHashTableInsertSteps(table, key + 14)), 2, `chèn ${key + 14}`)
  }
})

test('Va chạm nặng ở quy mô giao diện: m = 7, khóa 3, 10, …, 94 (n = 14) cùng ô 3, Search khóa cuối tốn n', () => {
  const keys = Array.from({ length: 14 }, (_, k) => 3 + 7 * k)
  const table = buildHashTable(7, keys)

  assert.equal(table.buckets[3].length, 14)
  assert.equal(comparisonsOf(generateHashTableSearchSteps(table, 94)), 14)
  assert.equal(comparisonsOf(generateHashTableSearchSteps(table, 3)), 1)
})

test('Xấu nhất quy mô lớn: m = 7, khóa 0, 7, …, 6993 (1000 khóa cùng ô 0) đều tốn 1000 phép so sánh', () => {
  const keys = Array.from({ length: 1000 }, (_, k) => 7 * k)
  const table = buildHashTable(7, keys)

  assert.equal(comparisonsOf(generateHashTableSearchSteps(table, 6993)), 1000, 'Search khóa cuối')
  assert.equal(comparisonsOf(generateHashTableSearchSteps(table, 7000)), 1000, 'Search khóa vắng cùng ô')
  assert.equal(comparisonsOf(generateHashTableInsertSteps(table, 7000)), 1000, 'Insert phải kiểm trùng cả chain')
  assert.equal(comparisonsOf(generateHashTableDeleteSteps(table, 6993)), 1000, 'Delete khóa cuối')
  assert.equal(comparisonsOf(generateHashTableSearchSteps(table, 0)), 1, 'khóa đầu chain vẫn O(1)')
  assert.equal(comparisonsOf(generateHashTableSearchSteps(table, 1)), 0, 'ô 1 rỗng: 0 phép so sánh')
})
