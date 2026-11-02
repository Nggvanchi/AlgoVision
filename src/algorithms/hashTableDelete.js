import { removeEntry, validateKey } from '../structures/hashTable.js'
import { assertStrategy, createHashStepFactory, scanChain } from './hashTableStep.js'

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

export function generateHashTableDeleteSteps(table, key) {
  validateKey(key)
  assertStrategy(table, 'chaining')

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
