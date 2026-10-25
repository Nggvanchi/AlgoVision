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

test('điều hướng hoạt động đúng giữa ba mục chính', () => {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    initNavigation(document)

    const algorithmSection = document.querySelector('.algorithm-section')
    const visualizerSection = document.querySelector('.visualizer-section')
    const searchSection = document.querySelector('#search-section')
    const categoryPlaceholder = document.querySelector(
      '#category-placeholder',
    )
    const arraySection = document.querySelector('#array-section')

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

    // Trang Sorting
    assert.equal(algorithmSection.hidden, false)
    assert.equal(visualizerSection.hidden, false)
    assert.equal(searchSection.hidden, true)
    assert.equal(arraySection.hidden, true)
    assert.equal(categoryPlaceholder.hidden, true)

    // Chuyển sang Searching
    searchingNav.click()

    assert.equal(searchSection.hidden, false)
    assert.equal(algorithmSection.hidden, true)
    assert.equal(visualizerSection.hidden, true)
    assert.equal(arraySection.hidden, true)
    assert.equal(categoryPlaceholder.hidden, true)
    assert.equal(searchingNav.classList.contains('active'), true)

    // Chuyển sang Cấu trúc dữ liệu
    structuresNav.click()

    assert.equal(arraySection.hidden, false)
    assert.equal(categoryPlaceholder.hidden, true)
    assert.equal(searchSection.hidden, true)
    assert.equal(algorithmSection.hidden, true)
    assert.equal(structuresNav.classList.contains('active'), true)

    // Chuyển trở lại Sorting
    sortingNav.click()

    assert.equal(algorithmSection.hidden, false)
    assert.equal(visualizerSection.hidden, false)
    assert.equal(searchSection.hidden, true)
    assert.equal(arraySection.hidden, true)
    assert.equal(categoryPlaceholder.hidden, true)
    assert.equal(sortingNav.classList.contains('active'), true)
  } finally {
    window.happyDOM.abort()
  }
})
