import { hashIndex, probeIndex } from '../structures/hashTable.js'

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

// Probing: thêm bước tính hash (lines.hash), rồi với mỗi ô trên chuỗi dò (tối đa m ô):
// - một bước p = (i + j) mod m (lines.probe, probes +1);
// - ô tombstone: một bước bỏ qua (lines.tombstone), không so sánh;
// - ô có khóa: một bước so khóa (lines.compare, comparisons +1), dừng nếu khớp;
// - ô trống: dừng NGAY, chưa thêm bước (generator tự thêm bước kết luận/ghi nhớ của mình).
// rememberFree = true (Insert): message nói rõ ô trống/tombstone đầu tiên được ghi nhớ làm vị trí chèn.
// Trả về { start, stop: 'match' | 'empty' | 'exhausted', index, match, firstFreeIndex, state }
// với state = { pathEntryIds, probedBuckets, comparisons, probes } để generator dựng bước tiếp theo.
export function scanProbes({ steps, createStep, table, key, lines, rememberFree = false }) {
  const start = hashIndex(key, table.capacity)
  const state = { pathEntryIds: [], probedBuckets: [], comparisons: 0, probes: 0 }
  const snapshot = () => ({
    table,
    hashIndex: start,
    pathEntryIds: [...state.pathEntryIds],
    probedBuckets: [...state.probedBuckets],
    comparisons: state.comparisons,
    probes: state.probes,
  })
  let firstFreeIndex = null

  steps.push(createStep({
    ...snapshot(),
    currentBucket: start,
    pseudocodeLine: lines.hash,
    message: `${key} mod ${table.capacity} = ${start}, bắt đầu dò từ ô ${start}.`,
  }))

  for (let j = 0; j < table.capacity; j++) {
    const index = probeIndex(start, j, table.capacity)
    const cell = table.cells[index]
    state.probedBuckets.push(index)
    state.probes++

    steps.push(createStep({
      ...snapshot(),
      currentBucket: index,
      pseudocodeLine: lines.probe,
      message: `Lần dò thứ ${j + 1}: p = (${start} + ${j}) mod ${table.capacity} = ${index}.`,
    }))

    if (cell.kind === 'empty') {
      return { start, stop: 'empty', index, match: null, firstFreeIndex, state }
    }

    if (cell.kind === 'tombstone') {
      const remembers = rememberFree && firstFreeIndex === null
      firstFreeIndex ??= index

      steps.push(createStep({
        ...snapshot(),
        currentBucket: index,
        pseudocodeLine: lines.tombstone,
        message: remembers
          ? `Ô ${index} là tombstone: ghi nhớ vt = ${index}, dò tiếp để kiểm tra trùng.`
          : `Ô ${index} là tombstone (đã xóa): không so sánh, dò tiếp.`,
      }))
      continue
    }

    state.pathEntryIds.push(cell.id)
    state.comparisons++
    const isMatch = cell.key === key

    steps.push(createStep({
      ...snapshot(),
      currentBucket: index,
      currentEntryId: cell.id,
      pseudocodeLine: lines.compare,
      message: isMatch
        ? `So sánh ${key} với ${cell.key}: bằng nhau.`
        : `So sánh ${key} với ${cell.key}: khác, dò ô tiếp theo.`,
    }))

    if (isMatch) {
      return { start, stop: 'match', index, match: cell, firstFreeIndex, state }
    }
  }

  return { start, stop: 'exhausted', index: null, match: null, firstFreeIndex, state }
}
