import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

import { initNavigation } from '../src/navigation.js'
import { initSorting } from '../src/sorting.js'
import { initSearching } from '../src/searching.js'
import { createFakeScheduler } from './helpers/fake-scheduler.js'

const template = await readFile(
  new URL('../public/templates/app.html', import.meta.url),
  'utf8',
)

const SORT_DELAY = 650
const SEARCH_DELAY = 600

async function withApp(run) {
  const window = new Window()
  const { document } = window
  const scheduler = createFakeScheduler()

  document.body.innerHTML = template

  const previousDocument = globalThis.document
  const previousWindow = globalThis.window

  globalThis.document = document
  globalThis.window = window

  try {
    initNavigation(document)
    initSorting({ scheduler })
    initSearching({ scheduler, initialNumbers: [10, 20, 30, 40, 50, 60, 70, 80, 90] })

    await run({ document, scheduler })
  } finally {
    document.querySelector('#reset-sort')?.click()
    document.querySelector('#search-pause')?.click()
    window.happyDOM.abort()

    if (previousDocument === undefined) {
      delete globalThis.document
    } else {
      globalThis.document = previousDocument
    }

    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
}

function openPage(document, page) {
  document.querySelector(`.nav-item[data-page="${page}"]`).click()
}

function startSorting(document, scheduler) {
  openPage(document, 'sorting')
  document.querySelector('.algorithm-card[data-algorithm="bubble"]').click()
  document.querySelector('#run-sort').click()
  scheduler.advance(SORT_DELAY)
}

function startSearching(document, scheduler) {
  openPage(document, 'searching')
  document.querySelector('[data-search-algorithm="linear"]').click()

  const target = document.querySelector('#search-target')
  target.value = '90'
  target.dispatchEvent(new document.defaultView.Event('change', { bubbles: true }))

  document.querySelector('#search-run').click()
  scheduler.advance(SEARCH_DELAY)
}

test('Sorting tạm dừng (không reset) khi bấm quay lại danh sách thuật toán', async () => {
  await withApp(({ document, scheduler }) => {
    startSorting(document, scheduler)

    const stepCount = document.querySelector('#step-count')
    const stepBefore = stepCount.textContent

    document.querySelector('[data-back-to-sorting-algorithms]').click()

    assert.equal(scheduler.pendingCount, 0)
    assert.equal(document.querySelector('#run-sort').textContent, 'Tiếp tục')

    scheduler.advance(SORT_DELAY * 5)
    assert.equal(stepCount.textContent, stepBefore)
    assert.equal(stepBefore.startsWith('2 / '), true)
  })
})

test('Sorting tạm dừng khi chuyển sang trang khác', async () => {
  await withApp(({ document, scheduler }) => {
    startSorting(document, scheduler)

    openPage(document, 'dashboard')

    assert.equal(scheduler.pendingCount, 0)
    assert.equal(document.querySelector('#run-sort').textContent, 'Tiếp tục')
  })
})

test('Searching tạm dừng (không reset) khi bấm quay lại danh sách thuật toán', async () => {
  await withApp(({ document, scheduler }) => {
    startSearching(document, scheduler)

    const comparisons = document.querySelector('#search-comparisons')
    assert.equal(comparisons.textContent, '1')

    document.querySelector('[data-back-to-search-algorithms]').click()

    assert.equal(scheduler.pendingCount, 0)
    assert.equal(document.querySelector('#search-run').textContent, 'Tiếp tục')

    scheduler.advance(SEARCH_DELAY * 5)
    assert.equal(comparisons.textContent, '1')
  })
})

test('Searching tạm dừng khi chuyển sang trang khác', async () => {
  await withApp(({ document, scheduler }) => {
    startSearching(document, scheduler)

    openPage(document, 'structures')

    assert.equal(scheduler.pendingCount, 0)
    assert.equal(document.querySelector('#search-run').textContent, 'Tiếp tục')
  })
})

test('mô phỏng đang hiển thị không bị tạm dừng khi có sự kiện đổi màn hình', async () => {
  await withApp(({ document, scheduler }) => {
    startSorting(document, scheduler)

    document.dispatchEvent(
      new document.defaultView.CustomEvent('algovision:viewchange'),
    )

    assert.equal(scheduler.pendingCount, 1)
    assert.equal(document.querySelector('#pause-sort').disabled, false)
  })
})

test('navigation phát sự kiện algovision:viewchange khi đổi màn hình', async () => {
  await withApp(({ document }) => {
    const pages = []

    document.addEventListener('algovision:viewchange', (event) => {
      pages.push(event.detail?.page)
    })

    openPage(document, 'sorting')
    document.querySelector('.algorithm-card[data-algorithm="bubble"]').click()
    document.querySelector('[data-back-to-sorting-algorithms]').click()
    openPage(document, 'dashboard')

    assert.deepEqual(pages, ['sorting', 'sorting', 'sorting', 'dashboard'])
  })
})
