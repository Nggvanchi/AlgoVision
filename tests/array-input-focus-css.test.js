import test from 'node:test'
import assert from 'node:assert/strict'

import { declarationValues, parseStylesheet, readStyle } from './helpers/css-tokens.js'

const css = readStyle()
const sheet = parseStylesheet(css)
const values = (selector, property) => declarationValues(css, selector, property)

test('ô nhập Array có vòng focus-visible 2px dùng token --av-focus', () => {
  assert.deepEqual(values('.array-operation-card input:focus-visible', 'outline'), ['2px solid var(--av-focus)'])
  assert.deepEqual(values('.array-operation-card input:focus-visible', 'outline-offset'), ['2px'])
})

test('vòng focus của Array không còn glow màu cứng thay thế token', () => {
  assert.deepEqual(values('.array-operation-card input:focus-visible', 'box-shadow'), [])
  assert.deepEqual(values('.array-operation-card input:focus', 'box-shadow'), [])
})

test('input BST và Hash Table không bị thêm rule focus riêng của Array', () => {
  assert.deepEqual(values('.bst-toolbar input:focus-visible', 'outline'), [])
  assert.deepEqual(values('.hash-toolbar input:focus-visible', 'outline'), [])
  assert.equal(sheet.rules.some((rule) => rule.selectors.includes('input:focus-visible')), false)
})
