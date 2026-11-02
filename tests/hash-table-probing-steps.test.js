import test from 'node:test'
import assert from 'node:assert/strict'

import * as insert from '../src/algorithms/hashTableInsert.js'
import * as search from '../src/algorithms/hashTableSearch.js'
import * as remove from '../src/algorithms/hashTableDelete.js'
import { buildHashTable, findEntry, hasEntry, removeEntry, toKeys } from '../src/structures/hashTable.js'
import { assertHashStepInvariants, lineText } from './helpers/hash-step-invariants.js'

const SAMPLE_KEYS = [15, 8, 22, 3, 11, 30]
const build = (capacity, keys) => buildHashTable(capacity, keys, 'probing')
const deleteKey = (table, key) => removeEntry(table, findEntry(table, key).id)
const lines = (steps) => steps.map((step) => step.pseudocodeLine)

const cellsOf = (table) => table.cells.map((cell) => {
  if (cell.kind === 'occupied') return cell.key
  return cell.kind === 'tombstone' ? 'DEL' : '·'
})

const runSearch = (table, key) => search.generateHashTableSearchSteps(table, key)
const runInsert = (table, key) => insert.generateHashTableInsertSteps(table, key)
const runDelete = (table, key) => remove.generateHashTableDeleteSteps(table, key)

test('Probing export mã giả: Insert 9 dòng, Search 8 dòng, Delete 8 dòng', () => {
  assert.equal(insert.probingInsertPseudocode.length, 9)
  assert.equal(search.probingSearchPseudocode.length, 8)
  assert.equal(remove.probingDeletePseudocode.length, 8)
})

test('Bảng mẫu probing: Search 30 dò ô 2..6, probes = 5, comparisons = 5, tìm thấy ở dòng 7', () => {
  const steps = runSearch(build(7, SAMPLE_KEYS), 30)
  const last = steps.at(-1)
  const pseudocode = search.probingSearchPseudocode

  assert.deepEqual(lines(steps), [null, 1, 3, 6, 3, 6, 3, 6, 3, 6, 3, 6, 7])
  assert.match(lineText(pseudocode, steps[1]), /key mod m/)
  assert.match(lineText(pseudocode, steps[2]), /\(i \+ j\) mod m/)
  assert.match(lineText(pseudocode, steps[3]), /T\[p\]\.key == key/)
  assert.match(lineText(pseudocode, last), /return p/)
  assert.deepEqual(last.probedBuckets, [2, 3, 4, 5, 6])
  assert.equal(last.probes, 5)
  assert.equal(last.comparisons, 5)
  assert.equal(last.result, 'found')
  assert.equal(last.foundEntryId, 'e6')
  assert.equal(last.currentBucket, 6)
  assertHashStepInvariants(steps)
})

test('Bảng mẫu probing: Search 9 dò ô 2..6 rồi gặp ô 0 trống, probes = 6, comparisons = 5', () => {
  const steps = runSearch(build(7, SAMPLE_KEYS), 9)
  const last = steps.at(-1)

  assert.deepEqual(lines(steps).slice(-3), [6, 3, 4])
  assert.match(lineText(search.probingSearchPseudocode, last), /trống/)
  assert.deepEqual(last.probedBuckets, [2, 3, 4, 5, 6, 0])
  assert.equal(last.probes, 6)
  assert.equal(last.comparisons, 5)
  assert.equal(last.result, 'not-found')
  assert.equal(last.currentEntryId, null)
  assertHashStepInvariants(steps)
})

test('Tombstone: m = 7, chèn 3, 10, 17, xóa 10 rồi Search 17 → probes = 3, comparisons = 2', () => {
  const table = deleteKey(build(7, [3, 10, 17]), 10)
  const steps = runSearch(table, 17)
  const last = steps.at(-1)

  assert.deepEqual(lines(steps), [null, 1, 3, 6, 3, 5, 3, 6, 7])
  assert.match(lineText(search.probingSearchPseudocode, steps[5]), /tombstone/)
  assert.equal(steps[5].comparisons, 1, 'ô tombstone không tính so sánh')
  assert.equal(last.result, 'found')
  assert.equal(last.probes, 3)
  assert.equal(last.comparisons, 2)
  assertHashStepInvariants(steps)
})

test('Search/Delete khóa vắng trên bảng đầy khóa (m = 3) dừng sau đúng m lần dò ở dòng 8', () => {
  const table = build(3, [0, 1, 2])

  for (const steps of [runSearch(table, 5), runDelete(table, 5)]) {
    const last = steps.at(-1)
    assert.equal(last.pseudocodeLine, 8)
    assert.deepEqual(last.probedBuckets, [2, 0, 1])
    assert.equal(last.probes, 3)
    assert.equal(last.comparisons, 3)
    assert.equal(last.comparisons, steps.at(-2).comparisons, 'bước kết luận không tăng')
    assert.equal(last.result, 'not-found')
    assertHashStepInvariants(steps)
  }
  assert.match(lineText(search.probingSearchPseudocode, runSearch(table, 5).at(-1)), /không tìm thấy/)
})

test('Search trên bảng toàn tombstone (m = 3): dò đủ 3 ô, 0 phép so sánh, kết luận ở dòng 8', () => {
  let table = build(3, [0, 1, 2])
  for (const key of [0, 1, 2]) table = deleteKey(table, key)

  const last = runSearch(table, 5).at(-1)
  assert.equal(last.pseudocodeLine, 8)
  assert.equal(last.probes, 3)
  assert.equal(last.comparisons, 0)
})

test('Insert 9 vào bảng mẫu: dò ô 2..6, gặp ô 0 trống (dòng 4) rồi đặt khóa (dòng 9)', () => {
  const steps = runInsert(build(7, SAMPLE_KEYS), 9)
  const last = steps.at(-1)
  const pseudocode = insert.probingInsertPseudocode

  assert.deepEqual(lines(steps), [null, 1, 3, 6, 3, 6, 3, 6, 3, 6, 3, 6, 3, 4, 9])
  assert.match(lineText(pseudocode, steps.at(-2)), /trống/)
  assert.match(lineText(pseudocode, last), /T\[vt\] = key/)
  assert.equal(last.result, 'inserted')
  assert.equal(last.probes, 6)
  assert.equal(last.comparisons, 5)
  assert.equal(last.currentBucket, 0)
  assert.deepEqual(cellsOf(last.table), [9, 15, 8, 22, 3, 11, 30])
  assert.equal(last.insertedEntryId, 'e7')
  assertHashStepInvariants(steps)
})

test('Insert kiểm trùng qua tombstone: 17 đã có phía sau tombstone ô 4 → "đã tồn tại", không đặt vào tombstone', () => {
  const table = deleteKey(build(7, [3, 10, 17]), 10)
  const steps = runInsert(table, 17)
  const last = steps.at(-1)

  assert.deepEqual(lines(steps), [null, 1, 3, 6, 3, 5, 3, 6, 7])
  assert.match(lineText(insert.probingInsertPseudocode, last), /đã tồn tại/)
  assert.equal(last.result, 'duplicate')
  assert.equal(last.probes, 3)
  assert.equal(last.comparisons, 2)
  assert.equal(last.table, table)
  assertHashStepInvariants(steps)
})

test('Insert 24 dùng lại tombstone đầu tiên (ô 4) sau khi dò tới ô trống để kiểm trùng', () => {
  const table = deleteKey(build(7, [3, 10, 17]), 10)
  const steps = runInsert(table, 24)
  const last = steps.at(-1)

  assert.deepEqual(lines(steps), [null, 1, 3, 6, 3, 5, 3, 6, 3, 4, 9])
  assert.equal(last.currentBucket, 4)
  assert.equal(last.probes, 4)
  assert.equal(last.comparisons, 2)
  assert.deepEqual(cellsOf(last.table), ['·', '·', '·', 3, 24, 17, '·'])
  assertHashStepInvariants(steps)
})

test('Insert vào bảng đầy khóa (m = 3): khóa mới → "bảng đầy" ở dòng 8, khóa trùng → "đã tồn tại"', () => {
  const table = build(3, [0, 1, 2])
  const full = runInsert(table, 3)
  const duplicate = runInsert(table, 2)

  assert.equal(full.at(-1).pseudocodeLine, 8)
  assert.match(lineText(insert.probingInsertPseudocode, full.at(-1)), /bảng đầy/)
  assert.equal(full.at(-1).result, 'full')
  assert.equal(full.at(-1).probes, 3)
  assert.equal(full.at(-1).comparisons, 3)
  assert.equal(full.at(-1).table, table)

  assert.equal(duplicate.at(-1).result, 'duplicate')
  assert.equal(duplicate.at(-1).probes, 1)
  assertHashStepInvariants(full)
  assertHashStepInvariants(duplicate)
})

test('Insert vào bảng toàn tombstone (m = 3): dò đủ m ô để kiểm trùng rồi dùng tombstone đầu tiên', () => {
  let table = build(3, [0, 1, 2])
  for (const key of [0, 1, 2]) table = deleteKey(table, key)

  const steps = runInsert(table, 5)
  const last = steps.at(-1)

  assert.deepEqual(lines(steps), [null, 1, 3, 5, 3, 5, 3, 5, 9])
  assert.equal(last.result, 'inserted')
  assert.equal(last.probes, 3)
  assert.equal(last.comparisons, 0)
  assert.deepEqual(cellsOf(last.table), ['DEL', 'DEL', 5])
  assertHashStepInvariants(steps)
})

test('m = 1: Search thấy, Search vắng dừng sau 1 lần dò, Insert báo đầy, Delete thành tombstone', () => {
  const table = build(1, [4])

  assert.equal(runSearch(table, 4).at(-1).result, 'found')
  assert.equal(runSearch(table, 9).at(-1).pseudocodeLine, 8)
  assert.equal(runSearch(table, 9).at(-1).probes, 1)
  assert.equal(runInsert(table, 9).at(-1).result, 'full')

  const deleted = runDelete(table, 4).at(-1).table
  assert.deepEqual(cellsOf(deleted), ['DEL'])
  const again = runDelete(deleted, 4).at(-1)
  assert.equal(again.result, 'not-found')
  assert.equal(again.probes, 1)
  assert.equal(again.comparisons, 0)
})

test('Delete probing: ô thành tombstone ở dòng 7, không để id treo, Search khóa phía sau vẫn thấy', () => {
  const table = build(7, [3, 10, 17])
  const steps = runDelete(table, 10)
  const last = steps.at(-1)

  assert.deepEqual(lines(steps), [null, 1, 3, 6, 3, 6, 7])
  assert.match(lineText(remove.probingDeletePseudocode, last), /tombstone/)
  assert.equal(hasEntry(steps.at(-2).table, 'e2'), true)
  assert.equal(last.result, 'deleted')
  assert.equal(last.currentEntryId, null)
  assert.equal(last.foundEntryId, null)
  assert.deepEqual(last.pathEntryIds, ['e1'])
  assert.equal(last.currentBucket, 4)
  assert.deepEqual(cellsOf(last.table), ['·', '·', '·', 3, 'DEL', 17, '·'])
  assert.deepEqual(toKeys(table), [3, 10, 17], 'bảng đầu vào giữ nguyên')
  assertHashStepInvariants(steps)

  assert.equal(runSearch(last.table, 17).at(-1).result, 'found')
})
