import test from 'node:test'
import assert from 'node:assert/strict'

import { SCREENS, withFullApp } from './helpers/app-dom.js'
import { readStyle, parseStylesheet } from './helpers/css-tokens.js'

// Redesign Phase 2b + R3: .topbar có breadcrumb ĐỘNG (chữ thường, không liên kết; R3: nằm trong <nav aria-label="Đường dẫn trang">, mục cuối aria-current="page", gốc "AlgoVision") và
// document.title theo màn hình. Nhãn trang là pages[x].title của navigation.js; nhãn chi tiết lấy từ chính DOM (h4 của thẻ thuật
// toán, nhãn mục con của cấu trúc), nên không có danh sách thứ hai. Bảng kỳ vọng dưới đây là bảng đặc tả của test, viết tay.
const ROOT = 'AlgoVision'
const BASE_TITLE = 'AlgoVision - Trực quan hóa thuật toán'
const SORTING = 'Thuật toán sắp xếp'
const SEARCHING = 'Thuật toán tìm kiếm'
const STRUCTURES = 'Cấu trúc dữ liệu'

const EXPECTED = {
  dashboard: [ROOT, 'Tổng quan'],
  'sorting-library': [ROOT, SORTING],
  'sorting-detail': [ROOT, SORTING, 'Bubble Sort'],
  'searching-library': [ROOT, SEARCHING],
  'searching-detail': [ROOT, SEARCHING, 'Linear Search'],
  'structures-library': [ROOT, STRUCTURES],
  array: [ROOT, STRUCTURES, 'Array'],
  stack: [ROOT, STRUCTURES, 'Stack'],
  queue: [ROOT, STRUCTURES, 'Queue'],
  'linked-list': [ROOT, STRUCTURES, 'Linked List'],
  bst: [ROOT, STRUCTURES, 'Binary Search Tree'],
  'hash-table': [ROOT, STRUCTURES, 'Hash Table'],
  graph: [ROOT, STRUCTURES, 'Graph'],
  'graph-bfs': [ROOT, STRUCTURES, 'Graph'],
  'graph-dfs': [ROOT, STRUCTURES, 'Graph'],
}

const textOf = (element) => element.textContent.replace(/\s+/g, ' ').trim()
const crumbs = (document) => [...document.querySelectorAll('.topbar .breadcrumb > li')].map(textOf)
const expectedTitle = (name) => (name === 'dashboard' ? BASE_TITLE : `${EXPECTED[name].at(-1)} - AlgoVision`)
const run = (callback, options = {}) => withFullApp(callback, { title: BASE_TITLE, ...options })

test('bảng kỳ vọng phủ đúng 15 màn hình của SCREENS', () => {
  assert.deepEqual(SCREENS.map((screen) => screen.name), Object.keys(EXPECTED))
})

for (const screen of SCREENS) {
  test(`màn hình "${screen.name}": breadcrumb = ${EXPECTED[screen.name].join(' / ')}; mục cuối đậm`, async () => {
    await run(({ document }) => {
      screen.open(document)

      assert.deepEqual(crumbs(document), EXPECTED[screen.name])
      assert.equal(document.querySelectorAll('.topbar .breadcrumb > li:last-child strong').length, 1, 'chỉ mục cuối là <strong>')
      assert.equal(document.querySelectorAll('.topbar .breadcrumb strong').length, 1)
    })
  })

  test(`màn hình "${screen.name}": document.title = "${expectedTitle(screen.name)}"`, async () => {
    await run(({ document }) => {
      screen.open(document)

      assert.equal(document.title, expectedTitle(screen.name))
    })
  })
}

test('nhãn chi tiết lấy từ DOM thật: h4 của thẻ Sắp xếp/Tìm kiếm và nhãn mục con cấu trúc (không gõ cứng trong JS)', async () => {
  await run(({ document }) => {
    const card = document.querySelector('.algorithm-card[data-algorithm="selection"] h4')
    document.querySelector('.nav-item[data-page="sorting"]').click()
    document.querySelector('.algorithm-card[data-algorithm="selection"]').click()
    assert.equal(crumbs(document).at(-1), textOf(card))

    const search = document.querySelector('[data-search-algorithm="binary"] h4')
    document.querySelector('.nav-item[data-page="searching"]').click()
    document.querySelector('[data-search-algorithm="binary"]').click()
    assert.equal(crumbs(document).at(-1), textOf(search))

    for (const subitem of document.querySelectorAll('.nav-subitem')) {
      subitem.click()
      assert.equal(crumbs(document).at(-1), textOf(subitem.querySelector('.nav-label')))
    }
  })
})

test('đổi thuật toán bằng #search-algorithm ngay trong chi tiết Tìm kiếm (không phát viewchange): breadcrumb và title đổi theo', async () => {
  await run(({ document }) => {
    document.querySelector('.nav-item[data-page="searching"]').click()
    document.querySelector('[data-search-algorithm="linear"]').click()

    const log = []
    document.addEventListener('algovision:viewchange', (event) => log.push(event.detail))

    const select = document.querySelector('#search-algorithm')
    select.value = 'binary'
    select.dispatchEvent(new document.defaultView.Event('change', { bubbles: true }))

    assert.equal(crumbs(document).at(-1), 'Binary Search')
    assert.equal(document.title, 'Binary Search - AlgoVision')
    assert.deepEqual(log, [], 'cập nhật breadcrumb không phát viewchange')
  })
})

test('đổi #search-algorithm khi đang ở thư viện Tìm kiếm (chưa vào chi tiết): breadcrumb và title không đổi', async () => {
  await run(({ document }) => {
    document.querySelector('.nav-item[data-page="searching"]').click()

    const select = document.querySelector('#search-algorithm')
    select.value = 'binary'
    select.dispatchEvent(new document.defaultView.Event('change', { bubbles: true }))

    assert.deepEqual(crumbs(document), [ROOT, SEARCHING])
    assert.equal(document.title, `${SEARCHING} - AlgoVision`)
  })
})

test('Quay lại thư viện từ chi tiết: breadcrumb và title trở về mức thư viện; Quay lại thuật toán/tìm kiếm cũng vậy', async () => {
  await run(({ document }) => {
    document.querySelector('.nav-subitem[data-structure-nav="bst"]').click()
    document.querySelector('#bst-section [data-back-to-structures]').click()
    assert.deepEqual(crumbs(document), [ROOT, STRUCTURES])
    assert.equal(document.title, `${STRUCTURES} - AlgoVision`)

    document.querySelector('.nav-item[data-page="sorting"]').click()
    document.querySelector('.algorithm-card[data-algorithm="bubble"]').click()
    document.querySelector('[data-back-to-sorting-algorithms]').click()
    assert.deepEqual(crumbs(document), [ROOT, SORTING])

    document.querySelector('.nav-item[data-page="searching"]').click()
    document.querySelector('[data-search-algorithm="linear"]').click()
    document.querySelector('[data-back-to-search-algorithms]').click()
    assert.deepEqual(crumbs(document), [ROOT, SEARCHING])
  })
})

test('mục con từ trang khác: breadcrumb và title chỉ đổi một lần sang đích, không dừng ở thư viện trung gian', async () => {
  await run(({ document }) => {
    const titles = []
    const observe = () => titles.push(document.title)

    document.addEventListener('algovision:viewchange', observe)
    document.querySelector('.nav-subitem[data-structure-nav="graph"]').click()

    assert.deepEqual(titles, ['Graph - AlgoVision'], 'chỉ một viewchange và title đã đúng ngay khi sự kiện phát ra')
  })
})

test('cập nhật topbar không thêm viewchange: chuỗi sự kiện giữ nguyên như Phase 2', async () => {
  await run(({ document }) => {
    const log = []
    document.addEventListener('algovision:viewchange', (event) => log.push({ ...event.detail }))

    document.querySelector('.nav-item[data-page="structures"]').click()
    document.querySelector('[data-structure-target="stack"]').click()
    document.querySelector('.nav-subitem[data-structure-nav="queue"]').click()
    document.querySelector('#queue-section [data-back-to-structures]').click()

    assert.deepEqual(log, [
      { page: 'structures', topic: null },
      { page: 'structures', topic: 'structure:stack' },
      { page: 'structures', topic: 'structure:queue' },
      { page: 'structures', topic: null },
    ])
  })
})

test('.topbar vẫn là <header> trong <main>; không còn huy hiệu "Đang phát triển" (.status-badge, .status-dot) và chữ "Trực quan hóa" tĩnh', async () => {
  await run(({ document }) => {
    const topbar = document.querySelector('main > .topbar')

    assert.ok(topbar !== null && topbar.tagName === 'HEADER', '.topbar phải là <header> con của <main>')
    assert.equal(document.querySelectorAll('.status-badge, .status-dot').length, 0)
    assert.equal(textOf(topbar).includes('Đang phát triển'), false)
    assert.equal(document.querySelectorAll('.topbar').length, 1)
  })
})

test('breadcrumb: <nav aria-label="Đường dẫn trang"> chứa <ol> chữ thường (không liên kết/nút), aria-current="page" đúng ở mục cuối', async () => {
  await run(({ document }) => {
    for (const screen of SCREENS) {
      screen.open(document)

      const list = document.querySelector('.topbar .breadcrumb')

      const nav = list.parentElement

      assert.equal(list.tagName, 'OL')
      assert.ok(nav.tagName === 'NAV' && nav.closest('.topbar') !== null, `${screen.name}: <ol> phải nằm trực tiếp trong <nav> của .topbar`)
      assert.equal(nav.getAttribute('aria-label'), 'Đường dẫn trang')
      assert.equal(list.querySelectorAll('a, button, [tabindex], [role]').length, 0, `${screen.name}: breadcrumb chỉ có chữ`)
      assert.equal(document.querySelectorAll('.topbar [aria-current]').length, 1, `${screen.name}: đúng một aria-current trong breadcrumb`)
      assert.ok(list.querySelector('li:last-child').getAttribute('aria-current') === 'page', `${screen.name}: aria-current="page" phải ở mục cuối`)
      assert.equal(document.querySelectorAll('nav, [role="navigation"]').length, 2, 'hai landmark nav: Điều hướng chính và Đường dẫn trang')
      assert.equal(document.querySelectorAll('#sidebar [aria-current]').length, 1, 'sidebar vẫn đúng một aria-current')
    }
  })
})

test('dấu "/" giữa các mục do CSS vẽ (không có trong DOM) và ẩn khỏi trình đọc màn hình', async () => {
  await run(({ document }) => {
    document.querySelector('.nav-subitem[data-structure-nav="bst"]').click()

    assert.equal(textOf(document.querySelector('.topbar .breadcrumb')).includes('/'), false, 'dấu phân cách không nằm trong chữ')
  })
})

test('breadcrumb: luật CSS vẽ dấu phân cách bằng ::before của li + li (content "/", aria không đọc được vì là nội dung sinh bởi CSS)', () => {
  const sheet = parseStylesheet(readStyle())
  const separator = sheet.rules.find((item) => item.selectors.includes('.breadcrumb li + li::before'))

  assert.ok(separator !== undefined, 'thiếu luật .breadcrumb li + li::before')
  assert.match(separator.declarations.find((declaration) => declaration.property === 'content')?.value ?? '', /^['"]\/['"] \/ ['"]['"]$/, 'content: "/" / "" (văn bản thay thế rỗng: trình đọc màn hình không đọc dấu)')
})

test('CSS không còn luật của huy hiệu .status-badge và .status-dot (mã chết)', () => {
  const sheet = parseStylesheet(readStyle())

  assert.equal(sheet.rules.some((item) => item.selectors.some((selector) => selector.includes('.status-badge') || selector.includes('.status-dot'))), false)
})

test('sau khi gọi lại điều hướng nhiều lần, breadcrumb không nhân đôi mục (luôn đúng số mục của màn hình)', async () => {
  await run(({ document }) => {
    for (let round = 0; round < 3; round++) {
      for (const screen of SCREENS) screen.open(document)
    }

    const screenNamed = (name) => SCREENS.find((screen) => screen.name === name)

    screenNamed('dashboard').open(document)
    assert.deepEqual(crumbs(document), EXPECTED.dashboard)
    screenNamed('sorting-detail').open(document)
    assert.deepEqual(crumbs(document), EXPECTED['sorting-detail'])
  })
})

test('src/navigation.js đặt document.title và breadcrumb ở cùng chỗ với notifyViewChange (một nơi cập nhật, không phát sự kiện mới)', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/navigation.js', import.meta.url), 'utf8')

  assert.match(source, /document\.title\s*=/)
  assert.equal((source.match(/algovision:viewchange/g) ?? []).length, 1, 'đúng một nơi phát algovision:viewchange')
})
