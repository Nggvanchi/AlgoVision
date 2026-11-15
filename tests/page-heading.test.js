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
      ['Searching (chi tiết)', '.nav-item[data-page=searching]', '[data-search-algorithm=binary]'],
      ...['array', 'queue', 'linked-list', 'bst', 'hash-table', 'graph'].map(id => [id, '.nav-item[data-page=structures]', '[data-structure-target=' + id + ']']),
    ]

    for (const [label, nav, card] of pages) {
      openPage(document, window, nav, card)
      assert.equal(heading.hidden, card !== null, `${label}: chỉ thư viện riêng hiện khối giới thiệu`)
      assert.equal(heading.querySelector('h2').textContent.trim(), 'Hiểu từng bước, nắm chắc bản chất.')
      const text = heading.textContent.replace(/\s+/g, ' ').trim()
      assert.ok(text.includes('HỌC QUA TRỰC QUAN'))
      assert.ok(text.includes('Quan sát cách dữ liệu thay đổi qua từng thao tác và khám phá logic phía sau các thuật toán và cấu trúc dữ liệu.'))
      assert.ok(!OLD_HEADING.test(text), `${label}: còn tiêu đề cũ: "${text}"`)
      assert.ok(!OLD_EYEBROW.test(text), `${label}: còn eyebrow cũ: "${text}"`)
      assert.ok(/cấu trúc dữ liệu/i.test(text), `${label}: tiêu đề phải bao cả cấu trúc dữ liệu: "${text}"`)
    }
  } finally {
    window.happyDOM.close()
  }
})

test('khối giới thiệu ẩn ở Dashboard và thư viện Giải thuật, hiện khi về Tất cả cấu trúc', () => {
  const window = new Window()
  const { document } = window
  try {
    document.body.innerHTML = template
    initNavigation(document)
    const heading = document.querySelector('.page-heading')
    const original = heading.innerHTML
    assert.equal(heading.hidden, true)
    document.querySelector('[data-dashboard-target="algorithms"]').click()
    assert.equal(heading.hidden, true, 'thư viện Giải thuật tổng hợp phải ẩn giới thiệu')
    const algorithmHeading = document.querySelector('#algorithm-library-heading')
    assert.ok(algorithmHeading !== null && !algorithmHeading.hidden && !algorithmHeading.hasAttribute('aria-hidden'), 'Giải thuật giữ h2 riêng trong cây trợ năng')
    assert.equal(algorithmHeading.textContent.trim(), 'Giải thuật')
    document.querySelector('[data-library-tab="structures"]').click()
    assert.equal(heading.hidden, false)
    assert.equal(algorithmHeading.hidden, true, 'không thêm h2 Giải thuật vào thư viện cấu trúc')
    document.querySelector('.nav-item[data-page="dashboard"]').click()
    assert.equal(heading.hidden, true)
    assert.equal(heading.innerHTML, original, 'không sửa/xóa nội dung giới thiệu')
  } finally { window.happyDOM.close() }
})

test('h2 Giải thuật đứng ngay trước panel ba section và chỉ hiện đúng thư viện gốc qua Quay lại', () => {
  const window = new Window()
  const { document } = window
  try {
    document.body.innerHTML = template
    initNavigation(document)
    const heading = document.querySelector('#algorithm-library-heading')
    const panel = document.querySelector('#algorithm-panel')
    assert.ok(heading !== null && panel !== null)
    assert.ok(panel.previousElementSibling === heading, 'h2 Giải thuật phải đứng ngay trước algorithm-panel')
    assert.ok(heading.parentElement === panel.parentElement, 'h2 không nằm trong panel')
    assert.deepEqual([...panel.children].map(n => n.id), ['sorting-algorithm-library', 'search-algorithm-library', 'graph-algorithm-library'])
    const events = []
    document.addEventListener('algovision:viewchange', event => {
      events.push({ page: event.detail.page, hidden: heading.hidden })
    })
    for (const page of ['sorting', 'searching', 'structures', 'dashboard']) {
      document.querySelector('.nav-item[data-page="' + page + '"]').click()
      assert.equal(heading.hidden, true, page + ': không hiện heading Giải thuật')
    }
    for (const [card, back] of [
      ['[data-algorithm="bubble"]', '[data-back-to-sorting-algorithms]'],
      ['[data-search-algorithm="binary"]', '[data-back-to-search-algorithms]'],
      ['#graph-algorithm-library [data-dashboard-open="structure:graph:bfs"]', '#graph-section [data-back-to-structures]'],
    ]) {
      document.querySelector('.nav-item[data-page="dashboard"]').click()
      document.querySelector('[data-dashboard-target="algorithms"]').click()
      assert.equal(heading.hidden, false)
      assert.ok(!heading.hasAttribute('aria-hidden'))
      document.querySelector(card).click()
      assert.equal(heading.hidden, true, 'chi tiết phải ẩn heading thư viện')
      document.querySelector(back).click()
      assert.equal(heading.hidden, false, 'Quay lại thư viện Giải thuật khôi phục h2')
    }
    assert.ok(events.every(event => event.hidden === (event.page !== 'algorithms')), 'hidden đã đồng bộ trước mọi viewchange')
  } finally { window.happyDOM.close() }
})
