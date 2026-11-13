import test from 'node:test'
import assert from 'node:assert/strict'
import { readStyle, rootTokens, declarationValues } from './helpers/css-tokens.js'
import { contrastRatio } from './helpers/contrast.js'

const css = readStyle()
const tokens = rootTokens(css).tokens
const last = (selector, property) => declarationValues(css, selector, property).at(-1)
const resolve = (value) => {
  if (value === 'white') return '#ffffff'
  const name = /^var\((--[\w-]+)\)$/.exec(value)?.[1]
  return name ? resolve(tokens.get(name)) : value
}

test('v2: viền ô dữ liệu Hash Table đạt 3:1 trên nền ô và khung', () => {
  const edge = resolve(last('.hash-cell', 'stroke'))
  for (const background of [last('.hash-cell', 'fill'), last('.hash-table-frame', 'background')]) {
    assert.ok(contrastRatio(edge, resolve(background)) >= 3, 'viền ô Hash Table phải đạt 3:1')
  }
})

for (const surface of ['--av-bg', '--av-sidebar', '--av-surface-1', '--av-surface-2']) {
  test(`v2: chữ, control và focus tương phản trên ${surface}`, () => {
    const bg = resolve(tokens.get(surface))
    for (const name of ['--av-text', '--av-text-muted', '--av-text-subtle']) {
      assert.ok(contrastRatio(resolve(tokens.get(name)), bg) >= 4.5, `${name} trên ${surface}`)
    }
    for (const name of ['--border-control', '--av-focus']) {
      assert.ok(contrastRatio(resolve(tokens.get(name)), bg) >= 3, `${name} trên ${surface}`)
    }
  })
}

for (const selector of ['.search-cell.is-checked', '.search-cell.is-eliminated', '.search-cell.is-current', '.search-cell.is-found']) {
  test(`v2: ${selector} đọc được và cue phân biệt trên canvas trắng`, () => {
    const bg = resolve(last(selector, 'background'))
    assert.ok(contrastRatio(resolve(last(selector, 'color')), bg) >= 4.5)
    const edge = last(selector, 'border-color') || last(selector, 'border')?.split(' ').at(-1)
    assert.ok(contrastRatio(resolve(edge), bg) >= 3)
    assert.ok(contrastRatio(resolve(edge), tokens.get('--av-surface-1')) >= 3)
  })
}

test('v2: nền cũ đã thay và nhãn nhỏ ở shell/canvas/Queue đạt AA', () => {
  for (const selector of ['.brand h1', '.bar-value', '.queue-front-label', '.queue-rear-label']) {
    assert.ok(contrastRatio(resolve(last(selector, 'color')), tokens.get('--av-surface-1')) >= 4.5, selector)
  }
  assert.equal(last('.visualizer-placeholder', 'background'), 'var(--panel)')
  assert.equal(last('.array-operation-card input', 'background'), 'var(--panel)')
})

test('v2: focus rõ trên nav đang chọn; nút chính trắng đạt AA cả hover', () => {
  assert.ok(contrastRatio(tokens.get('--av-focus'), tokens.get('--av-nav-active-bg')) >= 3)
  for (const name of ['--av-primary', '--av-primary-hover']) {
    assert.ok(contrastRatio('#ffffff', tokens.get(name)) >= 4.5)
  }
})

test('v2: disabled vẫn đọc được, không làm mờ chữ và có cursor phù hợp', () => {
  assert.equal(last('button:disabled', 'opacity'), '1')
  assert.equal(last('button:disabled', 'cursor'), 'not-allowed')
  assert.ok(contrastRatio(resolve(last('button:disabled', 'color')), resolve(last('button:disabled', 'background'))) >= 4.5)
  assert.equal(last('.array-operation-card .control-button:disabled', 'background'), last('button:disabled', 'background'))
})

for (const state of ['comparing', 'swapped', 'sorted']) {
  test(`v2: cột ${state} có biên 3:1 trên nền cột và canvas`, () => {
    const selector = `.array-bar.is-${state}`
    const edge = resolve(last(selector, 'border-color'))
    // Hai gradient nét đứt giữ nguyên cue; nền cuối của swapped là màu pastel.
    const bg = last(selector, 'background').match(/#[\da-f]{6}\s*$/i)?.[0].trim()
    assert.ok(bg, `${selector} thiếu nền pastel`)
    assert.ok(contrastRatio(edge, bg) >= 3)
    assert.ok(contrastRatio(edge, tokens.get('--av-surface-1')) >= 3)
    assert.ok(contrastRatio(tokens.get('--bar-cue'), bg) >= 3)
  })
}
