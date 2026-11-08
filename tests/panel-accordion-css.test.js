import test from 'node:test'
import assert from 'node:assert/strict'
import { readStyle, declarationValues } from './helpers/css-tokens.js'

const css = readStyle()
const value = (selector, property) => declarationValues(css, selector, property).at(-1)

test('summary của accordion cao tối thiểu 44 px và là con trỏ bấm được', () => {
  assert.equal(value('.panel-accordion > summary', 'min-height'), '44px')
  assert.equal(value('.panel-accordion > summary', 'cursor'), 'pointer')
})

test('mũi tên mở/đóng bằng ký hiệu (không chỉ màu): ▾ khi đóng, ▴ khi mở; dấu mặc định của trình duyệt bị ẩn', () => {
  assert.equal(value('.panel-accordion > summary::after', 'content'), '"▾"')
  assert.equal(value('.panel-accordion[open] > summary::after', 'content'), '"▴"')
  assert.equal(value('.panel-accordion > summary', 'list-style'), 'none')
  assert.equal(value('.panel-accordion > summary::-webkit-details-marker', 'display'), 'none')
})

test('vòng focus chung 2px --av-focus cho summary, lùi vào trong (offset âm) để không bị cắt bởi khung', () => {
  assert.equal(value('.panel-accordion > summary:focus-visible', 'outline'), '2px solid var(--av-focus)')
  assert.equal(value('.panel-accordion > summary:focus-visible', 'outline-offset'), '-2px')
})

test('khung accordion dùng token: viền --border, nền --panel, bo góc --av-radius-control', () => {
  assert.equal(value('.panel-accordion', 'border'), '1px solid var(--border)')
  assert.equal(value('.panel-accordion', 'background'), 'var(--panel)')
  assert.equal(value('.panel-accordion', 'border-radius'), 'var(--av-radius-control)')
})

test('khối accordion không có hex cứng', () => {
  const start = css.indexOf('/* Panel accordion (R6b)')
  const end = css.indexOf('/* Thanh bước dùng chung (R6a)')

  assert.ok(start >= 0 && end > start)
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css.slice(start, end)))
})
