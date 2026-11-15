import test from 'node:test'
import assert from 'node:assert/strict'
import { withFullApp, SCREENS } from './helpers/app-dom.js'
import { VISUALIZER_MODULES } from './helpers/visualizer-modules.js'

for (const section of ['sorting', 'search', 'bst', 'hash-table', 'graph']) {
  test(`${section}: dropdown có nhãn, mặc định Mã giả và chỉ hiện đúng pane, giữ node/focus/live`, async () => {
    await withFullApp(({ document, window, scheduler }) => {
      const root = document.querySelector(`#${section}-section`)
      const panel = root.querySelector('.visualizer-panel')
      assert.equal(panel.querySelectorAll('select').length, 1, 'Learning Panel cần đúng một select')
      const select = panel.querySelector('select')
      assert.ok(select.closest('label') !== null, 'select cần nhãn thật')
      assert.deepEqual([...select.options].map(n => n.textContent), ['Mã giả', 'Độ phức tạp', 'Kiến thức'])
      assert.equal(select.value, 'pseudocode')
      assert.equal(panel.querySelectorAll('details,summary,[role="tab"],[role="tablist"]').length, 0)
      const panes = [...panel.querySelectorAll('[data-learning-pane]')]
      assert.deepEqual(panes.map(n => n.hidden), [false, true, true], 'mặc định chỉ hiện Mã giả')
      const nodes = panes.map(n => n.firstElementChild)
      const content = panes.map(n => n.innerHTML)
      const live = root.querySelector('[aria-live="polite"]')
      assert.ok(live !== null && live.closest('[data-learning-pane]') === null)
      const liveBefore = live.outerHTML
      const pending = scheduler.pendingCount
      select.focus()
      for (const value of ['complexity', 'knowledge', 'pseudocode', 'knowledge']) {
        select.value = value
        select.dispatchEvent(new window.Event('change', { bubbles: true }))
        assert.deepEqual(panes.filter(n => !n.hidden).map(n => n.dataset.learningPane), [value], 'chỉ pane đã chọn được hiện')
        assert.ok(document.activeElement === select, 'đổi pane phải giữ focus ở select')
        for (const [i, pane] of panes.entries()) {
          assert.ok(pane.firstElementChild === nodes[i], 'không dựng lại nội dung khi đổi pane')
          assert.equal(pane.innerHTML, content[i], 'đổi pane không sửa nội dung')
        }
        assert.equal(live.outerHTML, liveBefore, 'đổi pane không cập nhật live')
        assert.equal(scheduler.pendingCount, pending, 'đổi pane không đụng scheduler')
      }
    })
  })
}

test('dropdown giữ lựa chọn riêng từng màn qua điều hướng và đổi thuật toán', async () => {
  await withFullApp(({ document, window }) => {
    const selects = [...document.querySelectorAll('[data-learning-select]')]
    assert.equal(selects.length, 5, 'cần dropdown cho cả năm màn')
    const values = selects.map((_, i) => i % 2 ? 'complexity' : 'knowledge')
    for (const [i, select] of selects.entries()) {
      select.value = values[i]
      select.dispatchEvent(new window.Event('change', { bubbles: true }))
    }
    for (const screen of SCREENS) screen.open(document)
    assert.deepEqual(selects.map(n => n.value), values, 'không reset lựa chọn khi điều hướng')
    for (const [i, select] of selects.entries()) {
      const panel = select.closest('.visualizer-panel')
      assert.deepEqual([...panel.querySelectorAll('[data-learning-pane]:not([hidden])')].map(n => n.dataset.learningPane), [values[i]], 'mỗi màn chỉ hiện pane đã chọn riêng')
    }
  })
})

for (const module of VISUALIZER_MODULES) {
  test(`${module.name}: mã giả ẩn vẫn cập nhật theo bước và hiện lại đúng node`, async () => {
    await withFullApp(({ document, window }) => {
      module.start(document)
      const root = document.querySelector(module.section)
      const select = root.querySelector('[data-learning-select]')
      assert.ok(select !== null, 'cần dropdown')
      const code = root.querySelector('[data-learning-pane="pseudocode"] code')
      const before = code.innerHTML
      select.value = 'knowledge'
      select.dispatchEvent(new window.Event('change', { bubbles: true }))
      document.querySelector(module.next).click()
      assert.notEqual(code.innerHTML, before, 'mã giả vẫn phải cập nhật khi pane ẩn')
      const updated = code.innerHTML
      select.value = 'pseudocode'
      select.dispatchEvent(new window.Event('change', { bubbles: true }))
      assert.equal(code.innerHTML, updated)
      assert.ok(root.querySelector('[data-learning-pane="pseudocode"] code') === code, 'giữ node mã giả')
    })
  })
}
