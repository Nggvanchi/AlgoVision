import test from 'node:test'
import assert from 'node:assert/strict'
import * as hashTable from '../src/structures/hashTable.js'
import { deepFreeze } from './helpers/deep-freeze.js'

const bucketKeys = (table) => table.buckets.map((bucket) => bucket.map((entry) => entry.key))

test('hashIndex = key mod m, khóa âm vẫn rơi vào 0..m-1', () => {
  assert.equal(hashTable.hashIndex(15, 7), 1)
  assert.equal(hashTable.hashIndex(30, 7), 2)
  assert.equal(hashTable.hashIndex(0, 7), 0)
  assert.equal(hashTable.hashIndex(-1, 7), 6)
  assert.equal(hashTable.hashIndex(-14, 7), 0)
  assert.equal(hashTable.hashIndex(42, 1), 0)
})

test('khóa không phải số nguyên hoặc m không hợp lệ bị từ chối', () => {
  assert.throws(() => hashTable.hashIndex(1.5, 7), TypeError)
  assert.throws(() => hashTable.hashIndex('3', 7), TypeError)
  assert.throws(() => hashTable.createHashTable(0), RangeError)
  assert.throws(() => hashTable.createHashTable(2.5), RangeError)
  assert.throws(() => hashTable.createHashTable(7, 'cuckoo'), RangeError)
})

test('createHashTable tạo bảng chaining rỗng với m ô độc lập', () => {
  const table = hashTable.createHashTable(5)

  assert.equal(table.strategy, 'chaining')
  assert.equal(table.capacity, 5)
  assert.deepEqual(table.buckets, [[], [], [], [], []])
  assert.equal(table.nextId, 1)
  assert.notEqual(table.buckets[0], table.buckets[1])
  assert.equal(hashTable.countEntries(table), 0)
  assert.equal(hashTable.loadFactor(table), 0)
})

test('insertKey nối khóa vào cuối chain, id ổn định e1, e2, … và không dùng lại', () => {
  let table = hashTable.createHashTable(7)
  const first = hashTable.insertKey(table, 15)
  table = first.table
  const second = hashTable.insertKey(table, 8)
  table = second.table

  assert.equal(first.inserted, true)
  assert.equal(first.id, 'e1')
  assert.equal(second.id, 'e2')
  assert.deepEqual(table.buckets[1], [{ id: 'e1', key: 15 }, { id: 'e2', key: 8 }])

  table = hashTable.removeEntry(table, 'e1')
  const third = hashTable.insertKey(table, 22)
  assert.equal(third.id, 'e3', 'id đã xóa không được cấp lại')
})

test('insertKey với khóa trùng trả inserted = false và giữ nguyên bảng', () => {
  const table = hashTable.buildHashTable(7, [15, 8])
  const result = hashTable.insertKey(table, 8)

  assert.equal(result.inserted, false)
  assert.equal(result.id, 'e2')
  assert.equal(result.table, table)
})

test('bảng mẫu m=7 (15, 8, 22, 3, 11, 30) phân bố đúng như dò tay', () => {
  const table = hashTable.buildHashTable(7, [15, 8, 22, 3, 11, 30])

  assert.deepEqual(bucketKeys(table), [[], [15, 8, 22], [30], [3], [11], [], []])
  assert.equal(hashTable.countEntries(table), 6)
  assert.equal(hashTable.loadFactor(table), 6 / 7)
})

test('containsKey và hasEntry chỉ đọc bảng', () => {
  const table = deepFreeze(hashTable.buildHashTable(7, [15, 8, 22]))

  assert.equal(hashTable.containsKey(table, 22), true)
  assert.equal(hashTable.containsKey(table, 29), false)
  assert.equal(hashTable.hasEntry(table, 'e3'), true)
  assert.equal(hashTable.hasEntry(table, 'e9'), false)
  assert.deepEqual(hashTable.findEntry(table, 8), { bucketIndex: 1, position: 1, id: 'e2' })
  assert.equal(hashTable.findEntry(table, 29), null)
})

test('insertKey và removeEntry không sửa bảng đầu vào (snapshot độc lập)', () => {
  const original = deepFreeze(hashTable.buildHashTable(7, [15, 8, 22, 30]))

  const { table: inserted } = hashTable.insertKey(original, 1)
  const removed = hashTable.removeEntry(original, 'e2')

  assert.deepEqual(bucketKeys(original), [[], [15, 8, 22], [30], [], [], [], []])
  assert.deepEqual(bucketKeys(inserted), [[], [15, 8, 22, 1], [30], [], [], [], []])
  assert.deepEqual(bucketKeys(removed), [[], [15, 22], [30], [], [], [], []])
  assert.notEqual(inserted.buckets[2], original.buckets[2], 'ô không đổi cũng được sao chép')
  assert.notEqual(inserted.buckets[1][0], original.buckets[1][0], 'phần tử được sao chép')
})

test('removeEntry với id không tồn tại báo lỗi thay vì lặng lẽ bỏ qua', () => {
  const table = hashTable.buildHashTable(7, [15])
  assert.throws(() => hashTable.removeEntry(table, 'e9'), RangeError)
})

test('tầng structures không giới hạn quy mô: 1000 khóa cùng ô', () => {
  const keys = Array.from({ length: 1000 }, (_, k) => k * 7)
  const table = hashTable.buildHashTable(7, keys)

  assert.equal(table.buckets[0].length, 1000)
  assert.equal(hashTable.countEntries(table), 1000)
  assert.deepEqual(hashTable.toKeys(table), keys)
  assert.equal(hashTable.containsKey(table, 6993), true)
  assert.equal(hashTable.containsKey(table, 7000), false)
})
