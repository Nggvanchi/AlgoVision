// Mô tả 6 màn hình có controller (Sắp xếp, Tìm kiếm, BST, Bảng băm, Đồ thị BFS và DFS) cho các test chạy trong ứng dụng đầy đủ.
// start(document) mở màn hình và chuẩn bị để bấm Bước tiếp theo được (Tìm kiếm sinh bước ở lần bấm đầu tiên).
import { SCREENS } from './app-dom.js'

const open = (name) => SCREENS.find((screen) => screen.name === name).open

function setValue(document, selector, value) {
  document.querySelector(selector).value = value
}

export const VISUALIZER_MODULES = [
  {
    name: 'Sắp xếp',
    section: '#sorting-section',
    next: '#step-sort',
    previous: '#previous-step',
    run: '#run-sort',
    pause: '#pause-sort',
    speedName: 'sort-speed',
    start: (document) => {
      open('sorting-detail')(document)
      document.querySelector('#start-button').click()
    },
  },
  {
    name: 'Tìm kiếm',
    section: '#search-section',
    next: '#search-next',
    previous: '#search-previous',
    run: '#search-run',
    pause: '#search-pause',
    speedName: 'search-speed',
    start: (document) => {
      open('searching-detail')(document)
      setValue(document, '#search-target', '7')
    },
  },
  {
    name: 'BST',
    section: '#bst-section',
    next: '#bst-next',
    previous: '#bst-previous',
    run: '#bst-run',
    pause: '#bst-pause',
    speedName: 'bst-speed',
    start: (document) => {
      open('bst')(document)
      setValue(document, '#bst-operation', 'insert')
      setValue(document, '#bst-value', '35')
      document.querySelector('#bst-apply').click()
    },
  },
  {
    name: 'Bảng băm',
    section: '#hash-table-section',
    next: '#hash-table-next',
    previous: '#hash-table-previous',
    run: '#hash-table-run',
    pause: '#hash-table-pause',
    speedName: 'hash-table-speed',
    start: (document) => {
      open('hash-table')(document)
      setValue(document, '#hash-table-operation', 'insert')
      // Bảng mặc định m = 7: 58, 65, 72 cùng ô 2. Chèn hai khóa đầu và chạy hết, rồi minh họa khóa thứ ba
      // (phải duyệt chuỗi đã có hai khóa) để có đủ bước.
      for (const key of ['58', '65', '72']) {
        setValue(document, '#hash-table-key', key)
        document.querySelector('#hash-table-apply').click()
        if (key !== '72') {
          while (!document.querySelector('#hash-table-next').disabled) document.querySelector('#hash-table-next').click()
        }
      }
    },
  },
  {
    name: 'Đồ thị BFS',
    section: '#graph-section',
    next: '#graph-next',
    previous: '#graph-previous',
    run: '#graph-run',
    pause: '#graph-pause',
    speedName: 'graph-speed',
    start: (document) => open('graph-bfs')(document),
  },
  {
    name: 'Đồ thị DFS',
    section: '#graph-section',
    next: '#graph-next',
    previous: '#graph-previous',
    run: '#graph-run',
    pause: '#graph-pause',
    speedName: 'graph-speed',
    start: (document) => open('graph-dfs')(document),
  },
]
