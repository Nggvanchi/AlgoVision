import test from 'node:test'
import assert from 'node:assert/strict'

import { generateLinearSearchSteps } from '../src/algorithms/linearSearch.js'
import { generateBinarySearchSteps } from '../src/algorithms/binarySearch.js'

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
