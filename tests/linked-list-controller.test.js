import { readFileSync } from 'node:fs'

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
    window.happyDOM.close()
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
    window.happyDOM.close()
  }
})

test('thêm phần tử vào đầu danh sách', () => {
  const { window, document, controller } = createVisualizer()

  try {
    document.querySelector('#linked-list-value').value = '5'
    document.querySelector('#linked-list-prepend').click()

    assert.deepEqual(controller.getValues(), [5, 10, 20, 30])
  } finally {
    window.happyDOM.close()
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
    window.happyDOM.close()
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
    window.happyDOM.close()
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
    window.happyDOM.close()
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
    window.happyDOM.close()
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
    window.happyDOM.close()
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
    window.happyDOM.close()
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
    window.happyDOM.close()
  }
})

test('xóa khi danh sách đã rỗng hiện lỗi "đang rỗng"; xóa vị trí sai khi chưa rỗng giữ thông báo cũ', () => {
  const { window, document, controller } = createVisualizer()

  try {
    const status = document.querySelector('#linked-list-status')
    const removeAt = (index) => {
      document.querySelector('#linked-list-index').value = String(index)
      document.querySelector('#linked-list-remove').click()
    }

    removeAt(99)
    assert.match(status.textContent, /Vị trí không hợp lệ/)
    assert.ok(!/rỗng/.test(status.textContent), 'danh sách chưa rỗng không được ghi "rỗng"')

    for (let i = 0; i < 3; i++) removeAt(0)
    assert.deepEqual(controller.getValues(), [])

    removeAt(0)
    assert.match(status.textContent, /đang rỗng/)
    assert.deepEqual(controller.getValues(), [])
  } finally {
    window.happyDOM.close()
  }
})

test('EDU3A2 linked-list: copy từ template thật đúng phạm vi API', async () => {
  const window = new Window()
  try {
    window.document.body.innerHTML = readFileSync(new URL('../public/templates/app.html', import.meta.url), 'utf8')
    const section = window.document.querySelector('#linked-list-section')
    assert.ok(section, 'module section tồn tại')
    const paragraphs = Array.from(section.querySelectorAll('p'), node => node.textContent.trim())
    for (const expected of [
  "HEAD trỏ nút đầu, next cuối là NULL; index từ 0. Thêm, chèn, xóa đổi list tại chỗ; trả mảng mới O(n), chưa tính DOM.",
  "Nối đầu O(1), tìm cuối O(n); cả hai API trả toArray nên O(n).",
  "Chèn số hữu hạn tại index nguyên 0..size; API O(n) gồm toArray.",
  "Xóa index nguyên 0..size−1; trả giá trị đã xóa và mảng mới, O(n).",
  "Duyệt next, so sánh ===; trả index khớp đầu hoặc −1, không đổi list. Tốt nhất O(1), xấu nhất O(n)."
]) {
      assert.ok(paragraphs.includes(expected), 'EDU3A2 linked-list copy: ' + expected)
    }
    for (const other of window.document.querySelectorAll('section[id]')) {
      if (other !== section) {
        assert.equal(other.textContent.includes("HEAD trỏ nút đầu, next cuối là NULL; index từ 0. Thêm, chèn, xóa đổi list tại chỗ; trả mảng mới O(n), chưa tính DOM."), false, 'copy không rò sang module khác')
      }
    }
  } finally {
    await window.happyDOM.close()
  }
})
