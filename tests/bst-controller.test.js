import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

import * as bstView from '../src/bst.js'
import { initNavigation } from '../src/navigation.js'
import { buildTree } from '../src/structures/bst.js'
import { bstInsertPseudocode } from '../src/algorithms/bstInsert.js'
import { createFakeScheduler } from './helpers/fake-scheduler.js'

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

function setupBst() {
  const window = new Window()
  const { document } = window
  const scheduler = createFakeScheduler()

  document.body.innerHTML = template
  initNavigation(document)
  bstView.initBst(document, { scheduler })

  const $ = (selector) => document.querySelector(selector)

  const ui = {
    window,
    document,
    scheduler,
    $,
    open() {
      $('.nav-item[data-page="structures"]').click()
      $('[data-structure-target="bst"]').click()
    },
    perform(operation, value) {
      $('#bst-operation').value = operation
      $('#bst-operation').dispatchEvent(new window.Event('change', { bubbles: true }))

      if (value !== undefined) {
        $('#bst-value').value = String(value)
      }

      $('#bst-apply').click()
    },
    nextUntilDone() {
      let guard = 0
      while (!$('#bst-next').disabled && guard++ < 100) {
        $('#bst-next').click()
      }
    },
    text: (selector) => $(selector).textContent.trim(),
    nodeValues: () => [...document.querySelectorAll('#bst-tree .bst-node')]
      .map((node) => Number(node.dataset.value)),
    nodeByValue: (value) => document.querySelector(`#bst-tree .bst-node[data-value="${value}"]`),
    cleanup() {
      $('#bst-pause')?.click()
      window.happyDOM.close()
    },
  }

  return ui
}

test('Mở BST từ thư viện cấu trúc và quay lại', () => {
  const ui = setupBst()

  try {
    ui.open()

    assert.equal(ui.$('#bst-section').hidden, false)
    assert.equal(ui.$('#structure-library').hidden, true)
    assert.equal(ui.$('#linked-list-section').hidden, true)
    assert.equal(ui.$('#sorting-section').hidden, true)

    ui.$('#bst-section [data-back-to-structures]').click()

    assert.equal(ui.$('#bst-section').hidden, true)
    assert.equal(ui.$('#structure-library').hidden, false)
  } finally {
    ui.cleanup()
  }
})

test('Khởi tạo với cây mẫu 7 nút, hiển thị n và h', () => {
  const ui = setupBst()

  try {
    assert.deepEqual(ui.nodeValues().sort((a, b) => a - b), [20, 30, 40, 50, 60, 70, 80])
    assert.equal(ui.text('#bst-node-count'), '7')
    assert.equal(ui.text('#bst-height'), '2')
    assert.match(ui.$('#bst-tree').getAttribute('aria-label'), /7 nút.*chiều cao 2/)
    assert.equal(ui.$('#bst-next').disabled, true, 'chưa có thao tác thì chưa có bước')
    assert.equal(ui.$('#bst-run').disabled, true)
  } finally {
    ui.cleanup()
  }
})

test('Chèn qua ô nhập: Next tô đúng nút đang xét và dòng mã giả', () => {
  const ui = setupBst()

  try {
    ui.perform('insert', 45)

    assert.equal(ui.$('#bst-next').disabled, false)
    assert.ok(ui.nodeByValue(45) === null, 'Bước 0 của Insert 45 còn là cây cũ: chưa vẽ nút 45')

    ui.$('#bst-next').click()

    assert.ok(ui.nodeByValue(50).classList.contains('is-current'))
    const active = ui.$('#bst-pseudocode .pseudocode-line.is-active')
    assert.equal(active.getAttribute('aria-current'), 'step')
    assert.equal(active.dataset.line, '6')
    assert.equal(active.textContent, bstInsertPseudocode[5])
    assert.equal(ui.text('#bst-current-value'), '50')
    assert.equal(ui.text('#bst-comparisons'), '1')

    ui.nextUntilDone()

    assert.ok(ui.nodeByValue(45).classList.contains('is-found'))
    assert.equal(ui.text('#bst-node-count'), '8')
    assert.equal(ui.text('#bst-height'), '3')
    assert.equal(ui.text('#bst-comparisons'), '3')
    assert.match(ui.text('#bst-result'), /Đã chèn 45/)
  } finally {
    ui.cleanup()
  }
})

test('Previous quay lại bước trước, n và h đọc từ cây của bước đang hiển thị', () => {
  const ui = setupBst()

  try {
    ui.perform('insert', 45)
    ui.nextUntilDone()
    assert.equal(ui.text('#bst-node-count'), '8')

    ui.$('#bst-previous').click()

    assert.ok(ui.nodeByValue(45) === null, 'Previous về bước trước khi gắn nút mới: cây chưa vẽ nút 45')
    assert.equal(ui.text('#bst-node-count'), '7')
    assert.equal(ui.text('#bst-height'), '2')
  } finally {
    ui.cleanup()
  }
})

test('Reset chỉ tua minh họa, báo cây hiện tại vẫn giữ kết quả', () => {
  const ui = setupBst()

  try {
    ui.perform('insert', 45)
    ui.nextUntilDone()
    ui.$('#bst-reset').click()

    assert.ok(ui.nodeByValue(45) === null, 'Reset về bước 0 hiển thị cây trước thao tác: chưa vẽ nút 45')
    assert.equal(ui.text('#bst-node-count'), '7')
    assert.equal(ui.$('#bst-status').getAttribute('aria-live'), 'polite')
    assert.match(ui.text('#bst-status'), /cây hiện tại vẫn gồm kết quả thao tác trước/i)
  } finally {
    ui.cleanup()
  }
})

test('Thao tác mới luôn bắt đầu từ cây đã chốt, kể cả sau Reset hoặc khi chưa xem hết', () => {
  const ui = setupBst()

  try {
    // Chèn 45 nhưng chỉ xem bước 0 rồi Reset: cây đã chốt vẫn có 45.
    ui.perform('insert', 45)
    ui.$('#bst-reset').click()

    ui.perform('search', 45)
    ui.nextUntilDone()
    assert.match(ui.text('#bst-result'), /Tìm thấy 45/)
    assert.equal(ui.text('#bst-node-count'), '8')

    // Xóa 30 rồi lùi về giữa chừng: thao tác tiếp theo vẫn dùng cây đã xóa 30.
    ui.perform('delete', 30)
    ui.nextUntilDone()
    ui.$('#bst-previous').click()

    ui.perform('search', 30)
    ui.nextUntilDone()
    assert.match(ui.text('#bst-result'), /Không tìm thấy 30/)
    assert.equal(ui.text('#bst-node-count'), '7')
  } finally {
    ui.cleanup()
  }
})

test('Nhập sai: báo lỗi, không sinh bước', () => {
  const ui = setupBst()

  try {
    for (const value of ['', '0', '100', '2.5', '-3']) {
      ui.perform('insert', value)

      assert.equal(ui.$('#bst-input-error').hidden, false, `phải báo lỗi với "${value}"`)
      assert.match(ui.text('#bst-input-error'), /1.*99/)
      assert.equal(ui.$('#bst-value').getAttribute('aria-invalid'), 'true')
      assert.equal(ui.$('#bst-next').disabled, true)
    }

    ui.perform('insert', 45)
    assert.equal(ui.$('#bst-input-error').hidden, true)
    assert.equal(ui.$('#bst-value').getAttribute('aria-invalid'), 'false')
  } finally {
    ui.cleanup()
  }
})

test('Cây suy biến 1..15: n = 15, h = 14', () => {
  const ui = setupBst()

  try {
    ui.$('#bst-preset-degenerate').click()

    assert.equal(ui.text('#bst-node-count'), '15')
    assert.equal(ui.text('#bst-height'), '14')
    assert.deepEqual(ui.nodeValues().sort((a, b) => a - b), Array.from({ length: 15 }, (_, i) => i + 1))
  } finally {
    ui.cleanup()
  }
})

test('Đủ 15 nút: kiểm tra trùng trước, rồi mới chặn chèn giá trị mới', () => {
  const ui = setupBst()

  try {
    ui.$('#bst-preset-degenerate').click()

    ui.perform('insert', 5)
    assert.equal(ui.$('#bst-input-error').hidden, true, 'giá trị trùng không bị chặn vì cây đầy')
    ui.nextUntilDone()
    assert.match(ui.text('#bst-result'), /5 đã tồn tại/)

    ui.perform('insert', 20)
    assert.equal(ui.$('#bst-input-error').hidden, false)
    assert.match(ui.text('#bst-input-error'), /15 nút/)
    assert.equal(ui.$('#bst-next').disabled, true)
  } finally {
    ui.cleanup()
  }
})

test('Đang Run thì khóa các nút thao tác, xong thì mở lại', () => {
  const ui = setupBst()

  try {
    ui.open()
    ui.perform('search', 80)
    ui.$('#bst-run').click()

    for (const selector of ['#bst-apply', '#bst-operation', '#bst-value', '#bst-preset-balanced', '#bst-preset-degenerate', '#bst-clear']) {
      assert.equal(ui.$(selector).disabled, true, `${selector} phải bị khóa khi đang chạy`)
    }

    ui.scheduler.advance(10_000)

    assert.match(ui.text('#bst-result'), /Tìm thấy 80/)
    assert.equal(ui.$('#bst-apply').disabled, false)
    assert.equal(ui.$('#bst-operation').disabled, false)
    assert.equal(ui.scheduler.pendingCount, 0)
  } finally {
    ui.cleanup()
  }
})

test('Rời màn hình BST khi đang Run thì tự tạm dừng', () => {
  const ui = setupBst()

  try {
    ui.open()
    ui.perform('search', 80)
    ui.$('#bst-run').click()
    ui.scheduler.advance(700)

    ui.$('.nav-item[data-page="dashboard"]').click()

    assert.equal(ui.scheduler.pendingCount, 0)
    assert.equal(ui.text('#bst-run'), 'Tiếp tục')
    assert.equal(ui.$('#bst-apply').disabled, false)
  } finally {
    ui.cleanup()
  }
})

test('Xóa nút hai con: mọi bước chỉ vẽ nút có trong cây của bước', () => {
  const ui = setupBst()

  try {
    ui.perform('delete', 50)

    let guard = 0
    while (!ui.$('#bst-next').disabled && guard++ < 50) {
      ui.$('#bst-next').click()

      const drawn = ui.document.querySelectorAll('#bst-tree .bst-node').length
      assert.equal(String(drawn), ui.text('#bst-node-count'))
    }

    assert.equal(ui.text('#bst-node-count'), '6')
    assert.ok(ui.nodeByValue(50) === null, 'Xóa nút hai con 50 (thay bằng successor 60): bước cuối không còn nút nào mang giá trị 50')
    assert.ok(ui.nodeByValue(60).classList.contains('is-found'))
  } finally {
    ui.cleanup()
  }
})

test('Duyệt Inorder hiển thị thứ tự đã thăm; thao tác không cần giá trị khóa ô nhập', () => {
  const ui = setupBst()

  try {
    ui.perform('inorder')

    assert.equal(ui.$('#bst-value').disabled, true)
    ui.nextUntilDone()

    assert.equal(ui.$('#bst-output-row').hidden, false)
    assert.equal(ui.text('#bst-output'), '20, 30, 40, 50, 60, 70, 80')

    ui.perform('insert', 45)
    assert.equal(ui.$('#bst-value').disabled, false)
    assert.equal(ui.$('#bst-output-row').hidden, true)
  } finally {
    ui.cleanup()
  }
})

test('Height và Min hiển thị kết quả', () => {
  const ui = setupBst()

  try {
    ui.perform('height')
    ui.nextUntilDone()
    assert.match(ui.text('#bst-result'), /^2$/)

    ui.perform('min')
    ui.nextUntilDone()
    assert.match(ui.text('#bst-result'), /^20$/)
  } finally {
    ui.cleanup()
  }
})

test('Xóa toàn bộ cây: hiện thông báo cây rỗng, h = -1', () => {
  const ui = setupBst()

  try {
    ui.$('#bst-clear').click()

    assert.equal(ui.$('#bst-empty').hidden, false)
    assert.equal(ui.text('#bst-node-count'), '0')
    assert.equal(ui.text('#bst-height'), '-1')
    assert.equal(ui.nodeValues().length, 0)
  } finally {
    ui.cleanup()
  }
})

test('Đổi thao tác thì mã giả đổi theo', () => {
  const ui = setupBst()

  try {
    ui.$('#bst-operation').value = 'height'
    ui.$('#bst-operation').dispatchEvent(new ui.window.Event('change', { bubbles: true }))

    assert.match(ui.text('#bst-pseudocode'), /height\(node\)/)
    assert.match(ui.text('#bst-pseudocode-title'), /Height/)
  } finally {
    ui.cleanup()
  }
})

test('renderBstTree bỏ qua id không có trong tree.nodes', () => {
  const window = new Window()
  const { document } = window

  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const tree = buildTree([50, 30, 70])

    bstView.renderBstTree(svg, {
      tree,
      currentId: 999,
      foundId: 998,
      successorId: 997,
      pathIds: [tree.rootId, 996],
      heights: {},
    })

    assert.equal(svg.querySelectorAll('.bst-node').length, 3)
    assert.equal(svg.querySelectorAll('.is-current, .is-found, .is-successor').length, 0)
    assert.equal(svg.querySelectorAll('.bst-node.is-path').length, 1)
  } finally {
    window.happyDOM.close()
  }
})

function selectOperation(ui, operation) {
  ui.$('#bst-operation').value = operation
  ui.$('#bst-operation').dispatchEvent(new ui.window.Event('change', { bubbles: true }))
}

test('Learning Panel: Big-O của Search/Insert/Delete/Min/Max là O(h), hai cột cân bằng và suy biến', () => {
  const ui = setupBst()

  try {
    for (const operation of ['insert', 'search', 'delete', 'min', 'max']) {
      selectOperation(ui, operation)

      assert.equal(ui.text('#bst-complexity'), 'O(h)', operation)
      assert.equal(ui.text('#bst-complexity-best'), 'O(1)', operation)
      assert.equal(ui.text('#bst-complexity-balanced'), 'O(log n)', operation)
      assert.equal(ui.text('#bst-complexity-degenerate'), 'O(n)', operation)
      assert.equal(ui.text('#bst-complexity-space'), 'O(1)', operation)
    }
  } finally {
    ui.cleanup()
  }
})

test('Learning Panel: duyệt cây và Height luôn O(n), bộ nhớ O(h) do đệ quy', () => {
  const ui = setupBst()

  try {
    for (const operation of ['inorder', 'preorder', 'postorder', 'height']) {
      selectOperation(ui, operation)

      assert.equal(ui.text('#bst-complexity'), 'O(n)', operation)
      assert.equal(ui.text('#bst-complexity-best'), 'O(n)', operation)
      assert.equal(ui.text('#bst-complexity-balanced'), 'O(n)', operation)
      assert.equal(ui.text('#bst-complexity-degenerate'), 'O(n)', operation)
      assert.equal(ui.text('#bst-complexity-space'), 'O(h)', operation)
    }
  } finally {
    ui.cleanup()
  }
})

test('Learning Panel: ý tưởng, ưu điểm, hạn chế đổi theo thao tác', () => {
  const ui = setupBst()

  try {
    const seen = new Set()

    for (const operation of Object.keys(bstView.bstOperations)) {
      selectOperation(ui, operation)

      const description = ui.text('#bst-learning-description')
      assert.ok(description.length > 0, operation)
      assert.ok(ui.text('#bst-learning-advantages').length > 0, operation)
      assert.ok(ui.text('#bst-learning-disadvantages').length > 0, operation)
      assert.match(ui.text('#bst-complexity-title'), new RegExp(bstView.bstOperations[operation].name, 'i'))
      seen.add(description)
    }

    assert.equal(seen.size, Object.keys(bstView.bstOperations).length, 'mỗi thao tác một mô tả riêng')
    selectOperation(ui, 'delete')
    assert.match(ui.text('#bst-learning-description'), /successor/)
    selectOperation(ui, 'height')
    assert.match(ui.text('#bst-learning-description'), /-1|−1/)
  } finally {
    ui.cleanup()
  }
})

test('Learning Panel: mã giả hiển thị lấy cùng nguồn với generator', () => {
  const ui = setupBst()

  try {
    for (const [operation, info] of Object.entries(bstView.bstOperations)) {
      selectOperation(ui, operation)

      const lines = [...ui.document.querySelectorAll('#bst-pseudocode .pseudocode-line')]
        .map((line) => line.textContent)
      assert.deepEqual(lines, info.pseudocode, operation)
    }
  } finally {
    ui.cleanup()
  }
})
