import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { withFullApp } from './helpers/app-dom.js'
import { findScrollingSelectors } from './helpers/css-scroll-selectors.js'

const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8')

// Vùng cuộn nhận focus bàn phím (Chrome tự cho focus khi nội dung tràn), nên mỗi vùng phải có vai trò và tên để trình đọc
// màn hình nói được "đang ở đâu". Test tìm vùng cuộn từ chính style.css (mọi luật overflow auto/scroll) để một vùng cuộn
// mới thêm mà quên gắn nhãn sẽ làm test đỏ; phần khẳng định nằm ở DOM.
function collectScrollRegions(document) {
  const regions = new Set()

  for (const { selector, rule } of findScrollingSelectors(css)) {
    let matches

    try {
      matches = document.querySelectorAll(selector)
    } catch (error) {
      throw new Error(`Selector cuộn "${selector}" không chạy được trong happy-dom (luật: ${rule}): ${error.message}`)
    }

    if (matches.length === 0) {
      throw new Error(
        `Selector cuộn "${selector}" không khớp phần tử nào trong template (luật: ${rule}). ` +
        'Luật CSS đã chết thì xóa; phần tử do JS tạo thì phải gắn nhãn ở nơi tạo và test này cần mở rộng.',
      )
    }

    matches.forEach((element) => regions.add(element))
  }

  return [...regions]
}

function accessibleName(document, element) {
  const labelledby = element.getAttribute('aria-labelledby')

  if (labelledby) {
    return labelledby
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent.replace(/\s+/g, ' ').trim() ?? '')
      .join(' ')
      .trim()
  }

  return (element.getAttribute('aria-label') ?? '').trim()
}

const describe = (element) => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className ? `.${String(element.className).trim().replace(/\s+/g, '.')}` : ''}`

// Bảng đặc tả: vùng cuộn → nhãn tĩnh (label) hoặc phần tử tiêu đề đặt tên (labelledby). Dùng chính khung bọc của phần tử con.
const SPEC = [
  { find: (d) => d.querySelector('#learning-pseudocode').closest('pre'), labelledby: 'learning-pseudocode-title' },
  { find: (d) => d.querySelector('#search-learning-pseudocode').closest('pre'), labelledby: 'search-learning-pseudocode-title' },
  { find: (d) => d.querySelector('#bst-pseudocode').closest('pre'), labelledby: 'bst-pseudocode-title' },
  { find: (d) => d.querySelector('#hash-table-pseudocode').closest('pre'), labelledby: 'hash-table-pseudocode-title' },
  { find: (d) => d.querySelector('#graph-pseudocode').closest('pre'), labelledby: 'graph-pseudocode-title' },
  { find: (d) => d.querySelector('#comparison-array'), label: 'Mảng đã sắp xếp dùng để so sánh hai thuật toán' },
  { find: (d) => d.querySelector('#array-visualizer'), label: 'Các phần tử trong mảng' },
  { find: (d) => d.querySelector('#stack-visualizer'), label: 'Các phần tử trong Stack' },
  { find: (d) => d.querySelector('#queue-visualizer'), label: 'Các phần tử trong Queue' },
  { find: (d) => d.querySelector('#linked-list-visualizer'), label: 'Các nút trong danh sách liên kết đơn' },
  { find: (d) => d.querySelector('#bst-tree-frame'), label: 'Hình vẽ cây BST' },
  { find: (d) => d.querySelector('#hash-table-frame'), label: 'Hình vẽ bảng băm' },
  { find: (d) => d.querySelector('#graph-frame'), label: 'Hình vẽ đồ thị' },
  { find: (d) => d.querySelector('#graph-bfs-queue-frame'), label: 'Hàng đợi Q của BFS' },
  { find: (d) => d.querySelector('#graph-dfs-stack-frame'), label: 'Ngăn xếp gọi của DFS' },
  { find: (d) => d.querySelector('#graph-bfs-table').closest('.graph-panel-frame'), label: 'Bảng khoảng cách và đỉnh cha' },
  { find: (d) => d.querySelector('#graph-dfs-table').closest('.graph-panel-frame'), label: 'Bảng mốc vào, mốc ra và đỉnh cha' },
  { find: (d) => d.querySelector('#graph-adjacency-list').closest('.graph-panel-frame'), label: 'Danh sách kề' },
  { find: (d) => d.querySelector('#graph-adjacency-matrix').closest('.graph-panel-frame'), label: 'Ma trận kề' },
  { find: (d) => d.querySelector('#graph-complexity-table').closest('.graph-panel-frame'), label: 'Bảng chi phí thời gian và bộ nhớ theo cách biểu diễn' },
]

test('mọi luật CSS cuộn parse được, chạy được và khớp phần tử trong template (lỗi thì báo rõ, không bỏ qua)', async () => {
  await withFullApp(({ document }) => {
    assert.doesNotThrow(() => collectScrollRegions(document))
  })
})

test('template có đúng 20 vùng cuộn, khớp bảng đặc tả (không thừa, không thiếu)', async () => {
  await withFullApp(({ document }) => {
    const found = collectScrollRegions(document)
    const specified = SPEC.map((entry) => entry.find(document))

    assert.equal(found.length, SPEC.length, `vùng cuộn tìm thấy từ CSS: ${found.map(describe).join(', ')}`)
    assert.deepEqual(
      found.filter((element) => !specified.includes(element)).map(describe),
      [],
      'vùng cuộn có trong CSS nhưng chưa có trong bảng đặc tả của test',
    )
    assert.deepEqual(
      specified.filter((element) => !found.includes(element)).map(describe),
      [],
      'phần tử trong bảng đặc tả nhưng không có luật cuộn nào trong CSS',
    )
  })
})

test('mọi vùng cuộn có role="group" và tên truy cập khác rỗng, kể cả sau khi khởi tạo mọi module', async () => {
  await withFullApp(({ document }) => {
    const problems = []

    for (const element of collectScrollRegions(document)) {
      if (element.getAttribute('role') !== 'group') {
        problems.push(`${describe(element)}: role="${element.getAttribute('role')}", cần "group"`)
      }

      if (accessibleName(document, element) === '') {
        problems.push(`${describe(element)}: không có tên truy cập (aria-label hoặc aria-labelledby trỏ tới phần tử có chữ)`)
      }
    }

    assert.deepEqual(problems, [])
  })
})

test('nhãn của từng vùng cuộn đúng theo đặc tả (aria-label tĩnh hoặc aria-labelledby trỏ đúng tiêu đề)', async () => {
  await withFullApp(({ document }) => {
    for (const entry of SPEC) {
      const element = entry.find(document)

      if (entry.label !== undefined) {
        assert.equal(element.getAttribute('aria-label'), entry.label, describe(element))
        assert.equal(element.getAttribute('aria-labelledby'), null, `${describe(element)}: không dùng cả hai kiểu nhãn`)
      } else {
        assert.equal(element.getAttribute('aria-labelledby'), entry.labelledby, describe(element))
        assert.ok(document.getElementById(entry.labelledby) !== null, `thiếu phần tử #${entry.labelledby} để đặt tên cho ${describe(element)}`)
      }
    }
  })
})
