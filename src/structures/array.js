export function getArrayElement(numbers, index) {
  validateArray(numbers)
  validateIndex(index, numbers.length, false)

  return numbers[index]
}

export function appendArrayElement(numbers, value) {
  validateArray(numbers)
  validateValue(value)

  return [...numbers, value]
}

export function insertArrayElement(numbers, index, value) {
  validateArray(numbers)
  validateIndex(index, numbers.length, true)
  validateValue(value)

  const result = [...numbers]
  result.splice(index, 0, value)

  return result
}

export function removeArrayElement(numbers, index) {
  validateArray(numbers)
  validateIndex(index, numbers.length, false)

  const result = [...numbers]
  const [removedValue] = result.splice(index, 1)

  return {
    numbers: result,
    removedValue,
  }
}

export function findArrayElement(numbers, target) {
  validateArray(numbers)
  validateValue(target)

  for (let index = 0; index < numbers.length; index += 1) {
    if (numbers[index] === target) {
      return index
    }
  }

  return -1
}

function validateArray(numbers) {
  if (!Array.isArray(numbers)) {
    throw new TypeError('Dữ liệu phải là một mảng.')
  }
}

function validateValue(value) {
  if (!Number.isFinite(value)) {
    throw new TypeError('Giá trị phải là một số hữu hạn.')
  }
}

function validateIndex(index, length, allowEnd) {
  if (!Number.isInteger(index)) {
    throw new TypeError('Index phải là một số nguyên.')
  }

  const upperBound = allowEnd ? length : length - 1

  if (index < 0 || index > upperBound) {
    throw new RangeError('Index nằm ngoài phạm vi cho phép.')
  }
}
