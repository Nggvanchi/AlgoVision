import { readFileSync } from 'node:fs'

import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { initStack } from '../src/stack.js'

function createStackDOM() {
  const window = new Window()
  const { document } = window

  document.body.innerHTML = `
    <div id="stack-visualizer"></div>

    <input id="stack-value" type="number" />

    <button id="stack-push">Push</button>
    <button id="stack-pop">Pop</button>
    <button id="stack-peek">Peek</button>
    <button id="stack-reset">Reset</button>

    <p id="stack-status" role="status"></p>
  `

  return { window, document }
}

test('khởi tạo Stack controller với dữ liệu mặc định', () => {
  const { window, document } = createStackDOM()

  try {
    const controller = initStack(document)

    assert.deepEqual(controller.getStack(), [10, 20, 30])
    assert.equal(
      document.querySelectorAll('.stack-cell').length,
      3,
    )
    assert.match(
      document.querySelector('#stack-status').textContent,
      /sẵn sàng/,
    )
  } finally {
    window.happyDOM.close()
  }
})

test('Push thêm giá trị vào đỉnh Stack', () => {
  const { window, document } = createStackDOM()

  try {
    const controller = initStack(document)
    document.querySelector('#stack-value').value = '40'

    document.querySelector('#stack-push').click()

    assert.deepEqual(controller.getStack(), [10, 20, 30, 40])
    assert.equal(
      document.querySelector('.stack-top-label').previousSibling.textContent,
      '40',
    )
  } finally {
    window.happyDOM.close()
  }
})

test('Pop xóa phần tử trên đỉnh Stack', () => {
  const { window, document } = createStackDOM()

  try {
    const controller = initStack(document)

    document.querySelector('#stack-pop').click()

    assert.deepEqual(controller.getStack(), [10, 20])
    assert.equal(
      document.querySelectorAll('.stack-cell').length,
      2,
    )
    assert.match(
      document.querySelector('#stack-status').textContent,
      /30/,
    )
  } finally {
    window.happyDOM.close()
  }
})

test('Peek không làm thay đổi Stack', () => {
  const { window, document } = createStackDOM()

  try {
    const controller = initStack(document)

    document.querySelector('#stack-peek').click()

    assert.deepEqual(controller.getStack(), [10, 20, 30])
    assert.match(
      document.querySelector('#stack-status').textContent,
      /30/,
    )
  } finally {
    window.happyDOM.close()
  }
})

test('Reset khôi phục Stack ban đầu', () => {
  const { window, document } = createStackDOM()

  try {
    const controller = initStack(document)

    document.querySelector('#stack-pop').click()
    document.querySelector('#stack-reset').click()

    assert.deepEqual(controller.getStack(), [10, 20, 30])
    assert.equal(
      document.querySelectorAll('.stack-cell').length,
      3,
    )
  } finally {
    window.happyDOM.close()
  }
})

test('hiển thị lỗi khi Push mà không nhập giá trị', () => {
  const { window, document } = createStackDOM()

  try {
    const controller = initStack(document)

    document.querySelector('#stack-value').value = ''
    document.querySelector('#stack-push').click()

    assert.deepEqual(controller.getStack(), [10, 20, 30])
    assert.match(
      document.querySelector('#stack-status').textContent,
      /Vui lòng nhập giá trị/,
    )
  } finally {
    window.happyDOM.close()
  }
})

test('hiển thị thông báo khi Pop Stack rỗng', () => {
  const { window, document } = createStackDOM()

  try {
    const controller = initStack(document)

    for (let i = 0; i < 3; i++) {
      document.querySelector('#stack-pop').click()
    }

    assert.deepEqual(controller.getStack(), [])
    assert.equal(
      document.querySelector('.stack-empty').textContent,
      'Stack đang rỗng.',
    )

    document.querySelector('#stack-pop').click()

    assert.deepEqual(controller.getStack(), [])
    assert.match(
      document.querySelector('#stack-status').textContent,
      /Stack đang rỗng/,
    )
  } finally {
    window.happyDOM.close()
  }
})

test('EDU3A2 stack: copy từ template thật đúng phạm vi API', async () => {
  const window = new Window()
  try {
    window.document.body.innerHTML = readFileSync(new URL('../public/templates/app.html', import.meta.url), 'utf8')
    const section = window.document.querySelector('#stack-section')
    assert.ok(section, 'module section tồn tại')
    const paragraphs = Array.from(section.querySelectorAll('p'), node => node.textContent.trim())
    for (const expected of [
  "TOP ở cuối mảng. Push/Pop tạo bản sao; Peek chỉ đọc. Toàn API O(n) do kiểm dữ liệu; chưa tính DOM.",
  "Lấy TOP theo LIFO; Stack rỗng báo lỗi.",
  "Đọc TOP O(1), không xóa; Stack rỗng báo lỗi."
]) {
      assert.ok(paragraphs.includes(expected), 'EDU3A2 stack copy: ' + expected)
    }
    for (const other of window.document.querySelectorAll('section[id]')) {
      if (other !== section) {
        assert.equal(other.textContent.includes("TOP ở cuối mảng. Push/Pop tạo bản sao; Peek chỉ đọc. Toàn API O(n) do kiểm dữ liệu; chưa tính DOM."), false, 'copy không rò sang module khác')
      }
    }
  } finally {
    await window.happyDOM.close()
  }
})
