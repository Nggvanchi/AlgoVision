
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
      'Khám phá cách tổ chức, lưu trữ và thao tác với dữ liệu.',
    cardTitle: 'Array, Stack, Queue, Linked List, Tree và Graph',
    cardDescription:
      'Các cấu trúc dữ liệu sẽ được bổ sung theo từng giai đoạn, kèm thao tác thêm, xóa, tìm kiếm và hình minh họa trực quan.',
  },
}

export function initNavigation(document) {
  const navItems = document.querySelectorAll('.nav-item')
  const algorithmSection = document.querySelector('.algorithm-section')
  const searchSection = document.querySelector('#search-section')
  const visualizerSection = document.querySelector('.visualizer-section')
  const categoryPlaceholder = document.querySelector(
    '#category-placeholder',
  )
  const arraySection = document.querySelector('#array-section')

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

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const page = pages[item.dataset.page]

      if (!page) return

      navItems.forEach((navItem) => {
        navItem.classList.toggle('active', navItem === item)
      })

      const isSortingPage = item.dataset.page === 'sorting'
      const isSearchingPage = item.dataset.page === 'searching'
      const isStructuresPage = item.dataset.page === 'structures'

      algorithmSection.hidden = !isSortingPage
      visualizerSection.hidden = !isSortingPage
      searchSection.hidden = !isSearchingPage
      arraySection.hidden = !isStructuresPage

      // Array Visualizer thay thế placeholder cũ.
      categoryPlaceholder.hidden = true

      if (isStructuresPage) {
        placeholderTitle.textContent = page.title
        placeholderDescription.textContent = page.description
        placeholderCardTitle.textContent = page.cardTitle
        placeholderCardDescription.textContent = page.cardDescription
      }
    })
  })
}
