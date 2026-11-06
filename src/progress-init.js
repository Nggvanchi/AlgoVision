// Nối kho tiến độ (progress-store.js) với trình duyệt: nghe algovision:viewchange và ghi chủ đề vừa được MỞ.
// Đây là nơi DUY NHẤT trong src/ được truy cập localStorage (tests/meta/progress-storage-boundary.test.js canh gác).
import { createProgressStore, topicId } from './progress-store.js'

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
