import test from 'node:test'
import assert from 'node:assert/strict'
import { withFullApp } from './helpers/app-dom.js'
import { VISUALIZER_MODULES } from './helpers/visualizer-modules.js'

// seek(index) (và thanh trượt bước của R6) chỉ an toàn nếu mỗi bộ vẽ là hàm thuần của ảnh chụp bước:
// vào cùng một bước theo đường tiến (Bước tiếp theo) hay đường lùi (Bước trước) phải cho DOM giống hệt.
// Nếu một bộ vẽ giữ trạng thái từ các bước đã đi qua thì hai đường sẽ khác nhau và test này đỏ.

const MAX_STEPS = 400

for (const module of VISUALIZER_MODULES) {
  test(`${module.name}: vào bước k theo đường tiến và đường lùi cho DOM giống hệt`, async () => {
    await withFullApp(({ document }) => {
      module.start(document)

      const section = document.querySelector(module.section)
      const nextButton = document.querySelector(module.next)
      const previousButton = document.querySelector(module.previous)

      // forward[k] = DOM sau k lần bấm Bước tiếp theo (k >= 1).
      const forward = []

      while (!nextButton.disabled && forward.length < MAX_STEPS) {
        nextButton.click()
        forward.push(section.innerHTML)
      }

      assert.ok(forward.length >= 4, `cần ít nhất 4 bước để kiểm đường lùi, có ${forward.length}`)
      assert.ok(forward.length < MAX_STEPS, 'vòng bước tiến phải kết thúc')

      // Lùi từ bước cuối về bước 1; chỉ so các bước giữa (1..N-2): bước cuối chỉ tới được bằng đường tiến.
      const lastK = forward.length
      let compared = 0

      for (let k = lastK - 1; k >= 1; k--) {
        assert.ok(!previousButton.disabled, `Bước trước phải bật khi đang ở bước ${k + 1}`)
        previousButton.click()

        assert.ok(
          section.innerHTML === forward[k - 1],
          `${module.name}: DOM ở bước ${k} khác nhau giữa đường tiến và đường lùi`,
        )
        compared++
      }

      assert.equal(compared, lastK - 1)
    })
  })
}
