import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { initNavigation } from '../src/navigation.js'

// R4: data-dashboard-open="<loại>:<tên>[:<thao tác>]" mở thẳng một màn chi tiết từ Dashboard.
// Test tự thêm nút thử vào DOM (không phụ thuộc bố cục Dashboard) rồi kiểm hành vi của navigation.js.

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

function withOpener(spec, run) {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template

    const opener = document.createElement('button')
    opener.dataset.dashboardOpen = spec
    document.querySelector('#dashboard-section').append(opener)
    initNavigation(document)

    const log = []
    document.addEventListener('algovision:viewchange', (event) => log.push({ ...event.detail }))

    run({ document, opener, log })
  } finally {
    window.happyDOM.close()
  }
}

const CASES = [
  ['sorting:bubble', { page: 'sorting', topic: 'sorting:bubble' }],
  ['sorting:insertion', { page: 'sorting', topic: 'sorting:insertion' }],
  ['searching:binary', { page: 'searching', topic: 'searching:binary' }],
  ['searching:linear', { page: 'searching', topic: 'searching:linear' }],
  ['structure:bst', { page: 'structures', topic: 'structure:bst' }],
  ['structure:linked-list', { page: 'structures', topic: 'structure:linked-list' }],
  ['structure:graph:bfs', { page: 'structures', topic: 'structure:graph' }],
]

for (const [spec, expected] of CASES) {
  test(`data-dashboard-open="${spec}": đúng MỘT viewchange, topic = ${expected.topic}`, () => {
    withOpener(spec, ({ opener, log }) => {
      opener.click()
      assert.deepEqual(log, [expected])
    })
  })
}

test('structure:graph:bfs chọn thao tác BFS trong #graph-operation; structure:graph giữ thao tác mặc định', () => {
  withOpener('structure:graph:bfs', ({ document, opener }) => {
    const changes = []
    document.querySelector('#graph-operation').addEventListener('change', (event) => changes.push(event.target.value))
    opener.click()
    assert.equal(document.querySelector('#graph-operation').value, 'bfs')
    assert.deepEqual(changes, ['bfs'], 'phải phát đúng một sự kiện change để bộ điều khiển Graph cập nhật ô nhập theo thao tác')
  })

  withOpener('structure:graph', ({ document, opener }) => {
    opener.click()
    assert.equal(document.querySelector('#graph-operation').value, 'has-edge')
  })
})

test('mở thẳng một chủ đề: màn chi tiết hiện, Dashboard ẩn', () => {
  withOpener('sorting:bubble', ({ document, opener }) => {
    opener.click()
    assert.ok(document.querySelector('#dashboard-section').hidden, 'Dashboard phải ẩn sau khi mở Bubble Sort')
    assert.ok(document.querySelector('#sorting-section')?.hidden === false, 'màn chi tiết Sắp xếp phải hiện')
  })
})
