import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

import { isShown, withFullApp, template } from './helpers/app-dom.js'
import { memoryStorage } from './helpers/memory-storage.js'
import { initProgressView, createConfirmBox } from '../src/progress-view.js'
import { formatOpenedAt, isoTimestamp } from '../src/progress-summary.js'

// Trang "Tiến độ học tập": vẽ lại từ readState/catalog/subscribe của initProgress, mở lại chủ đề bằng điều khiển có sẵn của
// navigation.js, hai đường xóa dùng chung một khung xác nhận nhưng không lẫn nhau.
const KEY = 'algovision:progress'
const FORBIDDEN = /hoàn thành|completed|streak|chuỗi ngày|thời gian học|%/i
const T1 = Date.UTC(2020, 5, 1, 8, 30)
const T2 = Date.UTC(2020, 5, 3, 21, 5)
const T3 = Date.UTC(2020, 5, 4, 7, 0)

const entry = (firstOpenedAt, lastOpenedAt, openCount) => ({ firstOpenedAt, lastOpenedAt, openCount })
const seed = (topics) => memoryStorage({ initial: JSON.stringify({ version: 1, topics }) })
const SEEDED = {
  'sorting:bubble': entry(T1, T3, 3),
  'searching:binary': entry(T2, T2, 1),
  'structure:bst': entry(T1, T2, 2),
}

const textOf = (element) => element.textContent.replace(/\s+/g, ' ').trim()
const $ = (document, selector) => document.querySelector(selector)
const goTo = (document, page) => $(document, `.nav-item[data-page="${page}"]`).click()
const openProgressPage = (document) => goTo(document, 'progress')
const stored = (storage) => JSON.parse(storage.data.get(KEY))
const stats = (document) => [...document.querySelectorAll('#progress-data .progress-stat')].map(textOf)
const groupCounts = (document) => [...document.querySelectorAll('#progress-data .progress-group')]
  .map((group) => `${textOf(group.querySelector('h3'))} ${textOf(group.querySelector('.progress-group-count'))}`)
const rows = (document) => [...document.querySelectorAll('#progress-data .progress-group .progress-topic')]
const run = (callback, options = {}) => withFullApp(callback, { storage: memoryStorage(), ...options })

function storageEvent(window, key = KEY) {
  window.dispatchEvent(new window.StorageEvent('storage', { key }))
}

// --- Trạng thái: trống ---

test('trống: ba ô 0 / 0 / "Chưa có", 12 chủ đề "Chưa mở", câu hướng dẫn và nút "Mở Sắp xếp"', async () => {
  await run(({ document }) => {
    openProgressPage(document)

    assert.deepEqual(stats(document), ['Đã mở 0 / 12 chủ đề', 'Tổng lượt mở 0', 'Mở gần nhất Chưa có'])
    assert.deepEqual(groupCounts(document), ['Sắp xếp 0 / 3', 'Tìm kiếm 0 / 2', 'Cấu trúc dữ liệu 0 / 7'])
    assert.equal(rows(document).length, 12)
    assert.ok(rows(document).every((row) => textOf(row.querySelector('.progress-topic-meta')) === 'Chưa mở'))
    assert.equal(document.querySelectorAll('#progress-data .progress-reopen').length, 0)
    assert.ok(textOf($(document, '#progress-data')).includes('Bạn chưa mở chủ đề nào.'))
    assert.equal(textOf($(document, '#progress-data .dashboard-primary-button')), 'Mở Sắp xếp')
    assert.equal($(document, '#progress-notice').hidden, true)
  })
})

test('trống: nút Xóa lịch sử aria-disabled kèm "Chưa có gì để xóa", bấm không mở khung xác nhận', async () => {
  await run(({ document }) => {
    openProgressPage(document)
    const clear = $(document, '#progress-clear')

    assert.equal(clear.getAttribute('aria-disabled'), 'true')
    assert.equal(textOf($(document, '#progress-manage-note')), 'Chưa có gì để xóa')
    assert.equal($(document, '#progress-manage-note').hidden, false)
    assert.equal(clear.getAttribute('aria-describedby'), 'progress-manage-note')

    clear.click()
    assert.equal($(document, '#progress-confirm-clear').hidden, true)
  })
})

test('vùng role="status" aria-live="polite" luôn có trong DOM, kể cả khi chưa mở trang', async () => {
  await run(({ document }) => {
    const status = $(document, '#progress-status')

    assert.equal(status.getAttribute('role'), 'status')
    assert.equal(status.getAttribute('aria-live'), 'polite')
    assert.equal(status.closest('#progress-section') !== null, true)
  })
})

// --- Trạng thái: có dữ liệu ---

test('có dữ liệu: ba ô, "x / n" từng nhóm, hàng đã mở có số lần, mở lần đầu và gần nhất', async () => {
  await run(({ document }) => {
    openProgressPage(document)

    assert.deepEqual(stats(document), [
      'Đã mở 3 / 12 chủ đề',
      'Tổng lượt mở 6',
      `Mở gần nhất ${formatOpenedAt(T3)}`,
    ])
    assert.deepEqual(groupCounts(document), ['Sắp xếp 1 / 3', 'Tìm kiếm 1 / 2', 'Cấu trúc dữ liệu 1 / 7'])

    const bubble = rows(document).find((row) => textOf(row.querySelector('.progress-topic-name')) === 'Bubble Sort')

    assert.equal(
      textOf(bubble.querySelector('.progress-topic-meta')),
      `Đã mở 3 lần · mở lần đầu ${formatOpenedAt(T1)} · gần nhất ${formatOpenedAt(T3)}`,
    )

    const times = [...bubble.querySelectorAll('time')]

    assert.deepEqual(times.map((time) => time.getAttribute('datetime')), [isoTimestamp(T1), isoTimestamp(T3)])
  }, { storage: seed(SEEDED) })
})

test('hàng đã mở là nút có tên truy cập "Mở lại <tên>"; hàng chưa mở không có nút', async () => {
  await run(({ document }) => {
    openProgressPage(document)

    const names = [...document.querySelectorAll('#progress-data .progress-group .progress-reopen')].map((button) => button.getAttribute('aria-label'))

    assert.deepEqual(names.sort(), ['Mở lại Binary Search', 'Mở lại Binary Search Tree', 'Mở lại Bubble Sort'])
    assert.ok([...document.querySelectorAll('.progress-reopen')].every((button) => button.tagName === 'BUTTON' && button.type === 'button'))
  }, { storage: seed(SEEDED) })
})

test('"Mở gần đây" xếp theo lần mở gần nhất (mới nhất trước), tối đa 5 hàng', async () => {
  const topics = {}
  const ids = ['sorting:bubble', 'sorting:selection', 'sorting:insertion', 'searching:linear', 'searching:binary', 'structure:array', 'structure:stack']

  ids.forEach((id, index) => { topics[id] = entry(1000, 1000 + index, 1) })

  await run(({ document }) => {
    openProgressPage(document)

    const recent = [...document.querySelectorAll('#progress-data .progress-recent .progress-topic-name')].map(textOf)

    assert.equal(recent.length, 5)
    assert.deepEqual(recent.slice(0, 2), ['Stack', 'Array'])
    assert.equal($(document, '#progress-data .progress-recent-title').textContent, 'Mở gần đây')
  }, { storage: seed(topics) })
})

test('chủ đề app không còn biết trong dữ liệu cũ bị ẩn khỏi mọi con số', async () => {
  await run(({ document }) => {
    openProgressPage(document)

    assert.equal(stats(document)[0], 'Đã mở 1 / 12 chủ đề')
    assert.equal(stats(document)[1], 'Tổng lượt mở 4')
  }, { storage: seed({ 'sorting:bubble': entry(1, 2, 4), 'structure:tree': entry(1, 9, 50) }) })
})

test('mỗi màn hình chỉ có một h2 hiển thị và h3 của trang nằm dưới nó', async () => {
  await run(({ document }) => {
    openProgressPage(document)

    assert.deepEqual([...document.querySelectorAll('h2')].filter(isShown).map(textOf), ['Tiến độ học tập'])
    assert.ok([...document.querySelectorAll('#progress-section h3')].every((heading) => isShown(heading)))
  }, { storage: seed(SEEDED) })
})

// --- Trạng thái lỗi / cảnh báo ---

test('dữ liệu hỏng: thông báo bỏ qua, vẫn hiện 0 / 12, nút Xóa dùng được (có gì đó để dọn)', async () => {
  await run(({ document }) => {
    openProgressPage(document)

    assert.equal(textOf($(document, '#progress-notice')), 'Dữ liệu tiến độ đã lưu bị hỏng nên được bỏ qua. Lần mở tiếp theo sẽ ghi đè.')
    assert.equal($(document, '#progress-notice').hidden, false)
    assert.equal(stats(document)[0], 'Đã mở 0 / 12 chủ đề')
    assert.equal($(document, '#progress-clear').getAttribute('aria-disabled'), 'false')
  }, { storage: memoryStorage({ initial: '{hỏng' }) })
})

test('storage không dùng được hoặc không ghi được: "chỉ hiển thị trong phiên này", lần mở trong phiên vẫn hiện', async () => {
  for (const storage of [null, memoryStorage({ failGet: true }), memoryStorage({ failSet: true })]) {
    await run(({ document }) => {
      $(document, 'button[data-structure-nav="bst"]').click()
      openProgressPage(document)

      assert.equal(textOf($(document, '#progress-notice')), 'Trình duyệt không cho lưu tiến độ; chỉ hiển thị trong phiên này.')
      assert.equal(stats(document)[0], 'Đã mở 1 / 12 chủ đề')
    }, { storage })
  }
})

test('phiên bản mới hơn: chỉ thông báo, không số liệu, không nút Xóa thường, có nút riêng; không ghi gì', async () => {
  const storage = memoryStorage({ initial: JSON.stringify({ version: 9, topics: { 'sorting:bubble': entry(1, 2, 3) } }) })
  const before = storage.data.get(KEY)

  await run(({ document }) => {
    openProgressPage(document)

    assert.equal(
      textOf($(document, '#progress-notice')),
      'Dữ liệu được ghi bởi phiên bản mới hơn của AlgoVision nên chưa hiển thị. AlgoVision sẽ không ghi đè hay chuyển đổi dữ liệu này.',
    )
    assert.equal($(document, '#progress-data').children.length, 0)
    assert.equal($(document, '#progress-clear').hidden, true)
    assert.equal($(document, '#progress-clear-future').hidden, false)
    assert.equal(textOf($(document, '#progress-clear-future')), 'Xóa dữ liệu của phiên bản mới hơn')
  }, { storage })

  assert.equal(storage.data.get(KEY), before)
  assert.equal(storage.setCalls, 0)
})

// --- Chữ cấm và an toàn DOM ---

test('không chữ cấm (hoàn thành, completed, streak, chuỗi ngày, thời gian học, %) trong mọi trạng thái', async () => {
  const states = [seed(SEEDED), memoryStorage(), memoryStorage({ initial: '{hỏng' }), null,
    memoryStorage({ initial: JSON.stringify({ version: 9, topics: {} }) })]

  for (const storage of states) {
    await run(({ document }) => {
      openProgressPage(document)
      for (const id of ['#progress-clear', '#progress-clear-future']) $(document, id).click()

      assert.doesNotMatch($(document, '#progress-section').textContent, FORBIDDEN)
    }, { storage })
  }
})

test('mã và template của trang Tiến độ không có chữ cấm', async () => {
  const source = await readFile(new URL('../src/progress-view.js', import.meta.url), 'utf8')
  const section = template.slice(template.indexOf('id="progress-section"'), template.indexOf('class="page-heading"'))

  assert.ok(section.includes('Tiến độ học tập') && section.length > 200, 'đoạn template lấy được không rỗng')
  assert.doesNotMatch(source, FORBIDDEN)
  assert.doesNotMatch(section, FORBIDDEN)
  const code = source.replace(/^\s*\/\/.*$/gm, '')

  assert.doesNotMatch(code, /localStorage|sessionStorage|innerHTML|insertAdjacentHTML|\bconfirm\(|<dialog/)
})

test('nhãn chủ đề có HTML được hiển thị như chữ, không tạo phần tử (chỉ dùng textContent)', () => {
  const window = new Window()
  const { document } = window
  const evil = '<img src=x onerror=alert(1)>'

  try {
    document.body.innerHTML = template
    const catalog = [{ id: 'sorting:bubble', label: evil, kind: 'sorting' }]
    const progress = {
      catalog,
      readState: () => ({ progress: { version: 1, topics: { 'sorting:bubble': entry(1, 2, 3) } }, status: 'ok', persisted: true }),
      subscribe: () => () => {},
      clear: () => true,
    }

    initProgressView(document, progress)

    assert.equal(document.querySelectorAll('#progress-section img').length, 0)
    assert.ok(textOf($(document, '#progress-data')).includes(evil))
    assert.equal($(document, '.progress-reopen').getAttribute('aria-label'), `Mở lại ${evil}`)
  } finally {
    window.happyDOM.close()
  }
})

// --- Xóa thường ---

test('Xóa lịch sử: mở khung xác nhận (role group, aria-labelledby, chữ đúng), focus vào Hủy, không xóa gì', async () => {
  const storage = seed(SEEDED)

  await run(({ document }) => {
    openProgressPage(document)
    $(document, '#progress-clear').click()

    const box = $(document, '#progress-confirm-clear')

    assert.equal(box.hidden, false)
    assert.equal(box.getAttribute('role'), 'group')
    assert.equal(textOf(document.getElementById(box.getAttribute('aria-labelledby'))), 'Xóa lịch sử học tập?')
    assert.ok(textOf(box).includes('Danh sách chủ đề đã mở sẽ bị xóa khỏi trình duyệt này. Không thể hoàn tác.'))
    assert.deepEqual([...box.querySelectorAll('button')].map(textOf), ['Hủy', 'Xóa'])
    assert.ok(document.activeElement === box.querySelector('button'), 'mở khung thì focus vào nút đầu tiên (Hủy)')
    assert.equal(textOf(document.activeElement), 'Hủy')
    assert.equal(storage.data.has(KEY), true)
  }, { storage })
})

test('Escape và Hủy đóng khung, trả focus cho nút Xóa lịch sử, dữ liệu còn nguyên', async () => {
  const storage = seed(SEEDED)

  await run(({ document, window }) => {
    openProgressPage(document)
    const clear = $(document, '#progress-clear')
    const box = $(document, '#progress-confirm-clear')

    clear.click()
    box.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    assert.equal(box.hidden, true)
    assert.ok(document.activeElement === clear, 'đóng khung thì trả focus cho nút Xóa lịch sử')

    clear.click()
    box.querySelector('button').click()
    assert.equal(box.hidden, true)
    assert.ok(document.activeElement === clear, 'đóng khung thì trả focus cho nút Xóa lịch sử')
    assert.equal(Object.keys(stored(storage).topics).length, 3)
  }, { storage })
})

test('xác nhận Xóa: kho sạch, ba ô về 0, thông báo "Đã xóa lịch sử học tập.", focus về dòng tóm tắt', async () => {
  const storage = seed(SEEDED)

  await run(({ document }) => {
    openProgressPage(document)
    $(document, '#progress-clear').click()
    $(document, '#progress-confirm-clear .progress-danger').click()

    assert.equal(storage.data.has(KEY), false)
    assert.equal(stats(document)[0], 'Đã mở 0 / 12 chủ đề')
    assert.equal(textOf($(document, '#progress-status')), 'Đã xóa lịch sử học tập.')
    assert.equal($(document, '#progress-confirm-clear').hidden, true)
    assert.equal(document.activeElement.getAttribute('tabindex'), '-1')
    assert.ok(document.activeElement === $(document, '[data-progress-summary]'), 'xóa xong thì focus về dòng tóm tắt')
    assert.equal($(document, '#progress-clear').getAttribute('aria-disabled'), 'true')
  }, { storage })
})

test('clear() thất bại: thông báo "Không xóa được dữ liệu khỏi trình duyệt…" và lịch sử phiên được làm mới', async () => {
  const storage = seed(SEEDED)

  storage.removeItem = () => { throw new Error('SecurityError') }

  await run(({ document }) => {
    openProgressPage(document)
    $(document, '#progress-clear').click()
    $(document, '#progress-confirm-clear .progress-danger').click()

    assert.equal(
      textOf($(document, '#progress-status')),
      'Không xóa được dữ liệu khỏi trình duyệt. Lịch sử trong phiên này đã được làm mới.',
    )
    assert.ok(document.activeElement === $(document, '[data-progress-summary]'), 'xóa thất bại thì focus vẫn về dòng tóm tắt')
  }, { storage })
})

test('thông báo xóa được dọn khi vào lại trang Tiến độ', async () => {
  await run(({ document }) => {
    openProgressPage(document)
    $(document, '#progress-clear').click()
    $(document, '#progress-confirm-clear .progress-danger').click()
    assert.notEqual(textOf($(document, '#progress-status')), '')

    goTo(document, 'dashboard')
    openProgressPage(document)
    assert.equal(textOf($(document, '#progress-status')), '')
  }, { storage: seed(SEEDED) })
})

// --- Xóa dữ liệu phiên bản mới hơn: tách biệt với xóa thường ---

const FUTURE = JSON.stringify({ version: 9, topics: { 'sorting:bubble': entry(1, 2, 3) } })

test('phiên bản mới hơn: khung xác nhận RIÊNG với câu cảnh báo riêng, Hủy là mặc định và không xóa', async () => {
  const storage = memoryStorage({ initial: FUTURE })

  await run(({ document }) => {
    openProgressPage(document)
    $(document, '#progress-clear-future').click()

    const box = $(document, '#progress-confirm-future')

    assert.equal(box.hidden, false)
    assert.equal(box.getAttribute('role'), 'group')
    assert.equal(textOf(document.getElementById(box.getAttribute('aria-labelledby'))), 'Xóa dữ liệu của phiên bản mới hơn?')
    assert.ok(textOf(box).includes('Dữ liệu do một phiên bản AlgoVision mới hơn tạo ra sẽ bị xóa khỏi trình duyệt này. Không thể hoàn tác.'))
    assert.equal(textOf(document.activeElement), 'Hủy')
    assert.equal($(document, '#progress-confirm-clear').hidden, true)
    assert.equal(storage.data.get(KEY), FUTURE)

    box.querySelector('button').click()
    assert.equal(box.hidden, true)
    assert.equal(storage.data.get(KEY), FUTURE)
  }, { storage })
})

test('phiên bản mới hơn: xác nhận xóa thì kho sạch và trang trở về trạng thái trống', async () => {
  const storage = memoryStorage({ initial: FUTURE })

  await run(({ document }) => {
    openProgressPage(document)
    $(document, '#progress-clear-future').click()
    $(document, '#progress-confirm-future .progress-danger').click()

    assert.equal(storage.data.has(KEY), false)
    assert.equal(textOf($(document, '#progress-status')), 'Đã xóa dữ liệu của phiên bản mới hơn.')
    assert.equal($(document, '#progress-notice').hidden, true)
    assert.equal($(document, '#progress-clear-future').hidden, true)
    assert.equal($(document, '#progress-clear').hidden, false)
    assert.equal(stats(document)[0], 'Đã mở 0 / 12 chủ đề')
  }, { storage })
})

test('hai đường xóa không lẫn nhau: khung thường mở rồi kho đổi sang phiên bản mới hơn thì Xóa thường KHÔNG xóa gì', async () => {
  const storage = seed(SEEDED)

  await run(({ document, window }) => {
    openProgressPage(document)
    $(document, '#progress-clear').click()

    storage.data.set(KEY, FUTURE)
    storageEvent(window)
    $(document, '#progress-confirm-clear .progress-danger').click()

    assert.equal(storage.data.get(KEY), FUTURE, 'dữ liệu của phiên bản mới hơn không được bị đường xóa thường xóa')
    assert.equal(textOf($(document, '#progress-status')), 'Dữ liệu đã thay đổi ở tab khác nên chưa xóa gì.')
    assert.equal($(document, '#progress-clear-future').hidden, false)
  }, { storage })
})

test('hai đường xóa không lẫn nhau: khung phiên bản mới hơn mở rồi kho thành dữ liệu thường thì Xóa riêng KHÔNG xóa gì', async () => {
  const storage = memoryStorage({ initial: FUTURE })
  const normal = JSON.stringify({ version: 1, topics: { 'sorting:bubble': entry(1, 2, 3) } })

  await run(({ document, window }) => {
    openProgressPage(document)
    $(document, '#progress-clear-future').click()

    storage.data.set(KEY, normal)
    storageEvent(window)
    $(document, '#progress-confirm-future .progress-danger').click()

    assert.equal(storage.data.get(KEY), normal)
    assert.equal(textOf($(document, '#progress-status')), 'Dữ liệu đã thay đổi ở tab khác nên chưa xóa gì.')
  }, { storage })
})

test('xóa dữ liệu phiên bản mới hơn thất bại (removeItem ném): thông báo lỗi và focus về chính nút đó, không rơi về <body>', async () => {
  const storage = memoryStorage({ initial: FUTURE, failRemove: true })

  await run(({ document }) => {
    openProgressPage(document)
    $(document, '#progress-clear-future').click()
    $(document, '#progress-confirm-future .progress-danger').click()

    assert.equal(
      textOf($(document, '#progress-status')),
      'Không xóa được dữ liệu khỏi trình duyệt. Lịch sử trong phiên này đã được làm mới.',
    )
    assert.ok(document.activeElement !== document.body, 'focus không được rơi về <body>')
    assert.ok(document.activeElement === $(document, '#progress-clear-future'), 'focus về nút xóa dữ liệu phiên bản mới hơn')
    assert.equal(storage.data.get(KEY), FUTURE)
  }, { storage })
})

test('không có đường nào xóa mà không qua xác nhận: bấm hai nút xóa chỉ mở khung', async () => {
  const storage = seed(SEEDED)

  await run(({ document }) => {
    openProgressPage(document)
    $(document, '#progress-clear').click()
    $(document, '#progress-clear-future').click()

    assert.equal(storage.data.has(KEY), true)
  }, { storage })
})

test('createConfirmBox là một thành phần dùng chung: cùng cấu trúc, chỉ khác chữ và hành động', () => {
  const window = new Window()
  const { document } = window

  try {
    const calls = []
    const box = createConfirmBox(document, { id: 'x', title: 'Tiêu đề?', message: 'Nội dung.', confirmLabel: 'Đồng ý', onConfirm: () => calls.push('ok') })

    document.body.append(box.element)
    assert.ok(box.element.hidden === true, 'mới tạo thì khung ẩn')
    box.open(null)
    assert.ok(box.element.hidden === false, 'open() hiện khung')
    box.element.querySelectorAll('button')[1].click()
    assert.deepEqual(calls, ['ok'])
    assert.ok(box.element.hidden === true, 'bấm xác nhận thì khung đóng')
  } finally {
    window.happyDOM.close()
  }
})

// --- Đa tab ---

test('tab khác đổi dữ liệu: chỉ vẽ lại vùng dữ liệu; khung xác nhận đang mở và focus không bị chạm', async () => {
  const storage = seed(SEEDED)

  await run(({ document, window }) => {
    openProgressPage(document)
    $(document, '#progress-clear').click()

    const box = $(document, '#progress-confirm-clear')
    const cancel = box.querySelector('button')
    const oldData = $(document, '#progress-data .progress-stats')

    storage.data.set(KEY, JSON.stringify({ version: 1, topics: { 'sorting:bubble': entry(1, 5, 9) } }))
    storageEvent(window)

    assert.ok($(document, '#progress-confirm-clear') === box, 'khung xác nhận vẫn là cùng một phần tử')
    assert.equal(box.hidden, false)
    assert.ok(document.activeElement === cancel, 'focus vẫn ở nút Hủy của khung đang mở')
    assert.ok($(document, '#progress-data .progress-stats') !== oldData, 'vùng dữ liệu đã được vẽ lại')
    assert.deepEqual(stats(document).slice(0, 2), ['Đã mở 1 / 12 chủ đề', 'Tổng lượt mở 9'])
  }, { storage })
})

test('tab khác xóa cả kho (key null): trang về trạng thái trống', async () => {
  const storage = seed(SEEDED)

  await run(({ document, window }) => {
    openProgressPage(document)
    storage.data.delete(KEY)
    storageEvent(window, null)

    assert.equal(stats(document)[0], 'Đã mở 0 / 12 chủ đề')
  }, { storage })
})

test('quay lại trang Tiến độ sau khi mở một chủ đề thấy ngay lần mở vừa ghi', async () => {
  await run(({ document }) => {
    openProgressPage(document)
    assert.equal(stats(document)[0], 'Đã mở 0 / 12 chủ đề')

    $(document, 'button[data-structure-nav="graph"]').click()
    openProgressPage(document)

    assert.equal(stats(document)[0], 'Đã mở 1 / 12 chủ đề')
    assert.equal(stats(document)[1], 'Tổng lượt mở 1')
  })
})

test('vẽ lại không ghi thêm gì vào kho', async () => {
  const storage = seed(SEEDED)

  await run(({ document, window }) => {
    openProgressPage(document)
    storageEvent(window)
    goTo(document, 'dashboard')
    openProgressPage(document)

    assert.equal(storage.setCalls, 0)
  }, { storage })
})

// --- Mở lại ---

const REOPEN = [
  { id: 'sorting:selection', name: 'Mở lại Selection Sort', section: '#sorting-section', count: 'sorting:selection' },
  { id: 'searching:binary', name: 'Mở lại Binary Search', section: '#search-section', count: 'searching:binary' },
  { id: 'structure:hash-table', name: 'Mở lại Hash Table', section: '#hash-table-section', count: 'structure:hash-table' },
]

for (const { id, name, section, count } of REOPEN) {
  test(`Mở lại ${id}: mở đúng màn chi tiết, đúng MỘT viewchange có topic, openCount +1 và lastOpenedAt cập nhật một lần, focus về #main-content`, async () => {
    const storage = seed({ [id]: entry(1000, 2000, 1) })
    const clock = { value: 5000 }

    await withFullApp(({ document }) => {
      openProgressPage(document)

      const events = []

      document.addEventListener('algovision:viewchange', (event) => events.push(event.detail))
      document.querySelector(`.progress-reopen[aria-label="${name}"]`).click()

      assert.equal(document.querySelector(section).hidden, false)
      assert.equal(document.querySelector('#progress-section').hidden, true)
      assert.equal(events.filter((detail) => detail.topic !== null).length, 1)
      assert.equal(events.filter((detail) => detail.topic === id).length, 1)
      assert.deepEqual(stored(storage).topics[count], { firstOpenedAt: 1000, lastOpenedAt: 5000, openCount: 2 })
      assert.equal(storage.setCalls, 1)
      assert.ok(document.activeElement === document.querySelector('#main-content'), 'sau Mở lại focus về #main-content')
    }, { storage, now: () => clock.value })
  })
}

test('Mở lại từ trang Tiến độ khi chủ đề thuộc Searching đổi cả #search-algorithm (change rồi viewchange) mà không đếm đôi', async () => {
  const storage = seed({ 'searching:binary': entry(1, 2, 1) })

  await run(({ document }) => {
    openProgressPage(document)
    document.querySelector('.progress-reopen[aria-label="Mở lại Binary Search"]').click()

    assert.equal($(document, '#search-algorithm').value, 'binary')
    assert.equal(stored(storage).topics['searching:binary'].openCount, 2)
  }, { storage })
})

test('nút "Mở Sắp xếp" ở trạng thái trống mở thư viện Sắp xếp, không ghi tiến độ, focus về #main-content', async () => {
  const storage = memoryStorage()

  await run(({ document }) => {
    openProgressPage(document)
    $(document, '#progress-data .dashboard-primary-button').click()

    assert.equal(isShown($(document, '.algorithm-section')), true)
    assert.equal(storage.setCalls, 0)
    assert.ok(document.activeElement === $(document, '#main-content'), 'sau Mở Sắp xếp focus về #main-content')
  }, { storage })
})

test('"Mở lại" ở hàng Mở gần đây cũng hoạt động và chỉ đếm một lần', async () => {
  const storage = seed({ 'structure:bst': entry(1, 2, 1) })

  await run(({ document }) => {
    openProgressPage(document)
    $(document, '#progress-data .progress-recent .progress-reopen').click()

    assert.equal(stored(storage).topics['structure:bst'].openCount, 2)
    assert.equal($(document, '#bst-section').hidden, false)
  }, { storage })
})

// --- "Mở lại" cho cả 12 chủ đề của catalog (bảng id -> màn chi tiết) ---

const DETAIL_SECTION = (id) => {
  const [kind, name] = id.split(':')

  return kind === 'sorting' ? '#sorting-section' : kind === 'searching' ? '#search-section' : `#${name}-section`
}
const ALL_TOPICS = [
  'sorting:bubble', 'sorting:selection', 'sorting:insertion',
  'searching:linear', 'searching:binary',
  'structure:array', 'structure:stack', 'structure:queue', 'structure:linked-list',
  'structure:bst', 'structure:hash-table', 'structure:graph',
]

for (const id of ALL_TOPICS) {
  test(`Mở lại ${id}: đúng màn chi tiết (breadcrumb khớp nhãn), openCount thành 2, đúng một lần ghi`, async () => {
    const storage = seed({ [id]: entry(1000, 2000, 1) })

    await run(({ document, progress }) => {
      openProgressPage(document)

      const label = progress.catalog.find((topic) => topic.id === id).label
      const button = $(document, `#progress-data .progress-group .progress-reopen[aria-label="Mở lại ${label}"]`)

      assert.ok(button !== null, `phải có nút Mở lại ${label}`)
      button.click()

      assert.equal($(document, DETAIL_SECTION(id)).hidden, false, `màn ${DETAIL_SECTION(id)} phải hiện`)
      assert.equal(textOf($(document, '.topbar .breadcrumb li:last-child')), label, 'breadcrumb nói đúng chủ đề vừa mở')
      assert.equal(stored(storage).topics[id].openCount, 2)
      assert.equal(Object.keys(stored(storage).topics).length, 1, 'không chủ đề nào khác bị ghi')
      assert.equal(storage.setCalls, 1)
    }, { storage })
  })
}

test('ô "Mở gần nhất" dùng <time datetime> như các hàng; "Chưa có" khi trống', async () => {
  await run(({ document }) => {
    openProgressPage(document)

    const time = $(document, '#progress-data .progress-stat:nth-child(3) time')

    assert.equal(time.getAttribute('datetime'), isoTimestamp(T3))
    assert.equal(textOf(time), formatOpenedAt(T3))
  }, { storage: seed(SEEDED) })

  await run(({ document }) => {
    openProgressPage(document)

    assert.ok($(document, '#progress-data .progress-stat:nth-child(3) time') === null, 'chưa có lần mở nào thì không có <time>')
    assert.equal(stats(document)[2], 'Mở gần nhất Chưa có')
  })
})
