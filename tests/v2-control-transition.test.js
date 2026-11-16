import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Window } from 'happy-dom'
import { readStyle } from './helpers/css-tokens.js'

const template = readFileSync(new URL('../public/templates/app.html', import.meta.url), 'utf8')
const css = readStyle()

function withStyle(run) {
  const window = new Window()
  try {
    window.document.body.innerHTML = template
    const style = window.document.createElement('style')
    style.textContent = css
    window.document.head.append(style)
    run(window)
  } finally { window.happyDOM.close() }
}

for (const id of ['sorting', 'search', 'bst', 'hash-table', 'graph']) {
  test(id + ': enabled/disabled chỉ transition transform, không nội suy nền gây mất contrast', () => {
    withStyle(window => {
      const root = window.document.querySelector('#' + id + '-section')
      assert.ok(root.matches('.adaptive-visualizer'), 'đúng phạm vi Adaptive Visualizer')
      const buttons = [...root.querySelectorAll('.primary-button, .control-button')]
      assert.ok(buttons.length > 0, 'phải kiểm control thật trong template')
      for (const button of buttons) {
        for (const disabled of [false, true, false]) {
          button.disabled = disabled
          const style = window.getComputedStyle(button)
          assert.equal(style.transitionProperty, 'transform', `${button.id}: Adaptive control không được animate background khi đổi disabled`)
        }
      }
    })
  })
}

for (const id of ['array', 'stack', 'queue', 'linked-list']) {
  test(id + ': legacy giữ transition nền hiện có, không nhận override Adaptive', () => {
    withStyle(window => {
      const root = window.document.querySelector('#' + id + '-section')
      assert.ok(!root.matches('.adaptive-visualizer'), 'legacy không thuộc phạm vi fix')
      const buttons = [...root.querySelectorAll('.control-button')]
      assert.ok(buttons.length > 0, 'phải kiểm nút legacy thật')
      for (const button of buttons) {
        assert.match(window.getComputedStyle(button).transition, /background-color/, 'legacy giữ animation nền cũ')
        assert.notEqual(window.getComputedStyle(button).transitionProperty, 'transform', 'không rò override sang legacy')
      }
    })
  })
}
