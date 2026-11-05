import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

// Cụm hứa hẹn tính năng "sắp có" đã lỗi thời khi cấu trúc đó có thật.
// "Sẽ phát triển" của thẻ Thuật toán nâng cao và "sẽ được phát triển" của Lộ trình học tập là trạng thái
// thật của dự án nên không nằm trong danh sách này.
const STALE_PHRASES = [/sẽ được bổ sung/i, /sắp ra mắt/i, /sắp có/i, /coming soon/i]

test('app.html không còn cụm hứa hẹn tính năng sắp có', () => {
  for (const phrase of STALE_PHRASES) {
    assert.ok(!phrase.test(template), `app.html còn cụm lỗi thời khớp ${phrase}`)
  }
})

test('khung giới thiệu thư viện cấu trúc không hứa Tree/Graph "sẽ có" dù BST và Graph đã tồn tại', () => {
  const window = new Window()
  try {
    window.document.body.innerHTML = template
    // Khối placeholder là mã chết và sẽ bị xóa (docs/backlog.md): vắng phần tử thì không còn chữ nào để kiểm, không phải lỗi.
    const description = window.document.querySelector('#placeholder-card-description')
    const text = description === null ? '' : description.textContent.replace(/\s+/g, ' ').trim()
    assert.ok(!/Tree|Graph/.test(text), `mô tả khung không được nhắc Tree/Graph như cấu trúc chưa có: "${text}"`)
    const tag = window.document.querySelector('#category-placeholder .visualizer-tag')
    assert.ok(tag === null, 'khung giới thiệu không còn nhãn trạng thái "SẮP RA MẮT"')
  } finally {
    window.happyDOM.close()
  }
})
