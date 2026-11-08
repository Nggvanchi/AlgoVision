import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { initNavigation } from '../src/navigation.js'

// R5a commit 1: markup của các thư viện nằm trong hai panel (#structure-panel, #algorithm-panel) đứng liền sau tiêu đề trang,
// và panel ẩn khi mọi section con ẩn (để sau này làm tabpanel mà không để lại vùng rỗng trong cây trợ năng).

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

function withNavigation(run) {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    initNavigation(document)
    run(document)
  } finally {
    window.happyDOM.close()
  }
}

const goTo = (document, page) => document.querySelector(`.nav-item[data-page="${page}"]`).click()
const hiddenPanels = (document) => ['#structure-panel', '#algorithm-panel'].map((selector) => document.querySelector(selector).hidden)

test('hai panel chứa đúng các section thư viện, đứng sau .page-heading và trước mọi màn chi tiết', () => {
  withNavigation((document) => {
    const structure = document.querySelector('#structure-panel')
    const algorithm = document.querySelector('#algorithm-panel')

    assert.ok(structure !== null && algorithm !== null, 'thiếu #structure-panel hoặc #algorithm-panel')
    assert.deepEqual([...structure.children].map((child) => child.id), ['structure-library'])
    assert.deepEqual([...algorithm.children].map((child) => child.id), ['sorting-algorithm-library', 'search-algorithm-library', 'graph-algorithm-library'])

    const order = [...document.querySelectorAll('.page-heading, #structure-panel, #algorithm-panel, #sorting-section, #search-section, #array-section')].map((element) => element.id || element.className)

    assert.deepEqual(order, ['page-heading', 'structure-panel', 'algorithm-panel', 'sorting-section', 'search-section', 'array-section'])
  })
})

test('panel ẩn khi mọi section con ẩn: Dashboard và màn chi tiết ẩn cả hai; thư viện nào hiện thì chỉ panel của nó hiện', () => {
  withNavigation((document) => {
    assert.deepEqual(hiddenPanels(document), [true, true], 'Dashboard')

    goTo(document, 'sorting')
    assert.deepEqual(hiddenPanels(document), [true, false], 'thư viện Sắp xếp')

    document.querySelector('.algorithm-card[data-algorithm="bubble"]').click()
    assert.deepEqual(hiddenPanels(document), [true, true], 'chi tiết Bubble Sort')

    goTo(document, 'searching')
    assert.deepEqual(hiddenPanels(document), [true, false], 'thư viện Tìm kiếm')

    goTo(document, 'structures')
    assert.deepEqual(hiddenPanels(document), [false, true], 'thư viện cấu trúc')

    document.querySelector('[data-structure-target="stack"]').click()
    assert.deepEqual(hiddenPanels(document), [true, true], 'chi tiết Stack')

    goTo(document, 'dashboard')
    assert.deepEqual(hiddenPanels(document), [true, true], 'về Dashboard')
  })
})
