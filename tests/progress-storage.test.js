import test from 'node:test'
import assert from 'node:assert/strict'
import * as progress from '../src/progress-store.js'

// Lớp bao quanh phần thuần: storage được inject (không localStorage thật, không DOM).
// Mọi hàm của kho không được ném: ghi tiến độ không bao giờ được phá app.

const KNOWN = ['sorting:bubble', 'sorting:selection', 'searching:linear', 'structure:bst']
const KEY = 'algovision:progress'

// Storage giả có thể ném lỗi ở từng thao tác và đếm số lần ghi.
function memoryStorage({ initial, failGet = false, failSet = false, failRemove = false } = {}) {
  const data = new Map(initial === undefined ? [] : [[KEY, initial]])
  return {
    data,
    failSet,
    setCalls: 0,
    getItem(key) {
      if (failGet) throw new Error('SecurityError')
      return data.has(key) ? data.get(key) : null
    },
    setItem(key, value) {
      this.setCalls += 1
      if (this.failSet) throw new Error('QuotaExceededError')
      data.set(key, String(value))
    },
    removeItem(key) {
      if (failRemove) throw new Error('SecurityError')
      data.delete(key)
    },
  }
}

function clock(...times) {
  let index = 0
  return () => times[Math.min(index++, times.length - 1)]
}

function makeStore(storage, now = clock(1000)) {
  return progress.createProgressStore({ storage, knownTopics: KNOWN, now })
}

const stored = (storage) => JSON.parse(storage.data.get(KEY))
const entry = (firstOpenedAt, lastOpenedAt, openCount) => ({ firstOpenedAt, lastOpenedAt, openCount })

test('chưa có dữ liệu: read() trả tiến độ rỗng và không ghi gì', () => {
  const storage = memoryStorage()
  const store = makeStore(storage)
  assert.deepEqual(store.read(), { version: 1, topics: {} })
  assert.equal(storage.setCalls, 0)
  assert.equal(storage.data.has(KEY), false)
})

test('recordOpen ghi vào khóa algovision:progress theo lược đồ version 1 và trả true', () => {
  const storage = memoryStorage()
  const store = makeStore(storage, clock(100))
  assert.equal(store.recordOpen('sorting:bubble'), true)
  assert.deepEqual(stored(storage), { version: 1, topics: { 'sorting:bubble': entry(100, 100, 1) } })
  assert.deepEqual(store.read().topics, { 'sorting:bubble': entry(100, 100, 1) })
})

test('recordOpen dùng đồng hồ inject và cộng dồn qua nhiều lần mở (100, 250, 400)', () => {
  const storage = memoryStorage()
  const store = makeStore(storage, clock(100, 250, 400))
  store.recordOpen('structure:bst')
  store.recordOpen('structure:bst')
  store.recordOpen('structure:bst')
  assert.deepEqual(stored(storage).topics['structure:bst'], entry(100, 400, 3))
})

test('recordOpen với chủ đề app không biết: trả false và không ghi', () => {
  const storage = memoryStorage()
  const store = makeStore(storage)
  assert.equal(store.recordOpen('structure:tree'), false)
  assert.equal(store.recordOpen(''), false)
  assert.equal(storage.setCalls, 0)
})

test('dữ liệu cũ của chủ đề đã bị xóa khỏi app: read() ẩn đi, nhưng lần ghi sau vẫn giữ nguyên trong storage', () => {
  const storage = memoryStorage({ initial: JSON.stringify({
    version: 1,
    topics: { 'structure:tree': entry(1, 2, 3), 'sorting:bubble': entry(5, 6, 7) },
  }) })
  const store = makeStore(storage, clock(900))
  assert.deepEqual(Object.keys(store.read().topics), ['sorting:bubble'])
  store.recordOpen('searching:linear')
  assert.deepEqual(stored(storage).topics['structure:tree'], entry(1, 2, 3))
  assert.deepEqual(stored(storage).topics['searching:linear'], entry(900, 900, 1))
})

test('JSON hỏng: read() trả rỗng, không xóa khóa khi đọc; lần ghi hợp lệ kế tiếp ghi đè', () => {
  const storage = memoryStorage({ initial: '{hỏng' })
  const store = makeStore(storage, clock(50))
  assert.deepEqual(store.read(), { version: 1, topics: {} })
  assert.equal(storage.data.get(KEY), '{hỏng', 'đọc không được sửa hay xóa khóa hỏng')
  assert.equal(store.recordOpen('sorting:bubble'), true)
  assert.deepEqual(stored(storage), { version: 1, topics: { 'sorting:bubble': entry(50, 50, 1) } })
})

test('getItem trả giá trị không phải chuỗi (số): coi là hỏng, không ném', () => {
  const store = makeStore({ getItem: () => 42, setItem() {}, removeItem() {} })
  assert.deepEqual(store.read(), { version: 1, topics: {} })
})

test('version lạ (lớn hơn hiểu được): không ghi đè dữ liệu, recordOpen trả false, phiên vẫn thấy lần mở của mình', () => {
  const future = JSON.stringify({ version: 2, topics: { 'sorting:bubble': { opened: 'dạng mới' } } })
  const storage = memoryStorage({ initial: future })
  const store = makeStore(storage, clock(70))
  assert.deepEqual(store.read(), { version: 1, topics: {} }, 'không đọc dữ liệu version lạ')
  assert.equal(store.recordOpen('sorting:bubble'), false)
  assert.equal(storage.data.get(KEY), future, 'khóa version lạ phải còn nguyên')
  assert.equal(storage.setCalls, 0)
  assert.deepEqual(store.read().topics, { 'sorting:bubble': entry(70, 70, 1) })
})

test('getItem ném lỗi (cửa sổ riêng tư/bị chặn): không ném ra ngoài, read() rỗng, recordOpen trả false, phiên vẫn nhớ', () => {
  const storage = memoryStorage({ failGet: true })
  const store = makeStore(storage, clock(10))
  assert.deepEqual(store.read(), { version: 1, topics: {} })
  assert.equal(store.recordOpen('sorting:bubble'), false)
  assert.equal(storage.setCalls, 0)
  assert.deepEqual(store.read().topics, { 'sorting:bubble': entry(10, 10, 1) })
})

test('storage = null (không truy cập được localStorage): mọi hàm vẫn chạy, không ném', () => {
  const store = makeStore(null, clock(10, 20))
  assert.deepEqual(store.read(), { version: 1, topics: {} })
  assert.equal(store.recordOpen('sorting:bubble'), false)
  assert.equal(store.recordOpen('sorting:bubble'), false)
  assert.deepEqual(store.read().topics, { 'sorting:bubble': entry(10, 20, 2) })
  assert.equal(store.clear(), false)
  assert.deepEqual(store.read(), { version: 1, topics: {} })
})

test('setItem ném (hết quota): recordOpen trả false, không ném, read() vẫn thấy dữ liệu của phiên', () => {
  const storage = memoryStorage({ failSet: true })
  const store = makeStore(storage, clock(10, 20))
  assert.equal(store.recordOpen('sorting:bubble'), false)
  assert.equal(store.recordOpen('sorting:bubble'), false)
  assert.equal(storage.setCalls, 2, 'mỗi lần mở thử ghi đúng một lần, không thử lại vô hạn')
  assert.deepEqual(store.read().topics, { 'sorting:bubble': entry(10, 20, 2) })
})

test('lỗi ghi chỉ là tạm thời: sau lần ghi thành công read() lại đọc từ storage và thấy dữ liệu tab khác', () => {
  const storage = memoryStorage({ failSet: true })
  const store = makeStore(storage, clock(10, 20))
  assert.equal(store.recordOpen('sorting:bubble'), false)
  storage.failSet = false
  assert.equal(store.recordOpen('sorting:bubble'), true)
  storage.data.set(KEY, JSON.stringify({ version: 1, topics: {
    'sorting:bubble': entry(10, 20, 1), 'searching:linear': entry(30, 30, 1),
  } }))
  assert.deepEqual(Object.keys(store.read().topics).sort(), ['searching:linear', 'sorting:bubble'])
})

test('đồng hồ trả giá trị không hợp lệ: recordOpen trả false, không ghi, không ném', () => {
  const storage = memoryStorage()
  const store = makeStore(storage, () => Number.NaN)
  assert.equal(store.recordOpen('sorting:bubble'), false)
  assert.equal(storage.setCalls, 0)
})

test('đồng hồ lỗi không làm read() bỏ qua dữ liệu thật trong storage (đồng hồ hỏng không phải lỗi ghi)', () => {
  const storage = memoryStorage({ initial: JSON.stringify({ version: 1, topics: { 'sorting:bubble': entry(1, 2, 3) } }) })
  const store = makeStore(storage, () => Number.NaN)
  assert.equal(store.recordOpen('searching:linear'), false)
  assert.deepEqual(store.read().topics, { 'sorting:bubble': entry(1, 2, 3) })
})

test('đồng hồ ném lỗi: recordOpen trả false, không ném', () => {
  const store = makeStore(memoryStorage(), () => { throw new Error('clock') })
  assert.equal(store.recordOpen('sorting:bubble'), false)
})

test('hai tab dùng chung storage: mỗi lần ghi đọc lại rồi ghi, nên không đè mất lần mở của tab kia', () => {
  const storage = memoryStorage()
  const tabA = makeStore(storage, clock(100, 300))
  const tabB = makeStore(storage, clock(200))
  tabA.recordOpen('sorting:bubble')
  tabB.recordOpen('sorting:bubble')
  tabA.recordOpen('searching:linear')
  assert.deepEqual(stored(storage).topics, {
    'sorting:bubble': entry(100, 200, 2),
    'searching:linear': entry(300, 300, 1),
  })
  assert.deepEqual(tabB.read().topics, stored(storage).topics, 'tab B đọc lại thấy cả phần của tab A')
})

test('clear() xóa khóa, trả true, và read() rỗng', () => {
  const storage = memoryStorage()
  const store = makeStore(storage)
  store.recordOpen('sorting:bubble')
  assert.equal(store.clear(), true)
  assert.equal(storage.data.has(KEY), false)
  assert.deepEqual(store.read(), { version: 1, topics: {} })
})

test('clear() xóa cả dữ liệu hỏng và dữ liệu version lạ (người dùng chủ động xóa)', () => {
  for (const initial of ['{hỏng', JSON.stringify({ version: 9, topics: {} })]) {
    const storage = memoryStorage({ initial })
    assert.equal(makeStore(storage).clear(), true)
    assert.equal(storage.data.has(KEY), false)
  }
})

test('clear() xóa cả bản nhớ của phiên khi storage không dùng được', () => {
  const store = makeStore(memoryStorage({ failSet: true }), clock(10))
  store.recordOpen('sorting:bubble')
  store.clear()
  assert.deepEqual(store.read(), { version: 1, topics: {} })
})

test('removeItem ném lỗi: clear() trả false, không ném', () => {
  const store = makeStore(memoryStorage({ failRemove: true }))
  assert.equal(store.clear(), false)
})

test('đủ 12 chủ đề với mốc thời gian lớn vẫn nhỏ hơn giới hạn đọc MAX_STORED_LENGTH', () => {
  const ids = [
    'sorting:bubble', 'sorting:selection', 'sorting:insertion', 'searching:linear', 'searching:binary',
    'structure:array', 'structure:stack', 'structure:queue', 'structure:linked-list', 'structure:bst',
    'structure:hash-table', 'structure:graph',
  ]
  const storage = memoryStorage()
  const store = progress.createProgressStore({ storage, knownTopics: ids, now: () => Number.MAX_SAFE_INTEGER })
  for (const id of ids) assert.equal(store.recordOpen(id), true)
  assert.equal(Object.keys(store.read().topics).length, 12)
  assert.ok(storage.data.get(KEY).length < 2000, `12 chủ đề phải rất nhỏ so với ${progress.MAX_STORED_LENGTH} ký tự`)
})
