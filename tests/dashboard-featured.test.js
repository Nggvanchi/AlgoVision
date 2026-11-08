import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { initNavigation } from '../src/navigation.js'
import { graphLearning } from '../src/graph.js'
import { readStyle, parseStylesheet } from './helpers/css-tokens.js'

// R4: "Nội dung nổi bật" (3 card) và "Truy cập nhanh" (chip). Chữ, độ khó và Big-O của card lấy ĐÚNG từ thẻ thư viện / mô tả thuật toán
// trong app (quy tắc sản phẩm: không số giả, Big-O khớp implementation); chip khớp 7 cấu trúc của thư viện.

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')
const normalize = (text) => text.replace(/\s+/g, ' ').trim()

function withDashboard(run) {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    run(document, document.querySelector('#dashboard-section'))
  } finally {
    window.happyDOM.close()
  }
}

const cardParts = (card) => ({
  difficulty: card.querySelector('.difficulty') ? normalize(card.querySelector('.difficulty').textContent) : null,
  metrics: [...card.querySelectorAll('.card-metric')].map((metric) => `${normalize(metric.querySelector('span').textContent)} ${normalize(metric.querySelector('code').textContent)}`),
})

test('Nội dung nổi bật có đúng 3 card nút, mở Bubble Sort, Binary Search và BFS', () => {
  withDashboard((document, dashboard) => {
    const cards = [...dashboard.querySelectorAll('.dashboard-card')]

    assert.deepEqual(cards.map((card) => card.tagName), ['BUTTON', 'BUTTON', 'BUTTON'])
    assert.deepEqual(cards.map((card) => card.dataset.dashboardOpen), ['sorting:bubble', 'searching:binary', 'structure:graph:bfs'])
  })
})

for (const [open, librarySelector] of [['sorting:bubble', '.algorithm-card[data-algorithm="bubble"]'], ['searching:binary', '[data-search-algorithm="binary"]']]) {
  test(`card ${open}: tên, mô tả, độ khó và Big-O trùng thẻ thư viện`, () => {
    withDashboard((document, dashboard) => {
      const card = dashboard.querySelector(`.dashboard-card[data-dashboard-open="${open}"]`)
      const library = document.querySelector(librarySelector)

      assert.ok(card !== null && library !== null, 'thiếu card hoặc thẻ thư viện')
      assert.equal(normalize(card.querySelector('.dashboard-card-title').textContent), normalize(library.querySelector('h4').textContent))
      assert.equal(normalize(card.querySelector('.dashboard-card-description').textContent), normalize(library.querySelector('p').textContent))
      assert.deepEqual(cardParts(card), cardParts(library))
      assert.ok(cardParts(card).metrics.length === 2, 'phải có đúng 2 chỉ số: thời gian và bộ nhớ')
    })
  })
}

test('card BFS: không có badge độ khó (app không xếp độ khó cho BFS), Big-O khớp mô tả BFS trong app', () => {
  withDashboard((document, dashboard) => {
    const card = dashboard.querySelector('.dashboard-card[data-dashboard-open="structure:graph:bfs"]')
    const { advantages, disadvantages } = graphLearning.bfs.list
    const [time, memory] = cardParts(card).metrics

    assert.equal(cardParts(card).difficulty, null)
    assert.equal(time, 'Thời gian (danh sách kề) O(V + E)', 'ma trận kề là O(V²) (src/graph.js), nên nhãn phải nói rõ biểu diễn')
    assert.equal(memory, 'Bộ nhớ O(V)')
    assert.ok(advantages.includes('O(V + E)'), 'mô tả BFS trong app phải nêu O(V + E)')
    assert.ok(disadvantages.includes('O(V)'), 'mô tả BFS trong app phải nêu O(V) bộ nhớ')
    assert.equal(normalize(card.querySelector('.dashboard-card-kind').textContent), 'Đồ thị')
  })
})

test('mỗi card hiển thị kiểu (Sắp xếp / Tìm kiếm / Đồ thị) và có mô tả', () => {
  withDashboard((document, dashboard) => {
    const kinds = [...dashboard.querySelectorAll('.dashboard-card')].map((card) => normalize(card.querySelector('.dashboard-card-kind').textContent))

    assert.deepEqual(kinds, ['Sắp xếp', 'Tìm kiếm', 'Đồ thị'])

    for (const card of dashboard.querySelectorAll('.dashboard-card')) {
      assert.ok(normalize(card.querySelector('.dashboard-card-description').textContent).length > 20)
    }
  })
})

test('thứ tự tiêu đề: h2 hero, rồi h3 "Nội dung nổi bật" và "Truy cập nhanh", h4 hai nhóm chip; không còn thẻ "Sẽ phát triển"', () => {
  withDashboard((document, dashboard) => {
    const headings = [...dashboard.querySelectorAll('h2, h3, h4')].map((heading) => `${heading.tagName} ${normalize(heading.textContent)}`)

    assert.deepEqual(headings, [
      'H2 Nhìn thấy thuật toán chạy từng bước.',
      'H3 Nội dung nổi bật',
      'H3 Truy cập nhanh',
      'H4 Cấu trúc dữ liệu',
      'H4 Giải thuật',
    ])
    assert.ok(!/Sẽ phát triển/.test(dashboard.textContent), 'Dashboard không còn thẻ "Sẽ phát triển"')
    assert.ok(dashboard.querySelector('.dashboard-card-upcoming') === null)
    assert.ok(!/\[Tên|Xin chào/.test(dashboard.textContent), 'không có lời chào với tên giả')
  })
})

test('Truy cập nhanh: 7 chip cấu trúc khớp 7 thẻ thư viện (tên, thứ tự, đích), 2 chip giải thuật; không "Đệ quy"', () => {
  withDashboard((document, dashboard) => {
    const library = [...document.querySelectorAll('#structure-library [data-structure-target]')]
    const chips = [...dashboard.querySelectorAll('.dashboard-quick-structures .dashboard-chip')]

    assert.equal(library.length, 7)
    assert.deepEqual(chips.map((chip) => normalize(chip.textContent)), library.map((card) => normalize(card.querySelector('.structure-card-title').textContent)))
    assert.deepEqual(chips.map((chip) => chip.dataset.dashboardOpen), library.map((card) => `structure:${card.dataset.structureTarget}`))

    const algorithms = [...dashboard.querySelectorAll('.dashboard-quick-algorithms .dashboard-chip')]

    assert.deepEqual(algorithms.map((chip) => [normalize(chip.textContent), chip.dataset.dashboardTarget]), [['Sắp xếp', 'sorting'], ['Tìm kiếm', 'searching']])
    assert.ok(!/Đệ quy/.test(dashboard.textContent))
    assert.ok(chips.every((chip) => chip.tagName === 'BUTTON' && chip.type === 'button'))
  })
})

test('mọi nút/thẻ data-dashboard-open trên Dashboard mở đúng MỘT màn chi tiết với topic tương ứng', () => {
  const expectedPage = { sorting: 'sorting', searching: 'searching', structure: 'structures' }

  withDashboard((document, dashboard) => {
    initNavigation(document)

    const openers = [...dashboard.querySelectorAll('[data-dashboard-open]')]

    assert.equal(openers.length, 1 + 3 + 7, 'nút hero (1) + card nổi bật (3) + chip cấu trúc (7)')

    for (const opener of openers) {
      const [kind, name] = opener.dataset.dashboardOpen.split(':')
      const log = []
      const listener = (event) => log.push({ ...event.detail })

      document.addEventListener('algovision:viewchange', listener)
      opener.click()
      document.removeEventListener('algovision:viewchange', listener)

      assert.deepEqual(log, [{ page: expectedPage[kind], topic: `${kind}:${name}` }], opener.dataset.dashboardOpen)
      document.querySelector('.nav-item[data-page="dashboard"]').click()
    }
  })
})

// CSS (happy-dom không tính CSS nên đọc thẳng src/style.css)
const sheet = parseStylesheet(readStyle())

function lastValue(selector, property, media = null) {
  return sheet.rules.filter((rule) => rule.media === media && rule.selectors.includes(selector))
    .flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === property).map((declaration) => declaration.value)).at(-1)
}

test('chip cao tối thiểu 44px (Spec mục 13); lưới nổi bật 3 cột, 1 cột <= 700px; nhóm giải thuật ẩn trên mobile', () => {
  assert.equal(lastValue('.dashboard-chip', 'min-height'), '44px')
  assert.equal(lastValue('.dashboard-chip', 'border'), '1px solid var(--border-control)', 'viền điều khiển dùng --border-control (3:1), không dùng --av-border-strong (1,41:1), quyết định 12')
  assert.equal(lastValue('.dashboard-text-link', 'min-height'), '44px', 'liên kết "Xem thư viện →" cũng là vùng chạm >= 44px')
  assert.equal(lastValue('.dashboard-grid', 'grid-template-columns'), 'repeat(3, minmax(0, 1fr))')
  // <= 900px: rail 72px + main hẹp làm thẻ chỉ còn ~190px, badge "TRUNG BÌNH" và nhãn kiểu bị bẻ dòng, tiêu đề lệch nhau (xem ảnh 768px) -> 1 cột
  assert.equal(lastValue('.dashboard-grid', 'grid-template-columns', '@media (max-width: 900px)'), 'minmax(0, 1fr)')
  assert.equal(lastValue('.dashboard-quick-algorithms', 'display', '@media (max-width: 700px)'), 'none')
})
