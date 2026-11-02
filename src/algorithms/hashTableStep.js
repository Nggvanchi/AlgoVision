import { hashIndex } from '../structures/hashTable.js'

// Khuôn bước chung cho mọi thao tác Hash Table. Các trường lưu dữ liệu; tầng hiển thị lo định dạng chữ.
// table: snapshot bảng tại bước đó (không bao giờ bị sửa sau khi tạo).
// hashIndex: key mod m (null ở bước 0). currentBucket: ô đang xét, null hoặc 0..m-1.
// currentEntryId / foundEntryId / insertedEntryId: null hoặc id có trong table của chính bước đó.
// pathEntryIds: phần tử đã so khóa, chỉ tăng (trừ phần tử bị xóa). probedBuckets: ô đã dò (probing), chỉ tăng.
// comparisons: số lần so khóa cần tìm với khóa của một phần tử có thật.
// probes: số ô đã dò (chỉ probing; chaining luôn là 0).
export function createHashStepFactory(operation, key) {
  return (fields) => ({
    table: null,
    operation,
    key,
    hashIndex: null,
    currentBucket: null,
    currentEntryId: null,
    pathEntryIds: [],
    probedBuckets: [],
    foundEntryId: null,
    insertedEntryId: null,
    comparisons: 0,
    probes: 0,
    pseudocodeLine: null,
    message: '',
    finished: false,
    result: null,
    ...fields,
  })
}

export function assertStrategy(table, expected) {
  if (table.strategy !== expected) {
    throw new RangeError(`Chưa hỗ trợ chiến lược ${table.strategy}.`)
  }
}

// Chaining: thêm bước tính hash (dòng lines.hash) rồi mỗi phần tử trong chain một bước so khóa
// (dòng lines.compare, comparisons +1), dừng ở phần tử đầu tiên có khóa bằng key.
// Trả về { index, match, pathEntryIds, comparisons }; match là phần tử khớp hoặc null.
export function scanChain({ steps, createStep, table, key, lines }) {
  const index = hashIndex(key, table.capacity)
  const pathEntryIds = []
  let comparisons = 0

  steps.push(createStep({
    table,
    hashIndex: index,
    currentBucket: index,
    pseudocodeLine: lines.hash,
    message: `${key} mod ${table.capacity} = ${index}, xét ô ${index}.`,
  }))

  for (const entry of table.buckets[index]) {
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
      pseudocodeLine: lines.compare,
      message: isMatch
        ? `So sánh ${key} với ${entry.key}: bằng nhau.`
        : `So sánh ${key} với ${entry.key}: khác, xét phần tử tiếp theo.`,
    }))

    if (isMatch) {
      return { index, match: entry, pathEntryIds, comparisons }
    }
  }

  return { index, match: null, pathEntryIds, comparisons }
}
