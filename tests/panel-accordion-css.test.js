import test from 'node:test'
import assert from 'node:assert/strict'
import { readStyle, declarationValues } from './helpers/css-tokens.js'

const css = readStyle()
const value = (selector, property) => declarationValues(css, selector, property).at(-1)

test('dropdown cao tối thiểu 44 px và là con trỏ bấm được', () => {
  assert.equal(value('.learning-panel-picker select', 'min-height'), '44px')
  assert.equal(value('.learning-panel-picker select', 'cursor'), 'pointer')
})

test('dropdown co trong panel và giữ giao diện select native', () => {
  assert.equal(value('.learning-panel-picker select', 'width'), '100%')
  assert.equal(value('.learning-panel-picker select', 'min-width'), '0')
  assert.equal(value('.learning-panel-picker select', 'appearance'), undefined)
  assert.ok(!css.includes('.panel-accordion'), 'không giữ CSS accordion thừa')
})

test('dropdown dùng vòng focus chung 2px --av-focus, không tắt outline', () => {
  assert.equal(value(':focus-visible', 'outline'), '2px solid var(--av-focus)')
  assert.equal(value(':focus-visible', 'outline-offset'), '2px')
  assert.equal(value('.learning-panel-picker select', 'outline'), undefined)
})

test('dropdown dùng token viền control, nền panel, chữ và bo góc', () => {
  assert.equal(value('.learning-panel-picker select', 'border'), '1px solid var(--border-control)')
  assert.equal(value('.learning-panel-picker select', 'background'), 'var(--panel)')
  assert.equal(value('.learning-panel-picker select', 'color'), 'var(--text)')
  assert.equal(value('.learning-panel-picker select', 'border-radius'), 'var(--av-radius-control)')
})

test('khối dropdown không có hex cứng', () => {
  const start = css.indexOf('/* Learning Panel Dropdown:')
  const end = css.indexOf('/* Thanh bước dùng chung (R6a)')

  assert.ok(start >= 0 && end > start)
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css.slice(start, end)))
})
