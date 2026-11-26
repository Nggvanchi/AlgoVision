import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

import * as hashView from '../src/hash-table.js'
import { initNavigation } from '../src/navigation.js'
import { buildHashTable } from '../src/structures/hashTable.js'
import { chainingInsertPseudocode } from '../src/algorithms/hashTableInsert.js'
import { probingSearchPseudocode } from '../src/algorithms/hashTableSearch.js'
import { createFakeScheduler } from './helpers/fake-scheduler.js'

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

function setupHashTable() {
  const window = new Window()
  const { document } = window
  const scheduler = createFakeScheduler()

  document.body.innerHTML = template
  initNavigation(document)
  hashView.initHashTable(document, { scheduler })

  const $ = (selector) => document.querySelector(selector)
  const change = (selector, value) => {
    $(selector).value = String(value)
    $(selector).dispatchEvent(new window.Event('change', { bubbles: true }))
  }

  const ui = {
    window,
    document,
    scheduler,
    $,
    change,
    open() {
      $('.nav-item[data-page="structures"]').click()
      $('[data-structure-target="hash-table"]').click()
    },
    perform(operation, key) {
      change('#hash-table-operation', operation)
      $('#hash-table-key').value = String(key)
      $('#hash-table-apply').click()
    },
    nextUntilDone() {
      let guard = 0
      while (!$('#hash-table-next').disabled && guard++ < 200) {
        $('#hash-table-next').click()
      }
    },
    text: (selector) => $(selector).textContent.trim(),
    rowCount: () => document.querySelectorAll('#hash-table-svg .hash-row').length,
    // Khóa của từng ô theo DOM: chaining là chain, probing là khóa trong ô (hoặc 'DEL' / '—').
    bucketKeys(index) {
      return [...document.querySelectorAll(`#hash-table-svg .hash-entry[data-bucket="${index}"]`)]
        .map((entry) => Number(entry.dataset.key))
    },
    entryByKey: (key) => document.querySelector(`#hash-table-svg .hash-entry[data-key="${key}"]`),
    row: (index) => document.querySelector(`#hash-table-svg .hash-row[data-bucket="${index}"]`),
    activeLine: () => $('#hash-table-pseudocode .pseudocode-line.is-active')?.textContent ?? null,
    cleanup() {
      $('#hash-table-pause')?.click()
      window.happyDOM.close()
    },
  }

  return ui
}

test('formatLoadFactor: 2 chữ số thập phân, dấu phẩy cố định', () => {
  assert.equal(hashView.formatLoadFactor(0), '0,00')
  assert.equal(hashView.formatLoadFactor(6 / 7), '0,86')
  assert.equal(hashView.formatLoadFactor(2 / 3), '0,67')
  assert.equal(hashView.formatLoadFactor(1), '1,00')
  assert.equal(hashView.formatLoadFactor(15 / 7), '2,14')
  assert.equal(hashView.formatLoadFactor(3), '3,00')
})

test('collisionPresetKeys sinh 3 + k·m trong 0–99, chaining tối đa 15 khóa, probing tối đa m − 1', () => {
  assert.deepEqual(
    hashView.collisionPresetKeys(5, 'chaining'),
    [3, 8, 13, 18, 23, 28, 33, 38, 43, 48, 53, 58, 63, 68, 73],
  )
  assert.deepEqual(hashView.collisionPresetKeys(5, 'probing'), [3, 8, 13, 18])
  assert.deepEqual(
    hashView.collisionPresetKeys(7, 'chaining'),
    [3, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 94],
  )
  assert.deepEqual(hashView.collisionPresetKeys(7, 'probing'), [3, 10, 17, 24, 31, 38])
  assert.deepEqual(hashView.collisionPresetKeys(11, 'chaining'), [3, 14, 25, 36, 47, 58, 69, 80, 91])
  assert.deepEqual(hashView.collisionPresetKeys(11, 'probing'), [3, 14, 25, 36, 47, 58, 69, 80, 91])

  for (const m of [5, 7, 11]) {
    for (const strategy of ['chaining', 'probing']) {
      hashView.collisionPresetKeys(m, strategy).forEach((key) => {
        assert.equal(key % m, 3, `m = ${m}: ${key} phải rơi vào ô 3`)
        assert.ok(key >= 0 && key <= 99)
      })
    }
  }
})

test('Mở Hash Table từ thư viện cấu trúc và quay lại', () => {
  const ui = setupHashTable()

  try {
    ui.open()
    assert.equal(ui.$('#hash-table-section').hidden, false)
    assert.equal(ui.$('#structure-library').hidden, true)
    assert.equal(ui.$('#bst-section').hidden, true)

    ui.$('#hash-table-section [data-back-to-structures]').click()
    assert.equal(ui.$('#hash-table-section').hidden, true)
    assert.equal(ui.$('#structure-library').hidden, false)
  } finally {
    ui.cleanup()
  }
})

test('Khởi tạo với bảng mẫu chaining m = 7: n, m, hệ số tải, aria-label và phân bố khóa', () => {
  const ui = setupHashTable()

  try {
    assert.equal(ui.$('#hash-table-strategy').value, 'chaining')
    assert.equal(ui.$('#hash-table-capacity').value, '7')
    assert.equal(ui.text('#hash-table-entry-count'), '6')
    assert.equal(ui.text('#hash-table-capacity-value'), '7')
    assert.equal(ui.text('#hash-table-load-factor'), '0,86')
    assert.equal(ui.rowCount(), 7)
    assert.deepEqual(ui.bucketKeys(1), [15, 8, 22])
    assert.deepEqual(ui.bucketKeys(2), [30])
    assert.deepEqual(ui.bucketKeys(3), [3])
    assert.deepEqual(ui.bucketKeys(4), [11])
    assert.equal(
      ui.$('#hash-table-svg').getAttribute('aria-label'),
      'Bảng băm chaining, m = 7, n = 6, hệ số tải 0,86.',
    )
    assert.equal(ui.$('#hash-table-probes-card').hidden, true, 'chaining không hiện "Ô đã dò"')
    assert.equal(ui.$('#hash-table-tombstone-card').hidden, true)
  } finally {
    ui.cleanup()
  }
})

test('Insert qua ô nhập: Next tô đúng ô, phần tử đang so sánh và dòng mã giả', () => {
  const ui = setupHashTable()

  try {
    ui.open()
    ui.perform('insert', 29)

    assert.equal(ui.$('#hash-table-next').disabled, false)
    assert.equal(ui.activeLine(), null, 'bước 0 không tô dòng nào')

    ui.$('#hash-table-next').click()
    assert.equal(ui.activeLine(), chainingInsertPseudocode[0])
    assert.ok(ui.row(1).classList.contains('is-current'))
    assert.equal(ui.text('#hash-table-current-bucket'), '1')

    ui.$('#hash-table-next').click()
    ui.$('#hash-table-next').click()
    assert.equal(ui.activeLine(), chainingInsertPseudocode[2])
    assert.ok(ui.entryByKey(8).classList.contains('is-current'))
    assert.ok(ui.entryByKey(15).classList.contains('is-path'))
    assert.equal(ui.text('#hash-table-comparisons'), '2')

    ui.nextUntilDone()
    assert.equal(ui.activeLine(), chainingInsertPseudocode[4])
    assert.deepEqual(ui.bucketKeys(1), [15, 8, 22, 29])
    assert.ok(ui.entryByKey(29).classList.contains('is-found'))
    assert.ok(ui.entryByKey(29).querySelector('.hash-entry-ring'), 'vừa chèn có vòng kép')
    assert.equal(ui.text('#hash-table-comparisons'), '3')
    assert.equal(ui.text('#hash-table-result'), 'Đã chèn 29 vào ô 1')
  } finally {
    ui.cleanup()
  }
})

test('Previous: n, hệ số tải đọc từ bảng của bước đang hiển thị', () => {
  const ui = setupHashTable()

  try {
    ui.open()
    ui.perform('insert', 29)
    ui.nextUntilDone()
    assert.equal(ui.text('#hash-table-entry-count'), '7')
    assert.equal(ui.text('#hash-table-load-factor'), '1,00')

    ui.$('#hash-table-previous').click()
    assert.equal(ui.text('#hash-table-entry-count'), '6')
    assert.equal(ui.text('#hash-table-load-factor'), '0,86')
    assert.ok(ui.entryByKey(29) === null, 'Previous về bước trước khi chèn: bảng chưa vẽ phần tử khóa 29')
  } finally {
    ui.cleanup()
  }
})

test('Reset chỉ tua minh họa, aria-live báo bảng giữ kết quả; thao tác tiếp theo chạy trên bảng đã chốt', () => {
  const ui = setupHashTable()

  try {
    ui.open()
    ui.perform('insert', 29)
    ui.nextUntilDone()

    ui.$('#hash-table-reset').click()
    assert.match(ui.text('#hash-table-status'), /Đã tua minh họa về bước đầu/)
    assert.match(ui.text('#hash-table-status'), /bảng hiện tại vẫn gồm kết quả thao tác trước/i)
    assert.equal(ui.$('#hash-table-status').getAttribute('aria-live'), 'polite')
    assert.equal(ui.text('#hash-table-entry-count'), '6', 'bước 0 hiển thị bảng trước thao tác')

    ui.perform('insert', 29)
    ui.nextUntilDone()
    assert.equal(ui.text('#hash-table-result'), '29 đã tồn tại')
    assert.equal(ui.text('#hash-table-status'), '', 'thao tác mới xóa thông báo Reset')
  } finally {
    ui.cleanup()
  }
})

test('Thao tác mới bắt đầu từ bảng đã chốt kể cả khi chưa xem hết minh họa', () => {
  const ui = setupHashTable()

  try {
    ui.open()
    ui.perform('insert', 29)
    ui.perform('search', 29)
    ui.nextUntilDone()
    assert.equal(ui.text('#hash-table-result'), 'Tìm thấy 29 ở ô 1')

    ui.perform('delete', 8)
    ui.perform('search', 8)
    ui.nextUntilDone()
    assert.equal(ui.text('#hash-table-result'), 'Không tìm thấy 8')
    assert.deepEqual(ui.bucketKeys(1), [15, 22, 29])
  } finally {
    ui.cleanup()
  }
})

test('Nhập sai: báo lỗi, không sinh bước', () => {
  const ui = setupHashTable()

  try {
    ui.open()

    for (const raw of ['', 'abc', '100', '-1', '2.5']) {
      ui.perform('insert', raw)
      assert.match(ui.text('#hash-table-input-error'), /số nguyên từ 0 đến 99/, `"${raw}"`)
      assert.equal(ui.$('#hash-table-input-error').hidden, false)
      assert.equal(ui.$('#hash-table-key').getAttribute('aria-invalid'), 'true')
      assert.equal(ui.$('#hash-table-next').disabled, true)
    }

    ui.perform('insert', 0)
    assert.equal(ui.$('#hash-table-input-error').hidden, true)
    assert.equal(ui.$('#hash-table-key').getAttribute('aria-invalid'), 'false')
  } finally {
    ui.cleanup()
  }
})

test('Chaining đủ 15 phần tử: kiểm tra trùng trước (vẫn minh họa "đã tồn tại"), rồi mới chặn khóa mới', () => {
  const ui = setupHashTable()

  try {
    ui.open()
    ui.change('#hash-table-capacity', 5)
    ui.$('#hash-table-preset-collision').click()
    assert.equal(ui.text('#hash-table-entry-count'), '15')

    ui.perform('insert', 73)
    assert.equal(ui.$('#hash-table-input-error').hidden, true)
    ui.nextUntilDone()
    assert.equal(ui.text('#hash-table-result'), '73 đã tồn tại')
    assert.equal(ui.text('#hash-table-comparisons'), '15')

    ui.perform('insert', 1)
    assert.match(ui.text('#hash-table-input-error'), /đủ 15 phần tử/)
    assert.equal(ui.$('#hash-table-next').disabled, true)
  } finally {
    ui.cleanup()
  }
})

test('Probing: bảng đầy được minh họa bằng bước "bảng đầy"; tombstone hiện nhãn DEL, số tombstone và aria-label', () => {
  const ui = setupHashTable()

  try {
    ui.open()
    ui.change('#hash-table-strategy', 'probing')
    ui.change('#hash-table-capacity', 5)
    ui.$('#hash-table-preset-collision').click()
    assert.equal(ui.$('#hash-table-probes-card').hidden, false)
    assert.equal(ui.$('#hash-table-tombstone-card').hidden, false)

    ui.perform('insert', 23)
    ui.nextUntilDone()
    assert.equal(ui.text('#hash-table-result'), 'Đã chèn 23 vào ô 2')
    assert.equal(ui.text('#hash-table-probes'), '5')

    ui.perform('insert', 1)
    ui.nextUntilDone()
    assert.equal(ui.text('#hash-table-result'), 'Bảng đầy')
    assert.match(ui.activeLine(), /bảng đầy/)

    ui.perform('delete', 8)
    ui.nextUntilDone()
    const tombstone = ui.row(4).querySelector('.hash-cell')
    assert.ok(tombstone.classList.contains('is-tombstone'))
    assert.equal(ui.row(4).querySelector('.hash-cell-label').textContent, 'DEL')
    assert.equal(ui.text('#hash-table-tombstone-count'), '1')
    assert.equal(
      ui.$('#hash-table-svg').getAttribute('aria-label'),
      'Bảng băm linear probing, m = 5, n = 4, hệ số tải 0,80, 1 tombstone.',
    )

    ui.perform('search', 13)
    ui.nextUntilDone()
    assert.equal(ui.text('#hash-table-result'), 'Tìm thấy 13 ở ô 0')
    assert.equal(ui.text('#hash-table-probes'), '3')
    assert.equal(ui.text('#hash-table-comparisons'), '2')
  } finally {
    ui.cleanup()
  }
})

test('Đổi m hoặc chiến lược: tạo bảng rỗng mới, aria-live báo rõ', () => {
  const ui = setupHashTable()

  try {
    ui.open()
    ui.perform('insert', 29)

    ui.change('#hash-table-capacity', 11)
    assert.equal(ui.rowCount(), 11)
    assert.equal(ui.text('#hash-table-entry-count'), '0')
    assert.equal(ui.$('#hash-table-next').disabled, true, 'minh họa cũ bị bỏ')
    assert.equal(ui.text('#hash-table-status'), 'Đã tạo bảng rỗng mới: chaining, m = 11.')

    ui.perform('insert', 29)
    ui.change('#hash-table-strategy', 'probing')
    assert.equal(ui.text('#hash-table-entry-count'), '0')
    assert.equal(ui.text('#hash-table-status'), 'Đã tạo bảng rỗng mới: linear probing, m = 11.')
    assert.equal(ui.$('#hash-table-svg').querySelectorAll('.hash-entry').length, 0)
  } finally {
    ui.cleanup()
  }
})

test('Preset va chạm nặng dùng m hiện tại: m = 5, 7, 11 đều dồn mọi khóa vào ô 3', () => {
  const ui = setupHashTable()

  try {
    ui.open()

    for (const [m, count] of [[5, 15], [7, 14], [11, 9]]) {
      ui.change('#hash-table-capacity', m)
      ui.$('#hash-table-preset-collision').click()
      assert.equal(ui.rowCount(), m)
      assert.equal(ui.bucketKeys(3).length, count, `m = ${m}`)
      assert.equal(ui.text('#hash-table-entry-count'), String(count))
    }
  } finally {
    ui.cleanup()
  }
})

test('Preset bảng mẫu luôn đặt m = 7; Clear tạo bảng rỗng với m hiện tại', () => {
  const ui = setupHashTable()

  try {
    ui.open()
    ui.change('#hash-table-capacity', 5)
    ui.$('#hash-table-preset-sample').click()
    assert.equal(ui.$('#hash-table-capacity').value, '7')
    assert.equal(ui.rowCount(), 7)
    assert.deepEqual(ui.bucketKeys(1), [15, 8, 22])

    ui.$('#hash-table-clear').click()
    assert.equal(ui.text('#hash-table-entry-count'), '0')
    assert.equal(ui.text('#hash-table-load-factor'), '0,00')
    assert.equal(ui.rowCount(), 7)
  } finally {
    ui.cleanup()
  }
})

test('Đang Run thì khóa nút thao tác, ô chọn m, ô chọn chiến lược, preset và Clear; xong thì mở lại', () => {
  const ui = setupHashTable()
  const locked = [
    '#hash-table-apply', '#hash-table-operation', '#hash-table-key', '#hash-table-strategy',
    '#hash-table-capacity', '#hash-table-preset-sample', '#hash-table-preset-collision', '#hash-table-clear',
  ]

  try {
    ui.open()
    ui.perform('insert', 29)
    ui.$('#hash-table-run').click()

    locked.forEach((selector) => assert.equal(ui.$(selector).disabled, true, `${selector} phải bị khóa`))

    ui.$('#hash-table-capacity').value = '5'
    ui.$('#hash-table-capacity').dispatchEvent(new ui.window.Event('change', { bubbles: true }))
    assert.equal(ui.rowCount(), 7, 'sự kiện change khi đang Run không được đổi bảng')

    ui.scheduler.advance(10_000)
    assert.equal(ui.text('#hash-table-result'), 'Đã chèn 29 vào ô 1')
    locked.forEach((selector) => assert.equal(ui.$(selector).disabled, false, `${selector} phải mở lại`))
  } finally {
    ui.cleanup()
  }
})

test('Rời màn hình Hash Table khi đang Run thì tự tạm dừng', () => {
  const ui = setupHashTable()

  try {
    ui.open()
    ui.perform('insert', 29)
    ui.$('#hash-table-run').click()
    ui.scheduler.advance(700)

    ui.$('.nav-item[data-page="sorting"]').click()
    const pendingAfterLeave = ui.scheduler.pendingCount
    ui.scheduler.advance(10_000)

    assert.equal(pendingAfterLeave, 0)
    assert.equal(ui.text('#hash-table-result'), 'Chưa có')
    assert.equal(ui.$('#hash-table-run').textContent.trim(), 'Tiếp tục')
  } finally {
    ui.cleanup()
  }
})

test('Mã giả đổi theo chiến lược và thao tác, lấy cùng nguồn với generator', () => {
  const ui = setupHashTable()

  try {
    ui.open()
    ui.change('#hash-table-strategy', 'probing')
    ui.change('#hash-table-operation', 'search')

    const lines = [...ui.document.querySelectorAll('#hash-table-pseudocode .pseudocode-line')]
      .map((line) => line.textContent)
    assert.deepEqual(lines, probingSearchPseudocode)
    assert.equal(ui.text('#hash-table-pseudocode-title'), 'Mã giả: Search (linear probing)')
  } finally {
    ui.cleanup()
  }
})

test('renderHashTable bỏ qua id không có trong bảng và ô ngoài phạm vi', () => {
  const window = new Window()
  const { document } = window

  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const table = buildHashTable(7, [15, 8])

    hashView.renderHashTable(svg, {
      table,
      currentBucket: 99,
      currentEntryId: 'e98',
      foundEntryId: 'e97',
      insertedEntryId: 'e96',
      pathEntryIds: ['e1', 'e95'],
      probedBuckets: [],
    })

    assert.equal(svg.querySelectorAll('.hash-row').length, 7)
    assert.equal(svg.querySelectorAll('.hash-entry').length, 2)
    assert.equal(svg.querySelectorAll('.is-current, .is-found').length, 0)
    assert.equal(svg.querySelectorAll('.hash-entry.is-path').length, 1)
  } finally {
    window.happyDOM.close()
  }
})

function complexityTexts(ui) {
  return {
    tag: ui.text('#hash-table-complexity'),
    title: ui.text('#hash-table-complexity-title'),
    best: ui.text('#hash-table-complexity-best'),
    average: ui.text('#hash-table-complexity-average'),
    worst: ui.text('#hash-table-complexity-worst'),
    space: ui.text('#hash-table-complexity-space'),
    averageNote: ui.text('#hash-table-complexity-average-note'),
    worstNote: ui.text('#hash-table-complexity-worst-note'),
  }
}

test('Learning Panel chaining: tốt nhất O(1), phân tán tốt O(1 + α), va chạm nặng O(n), bộ nhớ O(m + n)', () => {
  const ui = setupHashTable()

  try {
    ui.open()

    for (const [operation, name] of [['insert', 'INSERT'], ['search', 'SEARCH'], ['delete', 'DELETE']]) {
      ui.change('#hash-table-operation', operation)
      const texts = complexityTexts(ui)

      assert.equal(texts.title, `${name} · CHAINING`)
      assert.equal(texts.tag, 'O(1 + α)')
      assert.equal(texts.best, 'O(1)')
      assert.equal(texts.average, 'O(1 + α)')
      assert.equal(texts.worst, 'O(n)')
      assert.equal(texts.space, 'O(m + n)')
      assert.match(texts.worstNote, /cùng một ô/)
    }
  } finally {
    ui.cleanup()
  }
})

test('Learning Panel probing: cận deterministic, mô hình trung bình, bộ nhớ O(m), nhắc tombstone', () => {
  const ui = setupHashTable()

  try {
    ui.open()
    ui.change('#hash-table-strategy', 'probing')

    ui.change('#hash-table-operation', 'search')
    let texts = complexityTexts(ui)
    assert.equal(texts.title, 'SEARCH · LINEAR PROBING')
    assert.equal(texts.best, 'O(1)')
    assert.equal(texts.average, 'Hit/miss phụ thuộc cụm; P≤m', 'đường dò search')
    assert.equal(texts.tag, 'O(m) xấu nhất', 'tag là cận worst, không unconditional average')
    assert.equal(texts.worst, 'O(m)')
    assert.equal(ui.text('#hash-table-complexity-space'), 'O(m)')
    assert.match(texts.averageNote, /Cần mô hình phân phối/)
    assert.match(texts.averageNote, /Cùng α vẫn có cụm va chạm khác nhau/)
    assert.match(texts.averageNote, /không dự đoán số ô dò/)
    assert.match(texts.averageNote, /\(n\+tombstone\)\/m không dự đoán/)
    assert.match(texts.worstNote, /tombstone/)

    ui.change('#hash-table-operation', 'insert')
    texts = complexityTexts(ui)
    assert.equal(texts.title, 'INSERT · LINEAR PROBING')
    assert.equal(texts.average, 'Phụ thuộc phân bố/cụm; P≤m')
  } finally {
    ui.cleanup()
  }
})

test('Learning Panel: n, m, α (và tombstone với probing) đọc từ bước đang hiển thị', () => {
  const ui = setupHashTable()

  try {
    ui.open()
    assert.equal(ui.text('#hash-table-complexity-live'), 'Bảng đang hiển thị: n = 6, m = 7, α = 0,86.')

    ui.perform('insert', 29)
    ui.nextUntilDone()
    assert.equal(ui.text('#hash-table-complexity-live'), 'Bảng đang hiển thị: n = 7, m = 7, α = 1,00.')
    ui.$('#hash-table-previous').click()
    assert.equal(ui.text('#hash-table-complexity-live'), 'Bảng đang hiển thị: n = 6, m = 7, α = 0,86.')

    ui.change('#hash-table-strategy', 'probing')
    ui.$('#hash-table-preset-sample').click()
    ui.perform('delete', 8)
    ui.nextUntilDone()
    assert.equal(
      ui.text('#hash-table-complexity-live'),
      'Bảng đang hiển thị: n = 5, m = 7, α = 0,71, tombstone = 1, (n + tombstone)/m = 0,86.',
    )
  } finally {
    ui.cleanup()
  }
})

test('Learning Panel: ý tưởng, ưu điểm, hạn chế đổi theo chiến lược và thao tác; nói rõ chưa minh họa rehash', () => {
  const ui = setupHashTable()
  const learning = () => [
    ui.text('#hash-table-learning-description'),
    ui.text('#hash-table-learning-advantages'),
    ui.text('#hash-table-learning-disadvantages'),
  ]

  try {
    ui.open()
    const seen = new Set()

    for (const strategy of ['chaining', 'probing']) {
      ui.change('#hash-table-strategy', strategy)
      for (const operation of ['insert', 'search', 'delete']) {
        ui.change('#hash-table-operation', operation)
        const [description, advantages, disadvantages] = learning()
        assert.ok(description && advantages && disadvantages, `${strategy}/${operation} thiếu nội dung`)
        seen.add(description)
      }
    }

    assert.equal(seen.size, 6, 'mỗi cặp chiến lược/thao tác có mô tả riêng')
    ui.change('#hash-table-strategy', 'probing')
    ui.change('#hash-table-operation', 'delete')
    assert.match(ui.text('#hash-table-learning-description'), /tombstone/)
    assert.match(ui.text('#hash-table-learning'), /chưa minh họa rehash/)
  } finally {
    ui.cleanup()
  }
})

const hashCostCopy = {
  "CHAINING_COMPLEXITY.averageNote": "Chi phí lõi kỳ vọng O(1+α) cần mô hình hash và truy vấn phù hợp; key mod m không bảo đảm phân tán đều. Bảng không tự rehash.",
  "PROBING_COMPLEXITY.tag": "O(m) xấu nhất",
  "PROBING_COMPLEXITY.averageNote": "Cần mô hình phân phối để tính trung bình. Cùng α vẫn có cụm va chạm khác nhau; (n+tombstone)/m không dự đoán số ô dò.",
  "complexityFor.probing.insert.average": "Phụ thuộc phân bố/cụm; P≤m",
  "complexityFor.probing.search.average": "Hit/miss phụ thuộc cụm; P≤m",
  "complexityFor.probing.delete.average": "Hit/miss phụ thuộc cụm; P≤m",
  "learningFor.chaining.insert.description": "Duyệt chain tại h(key). Khóa mới so hết ℓ phần tử rồi nối cuối; khóa trùng ở vị trí p (từ 0) dừng với C=p+1.",
  "learningFor.chaining.insert.disadvantages": "Khóa mới phải kiểm hết chain. API chèn thành công còn copy bảng O(m+n); counter không đo copy và trace.",
  "learningFor.chaining.search.disadvantages": "Chain có thể dài n, tìm kiếm lõi O(n). Trace copy các prefix đường tìm; không có chi phí O(1) vô điều kiện.",
  "learningFor.chaining.delete.description": "Tìm rồi gỡ đúng ID khỏi chain. ID/key còn lại giữ nguyên; phần tử phía sau có thể đổi vị trí trong mảng chain.",
  "learningFor.chaining.delete.disadvantages": "Lõi tìm trong một chain; API xóa còn quét/copy bảng O(m+n). Không đồng nhất chi phí với số so sánh.",
  "learningFor.probing.insert.advantages": "Lõi dò các ô liên tiếp. API chèn thành công vẫn copy m ô; không có rehash tự động.",
  "learningFor.probing.search.advantages": "Lõi dừng khi gặp khóa, ô trống hoặc đã dò đủ m ô.",
  "learningFor.probing.delete.disadvantages": "Tombstone có thể kéo dài đường dò; dùng lại tombstone có thể giảm số dấu xóa. Chưa minh họa rehash."
}

test('Hash Learning Panel: exact cost copy, template scope và isolation chiến lược/thao tác', () => {
  const ui = setupHashTable()
  try {
    ui.open()
    const section = ui.$('#hash-table-section')
    assert.equal(section.querySelector('.complexity-heading h4').textContent.trim(), 'Chi phí lõi và bảng', 'heading cost scope')
    const labels = [...section.querySelectorAll('.complexity-card > span')].map((node) => node.textContent.trim())
    assert.ok(labels.includes('Mô hình trung bình / đường dò'), 'label average không hứa O(1)')
    assert.ok(labels.includes('Bộ nhớ bảng'), 'space là representation của bảng')
    assert.equal(section.querySelector('#hash-table-learning .learning-heading p').textContent.trim().replace(/\s+/g, ' '), 'n là số khóa, m là số ô, α=n/m. Chaining tìm trong một chain; probing dò tối đa m ô. Chi phí lõi khác API copy bảng và trace. Bảng m cố định, chưa minh họa rehash.', 'intro phân biệt core/API/trace')
    const templateWindow = new Window()
    try {
      templateWindow.document.body.innerHTML = template
      assert.equal(templateWindow.document.querySelector('#hash-table-complexity').textContent.trim(), 'O(1 + α)', 'template tag đúng strategy mặc định')
    } finally {
      templateWindow.happyDOM.close()
    }
    for (const strategy of ['chaining', 'probing', 'chaining']) {
      ui.change('#hash-table-strategy', strategy)
      for (const operation of ['insert', 'search', 'delete']) {
        ui.change('#hash-table-operation', operation)
        const texts = complexityTexts(ui)
        const prefix = strategy === 'chaining' ? 'CHAINING_COMPLEXITY' : 'PROBING_COMPLEXITY'
        assert.equal(texts.averageNote, hashCostCopy[prefix + '.averageNote'], strategy + ': mô hình average')
        assert.equal(texts.tag, strategy === 'chaining' ? 'O(1 + α)' : hashCostCopy['PROBING_COMPLEXITY.tag'], strategy + ': tag isolation')
        assert.equal(texts.best, 'O(1)', 'giữ best core')
        assert.equal(texts.worst, strategy === 'chaining' ? 'O(n)' : 'O(m)', 'giữ worst core')
        assert.equal(texts.space, strategy === 'chaining' ? 'O(m + n)' : 'O(m)', 'giữ table memory')
        if (strategy === 'probing') assert.equal(texts.average, hashCostCopy['complexityFor.probing.' + operation + '.average'], operation + ': deterministic probing')
        for (const [field, expected] of Object.entries(hashCostCopy)) {
          const path = 'learningFor.' + strategy + '.' + operation + '.'
          if (field.startsWith(path)) {
            const name = field.slice(path.length)
            assert.equal(ui.text('#hash-table-learning-' + name), expected, field + ': exact copy')
          }
        }
      }
    }
    assert.equal(ui.$('#hash-table-key').getAttribute('max'), '99', 'không đổi validation key')
    ui.change('#hash-table-capacity', 5)
    ui.$('#hash-table-preset-collision').click()
    assert.equal(ui.text('#hash-table-entry-count'), '15', 'chaining UI max15 vẫn hỗ trợ α>1')
    ui.perform('insert', 3)
    ui.nextUntilDone()
    assert.equal(ui.text('#hash-table-entry-count'), '15', 'duplicate ở max15 không thêm key')
    assert.equal(ui.text('#hash-table-result'), '3 đã tồn tại', 'duplicate được nhận diện trước max15')
  } finally {
    ui.cleanup()
  }
})
