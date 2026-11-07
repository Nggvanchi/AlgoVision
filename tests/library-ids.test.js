import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

import { initNavigation } from '../src/navigation.js'

// Redesign Phase 4 (Thư viện): thư viện Sắp xếp có id ổn định #sorting-algorithm-library, giống #search-algorithm-library,
// và navigation.js tìm nó bằng id chứ không bằng "phần tử đầu tiên có class .algorithm-section" (dễ vỡ khi thêm section cùng class).
const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

function withDom(run, mutate = (document) => document) {
  const window = new Window()
  const { document } = window

  document.body.innerHTML = template
  mutate(document)

  try {
    run(document)
  } finally {
    window.happyDOM.close()
  }
}

const goTo = (document, page) => document.querySelector(`.nav-item[data-page="${page}"]`).click()

test('thư viện Sắp xếp có id #sorting-algorithm-library, giữ class .algorithm-section và chứa đúng 3 thẻ thuật toán', () => {
  withDom((document) => {
    const library = document.querySelector('#sorting-algorithm-library')

    assert.ok(library !== null, 'phải có #sorting-algorithm-library')
    assert.ok(library.classList.contains('algorithm-section'), 'giữ class .algorithm-section cho CSS và test cũ')
    assert.equal(document.querySelectorAll('#sorting-algorithm-library').length, 1, 'id duy nhất')
    assert.deepEqual(
      [...library.querySelectorAll('.algorithm-card[data-algorithm]')].map((card) => card.dataset.algorithm),
      ['bubble', 'selection', 'insertion'],
    )
    assert.ok(library.querySelector('#sorting-section') === null, 'thư viện không chứa bộ mô phỏng')
  })
})

test('thư viện Sắp xếp là .algorithm-section đầu tiên của trang (test cũ vẫn tìm thấy nó bằng class)', () => {
  withDom((document) => {
    assert.ok(
      document.querySelector('.algorithm-section') === document.querySelector('#sorting-algorithm-library'),
      '.algorithm-section đầu tiên phải là thư viện Sắp xếp',
    )
  })
})

test('navigation.js bật tắt thư viện Sắp xếp theo id, kể cả khi có một section cùng class .algorithm-section đứng trước', () => {
  const addDecoy = (document) => {
    const decoy = document.createElement('section')

    decoy.className = 'algorithm-section'
    decoy.id = 'decoy-section'
    document.querySelector('#main-content').prepend(decoy)
  }

  withDom((document) => {
    initNavigation(document)

    const library = document.querySelector('#sorting-algorithm-library')
    const decoy = document.querySelector('#decoy-section')

    goTo(document, 'dashboard')
    assert.equal(library.hidden, true, 'ở Dashboard thư viện Sắp xếp phải ẩn')

    goTo(document, 'sorting')
    assert.equal(library.hidden, false, 'ở trang Sắp xếp thư viện phải hiện')
    assert.equal(decoy.hidden, false, 'section lạ cùng class không bị navigation.js điều khiển')

    goTo(document, 'searching')
    assert.equal(library.hidden, true, 'sang Tìm kiếm thì thư viện Sắp xếp ẩn')
  }, addDecoy)
})
