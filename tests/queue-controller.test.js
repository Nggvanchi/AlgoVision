
import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { initQueue } from '../src/queue.js'

function createQueueDOM() {
  const window = new Window()
  const { document } = window

  document.body.innerHTML = `
    <div id="queue-visualizer"></div>

    <input id="queue-value" type="number" />

    <button id="queue-enqueue">Enqueue</button>
    <button id="queue-dequeue">Dequeue</button>
    <button id="queue-front">Front</button>
    <button id="queue-reset">Reset</button>

    <p id="queue-status" role="status"></p>
  `

  return { window, document }
}

test('khởi tạo Queue controller với dữ liệu mặc định', () => {
  const { window, document } = createQueueDOM()

  try {
    const controller = initQueue(document)

    assert.deepEqual(controller.getQueue(), [10, 20, 30])
    assert.equal(
      document.querySelectorAll('.queue-cell').length,
      3,
    )
    assert.equal(
      document.querySelector('.queue-front-label').textContent,
      'FRONT',
    )
    assert.equal(
      document.querySelector('.queue-rear-label').textContent,
      'REAR',
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('Enqueue thêm phần tử vào cuối Queue', () => {
  const { window, document } = createQueueDOM()

  try {
    const controller = initQueue(document)
    document.querySelector('#queue-value').value = '40'

    document.querySelector('#queue-enqueue').click()

    assert.deepEqual(controller.getQueue(), [10, 20, 30, 40])
    assert.equal(
      document.querySelector('.queue-rear-label')
        .previousSibling.textContent,
      '40',
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('Dequeue loại bỏ phần tử đầu tiên', () => {
  const { window, document } = createQueueDOM()

  try {
    const controller = initQueue(document)

    document.querySelector('#queue-dequeue').click()

    assert.deepEqual(controller.getQueue(), [20, 30])
    assert.equal(
      document.querySelector('.queue-front-label')
        .previousSibling.textContent,
      '20',
    )
    assert.match(
      document.querySelector('#queue-status').textContent,
      /10/,
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('Front không làm thay đổi Queue', () => {
  const { window, document } = createQueueDOM()

  try {
    const controller = initQueue(document)

    document.querySelector('#queue-front').click()

    assert.deepEqual(controller.getQueue(), [10, 20, 30])
    assert.match(
      document.querySelector('#queue-status').textContent,
      /10/,
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('Reset khôi phục Queue ban đầu', () => {
  const { window, document } = createQueueDOM()

  try {
    const controller = initQueue(document)

    document.querySelector('#queue-dequeue').click()
    document.querySelector('#queue-reset').click()

    assert.deepEqual(controller.getQueue(), [10, 20, 30])
    assert.equal(
      document.querySelectorAll('.queue-cell').length,
      3,
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('hiển thị lỗi khi Enqueue không có giá trị', () => {
  const { window, document } = createQueueDOM()

  try {
    const controller = initQueue(document)
    document.querySelector('#queue-value').value = ''

    document.querySelector('#queue-enqueue').click()

    assert.deepEqual(controller.getQueue(), [10, 20, 30])
    assert.equal(
      document.querySelector('#queue-status').classList.contains('is-error'),
      true,
    )
  } finally {
    window.happyDOM.abort()
  }
})

test('thông báo khi Dequeue Queue rỗng', () => {
  const { window, document } = createQueueDOM()

  try {
    const controller = initQueue(document)

    for (let i = 0; i < 3; i++) {
      document.querySelector('#queue-dequeue').click()
    }

    assert.deepEqual(controller.getQueue(), [])
    assert.equal(
      document.querySelector('.queue-empty').textContent,
      'Queue đang rỗng.',
    )

    document.querySelector('#queue-dequeue').click()

    assert.equal(
      document.querySelector('#queue-status').classList.contains('is-error'),
      true,
    )
  } finally {
    window.happyDOM.abort()
  }
})
