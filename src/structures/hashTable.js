// Bảng băm dạng snapshot thuần.
// Chaining: { strategy: 'chaining', capacity: m, buckets: [[{ id, key }, …], …], nextId }.
// Ô được định danh bằng chỉ số 0..m-1, phần tử bằng id chuỗi ổn định ('e1', 'e2', …) không cấp lại,
// để giao diện luôn tô đúng phần tử kể cả khi giá trị khóa có thể trùng tạm thời.
// Mọi hàm không thay đổi bảng đầu vào; bảng trả về là bản sao độc lập (không chia sẻ mảng hay phần tử).
// Tầng này chỉ yêu cầu khóa nguyên và m nguyên ≥ 1; giới hạn 0–99, m ∈ {5, 7, 11}, số phần tử
// do tầng giao diện quyết định. Số phần tử n không lưu riêng mà luôn đếm từ dữ liệu.

const STRATEGIES = ['chaining']

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

export function createHashTable(capacity, strategy = 'chaining') {
  validateCapacity(capacity)

  if (!STRATEGIES.includes(strategy)) {
    throw new RangeError(`Chiến lược xử lý va chạm không hợp lệ: ${strategy}`)
  }

  return {
    strategy,
    capacity,
    buckets: Array.from({ length: capacity }, () => []),
    nextId: 1,
  }
}

export function cloneTable(table) {
  return {
    ...table,
    buckets: table.buckets.map((bucket) => bucket.map((entry) => ({ ...entry }))),
  }
}

export function countEntries(table) {
  return table.buckets.reduce((total, bucket) => total + bucket.length, 0)
}

export function loadFactor(table) {
  return countEntries(table) / table.capacity
}

// Trả về { bucketIndex, position, id } của phần tử mang khóa key, hoặc null.
export function findEntry(table, key) {
  const bucketIndex = hashIndex(key, table.capacity)
  const position = table.buckets[bucketIndex].findIndex((entry) => entry.key === key)

  if (position === -1) return null

  return { bucketIndex, position, id: table.buckets[bucketIndex][position].id }
}

export function containsKey(table, key) {
  return findEntry(table, key) !== null
}

export function hasEntry(table, id) {
  return table.buckets.some((bucket) => bucket.some((entry) => entry.id === id))
}

// Nối khóa vào cuối chain của ô bucketIndex, không kiểm tra trùng. Trả về { table, id }.
export function appendEntry(table, bucketIndex, key) {
  validateKey(key)

  const nextTable = cloneTable(table)
  const id = `e${nextTable.nextId}`

  nextTable.buckets[bucketIndex].push({ id, key })
  nextTable.nextId += 1

  return { table: nextTable, id }
}

// Trả về { table, inserted, id }. Khóa đã tồn tại thì inserted = false, bảng giữ nguyên.
export function insertKey(table, key) {
  const existing = findEntry(table, key)

  if (existing) {
    return { table, inserted: false, id: existing.id }
  }

  const { table: nextTable, id } = appendEntry(table, hashIndex(key, table.capacity), key)
  return { table: nextTable, inserted: true, id }
}

export function removeEntry(table, id) {
  if (!hasEntry(table, id)) {
    throw new RangeError(`Không có phần tử ${id} trong bảng băm.`)
  }

  const nextTable = cloneTable(table)
  nextTable.buckets = nextTable.buckets.map((bucket) => bucket.filter((entry) => entry.id !== id))
  return nextTable
}

export function buildHashTable(capacity, keys, strategy = 'chaining') {
  return keys.reduce((table, key) => insertKey(table, key).table, createHashTable(capacity, strategy))
}

// Mọi khóa theo thứ tự ô, rồi thứ tự trong chain.
export function toKeys(table) {
  return table.buckets.flatMap((bucket) => bucket.map((entry) => entry.key))
}
