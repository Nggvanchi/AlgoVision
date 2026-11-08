import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import * as stepToolsModule from '../src/step-tools.js'

// Khối markup tối thiểu giống public/templates/app.html (cùng data-attribute).
const MARKUP = `
<div data-step-tools>
  <label for="t-step">Bước</label>
  <input type="range" id="t-step" min="0" max="0" value="0" disabled data-step-slider>
  <output data-step-label>Bước 0/0</output>
  <div role="radiogroup" aria-label="Tốc độ">
    <label><input type="radio" name="t-speed" value="0.5">0,5×</label>
    <label><input type="radio" name="t-speed" value="1" checked>1×</label>
    <label><input type="radio" name="t-speed" value="2">2×</label>
    <label><input type="radio" name="t-speed" value="4">4×</label>
  </div>
</div>`

function setup() {
  const window = new Window()
  const { document } = window

  document.body.innerHTML = MARKUP

  const seeks = []
  const root = document.querySelector('[data-step-tools]')
  const tools = stepToolsModule.createStepTools(root, { seek: (index) => seeks.push(index) })
  const slider = root.querySelector('[data-step-slider]')
  const label = root.querySelector('[data-step-label]')
  const radio = (value) => root.querySelector(`input[type="radio"][value="${value}"]`)
  const fire = (element, type) => element.dispatchEvent(new window.Event(type, { bubbles: true }))

  return { window, tools, seeks, slider, label, radio, fire, close: () => window.happyDOM.close() }
}

const snapshot = (stepIndex, stepCount) => ({ stepIndex, stepCount })

test('chưa có bước: nhãn "Bước 0/0", thanh trượt bị khóa', () => {
  const ui = setup()

  ui.tools.sync(snapshot(0, 0))

  assert.equal(ui.label.textContent, 'Bước 0/0')
  assert.equal(ui.slider.disabled, true)
  assert.equal(ui.slider.max, '0')
  ui.close()
})

test('có bước: max = số bước - 1, value = chỉ số, nhãn và aria-valuetext là "Bước x/y" với x = chỉ số + 1', () => {
  const ui = setup()

  ui.tools.sync(snapshot(2, 7))

  assert.equal(ui.slider.disabled, false)
  assert.equal(ui.slider.min, '0')
  assert.equal(ui.slider.max, '6')
  assert.equal(ui.slider.value, '2')
  assert.equal(ui.label.textContent, 'Bước 3/7')
  assert.equal(ui.slider.getAttribute('aria-valuetext'), 'Bước 3/7')
  ui.close()
})

test('đồng bộ lại khi đổi bước và khi bước bị bỏ (về 0 bước thì khóa lại)', () => {
  const ui = setup()

  ui.tools.sync(snapshot(5, 7))
  ui.tools.sync(snapshot(1, 7))
  assert.equal(ui.slider.value, '1')
  assert.equal(ui.label.textContent, 'Bước 2/7')

  ui.tools.sync(snapshot(0, 0))
  assert.equal(ui.slider.disabled, true)
  assert.equal(ui.label.textContent, 'Bước 0/0')
  ui.close()
})

test('kéo thanh trượt (sự kiện input) chỉ đổi nhãn, KHÔNG gọi seek (không làm vùng aria-live đọc dồn dập)', () => {
  const ui = setup()

  ui.tools.sync(snapshot(0, 10))

  for (let value = 1; value <= 9; value++) {
    ui.slider.value = String(value)
    ui.fire(ui.slider, 'input')
  }

  assert.deepEqual(ui.seeks, [], 'không lần seek nào khi chỉ có input')
  assert.equal(ui.label.textContent, 'Bước 10/10', 'nhãn theo vị trí kéo')
  assert.equal(ui.slider.getAttribute('aria-valuetext'), 'Bước 10/10')
  ui.close()
})

test('thả thanh trượt (sự kiện change) gọi seek đúng một lần với chỉ số đã chọn', () => {
  const ui = setup()

  ui.tools.sync(snapshot(0, 10))
  ui.slider.value = '6'
  ui.fire(ui.slider, 'input')
  ui.fire(ui.slider, 'change')

  assert.deepEqual(ui.seeks, [6])
  ui.close()
})

test('getDelay theo nút tốc độ đang chọn: 0,5× chậm gấp đôi, 4× nhanh gấp bốn', () => {
  const ui = setup()
  const base = stepToolsModule.BASE_DELAY

  assert.equal(ui.tools.getDelay(), base, 'mặc định 1×')

  ui.radio('0.5').checked = true
  assert.equal(ui.tools.getDelay(), base * 2)

  ui.radio('2').checked = true
  assert.equal(ui.tools.getDelay(), base / 2)

  ui.radio('4').checked = true
  assert.equal(ui.tools.getDelay(), base / 4)
  ui.close()
})

test('không nút tốc độ nào được chọn: dùng mức 1×', () => {
  const ui = setup()

  ui.radio('1').checked = false

  assert.equal(ui.tools.getDelay(), stepToolsModule.BASE_DELAY)
  ui.close()
})

test('nhóm tốc độ có role radiogroup, tên "Tốc độ" và 4 lựa chọn 0,5 / 1 / 2 / 4', () => {
  const ui = setup()
  const group = ui.window.document.querySelector('[role="radiogroup"]')

  assert.equal(group.getAttribute('aria-label'), 'Tốc độ')
  assert.deepEqual(
    [...group.querySelectorAll('input[type="radio"]')].map((input) => input.value),
    ['0.5', '1', '2', '4'],
  )
  ui.close()
})
