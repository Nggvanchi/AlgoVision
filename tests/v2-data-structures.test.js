import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Window } from 'happy-dom'
import { readStyle, parseStylesheet, rootTokens } from './helpers/css-tokens.js'
import { contrastRatio } from './helpers/contrast.js'

const css = readStyle()
const rules = parseStylesheet(css).rules
const tokens = rootTokens(css).tokens
const scope = ':where(#bst-section, #hash-table-section, #graph-section)'
const value = (selector, property, media = null) => rules
  .filter((rule) => rule.media === media && rule.selectors.includes(selector))
  .flatMap((rule) => rule.declarations)
  .filter((declaration) => declaration.property === property).at(-1)?.value
const resolve = (color) => {
  const token = /^var\((--[\w-]+)\)$/.exec(color)?.[1]
  return token ? resolve(tokens.get(token)) : color
}

test('v2-3b: toolbar BST/Hash/Graph wrap, input/select co trong khung hẹp', () => {
  assert.equal(value('.bst-toolbar', 'flex-wrap'), 'wrap')
  for (const selector of ['.bst-toolbar input', '.bst-toolbar select']) {
    assert.equal(value(selector, 'min-width'), '0', 'control toolbar phải co được')
    assert.equal(value(selector, 'max-width'), '100%', 'control toolbar không vượt khung')
  }
})

test('v2-3b: accordion bỏ khung lồng, kiến thức một cột và chữ 14px', () => {
  const wrapper = `${scope} .panel-accordion > :not(summary)`
  assert.equal(value(wrapper, 'border'), '0', 'wrapper accordion không có viền lồng')
  assert.equal(value(wrapper, 'padding'), '0')
  assert.equal(value(wrapper, 'background'), 'transparent')
  assert.equal(value(`${scope} .learning-content`, 'grid-template-columns'), 'minmax(0, 1fr)')
  assert.equal(value(`${scope} .visualizer-placeholder p`, 'font-size'), '14px')
  assert.equal(value(`${scope} .visualizer-placeholder p`, 'max-width'), 'none')
  assert.equal(value(`${scope} .visualizer-placeholder p`, 'line-height'), '1.8')
})

test('v2-3b: slider/stat co được, chuỗi dài không ép rộng workspace', () => {
  assert.equal(value(`${scope} .step-slider input[type="range"]`, 'min-width'), '0', 'slider phải co được')
  assert.equal(value(`${scope} .stat-card`, 'min-width'), '0')
  assert.equal(value(`${scope} .stat-card`, 'overflow-wrap'), 'anywhere')
})

test('v2-3b: bốn module cũ giữ card co được, heading wrap và chữ mô tả 14px', () => {
  for (const selector of ['.array-panel-heading', '.stack-panel-heading', '.linked-list-panel-heading']) {
    assert.equal(value(selector, 'flex-wrap'), 'wrap', 'heading module cũ phải xuống hàng')
  }
  assert.equal(value('.array-operation-card', 'min-width'), '0')
  assert.equal(value('.array-operation-card input', 'min-width'), '0')
  assert.equal(value('.array-operation-card p', 'font-size'), '14px')
  for (const selector of ['.array-operations', '.queue-operations', '.linked-list-operations']) {
    assert.match(value(selector, 'grid-template-columns'), /minmax\(0, 1fr\)/)
  }
  assert.equal(value('.stack-operations', 'grid-template-columns', '@media (max-width: 760px)'), '1fr')
  assert.equal(value('.queue-operations', 'grid-template-columns', '@media (max-width: 640px)'), '1fr')
})

test('v2-3b: control/focus/disabled giữ vùng chạm và tương phản thực', () => {
  for (const selector of ['.control-button', '.bst-toolbar input', '.bst-toolbar select', '.array-operation-card input', '.panel-accordion > summary']) {
    assert.ok(Number.parseFloat(value(selector, 'min-height')) >= 44, `${selector}: vùng chạm >=44px`)
  }
  const panel = resolve(tokens.get('--panel'))
  for (const selector of ['.bst-toolbar input', '.bst-toolbar select', '.array-operation-card input']) {
    const border = resolve(value(selector, 'border').split(' ').at(-1))
    assert.ok(contrastRatio(border, panel) >= 3, 'viền control phải đạt 3:1')
  }
  for (const token of ['--text', '--muted']) {
    assert.ok(contrastRatio(resolve(tokens.get(token)), panel) >= 4.5, 'chữ phải đạt 4,5:1')
  }
  assert.equal(value(':focus-visible', 'outline'), '2px solid var(--av-focus)')
  assert.ok(contrastRatio(resolve(tokens.get('--av-focus')), panel) >= 3)
  assert.equal(value('button:disabled', 'opacity'), '1')
  assert.equal(value('button:disabled', 'cursor'), 'not-allowed')
  assert.ok(contrastRatio(resolve(value('button:disabled', 'color')), resolve(value('button:disabled', 'background'))) >= 4.5)
  assert.equal(value(`${scope} .panel-accordion > summary:hover`, 'background'), 'var(--av-surface-2)')
  assert.equal(value(`${scope} .speed-option input:hover:not(:checked):not(:disabled) + span`, 'background'), 'var(--av-surface-2)')
})

test('v2-3b: giữ cue SVG, reduced motion và khung cuộn thay vì cắt dữ liệu', () => {
  assert.equal(value('.bst-node.is-successor .bst-node-circle', 'stroke-dasharray'), '4 3')
  assert.equal(value('.bst-node-ring', 'fill'), 'none')
  assert.equal(value('.hash-cell-hatch', 'pointer-events'), 'none')
  assert.ok(value('.graph-vertex-check', 'fill'))
  for (const selector of ['.bst-tree-frame', '.array-visualizer', '.queue-visualizer', '.linked-list-visualizer']) {
    assert.equal(value(selector, 'overflow-x'), 'auto', `${selector}: giữ cuộn ngang`)
  }
  for (const selector of ['.hash-table-frame', '.graph-frame']) assert.equal(value(selector, 'overflow'), 'auto')
  assert.ok(rules.some((rule) => rule.media === '@media (prefers-reduced-motion: reduce)'))
})

test('v2-3b: template giữ workspace một cột, ba accordion và live region ở ngoài', () => {
  const window = new Window()
  try {
    window.document.body.innerHTML = readFileSync(new URL('../public/templates/app.html', import.meta.url), 'utf8')
    const style = window.document.createElement('style')
    style.textContent = css
    window.document.head.append(style)
    for (const section of ['bst', 'hash-table', 'graph']) {
      const root = window.document.querySelector(`#${section}-section`)
      assert.ok(root !== null)
      assert.equal(root.querySelectorAll('.panel-accordion[open]').length, 3)
      assert.ok(root.querySelector('.panel-accordion [aria-live]') === null)
      const wrapper = root.querySelector('.visualizer-placeholder')
      assert.ok(wrapper !== null)
      assert.equal(window.getComputedStyle(wrapper).display, 'grid', 'v2-3c thay block bằng Grid thích ứng')
      assert.equal(window.getComputedStyle(wrapper).gridTemplateColumns, 'minmax(0, 1fr)', 'fallback một cột khi container query không có hiệu lực')
      assert.equal(wrapper.querySelectorAll(':scope > .visualizer-stage, :scope > .visualizer-panel').length, 2, 'hai vùng giữ thứ tự Stage rồi Learning')
      for (const width of [360, 760, 1280]) {
        window.happyDOM.setWindowSize({ width, height: 800 })
        const knowledge = root.querySelector('.learning-section .learning-content')
        assert.ok(knowledge !== null)
        assert.equal(window.getComputedStyle(knowledge).gridTemplateColumns, 'minmax(0, 1fr)')
        const paragraph = knowledge.querySelector('p')
        assert.ok(paragraph !== null)
        assert.equal(window.getComputedStyle(paragraph).fontSize, '14px')
        for (const child of root.querySelectorAll('.panel-accordion > :not(summary)')) {
          assert.equal(window.getComputedStyle(child).borderTopWidth, '0px', 'wrapper thực không có viền lồng')
          assert.equal(window.getComputedStyle(child).paddingTop, '0px')
        }
      }
    }
    const block = css.match(/\/\* UI v2-3b:[\s\S]*?\*\/([\s\S]*?)\/\* Kết thúc UI v2-3b \*\//)?.[1]
    assert.ok(block, 'cần khối CSS giới hạn ba màn cấu trúc')
    for (const rule of parseStylesheet(block).rules) {
      assert.ok(rule.selectors.every((selector) => selector.startsWith(scope)), 'không rò luật mới sang màn khác')
      for (const node of window.document.querySelectorAll(rule.selectors.join(', '))) {
        assert.ok(node.closest('#bst-section, #hash-table-section, #graph-section') !== null)
      }
    }
  } finally {
    window.happyDOM.close()
  }
})
