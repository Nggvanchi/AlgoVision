import test from 'node:test'
import assert from 'node:assert/strict'

import * as layout from '../src/hash-table-layout.js'
import { buildHashTable } from '../src/structures/hashTable.js'

const SAMPLE_KEYS = [15, 8, 22, 3, 11, 30]

test('HASH_TABLE_LAYOUT export kích thước cố định', () => {
  assert.deepEqual({ ...layout.HASH_TABLE_LAYOUT }, {
    LABEL_WIDTH: 44,
    CELL_WIDTH: 40,
    CELL_HEIGHT: 32,
    LINK_GAP: 16,
    ROW_HEIGHT: 48,
    PADDING: 8,
  })
})

test('Chaining: mỗi ô một hàng, phần tử nối sang phải theo vị trí trong chain', () => {
  const result = layout.computeHashTableLayout(buildHashTable(7, SAMPLE_KEYS))

  assert.equal(result.buckets.length, 7)
  assert.deepEqual(result.buckets[1], { index: 1, x: 44, y: 56, centerX: 64, centerY: 72 })
  assert.equal(result.buckets[6].centerY, 6 * 48 + 24)

  // ô 1 = [15 (e1), 8 (e2), 22 (e3)]: tâm x = 44 + 40 + 16 + 20 + p · 56
  assert.deepEqual(result.entries.e1, { bucketIndex: 1, position: 0, centerX: 120, centerY: 72 })
  assert.equal(result.entries.e2.centerX, 176)
  assert.equal(result.entries.e3.centerX, 232)
  assert.equal(result.entries.e6.bucketIndex, 2, '30 nằm ở ô 2')

  // rộng = nhãn + ô đầu + 3 phần tử dài nhất + lề; cao = 7 hàng
  assert.equal(result.width, 44 + 40 + 3 * 56 + 8)
  assert.equal(result.height, 7 * 48)
})

test('Chaining bảng rỗng vẫn có đủ hàng và độ rộng tối thiểu của nhãn + ô đầu', () => {
  const result = layout.computeHashTableLayout(buildHashTable(5, []))

  assert.equal(result.buckets.length, 5)
  assert.deepEqual(result.entries, {})
  assert.equal(result.width, 44 + 40 + 8)
  assert.equal(result.height, 5 * 48)
})

test('Chain 15 phần tử (giới hạn giao diện) rộng hơn 360px: khung phải tự cuộn ngang', () => {
  const keys = Array.from({ length: 15 }, (_, k) => 3 + 7 * k)
  const result = layout.computeHashTableLayout(buildHashTable(7, keys))

  assert.equal(result.width, 44 + 40 + 15 * 56 + 8)
  assert.ok(result.width > 360)
})

test('Probing: phần tử nằm ngay trong ô của nó, không có chain', () => {
  const result = layout.computeHashTableLayout(buildHashTable(7, SAMPLE_KEYS, 'probing'))

  assert.equal(result.entries.e6.bucketIndex, 6)
  assert.equal(result.entries.e6.centerX, result.buckets[6].centerX)
  assert.equal(result.entries.e6.centerY, result.buckets[6].centerY)
  assert.equal(result.width, 44 + 40 + 8)
})

test('scrollTargetFor ưu tiên phần tử đang xét, rồi phần tử vừa chèn/tìm thấy, rồi ô đang xét', () => {
  const table = buildHashTable(7, SAMPLE_KEYS)
  const result = layout.computeHashTableLayout(table)
  const step = { currentEntryId: null, insertedEntryId: null, foundEntryId: null, currentBucket: null }

  assert.equal(layout.scrollTargetFor(result, step), null)
  assert.deepEqual(layout.scrollTargetFor(result, { ...step, currentBucket: 4 }), { x: 64, y: 216 })
  assert.deepEqual(layout.scrollTargetFor(result, { ...step, currentBucket: 1, foundEntryId: 'e3' }), { x: 232, y: 72 })
  assert.deepEqual(
    layout.scrollTargetFor(result, { ...step, currentBucket: 1, currentEntryId: 'e2', foundEntryId: 'e3' }),
    { x: 176, y: 72 },
  )
})

test('scrollTargetFor bỏ qua id không có trong layout (không ném lỗi, lùi về ô đang xét)', () => {
  const result = layout.computeHashTableLayout(buildHashTable(7, SAMPLE_KEYS))
  const step = { currentEntryId: 'e99', insertedEntryId: null, foundEntryId: null, currentBucket: 2 }

  assert.deepEqual(layout.scrollTargetFor(result, step), { x: 64, y: 120 })
})
