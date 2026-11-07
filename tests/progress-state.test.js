import test from 'node:test'
import assert from 'node:assert/strict'
import * as progress from '../src/progress-store.js'
import { memoryStorage } from './helpers/memory-storage.js'

// readState() cho giao diện đọc tiến độ: ngoài dữ liệu còn cho biết TRẠNG THÁI của kho (rỗng, ok, hỏng, không dùng được,
// version mới hơn) và dữ liệu có được lưu bền không (persisted). read() giữ nguyên hành vi cũ.

const KNOWN = ['sorting:bubble', 'sorting:selection', 'searching:linear', 'structure:bst']
const KEY = progress.STORAGE_KEY

function clock(...times) {
  let index = 0
  return () => times[Math.min(index++, times.length - 1)]
}

function makeStore(storage, now = clock(1000)) {
  return progress.createProgressStore({ storage, knownTopics: KNOWN, now })
}

const entry = (firstOpenedAt, lastOpenedAt, openCount) => ({ firstOpenedAt, lastOpenedAt, openCount })
const EMPTY = { version: 1, topics: {} }

test('chưa có dữ liệu: status empty, persisted true, tiến độ rỗng, không ghi gì', () => {
  const storage = memoryStorage()
  const state = makeStore(storage).readState()
  assert.deepEqual(state, { progress: EMPTY, status: 'empty', persisted: true })
  assert.equal(storage.setCalls, 0)
})

test('có dữ liệu hợp lệ: status ok, persisted true, chỉ giữ chủ đề app còn biết', () => {
  const storage = memoryStorage({ initial: JSON.stringify({
    version: 1,
    topics: { 'sorting:bubble': entry(5, 9, 3), 'structure:tree': entry(1, 2, 4) },
  }) })
  const state = makeStore(storage).readState()
  assert.equal(state.status, 'ok')
  assert.equal(state.persisted, true)
  assert.deepEqual(state.progress, { version: 1, topics: { 'sorting:bubble': entry(5, 9, 3) } })
})

test('JSON hỏng: status corrupt, persisted true, tiến độ rỗng, không xóa dữ liệu khi đọc', () => {
  const storage = memoryStorage({ initial: '{không phải json' })
  const state = makeStore(storage).readState()
  assert.deepEqual(state, { progress: EMPTY, status: 'corrupt', persisted: true })
  assert.equal(storage.data.get(KEY), '{không phải json')
  assert.equal(storage.setCalls, 0)
})

test('version mới hơn: status future-version, persisted false, không ghi đè và không xóa dữ liệu', () => {
  const future = JSON.stringify({ version: 2, topics: { 'sorting:bubble': entry(1, 2, 3) } })
  const storage = memoryStorage({ initial: future })
  const state = makeStore(storage).readState()
  assert.deepEqual(state, { progress: EMPTY, status: 'future-version', persisted: false })
  assert.equal(storage.data.get(KEY), future)
  assert.equal(storage.setCalls, 0)
})

test('version mới hơn: lần mở trong phiên vẫn hiện ở readState, kho vẫn nguyên', () => {
  const future = JSON.stringify({ version: 2, topics: {} })
  const storage = memoryStorage({ initial: future })
  const store = makeStore(storage, clock(700))
  assert.equal(store.recordOpen('sorting:bubble'), false)
  const state = store.readState()
  assert.equal(state.status, 'future-version')
  assert.equal(state.persisted, false)
  assert.deepEqual(state.progress.topics, { 'sorting:bubble': entry(700, 700, 1) })
  assert.equal(storage.data.get(KEY), future)
})

test('storage = null: status unavailable, persisted false, lần mở trong phiên vẫn hiện', () => {
  const store = makeStore(null, clock(300))
  assert.deepEqual(store.readState(), { progress: EMPTY, status: 'unavailable', persisted: false })
  store.recordOpen('structure:bst')
  const state = store.readState()
  assert.equal(state.status, 'unavailable')
  assert.equal(state.persisted, false)
  assert.deepEqual(state.progress.topics, { 'structure:bst': entry(300, 300, 1) })
})

test('getItem ném lỗi: status unavailable, persisted false, không ném ra ngoài', () => {
  const store = makeStore(memoryStorage({ failGet: true }))
  assert.deepEqual(store.readState(), { progress: EMPTY, status: 'unavailable', persisted: false })
})

test('setItem ném lỗi: kho đọc được nhưng persisted false, dữ liệu phiên vẫn hiện; ghi thành công lại thì persisted true', () => {
  const storage = memoryStorage()
  const store = makeStore(storage, clock(100, 200))
  storage.failSet = true

  assert.equal(store.recordOpen('sorting:bubble'), false)
  let state = store.readState()
  assert.equal(state.status, 'empty')
  assert.equal(state.persisted, false)
  assert.deepEqual(state.progress.topics, { 'sorting:bubble': entry(100, 100, 1) })

  storage.failSet = false
  assert.equal(store.recordOpen('sorting:bubble'), true)
  state = store.readState()
  assert.equal(state.status, 'ok')
  assert.equal(state.persisted, true)
})

test('readState().progress luôn bằng read() ở mọi trạng thái', () => {
  const future = JSON.stringify({ version: 2, topics: {} })
  const stores = [
    makeStore(memoryStorage()),
    makeStore(memoryStorage({ initial: '{' })),
    makeStore(memoryStorage({ initial: future })),
    makeStore(null),
    makeStore(memoryStorage({ failGet: true })),
    makeStore(memoryStorage({ initial: JSON.stringify({ version: 1, topics: { 'sorting:bubble': entry(5, 9, 3) } }) })),
  ]
  for (const store of stores) assert.deepEqual(store.readState().progress, store.read())
})

test('readState không đổi bộ nhớ phiên: gọi nhiều lần cho cùng kết quả và không ghi', () => {
  const storage = memoryStorage({ initial: JSON.stringify({ version: 1, topics: { 'sorting:bubble': entry(5, 9, 3) } }) })
  const store = makeStore(storage)
  const first = store.readState()
  const second = store.readState()
  assert.deepEqual(first, second)
  assert.equal(storage.setCalls, 0)
})

test('sau clear(): readState trả empty và persisted true khi kho dùng được', () => {
  const storage = memoryStorage({ initial: JSON.stringify({ version: 1, topics: { 'sorting:bubble': entry(5, 9, 3) } }) })
  const store = makeStore(storage)
  assert.equal(store.clear(), true)
  assert.deepEqual(store.readState(), { progress: EMPTY, status: 'empty', persisted: true })
})
