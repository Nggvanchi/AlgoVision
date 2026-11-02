import test from 'node:test'
import assert from 'node:assert/strict'

import * as insert from '../src/algorithms/hashTableInsert.js'
import { buildHashTable, createHashTable, toKeys } from '../src/structures/hashTable.js'
import { assertHashStepInvariants, lineText } from './helpers/hash-step-invariants.js'

const SAMPLE_KEYS = [15, 8, 22, 3, 11, 30]
const pseudocode = insert.chainingInsertPseudocode

function generate(table, key) {
  return insert.generateHashTableInsertSteps(table, key)
}

const keyOf = (step, id) => step.table.buckets.flat().find((entry) => entry.id === id)?.key

test('Insert chaining export mã giả 5 dòng', () => {
  assert.equal(pseudocode.length, 5)
})

test('Insert vào ô rỗng: bước 0, tính hash (dòng 1), nối vào cuối (dòng 5), 0 phép so sánh', () => {
  const table = buildHashTable(7, SAMPLE_KEYS)
  const steps = generate(table, 5)

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 5])
  assert.match(lineText(pseudocode, steps[1]), /key mod m/)
  assert.match(lineText(pseudocode, steps[2]), /cuối bucket\[i\]/)

  assert.equal(steps[0].hashIndex, null)
  assert.equal(steps[1].hashIndex, 5)
  assert.equal(steps[1].currentBucket, 5)

  const last = steps.at(-1)
  assert.equal(last.result, 'inserted')
  assert.equal(last.comparisons, 0)
  assert.equal(last.insertedEntryId, 'e7')
  assert.deepEqual(last.table.buckets[5], [{ id: 'e7', key: 5 }])
  assertHashStepInvariants(steps)
})

test('Insert khóa mới vào chain [15, 8, 22]: so sánh cả 3 khóa rồi nối cuối, comparisons = 3', () => {
  const table = buildHashTable(7, SAMPLE_KEYS)
  const steps = generate(table, 29)

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 3, 3, 3, 5])
  assert.match(lineText(pseudocode, steps[2]), /e\.key == key/)
  assert.deepEqual(steps.slice(2, 5).map((step) => keyOf(step, step.currentEntryId)), [15, 8, 22])
  assert.deepEqual(steps.map((step) => step.comparisons), [0, 0, 1, 2, 3, 3])
  assert.deepEqual(steps[4].pathEntryIds, ['e1', 'e2', 'e3'])

  const last = steps.at(-1)
  assert.equal(last.result, 'inserted')
  assert.equal(last.currentEntryId, null)
  assert.deepEqual(last.table.buckets[1].map((entry) => entry.key), [15, 8, 22, 29])
  assertHashStepInvariants(steps)
})

test('Insert khóa trùng: dừng ở phần tử bằng khóa, dòng 4, bảng giữ nguyên', () => {
  const table = buildHashTable(7, SAMPLE_KEYS)
  const steps = generate(table, 8)

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 3, 3, 4])
  assert.match(lineText(pseudocode, steps.at(-1)), /đã tồn tại/)

  const last = steps.at(-1)
  assert.equal(last.result, 'duplicate')
  assert.equal(last.comparisons, 2, 'bước kết luận không tăng comparisons')
  assert.equal(last.foundEntryId, 'e2')
  assert.equal(last.insertedEntryId, null)
  assert.deepEqual(toKeys(last.table), toKeys(table))
  assertHashStepInvariants(steps)
})

test('Insert chốt bảng: steps.at(-1).table là bảng mới, bảng đầu vào và các bước trước không đổi', () => {
  const table = buildHashTable(7, [15])
  const steps = generate(table, 8)

  assert.deepEqual(toKeys(table), [15])
  steps.slice(0, -1).forEach((step) => assert.deepEqual(toKeys(step.table), [15]))
  assert.deepEqual(toKeys(steps.at(-1).table), [15, 8])
})

test('Insert lưu dữ liệu ở trường bước: bước 0 không có hash, mọi bước giữ operation và key', () => {
  const steps = generate(createHashTable(5), 42)

  assert.equal(steps[0].operation, 'insert')
  assert.equal(steps[0].key, 42)
  assert.equal(steps[0].currentBucket, null)
  assert.equal(steps[1].hashIndex, 2)
  assertHashStepInvariants(steps)
})

test('Insert từ chối khóa không nguyên', () => {
  assert.throws(() => generate(createHashTable(7), 2.5), TypeError)
})
