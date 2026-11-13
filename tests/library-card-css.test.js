import test from 'node:test'
import assert from 'node:assert/strict'
import { readStyle, parseStylesheet, rootTokens } from './helpers/css-tokens.js'
import { contrastRatio } from './helpers/contrast.js'

// R5c commit 4: CSS của chữ ẩn thị giác, ký hiệu độ khó, thanh 5 đoạn và ghi chú. happy-dom không tính CSS nên đọc thẳng src/style.css.
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

test('.visually-hidden ẩn khỏi mắt nhưng vẫn có trong cây trợ năng: cắt còn 1x1px, KHÔNG display: none hay visibility: hidden', () => {
  assert.equal(lastValue('.visually-hidden', 'position'), 'absolute')
  assert.equal(lastValue('.visually-hidden', 'width'), '1px')
  assert.equal(lastValue('.visually-hidden', 'height'), '1px')
  assert.equal(lastValue('.visually-hidden', 'overflow'), 'hidden')
  assert.equal(lastValue('.visually-hidden', 'clip'), 'rect(0 0 0 0)')
  assert.equal(lastValue('.visually-hidden', 'white-space'), 'nowrap')
  assert.equal(lastValue('.visually-hidden', 'display'), undefined)
  assert.equal(lastValue('.visually-hidden', 'visibility'), undefined)
})

test('ký hiệu độ khó dùng font mã (--font-mono) và cách chữ 4px', () => {
  assert.equal(lastValue('.difficulty-symbol', 'font-family'), 'var(--font-mono)')
  assert.equal(lastValue('.difficulty-symbol', 'margin-right'), '4px')
})

test('thanh 5 đoạn: hàng flex gap 4px; mỗi đoạn flex 1, cao 6px, bo 3px, nền --border; đoạn đầy (.on) nền --av-primary-line', () => {
  assert.equal(lastValue('.complexity-bar', 'display'), 'flex')
  assert.equal(lastValue('.complexity-bar', 'gap'), '4px')
  assert.equal(lastValue('.complexity-bar > span', 'flex'), '1')
  assert.equal(lastValue('.complexity-bar > span', 'height'), '6px')
  assert.equal(lastValue('.complexity-bar > span', 'border-radius'), '3px')
  assert.equal(lastValue('.complexity-bar > span', 'background'), 'var(--border)')
  assert.equal(lastValue('.complexity-bar > .on', 'background'), 'var(--av-primary-line)')
})

test('ghi chú thanh 5 đoạn: chiếm hàng riêng cuối thanh lọc, chữ --muted cỡ --av-fs-caption', () => {
  assert.equal(lastValue('.library-legend', 'flex'), '1 1 100%')
  assert.equal(lastValue('.library-legend', 'order'), '4')
  assert.equal(lastValue('.library-legend', 'color'), 'var(--muted)')
  assert.equal(lastValue('.library-legend', 'font-size'), 'var(--av-fs-caption)')
})

const PAIRS = [
  ['đoạn đầy của thanh (--av-primary-line, đồ họa) trên nền thẻ (--panel)', token('--av-primary-line'), token('--panel'), 3],
  ['ghi chú (--muted) trên nền trang', token('--muted'), token('--av-bg'), 4.5],
  ['badge CƠ BẢN (chữ + ký hiệu) trên nền badge', lastValue('.difficulty.easy', 'color'), lastValue('.difficulty.easy', 'background'), 4.5],
  ['badge TRUNG BÌNH (chữ + ký hiệu) trên nền badge', lastValue('.difficulty.medium', 'color'), lastValue('.difficulty.medium', 'background'), 4.5],
]

for (const [name, foreground, background, minimum] of PAIRS) {
  test(`tương phản: ${name} >= ${minimum}:1`, () => {
    const ratio = contrastRatio(resolve(foreground), resolve(background))

    assert.ok(ratio >= minimum, `chỉ ${ratio.toFixed(2)}:1`)
  })
}
