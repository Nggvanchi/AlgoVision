import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Window } from 'happy-dom'
import { readStyle, parseStylesheet, rootTokens } from './helpers/css-tokens.js'
import { contrastRatio } from './helpers/contrast.js'

const css = readStyle()
const rules = parseStylesheet(css).rules
const tokens = rootTokens(css).tokens
const scope = ':where(#sorting-section, #search-section)'
const value = (selector, property, media = null) => rules
  .filter((rule) => rule.media === media && rule.selectors.includes(selector))
  .flatMap((rule) => rule.declarations)
  .filter((declaration) => declaration.property === property).at(-1)?.value
const resolve = (color) => {
  const name = /^var\((--[\w-]+)\)$/.exec(color)?.[1]
  return name ? resolve(tokens.get(name)) : color
}

test('v2-3a: toolbar tự xuống hàng, input/select co được trong khung hẹp', () => {
  assert.equal(value('.array-toolbar', 'flex-wrap'), 'wrap', 'toolbar Sorting phải tự xuống hàng')
  assert.equal(value('.search-toolbar', 'align-items'), 'center')
  assert.equal(value('#search-algorithm', 'max-width'), '100%', 'select Searching không vượt khung')
  assert.equal(value('.search-toolbar input', 'background'), 'var(--panel)')
  assert.equal(value('.search-toolbar input', 'color'), 'var(--text)')
})

test('v2-3a: nhãn cột tối thiểu 12px, ba hàng nhãn mobile nằm ngoài chân cột', () => {
  assert.equal(value('.bar-value', 'font-size'), '12px', 'nhãn cột phải đọc được ở 12px')
  assert.equal(value('.array-bars', 'padding'), '24px 12px 56px')
  assert.equal(value('.bar-value', 'bottom'), '-20px')
  assert.equal(value('.bar-value', 'top'), undefined)
  const mobile = '@media (max-width: 700px)'
  assert.equal(value('.bar-value', 'font-size', mobile), undefined, 'không thu nhãn xuống 8px')
  assert.equal(value('.array-bar:nth-child(3n + 2) .bar-value', 'bottom', mobile), '-36px')
  assert.equal(value('.array-bar:nth-child(3n) .bar-value', 'bottom', mobile), '-52px')
})

test('v2-3a: slider co được, nhãn thống kê dài không ép rộng workspace', () => {
  assert.equal(value(`${scope} .step-slider input[type="range"]`, 'min-width'), '0', 'slider phải co được')
  assert.equal(value(`${scope} .stat-card`, 'min-width'), '0')
  assert.equal(value(`${scope} .stat-card`, 'overflow-wrap'), 'anywhere')
})

test('v2-3a: Learning Panel bỏ khung lồng, kiến thức giữ một cột', () => {
  const panel = `${scope} .panel-accordion > :not(summary)`
  assert.equal(value(panel, 'border'), '0', 'panel không còn viền lồng')
  assert.equal(value(panel, 'padding'), '0')
  assert.equal(value(panel, 'background'), 'transparent')
  assert.equal(value(`${scope} .learning-content`, 'grid-template-columns'), 'minmax(0, 1fr)')
  assert.equal(value(`${scope} .visualizer-placeholder p`, 'max-width'), 'none')
  assert.equal(value(`${scope} .visualizer-placeholder p`, 'font-size'), '14px')
})

test('v2-3a: hover tốc độ/accordion có nền sáng; focus và disabled vẫn rõ', () => {
  const hover = `${scope} .speed-option input:hover:not(:checked):not(:disabled) + span`
  assert.equal(value(hover, 'background'), 'var(--av-surface-2)', 'tốc độ phải có hover khi được bật')
  for (const selector of [':focus-visible', '.step-slider input[type="range"]:focus-visible', '.speed-option input:focus-visible + span']) {
    assert.equal(value(selector, 'outline'), '2px solid var(--av-focus)', selector)
  }
  assert.equal(value('button:disabled', 'opacity'), '1')
  assert.equal(value('button:disabled', 'cursor'), 'not-allowed')
  for (const selector of ['.primary-button', '.control-button', '.size-control select', '#search-algorithm', '.search-toolbar input', '.speed-option span', '.panel-accordion > summary']) {
    assert.ok(Number.parseFloat(value(selector, 'min-height')) >= 44, `${selector}: vùng chạm phải >=44px`)
  }
})

test('v2-3a: chữ/disabled/hover đạt 4,5:1; control, focus và cue đạt 3:1', () => {
  const panel = resolve(tokens.get('--panel'))
  const hover = resolve(value(`${scope} .speed-option input:hover:not(:checked):not(:disabled) + span`, 'background'))
  assert.ok(hover, 'cần nền hover thực trước khi tính tương phản')
  for (const [foreground, background] of [
    [resolve(tokens.get('--text')), panel],
    [resolve(value('.speed-option span', 'color')), hover],
    [resolve(value('button:disabled', 'color')), resolve(value('button:disabled', 'background'))],
  ]) assert.ok(contrastRatio(foreground, background) >= 4.5, 'chữ phải đạt 4,5:1 trên nền thật')
  for (const color of ['--border-control', '--av-focus', '--state-active']) {
    assert.ok(contrastRatio(resolve(tokens.get(color)), panel) >= 3, `${color} phải đạt 3:1`)
  }
  for (const state of ['comparing', 'swapped', 'sorted']) {
    assert.ok(value(`.array-bar.is-${state}`, 'border-color'), `giữ cue ${state}`)
  }
  assert.match(value('.array-bar.is-swapped', 'background'), /repeating-linear-gradient/)
  assert.match(value('.array-bar.is-sorted', 'box-shadow'), /inset/)
})

test('v2-3a: luật mới chỉ áp dụng Sorting/Searching, CSS đặc thù không rò sang module khác', () => {
  const block = css.match(/\/\* UI v2-3a:[\s\S]*?\*\/([\s\S]*?)\/\* Kết thúc UI v2-3a \*\//)?.[1]
  assert.ok(block, 'cần khối scoped v2-3a')
  const scoped = parseStylesheet(block).rules
  assert.ok(scoped.length > 0)
  for (const rule of scoped) {
    assert.ok(rule.selectors.every((selector) => selector.startsWith(scope)), 'mọi luật mới phải có scope hai màn')
  }
  const window = new Window()
  try {
    window.document.body.innerHTML = readFileSync(new URL('../public/templates/app.html', import.meta.url), 'utf8')
    for (const selector of ['.array-toolbar', '.visualizer-heading', '.array-bars', '.bar-value', '.array-count', '.array-legend', '.size-control', '.search-toolbar', '#search-algorithm']) {
      // Nhãn cột sinh động không có trong template; vùng chứa của nó đã được kiểm.
      const nodes = [...window.document.querySelectorAll(selector)]
      for (const node of nodes) assert.ok(node.closest('#sorting-section, #search-section') !== null, `${selector} không được dùng bởi module khác`)
    }
    for (const rule of scoped) {
      for (const node of window.document.querySelectorAll(rule.selectors.join(', '))) {
        assert.ok(node.closest('#sorting-section, #search-section') !== null, 'luật mới không được khớp module khác')
      }
    }
    for (const section of ['bst', 'hash-table', 'graph']) {
      const root = window.document.querySelector(`#${section}-section`)
      assert.ok(root !== null)
      assert.ok(root.querySelector(`${scope} .learning-content`) === null)
    }
  } finally {
    window.happyDOM.close()
  }
})
