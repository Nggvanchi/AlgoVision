// Nối kho tiến độ (progress-store.js) với trình duyệt: nghe algovision:viewchange và ghi chủ đề vừa được MỞ.
// Đây là nơi DUY NHẤT trong src/ được truy cập localStorage (tests/meta/progress-storage-boundary.test.js canh gác).
import { createProgressStore, STORAGE_KEY, topicId } from './progress-store.js'

// Truy cập localStorage chỉ xảy ra ở đây. Cửa sổ riêng tư/bị chặn có thể ném ngay khi đọc thuộc tính.
function browserStorage(document) {
  try {
    return document.defaultView?.localStorage ?? null
  } catch {
    return null
  }
}

const labelOf = (element, fallback) => element?.textContent.replace(/\s+/g, ' ').trim() || fallback

// Danh mục chủ đề [{ id, label, kind }] suy ra từ template (cùng ba thuộc tính mà navigation.js dùng), không gõ tay lần hai.
// Nhãn lấy từ chính thẻ nên giao diện đọc tiến độ không có danh sách tên thứ hai.
function collectCatalog(document) {
  return [
    ...[...document.querySelectorAll('.algorithm-card[data-algorithm]')].map((card) => ({
      id: topicId('sorting', card.dataset.algorithm),
      label: labelOf(card.querySelector('h4'), card.dataset.algorithm),
      kind: 'sorting',
    })),
    ...[...document.querySelectorAll('[data-search-algorithm]')].map((card) => ({
      id: topicId('searching', card.dataset.searchAlgorithm),
      label: labelOf(card.querySelector('h4'), card.dataset.searchAlgorithm),
      kind: 'searching',
    })),
    ...[...document.querySelectorAll('[data-structure-target]')].map((card) => ({
      id: topicId('structure', card.dataset.structureTarget),
      label: labelOf(card.querySelector('.structure-card-title'), card.dataset.structureTarget),
      kind: 'structure',
    })),
  ]
}

// Ghi lại chủ đề vừa được mở. Chủ đề hiện tại lấy từ algovision:viewchange (detail.topic; null = thư viện/dashboard).
// Đổi #search-algorithm ngay trong chi tiết Tìm kiếm cũng là mở chủ đề mới nhưng không phát viewchange (sẽ làm mô phỏng
// tự tạm dừng); click thẻ thì navigation.js phát change TRƯỚC viewchange, lúc đó currentTopic còn null nên không đếm đôi.
//
// Trả về { read, readState, recordOpen, clear, subscribe, catalog }. subscribe(callback) báo "dữ liệu tiến độ có thể đã đổi":
// sau mỗi lần mở chủ đề và sau clear() ở tab này, và khi tab khác đổi khóa algovision:progress (sự kiện storage, key khớp
// hoặc null = xóa cả kho). Gọi sau khi đã ghi nên người nghe luôn đọc được lần mở vừa rồi, không phụ thuộc thứ tự listener.
export function initProgress(document, { storage, now } = {}) {
  const catalog = collectCatalog(document)
  const known = new Set(catalog.map((topic) => topic.id))
  const store = createProgressStore({
    storage: storage === undefined ? browserStorage(document) : storage,
    knownTopics: [...known],
    now,
  })
  const subscribers = new Set()
  let currentTopic = null

  function notify() {
    // Duyệt bản sao: người nghe hủy đăng ký ngay trong lúc được gọi không làm sót người kế tiếp.
    for (const callback of [...subscribers]) {
      try {
        callback()
      } catch {
        // Một người nghe lỗi không được làm hỏng điều hướng, ghi tiến độ hay người nghe khác.
      }
    }
  }

  function recordOpen(topic) {
    let recorded = false

    try {
      recorded = store.recordOpen(topic)
    } catch {
      // Ghi tiến độ không bao giờ được làm hỏng điều hướng.
    }

    if (known.has(topic)) notify()

    return recorded
  }

  function clear() {
    const cleared = store.clear()

    notify()

    return cleared
  }

  function subscribe(callback) {
    subscribers.add(callback)

    return () => {
      subscribers.delete(callback)
    }
  }

  function open(topic) {
    currentTopic = topic
    recordOpen(topic)
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

  document.defaultView?.addEventListener('storage', (event) => {
    if (event.key === null || event.key === STORAGE_KEY) notify()
  })

  return { read: store.read, readState: store.readState, recordOpen, clear, subscribe, catalog }
}
