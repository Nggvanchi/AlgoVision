// Mã giả hiển thị trên Learning Panel; pseudocodeLine của mỗi bước đếm từ 1 theo mảng này.
export const insertionSortPseudocode = [
  'for i = 1 to n - 1',
  '    key = A[i]',
  '    j = i - 1',
  '    while j >= 0 and A[j] > key',
  '        A[j + 1] = A[j]',
  '        j = j - 1',
  '    A[j + 1] = key',
]

const LINE = {
  COMPARE: 4,
  SHIFT: 5,
  INSERT: 7,
}

export function generateInsertionSortSteps(inputArray) {
  const array = [...inputArray]
  const steps = []

  let comparisons = 0
  let swaps = 0
  let shifts = 0

  steps.push({
    array: [...array],
    comparing: [],
    swapped: [],
    sortedIndices: array.length > 0 ? [0] : [],
    comparisons,
    swaps,
    shifts,
    key: null,
    pseudocodeLine: null,
    message: 'Bắt đầu Insertion Sort. Phần tử đầu tiên được xem là đoạn đã sắp xếp.',
  })

  for (let i = 1; i < array.length; i++) {
    const key = array[i]
    let j = i - 1

    while (j >= 0) {
      comparisons++

      steps.push({
        array: [...array],
        // Chỉ tô A[j]: sau lần dời đầu tiên, cột j + 1 chứa bản sao chứ không còn là key.
        comparing: [j],
        swapped: [],
        sortedIndices: Array.from({ length: i }, (_, index) => index),
        comparisons,
        swaps,
        shifts,
        key,
        pseudocodeLine: LINE.COMPARE,
        message: `So sánh ${array[j]} với giá trị cần chèn ${key}.`,
      })

      if (array[j] <= key) {
        break
      }

      array[j + 1] = array[j]
      shifts++

      steps.push({
        array: [...array],
        comparing: [j, j + 1],
        swapped: [],
        sortedIndices: Array.from({ length: i }, (_, index) => index),
        comparisons,
        swaps,
        shifts,
        key,
        pseudocodeLine: LINE.SHIFT,
        message: `Dời ${array[j]} sang phải để tạo chỗ chèn ${key}.`,
      })

      j--
    }

    array[j + 1] = key

    steps.push({
      array: [...array],
      comparing: [],
      swapped: [],
      sortedIndices: Array.from({ length: i + 1 }, (_, index) => index),
      comparisons,
      swaps,
      shifts,
      key,
      pseudocodeLine: LINE.INSERT,
      message: `Chèn ${key} vào vị trí ${j + 2}. Đoạn đầu tiên đã có thứ tự.`,
    })
  }

  let completionMessage = 'Hoàn thành! Mảng đã được sắp xếp theo thứ tự tăng dần.'

  if (array.length === 0) {
    completionMessage = 'Mảng rỗng, không có phần tử cần sắp xếp.'
  } else if (array.length === 1) {
    completionMessage = 'Mảng chỉ có một phần tử nên đã được sắp xếp.'
  }

  steps.push({
    array: [...array],
    comparing: [],
    swapped: [],
    sortedIndices: array.map((_, index) => index),
    comparisons,
    swaps,
    shifts,
    key: null,
    pseudocodeLine: null,
    message: completionMessage,
    finished: true,
  })

  return steps
}
