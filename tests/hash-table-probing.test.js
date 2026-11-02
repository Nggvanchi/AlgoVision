import test from 'node:test'
import assert from 'node:assert/strict'
import * as hashTable from '../src/structures/hashTable.js'

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(deepFreeze)
  }
  return value
}

// Mô tả gọn từng ô: số = khóa, '·' = trống, 'DEL' = tombstone.
const cellsOf = (table) => table.cells.map((cell) => {
  if (cell.kind === 'occupied') return cell.key
  return cell.kind === 'tombstone' ? 'DEL' : '·'
})

const build = (capacity, keys) => hashTable.buildHashTable(capacity, keys, 'probing')

function deleteKey(table, key) {
  return hashTable.removeEntry(table, hashTable.findEntry(table, key).id)
}

test('createHashTable probing: m ô trống độc lập', () => {
  const table = hashTable.createHashTable(5, 'probing')

  assert.equal(table.strategy, 'probing')
  assert.deepEqual(cellsOf(table), ['·', '·', '·', '·', '·'])
  assert.notEqual(table.cells[0], table.cells[1])
  assert.equal(hashTable.countEntries(table), 0)
  assert.equal(hashTable.countTombstones(table), 0)
})

test('Bảng mẫu m = 7 (15, 8, 22, 3, 11, 30) bằng probing: ô 1..6 = 15, 8, 22, 3, 11, 30, ô 0 trống', () => {
  const table = build(7, [15, 8, 22, 3, 11, 30])

  assert.deepEqual(cellsOf(table), ['·', 15, 8, 22, 3, 11, 30])
  assert.deepEqual(hashTable.findEntry(table, 30), { bucketIndex: 6, position: 0, id: 'e6' })
  assert.equal(hashTable.containsKey(table, 9), false)
  assert.equal(hashTable.loadFactor(table), 6 / 7)
})

test('removeEntry trong probing để lại tombstone (không giữ id), tìm khóa phía sau vẫn thấy', () => {
  const table = deleteKey(build(7, [3, 10, 17]), 10)

  assert.deepEqual(cellsOf(table), ['·', '·', '·', 3, 'DEL', 17, '·'])
  assert.deepEqual(table.cells[4], { kind: 'tombstone' })
  assert.equal(hashTable.containsKey(table, 17), true, 'tombstone không được chặn chuỗi dò')
  assert.equal(hashTable.containsKey(table, 10), false)
  assert.equal(hashTable.countEntries(table), 2)
  assert.equal(hashTable.countTombstones(table), 1)
  assert.equal(hashTable.hasEntry(table, 'e2'), false)
})

test('insertKey probing kiểm trùng qua tombstone trước khi dùng lại ô tombstone đầu tiên', () => {
  const table = deleteKey(build(7, [3, 10, 17]), 10)

  const duplicate = hashTable.insertKey(table, 17)
  assert.equal(duplicate.inserted, false)
  assert.equal(duplicate.full, false)
  assert.equal(duplicate.table, table)

  const reused = hashTable.insertKey(table, 24)
  assert.equal(reused.inserted, true)
  assert.deepEqual(cellsOf(reused.table), ['·', '·', '·', 3, 24, 17, '·'])
  assert.equal(hashTable.countTombstones(reused.table), 0)
})

test('Bảng đầy khóa (m = 3): khóa mới báo full, khóa trùng vẫn báo trùng chứ không báo full', () => {
  const table = build(3, [0, 1, 2])

  const full = hashTable.insertKey(table, 3)
  assert.equal(full.inserted, false)
  assert.equal(full.full, true)
  assert.equal(full.id, null)

  const duplicate = hashTable.insertKey(table, 2)
  assert.equal(duplicate.full, false)
  assert.equal(duplicate.id, 'e3')
  assert.equal(hashTable.containsKey(table, 5), false, 'dừng sau đúng m lần dò')
})

test('Bảng toàn tombstone (m = 3): tìm dừng sau m ô, chèn dùng tombstone đầu tiên trên chuỗi dò', () => {
  let table = build(3, [0, 1, 2])
  for (const key of [0, 1, 2]) table = deleteKey(table, key)

  assert.deepEqual(cellsOf(table), ['DEL', 'DEL', 'DEL'])
  assert.equal(hashTable.countEntries(table), 0)
  assert.equal(hashTable.containsKey(table, 5), false)

  const { table: next, inserted } = hashTable.insertKey(table, 5)
  assert.equal(inserted, true)
  assert.deepEqual(cellsOf(next), ['DEL', 'DEL', 5])
})

test('m = 1: một ô, chèn, đầy, trùng, xóa thành tombstone rồi dùng lại', () => {
  let table = build(1, [4])
  assert.deepEqual(cellsOf(table), [4])
  assert.equal(hashTable.insertKey(table, 9).full, true)
  assert.equal(hashTable.insertKey(table, 4).full, false)

  table = deleteKey(table, 4)
  assert.deepEqual(cellsOf(table), ['DEL'])
  assert.equal(hashTable.containsKey(table, 4), false)

  table = hashTable.insertKey(table, 9).table
  assert.deepEqual(cellsOf(table), [9])
})

test('insertKey và removeEntry probing không sửa bảng đầu vào', () => {
  const original = deepFreeze(build(7, [3, 10, 17]))

  const inserted = hashTable.insertKey(original, 24).table
  const removed = deleteKey(original, 10)

  assert.deepEqual(cellsOf(original), ['·', '·', '·', 3, 10, 17, '·'])
  assert.deepEqual(cellsOf(inserted), ['·', '·', '·', 3, 10, 17, 24])
  assert.deepEqual(cellsOf(removed), ['·', '·', '·', 3, 'DEL', 17, '·'])
  assert.notEqual(inserted.cells[0], original.cells[0], 'ô được sao chép')
})

test('Probing quy mô lớn: m = 1000, 999 khóa cùng hash chiếm ô 0..998', () => {
  const keys = Array.from({ length: 999 }, (_, k) => 1000 * k)
  const table = build(1000, keys)

  assert.equal(hashTable.countEntries(table), 999)
  assert.equal(table.cells[998].key, 998000)
  assert.equal(table.cells[999].kind, 'empty')
  assert.deepEqual(hashTable.toKeys(table), keys)
  assert.equal(hashTable.containsKey(table, 999000), false)
})
