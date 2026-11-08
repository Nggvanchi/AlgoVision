import test from 'node:test'
import assert from 'node:assert/strict'
import { readStyle, parseStylesheet, rootTokens } from './helpers/css-tokens.js'
import { contrastRatio, blend } from './helpers/contrast.js'

// R5b commit 3: CSS của ô tìm, chip phân loại, bộ đếm, trạng thái rỗng. Viền điều khiển dùng --border-control (quyết định 12 và 13:
// ô tìm của Thư viện là chỗ áp đầu tiên cho ô nhập). happy-dom không tính CSS nên đọc thẳng src/style.css.
const css = readStyle()
const sheet = parseStylesheet(css)
const { tokens } = rootTokens(css)

function lastValue(selector, property, media = null) {
  return sheet.rules.filter((rule) => rule.media === media && rule.selectors.includes(selector))
    .flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === property).map((declaration) => declaration.value)).at(-1)
}

function resolve(value) {
  let current = value

  for (let depth = 0; depth < 6; depth++) {
    const match = /^var\((--[a-z0-9-]+)\)$/.exec(current)

    if (!match) break
    current = tokens.get(match[1])
  }

  return current
}

const token = (name) => resolve(`var(${name})`)

test('ô tìm: cao >= 44px, viền --border-control, bo --av-radius-control, nền --panel, chữ --text, placeholder --muted', () => {
  assert.equal(lastValue('.library-search-input', 'min-height'), '44px')
  assert.equal(lastValue('.library-search-input', 'border'), '1px solid var(--border-control)')
  assert.equal(lastValue('.library-search-input', 'border-radius'), 'var(--av-radius-control)')
  assert.equal(lastValue('.library-search-input', 'background'), 'var(--panel)')
  assert.equal(lastValue('.library-search-input', 'color'), 'var(--text)')
  assert.equal(lastValue('.library-search-input::placeholder', 'color'), 'var(--muted)')
})

test('không luật nào của ô tìm hay chip đổi outline (giữ vòng focus chung)', () => {
  const outlines = sheet.rules.filter((rule) => rule.selectors.some((selector) => /\.library-(search-input|chip|empty)/.test(selector)))
    .flatMap((rule) => rule.declarations.filter((declaration) => declaration.property.startsWith('outline')))

  assert.deepEqual(outlines, [])
})

test('chip: cao >= 44px, viền --border-control, bo tròn; chip đang chọn (aria-pressed) có nền, chữ và viền khác chip thường', () => {
  assert.equal(lastValue('.library-chip', 'min-height'), '44px')
  assert.equal(lastValue('.library-chip', 'border'), '1px solid var(--border-control)')
  assert.equal(lastValue('.library-chip', 'border-radius'), '999px')
  assert.equal(lastValue('.library-chip[aria-pressed="true"]', 'background'), 'var(--av-nav-active-bg)')
  assert.equal(lastValue('.library-chip[aria-pressed="true"]', 'color'), 'var(--av-nav-active-text)')
  assert.equal(lastValue('.library-chip[aria-pressed="true"]', 'border-color'), 'var(--av-primary-line)')
})

test('thanh lọc: ô tìm và bộ đếm trên một hàng, nhóm chip xuống hàng riêng và tự xuống dòng', () => {
  assert.equal(lastValue('.library-filters', 'display'), 'flex')
  assert.equal(lastValue('.library-filters', 'flex-wrap'), 'wrap')
  assert.equal(lastValue('.library-chips', 'display'), 'flex')
  assert.equal(lastValue('.library-chips', 'flex-wrap'), 'wrap')
  assert.equal(lastValue('.library-chips', 'flex'), '1 1 100%')
})

test('.is-filtered-out ẩn section hết thẻ bằng display: none', () => {
  assert.equal(lastValue('.is-filtered-out', 'display'), 'none')
})

test('trạng thái rỗng: khung nét đứt, chữ giữa; nút "Xóa bộ lọc" cao >= 44px, viền --border-control', () => {
  assert.equal(lastValue('.library-empty', 'border'), '1px dashed var(--av-border-dashed)')
  assert.equal(lastValue('.library-empty', 'text-align'), 'center')
  assert.equal(lastValue('.library-empty button', 'min-height'), '44px')
  assert.equal(lastValue('.library-empty button', 'border'), '1px solid var(--border-control)')
})

test('mobile (<= 700px): ô tìm rộng hết hàng (không giới hạn max-width)', () => {
  assert.equal(lastValue('.library-search-input', 'max-width', '@media (max-width: 700px)'), 'none')
})

const PAIRS = [
  ['placeholder ô tìm (--muted) trên nền --panel', token('--muted'), token('--panel'), 4.5],
  ['chữ ô tìm (--text) trên nền --panel', token('--text'), token('--panel'), 4.5],
  ['bộ đếm (--muted) trên nền trang', token('--muted'), token('--av-bg'), 4.5],
  ['chữ chip thường (--text) trên nền trang', token('--text'), token('--av-bg'), 4.5],
  ['chip chọn: --av-nav-active-text trên nền chọn (--av-primary-line alpha 0,18 trên nền trang)', token('--av-nav-active-text'), blend(token('--av-primary-line'), 0.18, token('--av-bg')), 4.5],
  ['viền ô tìm (--border-control) trên nền --panel', token('--border-control'), token('--panel'), 3],
  ['viền chip (--border-control) trên nền trang', token('--border-control'), token('--av-bg'), 3],
]

for (const [name, foreground, background, minimum] of PAIRS) {
  test(`tương phản: ${name} >= ${minimum}:1`, () => {
    const ratio = contrastRatio(foreground, background)

    assert.ok(ratio >= minimum, `chỉ ${ratio.toFixed(2)}:1`)
  })
}
