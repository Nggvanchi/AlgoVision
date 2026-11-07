import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as summary from '../src/progress-summary.js'
import { deepFreeze } from './helpers/deep-freeze.js'

// Hàm thuần tóm tắt tiến độ "đã mở" cho trang Tiến độ và khối Dashboard. Số mong đợi dò tay từ dữ liệu bên dưới.

const CATALOG = [
  { id: 'sorting:bubble', label: 'Bubble Sort', kind: 'sorting' },
  { id: 'sorting:selection', label: 'Selection Sort', kind: 'sorting' },
  { id: 'sorting:insertion', label: 'Insertion Sort', kind: 'sorting' },
  { id: 'searching:linear', label: 'Linear Search', kind: 'searching' },
  { id: 'searching:binary', label: 'Binary Search', kind: 'searching' },
  { id: 'structure:array', label: 'Array', kind: 'structure' },
  { id: 'structure:stack', label: 'Stack', kind: 'structure' },
  { id: 'structure:queue', label: 'Queue', kind: 'structure' },
  { id: 'structure:linked-list', label: 'Linked List', kind: 'structure' },
  { id: 'structure:bst', label: 'Binary Search Tree', kind: 'structure' },
  { id: 'structure:hash-table', label: 'Hash Table', kind: 'structure' },
  { id: 'structure:graph', label: 'Graph', kind: 'structure' },
]

const entry = (firstOpenedAt, lastOpenedAt, openCount) => ({ firstOpenedAt, lastOpenedAt, openCount })

// 4 chủ đề đã mở trong catalog + 1 id app không còn biết (structure:tree).
const PROGRESS = {
  version: 1,
  topics: {
    'sorting:bubble': entry(1000, 5000, 3),
    'sorting:insertion': entry(2000, 2000, 1),
    'searching:binary': entry(3000, 9000, 2),
    'structure:bst': entry(4000, 9000, 5),
    'structure:tree': entry(1, 1, 7),
  },
}

test('catalog 12 chủ đề, 4 đã mở: opened 4, total 12, tổng lượt mở 3+1+2+5 = 11, mở gần nhất 9000', () => {
  const result = summary.summarizeProgress(deepFreeze(structuredClone(PROGRESS)), deepFreeze(structuredClone(CATALOG)))
  assert.equal(result.total, 12)
  assert.equal(result.opened, 4)
  assert.equal(result.totalOpens, 11)
  assert.equal(result.lastOpenedAt, 9000)
})

test('chủ đề không có trong catalog (structure:tree) không tính vào tổng, số đã mở hay lượt mở', () => {
  const result = summary.summarizeProgress(PROGRESS, CATALOG)
  assert.equal(result.totalOpens, 11, 'không cộng 7 lượt của structure:tree')
  assert.ok(!result.recent.some((topic) => topic.id === 'structure:tree'))
  assert.ok(!result.groups.some((group) => group.topics.some((topic) => topic.id === 'structure:tree')))
})

test('ba nhóm theo thứ tự Sắp xếp, Tìm kiếm, Cấu trúc dữ liệu với đã mở / tổng 2/3, 1/2, 1/7', () => {
  const result = summary.summarizeProgress(PROGRESS, CATALOG)
  assert.deepEqual(
    result.groups.map(({ kind, label, opened, total }) => ({ kind, label, opened, total })),
    [
      { kind: 'sorting', label: 'Sắp xếp', opened: 2, total: 3 },
      { kind: 'searching', label: 'Tìm kiếm', opened: 1, total: 2 },
      { kind: 'structure', label: 'Cấu trúc dữ liệu', opened: 1, total: 7 },
    ],
  )
})

test('mỗi nhóm liệt kê đủ chủ đề theo thứ tự catalog; chủ đề chưa mở có opened false và số liệu null', () => {
  const result = summary.summarizeProgress(PROGRESS, CATALOG)
  const sorting = result.groups[0].topics
  assert.deepEqual(sorting.map((topic) => topic.id), ['sorting:bubble', 'sorting:selection', 'sorting:insertion'])
  assert.deepEqual(sorting[0], {
    id: 'sorting:bubble', label: 'Bubble Sort', opened: true, openCount: 3, firstOpenedAt: 1000, lastOpenedAt: 5000,
  })
  assert.deepEqual(sorting[1], {
    id: 'sorting:selection', label: 'Selection Sort', opened: false, openCount: 0, firstOpenedAt: null, lastOpenedAt: null,
  })
  assert.equal(result.groups[2].topics.length, 7)
})

test('danh sách gần đây: lastOpenedAt giảm dần, hòa thì theo id tăng dần (searching:binary trước structure:bst)', () => {
  const result = summary.summarizeProgress(PROGRESS, CATALOG)
  assert.deepEqual(
    result.recent.map((topic) => topic.id),
    ['searching:binary', 'structure:bst', 'sorting:bubble', 'sorting:insertion'],
  )
})

test('hòa lastOpenedAt: sắp theo id chứ không theo thứ tự catalog (insertion đứng trước selection dù catalog ghi selection trước)', () => {
  const tied = { version: 1, topics: { 'sorting:selection': entry(7000, 7000, 1), 'sorting:insertion': entry(7000, 7000, 1) } }
  const result = summary.summarizeProgress(tied, CATALOG)
  assert.deepEqual(result.recent.map((topic) => topic.id), ['sorting:insertion', 'sorting:selection'])
})

test('chưa mở gì: opened 0, tổng lượt mở 0, lastOpenedAt null, recent rỗng, vẫn đủ 12 chủ đề', () => {
  const result = summary.summarizeProgress({ version: 1, topics: {} }, CATALOG)
  assert.equal(result.opened, 0)
  assert.equal(result.totalOpens, 0)
  assert.equal(result.lastOpenedAt, null)
  assert.deepEqual(result.recent, [])
  assert.equal(result.total, 12)
  assert.equal(result.groups.reduce((sum, group) => sum + group.topics.length, 0), 12)
})

test('catalog rỗng hoặc chủ đề có kind lạ: bỏ qua kind lạ, không ném', () => {
  assert.equal(summary.summarizeProgress(PROGRESS, []).total, 0)
  const odd = [...CATALOG, { id: 'graph:x', label: 'Lạ', kind: 'khac' }]
  const result = summary.summarizeProgress(PROGRESS, odd)
  assert.equal(result.total, 12, 'kind lạ không vào tổng')
})

test('không sửa đầu vào (đầu vào đóng băng)', () => {
  assert.doesNotThrow(() => summary.summarizeProgress(deepFreeze(structuredClone(PROGRESS)), deepFreeze(structuredClone(CATALOG))))
})

// 2026-11-06T19:30:00Z = 02:30 ngày 07/11/2026 ở UTC+7 (Asia/Ho_Chi_Minh không có giờ mùa hè).
const AT_1930Z = Date.UTC(2026, 10, 6, 19, 30)
const NOW = Date.UTC(2026, 10, 7, 12, 0)

test('formatOpenedAt: dd/mm/yyyy hh:mm theo múi giờ truyền vào (Asia/Ho_Chi_Minh = UTC+7)', () => {
  assert.equal(summary.formatOpenedAt(AT_1930Z, { now: NOW, timeZone: 'Asia/Ho_Chi_Minh' }), '07/11/2026 02:30')
  assert.equal(summary.formatOpenedAt(AT_1930Z, { now: NOW, timeZone: 'UTC' }), '06/11/2026 19:30')
})

test('formatOpenedAt: nửa đêm là 00:00 chứ không phải 24:00', () => {
  const midnightLocal = Date.UTC(2026, 10, 6, 17, 0)
  assert.equal(summary.formatOpenedAt(midnightLocal, { now: NOW, timeZone: 'Asia/Ho_Chi_Minh' }), '07/11/2026 00:00')
})

test('formatOpenedAt: mốc ở tương lai (đồng hồ lệch) hiện "Vừa xong"; bằng đúng now thì vẫn định dạng', () => {
  assert.equal(summary.formatOpenedAt(NOW + 1, { now: NOW, timeZone: 'UTC' }), 'Vừa xong')
  assert.equal(summary.formatOpenedAt(NOW, { now: NOW, timeZone: 'UTC' }), '07/11/2026 12:00')
})

test('formatOpenedAt: giá trị không hợp lệ trả chuỗi rỗng, không ném', () => {
  for (const bad of [null, undefined, NaN, -1, '123', 1.5, Infinity]) {
    assert.equal(summary.formatOpenedAt(bad, { now: NOW, timeZone: 'UTC' }), '', String(bad))
  }
})

test('isoTimestamp trả chuỗi ISO 8601 UTC cho thuộc tính datetime của <time>; không hợp lệ trả chuỗi rỗng', () => {
  assert.equal(summary.isoTimestamp(AT_1930Z), '2026-11-06T19:30:00.000Z')
  assert.equal(summary.isoTimestamp(null), '')
  assert.equal(summary.isoTimestamp(NaN), '')
})

test('progress-summary.js không dùng chữ hoàn thành/completed/streak/chuỗi ngày/thời gian học và không có dấu phần trăm', async () => {
  const text = await readFile(new URL('../src/progress-summary.js', import.meta.url), 'utf8')
  assert.ok(!/completed|hoàn thành|streak|chuỗi ngày|thời gian học|%/i.test(text), 'mã tiến độ chỉ nói "đã mở"')
  assert.ok(!/\b(document|window|localStorage|sessionStorage)\b/.test(text), 'hàm thuần: không DOM, không kho trình duyệt')
})
