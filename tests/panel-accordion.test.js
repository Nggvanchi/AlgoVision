import test from 'node:test'
import assert from 'node:assert/strict'
import { withFullApp } from './helpers/app-dom.js'

// R6b: mỗi màn hình có controller có 3 accordion (<details>) Mã giả, Độ phức tạp, Kiến thức (quyết định 20 và 30).
// "Giải thích bước hiện tại" là vùng aria-live nên nằm NGOÀI mọi accordion (vùng live trong <details> đóng sẽ không được đọc).

const SCREENS = [
  { name: 'Sắp xếp', section: '#sorting-section', live: '#simulation-message', pseudocode: '#learning-pseudocode', complexity: '.complexity-panel', knowledge: '#sorting-learning' },
  { name: 'Tìm kiếm', section: '#search-section', live: '#search-message', pseudocode: '#search-learning-pseudocode', complexity: '#search-complexity-panel', knowledge: '#search-learning' },
  { name: 'BST', section: '#bst-section', live: '#bst-message', pseudocode: '#bst-pseudocode', complexity: '#bst-complexity-panel', knowledge: '#bst-learning' },
  { name: 'Bảng băm', section: '#hash-table-section', live: '#hash-table-message', pseudocode: '#hash-table-pseudocode', complexity: '#hash-table-complexity-panel', knowledge: '#hash-table-learning' },
  { name: 'Đồ thị', section: '#graph-section', live: '#graph-message', pseudocode: '#graph-pseudocode', complexity: '#graph-complexity-panel', knowledge: '#graph-learning' },
]

for (const screen of SCREENS) {
  test(`${screen.name}: ba accordion Mã giả, Độ phức tạp, Kiến thức, summary là con đầu và mở mặc định`, async () => {
    await withFullApp(({ document }) => {
      const section = document.querySelector(screen.section)
      const accordions = [...section.querySelectorAll('details.panel-accordion')]

      assert.deepEqual(
        accordions.map((details) => details.querySelector(':scope > summary')?.textContent.trim()),
        ['Mã giả', 'Độ phức tạp', 'Kiến thức'],
      )

      for (const details of accordions) {
        assert.ok(details.hasAttribute('open'), 'mặc định mở để giữ nội dung đang thấy')
        assert.equal(details.firstElementChild.tagName, 'SUMMARY', 'summary phải là con đầu tiên')
      }
    })
  })

  test(`${screen.name}: mã giả, độ phức tạp và kiến thức nằm đúng accordion`, async () => {
    await withFullApp(({ document }) => {
      const section = document.querySelector(screen.section)
      const [pseudocode, complexity, knowledge] = [...section.querySelectorAll('details.panel-accordion')]

      assert.ok(pseudocode.querySelector(screen.pseudocode) !== null, 'mã giả phải ở accordion Mã giả')
      assert.ok(complexity.querySelector(screen.complexity) !== null, 'bảng phân tích phải ở accordion Độ phức tạp')
      assert.ok(knowledge.querySelector(screen.knowledge) !== null || knowledge.matches(screen.knowledge), 'góc kiến thức phải ở accordion Kiến thức')

      assert.ok(knowledge.querySelector(screen.pseudocode) === null, 'Kiến thức không còn chứa mã giả (đã có accordion riêng)')
      assert.ok(complexity.querySelector(screen.pseudocode) === null)
    })
  })

  test(`${screen.name}: <pre> mã giả có aria-labelledby trỏ tới tiêu đề nằm cùng accordion Mã giả; mô tả Kiến thức không còn nhắc "mã giả"`, async () => {
    await withFullApp(({ document }) => {
      const section = document.querySelector(screen.section)
      const [pseudocode, , knowledge] = [...section.querySelectorAll('details.panel-accordion')]
      const pre = pseudocode.querySelector('pre')
      const titleId = pre.getAttribute('aria-labelledby')

      assert.ok(titleId, '<pre> phải có aria-labelledby')
      assert.ok(pseudocode.querySelector(`#${titleId}`) !== null, `tiêu đề #${titleId} phải nằm trong accordion Mã giả`)
      assert.ok(!/mã giả/i.test(knowledge.querySelector('.learning-heading')?.textContent ?? ''), 'mô tả Kiến thức không được nhắc mã giả (đã có accordion riêng)')
    })
  })

  test(`${screen.name}: vùng aria-live giải thích bước nằm ngoài mọi accordion`, async () => {
    await withFullApp(({ document }) => {
      const live = document.querySelector(screen.live)

      assert.ok(live !== null, `thiếu ${screen.live}`)
      assert.equal(live.getAttribute('aria-live'), 'polite')
      assert.ok(live.closest('details') === null, 'vùng live trong <details> đóng sẽ không được trình đọc màn hình đọc')
    })
  })
}

test('Array, Stack, Queue, Linked List (không có controller) không có accordion', async () => {
  await withFullApp(({ document }) => {
    for (const id of ['array', 'stack', 'queue', 'linked-list']) {
      assert.equal(document.querySelectorAll(`#${id}-section details.panel-accordion`).length, 0, id)
    }
  })
})
