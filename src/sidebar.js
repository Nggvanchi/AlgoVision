// Điều khiển sidebar: thu gọn thanh bên ở màn hình rộng và tooltip tên mục khi đang thu gọn.
// Trạng thái chỉ nằm trong bộ nhớ của phiên (mở lại trang thì mở rộng như mặc định): file này KHÔNG chạm kho lưu trữ nào của
// trình duyệt (chỉ src/progress-init.js được phép, tests/meta/progress-storage-boundary.test.js canh gác).
// Phải gọi SAU initNavigation: mục con của sidebar do navigation.js sinh ra.

export function initSidebar(document) {
  const layout = document.querySelector('.app-layout')
  const sidebar = document.querySelector('#sidebar')
  const collapseButton = document.querySelector('#sidebar-collapse')

  if (!layout || !sidebar || !collapseButton) {
    return { toggleCollapse() {}, isCollapsed: () => false }
  }

  let collapsed = false

  // Tooltip là MỘT phần tử dùng chung, vị trí fixed: nếu là ::after của từng nút thì vùng cuộn .sidebar-scroll cắt mất.
  // Tên truy cập của mục luôn là chữ thật trong .nav-label (clip, không display: none); tooltip chỉ là phần phụ cho người nhìn.
  const tooltip = document.createElement('div')
  tooltip.className = 'sidebar-tooltip'
  tooltip.setAttribute('aria-hidden', 'true')
  layout.append(tooltip)

  function hideTooltip() {
    tooltip.classList.remove('is-visible')
  }

  function showTooltip(item) {
    if (!collapsed) return

    const rect = item.getBoundingClientRect()

    tooltip.textContent = item.querySelector('.nav-label')?.textContent.trim() ?? ''
    // Căn theo mép phải của sidebar (không phải của nút): nút nằm lọt trong lề của sidebar thu gọn.
    tooltip.style.left = `${sidebar.getBoundingClientRect().right + 8}px`
    tooltip.style.top = `${rect.top + rect.height / 2}px`
    tooltip.classList.add('is-visible')
  }

  const itemOf = (event) => event.target.closest?.('.nav-item, .nav-subitem') ?? null

  // Chỉ focus bằng bàn phím mới hiện tooltip (:focus-visible); bấm chuột vào nút không làm tooltip nhấp nháy.
  function isKeyboardFocus(item) {
    try {
      return item.matches(':focus-visible')
    } catch {
      return true
    }
  }

  sidebar.addEventListener('mouseover', (event) => {
    const item = itemOf(event)
    if (item) showTooltip(item)
  })
  sidebar.addEventListener('mouseout', (event) => {
    if (itemOf(event)) hideTooltip()
  })
  sidebar.addEventListener('focusin', (event) => {
    const item = itemOf(event)
    if (item && isKeyboardFocus(item)) showTooltip(item)
  })
  sidebar.addEventListener('focusout', hideTooltip)

  // WCAG 1.4.13: nội dung hiện khi rê/focus phải tắt được bằng Escape mà không phải dời con trỏ.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hideTooltip()
  })

  function toggleCollapse() {
    collapsed = !collapsed

    layout.classList.toggle('is-sidebar-collapsed', collapsed)
    collapseButton.setAttribute('aria-expanded', String(!collapsed))
    collapseButton.setAttribute('aria-label', collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên')
    hideTooltip()
  }

  collapseButton.addEventListener('click', toggleCollapse)

  return { toggleCollapse, isCollapsed: () => collapsed }
}
