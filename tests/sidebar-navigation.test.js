import test from 'node:test'
import assert from 'node:assert/strict'

import { SCREENS, isShown, withFullApp } from './helpers/app-dom.js'
import { memoryStorage } from './helpers/memory-storage.js'

// Mục con của sidebar (button.nav-subitem[data-structure-nav]) mở thẳng một cấu trúc. Hợp đồng quan trọng nhất:
// mỗi lần bấm phát ĐÚNG MỘT algovision:viewchange { page: 'structures', topic: 'structure:<tên>' } và ghi ĐÚNG MỘT lần openCount,
// không có sự kiện topic null xen giữa (nếu có thì mô phỏng/tiến độ sẽ chạy hai lần).
const STRUCTURES = ['array', 'stack', 'queue', 'linked-list', 'bst', 'hash-table', 'graph']
const KEY = 'algovision:progress'
const SORT_DELAY = 650

const goTo = (document, page) => document.querySelector(`.nav-item[data-page="${page}"]`).click()
function subitem(document, target) {
  const element = document.querySelector(`.nav-subitem[data-structure-nav="${target}"]`)

  assert.ok(element !== null, `thiếu mục con .nav-subitem[data-structure-nav="${target}"] trong sidebar`)
  return element
}
const cardOf = (document, target) => document.querySelector(`[data-structure-target="${target}"]`)
const counts = (storage) => {
  const text = storage.data.get(KEY)

  return text === undefined ? {} : Object.fromEntries(Object.entries(JSON.parse(text).topics).map(([id, entry]) => [id, entry.openCount]))
}
const otherThan = (target) => STRUCTURES[(STRUCTURES.indexOf(target) + 1) % STRUCTURES.length]

function recordViewChanges(document) {
  const log = []

  document.addEventListener('algovision:viewchange', (event) => log.push({ ...event.detail }))
  return log
}

function startSorting(document, scheduler) {
  goTo(document, 'sorting')
  document.querySelector('.algorithm-card[data-algorithm="bubble"]').click()
  document.querySelector('#run-sort').click()
  scheduler.advance(SORT_DELAY)
}

// Mỗi kịch bản đưa app về trạng thái xuất phát khác nhau trước khi bấm mục con.
const SCENARIOS = [
  { name: 'từ Tổng quan', prepare: () => {} },
  { name: 'từ thư viện Cấu trúc', prepare: (document) => goTo(document, 'structures') },
  { name: 'từ chi tiết một cấu trúc khác', prepare: (document, target) => { goTo(document, 'structures'); cardOf(document, otherThan(target)).click() } },
  { name: 'từ Tìm kiếm', prepare: (document) => { goTo(document, 'searching'); document.querySelector('[data-search-algorithm="linear"]').click() } },
  { name: 'từ Sắp xếp đang chạy mô phỏng', prepare: (document, target, scheduler) => startSorting(document, scheduler) },
]

for (const scenario of SCENARIOS) {
  for (const target of STRUCTURES) {
    test(`mục con "${target}" ${scenario.name}: đúng MỘT viewchange {structures, structure:${target}} và đúng MỘT lần ghi openCount`, async () => {
      const storage = memoryStorage()

      await withFullApp(({ document, scheduler }) => {
        scenario.prepare(document, target, scheduler)

        const log = recordViewChanges(document)
        const writesBefore = storage.setCalls
        const countBefore = counts(storage)[`structure:${target}`] ?? 0

        subitem(document, target).click()

        assert.deepEqual(log, [{ page: 'structures', topic: `structure:${target}` }], 'đúng một sự kiện, không có sự kiện null xen giữa')
        assert.equal(storage.setCalls - writesBefore, 1, 'đúng một lần ghi tiến độ')
        assert.equal(counts(storage)[`structure:${target}`], countBefore + 1, 'openCount của chủ đề tăng đúng 1')
        assert.equal(scheduler.pendingCount, 0, 'không còn timer mô phỏng chạy ngầm')

        for (const name of STRUCTURES) {
          assert.equal(isShown(document.querySelector(`#${name}-section`)), name === target, `#${name}-section ${name === target ? 'phải hiện' : 'phải ẩn'}`)
        }

        assert.equal(isShown(document.querySelector('#structure-library')), false, 'thư viện cấu trúc phải ẩn')

        for (const selector of ['#dashboard-section', '.algorithm-section', '#sorting-section', '#search-algorithm-library', '#search-section']) {
          assert.equal(isShown(document.querySelector(selector)), false, `${selector} phải ẩn sau khi mở cấu trúc`)
        }

        assert.deepEqual([...document.querySelectorAll('.nav-item.active')].map((item) => item.dataset.page), ['structures'], 'mục cha Tất cả cấu trúc active')
        assert.equal(document.querySelector('.nav-subitem.active')?.dataset.structureNav, target)
      }, { storage })
    })
  }
}

test('mục con mở từ Sắp xếp đang chạy: mô phỏng được tạm dừng (nút "Tiếp tục"), timer không chạy tiếp', async () => {
  await withFullApp(({ document, scheduler }) => {
    startSorting(document, scheduler)
    assert.equal(scheduler.pendingCount, 1, 'điều kiện đầu: mô phỏng đang chạy')

    subitem(document, 'bst').click()

    assert.equal(scheduler.pendingCount, 0)
    assert.equal(document.querySelector('#run-sort').textContent, 'Tiếp tục')
  })
})

test('bấm lại mục con của cấu trúc đang mở: 0 viewchange, 0 lần ghi, màn hình giữ nguyên', async () => {
  const storage = memoryStorage()

  await withFullApp(({ document }) => {
    subitem(document, 'hash-table').click()

    const log = recordViewChanges(document)
    const writes = storage.setCalls

    subitem(document, 'hash-table').click()
    subitem(document, 'hash-table').click()

    assert.deepEqual(log, [])
    assert.equal(storage.setCalls, writes)
    assert.deepEqual(counts(storage), { 'structure:hash-table': 1 })
    assert.equal(isShown(document.querySelector('#hash-table-section')), true)
    assert.equal(document.querySelectorAll('[aria-current]').length, 1)
  }, { storage })
})

test('Quay lại thư viện rồi bấm lại mục con vừa mở: mở lại, openCount thành 2, vẫn một sự kiện và một lần ghi', async () => {
  const storage = memoryStorage()

  await withFullApp(({ document }) => {
    subitem(document, 'bst').click()
    document.querySelector('#bst-section [data-back-to-structures]').click()

    const log = recordViewChanges(document)
    const writes = storage.setCalls

    subitem(document, 'bst').click()

    assert.deepEqual(log, [{ page: 'structures', topic: 'structure:bst' }])
    assert.equal(storage.setCalls - writes, 1)
    assert.deepEqual(counts(storage), { 'structure:bst': 2 })
  }, { storage })
})

test('đi lần lượt qua cả 7 mục con: mỗi cấu trúc ghi đúng một lần, tổng 7 lần ghi, 7 sự kiện có topic', async () => {
  const storage = memoryStorage()

  await withFullApp(({ document }) => {
    const log = recordViewChanges(document)

    for (const target of STRUCTURES) subitem(document, target).click()

    assert.deepEqual(log, STRUCTURES.map((target) => ({ page: 'structures', topic: `structure:${target}` })))
    assert.equal(storage.setCalls, 7)
    assert.deepEqual(counts(storage), Object.fromEntries(STRUCTURES.map((target) => [`structure:${target}`, 1])))
  }, { storage })
})

test('mở đủ 12 chủ đề thật (mục con thay cho thẻ): kho tiến độ biết đúng 12 chủ đề, mục con không thêm chủ đề nào', async () => {
  const storage = memoryStorage()

  await withFullApp(({ document, progress }) => {
    for (const name of ['bubble', 'selection', 'insertion']) {
      goTo(document, 'sorting')
      document.querySelector(`.algorithm-card[data-algorithm="${name}"]`).click()
    }

    for (const name of ['linear', 'binary']) {
      goTo(document, 'searching')
      document.querySelector(`[data-search-algorithm="${name}"]`).click()
    }

    for (const target of STRUCTURES) subitem(document, target).click()

    assert.equal(Object.keys(progress.read().topics).length, 12)
    assert.equal(document.querySelectorAll('[data-structure-target]').length, 7, 'thẻ là nguồn duy nhất của danh sách chủ đề cấu trúc')
  }, { storage })
})

test('Quay lại (data-back-to-structures) từ chi tiết: đúng một viewchange {structures, null}, 0 lần ghi, mục cha giữ aria-current, không mục con nào active', async () => {
  const storage = memoryStorage()

  await withFullApp(({ document }) => {
    subitem(document, 'graph').click()

    const log = recordViewChanges(document)
    const writes = storage.setCalls

    document.querySelector('#graph-section [data-back-to-structures]').click()

    assert.deepEqual(log, [{ page: 'structures', topic: null }])
    assert.equal(storage.setCalls, writes)
    assert.equal(document.querySelector('.nav-item[data-page="structures"]').getAttribute('aria-current'), 'page')
    assert.equal(document.querySelectorAll('[aria-current]').length, 1)
    assert.equal(document.querySelectorAll('.nav-subitem.active, .nav-subitem[aria-current]').length, 0)
  }, { storage })
})

test('bấm .nav-item (kể cả "Tất cả cấu trúc" khi đang ở chi tiết): đúng một viewchange {page, null}, không ghi tiến độ', async () => {
  const storage = memoryStorage()

  await withFullApp(({ document }) => {
    subitem(document, 'queue').click()
    storage.setCalls = 0

    const log = recordViewChanges(document)

    goTo(document, 'structures')
    assert.deepEqual(log.splice(0), [{ page: 'structures', topic: null }])
    assert.equal(isShown(document.querySelector('#structure-library')), true, 'về thư viện cấu trúc')

    for (const page of ['dashboard', 'sorting', 'searching']) {
      goTo(document, page)
      assert.deepEqual(log.splice(0), [{ page, topic: null }])
    }

    assert.equal(storage.setCalls, 0)
  }, { storage })
})

test('bấm thẻ cấu trúc ở thư viện: vẫn đúng một viewchange và một lần ghi như trước, và mục con tương ứng được đánh dấu', async () => {
  const storage = memoryStorage()

  await withFullApp(({ document }) => {
    goTo(document, 'structures')

    const log = recordViewChanges(document)
    const writes = storage.setCalls

    cardOf(document, 'stack').click()

    assert.deepEqual(log, [{ page: 'structures', topic: 'structure:stack' }])
    assert.equal(storage.setCalls - writes, 1)
    assert.equal(subitem(document, 'stack').getAttribute('aria-current'), 'page')
    assert.equal(subitem(document, 'stack').classList.contains('active'), true)
  }, { storage })
})

test('thẻ cấu trúc bấm khi KHÔNG ở trang Cấu trúc: không làm gì (giữ lớp bảo vệ currentPage)', async () => {
  await withFullApp(({ document }) => {
    const log = recordViewChanges(document)

    cardOf(document, 'array').click()

    assert.deepEqual(log, [])
    assert.equal(isShown(document.querySelector('#dashboard-section')), true)
  })
})

// aria-current / active: đúng MỘT phần tử mang aria-current="page" trên mọi màn hình.
function expectedCurrent(screenName) {
  if (screenName === 'dashboard') return '.nav-item[data-page="dashboard"]'
  if (screenName === 'progress') return '.nav-item[data-page="progress"]'
  if (screenName.startsWith('sorting')) return '.nav-item[data-page="sorting"]'
  if (screenName.startsWith('searching')) return '.nav-item[data-page="searching"]'
  if (screenName === 'structures-library') return '.nav-item[data-page="structures"]'
  if (screenName.startsWith('graph-')) return '.nav-subitem[data-structure-nav="graph"]'
  return `.nav-subitem[data-structure-nav="${screenName}"]`
}

for (const screen of SCREENS) {
  test(`màn hình "${screen.name}": đúng một phần tử có aria-current="page" và là ${expectedCurrent(screen.name)}`, async () => {
    await withFullApp(({ document }) => {
      screen.open(document)

      const current = [...document.querySelectorAll('[aria-current]')]

      assert.equal(current.length, 1, `phần tử aria-current: ${current.map((element) => element.className).join(', ')}`)
      assert.equal(current[0].getAttribute('aria-current'), 'page')
      assert.ok(current[0] === document.querySelector(expectedCurrent(screen.name)), 'aria-current đặt sai phần tử')
    })
  })
}

test('class active giữ trên .nav-item của trang hiện tại; ở chi tiết cấu trúc, mục cha vẫn active và mục con cũng active', async () => {
  await withFullApp(({ document }) => {
    const activePages = () => [...document.querySelectorAll('.nav-item.active')].map((item) => item.dataset.page)
    const activeSubitems = () => [...document.querySelectorAll('.nav-subitem.active')].map((item) => item.dataset.structureNav)

    assert.deepEqual(activePages(), ['dashboard'])
    assert.deepEqual(activeSubitems(), [])

    goTo(document, 'sorting')
    assert.deepEqual(activePages(), ['sorting'])

    goTo(document, 'structures')
    assert.deepEqual(activePages(), ['structures'])
    assert.deepEqual(activeSubitems(), [])

    cardOf(document, 'queue').click()
    assert.deepEqual(activePages(), ['structures'], 'mục cha vẫn active ở chi tiết cấu trúc')
    assert.deepEqual(activeSubitems(), ['queue'])
    assert.equal(document.querySelector('.nav-item[data-page="structures"]').hasAttribute('aria-current'), false, 'mục cha KHÔNG có aria-current khi mục con đang mở')

    subitem(document, 'graph').click()
    assert.deepEqual(activeSubitems(), ['graph'], 'đổi sang cấu trúc khác thì chỉ còn mục con mới')

    goTo(document, 'searching')
    assert.deepEqual(activePages(), ['searching'])
    assert.deepEqual(activeSubitems(), [])
  })
})

test('aria-current chỉ có ở sidebar, không rò sang thẻ, nút Quay lại hay nội dung', async () => {
  await withFullApp(({ document }) => {
    for (const screen of SCREENS) {
      screen.open(document)
      assert.equal(document.querySelectorAll('main [aria-current]').length, 0, `${screen.name}: không aria-current trong <main>`)
    }
  })
})

test('thẻ cấu trúc không có section tương ứng: KHÔNG sinh mục con (không có nút chết trong sidebar)', async () => {
  const { Window } = await import('happy-dom')
  const { initNavigation } = await import('../src/navigation.js')
  const { template } = await import('./helpers/app-dom.js')
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    document.querySelector('#structure-library').insertAdjacentHTML(
      'beforeend',
      '<button type="button" class="structure-card" data-structure-target="ghost"><span class="structure-card-icon">?</span><span class="structure-card-title">Ghost</span></button>',
    )
    initNavigation(document)

    assert.ok(document.querySelector('.nav-subitem[data-structure-nav="ghost"]') === null, 'không có section #ghost-section thì không có mục con')
    assert.deepEqual([...document.querySelectorAll('.nav-subitem')].map((item) => item.dataset.structureNav), STRUCTURES)
  } finally {
    window.happyDOM.close()
  }
})
