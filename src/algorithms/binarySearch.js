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

export function generateBinarySearchSteps(numbers, target) {
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

  if (numbers.length === 0) {
    steps.push(createStep({
      finished: true,
      pseudocodeLine: LINE.NOT_FOUND,
      message: `Không tìm thấy ${target} trong mảng.`,
    }))

    return steps
  }

  while (left <= right) {
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

    let message
    let pseudocodeLine

    if (currentValue < target) {
      left = mid + 1
      pseudocodeLine = LINE.MOVE_LEFT_BOUND
      message = `${currentValue} nhỏ hơn ${target}. Tiếp tục tìm ở nửa bên phải.`
    } else {
      right = mid - 1
      pseudocodeLine = LINE.MOVE_RIGHT_BOUND
      message = `${currentValue} lớn hơn ${target}. Tiếp tục tìm ở nửa bên trái.`
    }

    steps.push(createStep({ currentIndex: mid, currentValue, pseudocodeLine, message }))
  }

  steps.push(createStep({
    finished: true,
    pseudocodeLine: LINE.NOT_FOUND,
    message: `Không tìm thấy ${target} trong mảng.`,
  }))

  return steps
}
