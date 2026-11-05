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

test('thẻ "Cấu trúc dữ liệu" trên Tổng quan nhắc đủ mọi cấu trúc có trong thư viện', () => {
  withTemplate((document) => {
    const library = [...document.querySelectorAll('#structure-library .structure-card-title')]
      .map((title) => normalize(title.textContent))
    assert.deepEqual(library, [
      'Array', 'Stack', 'Queue', 'Linked List', 'Binary Search Tree', 'Hash Table', 'Graph',
    ], 'thư viện cấu trúc phải có đúng 7 thẻ theo thứ tự này')

    const card = document.querySelector('.dashboard-card[data-dashboard-target="structures"]')
    assert.ok(card !== null, 'phải có thẻ dashboard trỏ tới "structures"')
    const description = normalize(card.querySelector('.dashboard-card-description').textContent)
    for (const name of library) {
      assert.ok(description.includes(name), `mô tả thẻ "Cấu trúc dữ liệu" thiếu "${name}": "${description}"`)
    }
  })
})
