
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
    window.happyDOM.abort()
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
    window.happyDOM.abort()
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
    window.happyDOM.abort()
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
    window.happyDOM.abort()
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
    window.happyDOM.abort()
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
    window.happyDOM.abort()
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
    window.happyDOM.abort()
  }
})
