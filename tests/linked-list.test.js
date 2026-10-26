import test from 'node:test'
import assert from 'node:assert/strict'
import { LinkedList } from '../src/structures/linkedList.js'

test('khởi tạo danh sách liên kết', () => {
  const list = new LinkedList([10, 20, 30])

  assert.deepEqual(list.toArray(), [10, 20, 30])
  assert.equal(list.getSize(), 3)
  assert.equal(list.isEmpty(), false)
})

test('khởi tạo danh sách rỗng', () => {
  const list = new LinkedList()

  assert.deepEqual(list.toArray(), [])
  assert.equal(list.getSize(), 0)
  assert.equal(list.isEmpty(), true)
})

test('thêm phần tử vào cuối danh sách', () => {
  const list = new LinkedList([10, 20])

  list.append(30)

  assert.deepEqual(list.toArray(), [10, 20, 30])
})

test('thêm phần tử vào đầu danh sách', () => {
  const list = new LinkedList([20, 30])

  list.prepend(10)

  assert.deepEqual(list.toArray(), [10, 20, 30])
})

test('chèn phần tử vào giữa danh sách', () => {
  const list = new LinkedList([10, 30])

  list.insertAt(1, 20)

  assert.deepEqual(list.toArray(), [10, 20, 30])
})

test('chèn phần tử vào vị trí đầu và cuối', () => {
  const list = new LinkedList([20])

  list.insertAt(0, 10)
  list.insertAt(2, 30)

  assert.deepEqual(list.toArray(), [10, 20, 30])
})

test('xóa phần tử ở đầu danh sách', () => {
  const list = new LinkedList([10, 20, 30])

  assert.deepEqual(list.removeAt(0), {
    removedValue: 10,
    values: [20, 30],
  })
})

test('xóa phần tử ở giữa danh sách', () => {
  const list = new LinkedList([10, 20, 30])

  assert.deepEqual(list.removeAt(1), {
    removedValue: 20,
    values: [10, 30],
  })
})

test('xóa phần tử cuối cùng', () => {
  const list = new LinkedList([10])

  assert.deepEqual(list.removeAt(0), {
    removedValue: 10,
    values: [],
  })
  assert.equal(list.isEmpty(), true)
})

test('tìm vị trí xuất hiện đầu tiên của giá trị', () => {
  const list = new LinkedList([10, 20, 10, 30])

  assert.equal(list.find(10), 0)
  assert.equal(list.find(30), 3)
  assert.equal(list.find(99), -1)
})

test('lấy giá trị theo vị trí', () => {
  const list = new LinkedList([10, 20, 30])

  assert.equal(list.getAt(1), 20)
})

test('xóa toàn bộ danh sách', () => {
  const list = new LinkedList([10, 20, 30])

  assert.deepEqual(list.clear(), [])
  assert.equal(list.getSize(), 0)
  assert.equal(list.isEmpty(), true)
})

test('từ chối giá trị không phải số hữu hạn', () => {
  const list = new LinkedList()

  assert.throws(() => list.append('abc'), TypeError)
  assert.throws(() => list.append(Number.NaN), TypeError)
  assert.throws(() => list.append(Infinity), TypeError)
})

test('từ chối vị trí không hợp lệ khi chèn', () => {
  const list = new LinkedList([10, 20])

  assert.throws(() => list.insertAt(-1, 15), RangeError)
  assert.throws(() => list.insertAt(3, 15), RangeError)
  assert.throws(() => list.insertAt(1.5, 15), RangeError)
})

test('từ chối vị trí không hợp lệ khi xóa hoặc lấy giá trị', () => {
  const list = new LinkedList([10, 20])

  assert.throws(() => list.removeAt(-1), RangeError)
  assert.throws(() => list.removeAt(2), RangeError)
  assert.throws(() => list.getAt(2), RangeError)
})

test('không cho phép khởi tạo bằng dữ liệu không phải mảng', () => {
  assert.throws(() => new LinkedList('10,20'), TypeError)
})