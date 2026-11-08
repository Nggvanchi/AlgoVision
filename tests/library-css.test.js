import test from 'node:test'
import assert from 'node:assert/strict'
import { readStyle, parseStylesheet, rootTokens } from './helpers/css-tokens.js'
import { contrastRatio } from './helpers/contrast.js'

// R5a commit 4: CSS của thanh tab Thư viện, panel Giải thuật và nhãn kiểu của thẻ duyệt đồ thị.
// happy-dom không tính CSS nên đọc thẳng src/style.css và giải token về giá trị thật.
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

test('thanh tab: hàng flex có đường kẻ chân; mỗi tab cao >= 44px, nền trong suốt, viền chân 2px trong suốt', () => {
  assert.equal(lastValue('.library-tabs', 'display'), 'flex')
  assert.equal(lastValue('.library-tabs', 'border-bottom'), '1px solid var(--border)')
  assert.equal(lastValue('.library-tab', 'min-height'), '44px')
  assert.equal(lastValue('.library-tab', 'border-bottom'), '2px solid transparent')
  assert.equal(lastValue('.library-tab', 'background'), 'transparent')
})

test('tab đang chọn (aria-selected) có gạch chân --av-primary-line và chữ --text, không chỉ dựa vào màu chữ; không dùng outline: none', () => {
  assert.equal(lastValue('.library-tab[aria-selected="true"]', 'border-bottom-color'), 'var(--av-primary-line)')
  assert.equal(lastValue('.library-tab[aria-selected="true"]', 'color'), 'var(--text)')
  assert.equal(lastValue('.library-tab', 'color'), 'var(--muted)')
  const outlineRules = sheet.rules.filter((rule) => rule.selectors.some((selector) => selector.includes('.library-tab')))
    .flatMap((rule) => rule.declarations.filter((declaration) => declaration.property.startsWith('outline')))

  assert.deepEqual(outlineRules, [], 'giữ vòng focus chung (:focus-visible), không luật nào của .library-tab đổi outline')
})

test('mobile (<= 700px): hai tab chia đôi hàng (flex: 1)', () => {
  assert.equal(lastValue('.library-tab', 'flex', '@media (max-width: 700px)'), '1')
})

test('panel Giải thuật xếp ba section theo cột, cách nhau 28px', () => {
  assert.equal(lastValue('#algorithm-panel', 'display'), 'flex')
  assert.equal(lastValue('#algorithm-panel', 'flex-direction'), 'column')
  assert.equal(lastValue('#algorithm-panel', 'gap'), '28px')
})

test('nhãn kiểu của thẻ duyệt đồ thị (.algorithm-card-kind): chữ --muted cỡ --av-fs-caption', () => {
  assert.equal(lastValue('.algorithm-card-kind', 'color'), 'var(--muted)')
  assert.equal(lastValue('.algorithm-card-kind', 'font-size'), 'var(--av-fs-caption)')
})

const PAIRS = [
  ['tab chưa chọn (--muted) trên nền trang', '--muted', '--av-bg', 4.5],
  ['tab chọn (--text) trên nền trang', '--text', '--av-bg', 4.5],
  ['gạch chân tab chọn (--av-primary-line) trên nền trang', '--av-primary-line', '--av-bg', 3],
  ['nhãn kiểu thẻ (--muted) trên nền thẻ', '--muted', '--panel', 4.5],
]

for (const [name, foreground, background, minimum] of PAIRS) {
  test(`tương phản: ${name} >= ${minimum}:1`, () => {
    const ratio = contrastRatio(resolve(`var(${foreground})`), resolve(`var(${background})`))

    assert.ok(ratio >= minimum, `${foreground} trên ${background} chỉ ${ratio.toFixed(2)}:1`)
  })
}
