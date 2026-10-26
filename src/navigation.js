
const pages = {
  sorting: {
    title: 'Thuật toán sắp xếp',
    description: 'Chọn một thuật toán để bắt đầu tìm hiểu.',
  },
  searching: {
    title: 'Thuật toán tìm kiếm',
    description:
      'Tìm hiểu cách xác định vị trí của một giá trị trong dữ liệu.',
    cardTitle: 'Linear Search và Binary Search',
    cardDescription:
      'Phần tiếp theo sẽ bổ sung mô phỏng tìm kiếm từng bước, đánh dấu phần tử đang kiểm tra và hiển thị kết quả tìm thấy.',
  },
  structures: {
    title: 'Cấu trúc dữ liệu',
    description:
      'Chọn một cấu trúc dữ liệu để khám phá cách hoạt động.',
  },
}

export function initNavigation(document) {
  const navItems = document.querySelectorAll('.nav-item')
  const algorithmSection = document.querySelector('.algorithm-section')
  const searchSection = document.querySelector('#search-section')
  const visualizerSection = document.querySelector(
    'main > .visualizer-section:not(#search-section):not(#category-placeholder):not(#structure-library):not(#array-section):not(#stack-section):not(#linked-list-section)',
  )
  const categoryPlaceholder = document.querySelector(
    '#category-placeholder',
  )
  const arraySection = document.querySelector('#array-section')
  const stackSection = document.querySelector('#stack-section')
  const linkedListSection = document.querySelector('#linked-list-section')
  const structureLibrary = document.querySelector('#structure-library')

  const placeholderTitle = document.querySelector('#placeholder-title')
  const placeholderDescription = document.querySelector(
    '#placeholder-description',
  )
  const placeholderCardTitle = document.querySelector(
    '#placeholder-card-title',
  )
  const placeholderCardDescription = document.querySelector(
    '#placeholder-card-description',
  )

  let currentPage = 'sorting'

  function showPage(pageName) {
    const page = pages[pageName]

    if (!page) return

    currentPage = pageName

    navItems.forEach((item) => {
      item.classList.toggle(
        'active',
        item.dataset.page === pageName,
      )
    })

    const isSortingPage = pageName === 'sorting'
    const isSearchingPage = pageName === 'searching'
    const isStructuresPage = pageName === 'structures'

    algorithmSection.hidden = !isSortingPage
    visualizerSection.hidden = !isSortingPage
    searchSection.hidden = !isSearchingPage
    categoryPlaceholder.hidden = true

    structureLibrary.hidden = !isStructuresPage
    arraySection.hidden = true
    stackSection.hidden = true
    linkedListSection.hidden = true

    if (isSearchingPage) {
      placeholderTitle.textContent = page.title
      placeholderDescription.textContent = page.description
      placeholderCardTitle.textContent = page.cardTitle
      placeholderCardDescription.textContent = page.cardDescription
    }

    if (isStructuresPage) {
      placeholderTitle.textContent = page.title
      placeholderDescription.textContent = page.description
    }
  }

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      showPage(item.dataset.page)
    })
  })

  document.querySelectorAll('[data-structure-target]').forEach((card) => {
    card.addEventListener('click', () => {
      if (currentPage !== 'structures') return

      const target = card.dataset.structureTarget

      if (target === 'array') {
        structureLibrary.hidden = true
        arraySection.hidden = false
      } else if (target === 'stack') {
        structureLibrary.hidden = true
        stackSection.hidden = false
      } else if (target === 'linked-list') {
        structureLibrary.hidden = true
        linkedListSection.hidden = false
      }
    })
  })

  document.querySelectorAll('[data-back-to-structures]').forEach(
    (button) => {
      button.addEventListener('click', () => {
        showPage('structures')
      })
    },
  )

  showPage('sorting')
}
