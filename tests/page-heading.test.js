import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { initNavigation } from '../src/navigation.js'

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

// Tiêu đề trang (.page-heading) là một khối tĩnh dùng chung cho Sắp xếp, Tìm kiếm và Cấu trúc dữ liệu, nên chữ phải đúng
// với cả ba: không được nói riêng về "thuật toán" khi đang ở trang cấu trúc dữ liệu.
const OLD_HEADING = /Hiểu thuật toán qua từng bước/
const OLD_EYEBROW = /HỌC THUẬT TOÁN TRỰC QUAN/

function openPage(document, window, navSelector, cardSelector) {
  document.querySelector(navSelector).dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  if (cardSelector) document.querySelector(cardSelector).dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
}

test('tiêu đề trang không còn "Hiểu thuật toán qua từng bước" ở Sắp xếp, Tìm kiếm và Cấu trúc dữ liệu', () => {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    initNavigation(document)
    const heading = document.querySelector('.page-heading')
    const pages = [
      ['Sắp xếp', '.nav-item[data-page=sorting]', null],
      ['Sắp xếp (chi tiết)', '.nav-item[data-page=sorting]', '.algorithm-card[data-algorithm=bubble]'],
      ['Tìm kiếm', '.nav-item[data-page=searching]', null],
      ['Cấu trúc dữ liệu', '.nav-item[data-page=structures]', null],
      ['Stack (chi tiết)', '.nav-item[data-page=structures]', '[data-structure-target=stack]'],
    ]

    for (const [label, nav, card] of pages) {
      openPage(document, window, nav, card)
      assert.equal(heading.hidden, false, `${label}: tiêu đề trang phải hiện`)
      const text = heading.textContent.replace(/\s+/g, ' ').trim()
      assert.ok(!OLD_HEADING.test(text), `${label}: còn tiêu đề cũ: "${text}"`)
      assert.ok(!OLD_EYEBROW.test(text), `${label}: còn eyebrow cũ: "${text}"`)
      assert.ok(/cấu trúc dữ liệu/i.test(text), `${label}: tiêu đề phải bao cả cấu trúc dữ liệu: "${text}"`)
    }
  } finally {
    window.happyDOM.close()
  }
})
