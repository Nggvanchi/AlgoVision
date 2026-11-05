import test from 'node:test'
import assert from 'node:assert/strict'

import { getBarStateClasses } from '../src/sorting-bar-state.js'

// Bước tối thiểu: chỉ ba trường mà hàm đọc.
function step({ comparing = [], swapped = [], sortedIndices = [] }) {
  return { comparing, swapped, sortedIndices }
}

test('getBarStateClasses: cột không thuộc trường nào không có lớp trạng thái', () => {
  assert.deepEqual(getBarStateClasses(step({ comparing: [1], swapped: [2], sortedIndices: [3] }), 0), [])
})

test('getBarStateClasses: từng trạng thái đơn lẻ', () => {
  assert.deepEqual(getBarStateClasses(step({ comparing: [1] }), 1), ['is-comparing'])
  assert.deepEqual(getBarStateClasses(step({ swapped: [2] }), 2), ['is-swapped'])
  assert.deepEqual(getBarStateClasses(step({ sortedIndices: [3] }), 3), ['is-sorted'])
})

test('getBarStateClasses: cột so sánh nằm trong đoạn đã sắp xếp (Insertion) chỉ có is-comparing', () => {
  assert.deepEqual(getBarStateClasses(step({ comparing: [0], sortedIndices: [0] }), 0), ['is-comparing'])
})

test('getBarStateClasses: cột vừa so sánh vừa đổi chỗ có cả hai lớp (CSS cho is-swapped thắng), không có is-sorted', () => {
  assert.deepEqual(
    getBarStateClasses(step({ comparing: [4], swapped: [4], sortedIndices: [4] }), 4),
    ['is-comparing', 'is-swapped'],
  )
})
