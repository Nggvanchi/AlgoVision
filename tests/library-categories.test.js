import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

// R5b commit 1: phân loại của từng thẻ thư viện là DỮ LIỆU THẬT trong template (data-category), chip phân loại chỉ lọc theo đó.
// Tuyến tính = Array, Stack, Queue, Linked List; Cây = BST; Đồ thị = Graph; Bảng băm = Hash Table.
// Thuật toán: Sắp xếp, Tìm kiếm, Đồ thị (BFS, DFS).

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

const STRUCTURES = {
  array: 'linear',
  stack: 'linear',
  queue: 'linear',
  'linked-list': 'linear',
  bst: 'tree',
  'hash-table': 'hash',
  graph: 'graph',
}

for (const [target, category] of Object.entries(STRUCTURES)) {
  test(`thẻ cấu trúc "${target}" thuộc loại "${category}"`, () => {
    withTemplate((document) => {
      assert.equal(document.querySelector(`#structure-panel [data-structure-target="${target}"]`).dataset.category, category)
    })
  })
}

const ALGORITHMS = [
  ['.algorithm-card[data-algorithm="bubble"]', 'sorting'],
  ['.algorithm-card[data-algorithm="selection"]', 'sorting'],
  ['.algorithm-card[data-algorithm="insertion"]', 'sorting'],
  ['[data-search-algorithm="linear"]', 'searching'],
  ['[data-search-algorithm="binary"]', 'searching'],
  ['[data-dashboard-open="structure:graph:bfs"]', 'graph'],
  ['[data-dashboard-open="structure:graph:dfs"]', 'graph'],
]

for (const [selector, category] of ALGORITHMS) {
  test(`thẻ thuật toán ${selector} thuộc loại "${category}"`, () => {
    withTemplate((document) => {
      assert.equal(document.querySelector(`#algorithm-panel ${selector}`).dataset.category, category)
    })
  })
}

test('data-category chỉ có trên đúng 14 thẻ thư viện (7 cấu trúc + 7 thuật toán), không ở nơi khác; số thẻ mỗi loại đúng', () => {
  withTemplate((document) => {
    const cards = [...document.querySelectorAll('[data-category]')]

    assert.equal(cards.length, 14)
    assert.ok(cards.every((card) => card.closest('#structure-panel, #algorithm-panel') !== null && card.tagName === 'BUTTON'))

    const count = (panel) => Object.entries(Object.groupBy([...document.querySelectorAll(`${panel} [data-category]`)], (card) => card.dataset.category)).map(([category, list]) => [category, list.length]).sort()

    assert.deepEqual(count('#structure-panel'), [['graph', 1], ['hash', 1], ['linear', 4], ['tree', 1]])
    assert.deepEqual(count('#algorithm-panel'), [['graph', 2], ['searching', 2], ['sorting', 3]])
  })
})
