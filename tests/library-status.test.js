import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { withFullApp } from './helpers/app-dom.js'
import { memoryStorage } from './helpers/memory-storage.js'

// Redesign Phase 4: mỗi thẻ thư viện có .card-state "Đã mở" / "Chưa mở" đọc từ initProgress (không "đã học", không suy diễn).
// Chỉ vẽ khi dữ liệu tin được (trống hoặc ok): dữ liệu hỏng, phiên bản mới hơn hoặc storage không dùng được thì ẩn nhãn thay vì nói "Chưa mở".
const KEY = 'algovision:progress'
const textOf = (element) => element.textContent.replace(/\s+/g, ' ').trim()
const run = (callback, options = {}) => withFullApp(callback, { storage: memoryStorage(), ...options })
const goTo = (document, page) => document.querySelector(`.nav-item[data-page="${page}"]`).click()

const stateOf = (document, selector) => document.querySelector(`${selector} .card-state`)
const SORTING = (name) => `.algorithm-card[data-algorithm="${name}"]`
const SEARCH = (name) => `[data-search-algorithm="${name}"]`
const ALL = ['bubble', 'selection', 'insertion'].map(SORTING).concat(['linear', 'binary'].map(SEARCH))

const saved = (topics) => JSON.stringify({ version: 1, topics })
const entry = (openCount = 1) => ({ firstOpenedAt: 1_600_000_000_000, lastOpenedAt: 1_600_000_100_000, openCount })

test('chưa mở gì: cả 5 thẻ hiện "Chưa mở", không thẻ nào có class is-opened và không thẻ nào bị ẩn', async () => {
  await run(({ document }) => {
    for (const selector of ALL) {
      const state = stateOf(document, selector)

      assert.equal(textOf(state), 'Chưa mở', selector)
      assert.equal(state.classList.contains('is-opened'), false, selector)
      assert.equal(state.hidden, false, selector)
    }
  })
})

test('mở một chủ đề thì đúng thẻ của nó đổi sang "Đã mở" (có class is-opened), các thẻ khác giữ "Chưa mở"', async () => {
  await run(({ document }) => {
    goTo(document, 'sorting')
    document.querySelector(SORTING('selection')).click()

    for (const selector of ALL) {
      const opened = selector === SORTING('selection')
      const state = stateOf(document, selector)

      assert.equal(textOf(state), opened ? 'Đã mở' : 'Chưa mở', selector)
      assert.equal(state.classList.contains('is-opened'), opened, selector)
    }
  })
})

test('Tìm kiếm cũng cập nhật ngay: mở Binary Search thì chỉ thẻ Binary Search là "Đã mở"', async () => {
  await run(({ document }) => {
    goTo(document, 'searching')
    document.querySelector(SEARCH('binary')).click()

    assert.equal(textOf(stateOf(document, SEARCH('binary'))), 'Đã mở')
    assert.equal(textOf(stateOf(document, SEARCH('linear'))), 'Chưa mở')
  })
})

test('dữ liệu đã lưu từ lần trước: thẻ có trong storage hiện "Đã mở" ngay khi tải trang', async () => {
  const storage = memoryStorage({ initial: saved({ 'sorting:bubble': entry(3), 'searching:linear': entry() }) })

  await run(({ document }) => {
    assert.equal(textOf(stateOf(document, SORTING('bubble'))), 'Đã mở')
    assert.equal(textOf(stateOf(document, SEARCH('linear'))), 'Đã mở')
    assert.equal(textOf(stateOf(document, SORTING('insertion'))), 'Chưa mở')
  }, { storage })
})

test('xóa lịch sử đưa mọi thẻ về "Chưa mở"', async () => {
  const storage = memoryStorage({ initial: saved({ 'sorting:bubble': entry() }) })

  await run(({ document, progress }) => {
    assert.equal(textOf(stateOf(document, SORTING('bubble'))), 'Đã mở')

    progress.clear()

    for (const selector of ALL) assert.equal(textOf(stateOf(document, selector)), 'Chưa mở', selector)
  }, { storage })
})

test('tab khác đổi dữ liệu (sự kiện storage) thì thẻ cập nhật theo', async () => {
  const storage = memoryStorage()

  await run(({ document, window }) => {
    assert.equal(textOf(stateOf(document, SEARCH('binary'))), 'Chưa mở')

    storage.setItem(KEY, saved({ 'searching:binary': entry() }))
    window.dispatchEvent(new window.StorageEvent('storage', { key: KEY }))

    assert.equal(textOf(stateOf(document, SEARCH('binary'))), 'Đã mở')

    storage.removeItem(KEY)
    window.dispatchEvent(new window.StorageEvent('storage', { key: null }))

    assert.equal(textOf(stateOf(document, SEARCH('binary'))), 'Chưa mở')
  }, { storage })
})

const UNTRUSTED = [
  ['dữ liệu hỏng', () => memoryStorage({ initial: '{không phải json' })],
  ['dữ liệu của phiên bản mới hơn', () => memoryStorage({ initial: JSON.stringify({ version: 99, topics: {} }) })],
  ['storage không đọc được', () => memoryStorage({ failGet: true })],
]

for (const [name, makeStorage] of UNTRUSTED) {
  test(`${name}: nhãn trạng thái bị ẩn (không khẳng định "Chưa mở" khi không biết)`, async () => {
    await run(({ document }) => {
      for (const selector of ALL) assert.equal(stateOf(document, selector).hidden, true, selector)
    }, { storage: makeStorage() })
  })
}

test('nhãn hiện lại khi dữ liệu trở nên tin được (xóa dữ liệu hỏng bằng clear)', async () => {
  await run(({ document, progress }) => {
    assert.equal(stateOf(document, SORTING('bubble')).hidden, true)

    progress.clear()

    assert.equal(stateOf(document, SORTING('bubble')).hidden, false)
    assert.equal(textOf(stateOf(document, SORTING('bubble'))), 'Chưa mở')
  }, { storage: memoryStorage({ initial: '{không phải json' }) })
})

test('src/main.js khởi tạo trạng thái thẻ sau initProgress, bằng cùng đối tượng progress', async () => {
  const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8')

  assert.match(source, /import \{ initLibraryStatus \} from '\.\/library-status\.js'/)
  assert.ok(source.indexOf('initLibraryStatus(document, progress)') > source.indexOf('const progress = initProgress(document)'), 'phải gọi sau khi có progress')
})

test('từ ngữ của nhãn: chỉ "Đã mở" và "Chưa mở", không "đã học", "hoàn thành" hay phần trăm', async () => {
  const file = await readFile(new URL('../src/library-status.js', import.meta.url), 'utf8').catch(() => '')
  const source = file.replace(/\/\/.*$/gm, '') // bỏ comment: comment được phép nhắc từ cấm để giải thích

  assert.ok(file.length > 0, 'phải có src/library-status.js')
  assert.ok(!/đã học|hoàn thành|completed|streak|%/i.test(source), 'không dùng từ cấm của tiến độ')
})
