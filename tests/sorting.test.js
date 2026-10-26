
import test from 'node:test'
import assert from 'node:assert/strict'

import { generateBubbleSortSteps } from '../src/algorithms/bubbleSort.js'
import { generateSelectionSortSteps } from '../src/algorithms/selectionSort.js'
import { generateInsertionSortSteps } from '../src/algorithms/insertionSort.js'

const algorithms = [
  {
    name: 'Bubble Sort',
    generateSteps: generateBubbleSortSteps,
  },
  {
    name: 'Selection Sort',
    generateSteps: generateSelectionSortSteps,
  },
  {
    name: 'Insertion Sort',
    generateSteps: generateInsertionSortSteps,
  },
]

const testCases = [
  {
    name: 'mảng ngẫu nhiên',
    input: [5, 2, 8, 1, 3],
    expected: [1, 2, 3, 5, 8],
  },
  {
    name: 'mảng đã sắp xếp',
    input: [1, 2, 3, 4, 5],
    expected: [1, 2, 3, 4, 5],
  },
  {
    name: 'mảng đảo ngược',
    input: [5, 4, 3, 2, 1],
    expected: [1, 2, 3, 4, 5],
  },
  {
    name: 'mảng có phần tử trùng lặp',
    input: [4, 2, 4, 1, 2],
    expected: [1, 2, 2, 4, 4],
  },
  {
    name: 'mảng rỗng',
    input: [],
    expected: [],
  },
  {
    name: 'mảng chỉ có một phần tử',
    input: [7],
    expected: [7],
  },
]

for (const algorithm of algorithms) {
  for (const testCase of testCases) {
    test(`${algorithm.name}: ${testCase.name}`, () => {
      const originalInput = [...testCase.input]
      const steps = algorithm.generateSteps(testCase.input)

      assert.ok(steps.length > 0, 'Phải có ít nhất một bước')

      const finalStep = steps[steps.length - 1]

      assert.deepEqual(
        finalStep.array,
        testCase.expected,
        'Mảng kết quả không đúng',
      )

      assert.equal(
        finalStep.finished,
        true,
        'Bước cuối phải đánh dấu hoàn thành',
      )

      assert.deepEqual(
        testCase.input,
        originalInput,
        'Thuật toán không được thay đổi mảng đầu vào',
      )

      assert.ok(
        Number.isInteger(finalStep.comparisons) &&
          finalStep.comparisons >= 0,
        'Số phép so sánh phải là số nguyên không âm',
      )

      assert.ok(
        Number.isInteger(finalStep.swaps) &&
          finalStep.swaps >= 0,
        'Số lần đổi chỗ phải là số nguyên không âm',
      )

      if (algorithm.name === 'Insertion Sort') {
        assert.ok(
          Number.isInteger(finalStep.shifts) &&
            finalStep.shifts >= 0,
          'Số lần dịch chuyển phải là số nguyên không âm',
        )
      }
    })
  }
}

test('Bubble Sort: đếm chính xác comparisons và swaps', () => {
  const steps = generateBubbleSortSteps([3, 2, 1])
  const finalStep = steps[steps.length - 1]

  assert.equal(finalStep.comparisons, 3)
  assert.equal(finalStep.swaps, 3)
})

test('Selection Sort: đếm chính xác comparisons và swaps', () => {
  const steps = generateSelectionSortSteps([3, 2, 1])
  const finalStep = steps[steps.length - 1]

  assert.equal(finalStep.comparisons, 3)
  assert.equal(finalStep.swaps, 1)
})

test('Insertion Sort: đếm chính xác comparisons và shifts', () => {
  const steps = generateInsertionSortSteps([3, 2, 1])
  const finalStep = steps[steps.length - 1]

  assert.equal(finalStep.comparisons, 3)
  assert.equal(finalStep.shifts, 3)
})

test('Insertion Sort: giữ nguyên mảng khi chỉ có một phần tử', () => {
  const input = [7]
  const steps = generateInsertionSortSteps(input)

  assert.deepEqual(input, [7])
  assert.deepEqual(steps[steps.length - 1].array, [7])
})

test('Insertion Sort: mọi bước đều có mảng và bộ đếm hợp lệ', () => {
  const steps = generateInsertionSortSteps([4, 2, 3, 1])

  for (const step of steps) {
    assert.ok(Array.isArray(step.array))
    assert.ok(Array.isArray(step.comparing))
    assert.ok(Array.isArray(step.swapped))
    assert.ok(Array.isArray(step.sortedIndices))

    assert.ok(Number.isInteger(step.comparisons))
    assert.ok(Number.isInteger(step.swaps))
    assert.ok(Number.isInteger(step.shifts))

    assert.ok(step.comparisons >= 0)
    assert.ok(step.swaps >= 0)
    assert.ok(step.shifts >= 0)
  }
})

test('Insertion Sort: bước cuối đánh dấu toàn bộ phần tử đã sắp xếp', () => {
  const steps = generateInsertionSortSteps([4, 2, 3, 1])
  const finalStep = steps[steps.length - 1]

  assert.deepEqual(finalStep.array, [1, 2, 3, 4])
  assert.deepEqual(finalStep.sortedIndices, [0, 1, 2, 3])
  assert.equal(finalStep.finished, true)
})

test('Insertion Sort: thông báo đúng khi mảng rỗng', () => {
  const steps = generateInsertionSortSteps([])
  const finalStep = steps[steps.length - 1]

  assert.deepEqual(finalStep.array, [])
  assert.deepEqual(finalStep.sortedIndices, [])
  assert.equal(finalStep.finished, true)
  assert.equal(
    finalStep.message,
    'Mảng rỗng, không có phần tử cần sắp xếp.',
  )
})

test('Insertion Sort: thông báo đúng khi mảng có một phần tử', () => {
  const steps = generateInsertionSortSteps([7])
  const finalStep = steps[steps.length - 1]

  assert.deepEqual(finalStep.array, [7])
  assert.deepEqual(finalStep.sortedIndices, [0])
  assert.equal(finalStep.finished, true)
  assert.equal(
    finalStep.message,
    'Mảng chỉ có một phần tử nên đã được sắp xếp.',
  )
})

for (const algorithm of [
  {
    name: 'Bubble Sort',
    generateSteps: generateBubbleSortSteps,
  },
  {
    name: 'Selection Sort',
    generateSteps: generateSelectionSortSteps,
  },
]) {
  test(`${algorithm.name}: thông báo đúng khi mảng rỗng`, () => {
    const steps = algorithm.generateSteps([])
    const finalStep = steps[steps.length - 1]

    assert.deepEqual(finalStep.array, [])
    assert.deepEqual(finalStep.sortedIndices, [])
    assert.equal(finalStep.finished, true)
    assert.equal(
      finalStep.message,
      'Mảng rỗng, không có phần tử cần sắp xếp.',
    )
  })

  test(`${algorithm.name}: thông báo đúng khi mảng có một phần tử`, () => {
    const steps = algorithm.generateSteps([7])
    const finalStep = steps[steps.length - 1]

    assert.deepEqual(finalStep.array, [7])
    assert.deepEqual(finalStep.sortedIndices, [0])
    assert.equal(finalStep.finished, true)
    assert.equal(
      finalStep.message,
      'Mảng chỉ có một phần tử nên đã được sắp xếp.',
    )
  })
}