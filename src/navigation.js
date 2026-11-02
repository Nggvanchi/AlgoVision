
const pages = {
  dashboard: {
    title: 'Tổng quan',
    description: 'Khám phá không gian học tập AlgoVision.',
  },
  sorting: {
    title: 'Thuật toán sắp xếp',
    description: 'Chọn một thuật toán để bắt đầu tìm hiểu.',
  },
  searching: {
    title: 'Thuật toán tìm kiếm',
    description: 'Tìm hiểu cách xác định vị trí của một giá trị trong dữ liệu.',
  },
  structures: {
    title: 'Cấu trúc dữ liệu',
    description: 'Chọn một cấu trúc dữ liệu để khám phá cách hoạt động.',
  },
}

export function initNavigation(document) {
  const navItems = document.querySelectorAll('.nav-item')

  const dashboardSection = document.querySelector('#dashboard-section')
  const pageHeading = document.querySelector('.page-heading')

  const sortingLibrary = document.querySelector('.algorithm-section')
  const sortingVisualizer = document.querySelector('#sorting-section')

  const searchLibrary = document.querySelector('#search-algorithm-library')
  const searchVisualizer = document.querySelector('#search-section')

  const categoryPlaceholder = document.querySelector('#category-placeholder')
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

  const placeholderTitle = document.querySelector('#placeholder-title')
  const placeholderDescription = document.querySelector('#placeholder-description')

  let currentPage = 'dashboard'

  function hideAllSections() {
    dashboardSection.hidden = true
    sortingLibrary.hidden = true
    sortingVisualizer.hidden = true
    searchLibrary.hidden = true
    searchVisualizer.hidden = true
    categoryPlaceholder.hidden = true
    structureLibrary.hidden = true
    structureSections.forEach((section) => {
      section.hidden = true
    })
  }

  function updateNavigation(pageName) {
    navItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.page === pageName)
    })
  }

  // Báo cho các module mô phỏng biết màn hình vừa đổi để tự tạm dừng nếu bị ẩn.
  function notifyViewChange() {
    const CustomEventClass = document.defaultView?.CustomEvent ?? CustomEvent

    document.dispatchEvent(
      new CustomEventClass('algovision:viewchange', {
        detail: { page: currentPage },
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

    hideAllSections()
    updateNavigation(pageName)

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

      if (placeholderTitle) {
        placeholderTitle.textContent = pages.structures.title
      }

      if (placeholderDescription) {
        placeholderDescription.textContent = pages.structures.description
      }
    }
  }

  function showSortingDetail() {
    if (currentPage !== 'sorting') return

    sortingLibrary.hidden = true
    sortingVisualizer.hidden = false
    notifyViewChange()
  }

  function showSortingLibrary() {
    if (currentPage !== 'sorting') return

    sortingVisualizer.hidden = true
    sortingLibrary.hidden = false
    notifyViewChange()
  }

  function showSearchingDetail() {
    if (currentPage !== 'searching') return

    searchLibrary.hidden = true
    searchVisualizer.hidden = false
    notifyViewChange()
  }

  function showSearchingLibrary() {
    if (currentPage !== 'searching') return

    searchVisualizer.hidden = true
    searchLibrary.hidden = false
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
    card.addEventListener('click', showSortingDetail)
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

      showSearchingDetail()
    })
  })

  document
    .querySelector('[data-back-to-sorting-algorithms]')
    ?.addEventListener('click', showSortingLibrary)

  document
    .querySelector('[data-back-to-search-algorithms]')
    ?.addEventListener('click', showSearchingLibrary)

  structureCards.forEach((card) => {
    card.addEventListener('click', () => {
      if (currentPage !== 'structures') return

      const target = card.dataset.structureTarget
      if (!structureSections.has(target)) return

      structureLibrary.hidden = true
      structureSections.forEach((section, sectionTarget) => {
        section.hidden = sectionTarget !== target
      })
      notifyViewChange()
    })
  })

  document.querySelectorAll('[data-back-to-structures]').forEach((button) => {
    button.addEventListener('click', () => {
      showPage('structures')
    })
  })

  showPage('dashboard')
}
