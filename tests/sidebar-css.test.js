import test from 'node:test'
import assert from 'node:assert/strict'

import { readStyle, parseStylesheet, rootTokens, rootRawBlock } from './helpers/css-tokens.js'
import { contrastRatio, blend } from './helpers/contrast.js'

// Redesign Phase 2: CSS của sidebar. happy-dom không tính CSS nên mọi khẳng định về bố cục/tương phản/drawer đọc thẳng
// src/style.css (parser nhỏ trong tests/helpers/css-tokens.js) và giải token về giá trị thật, không gõ chết màu trong test.
const css = readStyle()
const sheet = parseStylesheet(css)
const { tokens } = rootTokens(css)

const DESKTOP = null
const MOBILE = '@media (max-width: 700px)'
const WIDE = '@media (min-width: 701px)'

const clean = (value) => value.replace(/\s+/g, ' ').trim()

function rulesFor(selector, media = DESKTOP) {
  return sheet.rules.filter((rule) => rule.media === media && rule.selectors.includes(selector))
}

// Giá trị cuối cùng của một thuộc tính (khai báo sau thắng) trong mọi luật khớp selector và media.
function valueOf(selector, property, media = DESKTOP) {
  const values = rulesFor(selector, media).flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === property).map((declaration) => declaration.value))

  return values.at(-1)
}

function allValuesOf(selector, property, media = DESKTOP) {
  return rulesFor(selector, media).flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === property).map((declaration) => declaration.value))
}

function resolveToken(name, seen = new Set()) {
  assert.ok(!seen.has(name), `alias vòng tròn tại ${name}`)
  seen.add(name)

  const value = tokens.get(name)

  assert.ok(value !== undefined, `:root thiếu ${name}`)

  const alias = /^var\((--[a-z0-9-]+)\)$/i.exec(value)

  return alias ? resolveToken(alias[1], seen) : value
}

// 'var(--x)' hoặc '#hex' hoặc 'white' hoặc '#fff' -> '#rrggbb'
function colorOf(expression) {
  const text = clean(expression)
  const reference = /^var\((--[a-z0-9-]+)\)$/i.exec(text)

  if (reference) return resolveToken(reference[1])
  if (text === 'white') return '#ffffff'

  assert.match(text, /^#[0-9a-f]{3,6}$/i, `không giải được màu từ "${expression}"`)
  return text
}

function pxOf(expression) {
  const text = clean(expression)
  const reference = /^var\((--[a-z0-9-]+)\)$/i.exec(text)
  const value = reference ? resolveToken(reference[1]) : text

  assert.match(value, /^-?\d+(\.\d+)?px$/, `không đọc được px từ "${expression}"`)
  return Number.parseFloat(value)
}

const requireValue = (selector, property, media = DESKTOP) => {
  const value = valueOf(selector, property, media)

  assert.ok(value !== undefined, `${selector}${media ? ` (${media})` : ''} thiếu khai báo ${property}`)
  return value
}

const ratio = (foreground, background) => contrastRatio(colorOf(foreground), colorOf(background))

// ---------------------------------------------------------------------------------------------------------------------
// Bề rộng và ngân sách R12
// ---------------------------------------------------------------------------------------------------------------------

test('token --sidebar-width = 256px, --sidebar-width-collapsed = 72px; đều là bội số của 4 và sidebar <= 263px', () => {
  assert.equal(clean(tokens.get('--sidebar-width') ?? '(thiếu)'), '256px')
  assert.equal(clean(tokens.get('--sidebar-width-collapsed') ?? '(thiếu)'), '72px')
  assert.equal(256 % 4, 0)
  assert.equal(72 % 4, 0)
  assert.ok(pxOf('var(--sidebar-width)') <= 263, '263px là mức tối đa để chuỗi chaining 15 khóa (842px) vẫn vừa khung ở 1280px nếu giữ padding 46px')
})

test('.main-content viết SỐ trực tiếp (test R12 đọc bằng regex): margin-left 256px bằng --sidebar-width, padding 0 40px', () => {
  assert.equal(requireValue('.main-content', 'margin-left'), '256px')
  assert.equal(requireValue('.main-content', 'padding'), '0 40px')
  assert.equal(pxOf(requireValue('.main-content', 'margin-left')), pxOf('var(--sidebar-width)'), 'margin-left phải bằng --sidebar-width')
  assert.equal(40 % 4, 0)
})

test('ngân sách bề rộng ở 1280px: sidebar 256 + padding 40 cho khung bảng băm nội dung rộng 861px (trước: 855px)', () => {
  const available = 1280 - 15 - pxOf(requireValue('.main-content', 'margin-left')) - 2 * 40 - 2 * (24 + 1) - 2 * (1 + 8)

  assert.equal(available, 861)
  assert.ok(available - 842 >= 19, 'chuỗi chaining 15 khóa rộng 842px phải còn dư ít nhất 19px')
})

test('thu gọn: chỉ trong @media (min-width: 701px); sidebar rộng --sidebar-width-collapsed, margin-left của main là số 72px bằng token', () => {
  const width = valueOf('.app-layout.is-sidebar-collapsed .sidebar', 'width', WIDE)
  const margin = valueOf('.app-layout.is-sidebar-collapsed .main-content', 'margin-left', WIDE)

  assert.equal(width, 'var(--sidebar-width-collapsed)')
  assert.equal(margin, '72px')
  assert.equal(pxOf(margin), pxOf('var(--sidebar-width-collapsed)'))
})

test('không luật nào ngoài @media (min-width: 701px) nhắc is-sidebar-collapsed (thu gọn không ảnh hưởng drawer)', () => {
  const outside = sheet.rules.filter((rule) => rule.media !== WIDE && rule.selectors.some((selector) => selector.includes('is-sidebar-collapsed')))

  assert.deepEqual(outside.map((rule) => rule.selectors.join(', ')), [])
})

// ---------------------------------------------------------------------------------------------------------------------
// Màu, tương phản, cỡ chữ
// ---------------------------------------------------------------------------------------------------------------------

test('nền sidebar là --bg-sidebar; nhãn nhóm --text-label (6,00:1), chữ mục --muted, mục hover --text trên --surface-raised', () => {
  const background = requireValue('.sidebar', 'background')

  assert.equal(background, 'var(--bg-sidebar)')
  assert.equal(requireValue('.section-label', 'color'), 'var(--text-label)')
  assert.equal(requireValue('.nav-item', 'color'), 'var(--muted)')
  assert.equal(requireValue('.nav-subitem', 'color'), 'var(--muted)')
  assert.equal(requireValue('.nav-item:hover', 'background'), 'var(--surface-raised)')
  assert.equal(requireValue('.nav-subitem:hover', 'background'), 'var(--surface-raised)')
  assert.equal(requireValue('.nav-item:hover', 'color'), 'var(--text)')
})

const SIDEBAR_BG = 'var(--bg-sidebar)'
const ACTIVE_BG = 'var(--purple-tint)'
const TEXT_PAIRS = [
  ['nhãn nhóm', () => requireValue('.section-label', 'color'), () => SIDEBAR_BG, 4.5],
  ['chữ mục thường', () => requireValue('.nav-item', 'color'), () => SIDEBAR_BG, 4.5],
  ['chữ mục con thường', () => requireValue('.nav-subitem', 'color'), () => SIDEBAR_BG, 4.5],
  ['chữ mục hover', () => requireValue('.nav-item:hover', 'color'), () => requireValue('.nav-item:hover', 'background'), 4.5],
  ['chữ mục active', () => requireValue('.nav-item.active', 'color'), () => requireValue('.nav-item.active', 'background'), 4.5],
  ['chữ mục con active', () => requireValue('.nav-subitem.active', 'color'), () => requireValue('.nav-subitem.active', 'background'), 4.5],
  ['icon mục active', () => requireValue('.nav-item.active .nav-icon', 'color'), () => ACTIVE_BG, 4.5],
  ['icon mục con active', () => requireValue('.nav-subitem.active .nav-icon', 'color'), () => ACTIVE_BG, 4.5],
  ['chữ trên nút thu gọn', () => requireValue('.sidebar-collapse', 'color'), () => SIDEBAR_BG, 4.5],
  ['chữ tooltip', () => requireValue('.sidebar-tooltip', 'color'), () => requireValue('.sidebar-tooltip', 'background'), 4.5],
  ['chữ nút ☰', () => requireValue('.menu-button', 'color'), () => requireValue('.mobile-bar', 'background'), 4.5],
  ['chữ "AlgoVision" trên thanh trên di động', () => requireValue('.mobile-bar-title', 'color'), () => requireValue('.mobile-bar', 'background'), 4.5],
  ['chữ trắng trên logo "A"', () => requireValue('.brand-icon', 'color'), () => requireValue('.brand-icon', 'background'), 4.5],
]

for (const [name, foreground, background, minimum] of TEXT_PAIRS) {
  test(`tương phản ${name} >= ${minimum}`, () => {
    const result = ratio(foreground(), background())

    assert.ok(result >= minimum, `${name}: ${foreground()} trên ${background()} = ${result.toFixed(2)}`)
  })
}

test('vạch active 3px màu --purple đạt >= 3:1 với nền sidebar và với nền active; nền active là --purple-tint (không phải khối tím đặc)', () => {
  for (const selector of ['.nav-item.active', '.nav-subitem.active']) {
    assert.equal(requireValue(selector, 'background'), 'var(--purple-tint)')
    assert.equal(requireValue(selector, 'box-shadow'), 'inset 3px 0 0 var(--purple)', `${selector}: vạch trái 3px`)
  }

  assert.ok(ratio('var(--purple)', SIDEBAR_BG) >= 3)
  assert.ok(ratio('var(--purple)', ACTIVE_BG) >= 3)
  assert.equal(blend(colorOf('var(--purple)'), 0.16, colorOf(SIDEBAR_BG)), colorOf(ACTIVE_BG).toLowerCase(), '--purple-tint = --purple 16% trên --bg-sidebar')
})

test('mục active có dấu hiệu ngoài màu: vạch trái, chữ đậm hơn mục thường (>= 600 so với < 600)', () => {
  const base = Number(requireValue('.nav-item', 'font-weight'))
  const active = Number(requireValue('.nav-item.active', 'font-weight'))
  const subActive = Number(requireValue('.nav-subitem.active', 'font-weight'))

  assert.ok(base < 600, `font-weight mục thường ${base}`)
  assert.ok(active >= 600 && subActive >= 600, `font-weight mục active ${active}/${subActive}`)
})

test('cỡ chữ của nhãn nhóm, mục, mục con, nhãn mục >= 12px ở MỌI bề rộng (không còn 10px)', () => {
  const selectors = ['.section-label', '.nav-item', '.nav-subitem', '.nav-label']
  const problems = []

  for (const rule of sheet.rules) {
    if (!rule.selectors.some((selector) => selectors.includes(selector))) continue

    for (const declaration of rule.declarations) {
      if (declaration.property !== 'font-size') continue

      const size = pxOf(declaration.value)

      if (size < 12) problems.push(`${rule.selectors.join(',')} (${rule.media ?? 'mặc định'}): ${declaration.value} = ${size}px`)
    }
  }

  assert.deepEqual(problems, [])
  assert.ok(pxOf(requireValue('.section-label', 'font-size')) >= 12)
})

test('logo .brand-icon: nền --purple-strong (chữ trắng đạt >= 5,31:1), thay cho gradient bắt đầu ở #ad98ff (2,41:1)', () => {
  assert.equal(requireValue('.brand-icon', 'background'), 'var(--purple-strong)')
  assert.ok(ratio(requireValue('.brand-icon', 'color'), requireValue('.brand-icon', 'background')) >= 5.3)
})

test('mục active dùng chữ --text (12,80:1 trên --purple-tint), không chỉ "vừa đủ 4,5"', () => {
  assert.equal(requireValue('.nav-item.active', 'color'), 'var(--text)')
  assert.equal(requireValue('.nav-subitem.active', 'color'), 'var(--text)')
  assert.ok(ratio('var(--text)', 'var(--purple-tint)') >= 12)
})

test('.sidebar rộng đúng var(--sidebar-width) (không gõ chết số), nên đổi token là đổi cả sidebar lẫn bài kiểm bề rộng', () => {
  assert.equal(requireValue('.sidebar', 'width'), 'var(--sidebar-width)')
})

test('vòng focus của mục nằm TRONG mục (outline-offset âm): .sidebar-scroll cắt vòng focus vẽ ra ngoài mép vùng cuộn', () => {
  assert.ok(pxOf(requireValue('.nav-item:focus-visible', 'outline-offset')) < 0)
  assert.ok(pxOf(requireValue('.nav-subitem:focus-visible', 'outline-offset')) < 0)
})

test('.sidebar-nav co lại được (flex: 1 và min-height: 0): thiếu min-height: 0 thì vùng cuộn dài ra thay vì cuộn, đẩy sidebar khỏi viewport', () => {
  assert.match(requireValue('.sidebar-nav', 'flex'), /^1\b/)
  assert.equal(requireValue('.sidebar-nav', 'min-height'), '0')
})

// ---------------------------------------------------------------------------------------------------------------------
// Kích thước mục
// ---------------------------------------------------------------------------------------------------------------------

test('desktop: mục chính cao tối thiểu 40px, mục con 36px (bội số của 4)', () => {
  assert.equal(pxOf(requireValue('.nav-item', 'min-height')), 40)
  assert.equal(pxOf(requireValue('.nav-subitem', 'min-height')), 36)
})

test('di động (<= 700px): mục chính và mục con cao tối thiểu 44px; nút ☰ rộng và cao tối thiểu 44px', () => {
  assert.equal(pxOf(requireValue('.nav-item', 'min-height', MOBILE)), 44)
  assert.equal(pxOf(requireValue('.nav-subitem', 'min-height', MOBILE)), 44)
  assert.ok(pxOf(requireValue('.menu-button', 'width')) >= 44)
  assert.ok(pxOf(requireValue('.menu-button', 'height')) >= 44)
})

test('mục điều hướng ở <= 700px xếp ngang trong drawer (không còn lưới 4 cột, không xếp dọc 10px)', () => {
  assert.ok(valueOf('.sidebar-section', 'grid-template-columns', MOBILE) === undefined, 'lưới 4 cột của sidebar tĩnh cũ phải bỏ')
  assert.notEqual(valueOf('.nav-item', 'flex-direction', MOBILE), 'column')
})

// ---------------------------------------------------------------------------------------------------------------------
// Vùng cuộn
// ---------------------------------------------------------------------------------------------------------------------

test('.sidebar-scroll: cuộn dọc (overflow-y: auto), không cuộn ngang, flex: 1 với min-height: 0 để co lại trong sidebar', () => {
  assert.equal(requireValue('.sidebar-scroll', 'overflow-y'), 'auto')
  assert.equal(requireValue('.sidebar-scroll', 'min-height'), '0')
  assert.match(requireValue('.sidebar-scroll', 'flex'), /^1\b/)
  assert.equal(valueOf('.sidebar-scroll', 'overflow-x'), undefined, 'không khai báo overflow-x (overflow-x: auto sẽ thành vùng cuộn thứ hai)')
})

// ---------------------------------------------------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------------------------------------------------

test('drawer đóng: sidebar visibility hidden (ra khỏi thứ tự Tab) và trượt khỏi màn hình bằng translateX(-100%)', () => {
  assert.equal(requireValue('.sidebar', 'visibility', MOBILE), 'hidden')
  assert.equal(requireValue('.sidebar', 'transform', MOBILE), 'translateX(-100%)')
  assert.equal(valueOf('.sidebar', 'display', MOBILE), undefined, 'không dùng display: none cho drawer (sẽ mất transition và cây trợ năng)')
})

test('drawer mở: .sidebar.is-open hiện lại (visibility visible, transform none)', () => {
  assert.equal(requireValue('.sidebar.is-open', 'visibility', MOBILE), 'visible')
  assert.equal(requireValue('.sidebar.is-open', 'transform', MOBILE), 'none')
})

test('chỉ .sidebar.is-open và .brand được đặt visibility: visible trong khối <= 700px (không phần tử focus nào lọt ra khi drawer đóng)', () => {
  const visible = sheet.rules
    .filter((rule) => rule.media === MOBILE && rule.declarations.some((declaration) => declaration.property === 'visibility' && declaration.value === 'visible'))
    .flatMap((rule) => rule.selectors)
    .sort()

  assert.deepEqual(visible, ['.brand', '.sidebar.is-open', '.sidebar-overlay.is-open'].sort())
})

test('h1 AlgoVision ở trong .brand vẫn có trong cây trợ năng khi drawer đóng: .brand đặt visibility: visible riêng ở <= 700px', () => {
  assert.equal(requireValue('.brand', 'visibility', MOBILE), 'visible')
})

test('chiều cao drawer: khai báo 100vh dự phòng TRƯỚC 100dvh (trình duyệt cũ bỏ qua dvh)', () => {
  const heights = allValuesOf('.sidebar', 'height', MOBILE)

  assert.deepEqual(heights, ['calc(100vh - 56px)', 'calc(100dvh - 56px)'])
})

test('drawer nằm dưới thanh trên 56px: .sidebar top 56px; .mobile-bar cao 56px, sticky ở <= 700px và ẩn ở màn hình rộng', () => {
  assert.equal(requireValue('.sidebar', 'top', MOBILE), '56px')
  assert.equal(requireValue('.mobile-bar', 'height', MOBILE), '56px')
  assert.equal(requireValue('.mobile-bar', 'display', MOBILE), 'flex')
  assert.equal(requireValue('.mobile-bar', 'position', MOBILE), 'sticky')
  assert.equal(requireValue('.mobile-bar', 'display'), 'none')
})

test('drawer: chiều rộng min(288px, 86vw); main không còn margin-left và padding 0 18px ở <= 700px', () => {
  assert.equal(requireValue('.sidebar', 'width', MOBILE), 'min(288px, 86vw)')
  assert.equal(requireValue('.main-content', 'margin-left', MOBILE), '0')
  assert.equal(requireValue('.main-content', 'padding', MOBILE), '0 18px')
})

test('lớp phủ: ẩn và không bắt chuột khi đóng; hiện khi .is-open; ẩn hẳn ở màn hình rộng', () => {
  assert.equal(requireValue('.sidebar-overlay', 'display'), 'none')
  assert.equal(requireValue('.sidebar-overlay', 'display', MOBILE), 'block')
  assert.equal(requireValue('.sidebar-overlay', 'visibility', MOBILE), 'hidden')
  assert.equal(requireValue('.sidebar-overlay.is-open', 'visibility', MOBILE), 'visible')
  assert.ok(Number(requireValue('.sidebar-overlay.is-open', 'opacity', MOBILE)) > 0)
})

test('chuyển động của drawer: transition transform và visibility (visibility trễ để trượt xong mới ẩn), nằm dưới luật prefers-reduced-motion', () => {
  const transition = requireValue('.sidebar', 'transition', MOBILE)

  assert.match(transition, /transform/)
  assert.match(transition, /visibility 0s/)

  const reduced = sheet.rules.find((rule) => rule.media === '@media (prefers-reduced-motion: reduce)' && rule.selectors.includes('*'))

  assert.ok(reduced !== undefined, 'thiếu luật prefers-reduced-motion cho mọi phần tử')
  assert.ok(reduced.declarations.some((declaration) => declaration.property === 'transition-duration' && declaration.value.includes('!important')), 'reduced-motion phải ép transition-duration với !important để thắng transition của drawer')
})

test('nút thu gọn không có ở <= 700px (ẩn bằng display: none vì drawer thay thế thu gọn)', () => {
  assert.equal(requireValue('.sidebar-footer', 'display', MOBILE), 'none')
})

// ---------------------------------------------------------------------------------------------------------------------
// Thu gọn: nhãn ẩn bằng clip, KHÔNG display: none
// ---------------------------------------------------------------------------------------------------------------------

test('trạng thái thu gọn ẩn nhãn bằng clip kiểu sr-only, không luật nào có display: none hay visibility: hidden', () => {
  const collapsedRules = sheet.rules.filter((rule) => rule.selectors.some((selector) => selector.includes('is-sidebar-collapsed')))
  const label = collapsedRules.find((rule) => rule.selectors.some((selector) => selector.endsWith('.nav-label')))

  assert.ok(label !== undefined, 'thiếu luật ẩn .nav-label khi thu gọn')

  const declared = Object.fromEntries(label.declarations.map((declaration) => [declaration.property, declaration.value]))

  assert.equal(declared.position, 'absolute')
  assert.equal(declared.width, '1px')
  assert.equal(declared.height, '1px')
  assert.equal(declared.overflow, 'hidden')
  assert.match(declared.clip ?? declared['clip-path'] ?? '', /rect|inset/)

  for (const rule of collapsedRules) {
    for (const declaration of rule.declarations) {
      assert.ok(!(declaration.property === 'display' && declaration.value === 'none'), `${rule.selectors.join(',')}: display: none làm mất tên truy cập`)
      assert.ok(!(declaration.property === 'visibility' && declaration.value === 'hidden'), `${rule.selectors.join(',')}: visibility: hidden làm mất tên truy cập`)
    }
  }
})

test('thu gọn: chữ của logo (.brand-text, chứa h1) và nhãn nhóm cũng ẩn bằng clip; ô "A" giữ nguyên', () => {
  const clipped = sheet.rules
    .filter((rule) => rule.media === WIDE && rule.selectors.some((selector) => selector.includes('is-sidebar-collapsed')))
    .filter((rule) => rule.declarations.some((declaration) => declaration.property === 'overflow' && declaration.value === 'hidden') && rule.declarations.some((declaration) => declaration.property === 'width' && declaration.value === '1px'))
    .flatMap((rule) => rule.selectors)
    .join(' ')

  for (const part of ['.nav-label', '.brand-text', '.section-label']) assert.ok(clipped.includes(part), `thu gọn phải clip ${part}`)
  assert.ok(!clipped.includes('.brand-icon'), 'ô "A" phải còn hiện')
})

// ---------------------------------------------------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------------------------------------------------

test('tooltip: position fixed (không bị vùng cuộn cắt), không bắt chuột, ẩn mặc định, hiện bằng .is-visible', () => {
  assert.equal(requireValue('.sidebar-tooltip', 'position'), 'fixed')
  assert.equal(requireValue('.sidebar-tooltip', 'pointer-events'), 'none')
  assert.equal(requireValue('.sidebar-tooltip', 'visibility'), 'hidden')
  assert.equal(requireValue('.sidebar-tooltip.is-visible', 'visibility'), 'visible')
})

// ---------------------------------------------------------------------------------------------------------------------
// Phạm vi token mới
// ---------------------------------------------------------------------------------------------------------------------

const SIDEBAR_SELECTOR = /^(\.sidebar|\.nav-|\.brand|\.section-label|\.menu-button|\.mobile-bar|\.app-layout\.is-sidebar-collapsed)/

test('token cỡ chữ, spacing và bo góc chỉ được áp trong luật của sidebar, không lan ra phần còn lại của trang', () => {
  const stray = []

  for (const rule of sheet.rules) {
    const uses = rule.declarations.filter((declaration) => /var\(--(fs|space|radius)-/.test(declaration.value))

    if (uses.length > 0 && !rule.selectors.every((selector) => SIDEBAR_SELECTOR.test(selector))) {
      stray.push(`${rule.selectors.join(', ')}: ${uses.map((declaration) => declaration.property).join(', ')}`)
    }
  }

  assert.deepEqual(stray, [])
})

test('mọi token cỡ chữ/spacing/bo góc được dùng trong sidebar đều có trong :root và thuộc nhóm ĐANG DÙNG', () => {
  const raw = rootRawBlock(css)
  const usedGroup = raw.slice(raw.indexOf('TOKEN MỚI, ĐANG DÙNG'), raw.indexOf('TOKEN MỚI, CHƯA ĐƯỢC DÙNG'))
  const used = new Set()

  for (const rule of sheet.rules) {
    for (const declaration of rule.declarations) {
      for (const match of declaration.value.matchAll(/var\((--(?:fs|space|radius|sidebar|bg-sidebar|surface-raised|text-label|purple-tint|purple-strong|purple-pressed)[a-z0-9-]*)\)/g)) used.add(match[1])
    }
  }

  assert.ok(used.size >= 10, `phải tìm thấy các token Phase 2 đang dùng, thấy ${used.size}`)

  for (const name of used) {
    assert.ok(tokens.has(name), `${name} không có trong :root`)
    assert.ok(usedGroup.includes(`${name}:`), `${name} đang được dùng nhưng nằm ngoài nhóm "TOKEN MỚI, ĐANG DÙNG"`)
  }
})

// ---------------------------------------------------------------------------------------------------------------------
// Nút "Bắt đầu học" và nút "Thử lại" ở màn hình lỗi tải (dùng chung class .dashboard-primary-button)
// ---------------------------------------------------------------------------------------------------------------------

test('.dashboard-primary-button: nền và viền --purple-strong, chữ trắng đạt >= 5,31:1 (trước: 2,99:1 trên --purple)', () => {
  assert.equal(requireValue('.dashboard-primary-button', 'background'), 'var(--purple-strong)')
  assert.equal(requireValue('.dashboard-primary-button', 'border'), '1px solid var(--purple-strong)')
  assert.ok(ratio(requireValue('.dashboard-primary-button', 'color'), requireValue('.dashboard-primary-button', 'background')) >= 5.3)
})

test('.dashboard-primary-button:hover: nền --purple-pressed (>= 6,84:1), KHÔNG dùng opacity (opacity làm mờ cả chữ)', () => {
  assert.equal(requireValue('.dashboard-primary-button:hover', 'background'), 'var(--purple-pressed)')
  assert.equal(requireValue('.dashboard-primary-button:hover', 'border-color'), 'var(--purple-pressed)')
  assert.equal(valueOf('.dashboard-primary-button:hover', 'opacity'), undefined)
  assert.ok(ratio(requireValue('.dashboard-primary-button', 'color'), requireValue('.dashboard-primary-button:hover', 'background')) >= 6.8)
  assert.doesNotMatch(requireValue('.dashboard-primary-button', 'transition'), /opacity/)
})

test('nút "Thử lại" (class dashboard-primary-button load-error-retry) không có luật riêng đổi màu: thừa hưởng nút đã sửa', () => {
  const overrides = sheet.rules.filter((rule) => rule.selectors.some((selector) => selector.includes('load-error-retry')))

  assert.deepEqual(overrides.map((rule) => rule.selectors.join(', ')), [])
})
