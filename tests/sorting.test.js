
import test from 'node:test'
import assert from 'node:assert/strict'

import { generateBubbleSortSteps, bubbleSortPseudocode } from '../src/algorithms/bubbleSort.js'
import { generateSelectionSortSteps, selectionSortPseudocode } from '../src/algorithms/selectionSort.js'
import { generateInsertionSortSteps, insertionSortPseudocode } from '../src/algorithms/insertionSort.js'

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
// Vùng đã sắp xếp chỉ được mở rộng: mất chỉ số ở bước giữa làm cột xanh nhấp nháy trên giao diện.
const sortedRegionInputs = [
  [50, 20, 40, 10, 30],
  [30, 20, 10],
  [5, 2, 8, 1, 3],
  [4, 2, 4, 1, 2],
  [1, 2, 3, 4, 5],
]

for (const algorithm of algorithms) {
  test(`${algorithm.name}: vùng đã sắp xếp của mỗi bước chứa vùng của bước trước`, () => {
    for (const input of sortedRegionInputs) {
      const steps = algorithm.generateSteps(input)

      for (let index = 1; index < steps.length; index++) {
        const current = new Set(steps[index].sortedIndices)
        const lost = steps[index - 1].sortedIndices.filter((sortedIndex) => !current.has(sortedIndex))

        assert.deepEqual(lost, [], `[${input}] bước ${index}: ${steps[index].message}`)
      }
    }
  })
}

// Bước so sánh nhận biết bằng cấu trúc dữ liệu: bộ đếm comparisons tăng so với bước trước.
function getComparisonSteps(steps) {
  return steps.filter((step, index) => index > 0 && step.comparisons > steps[index - 1].comparisons)
}

test('Insertion Sort: bước so sánh chỉ tô A[j] và lưu key trong dữ liệu bước', () => {
  const steps = generateInsertionSortSteps([30, 20, 10])

  // Sau lần dời đầu tiên của i = 2, cột j + 1 chứa bản sao 30 chứ không phải key 10.
  assert.deepEqual(
    getComparisonSteps(steps).map(({ comparing, key }) => ({ comparing, key })),
    [
      { comparing: [0], key: 20 },
      { comparing: [1], key: 10 },
      { comparing: [0], key: 10 },
    ],
  )
})

test('Insertion Sort: key là null ở bước đầu và bước hoàn thành', () => {
  const steps = generateInsertionSortSteps([30, 20, 10])

  assert.equal(steps[0].key, null)
  assert.equal(steps.at(-1).key, null)
})

// --- Ánh xạ bước → dòng mã giả ---
// Loại bước được nhận biết bằng bộ đếm (comparisons/swaps/shifts) chứ không đọc message.

const pseudocodeCases = [
  { name: 'Bubble Sort', generateSteps: generateBubbleSortSteps, lines: bubbleSortPseudocode },
  { name: 'Selection Sort', generateSteps: generateSelectionSortSteps, lines: selectionSortPseudocode },
  { name: 'Insertion Sort', generateSteps: generateInsertionSortSteps, lines: insertionSortPseudocode },
]

const pseudocodeInputs = [[], [7], [50, 20, 40, 10, 30], [30, 20, 10], [10, 20, 30], [4, 2, 4, 1, 2]]

function getLineText(lines, step) {
  return lines[step.pseudocodeLine - 1]?.trim()
}

function increased(steps, index, field) {
  return index > 0 && (steps[index][field] ?? 0) > (steps[index - 1][field] ?? 0)
}

for (const { name, generateSteps, lines } of pseudocodeCases) {
  test(`${name}: pseudocodeLine là null ở bước đầu, bước cuối và nằm trong mã giả ở các bước còn lại`, () => {
    for (const input of pseudocodeInputs) {
      const steps = generateSteps(input)

      assert.equal(steps[0].pseudocodeLine, null)
      assert.equal(steps.at(-1).pseudocodeLine, null)

      steps.slice(1, -1).forEach((step) => {
        assert.ok(
          Number.isInteger(step.pseudocodeLine) &&
            step.pseudocodeLine >= 1 &&
            step.pseudocodeLine <= lines.length,
          `[${input}] ${step.message}: ${step.pseudocodeLine}`,
        )
      })
    }
  })
}

test('Bubble Sort: bước so sánh, đổi chỗ, kết thúc lượt trỏ đúng dòng mã giả', () => {
  for (const input of pseudocodeInputs) {
    const steps = generateBubbleSortSteps(input)

    steps.slice(1, -1).forEach((step, offset) => {
      const index = offset + 1
      const text = getLineText(bubbleSortPseudocode, step)

      if (increased(steps, index, 'comparisons')) {
        assert.equal(text, 'if A[j] > A[j + 1]')
      } else if (increased(steps, index, 'swaps')) {
        assert.equal(text, 'swap(A[j], A[j + 1])')
      } else {
        assert.ok(['if swapped == false', 'break'].includes(text), text)
      }
    })
  }
})

test('Bubble Sort: lượt không đổi chỗ trỏ dòng break và báo dừng sớm', () => {
  const steps = generateBubbleSortSteps([10, 20, 30, 40])
  const breakSteps = steps.filter((step) => getLineText(bubbleSortPseudocode, step) === 'break')

  assert.equal(breakSteps.length, 1)
  assert.equal(breakSteps[0].comparisons, 3)
  assert.match(breakSteps[0].message, /dừng sớm/)

  // Lượt có đổi chỗ chỉ dừng ở dòng kiểm tra cờ, không trỏ break.
  const swappedPassEnd = generateBubbleSortSteps([20, 10]).find(
    (step) => getLineText(bubbleSortPseudocode, step) === 'if swapped == false',
  )

  assert.ok(swappedPassEnd)
  assert.doesNotMatch(swappedPassEnd.message, /dừng sớm/)
})

test('Selection Sort: bước so sánh, cập nhật min, đổi chỗ trỏ đúng dòng mã giả', () => {
  for (const input of pseudocodeInputs) {
    const steps = generateSelectionSortSteps(input)

    steps.slice(1, -1).forEach((step, offset) => {
      const index = offset + 1
      const text = getLineText(selectionSortPseudocode, step)

      if (increased(steps, index, 'comparisons')) {
        assert.equal(text, 'if A[j] < A[minIndex]')
      } else if (increased(steps, index, 'swaps')) {
        assert.equal(text, 'swap(A[i], A[minIndex])')
      } else if (step.comparing.length > 0) {
        assert.equal(text, 'minIndex = j')
      } else {
        // Bước chốt vị trí i: dòng 6 nếu không đổi chỗ, dòng 7 nếu bước trước vừa đổi chỗ.
        const previousWasSwap = increased(steps, index - 1, 'swaps')
        assert.equal(text, previousWasSwap ? 'swap(A[i], A[minIndex])' : 'if minIndex != i')
      }
    })
  }
})

test('Insertion Sort: bước so sánh, dời, chèn trỏ đúng dòng mã giả', () => {
  for (const input of pseudocodeInputs) {
    const steps = generateInsertionSortSteps(input)

    steps.slice(1, -1).forEach((step, offset) => {
      const index = offset + 1
      const text = getLineText(insertionSortPseudocode, step)

      if (increased(steps, index, 'comparisons')) {
        assert.equal(text, 'while j >= 0 and A[j] > key')
      } else if (increased(steps, index, 'shifts')) {
        assert.equal(text, 'A[j + 1] = A[j]')
      } else {
        assert.equal(text, 'A[j + 1] = key')
      }
    })
  }
})
