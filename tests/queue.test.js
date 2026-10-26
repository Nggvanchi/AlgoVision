
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  enqueueQueue,
  dequeueQueue,
  frontQueue,
  isQueueEmpty,
} from '../src/structures/queue.js'

test('Enqueue thêm phần tử vào cuối Queue', () => {
  assert.deepEqual(
    enqueueQueue([10, 20], 30),
    [10, 20, 30],
  )
})

test('Enqueue không thay đổi Queue ban đầu', () => {
  const queue = [10, 20]

  enqueueQueue(queue, 30)

  assert.deepEqual(queue, [10, 20])
})

test('Dequeue lấy phần tử đầu tiên và trả về Queue mới', () => {
  const result = dequeueQueue([10, 20, 30])

  assert.deepEqual(result.queue, [20, 30])
  assert.equal(result.dequeuedValue, 10)
})

test('Dequeue không thay đổi Queue ban đầu', () => {
  const queue = [10, 20, 30]

  dequeueQueue(queue)

  assert.deepEqual(queue, [10, 20, 30])
})

test('Dequeue báo lỗi khi Queue rỗng', () => {
  assert.throws(
    () => dequeueQueue([]),
    RangeError,
  )
})

test('Front trả về phần tử đầu tiên mà không xóa', () => {
  const queue = [10, 20, 30]

  assert.equal(frontQueue(queue), 10)
  assert.deepEqual(queue, [10, 20, 30])
})

test('Front báo lỗi khi Queue rỗng', () => {
  assert.throws(
    () => frontQueue([]),
    RangeError,
  )
})

test('Nhận biết Queue rỗng', () => {
  assert.equal(isQueueEmpty([]), true)
  assert.equal(isQueueEmpty([10]), false)
})

test('Từ chối dữ liệu Queue không phải mảng', () => {
  assert.throws(
    () => enqueueQueue('10,20', 30),
    TypeError,
  )
})

test('Từ chối phần tử không phải số hữu hạn', () => {
  assert.throws(
    () => enqueueQueue([10], Infinity),
    TypeError,
  )
})

test('Từ chối Queue có phần tử không hợp lệ', () => {
  assert.throws(
    () => dequeueQueue([10, Infinity]),
    TypeError,
  )
})

test('Enqueue hoạt động với Queue rỗng', () => {
  assert.deepEqual(enqueueQueue([], 10), [10])
})

test('Dequeue phần tử cuối cùng tạo Queue rỗng', () => {
  const result = dequeueQueue([10])

  assert.deepEqual(result.queue, [])
  assert.equal(result.dequeuedValue, 10)
})
