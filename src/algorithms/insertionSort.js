
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
    message: 'Bắt đầu Insertion Sort. Phần tử đầu tiên được xem là đoạn đã sắp xếp.',
  })

  for (let i = 1; i < array.length; i++) {
    const key = array[i]
    let j = i - 1

    while (j >= 0) {
      comparisons++

      steps.push({
        array: [...array],
        comparing: [j, j + 1],
        swapped: [],
        sortedIndices: Array.from({ length: i }, (_, index) => index),
        comparisons,
        swaps,
        shifts,
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
        sortedIndices: [],
        comparisons,
        swaps,
        shifts,
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
      message: `Chèn ${key} vào vị trí ${j + 2}. Đoạn đầu tiên đã có thứ tự.`,
    })
  }

  steps.push({
    array: [...array],
    comparing: [],
    swapped: [],
    sortedIndices: array.map((_, index) => index),
    comparisons,
    swaps,
    shifts,
    message: 'Hoàn thành! Mảng đã được sắp xếp theo thứ tự tăng dần.',
    finished: true,
  })

  return steps
}
