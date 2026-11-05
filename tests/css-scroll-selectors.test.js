import test from 'node:test'
import assert from 'node:assert/strict'

import { findScrollingSelectors } from './helpers/css-scroll-selectors.js'

const selectors = (css) => findScrollingSelectors(css).map((item) => item.selector)

test('findScrollingSelectors: nhận overflow, overflow-x, overflow-y có auto hoặc scroll, bỏ hidden và visible', () => {
  const css = `
    .a { overflow: auto; }
    .b { overflow-x: scroll; color: red; }
    .c { margin: 0; overflow-y: auto !important; }
    .d { overflow: hidden; }
    .e { overflow-x: visible; overflow-y: hidden; }
    .f { overflow: hidden auto; }
  `

  assert.deepEqual(selectors(css), ['.a', '.b', '.c', '.f'])
})

test('findScrollingSelectors: tách selector theo dấu phẩy và bỏ qua chú thích', () => {
  const css = `
    /* .nope { overflow: auto; } */
    .x, .y pre { overflow-x: auto; }
  `

  assert.deepEqual(selectors(css), ['.x', '.y pre'])
})

test('findScrollingSelectors: đi vào @media nhưng bỏ qua @keyframes', () => {
  const css = `
    @media (max-width: 700px) { .m { overflow-x: auto; } }
    @keyframes spin { from { overflow: auto; } to { overflow: auto; } }
    .after { overflow: scroll; }
  `

  assert.deepEqual(selectors(css), ['.m', '.after'])
})

test('findScrollingSelectors: ngoặc không cân bằng ném lỗi rõ ràng, không bỏ qua im lặng', () => {
  assert.throws(() => findScrollingSelectors('.a { overflow: auto;'), /không cân bằng/)
  assert.throws(() => findScrollingSelectors('.a { overflow: auto; } }'), /không cân bằng/)
  assert.throws(() => findScrollingSelectors('@media (x) { .a { overflow: auto; }'), /không cân bằng/)
})

test('findScrollingSelectors: at-rule chưa hỗ trợ ném lỗi nêu tên', () => {
  assert.throws(() => findScrollingSelectors('@scope (.a) { .b { overflow: auto; } }'), /@scope/)
})
