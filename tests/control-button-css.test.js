import test from 'node:test'
import assert from 'node:assert/strict'

import { declarationValues, parseStylesheet, readStyle } from './helpers/css-tokens.js'

const css = readStyle()
const sheet = parseStylesheet(css)
const values = (selector, property) => declarationValues(css, selector, property)

test('.control-button cao tối thiểu 44px và giữ nguyên trạng thái tương tác', () => {
  assert.deepEqual(values('.control-button', 'min-height'), ['44px'])
  assert.deepEqual(values('.control-button:focus-visible', 'outline'), ['2px solid var(--av-focus)'])
  assert.deepEqual(values('.control-button:focus-visible', 'outline-offset'), ['2px'])
  assert.deepEqual(values('button:disabled', 'opacity'), ['1'])
  assert.deepEqual(values('button:disabled', 'color'), ['var(--av-text-subtle)'])
  assert.deepEqual(values('button:disabled', 'background'), ['var(--av-surface-3)'])
  assert.deepEqual(values('.control-button:hover', 'background'), [])
  assert.deepEqual(values('.control-button:hover:not(:disabled)', 'background'), ['var(--av-primary-hover)'])
})

test('nhóm nút thao tác vẫn giữ hai cột ở mobile', () => {
  const operationRules = sheet.rules.filter((rule) => rule.selectors.includes('.array-operations'))
  const baseColumns = operationRules
    .filter((rule) => rule.media === null)
    .flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === 'grid-template-columns').map((declaration) => declaration.value))
  const mobileColumns = operationRules
    .filter((rule) => rule.media === '@media (max-width: 700px)')
    .flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === 'grid-template-columns').map((declaration) => declaration.value))

  assert.deepEqual(baseColumns, ['repeat(2, minmax(0, 1fr))'])
  assert.deepEqual(mobileColumns, [], 'mobile không được ghi đè cấu trúc hai cột của .array-operations')
})
