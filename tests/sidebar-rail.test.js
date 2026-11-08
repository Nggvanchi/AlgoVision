import test from 'node:test'
import assert from 'node:assert/strict'

import { withFullApp } from './helpers/app-dom.js'
import { createFakeMatchMedia } from './helpers/fake-media.js'
import { readStyle, parseStylesheet } from './helpers/css-tokens.js'
import * as sidebarModule from '../src/sidebar.js'

// Redesign R3: rail 72px TỰ ĐỘNG ở 768-1279px (Spec mục 11), drawer ở <= 767px, thu gọn bằng tay chỉ ở >= 1280px.
// Bề rộng được giả bằng matchMedia giả theo bề rộng (tests/helpers/fake-media.js).
const layoutOf = (document) => document.querySelector('.app-layout')
const collapseOf = (document) => document.querySelector('#sidebar-collapse')
const toggleOf = (document) => document.querySelector('#sidebar-toggle')
const isCollapsed = (document) => layoutOf(document).classList.contains('is-sidebar-collapsed')
const mouseover = (document, element) => element.dispatchEvent(new document.defaultView.MouseEvent('mouseover', { bubbles: true }))

function withWidth(width, run) {
  const media = createFakeMatchMedia(width)

  return withFullApp((context) => run({ ...context, media }), { matchMedia: media.matchMedia })
}

test('hằng số: DRAWER_BREAKPOINT = 767 và RAIL_RANGE = 768..1279 (đúng khoảng Tablet/Laptop của Spec mục 11)', () => {
  assert.equal(sidebarModule.DRAWER_BREAKPOINT, 767)
  assert.deepEqual(sidebarModule.RAIL_RANGE, { min: 768, max: 1279 })
})

test('initSidebar hỏi đúng hai media query: drawer (max-width: 767px) và rail (min-width: 768px) and (max-width: 1279px)', async () => {
  await withWidth(1280, ({ media }) => {
    assert.ok(media.queries.includes('(max-width: 767px)'), `queries: ${media.queries.join(' | ')}`)
    assert.ok(media.queries.includes('(min-width: 768px) and (max-width: 1279px)'), `queries: ${media.queries.join(' | ')}`)
  })
})

test('CSS khớp hằng số: rail thu gọn trong @media (min-width: 768px), drawer trong @media (max-width: 767px)', () => {
  const sheet = parseStylesheet(readStyle())
  const collapsedMedia = new Set(sheet.rules.filter((rule) => rule.selectors.some((selector) => selector.includes('is-sidebar-collapsed'))).map((rule) => rule.media))
  const drawerRule = sheet.rules.find((rule) => rule.selectors.includes('.sidebar.is-open'))

  assert.deepEqual([...collapsedMedia], [`@media (min-width: ${sidebarModule.RAIL_RANGE.min}px)`])
  assert.equal(drawerRule?.media, `@media (max-width: ${sidebarModule.DRAWER_BREAKPOINT}px)`)
})

test('rail bật/tắt theo bề rộng: 1280 mở rộng; 1279 và 768 thu gọn; 767 là drawer (không thu gọn); trở lại 1280 mở rộng', async () => {
  await withWidth(1280, ({ document, media, sidebar }) => {
    assert.equal(isCollapsed(document), false)
    assert.equal(collapseOf(document).getAttribute('aria-expanded'), 'true')

    media.setWidth(1279)
    assert.equal(isCollapsed(document), true, '1279 thu gọn')
    assert.equal(sidebar.isCollapsed(), true)

    media.setWidth(768)
    assert.equal(isCollapsed(document), true, '768 vẫn thu gọn')

    media.setWidth(767)
    assert.equal(isCollapsed(document), false, '767 là drawer, không thu gọn')

    media.setWidth(1280)
    assert.equal(isCollapsed(document), false)
    assert.equal(collapseOf(document).getAttribute('aria-expanded'), 'true')
  })
})

test('khởi tạo ở 1024px: thu gọn ngay, aria-expanded="false", nhãn "Mở rộng thanh bên"', async () => {
  await withWidth(1024, ({ document }) => {
    assert.equal(isCollapsed(document), true)
    assert.equal(collapseOf(document).getAttribute('aria-expanded'), 'false')
    assert.equal(collapseOf(document).getAttribute('aria-label'), 'Mở rộng thanh bên')
  })
})

test('thu gọn thủ công (>= 1280) được nhớ trong bộ nhớ qua 1279 <-> 1280, aria-expanded luôn đúng', async () => {
  await withWidth(1280, ({ document, media }) => {
    collapseOf(document).click()
    assert.equal(isCollapsed(document), true)

    media.setWidth(1279)
    assert.equal(isCollapsed(document), true, 'rail')
    assert.equal(collapseOf(document).getAttribute('aria-expanded'), 'false')

    media.setWidth(1280)
    assert.equal(isCollapsed(document), true, 'quay lại 1280 vẫn thu gọn vì người dùng đã thu gọn')
    assert.equal(collapseOf(document).getAttribute('aria-expanded'), 'false')
    assert.equal(collapseOf(document).getAttribute('aria-label'), 'Mở rộng thanh bên')

    collapseOf(document).click()
    assert.equal(isCollapsed(document), false)
    assert.equal(collapseOf(document).getAttribute('aria-expanded'), 'true')
  })
})

test('không thu gọn thủ công: rail không "dính" lại sau khi rộng ra (1280 -> 1024 -> 1280 mở rộng)', async () => {
  await withWidth(1280, ({ document, media }) => {
    media.setWidth(1024)
    assert.equal(isCollapsed(document), true)
    media.setWidth(1280)
    assert.equal(isCollapsed(document), false)
  })
})

test('toggleCollapse bằng mã khi đang ở rail: vẫn thu gọn (rail), nhưng nhớ ý định thủ công để dùng khi quay lại >= 1280', async () => {
  await withWidth(1024, ({ document, media, sidebar }) => {
    sidebar.toggleCollapse()
    assert.equal(isCollapsed(document), true)

    media.setWidth(1280)
    assert.equal(isCollapsed(document), true, 'ý định thủ công được nhớ')

    sidebar.toggleCollapse()
    assert.equal(isCollapsed(document), false)
  })
})

test('kéo rộng khi drawer đang mở (600 -> 1280): drawer đóng, inert được gỡ, focus không bị kéo về ☰', async () => {
  await withWidth(600, ({ document, media }) => {
    toggleOf(document).click()
    assert.equal(document.querySelector('#sidebar').classList.contains('is-open'), true)

    media.setWidth(1280)

    assert.equal(document.querySelector('#sidebar').classList.contains('is-open'), false)
    assert.equal(document.querySelector('#main-content').hasAttribute('inert'), false)
    assert.ok(document.activeElement !== toggleOf(document), 'không cướp focus về ☰')
  })
})

test('kéo rộng khi drawer đang mở sang dải rail (600 -> 1000): drawer đóng và sidebar thu gọn thành rail', async () => {
  await withWidth(600, ({ document, media }) => {
    toggleOf(document).click()
    media.setWidth(1000)

    assert.equal(document.querySelector('#sidebar').classList.contains('is-open'), false)
    assert.equal(isCollapsed(document), true)
  })
})

test('nút thu gọn đang giữ focus khi bước vào dải rail: focus chuyển sang mục điều hướng đang mở, không rơi về body', async () => {
  await withWidth(1280, ({ document, media }) => {
    document.querySelector('.nav-item[data-page="sorting"]').click()
    collapseOf(document).focus()
    assert.ok(document.activeElement === collapseOf(document), 'điều kiện đầu: nút thu gọn đang có focus')

    media.setWidth(1100)

    assert.ok(document.activeElement !== document.body, 'focus không được rơi về body')
    assert.ok(document.activeElement !== collapseOf(document), 'focus rời khỏi nút sắp bị ẩn')
    assert.ok(document.activeElement === document.querySelector('.nav-item[data-page="sorting"]'), 'focus sang mục đang mở (Sắp xếp)')
  })
})

test('nút thu gọn không giữ focus khi vào rail: focus của phần tử khác không bị động tới', async () => {
  await withWidth(1280, ({ document, media }) => {
    const other = document.querySelector('.nav-item[data-page="searching"]')

    other.focus()
    media.setWidth(1100)

    assert.ok(document.activeElement === other, 'focus giữ nguyên ở mục đang focus')
  })
})

test('tooltip hiện ở rail do matchMedia (không cần bấm thu gọn): rê vào mục thì tooltip có nhãn và .is-visible; ở >= 1280 mở rộng thì không', async () => {
  await withWidth(1100, ({ document, media }) => {
    const item = document.querySelector('.nav-item[data-page="searching"]')
    const tooltip = document.querySelector('.sidebar-tooltip')

    mouseover(document, item)
    assert.equal(tooltip.classList.contains('is-visible'), true)
    assert.equal(tooltip.textContent, 'Tìm kiếm')

    media.setWidth(1280)
    assert.equal(tooltip.classList.contains('is-visible'), false, 'đổi bề rộng ẩn tooltip')

    mouseover(document, item)
    assert.equal(tooltip.classList.contains('is-visible'), false, 'mở rộng thì không có tooltip')
  })
})

test('rail không đụng drawer: ở 767 nút ☰ mở được drawer; ở rail (1000) openDrawer không mở', async () => {
  await withWidth(767, ({ document, media, sidebar }) => {
    sidebar.openDrawer()
    assert.equal(sidebar.isDrawerOpen(), true)
    sidebar.closeDrawer()

    media.setWidth(1000)
    sidebar.openDrawer()
    assert.equal(sidebar.isDrawerOpen(), false, 'ở rail không có drawer')
  })
})

test('CSS: trong dải rail (768-1279) nút thu gọn và chân sidebar bị ẩn; ngoài dải thì không có luật ẩn này', () => {
  const sheet = parseStylesheet(readStyle())
  const hiding = sheet.rules.filter((rule) => rule.media === '@media (min-width: 768px) and (max-width: 1279px)'
    && rule.selectors.some((selector) => selector === '.sidebar-footer'))

  assert.equal(hiding.length, 1, 'đúng một luật ẩn .sidebar-footer trong dải rail')
  assert.equal(hiding[0].declarations.find((declaration) => declaration.property === 'display')?.value, 'none')
})

test('sidebar.js không dùng kho lưu trữ nào của trình duyệt cho trạng thái thu gọn (bộ nhớ của phiên)', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/sidebar.js', import.meta.url), 'utf8')

  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/)
})
