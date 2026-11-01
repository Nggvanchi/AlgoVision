import test from 'node:test'
import assert from 'node:assert/strict'

// Namespace import: thiếu một export chỉ ra undefined và làm đỏ đúng test liên quan,
// thay vì làm cả file không nạp được.
import * as linearSearchModule from '../src/algorithms/linearSearch.js'
import * as binarySearchModule from '../src/algorithms/binarySearch.js'

const { generateLinearSearchSteps, linearSearchPseudocode } = linearSearchModule
const { generateBinarySearchSteps, binarySearchPseudocode } = binarySearchModule

// Tập dữ liệu nhỏ nhưng đủ phủ: rỗng, 1 phần tử, chẵn/lẻ, có trùng lặp.
const arrays = [
  [],
  [42],
  [10, 20],
  [10, 20, 30],
  [10, 20, 20, 20, 50],
  [10, 20, 30, 40, 50, 60, 70, 80, 90],
  [5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 100, 100],
]

function getTargets(numbers) {
  return [...new Set([...numbers, 0, 1, 33, 99, 101])]
}

test('Linear Search sinh bước: kết quả là vị trí xuất hiện đầu tiên', () => {
  for (const numbers of arrays) {
    for (const target of getTargets(numbers)) {
      const steps = generateLinearSearchSteps(numbers, target)
      const lastStep = steps.at(-1)
      const expectedIndex = numbers.indexOf(target)

      assert.equal(lastStep.finished, true)
      assert.equal(lastStep.foundIndex, expectedIndex, `${numbers} / ${target}`)
      assert.equal(
        lastStep.comparisons,
        expectedIndex === -1 ? numbers.length : expectedIndex + 1,
      )
      assert.equal(steps.filter((step) => step.finished).length, 1)
    }
  }
})

test('Binary Search sinh bước: tìm đúng giá trị và không quá floor(log2 n) + 1 phép so sánh', () => {
  for (const numbers of arrays) {
    for (const target of getTargets(numbers)) {
      const steps = generateBinarySearchSteps(numbers, target)
      const lastStep = steps.at(-1)
      const maxComparisons =
        numbers.length === 0 ? 0 : Math.floor(Math.log2(numbers.length)) + 1

      assert.equal(lastStep.finished, true)

      if (numbers.includes(target)) {
        assert.equal(numbers[lastStep.foundIndex], target, `${numbers} / ${target}`)
      } else {
        assert.equal(lastStep.foundIndex, -1)
      }

      assert.ok(lastStep.comparisons <= maxComparisons)
      assert.equal(steps.filter((step) => step.finished).length, 1)
    }
  }
})

// Giai đoạn 6: mỗi bước ứng với một thao tác mã giả, không còn "mỗi bước = một phép so sánh".
// Bất biến thay thế chặt hơn: biết chính xác bước nào được phép không tăng comparisons.
// Tổng số phép so sánh vẫn được kiểm tra ở hai test "sinh bước" phía trên.
test('comparisons tăng đúng 1 ở mỗi bước, trừ bước kết luận "không tìm thấy"', () => {
  for (const generate of [generateLinearSearchSteps, generateBinarySearchSteps]) {
    for (const numbers of arrays) {
      for (const target of getTargets(numbers)) {
        const steps = generate(numbers, target)
        const label = `${generate.name} [${numbers}] / ${target}`

        assert.equal(steps[0].comparisons, 0, label)

        steps.slice(1).forEach((step, offset) => {
          const increase = step.comparisons - steps[offset].comparisons
          const isNotFoundConclusion = step.finished && step.foundIndex === -1

          assert.equal(increase, isNotFoundConclusion ? 0 : 1, `${label}, bước ${offset + 1}`)
        })
      }
    }
  }
})

test('mảng rỗng: kết thúc ngay với 0 phép so sánh', () => {
  for (const generate of [generateLinearSearchSteps, generateBinarySearchSteps]) {
    const steps = generate([], 10)

    assert.equal(steps.length, 2)
    assert.equal(steps.at(-1).comparisons, 0)
    assert.equal(steps.at(-1).foundIndex, -1)
    assert.equal(steps.at(-1).message, 'Không tìm thấy 10 trong mảng.')
  }
})

test('thông báo kết quả dùng mục tiêu đã chốt khi sinh bước', () => {
  const numbers = [10, 20, 30]

  assert.equal(
    generateLinearSearchSteps(numbers, 30).at(-1).message,
    'Đã tìm thấy 30 tại vị trí 3.',
  )
  assert.equal(
    generateBinarySearchSteps(numbers, 25).at(-1).message,
    'Không tìm thấy 25 trong mảng.',
  )
})

test('sinh bước không làm thay đổi mảng đầu vào', () => {
  const numbers = [10, 20, 30]

  generateLinearSearchSteps(numbers, 20)
  generateBinarySearchSteps(numbers, 20)

  assert.deepEqual(numbers, [10, 20, 30])
})

const oneToNine = [10, 20, 30, 40, 50, 60, 70, 80, 90]

test('Linear Search: lần so sánh cuối là bước riêng, kết luận "không tìm thấy" ở bước sau', () => {
  const steps = generateLinearSearchSteps(oneToNine, 95)
  const lastComparison = steps.at(-2)
  const conclusion = steps.at(-1)

  assert.equal(steps.length, oneToNine.length + 2)
  assert.equal(lastComparison.finished, false)
  assert.equal(lastComparison.comparisons, 9)
  assert.equal(conclusion.finished, true)
  assert.equal(conclusion.foundIndex, -1)
  assert.equal(conclusion.comparisons, 9)
})

test('Binary Search: lần cập nhật phạm vi cuối là bước riêng, kết luận ở bước sau', () => {
  const steps = generateBinarySearchSteps(oneToNine, 95)
  const lastUpdate = steps.at(-2)
  const conclusion = steps.at(-1)

  // 90 < 95 nên left = mid + 1 = 9 > right = 8: phạm vi rỗng nhưng chưa kết luận.
  assert.deepEqual(
    { mid: lastUpdate.mid, left: lastUpdate.left, right: lastUpdate.right },
    { mid: 8, left: 9, right: 8 },
  )
  assert.equal(lastUpdate.finished, false)
  assert.equal(lastUpdate.comparisons, 4)
  assert.equal(conclusion.finished, true)
  assert.equal(conclusion.foundIndex, -1)
  assert.equal(conclusion.comparisons, 4)
})

test('Binary Search: mảng một phần tử không chứa mục tiêu có bước cập nhật trước kết luận', () => {
  const steps = generateBinarySearchSteps([42], 99)

  assert.equal(steps.length, 3)
  assert.deepEqual(
    { left: steps[1].left, right: steps[1].right, finished: steps[1].finished },
    { left: 1, right: 0, finished: false },
  )
  assert.equal(steps[2].finished, true)
  assert.equal(steps[2].comparisons, 1)
})

// --- D: dữ liệu bước thay cho việc đọc số trong message ---

function forEachSearchCase(run) {
  for (const generate of [generateLinearSearchSteps, generateBinarySearchSteps]) {
    for (const numbers of arrays) {
      for (const target of getTargets(numbers)) {
        run({ generate, numbers, target, steps: generate(numbers, target) })
      }
    }
  }
}

test('mọi bước tìm kiếm đều lưu target đã chốt', () => {
  forEachSearchCase(({ target, steps }) => {
    steps.forEach((step) => assert.equal(step.target, target))
  })
})

test('bước so sánh lưu currentIndex và currentValue của phần tử vừa so sánh', () => {
  forEachSearchCase(({ generate, numbers, target, steps }) => {
    steps.forEach((step, index) => {
      const label = `${generate.name} [${numbers}] / ${target}, bước ${index}`
      const isComparison = index > 0 && step.comparisons > steps[index - 1].comparisons

      if (!isComparison) {
        // Bước 0 và bước kết luận "không tìm thấy" không xét phần tử nào.
        assert.equal(step.currentIndex, null, label)
        assert.equal(step.currentValue, null, label)
        return
      }

      const expectedIndex =
        generate === generateBinarySearchSteps ? step.mid : step.comparisons - 1

      assert.equal(step.currentIndex, expectedIndex, label)
      assert.equal(step.currentValue, numbers[expectedIndex], label)
    })
  })
})

test('Linear Search: currentIndex là phần tử vừa so sánh, index giữ nghĩa con trỏ kế tiếp', () => {
  const step = generateLinearSearchSteps(oneToNine, 80)[1]

  assert.equal(step.currentIndex, 0)
  assert.equal(step.currentValue, 10)
  assert.equal(step.index, 1)
})

test('Binary Search [10..90] tìm 95: bước áp chót xét A[8] = 90', () => {
  const steps = generateBinarySearchSteps(oneToNine, 95)

  assert.equal(steps.at(-2).currentIndex, 8)
  assert.equal(steps.at(-2).currentValue, 90)
  assert.equal(steps.at(-1).currentIndex, null)
})

// --- pseudocodeLine: mỗi bước trỏ đúng một dòng mã giả ---

function getSearchLineText(lines, step) {
  return lines[step.pseudocodeLine - 1]?.trim()
}

function getExpectedSearchLine(generate, step) {
  const binary = generate === generateBinarySearchSteps

  if (step.finished && step.foundIndex === -1) return 'return -1'
  if (step.finished) return binary ? 'return mid' : 'return i'
  if (!binary) return 'if A[i] == target'

  return step.currentValue < step.target ? 'left = mid + 1' : 'right = mid - 1'
}

test('bước tìm kiếm trỏ đúng dòng mã giả theo nhánh thực tế', () => {
  forEachSearchCase(({ generate, numbers, target, steps }) => {
    const lines = generate === generateBinarySearchSteps ? binarySearchPseudocode : linearSearchPseudocode

    assert.equal(steps[0].pseudocodeLine, null)

    steps.slice(1).forEach((step, offset) => {
      assert.equal(
        getSearchLineText(lines, step),
        getExpectedSearchLine(generate, step),
        `${generate.name} [${numbers}] / ${target}, bước ${offset + 1}`,
      )
    })
  })
})

test('Binary Search [42] tìm 99: 42 < 99 nên bước so sánh trỏ dòng 7, kết luận dòng 10', () => {
  const steps = generateBinarySearchSteps([42], 99)

  assert.deepEqual(steps.map((step) => step.pseudocodeLine), [null, 7, 10])
  assert.equal(getSearchLineText(binarySearchPseudocode, steps[1]), 'left = mid + 1')
})

test('Binary Search [10..90] tìm 95: bước áp chót dòng 7, bước cuối dòng 10 và không tăng comparisons', () => {
  const steps = generateBinarySearchSteps(oneToNine, 95)

  assert.equal(steps.at(-2).pseudocodeLine, 7)
  assert.equal(steps.at(-2).currentIndex, 8)
  assert.equal(steps.at(-1).pseudocodeLine, 10)
  assert.equal(steps.at(-1).comparisons, steps.at(-2).comparisons)
})

test('Linear Search [10..90] tìm 95: lần so sánh cuối dòng 2, kết luận dòng 4', () => {
  const steps = generateLinearSearchSteps(oneToNine, 95)

  assert.equal(steps.at(-2).pseudocodeLine, 2)
  assert.equal(steps.at(-2).currentValue, 90)
  assert.equal(steps.at(-1).pseudocodeLine, 4)
})

test('linearSearch.js và binarySearch.js export mảng mã giả', () => {
  for (const [name, lines, length] of [
    ['linearSearchPseudocode', linearSearchPseudocode, 4],
    ['binarySearchPseudocode', binarySearchPseudocode, 10],
  ]) {
    assert.ok(Array.isArray(lines), `${name} phải là mảng`)
    assert.equal(lines.length, length, name)
    lines.forEach((line) => assert.ok(typeof line === 'string' && line.trim() !== '', name))
  }
})

function getSearchTrace(lines, steps) {
  return steps.map((step) => [step.pseudocodeLine, step.pseudocodeLine === null ? null : getSearchLineText(lines, step)])
}

test('Binary Search: nhánh tìm thấy trỏ dòng 5, nhánh A[mid] > target trỏ dòng 9', () => {
  // [10..90] tìm 20: mid = 4 (50 > 20) → right = mid - 1, rồi mid = 1 trúng.
  assert.deepEqual(getSearchTrace(binarySearchPseudocode, generateBinarySearchSteps(oneToNine, 20)), [
    [null, null],
    [9, 'right = mid - 1'],
    [5, 'return mid'],
  ])

  // [10..90] tìm 50: trúng ngay mid đầu tiên.
  assert.deepEqual(getSearchTrace(binarySearchPseudocode, generateBinarySearchSteps(oneToNine, 50)), [
    [null, null],
    [5, 'return mid'],
  ])
})

test('Linear Search: nhánh tìm thấy trỏ dòng 3', () => {
  assert.deepEqual(getSearchTrace(linearSearchPseudocode, generateLinearSearchSteps(oneToNine, 20)), [
    [null, null],
    [2, 'if A[i] == target'],
    [3, 'return i'],
  ])
})

test('mảng rỗng: bước 0 không tô dòng nào, bước kết luận trỏ return -1', () => {
  assert.deepEqual(getSearchTrace(linearSearchPseudocode, generateLinearSearchSteps([], 10)), [
    [null, null],
    [4, 'return -1'],
  ])
  assert.deepEqual(getSearchTrace(binarySearchPseudocode, generateBinarySearchSteps([], 10)), [
    [null, null],
    [10, 'return -1'],
  ])
})

// --- Message bước so sánh cuối khi phạm vi tìm kiếm đã hết ---

test('Binary Search: bước so sánh làm phạm vi rỗng nêu left > right, không nói "Tiếp tục tìm"', () => {
  // Nhánh A[mid] < target (tìm 95) và nhánh A[mid] > target (tìm 5).
  for (const target of [95, 5]) {
    const steps = generateBinarySearchSteps(oneToNine, target)
    const lastComparison = steps.at(-2)

    assert.ok(lastComparison.left > lastComparison.right)
    assert.doesNotMatch(lastComparison.message, /Tiếp tục tìm/, `tìm ${target}`)
    assert.match(lastComparison.message, /left > right/, `tìm ${target}`)
    assert.match(lastComparison.message, /phạm vi tìm kiếm đã rỗng/, `tìm ${target}`)

    // Các bước so sánh trước đó vẫn còn phạm vi nên giữ message cũ.
    steps.slice(1, -2).forEach((step) => {
      assert.match(step.message, /Tiếp tục tìm ở nửa bên (phải|trái)\.$/)
    })
  }
})

test('Linear Search: bước so sánh phần tử cuối nêu đã xét hết mảng, không nói "phần tử tiếp theo"', () => {
  const steps = generateLinearSearchSteps(oneToNine, 95)
  const lastComparison = steps.at(-2)

  assert.equal(lastComparison.currentIndex, oneToNine.length - 1)
  assert.doesNotMatch(lastComparison.message, /phần tử tiếp theo/)
  assert.match(lastComparison.message, /xét hết mảng/)

  steps.slice(1, -2).forEach((step) => {
    assert.match(step.message, /Chuyển sang phần tử tiếp theo\.$/)
  })
})
