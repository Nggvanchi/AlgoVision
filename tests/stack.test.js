
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  pushStackElement,
  popStackElement,
  peekStackElement,
  isStackEmpty,
} from '../src/structures/stack.js'

test('Push thêm phần tử lên đỉnh Stack', () => {
  assert.deepEqual(
    pushStackElement([10, 20], 30),
    [10, 20, 30],
  )
})

test('Push không thay đổi Stack ban đầu', () => {
  const stack = [10, 20]

  pushStackElement(stack, 30)

  assert.deepEqual(stack, [10, 20])
})

test('Pop lấy phần tử trên đỉnh và trả về Stack mới', () => {
  const result = popStackElement([10, 20, 30])

  assert.deepEqual(result.stack, [10, 20])
  assert.equal(result.poppedValue, 30)
})

test('Pop không hoạt động khi Stack rỗng', () => {
  assert.throws(
    () => popStackElement([]),
    RangeError,
  )
})

test('Peek đọc phần tử trên đỉnh mà không xóa', () => {
  const stack = [10, 20, 30]

  assert.equal(peekStackElement(stack), 30)
  assert.deepEqual(stack, [10, 20, 30])
})

test('Peek báo lỗi khi Stack rỗng', () => {
  assert.throws(
    () => peekStackElement([]),
    RangeError,
  )
})

test('Nhận biết Stack rỗng', () => {
  assert.equal(isStackEmpty([]), true)
  assert.equal(isStackEmpty([10]), false)
})

test('Từ chối dữ liệu Stack không phải mảng', () => {
  assert.throws(
    () => pushStackElement('10,20', 30),
    TypeError,
  )
})

test('Từ chối giá trị không hữu hạn', () => {
  assert.throws(
    () => pushStackElement([10], Infinity),
    TypeError,
  )
})
