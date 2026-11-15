import test from 'node:test'
import assert from 'node:assert/strict'
import { withFullApp } from './helpers/app-dom.js'

// Hợp đồng R6b được chuyển sang dropdown v2-3d.1; giữ nội dung và nhãn truy cập.
const SCREENS = [
  { name: 'Sắp xếp', section: '#sorting-section', live: '#simulation-message', pseudocode: '#learning-pseudocode', complexity: '.complexity-panel', knowledge: '#sorting-learning' },
  { name: 'Tìm kiếm', section: '#search-section', live: '#search-message', pseudocode: '#search-learning-pseudocode', complexity: '#search-complexity-panel', knowledge: '#search-learning' },
  { name: 'BST', section: '#bst-section', live: '#bst-message', pseudocode: '#bst-pseudocode', complexity: '#bst-complexity-panel', knowledge: '#bst-learning' },
  { name: 'Bảng băm', section: '#hash-table-section', live: '#hash-table-message', pseudocode: '#hash-table-pseudocode', complexity: '#hash-table-complexity-panel', knowledge: '#hash-table-learning' },
  { name: 'Đồ thị', section: '#graph-section', live: '#graph-message', pseudocode: '#graph-pseudocode', complexity: '#graph-complexity-panel', knowledge: '#graph-learning' },
]

for (const screen of SCREENS) {
  test(`${screen.name}: ba pane đúng thứ tự, chỉ Mã giả hiện mặc định`, async () => {
    await withFullApp(({ document }) => {
      const section = document.querySelector(screen.section)
      const panes = [...section.querySelectorAll('[data-learning-pane]')]
      assert.deepEqual(panes.map(n => n.dataset.learningPane), ['pseudocode', 'complexity', 'knowledge'])
      assert.deepEqual(panes.map(n => n.hidden), [false, true, true])
      assert.equal(section.querySelectorAll('.visualizer-panel select').length, 1)
    })
  })

  test(`${screen.name}: mã giả, độ phức tạp và kiến thức nằm đúng pane`, async () => {
    await withFullApp(({ document }) => {
      const section = document.querySelector(screen.section)
      const [pseudocode, complexity, knowledge] = [...section.querySelectorAll('[data-learning-pane]')]

      assert.ok(pseudocode.querySelector(screen.pseudocode) !== null, 'mã giả phải ở pane Mã giả')
      assert.ok(complexity.querySelector(screen.complexity) !== null, 'bảng phân tích phải ở pane Độ phức tạp')
      assert.ok(knowledge.querySelector(screen.knowledge) !== null || knowledge.matches(screen.knowledge), 'góc kiến thức phải ở pane Kiến thức')

      assert.ok(knowledge.querySelector(screen.pseudocode) === null, 'Kiến thức không còn chứa mã giả (đã có pane riêng)')
      assert.ok(complexity.querySelector(screen.pseudocode) === null)
    })
  })

  test(`${screen.name}: <pre> mã giả có aria-labelledby trỏ tới tiêu đề nằm cùng pane Mã giả; mô tả Kiến thức không còn nhắc "mã giả"`, async () => {
    await withFullApp(({ document }) => {
      const section = document.querySelector(screen.section)
      const [pseudocode, , knowledge] = [...section.querySelectorAll('[data-learning-pane]')]
      const pre = pseudocode.querySelector('pre')
      const titleId = pre.getAttribute('aria-labelledby')

      assert.ok(titleId, '<pre> phải có aria-labelledby')
      assert.ok(pseudocode.querySelector(`#${titleId}`) !== null, `tiêu đề #${titleId} phải nằm trong pane Mã giả`)
      assert.ok(!/mã giả/i.test(knowledge.querySelector('.learning-heading')?.textContent ?? ''), 'mô tả Kiến thức không được nhắc mã giả (đã có pane riêng)')
    })
  })

  test(`${screen.name}: vùng aria-live giải thích bước nằm ngoài mọi pane`, async () => {
    await withFullApp(({ document }) => {
      const live = document.querySelector(screen.live)

      assert.ok(live !== null, `thiếu ${screen.live}`)
      assert.equal(live.getAttribute('aria-live'), 'polite')
      assert.ok(live.closest('[data-learning-pane]') === null, 'vùng live phải nằm ngoài pane có thể ẩn')
    })
  })
}

test('Array, Stack, Queue, Linked List (không có controller) không có pane', async () => {
  await withFullApp(({ document }) => {
    for (const id of ['array', 'stack', 'queue', 'linked-list']) {
      assert.equal(document.querySelectorAll(`#${id}-section [data-learning-pane]`).length, 0, id)
    }
  })
})
