import { topicId } from './progress-store.js'

const pages = {
  dashboard: { title: 'Tổng quan' },
  sorting: { title: 'Thuật toán sắp xếp' },
  searching: { title: 'Thuật toán tìm kiếm' },
  structures: { title: 'Cấu trúc dữ liệu' },
}

const BREADCRUMB_ROOT = 'Không gian học tập'
const TITLE_SUFFIX = 'AlgoVision'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

// Icon từ sprite trong template (`<symbol id="icon-...">`). Nút của mục con chỉ ghép id từ data-structure-target, nên không có danh sách icon
// thứ hai trong JS; tests/sidebar-icons.test.js kiểm mỗi cấu trúc có symbol.
function createIcon(document, symbolId) {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
  const use = document.createElementNS(SVG_NAMESPACE, 'use')

  svg.setAttribute('focusable', 'false')
  use.setAttribute('href', `#${symbolId}`)
  svg.append(use)

  return svg
}

export function initNavigation(document) {
  const navItems = document.querySelectorAll('.nav-item')

  const dashboardSection = document.querySelector('#dashboard-section')
  const pageHeading = document.querySelector('.page-heading')

  const sortingLibrary = document.querySelector('.algorithm-section')
  const sortingVisualizer = document.querySelector('#sorting-section')

  const searchLibrary = document.querySelector('#search-algorithm-library')
  const searchVisualizer = document.querySelector('#search-section')

  const structureLibrary = document.querySelector('#structure-library')
  const structureCards = [...document.querySelectorAll('[data-structure-target]')]
  // Mỗi thẻ data-structure-target="x" mở section #x-section; thêm cấu trúc mới không cần sửa file này.
  // Thẻ không có section tương ứng bị bỏ qua khi click (thư viện giữ nguyên).
  const structureSections = new Map(
    structureCards
      .map((card) => card.dataset.structureTarget)
      .map((target) => [target, document.querySelector(`#${target}-section`)])
      .filter(([, section]) => section !== null),
  )

  const structureNavList = document.querySelector('#structure-nav-list')
  let structureNavItems = []

  let currentPage = 'dashboard'
  // Cấu trúc đang mở ở màn chi tiết (null ở thư viện và mọi trang khác). Quyết định mục con nào active/aria-current.
  let currentStructure = null
  // Nhãn của thuật toán/cấu trúc đang mở ở màn chi tiết (null ở thư viện và trang khác); lấy từ chính DOM, không có danh sách thứ hai.
  let currentDetail = null
  // Tổng quan giữ tiêu đề gốc của index.html; các màn khác là "<mục cuối> - AlgoVision".
  const baseTitle = document.title
  const breadcrumb = document.querySelector('.topbar .breadcrumb')

  const textOf = (element, fallback) => element?.textContent.replace(/\s+/g, ' ').trim() || fallback

  function hideAllSections() {
    dashboardSection.hidden = true
    sortingLibrary.hidden = true
    sortingVisualizer.hidden = true
    searchLibrary.hidden = true
    searchVisualizer.hidden = true
    structureLibrary.hidden = true
    structureSections.forEach((section) => {
      section.hidden = true
    })
  }

  // Mục cha (.nav-item) active theo trang; ở chi tiết một cấu trúc, mục con tương ứng cũng active. aria-current="page" chỉ
  // nằm trên ĐÚNG MỘT phần tử: mục con khi đang ở chi tiết cấu trúc, ngược lại là .nav-item của trang (mục cha không giữ
  // aria-current cùng lúc, nếu không trình đọc màn hình báo hai "trang hiện tại").
  function updateNavigation() {
    navItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.page === currentPage)
    })
    structureNavItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.structureNav === currentStructure)
    })

    const current = currentStructure === null
      ? [...navItems].find((item) => item.dataset.page === currentPage)
      : structureNavItems.find((item) => item.dataset.structureNav === currentStructure)

    ;[...navItems, ...structureNavItems].forEach((item) => {
      if (item === current) {
        item.setAttribute('aria-current', 'page')
      } else {
        item.removeAttribute('aria-current')
      }
    })
  }

  // Breadcrumb (chỉ chữ, mục cuối đậm) và document.title theo màn hình hiện tại. Không phát sự kiện nào.
  function renderTopbar() {
    const labels = [BREADCRUMB_ROOT, pages[currentPage].title]

    if (currentDetail !== null) labels.push(currentDetail)

    if (breadcrumb) {
      breadcrumb.replaceChildren(
        ...labels.map((label, index) => {
          const item = document.createElement('li')

          if (index === labels.length - 1) {
            const last = document.createElement('strong')

            last.textContent = label
            item.append(last)
          } else {
            item.textContent = label
          }

          return item
        }),
      )
    }

    document.title = currentPage === 'dashboard' ? baseTitle : `${labels.at(-1)} - ${TITLE_SUFFIX}`
  }

  // Báo cho các module mô phỏng biết màn hình vừa đổi để tự tạm dừng nếu bị ẩn.
  // topic là id chủ đề (vd 'sorting:bubble') khi mở màn chi tiết; null ở dashboard, thư viện và khi quay lại.
  function notifyViewChange(topic = null) {
    renderTopbar()

    const CustomEventClass = document.defaultView?.CustomEvent ?? CustomEvent

    document.dispatchEvent(
      new CustomEventClass('algovision:viewchange', {
        detail: { page: currentPage, topic },
      }),
    )
  }

  function showPage(pageName) {
    if (!pages[pageName]) return

    renderPage(pageName)
    notifyViewChange()
  }

  function renderPage(pageName) {
    currentPage = pageName
    currentStructure = null
    currentDetail = null

    hideAllSections()
    updateNavigation()

    if (pageHeading) {
      pageHeading.hidden = pageName === 'dashboard'
    }

    if (pageName === 'dashboard') {
      dashboardSection.hidden = false
      return
    }

    if (pageName === 'sorting') {
      sortingLibrary.hidden = false
      return
    }

    if (pageName === 'searching') {
      searchLibrary.hidden = false
      return
    }

    if (pageName === 'structures') {
      structureLibrary.hidden = false
    }
  }

  function showSortingDetail(algorithm) {
    if (currentPage !== 'sorting') return

    sortingLibrary.hidden = true
    sortingVisualizer.hidden = false
    currentDetail = textOf(document.querySelector(`.algorithm-card[data-algorithm="${algorithm}"] h4`), algorithm)
    notifyViewChange(topicId('sorting', algorithm))
  }

  function showSortingLibrary() {
    if (currentPage !== 'sorting') return

    sortingVisualizer.hidden = true
    sortingLibrary.hidden = false
    currentDetail = null
    notifyViewChange()
  }

  const searchLabel = (algorithm) => textOf(document.querySelector(`[data-search-algorithm="${algorithm}"] h4`), algorithm)

  function showSearchingDetail(algorithm) {
    if (currentPage !== 'searching') return

    searchLibrary.hidden = true
    searchVisualizer.hidden = false
    currentDetail = searchLabel(algorithm)
    notifyViewChange(topicId('searching', algorithm))
  }

  function showSearchingLibrary() {
    if (currentPage !== 'searching') return

    searchVisualizer.hidden = true
    searchLibrary.hidden = false
    currentDetail = null
    notifyViewChange()
  }

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      showPage(item.dataset.page)
    })
  })

  document.querySelectorAll('[data-dashboard-target]').forEach((card) => {
    card.addEventListener('click', () => {
      showPage(card.dataset.dashboardTarget)
    })
  })

  document.querySelectorAll('.algorithm-card[data-algorithm]').forEach((card) => {
    card.addEventListener('click', () => showSortingDetail(card.dataset.algorithm))
  })

  document.querySelectorAll('[data-search-algorithm]').forEach((card) => {
    card.addEventListener('click', () => {
      const algorithm = card.dataset.searchAlgorithm
      const select = document.querySelector('#search-algorithm')

      if (select) {
        select.value = algorithm

        const EventClass = document.defaultView?.Event ?? Event

        select.dispatchEvent(
          new EventClass('change', { bubbles: true }),
        )
      }

      document.querySelectorAll('[data-search-algorithm]').forEach((item) => {
        item.classList.toggle('selected', item === card)
      })

      showSearchingDetail(algorithm)
    })
  })

  // Đổi thuật toán bằng #search-algorithm ngay trong màn chi tiết (không phát viewchange): chỉ cập nhật breadcrumb và title.
  document.querySelector('#search-algorithm')?.addEventListener('change', (event) => {
    if (currentPage !== 'searching' || searchVisualizer.hidden) return

    currentDetail = searchLabel(event.target.value)
    renderTopbar()
  })

  document
    .querySelector('[data-back-to-sorting-algorithms]')
    ?.addEventListener('click', showSortingLibrary)

  document
    .querySelector('[data-back-to-search-algorithms]')
    ?.addEventListener('click', showSearchingLibrary)

  // Mở màn chi tiết của một cấu trúc và phát ĐÚNG MỘT viewchange (topic = structure:<tên>). Thẻ ở thư viện và mục con của
  // sidebar dùng chung hàm này. Trả về false khi không có section tương ứng (không đổi gì, không phát sự kiện).
  function openStructure(target) {
    if (!structureSections.has(target)) return false

    structureLibrary.hidden = true
    structureSections.forEach((section, sectionTarget) => {
      section.hidden = sectionTarget !== target
    })
    currentStructure = target
    currentDetail = textOf(structureNavItems.find((item) => item.dataset.structureNav === target)?.querySelector('.nav-label'), target)
    updateNavigation()
    notifyViewChange(topicId('structure', target))

    return true
  }

  structureCards.forEach((card) => {
    card.addEventListener('click', () => {
      if (currentPage !== 'structures') return

      openStructure(card.dataset.structureTarget)
    })
  })

  // Mục con của sidebar sinh từ chính các thẻ [data-structure-target] (nhãn lấy từ thẻ, icon là symbol SVG cùng tên), nên danh sách chỉ có một
  // nguồn. Nút dùng data-structure-nav và class nav-subitem, KHÔNG dùng data-structure-target (initProgress đếm chủ đề theo
  // thuộc tính đó) và KHÔNG dùng class nav-item (nhiều test lấy .nav-item đầu tiên).
  function renderStructureNav() {
    if (!structureNavList) return

    structureCards
      .filter((card) => structureSections.has(card.dataset.structureTarget))
      .forEach((card) => {
        const target = card.dataset.structureTarget
        const item = document.createElement('li')
        const button = document.createElement('button')
        const icon = document.createElement('span')
        const label = document.createElement('span')

        button.type = 'button'
        button.className = 'nav-subitem'
        button.dataset.structureNav = target
        icon.className = 'nav-icon'
        icon.setAttribute('aria-hidden', 'true')
        icon.append(createIcon(document, `icon-structure-${target}`))
        label.className = 'nav-label'
        label.textContent = card.querySelector('.structure-card-title')?.textContent.trim() ?? target
        button.append(icon, label)
        item.append(button)
        structureNavList.append(item)

        button.addEventListener('click', () => {
          // Bấm lại cấu trúc đang mở: không phát gì (không viewchange, không ghi tiến độ).
          if (currentPage === 'structures' && currentStructure === target) return

          // renderPage (không phát sự kiện) rồi openStructure: từ trang khác chỉ có MỘT viewchange, không có sự kiện
          // topic null xen giữa (sự kiện đó sẽ làm initProgress/mô phỏng xử lý hai lần).
          if (currentPage !== 'structures') renderPage('structures')
          openStructure(target)
        })
      })

    structureNavItems = [...structureNavList.querySelectorAll('.nav-subitem')]
  }

  renderStructureNav()

  document.querySelectorAll('[data-back-to-structures]').forEach((button) => {
    button.addEventListener('click', () => {
      showPage('structures')
    })
  })

  showPage('dashboard')
}
