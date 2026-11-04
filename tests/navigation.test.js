import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { initNavigation } from '../src/navigation.js'

const templatePath = new URL(
  '../public/templates/app.html',
  import.meta.url,
)

const template = await readFile(templatePath, 'utf8')

test('điều hướng hoạt động đúng giữa các trang và cấu trúc dữ liệu', () => {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    initNavigation(document)

    const dashboardSection = document.querySelector('#dashboard-section')
    const dashboardNav = document.querySelector('.nav-item[data-page="dashboard"]')
    const pageHeading = document.querySelector('.page-heading')
    const algorithmSection = document.querySelector('.algorithm-section')
    const searchAlgorithmLibrary = document.querySelector(
      '#search-algorithm-library',
    )
    assert.ok(
      searchAlgorithmLibrary,
      'Thư viện thuật toán tìm kiếm phải tồn tại trong HTML',
    )
    const visualizerSection = document.querySelector(
      '#sorting-section',
    )
    const searchSection = document.querySelector('#search-section')
    const categoryPlaceholder = document.querySelector(
      '#category-placeholder',
    )
    const structureLibrary = document.querySelector('#structure-library')
    const arraySection = document.querySelector('#array-section')
    const stackSection = document.querySelector('#stack-section')
    const queueSection = document.querySelector('#queue-section')
    const linkedListSection = document.querySelector('#linked-list-section')

    const sortingNav = document.querySelector(
      '.nav-item[data-page="sorting"]',
    )
    const searchingNav = document.querySelector(
      '.nav-item[data-page="searching"]',
    )
    const structuresNav = document.querySelector(
      '.nav-item[data-page="structures"]',
    )

    assert.ok(arraySection, 'Array Visualizer phải tồn tại trong HTML')
    assert.ok(stackSection, 'Stack Visualizer phải tồn tại trong HTML')
    assert.ok(linkedListSection,'Linked List Visualizer phải tồn tại trong HTML',)
    assert.ok(queueSection,'Queue Visualizer phải tồn tại trong HTML',)
    assert.ok(structureLibrary,'Thư viện cấu trúc dữ liệu phải tồn tại trong HTML',)
    // Trang Dashboard hiển thị mặc định
    assert.ok(dashboardSection, 'Dashboard phải tồn tại trong HTML')
    assert.ok(dashboardNav, 'Nút Tổng quan phải tồn tại trong HTML')
    assert.ok(pageHeading, 'Tiêu đề trang phải tồn tại trong HTML')

    assert.equal(dashboardSection.hidden, false)
    assert.equal(pageHeading.hidden, true)
    assert.equal(dashboardNav.classList.contains('active'), true)

    assert.equal(algorithmSection.hidden, true)
    assert.equal(visualizerSection.hidden, true)
    assert.equal(searchAlgorithmLibrary.hidden, true)
    assert.equal(searchSection.hidden, true)
    assert.equal(structureLibrary.hidden, true)
    assert.equal(arraySection.hidden, true)
    assert.equal(stackSection.hidden, true)
    assert.equal(queueSection.hidden, true)
    assert.equal(linkedListSection.hidden, true)
    assert.equal(categoryPlaceholder.hidden, true)

    // Chuyển từ Dashboard sang trang Sorting
    dashboardSection
      .querySelector('[data-dashboard-target="sorting"]')
      ?.click()

    assert.equal(dashboardSection.hidden, true)
    assert.equal(pageHeading.hidden, false)
    assert.equal(algorithmSection.hidden, false)
    assert.equal(visualizerSection.hidden, true)
    assert.equal(dashboardNav.classList.contains('active'), false)
    assert.equal(sortingNav.classList.contains('active'), true)
    
    // Mở Bubble Sort
    document.querySelector('[data-algorithm="bubble"]').click()

    assert.equal(algorithmSection.hidden, true)
    assert.equal(visualizerSection.hidden, false)

    // Quay lại danh sách thuật toán sắp xếp
    visualizerSection
      .querySelector('[data-back-to-sorting-algorithms]')
      .click()

    assert.equal(algorithmSection.hidden, false)
    assert.equal(visualizerSection.hidden, true)

    // Chuyển sang thư viện thuật toán tìm kiếm
    searchingNav.click()

    assert.equal(searchAlgorithmLibrary.hidden, false)
    assert.equal(searchSection.hidden, true)
    assert.equal(algorithmSection.hidden, true)
    assert.equal(visualizerSection.hidden, true)
    assert.equal(structureLibrary.hidden, true)
    assert.equal(arraySection.hidden, true)
    assert.equal(stackSection.hidden, true)
    assert.equal(queueSection.hidden, true)
    assert.equal(linkedListSection.hidden, true)
    assert.equal(categoryPlaceholder.hidden, true)
    assert.equal(searchingNav.classList.contains('active'), true)

    // Mở Binary Search
    document.querySelector('[data-search-algorithm="binary"]').click()

    assert.equal(searchAlgorithmLibrary.hidden, true)
    assert.equal(searchSection.hidden, false)

    // Quay lại thư viện thuật toán tìm kiếm
    searchSection
      .querySelector('[data-back-to-search-algorithms]')
      .click()

    assert.equal(searchAlgorithmLibrary.hidden, false)
    assert.equal(searchSection.hidden, true)

    // Chuyển sang thư viện cấu trúc dữ liệu
    structuresNav.click()

    assert.equal(structureLibrary.hidden, false)
    assert.equal(arraySection.hidden, true)
    assert.equal(stackSection.hidden, true)
    assert.equal(queueSection.hidden, true)
    assert.equal(linkedListSection.hidden, true)
    assert.equal(searchSection.hidden, true)
    assert.equal(algorithmSection.hidden, true)
    assert.equal(categoryPlaceholder.hidden, true)
    assert.equal(structuresNav.classList.contains('active'), true)

    // Mở Array Visualizer
    document
      .querySelector('[data-structure-target="array"]')
      .click()

    assert.equal(structureLibrary.hidden, true)
    assert.equal(arraySection.hidden, false)
    assert.equal(stackSection.hidden, true)
    assert.equal(queueSection.hidden, true)
    assert.equal(linkedListSection.hidden, true)

    // Quay lại thư viện từ Array Visualizer
    arraySection.querySelector('[data-back-to-structures]').click()

    assert.equal(structureLibrary.hidden, false)
    assert.equal(arraySection.hidden, true)
    assert.equal(stackSection.hidden, true)
    assert.equal(queueSection.hidden, true)
    assert.equal(linkedListSection.hidden, true)

    // Mở Stack Visualizer
    document
      .querySelector('[data-structure-target="stack"]')
      .click()

    assert.equal(structureLibrary.hidden, true)
    assert.equal(arraySection.hidden, true)
    assert.equal(stackSection.hidden, false)
    assert.equal(queueSection.hidden, true)
    assert.equal(linkedListSection.hidden, true)

    // Quay lại thư viện từ Stack Visualizer
    stackSection.querySelector('[data-back-to-structures]').click()

    assert.equal(structureLibrary.hidden, false)
    assert.equal(arraySection.hidden, true)
    assert.equal(stackSection.hidden, true)
    assert.equal(queueSection.hidden, true)
    assert.equal(linkedListSection.hidden, true)

    // Mở Linked List Visualizer
    document
      .querySelector('[data-structure-target="linked-list"]')
      .click()

    assert.equal(structureLibrary.hidden, true)
    assert.equal(arraySection.hidden, true)
    assert.equal(stackSection.hidden, true)
    assert.equal(queueSection.hidden, true)
    assert.equal(linkedListSection.hidden, false)

    // Quay lại thư viện từ Linked List Visualizer
    linkedListSection
      .querySelector('[data-back-to-structures]')
      .click()

    assert.equal(structureLibrary.hidden, false)
    assert.equal(arraySection.hidden, true)
    assert.equal(stackSection.hidden, true)
    assert.equal(queueSection.hidden, true)
    assert.equal(linkedListSection.hidden, true)

    // Mở Queue Visualizer
    const queueCard = document.querySelector(
      '[data-structure-target="queue"]',
    )

    assert.ok(queueCard, 'Thẻ Queue phải tồn tại')

    queueCard.click()

    assert.equal(structureLibrary.hidden, true)
    assert.equal(arraySection.hidden, true)
    assert.equal(stackSection.hidden, true)
    assert.equal(queueSection.hidden, false)
    assert.equal(linkedListSection.hidden, true)

    // Quay lại thư viện từ Queue Visualizer
    queueSection
      .querySelector('[data-back-to-structures]')
      .click()

    assert.equal(structureLibrary.hidden, false)
    assert.equal(arraySection.hidden, true)
    assert.equal(stackSection.hidden, true)
    assert.equal(queueSection.hidden, true)
    assert.equal(linkedListSection.hidden, true)

    // Chuyển trở lại Sorting
    sortingNav.click()

    assert.equal(algorithmSection.hidden, false)
    assert.equal(visualizerSection.hidden, true)
    assert.equal(searchAlgorithmLibrary.hidden, true)
    assert.equal(searchSection.hidden, true)
    assert.equal(structureLibrary.hidden, true)
    assert.equal(arraySection.hidden, true)
    assert.equal(stackSection.hidden, true)
    assert.equal(queueSection.hidden, true)
    assert.equal(linkedListSection.hidden, true)
    assert.equal(categoryPlaceholder.hidden, true)
    assert.equal(sortingNav.classList.contains('active'), true)
  } finally {
    window.happyDOM.abort()
  }
})

test('Section mô phỏng Sorting có id riêng chứa #array-bars, navigation điều khiển đúng section đó', () => {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    initNavigation(document)

    const sortingSection = document.querySelector('#sorting-section')

    assert.ok(sortingSection, 'Section Sorting phải có id="sorting-section"')
    assert.ok(sortingSection.classList.contains('visualizer-section'))
    assert.ok(sortingSection.querySelector('#array-bars'), 'section phải chứa cột của Sorting')

    document.querySelector('.nav-item[data-page="sorting"]').click()
    document.querySelector('[data-algorithm="bubble"]').click()
    assert.equal(sortingSection.hidden, false)

    document.querySelector('.nav-item[data-page="searching"]').click()
    assert.equal(sortingSection.hidden, true)
  } finally {
    window.happyDOM.abort()
  }
})

// Thêm một thẻ cấu trúc dữ liệu giả vào thư viện; withSection = true thì thêm cả section #<target>-section.
function addStructureCard(document, target, { withSection }) {
  const card = document.createElement('button')
  card.className = 'structure-card'
  card.dataset.structureTarget = target
  document.querySelector('#structure-library').append(card)

  if (withSection) {
    const section = document.createElement('section')
    section.className = 'visualizer-section'
    section.id = `${target}-section`
    section.hidden = true
    document.querySelector('#bst-section').after(section)
  }

  return card
}

test('Section cấu trúc dữ liệu được suy ra từ data-structure-target theo quy ước #<target>-section', () => {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    const card = addStructureCard(document, 'demo', { withSection: true })
    initNavigation(document)

    const demoSection = document.querySelector('#demo-section')
    const events = []
    document.addEventListener('algovision:viewchange', (event) => events.push(event.detail.page))

    document.querySelector('.nav-item[data-page="structures"]').click()
    card.click()
    assert.equal(demoSection.hidden, false, 'mở thẻ demo phải hiện #demo-section')
    assert.equal(document.querySelector('#structure-library').hidden, true)
    assert.equal(document.querySelector('#bst-section').hidden, true)

    document.querySelector('[data-structure-target="bst"]').click()
    assert.equal(demoSection.hidden, true, 'mở cấu trúc khác phải ẩn #demo-section')
    assert.equal(document.querySelector('#bst-section').hidden, false)

    card.click()
    document.querySelector('.nav-item[data-page="sorting"]').click()
    assert.equal(demoSection.hidden, true, 'đổi trang phải ẩn mọi section cấu trúc dữ liệu')
    assert.deepEqual(events, ['structures', 'structures', 'structures', 'structures', 'sorting'])
  } finally {
    window.happyDOM.abort()
  }
})

test('Thẻ cấu trúc dữ liệu không có section tương ứng: giữ nguyên thư viện, không phát viewchange', () => {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    const card = addStructureCard(document, 'ghost', { withSection: false })
    initNavigation(document)

    document.querySelector('.nav-item[data-page="structures"]').click()
    const events = []
    document.addEventListener('algovision:viewchange', (event) => events.push(event.detail.page))

    assert.doesNotThrow(() => card.click())
    assert.equal(document.querySelector('#structure-library').hidden, false, 'thư viện vẫn hiện')
    document.querySelectorAll('.visualizer-section').forEach((section) => {
      if (!['category-placeholder', 'structure-library'].includes(section.id)) {
        assert.equal(section.hidden, true, `${section.id} không được hiện`)
      }
    })
    assert.deepEqual(events, [])
  } finally {
    window.happyDOM.abort()
  }
})
