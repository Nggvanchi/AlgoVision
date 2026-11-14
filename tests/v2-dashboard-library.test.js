import test from 'node:test'
import assert from 'node:assert/strict'
import { readStyle, parseStylesheet, rootTokens, declarationValues } from './helpers/css-tokens.js'
import { contrastRatio } from './helpers/contrast.js'

const css = readStyle()
const sheet = parseStylesheet(css)
const tokens = rootTokens(css).tokens
const value = (selector, property, media = null) => sheet.rules
  .filter((rule) => rule.media === media && rule.selectors.includes(selector))
  .flatMap((rule) => rule.declarations.filter((d) => d.property === property).map((d) => d.value)).at(-1)
const resolve = (v) => /^var\((--[\w-]+)\)$/.test(v) ? resolve(tokens.get(v.slice(4, -1))) : v
const grid = 'repeat(auto-fit, minmax(min(100%, max(260px, calc((100% - 32px) / 3))), 1fr))'

for (const selector of ['.dashboard-grid', '.algorithm-grid', '.structure-grid']) {
  test(`v2-2: ${selector} dùng diện tích thật, tối đa ba cột; mobile một cột`, () => {
    assert.equal(value(selector, 'grid-template-columns'), grid)
    assert.equal(value(selector, 'gap'), '16px')
    assert.equal(value(selector, 'grid-template-columns', '@media (max-width: 767px)'), 'minmax(0, 1fr)')
    for (const media of ['@media (max-width: 700px)', '@media (max-width: 900px)', '@media (max-width: 1100px)']) {
      assert.equal(value(selector, 'grid-template-columns', media), undefined, 'không để luật viewport cũ ép số cột')
    }
  })
}

test('v2-2: phép tính ngưỡng grid không bó card, không sinh cột thứ tư', () => {
  // Số dò tay: hai thẻ 260 + gap 16 = 536; ba thẻ + hai gap = 812.
  assert.equal(value('.algorithm-grid', 'grid-template-columns'), grid)
  for (const [width, expected] of [[240, 1], [535, 1], [536, 2], [811, 2], [812, 3], [1600, 3]]) {
    const minimum = Math.min(width, Math.max(260, (width - 32) / 3))
    const columns = Math.floor((width + 16) / (minimum + 16) + 1e-9)
    assert.equal(columns, expected, `nội dung ${width}px`)
    assert.ok((width - (columns - 1) * 16) / columns >= Math.min(260, width))
  }
})

test('v2-2: wrapper ô tìm co giãn; input không ép chiều rộng nội tại', () => {
  assert.equal(value('.library-search', 'flex'), '1 1 280px')
  assert.equal(value('.library-search', 'min-width'), '0')
  assert.equal(value('.library-search-input', 'width'), '100%')
  assert.equal(value('.library-search-input', 'min-width'), '0')
})

test('v2-2: chip Dashboard/Library chung hợp đồng, trạng thái chọn không chỉ đổi màu', () => {
  const shared = sheet.rules.find((r) => r.selectors.includes('.dashboard-chip') && r.selectors.includes('.library-chip'))
  assert.ok(shared, 'chip phải dùng chung luật thay vì sao chép')
  for (const selector of ['.dashboard-chip', '.library-chip']) {
    assert.equal(value(selector, 'min-height'), '44px')
    assert.equal(value(selector, 'border'), '1px solid var(--border-control)')
  }
  assert.equal(value('.library-chip[aria-pressed="true"]', 'font-weight'), '700')
})

test('v2-2: card thống nhất padding/bo góc; hero và CTA có reflow', () => {
  for (const selector of ['.algorithm-card', 'button.structure-card', '.dashboard-card']) {
    assert.equal(value(selector, 'padding'), '20px')
    assert.equal(value(selector, 'border-radius'), '16px')
  }
  assert.equal(value('.dashboard-hero h2', 'text-wrap'), 'balance')
  assert.equal(value('.dashboard-primary-button', 'flex'), '1 1 180px')
  assert.equal(value('.dashboard-outline-button', 'flex'), '1 1 180px')
})

test('v2-2: chữ, viền control, focus và chip chọn giữ ngưỡng WCAG trên nền thật', () => {
  for (const [fg, bg, minimum] of [
    ['--av-text', '--av-surface-1', 4.5], ['--av-text-muted', '--av-surface-1', 4.5],
    ['--border-control', '--av-surface-1', 3], ['--av-focus', '--av-nav-active-bg', 3],
  ]) assert.ok(contrastRatio(resolve(`var(${fg})`), resolve(`var(${bg})`)) >= minimum)
  assert.ok(contrastRatio(resolve(value('.library-chip[aria-pressed="true"]', 'color')),
    resolve(value('.library-chip[aria-pressed="true"]', 'background'))) >= 4.5)
  assert.deepEqual(declarationValues(css, ':focus-visible', 'outline'), ['2px solid var(--av-focus)'])
  assert.equal(value('.library-empty', 'background'), 'var(--panel)')
})
