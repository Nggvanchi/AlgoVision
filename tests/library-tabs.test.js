import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { initNavigation } from '../src/navigation.js'

// R5a commit 3: thanh tab Thư viện (Cấu trúc dữ liệu | Giải thuật). Mẫu tabs của ARIA: tablist/tab/tabpanel, roving tabindex,
// ←/→ (vòng), Home/End tự kích hoạt. Đổi tab = đổi trang (structures <-> algorithms) nên breadcrumb, aria-current, tiêu đề trang
// và focus phải đồng bộ, và mỗi lần đổi chỉ phát MỘT viewchange (topic null).

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

function withTabs(run) {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    initNavigation(document)

    const log = []

    document.addEventListener('algovision:viewchange', (event) => log.push({ ...event.detail }))

    const tab = (name) => document.querySelector(`.library-tab[data-library-tab="${name}"]`)
    const press = (target, key) => {
      const event = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

      target.dispatchEvent(event)

      return event
    }

    run({ document, log, tab, press })
  } finally {
    window.happyDOM.close()
  }
}

const goTo = (document, page) => document.querySelector(`.nav-item[data-page="${page}"]`).click()
const crumbs = (document) => [...document.querySelectorAll('.breadcrumb li')].map((item) => item.textContent.trim())
const tabState = (document) => [...document.querySelectorAll('.library-tab')].map((tab) => [tab.dataset.libraryTab, tab.getAttribute('aria-selected'), tab.tabIndex])

test('tablist: role, nhãn, hai tab đúng chữ, mỗi tab điều khiển một tabpanel có aria-labelledby ngược lại', () => {
  withTabs(({ document }) => {
    const list = document.querySelector('.library-tabs')

    assert.equal(list.getAttribute('role'), 'tablist')
    assert.equal(list.getAttribute('aria-label'), 'Thư viện')
    assert.deepEqual([...list.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent.trim()), ['Cấu trúc dữ liệu', 'Giải thuật'])

    for (const tab of list.querySelectorAll('[role="tab"]')) {
      const panel = document.getElementById(tab.getAttribute('aria-controls'))

      assert.ok(panel !== null, `${tab.id}: aria-controls trỏ tới phần tử không có`)
      assert.equal(panel.getAttribute('role'), 'tabpanel')
      assert.equal(panel.getAttribute('aria-labelledby'), tab.id)
      assert.equal(tab.tagName, 'BUTTON')
      assert.equal(tab.type, 'button')
    }

    assert.deepEqual([...list.querySelectorAll('[role="tab"]')].map((tab) => tab.getAttribute('aria-controls')), ['structure-panel', 'algorithm-panel'])
  })
})

test('thanh tab chỉ hiện ở thư viện Cấu trúc và trang Giải thuật; ẩn ở Dashboard, Sắp xếp, Tìm kiếm và mọi màn chi tiết', () => {
  withTabs(({ document, tab }) => {
    const hidden = () => document.querySelector('.library-tabs').hidden

    assert.equal(hidden(), true, 'Dashboard')
    goTo(document, 'sorting')
    assert.equal(hidden(), true, 'thư viện Sắp xếp')
    goTo(document, 'searching')
    assert.equal(hidden(), true, 'thư viện Tìm kiếm')

    goTo(document, 'structures')
    assert.equal(hidden(), false, 'thư viện Cấu trúc')
    document.querySelector('[data-structure-target="stack"]').click()
    assert.equal(hidden(), true, 'chi tiết Stack')
    document.querySelector('#stack-section [data-back-to-structures]').click()
    assert.equal(hidden(), false, 'Quay lại thư viện Cấu trúc')

    tab('algorithms').click()
    assert.equal(hidden(), false, 'trang Giải thuật')
    document.querySelector('.algorithm-card[data-algorithm="bubble"]').click()
    assert.equal(hidden(), true, 'chi tiết Bubble Sort')
    document.querySelector('[data-back-to-sorting-algorithms]').click()
    assert.equal(hidden(), false, 'Quay lại trang Giải thuật')

    goTo(document, 'dashboard')
    assert.equal(hidden(), true)
  })
})

test('tab chọn theo trang: aria-selected và roving tabindex (chỉ tab đang chọn tabindex 0)', () => {
  withTabs(({ document, tab }) => {
    goTo(document, 'structures')
    assert.deepEqual(tabState(document), [['structures', 'true', 0], ['algorithms', 'false', -1]])

    tab('algorithms').click()
    assert.deepEqual(tabState(document), [['structures', 'false', -1], ['algorithms', 'true', 0]])
  })
})

test('bấm tab Giải thuật: một viewchange, breadcrumb, tiêu đề trang, aria-current, sidebar và focus đồng bộ', () => {
  withTabs(({ document, log, tab }) => {
    goTo(document, 'structures')
    log.length = 0
    tab('algorithms').click()

    assert.deepEqual(log, [{ page: 'algorithms', topic: null }])
    assert.deepEqual(crumbs(document), ['AlgoVision', 'Giải thuật'])
    assert.equal(document.title, 'Giải thuật - AlgoVision')
    assert.deepEqual([...document.querySelectorAll('[aria-current="page"]')].map((item) => item.closest('.breadcrumb') !== null), [true], 'aria-current chỉ ở breadcrumb')
    assert.equal(document.querySelectorAll('.nav-item.active').length, 0, 'sidebar không có mục active ở trang Giải thuật (D11)')
    assert.ok(document.activeElement === tab('algorithms'), 'focus phải ở tab vừa chọn')
  })
})

test('bấm tab Cấu trúc dữ liệu: đồng bộ ngược lại, sidebar "Tất cả cấu trúc" active và có aria-current cùng breadcrumb', () => {
  withTabs(({ document, log, tab }) => {
    tab('algorithms').click()
    log.length = 0
    tab('structures').click()

    assert.deepEqual(log, [{ page: 'structures', topic: null }])
    assert.deepEqual(crumbs(document), ['AlgoVision', 'Cấu trúc dữ liệu'])
    assert.equal(document.title, 'Cấu trúc dữ liệu - AlgoVision')
    assert.equal(document.querySelector('.nav-item[data-page="structures"]').getAttribute('aria-current'), 'page')
    assert.deepEqual([...document.querySelectorAll('.nav-item.active')].map((item) => item.dataset.page), ['structures'])
    assert.equal(document.querySelectorAll('[aria-current="page"]').length, 2, 'một ở sidebar, một ở breadcrumb')
    assert.ok(document.activeElement === tab('structures'), 'focus phải ở tab vừa chọn')
  })
})

test('bấm lại tab đang chọn: không phát viewchange, không đổi gì', () => {
  withTabs(({ document, log, tab }) => {
    tab('algorithms').click()
    log.length = 0
    tab('algorithms').click()

    assert.deepEqual(log, [])
    assert.deepEqual(crumbs(document), ['AlgoVision', 'Giải thuật'])
  })
})

for (const [from, key, to] of [
  ['algorithms', 'ArrowLeft', 'structures'],
  ['structures', 'ArrowRight', 'algorithms'],
  ['structures', 'ArrowLeft', 'algorithms'],
  ['algorithms', 'ArrowRight', 'structures'],
  ['algorithms', 'Home', 'structures'],
  ['structures', 'End', 'algorithms'],
]) {
  test(`phím ${key} ở tab ${from} chuyển sang tab ${to}: một viewchange, focus, aria-selected, breadcrumb và tiêu đề đồng bộ, đã preventDefault`, () => {
    withTabs(({ document, log, tab, press }) => {
      tab(from).click()
      tab(from).focus()
      log.length = 0

      const event = press(tab(from), key)
      const title = to === 'algorithms' ? 'Giải thuật' : 'Cấu trúc dữ liệu'

      assert.equal(event.defaultPrevented, true)
      assert.deepEqual(log, [{ page: to, topic: null }])
      assert.ok(document.activeElement === tab(to), 'focus phải sang tab mới')
      assert.deepEqual(tabState(document).find((state) => state[1] === 'true'), [to, 'true', 0])
      assert.deepEqual(crumbs(document), ['AlgoVision', title])
      assert.equal(document.title, `${title} - AlgoVision`)
    })
  })
}

test('phím khác (Tab, chữ, Enter) không bị chặn và không đổi tab', () => {
  withTabs(({ document, log, tab, press }) => {
    tab('algorithms').click()
    log.length = 0

    for (const key of ['Tab', 'a', 'ArrowDown', 'ArrowUp', 'Escape']) {
      assert.equal(press(tab('algorithms'), key).defaultPrevented, false, key)
    }

    assert.deepEqual(log, [])
    assert.deepEqual(tabState(document), [['structures', 'false', -1], ['algorithms', 'true', 0]])
  })
})

test('phím có modifier (Alt/Ctrl/Cmd/Shift + ←/→/Home/End) không bị chặn và không đổi tab (Alt+← là lùi lịch sử của trình duyệt)', () => {
  withTabs(({ document, log, tab }) => {
    tab('algorithms').click()
    log.length = 0

    for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey']) {
      for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
        const event = new document.defaultView.KeyboardEvent('keydown', { key, [modifier]: true, bubbles: true, cancelable: true })

        tab('algorithms').dispatchEvent(event)
        assert.equal(event.defaultPrevented, false, `${modifier}+${key} không được bị chặn`)
      }
    }

    assert.deepEqual(log, [])
    assert.deepEqual(tabState(document), [['structures', 'false', -1], ['algorithms', 'true', 0]])
  })
})

test('Dashboard: nút "Xem thư viện" ở hero và liên kết "Xem thư viện →" mở trang Giải thuật (tab Giải thuật đang chọn)', () => {
  for (const selector of ['.dashboard-outline-button[data-dashboard-target]', '.dashboard-text-link[data-dashboard-target]']) {
    withTabs(({ document, log }) => {
      document.querySelector(selector).click()

      assert.deepEqual(log, [{ page: 'algorithms', topic: null }], selector)
      assert.deepEqual(tabState(document), [['structures', 'false', -1], ['algorithms', 'true', 0]])
    })
  }
})
