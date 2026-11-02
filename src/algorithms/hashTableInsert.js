import { appendEntry, validateKey } from '../structures/hashTable.js'
import { createHashStepFactory, scanChain, scanProbes } from './hashTableStep.js'

// Chaining: phải duyệt hết chain để kiểm tra trùng, nên khóa mới được nối vào cuối chain.
// comparisons = số phần tử trong chain đã so khóa (chèn vào ô rỗng = 0, trùng ở vị trí p = p + 1).
export const chainingInsertPseudocode = [
  'i = key mod m',
  'for each e in bucket[i]:',
  '    if e.key == key:',
  '        return "đã tồn tại"',
  'thêm key vào cuối bucket[i]',
]

const LINE = {
  HASH: 1,
  COMPARE: 3,
  DUPLICATE: 4,
  APPEND: 5,
}

function generateChainingInsertSteps(table, key) {
  const createStep = createHashStepFactory('insert', key)
  const steps = [createStep({ table, message: `Bắt đầu chèn khóa ${key}.` })]
  const { index, match, pathEntryIds, comparisons } = scanChain({
    steps,
    createStep,
    table,
    key,
    lines: { hash: LINE.HASH, compare: LINE.COMPARE },
  })

  if (match) {
    steps.push(createStep({
      table,
      hashIndex: index,
      currentBucket: index,
      currentEntryId: match.id,
      foundEntryId: match.id,
      pathEntryIds: [...pathEntryIds],
      comparisons,
      pseudocodeLine: LINE.DUPLICATE,
      finished: true,
      result: 'duplicate',
      message: `Khóa ${key} đã tồn tại ở ô ${index}, bỏ qua.`,
    }))

    return steps
  }

  const { table: nextTable, id } = appendEntry(table, index, key)

  steps.push(createStep({
    table: nextTable,
    hashIndex: index,
    currentBucket: index,
    insertedEntryId: id,
    pathEntryIds: [...pathEntryIds],
    comparisons,
    pseudocodeLine: LINE.APPEND,
    finished: true,
    result: 'inserted',
    message: comparisons === 0
      ? `Ô ${index} rỗng, không có khóa để so sánh. Thêm ${key} vào ô ${index}.`
      : `Không có khóa nào bằng ${key}. Thêm ${key} vào cuối chain của ô ${index}.`,
  }))

  return steps
}

// Linear probing: dò tiếp qua tombstone (ghi nhớ tombstone đầu tiên làm vt) vì khóa có thể nằm phía sau,
// nên luôn kiểm tra trùng trước rồi mới kết luận đầy. "Bảng đầy" chỉ khi đã dò đủ m ô,
// không có ô trống, không có tombstone và khóa chưa tồn tại.
export const probingInsertPseudocode = [
  'i = key mod m; vt = null',
  'for j = 0 to m - 1:',
  '    p = (i + j) mod m',
  '    if T[p] trống: if vt == null: vt = p; dừng dò',
  '    if T[p] là tombstone: if vt == null: vt = p; tiếp tục',
  '    if T[p].key == key:',
  '        return "đã tồn tại"',
  'if vt == null: return "bảng đầy"',
  'T[vt] = key',
]

const PROBING_LINE = {
  HASH: 1,
  PROBE: 3,
  EMPTY: 4,
  TOMBSTONE: 5,
  COMPARE: 6,
  DUPLICATE: 7,
  FULL: 8,
  PLACE: 9,
}

function generateProbingInsertSteps(table, key) {
  const createStep = createHashStepFactory('insert', key)
  const steps = [createStep({ table, message: `Bắt đầu chèn khóa ${key}.` })]
  const { start, stop, index, match, firstFreeIndex, state } = scanProbes({
    steps,
    createStep,
    table,
    key,
    rememberFree: true,
    lines: {
      hash: PROBING_LINE.HASH,
      probe: PROBING_LINE.PROBE,
      tombstone: PROBING_LINE.TOMBSTONE,
      compare: PROBING_LINE.COMPARE,
    },
  })
  const common = {
    hashIndex: start,
    pathEntryIds: [...state.pathEntryIds],
    probedBuckets: [...state.probedBuckets],
    comparisons: state.comparisons,
    probes: state.probes,
  }

  if (match) {
    steps.push(createStep({
      ...common,
      table,
      currentBucket: index,
      currentEntryId: match.id,
      foundEntryId: match.id,
      pseudocodeLine: PROBING_LINE.DUPLICATE,
      finished: true,
      result: 'duplicate',
      message: `Khóa ${key} đã tồn tại ở ô ${index}, bỏ qua.`,
    }))

    return steps
  }

  const targetIndex = firstFreeIndex ?? (stop === 'empty' ? index : null)

  if (stop === 'empty') {
    steps.push(createStep({
      ...common,
      table,
      currentBucket: index,
      pseudocodeLine: PROBING_LINE.EMPTY,
      message: firstFreeIndex === null
        ? `Ô ${index} trống: ${key} chưa có trong bảng, vt = ${index}, dừng dò.`
        : `Ô ${index} trống: ${key} chưa có trong bảng, giữ vt = ${firstFreeIndex}, dừng dò.`,
    }))
  }

  if (targetIndex === null) {
    steps.push(createStep({
      ...common,
      table,
      pseudocodeLine: PROBING_LINE.FULL,
      finished: true,
      result: 'full',
      message: `Đã dò đủ ${table.capacity} ô: không có ô trống hay tombstone, bảng đầy.`,
    }))

    return steps
  }

  const { table: nextTable, id } = appendEntry(table, targetIndex, key)

  steps.push(createStep({
    ...common,
    table: nextTable,
    currentBucket: targetIndex,
    insertedEntryId: id,
    pseudocodeLine: PROBING_LINE.PLACE,
    finished: true,
    result: 'inserted',
    message: `Đặt ${key} vào ô ${targetIndex}.`,
  }))

  return steps
}

export function generateHashTableInsertSteps(table, key) {
  validateKey(key)
  return table.strategy === 'probing'
    ? generateProbingInsertSteps(table, key)
    : generateChainingInsertSteps(table, key)
}
