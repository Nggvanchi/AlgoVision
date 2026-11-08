import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

// Tên hiển thị của 7 cấu trúc dữ liệu: lấy từ thẻ thư viện (structure-card-title), không gõ tay hai nơi.
function withTemplate(run) {
  const window = new Window()
  try {
    window.document.body.innerHTML = template
    run(window.document)
  } finally {
    window.happyDOM.close()
  }
}

const normalize = (text) => text.replace(/\s+/g, ' ').trim()

// R4: thẻ "Cấu trúc dữ liệu" (mô tả liệt kê tên) được thay bằng nhóm chip "Truy cập nhanh": mỗi cấu trúc một chip.
test('nhóm chip "Cấu trúc dữ liệu" trên Tổng quan có đủ mọi cấu trúc của thư viện', () => {
  withTemplate((document) => {
    const library = [...document.querySelectorAll('#structure-library .structure-card-title')]
      .map((title) => normalize(title.textContent))
    assert.deepEqual(library, [
      'Array', 'Stack', 'Queue', 'Linked List', 'Binary Search Tree', 'Hash Table', 'Graph',
    ], 'thư viện cấu trúc phải có đúng 7 thẻ theo thứ tự này')

    const chips = [...document.querySelectorAll('#dashboard-section .dashboard-quick-structures .dashboard-chip')].map((chip) => normalize(chip.textContent))
    for (const name of library) {
      assert.ok(chips.includes(name), `nhóm chip cấu trúc thiếu "${name}": ${chips.join(', ')}`)
    }
    assert.equal(chips.length, library.length, 'số chip phải bằng số thẻ thư viện')
  })
})
