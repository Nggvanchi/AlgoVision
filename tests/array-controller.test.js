
import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'

import { initArray } from '../src/array.js'

function createArrayDOM() {
  const window = new Window()
  const { document } = window

  document.body.innerHTML = `
    <div id="array-visualizer"></div>
    <input id="array-value" />
    <input id="array-index" />
    <input id="array-target" />
    <input id="array-remove-index" />
    <button id="array-append"></button>
    <button id="array-insert"></button>
    <button id="array-remove"></button>
    <button id="array-find"></button>
    <button id="array-reset"></button>
    <p id="array-status"></p>
  `

  return { window, document }
}

test('khởi tạo Array Visualizer với mảng mặc định', () => {
  const { window, document } = createArrayDOM()

  try {
    const controller = initArray({ document })

    assert.deepEqual(controller.getNumbers(), [10, 20, 30, 40, 50])
    assert.equal(
      document.querySelectorAll('.array-cell').length,
      5,
    )
    assert.equal(
      document.querySelector('.array-cell-value').textContent,
      '10',
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('thêm phần tử vào cuối mảng', () => {
  const { window, document } = createArrayDOM()

  try {
    const controller = initArray({ document })

    document.querySelector('#array-value').value = '60'
    document.querySelector('#array-append').click()

    assert.deepEqual(
      controller.getNumbers(),
      [10, 20, 30, 40, 50, 60],
    )
    assert.equal(
      document.querySelectorAll('.array-cell').length,
      6,
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('chèn phần tử vào index được chọn', () => {
  const { window, document } = createArrayDOM()

  try {
    const controller = initArray({ document })

    document.querySelector('#array-value').value = '25'
    document.querySelector('#array-index').value = '2'
    document.querySelector('#array-insert').click()

    assert.deepEqual(
      controller.getNumbers(),
      [10, 20, 25, 30, 40, 50],
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('xóa phần tử theo index', () => {
  const { window, document } = createArrayDOM()

  try {
    const controller = initArray({ document })

    document.querySelector('#array-remove-index').value = '1'
    document.querySelector('#array-remove').click()

    assert.deepEqual(
      controller.getNumbers(),
      [10, 30, 40, 50],
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('tìm kiếm giá trị có trong mảng', () => {
  const { window, document } = createArrayDOM()

  try {
    initArray({ document })

    document.querySelector('#array-target').value = '30'
    document.querySelector('#array-find').click()

    assert.match(
      document.querySelector('#array-status').textContent,
      /index 2/,
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('hiển thị lỗi khi index không hợp lệ', () => {
  const { window, document } = createArrayDOM()

  try {
    initArray({ document })

    document.querySelector('#array-index').value = '-1'
    document.querySelector('#array-remove').click()

    assert.equal(
      document.querySelector('#array-status').dataset.state,
      'error',
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('reset khôi phục mảng ban đầu', () => {
  const { window, document } = createArrayDOM()

  try {
    const controller = initArray({ document })

    document.querySelector('#array-value').value = '60'
    document.querySelector('#array-append').click()
    document.querySelector('#array-reset').click()

    assert.deepEqual(
      controller.getNumbers(),
      [10, 20, 30, 40, 50],
    )
  } finally {
    window.happyDOM.abort()
  }
})
