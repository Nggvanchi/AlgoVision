import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

// R5c commit 2: badge độ khó theo Spec mục 6 ("ký hiệu mono + chữ") và mục 3 (trạng thái không chỉ bằng màu):
// ● cho CƠ BẢN (easy), ◐ cho TRUNG BÌNH (medium); ○ (Khó) CHƯA dùng vì dữ liệu của app không có mức Khó (không thêm dữ liệu giả).
// Ký hiệu là trang trí (aria-hidden); trình đọc màn hình đọc "Độ khó: <chữ>" nhờ chữ ẩn thị giác. BFS/DFS và thẻ cấu trúc không có độ khó.

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

function withTemplate(run) {
  const window = new Window()

  try {
    window.document.body.innerHTML = template
    run(window.document)
  } finally {
    window.happyDOM.close()
  }
}

const SYMBOLS = { easy: '●', medium: '◐' }
const LABELS = { easy: 'CƠ BẢN', medium: 'TRUNG BÌNH' }
const squash = (text) => text.replace(/\s+/g, ' ').trim()

// Chữ mà trình đọc màn hình đọc: bỏ phần aria-hidden (ký hiệu), giữ chữ ẩn thị giác.
function accessibleText(badge) {
  const copy = badge.cloneNode(true)

  copy.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove())

  return squash(copy.textContent)
}

test('có đúng 7 badge độ khó: 5 thẻ thư viện (3 Sắp xếp, 2 Tìm kiếm) và 2 thẻ nổi bật của Dashboard', () => {
  withTemplate((document) => {
    assert.equal(document.querySelectorAll('#algorithm-panel .difficulty').length, 5)
    assert.equal(document.querySelectorAll('#dashboard-section .difficulty').length, 2)
    assert.equal(document.querySelectorAll('.difficulty').length, 7)
  })
})

test('mọi badge: chữ ẩn thị giác "Độ khó:" đứng đầu, ký hiệu aria-hidden đúng mức, chữ hiển thị giữ nguyên, tên truy cập "Độ khó: <chữ>"', () => {
  withTemplate((document) => {
    for (const badge of document.querySelectorAll('.difficulty')) {
      const level = badge.classList.contains('easy') ? 'easy' : 'medium'
      const hidden = badge.querySelector('.visually-hidden')
      const symbol = badge.querySelector('.difficulty-symbol')

      assert.ok(badge.classList.contains('easy') || badge.classList.contains('medium'), `mức không hợp lệ: ${badge.className}`)
      assert.ok(hidden !== null && squash(hidden.textContent) === 'Độ khó:', `${level}: thiếu chữ ẩn "Độ khó:"`)
      assert.ok(badge.firstElementChild === hidden, 'chữ ẩn đứng đầu badge')
      assert.ok(symbol !== null && symbol.getAttribute('aria-hidden') === 'true', `${level}: ký hiệu phải aria-hidden`)
      assert.equal(symbol.textContent.trim(), SYMBOLS[level])
      assert.equal(accessibleText(badge), `Độ khó: ${LABELS[level]}`)

      const visible = badge.cloneNode(true)

      visible.querySelectorAll('.visually-hidden, .difficulty-symbol').forEach((node) => node.remove())
      assert.equal(squash(visible.textContent), LABELS[level], 'chữ hiển thị của badge giữ nguyên')
    }
  })
})

test('mức độ khó từng thẻ giữ đúng dữ liệu cũ: Bubble, Selection, Linear = CƠ BẢN; Insertion, Binary = TRUNG BÌNH', () => {
  withTemplate((document) => {
    const levelOf = (selector) => ['easy', 'medium'].find((level) => document.querySelector(`${selector} .difficulty`).classList.contains(level))

    assert.equal(levelOf('.algorithm-card[data-algorithm="bubble"]'), 'easy')
    assert.equal(levelOf('.algorithm-card[data-algorithm="selection"]'), 'easy')
    assert.equal(levelOf('.algorithm-card[data-algorithm="insertion"]'), 'medium')
    assert.equal(levelOf('[data-search-algorithm="linear"]'), 'easy')
    assert.equal(levelOf('[data-search-algorithm="binary"]'), 'medium')
  })
})

test('không có ký hiệu "○ Khó" giả: dữ liệu không có mức Khó; BFS, DFS và thẻ cấu trúc không có badge độ khó', () => {
  withTemplate((document) => {
    assert.ok(!document.querySelector('.difficulty').parentElement.innerHTML.includes('○'), 'không dùng ○ khi chưa có dữ liệu Khó')
    assert.equal([...document.querySelectorAll('.difficulty')].filter((badge) => badge.textContent.includes('○')).length, 0)
    assert.equal(document.querySelectorAll('#graph-algorithm-library .difficulty').length, 0)
    assert.equal(document.querySelectorAll('#structure-panel .difficulty').length, 0)
  })
})
