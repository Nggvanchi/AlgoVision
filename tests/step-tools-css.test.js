import test from 'node:test'
import assert from 'node:assert/strict'
import { readStyle, declarationValues, parseStylesheet, countVarUses } from './helpers/css-tokens.js'
import { contrastRatio } from './helpers/contrast.js'

const css = readStyle()
const sheet = parseStylesheet(css)

const value = (selector, property) => declarationValues(css, selector, property).at(-1)

test('thanh trượt bước cao 44 px (vùng chạm WCAG/Spec mục 13), nền trong suốt để tự vẽ rãnh', () => {
  assert.equal(value('.step-slider input[type="range"]', 'height'), '44px')
  assert.equal(value('.step-slider input[type="range"]', 'background'), 'transparent')
})

test('nút tốc độ cao tối thiểu 44 px, viền --border-control', () => {
  assert.equal(value('.speed-option span', 'min-height'), '44px')
  assert.equal(value('.speed-option span', 'border'), '1px solid var(--border-control)')
})

test('rãnh thanh trượt dùng --border-control ở cả WebKit và Firefox (cặp tương phản đồ họa >= 3:1)', () => {
  assert.equal(value('.step-slider input[type="range"]::-webkit-slider-runnable-track', 'background'), 'var(--border-control)')
  assert.equal(value('.step-slider input[type="range"]::-moz-range-track', 'background'), 'var(--border-control)')

  // Giá trị thật của token trên nền khung (surface-1) phải đạt 3:1 (WCAG 1.4.11).
  assert.ok(contrastRatio('#6B6B87', '#12121C') >= 3)
})

test('núm kéo dùng màu chữ nhấn --av-primary-text, viền màu nền, ở cả WebKit và Firefox', () => {
  for (const selector of ['::-webkit-slider-thumb', '::-moz-range-thumb']) {
    assert.equal(value(`.step-slider input[type="range"]${selector}`, 'background'), 'var(--av-primary-text)')
    assert.equal(value(`.step-slider input[type="range"]${selector}`, 'border'), '2px solid var(--av-bg)')
  }
})

test('nút tốc độ được chọn khác biệt không chỉ bằng màu: có dấu ✓, chữ đậm, viền và nền riêng', () => {
  assert.equal(value('.speed-option input:checked + span', 'font-weight'), '700')
  assert.equal(value('.speed-option input:checked + span', 'border-color'), 'var(--av-primary-line)')
  assert.equal(value('.speed-option input:checked + span', 'background'), 'var(--av-nav-active-bg)')
  assert.match(value('.speed-option input:checked + span::before', 'content'), /✓/)
})

test('vòng focus chung (2px --av-focus, offset 2px) cho thanh trượt và nút tốc độ', () => {
  for (const selector of ['.step-slider input[type="range"]:focus-visible', '.speed-option input:focus-visible + span']) {
    assert.equal(value(selector, 'outline'), '2px solid var(--av-focus)', selector)
    assert.equal(value(selector, 'outline-offset'), '2px', selector)
  }
})

test('radio thật nằm phủ lên nút (không display:none) nên nhận Tab và mũi tên', () => {
  assert.equal(value('.speed-option input', 'position'), 'absolute')
  assert.equal(value('.speed-option input', 'opacity'), '0')
  assert.equal(declarationValues(css, '.speed-option input', 'display').length, 0)
})

test('CSS tốc độ cũ đã gỡ: .speed-control, .search-speed-control, #search-speed-value, --accent-color', () => {
  for (const old of ['.speed-control', '.search-speed-control', '#search-speed-value', '--accent-color']) {
    assert.ok(!css.includes(old), `còn ${old} trong style.css`)
  }
})

test('mobile (<= 700px): thanh trượt và nhóm tốc độ chiếm cả hàng, mỗi nút chia đều', () => {
  const mobile = sheet.rules.filter((rule) => rule.media !== null && /max-width:\s*700px/.test(rule.media))
  const flexBasis = (selector) => mobile
    .filter((rule) => rule.selectors.includes(selector))
    .flatMap((rule) => rule.declarations)
    .find((declaration) => declaration.property === 'flex-basis')?.value

  assert.equal(flexBasis('.step-slider'), '100%')
  assert.equal(flexBasis('.speed-group'), '100%')
  assert.equal(mobile.some((rule) => rule.selectors.includes('.speed-option') && rule.declarations.some((d) => d.property === 'flex' && d.value === '1')), true)
})

test('không dùng màu hex mới: toàn bộ khối bước dùng var(--av-*) hoặc --border-control', () => {
  const start = css.indexOf('/* Thanh bước dùng chung (R6a)')
  const end = css.indexOf('/* Bảng phân tích thuật toán */')
  const block = css.slice(start, end)

  assert.ok(start >= 0 && end > start)
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(block), 'khối bước không được có hex cứng')
  assert.ok(countVarUses(block, '--border-control') >= 3)
})
