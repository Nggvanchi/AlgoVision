import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

import { isShown, withFullApp, template } from './helpers/app-dom.js'
import { memoryStorage } from './helpers/memory-storage.js'
import { formatOpenedAt } from '../src/progress-summary.js'
import { initDashboardProgress } from '../src/dashboard-progress.js'

// Khối tiến độ trên Dashboard (.dashboard-progress): cùng hàm tóm tắt, hàng chủ đề, thông báo và "Mở lại" với trang Tiến độ.
// Không có nút xóa ở đây (xóa chỉ nằm ở trang Tiến độ).
const KEY = 'algovision:progress'
const FORBIDDEN = /hoàn thành|completed|streak|chuỗi ngày|thời gian học|%/i
const T1 = Date.UTC(2020, 5, 1, 8, 30)
const T2 = Date.UTC(2020, 5, 3, 21, 5)
const T3 = Date.UTC(2020, 5, 4, 7, 0)

const entry = (firstOpenedAt, lastOpenedAt, openCount) => ({ firstOpenedAt, lastOpenedAt, openCount })
const seed = (topics) => memoryStorage({ initial: JSON.stringify({ version: 1, topics }) })
const SEEDED = {
  'sorting:bubble': entry(T1, T3, 3),
  'searching:binary': entry(T2, T2, 1),
  'structure:bst': entry(T1, T2, 2),
}
const FUTURE = JSON.stringify({ version: 9, topics: { 'sorting:bubble': entry(1, 2, 3) } })

const textOf = (element) => element.textContent.replace(/\s+/g, ' ').trim()
const $ = (document, selector) => document.querySelector(selector)
const body = (document) => $(document, '#dashboard-progress-body')
const rows = (document) => [...document.querySelectorAll('#dashboard-progress-body .progress-topic')]
const hero = (document) => $(document, '.dashboard-hero .dashboard-primary-button')
const stored = (storage) => JSON.parse(storage.data.get(KEY))
const goTo = (document, page) => $(document, `.nav-item[data-page="${page}"]`).click()
const run = (callback, options = {}) => withFullApp(callback, { storage: memoryStorage(), ...options })

// --- Mẫu HTML ---

test('mẫu: .dashboard-progress giữ vị trí cuối #dashboard-section; chữ giữ chỗ cũ ("đã hoàn thành", "sẽ được phát triển") đã bị thay', async () => {
  await run(({ document }) => {
    const block = $(document, '#dashboard-section > .dashboard-progress')

    assert.ok(block !== null, '.dashboard-progress là con trực tiếp của #dashboard-section')
    assert.ok($(document, '#dashboard-section').lastElementChild === block, 'vẫn là khối cuối của Dashboard')
    assert.doesNotMatch(block.textContent, /hoàn thành|sẽ được phát triển|Lộ trình/i)
    assert.equal(textOf($(document, '.dashboard-progress .eyebrow')), 'TIẾN ĐỘ HỌC TẬP')
  })
})

test('mẫu: nút "Xem tiến độ chi tiết" có data-dashboard-target="progress"; ba thẻ cũ và thẻ "Sẽ phát triển" còn nguyên', async () => {
  await run(({ document }) => {
    const detail = $(document, '.dashboard-progress [data-dashboard-target="progress"]')

    assert.equal(detail.tagName, 'BUTTON')
    assert.equal(textOf(detail), 'Xem tiến độ chi tiết')
    assert.deepEqual(
      [...document.querySelectorAll('.dashboard-grid button.dashboard-card[data-dashboard-target]')].map((card) => card.dataset.dashboardTarget),
      ['sorting', 'searching', 'structures'],
    )
    assert.equal(document.querySelectorAll('.dashboard-grid .dashboard-card-upcoming').length, 1)
    assert.ok(textOf($(document, '.dashboard-grid')).includes('Sẽ phát triển'))
  })
})

test('mẫu và mã của khối Dashboard không có chữ cấm; mã không chạm kho trình duyệt hay innerHTML', async () => {
  const source = await readFile(new URL('../src/dashboard-progress.js', import.meta.url), 'utf8')
  const block = template.slice(template.indexOf('class="dashboard-progress"'), template.indexOf('id="progress-section"'))

  assert.ok(block.includes('TIẾN ĐỘ HỌC TẬP') && block.length > 200, 'đoạn template lấy được không rỗng')
  assert.doesNotMatch(source, FORBIDDEN)
  assert.doesNotMatch(block, FORBIDDEN)
  assert.doesNotMatch(source.replace(/^\s*\/\/.*$/gm, ''), /localStorage|sessionStorage|innerHTML|insertAdjacentHTML|\bstorage\b/)
})

test('dùng chung mã với trang Tiến độ: import createTopicRow, reopenTopic, progressNotice từ progress-view.js, không dựng lại hàng hay nút Mở lại', async () => {
  const source = await readFile(new URL('../src/dashboard-progress.js', import.meta.url), 'utf8')

  assert.match(source, /from '\.\/progress-view\.js'/)
  for (const name of ['createTopicRow', 'reopenTopic', 'progressNotice']) assert.match(source, new RegExp(name))
  assert.match(source, /from '\.\/progress-summary\.js'/)
  assert.doesNotMatch(source, /createElement\('time'\)|Mở lại|datetime/)
})

// --- Trạng thái ---

test('trống: câu hướng dẫn, nút "Mở Sắp xếp", không hàng nào, không nút xóa trên Dashboard', async () => {
  await run(({ document }) => {
    const text = textOf(body(document))

    assert.ok(text.includes('Bạn chưa mở chủ đề nào.'))
    assert.ok(text.includes('Mở một thuật toán hoặc cấu trúc dữ liệu, nó sẽ xuất hiện ở đây.'))
    assert.equal(textOf($(document, '#dashboard-progress-body button')), 'Mở Sắp xếp')
    assert.equal(rows(document).length, 0)
    assert.ok($(document, '#dashboard-section #progress-clear') === null, 'Dashboard không có nút xóa lịch sử')
    assert.ok($(document, '#dashboard-section #progress-clear-future') === null, 'Dashboard không có nút xóa dữ liệu phiên bản mới hơn')
    assert.equal($(document, '#dashboard-progress-notice').hidden, true)
  })
})

test('trống: "Mở Sắp xếp" mở thư viện Sắp xếp, không ghi tiến độ, focus về #main-content', async () => {
  const storage = memoryStorage()

  await run(({ document }) => {
    $(document, '#dashboard-progress-body button').click()

    assert.ok(isShown($(document, '.algorithm-section')), 'thư viện Sắp xếp hiện')
    assert.equal(storage.setCalls, 0)
    assert.ok(document.activeElement === $(document, '#main-content'), 'focus về #main-content')
  }, { storage })
})

test('có dữ liệu: "Đã mở N / 12 chủ đề", tóm tắt từng nhóm, tối đa 3 hàng mới nhất trước với số lần và thời điểm gần nhất', async () => {
  const topics = { ...SEEDED, 'structure:array': entry(T1, T1, 1) }

  await run(({ document }) => {
    const text = textOf(body(document))

    assert.ok(text.includes('Đã mở 4 / 12 chủ đề'))
    assert.ok(text.includes('Sắp xếp 1/3 · Tìm kiếm 1/2 · Cấu trúc dữ liệu 2/7'))
    assert.deepEqual(rows(document).map((row) => textOf(row.querySelector('.progress-topic-name'))), ['Bubble Sort', 'Binary Search', 'Binary Search Tree'])
    assert.equal(
      textOf(rows(document)[0].querySelector('.progress-topic-meta')),
      `Đã mở 3 lần · gần nhất ${formatOpenedAt(T3)}`,
    )
    assert.deepEqual(
      [...document.querySelectorAll('#dashboard-progress-body .progress-reopen')].map((button) => button.getAttribute('aria-label')),
      ['Mở lại Bubble Sort', 'Mở lại Binary Search', 'Mở lại Binary Search Tree'],
    )
  }, { storage: seed(topics) })
})

test('dữ liệu hỏng, không lưu được và phiên bản mới hơn: cùng chữ thông báo như trang Tiến độ; Dashboard không có nút xóa', async () => {
  const cases = [
    [memoryStorage({ initial: '{hỏng' }), 'Dữ liệu tiến độ đã lưu bị hỏng nên được bỏ qua. Lần mở tiếp theo sẽ ghi đè.'],
    [null, 'Trình duyệt không cho lưu tiến độ; chỉ hiển thị trong phiên này.'],
    [memoryStorage({ initial: FUTURE }), 'Dữ liệu được ghi bởi phiên bản mới hơn của AlgoVision nên chưa hiển thị. AlgoVision sẽ không ghi đè hay chuyển đổi dữ liệu này.'],
  ]

  for (const [storage, notice] of cases) {
    await run(({ document }) => {
      goTo(document, 'progress')
      const onProgressPage = textOf($(document, '#progress-notice'))

      goTo(document, 'dashboard')
      assert.equal(textOf($(document, '#dashboard-progress-notice')), notice)
      assert.equal(textOf($(document, '#dashboard-progress-notice')), onProgressPage, 'cùng chữ với trang Tiến độ')
      assert.equal($(document, '#dashboard-progress-notice').hidden, false)
      assert.equal(document.querySelectorAll('#dashboard-section button[id^="progress-clear"]').length, 0)
    }, { storage })
  }
})

test('phiên bản mới hơn: không số liệu, không hàng, không ghi gì vào kho', async () => {
  const storage = memoryStorage({ initial: FUTURE })

  await run(({ document }) => {
    assert.equal(body(document).children.length, 0)
    assert.equal(rows(document).length, 0)
  }, { storage })

  assert.equal(storage.data.get(KEY), FUTURE)
  assert.equal(storage.setCalls, 0)
})

test('không chữ cấm trong mọi trạng thái của khối Dashboard', async () => {
  for (const storage of [seed(SEEDED), memoryStorage(), memoryStorage({ initial: '{hỏng' }), null, memoryStorage({ initial: FUTURE })]) {
    await run(({ document }) => {
      assert.doesNotMatch($(document, '.dashboard-progress').textContent, FORBIDDEN)
      assert.doesNotMatch($(document, '.dashboard-hero').textContent, FORBIDDEN)
    }, { storage })
  }
})

test('nhãn chủ đề có HTML hiển thị như chữ, không tạo phần tử (textContent)', () => {
  const window = new Window()
  const { document } = window
  const evil = '<img src=x onerror=alert(1)>'

  try {
    document.body.innerHTML = template
    const progress = {
      catalog: [{ id: 'sorting:bubble', label: evil, kind: 'sorting' }],
      readState: () => ({ progress: { version: 1, topics: { 'sorting:bubble': entry(1, 2, 3) } }, status: 'ok', persisted: true }),
      subscribe: () => () => {},
    }

    initDashboardProgress(document, progress)

    assert.equal(document.querySelectorAll('#dashboard-section img').length, 0)
    assert.ok(textOf(body(document)).includes(evil))
    assert.ok(textOf(hero(document)).includes(evil))
  } finally {
    window.happyDOM.close()
  }
})

test('Dashboard vẫn đúng một h2 hiển thị', async () => {
  await run(({ document }) => {
    assert.equal([...document.querySelectorAll('h2')].filter(isShown).length, 1)
  }, { storage: seed(SEEDED) })
})

// --- Cập nhật ---

test('mở một chủ đề rồi quay về Dashboard thấy ngay lần mở vừa ghi', async () => {
  await run(({ document }) => {
    assert.ok(textOf(body(document)).includes('Bạn chưa mở chủ đề nào.'))

    $(document, 'button[data-structure-nav="graph"]').click()
    goTo(document, 'dashboard')

    assert.ok(textOf(body(document)).includes('Đã mở 1 / 12 chủ đề'))
    assert.deepEqual(rows(document).map((row) => textOf(row.querySelector('.progress-topic-name'))), ['Graph'])
  })
})

test('sự kiện storage đổi dữ liệu: Dashboard vẽ lại; xóa cả kho (key null) về trạng thái trống', async () => {
  const storage = seed(SEEDED)

  await run(({ document, window }) => {
    storage.data.set(KEY, JSON.stringify({ version: 1, topics: { 'structure:queue': entry(1, 9, 4) } }))
    window.dispatchEvent(new window.StorageEvent('storage', { key: KEY }))
    assert.ok(textOf(body(document)).includes('Đã mở 1 / 12 chủ đề'))
    assert.deepEqual(rows(document).map((row) => textOf(row.querySelector('.progress-topic-name'))), ['Queue'])

    storage.data.delete(KEY)
    window.dispatchEvent(new window.StorageEvent('storage', { key: null }))
    assert.ok(textOf(body(document)).includes('Bạn chưa mở chủ đề nào.'))
  }, { storage })
})

test('dữ liệu đổi mà không có sự kiện nào báo (storage event bị lỡ): quay về Dashboard vẫn vẽ lại theo kho', async () => {
  const storage = seed(SEEDED)

  await run(({ document }) => {
    goTo(document, 'sorting')
    storage.data.set(KEY, JSON.stringify({ version: 1, topics: { 'structure:stack': entry(1, 9, 2) } }))
    goTo(document, 'dashboard')

    assert.ok(textOf(body(document)).includes('Đã mở 1 / 12 chủ đề'))
    assert.equal(textOf(hero(document)), 'Tiếp tục: Stack →')
  }, { storage })
})

test('xóa lịch sử ở trang Tiến độ rồi về Dashboard: Dashboard trống', async () => {
  await run(({ document }) => {
    goTo(document, 'progress')
    $(document, '#progress-clear').click()
    $(document, '#progress-confirm-clear .progress-danger').click()
    goTo(document, 'dashboard')

    assert.ok(textOf(body(document)).includes('Bạn chưa mở chủ đề nào.'))
  }, { storage: seed(SEEDED) })
})

// --- Mở lại và xem chi tiết ---

const REOPEN = [
  ['sorting:selection', 'Mở lại Selection Sort', '#sorting-section'],
  ['searching:binary', 'Mở lại Binary Search', '#search-section'],
  ['structure:hash-table', 'Mở lại Hash Table', '#hash-table-section'],
]

for (const [id, label, section] of REOPEN) {
  test(`Mở lại ${id} từ Dashboard: mở đúng màn, openCount +1 đúng một lần, đúng một viewchange có topic, focus về #main-content`, async () => {
    const storage = seed({ [id]: entry(1000, 2000, 1) })

    await withFullApp(({ document }) => {
      const events = []

      document.addEventListener('algovision:viewchange', (event) => events.push(event.detail))
      $(document, `#dashboard-progress-body .progress-reopen[aria-label="${label}"]`).click()

      assert.equal($(document, section).hidden, false)
      assert.equal(events.filter((detail) => detail.topic !== null).length, 1)
      assert.equal(stored(storage).topics[id].openCount, 2)
      assert.equal(stored(storage).topics[id].lastOpenedAt, 5000)
      assert.equal(storage.setCalls, 1)
      assert.ok(document.activeElement === $(document, '#main-content'), 'focus về #main-content')
    }, { storage, now: () => 5000 })
  })
}

test('"Xem tiến độ chi tiết" mở trang Tiến độ: đúng một viewchange {page:"progress", topic:null}, không ghi tiến độ', async () => {
  const storage = seed(SEEDED)

  await run(({ document }) => {
    const events = []

    document.addEventListener('algovision:viewchange', (event) => events.push(event.detail))
    $(document, '.dashboard-progress [data-dashboard-target="progress"]').click()

    assert.deepEqual(events, [{ page: 'progress', topic: null }])
    assert.equal($(document, '#progress-section').hidden, false)
    assert.equal(storage.setCalls, 0)
  }, { storage })
})

// --- Hero theo ngữ cảnh ---

test('hero, người mới: "Bắt đầu với Bubble Sort"; bấm mở Bubble Sort (openCount 1)', async () => {
  const storage = memoryStorage()

  await run(({ document }) => {
    assert.equal(textOf(hero(document)), 'Bắt đầu với Bubble Sort →')

    hero(document).click()

    assert.equal($(document, '#sorting-section').hidden, false)
    assert.equal(stored(storage).topics['sorting:bubble'].openCount, 1)
    assert.ok(document.activeElement === $(document, '#main-content'), 'focus về #main-content')
  }, { storage })
})

test('hero, người cũ: "Tiếp tục: <chủ đề mở gần nhất>"; bấm mở lại chủ đề đó, openCount +1 đúng một lần', async () => {
  const storage = seed(SEEDED)

  await run(({ document }) => {
    assert.equal(textOf(hero(document)), 'Tiếp tục: Bubble Sort →')

    hero(document).click()

    assert.equal($(document, '#sorting-section').hidden, false)
    assert.equal(stored(storage).topics['sorting:bubble'].openCount, 4)
    assert.equal(Object.values(stored(storage).topics).reduce((sum, item) => sum + item.openCount, 0), 7)
    assert.ok(document.activeElement === $(document, '#main-content'), 'focus về #main-content')
  }, { storage })
})

test('hero cập nhật theo chủ đề mở gần nhất sau khi mở chủ đề khác', async () => {
  await run(({ document }) => {
    $(document, 'button[data-structure-nav="queue"]').click()
    goTo(document, 'dashboard')

    assert.equal(textOf(hero(document)), 'Tiếp tục: Queue →')
  })
})

test('hero giữ data-dashboard-target="sorting" (test và điều hướng cũ vẫn dùng) và vẫn là .dashboard-primary-button', async () => {
  await run(({ document }) => {
    assert.equal(hero(document).dataset.dashboardTarget, 'sorting')
    assert.ok(hero(document).classList.contains('dashboard-primary-button'))
    assert.equal($(document, '.dashboard-hero h2').textContent.replace(/\s+/g, ' ').trim(), 'Hiểu thuật toán. Làm chủ cấu trúc dữ liệu.')
  })
})

test('hero khi dữ liệu là phiên bản mới hơn hoặc hỏng: vẫn gợi ý Bubble Sort (không có chủ đề nào đáng tin)', async () => {
  for (const storage of [memoryStorage({ initial: FUTURE }), memoryStorage({ initial: '{hỏng' })]) {
    await run(({ document }) => {
      assert.equal(textOf(hero(document)), 'Bắt đầu với Bubble Sort →')
    }, { storage })
  }
})
