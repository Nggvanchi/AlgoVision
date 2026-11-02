import test from 'node:test'
import assert from 'node:assert/strict'

import * as search from '../src/algorithms/hashTableSearch.js'
import { buildHashTable, createHashTable } from '../src/structures/hashTable.js'
import { assertHashStepInvariants, lineText } from './helpers/hash-step-invariants.js'

const SAMPLE_KEYS = [15, 8, 22, 3, 11, 30]
const pseudocode = search.chainingSearchPseudocode

function generate(table, key) {
  return search.generateHashTableSearchSteps(table, key)
}

test('Search chaining export mã giả 5 dòng', () => {
  assert.equal(pseudocode.length, 5)
})

test('Search tìm thấy 22 ở cuối chain [15, 8, 22]: dòng 1, 3, 3, 3, 4; comparisons = 3', () => {
  const steps = generate(buildHashTable(7, SAMPLE_KEYS), 22)

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 3, 3, 3, 4])
  assert.match(lineText(pseudocode, steps[1]), /key mod m/)
  assert.match(lineText(pseudocode, steps[2]), /e\.key == key/)
  assert.match(lineText(pseudocode, steps.at(-1)), /return e$/)
  assert.deepEqual(steps.map((step) => step.comparisons), [0, 0, 1, 2, 3, 3])

  const last = steps.at(-1)
  assert.equal(last.result, 'found')
  assert.equal(last.foundEntryId, 'e3')
  assert.equal(last.currentEntryId, 'e3')
  assert.deepEqual(last.pathEntryIds, ['e1', 'e2', 'e3'])
  assertHashStepInvariants(steps)
})

test('Search tìm thấy phần tử đầu chain: comparisons = 1', () => {
  const steps = generate(buildHashTable(7, SAMPLE_KEYS), 15)

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 3, 4])
  assert.equal(steps.at(-1).comparisons, 1)
  assertHashStepInvariants(steps)
})

test('Search không tìm thấy 29 (cùng ô 1): so cả chain rồi kết luận ở dòng 5, không tăng comparisons', () => {
  const steps = generate(buildHashTable(7, SAMPLE_KEYS), 29)
  const last = steps.at(-1)

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 3, 3, 3, 5])
  assert.match(lineText(pseudocode, last), /không tìm thấy/)
  assert.equal(last.result, 'not-found')
  assert.equal(last.comparisons, 3)
  assert.equal(last.comparisons, steps.at(-2).comparisons)
  assert.equal(last.currentEntryId, null)
  assert.equal(last.foundEntryId, null)
  assertHashStepInvariants(steps)
})

test('Search trên ô rỗng: 0 phép so sánh, kết luận ngay sau bước hash', () => {
  const steps = generate(buildHashTable(7, SAMPLE_KEYS), 12)

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 1, 5])
  assert.equal(steps.at(-1).comparisons, 0)
  assert.equal(steps.at(-1).result, 'not-found')
  assertHashStepInvariants(steps)
})

test('Search không sửa bảng: mọi bước dùng đúng bảng đầu vào', () => {
  const table = buildHashTable(7, SAMPLE_KEYS)
  const steps = generate(table, 30)

  steps.forEach((step) => assert.equal(step.table, table))
  assert.equal(steps[0].operation, 'search')
  assert.equal(steps[0].key, 30)
})

test('Search: comparisons tăng đúng 1 mỗi bước so sánh, bằng 0 ở bước hash', () => {
  const table = buildHashTable(5, [0, 5, 10, 15, 1, 6, 2])

  for (const key of [0, 5, 10, 15, 20, 1, 6, 11, 2, 3, 4]) {
    const steps = generate(table, key)
    steps.slice(1).forEach((step, index) => {
      const previous = steps[index]
      const expected = step.pseudocodeLine === 3 ? previous.comparisons + 1 : previous.comparisons
      assert.equal(step.comparisons, expected, `khóa ${key}, bước ${index + 1}`)
    })
    assertHashStepInvariants(steps)
  }
})

test('Search từ chối khóa không nguyên', () => {
  assert.throws(() => generate(createHashTable(7), Number.NaN), TypeError)
})
