
function validateStack(stack) {
  if (!Array.isArray(stack)) {
    throw new TypeError('Stack phải là một mảng.')
  }

  if (!stack.every(Number.isFinite)) {
    throw new TypeError(
      'Các phần tử trong Stack phải là số hữu hạn.',
    )
  }
}

function validateValue(value) {
  if (!Number.isFinite(value)) {
    throw new TypeError(
      'Giá trị cần thêm phải là số hữu hạn.',
    )
  }
}

export { validateStack }

export function pushStackElement(stack, value) {
  validateStack(stack)
  validateValue(value)

  return [...stack, value]
}

export function popStackElement(stack) {
  validateStack(stack)

  if (stack.length === 0) {
    throw new RangeError(
      'Không thể Pop vì Stack đang rỗng.',
    )
  }

  return {
    stack: stack.slice(0, -1),
    poppedValue: stack[stack.length - 1],
  }
}

export function peekStackElement(stack) {
  validateStack(stack)

  if (stack.length === 0) {
    throw new RangeError(
      'Không thể Peek vì Stack đang rỗng.',
    )
  }

  return stack[stack.length - 1]
}

export function isStackEmpty(stack) {
  validateStack(stack)

  return stack.length === 0
}
