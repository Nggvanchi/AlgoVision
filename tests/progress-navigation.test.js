import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { isShown, withFullApp } from './helpers/app-dom.js'
import { memoryStorage } from './helpers/memory-storage.js'

// Redesign Phase 3b: trang "Tiến độ học tập" là trang thứ năm của navigation.js. Vào trang chỉ đổi màn hình (đúng một
// viewchange, topic null), không ghi tiến độ; mô phỏng đang chạy vẫn tự tạm dừng như khi sang mọi trang khác.
const BASE_TITLE = 'AlgoVision - Trực quan hóa thuật toán'
const textOf = (element) => element.textContent.replace(/\s+/g, ' ').trim()
const run = (callback, options = {}) => withFullApp(callback, { title: BASE_TITLE, storage: memoryStorage(), ...options })
const goTo = (document, page) => document.querySelector(`.nav-item[data-page="${page}"]`).click()

function collectViewChanges(document) {
  const events = []
  document.addEventListener('algovision:viewchange', (event) => events.push(event.detail))
  return events
}

test('mục "Tiến độ học tập" là .nav-item thứ hai, ngay dưới "Tổng quan", cùng <ul> đầu của sidebar (không nhóm mới, không mục trùng)', async () => {
  await run(({ document }) => {
    const items = document.querySelectorAll('.nav-item[data-page="progress"]')
    assert.equal(items.length, 1)

    const item = items[0]
    const list = item.closest('ul')
    const first = document.querySelector('.sidebar-nav ul.nav-list')

    assert.equal(list, first, 'cùng ul đầu tiên với Tổng quan')
    assert.deepEqual([...list.children].map((li) => li.querySelector('.nav-item').dataset.page), ['dashboard', 'progress'])
    assert.equal(item.tagName, 'BUTTON')
    assert.equal(item.getAttribute('type'), 'button')
    assert.equal(textOf(item.querySelector('.nav-label')), 'Tiến độ học tập')
    assert.equal(item.querySelector('.nav-icon use').getAttribute('href'), '#icon-progress')
    assert.equal(document.querySelectorAll('.sidebar .section-label').length, 2, 'không thêm nhóm mới')
  })
})

test('#progress-section có sẵn trong template, ẩn mặc định, đúng một h2 "Tiến độ học tập"', async () => {
  await run(({ document }) => {
    const section = document.querySelector('#progress-section')

    assert.ok(section !== null)
    assert.equal(section.closest('main#main-content') !== null, true)
    assert.equal(section.hidden, true)
    assert.deepEqual([...section.querySelectorAll('h2')].map(textOf), ['Tiến độ học tập'])
  })
})

test('bấm mục Tiến độ: chỉ #progress-section hiện, mọi section khác (kể cả .page-heading) ẩn', async () => {
  await run(({ document }) => {
    goTo(document, 'progress')

    assert.equal(document.querySelector('#progress-section').hidden, false)
    assert.equal(document.querySelector('.page-heading').hidden, true, 'tiêu đề chung của thư viện không hiện ở trang Tiến độ')

    const others = [
      '#dashboard-section', '.algorithm-section', '#sorting-section', '#search-algorithm-library', '#search-section',
      '#structure-library', ...['array', 'stack', 'queue', 'linked-list', 'bst', 'hash-table', 'graph'].map((name) => `#${name}-section`),
    ]

    for (const selector of others) assert.equal(document.querySelector(selector).hidden, true, `${selector} phải ẩn`)
  })
})

test('vào trang Tiến độ phát đúng MỘT viewchange {page:"progress", topic:null} và KHÔNG ghi tiến độ', async () => {
  const storage = memoryStorage()
  await run(({ document }) => {
    const events = collectViewChanges(document)

    goTo(document, 'progress')

    assert.deepEqual(events, [{ page: 'progress', topic: null }])
    assert.equal(storage.setCalls, 0)
    assert.equal(storage.data.size, 0)
  }, { storage })
})

test('mở lại trang Tiến độ nhiều lần vẫn không ghi gì; rời đi và vào lại phát thêm đúng một sự kiện mỗi lần', async () => {
  const storage = memoryStorage()
  await run(({ document }) => {
    const events = collectViewChanges(document)

    goTo(document, 'progress')
    goTo(document, 'dashboard')
    goTo(document, 'progress')

    assert.deepEqual(events.map((detail) => detail.page), ['progress', 'dashboard', 'progress'])
    assert.equal(storage.setCalls, 0)
  }, { storage })
})

test('breadcrumb "Không gian học tập / Tiến độ học tập" (mục cuối đậm) và document.title "Tiến độ học tập - AlgoVision"', async () => {
  await run(({ document }) => {
    goTo(document, 'progress')

    const crumbs = [...document.querySelectorAll('.topbar .breadcrumb > li')].map(textOf)

    assert.deepEqual(crumbs, ['Không gian học tập', 'Tiến độ học tập'])
    assert.equal(document.querySelectorAll('.topbar .breadcrumb strong').length, 1)
    assert.equal(document.title, 'Tiến độ học tập - AlgoVision')
  })
})

test('aria-current="page" đúng MỘT phần tử (mục Tiến độ), mục này active; Tổng quan thì không', async () => {
  await run(({ document }) => {
    goTo(document, 'progress')

    const current = [...document.querySelectorAll('[aria-current]')]

    assert.equal(current.length, 1)
    assert.equal(current[0].dataset.page, 'progress')
    assert.equal(current[0].getAttribute('aria-current'), 'page')
    assert.equal(current[0].classList.contains('active'), true)
    assert.equal(document.querySelector('.nav-item[data-page="dashboard"]').classList.contains('active'), false)
  })
})

test('ở trang Tiến độ chỉ có đúng một h2 hiển thị, và nó là "Tiến độ học tập"', async () => {
  await run(({ document }) => {
    goTo(document, 'progress')

    const visible = [...document.querySelectorAll('h2')].filter(isShown)

    assert.deepEqual(visible.map(textOf), ['Tiến độ học tập'])
  })
})

test('Sorting đang chạy tự tạm dừng khi sang trang Tiến độ (không reset)', async () => {
  await run(({ document, scheduler }) => {
    goTo(document, 'sorting')
    document.querySelector('.algorithm-card[data-algorithm="bubble"]').click()
    document.querySelector('#run-sort').click()
    scheduler.advance(650)
    assert.ok(scheduler.pendingCount > 0)

    goTo(document, 'progress')

    assert.equal(scheduler.pendingCount, 0)
    assert.equal(document.querySelector('#run-sort').textContent, 'Tiếp tục')
  })
})

test('từ trang Tiến độ quay lại các trang khác: mỗi trang hiện đúng section của nó và .page-heading hiện lại ở thư viện', async () => {
  await run(({ document }) => {
    goTo(document, 'progress')
    goTo(document, 'sorting')
    assert.equal(document.querySelector('#progress-section').hidden, true)
    assert.equal(document.querySelector('.algorithm-section').hidden, false)
    assert.equal(document.querySelector('.page-heading').hidden, false)

    goTo(document, 'progress')
    goTo(document, 'dashboard')
    assert.equal(document.querySelector('#progress-section').hidden, true)
    assert.equal(document.querySelector('#dashboard-section').hidden, false)
  })
})

test('mục con của sidebar mở cấu trúc từ trang Tiến độ: section Tiến độ ẩn, đúng một viewchange có topic', async () => {
  await run(({ document }) => {
    goTo(document, 'progress')
    const events = collectViewChanges(document)

    document.querySelector('button[data-structure-nav="bst"]').click()

    assert.equal(document.querySelector('#progress-section').hidden, true)
    assert.equal(document.querySelector('#bst-section').hidden, false)
    assert.deepEqual(events, [{ page: 'structures', topic: 'structure:bst' }])
  })
})

test('biểu tượng icon-progress là symbol trong sprite, nét vẽ theo mẫu (viewBox 24)', async () => {
  const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

  assert.match(template, /<symbol id="icon-progress" viewBox="0 0 24 24">/)
})
