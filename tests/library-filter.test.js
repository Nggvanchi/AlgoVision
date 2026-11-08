import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { initNavigation } from '../src/navigation.js'
import { initLibraryFilter } from '../src/library-filter.js'

// R5b commit 2: ô tìm + chip phân loại + bộ đếm "Hiển thị N mục" + trạng thái rỗng, CHỈ ở hai tab của Thư viện.
// Lọc theo dữ liệu thật của thẻ (data-category, tiêu đề, mô tả); trạng thái chỉ trong bộ nhớ.

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

function withFilter(run) {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    initNavigation(document)
    initLibraryFilter(document)

    const log = []

    document.addEventListener('algovision:viewchange', (event) => log.push({ ...event.detail }))

    const input = document.querySelector('.library-search-input')
    const type = (text) => {
      input.value = text
      input.dispatchEvent(new window.Event('input', { bubbles: true }))
    }
    const chip = (category) => document.querySelector(`.library-chips:not([hidden]) [data-category-filter="${category}"]`)
    const pressed = () => [...document.querySelectorAll('.library-chips:not([hidden]) [data-category-filter]')].filter((item) => item.getAttribute('aria-pressed') === 'true').map((item) => item.dataset.categoryFilter)
    const titles = (panel) => [...document.querySelectorAll(`${panel} [data-category]`)].filter((card) => !card.hidden).map((card) => card.querySelector('h4, .structure-card-title').textContent.trim())
    const tab = (name) => document.querySelector(`.library-tab[data-library-tab="${name}"]`)
    const count = () => document.querySelector('.library-count').textContent.trim()
    const goTo = (page) => document.querySelector(`.nav-item[data-page="${page}"]`).click()

    run({ document, window, log, input, type, chip, pressed, titles, tab, count, goTo })
  } finally {
    window.happyDOM.close()
  }
}

const filtersHidden = (document) => document.querySelector('.library-filters').hidden

test('thanh lọc chỉ hiện ở thư viện Cấu trúc và tab Giải thuật; ẩn ở Dashboard, Sắp xếp, Tìm kiếm và mọi màn chi tiết', () => {
  withFilter(({ document, tab, goTo }) => {
    assert.equal(filtersHidden(document), true, 'Dashboard')
    goTo('sorting')
    assert.equal(filtersHidden(document), true, 'thư viện Sắp xếp')
    goTo('searching')
    assert.equal(filtersHidden(document), true, 'thư viện Tìm kiếm')
    goTo('structures')
    assert.equal(filtersHidden(document), false, 'thư viện Cấu trúc')
    document.querySelector('[data-structure-target="stack"]').click()
    assert.equal(filtersHidden(document), true, 'chi tiết Stack')
    document.querySelector('#stack-section [data-back-to-structures]').click()
    assert.equal(filtersHidden(document), false, 'Quay lại thư viện Cấu trúc')
    tab('algorithms').click()
    assert.equal(filtersHidden(document), false, 'tab Giải thuật')
    goTo('dashboard')
    assert.equal(filtersHidden(document), true)
  })
})

test('bộ đếm ban đầu "Hiển thị 7 mục" ở cả hai tab; mỗi tab có đúng nhóm chip của mình', () => {
  withFilter(({ document, tab, goTo, count, chip }) => {
    goTo('structures')
    assert.equal(count(), 'Hiển thị 7 mục')
    assert.deepEqual([...document.querySelectorAll('.library-chips:not([hidden]) .library-chip')].map((item) => item.textContent.trim()), ['Tất cả', 'Tuyến tính', 'Cây', 'Đồ thị', 'Bảng băm'])

    tab('algorithms').click()
    assert.equal(count(), 'Hiển thị 7 mục')
    assert.deepEqual([...document.querySelectorAll('.library-chips:not([hidden]) .library-chip')].map((item) => item.textContent.trim()), ['Tất cả', 'Sắp xếp', 'Tìm kiếm', 'Duyệt đồ thị'])
    assert.ok(chip('all') !== null)
  })
})

test('tìm theo tên và theo mô tả, bỏ dấu tiếng Việt và không phân biệt hoa thường; bộ đếm cập nhật', () => {
  withFilter(({ goTo, tab, type, titles, count }) => {
    goTo('structures')
    type('graph')
    assert.deepEqual(titles('#structure-panel'), ['Graph'])
    assert.equal(count(), 'Hiển thị 1 mục')

    type('LIFO')
    assert.deepEqual(titles('#structure-panel'), ['Stack'], 'khớp mô tả, không phân biệt hoa thường')

    type('do thi')
    assert.deepEqual(titles('#structure-panel'), ['Graph'], '"do thi" khớp "đồ thị" trong mô tả')

    type('  Đồ Thị  ')
    assert.deepEqual(titles('#structure-panel'), ['Graph'], 'có dấu, hoa thường, thừa khoảng trắng')

    tab('algorithms').click()
    type('hang doi')
    assert.deepEqual(titles('#algorithm-panel'), ['Duyệt đồ thị BFS'], '"hang doi" khớp "hàng đợi"')
    type('bubble')
    assert.deepEqual(titles('#algorithm-panel'), ['Bubble Sort'])
  })
})

test('chỉ khớp tiêu đề và mô tả hiển thị: không khớp nhãn "Trực quan hóa" hay Big-O của thẻ', () => {
  withFilter(({ tab, goTo, type, titles, count }) => {
    goTo('structures')
    tab('algorithms').click()
    type('truc quan')
    assert.deepEqual(titles('#algorithm-panel'), [])
    assert.equal(count(), 'Hiển thị 0 mục')

    type('o(n')
    assert.deepEqual(titles('#algorithm-panel'), [])
  })
})

test('chip tab Cấu trúc: từng loại hiện đúng thẻ, aria-pressed đúng một chip', () => {
  withFilter(({ goTo, chip, pressed, titles, count }) => {
    goTo('structures')
    assert.deepEqual(pressed(), ['all'])

    for (const [category, expected] of [
      ['linear', ['Array', 'Stack', 'Queue', 'Linked List']],
      ['tree', ['Binary Search Tree']],
      ['graph', ['Graph']],
      ['hash', ['Hash Table']],
      ['all', ['Array', 'Stack', 'Queue', 'Linked List', 'Binary Search Tree', 'Hash Table', 'Graph']],
    ]) {
      chip(category).click()
      assert.deepEqual(titles('#structure-panel'), expected, category)
      assert.deepEqual(pressed(), [category])
      assert.equal(count(), `Hiển thị ${expected.length} mục`)
    }
  })
})

test('chip tab Giải thuật: Sắp xếp 3, Tìm kiếm 2, Duyệt đồ thị 2', () => {
  withFilter(({ goTo, tab, chip, titles }) => {
    goTo('structures')
    tab('algorithms').click()

    chip('sorting').click()
    assert.deepEqual(titles('#algorithm-panel'), ['Bubble Sort', 'Selection Sort', 'Insertion Sort'])
    chip('searching').click()
    assert.deepEqual(titles('#algorithm-panel'), ['Linear Search', 'Binary Search'])
    chip('graph').click()
    assert.deepEqual(titles('#algorithm-panel'), ['Duyệt đồ thị BFS', 'Duyệt đồ thị DFS'])
  })
})

test('chuỗi tìm và chip kết hợp bằng AND', () => {
  withFilter(({ goTo, chip, type, titles, count }) => {
    goTo('structures')
    chip('linear').click()
    type('lifo')
    assert.deepEqual(titles('#structure-panel'), ['Stack'])

    type('graph')
    assert.deepEqual(titles('#structure-panel'), [], 'Graph không thuộc loại Tuyến tính')
    assert.equal(count(), 'Hiển thị 0 mục')
  })
})

test('section không còn thẻ nào hiện bị ẩn bằng .is-filtered-out, KHÔNG đổi thuộc tính hidden của section (navigation quản lý hidden đó)', () => {
  withFilter(({ document, goTo, tab, chip }) => {
    goTo('structures')
    tab('algorithms').click()
    chip('graph').click()

    const section = (id) => document.getElementById(id)

    assert.equal(section('sorting-algorithm-library').classList.contains('is-filtered-out'), true)
    assert.equal(section('search-algorithm-library').classList.contains('is-filtered-out'), true)
    assert.equal(section('graph-algorithm-library').classList.contains('is-filtered-out'), false)
    assert.deepEqual(['sorting-algorithm-library', 'search-algorithm-library', 'graph-algorithm-library'].map((id) => section(id).hidden), [false, false, false])

    chip('all').click()
    assert.equal(document.querySelectorAll('.is-filtered-out').length, 0)
  })
})

test('trạng thái rỗng: thông báo hiện khi 0 kết quả; "Xóa bộ lọc" đặt lại chuỗi tìm và chip rồi đưa focus về ô tìm', () => {
  withFilter(({ document, goTo, chip, pressed, type, titles, count, input }) => {
    const empty = document.querySelector('.library-empty')

    goTo('structures')
    assert.equal(empty.hidden, true)

    chip('hash').click()
    type('zzzz')
    assert.equal(empty.hidden, false)
    assert.equal(count(), 'Hiển thị 0 mục')

    empty.querySelector('button').click()

    assert.equal(input.value, '')
    assert.deepEqual(pressed(), ['all'])
    assert.equal(titles('#structure-panel').length, 7)
    assert.equal(count(), 'Hiển thị 7 mục')
    assert.equal(empty.hidden, true)
    assert.ok(document.activeElement === input, 'focus phải về ô tìm')

    type('zzzz')
    type('')
    assert.equal(empty.hidden, true, 'xóa chuỗi tìm thì thông báo rỗng biến mất')
  })
})

test('mỗi tab nhớ chip của mình; chuỗi tìm dùng chung hai tab', () => {
  withFilter(({ goTo, tab, chip, pressed, type, input }) => {
    goTo('structures')
    chip('linear').click()
    type('a')

    tab('algorithms').click()
    assert.deepEqual(pressed(), ['all'], 'tab Giải thuật có chip riêng')
    assert.equal(input.value, 'a', 'chuỗi tìm giữ nguyên khi đổi tab')
    chip('sorting').click()

    tab('structures').click()
    assert.deepEqual(pressed(), ['linear'])
    tab('algorithms').click()
    assert.deepEqual(pressed(), ['sorting'])
  })
})

test('mở chi tiết rồi Quay lại: bộ lọc được giữ và áp lại (thẻ, bộ đếm, ô tìm)', () => {
  withFilter(({ document, goTo, tab, type, titles, count, input }) => {
    goTo('structures')
    tab('algorithms').click()
    type('bubble')
    document.querySelector('.algorithm-card[data-algorithm="bubble"]').click()
    document.querySelector('[data-back-to-sorting-algorithms]').click()

    assert.deepEqual(titles('#algorithm-panel'), ['Bubble Sort'])
    assert.equal(count(), 'Hiển thị 1 mục')
    assert.equal(input.value, 'bubble')
  })
})

test('rời thư viện thì mọi thẻ hiện lại: trang Sắp xếp và Tìm kiếm (từ sidebar) thấy đủ thẻ dù đang lọc ở tab Giải thuật', () => {
  withFilter(({ document, goTo, tab, type, titles }) => {
    goTo('structures')
    tab('algorithms').click()
    type('bubble')
    assert.deepEqual(titles('#algorithm-panel'), ['Bubble Sort'])

    goTo('sorting')
    assert.deepEqual(titles('#algorithm-panel'), ['Bubble Sort', 'Selection Sort', 'Insertion Sort', 'Linear Search', 'Binary Search', 'Duyệt đồ thị BFS', 'Duyệt đồ thị DFS'])
    assert.equal(document.querySelectorAll('.is-filtered-out').length, 0)
    assert.equal(filtersHidden(document), true)

    goTo('searching')
    assert.equal(titles('#algorithm-panel').length, 7)

    goTo('structures')
    tab('algorithms').click()
    assert.deepEqual(titles('#algorithm-panel'), ['Bubble Sort'], 'vào lại thư viện thì lọc áp lại theo trạng thái nhớ')
  })
})

test('rời thư viện khi đang ở trạng thái rỗng: thông báo rỗng biến mất ở trang khác và hiện lại khi vào lại thư viện', () => {
  withFilter(({ document, goTo, tab, type }) => {
    const empty = document.querySelector('.library-empty')

    goTo('structures')
    type('zzzz')
    assert.equal(empty.hidden, false)

    goTo('sorting')
    assert.equal(empty.hidden, true, 'trang Sắp xếp không được còn thông báo rỗng')

    goTo('dashboard')
    assert.equal(empty.hidden, true)

    goTo('structures')
    assert.equal(empty.hidden, false, 'vào lại thư viện: bộ lọc nhớ vẫn không có kết quả')
    tab('algorithms').click()
    assert.equal(empty.hidden, false)
  })
})

test('lọc không phát viewchange', () => {
  withFilter(({ goTo, chip, type, log }) => {
    goTo('structures')
    log.length = 0
    chip('tree').click()
    type('cay')
    chip('all').click()

    assert.deepEqual(log, [])
  })
})

test('trợ năng: ô tìm là input type=search có tên, nằm trong role=search; chip là button có aria-pressed; nhóm chip có nhãn; bộ đếm role=status', () => {
  withFilter(({ document }) => {
    const input = document.querySelector('.library-search-input')

    assert.equal(input.type, 'search')
    assert.ok(input.getAttribute('aria-label').length > 0)
    assert.ok(input.closest('[role="search"]') !== null)
    assert.equal(document.querySelector('.library-count').getAttribute('role'), 'status')

    for (const group of document.querySelectorAll('.library-chips')) {
      assert.equal(group.getAttribute('role'), 'group')
      assert.ok(group.getAttribute('aria-label').length > 0)
    }

    for (const chip of document.querySelectorAll('.library-chip')) {
      assert.equal(chip.tagName, 'BUTTON')
      assert.equal(chip.type, 'button')
      assert.ok(['true', 'false'].includes(chip.getAttribute('aria-pressed')))
    }
  })
})
