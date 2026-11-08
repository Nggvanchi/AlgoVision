import test from 'node:test'
import assert from 'node:assert/strict'
import { withFullApp, SCREENS } from './helpers/app-dom.js'

// seek(index) (và thanh trượt bước của R6) chỉ an toàn nếu mỗi bộ vẽ là hàm thuần của ảnh chụp bước:
// vào cùng một bước theo đường tiến (Bước tiếp theo) hay đường lùi (Bước trước) phải cho DOM giống hệt.
// Nếu một bộ vẽ giữ trạng thái từ các bước đã đi qua thì hai đường sẽ khác nhau và test này đỏ.

const open = (name) => SCREENS.find((screen) => screen.name === name).open

function setValue(document, selector, value) {
  document.querySelector(selector).value = value
}

const MODULES = [
  {
    name: 'Sắp xếp',
    section: '#sorting-section',
    next: '#step-sort',
    previous: '#previous-step',
    start: (document) => {
      open('sorting-detail')(document)
      document.querySelector('#start-button').click()
    },
  },
  {
    name: 'Tìm kiếm',
    section: '#search-section',
    next: '#search-next',
    previous: '#search-previous',
    start: (document) => {
      open('searching-detail')(document)
      setValue(document, '#search-target', '7')
    },
  },
  {
    name: 'BST',
    section: '#bst-section',
    next: '#bst-next',
    previous: '#bst-previous',
    start: (document) => {
      open('bst')(document)
      setValue(document, '#bst-operation', 'insert')
      setValue(document, '#bst-value', '35')
      document.querySelector('#bst-apply').click()
    },
  },
  {
    name: 'Bảng băm',
    section: '#hash-table-section',
    next: '#hash-table-next',
    previous: '#hash-table-previous',
    start: (document) => {
      open('hash-table')(document)
      setValue(document, '#hash-table-operation', 'insert')
      // Bảng mặc định m = 7: 58, 65, 72 cùng ô 2. Chèn hai khóa đầu và chạy hết, rồi minh họa khóa thứ ba
      // (phải duyệt chuỗi đã có hai khóa) để có đủ bước.
      for (const key of ['58', '65', '72']) {
        setValue(document, '#hash-table-key', key)
        document.querySelector('#hash-table-apply').click()
        if (key !== '72') {
          while (!document.querySelector('#hash-table-next').disabled) document.querySelector('#hash-table-next').click()
        }
      }
    },
  },
  {
    name: 'Đồ thị BFS',
    section: '#graph-section',
    next: '#graph-next',
    previous: '#graph-previous',
    start: (document) => open('graph-bfs')(document),
  },
  {
    name: 'Đồ thị DFS',
    section: '#graph-section',
    next: '#graph-next',
    previous: '#graph-previous',
    start: (document) => open('graph-dfs')(document),
  },
]

const MAX_STEPS = 400

for (const module of MODULES) {
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
