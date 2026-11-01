import test from 'node:test'
import assert from 'node:assert/strict'

import { generateBubbleSortSteps } from '../src/algorithms/bubbleSort.js'
import { generateSelectionSortSteps } from '../src/algorithms/selectionSort.js'
import { generateInsertionSortSteps } from '../src/algorithms/insertionSort.js'
import { generateLinearSearchSteps } from '../src/algorithms/linearSearch.js'
import { generateBinarySearchSteps } from '../src/algorithms/binarySearch.js'

// Đối chiếu Big-O hiển thị trên giao diện với số phép so sánh mà generator thực sự đếm.
const n = 8
const sortedInput = Array.from({ length: n }, (_, index) => (index + 1) * 10)
const reversedInput = [...sortedInput].reverse()
const allPairs = (n * (n - 1)) / 2

function countSortComparisons(generate, input) {
  return generate(input).at(-1).comparisons
}

test('Bubble Sort: tốt nhất O(n) nhờ dừng sớm, xấu nhất O(n²)', () => {
  assert.equal(countSortComparisons(generateBubbleSortSteps, sortedInput), n - 1)
  assert.equal(generateBubbleSortSteps(sortedInput).at(-1).swaps, 0)
  assert.equal(countSortComparisons(generateBubbleSortSteps, reversedInput), allPairs)
})

test('Selection Sort: luôn n(n-1)/2 phép so sánh, tối đa n - 1 lần đổi chỗ', () => {
  assert.equal(countSortComparisons(generateSelectionSortSteps, sortedInput), allPairs)
  assert.equal(countSortComparisons(generateSelectionSortSteps, reversedInput), allPairs)
  assert.equal(generateSelectionSortSteps(sortedInput).at(-1).swaps, 0)
  assert.ok(generateSelectionSortSteps(reversedInput).at(-1).swaps <= n - 1)
})

test('Insertion Sort: tốt nhất O(n), xấu nhất O(n²) phép so sánh và dời chỗ', () => {
  assert.equal(countSortComparisons(generateInsertionSortSteps, sortedInput), n - 1)
  assert.equal(generateInsertionSortSteps(sortedInput).at(-1).shifts, 0)
  assert.equal(countSortComparisons(generateInsertionSortSteps, reversedInput), allPairs)
  assert.equal(generateInsertionSortSteps(reversedInput).at(-1).shifts, allPairs)
})

test('Linear Search: tốt nhất 1 phép so sánh, xấu nhất n', () => {
  assert.equal(generateLinearSearchSteps(sortedInput, sortedInput[0]).at(-1).comparisons, 1)
  assert.equal(generateLinearSearchSteps(sortedInput, sortedInput.at(-1)).at(-1).comparisons, n)
  assert.equal(generateLinearSearchSteps(sortedInput, 999).at(-1).comparisons, n)
})

test('Binary Search: tốt nhất 1 phép so sánh, xấu nhất đúng floor(log2 n) + 1', () => {
  for (let size = 1; size <= 64; size++) {
    const numbers = Array.from({ length: size }, (_, index) => (index + 1) * 10)
    const middleValue = numbers[Math.floor((size - 1) / 2)]
    // Các mục tiêu không có trong mảng: nhỏ hơn, xen giữa và lớn hơn mọi phần tử.
    const missingTargets = [5, ...numbers.map((value) => value + 5)]
    const worstComparisons = Math.max(
      ...missingTargets.map((target) =>
        generateBinarySearchSteps(numbers, target).at(-1).comparisons,
      ),
    )

    assert.equal(generateBinarySearchSteps(numbers, middleValue).at(-1).comparisons, 1)
    assert.equal(worstComparisons, Math.floor(Math.log2(size)) + 1, `n = ${size}`)
  }
})
