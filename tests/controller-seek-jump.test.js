import test from 'node:test'
import assert from 'node:assert/strict'
import { withFullApp } from './helpers/app-dom.js'
import { VISUALIZER_MODULES } from './helpers/visualizer-modules.js'

// Điều kiện đã ghi trong docs/architecture.md: nhảy NHIỀU bước thật bằng thanh trượt (0 -> cuối -> giữa -> 0) phải cho DOM
// giống hệt cách đi từng bước bằng Bước tiếp theo/Bước trước, ở cả 5 module có controller.

const MAX_STEPS = 400

for (const module of VISUALIZER_MODULES) {
  test(`${module.name}: kéo thanh trượt nhảy 0 -> cuối -> giữa -> 0 cho DOM giống hệt đi từng bước`, async () => {
    await withFullApp(({ document, window }) => {
      module.start(document)

      const section = document.querySelector(module.section)
      const slider = section.querySelector('[data-step-slider]')
      const nextButton = document.querySelector(module.next)
      const previousButton = document.querySelector(module.previous)
      const fire = (type) => slider.dispatchEvent(new window.Event(type, { bubbles: true }))

      // Đường đi từng bước: forward[k] = DOM sau k lần Bước tiếp theo.
      const forward = []
      while (!nextButton.disabled && forward.length < MAX_STEPS) {
        nextButton.click()
        forward.push(section.innerHTML)
      }

      assert.ok(forward.length >= 3, `cần ít nhất 3 bước, có ${forward.length}`)

      const last = forward.length
      const middle = Math.floor(last / 2)

      while (!previousButton.disabled) previousButton.click()
      const backAtZero = section.innerHTML

      // Đang đứng ở bước 0 (đã lùi hết). Nhảy bằng thanh trượt giống người dùng: nhiều sự kiện input rồi một change khi thả.
      const jump = (index) => {
        const from = Number(slider.value)

        for (let step = 1; step <= 5; step++) {
          slider.value = String(Math.round(from + ((index - from) * step) / 5))
          fire('input')
        }

        slider.value = String(index)
        fire('input')
        fire('change')
      }

      jump(last)
      assert.ok(section.innerHTML === forward[last - 1], `${module.name}: nhảy thẳng tới bước cuối khác đi từng bước`)

      jump(middle)
      assert.ok(section.innerHTML === forward[middle - 1], `${module.name}: nhảy về bước ${middle} khác đi từng bước`)

      jump(0)
      assert.ok(section.innerHTML === backAtZero, `${module.name}: nhảy về bước 0 khác đi từng bước rồi lùi`)

      jump(last)
      assert.ok(section.innerHTML === forward[last - 1], `${module.name}: nhảy lại tới bước cuối khác đi từng bước`)
    })
  })

  test(`${module.name}: kéo thanh trượt (chỉ input) không đổi vùng aria-live; thả (change) đổi đúng một lần`, async () => {
    await withFullApp(({ document, window }) => {
      module.start(document)

      const section = document.querySelector(module.section)
      const slider = section.querySelector('[data-step-slider]')
      const nextButton = document.querySelector(module.next)
      const fire = (type) => slider.dispatchEvent(new window.Event(type, { bubbles: true }))
      const liveTexts = () => [...section.querySelectorAll('[aria-live]')].map((element) => element.textContent)

      while (!nextButton.disabled) nextButton.click()

      document.querySelector(module.previous).click()
      const before = liveTexts()
      const last = Number(slider.max)

      // Theo dõi mọi lần gán chữ vào vùng live (textContent) bằng cách đếm thay đổi qua MutationObserver.
      let changes = 0
      const observer = new window.MutationObserver((records) => {
        changes += records.length
      })

      for (const element of section.querySelectorAll('[aria-live]')) {
        observer.observe(element, { childList: true, characterData: true, subtree: true })
      }

      for (let value = 0; value <= last; value++) {
        slider.value = String(value)
        fire('input')
      }

      assert.deepEqual(liveTexts(), before, 'vùng aria-live giữ nguyên khi chỉ kéo')
      assert.equal(changes, 0, 'không có thay đổi nào vào vùng aria-live khi chỉ kéo')

      slider.value = '0'
      fire('input')
      fire('change')

      assert.notDeepEqual(liveTexts(), before, 'thả thanh trượt cập nhật thông báo')
      observer.disconnect()
    })
  })
}
