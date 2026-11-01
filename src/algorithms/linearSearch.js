// Sinh các bước Linear Search. Target được chốt một lần khi sinh bước.
// Mỗi bước sau bước đầu là một phép so sánh, riêng bước kết luận "không tìm thấy" thì không.
// index là con trỏ tới phần tử sẽ xét tiếp; currentIndex là phần tử vừa so sánh.
export function generateLinearSearchSteps(numbers, target) {
  const steps = []
  let comparisons = 0

  const createStep = (fields) => ({
    index: 0,
    mid: -1,
    left: 0,
    right: numbers.length - 1,
    comparisons,
    foundIndex: -1,
    finished: false,
    target,
    // Phần tử vừa so sánh; null ở bước đầu và bước kết luận "không tìm thấy".
    currentIndex: null,
    currentValue: null,
    ...fields,
  })

  steps.push(createStep({ message: `Bắt đầu tìm ${target}.` }))

  if (numbers.length === 0) {
    steps.push(createStep({
      finished: true,
      message: `Không tìm thấy ${target} trong mảng.`,
    }))

    return steps
  }

  for (let i = 0; i < numbers.length; i++) {
    const currentValue = numbers[i]
    comparisons++

    if (currentValue === target) {
      steps.push(createStep({
        index: i,
        currentIndex: i,
        currentValue,
        foundIndex: i,
        finished: true,
        message: `Đã tìm thấy ${target} tại vị trí ${i + 1}.`,
      }))

      return steps
    }

    steps.push(createStep({
      index: i + 1,
      currentIndex: i,
      currentValue,
      message: `${currentValue} khác ${target}. Chuyển sang phần tử tiếp theo.`,
    }))
  }

  steps.push(createStep({
    index: numbers.length,
    finished: true,
    message: `Không tìm thấy ${target} trong mảng.`,
  }))

  return steps
}
