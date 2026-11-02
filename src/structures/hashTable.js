// Bảng băm dạng snapshot thuần, hai chiến lược xử lý va chạm:
// - Chaining: { strategy: 'chaining', capacity: m, buckets: [[{ id, key }, …], …], nextId }.
// - Linear probing: { strategy: 'probing', capacity: m,
//     cells: [{ kind: 'empty' } | { kind: 'occupied', id, key } | { kind: 'tombstone' }, …], nextId }.
//   Xóa để lại tombstone (không giữ id) để chuỗi dò của các khóa phía sau không bị cắt đứt.
// Ô được định danh bằng chỉ số 0..m-1, phần tử bằng id chuỗi ổn định ('e1', 'e2', …) không cấp lại,
// để giao diện luôn tô đúng phần tử kể cả khi giá trị khóa có thể trùng tạm thời.
// Mọi hàm không thay đổi bảng đầu vào; bảng trả về là bản sao độc lập (không chia sẻ mảng hay phần tử).
// Tầng này chỉ yêu cầu khóa nguyên và m nguyên ≥ 1; giới hạn 0–99, m ∈ {5, 7, 11}, số phần tử
// do tầng giao diện quyết định. Số phần tử n không lưu riêng mà luôn đếm từ dữ liệu.

const STRATEGIES = ['chaining', 'probing']

export function validateKey(key) {
  if (!Number.isInteger(key)) {
    throw new TypeError('Khóa của bảng băm phải là số nguyên.')
  }
}

function validateCapacity(capacity) {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new RangeError('Số ô m của bảng băm phải là số nguyên ≥ 1.')
  }
}

export function hashIndex(key, capacity) {
  validateKey(key)
  validateCapacity(capacity)
  return ((key % capacity) + capacity) % capacity
}

// Ô thứ j trên chuỗi dò tuyến tính bắt đầu từ start: (start + j) mod m.
export function probeIndex(start, step, capacity) {
  return (start + step) % capacity
}

export function createHashTable(capacity, strategy = 'chaining') {
  validateCapacity(capacity)

  if (!STRATEGIES.includes(strategy)) {
    throw new RangeError(`Chiến lược xử lý va chạm không hợp lệ: ${strategy}`)
  }

  if (strategy === 'probing') {
    return {
      strategy,
      capacity,
      cells: Array.from({ length: capacity }, () => ({ kind: 'empty' })),
      nextId: 1,
    }
  }

  return {
    strategy,
    capacity,
    buckets: Array.from({ length: capacity }, () => []),
    nextId: 1,
  }
}

const isProbing = (table) => table.strategy === 'probing'

export function cloneTable(table) {
  if (isProbing(table)) {
    return { ...table, cells: table.cells.map((cell) => ({ ...cell })) }
  }

  return {
    ...table,
    buckets: table.buckets.map((bucket) => bucket.map((entry) => ({ ...entry }))),
  }
}

// Mọi phần tử đang có trong bảng (dạng { id, key, bucketIndex, position }), theo thứ tự ô rồi thứ tự chain.
function listEntries(table) {
  if (isProbing(table)) {
    return table.cells.flatMap((cell, bucketIndex) => (
      cell.kind === 'occupied' ? [{ id: cell.id, key: cell.key, bucketIndex, position: 0 }] : []
    ))
  }

  return table.buckets.flatMap((bucket, bucketIndex) => (
    bucket.map((entry, position) => ({ id: entry.id, key: entry.key, bucketIndex, position }))
  ))
}

export function countEntries(table) {
  return listEntries(table).length
}

export function countTombstones(table) {
  return isProbing(table) ? table.cells.filter((cell) => cell.kind === 'tombstone').length : 0
}

export function loadFactor(table) {
  return countEntries(table) / table.capacity
}

// Probing: dò từ hash(key), bỏ qua tombstone, dừng ở ô trống hoặc sau đúng m ô.
// Trả về { foundIndex, firstFreeIndex }: ô chứa key (hoặc null) và ô trống/tombstone đầu tiên gặp trên đường dò.
function probeFor(table, key) {
  const start = hashIndex(key, table.capacity)
  let firstFreeIndex = null

  for (let step = 0; step < table.capacity; step++) {
    const index = probeIndex(start, step, table.capacity)
    const cell = table.cells[index]

    if (cell.kind === 'empty') {
      return { foundIndex: null, firstFreeIndex: firstFreeIndex ?? index }
    }

    if (cell.kind === 'tombstone') {
      firstFreeIndex ??= index
    } else if (cell.key === key) {
      return { foundIndex: index, firstFreeIndex }
    }
  }

  return { foundIndex: null, firstFreeIndex }
}

// Trả về { bucketIndex, position, id } của phần tử mang khóa key, hoặc null.
export function findEntry(table, key) {
  if (isProbing(table)) {
    const { foundIndex } = probeFor(table, key)
    return foundIndex === null ? null : { bucketIndex: foundIndex, position: 0, id: table.cells[foundIndex].id }
  }

  const bucketIndex = hashIndex(key, table.capacity)
  const position = table.buckets[bucketIndex].findIndex((entry) => entry.key === key)

  if (position === -1) return null

  return { bucketIndex, position, id: table.buckets[bucketIndex][position].id }
}

export function containsKey(table, key) {
  return findEntry(table, key) !== null
}

export function hasEntry(table, id) {
  return listEntries(table).some((entry) => entry.id === id)
}

// Đặt khóa vào ô bucketIndex (chaining: nối cuối chain; probing: ô phải trống hoặc tombstone),
// không kiểm tra trùng. Trả về { table, id }.
export function appendEntry(table, bucketIndex, key) {
  validateKey(key)

  if (isProbing(table) && table.cells[bucketIndex].kind === 'occupied') {
    throw new RangeError(`Ô ${bucketIndex} đã có phần tử.`)
  }

  const nextTable = cloneTable(table)
  const id = `e${nextTable.nextId}`

  if (isProbing(nextTable)) {
    nextTable.cells[bucketIndex] = { kind: 'occupied', id, key }
  } else {
    nextTable.buckets[bucketIndex].push({ id, key })
  }

  nextTable.nextId += 1
  return { table: nextTable, id }
}

// Trả về { table, inserted, full, id }.
// Khóa đã tồn tại: inserted = false, full = false, id của phần tử đó (kiểm trùng trước kiểm đầy).
// Probing hết chỗ (không ô trống, không tombstone, khóa chưa có): inserted = false, full = true, id = null.
export function insertKey(table, key) {
  const existing = findEntry(table, key)

  if (existing) {
    return { table, inserted: false, full: false, id: existing.id }
  }

  const targetIndex = isProbing(table) ? probeFor(table, key).firstFreeIndex : hashIndex(key, table.capacity)

  if (targetIndex === null) {
    return { table, inserted: false, full: true, id: null }
  }

  const { table: nextTable, id } = appendEntry(table, targetIndex, key)
  return { table: nextTable, inserted: true, full: false, id }
}

// Chaining: bỏ phần tử khỏi chain. Probing: thay ô bằng tombstone.
export function removeEntry(table, id) {
  if (!hasEntry(table, id)) {
    throw new RangeError(`Không có phần tử ${id} trong bảng băm.`)
  }

  const nextTable = cloneTable(table)

  if (isProbing(nextTable)) {
    nextTable.cells = nextTable.cells.map((cell) => (cell.id === id ? { kind: 'tombstone' } : cell))
  } else {
    nextTable.buckets = nextTable.buckets.map((bucket) => bucket.filter((entry) => entry.id !== id))
  }

  return nextTable
}

export function buildHashTable(capacity, keys, strategy = 'chaining') {
  return keys.reduce((table, key) => insertKey(table, key).table, createHashTable(capacity, strategy))
}

// Mọi khóa theo thứ tự ô, rồi thứ tự trong chain.
export function toKeys(table) {
  return listEntries(table).map((entry) => entry.key)
}
