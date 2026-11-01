// Mã giả hiển thị trên Learning Panel; pseudocodeLine của mỗi bước đếm từ 1 theo mảng này.
export const bubbleSortPseudocode = [
  'for i = 0 to n - 2',
  '    swapped = false',
  '    for j = 0 to n - i - 2',
  '        if A[j] > A[j + 1]',
  '            swap(A[j], A[j + 1])',
  '            swapped = true',
  '    if swapped == false',
  '        break',
]

const LINE = {
  COMPARE: 4,
  SWAP: 5,
  CHECK_SWAPPED: 7,
  BREAK: 8,
}

export function generateBubbleSortSteps(inputArray) {
  const array = [...inputArray]
  const steps = []

  let comparisons = 0
  let swaps = 0

  // Sau lượt thứ count, count phần tử cuối mảng đã đúng vị trí.
  const getSortedTail = (count) =>
    Array.from({ length: count }, (_, offset) => array.length - count + offset)

  steps.push({
    array: [...array],
    comparing: [],
    swapped: [],
    sortedIndices: [],
    comparisons,
    swaps,
    pseudocodeLine: null,
    message: 'Mảng ban đầu. Sẵn sàng bắt đầu Bubble Sort.',
  })

  for (let i = 0; i < array.length - 1; i++) {
    let hasSwapped = false

    for (let j = 0; j < array.length - i - 1; j++) {
      comparisons++

      steps.push({
        array: [...array],
        comparing: [j, j + 1],
        swapped: [],
        sortedIndices: getSortedTail(i),
        comparisons,
        swaps,
        pseudocodeLine: LINE.COMPARE,
        message: `So sánh ${array[j]} và ${array[j + 1]}.`,
      })

      if (array[j] > array[j + 1]) {
        const temp = array[j]
        array[j] = array[j + 1]
        array[j + 1] = temp

        swaps++
        hasSwapped = true

        steps.push({
          array: [...array],
          comparing: [j, j + 1],
          swapped: [j, j + 1],
          sortedIndices: getSortedTail(i),
          comparisons,
          swaps,
          pseudocodeLine: LINE.SWAP,
          message: `Đổi chỗ ${array[j + 1]} và ${array[j]} vì thứ tự chưa đúng.`,
        })
      }
    }

    steps.push({
      array: [...array],
      comparing: [],
      swapped: [],
      sortedIndices: getSortedTail(i + 1),
      comparisons,
      swaps,
      pseudocodeLine: hasSwapped ? LINE.CHECK_SWAPPED : LINE.BREAK,
      message: hasSwapped
        ? `Kết thúc lượt ${i + 1}. Phần tử lớn nhất của phần chưa sắp xếp đã về đúng vị trí.`
        : `Kết thúc lượt ${i + 1}. Không có lần đổi chỗ nào nên mảng đã có thứ tự, dừng sớm.`,
    })

    if (!hasSwapped) {
      break
    }
  }

  steps.push({
    array: [...array],
    comparing: [],
    swapped: [],
    sortedIndices: array.map((_, index) => index),
    comparisons,
    swaps,
    pseudocodeLine: null,
    message:
      array.length === 0
        ? 'Mảng rỗng, không có phần tử cần sắp xếp.'
        : array.length === 1
          ? 'Mảng chỉ có một phần tử nên đã được sắp xếp.'
          : 'Hoàn thành! Mảng đã được sắp xếp theo thứ tự tăng dần.',
    finished: true,
  })

  return steps
}
