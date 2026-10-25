
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getArrayElement,
  appendArrayElement,
  insertArrayElement,
  removeArrayElement,
  findArrayElement,
} from '../src/structures/array.js'

test('truy cập phần tử theo index', () => {
  assert.equal(getArrayElement([10, 20, 30], 1), 20)
})

test('thêm phần tử vào cuối mảng', () => {
  const original = [10, 20]
  const result = appendArrayElement(original, 30)

  assert.deepEqual(result, [10, 20, 30])
  assert.deepEqual(original, [10, 20])
  assert.notEqual(result, original)
})

test('chèn phần tử vào đầu mảng', () => {
  assert.deepEqual(
    insertArrayElement([20, 30], 0, 10),
    [10, 20, 30],
  )
})

test('chèn phần tử vào giữa mảng', () => {
  assert.deepEqual(
    insertArrayElement([10, 30], 1, 20),
    [10, 20, 30],
  )
})

test('chèn phần tử vào cuối mảng bằng index length', () => {
  assert.deepEqual(
    insertArrayElement([10, 20], 2, 30),
    [10, 20, 30],
  )
})

test('chèn phần tử vào mảng rỗng', () => {
  assert.deepEqual(insertArrayElement([], 0, 10), [10])
})

test('xóa phần tử và trả về giá trị đã xóa', () => {
  const result = removeArrayElement([10, 20, 30], 1)

  assert.deepEqual(result, {
    numbers: [10, 30],
    removedValue: 20,
  })
})

test('xóa phần tử duy nhất trong mảng', () => {
  assert.deepEqual(removeArrayElement([10], 0), {
    numbers: [],
    removedValue: 10,
  })
})

test('tìm vị trí xuất hiện đầu tiên của phần tử trùng lặp', () => {
  assert.equal(findArrayElement([10, 20, 10], 10), 0)
})

test('trả về -1 khi không tìm thấy giá trị', () => {
  assert.equal(findArrayElement([10, 20, 30], 99), -1)
})

test('từ chối index âm', () => {
  assert.throws(
    () => getArrayElement([10, 20], -1),
    RangeError,
  )
})

test('từ chối index lớn hơn phạm vi khi truy cập', () => {
  assert.throws(
    () => getArrayElement([10, 20], 2),
    RangeError,
  )
})

test('từ chối index không nguyên', () => {
  assert.throws(
    () => insertArrayElement([10, 20], 1.5, 30),
    TypeError,
  )
})

test('từ chối giá trị không phải số hữu hạn', () => {
  assert.throws(
    () => appendArrayElement([10], Infinity),
    TypeError,
  )
})

test('từ chối dữ liệu đầu vào không phải mảng', () => {
  assert.throws(
    () => appendArrayElement('10,20', 30),
    TypeError,
  )
})
