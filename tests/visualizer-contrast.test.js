import test from 'node:test'
import assert from 'node:assert/strict'

import { contrastRatio, blend } from './helpers/contrast.js'
import { declarationValues, readStyle, rootTokens } from './helpers/css-tokens.js'

const css = readStyle()
const tokens = rootTokens(css).tokens
const latest = (selector, property) => declarationValues(css, selector, property).at(-1)
const tokenColor = (name) => tokens.get(name)

const AA_TEXT = 4.5
const NON_TEXT = 3
const panel = tokenColor('--av-surface-1')

test('R6c: dấu ✓ trong Graph dùng chữ chính và đạt AA trên nền trạng thái đã hoàn tất', () => {
  const checkColor = latest('.graph-vertex-check', 'fill')
  const completedFill = blend('#22c55e', 0.22, panel)

  assert.equal(checkColor, 'var(--av-text)')
  assert.ok(contrastRatio(tokenColor('--av-text'), completedFill) >= AA_TEXT)
})

test('R6c: văn bản trạng thái tìm kiếm đạt AA trên từng nền trạng thái', () => {
  const pairs = [
    ['đang xét', '#92400e', '#fef3c7'],
    ['đã tìm thấy', '#166534', '#dcfce7'],
    ['đã kiểm tra', '#a1a1aa', '#27272a'],
    ['đã loại', tokenColor('--av-text'), '#3b3b43'],
  ]

  for (const [state, foreground, background] of pairs) {
    assert.ok(contrastRatio(foreground, background) >= AA_TEXT, `${state}: ${contrastRatio(foreground, background).toFixed(2)}:1`)
  }
})

test('R6c: placeholder Array và nút chính ở trạng thái hover đạt AA cho chữ thường', () => {
  const placeholder = latest('.array-operation-card input::placeholder', 'color')
  const buttonColor = latest('.primary-button', 'color')
  const hoverBackground = latest('.primary-button:hover', 'background')
  const resolvedButtonColor = buttonColor === 'white' ? '#ffffff' : buttonColor
  const resolvedHoverBackground = tokenColor(hoverBackground.match(/--[\w-]+/)?.[0])

  assert.ok(contrastRatio(placeholder, '#0f131b') >= AA_TEXT, 'placeholder trên nền input')
  assert.ok(contrastRatio(resolvedButtonColor, tokenColor('--av-primary')) >= AA_TEXT, 'nút chính bình thường')
  assert.ok(contrastRatio(resolvedButtonColor, resolvedHoverBackground) >= AA_TEXT, 'nút chính khi hover')
})

test('R6c: trạng thái tìm kiếm không làm giảm tương phản chữ bằng opacity hoặc grayscale', () => {
  for (const selector of ['.search-cell.is-checked', '.search-cell.is-eliminated']) {
    assert.equal(latest(selector, 'opacity'), undefined, `${selector} không dùng opacity để quyết định tương phản chữ`)
    assert.equal(latest(selector, 'filter'), undefined, `${selector} không áp grayscale lên chữ`)
  }

  assert.equal(latest('.search-cell.is-eliminated', 'color'), 'var(--av-text)')
  assert.equal(latest('.search-cell.is-eliminated', 'background'), '#3b3b43')
  assert.equal(latest('.search-cell.is-checked', 'color'), '#a1a1aa')
})

test('R6c: viền trạng thái tìm kiếm và chỉ báo vị trí Queue đạt tương phản phi văn bản 3:1', () => {
  const checkedBorder = latest('.search-cell.is-checked', 'border-color')
  const eliminatedBorder = latest('.search-cell.is-eliminated', 'border').match(/#[0-9a-f]{6}/i)?.[0]

  assert.ok(contrastRatio(checkedBorder, '#27272a') >= NON_TEXT, 'viền trạng thái đã kiểm tra trên nền')
  assert.ok(contrastRatio(eliminatedBorder, '#3b3b43') >= NON_TEXT, 'viền trạng thái đã loại trên nền')

  const queueLabels = [
    ['.queue-front-label', '#22c55e'],
    ['.queue-rear-label', '#60a5fa'],
  ]
  for (const [selector, foreground] of queueLabels) {
    assert.equal(latest(selector, 'color'), foreground)
    assert.ok(contrastRatio(foreground, panel) >= AA_TEXT, `${selector} trên panel phải đạt AA cho chữ nhỏ`)
  }
})

test('R6c: màu trạng thái trực quan hóa giữ tương phản phi văn bản tối thiểu 3:1 trên panel tối', () => {
  const resolveColor = (value) => value.startsWith('var(')
    ? tokenColor(value.match(/--[\w-]+/)[0])
    : value
  const pairs = [
    ['đang xét / pseudocode', latest('.pseudocode-line.is-active', 'border-left-color'), '#12121c'],
    ['đường đi BST/Hash/Graph', latest('.bst-edge.is-path', 'stroke'), panel],
    ['đỉnh hoàn tất BST/Hash/Graph', latest('.bst-node-ring', 'stroke'), panel],
    ['cạnh kế tiếp BST', latest('.bst-node.is-successor .bst-node-circle', 'stroke'), panel],
    ['cột đã đổi chỗ', latest('.array-bar.is-swapped', 'border-color'), panel],
    ['cột đã sắp xếp', latest('.array-bar.is-sorted', 'border-color'), panel],
  ]

  for (const [state, color, background] of pairs) {
    const foreground = resolveColor(color)

    assert.ok(contrastRatio(foreground, background) >= NON_TEXT, `${state}: ${contrastRatio(foreground, background).toFixed(2)}:1`)
  }
})

