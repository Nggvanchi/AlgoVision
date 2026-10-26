
import {
  enqueueQueue,
  dequeueQueue,
  frontQueue,
  isQueueEmpty,
} from './structures/queue.js'

const INITIAL_QUEUE = [10, 20, 30]

export function initQueue(document = window.document) {
  const elements = {
    visualizer: document.querySelector('#queue-visualizer'),
    input: document.querySelector('#queue-value'),
    enqueueButton: document.querySelector('#queue-enqueue'),
    dequeueButton: document.querySelector('#queue-dequeue'),
    frontButton: document.querySelector('#queue-front'),
    resetButton: document.querySelector('#queue-reset'),
    status: document.querySelector('#queue-status'),
  }

  const missingElement = Object.entries(elements).find(
    ([, element]) => !element,
  )

  if (missingElement) {
    throw new Error(
      `Không tìm thấy phần tử giao diện: ${missingElement[0]}`,
    )
  }

  let queue = [...INITIAL_QUEUE]

  function render() {
    elements.visualizer.replaceChildren()

    if (isQueueEmpty(queue)) {
      const emptyMessage = document.createElement('p')
      emptyMessage.className = 'queue-empty'
      emptyMessage.textContent = 'Queue đang rỗng.'
      elements.visualizer.append(emptyMessage)
      return
    }

    queue.forEach((value, index) => {
      const cell = document.createElement('div')
      cell.className = 'queue-cell'

      const valueElement = document.createElement('span')
      valueElement.className = 'queue-cell-value'
      valueElement.textContent = String(value)

      cell.append(valueElement)

      if (index === 0) {
        cell.classList.add('is-front')

        const frontLabel = document.createElement('span')
        frontLabel.className = 'queue-front-label'
        frontLabel.textContent = 'FRONT'
        cell.append(frontLabel)
      }

      if (index === queue.length - 1) {
        cell.classList.add('is-rear')

        const rearLabel = document.createElement('span')
        rearLabel.className = 'queue-rear-label'
        rearLabel.textContent = 'REAR'
        cell.append(rearLabel)
      }

      elements.visualizer.append(cell)
    })
  }

  function readValue() {
    const rawValue = elements.input.value.trim()

    if (rawValue === '') {
      throw new TypeError('Vui lòng nhập giá trị cần thêm.')
    }

    const value = Number(rawValue)

    if (!Number.isFinite(value)) {
      throw new TypeError('Giá trị phải là số hữu hạn.')
    }

    return value
  }

  function showStatus(message, isError = false) {
    elements.status.textContent = message
    elements.status.classList.toggle('is-error', isError)
  }

  elements.enqueueButton.addEventListener('click', () => {
    try {
      const value = readValue()
      queue = enqueueQueue(queue, value)
      render()
      showStatus(`Đã Enqueue ${value} vào Queue.`)
      elements.input.value = ''
    } catch (error) {
      showStatus(error.message, true)
    }
  })

  elements.dequeueButton.addEventListener('click', () => {
    try {
      const result = dequeueQueue(queue)
      queue = result.queue
      render()
      showStatus(`Đã Dequeue phần tử ${result.dequeuedValue}.`)
    } catch (error) {
      showStatus(error.message, true)
    }
  })

  elements.frontButton.addEventListener('click', () => {
    try {
      const value = frontQueue(queue)
      showStatus(`Phần tử đầu hàng đợi (Front) là ${value}.`)
    } catch (error) {
      showStatus(error.message, true)
    }
  })

  elements.resetButton.addEventListener('click', () => {
    queue = [...INITIAL_QUEUE]
    render()
    showStatus('Đã khôi phục Queue ban đầu.')
    elements.input.value = ''
  })

  render()
  showStatus('Queue Visualizer đã sẵn sàng.')

  return {
    getQueue() {
      return [...queue]
    },
  }
}
