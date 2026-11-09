import test from 'node:test'
import assert from 'node:assert/strict'
import { readStyle, rootTokens, declarationValues, stripComments } from './helpers/css-tokens.js'

const css = readStyle()
const code = stripComments(css)

test('R6b: màu canvas BST/Hash/Graph dùng token --av-primary-text; không còn --purple hay #9b82ff', () => {
  assert.ok(!code.includes('var(--purple)'), 'còn var(--purple)')
  assert.ok(!/#9b82ff/i.test(code), 'còn #9b82ff')
  assert.ok(!rootTokens(css).tokens.has('--purple'), 'alias --purple phải được gỡ khỏi :root')
})

test('R6b: các chỗ canvas trước đây dùng --purple nay dùng var(--av-primary-text) (đường viền nút, viền đứt khung rỗng, mũi tên)', () => {
  assert.ok((code.match(/var\(--av-primary-text\)/g) ?? []).length >= 13, 'cần >= 13 chỗ dùng token chữ nhấn (13 chỗ canvas + chỗ cũ)')
  assert.match(code, /border: 2px dashed var\(--av-primary-text\)/)
  assert.match(code, /border: 3px dotted var\(--av-primary-text\)/)
})

const CONTROL_RULES = [
  ['.size-control select', 'border'],
  ['.search-toolbar input', 'border'],
  ['#search-algorithm', 'border'],
  ['.array-operation-card input', 'border'],
  ['.bst-toolbar select', 'border'],
  ['.bst-toolbar input', 'border'],
]

for (const [selector, property] of CONTROL_RULES) {
  test(`R6b: viền điều khiển ${selector} dùng --border-control (WCAG 1.4.11 >= 3:1), không hex hay --border`, () => {
    const values = declarationValues(css, selector, property)

    assert.ok(values.length > 0, `không tìm thấy ${selector}`)
    assert.ok(values.some((value) => value === '1px solid var(--border-control)'), `${selector}: ${JSON.stringify(values)}`)
  })
}
