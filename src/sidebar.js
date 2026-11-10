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
  const drawerShell = document.querySelector('.drawer-shell')
  const sidebar = document.querySelector('#sidebar')
  const navItemSelector = '.nav-item'
  const firstNavItem = sidebar?.querySelector(navItemSelector)
  const body = document.body
  const closeButton = document.querySelector('#sidebar-close')
  const collapseButton = document.querySelector('#sidebar-collapse')
  const toggleButton = document.querySelector('#sidebar-toggle')
  const overlay = document.querySelector('.sidebar-overlay')

  const mediaQuery = (text) => matchMedia ? matchMedia(text) : document.defaultView?.matchMedia?.(text)

  if (!layout || !drawerShell || !sidebar || !closeButton || !collapseButton || !toggleButton) {
    return {
      toggleCollapse() {}, isCollapsed: () => false, isAutoCollapsed: () => false,
      openDrawer() {}, closeDrawer() {}, toggleDrawer() {}, isDrawerOpen: () => false,
    }
  }

  // --- Thu gọn -------------------------------------------------------------------------------------------------------

  const query = mediaQuery(`(max-width: ${DRAWER_BREAKPOINT}px)`)
  const isNarrow = () => query?.matches

  const railQuery = mediaQuery(`(min-width: ${RAIL_RANGE.min}px) and (max-width: ${RAIL_RANGE.max}px)`)
  const isRail = () => railQuery?.matches

  // collapsed là trạng thái HIỆU LỰC: thu gọn bằng tay (manualCollapsed, nhớ trong bộ nhớ, đổi được ở >= 1280px),
  // tự động thu gọn khi ở màn hình Visualizer desktop (autoCollapsed), HOẶC đang ở dải rail tablet/laptop.
  let manualCollapsed = false
  let inVisualizer = false
  let stateBeforeVisualizer = null
  let autoCollapsed = false
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
    // Ở drawer (<= 767px) CSS không thu gọn nên nhãn hiện đầy đủ: không tooltip dù trạng thái thu gọn bằng tay còn nhớ.
    if (!collapsed || isNarrow()) return

    const rect = item.getBoundingClientRect()

    tooltip.textContent = item.querySelector('.nav-label')?.textContent.trim() ?? ''
    // Căn theo mép phải của sidebar (không phải của nút): nút nằm lọt trong lề của sidebar thu gọn.
    tooltip.style.left = `${sidebar.getBoundingClientRect().right + 8}px`
    tooltip.style.top = `${rect.top + rect.height / 2}px`
    tooltip.classList.add('is-visible')
  }

  const itemOf = (event) => event.target.closest(`${navItemSelector}, .nav-subitem`)

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
    if (inVisualizer && !isRail() && !isNarrow() && stateBeforeVisualizer === false) autoCollapsed = true

    collapsed = manualCollapsed || autoCollapsed || isRail()

    layout.classList.toggle('is-sidebar-collapsed', collapsed)
    collapseButton.setAttribute('aria-expanded', String(!collapsed))
    collapseButton.setAttribute('aria-label', collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên')
    hideTooltip()
  }

  function toggleCollapse() {
    manualCollapsed = isRail() ? !manualCollapsed : !collapsed

    if (inVisualizer) {
      autoCollapsed = false
      stateBeforeVisualizer = null
    }

    syncCollapsed()
  }

  function handleViewChange(topic) {
    const nextInVisualizer = topic !== null

    if (nextInVisualizer && !inVisualizer) {
      inVisualizer = true
      stateBeforeVisualizer = manualCollapsed
      syncCollapsed()
    } else if (!nextInVisualizer && inVisualizer) {
      inVisualizer = false
      autoCollapsed = false
      stateBeforeVisualizer = null
      syncCollapsed()
    }
  }

  document.addEventListener('algovision:viewchange', (event) => {
    handleViewChange(event.detail?.topic ?? null)
  })

  collapseButton.addEventListener('click', toggleCollapse)

  // Vào dải rail: CSS ẩn nút thu gọn. Nếu nút đang giữ focus thì chuyển sang mục điều hướng đang mở (hoặc mục đầu) để focus không rơi về body.
  // Chrome ẩn (display: none) và blur nút TRƯỚC khi báo change nên activeElement đã là body: nhớ nút vừa giữ focus. Cờ tắt khi focus sang
  // phần tử khác hoặc khi bấm chuột ở đâu đó (bấm ra ngoài = người dùng chủ động bỏ focus).
  let collapseHadFocus = false
  document.addEventListener('focusin', (event) => { collapseHadFocus = event.target === collapseButton })
  document.addEventListener('pointerdown', () => { collapseHadFocus = false })

  railQuery?.addEventListener?.('change', () => {
    const active = document.activeElement

    if (isRail() && (active === collapseButton || (collapseHadFocus && active === document.body))) {
      (sidebar.querySelector('.nav-item.active') ?? sidebar.querySelector('.nav-item'))?.focus()
    }

    syncCollapsed()
  })

  syncCollapsed()

  // --- Drawer --------------------------------------------------------------------------------------------------------

  // Wrapper chứa cả thanh trên (nút ☰) và sidebar để trigger đóng vẫn nằm trong dialog modal.
  const mainContent = document.querySelector('#main-content')
  const inertTargets = [mainContent, document.querySelector('.skip-link')].filter(Boolean)
  const inertAddedByDrawer = new Set()
  const FOCUSABLE_SELECTOR = 'a[href], area[href], button, input, select, textarea, iframe, [contenteditable="true"], [tabindex]'
  const getComputedStyle = document.defaultView?.getComputedStyle?.bind(document.defaultView)
  let drawerOpen = false
  let drawerOpener = null
  let lastFocusInside = null
  let redirectingFocus = false

  function isFocusableAndVisible(element) {
    if (!element?.isConnected || element.disabled || element.hidden
      || element.tabIndex < 0 && element !== drawerShell && element !== mainContent) return false
    if (element.closest('[hidden], [inert], [aria-hidden=true]')) return false
    if (isNarrow() ? element.closest('.sidebar-footer') : element === toggleButton || element === closeButton) return false

    if (getComputedStyle) {
      for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor)
        if (style.display === 'none' || style.visibility === 'hidden') return false
        if (ancestor === drawerShell) break
      }
    }

    return true
  }

  function focusableElements() {
    return [...drawerShell.querySelectorAll(FOCUSABLE_SELECTOR)].filter(isFocusableAndVisible)
  }

  function focusInsideDialog(target = null) {
    const candidates = focusableElements()
    for (const destination of new Set([target, firstNavItem, ...candidates])) {
      if (candidates.includes(destination) && focusIfAvailable(destination)) {
        lastFocusInside = destination
        return
      }
    }

    if (focusIfAvailable(drawerShell)) lastFocusInside = drawerShell
  }

  function focusIfAvailable(element) {
    if (!isFocusableAndVisible(element)) return false

    try {
      element.focus()
      return element.getRootNode?.()?.activeElement === element
    } catch {
      return false
    }
  }

  function fallbackAfterResponsiveClose() {
    if (isNarrow()) return focusIfAvailable(mainContent)

    const activeNav = sidebar.querySelector('.nav-subitem.active')
      ?? sidebar.querySelector(`${navItemSelector}.active`)
      ?? sidebar.querySelector(navItemSelector)

    return focusIfAvailable(activeNav) || focusIfAvailable(mainContent)
  }

  function updateDialogSemantics(open) {
    const update = open ? 'setAttribute' : 'removeAttribute'
    drawerShell[update]('role', 'dialog')
    drawerShell[update]('aria-label', 'Điều hướng chính')
    drawerShell[update]('aria-modal', 'true')
  }

  function setDrawer(open) {
    drawerOpen = open

    sidebar.classList.toggle('is-open', open)
    body.classList.toggle('is-drawer-open', open)
    overlay?.classList.toggle('is-open', open)
    toggleButton.setAttribute('aria-expanded', String(open))
    toggleButton.setAttribute('aria-label', open ? 'Đóng menu điều hướng' : 'Mở menu điều hướng')
    updateDialogSemantics(open)

    for (const element of inertTargets) {
      if (open) {
        if (!element.hasAttribute('inert')) {
          element.setAttribute('inert', '')
          inertAddedByDrawer.add(element)
        }
      } else if (inertAddedByDrawer.has(element)) {
        element.removeAttribute('inert')
        inertAddedByDrawer.delete(element)
      }
    }
  }

  function openDrawer(opener = toggleButton) {
    // Ở màn hình rộng nút ☰ bị ẩn bằng CSS; không mở để khỏi sót trạng thái mở khi thu nhỏ cửa sổ sau đó.
    if (drawerOpen || !isNarrow()) return

    drawerOpener = opener
    setDrawer(true)
    focusInsideDialog(firstNavItem)
  }

  function restoreOpenerFocus() {
    const opener = drawerOpener
    drawerOpener = null
    lastFocusInside = null

    if (!focusIfAvailable(opener)) fallbackAfterResponsiveClose()
  }

  // restoreFocus=false chỉ dùng khi đổi breakpoint; focus ở nav còn hiện trên desktop thì được giữ nguyên.
  function closeDrawer({ restoreFocus = true } = {}) {
    if (!drawerOpen) return

    setDrawer(false)

    if (restoreFocus) restoreOpenerFocus()
    else {
      drawerOpener = null
      lastFocusInside = null
    }
  }

  function toggleDrawer(opener = toggleButton) {
    drawerOpen ? closeDrawer() : openDrawer(opener)
  }

  toggleButton.addEventListener('click', () => toggleDrawer(toggleButton))
  closeButton.addEventListener('click', () => closeDrawer())
  overlay?.addEventListener('click', () => closeDrawer())

  drawerShell.addEventListener('keydown', (event) => {
    if (!drawerOpen || event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return

    const focusable = focusableElements()
    if (focusable.length === 0) {
      event.preventDefault()
      focusInsideDialog()
      return
    }

    const activeIndex = focusable.indexOf(document.activeElement)
    if (event.shiftKey && activeIndex <= 0) {
      event.preventDefault()
      focusable.at(-1).focus()
    } else if (!event.shiftKey && (activeIndex === focusable.length - 1 || activeIndex === -1)) {
      event.preventDefault()
      focusable[0].focus()
    }
  })

  document.addEventListener('focusin', (event) => {
    if (!drawerOpen || redirectingFocus) return

    if (drawerShell.contains(event.target)) {
      if (isFocusableAndVisible(event.target) || event.target === drawerShell) lastFocusInside = event.target
      return
    }

    redirectingFocus = true
    try {
      focusInsideDialog(lastFocusInside)
    } finally {
      redirectingFocus = false
    }
  })

  // Chọn một mục: navigation.js (listener của chính nút) đã chuyển trang xong rồi sự kiện mới nổi lên tới đây.
  sidebar.addEventListener('click', (event) => {
    if (drawerOpen && itemOf(event)) closeDrawer()
  })

  query?.addEventListener?.('change', (event) => {
    if (!event.matches && drawerOpen) {
      const active = document.activeElement
      const rememberedFocus = lastFocusInside
      closeDrawer({ restoreFocus: false })

      if (!focusIfAvailable(active) && !focusIfAvailable(rememberedFocus)) fallbackAfterResponsiveClose()
    }
    syncCollapsed()
  })

  // Escape: đóng drawer đang mở; đồng thời tắt tooltip (WCAG 1.4.13: nội dung hiện khi rê/focus phải đóng được mà không
  // phải dời con trỏ).
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideTooltip()
      if (drawerOpen) {
        event.preventDefault()
        closeDrawer()
      }
    }
  })

  return {
    toggleCollapse,
    isCollapsed: () => collapsed,
    isAutoCollapsed: () => autoCollapsed,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    isDrawerOpen: () => drawerOpen,
  }
}
