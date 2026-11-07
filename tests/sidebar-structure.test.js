import test from 'node:test'
import assert from 'node:assert/strict'

import { withFullApp } from './helpers/app-dom.js'

// Redesign Phase 2: sidebar chia nhóm. Test này khóa cấu trúc DOM (landmark, nhóm, mục con, nút ☰ và nút thu gọn) sau khi
// toàn bộ app đã khởi tạo (mục con do navigation.js sinh từ [data-structure-target]).
const FOCUSABLE = 'a[href], button, select, input, textarea, [tabindex]:not([tabindex="-1"])'
const STRUCTURES = ['array', 'stack', 'queue', 'linked-list', 'bst', 'hash-table', 'graph']
const NAV_ITEMS = [
  { page: 'dashboard', label: 'Tổng quan' },
  { page: 'sorting', label: 'Sắp xếp' },
  { page: 'searching', label: 'Tìm kiếm' },
  { page: 'structures', label: 'Tất cả cấu trúc' },
]

const textOf = (element) => element.textContent.replace(/\s+/g, ' ').trim()
const orderOf = (document) => [...document.querySelectorAll('*')]

test('đúng một landmark điều hướng: <nav aria-label="Điều hướng chính"> nằm trong aside.sidebar', async () => {
  await withFullApp(({ document }) => {
    const landmarks = document.querySelectorAll('nav, [role="navigation"]')

    assert.equal(landmarks.length, 1, 'đúng một landmark điều hướng trong cả trang')
    assert.equal(landmarks[0].tagName, 'NAV')
    assert.equal(landmarks[0].getAttribute('aria-label'), 'Điều hướng chính')
    assert.ok(landmarks[0].closest('aside.sidebar') !== null, '<nav> phải nằm trong <aside class="sidebar">')
    assert.equal(document.querySelectorAll('aside').length, 1, 'đúng một landmark complementary')
  })
})

test('aside.sidebar có id="sidebar" (đích aria-controls của nút ☰ và nút thu gọn)', async () => {
  await withFullApp(({ document }) => {
    assert.ok(document.querySelector('aside.sidebar#sidebar') !== null, 'thiếu aside.sidebar#sidebar')
  })
})

for (const { page, label } of NAV_ITEMS) {
  test(`mục "${label}": đúng một .nav-item[data-page="${page}"], là <button type="button"> nằm trong <nav>, nhãn trong .nav-label`, async () => {
    await withFullApp(({ document }) => {
      const items = document.querySelectorAll(`.nav-item[data-page="${page}"]`)

      assert.equal(items.length, 1, `đúng một mục data-page="${page}"`)

      const item = items[0]

      assert.equal(item.tagName, 'BUTTON')
      assert.equal(item.getAttribute('type'), 'button')
      assert.ok(item.closest('nav[aria-label="Điều hướng chính"]') !== null, 'mục phải nằm trong <nav>')
      assert.equal(textOf(item.querySelector('.nav-label')), label)
      assert.equal(item.querySelector('.nav-icon')?.getAttribute('aria-hidden'), 'true', 'icon chỉ để trang trí, ẩn khỏi trình đọc màn hình')
    })
  })
}

test('chỉ có đúng bốn .nav-item (mục con KHÔNG mang class nav-item) và mọi data-page đều thuộc bốn trang thật', async () => {
  await withFullApp(({ document }) => {
    const pages = [...document.querySelectorAll('.nav-item')].map((item) => item.dataset.page)

    assert.deepEqual(pages, ['dashboard', 'sorting', 'searching', 'structures'])
  })
})

test('hai nhóm có nhãn "THUẬT TOÁN" và "CẤU TRÚC DỮ LIỆU", mỗi danh sách được đặt tên bằng nhãn nhóm của nó', async () => {
  await withFullApp(({ document }) => {
    const labels = [...document.querySelectorAll('.sidebar .section-label')]

    assert.deepEqual(labels.map(textOf), ['THUẬT TOÁN', 'CẤU TRÚC DỮ LIỆU'])

    for (const label of labels) {
      assert.ok(label.id !== '', `nhãn "${textOf(label)}" cần id để danh sách trỏ aria-labelledby`)
      assert.ok(document.querySelector(`ul[aria-labelledby="${label.id}"]`) !== null, `thiếu <ul aria-labelledby="${label.id}">`)
    }
  })
})

test('thứ tự trong DOM: Tổng quan đứng riêng trên cùng, rồi nhóm THUẬT TOÁN (Sắp xếp, Tìm kiếm), rồi nhóm CẤU TRÚC DỮ LIỆU (Tất cả cấu trúc)', async () => {
  await withFullApp(({ document }) => {
    const order = orderOf(document)
    const at = (selector) => order.indexOf(document.querySelector(selector))
    const [groupAlgorithms, groupStructures] = [...document.querySelectorAll('.sidebar .section-label')].map((label) => order.indexOf(label))

    assert.ok(at('.nav-item[data-page="dashboard"]') < groupAlgorithms, 'Tổng quan nằm trước nhãn nhóm đầu tiên')
    assert.ok(groupAlgorithms < at('.nav-item[data-page="sorting"]'), 'Sắp xếp thuộc nhóm THUẬT TOÁN')
    assert.ok(at('.nav-item[data-page="sorting"]') < at('.nav-item[data-page="searching"]'))
    assert.ok(at('.nav-item[data-page="searching"]') < groupStructures, 'Tìm kiếm vẫn thuộc nhóm THUẬT TOÁN')
    assert.ok(groupStructures < at('.nav-item[data-page="structures"]'), 'Tất cả cấu trúc thuộc nhóm CẤU TRÚC DỮ LIỆU')
  })
})

test('7 mục con khớp một-một và đúng thứ tự với 7 thẻ [data-structure-target], nằm dưới "Tất cả cấu trúc"', async () => {
  await withFullApp(({ document }) => {
    const cards = [...document.querySelectorAll('[data-structure-target]')].map((card) => card.dataset.structureTarget)
    const subitems = [...document.querySelectorAll('.nav-subitem')].map((item) => item.dataset.structureNav)

    assert.deepEqual(cards, STRUCTURES, 'bảng kỳ vọng phải khớp thẻ thật trong template')
    assert.deepEqual(subitems, cards)

    const parentItem = document.querySelector('.nav-item[data-page="structures"]')
    const order = orderOf(document)

    for (const subitem of document.querySelectorAll('.nav-subitem')) {
      assert.ok(order.indexOf(parentItem) < order.indexOf(subitem), `${subitem.dataset.structureNav}: mục con đứng sau mục cha`)
      assert.ok(subitem.closest('nav[aria-label="Điều hướng chính"]') !== null)
    }
  })
})

for (const target of STRUCTURES) {
  test(`mục con "${target}": <button> có data-structure-nav, KHÔNG có data-structure-target và KHÔNG mang class nav-item`, async () => {
    await withFullApp(({ document }) => {
      const subitem = document.querySelector(`.nav-subitem[data-structure-nav="${target}"]`)
      const card = document.querySelector(`.structure-card[data-structure-target="${target}"]`)

      assert.ok(subitem !== null, `thiếu mục con ${target}`)
      assert.ok(card !== null, `thiếu thẻ ${target}`)
      assert.equal(subitem.tagName, 'BUTTON')
      assert.equal(subitem.getAttribute('type'), 'button')
      assert.equal(subitem.hasAttribute('data-structure-target'), false, 'data-structure-target dành cho thẻ: navigation.js sinh mục con từ các thẻ có thuộc tính này')
      assert.equal(subitem.classList.contains('nav-item'), false, 'class nav-item dành cho 4 mục trang: nhiều test lấy mục đầu tiên theo class này')
      assert.ok(document.querySelector(`#${target}-section`) !== null, `mục con ${target} phải có #${target}-section để mở`)
      assert.equal(textOf(subitem.querySelector('.nav-label')), textOf(card.querySelector('.structure-card-title')), 'nhãn lấy từ tiêu đề thẻ')
      assert.equal(subitem.querySelector('.nav-icon use')?.getAttribute('href'), `#icon-structure-${target}`, 'icon mục con là symbol SVG riêng của cấu trúc (không còn sao glyph của thẻ)')
      assert.equal(subitem.querySelector('.nav-icon').getAttribute('aria-hidden'), 'true')
    })
  })
}

test('[data-structure-target] chỉ nằm trên 7 thẻ của thư viện, không phần tử nào trong sidebar mang thuộc tính này', async () => {
  await withFullApp(({ document }) => {
    const carriers = [...document.querySelectorAll('[data-structure-target]')]

    assert.equal(carriers.length, 7)
    assert.ok(carriers.every((card) => card.closest('#structure-library') !== null), 'mọi phần tử data-structure-target nằm trong #structure-library')
    assert.equal(document.querySelectorAll('.sidebar [data-structure-target]').length, 0)
  })
})

test('khối "PHIÊN BẢN AlgoVision 0.1.0" đã bỏ (không phải dữ liệu thật: package.json là 0.0.0, repo không có tag)', async () => {
  await withFullApp(({ document }) => {
    const sidebarText = textOf(document.querySelector('.sidebar'))

    assert.ok(document.querySelector('.sidebar-bottom') === null, 'không còn khối .sidebar-bottom')
    assert.equal(sidebarText.includes('PHIÊN BẢN'), false)
    assert.equal(sidebarText.includes('0.1.0'), false)
  })
})

test('không có mục giả: không Learn, Progress, Settings, Visualizer, Dijkstra, Dynamic Programming, Sign Out, tìm kiếm, chuông, Dark Mode', async () => {
  await withFullApp(({ document }) => {
    // Chỉ xét phần điều hướng: dòng phụ của logo ("Algorithm Visualizer") là chữ thật của thương hiệu.
    const sidebar = document.querySelector('.sidebar')
    const text = textOf(sidebar.querySelector('nav'))

    for (const fake of ['Learn', 'Progress', 'Settings', 'Visualizer', 'Dijkstra', 'Dynamic', 'Sign Out', 'Dark Mode', '34+']) {
      assert.equal(text.includes(fake), false, `sidebar không được có "${fake}"`)
    }

    assert.equal(sidebar.querySelectorAll('input, select, textarea, a[href]').length, 0, 'sidebar không có ô nhập hay liên kết')
  })
})

test('vùng cuộn của sidebar: div.sidebar-scroll role="group" có tên, nằm trong <nav> và chứa mọi mục điều hướng', async () => {
  await withFullApp(({ document }) => {
    const region = document.querySelector('nav .sidebar-scroll')

    assert.ok(region !== null, 'thiếu .sidebar-scroll trong <nav>')
    assert.equal(region.tagName, 'DIV')
    assert.equal(region.getAttribute('role'), 'group')
    assert.equal(region.getAttribute('aria-label'), 'Danh sách mục điều hướng')
    assert.equal(region.querySelectorAll('.nav-item').length, 4)
    assert.equal(region.querySelectorAll('.nav-subitem').length, 7)
  })
})

test('nút ☰ #sidebar-toggle: <button type="button"> đóng sẵn, aria-expanded="false", aria-controls="sidebar", nằm SAU skip link và TRƯỚC sidebar', async () => {
  await withFullApp(({ document }) => {
    const toggle = document.querySelector('#sidebar-toggle')
    const order = orderOf(document)

    assert.ok(toggle !== null, 'thiếu #sidebar-toggle')
    assert.equal(toggle.tagName, 'BUTTON')
    assert.equal(toggle.getAttribute('type'), 'button')
    assert.equal(toggle.getAttribute('aria-expanded'), 'false')
    assert.equal(toggle.getAttribute('aria-controls'), 'sidebar')
    assert.equal(toggle.getAttribute('aria-label'), 'Mở menu điều hướng')
    assert.ok(order.indexOf(document.querySelector('.skip-link')) < order.indexOf(toggle), 'skip link đứng trước nút ☰')
    assert.ok(order.indexOf(toggle) < order.indexOf(document.querySelector('.sidebar')), 'nút ☰ đứng trước sidebar')
    assert.ok(toggle.closest('main, aside') === null, '☰ nằm ngoài main (main bị inert khi drawer mở) và ngoài sidebar')
  })
})

test('skip link vẫn là phần tử focus được đầu tiên và nút ☰ là phần tử focus được thứ hai', async () => {
  await withFullApp(({ document }) => {
    const focusable = [...document.querySelectorAll(FOCUSABLE)]

    assert.ok(focusable[0] === document.querySelector('.skip-link'), 'phần tử focus đầu tiên phải là skip link')
    assert.ok(focusable[1] === document.querySelector('#sidebar-toggle'), 'phần tử focus thứ hai phải là nút ☰')
  })
})

test('nút thu gọn #sidebar-collapse: ở đáy sidebar, mở sẵn, aria-expanded="true", aria-controls="sidebar", nhãn "Thu gọn thanh bên"', async () => {
  await withFullApp(({ document }) => {
    const button = document.querySelector('#sidebar-collapse')

    assert.ok(button !== null, 'thiếu #sidebar-collapse')
    assert.equal(button.tagName, 'BUTTON')
    assert.equal(button.getAttribute('type'), 'button')
    assert.equal(button.getAttribute('aria-expanded'), 'true')
    assert.equal(button.getAttribute('aria-controls'), 'sidebar')
    assert.equal(button.getAttribute('aria-label'), 'Thu gọn thanh bên')
    assert.equal(button.querySelector('.sidebar-collapse-icon')?.getAttribute('aria-hidden'), 'true', 'mũi tên chỉ để trang trí: tên nút là aria-label')
    assert.ok(button.closest('.sidebar-footer') !== null, 'nút nằm trong .sidebar-footer ở đáy sidebar')
    assert.ok(button.closest('nav') === null, 'nút thu gọn không phải mục điều hướng')

    const order = orderOf(document)
    const lastItem = [...document.querySelectorAll('.nav-subitem')].at(-1)

    assert.ok(order.indexOf(lastItem) < order.indexOf(button), 'nút thu gọn nằm sau mọi mục điều hướng')
  })
})

test('lớp phủ .sidebar-overlay có sẵn, ẩn khỏi trình đọc màn hình (aria-hidden) và không focus được', async () => {
  await withFullApp(({ document }) => {
    const overlay = document.querySelector('.sidebar-overlay')

    assert.ok(overlay !== null, 'thiếu .sidebar-overlay')
    assert.equal(overlay.getAttribute('aria-hidden'), 'true')
    assert.equal(overlay.matches(FOCUSABLE), false)
  })
})

test('h1 AlgoVision vẫn là h1 duy nhất, nằm trong .brand của sidebar', async () => {
  await withFullApp(({ document }) => {
    const headings = document.querySelectorAll('h1')

    assert.equal(headings.length, 1)
    assert.equal(textOf(headings[0]), 'AlgoVision')
    assert.ok(headings[0].closest('.sidebar .brand') !== null)
  })
})

test('thanh trên cho di động .mobile-bar chứa nút ☰ và không chứa liên kết nào khác; .topbar trong <main> giữ nguyên', async () => {
  await withFullApp(({ document }) => {
    const bar = document.querySelector('.mobile-bar')

    assert.ok(bar !== null, 'thiếu .mobile-bar')
    assert.equal(bar.querySelectorAll(FOCUSABLE).length, 1, 'chỉ có nút ☰ focus được')
    assert.equal(bar.querySelector('.mobile-bar-title')?.getAttribute('aria-hidden'), 'true', 'tên thương hiệu trên thanh trên chỉ để nhìn: h1 trong sidebar đã là tên trang')
    assert.equal(bar.querySelector('.menu-button-icon')?.getAttribute('aria-hidden'), 'true', 'ba vạch chỉ để trang trí: tên nút là aria-label')
    assert.ok(bar.querySelector('#sidebar-toggle') !== null)
    assert.ok(document.querySelector('main .topbar') !== null, '.topbar vẫn nằm trong <main>')
    assert.equal(document.querySelectorAll('.topbar').length, 1)
  })
})
