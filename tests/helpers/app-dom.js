// Dựng toàn bộ ứng dụng trong happy-dom giống src/main.js: nạp template thật rồi gọi mọi init*.
// Dùng cho test cần nhìn cả trang (landmark, heading, vùng cuộn). Test của từng module vẫn dùng helper riêng.
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { createFakeScheduler } from './fake-scheduler.js'

export const template = await readFile(new URL('../../public/templates/app.html', import.meta.url), 'utf8')

export async function withFullApp(run) {
  const window = new Window()
  const { document } = window
  const scheduler = createFakeScheduler()

  document.body.innerHTML = template

  const previousDocument = globalThis.document
  const previousWindow = globalThis.window

  globalThis.document = document
  globalThis.window = window

  try {
    const [navigation, sorting, searching, array, stack, queue, linkedList, bst, hashTable, graph] = await Promise.all([
      import('../../src/navigation.js'),
      import('../../src/sorting.js'),
      import('../../src/searching.js'),
      import('../../src/array.js'),
      import('../../src/stack.js'),
      import('../../src/queue.js'),
      import('../../src/linked-list.js'),
      import('../../src/bst.js'),
      import('../../src/hash-table.js'),
      import('../../src/graph.js'),
    ])

    navigation.initNavigation(document)
    sorting.initSorting({ scheduler })
    searching.initSearching({ scheduler })
    array.initArray()
    stack.initStack(document)
    queue.initQueue(document)
    linkedList.initLinkedList(document)
    bst.initBst(document, { scheduler })
    hashTable.initHashTable(document, { scheduler })
    graph.initGraph(document, { scheduler })

    await run({ document, window, scheduler })
  } finally {
    // Dừng mọi timer còn sống để test lỗi không làm treo tiến trình.
    for (const id of ['#reset-sort', '#search-pause', '#graph-pause']) {
      document.querySelector(id)?.click()
    }

    window.happyDOM.close()

    if (previousDocument === undefined) {
      delete globalThis.document
    } else {
      globalThis.document = previousDocument
    }

    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
}

function clickNav(document, page) {
  document.querySelector(`.nav-item[data-page="${page}"]`).click()
}

function openStructure(document, name) {
  clickNav(document, 'structures')
  document.querySelector(`[data-structure-target="${name}"]`).click()
}

function openGraphTraversal(document, operation) {
  openStructure(document, 'graph')

  const select = document.querySelector('#graph-operation')

  select.value = operation
  select.dispatchEvent(new document.defaultView.Event('change', { bubbles: true }))
  document.querySelector('#graph-apply').click()
}

// Mọi màn hình người dùng có thể thấy. Mỗi màn hình mở bằng thao tác thật của người dùng (click), không chỉnh hidden tay.
export const SCREENS = [
  { name: 'dashboard', open: (document) => clickNav(document, 'dashboard') },
  { name: 'sorting-library', open: (document) => clickNav(document, 'sorting') },
  {
    name: 'sorting-detail',
    open: (document) => {
      clickNav(document, 'sorting')
      document.querySelector('.algorithm-card[data-algorithm="bubble"]').click()
    },
  },
  { name: 'searching-library', open: (document) => clickNav(document, 'searching') },
  {
    name: 'searching-detail',
    open: (document) => {
      clickNav(document, 'searching')
      document.querySelector('[data-search-algorithm="linear"]').click()
    },
  },
  { name: 'structures-library', open: (document) => clickNav(document, 'structures') },
  ...['array', 'stack', 'queue', 'linked-list', 'bst', 'hash-table', 'graph'].map((name) => ({
    name,
    open: (document) => openStructure(document, name),
  })),
  { name: 'graph-bfs', open: (document) => openGraphTraversal(document, 'bfs') },
  { name: 'graph-dfs', open: (document) => openGraphTraversal(document, 'dfs') },
]

// Phần tử đang hiển thị: không nằm trong tổ tiên có thuộc tính hidden. happy-dom không nạp style.css nên đây là
// cách duy nhất ẩn trong template (navigation.js và các module chỉ bật tắt hidden).
export function isShown(element) {
  return element.closest('[hidden]') === null
}
