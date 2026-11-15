import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Window } from 'happy-dom'
import { readStyle, parseStylesheet } from './helpers/css-tokens.js'

const css = readStyle()
const html = readFileSync(new URL('../public/templates/app.html', import.meta.url), 'utf8')
const hashes = {
  sorting: '4d8bb7c9f933c6f9485887430703d533f2ed7ad8ea6734d1c1dae84eba06bf56',
  search: '149739318b7b8973895a1adc29b058c8a15712b0fc8206799f65905d024b6e97',
  bst: 'b1f34cdf26077777759a47b26e38f1992c4613ca91713795776989c596acfe49',
  'hash-table': '227e58ab3b18043a70e40df4882c3364c1f57b5c373d3ac166e32442bbcaeada',
  graph: '8c61bc26caa2d4a2c0e561f00e439f26b1cba9939e1a3a109908f0209e7eb803',
}
const value = (selector, prop) => parseStylesheet(css).rules.filter(r => r.media === null && r.selectors.includes(selector))
  .flatMap(r => r.declarations).filter(d => d.property === prop).at(-1)?.value

// Fingerprint độc lập, ghi trước wrapper tại base f14986f: thứ tự ID và toàn bộ thuộc tính control/focus.
// Không fingerprint class trình bày; không lấy giá trị mong đợi từ template đang được sửa.
for (const [id, expected] of Object.entries(hashes)) {
  test('v2-3c: ' + id + ' giữ ID/focus/reading order, Stage trước Learning và live ngoài details', () => {
    const w = new Window()
    try {
      w.document.body.innerHTML = html
      const root = w.document.querySelector('#' + id + '-section')
      const workspace = root.querySelector('.visualizer-workspace')
      assert.ok(workspace !== null, 'cần workspace thích ứng')
      assert.deepEqual([...workspace.children].map(n => n.className), ['visualizer-stage', 'visualizer-panel'], 'Stage phải đứng trước Learning Panel')
      const [stage, panel] = workspace.children
      assert.equal(stage.querySelectorAll('.panel-accordion').length, 0)
      assert.equal(panel.querySelectorAll('[data-learning-pane]').length, 3)
      assert.ok(stage.querySelector('[aria-live="polite"]') !== null, 'live giải thích bước nằm trong Stage')
      assert.ok(root.querySelector('[data-learning-pane] [aria-live]') === null)
      assert.ok(panel.querySelector('pre[tabindex="0"][aria-labelledby]') !== null)
      // Chuẩn hóa đúng thay đổi đã duyệt: bỏ picker mới, tái tạo ba summary cũ để so fingerprint base.
      const original = root.cloneNode(true)
      original.querySelector('.learning-panel-picker').remove()
      for (const [i, pane] of [...original.querySelectorAll('[data-learning-pane]')].entries()) {
        const summary = w.document.createElement('summary')
        summary.textContent = ['Mã giả', 'Độ phức tạp', 'Kiến thức'][i]
        pane.prepend(summary)
      }
      const ids = [...original.querySelectorAll('[id]')].map(n => n.id)
      const focus = [...original.querySelectorAll('button,input,select,summary,[tabindex]')].map(n => [n.tagName, n.id, [...n.attributes].filter(a => a.name !== 'class').map(a => [a.name, a.value])])
      assert.equal(createHash('sha256').update(JSON.stringify({ ids, focus })).digest('hex'), expected, 'ID/thuộc tính/thứ tự focus phải giữ đúng base')
    } finally { w.happyDOM.close() }
  })
}

test('v2-3c: Grid fallback một cột, hai cột co nội dung thay vì cắt overflow', () => {
  assert.equal(value('.visualizer-workspace', 'display'), 'grid')
  assert.equal(value('.visualizer-workspace', 'grid-template-columns'), 'minmax(0, 1fr)')
  assert.equal(value('.visualizer-workspace', 'gap'), '24px')
  assert.equal(value('.visualizer-workspace', 'align-items'), 'start')
  assert.equal(value('.visualizer-stage', 'min-width'), '0', 'Stage phải co được')
  assert.equal(value('.visualizer-panel', 'min-width'), '0')
  const block = css.slice(css.indexOf('/* UI v2-3c:'))
  assert.ok(!/overflow:\s*(hidden|clip)|order:|grid-auto-flow:\s*dense/.test(block), 'không che overflow hoặc đảo reading order')
})

test('v2-3c: ngưỡng container theo nội dung, Hash có ngưỡng riêng và panel 340–380px', () => {
  assert.equal(value('.adaptive-visualizer', 'container'), 'visualizer / inline-size')
  assert.equal(value('#hash-table-section', 'container-name'), 'hash')
  assert.match(css, /@container visualizer \(min-width: 1094px\)\s*\{\s*\.visualizer-workspace\s*\{\s*grid-template-columns: minmax\(680px, 1fr\) minmax\(340px, 380px\);/)
  assert.match(css, /@container hash \(min-width: 1288px\)\s*\{\s*\.visualizer-workspace\s*\{\s*grid-template-columns: minmax\(874px, 1fr\) minmax\(340px, 380px\);/, 'Hash giữ ngưỡng riêng 1288px')
  // 24px padding + 1px border mỗi cạnh: bề rộng Grid tối thiểu = 1044 / 1238px.
  assert.equal(1094 - 50, 680 + 24 + 340)
  assert.equal(1288 - 50, 874 + 24 + 340)
})

test('v2-3c: CSS thích ứng chỉ áp năm màn, legacy giữ nguyên wrapper', () => {
  const w = new Window()
  try {
    w.document.body.innerHTML = html
    assert.deepEqual([...w.document.querySelectorAll('.adaptive-visualizer')].map(n => n.id), Object.keys(hashes).map(id => id + '-section'))
    for (const id of ['array', 'stack', 'queue', 'linked-list']) assert.ok(w.document.querySelector('#' + id + '-section .visualizer-workspace') === null)
    for (const id of Object.keys(hashes)) {
      assert.equal(w.document.querySelectorAll('#' + id + '-section .visualizer-stage').length, 1)
      assert.equal(w.document.querySelectorAll('#' + id + '-section .visualizer-panel').length, 1)
    }
  } finally { w.happyDOM.close() }
})

test('v2-3c: Big-O Panel co theo vùng chứa, không ép bốn card hoặc đổi thống kê Stage', () => {
  const w = new Window({ width: 1600, height: 900 })
  try {
    w.document.body.innerHTML = html
    const style = w.document.createElement('style')
    style.textContent = css
    w.document.head.append(style)
    const root = w.document.querySelector('#sorting-section')
    root.hidden = false
    const panel = root.querySelector('.visualizer-panel')
    const grid = panel.querySelector('.complexity-grid')
    assert.ok(grid !== null)
    assert.equal(grid.querySelectorAll('.complexity-card').length, 4)
    for (const width of [283, 340, 380]) {
      panel.style.width = width + 'px'
      const columns = w.getComputedStyle(grid).gridTemplateColumns.replace(/\s+/g, '')
      assert.equal(columns, 'repeat(auto-fit,minmax(min(100%,148px),1fr))', 'Big-O phải tự co theo Panel, tối thiểu 148px/card')
      for (const card of grid.querySelectorAll('.complexity-card')) {
        assert.equal(w.getComputedStyle(card).minWidth, '0')
        assert.ok(!['hidden', 'clip'].includes(w.getComputedStyle(card).overflowX), 'không cắt chữ để che overflow')
      }
    }
    const stats = root.querySelector('.visualizer-stage .simulation-stats')
    assert.ok(stats !== null)
    assert.equal(w.getComputedStyle(stats).gridTemplateColumns, 'repeat(3, minmax(0, 1fr))', 'không đổi lưới thống kê Workspace')
  } finally { w.happyDOM.close() }
})

test('v2-3c: mỗi chi tiết dùng h2 từ tiêu đề thật, không thêm tiêu đề trùng/ẩn khỏi cây trợ năng', () => {
  const names = { sorting: 'Mảng dữ liệu', search: 'Linear Search', array: 'Array Visualizer', stack: 'Stack Visualizer', queue: 'Queue Visualizer', 'linked-list': 'Singly Linked List Visualizer', bst: 'Binary Search Tree', 'hash-table': 'Hash Table', graph: 'Graph' }
  const w = new Window()
  try {
    w.document.body.innerHTML = html
    for (const [id, name] of Object.entries(names)) {
      const root = w.document.querySelector('#' + id + '-section')
      const headings = [...root.querySelectorAll('h2')]
      assert.equal(headings.length, 1, id + ': đúng một tiêu đề h2')
      assert.equal(headings[0].textContent.trim(), name)
      assert.ok(!headings[0].hasAttribute('hidden') && !headings[0].hasAttribute('aria-hidden'))
      assert.ok(![...root.querySelectorAll('h3')].some(h => h.textContent.trim() === name), 'không lặp tên màn trong h3')
      const group = root.querySelector('h3.visually-hidden')
      assert.ok(group !== null && !group.hidden && !group.hasAttribute('aria-hidden'), 'giữ cấp h3 cho nhóm mô phỏng trước h4')
    }
  } finally { w.happyDOM.close() }
})
