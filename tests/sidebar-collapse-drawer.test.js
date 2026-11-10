import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { withFullApp } from './helpers/app-dom.js'
import { createFakeMatchMedia } from './helpers/fake-media.js'

// Thu gọn (màn hình rộng) và drawer (màn hình hẹp) của sidebar. Trạng thái chỉ nằm trong bộ nhớ của phiên: không localStorage.
// happy-dom không tính CSS nên "màn hình hẹp" được giả bằng matchMedia giả (tests/helpers/fake-media.js).
const TRIGGER_QUERY = (breakpoint) => `(max-width: ${breakpoint}px)`

const toggleOf = (document) => document.querySelector('#sidebar-toggle')
const collapseOf = (document) => document.querySelector('#sidebar-collapse')
const sidebarOf = (document) => document.querySelector('#sidebar')
const shellOf = (document) => document.querySelector('.drawer-shell')
const closeOf = (document) => document.querySelector('#sidebar-close')
const press = (document, key) => document.dispatchEvent(new document.defaultView.KeyboardEvent('keydown', { key, bubbles: true }))
const goTo = (document, page) => document.querySelector(`.nav-item[data-page="${page}"]`).click()
const isInert = (element) => element.hasAttribute('inert')

function withSidebar(run, { mobile = false } = {}) {
  const media = createFakeMatchMedia(mobile)

  return withFullApp((context) => run({ ...context, media }), { matchMedia: media.matchMedia })
}

// ---------------------------------------------------------------------------------------------------------------------
// Thu gọn
// ---------------------------------------------------------------------------------------------------------------------

test('nút thu gọn: bấm thì .app-layout có is-sidebar-collapsed, aria-expanded="false", nhãn "Mở rộng thanh bên"; bấm lại thì trở về', async () => {
  await withSidebar(({ document }) => {
    const layout = document.querySelector('.app-layout')
    const button = collapseOf(document)

    assert.equal(layout.classList.contains('is-sidebar-collapsed'), false)

    button.click()
    assert.equal(layout.classList.contains('is-sidebar-collapsed'), true)
    assert.equal(button.getAttribute('aria-expanded'), 'false')
    assert.equal(button.getAttribute('aria-label'), 'Mở rộng thanh bên')

    button.click()
    assert.equal(layout.classList.contains('is-sidebar-collapsed'), false)
    assert.equal(button.getAttribute('aria-expanded'), 'true')
    assert.equal(button.getAttribute('aria-label'), 'Thu gọn thanh bên')
  })
})

test('thu gọn không làm mất tên: mọi nhãn vẫn nằm trong DOM, không bị hidden, h1 và nhãn nhóm còn nguyên', async () => {
  await withSidebar(({ document }) => {
    const names = () => [...document.querySelectorAll('.nav-item .nav-label, .nav-subitem .nav-label')].map((label) => label.textContent.trim())
    const before = names()

    collapseOf(document).click()

    assert.equal(before.length, 11)
    assert.deepEqual(names(), before, 'chữ nhãn không đổi khi thu gọn')

    for (const element of document.querySelectorAll('.sidebar .nav-label, .sidebar .brand h1, .sidebar .section-label')) {
      assert.ok(element.closest('[hidden]') === null, `${element.className || element.tagName} bị hidden khi thu gọn`)
      assert.equal(element.hasAttribute('hidden'), false)
    }
  })
})

test('thu gọn giữ aria-current của mục đang mở và không động vào ☰, inert hay trang đang xem', async () => {
  await withSidebar(({ document }) => {
    document.querySelector('.nav-subitem[data-structure-nav="queue"]').click()
    collapseOf(document).click()

    assert.equal(document.querySelectorAll('#sidebar [aria-current]').length, 1)
    assert.equal(document.querySelector('.nav-subitem[data-structure-nav="queue"]').getAttribute('aria-current'), 'page')
    assert.equal(toggleOf(document).getAttribute('aria-expanded'), 'false')
    assert.equal(isInert(document.querySelector('main')), false)
    assert.equal(document.querySelector('#queue-section').hidden, false)
  })
})

test('thu gọn chỉ nằm trong bộ nhớ phiên: không ghi localStorage hay sessionStorage', async () => {
  await withSidebar(({ window, document }) => {
    collapseOf(document).click()
    collapseOf(document).click()
    collapseOf(document).click()

    assert.equal(window.localStorage.length, 0)
    assert.equal(window.sessionStorage.length, 0)
  })
})

test('mã nguồn src/sidebar.js không nhắc localStorage, sessionStorage, cookie hay indexedDB', async () => {
  const source = await readFile(new URL('../src/sidebar.js', import.meta.url), 'utf8')

  for (const forbidden of ['localStorage', 'sessionStorage', 'cookie', 'indexedDB']) {
    assert.equal(source.includes(forbidden), false, `src/sidebar.js không được dùng ${forbidden}`)
  }
})

test('initSidebar trả về điều khiển: isCollapsed/isDrawerOpen phản ánh đúng trạng thái', async () => {
  await withSidebar(({ document, sidebar }) => {
    assert.equal(sidebar.isCollapsed(), false)
    assert.equal(sidebar.isDrawerOpen(), false)

    collapseOf(document).click()
    assert.equal(sidebar.isCollapsed(), true)
    collapseOf(document).click()
    assert.equal(sidebar.isCollapsed(), false)
  }, { mobile: false })
})

// Tooltip chỉ là phần phụ: tên truy cập luôn là chữ thật trong .nav-label. Dựng bằng JS (một phần tử, vị trí fixed) vì vùng
// cuộn của sidebar sẽ cắt tooltip nếu tooltip là ::after nằm trong nút.
test('tooltip .sidebar-tooltip: một phần tử aria-hidden, không focus được, ẩn khi chưa thu gọn', async () => {
  await withSidebar(({ document }) => {
    const tooltips = document.querySelectorAll('.sidebar-tooltip')

    assert.equal(tooltips.length, 1)
    assert.equal(tooltips[0].getAttribute('aria-hidden'), 'true')
    assert.equal(tooltips[0].classList.contains('is-visible'), false)
    assert.equal(tooltips[0].hasAttribute('tabindex'), false)
  })
})

const ITEMS = [
  ...['dashboard', 'sorting', 'searching', 'structures'].map((page) => ({ name: page, selector: `.nav-item[data-page="${page}"]` })),
  ...['array', 'stack', 'queue', 'linked-list', 'bst', 'hash-table', 'graph'].map((target) => ({ name: target, selector: `.nav-subitem[data-structure-nav="${target}"]` })),
]

for (const item of ITEMS) {
  test(`tooltip của mục "${item.name}": khi thu gọn, rê chuột hoặc focus hiện đúng tên mục; rời đi thì ẩn`, async () => {
    await withSidebar(({ window, document }) => {
      const tooltip = document.querySelector('.sidebar-tooltip')
      const element = document.querySelector(item.selector)
      const label = element.querySelector('.nav-label').textContent.trim()
      const fire = (type, Event) => element.dispatchEvent(new window[Event](type, { bubbles: true }))

      collapseOf(document).click()

      fire('mouseover', 'MouseEvent')
      assert.equal(tooltip.classList.contains('is-visible'), true, 'rê chuột phải hiện tooltip')
      assert.equal(tooltip.textContent.trim(), label)

      fire('mouseout', 'MouseEvent')
      assert.equal(tooltip.classList.contains('is-visible'), false, 'rời chuột phải ẩn tooltip')

      element.focus()
      assert.equal(tooltip.classList.contains('is-visible'), true, 'focus bàn phím phải hiện tooltip')
      assert.equal(tooltip.textContent.trim(), label)

      element.blur()
      assert.equal(tooltip.classList.contains('is-visible'), false)
    })
  })
}

test('tooltip không hiện khi sidebar đang mở rộng (nhãn đã thấy sẵn) và tắt ngay khi mở rộng lại', async () => {
  await withSidebar(({ window, document }) => {
    const tooltip = document.querySelector('.sidebar-tooltip')
    const item = document.querySelector('.nav-item[data-page="sorting"]')

    item.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true }))
    assert.equal(tooltip.classList.contains('is-visible'), false, 'chưa thu gọn thì không tooltip')

    collapseOf(document).click()
    item.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true }))
    assert.equal(tooltip.classList.contains('is-visible'), true)

    collapseOf(document).click()
    assert.equal(tooltip.classList.contains('is-visible'), false, 'mở rộng lại phải tắt tooltip đang hiện')
  })
})

test('phím Escape tắt tooltip đang hiện (WCAG 1.4.13: nội dung hiện khi rê/focus phải đóng được không cần dời con trỏ)', async () => {
  await withSidebar(({ window, document }) => {
    const tooltip = document.querySelector('.sidebar-tooltip')

    collapseOf(document).click()
    document.querySelector('.nav-item[data-page="sorting"]').dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true }))
    assert.equal(tooltip.classList.contains('is-visible'), true)

    press(document, 'Escape')
    assert.equal(tooltip.classList.contains('is-visible'), false)
  })
})

// ---------------------------------------------------------------------------------------------------------------------
// Drawer (màn hình hẹp)
// ---------------------------------------------------------------------------------------------------------------------

test('DRAWER_BREAKPOINT = 767 và initSidebar hỏi đúng media query (max-width: 767px)', async () => {
  const sidebarModule = await import('../src/sidebar.js')

  assert.equal(sidebarModule.DRAWER_BREAKPOINT, 767)

  await withSidebar(({ media }) => {
    assert.ok(media.queries.includes(TRIGGER_QUERY(sidebarModule.DRAWER_BREAKPOINT)), `queries: ${media.queries.join(' | ')}`)
  }, { mobile: true })
})

test('drawer đóng sẵn: không is-open, ☰ aria-expanded="false" nhãn "Mở menu điều hướng", main và skip link không inert', async () => {
  await withSidebar(({ document }) => {
    assert.equal(sidebarOf(document).classList.contains('is-open'), false)
    assert.equal(document.querySelector('.sidebar-overlay').classList.contains('is-open'), false)
    assert.equal(toggleOf(document).getAttribute('aria-expanded'), 'false')
    assert.equal(toggleOf(document).getAttribute('aria-label'), 'Mở menu điều hướng')
    assert.equal(isInert(document.querySelector('main')), false)
    assert.equal(isInert(document.querySelector('.skip-link')), false)
  }, { mobile: true })
})

test('bấm ☰: drawer mở thành dialog có tên trong wrapper chứa menu và sidebar; focus vào .nav-item đầu tiên', async () => {
  await withSidebar(({ document, sidebar }) => {
    toggleOf(document).click()

    assert.equal(sidebarOf(document).classList.contains('is-open'), true)
    assert.equal(document.querySelector('.sidebar-overlay').classList.contains('is-open'), true)
    assert.equal(toggleOf(document).getAttribute('aria-expanded'), 'true')
    assert.equal(toggleOf(document).getAttribute('aria-label'), 'Đóng menu điều hướng')
    assert.equal(shellOf(document).getAttribute('role'), 'dialog', 'wrapper phải được công bố role=dialog khi mở')
    assert.equal(shellOf(document).getAttribute('aria-label'), 'Điều hướng chính')
    assert.equal(shellOf(document).getAttribute('aria-modal'), 'true')
    assert.ok(toggleOf(document).closest('.drawer-shell') === shellOf(document))
    assert.ok(sidebarOf(document).closest('.drawer-shell') === shellOf(document))
    assert.ok(document.activeElement === document.querySelector('.sidebar .nav-item'), 'focus phải vào mục điều hướng đầu tiên')
    assert.equal(sidebar.isDrawerOpen(), true)
  }, { mobile: true })
})

test('drawer mở: main và skip link inert, còn thanh trên, sidebar và ☰ thì không (☰ vẫn bấm được để đóng)', async () => {
  await withSidebar(({ document }) => {
    toggleOf(document).click()

    assert.equal(isInert(document.querySelector('main')), true)
    assert.equal(isInert(document.querySelector('.skip-link')), true)
    assert.equal(isInert(document.querySelector('.mobile-bar')), false)
    assert.equal(isInert(sidebarOf(document)), false)
    assert.equal(isInert(shellOf(document)), false, 'wrapper chứa cả menu trigger và dialog không được inert')
    assert.equal(closeOf(document).getAttribute('aria-label'), 'Đóng điều hướng')
  }, { mobile: true })
})

test('đóng Drawer không gỡ inert đã tồn tại trước đó do cơ chế khác đặt', async () => {
  await withSidebar(({ document }) => {
    const main = document.querySelector('main')
    main.setAttribute('inert', '')

    toggleOf(document).click()
    closeOf(document).click()

    assert.equal(isInert(main), true, 'Drawer không được gỡ inert có trước')
    assert.equal(isInert(document.querySelector('.skip-link')), false)
  }, { mobile: true })
})

test('drawer đóng: wrapper không còn dialog semantics hoặc aria-modal', async () => {
  await withSidebar(({ document }) => {
    assert.equal(shellOf(document).hasAttribute('role'), false)
    assert.equal(shellOf(document).hasAttribute('aria-modal'), false)
    assert.equal(shellOf(document).hasAttribute('aria-label'), false)
  }, { mobile: true })
})

test('đóng drawer bằng ☰: gỡ is-open và inert, aria-expanded="false", focus ở ☰', async () => {
  await withSidebar(({ document }) => {
    toggleOf(document).click()
    toggleOf(document).click()

    assert.equal(sidebarOf(document).classList.contains('is-open'), false)
    assert.equal(shellOf(document).hasAttribute('role'), false)
    assert.equal(shellOf(document).hasAttribute('aria-modal'), false)
    assert.equal(toggleOf(document).getAttribute('aria-expanded'), 'false')
    assert.equal(toggleOf(document).getAttribute('aria-label'), 'Mở menu điều hướng')
    assert.equal(isInert(document.querySelector('main')), false)
    assert.equal(isInert(document.querySelector('.skip-link')), false)
    assert.ok(document.activeElement === toggleOf(document), 'focus phải về ☰')
  }, { mobile: true })
})

test('nút X đóng Drawer, đồng bộ inert, dialog semantics, scroll lock và trả focus về opener', async () => {
  await withSidebar(({ document, sidebar }) => {
    toggleOf(document).click()
    assert.equal(sidebar.isDrawerOpen(), true)

    closeOf(document).click()

    assert.equal(sidebar.isDrawerOpen(), false, 'nút X phải đóng Drawer qua closeDrawer')
    assert.equal(sidebarOf(document).classList.contains('is-open'), false)
    assert.equal(shellOf(document).hasAttribute('role'), false)
    assert.equal(shellOf(document).hasAttribute('aria-modal'), false)
    assert.equal(toggleOf(document).getAttribute('aria-expanded'), 'false')
    assert.equal(isInert(document.querySelector('main')), false)
    assert.equal(isInert(document.querySelector('.skip-link')), false)
    assert.equal(bodyLocked(document), false)
    assert.ok(document.activeElement === toggleOf(document))
  }, { mobile: true })
})

test('phím Escape đóng drawer đang mở và trả focus về ☰', async () => {
  await withSidebar(({ document }) => {
    toggleOf(document).click()
    press(document, 'Escape')

    assert.equal(sidebarOf(document).classList.contains('is-open'), false)
    assert.equal(shellOf(document).hasAttribute('role'), false)
    assert.equal(shellOf(document).hasAttribute('aria-modal'), false)
    assert.equal(toggleOf(document).getAttribute('aria-expanded'), 'false')
    assert.equal(isInert(document.querySelector('main')), false)
    assert.equal(bodyLocked(document), false)
    assert.ok(document.activeElement === toggleOf(document))
  }, { mobile: true })
})

test('phím khác Escape không đóng drawer; Escape khi drawer đóng không làm gì và không cướp focus', async () => {
  await withSidebar(({ document }) => {
    press(document, 'Escape')
    assert.ok(document.activeElement !== toggleOf(document), 'Escape khi đóng không được kéo focus về ☰')

    toggleOf(document).click()
    press(document, 'Enter')
    press(document, 'Tab')
    assert.equal(sidebarOf(document).classList.contains('is-open'), true)
  }, { mobile: true })
})

test('Tab và Shift+Tab wrap trong wrapper dialog; Tab không bị trap khi Drawer đóng', async () => {
  await withSidebar(({ document }) => {
    const shell = shellOf(document)
    const focusable = [...shell.querySelectorAll('a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.closest('.sidebar-footer'))
    const first = focusable[0]
    const last = focusable.at(-1)
    const dispatchTab = (target, shiftKey = false) => {
      const event = new document.defaultView.KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true })
      target.dispatchEvent(event)
      return event
    }

    toggleOf(document).click()
    assert.ok(focusable.includes(toggleOf(document)), 'menu trigger phải nằm trong dialog')
    assert.ok(focusable.includes(closeOf(document)), 'nút X phải nằm trong dialog')

    first.focus()
    assert.equal(dispatchTab(first, true).defaultPrevented, true, 'Shift+Tab tại đầu phải bị chặn để wrap')
    assert.ok(document.activeElement === last, 'Shift+Tab ở phần tử đầu phải wrap về cuối')

    last.focus()
    assert.equal(dispatchTab(last).defaultPrevented, true, 'Tab tại cuối phải bị chặn để wrap')
    assert.ok(document.activeElement === first, 'Tab ở phần tử cuối phải wrap về đầu')

    closeOf(document).click()
    const closedEvent = dispatchTab(toggleOf(document))
    assert.equal(closedEvent.defaultPrevented, false, 'không trap khi Drawer đóng')
  }, { mobile: true })
})

test('focus trap bỏ qua control hidden/disabled và không chặn tổ hợp Ctrl+Tab', async () => {
  await withSidebar(({ document }) => {
    toggleOf(document).click()
    const first = toggleOf(document)
    const hiddenLast = document.querySelector('.nav-subitem[data-structure-nav="graph"]')
    const disabledPrevious = document.querySelector('.nav-subitem[data-structure-nav="hash-table"]')

    hiddenLast.hidden = true
    closeOf(document).disabled = true
    first.focus()
    const shiftTab = new document.defaultView.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
    first.dispatchEvent(shiftTab)

    assert.equal(shiftTab.defaultPrevented, true)
    assert.ok(document.activeElement === disabledPrevious, 'wrap phải bỏ qua mục cuối đang hidden')

    disabledPrevious.disabled = true
    const tabFromDisabled = new document.defaultView.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    disabledPrevious.dispatchEvent(tabFromDisabled)
    assert.ok(document.activeElement === first, 'focus trong control disabled phải quay về control dialog hợp lệ')

    const ctrlTab = new document.defaultView.KeyboardEvent('keydown', { key: 'Tab', ctrlKey: true, bubbles: true, cancelable: true })
    first.dispatchEvent(ctrlTab)
    assert.equal(ctrlTab.defaultPrevented, false, 'không can thiệp Ctrl+Tab')
    closeOf(document).disabled = false
    closeOf(document).click()
  }, { mobile: true })
})

test('Tab trap bỏ qua control hidden/disabled và dùng wrapper làm fallback khi không còn focusable control', async () => {
  await withSidebar(({ document, sidebar }) => {
    const shell = shellOf(document)
    const buttons = [...shell.querySelectorAll('button')]

    for (const button of buttons) button.disabled = true

    sidebar.openDrawer()

    assert.ok(document.activeElement === shell)
    assert.equal(shell.getAttribute('tabindex'), '-1')

    const event = new document.defaultView.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    shell.dispatchEvent(event)
    assert.equal(event.defaultPrevented, true, 'không có focusable item thì giữ focus trên wrapper')
    assert.ok(document.activeElement === shell)
    sidebar.closeDrawer({ restoreFocus: false })
  }, { mobile: true })
})

test('focusin từ script ra ngoài dialog bị trả về focus khả dụng gần nhất bên trong', async () => {
  await withSidebar(({ document }) => {
    toggleOf(document).click()
    const inside = document.querySelector('.nav-item')
    const outside = document.createElement('button')
    outside.type = 'button'
    document.body.append(outside)

    inside.focus()
    outside.focus()

    assert.ok(document.activeElement === inside, 'script không được để focus rời dialog')
  }, { mobile: true })
})

test('focus ưu tiên thất bại thì Drawer thử candidate focusable tiếp theo', async () => {
  await withSidebar(({ document }) => {
    const preferred = document.querySelector('.nav-item[data-page="dashboard"]')
    const originalFocus = preferred.focus
    preferred.focus = () => {}

    try {
      toggleOf(document).click()
      assert.ok(document.activeElement !== preferred, 'candidate ưu tiên không được ghi nhận khi focus thất bại')
      assert.ok(document.activeElement?.closest('.drawer-shell') !== null, 'Drawer phải thử candidate tiếp theo trong wrapper')
    } finally {
      preferred.focus = originalFocus
    }
  }, { mobile: true })
})

test('mọi candidate focusable thất bại thì Drawer thử và focus được drawer-shell', async () => {
  await withSidebar(({ document }) => {
    const shell = shellOf(document)
    const focusable = [...shell.querySelectorAll('button')]
    const originalFocus = new Map(focusable.map((element) => [element, element.focus]))

    for (const element of focusable) element.focus = () => {}

    try {
      toggleOf(document).click()
      assert.ok(document.activeElement === shell, 'khi mọi control thất bại, focus phải về drawer-shell')
    } finally {
      for (const [element, focus] of originalFocus) element.focus = focus
    }
  }, { mobile: true })
})

test('focus candidate ném exception thì Drawer tiếp tục thử candidate kế tiếp', async () => {
  await withSidebar(({ document }) => {
    const preferred = document.querySelector('.nav-item[data-page="dashboard"]')
    const originalFocus = preferred.focus
    preferred.focus = () => {
      throw new Error('focus failure')
    }

    try {
      assert.doesNotThrow(() => toggleOf(document).click(), 'exception focus không được làm crash mở Drawer')
      assert.ok(document.activeElement?.closest('.drawer-shell') !== null, 'Drawer phải giữ focus trong wrapper')
    } finally {
      preferred.focus = originalFocus
    }
  }, { mobile: true })
})

test('fallback về main thất bại không gây exception hoặc vòng lặp focus', async () => {
  await withSidebar(({ document }) => {
    const main = document.querySelector('#main-content')
    const originalFocus = main.focus
    toggleOf(document).click()
    toggleOf(document).hidden = true
    main.focus = () => {
      throw new Error('main focus failure')
    }

    try {
      assert.doesNotThrow(() => closeOf(document).click(), 'fallback focus thất bại không được làm crash lifecycle')
      assert.equal(sidebarOf(document).classList.contains('is-open'), false)
      assert.equal(document.activeElement === main, false, 'focus thất bại không được giả là focus thành công')
    } finally {
      main.focus = originalFocus
    }
  }, { mobile: true })
})

for (const unavailable of ['hidden', 'removed', 'disabled']) {
  test(`nếu opener bị ${unavailable}, focus fallback về main thay vì nav mobile đang ẩn`, async () => {
    await withSidebar(({ document }) => {
      toggleOf(document).click()
      closeOf(document).focus()

      if (unavailable === 'hidden') toggleOf(document).hidden = true
      if (unavailable === 'removed') toggleOf(document).remove()
      if (unavailable === 'disabled') toggleOf(document).disabled = true

      closeOf(document).click()

      assert.ok(document.activeElement !== toggleOf(document))
      assert.ok(document.activeElement === document.querySelector('#main-content'))
      assert.equal(isInert(document.querySelector('main')), false)
    }, { mobile: true })
  })
}

test('focus opener không đổi activeElement thì close path chạy fallback', async () => {
  await withSidebar(({ document }) => {
    toggleOf(document).click()
    const originalFocus = toggleOf(document).focus
    toggleOf(document).focus = () => {}

    try {
      closeOf(document).click()
      assert.ok(document.activeElement === document.querySelector('#main-content'), 'focus thất bại phải fallback về main')
    } finally {
      toggleOf(document).focus = originalFocus
    }
  }, { mobile: true })
})

test('focus opener ném exception không làm crash close path và vẫn fallback', async () => {
  await withSidebar(({ document }) => {
    toggleOf(document).click()
    const originalFocus = toggleOf(document).focus
    toggleOf(document).focus = () => {
      throw new Error('focus failure')
    }

    try {
      assert.doesNotThrow(() => closeOf(document).click(), 'exception của focus không được làm crash Drawer lifecycle')
      assert.ok(document.activeElement === document.querySelector('#main-content'), 'focus ném lỗi phải fallback về main')
    } finally {
      toggleOf(document).focus = originalFocus
    }
  }, { mobile: true })
})

test('resize: focus active thất bại thì thử rememberedFocus', async () => {
  await withSidebar(({ document, media }) => {
    toggleOf(document).click()
    const active = document.querySelector('.nav-item[data-page="sorting"]')
    const remembered = document.querySelector('.nav-item[data-page="dashboard"]')
    const originalFocus = active.focus

    active.focus()
    remembered.dispatchEvent(new document.defaultView.FocusEvent('focusin', { bubbles: true }))
    active.focus = () => remembered.focus()

    try {
      media.setWidth(768)
      assert.ok(document.activeElement === remembered, 'focus remembered phải được thử sau khi focus active thất bại')
    } finally {
      active.focus = originalFocus
    }
  }, { mobile: true })
})

test('resize: rememberedFocus thất bại thì chạy fallback cuối cùng về main', async () => {
  await withSidebar(({ document, media }) => {
    toggleOf(document).click()
    const active = document.querySelector('.nav-item[data-page="sorting"]')
    const remembered = document.querySelector('.nav-item[data-page="dashboard"]')
    const navItems = [...document.querySelectorAll('.nav-item, .nav-subitem')]
    const originalFocus = new Map(navItems.map((element) => [element, element.focus]))

    active.focus()
    remembered.dispatchEvent(new document.defaultView.FocusEvent('focusin', { bubbles: true }))
    active.focus = () => document.body.focus()
    for (const element of navItems) {
      if (element !== active) element.focus = () => {}
    }

    try {
      media.setWidth(768)
      assert.ok(document.activeElement === document.querySelector('#main-content'), 'focus thất bại hết phải fallback về main')
    } finally {
      for (const [element, focus] of originalFocus) element.focus = focus
    }
  }, { mobile: true })
})

test('bấm lớp phủ đóng drawer và trả focus về ☰', async () => {
  await withSidebar(({ document }) => {
    toggleOf(document).click()
    document.querySelector('.sidebar-overlay').click()

    assert.equal(sidebarOf(document).classList.contains('is-open'), false)
    assert.equal(isInert(document.querySelector('main')), false)
    assert.ok(document.activeElement === toggleOf(document))
  }, { mobile: true })
})

test('chọn một .nav-item đóng drawer VÀ vẫn chuyển trang đúng', async () => {
  await withSidebar(({ document }) => {
    toggleOf(document).click()
    goTo(document, 'sorting')

    assert.equal(sidebarOf(document).classList.contains('is-open'), false)
    assert.equal(shellOf(document).hasAttribute('role'), false)
    assert.equal(shellOf(document).hasAttribute('aria-modal'), false)
    assert.equal(toggleOf(document).getAttribute('aria-expanded'), 'false')
    assert.equal(isInert(document.querySelector('main')), false)
    assert.equal(isInert(document.querySelector('.skip-link')), false)
    assert.equal(document.querySelector('.algorithm-section').hidden, false, 'thư viện Sắp xếp phải hiện')
    assert.equal(bodyLocked(document), false)
    assert.ok(document.activeElement === toggleOf(document))
  }, { mobile: true })
})

test('chọn một mục con đóng drawer VÀ mở đúng cấu trúc', async () => {
  await withSidebar(({ document }) => {
    toggleOf(document).click()
    document.querySelector('.nav-subitem[data-structure-nav="graph"]').click()

    assert.equal(sidebarOf(document).classList.contains('is-open'), false)
    assert.equal(shellOf(document).hasAttribute('role'), false)
    assert.equal(shellOf(document).hasAttribute('aria-modal'), false)
    assert.equal(toggleOf(document).getAttribute('aria-expanded'), 'false')
    assert.equal(document.querySelector('#graph-section').hidden, false)
    assert.equal(isInert(document.querySelector('main')), false)
    assert.equal(isInert(document.querySelector('.skip-link')), false)
    assert.equal(bodyLocked(document), false)
  }, { mobile: true })
})

test('bấm lại mục con của cấu trúc đang mở: vẫn đóng drawer nhưng 0 viewchange', async () => {
  await withSidebar(({ document }) => {
    document.querySelector('.nav-subitem[data-structure-nav="bst"]').click()

    const log = []
    document.addEventListener('algovision:viewchange', (event) => log.push({ ...event.detail }))

    toggleOf(document).click()
    assert.equal(sidebarOf(document).classList.contains('is-open'), true)

    document.querySelector('.nav-subitem[data-structure-nav="bst"]').click()

    assert.equal(sidebarOf(document).classList.contains('is-open'), false, 'drawer phải đóng')
    assert.equal(shellOf(document).hasAttribute('role'), false)
    assert.equal(shellOf(document).hasAttribute('aria-modal'), false)
    assert.deepEqual(log, [])
  }, { mobile: true })
})

test('bấm ☰ khi đang ở màn hình rộng không mở drawer (tránh trạng thái mở sót khi thu nhỏ cửa sổ)', async () => {
  await withSidebar(({ document }) => {
    toggleOf(document).click()

    assert.equal(sidebarOf(document).classList.contains('is-open'), false)
    assert.equal(shellOf(document).hasAttribute('role'), false)
    assert.equal(shellOf(document).hasAttribute('aria-modal'), false)
    assert.equal(isInert(document.querySelector('main')), false)
    assert.equal(toggleOf(document).getAttribute('aria-expanded'), 'false')
  }, { mobile: false })
})

test('phóng to cửa sổ qua ngưỡng 767px khi drawer đang mở: drawer đóng, inert được gỡ, focus không bị kéo về ☰', async () => {
  await withSidebar(({ document, media }) => {
    toggleOf(document).click()
    assert.equal(isInert(document.querySelector('main')), true)

    media.setMatches(false)

    assert.equal(sidebarOf(document).classList.contains('is-open'), false)
    assert.equal(document.querySelector('.sidebar-overlay').classList.contains('is-open'), false)
    assert.equal(isInert(document.querySelector('main')), false)
    assert.equal(isInert(document.querySelector('.skip-link')), false)
    assert.equal(toggleOf(document).getAttribute('aria-expanded'), 'false')
    assert.ok(document.activeElement !== toggleOf(document), 'đóng do đổi bố cục thì không cướp focus')
  }, { mobile: true })
})

test('resize 767→768 khi focus ở menu trigger: dialog đóng và focus chuyển khỏi control mobile bị ẩn', async () => {
  await withSidebar(({ document, media, sidebar }) => {
    toggleOf(document).click()
    toggleOf(document).focus()

    media.setWidth(768)

    assert.equal(sidebar.isDrawerOpen(), false, 'Drawer phải đóng khi resize qua breakpoint')
    assert.equal(shellOf(document).hasAttribute('role'), false)
    assert.equal(isInert(document.querySelector('main')), false)
    assert.ok(document.activeElement !== toggleOf(document))
    assert.ok(document.activeElement === document.querySelector('.nav-item.active'))
  }, { mobile: true })
})

test('thu nhỏ cửa sổ qua ngưỡng 767px: drawer vẫn đóng cho tới khi người dùng bấm ☰', async () => {
  await withSidebar(({ document, media }) => {
    media.setMatches(true)
    assert.equal(sidebarOf(document).classList.contains('is-open'), false)

    toggleOf(document).click()
    assert.equal(sidebarOf(document).classList.contains('is-open'), true)
  }, { mobile: false })
})

test('mở rồi đóng drawer nhiều lần: trạng thái luôn nhất quán (không inert sót, aria-expanded khớp)', async () => {
  await withSidebar(({ document }) => {
    for (let round = 0; round < 3; round++) {
      toggleOf(document).click()
      assert.equal(toggleOf(document).getAttribute('aria-expanded'), 'true')
      assert.equal(isInert(document.querySelector('main')), true)

      press(document, 'Escape')
      assert.equal(toggleOf(document).getAttribute('aria-expanded'), 'false')
      assert.equal(isInert(document.querySelector('main')), false)
    }
  }, { mobile: true })
})

test('drawer không đụng tới thu gọn: nút thu gọn giữ trạng thái khi mở/đóng drawer', async () => {
  await withSidebar(({ document }) => {
    collapseOf(document).click()
    toggleOf(document).click()
    press(document, 'Escape')

    assert.equal(collapseOf(document).getAttribute('aria-expanded'), 'false')
    assert.equal(document.querySelector('.app-layout').classList.contains('is-sidebar-collapsed'), true)
  }, { mobile: true })
})

test('src/main.js khởi tạo sidebar: import initSidebar và gọi SAU initNavigation (mục con do navigation sinh)', async () => {
  const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8')
  // Tìm theo tên hàm, không theo thụt lề.
  const call = (name) => source.search(new RegExp(`\\b${name}\\(document\\)`))

  assert.match(source, /import \{ initSidebar \} from '\.\/sidebar\.js'/)
  assert.ok(call('initNavigation') !== -1 && call('initSidebar') !== -1, 'thiếu một trong hai lời gọi init')
  assert.ok(call('initNavigation') < call('initSidebar'), 'initSidebar phải chạy sau initNavigation')
})

// --- Khóa cuộn nền khi drawer mở (đo CDP trước PR: lăn chuột trên lớp phủ làm trang phía sau cuộn 0 -> 300px; inert không chặn cuộn) ---

const bodyLocked = (document) => document.body.classList.contains('is-drawer-open')

test('khóa cuộn nền: mở drawer thì <body> có is-drawer-open, đóng bằng ☰ thì bỏ', async () => {
  await withSidebar(({ document }) => {
    assert.equal(bodyLocked(document), false)

    toggleOf(document).click()
    assert.equal(bodyLocked(document), true)

    toggleOf(document).click()
    assert.equal(bodyLocked(document), false)
  }, { mobile: true })
})

test('khóa cuộn nền được gỡ khi đóng bằng Escape, bằng lớp phủ, bằng chọn mục và bằng chọn mục con', async () => {
  await withSidebar(({ document }) => {
    const closers = [
      () => press(document, 'Escape'),
      () => document.querySelector('.sidebar-overlay').click(),
      () => goTo(document, 'sorting'),
      () => document.querySelector('.nav-subitem[data-structure-nav="graph"]').click(),
    ]

    for (const close of closers) {
      toggleOf(document).click()
      assert.equal(bodyLocked(document), true)

      close()
      assert.equal(bodyLocked(document), false)
    }
  }, { mobile: true })
})

test('khóa cuộn nền được gỡ khi cửa sổ rộng ra qua 767px lúc drawer đang mở (không để trang desktop bị khóa cuộn)', async () => {
  await withSidebar(({ document, media }) => {
    toggleOf(document).click()
    assert.equal(bodyLocked(document), true)

    media.setMatches(false)
    assert.equal(bodyLocked(document), false)
  }, { mobile: true })
})

test('bấm ☰ ở màn hình rộng không khóa cuộn; thu gọn sidebar không đụng tới khóa cuộn', async () => {
  await withSidebar(({ document }) => {
    toggleOf(document).click()
    collapseOf(document).click()

    assert.equal(bodyLocked(document), false)
  }, { mobile: false })
})

test('khóa cuộn chỉ là một class trên <body>, không ghi style nội tuyến (CSS quyết định overflow)', async () => {
  await withSidebar(({ document }) => {
    toggleOf(document).click()

    assert.equal(document.body.getAttribute('style'), null)
  }, { mobile: true })
})
