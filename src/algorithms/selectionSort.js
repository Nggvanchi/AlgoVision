// Mã giả hiển thị trên Learning Panel; pseudocodeLine của mỗi bước đếm từ 1 theo mảng này.
export const selectionSortPseudocode = [
  'for i = 0 to n - 2',
  '    minIndex = i',
  '    for j = i + 1 to n - 1',
  '        if A[j] < A[minIndex]',
  '            minIndex = j',
  '    if minIndex != i',
  '        swap(A[i], A[minIndex])',
]

const LINE = {
  COMPARE: 4,
  UPDATE_MIN: 5,
  CHECK_MIN: 6,
  SWAP: 7,
}

export function generateSelectionSortSteps(inputArray) {
  const array = [...inputArray]
  const steps = []

  let comparisons = 0
  let swaps = 0

  steps.push({
    array: [...array],
    comparing: [],
    swapped: [],
    sortedIndices: [],
    comparisons,
    swaps,
    pseudocodeLine: null,
    message: 'Mảng ban đầu. Sẵn sàng bắt đầu Selection Sort.',
  })

  for (let i = 0; i < array.length - 1; i++) {
    let minIndex = i

    for (let j = i + 1; j < array.length; j++) {
      comparisons++

      steps.push({
        array: [...array],
        comparing: [minIndex, j],
        swapped: [],
        sortedIndices: Array.from({ length: i }, (_, index) => index),
        comparisons,
        swaps,
        pseudocodeLine: LINE.COMPARE,
        message: `So sánh giá trị nhỏ nhất hiện tại ${array[minIndex]} với ${array[j]}.`,
      })

      if (array[j] < array[minIndex]) {
        minIndex = j

        steps.push({
          array: [...array],
          comparing: [i, minIndex],
          swapped: [],
          sortedIndices: Array.from({ length: i }, (_, index) => index),
          comparisons,
          swaps,
          pseudocodeLine: LINE.UPDATE_MIN,
          message: `Tìm thấy giá trị nhỏ hơn: ${array[minIndex]}. Cập nhật vị trí nhỏ nhất.`,
        })
      }
    }

    if (minIndex !== i) {
      const temp = array[i]
      array[i] = array[minIndex]
      array[minIndex] = temp
      swaps++

      steps.push({
        array: [...array],
        comparing: [i, minIndex],
        swapped: [i, minIndex],
        sortedIndices: Array.from({ length: i }, (_, index) => index),
        comparisons,
        swaps,
        pseudocodeLine: LINE.SWAP,
        message: `Đưa giá trị nhỏ nhất ${array[i]} về vị trí ${i + 1}.`,
      })
    }

    steps.push({
      array: [...array],
      comparing: [],
      swapped: [],
      sortedIndices: Array.from({ length: i + 1 }, (_, index) => index),
      comparisons,
      swaps,
      // Không đổi chỗ thì điều kiện ở dòng 6 sai; có đổi chỗ thì bước này là kết quả của dòng 7.
      pseudocodeLine: minIndex === i ? LINE.CHECK_MIN : LINE.SWAP,
      message: `Vị trí ${i + 1} đã được xác định đúng.`,
    })
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
