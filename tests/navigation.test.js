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

    const algorithmSection = document.querySelector('.algorithm-section')
    const visualizerSection = document.querySelector(
      'main > .visualizer-section:not(#search-section):not(#category-placeholder):not(#structure-library):not(#array-section):not(#stack-section):not(#queue-section):not(#linked-list-section)',
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

    // Trang Sorting
    assert.equal(algorithmSection.hidden, false)
    assert.equal(visualizerSection.hidden, false)
    assert.equal(searchSection.hidden, true)
    assert.equal(structureLibrary.hidden, true)
    assert.equal(arraySection.hidden, true)
    assert.equal(stackSection.hidden, true)
    assert.equal(queueSection.hidden, true)
    assert.equal(linkedListSection.hidden, true)
    assert.equal(categoryPlaceholder.hidden, true)

    // Chuyển sang Searching
    searchingNav.click()

    assert.equal(searchSection.hidden, false)
    assert.equal(algorithmSection.hidden, true)
    assert.equal(visualizerSection.hidden, true)
    assert.equal(structureLibrary.hidden, true)
    assert.equal(arraySection.hidden, true)
    assert.equal(stackSection.hidden, true)
    assert.equal(queueSection.hidden, true)
    assert.equal(linkedListSection.hidden, true)
    assert.equal(categoryPlaceholder.hidden, true)
    assert.equal(searchingNav.classList.contains('active'), true)

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

    assert.ok(queueCard, 'Tháº» Queue pháº£i tá»“n táº¡i')

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
    assert.equal(visualizerSection.hidden, false)
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
