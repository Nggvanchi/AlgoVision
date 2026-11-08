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

  test(`${module.name}: khi chạy tự động, thanh trượt và nhãn đi theo từng tick`, async () => {
    await withFullApp(({ document, scheduler }) => {
      module.start(document)

      const section = document.querySelector(module.section)
      const slider = section.querySelector('[data-step-slider]')
      const label = section.querySelector('[data-step-label]')

      document.querySelector(module.run).click()

      // Mỗi tick tiến đúng một bước: thanh trượt luôn bằng nhãn trừ 1 và tăng dần.
      let previous = Number(slider.value)

      for (let tick = 0; tick < 2; tick++) {
        scheduler.advance(BASE_DELAY)

        const current = Number(slider.value)

        assert.equal(current, previous + 1, `tick ${tick + 1}: thanh trượt tiến một bước`)
        assert.equal(label.textContent, `Bước ${current + 1}/${Number(slider.max) + 1}`)
        previous = current
      }

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

test('mỗi thanh trượt có nhãn <label for> khớp id; tên nhóm radio khác nhau giữa 5 màn hình (BFS và DFS dùng chung màn Đồ thị)', async () => {
  await withFullApp(({ document }) => {
    const roots = [...document.querySelectorAll('[data-step-tools]')]

    assert.equal(roots.length, 5, 'đúng 5 khối thanh bước')

    const names = new Set()

    for (const root of roots) {
      const slider = root.querySelector('[data-step-slider]')

      assert.ok(slider.id !== '', 'thanh trượt phải có id')
      assert.ok(root.querySelector(`label[for="${slider.id}"]`) !== null, `thiếu <label for="${slider.id}">`)
      assert.equal(root.querySelectorAll('input[type="radio"]').length, 4)
      names.add(root.querySelector('input[type="radio"]').name)
    }

    assert.equal(names.size, 5, 'tên radio trùng nhau thì chọn tốc độ ở màn này đổi màn khác')
  })
})

// Các đường làm mất bước (controller.load([])) phải đưa thanh trượt về trạng thái khóa.
const CLEARS = [
  {
    name: 'Tìm kiếm: Đặt lại',
    module: 'Tìm kiếm',
    clear: (document) => document.querySelector('#search-reset').click(),
  },
  {
    name: 'BST: đổi thao tác',
    module: 'BST',
    clear: (document, window) => {
      document.querySelector('#bst-operation').dispatchEvent(new window.Event('change', { bubbles: true }))
    },
  },
  {
    name: 'Bảng băm: đổi thao tác',
    module: 'Bảng băm',
    clear: (document, window) => {
      document.querySelector('#hash-table-operation').dispatchEvent(new window.Event('change', { bubbles: true }))
    },
  },
]

for (const clearCase of CLEARS) {
  test(`${clearCase.name}: bỏ hết bước thì thanh trượt bị khóa và nhãn về "Bước 0/0"`, async () => {
    await withFullApp(({ document, window }) => {
      const module = VISUALIZER_MODULES.find((candidate) => candidate.name === clearCase.module)

      module.start(document)
      document.querySelector(module.next).click()

      const section = document.querySelector(module.section)
      const slider = section.querySelector('[data-step-slider]')

      assert.equal(slider.disabled, false, 'trước khi xóa phải đang có bước')

      clearCase.clear(document, window)

      assert.equal(slider.disabled, true)
      assert.equal(section.querySelector('[data-step-label]').textContent, 'Bước 0/0')
    })
  })
}
