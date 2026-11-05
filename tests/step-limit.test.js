import test from 'node:test'
import assert from 'node:assert/strict'
import * as stepLimit from '../src/algorithms/stepLimit.js'

const stepsOf = (count) => Array.from({ length: count }, (_, index) => ({ index }))

test('assertWithinStepLimit: không ném khi số bước chưa vượt giới hạn, kể cả đúng bằng giới hạn', () => {
  assert.doesNotThrow(() => stepLimit.assertWithinStepLimit([], 0, 'DFS'))
  assert.doesNotThrow(() => stepLimit.assertWithinStepLimit(stepsOf(37), 38, 'DFS'))
  assert.doesNotThrow(() => stepLimit.assertWithinStepLimit(stepsOf(38), 38, 'DFS'))
})

test('assertWithinStepLimit: vượt giới hạn 1 bước thì ném RangeError nêu thao tác, số bước và giới hạn', () => {
  assert.throws(
    () => stepLimit.assertWithinStepLimit(stepsOf(39), 38, 'DFS'),
    (error) => error instanceof RangeError
      && error.message.startsWith('DFS: ')
      && error.message.includes('39 bước')
      && error.message.includes('giới hạn 38'),
  )
  assert.throws(() => stepLimit.assertWithinStepLimit(stepsOf(1), 0, 'Binary Search'), /^RangeError: Binary Search: /)
})

test('assertWithinStepLimit: giới hạn không phải số nguyên không âm thì ném TypeError (tránh chốt bị tắt âm thầm)', () => {
  // NaN làm phép so steps.length > limit luôn sai: chốt sẽ không bao giờ ném nếu không kiểm.
  for (const limit of [Number.NaN, undefined, null, -1, 2.5, '10', Infinity]) {
    assert.throws(() => stepLimit.assertWithinStepLimit([], limit, 'BFS'), TypeError, `limit = ${String(limit)}`)
  }
})
