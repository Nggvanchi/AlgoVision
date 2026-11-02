import { appendEntry, hashIndex, validateKey } from '../structures/hashTable.js'
import { assertStrategy, createHashStepFactory } from './hashTableStep.js'

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
  const index = hashIndex(key, table.capacity)
  const bucket = table.buckets[index]
  const steps = [createStep({ table, message: `Bắt đầu chèn khóa ${key}.` })]
  const pathEntryIds = []
  let comparisons = 0

  steps.push(createStep({
    table,
    hashIndex: index,
    currentBucket: index,
    pseudocodeLine: LINE.HASH,
    message: `${key} mod ${table.capacity} = ${index}, xét ô ${index}.`,
  }))

  for (const entry of bucket) {
    pathEntryIds.push(entry.id)
    comparisons++
    const isMatch = entry.key === key

    steps.push(createStep({
      table,
      hashIndex: index,
      currentBucket: index,
      currentEntryId: entry.id,
      pathEntryIds: [...pathEntryIds],
      comparisons,
      pseudocodeLine: LINE.COMPARE,
      message: isMatch
        ? `So sánh ${key} với ${entry.key}: bằng nhau.`
        : `So sánh ${key} với ${entry.key}: khác, xét phần tử tiếp theo.`,
    }))

    if (isMatch) {
      steps.push(createStep({
        table,
        hashIndex: index,
        currentBucket: index,
        currentEntryId: entry.id,
        foundEntryId: entry.id,
        pathEntryIds: [...pathEntryIds],
        comparisons,
        pseudocodeLine: LINE.DUPLICATE,
        finished: true,
        result: 'duplicate',
        message: `Khóa ${key} đã tồn tại ở ô ${index}, bỏ qua.`,
      }))

      return steps
    }
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
    message: bucket.length === 0
      ? `Ô ${index} rỗng, không có khóa để so sánh. Thêm ${key} vào ô ${index}.`
      : `Không có khóa nào bằng ${key}. Thêm ${key} vào cuối chain của ô ${index}.`,
  }))

  return steps
}
