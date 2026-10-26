
function validateQueue(queue) {
  if (!Array.isArray(queue)) {
    throw new TypeError('Queue phải là một mảng.')
  }

  if (!queue.every(Number.isFinite)) {
    throw new TypeError(
      'Các phần tử trong Queue phải là số hữu hạn.',
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

export { validateQueue }

export function enqueueQueue(queue, value) {
  validateQueue(queue)
  validateValue(value)

  return [...queue, value]
}

export function dequeueQueue(queue) {
  validateQueue(queue)

  if (queue.length === 0) {
    throw new RangeError(
      'Không thể Dequeue vì Queue đang rỗng.',
    )
  }

  return {
    queue: queue.slice(1),
    dequeuedValue: queue[0],
  }
}

export function frontQueue(queue) {
  validateQueue(queue)

  if (queue.length === 0) {
    throw new RangeError(
      'Không thể xem Front vì Queue đang rỗng.',
    )
  }

  return queue[0]
}

export function isQueueEmpty(queue) {
  validateQueue(queue)

  return queue.length === 0
}
