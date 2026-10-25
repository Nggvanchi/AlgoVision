
import {
  pushStackElement,
  popStackElement,
  peekStackElement,
  isStackEmpty,
} from './structures/stack.js'

const INITIAL_STACK = [10, 20, 30]

export function initStack(document = window.document) {
  const elements = {
    visualizer: document.querySelector('#stack-visualizer'),
    input: document.querySelector('#stack-value'),
    pushButton: document.querySelector('#stack-push'),
    popButton: document.querySelector('#stack-pop'),
    peekButton: document.querySelector('#stack-peek'),
    resetButton: document.querySelector('#stack-reset'),
    status: document.querySelector('#stack-status'),
  }

  const missingElement = Object.entries(elements).find(
    ([, element]) => !element,
  )

  if (missingElement) {
    throw new Error(
      `Không tìm thấy phần tử giao diện: ${missingElement[0]}`,
    )
  }

  let stack = [...INITIAL_STACK]

  function render() {
    elements.visualizer.replaceChildren()

    if (isStackEmpty(stack)) {
      const emptyMessage = document.createElement('p')
      emptyMessage.className = 'stack-empty'
      emptyMessage.textContent = 'Stack đang rỗng.'
      elements.visualizer.append(emptyMessage)
      return
    }

    stack.forEach((value, index) => {
      const cell = document.createElement('div')
      cell.className = 'stack-cell'

      const valueElement = document.createElement('span')
      valueElement.className = 'stack-cell-value'
      valueElement.textContent = String(value)

      cell.append(valueElement)

      if (index === stack.length - 1) {
        cell.classList.add('is-top')

        const topLabel = document.createElement('span')
        topLabel.className = 'stack-top-label'
        topLabel.textContent = 'TOP'
        cell.append(topLabel)
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

  elements.pushButton.addEventListener('click', () => {
    try {
      const value = readValue()
      stack = pushStackElement(stack, value)
      render()
      showStatus(`Đã Push ${value} vào Stack.`)
      elements.input.value = ''
    } catch (error) {
      showStatus(error.message, true)
    }
  })

  elements.popButton.addEventListener('click', () => {
    try {
      const result = popStackElement(stack)
      stack = result.stack
      render()
      showStatus(`Đã Pop phần tử ${result.poppedValue}.`)
    } catch (error) {
      showStatus(error.message, true)
    }
  })

  elements.peekButton.addEventListener('click', () => {
    try {
      const value = peekStackElement(stack)
      showStatus(`Phần tử trên đỉnh Stack là ${value}.`)
    } catch (error) {
      showStatus(error.message, true)
    }
  })

  elements.resetButton.addEventListener('click', () => {
    stack = [...INITIAL_STACK]
    render()
    showStatus('Đã khôi phục Stack ban đầu.')
    elements.input.value = ''
  })

  render()
  showStatus('Stack Visualizer đã sẵn sàng.')

  return {
    getStack() {
      return [...stack]
    },
  }
}
