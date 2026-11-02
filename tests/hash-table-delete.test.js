import test from 'node:test'
import assert from 'node:assert/strict'

import * as remove from '../src/algorithms/hashTableDelete.js'
import { buildHashTable, containsKey, createHashTable, hasEntry, toKeys } from '../src/structures/hashTable.js'
import { assertHashStepInvariants, lineText } from './helpers/hash-step-invariants.js'

const SAMPLE_KEYS = [15, 8, 22, 3, 11, 30]
const pseudocode = remove.chainingDeletePseudocode

function generate(table, key) {
  return remove.generateHashTableDeleteSteps(table, key)
}

test('Delete chaining export mã giả 5 dòng', () => {
  assert.equal(pseudocode.length, 5)
})

test('Delete 8 ở giữa chain [15, 8, 22]: so 2 khóa rồi xóa ở dòng 4, comparisons = 2', () => {
  const table = buildHashTable(7, SAMPLE_KEYS)
  const steps = generate(table, 8)
  const last = steps.at(-1)

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 3, 3, 4])
  assert.match(lineText(pseudocode, steps[2]), /e\.key == key/)
  assert.match(lineText(pseudocode, last), /xóa e khỏi bucket\[i\]/)
  assert.equal(last.result, 'deleted')
  assert.equal(last.comparisons, 2)
  assert.deepEqual(last.table.buckets[1].map((entry) => entry.key), [15, 22])
  assertHashStepInvariants(steps)
})

test('Delete không để id treo: bước xóa đặt currentEntryId/foundEntryId = null, pathEntryIds bỏ phần tử đã xóa', () => {
  const steps = generate(buildHashTable(7, SAMPLE_KEYS), 8)
  const beforeLast = steps.at(-2)
  const last = steps.at(-1)

  assert.equal(beforeLast.currentEntryId, 'e2')
  assert.equal(hasEntry(beforeLast.table, 'e2'), true, 'bước so sánh vẫn thấy phần tử')
  assert.equal(hasEntry(last.table, 'e2'), false)
  assert.equal(last.currentEntryId, null)
  assert.equal(last.foundEntryId, null)
  assert.deepEqual(last.pathEntryIds, ['e1'])
  assertHashStepInvariants(steps)
})

test('Delete chốt bảng: bảng đầu vào và các bước trước vẫn còn khóa, chỉ bước cuối mất khóa', () => {
  const table = buildHashTable(7, SAMPLE_KEYS)
  const steps = generate(table, 30)

  assert.equal(containsKey(table, 30), true)
  steps.slice(0, -1).forEach((step) => assert.equal(containsKey(step.table, 30), true))
  assert.equal(containsKey(steps.at(-1).table, 30), false)
  assert.deepEqual(toKeys(steps.at(-1).table), [15, 8, 22, 3, 11])
})

test('Delete khóa vắng 29 (cùng ô 1): so cả chain, kết luận ở dòng 5, không tăng comparisons, bảng giữ nguyên', () => {
  const table = buildHashTable(7, SAMPLE_KEYS)
  const steps = generate(table, 29)
  const last = steps.at(-1)

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 3, 3, 3, 5])
  assert.match(lineText(pseudocode, last), /không tìm thấy/)
  assert.equal(last.result, 'not-found')
  assert.equal(last.comparisons, 3)
  assert.equal(last.comparisons, steps.at(-2).comparisons)
  assert.equal(last.table, table)
  assertHashStepInvariants(steps)
})

test('Delete trên ô rỗng: 0 phép so sánh', () => {
  const steps = generate(createHashTable(7), 4)

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 5])
  assert.equal(steps.at(-1).comparisons, 0)
  assertHashStepInvariants(steps)
})

test('Delete từng khóa của bảng mẫu: mỗi lần chỉ mất đúng khóa đó', () => {
  let table = buildHashTable(7, SAMPLE_KEYS)
  const remaining = [...SAMPLE_KEYS]

  for (const key of [22, 15, 3, 30, 11, 8]) {
    const steps = generate(table, key)
    assertHashStepInvariants(steps)
    table = steps.at(-1).table
    remaining.splice(remaining.indexOf(key), 1)
    assert.deepEqual([...toKeys(table)].sort((a, b) => a - b), [...remaining].sort((a, b) => a - b))
  }
})
