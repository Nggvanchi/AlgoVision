import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { initNavigation } from '../src/navigation.js'

// algovision:viewchange mang detail { page, topic }: topic là id chủ đề khi mở màn chi tiết, null ở mọi chỗ khác.
// Tiến độ học tập (progress-store) dựa vào hợp đồng này để biết chủ đề nào vừa được mở.

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

function withNavigation(run) {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    initNavigation(document)

    const log = []
    document.addEventListener('algovision:viewchange', (event) => log.push({ ...event.detail }))

    run({ document, log })
  } finally {
    window.happyDOM.close()
  }
}

const goTo = (document, page) => document.querySelector(`.nav-item[data-page="${page}"]`).click()
const SORTING = ['bubble', 'selection', 'insertion']
const SEARCHING = ['linear', 'binary']
const STRUCTURES = ['array', 'stack', 'queue', 'linked-list', 'bst', 'hash-table', 'graph']

test('đổi trang bằng thanh bên: topic là null và page giữ nguyên', () => {
  withNavigation(({ document, log }) => {
    for (const page of ['sorting', 'searching', 'structures', 'dashboard']) goTo(document, page)
    assert.deepEqual(log, [
      { page: 'sorting', topic: null },
      { page: 'searching', topic: null },
      { page: 'structures', topic: null },
      { page: 'dashboard', topic: null },
    ])
  })
})

test('nút dashboard (data-dashboard-target): topic là null', () => {
  withNavigation(({ document, log }) => {
    document.querySelector('.dashboard-primary-button[data-dashboard-target="sorting"]').click()
    assert.deepEqual(log, [{ page: 'sorting', topic: null }])
  })
})

for (const name of SORTING) {
  test(`mở thẻ Sắp xếp "${name}": đúng một sự kiện, topic = sorting:${name}`, () => {
    withNavigation(({ document, log }) => {
      goTo(document, 'sorting')
      log.length = 0
      document.querySelector(`.algorithm-card[data-algorithm="${name}"]`).click()
      assert.deepEqual(log, [{ page: 'sorting', topic: `sorting:${name}` }])
    })
  })
}

test('Quay lại từ chi tiết Sắp xếp: topic là null', () => {
  withNavigation(({ document, log }) => {
    goTo(document, 'sorting')
    document.querySelector('.algorithm-card[data-algorithm="selection"]').click()
    log.length = 0
    document.querySelector('[data-back-to-sorting-algorithms]').click()
    assert.deepEqual(log, [{ page: 'sorting', topic: null }])
  })
})

for (const name of SEARCHING) {
  test(`mở thẻ Tìm kiếm "${name}": đúng một sự kiện, topic = searching:${name}`, () => {
    withNavigation(({ document, log }) => {
      goTo(document, 'searching')
      log.length = 0
      document.querySelector(`[data-search-algorithm="${name}"]`).click()
      assert.deepEqual(log, [{ page: 'searching', topic: `searching:${name}` }])
    })
  })
}

test('Quay lại từ chi tiết Tìm kiếm: topic là null', () => {
  withNavigation(({ document, log }) => {
    goTo(document, 'searching')
    document.querySelector('[data-search-algorithm="binary"]').click()
    log.length = 0
    document.querySelector('[data-back-to-search-algorithms]').click()
    assert.deepEqual(log, [{ page: 'searching', topic: null }])
  })
})

test('click thẻ Tìm kiếm: sự kiện change của #search-algorithm đến TRƯỚC viewchange (initProgress dựa vào thứ tự này)', () => {
  withNavigation(({ document }) => {
    goTo(document, 'searching')
    const order = []
    document.querySelector('#search-algorithm').addEventListener('change', () => order.push('change'))
    document.addEventListener('algovision:viewchange', () => order.push('viewchange'))
    document.querySelector('[data-search-algorithm="binary"]').click()
    assert.deepEqual(order, ['change', 'viewchange'])
  })
})

for (const name of STRUCTURES) {
  test(`mở thẻ cấu trúc "${name}": đúng một sự kiện, topic = structure:${name}`, () => {
    withNavigation(({ document, log }) => {
      goTo(document, 'structures')
      log.length = 0
      document.querySelector(`[data-structure-target="${name}"]`).click()
      assert.deepEqual(log, [{ page: 'structures', topic: `structure:${name}` }])
    })
  })
}

test('Quay lại từ chi tiết cấu trúc dữ liệu: topic là null', () => {
  withNavigation(({ document, log }) => {
    goTo(document, 'structures')
    document.querySelector('[data-structure-target="bst"]').click()
    log.length = 0
    document.querySelector('#bst-section [data-back-to-structures]').click()
    assert.deepEqual(log, [{ page: 'structures', topic: null }])
  })
})

test('đổi sang trang khác khi đang ở chi tiết một chủ đề: topic là null', () => {
  withNavigation(({ document, log }) => {
    goTo(document, 'structures')
    document.querySelector('[data-structure-target="graph"]').click()
    log.length = 0
    goTo(document, 'sorting')
    assert.deepEqual(log, [{ page: 'sorting', topic: null }])
  })
})

test('cùng một thẻ mở lại sau khi quay về thư viện: phát lại sự kiện với cùng topic', () => {
  withNavigation(({ document, log }) => {
    goTo(document, 'structures')
    const card = document.querySelector('[data-structure-target="stack"]')
    card.click()
    document.querySelector('#stack-section [data-back-to-structures]').click()
    card.click()
    assert.deepEqual(log.map((detail) => detail.topic), [null, 'structure:stack', null, 'structure:stack'])
  })
})

test('click thẻ cấu trúc khi không ở trang Cấu trúc dữ liệu: không phát sự kiện', () => {
  withNavigation(({ document, log }) => {
    document.querySelector('[data-structure-target="bst"]').click()
    assert.deepEqual(log, [])
  })
})

test('mọi sự kiện đều có đủ khóa page và topic (topic là null chứ không bị thiếu)', () => {
  withNavigation(({ document, log }) => {
    goTo(document, 'sorting')
    document.querySelector('.algorithm-card[data-algorithm="bubble"]').click()
    document.querySelector('[data-back-to-sorting-algorithms]').click()
    goTo(document, 'dashboard')
    assert.ok(log.length >= 4)
    for (const detail of log) {
      assert.deepEqual(Object.keys(detail).sort(), ['page', 'topic'])
    }
  })
})

test('12 thẻ trong template cho đúng 12 topic khác nhau theo dạng loại:tên', () => {
  withNavigation(({ document, log }) => {
    for (const name of SORTING) {
      goTo(document, 'sorting')
      document.querySelector(`.algorithm-card[data-algorithm="${name}"]`).click()
    }
    for (const name of SEARCHING) {
      goTo(document, 'searching')
      document.querySelector(`[data-search-algorithm="${name}"]`).click()
    }
    for (const name of STRUCTURES) {
      goTo(document, 'structures')
      document.querySelector(`[data-structure-target="${name}"]`).click()
    }
    const topics = log.map((detail) => detail.topic).filter((topic) => topic !== null)
    assert.equal(new Set(topics).size, 12)
    assert.equal(document.querySelectorAll('.algorithm-card[data-algorithm]').length, SORTING.length)
    assert.equal(document.querySelectorAll('[data-search-algorithm]').length, SEARCHING.length)
    assert.equal(document.querySelectorAll('[data-structure-target]').length, STRUCTURES.length)
  })
})
