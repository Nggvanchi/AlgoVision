import { validateKey } from '../structures/hashTable.js'
import { assertStrategy, createHashStepFactory, scanChain } from './hashTableStep.js'

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

export function generateHashTableSearchSteps(table, key) {
  validateKey(key)
  assertStrategy(table, 'chaining')

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
