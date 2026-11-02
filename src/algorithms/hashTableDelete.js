import { removeEntry, validateKey } from '../structures/hashTable.js'
import { createHashStepFactory, scanChain, scanProbes } from './hashTableStep.js'

// Chaining: comparisons = số phần tử trong chain đã so khóa, gồm phần tử bị xóa;
// bước kết luận "không tìm thấy" không tăng. Bước xóa làm phần tử biến mất khỏi bảng,
// nên mọi trường trỏ tới nó (currentEntryId, foundEntryId, pathEntryIds) được gỡ ở chính bước đó.
export const chainingDeletePseudocode = [
  'i = key mod m',
  'for each e in bucket[i]:',
  '    if e.key == key:',
  '        xóa e khỏi bucket[i]; return',
  'return "không tìm thấy"',
]

const LINE = {
  HASH: 1,
  COMPARE: 3,
  REMOVE: 4,
  NOT_FOUND: 5,
}

function generateChainingDeleteSteps(table, key) {
  const createStep = createHashStepFactory('delete', key)
  const steps = [createStep({ table, message: `Bắt đầu xóa khóa ${key}.` })]
  const { index, match, pathEntryIds, comparisons } = scanChain({
    steps,
    createStep,
    table,
    key,
    lines: { hash: LINE.HASH, compare: LINE.COMPARE },
  })

  if (match) {
    steps.push(createStep({
      table: removeEntry(table, match.id),
      hashIndex: index,
      currentBucket: index,
      pathEntryIds: pathEntryIds.filter((id) => id !== match.id),
      comparisons,
      pseudocodeLine: LINE.REMOVE,
      finished: true,
      result: 'deleted',
      message: `Đã xóa ${key} khỏi ô ${index}.`,
    }))

    return steps
  }

  steps.push(createStep({
    table,
    hashIndex: index,
    currentBucket: index,
    pathEntryIds: [...pathEntryIds],
    comparisons,
    pseudocodeLine: LINE.NOT_FOUND,
    finished: true,
    result: 'not-found',
    message: comparisons === 0
      ? `Ô ${index} rỗng, không có khóa để so sánh: không có ${key} để xóa.`
      : `Không tìm thấy ${key} sau ${comparisons} phép so sánh ở ô ${index}, bảng giữ nguyên.`,
  }))

  return steps
}

// Linear probing: xóa bằng tombstone chứ không đặt ô về trống. Nếu đặt về trống, chuỗi dò của
// các khóa đã bị đẩy qua ô này sẽ bị cắt: Search dừng ở ô trống và báo nhầm "không tìm thấy".
export const probingDeletePseudocode = [
  'i = key mod m',
  'for j = 0 to m - 1:',
  '    p = (i + j) mod m',
  '    if T[p] trống: return "không tìm thấy"',
  '    if T[p] là tombstone: tiếp tục',
  '    if T[p].key == key:',
  '        T[p] = tombstone; return',
  'return "không tìm thấy"',
]

const PROBING_LINE = {
  HASH: 1,
  PROBE: 3,
  EMPTY: 4,
  TOMBSTONE: 5,
  COMPARE: 6,
  REMOVE: 7,
  EXHAUSTED: 8,
}

function generateProbingDeleteSteps(table, key) {
  const createStep = createHashStepFactory('delete', key)
  const steps = [createStep({ table, message: `Bắt đầu xóa khóa ${key}.` })]
  const { start, stop, index, match, state } = scanProbes({
    steps,
    createStep,
    table,
    key,
    lines: {
      hash: PROBING_LINE.HASH,
      probe: PROBING_LINE.PROBE,
      tombstone: PROBING_LINE.TOMBSTONE,
      compare: PROBING_LINE.COMPARE,
    },
  })
  const common = {
    hashIndex: start,
    currentBucket: index,
    probedBuckets: [...state.probedBuckets],
    comparisons: state.comparisons,
    probes: state.probes,
    finished: true,
  }

  if (match) {
    steps.push(createStep({
      ...common,
      table: removeEntry(table, match.id),
      pathEntryIds: state.pathEntryIds.filter((id) => id !== match.id),
      pseudocodeLine: PROBING_LINE.REMOVE,
      result: 'deleted',
      message: `Đã xóa ${key}: ô ${index} thành tombstone để các khóa phía sau vẫn tìm được.`,
    }))

    return steps
  }

  steps.push(createStep({
    ...common,
    table,
    pathEntryIds: [...state.pathEntryIds],
    pseudocodeLine: stop === 'empty' ? PROBING_LINE.EMPTY : PROBING_LINE.EXHAUSTED,
    result: 'not-found',
    message: stop === 'empty'
      ? `Ô ${index} trống: không có ${key} để xóa, bảng giữ nguyên.`
      : `Đã dò đủ ${table.capacity} ô mà không thấy ${key}: bảng giữ nguyên.`,
  }))

  return steps
}

export function generateHashTableDeleteSteps(table, key) {
  validateKey(key)
  return table.strategy === 'probing'
    ? generateProbingDeleteSteps(table, key)
    : generateChainingDeleteSteps(table, key)
}
