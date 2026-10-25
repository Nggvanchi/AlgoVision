
export function generateBubbleSortSteps(inputArray) {
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
        sortedIndices: [],
        comparisons,
        swaps,
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
          sortedIndices: [],
          comparisons,
          swaps,
          message: `Đổi chỗ ${array[j + 1]} và ${array[j]} vì thứ tự chưa đúng.`,
        })
      }
    }

    const sortedIndices = []

    for (let k = array.length - i - 1; k < array.length; k++) {
      sortedIndices.push(k)
    }

    steps.push({
      array: [...array],
      comparing: [],
      swapped: [],
      sortedIndices,
      comparisons,
      swaps,
      message: `Kết thúc lượt ${i + 1}. Phần tử lớn nhất của phần chưa sắp xếp đã về đúng vị trí.`,
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
    message: 'Hoàn thành! Mảng đã được sắp xếp theo thứ tự tăng dần.',
    finished: true,
  })

  return steps
}
