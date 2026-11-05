import { assertWithinStepLimit } from './stepLimit.js'

// Sinh các bước Binary Search trên mảng đã sắp xếp tăng dần.
// Target được chốt một lần khi sinh bước; mỗi bước sau bước đầu là một phép so sánh,
// riêng bước kết luận "không tìm thấy" thì không.
// Mã giả hiển thị trên Learning Panel; pseudocodeLine của mỗi bước đếm từ 1 theo mảng này.
export const binarySearchPseudocode = [
  'left = 0, right = n - 1',
  'while left <= right',
  '    mid = floor((left + right) / 2)',
  '    if A[mid] == target',
  '        return mid',
  '    else if A[mid] < target',
  '        left = mid + 1',
  '    else',
  '        right = mid - 1',
  'return -1',
]

const LINE = {
  FOUND: 5,
  MOVE_LEFT_BOUND: 7,
  MOVE_RIGHT_BOUND: 9,
  NOT_FOUND: 10,
}

// Số bước tối đa: bước đầu + tối đa ⌊log2 n⌋ + 1 lần so sánh (mỗi lần một bước) + bước kết luận "không tìm thấy".
// 32 − clz32(n) = ⌊log2 n⌋ + 1 cho n ≥ 1 và 0 cho n = 0, tính bằng số nguyên (không sai số của Math.log2).
export function binarySearchStepLimit(length) {
  return 32 - Math.clz32(length) + 2
}

export function generateBinarySearchSteps(numbers, target) {
  const limit = binarySearchStepLimit(numbers.length)
  const steps = []
  let comparisons = 0
  let left = 0
  let right = numbers.length - 1
  let mid = -1

  const createStep = (fields) => ({
    index: 0,
    mid,
    left,
    right,
    comparisons,
    foundIndex: -1,
    finished: false,
    target,
    // Phần tử vừa so sánh; null ở bước đầu và bước kết luận "không tìm thấy".
    currentIndex: null,
    currentValue: null,
    pseudocodeLine: null,
    ...fields,
  })

  steps.push(createStep({ message: `Bắt đầu tìm ${target}.` }))

  while (left <= right) {
    assertWithinStepLimit(steps, limit, 'Binary Search')
    mid = Math.floor((left + right) / 2)

    const currentValue = numbers[mid]
    comparisons++

    if (currentValue === target) {
      steps.push(createStep({
        currentIndex: mid,
        currentValue,
        foundIndex: mid,
        finished: true,
        pseudocodeLine: LINE.FOUND,
        message: `Đã tìm thấy ${target} tại vị trí ${mid + 1}.`,
      }))

      return steps
    }

    let comparison
    let nextHalf
    let pseudocodeLine

    if (currentValue < target) {
      left = mid + 1
      pseudocodeLine = LINE.MOVE_LEFT_BOUND
      comparison = `${currentValue} nhỏ hơn ${target}.`
      nextHalf = 'Tiếp tục tìm ở nửa bên phải.'
    } else {
      right = mid - 1
      pseudocodeLine = LINE.MOVE_RIGHT_BOUND
      comparison = `${currentValue} lớn hơn ${target}.`
      nextHalf = 'Tiếp tục tìm ở nửa bên trái.'
    }

    // Sau lần cập nhật cuối, phạm vi có thể đã rỗng: không còn nửa nào để tìm tiếp.
    const message = left > right
      ? `${comparison} Sau khi cập nhật, left > right nên phạm vi tìm kiếm đã rỗng.`
      : `${comparison} ${nextHalf}`

    steps.push(createStep({ currentIndex: mid, currentValue, pseudocodeLine, message }))
  }

  steps.push(createStep({
    finished: true,
    pseudocodeLine: LINE.NOT_FOUND,
    message: `Không tìm thấy ${target} trong mảng.`,
  }))

  return steps
}
