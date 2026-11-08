// Điều khiển sidebar: thu gọn bằng tay (>= 1280px), rail 72px tự động (768-1279px), tooltip khi thu gọn và drawer (<= 767px).
// Trạng thái chỉ nằm trong bộ nhớ của phiên (mở lại trang thì về mặc định): file này KHÔNG chạm kho lưu trữ nào của
// trình duyệt (tests/meta/no-web-storage.test.js canh gác).
// Phải gọi SAU initNavigation: mục con của sidebar do navigation.js sinh ra.

// Phải bằng @media (max-width: 767px) của luật drawer trong style.css (tests/sidebar-rail.test.js so hai nơi).
export const DRAWER_BREAKPOINT = 767

// Dải rail 72px tự động (Spec mục 11: Tablet và Laptop). min phải bằng @media (min-width: 768px) của luật thu gọn trong style.css.
export const RAIL_RANGE = { min: 768, max: 1279 }

// options.matchMedia: inject cho test (happy-dom không tính CSS); mặc định dùng matchMedia của cửa sổ.
export function initSidebar(document, { matchMedia } = {}) {
  const layout = document.querySelector('.app-layout')
  const sidebar = document.querySelector('#sidebar')
  const collapseButton = document.querySelector('#sidebar-collapse')
  const toggleButton = document.querySelector('#sidebar-toggle')
  const overlay = document.querySelector('.sidebar-overlay')

  const mediaQuery = (text) => (matchMedia ? matchMedia(text) : document.defaultView?.matchMedia?.(text) ?? null)

  if (!layout || !sidebar || !collapseButton || !toggleButton) {
    return {
      toggleCollapse() {}, isCollapsed: () => false, openDrawer() {}, closeDrawer() {}, toggleDrawer() {}, isDrawerOpen: () => false,
    }
  }

  // --- Thu gọn -------------------------------------------------------------------------------------------------------

  // collapsed là trạng thái HIỆU LỰC: thu gọn bằng tay (manualCollapsed, nhớ trong bộ nhớ, đổi được ở >= 1280px) HOẶC đang ở dải rail.
  let manualCollapsed = false
  let collapsed = false
  const railQuery = mediaQuery(`(min-width: ${RAIL_RANGE.min}px) and (max-width: ${RAIL_RANGE.max}px)`)
  const isRail = () => railQuery?.matches === true

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

  function syncCollapsed() {
    collapsed = manualCollapsed || isRail()

    layout.classList.toggle('is-sidebar-collapsed', collapsed)
    collapseButton.setAttribute('aria-expanded', String(!collapsed))
    collapseButton.setAttribute('aria-label', collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên')
    hideTooltip()
  }

  function toggleCollapse() {
    manualCollapsed = !manualCollapsed
    syncCollapsed()
  }

  collapseButton.addEventListener('click', toggleCollapse)

  // Vào dải rail: CSS ẩn nút thu gọn. Nếu nút đang giữ focus thì chuyển sang mục điều hướng đang mở (hoặc mục đầu) để focus không rơi về body.
  railQuery?.addEventListener?.('change', () => {
    if (isRail() && document.activeElement === collapseButton) {
      (sidebar.querySelector('.nav-item.active') ?? sidebar.querySelector('.nav-item'))?.focus()
    }

    syncCollapsed()
  })

  syncCollapsed()

  // --- Drawer --------------------------------------------------------------------------------------------------------

  const query = mediaQuery(`(max-width: ${DRAWER_BREAKPOINT}px)`)
  const isNarrow = () => query?.matches === true

  // Khi drawer mở, nội dung chính và skip link bị inert (không focus, không bấm, ẩn khỏi trình đọc màn hình) nhưng KHÔNG
  // dùng role="dialog" và không bẫy focus: thanh trên chứa ☰ vẫn dùng được để đóng.
  const inertTargets = [document.querySelector('#main-content'), document.querySelector('.skip-link')].filter(Boolean)
  let drawerOpen = false

  function setDrawer(open) {
    drawerOpen = open

    sidebar.classList.toggle('is-open', open)
    document.body.classList.toggle('is-drawer-open', open)
    overlay?.classList.toggle('is-open', open)
    toggleButton.setAttribute('aria-expanded', String(open))
    toggleButton.setAttribute('aria-label', open ? 'Đóng menu điều hướng' : 'Mở menu điều hướng')

    for (const element of inertTargets) {
      if (open) {
        element.setAttribute('inert', '')
      } else {
        element.removeAttribute('inert')
      }
    }
  }

  function openDrawer() {
    // Ở màn hình rộng nút ☰ bị ẩn bằng CSS; không mở để khỏi sót trạng thái mở khi thu nhỏ cửa sổ sau đó.
    if (drawerOpen || !isNarrow()) return

    setDrawer(true)
    sidebar.querySelector('.nav-item')?.focus()
  }

  // restoreFocus: trả focus về ☰ (đóng do người dùng); false khi đóng vì cửa sổ rộng ra (không cướp focus).
  function closeDrawer({ restoreFocus = true } = {}) {
    if (!drawerOpen) return

    setDrawer(false)

    if (restoreFocus) toggleButton.focus()
  }

  function toggleDrawer() {
    if (drawerOpen) {
      closeDrawer()
    } else {
      openDrawer()
    }
  }

  toggleButton.addEventListener('click', toggleDrawer)
  overlay?.addEventListener('click', () => closeDrawer())

  // Chọn một mục: navigation.js (listener của chính nút) đã chuyển trang xong rồi sự kiện mới nổi lên tới đây.
  sidebar.addEventListener('click', (event) => {
    if (drawerOpen && itemOf(event)) closeDrawer()
  })

  query?.addEventListener?.('change', (event) => {
    if (!event.matches) closeDrawer({ restoreFocus: false })
  })

  // Escape: đóng drawer đang mở; đồng thời tắt tooltip (WCAG 1.4.13: nội dung hiện khi rê/focus phải đóng được mà không
  // phải dời con trỏ).
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return

    hideTooltip()
    closeDrawer()
  })

  return {
    toggleCollapse, isCollapsed: () => collapsed, openDrawer, closeDrawer, toggleDrawer, isDrawerOpen: () => drawerOpen,
  }
}
