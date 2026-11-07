// Khối tiến độ trên Dashboard (.dashboard-progress) và nút hero theo ngữ cảnh. Dùng chung hàm tóm tắt (progress-summary.js) và
// hàng chủ đề, thông báo trạng thái, mở lại chủ đề (progress-view.js) với trang Tiến độ; không có nút xóa ở đây.
// DOM chỉ dựng bằng textContent.
import { summarizeProgress } from './progress-summary.js'
import { createTopicRow, openPage, progressNotice, reopenTopic } from './progress-view.js'

const RECENT_LIMIT = 3
const START_TOPIC = 'sorting:bubble'

function make(document, tag, className, text) {
  const element = document.createElement(tag)

  element.className = className
  element.textContent = text

  return element
}

export function initDashboardProgress(document, progress) {
  const body = document.querySelector('#dashboard-progress-body')
  const notice = document.querySelector('#dashboard-progress-notice')
  const heroLabel = document.querySelector('#dashboard-hero-label')

  if (!body || !notice) return null

  let heroTopic = null
  const onReopen = (topic) => reopenTopic(document, topic)

  function render() {
    const state = progress.readState()
    const summary = summarizeProgress(state.progress, progress.catalog)
    const text = progressNotice(state)
    const children = []

    notice.textContent = text ?? ''
    notice.hidden = text === null

    if (state.status !== 'future-version' && summary.opened === 0) {
      const open = make(document, 'button', 'control-button progress-detail', 'Mở Sắp xếp')

      open.type = 'button'
      open.addEventListener('click', () => openPage(document, 'sorting'))
      children.push(
        make(document, 'strong', 'progress-stat-value', 'Bạn chưa mở chủ đề nào.'),
        make(document, 'p', '', 'Mở một thuật toán hoặc cấu trúc dữ liệu, nó sẽ xuất hiện ở đây.'),
        open,
      )
    } else if (state.status !== 'future-version') {
      const list = make(document, 'ul', 'progress-topic-list', '')

      list.append(...summary.recent.slice(0, RECENT_LIMIT).map((topic) => createTopicRow(document, topic, { variant: 'recent', onReopen })))
      children.push(
        make(document, 'strong', 'progress-stat-value', `Đã mở ${summary.opened} / ${summary.total} chủ đề`),
        make(document, 'p', '', summary.groups.map((group) => `${group.label} ${group.opened}/${group.total}`).join(' · ')),
        list,
      )
    }

    body.replaceChildren(...children)

    // Nút hero: người cũ tiếp tục chủ đề mở gần nhất, người mới (hoặc dữ liệu không đọc được) bắt đầu với Bubble Sort.
    heroTopic = summary.recent[0] ?? summary.groups.flatMap((group) => group.topics).find((topic) => topic.id === START_TOPIC) ?? null

    if (heroLabel && heroTopic) heroLabel.textContent = `${summary.opened === 0 ? 'Bắt đầu với' : 'Tiếp tục:'} ${heroTopic.label}`
  }

  // Nút hero giữ data-dashboard-target="sorting" (điều hướng cũ chạy trước, về thư viện); sau đó mở thẳng chủ đề.
  heroLabel?.closest('button')?.addEventListener('click', () => {
    if (heroTopic) reopenTopic(document, heroTopic)
  })
  document.addEventListener('algovision:viewchange', (event) => {
    if (event.detail?.page === 'dashboard') render()
  })
  progress.subscribe(render)
  render()

  return { render }
}
