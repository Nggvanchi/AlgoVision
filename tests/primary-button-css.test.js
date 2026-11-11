import test from 'node:test'
import assert from 'node:assert/strict'

import { declarationValues, parseStylesheet, readStyle } from './helpers/css-tokens.js'

const css = readStyle()
const sheet = parseStylesheet(css)
const values = (selector, property) => declarationValues(css, selector, property)
const rule = (selector, media = null) => sheet.rules.find((item) => item.media === media && item.selectors.includes(selector))
const value = (selector, property, media = null) => rule(selector, media)?.declarations.find((declaration) => declaration.property === property)?.value

test('.primary-button có vùng chạm 44px và giữ nguyên các declaration tương tác', () => {
  assert.equal(value('.primary-button', 'min-height'), '44px')
  assert.equal(value('.primary-button', 'padding'), '11px 16px')
  assert.equal(value('.primary-button:hover', 'transform'), 'translateY(-1px)')
  assert.equal(value('.primary-button:hover', 'background'), 'var(--av-primary-hover)')
  assert.equal(value('.primary-button:disabled', 'opacity'), '0.4')
  assert.equal(value('.primary-button:disabled', 'cursor'), 'not-allowed')
  assert.equal(value('.primary-button:disabled', 'transform'), 'none')
})

test('.primary-button thừa hưởng focus-visible chung và không làm đổi nút dashboard', () => {
  assert.equal(value('button:focus-visible', 'outline'), '2px solid var(--av-focus)')
  assert.equal(value('button:focus-visible', 'outline-offset'), '2px')
  assert.equal(rule('.primary-button:focus-visible'), undefined)
  assert.equal(value('.array-toolbar .primary-button', 'flex-shrink'), '0')
  assert.equal(value('.dashboard-primary-button', 'min-height'), '44px')
})
