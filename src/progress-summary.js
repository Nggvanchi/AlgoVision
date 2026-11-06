// Tóm tắt tiến độ học tập cho giao diện: hàm thuần, không DOM, không kho trình duyệt. Chỉ nói về chủ đề đã MỞ
// (số chủ đề, số lượt mở, thời điểm), không suy diễn mức độ đã học.

const GROUPS = [
  { kind: 'sorting', label: 'Sắp xếp' },
  { kind: 'searching', label: 'Tìm kiếm' },
  { kind: 'structure', label: 'Cấu trúc dữ liệu' },
]

const isTimestamp = (value) => Number.isSafeInteger(value) && value >= 0

function topicSummary(topic, entry) {
  return entry === undefined
    ? { id: topic.id, label: topic.label, opened: false, openCount: 0, firstOpenedAt: null, lastOpenedAt: null }
    : {
        id: topic.id,
        label: topic.label,
        opened: true,
        openCount: entry.openCount,
        firstOpenedAt: entry.firstOpenedAt,
        lastOpenedAt: entry.lastOpenedAt,
      }
}

// progress: { topics: { [id]: { firstOpenedAt, lastOpenedAt, openCount } } }; catalog: [{ id, label, kind }].
// Chủ đề có trong progress nhưng không có trong catalog (hoặc kind lạ) bị bỏ qua.
export function summarizeProgress(progress, catalog) {
  const groups = GROUPS.map(({ kind, label }) => {
    const topics = catalog
      .filter((topic) => topic.kind === kind)
      .map((topic) => topicSummary(topic, progress.topics[topic.id]))

    return { kind, label, total: topics.length, opened: topics.filter((topic) => topic.opened).length, topics }
  })

  const openedTopics = groups.flatMap((group) => group.topics).filter((topic) => topic.opened)
  const recent = [...openedTopics].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  return {
    total: groups.reduce((sum, group) => sum + group.total, 0),
    opened: openedTopics.length,
    totalOpens: openedTopics.reduce((sum, topic) => sum + topic.openCount, 0),
    lastOpenedAt: recent.length === 0 ? null : recent[0].lastOpenedAt,
    groups,
    recent,
  }
}

// dd/mm/yyyy hh:mm theo múi giờ truyền vào (không truyền thì múi giờ của máy). Mốc sau `now` (đồng hồ lệch): "Vừa xong".
export function formatOpenedAt(timestamp, { now, timeZone } = {}) {
  if (!isTimestamp(timestamp)) return ''
  if (isTimestamp(now) && timestamp > now) return 'Vừa xong'

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hourCycle: 'h23',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(timestamp)
  const part = (type) => parts.find((item) => item.type === type).value

  return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`
}

// Giá trị cho thuộc tính datetime của <time>.
export function isoTimestamp(timestamp) {
  return isTimestamp(timestamp) ? new Date(timestamp).toISOString() : ''
}
