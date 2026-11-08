import test from 'node:test'
import assert from 'node:assert/strict'
import { withFullApp } from './helpers/app-dom.js'
import { VISUALIZER_MODULES } from './helpers/visualizer-modules.js'
import { BASE_DELAY } from '../src/step-tools.js'

// Thanh bước dùng chung phải được nối vào cả 5 module: thanh trượt theo bước, nhãn "Bước x/y", tốc độ qua radiogroup.

for (const module of VISUALIZER_MODULES) {
  test(`${module.name}: thanh trượt bước, nhãn "Bước x/y" và aria-valuetext theo bước hiện tại`, async () => {
    await withFullApp(({ document }) => {
      module.start(document)

      const section = document.querySelector(module.section)
      const slider = section.querySelector('[data-step-slider]')
      const label = section.querySelector('[data-step-label]')
      const nextButton = document.querySelector(module.next)
      let clicks = 0

      while (!nextButton.disabled) {
        nextButton.click()
        clicks++

        const total = Number(slider.max) + 1

        assert.equal(slider.value, String(clicks), `giá trị thanh trượt sau ${clicks} lần bấm`)
        assert.equal(label.textContent, `Bước ${clicks + 1}/${total}`)
        assert.equal(slider.getAttribute('aria-valuetext'), `Bước ${clicks + 1}/${total}`)
      }

      assert.ok(clicks >= 2, 'cần đủ bước')
      assert.equal(slider.disabled, false)
      assert.equal(slider.min, '0')
      assert.equal(slider.max, String(clicks), 'max = số bước - 1 = chỉ số bước cuối')
      assert.equal(slider.value, String(clicks))
    })
  })

  test(`${module.name}: nút tốc độ điều khiển độ trễ giữa các bước (1× mặc định, 2× nhanh gấp đôi)`, async () => {
    await withFullApp(({ document, scheduler }) => {
      module.start(document)

      const section = document.querySelector(module.section)
      const radio = (value) => section.querySelector(`input[name="${module.speedName}"][value="${value}"]`)

      assert.ok(radio('1').checked, '1× được chọn mặc định')

      // Tìm kiếm chỉ sinh bước ở lần bấm đầu tiên.
      document.querySelector(module.next).click()
      document.querySelector(module.run).click()
      assert.equal(scheduler.scheduledDelays.at(-1), BASE_DELAY)
      document.querySelector(module.pause).click()

      radio('2').checked = true
      document.querySelector(module.run).click()
      assert.equal(scheduler.scheduledDelays.at(-1), BASE_DELAY / 2)
      document.querySelector(module.pause).click()
    })
  })

  test(`${module.name}: ngay sau khi mở: Sắp xếp đã có mảng nên thanh trượt mở, màn hình khác chưa có bước nên bị khóa ("Bước 0/0")`, async () => {
    await withFullApp(({ document }) => {
      const section = document.querySelector(module.section)
      const slider = section.querySelector('[data-step-slider]')
      const label = section.querySelector('[data-step-label]')

      if (module.name === 'Sắp xếp') {
        assert.equal(slider.disabled, false)
        assert.match(label.textContent, /^Bước 1\/\d+$/)
      } else {
        assert.equal(slider.disabled, true)
        assert.equal(label.textContent, 'Bước 0/0')
      }
    })
  })
}
