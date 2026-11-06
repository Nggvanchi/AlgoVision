import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { withFullApp, template } from './helpers/app-dom.js'
import { memoryStorage } from './helpers/memory-storage.js'
import { initNavigation } from '../src/navigation.js'
import * as progressInit from '../src/progress-init.js'

// initProgress nối algovision:viewchange (detail.topic) với kho tiến độ. Chỉ ghi khi MỞ màn chi tiết một chủ đề.

const KEY = 'algovision:progress'
const ALL_TOPICS = [
  'sorting:bubble', 'sorting:selection', 'sorting:insertion',
  'searching:linear', 'searching:binary',
  'structure:array', 'structure:stack', 'structure:queue', 'structure:linked-list',
  'structure:bst', 'structure:hash-table', 'structure:graph',
]

const goTo = (document, page) => document.querySelector(`.nav-item[data-page="${page}"]`).click()
const stored = (storage) => JSON.parse(storage.data.get(KEY))
const counts = (storage) => Object.fromEntries(
  Object.entries(stored(storage).topics).map(([id, entry]) => [id, entry.openCount]),
)

function openSorting(document, name) {
  goTo(document, 'sorting')
  document.querySelector(`.algorithm-card[data-algorithm="${name}"]`).click()
}

function openSearching(document, name) {
  goTo(document, 'searching')
  document.querySelector(`[data-search-algorithm="${name}"]`).click()
}

function openStructure(document, name) {
  goTo(document, 'structures')
  document.querySelector(`[data-structure-target="${name}"]`).click()
}

function changeSearchSelect(document, value) {
  const select = document.querySelector('#search-algorithm')
  select.value = value
  select.dispatchEvent(new document.defaultView.Event('change', { bubbles: true }))
}

function emitViewChange(document, detail) {
  document.dispatchEvent(new document.defaultView.CustomEvent('algovision:viewchange', { detail }))
}

test('một click thẻ Sắp xếp (thẻ có hai listener) ghi đúng một lần với openCount 1', async () => {
  const storage = memoryStorage()
  await withFullApp(({ document }) => {
    openSorting(document, 'selection')
    assert.equal(storage.setCalls, 1)
    assert.deepEqual(counts(storage), { 'sorting:selection': 1 })
  }, { storage })
})

test('một click thẻ Tìm kiếm (có change rồi viewchange) ghi đúng một lần, không đếm đôi', async () => {
  const storage = memoryStorage()
  await withFullApp(({ document }) => {
    openSearching(document, 'binary')
    assert.equal(storage.setCalls, 1)
    assert.deepEqual(counts(storage), { 'searching:binary': 1 })
  }, { storage })
})

test('một click thẻ cấu trúc ghi đúng một lần', async () => {
  const storage = memoryStorage()
  await withFullApp(({ document }) => {
    openStructure(document, 'hash-table')
    assert.equal(storage.setCalls, 1)
    assert.deepEqual(counts(storage), { 'structure:hash-table': 1 })
  }, { storage })
})

test('mở đủ 12 chủ đề thật: mỗi chủ đề được ghi đúng một lần', async () => {
  const storage = memoryStorage()
  await withFullApp(({ document }) => {
    for (const name of ['bubble', 'selection', 'insertion']) openSorting(document, name)
    for (const name of ['linear', 'binary']) openSearching(document, name)
    for (const name of ['array', 'stack', 'queue', 'linked-list', 'bst', 'hash-table', 'graph']) openStructure(document, name)
    assert.deepEqual(Object.keys(stored(storage).topics).sort(), [...ALL_TOPICS].sort())
    assert.ok(Object.values(counts(storage)).every((count) => count === 1), 'mỗi chủ đề mở một lần thì openCount là 1')
    assert.equal(storage.setCalls, 12)
  }, { storage })
})

test('chỉ đổi trang và bấm Quay lại: không ghi gì', async () => {
  const storage = memoryStorage()
  await withFullApp(({ document }) => {
    for (const page of ['sorting', 'searching', 'structures', 'dashboard']) goTo(document, page)
    document.querySelector('.dashboard-primary-button[data-dashboard-target="sorting"]').click()
    openStructure(document, 'bst')
    storage.setCalls = 0
    document.querySelector('#bst-section [data-back-to-structures]').click()
    goTo(document, 'dashboard')
    assert.equal(storage.setCalls, 0)
  }, { storage })
})

test('quay lại thư viện rồi mở lại cùng chủ đề: openCount tăng thành 2', async () => {
  const storage = memoryStorage()
  await withFullApp(({ document }) => {
    openStructure(document, 'bst')
    document.querySelector('#bst-section [data-back-to-structures]').click()
    document.querySelector('[data-structure-target="bst"]').click()
    assert.deepEqual(counts(storage), { 'structure:bst': 2 })
  }, { storage })
})

test('cùng một viewchange (cùng topic) phát lại liên tiếp không đếm đôi', async () => {
  const storage = memoryStorage()
  await withFullApp(({ document }) => {
    emitViewChange(document, { page: 'structures', topic: 'structure:bst' })
    emitViewChange(document, { page: 'structures', topic: 'structure:bst' })
    assert.deepEqual(counts(storage), { 'structure:bst': 1 })
    emitViewChange(document, { page: 'structures', topic: null })
    emitViewChange(document, { page: 'structures', topic: 'structure:bst' })
    assert.deepEqual(counts(storage), { 'structure:bst': 2 })
  }, { storage })
})

test('đổi #search-algorithm khi đang ở chi tiết Tìm kiếm: tính là mở chủ đề mới', async () => {
  const storage = memoryStorage()
  await withFullApp(({ document }) => {
    openSearching(document, 'linear')
    changeSearchSelect(document, 'binary')
    assert.deepEqual(counts(storage), { 'searching:linear': 1, 'searching:binary': 1 })
    changeSearchSelect(document, 'linear')
    assert.deepEqual(counts(storage), { 'searching:linear': 2, 'searching:binary': 1 })
  }, { storage })
})

test('sự kiện change của #search-algorithm mà giá trị không đổi: không đếm thêm', async () => {
  const storage = memoryStorage()
  await withFullApp(({ document }) => {
    openSearching(document, 'binary')
    storage.setCalls = 0
    changeSearchSelect(document, 'binary')
    assert.equal(storage.setCalls, 0)
    assert.deepEqual(counts(storage), { 'searching:binary': 1 })
  }, { storage })
})

test('đổi #search-algorithm không phát thêm viewchange (không làm mô phỏng tự pause)', async () => {
  await withFullApp(({ document }) => {
    openSearching(document, 'linear')
    const events = []
    document.addEventListener('algovision:viewchange', (event) => events.push(event.detail))
    changeSearchSelect(document, 'binary')
    assert.deepEqual(events, [])
  }, { storage: memoryStorage() })
})

test('đổi #search-algorithm khi không ở chi tiết Tìm kiếm (thư viện, trang khác, chi tiết cấu trúc): không ghi', async () => {
  const storage = memoryStorage()
  await withFullApp(({ document }) => {
    goTo(document, 'searching')
    changeSearchSelect(document, 'binary')

    openSearching(document, 'linear')
    document.querySelector('[data-back-to-search-algorithms]').click()
    storage.setCalls = 0
    changeSearchSelect(document, 'binary')
    assert.equal(storage.setCalls, 0, 'đã về thư viện thì currentTopic phải là null')

    openStructure(document, 'bst')
    storage.setCalls = 0
    changeSearchSelect(document, 'linear')
    assert.equal(storage.setCalls, 0, 'đang ở chi tiết cấu trúc thì không ghi chủ đề tìm kiếm')

    goTo(document, 'dashboard')
    changeSearchSelect(document, 'binary')
    assert.equal(storage.setCalls, 0)
  }, { storage })
})

test('viewchange không có detail (như test khác phát) không ném và đặt lại chủ đề hiện tại', async () => {
  const storage = memoryStorage()
  await withFullApp(({ document }) => {
    openSearching(document, 'linear')
    document.dispatchEvent(new document.defaultView.CustomEvent('algovision:viewchange'))
    storage.setCalls = 0
    changeSearchSelect(document, 'binary')
    assert.equal(storage.setCalls, 0)
  }, { storage })
})

test('topic app không biết: không ghi', async () => {
  const storage = memoryStorage()
  await withFullApp(({ document }) => {
    emitViewChange(document, { page: 'structures', topic: 'structure:ghost' })
    assert.equal(storage.setCalls, 0)
  }, { storage })
})

test('danh sách chủ đề suy ra từ template lúc khởi động, không gõ tay: thẻ thêm trước init được ghi, thêm sau thì không', () => {
  const window = new Window()
  const { document } = window
  const storage = memoryStorage()

  try {
    document.body.innerHTML = template
    document.body.insertAdjacentHTML('beforeend', '<section id="demo-section" hidden></section>')
    document.querySelector('#structure-library').insertAdjacentHTML(
      'beforeend', '<button type="button" data-structure-target="demo">Demo</button>',
    )
    initNavigation(document)
    progressInit.initProgress(document, { storage })

    openStructure(document, 'demo')
    assert.deepEqual(counts(storage), { 'structure:demo': 1 })

    document.body.insertAdjacentHTML('beforeend', '<section id="late-section" hidden></section>')
    document.querySelector('#structure-library').insertAdjacentHTML(
      'beforeend', '<button type="button" data-structure-target="late">Late</button>',
    )
    emitViewChange(document, { page: 'structures', topic: 'structure:late' })
    assert.deepEqual(counts(storage), { 'structure:demo': 1 })
  } finally {
    window.happyDOM.close()
  }
})

test('initProgress trả về kho: read() thấy chủ đề đã mở, clear() xóa sạch', async () => {
  const storage = memoryStorage()
  await withFullApp(({ document, progress }) => {
    openSorting(document, 'bubble')
    assert.deepEqual(Object.keys(progress.read().topics), ['sorting:bubble'])
    assert.equal(progress.clear(), true)
    assert.deepEqual(progress.read(), { version: 1, topics: {} })
    assert.equal(storage.data.has(KEY), false)
  }, { storage })
})

test('mặc định dùng localStorage của cửa sổ, khóa algovision:progress', async () => {
  await withFullApp(({ document, window }) => {
    openSorting(document, 'insertion')
    const saved = JSON.parse(window.localStorage.getItem(KEY))
    assert.equal(saved.version, 1)
    assert.deepEqual(Object.keys(saved.topics), ['sorting:insertion'])
  })
})

test('dữ liệu cũ hỏng trong storage: app mở bình thường và lần mở kế tiếp ghi đè', async () => {
  const storage = memoryStorage({ initial: '{hỏng' })
  await withFullApp(({ document }) => {
    openSorting(document, 'bubble')
    assert.equal(document.querySelector('#sorting-section').hidden, false)
    assert.deepEqual(counts(storage), { 'sorting:bubble': 1 })
  }, { storage })
})

test('storage không dùng được (setItem ném, getItem ném, null): mở mọi loại màn chi tiết vẫn bình thường', async () => {
  for (const storage of [memoryStorage({ failSet: true }), memoryStorage({ failGet: true }), null]) {
    await withFullApp(({ document }) => {
      openSorting(document, 'bubble')
      assert.equal(document.querySelector('#sorting-section').hidden, false)
      openSearching(document, 'binary')
      assert.equal(document.querySelector('#search-section').hidden, false)
      changeSearchSelect(document, 'linear')
      openStructure(document, 'graph')
      assert.equal(document.querySelector('#graph-section').hidden, false)
    }, { storage })
  }
})

test('truy cập window.localStorage ném lỗi (cửa sổ riêng tư/bị chặn): app vẫn chạy, không ném', () => {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    Object.defineProperty(window, 'localStorage', {
      get() { throw new window.DOMException('bị chặn', 'SecurityError') },
    })
    initNavigation(document)
    progressInit.initProgress(document)
    openStructure(document, 'bst')
    assert.equal(document.querySelector('#bst-section').hidden, false)
  } finally {
    window.happyDOM.close()
  }
})

test('không đăng ký sự kiện storage (chưa có giao diện đọc tiến độ)', () => {
  const window = new Window()
  const { document } = window
  const registered = []

  try {
    document.body.innerHTML = template
    for (const target of [window, document]) {
      const original = target.addEventListener.bind(target)
      target.addEventListener = (type, ...rest) => {
        registered.push(type)
        return original(type, ...rest)
      }
    }
    initNavigation(document)
    progressInit.initProgress(document, { storage: memoryStorage() })
    assert.ok(registered.includes('algovision:viewchange'), 'phải nghe algovision:viewchange')
    assert.ok(!registered.includes('storage'), 'không được nghe sự kiện storage')
  } finally {
    window.happyDOM.close()
  }
})
