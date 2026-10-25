
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

    const sortingNav = document.querySelector(
      '.nav-item[data-page="sorting"]',
    )
    const searchingNav = document.querySelector(
      '.nav-item[data-page="searching"]',
    )
    const structuresNav = document.querySelector(
      '.nav-item[data-page="structures"]',
    )

    assert.equal(algorithmSection.hidden, false)
    assert.equal(visualizerSection.hidden, false)
    assert.equal(searchSection.hidden, true)
    assert.equal(categoryPlaceholder.hidden, true)

    searchingNav.click()

    assert.equal(searchSection.hidden, false)
    assert.equal(algorithmSection.hidden, true)
    assert.equal(visualizerSection.hidden, true)
    assert.equal(categoryPlaceholder.hidden, true)
    assert.equal(searchingNav.classList.contains('active'), true)

    structuresNav.click()

    assert.equal(categoryPlaceholder.hidden, false)
    assert.equal(searchSection.hidden, true)
    assert.equal(algorithmSection.hidden, true)
    assert.equal(structuresNav.classList.contains('active'), true)
    assert.equal(
      document.querySelector('#placeholder-title').textContent,
      'Cấu trúc dữ liệu',
    )
    assert.equal(
    document.querySelector('#placeholder-description').textContent,
    'Khám phá cách tổ chức, lưu trữ và thao tác với dữ liệu.',
    )

    assert.equal(
    document.querySelector('#placeholder-card-title').textContent,
    'Array, Stack, Queue, Linked List, Tree và Graph',
    )

    sortingNav.click()

    assert.equal(algorithmSection.hidden, false)
    assert.equal(visualizerSection.hidden, false)
    assert.equal(searchSection.hidden, true)
    assert.equal(categoryPlaceholder.hidden, true)
    assert.equal(sortingNav.classList.contains('active'), true)
  } finally {
    window.happyDOM.abort()
  }
})
