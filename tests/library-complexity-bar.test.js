import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { initNavigation } from '../src/navigation.js'
import { initLibraryFilter } from '../src/library-filter.js'

// R5c commit 3: thanh 5 đoạn "tốc độ tăng độ phức tạp" ở thẻ thuật toán (Spec mục 9): trang trí (aria-hidden), LUÔN đi kèm ký hiệu O(...).
// Số đoạn đầy là bậc của O(...) thời gian xấu nhất trong thang so sánh các lớp thường gặp; bảng bậc dưới đây viết độc lập với template.
// Thẻ không có dữ liệu thật (BFS/DFS theo D12, thẻ cấu trúc theo quyết định 3, thẻ Dashboard) KHÔNG có thanh.

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

const LEVEL_OF = { 'O(1)': 1, 'O(log n)': 2, 'O(n)': 3, 'O(n log n)': 4, 'O(n²)': 5 }
const squash = (text) => text.replace(/\s+/g, ' ').trim()

function withTemplate(run) {
  const window = new Window()

  try {
    window.document.body.innerHTML = template
    run(window.document)
  } finally {
    window.happyDOM.close()
  }
}

const EXPECTED = [
  ['.algorithm-card[data-algorithm="bubble"]', 'O(n²)', 5],
  ['.algorithm-card[data-algorithm="selection"]', 'O(n²)', 5],
  ['.algorithm-card[data-algorithm="insertion"]', 'O(n²)', 5],
  ['[data-search-algorithm="linear"]', 'O(n)', 3],
  ['[data-search-algorithm="binary"]', 'O(log n)', 2],
]

for (const [selector, notation, level] of EXPECTED) {
  test(`thẻ ${selector}: thanh aria-hidden 5 đoạn, ${level} đoạn đầy khớp bậc của ${notation} (thời gian xấu nhất)`, () => {
    withTemplate((document) => {
      const card = document.querySelector(`#algorithm-panel ${selector}`)
      const bar = card.querySelector('.card-footer .complexity-bar')
      const time = squash(card.querySelector('.card-footer .card-metric code').textContent)

      assert.equal(time, notation, 'tiền đề: ký hiệu thời gian của thẻ')
      assert.equal(LEVEL_OF[time], level, 'bảng bậc độc lập')
      assert.ok(bar !== null, 'thiếu thanh 5 đoạn')
      assert.equal(bar.getAttribute('aria-hidden'), 'true')
      assert.equal(bar.children.length, 5)
      assert.equal(bar.querySelectorAll(':scope > .on').length, level, 'số đoạn đầy')
      assert.deepEqual([...bar.children].map((segment) => segment.classList.contains('on')), [1, 2, 3, 4, 5].map((index) => index <= level), 'đoạn đầy liền nhau từ trái')
      assert.equal(bar.textContent.trim(), '', 'thanh là trang trí, không có chữ')
    })
  })
}

test('chỉ có đúng 5 thanh trong cả template: không ở BFS/DFS, thẻ cấu trúc hay thẻ nổi bật của Dashboard', () => {
  withTemplate((document) => {
    assert.equal(document.querySelectorAll('.complexity-bar').length, 5)
    assert.equal(document.querySelectorAll('#graph-algorithm-library .complexity-bar').length, 0)
    assert.equal(document.querySelectorAll('#structure-panel .complexity-bar').length, 0)
    assert.equal(document.querySelectorAll('#dashboard-section .complexity-bar').length, 0)
  })
})

test('ghi chú giải thích thanh 5 đoạn: nằm trong thanh lọc, nhắc thang O(...) và luôn đọc cùng ký hiệu O', () => {
  withTemplate((document) => {
    const legend = document.querySelector('.library-filters .library-legend')

    assert.ok(legend !== null, 'thiếu .library-legend trong .library-filters')
    assert.equal(legend.dataset.tab, 'algorithms')

    const text = squash(legend.textContent)

    for (const notation of Object.keys(LEVEL_OF)) assert.ok(text.includes(notation), `ghi chú phải nêu ${notation}`)
    assert.ok(/đọc cùng ký hiệu O/.test(text))
    assert.ok(/thẻ Sắp xếp và Tìm kiếm/.test(text), 'ghi chú nói đúng thẻ nào có thanh')
    assert.ok(!/ở mỗi thẻ/.test(text), 'BFS/DFS không có thanh nên không được viết "ở mỗi thẻ"')
  })
})

test('ghi chú chỉ hiện ở tab Giải thuật (module lọc điều khiển theo trang), cùng cơ chế nhóm chip', () => {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    initNavigation(document)
    initLibraryFilter(document)

    const legend = document.querySelector('.library-legend')

    document.querySelector('.nav-item[data-page="structures"]').click()
    assert.equal(legend.hidden, true, 'tab Cấu trúc không có thanh 5 đoạn')

    document.querySelector('.library-tab[data-library-tab="algorithms"]').click()
    assert.equal(legend.hidden, false, 'tab Giải thuật')

    document.querySelector('.library-tab[data-library-tab="structures"]').click()
    assert.equal(legend.hidden, true)
  } finally {
    window.happyDOM.close()
  }
})
