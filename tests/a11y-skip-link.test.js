import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'

import { bootApp } from '../src/bootstrap.js'
import { SCREENS, isShown, withFullApp } from './helpers/app-dom.js'

// Skip link (R14): mỗi lần Tab đều đi qua 4 nút điều hướng của thanh bên trước khi tới nội dung. Liên kết "bỏ qua" là
// phần tử focus đầu tiên và nhảy tới <main id="main-content" tabindex="-1">. Chỉ dùng neo thuần, không JS.
const FOCUSABLE = 'a[href], button, select, input, textarea, [tabindex]:not([tabindex="-1"])'

test('skip link là phần tử focus được đầu tiên, đứng trước thanh điều hướng và trỏ tới #main-content', async () => {
  await withFullApp(({ document }) => {
    const links = document.querySelectorAll('.skip-link')

    assert.equal(links.length, 1, 'đúng một skip link')

    const link = links[0]

    assert.equal(link.tagName, 'A')
    assert.equal(link.getAttribute('href'), '#main-content')
    assert.ok(link.textContent.trim().length > 0, 'skip link có chữ')
    assert.ok(document.querySelector(FOCUSABLE) === link, 'phần tử focus được đầu tiên trong DOM phải là skip link')

    const order = [...document.querySelectorAll('*')]

    assert.ok(order.indexOf(link) < order.indexOf(document.querySelector('.sidebar')), 'skip link đứng trước .sidebar')
    assert.ok(order.indexOf(link) < order.indexOf(document.querySelector('.nav-item')), 'skip link đứng trước mục điều hướng đầu tiên')
  })
})

test('đích #main-content là <main> duy nhất và nhận focus bằng mã (tabindex="-1")', async () => {
  await withFullApp(({ document }) => {
    const targets = document.querySelectorAll('#main-content')

    assert.equal(targets.length, 1, 'đúng một #main-content')

    const target = targets[0]

    assert.equal(target.tagName, 'MAIN')
    assert.equal(target.getAttribute('tabindex'), '-1')
    assert.equal(document.querySelectorAll('main').length, 1, 'chỉ một landmark main')

    target.focus()
    assert.ok(document.activeElement === target, 'focus() đưa focus vào #main-content')
  })
})

test('đích luôn tồn tại và hiển thị trên mọi màn hình, kể cả sau khi chuyển trang liên tục', async () => {
  await withFullApp(({ document }) => {
    const target = document.querySelector('#main-content')

    assert.ok(target !== null, 'thiếu #main-content')

    // Mở từng màn hình, rồi đảo thứ tự để bắt lỗi trạng thái hidden còn sót lại từ màn hình trước.
    for (const screen of [...SCREENS, ...[...SCREENS].reverse()]) {
      screen.open(document)

      assert.ok(document.querySelector('#main-content') === target, `${screen.name}: #main-content vẫn là phần tử cũ`)
      assert.ok(isShown(target), `${screen.name}: #main-content (hoặc tổ tiên) bị hidden`)
      assert.equal(target.hidden, false, `${screen.name}: #main-content.hidden`)
    }
  })
})

test('màn hình lỗi tải template không có skip link (không có điều hướng để bỏ qua)', async () => {
  const window = new Window()
  const { document } = window
  const previousDocument = globalThis.document

  globalThis.document = document

  try {
    document.body.innerHTML = '<div id="app"></div>'

    const root = document.querySelector('#app')

    await bootApp(root, {
      fetchImpl: () => Promise.reject(new Error('mất mạng')),
      start: () => assert.fail('không được gọi start khi tải lỗi'),
    })

    assert.ok(root.querySelector('.load-error') !== null, 'màn hình lỗi đã hiện')
    assert.ok(root.querySelector('.skip-link') === null, 'màn hình lỗi không có skip link')
  } finally {
    window.happyDOM.close()

    if (previousDocument === undefined) {
      delete globalThis.document
    } else {
      globalThis.document = previousDocument
    }
  }
})
