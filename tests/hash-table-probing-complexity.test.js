import test from 'node:test'
import assert from 'node:assert/strict'

import { generateHashTableInsertSteps } from '../src/algorithms/hashTableInsert.js'
import { generateHashTableSearchSteps } from '../src/algorithms/hashTableSearch.js'
import {
  buildHashTable,
  countEntries,
  countTombstones,
  findEntry,
  removeEntry,
} from '../src/structures/hashTable.js'

// Đối chiếu Big-O của linear probing với số ô generator thực sự dò (probes) và số phép so khóa (comparisons).
// Tốt nhất O(1); xấu nhất O(m): dò hết bảng. Chi phí phụ thuộc số ô KHÔNG trống, tức (n + tombstone)/m.
const build = (capacity, keys) => buildHashTable(capacity, keys, 'probing')
const costOf = (steps) => ({ probes: steps.at(-1).probes, comparisons: steps.at(-1).comparisons })

test('Tốt nhất: m = 7, khóa 0..6 nằm đúng ô hash, mọi Search tốn 1 lần dò, 1 phép so sánh', () => {
  const table = build(7, [0, 1, 2, 3, 4, 5, 6])

  for (let key = 0; key < 7; key++) {
    assert.deepEqual(costOf(generateHashTableSearchSteps(table, key)), { probes: 1, comparisons: 1 })
  }
})

test('Bảng thưa: khóa vắng rơi vào ô trống chỉ tốn 1 lần dò, 0 phép so sánh', () => {
  const table = build(7, [0])
  assert.deepEqual(costOf(generateHashTableSearchSteps(table, 1)), { probes: 1, comparisons: 0 })
})

test('Cụm va chạm m = 7: 3, 10, 17, 24 ở ô 3..6; Search 24 → 4/4, Search 31 → probes 5, comparisons 4', () => {
  const table = build(7, [3, 10, 17, 24])

  assert.deepEqual(costOf(generateHashTableSearchSteps(table, 24)), { probes: 4, comparisons: 4 })
  assert.deepEqual(costOf(generateHashTableSearchSteps(table, 31)), { probes: 5, comparisons: 4 })
})

test('Xấu nhất O(m): bảng đầy khóa m = 7, Search khóa vắng dò đủ 7 ô', () => {
  const table = build(7, [0, 1, 2, 3, 4, 5, 6])
  assert.deepEqual(costOf(generateHashTableSearchSteps(table, 7)), { probes: 7, comparisons: 7 })
})

test('Tombstone làm tăng chi phí: n = 1 nhưng 5 tombstone, Search khóa vắng dò cả 7 ô', () => {
  let table = build(7, [0, 1, 2, 3, 4, 5])
  for (const key of [0, 1, 2, 3, 4]) {
    table = removeEntry(table, findEntry(table, key).id)
  }

  assert.equal(countEntries(table), 1)
  assert.equal(countTombstones(table), 5)
  assert.deepEqual(costOf(generateHashTableSearchSteps(table, 7)), { probes: 7, comparisons: 1 })
})

test('Quy mô lớn: m = 1000, 999 khóa cùng hash 0; Search khóa vắng → probes 1000, comparisons 999', () => {
  const keys = Array.from({ length: 999 }, (_, k) => 1000 * k)
  const table = build(1000, keys)

  assert.deepEqual(costOf(generateHashTableSearchSteps(table, 999000)), { probes: 1000, comparisons: 999 })
  assert.deepEqual(costOf(generateHashTableSearchSteps(table, 998000)), { probes: 999, comparisons: 999 })
  assert.deepEqual(costOf(generateHashTableSearchSteps(table, 0)), { probes: 1, comparisons: 1 })

  const inserted = generateHashTableInsertSteps(table, 999000).at(-1)
  assert.equal(inserted.result, 'inserted')
  assert.equal(inserted.currentBucket, 999)
  assert.deepEqual(costOf([inserted]), { probes: 1000, comparisons: 999 })
})
