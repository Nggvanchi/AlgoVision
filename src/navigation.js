
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
  const sortingVisualizer = document.querySelector(
    'main > .visualizer-section:not(#search-section):not(#category-placeholder):not(#structure-library):not(#array-section):not(#stack-section):not(#queue-section):not(#linked-list-section)',
  )

  const searchLibrary = document.querySelector('#search-algorithm-library')
  const searchVisualizer = document.querySelector('#search-section')

  const categoryPlaceholder = document.querySelector('#category-placeholder')
  const structureLibrary = document.querySelector('#structure-library')
  const arraySection = document.querySelector('#array-section')
  const stackSection = document.querySelector('#stack-section')
  const queueSection = document.querySelector('#queue-section')
  const linkedListSection = document.querySelector('#linked-list-section')

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
    arraySection.hidden = true
    stackSection.hidden = true
    queueSection.hidden = true
    linkedListSection.hidden = true
  }

  function updateNavigation(pageName) {
    navItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.page === pageName)
    })
  }

  function showPage(pageName) {
    if (!pages[pageName]) return

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
  }

  function showSortingLibrary() {
    if (currentPage !== 'sorting') return

    sortingVisualizer.hidden = true
    sortingLibrary.hidden = false
  }

  function showSearchingDetail() {
    if (currentPage !== 'searching') return

    searchLibrary.hidden = true
    searchVisualizer.hidden = false
  }

  function showSearchingLibrary() {
    if (currentPage !== 'searching') return

    searchVisualizer.hidden = true
    searchLibrary.hidden = false
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

  document.querySelectorAll('[data-structure-target]').forEach((card) => {
    card.addEventListener('click', () => {
      if (currentPage !== 'structures') return

      const target = card.dataset.structureTarget

      structureLibrary.hidden = true
      arraySection.hidden = target !== 'array'
      stackSection.hidden = target !== 'stack'
      queueSection.hidden = target !== 'queue'
      linkedListSection.hidden = target !== 'linked-list'
    })
  })

  document.querySelectorAll('[data-back-to-structures]').forEach((button) => {
    button.addEventListener('click', () => {
      showPage('structures')
    })
  })

  showPage('dashboard')
}
