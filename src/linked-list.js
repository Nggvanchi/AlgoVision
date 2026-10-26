import { LinkedList } from './structures/linkedList.js'

const INITIAL_VALUES = [10, 20, 30]

export function initLinkedList(document = globalThis.document) {
  if (!document) {
    throw new Error('Không tìm thấy document để khởi tạo Linked List.')
  }

  const visualizer = document.querySelector('#linked-list-visualizer')
  const valueInput = document.querySelector('#linked-list-value')
  const indexInput = document.querySelector('#linked-list-index')
  const targetInput = document.querySelector('#linked-list-target')
  const appendButton = document.querySelector('#linked-list-append')
  const prependButton = document.querySelector('#linked-list-prepend')
  const insertButton = document.querySelector('#linked-list-insert')
  const removeButton = document.querySelector('#linked-list-remove')
  const findButton = document.querySelector('#linked-list-find')
  const resetButton = document.querySelector('#linked-list-reset')
  const status = document.querySelector('#linked-list-status')

  const requiredElements = [
    visualizer,
    valueInput,
    indexInput,
    targetInput,
    appendButton,
    prependButton,
    insertButton,
    removeButton,
    findButton,
    resetButton,
    status,
  ]

  if (requiredElements.some((element) => !element)) {
    throw new Error('Thiếu phần tử HTML cần thiết cho Linked List Visualizer.')
  }

  let list = new LinkedList(INITIAL_VALUES)
  let highlightedIndex = -1

  function setStatus(message, type = 'info') {
    status.textContent = message
    status.dataset.type = type
  }

  function render() {
    visualizer.replaceChildren()

    const values = list.toArray()

    if (values.length === 0) {
      const emptyMessage = document.createElement('p')
      emptyMessage.className = 'linked-list-empty'
      emptyMessage.textContent = 'Danh sách đang rỗng.'
      visualizer.append(emptyMessage)
      return
    }

    values.forEach((value, index) => {
      const node = document.createElement('div')
      node.className = 'linked-list-node'

      if (index === highlightedIndex) {
        node.classList.add('is-highlighted')
      }

      const pointerLabel = document.createElement('span')
      pointerLabel.className = 'linked-list-node-label'
      pointerLabel.textContent = index === 0 ? 'HEAD' : `Node ${index}`

      const nodeValue = document.createElement('span')
      nodeValue.className = 'linked-list-node-value'
      nodeValue.textContent = String(value)

      const nodeIndex = document.createElement('span')
      nodeIndex.className = 'linked-list-node-index'
      nodeIndex.textContent = `Index: ${index}`

      const nextLabel = document.createElement('span')
      nextLabel.className = 'linked-list-node-next'
      nextLabel.textContent = index === values.length - 1 ? 'next: NULL' : 'next: Node'

      node.append(pointerLabel, nodeValue, nodeIndex, nextLabel)
      visualizer.append(node)

      const arrow = document.createElement('span')
      arrow.className = 'linked-list-arrow'
      arrow.setAttribute('aria-hidden', 'true')
      arrow.textContent = '→'
      visualizer.append(arrow)
    })

    const nullNode = document.createElement('span')
    nullNode.className = 'linked-list-null'
    nullNode.textContent = 'NULL'
    visualizer.append(nullNode)
  }

  function readNumber(input, label) {
    const rawValue = input.value.trim()
    const value = Number(rawValue)

    if (rawValue === '' || !Number.isFinite(value)) {
      setStatus(`Vui lòng nhập ${label} là một số hợp lệ.`, 'error')
      input.focus()
      return null
    }

    return value
  }

  function readIndex() {
    const rawValue = indexInput.value.trim()
    const index = Number(rawValue)

    if (
      rawValue === '' ||
      !Number.isInteger(index) ||
      index < 0
    ) {
      setStatus('Vị trí phải là số nguyên không âm.', 'error')
      indexInput.focus()
      return null
    }

    return index
  }

  function runOperation(operation) {
    try {
      operation()
      render()
    } catch (error) {
      setStatus(error.message, 'error')
    }
  }

  appendButton.addEventListener('click', () => {
    const value = readNumber(valueInput, 'giá trị cần thêm')
    if (value === null) return

    runOperation(() => {
      list.append(value)
      highlightedIndex = list.getSize() - 1
      setStatus(`Đã thêm ${value} vào cuối danh sách.`)
      valueInput.value = ''
    })
  })

  prependButton.addEventListener('click', () => {
    const value = readNumber(valueInput, 'giá trị cần thêm')
    if (value === null) return

    runOperation(() => {
      list.prepend(value)
      highlightedIndex = 0
      setStatus(`Đã thêm ${value} vào đầu danh sách.`)
      valueInput.value = ''
    })
  })

  insertButton.addEventListener('click', () => {
    const value = readNumber(valueInput, 'giá trị cần chèn')
    if (value === null) return

    const index = readIndex()
    if (index === null) return

    runOperation(() => {
      list.insertAt(index, value)
      highlightedIndex = index
      setStatus(`Đã chèn ${value} tại vị trí ${index}.`)
      valueInput.value = ''
    })
  })

  removeButton.addEventListener('click', () => {
    const index = readIndex()
    if (index === null) return

    runOperation(() => {
      const result = list.removeAt(index)
      highlightedIndex = -1
      setStatus(`Đã xóa giá trị ${result.removedValue} tại vị trí ${index}.`)
    })
  })

  findButton.addEventListener('click', () => {
    const target = readNumber(targetInput, 'giá trị cần tìm')
    if (target === null) return

    const index = list.find(target)
    highlightedIndex = index
    render()

    if (index === -1) {
      setStatus(`Không tìm thấy giá trị ${target} trong danh sách.`, 'error')
      return
    }

    setStatus(`Tìm thấy ${target} tại vị trí ${index}.`)
  })

  resetButton.addEventListener('click', () => {
    list = new LinkedList(INITIAL_VALUES)
    highlightedIndex = -1
    valueInput.value = ''
    indexInput.value = ''
    targetInput.value = ''
    render()
    setStatus('Đã khôi phục danh sách liên kết ban đầu.')
  })

  render()
  setStatus('Linked List Visualizer đã sẵn sàng.')

  return {
    getValues: () => list.toArray(),
    getSize: () => list.getSize(),
    render,
  }
}