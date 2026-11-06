import test from 'node:test'
import assert from 'node:assert/strict'
import * as progress from '../src/progress-store.js'
import { deepFreeze } from './helpers/deep-freeze.js'

// Phần thuần của tiến độ học tập: không localStorage, không DOM. "Đã mở" là số lần vào màn chi tiết, không phải "hoàn thành".

const entry = (firstOpenedAt, lastOpenedAt, openCount) => ({ firstOpenedAt, lastOpenedAt, openCount })
const file = (topics, version = 1) => JSON.stringify({ version, topics })

test('hằng số hợp đồng: khóa, version, giới hạn kích thước và số lần mở', () => {
  assert.equal(progress.STORAGE_KEY, 'algovision:progress')
  assert.equal(progress.SCHEMA_VERSION, 1)
  assert.equal(progress.MAX_STORED_LENGTH, 16000)
  assert.equal(progress.MAX_OPEN_COUNT, 1000000)
})

test('emptyProgress: version 1, không chủ đề nào, mỗi lần gọi trả đối tượng mới', () => {
  const a = progress.emptyProgress()
  assert.deepEqual(a, { version: 1, topics: {} })
  a.topics['sorting:bubble'] = entry(1, 1, 1)
  assert.deepEqual(progress.emptyProgress(), { version: 1, topics: {} }, 'sửa bản này không được lọt sang bản khác')
})

test('topicId ghép loại và tên: loại:tên', () => {
  assert.equal(progress.topicId('sorting', 'bubble'), 'sorting:bubble')
  assert.equal(progress.topicId('searching', 'linear'), 'searching:linear')
  assert.equal(progress.topicId('structure', 'hash-table'), 'structure:hash-table')
})

test('recordOpen lần đầu: firstOpenedAt = lastOpenedAt = now, openCount = 1', () => {
  const next = progress.recordOpen(progress.emptyProgress(), 'sorting:bubble', 100)
  assert.deepEqual(next, { version: 1, topics: { 'sorting:bubble': entry(100, 100, 1) } })
})

test('recordOpen ba lần lúc 100, 250, 400 (số dò tay): first 100, last 400, count 3', () => {
  let state = progress.emptyProgress()
  for (const now of [100, 250, 400]) state = progress.recordOpen(state, 'structure:bst', now)
  assert.deepEqual(state.topics['structure:bst'], entry(100, 400, 3))
})

test('recordOpen: các chủ đề độc lập với nhau', () => {
  let state = progress.recordOpen(progress.emptyProgress(), 'sorting:bubble', 10)
  state = progress.recordOpen(state, 'searching:linear', 20)
  state = progress.recordOpen(state, 'sorting:bubble', 30)
  assert.deepEqual(state.topics, {
    'sorting:bubble': entry(10, 30, 2),
    'searching:linear': entry(20, 20, 1),
  })
})

test('recordOpen không sửa đầu vào (đóng băng) và trả đối tượng mới', () => {
  const before = deepFreeze(progress.recordOpen(progress.emptyProgress(), 'sorting:bubble', 100))
  const after = progress.recordOpen(before, 'sorting:bubble', 200)
  assert.deepEqual(before.topics['sorting:bubble'], entry(100, 100, 1))
  assert.deepEqual(after.topics['sorting:bubble'], entry(100, 200, 2))
  assert.notEqual(after, before)
})

test('recordOpen khi đồng hồ lùi: first = min, last = max, bất biến last >= first được giữ', () => {
  let state = progress.recordOpen(progress.emptyProgress(), 'sorting:bubble', 500)
  state = progress.recordOpen(state, 'sorting:bubble', 300)
  assert.deepEqual(state.topics['sorting:bubble'], entry(300, 500, 2))
})

test('recordOpen kẹp openCount ở MAX_OPEN_COUNT', () => {
  const state = { version: 1, topics: { 'sorting:bubble': entry(1, 2, progress.MAX_OPEN_COUNT) } }
  assert.equal(progress.recordOpen(state, 'sorting:bubble', 3).topics['sorting:bubble'].openCount, progress.MAX_OPEN_COUNT)
})

for (const bad of [Number.NaN, -1, 1.5, '5', null, undefined, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
  test(`recordOpen từ chối thời điểm không hợp lệ: ${String(bad)}`, () => {
    assert.throws(() => progress.recordOpen(progress.emptyProgress(), 'sorting:bubble', bad), RangeError)
  })
}

test('serializeProgress rồi parseProgress cho lại đúng dữ liệu (khứ hồi), status ok', () => {
  let state = progress.emptyProgress()
  state = progress.recordOpen(state, 'structure:bst', 100)
  state = progress.recordOpen(state, 'sorting:bubble', 200)
  state = progress.recordOpen(state, 'sorting:bubble', 300)
  const parsed = progress.parseProgress(progress.serializeProgress(state))
  assert.equal(parsed.status, 'ok')
  assert.deepEqual(parsed.progress, state)
})

test('serializeProgress sắp khóa theo thứ tự chữ để chuỗi ổn định', () => {
  let state = progress.recordOpen(progress.emptyProgress(), 'structure:bst', 1)
  state = progress.recordOpen(state, 'searching:linear', 2)
  state = progress.recordOpen(state, 'sorting:bubble', 3)
  assert.deepEqual(Object.keys(JSON.parse(progress.serializeProgress(state)).topics), [
    'searching:linear', 'sorting:bubble', 'structure:bst',
  ])
})

test('parseProgress: không có dữ liệu (null) là empty, tiến độ rỗng', () => {
  assert.deepEqual(progress.parseProgress(null), { progress: { version: 1, topics: {} }, status: 'empty' })
})

const CORRUPT_CASES = {
  'JSON cụt': '{',
  'mảng': '[]',
  'chuỗi JSON': '"x"',
  'null JSON': 'null',
  'số': '123',
  'thiếu version': JSON.stringify({ topics: {} }),
  'version là chuỗi': JSON.stringify({ version: '1', topics: {} }),
  'version 0': JSON.stringify({ version: 0, topics: {} }),
  'version âm': JSON.stringify({ version: -1, topics: {} }),
  'version không nguyên': JSON.stringify({ version: 1.5, topics: {} }),
  'thiếu topics': JSON.stringify({ version: 1 }),
  'topics là mảng': JSON.stringify({ version: 1, topics: [] }),
  'topics là null': JSON.stringify({ version: 1, topics: null }),
  'topics là chuỗi': JSON.stringify({ version: 1, topics: 'x' }),
  'quá dài': ' '.repeat(16001),
}

for (const [name, text] of Object.entries(CORRUPT_CASES)) {
  test(`parseProgress: ${name} là corrupt, tiến độ rỗng`, () => {
    assert.deepEqual(progress.parseProgress(text), { progress: { version: 1, topics: {} }, status: 'corrupt' })
  })
}

test('parseProgress: chuỗi dài đúng MAX_STORED_LENGTH vẫn đọc được', () => {
  const padded = file({ 'sorting:bubble': entry(1, 2, 3) }) + ' '.repeat(16000 - file({ 'sorting:bubble': entry(1, 2, 3) }).length)
  assert.equal(padded.length, 16000)
  assert.equal(progress.parseProgress(padded).status, 'ok')
})

test('parseProgress: không phải chuỗi (số, đối tượng) là corrupt', () => {
  assert.equal(progress.parseProgress(42).status, 'corrupt')
  assert.equal(progress.parseProgress({}).status, 'corrupt')
})

test('parseProgress: version lớn hơn hiểu được là future-version, không đọc dữ liệu', () => {
  const parsed = progress.parseProgress(file({ 'sorting:bubble': entry(1, 2, 3) }, 2))
  assert.deepEqual(parsed, { progress: { version: 1, topics: {} }, status: 'future-version' })
})

const BAD_ENTRIES = {
  'không phải đối tượng': 5,
  'mảng': [1, 2, 3],
  'null': null,
  'first âm': entry(-1, 5, 1),
  'first không nguyên': entry(1.5, 5, 1),
  'first là chuỗi': entry('1', 5, 1),
  'last nhỏ hơn first': entry(10, 5, 1),
  'count bằng 0': entry(1, 5, 0),
  'count âm': entry(1, 5, -2),
  'count là chuỗi': entry(1, 5, '3'),
  'count không nguyên': entry(1, 5, 2.5),
  'thiếu last': { firstOpenedAt: 1, openCount: 1 },
}

for (const [name, bad] of Object.entries(BAD_ENTRIES)) {
  test(`parseProgress bỏ mục sai (${name}) nhưng giữ mục đúng`, () => {
    const parsed = progress.parseProgress(file({ 'sorting:bubble': bad, 'searching:linear': entry(1, 2, 3) }))
    assert.equal(parsed.status, 'ok')
    assert.deepEqual(parsed.progress.topics, { 'searching:linear': entry(1, 2, 3) })
  })
}

test('parseProgress kẹp openCount quá MAX_OPEN_COUNT xuống MAX_OPEN_COUNT', () => {
  const parsed = progress.parseProgress(file({ 'sorting:bubble': entry(1, 2, 5000000) }))
  assert.equal(parsed.progress.topics['sorting:bubble'].openCount, 1000000)
})

test('parseProgress chỉ giữ trường của lược đồ, bỏ trường lạ', () => {
  const parsed = progress.parseProgress(file({ 'sorting:bubble': { ...entry(1, 2, 3), note: 'x', completed: true } }))
  assert.deepEqual(parsed.progress.topics['sorting:bubble'], entry(1, 2, 3))
})

for (const id of ['__proto__', 'constructor', 'bubble', 'sorting:', ':bubble', 'Sorting:Bubble', 'other:x', 'sorting:a:b', 'sorting:bubble ']) {
  test(`parseProgress bỏ id sai định dạng: "${id}"`, () => {
    const parsed = progress.parseProgress(`{"version":1,"topics":{${JSON.stringify(id)}:${JSON.stringify(entry(1, 2, 3))}}}`)
    assert.deepEqual(parsed.progress.topics, {})
    assert.equal(Object.getPrototypeOf(parsed.progress.topics), Object.prototype, 'không được đổi prototype')
    assert.equal({}.firstOpenedAt, undefined, 'không được làm bẩn Object.prototype')
  })
}

test('parseProgress giữ id đúng định dạng dù app không còn biết chủ đề đó', () => {
  const parsed = progress.parseProgress(file({ 'structure:tree': entry(1, 2, 3) }))
  assert.deepEqual(parsed.progress.topics, { 'structure:tree': entry(1, 2, 3) })
})

test('keepKnownTopics giữ chủ đề app còn biết, bỏ chủ đề đã xóa, không sửa đầu vào', () => {
  const state = deepFreeze({
    version: 1,
    topics: { 'sorting:bubble': entry(1, 2, 3), 'structure:tree': entry(4, 5, 6) },
  })
  const kept = progress.keepKnownTopics(state, new Set(['sorting:bubble', 'searching:linear']))
  assert.deepEqual(kept, { version: 1, topics: { 'sorting:bubble': entry(1, 2, 3) } })
  assert.equal(Object.keys(state.topics).length, 2)
})
