// Tiến độ học tập: chủ đề nào đã được MỞ (màn hình chi tiết), mở lần đầu/gần nhất lúc nào và bao nhiêu lần.
// "Đã mở" chỉ nghĩa là đã vào màn chi tiết của chủ đề, không nói gì về mức độ đã học. Dữ liệu chỉ nằm trong trình duyệt
// của người dùng, không gửi đi đâu.

export const STORAGE_KEY = 'algovision:progress'
export const SCHEMA_VERSION = 1
export const MAX_STORED_LENGTH = 16000
export const MAX_OPEN_COUNT = 1000000

const TOPIC_ID_PATTERN = /^(sorting|searching|structure):[a-z0-9]+(-[a-z0-9]+)*$/

export function topicId(kind, name) {
  return `${kind}:${name}`
}

export function emptyProgress() {
  return { version: SCHEMA_VERSION, topics: {} }
}

function isTimestamp(value) {
  return Number.isSafeInteger(value) && value >= 0
}

// Trả mục đã chuẩn hóa (chỉ giữ trường của lược đồ, kẹp openCount) hoặc null nếu mục sai.
function readEntry(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null

  const { firstOpenedAt, lastOpenedAt, openCount } = raw

  if (!isTimestamp(firstOpenedAt) || !isTimestamp(lastOpenedAt) || lastOpenedAt < firstOpenedAt) return null
  if (!Number.isSafeInteger(openCount) || openCount < 1) return null

  return { firstOpenedAt, lastOpenedAt, openCount: Math.min(openCount, MAX_OPEN_COUNT) }
}

// Không lọc theo danh sách chủ đề của app: id đúng định dạng nhưng app không còn biết vẫn được giữ để ghi lại
// nguyên vẹn (xem keepKnownTopics để lọc khi đọc).
export function parseProgress(text) {
  if (text === null) return { progress: emptyProgress(), status: 'empty' }

  const corrupt = { progress: emptyProgress(), status: 'corrupt' }
  if (typeof text !== 'string' || text.length > MAX_STORED_LENGTH) return corrupt

  let raw
  try {
    raw = JSON.parse(text)
  } catch {
    return corrupt
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return corrupt
  if (!Number.isSafeInteger(raw.version) || raw.version < 1) return corrupt
  if (raw.version > SCHEMA_VERSION) return { progress: emptyProgress(), status: 'future-version' }
  if (raw.topics === null || typeof raw.topics !== 'object' || Array.isArray(raw.topics)) return corrupt

  const progress = emptyProgress()

  for (const [id, rawEntry] of Object.entries(raw.topics)) {
    const entry = TOPIC_ID_PATTERN.test(id) ? readEntry(rawEntry) : null
    if (entry !== null) progress.topics[id] = entry
  }

  return { progress, status: 'ok' }
}

export function serializeProgress(progress) {
  const topics = {}

  for (const id of Object.keys(progress.topics).sort()) {
    topics[id] = progress.topics[id]
  }

  return JSON.stringify({ version: SCHEMA_VERSION, topics })
}

export function recordOpen(progress, id, now) {
  if (!isTimestamp(now)) throw new RangeError(`Thời điểm mở không hợp lệ: ${String(now)}`)

  const previous = progress.topics[id]
  const entry = previous === undefined
    ? { firstOpenedAt: now, lastOpenedAt: now, openCount: 1 }
    : {
        firstOpenedAt: Math.min(previous.firstOpenedAt, now),
        lastOpenedAt: Math.max(previous.lastOpenedAt, now),
        openCount: Math.min(previous.openCount + 1, MAX_OPEN_COUNT),
      }

  return { version: progress.version, topics: { ...progress.topics, [id]: entry } }
}

export function keepKnownTopics(progress, knownTopics) {
  const topics = {}

  for (const [id, entry] of Object.entries(progress.topics)) {
    if (knownTopics.has(id)) topics[id] = entry
  }

  return { version: progress.version, topics }
}

// Kho tiến độ: bọc phần thuần quanh một đối tượng storage inject được (getItem/setItem/removeItem, hoặc null khi
// localStorage không dùng được). Không hàm nào ném: ghi tiến độ không bao giờ được làm hỏng app.
// Bản nhớ của phiên (session) giữ các lần mở khi storage lỗi hoặc có version lạ, để read() vẫn nhất quán trong phiên.
export function createProgressStore({ storage = null, knownTopics = [], now = Date.now } = {}) {
  const known = new Set(knownTopics)
  let session = emptyProgress()
  let writeFailed = false

  function load() {
    if (storage === null) return { progress: emptyProgress(), status: 'unavailable' }

    try {
      return parseProgress(storage.getItem(STORAGE_KEY))
    } catch {
      return { progress: emptyProgress(), status: 'unavailable' }
    }
  }

  function read() {
    const loaded = load()
    const useSession = writeFailed || loaded.status === 'unavailable' || loaded.status === 'future-version'

    return keepKnownTopics(useSession ? session : loaded.progress, known)
  }

  // Mỗi lần mở: đọc lại từ storage rồi ghi (không dùng bản cache), nên hai tab không đè mất lần mở của nhau.
  function open(id) {
    if (!known.has(id)) return false

    let openedAt
    try {
      openedAt = now()
      session = recordOpen(session, id, openedAt)
    } catch {
      return false // đồng hồ hỏng: không phải lỗi ghi, không đụng tới writeFailed
    }

    const loaded = load()
    if (loaded.status === 'unavailable' || loaded.status === 'future-version') return false

    try {
      storage.setItem(STORAGE_KEY, serializeProgress(recordOpen(loaded.progress, id, openedAt)))
      writeFailed = false
      return true
    } catch {
      writeFailed = true
      return false
    }
  }

  function clear() {
    session = emptyProgress()

    if (storage === null) return false

    try {
      storage.removeItem(STORAGE_KEY)
      return true
    } catch {
      return false
    }
  }

  return { read, recordOpen: open, clear }
}

// Truy cập localStorage chỉ xảy ra ở đây. Cửa sổ riêng tư/bị chặn có thể ném ngay khi đọc thuộc tính.
function browserStorage(document) {
  try {
    return document.defaultView?.localStorage ?? null
  } catch {
    return null
  }
}

// Danh sách chủ đề hợp lệ suy ra từ template (cùng ba thuộc tính mà navigation.js dùng), không gõ tay lần hai.
function collectKnownTopics(document) {
  return [
    ...[...document.querySelectorAll('.algorithm-card[data-algorithm]')].map((card) => topicId('sorting', card.dataset.algorithm)),
    ...[...document.querySelectorAll('[data-search-algorithm]')].map((card) => topicId('searching', card.dataset.searchAlgorithm)),
    ...[...document.querySelectorAll('[data-structure-target]')].map((card) => topicId('structure', card.dataset.structureTarget)),
  ]
}

// Ghi lại chủ đề vừa được mở. Chủ đề hiện tại lấy từ algovision:viewchange (detail.topic; null = thư viện/dashboard).
// Đổi #search-algorithm ngay trong chi tiết Tìm kiếm cũng là mở chủ đề mới nhưng không phát viewchange (sẽ làm mô phỏng
// tự tạm dừng); click thẻ thì navigation.js phát change TRƯỚC viewchange, lúc đó currentTopic còn null nên không đếm đôi.
export function initProgress(document, { storage, now } = {}) {
  const store = createProgressStore({
    storage: storage === undefined ? browserStorage(document) : storage,
    knownTopics: collectKnownTopics(document),
    now,
  })
  let currentTopic = null

  function open(topic) {
    currentTopic = topic

    try {
      store.recordOpen(topic)
    } catch {
      // Ghi tiến độ không bao giờ được làm hỏng điều hướng.
    }
  }

  document.addEventListener('algovision:viewchange', (event) => {
    const topic = event.detail?.topic ?? null

    if (topic === null) {
      currentTopic = null
    } else if (topic !== currentTopic) {
      open(topic)
    }
  })

  document.querySelector('#search-algorithm')?.addEventListener('change', (event) => {
    if (currentTopic === null || !currentTopic.startsWith('searching:')) return

    const topic = topicId('searching', event.target.value)
    if (topic !== currentTopic) open(topic)
  })

  return store
}
