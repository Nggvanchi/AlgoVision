import { appendEntry, validateKey } from '../structures/hashTable.js'
import { assertStrategy, createHashStepFactory, scanChain } from './hashTableStep.js'

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

export function generateHashTableInsertSteps(table, key) {
  validateKey(key)
  assertStrategy(table, 'chaining')

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
