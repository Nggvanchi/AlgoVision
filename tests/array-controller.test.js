import { readFileSync } from 'node:fs'

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
    window.happyDOM.close()
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
    window.happyDOM.close()
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
    window.happyDOM.close()
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
    window.happyDOM.close()
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
    window.happyDOM.close()
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
    window.happyDOM.close()
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
    window.happyDOM.close()
  }
})

test('xóa khi mảng đã rỗng hiện lỗi "đang rỗng"; xóa index sai khi chưa rỗng giữ thông báo cũ', () => {
  const { window, document } = createArrayDOM()

  try {
    const controller = initArray({ document })
    const status = document.querySelector('#array-status')
    const removeAt = (index) => {
      document.querySelector('#array-remove-index').value = String(index)
      document.querySelector('#array-remove').click()
    }

    removeAt(99)
    assert.equal(status.dataset.state, 'error')
    assert.match(status.textContent, /Index nằm ngoài phạm vi cho phép/)
    assert.ok(!/rỗng/.test(status.textContent), 'mảng chưa rỗng không được ghi "rỗng"')

    for (let i = 0; i < 5; i++) removeAt(0)
    assert.deepEqual(controller.getNumbers(), [])

    removeAt(0)
    assert.equal(status.dataset.state, 'error')
    assert.match(status.textContent, /đang rỗng/)
    assert.deepEqual(controller.getNumbers(), [])
  } finally {
    window.happyDOM.close()
  }
})

test('EDU3A2 array: copy từ template thật đúng phạm vi API', async () => {
  const window = new Window()
  try {
    window.document.body.innerHTML = readFileSync(new URL('../public/templates/app.html', import.meta.url), 'utf8')
    const section = window.document.querySelector('#array-section')
    assert.ok(section, 'module section tồn tại')
    const paragraphs = Array.from(section.querySelectorAll('p'), node => node.textContent.trim())
    for (const expected of [
  "Index từ 0. Thêm, chèn, xóa tạo mảng mới O(n). Tìm: tốt nhất O(1), xấu nhất O(n); chưa tính DOM.",
  "Thêm số hữu hạn vào cuối; giữ nguyên mảng đầu vào.",
  "Dùng giá trị ở ô Giá trị; chèn tại index nguyên từ 0 đến n.",
  "Xóa index nguyên từ 0 đến n−1; mảng rỗng báo lỗi.",
  "So sánh ===; trả index khớp đầu hoặc −1, không cần sắp xếp."
]) {
      assert.ok(paragraphs.includes(expected), 'EDU3A2 array copy: ' + expected)
    }
    for (const other of window.document.querySelectorAll('section[id]')) {
      if (other !== section) {
        assert.equal(other.textContent.includes("Index từ 0. Thêm, chèn, xóa tạo mảng mới O(n). Tìm: tốt nhất O(1), xấu nhất O(n); chưa tính DOM."), false, 'copy không rò sang module khác')
      }
    }
  } finally {
    await window.happyDOM.close()
  }
})
