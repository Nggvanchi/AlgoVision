import test from 'node:test'
import assert from 'node:assert/strict'

import { withFullApp } from './helpers/app-dom.js'
import { readStyle, parseStylesheet } from './helpers/css-tokens.js'

// Redesign Phase 2b: icon SVG nội tuyến nét mảnh thay glyph ký tự (9/11 glyph cũ rơi về font hệ thống). Một sprite
// <symbol> ở đầu template; mỗi nơi dùng là <svg aria-hidden focusable="false"><use href="#icon-..."/></svg>. Mục con do JS sinh
// chỉ ghép id từ data-structure-target, nên danh sách icon không có bản thứ hai trong JS.
const css = readStyle()
const sheet = parseStylesheet(css)

const STRUCTURES = ['array', 'stack', 'queue', 'linked-list', 'bst', 'hash-table', 'graph']
const SYMBOLS = [
  'icon-home', 'icon-sort', 'icon-search', 'icon-structures',
  ...STRUCTURES.map((target) => `icon-structure-${target}`),
  'icon-chevron', 'icon-menu', 'icon-logo',
]
const NAV_ICON_OWNERS = [
  { name: 'Tổng quan', selector: '.nav-item[data-page="dashboard"]', symbol: 'icon-home' },
  { name: 'Sắp xếp', selector: '.nav-item[data-page="sorting"]', symbol: 'icon-sort' },
  { name: 'Tìm kiếm', selector: '.nav-item[data-page="searching"]', symbol: 'icon-search' },
  { name: 'Tất cả cấu trúc', selector: '.nav-item[data-page="structures"]', symbol: 'icon-structures' },
  ...STRUCTURES.map((target) => ({ name: target, selector: `.nav-subitem[data-structure-nav="${target}"]`, symbol: `icon-structure-${target}` })),
]

const hrefOf = (use) => use?.getAttribute('href') ?? null
const symbolOf = (document, id) => document.querySelector(`symbol[id="${id}"]`)

test('đúng một sprite .icon-sprite: <svg> aria-hidden, focusable="false", không focus được, nằm trong .app-layout', async () => {
  await withFullApp(({ document }) => {
    const sprites = document.querySelectorAll('.icon-sprite')

    assert.equal(sprites.length, 1)
    assert.equal(sprites[0].tagName.toLowerCase(), 'svg')
    assert.equal(sprites[0].getAttribute('aria-hidden'), 'true')
    assert.equal(sprites[0].getAttribute('focusable'), 'false')
    assert.ok(sprites[0].closest('.app-layout') !== null)
    assert.equal(sprites[0].hasAttribute('hidden'), false, 'không dùng hidden: luật [hidden] toàn cục là display: none')
  })
})

test('sprite chỉ chứa <symbol> và mọi id symbol là duy nhất, trong toàn tài liệu không id nào trùng', async () => {
  await withFullApp(({ document }) => {
    const symbols = [...document.querySelectorAll('.icon-sprite > symbol')]
    const ids = symbols.map((symbol) => symbol.id)

    assert.equal(document.querySelectorAll('.icon-sprite > *:not(symbol)').length, 0)
    assert.equal(new Set(ids).size, ids.length, `id symbol trùng: ${ids.join(', ')}`)

    const everyId = [...document.querySelectorAll('[id]')].map((element) => element.id)
    assert.equal(new Set(everyId).size, everyId.length, 'có id trùng trong template')
  })
})

for (const id of SYMBOLS) {
  test(`symbol #${id}: có viewBox 0 0 24 24 và ít nhất một hình vẽ, không chữ, không màu gõ chết`, async () => {
    await withFullApp(({ document }) => {
      const symbol = symbolOf(document, id)

      assert.ok(symbol !== null, `thiếu <symbol id="${id}"> trong sprite`)
      assert.equal(symbol.getAttribute('viewBox'), '0 0 24 24')
      assert.ok(symbol.querySelectorAll('path, circle, rect, ellipse, line, polyline').length >= 1, 'symbol rỗng')
      assert.equal(symbol.textContent.trim(), '', 'icon không mang chữ')
      assert.ok(!/(stroke|fill)="(?!none|currentColor)/i.test(symbol.innerHTML), 'màu phải đến từ currentColor của CSS, không gõ chết trong symbol')
    })
  })
}

test('14 symbol có hình vẽ KHÁC nhau từng đôi một (không hai mục nào dùng cùng một hình)', async () => {
  await withFullApp(({ document }) => {
    const shapes = new Map()

    for (const id of SYMBOLS) {
      // Sắp xếp các hình con: hai symbol vẽ cùng tập hình theo thứ tự khác nhau vẫn là CÙNG một hình.
      const shape = [...(symbolOf(document, id)?.children ?? [])].map((child) => child.outerHTML.replace(/\s+/g, ' ').trim()).sort().join('')

      assert.ok(shape !== '', `${id} rỗng hoặc thiếu`)
      assert.ok(!shapes.has(shape), `${id} trùng hình với ${shapes.get(shape)}`)
      shapes.set(shape, id)
    }
  })
})

for (const owner of NAV_ICON_OWNERS) {
  test(`icon của "${owner.name}": <svg aria-hidden focusable="false"> với <use href="#${owner.symbol}"> trong .nav-icon, không chữ ký tự`, async () => {
    await withFullApp(({ document }) => {
      const item = document.querySelector(owner.selector)

      assert.ok(item !== null, `thiếu ${owner.selector}`)

      const icon = item.querySelector('.nav-icon')
      const svg = icon?.querySelector('svg')

      assert.ok(svg !== null && svg !== undefined, 'thiếu <svg> trong .nav-icon')
      assert.equal(icon.getAttribute('aria-hidden'), 'true')
      assert.equal(svg.getAttribute('focusable'), 'false')
      assert.equal(hrefOf(svg.querySelector('use')), `#${owner.symbol}`)
      assert.equal(icon.textContent.trim(), '', 'không còn glyph ký tự (font hệ thống)')
      assert.ok(symbolOf(document, owner.symbol) !== null, `symbol #${owner.symbol} phải tồn tại`)
    })
  })
}

test('11 icon của mục điều hướng dùng 11 symbol khác nhau, không trùng với logo; Tổng quan và logo là hai hình khác nhau', async () => {
  await withFullApp(({ document }) => {
    const hrefs = NAV_ICON_OWNERS.map((owner) => hrefOf(document.querySelector(`${owner.selector} .nav-icon use`)))
    const logo = hrefOf(document.querySelector('.brand-icon use'))

    assert.equal(new Set(hrefs).size, 11, `href: ${hrefs.join(', ')}`)
    assert.equal(logo, '#icon-logo')
    assert.ok(!hrefs.includes(logo), 'logo không dùng chung symbol với mục nào')
    assert.notEqual(hrefs[0], logo, 'Tổng quan (lưới 4 ô) và logo phải là hai symbol khác nhau')
  })
})

test('mọi <use> trong tài liệu trỏ tới <symbol> có thật (không icon nào biến mất lặng lẽ)', async () => {
  await withFullApp(({ document }) => {
    const uses = [...document.querySelectorAll('use')]

    assert.ok(uses.length >= 14, `chỉ thấy ${uses.length} <use>`)

    for (const use of uses) {
      const href = hrefOf(use)

      assert.ok(href !== null && href.startsWith('#'), `<use> thiếu href cục bộ`)
      assert.ok(document.querySelector(`symbol[id="${href.slice(1)}"]`) !== null, `${href} không có symbol`)
    }
  })
})

for (const target of STRUCTURES) {
  test(`mục con "${target}": mỗi [data-structure-target="${target}"] có symbol #icon-structure-${target} và icon mục con trỏ đúng id đó`, async () => {
    await withFullApp(({ document }) => {
      assert.ok(document.querySelector(`[data-structure-target="${target}"]`) !== null)
      assert.ok(symbolOf(document, `icon-structure-${target}`) !== null, `thiếu symbol icon-structure-${target}`)
      assert.equal(hrefOf(document.querySelector(`.nav-subitem[data-structure-nav="${target}"] .nav-icon use`)), `#icon-structure-${target}`)
    })
  })
}

test('mọi [data-structure-target] đều có symbol (suy từ thẻ thật, không từ danh sách gõ tay)', async () => {
  await withFullApp(({ document }) => {
    for (const card of document.querySelectorAll('[data-structure-target]')) {
      assert.ok(symbolOf(document, `icon-structure-${card.dataset.structureTarget}`) !== null, `thẻ ${card.dataset.structureTarget} chưa có symbol`)
    }
  })
})

test('icon nút thu gọn, nút menu và logo: svg aria-hidden với use #icon-chevron, #icon-menu, #icon-logo; không còn ký tự ‹ hay chữ "A"', async () => {
  await withFullApp(({ document }) => {
    const cases = [
      ['.sidebar-collapse-icon', '#icon-chevron'],
      ['.menu-button-icon', '#icon-menu'],
      ['.brand-icon', '#icon-logo'],
    ]

    for (const [selector, href] of cases) {
      const owner = document.querySelector(selector)

      assert.ok(owner !== null, `thiếu ${selector}`)
      assert.equal(hrefOf(owner.querySelector('svg use')), href, selector)
      assert.equal(owner.querySelector('svg').getAttribute('focusable'), 'false')
      assert.equal(owner.textContent.trim(), '', `${selector} không còn glyph hay chữ`)
    }

    assert.equal(document.querySelector('.brand-icon').getAttribute('aria-hidden') === 'true' || document.querySelector('.brand-icon svg').getAttribute('aria-hidden') === 'true', true, 'logo icon chỉ để trang trí (h1 đã là tên)')
    assert.equal(document.querySelector('.brand h1').textContent.trim(), 'AlgoVision')
  })
})

test('toàn bộ sidebar và thanh trên không còn glyph icon dạng ký tự (⌂ ↕ ⌕ ▤ ↔ ⛓ ⋔ ◬ ‹ ☰ #) trong .nav-icon', async () => {
  await withFullApp(({ document }) => {
    const leftovers = [...document.querySelectorAll('.nav-icon, .sidebar-collapse-icon, .menu-button-icon, .brand-icon')]
      .map((element) => element.textContent.trim())
      .filter((text) => text !== '')

    assert.deepEqual(leftovers, [])
  })
})

// --- CSS ----------------------------------------------------------------------------------------------------------------

const rule = (selector, media = null) => sheet.rules.filter((item) => item.media === media && item.selectors.includes(selector))
const valueOf = (selector, property, media = null) => rule(selector, media).flatMap((item) => item.declarations.filter((declaration) => declaration.property === property).map((declaration) => declaration.value)).at(-1)

test('.nav-icon svg: nét mảnh 1,5, fill none, stroke currentColor, đầu và góc tròn, cỡ 18px (mục con 16px)', () => {
  assert.equal(valueOf('.nav-icon svg', 'fill'), 'none')
  assert.equal(valueOf('.nav-icon svg', 'stroke'), 'currentColor')
  assert.equal(valueOf('.nav-icon svg', 'stroke-width'), '1.5')
  assert.equal(valueOf('.nav-icon svg', 'stroke-linecap'), 'round')
  assert.equal(valueOf('.nav-icon svg', 'stroke-linejoin'), 'round')
  assert.equal(valueOf('.nav-icon svg', 'width'), '18px')
  assert.equal(valueOf('.nav-icon svg', 'height'), '18px')
  assert.equal(valueOf('.nav-subitem .nav-icon svg', 'width'), '16px')
  assert.equal(valueOf('.nav-subitem .nav-icon svg', 'height'), '16px')
})

test('luật glyph cũ đã bỏ: .nav-icon và .nav-subitem .nav-icon không còn font-size; không còn luật .menu-button-icon::before/::after (ba vạch bằng CSS)', () => {
  assert.equal(valueOf('.nav-icon', 'font-size'), undefined)
  assert.equal(valueOf('.nav-subitem .nav-icon', 'font-size'), undefined)
  assert.equal(sheet.rules.some((item) => item.selectors.some((selector) => selector.includes('.menu-button-icon::'))), false)
  assert.equal(valueOf('.nav-item.active .nav-icon', 'color'), undefined, 'icon active kế thừa chữ trắng, không đặt màu riêng')
})

test('.icon-sprite ẩn bằng position: absolute + 0x0 + overflow: hidden, KHÔNG display: none (display: none làm mất tham chiếu <use> ở một số trình duyệt)', () => {
  assert.equal(valueOf('.icon-sprite', 'position'), 'absolute')
  assert.equal(valueOf('.icon-sprite', 'width'), '0')
  assert.equal(valueOf('.icon-sprite', 'height'), '0')
  assert.equal(valueOf('.icon-sprite', 'overflow'), 'hidden')
  assert.equal(valueOf('.icon-sprite', 'display'), undefined)
})

test('icon hover: --av-primary-text trên nền hover --av-surface-2, chỉ khi mục không active (icon active giữ chữ của mục active)', () => {
  assert.equal(valueOf('.nav-item:not(.active):hover .nav-icon', 'color'), 'var(--av-primary-text)')
  assert.equal(valueOf('.nav-subitem:not(.active):hover .nav-icon', 'color'), 'var(--av-primary-text)')
})

test('nút thu gọn và nút menu: svg vẽ nét mảnh cùng kiểu (stroke currentColor), cỡ 20px', () => {
  for (const selector of ['.sidebar-collapse-icon svg', '.menu-button-icon svg']) {
    assert.equal(valueOf(selector, 'fill'), 'none', selector)
    assert.equal(valueOf(selector, 'stroke'), 'currentColor', selector)
    assert.equal(valueOf(selector, 'stroke-width'), '1.5', selector)
    assert.equal(valueOf(selector, 'width'), '20px', selector)
  }
})

test('logo .brand-icon svg: nét mảnh 1,5 màu --purple (qua currentColor), cỡ 28px', () => {
  assert.equal(valueOf('.brand-icon svg', 'fill'), 'none')
  assert.equal(valueOf('.brand-icon svg', 'stroke'), 'currentColor')
  assert.equal(valueOf('.brand-icon svg', 'stroke-width'), '1.5')
  assert.equal(valueOf('.brand-icon svg', 'width'), '28px')
})
