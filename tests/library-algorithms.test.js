import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { initNavigation } from '../src/navigation.js'

// R5a commit 2: trang "Giải thuật" (thư viện gộp) = Sắp xếp + Tìm kiếm + Duyệt đồ thị (BFS, DFS; quyết định 22–23).
// Thẻ BFS/DFS chỉ có nhãn thật (tên, mô tả, kiểu "Đồ thị"), KHÔNG độ khó và KHÔNG Thời gian/Bộ nhớ (D12).
// Trang chưa có tab (commit sau): test tạo nút data-dashboard-target="algorithms" để vào.

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

function withLibrary(run) {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template

    const opener = document.createElement('button')

    opener.dataset.dashboardTarget = 'algorithms'
    document.querySelector('#dashboard-section').append(opener)
    initNavigation(document)

    const log = []

    document.addEventListener('algovision:viewchange', (event) => log.push({ ...event.detail }))
    run({ document, log, enter: () => { opener.click(); log.length = 0 } })
  } finally {
    window.happyDOM.close()
  }
}

const goTo = (document, page) => document.querySelector(`.nav-item[data-page="${page}"]`).click()
const visibleLibraries = (document) => ['#sorting-algorithm-library', '#search-algorithm-library', '#graph-algorithm-library', '#structure-library']
  .filter((selector) => document.querySelector(selector).hidden === false)

test('section "Duyệt đồ thị" nằm cuối #algorithm-panel với 2 thẻ BFS, DFS có nhãn thật và không có độ khó hay chỉ số giả', () => {
  withLibrary(({ document }) => {
    const section = document.querySelector('#algorithm-panel > #graph-algorithm-library')

    assert.ok(section !== null, 'thiếu #graph-algorithm-library trong #algorithm-panel')
    assert.deepEqual([...document.querySelector('#algorithm-panel').children].map((child) => child.id), ['sorting-algorithm-library', 'search-algorithm-library', 'graph-algorithm-library'])
    assert.equal(section.querySelector('h3').textContent.trim(), 'Duyệt đồ thị')

    const cards = [...section.querySelectorAll('.algorithm-card')]

    assert.deepEqual(cards.map((card) => card.dataset.dashboardOpen), ['structure:graph:bfs', 'structure:graph:dfs'])
    assert.deepEqual(cards.map((card) => card.querySelector('h4').textContent.trim()), ['Duyệt đồ thị BFS', 'Duyệt đồ thị DFS'])

    for (const card of cards) {
      assert.equal(card.tagName, 'BUTTON')
      assert.ok(!('algorithm' in card.dataset), 'không được mang data-algorithm (selector đó thuộc nút Sắp xếp)')
      assert.ok(card.querySelector('.difficulty') === null, 'D12: không gán độ khó cho BFS/DFS')
      assert.ok(card.querySelector('.card-metric') === null, 'D12: không hiển thị Thời gian/Bộ nhớ cho BFS/DFS')
      assert.equal(card.querySelector('.algorithm-card-kind').textContent.trim(), 'Đồ thị')
      assert.ok(card.querySelector('p').textContent.trim().length > 20, 'phải có mô tả')
      assert.equal(card.querySelector('.card-link').textContent.trim(), 'Trực quan hóa →')
    }
  })
})

test('trang Giải thuật: hiện đủ ba section thuật toán, ẩn thư viện cấu trúc, breadcrumb "AlgoVision / Giải thuật", một viewchange topic null', () => {
  withLibrary(({ document, log }) => {
    document.querySelector('[data-dashboard-target="algorithms"]').click()

    assert.deepEqual(visibleLibraries(document), ['#sorting-algorithm-library', '#search-algorithm-library', '#graph-algorithm-library'])
    assert.deepEqual([...document.querySelectorAll('.breadcrumb li')].map((item) => item.textContent.trim()), ['AlgoVision', 'Giải thuật'])
    assert.equal(document.title, 'Giải thuật - AlgoVision')
    assert.deepEqual(log, [{ page: 'algorithms', topic: null }])
    assert.equal(document.querySelectorAll('#algorithm-panel .algorithm-card').length, 7, '3 sắp xếp + 2 tìm kiếm + 2 duyệt đồ thị')
  })
})

test('sidebar không đổi (D11): không mục nav nào active ở trang Giải thuật; aria-current chỉ ở breadcrumb', () => {
  withLibrary(({ document, enter }) => {
    enter()

    assert.equal(document.querySelectorAll('.nav-item.active, .nav-subitem.active').length, 0)
    assert.equal(document.querySelectorAll('[aria-current="page"]').length, 1)
    assert.ok(document.querySelector('.breadcrumb [aria-current="page"]') !== null)
    assert.equal(document.querySelectorAll('.nav-item').length, 4, 'sidebar vẫn 4 mục chính, không có mục "Thư viện"')
  })
})

for (const [selector, topic, page] of [
  ['.algorithm-card[data-algorithm="bubble"]', 'sorting:bubble', 'sorting'],
  ['.algorithm-card[data-algorithm="insertion"]', 'sorting:insertion', 'sorting'],
  ['[data-search-algorithm="binary"]', 'searching:binary', 'searching'],
  ['[data-search-algorithm="linear"]', 'searching:linear', 'searching'],
]) {
  test(`từ trang Giải thuật mở ${topic}: đúng MỘT viewchange, rồi Quay lại về trang Giải thuật`, () => {
    withLibrary(({ document, log, enter }) => {
      enter()
      document.querySelector(selector).click()
      assert.deepEqual(log, [{ page, topic }])

      log.length = 0
      document.querySelector(page === 'sorting' ? '[data-back-to-sorting-algorithms]' : '[data-back-to-search-algorithms]').click()
      assert.deepEqual(log, [{ page: 'algorithms', topic: null }])
      assert.deepEqual(visibleLibraries(document), ['#sorting-algorithm-library', '#search-algorithm-library', '#graph-algorithm-library'])
    })
  })
}

for (const operation of ['bfs', 'dfs']) {
  test(`thẻ ${operation.toUpperCase()} mở màn Đồ thị với đúng thao tác ${operation} (select và sự kiện change), một viewchange, Quay lại về Giải thuật`, () => {
    withLibrary(({ document, log, enter }) => {
      const select = document.querySelector('#graph-operation')
      const changes = []

      select.addEventListener('change', (event) => changes.push(event.target.value))
      enter()
      document.querySelector(`#graph-algorithm-library [data-dashboard-open="structure:graph:${operation}"]`).click()

      assert.equal(select.value, operation)
      assert.deepEqual(changes, [operation])
      assert.deepEqual(log, [{ page: 'structures', topic: 'structure:graph' }])
      assert.ok(document.querySelector('#graph-section').hidden === false, 'màn Đồ thị phải hiện')

      log.length = 0
      document.querySelector('#graph-section [data-back-to-structures]').click()
      assert.deepEqual(log, [{ page: 'algorithms', topic: null }])
    })
  })
}

test('Quay lại về thư viện cũ khi mở từ nơi khác: sidebar (Sắp xếp), Dashboard; không dính nơi xuất phát cũ', () => {
  withLibrary(({ document, log, enter }) => {
    enter()
    document.querySelector('.algorithm-card[data-algorithm="bubble"]').click()

    goTo(document, 'sorting')
    document.querySelector('.algorithm-card[data-algorithm="bubble"]').click()
    log.length = 0
    document.querySelector('[data-back-to-sorting-algorithms]').click()

    assert.deepEqual(log, [{ page: 'sorting', topic: null }], 'mở từ sidebar thì Quay lại về thư viện Sắp xếp')
    assert.deepEqual(visibleLibraries(document), ['#sorting-algorithm-library'])
  })
})

test('nơi xuất phát bị xóa khi đi đường khác: Giải thuật -> BFS -> mục con sidebar BST -> Quay lại về thư viện cấu trúc', () => {
  withLibrary(({ document, log, enter }) => {
    enter()
    document.querySelector('#graph-algorithm-library [data-dashboard-open="structure:graph:bfs"]').click()
    document.querySelector('.nav-subitem[data-structure-nav="bst"]').click()
    log.length = 0
    document.querySelector('#bst-section [data-back-to-structures]').click()

    assert.deepEqual(log, [{ page: 'structures', topic: null }])
    assert.deepEqual(visibleLibraries(document), ['#structure-library'])
  })
})

test('thẻ cấu trúc ở thư viện cấu trúc vẫn mở cấu trúc, Quay lại về thư viện cấu trúc (không bị ảnh hưởng)', () => {
  withLibrary(({ document, log }) => {
    goTo(document, 'structures')
    document.querySelector('[data-structure-target="graph"]').click()
    log.length = 0
    document.querySelector('#graph-section [data-back-to-structures]').click()

    assert.deepEqual(log, [{ page: 'structures', topic: null }])
  })
})
