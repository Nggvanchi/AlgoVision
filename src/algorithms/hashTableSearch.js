import { validateKey } from '../structures/hashTable.js'
import { createHashStepFactory, scanChain, scanProbes } from './hashTableStep.js'

// Chaining: comparisons = số phần tử trong chain đã so khóa, gồm phần tử tìm thấy;
// bước kết luận "không tìm thấy" không so sánh nên không tăng.
export const chainingSearchPseudocode = [
  'i = key mod m',
  'for each e in bucket[i]:',
  '    if e.key == key:',
  '        return e',
  'return "không tìm thấy"',
]

const LINE = {
  HASH: 1,
  COMPARE: 3,
  FOUND: 4,
  NOT_FOUND: 5,
}

function generateChainingSearchSteps(table, key) {
  const createStep = createHashStepFactory('search', key)
  const steps = [createStep({ table, message: `Bắt đầu tìm khóa ${key}.` })]
  const { index, match, pathEntryIds, comparisons } = scanChain({
    steps,
    createStep,
    table,
    key,
    lines: { hash: LINE.HASH, compare: LINE.COMPARE },
  })

  steps.push(createStep({
    table,
    hashIndex: index,
    currentBucket: index,
    currentEntryId: match?.id ?? null,
    foundEntryId: match?.id ?? null,
    pathEntryIds: [...pathEntryIds],
    comparisons,
    pseudocodeLine: match ? LINE.FOUND : LINE.NOT_FOUND,
    finished: true,
    result: match ? 'found' : 'not-found',
    message: notFoundOrFoundMessage(key, index, match, comparisons),
  }))

  return steps
}

function notFoundOrFoundMessage(key, index, match, comparisons) {
  if (match) return `Đã tìm thấy ${key} ở ô ${index}.`
  if (comparisons === 0) return `Ô ${index} rỗng, không có khóa để so sánh: không tìm thấy ${key}.`
  return `Không tìm thấy ${key}: đã so sánh hết ${comparisons} phần tử của ô ${index}.`
}

// Linear probing: probes = số ô đã dò (gồm ô trống/tombstone), comparisons = số ô có khóa đã so.
// Dừng khi gặp ô trống (dòng 4), khi khớp (dòng 7) hoặc sau đúng m lần dò (dòng 8).
export const probingSearchPseudocode = [
  'i = key mod m',
  'for j = 0 to m - 1:',
  '    p = (i + j) mod m',
  '    if T[p] trống: return "không tìm thấy"',
  '    if T[p] là tombstone: tiếp tục',
  '    if T[p].key == key:',
  '        return p',
  'return "không tìm thấy"',
]

const PROBING_LINE = {
  HASH: 1,
  PROBE: 3,
  EMPTY: 4,
  TOMBSTONE: 5,
  COMPARE: 6,
  FOUND: 7,
  EXHAUSTED: 8,
}

function generateProbingSearchSteps(table, key) {
  const createStep = createHashStepFactory('search', key)
  const steps = [createStep({ table, message: `Bắt đầu tìm khóa ${key}.` })]
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
  const conclusion = {
    match: {
      line: PROBING_LINE.FOUND,
      result: 'found',
      message: `Đã tìm thấy ${key} ở ô ${index} sau ${state.probes} lần dò.`,
    },
    empty: {
      line: PROBING_LINE.EMPTY,
      result: 'not-found',
      message: `Ô ${index} trống nên ${key} không thể nằm xa hơn: không tìm thấy.`,
    },
    exhausted: {
      line: PROBING_LINE.EXHAUSTED,
      result: 'not-found',
      message: `Đã dò đủ ${table.capacity} ô mà không thấy ${key}: không tìm thấy.`,
    },
  }[stop]

  steps.push(createStep({
    table,
    hashIndex: start,
    currentBucket: index,
    currentEntryId: match?.id ?? null,
    foundEntryId: match?.id ?? null,
    pathEntryIds: [...state.pathEntryIds],
    probedBuckets: [...state.probedBuckets],
    comparisons: state.comparisons,
    probes: state.probes,
    pseudocodeLine: conclusion.line,
    finished: true,
    result: conclusion.result,
    message: conclusion.message,
  }))

  return steps
}

export function generateHashTableSearchSteps(table, key) {
  validateKey(key)
  return table.strategy === 'probing'
    ? generateProbingSearchSteps(table, key)
    : generateChainingSearchSteps(table, key)
}
