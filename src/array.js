import {
  getArrayElement,
  appendArrayElement,
  insertArrayElement,
  removeArrayElement,
  findArrayElement,
} from './structures/array.js'

export function initArray(options = {}) {
  const document = options.document ?? globalThis.document

  if (!document) {
    throw new Error('Không tìm thấy document để khởi tạo Array.')
  }  
  const elements = {
    container: document.querySelector('#array-visualizer'),
    inputValue: document.querySelector('#array-value'),
    inputIndex: document.querySelector('#array-index'),
    inputRemoveIndex: document.querySelector('#array-remove-index'),
    inputTarget: document.querySelector('#array-target'),
    appendButton: document.querySelector('#array-append'),
    insertButton: document.querySelector('#array-insert'),
    removeButton: document.querySelector('#array-remove'),
    findButton: document.querySelector('#array-find'),
    resetButton: document.querySelector('#array-reset'),
    status: document.querySelector('#array-status'),
  }

  const missingElements = Object.entries(elements)
    .filter(([, element]) => !element)
    .map(([name]) => name)

  if (missingElements.length > 0) {
    console.error(
      `Không thể khởi tạo Array. Thiếu phần tử: ${missingElements.join(', ')}`,
    )
    return null
  }

  const initialNumbers = options.initialNumbers ?? [10, 20, 30, 40, 50]

  if (
    !Array.isArray(initialNumbers) ||
    !initialNumbers.every(Number.isFinite)
  ) {
    throw new TypeError('Mảng khởi tạo phải chứa các số hữu hạn.')
  }

  let numbers = [...initialNumbers]

  function render() {
    elements.container.replaceChildren()

    numbers.forEach((value, index) => {
      const cell = document.createElement('div')
      cell.className = 'array-cell'
      cell.dataset.index = String(index)

      const valueElement = document.createElement('span')
      valueElement.className = 'array-cell-value'
      valueElement.textContent = String(value)

      const indexElement = document.createElement('span')
      indexElement.className = 'array-cell-index'
      indexElement.textContent = `index ${index}`

      cell.append(valueElement, indexElement)
      elements.container.append(cell)
    })
  }

  function readNumber(input, label) {
    const rawValue = input.value.trim()

    if (rawValue === '') {
      throw new Error(`Vui lòng nhập ${label}.`)
    }

    const value = Number(rawValue)

    if (!Number.isFinite(value)) {
      throw new Error(`${label} phải là một số hữu hạn.`)
    }

    return value
  }

  function readIndex(input = elements.inputIndex) {
    const index = readNumber(input, 'index')

    if (!Number.isInteger(index)) {
        throw new Error('Index phải là số nguyên.')
    }

    return index
  }

  function showStatus(message, isError = false) {
    elements.status.textContent = message
    elements.status.dataset.state = isError ? 'error' : 'success'
  }

  function runOperation(operation) {
    try {
      const message = operation()
      render()
      showStatus(message)
    } catch (error) {
      showStatus(error.message, true)
    }
  }

  elements.appendButton.addEventListener('click', () => {
    runOperation(() => {
      const value = readNumber(elements.inputValue, 'giá trị')
      numbers = appendArrayElement(numbers, value)
      return `Đã thêm ${value} vào cuối mảng.`
    })
  })

    elements.insertButton.addEventListener('click', () => {
    runOperation(() => {
        const index = readIndex(elements.inputIndex)
        const value = readNumber(elements.inputValue, 'giá trị')
        numbers = insertArrayElement(numbers, index, value)
        return `Đã chèn ${value} tại index ${index}.`
    })
    })

    elements.removeButton.addEventListener('click', () => {
    runOperation(() => {
        const index = readIndex(elements.inputRemoveIndex)
        const result = removeArrayElement(numbers, index)

        numbers = result.numbers

        return `Đã xóa giá trị ${result.removedValue} tại index ${index}.`
    })
    })

  elements.findButton.addEventListener('click', () => {
    runOperation(() => {
      const target = readNumber(elements.inputTarget, 'giá trị cần tìm')
      const index = findArrayElement(numbers, target)

      if (index === -1) {
        return `Không tìm thấy giá trị ${target}.`
      }

      return `Tìm thấy ${target} tại index ${index}.`
    })
  })

  elements.resetButton.addEventListener('click', () => {
    numbers = [...initialNumbers]
    render()
    showStatus('Đã khôi phục mảng ban đầu.')
  })

  render()
  showStatus('Array Visualizer đã sẵn sàng.')

  return {
    getNumbers() {
      return [...numbers]
    },
    render,
  }
}
