import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

// querySelector('#x') chỉ trả phần tử đầu tiên: id trùng làm module ghi/đọc nhầm thẻ. Test canh gác, không phải test của một lỗi cụ thể.
test('app.html đã render không có id nào xuất hiện hai lần', () => {
  const window = new Window()
  try {
    window.document.body.innerHTML = template
    const counts = new Map()
    for (const element of window.document.querySelectorAll('[id]')) {
      counts.set(element.id, (counts.get(element.id) ?? 0) + 1)
    }
    const duplicated = [...counts].filter(([, count]) => count > 1).map(([id, count]) => `${id} x${count}`)
    assert.ok(counts.size > 100, `phải quét được phần lớn id của template (đang thấy ${counts.size})`)
    assert.deepEqual(duplicated, [], 'id bị trùng trong app.html')
  } finally {
    window.happyDOM.close()
  }
})

test('thẻ số đo duyệt đồ thị dùng chung cho BFS và DFS có id #graph-traversal-count, không còn tên #graph-dequeues', () => {
  const window = new Window()
  try {
    window.document.body.innerHTML = template
    for (const id of ['graph-traversal-count', 'graph-traversal-count-label']) {
      assert.ok(window.document.getElementById(id) !== null, `thiếu #${id}`)
    }
    for (const id of ['graph-dequeues', 'graph-dequeues-label']) {
      assert.ok(window.document.getElementById(id) === null, `#${id} là tên cũ gây hiểu nhầm (thẻ dùng cho cả DFS)`)
    }
  } finally {
    window.happyDOM.close()
  }
})
