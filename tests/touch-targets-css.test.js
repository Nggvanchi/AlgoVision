import test from 'node:test'
import assert from 'node:assert/strict'

import { parseStylesheet, readStyle } from './helpers/css-tokens.js'

const css = readStyle()
const sheet = parseStylesheet(css)

function minimumHeights(selector) {
  return sheet.rules
    .filter((rule) => rule.selectors.includes(selector))
    .flatMap((rule) => rule.declarations
      .filter((declaration) => declaration.property === 'min-height')
      .map((declaration) => Number.parseFloat(declaration.value)))
}

test('các control thao tác ở Array, Searching, BST, Hash Table và Graph đạt tối thiểu 44px', () => {
  const selectors = [
    '.back-button',
    '.size-control select',
    '.search-toolbar input',
    '#search-algorithm',
    '.array-operation-card input',
    '.bst-toolbar input',
    '.bst-toolbar select',
  ]

  for (const selector of selectors) {
    const heights = minimumHeights(selector)
    assert.ok(heights.length > 0, `${selector}: thiếu min-height`)
    assert.ok(heights.every((height) => height >= 44), `${selector}: min-height ${heights.join(', ')}px nhỏ hơn 44px`)
  }
})
