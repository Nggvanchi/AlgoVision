
import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { initLinkedList } from '../src/linked-list.js'

const templatePath = new URL(
  '../public/templates/app.html',
  import.meta.url,
)

const template = await readFile(templatePath, 'utf8')

function createVisualizer() {
  const window = new Window()
  const { document } = window

  document.body.innerHTML = template

  const controller = initLinkedList(document)

  return { window, document, controller }
}

test('khởi tạo Linked List Visualizer với dữ liệu mặc định', () => {
  const { window, controller } = createVisualizer()

  try {
    assert.deepEqual(controller.getValues(), [10, 20, 30])
    assert.equal(controller.getSize(), 3)
  } finally {
    window.happyDOM.abort()
  }
})

test('thêm phần tử vào cuối danh sách', () => {
  const { window, document, controller } = createVisualizer()

  try {
    document.querySelector('#linked-list-value').value = '40'
    document.querySelector('#linked-list-append').click()

    assert.deepEqual(controller.getValues(), [10, 20, 30, 40])
    assert.match(
      document.querySelector('#linked-list-status').textContent,
      /Đã thêm 40/,
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('thêm phần tử vào đầu danh sách', () => {
  const { window, document, controller } = createVisualizer()

  try {
    document.querySelector('#linked-list-value').value = '5'
    document.querySelector('#linked-list-prepend').click()

    assert.deepEqual(controller.getValues(), [5, 10, 20, 30])
  } finally {
    window.happyDOM.abort()
  }
})

test('chèn phần tử tại vị trí được chọn', () => {
  const { window, document, controller } = createVisualizer()

  try {
    document.querySelector('#linked-list-value').value = '15'
    document.querySelector('#linked-list-index').value = '1'
    document.querySelector('#linked-list-insert').click()

    assert.deepEqual(controller.getValues(), [10, 15, 20, 30])
  } finally {
    window.happyDOM.abort()
  }
})

test('xóa phần tử tại vị trí được chọn', () => {
  const { window, document, controller } = createVisualizer()

  try {
    document.querySelector('#linked-list-index').value = '1'
    document.querySelector('#linked-list-remove').click()

    assert.deepEqual(controller.getValues(), [10, 30])
    assert.match(
      document.querySelector('#linked-list-status').textContent,
      /Đã xóa giá trị 20/,
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('tìm thấy giá trị và hiển thị vị trí', () => {
  const { window, document } = createVisualizer()

  try {
    document.querySelector('#linked-list-target').value = '20'
    document.querySelector('#linked-list-find').click()

    assert.match(
      document.querySelector('#linked-list-status').textContent,
      /Tìm thấy 20 tại vị trí 1/,
    )

    assert.equal(
      document.querySelectorAll(
        '#linked-list-visualizer .linked-list-node.is-highlighted',
      ).length,
      1,
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('thông báo khi không tìm thấy giá trị', () => {
  const { window, document } = createVisualizer()

  try {
    document.querySelector('#linked-list-target').value = '99'
    document.querySelector('#linked-list-find').click()

    assert.match(
      document.querySelector('#linked-list-status').textContent,
      /Không tìm thấy giá trị 99/,
    )

    assert.equal(
      document.querySelectorAll(
        '#linked-list-visualizer .linked-list-node.is-highlighted',
      ).length,
      0,
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('hiển thị lỗi khi giá trị cần thêm bị bỏ trống', () => {
  const { window, document, controller } = createVisualizer()

  try {
    document.querySelector('#linked-list-value').value = ''
    document.querySelector('#linked-list-append').click()

    assert.deepEqual(controller.getValues(), [10, 20, 30])
    assert.match(
      document.querySelector('#linked-list-status').textContent,
      /Vui lòng nhập/,
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('hiển thị lỗi khi vị trí chèn không hợp lệ', () => {
  const { window, document, controller } = createVisualizer()

  try {
    document.querySelector('#linked-list-value').value = '15'
    document.querySelector('#linked-list-index').value = '99'
    document.querySelector('#linked-list-insert').click()

    assert.deepEqual(controller.getValues(), [10, 20, 30])
    assert.match(
      document.querySelector('#linked-list-status').textContent,
      /Vị trí không hợp lệ/,
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('khôi phục danh sách và xóa trạng thái nhập', () => {
  const { window, document, controller } = createVisualizer()

  try {
    document.querySelector('#linked-list-value').value = '40'
    document.querySelector('#linked-list-append').click()

    document.querySelector('#linked-list-index').value = '1'
    document.querySelector('#linked-list-target').value = '20'
    document.querySelector('#linked-list-reset').click()

    assert.deepEqual(controller.getValues(), [10, 20, 30])
    assert.equal(document.querySelector('#linked-list-value').value, '')
    assert.equal(document.querySelector('#linked-list-index').value, '')
    assert.equal(document.querySelector('#linked-list-target').value, '')
  } finally {
    window.happyDOM.abort()
  }
})
