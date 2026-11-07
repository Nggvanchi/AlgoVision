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

test('đăng ký đúng một listener sự kiện storage, trên window (giao diện đọc tiến độ cần biết tab khác đổi dữ liệu)', () => {
  const window = new Window()
  const { document } = window
  const registered = []

  try {
    document.body.innerHTML = template
    for (const target of [window, document]) {
      const original = target.addEventListener.bind(target)
      target.addEventListener = (type, ...rest) => {
        registered.push([target === window ? 'window' : 'document', type])
        return original(type, ...rest)
      }
    }
    initNavigation(document)
    progressInit.initProgress(document, { storage: memoryStorage() })
    assert.ok(registered.some(([, type]) => type === 'algovision:viewchange'), 'phải nghe algovision:viewchange')
    assert.deepEqual(registered.filter(([, type]) => type === 'storage'), [['window', 'storage']])
  } finally {
    window.happyDOM.close()
  }
})

// --- subscribe, catalog, readState (giao diện đọc tiến độ dựa vào đây) ---

const storageEvent = (window, key) => new window.StorageEvent('storage', { key })

test('catalog: 12 chủ đề {id, label, kind} lấy từ chính thẻ trong template, nhãn đã rút gọn khoảng trắng', async () => {
  await withFullApp(({ document, progress }) => {
    assert.equal(progress.catalog.length, 12)
    assert.deepEqual(progress.catalog.map((topic) => topic.id).sort(), [...ALL_TOPICS].sort())
    assert.deepEqual(
      [...new Set(progress.catalog.map((topic) => topic.kind))].sort(),
      ['searching', 'sorting', 'structure'],
    )

    const byId = Object.fromEntries(progress.catalog.map((topic) => [topic.id, topic]))
    const text = (selector) => document.querySelector(selector).textContent.replace(/\s+/g, ' ').trim()

    assert.equal(byId['sorting:bubble'].label, text('.algorithm-card[data-algorithm="bubble"] h4'))
    assert.equal(byId['searching:binary'].label, text('[data-search-algorithm="binary"] h4'))
    assert.equal(byId['structure:hash-table'].label, text('[data-structure-target="hash-table"] .structure-card-title'))
    assert.ok(progress.catalog.every((topic) => topic.label !== '' && !/\s{2,}/.test(topic.label)))
  }, { storage: memoryStorage() })
})

test('catalog đi theo template, không có danh sách thứ hai: thẻ thêm trước init xuất hiện với nhãn của thẻ', () => {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    document.querySelector('#structure-library').insertAdjacentHTML(
      'beforeend',
      '<button type="button" data-structure-target="demo"><span class="structure-card-title"> Cây   Demo </span></button>',
    )
    initNavigation(document)

    const progress = progressInit.initProgress(document, { storage: memoryStorage() })

    assert.deepEqual(progress.catalog.find((topic) => topic.id === 'structure:demo'), {
      id: 'structure:demo', label: 'Cây Demo', kind: 'structure',
    })
  } finally {
    window.happyDOM.close()
  }
})

test('readState: trả { progress, status, persisted } của kho và đi cùng clear()', async () => {
  await withFullApp(({ document, progress }) => {
    assert.deepEqual(progress.readState(), { progress: { version: 1, topics: {} }, status: 'empty', persisted: true })
    openSorting(document, 'bubble')
    assert.equal(progress.readState().status, 'ok')
    assert.deepEqual(Object.keys(progress.readState().progress.topics), ['sorting:bubble'])
  }, { storage: memoryStorage() })
})

test('subscribe: gọi sau MỖI lần mở chủ đề, và lúc gọi thì đã đọc được lần mở vừa ghi', async () => {
  await withFullApp(({ document, progress }) => {
    const seen = []
    progress.subscribe(() => seen.push(Object.keys(progress.read().topics)))

    openSorting(document, 'bubble')
    assert.deepEqual(seen, [['sorting:bubble']])
    openStructure(document, 'bst')
    assert.deepEqual(seen, [['sorting:bubble'], ['sorting:bubble', 'structure:bst']])
  }, { storage: memoryStorage() })
})

test('subscribe: thứ tự listener viewchange không ảnh hưởng (đăng ký trước hay sau initProgress đều thấy lần mở)', async () => {
  await withFullApp(({ document, progress }) => {
    let opens = null
    document.addEventListener('algovision:viewchange', () => {
      opens = Object.keys(progress.read().topics).length
    })
    const calls = []
    progress.subscribe(() => calls.push(Object.keys(progress.read().topics).length))
    openStructure(document, 'graph')
    assert.deepEqual(calls, [1])
    assert.ok(opens !== null)
  }, { storage: memoryStorage() })
})

test('subscribe: không gọi khi đổi trang, bấm Quay lại, hay mở chủ đề app không biết', async () => {
  await withFullApp(({ document, progress }) => {
    let calls = 0
    progress.subscribe(() => { calls += 1 })

    for (const page of ['sorting', 'searching', 'structures', 'dashboard']) goTo(document, page)
    emitViewChange(document, { page: 'structures', topic: 'structure:ghost' })
    assert.equal(calls, 0)
  }, { storage: memoryStorage() })
})

test('subscribe: gọi đúng một lần sau clear() ở tab này, kể cả khi storage từ chối xóa', async () => {
  for (const storage of [memoryStorage(), memoryStorage({ failRemove: true })]) {
    await withFullApp(({ progress }) => {
      let calls = 0
      progress.subscribe(() => { calls += 1 })
      progress.clear()
      assert.equal(calls, 1)
    }, { storage })
  }
})

test('subscribe: recordOpen gọi trực tiếp trên kết quả của initProgress cũng thông báo', async () => {
  await withFullApp(({ progress }) => {
    let calls = 0
    progress.subscribe(() => { calls += 1 })
    assert.equal(progress.recordOpen('structure:bst'), true)
    assert.equal(calls, 1)
  }, { storage: memoryStorage() })
})

test('subscribe: sự kiện storage với khóa algovision:progress và với key null (clear() ở tab khác) đều thông báo', async () => {
  await withFullApp(({ window, progress }) => {
    let calls = 0
    progress.subscribe(() => { calls += 1 })

    window.dispatchEvent(storageEvent(window, KEY))
    assert.equal(calls, 1)
    window.dispatchEvent(storageEvent(window, null))
    assert.equal(calls, 2)
  }, { storage: memoryStorage() })
})

test('subscribe: bỏ qua sự kiện storage của khóa khác', async () => {
  await withFullApp(({ window, progress }) => {
    let calls = 0
    progress.subscribe(() => { calls += 1 })

    window.dispatchEvent(storageEvent(window, 'khac'))
    window.dispatchEvent(storageEvent(window, ''))
    window.dispatchEvent(storageEvent(window, 'algovision:progress2'))
    window.dispatchEvent(new window.Event('storage'))
    assert.equal(calls, 0)
  }, { storage: memoryStorage() })
})

test('subscribe: trả về hàm hủy đăng ký; hủy hai lần không ném', async () => {
  await withFullApp(({ document, window, progress }) => {
    let calls = 0
    const unsubscribe = progress.subscribe(() => { calls += 1 })

    openSorting(document, 'bubble')
    assert.equal(calls, 1)
    unsubscribe()
    unsubscribe()
    openStructure(document, 'bst')
    window.dispatchEvent(storageEvent(window, KEY))
    progress.clear()
    assert.equal(calls, 1)
  }, { storage: memoryStorage() })
})

test('subscribe: người nghe ném lỗi không làm hỏng điều hướng, ghi tiến độ hay người nghe khác', async () => {
  await withFullApp(({ document, window, progress }) => {
    let calls = 0
    progress.subscribe(() => { throw new Error('hỏng') })
    progress.subscribe(() => { calls += 1 })

    openSorting(document, 'bubble')
    assert.equal(document.querySelector('#sorting-section').hidden, false)
    window.dispatchEvent(storageEvent(window, null))
    progress.clear()
    assert.equal(calls, 3)
  }, { storage: memoryStorage() })
})

test('subscribe: hủy đăng ký ngay trong lúc được gọi không làm bỏ sót người nghe kế tiếp', async () => {
  await withFullApp(({ window, progress }) => {
    const order = []
    const first = progress.subscribe(() => { order.push('a'); first() })
    progress.subscribe(() => order.push('b'))

    window.dispatchEvent(storageEvent(window, KEY))
    window.dispatchEvent(storageEvent(window, KEY))
    assert.deepEqual(order, ['a', 'b', 'b'])
  }, { storage: memoryStorage() })
})

test('storage không dùng được: subscribe vẫn hoạt động và readState báo unavailable', async () => {
  await withFullApp(({ document, progress }) => {
    let calls = 0
    progress.subscribe(() => { calls += 1 })
    openSorting(document, 'bubble')
    assert.equal(calls, 1)
    assert.equal(progress.readState().status, 'unavailable')
    assert.equal(progress.readState().persisted, false)
  }, { storage: null })
})
