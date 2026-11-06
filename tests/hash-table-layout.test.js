import test from 'node:test'
import assert from 'node:assert/strict'

import { readFile } from 'node:fs/promises'

import * as layout from '../src/hash-table-layout.js'
import { collisionPresetKeys } from '../src/hash-table.js'
import { buildHashTable } from '../src/structures/hashTable.js'

const SAMPLE_KEYS = [15, 8, 22, 3, 11, 30]

test('HASH_TABLE_LAYOUT export kích thước cố định', () => {
  assert.deepEqual({ ...layout.HASH_TABLE_LAYOUT }, {
    LABEL_WIDTH: 44,
    CELL_WIDTH: 40,
    CELL_HEIGHT: 32,
    LINK_GAP: 10,
    ROW_HEIGHT: 48,
    PADDING: 8,
  })
})

test('Chaining: mỗi ô một hàng, phần tử nối sang phải theo vị trí trong chain', () => {
  const result = layout.computeHashTableLayout(buildHashTable(7, SAMPLE_KEYS))

  assert.equal(result.buckets.length, 7)
  assert.deepEqual(result.buckets[1], { index: 1, x: 44, y: 56, centerX: 64, centerY: 72 })
  assert.equal(result.buckets[6].centerY, 6 * 48 + 24)

  // ô 1 = [15 (e1), 8 (e2), 22 (e3)]: tâm x = 44 + 40 + 10 + 20 + p · (10 + 40) = 114 + 50p (trước: 120 + 56p)
  assert.deepEqual(result.entries.e1, { bucketIndex: 1, position: 0, centerX: 44 + 40 + 10 + 20, centerY: 72 })
  assert.equal(result.entries.e2.centerX, 44 + 40 + 10 + 20 + 1 * (10 + 40))
  assert.equal(result.entries.e3.centerX, 44 + 40 + 10 + 20 + 2 * (10 + 40))
  assert.equal(result.entries.e6.bucketIndex, 2, '30 nằm ở ô 2')

  // rộng = nhãn + ô đầu + 3 phần tử dài nhất + lề; cao = 7 hàng
  assert.equal(result.width, 44 + 40 + 3 * (10 + 40) + 8)
  assert.equal(result.height, 7 * 48)
})

test('Chaining bảng rỗng vẫn có đủ hàng và độ rộng tối thiểu của nhãn + ô đầu', () => {
  const result = layout.computeHashTableLayout(buildHashTable(5, []))

  assert.equal(result.buckets.length, 5)
  assert.deepEqual(result.entries, {})
  assert.equal(result.width, 44 + 40 + 8)
  assert.equal(result.height, 5 * 48)
})

test('Chain 15 phần tử (giới hạn giao diện) rộng hơn 360px: khung phải tự cuộn ngang', () => {
  const keys = Array.from({ length: 15 }, (_, k) => 3 + 7 * k)
  const result = layout.computeHashTableLayout(buildHashTable(7, keys))

  assert.equal(result.width, 44 + 40 + 15 * (10 + 40) + 8)
  assert.ok(result.width > 360)
})

test('Probing: phần tử nằm ngay trong ô của nó, không có chain', () => {
  const result = layout.computeHashTableLayout(buildHashTable(7, SAMPLE_KEYS, 'probing'))

  assert.equal(result.entries.e6.bucketIndex, 6)
  assert.equal(result.entries.e6.centerX, result.buckets[6].centerX)
  assert.equal(result.entries.e6.centerY, result.buckets[6].centerY)
  assert.equal(result.width, 44 + 40 + 8)
})

test('scrollTargetFor ưu tiên phần tử đang xét, rồi phần tử vừa chèn/tìm thấy, rồi ô đang xét', () => {
  const table = buildHashTable(7, SAMPLE_KEYS)
  const result = layout.computeHashTableLayout(table)
  const step = { currentEntryId: null, insertedEntryId: null, foundEntryId: null, currentBucket: null }

  assert.equal(layout.scrollTargetFor(result, step), null)
  assert.deepEqual(layout.scrollTargetFor(result, { ...step, currentBucket: 4 }), { x: 64, y: 216 })
  assert.deepEqual(layout.scrollTargetFor(result, { ...step, currentBucket: 1, foundEntryId: 'e3' }), { x: 44 + 40 + 10 + 20 + 2 * (10 + 40), y: 72 })
  assert.deepEqual(
    layout.scrollTargetFor(result, { ...step, currentBucket: 1, currentEntryId: 'e2', foundEntryId: 'e3' }),
    { x: 44 + 40 + 10 + 20 + 1 * (10 + 40), y: 72 },
  )
})

test('scrollTargetFor bỏ qua id không có trong layout (không ném lỗi, lùi về ô đang xét)', () => {
  const result = layout.computeHashTableLayout(buildHashTable(7, SAMPLE_KEYS))
  const step = { currentEntryId: 'e99', insertedEntryId: null, foundEntryId: null, currentBucket: 2 }

  assert.deepEqual(layout.scrollTargetFor(result, step), { x: 64, y: 120 })
})

// --- Ngân sách bề rộng: chuỗi dài nhất của preset va chạm phải vừa khung ở 1280px (R12) ---
// Trước đây LINK_GAP = 16: preset 14 khóa (m = 7) rộng 876px trong khung có nội dung 855px nên khung cuộn ngang 21px.
const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8')

function declaration(selector, property) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const block = css.match(new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`))

  if (!block) throw new Error(`style.css không có luật "${selector}" ở cấp trên cùng`)

  const value = block[1].match(new RegExp(`(?:^|[;\\s])${property}:\\s*([^;]+);`))

  if (!value) throw new Error(`luật "${selector}" không khai báo ${property}`)

  return value[1].trim().split(/\s+/)
}

const px = (token) => Number.parseFloat(token)
// padding: 1 giá trị = cả bốn cạnh; 2 hoặc 3 giá trị: giá trị thứ hai là trái/phải.
const horizontalPadding = (tokens) => px(tokens.length === 1 ? tokens[0] : tokens[1])
const borderWidth = (tokens) => px(tokens.find((token) => /^\d+(\.\d+)?px$/.test(token)))

// Bề rộng nội dung của #hash-table-frame ở viewport 1280px, suy từ chính style.css thay vì gõ chết.
// Nguồn đối chiếu: CDP (Chrome 152, Windows) 2026-11-06 cho khung clientWidth 877px và nội dung 861px ở 1280px có thanh cuộn
// dọc kiểu máy bàn 15px, với sidebar 256px + padding 40px của Redesign Phase 2. Trước Phase 2 (sidebar 250px + padding 46px):
// khung 871px, nội dung 855px (CDP 2026-11-05, bản rà soát Ubuntu cũng ra 871px). Chuỗi rộng nhất (15 khóa) là 842px.
const DESKTOP_VIEWPORT = 1280
const CLASSIC_SCROLLBAR = 15

function frameContentWidthAt1280() {
  const sidebar = px(declaration('.main-content', 'margin-left')[0])
  const mainPadding = horizontalPadding(declaration('.main-content', 'padding'))
  const cardPadding = horizontalPadding(declaration('.visualizer-placeholder', 'padding'))
  const cardBorder = borderWidth(declaration('.visualizer-placeholder', 'border'))
  const framePadding = horizontalPadding(declaration('.hash-table-frame', 'padding'))
  const frameBorder = borderWidth(declaration('.hash-table-frame', 'border'))

  return DESKTOP_VIEWPORT - CLASSIC_SCROLLBAR - sidebar - 2 * mainPadding - 2 * (cardPadding + cardBorder) - 2 * (frameBorder + framePadding)
}

test('preset va chạm chaining (mọi m) vừa nội dung của khung ở 1280px: không cuộn ngang', () => {
  const available = frameContentWidthAt1280()

  for (const capacity of [5, 7, 11]) {
    const keys = collisionPresetKeys(capacity, 'chaining')
    const result = layout.computeHashTableLayout(buildHashTable(capacity, keys))

    assert.ok(
      result.width <= available,
      `m = ${capacity}, ${keys.length} khóa: svg ${result.width}px phải <= nội dung khung ${available}px`,
    )
  }
})

test('preset va chạm: số khóa dò tay (m = 5 giới hạn 15 khóa, m = 7 là 14 khóa, m = 11 là 9 khóa)', () => {
  // khóa 3 + k·m <= 99: m = 5 có 20 khóa nhưng chaining dừng ở 15; m = 7: k <= 13 nên 14; m = 11: k <= 8 nên 9
  assert.equal(collisionPresetKeys(5, 'chaining').length, 15)
  assert.equal(collisionPresetKeys(7, 'chaining').length, 14)
  assert.equal(collisionPresetKeys(11, 'chaining').length, 9)
})
