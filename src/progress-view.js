// Giao diện đọc tiến độ: trang "Tiến độ học tập" (#progress-section) và các hàm dùng chung với Dashboard (dựng hàng chủ đề,
// mở lại chủ đề, thông báo trạng thái, khung xác nhận). Không chạm kho trình duyệt: mọi dữ liệu đi qua đối tượng `progress`
// của initProgress (readState, catalog, subscribe, clear). "Đã mở" chỉ nghĩa là đã vào màn hình chi tiết của chủ đề.
// DOM chỉ dựng bằng textContent, không dùng innerHTML.
import { formatOpenedAt, isoTimestamp, summarizeProgress } from './progress-summary.js'

const RECENT_LIMIT = 5

const CLEAR_FAILED = 'Không xóa được dữ liệu khỏi trình duyệt. Lịch sử trong phiên này đã được làm mới.'

function make(document, tag, className, text) {
  const element = document.createElement(tag)

  if (className) element.className = className
  if (text !== undefined) element.textContent = text

  return element
}

// Chữ thông báo của trạng thái kho (hoặc null khi bình thường). Dashboard và trang Tiến độ dùng chung nên cùng một chữ.
export function progressNotice(state) {
  if (state.status === 'future-version') {
    return 'Dữ liệu được ghi bởi phiên bản mới hơn của AlgoVision nên chưa hiển thị. AlgoVision sẽ không ghi đè hay chuyển đổi dữ liệu này.'
  }

  if (state.status === 'corrupt') return 'Dữ liệu tiến độ đã lưu bị hỏng nên được bỏ qua. Lần mở tiếp theo sẽ ghi đè.'
  if (!state.persisted) return 'Trình duyệt không cho lưu tiến độ; chỉ hiển thị trong phiên này.'

  return null
}

export function focusMain(document) {
  document.querySelector('#main-content')?.focus()
}

// Mở một trang của sidebar (dùng cho nút "Mở Sắp xếp" khi chưa mở gì), rồi đưa focus về #main-content.
export function openPage(document, page) {
  document.querySelector(`.nav-item[data-page="${page}"]`)?.click()
  focusMain(document)
}

const findBy = (document, selector, attribute, value) =>
  [...document.querySelectorAll(selector)].find((element) => element.dataset[attribute] === value)

// Mở lại một chủ đề bằng chính các điều khiển của navigation.js (một lần bấm là một lần mở thật, nên openCount tăng đúng 1):
// cấu trúc qua mục con của sidebar; Sắp xếp và Tìm kiếm qua mục trang rồi thẻ thuật toán. Xong thì đưa focus về #main-content
// vì nút vừa bấm đã bị ẩn cùng màn hình cũ. Trả về false (không đổi gì) nếu không tìm thấy điều khiển.
export function reopenTopic(document, topic) {
  const split = topic.id.indexOf(':')
  const name = topic.id.slice(split + 1)
  const open = {
    structure: () => findBy(document, 'button[data-structure-nav]', 'structureNav', name),
    sorting: () => {
      document.querySelector('.nav-item[data-page="sorting"]')?.click()
      return findBy(document, '.algorithm-card[data-algorithm]', 'algorithm', name)
    },
    searching: () => {
      document.querySelector('.nav-item[data-page="searching"]')?.click()
      return findBy(document, '[data-search-algorithm]', 'searchAlgorithm', name)
    },
  }[topic.id.slice(0, split)]
  const control = open?.()

  if (!control) return false

  control.click()
  focusMain(document)

  return true
}

function timeNode(document, timestamp, now) {
  const time = make(document, 'time', '', formatOpenedAt(timestamp, { now }))

  time.setAttribute('datetime', isoTimestamp(timestamp))

  return time
}

// Một hàng chủ đề. variant 'full' (trang Tiến độ): có "mở lần đầu"; 'recent' (Dashboard): chỉ lần gần nhất.
// Hàng đã mở có nút "Mở lại <tên>" gọi onReopen(topic); hàng chưa mở chỉ ghi "Chưa mở".
export function createTopicRow(document, topic, { variant = 'full', now = Date.now(), onReopen } = {}) {
  const item = make(document, 'li', 'progress-topic')
  const info = make(document, 'div', 'progress-topic-info')

  info.append(make(document, 'span', 'progress-topic-name', topic.label))
  item.append(info)

  if (!topic.opened) {
    info.append(make(document, 'span', 'progress-topic-meta', 'Chưa mở'))

    return item
  }

  const meta = make(document, 'span', 'progress-topic-meta', `Đã mở ${topic.openCount} lần`)

  if (variant === 'full') meta.append(' · mở lần đầu ', timeNode(document, topic.firstOpenedAt, now))
  meta.append(' · gần nhất ', timeNode(document, topic.lastOpenedAt, now))
  info.append(meta)

  const button = make(document, 'button', 'control-button progress-reopen', 'Mở lại')

  button.type = 'button'
  button.setAttribute('aria-label', `Mở lại ${topic.label}`)
  button.addEventListener('click', () => onReopen?.(topic))
  item.append(button)

  return item
}

// Khung xác nhận tại chỗ (role="group", không confirm(), không <dialog>) dùng chung cho mọi đường xóa: chỉ khác chữ và hành động.
// Mở thì focus vào Hủy; Escape hoặc Hủy đóng và trả focus cho nút đã mở nó; Xóa đóng rồi gọi onConfirm.
export function createConfirmBox(document, { id, title, message, confirmLabel, onConfirm }) {
  const box = make(document, 'div', 'progress-confirm')
  const heading = make(document, 'p', 'progress-confirm-title', title)
  const actions = make(document, 'div', 'progress-actions')
  const cancel = make(document, 'button', 'control-button', 'Hủy')
  const confirm = make(document, 'button', 'control-button progress-danger', confirmLabel)
  let opener = null

  box.id = id
  box.hidden = true
  box.setAttribute('role', 'group')
  box.setAttribute('aria-labelledby', `${id}-title`)
  heading.id = `${id}-title`
  cancel.type = 'button'
  confirm.type = 'button'
  actions.append(cancel, confirm)
  box.append(heading, make(document, 'p', 'progress-confirm-message', message), actions)

  function close() {
    if (box.hidden) return

    const target = opener

    box.hidden = true
    opener = null
    if (target && target.closest('[hidden]') === null) target.focus()
  }

  cancel.addEventListener('click', close)
  box.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close()
  })
  confirm.addEventListener('click', () => {
    box.hidden = true
    opener = null
    onConfirm()
  })

  return {
    element: box,
    open(from) {
      opener = from
      box.hidden = false
      cancel.focus()
    },
  }
}

function buildStats(document, summary, now) {
  const stats = make(document, 'ul', 'progress-stats')
  const cells = [
    ['Đã mở', `${summary.opened} / ${summary.total} chủ đề`],
    ['Tổng lượt mở', String(summary.totalOpens)],
    ['Mở gần nhất', summary.lastOpenedAt === null ? 'Chưa có' : timeNode(document, summary.lastOpenedAt, now)],
  ]

  cells.forEach(([label, value], index) => {
    const cell = make(document, 'li', 'dashboard-card progress-stat')
    const text = typeof value === 'string' ? make(document, 'strong', 'progress-stat-value', value) : value

    text.className = 'progress-stat-value'

    if (index === 0) {
      cell.tabIndex = -1
      cell.dataset.progressSummary = ''
    }

    cell.append(make(document, 'span', 'progress-stat-label', label), ' ', text)
    stats.append(cell)
  })

  return stats
}

function buildGroups(document, summary, row) {
  const groups = make(document, 'ul', 'progress-groups')

  for (const group of summary.groups) {
    const card = make(document, 'li', 'dashboard-card progress-group')
    const list = make(document, 'ul', 'progress-topic-list')

    list.append(...group.topics.map(row))
    card.append(
      make(document, 'h3', 'progress-group-title', group.label),
      make(document, 'p', 'progress-group-count', `${group.opened} / ${group.total}`),
      list,
    )
    groups.append(card)
  }

  return groups
}

export function initProgressView(document, progress, { now = Date.now } = {}) {
  const section = document.querySelector('#progress-section')
  const data = document.querySelector('#progress-data')

  if (!section || !data) return null

  const notice = section.querySelector('#progress-notice')
  const status = section.querySelector('#progress-status')
  const note = section.querySelector('#progress-manage-note')
  const clearButton = section.querySelector('#progress-clear')
  const futureButton = section.querySelector('#progress-clear-future')
  const actions = section.querySelector('#progress-actions')
  const onReopen = (topic) => reopenTopic(document, topic)

  function finishClear(cleared, doneText) {
    status.textContent = cleared ? doneText : CLEAR_FAILED
    // Xóa dữ liệu của phiên bản mới hơn thất bại: không có ô tóm tắt, focus về chính nút đó thay vì rơi về <body>.
    const target = data.querySelector('[data-progress-summary]') ?? futureButton

    target.focus()
  }

  // Hai đường xóa dùng cùng khung xác nhận nhưng không lẫn nhau: đường thường từ chối khi kho đang giữ dữ liệu của phiên bản mới
  // hơn (clear() sẽ xóa luôn dữ liệu đó), đường riêng chỉ chạy khi đúng là dữ liệu đó. Trạng thái được đọc lại lúc xác nhận
  // vì tab khác có thể đã đổi nó từ lúc khung mở.
  const irreversible = 'Không thể hoàn tác.'
  const confirmBox = (id, future, title, message, doneText) => createConfirmBox(document, {
    id,
    title,
    message: `${message} ${irreversible}`,
    confirmLabel: 'Xóa',
    onConfirm() {
      if ((progress.readState().status === 'future-version') !== future) {
        status.textContent = 'Dữ liệu đã thay đổi ở tab khác nên chưa xóa gì.'

        return render()
      }

      finishClear(progress.clear(), doneText)
    },
  })
  const confirmClear = confirmBox(
    'progress-confirm-clear', false, 'Xóa lịch sử học tập?',
    'Danh sách chủ đề đã mở sẽ bị xóa khỏi trình duyệt này.', 'Đã xóa lịch sử học tập.',
  )
  const confirmFuture = confirmBox(
    'progress-confirm-future', true, 'Xóa dữ liệu của phiên bản mới hơn?',
    'Dữ liệu do một phiên bản AlgoVision mới hơn tạo ra sẽ bị xóa khỏi trình duyệt này.', 'Đã xóa dữ liệu của phiên bản mới hơn.',
  )

  // Vẽ lại CHỈ vùng dữ liệu và trạng thái nút: không đụng khung xác nhận đang mở (tab khác đổi dữ liệu không làm mất focus).
  function render() {
    const state = progress.readState()
    const future = state.status === 'future-version'
    const summary = summarizeProgress(state.progress, progress.catalog)
    const current = now()
    const row = (topic) => createTopicRow(document, topic, { now: current, onReopen })
    const text = progressNotice(state)
    const nothingToClear = summary.opened === 0 && state.status !== 'corrupt'
    const children = []

    notice.textContent = text ?? ''
    notice.hidden = text === null

    if (!future) {
      children.push(buildStats(document, summary, current), make(document, 'p', 'eyebrow progress-label', 'THEO NHÓM'), buildGroups(document, summary, row))

      const recent = make(document, 'h3', 'progress-recent-title', 'Mở gần đây')

      children.push(recent)

      if (summary.opened === 0) {
        const open = make(document, 'button', 'dashboard-primary-button', 'Mở Sắp xếp')

        open.type = 'button'
        open.addEventListener('click', () => openPage(document, 'sorting'))
        children.push(make(document, 'p', 'progress-empty', 'Bạn chưa mở chủ đề nào.'), open)
      } else {
        const list = make(document, 'ul', 'progress-topic-list progress-recent')

        list.append(...summary.recent.slice(0, RECENT_LIMIT).map((topic) => createTopicRow(document, topic, { variant: 'recent', now: current, onReopen })))
        children.push(list)
      }
    }

    data.replaceChildren(...children)
    clearButton.hidden = future
    futureButton.hidden = !future
    clearButton.setAttribute('aria-disabled', String(nothingToClear))
    note.textContent = !future && nothingToClear ? 'Chưa có gì để xóa' : ''
    note.hidden = note.textContent === ''
  }

  clearButton.addEventListener('click', () => {
    if (clearButton.getAttribute('aria-disabled') !== 'true') confirmClear.open(clearButton)
  })
  futureButton.addEventListener('click', () => confirmFuture.open(futureButton))
  actions.after(confirmClear.element, confirmFuture.element)

  document.addEventListener('algovision:viewchange', (event) => {
    if (event.detail?.page !== 'progress') return

    status.textContent = ''
    render()
  })
  progress.subscribe(render)
  render()

  return { render }
}
