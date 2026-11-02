import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

import * as graphView from '../src/graph.js'
import { initNavigation } from '../src/navigation.js'
import { buildGraph } from '../src/structures/graph.js'
import { createGraphStepFactory } from '../src/algorithms/graphStep.js'
import { listHasEdgePseudocode } from '../src/algorithms/graphHasEdge.js'
import { matrixNeighborsPseudocode } from '../src/algorithms/graphNeighbors.js'
import { createFakeScheduler } from './helpers/fake-scheduler.js'

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')
const SPEED = 700

function setupGraph() {
  const window = new Window()
  const { document } = window
  const scheduler = createFakeScheduler()

  document.body.innerHTML = template
  initNavigation(document)
  const handle = graphView.initGraph(document, { scheduler })

  const $ = (selector) => document.querySelector(selector)
  const change = (selector, value) => {
    $(selector).value = String(value)
    $(selector).dispatchEvent(new window.Event('change', { bubbles: true }))
  }
  // Chọn đỉnh theo nhãn (giá trị option là id đỉnh, không phải nhãn).
  const optionFor = (selector, label) => [...$(selector).options].find((option) => option.textContent.trim() === label)
  const choose = (selector, label) => change(selector, label === null ? '' : optionFor(selector, label).value)

  const ui = {
    window,
    document,
    scheduler,
    handle,
    $,
    change,
    choose,
    open() {
      $('.nav-item[data-page="structures"]').click()
      $('[data-structure-target="graph"]').click()
    },
    select(source, target = null) {
      choose('#graph-source', source)
      if (target !== null) choose('#graph-target', target)
    },
    query(operation, source, target = null) {
      change('#graph-operation', operation)
      ui.select(source, target)
      $('#graph-apply').click()
    },
    nextUntilDone() {
      let guard = 0
      while (!$('#graph-next').disabled && guard++ < 200) $('#graph-next').click()
    },
    text: (selector) => $(selector).textContent.trim(),
    optionLabels: (selector) => [...$(selector).options].map((option) => option.textContent.trim()),
    vertexLabels: () => [...document.querySelectorAll('#graph-svg .graph-vertex')].map((node) => node.dataset.label),
    edgeCount: () => document.querySelectorAll('#graph-svg .graph-edge').length,
    vertexByLabel: (label) => document.querySelector(`#graph-svg .graph-vertex[data-label="${label}"]`),
    activeLine: () => $('#graph-pseudocode .pseudocode-line.is-active')?.textContent ?? null,
    cleanup() {
      $('#graph-pause')?.click()
      window.happyDOM.abort()
    },
  }

  return ui
}

function withGraph(run) {
  const ui = setupGraph()
  try {
    run(ui)
  } finally {
    ui.cleanup()
  }
}

const LOCKABLE = [
  '#graph-kind', '#graph-representation', '#graph-source', '#graph-target', '#graph-operation', '#graph-apply',
  '#graph-add-vertex', '#graph-remove-vertex', '#graph-add-edge', '#graph-remove-edge',
  '#graph-preset-sample', '#graph-preset-complete', '#graph-preset-tree', '#graph-clear',
]

test('Mở Graph bằng thẻ data-structure-target="graph" (navigation suy ra #graph-section) và quay lại', () => {
  withGraph((ui) => {
    ui.open()
    assert.equal(ui.$('#graph-section').hidden, false)
    assert.equal(ui.$('#structure-library').hidden, true)
    assert.equal(ui.$('#hash-table-section').hidden, true)

    ui.$('#graph-section [data-back-to-structures]').click()
    assert.equal(ui.$('#graph-section').hidden, true)
    assert.equal(ui.$('#structure-library').hidden, false)
  })
})

test('Khởi tạo với preset Mẫu vô hướng: V = 7, E = 5, aria-label có V và E, select đỉnh A–G', () => {
  withGraph((ui) => {
    assert.equal(ui.$('#graph-kind').value, 'undirected')
    assert.equal(ui.text('#graph-vertex-count'), '7')
    assert.equal(ui.text('#graph-edge-count'), '5')
    assert.deepEqual(ui.vertexLabels(), ['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    assert.equal(ui.edgeCount(), 5)
    assert.equal(ui.$('#graph-svg').getAttribute('aria-label'), 'Đồ thị vô hướng, V = 7, E = 5.')
    assert.deepEqual(ui.optionLabels('#graph-source'), ['— chưa chọn —', 'A', 'B', 'C', 'D', 'E', 'F', 'G'])
    assert.deepEqual(ui.optionLabels('#graph-target'), ['— chưa chọn —', 'A', 'B', 'C', 'D', 'E', 'F', 'G'])
    assert.equal(ui.$('#graph-svg .graph-edge[marker-end]'), null, 'vô hướng không có mũi tên')
  })
})

test('Thêm cạnh, xóa cạnh: cập nhật tức thì, báo #graph-status, select vẫn giữ lựa chọn', () => {
  withGraph((ui) => {
    ui.select('A', 'D')
    ui.$('#graph-add-edge').click()
    assert.equal(ui.text('#graph-edge-count'), '6')
    assert.equal(ui.text('#graph-status'), 'Đã thêm cạnh A – D. V = 7, E = 6.')
    assert.equal(ui.$('#graph-svg').getAttribute('aria-label'), 'Đồ thị vô hướng, V = 7, E = 6.')
    assert.equal(ui.$('#graph-source').selectedOptions[0].textContent.trim(), 'A')

    ui.select('B', 'A')
    ui.$('#graph-remove-edge').click()
    assert.equal(ui.text('#graph-edge-count'), '5')
    assert.equal(ui.text('#graph-status'), 'Đã xóa cạnh B – A. V = 7, E = 5.')
  })
})

test('Cạnh trùng, khuyên, đỉnh lạ, cạnh không tồn tại và thiếu lựa chọn: báo lỗi (role="alert"), đồ thị giữ nguyên', () => {
  withGraph((ui) => {
    const error = ui.$('#graph-input-error')
    assert.equal(error.getAttribute('role'), 'alert')

    ui.select('B', 'A')
    ui.$('#graph-add-edge').click()
    assert.equal(error.textContent, 'Cạnh B – A đã tồn tại.')
    assert.equal(error.hidden, false)

    ui.select('C', 'C')
    ui.$('#graph-add-edge').click()
    assert.equal(error.textContent, 'Không cho phép khuyên (cạnh nối một đỉnh với chính nó): đồ thị ở đây là đồ thị đơn.')

    ui.select('A', 'D')
    ui.$('#graph-remove-edge').click()
    assert.equal(error.textContent, 'Không có cạnh A – D để xóa.')

    // Đỉnh lạ: option trỏ tới id không có trong đồ thị.
    const ghost = ui.document.createElement('option')
    ghost.value = 'v99'
    ghost.textContent = 'Z'
    ui.$('#graph-target').appendChild(ghost)
    ui.choose('#graph-source', 'A')
    ui.change('#graph-target', 'v99')
    ui.$('#graph-add-edge').click()
    assert.equal(error.textContent, 'Đỉnh đã chọn không còn trong đồ thị.')

    ui.select('A', null)
    ui.choose('#graph-target', null)
    ui.$('#graph-add-edge').click()
    assert.equal(error.textContent, 'Hãy chọn cả đỉnh u và đỉnh v.')

    assert.equal(ui.text('#graph-edge-count'), '5')
  })
})

test('Có hướng: A→B và B→A là hai cạnh, vẽ mũi tên; aria-label ghi "có hướng"', () => {
  withGraph((ui) => {
    ui.change('#graph-kind', 'directed')
    ui.$('#graph-preset-sample').click()
    assert.equal(ui.text('#graph-edge-count'), '6')

    ui.select('B', 'A')
    ui.$('#graph-add-edge').click()
    assert.equal(ui.text('#graph-edge-count'), '7')
    assert.equal(ui.text('#graph-status'), 'Đã thêm cạnh B → A. V = 7, E = 7.')
    assert.equal(ui.$('#graph-svg').getAttribute('aria-label'), 'Đồ thị có hướng, V = 7, E = 7.')
    assert.equal(ui.document.querySelectorAll('#graph-svg .graph-edge[marker-end]').length, 7)
  })
})

test('Xóa đỉnh: xóa mọi cạnh liên quan; select làm mới, đỉnh đang chọn bị xóa về "chưa chọn"', () => {
  withGraph((ui) => {
    ui.select('C', 'D')
    ui.$('#graph-remove-vertex').click()

    assert.equal(ui.text('#graph-vertex-count'), '6')
    assert.equal(ui.text('#graph-edge-count'), '2')
    assert.equal(ui.text('#graph-status'), 'Đã xóa đỉnh C và 3 cạnh liên quan. V = 6, E = 2.')
    assert.deepEqual(ui.vertexLabels(), ['A', 'B', 'D', 'E', 'F', 'G'])
    assert.deepEqual(ui.optionLabels('#graph-source'), ['— chưa chọn —', 'A', 'B', 'D', 'E', 'F', 'G'])
    assert.equal(ui.$('#graph-source').value, '', 'đỉnh đã xóa về "chưa chọn"')
    assert.equal(ui.$('#graph-target').selectedOptions[0].textContent.trim(), 'D', 'đỉnh còn tồn tại giữ nguyên')

    // Thêm đỉnh mới: nhận lại slot và nhãn C, xuất hiện trong select đúng thứ tự.
    ui.$('#graph-add-vertex').click()
    assert.deepEqual(ui.optionLabels('#graph-source'), ['— chưa chọn —', 'A', 'B', 'C', 'D', 'E', 'F', 'G'])
    assert.equal(ui.text('#graph-status'), 'Đã thêm đỉnh C. V = 7, E = 2.')
  })
})

test('Giới hạn 8 đỉnh: đỉnh thứ 9 bị từ chối, báo qua vùng role="alert"', () => {
  withGraph((ui) => {
    ui.$('#graph-add-vertex').click()
    assert.equal(ui.text('#graph-vertex-count'), '8')

    ui.$('#graph-add-vertex').click()
    assert.equal(ui.text('#graph-vertex-count'), '8')
    assert.equal(ui.$('#graph-input-error').textContent, 'Đồ thị đã đủ 8 đỉnh (A–H): hãy xóa bớt trước khi thêm.')
  })
})

test('Đổi có hướng/vô hướng: tạo đồ thị rỗng, báo #graph-status, select chỉ còn "chưa chọn"', () => {
  withGraph((ui) => {
    ui.change('#graph-kind', 'directed')

    assert.equal(ui.text('#graph-vertex-count'), '0')
    assert.equal(ui.text('#graph-edge-count'), '0')
    assert.equal(ui.text('#graph-status'), 'Đã tạo đồ thị có hướng rỗng mới (đổi loại đồ thị không giữ đỉnh và cạnh cũ).')
    assert.deepEqual(ui.optionLabels('#graph-source'), ['— chưa chọn —'])
    assert.equal(ui.$('#graph-svg').getAttribute('aria-label'), 'Đồ thị có hướng, V = 0, E = 0.')
    assert.ok(ui.$('#graph-svg .graph-empty'))
  })
})

test('Preset: Mẫu, Đầy đủ K6, Cây, Xóa toàn bộ — số đỉnh/cạnh theo chế độ', () => {
  withGraph((ui) => {
    ui.$('#graph-preset-complete').click()
    assert.equal(ui.text('#graph-vertex-count'), '6')
    assert.equal(ui.text('#graph-edge-count'), '15')

    ui.$('#graph-preset-tree').click()
    assert.equal(ui.text('#graph-vertex-count'), '7')
    assert.equal(ui.text('#graph-edge-count'), '6')

    ui.$('#graph-clear').click()
    assert.equal(ui.text('#graph-vertex-count'), '0')

    ui.change('#graph-kind', 'directed')
    ui.$('#graph-preset-complete').click()
    assert.equal(ui.text('#graph-edge-count'), '15')
    assert.equal(ui.$('#graph-kind').value, 'directed')
  })
})

test('Truy vấn Kiểm tra kề (A, C) theo danh sách: từng bước, dòng mã giả được tô, kết quả', () => {
  withGraph((ui) => {
    ui.query('has-edge', 'A', 'C')
    assert.equal(ui.text('#graph-pseudocode-title'), 'Mã giả: Kiểm tra kề (danh sách kề)')
    assert.equal(ui.activeLine(), null)

    ui.$('#graph-next').click()
    assert.equal(ui.activeLine(), listHasEdgePseudocode[1])
    assert.equal(ui.text('#graph-reads'), '1')
    assert.ok(ui.vertexByLabel('B').classList.contains('is-current'))

    ui.$('#graph-next').click()
    assert.equal(ui.text('#graph-reads'), '2')
    assert.equal(ui.text('#graph-result'), 'Có cạnh A – C')
    assert.equal(ui.$('#graph-next').disabled, true)
  })
})

test('Truy vấn Đỉnh kề của C theo ma trận: 13 bước, reads 7, nhãn "Ô ma trận đã đọc"', () => {
  withGraph((ui) => {
    ui.change('#graph-representation', 'matrix')
    ui.query('neighbors', 'C')
    assert.equal(ui.text('#graph-reads-label'), 'Ô ma trận đã đọc')

    let steps = 1
    while (!ui.$('#graph-next').disabled) {
      ui.$('#graph-next').click()
      steps++
    }
    assert.equal(steps, 13)
    assert.equal(ui.text('#graph-reads'), '7')
    assert.equal(ui.text('#graph-result'), 'deg(C) = 3: A, B, D')
    assert.equal(ui.activeLine(), matrixNeighborsPseudocode[4])
  })
})

test('Truy vấn thiếu đỉnh: báo lỗi, không sinh bước', () => {
  withGraph((ui) => {
    ui.change('#graph-operation', 'has-edge')
    ui.choose('#graph-source', null)
    ui.$('#graph-apply').click()
    assert.equal(ui.$('#graph-input-error').textContent, 'Hãy chọn cả đỉnh u và đỉnh v.')
    assert.equal(ui.$('#graph-next').disabled, true)

    ui.change('#graph-operation', 'neighbors')
    ui.$('#graph-apply').click()
    assert.equal(ui.$('#graph-input-error').textContent, 'Hãy chọn đỉnh u.')
  })
})

test('Đang Run: khóa mọi nút thao tác, preset, ô chọn loại đồ thị, ô chọn biểu diễn, select đỉnh; xong thì mở lại', () => {
  withGraph((ui) => {
    ui.open()
    ui.query('has-edge', 'A', 'D')
    ui.$('#graph-run').click()

    LOCKABLE.forEach((selector) => assert.equal(ui.$(selector).disabled, true, `${selector} phải bị khóa`))

    ui.scheduler.advance(SPEED * 10)
    assert.equal(ui.text('#graph-result'), 'Không có cạnh A – D')
    LOCKABLE.forEach((selector) => assert.equal(ui.$(selector).disabled, false, `${selector} phải mở lại`))
  })
})

test('Reset chỉ tua minh họa, báo #graph-status; truy vấn tiếp theo chạy trên đồ thị đã chốt', () => {
  withGraph((ui) => {
    ui.select('A', 'D')
    ui.$('#graph-add-edge').click()
    ui.query('neighbors', 'A')
    ui.nextUntilDone()
    assert.equal(ui.text('#graph-result'), 'deg(A) = 3: B, C, D')

    ui.$('#graph-reset').click()
    assert.equal(ui.text('#graph-status'), 'Đã tua minh họa về bước đầu. Đồ thị đã chốt không đổi.')
    assert.equal(ui.text('#graph-result'), 'Chưa có')
    assert.equal(ui.text('#graph-edge-count'), '6')

    ui.query('has-edge', 'D', 'A')
    ui.nextUntilDone()
    assert.equal(ui.text('#graph-result'), 'Có cạnh D – A')
  })
})

test('Sửa đồ thị khi đang Pause: bỏ các bước cũ, truy vấn mới chạy trên đồ thị vừa sửa', () => {
  withGraph((ui) => {
    ui.open()
    ui.query('neighbors', 'C')
    ui.$('#graph-run').click()
    ui.scheduler.advance(SPEED)
    ui.$('#graph-pause').click()
    assert.equal(ui.$('#graph-run').textContent.trim(), 'Tiếp tục')

    ui.select('C', 'G')
    ui.$('#graph-add-edge').click()
    assert.equal(ui.$('#graph-next').disabled, true, 'các bước cũ bị bỏ')
    assert.equal(ui.$('#graph-previous').disabled, true)
    assert.equal(ui.text('#graph-result'), 'Chưa có')

    ui.query('neighbors', 'C')
    ui.nextUntilDone()
    assert.equal(ui.text('#graph-result'), 'deg(C) = 4: A, B, D, G')
  })
})

test('Đổi cách biểu diễn hoặc thao tác khi Pause: bỏ bước cũ, mã giả đổi theo', () => {
  withGraph((ui) => {
    ui.query('has-edge', 'A', 'C')
    ui.$('#graph-next').click()

    ui.change('#graph-representation', 'matrix')
    assert.equal(ui.$('#graph-previous').disabled, true)
    assert.equal(ui.text('#graph-pseudocode-title'), 'Mã giả: Kiểm tra kề (ma trận kề)')
    assert.equal(ui.text('#graph-reads-label'), 'Ô ma trận đã đọc')
  })
})

test('Rời màn hình Graph khi đang Run thì tự tạm dừng', () => {
  withGraph((ui) => {
    ui.open()
    ui.query('neighbors', 'C')
    ui.$('#graph-run').click()
    ui.scheduler.advance(SPEED)

    ui.$('.nav-item[data-page="sorting"]').click()
    const pendingAfterLeave = ui.scheduler.pendingCount
    ui.scheduler.advance(SPEED * 50)

    assert.equal(pendingAfterLeave, 0)
    assert.equal(ui.text('#graph-result'), 'Chưa có')
    assert.equal(ui.$('#graph-run').textContent.trim(), 'Tiếp tục')
  })
})

test('Thống kê, aria-label và bậc đọc từ step.graph của bước đang hiển thị, không từ đồ thị đã chốt', () => {
  withGraph((ui) => {
    const k6 = buildGraph(false, 6, [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 3], [2, 4], [2, 5], [3, 4], [3, 5], [4, 5]])
    const createStep = createGraphStepFactory('neighbors', { representation: 'list', sourceId: 'v1' })
    ui.handle.loadSteps([createStep({ graph: k6, message: 'Bước thử với K6.' })])

    assert.equal(ui.text('#graph-vertex-count'), '6')
    assert.equal(ui.text('#graph-edge-count'), '15')
    assert.equal(ui.text('#graph-degree'), 'deg(A) = 5')
    assert.equal(ui.$('#graph-svg').getAttribute('aria-label'), 'Đồ thị vô hướng, V = 6, E = 15.')
    assert.equal(ui.text('#graph-message'), 'Bước thử với K6.')
  })
})

test('Có hướng: ô bậc hiện bậc ra và bậc vào của u', () => {
  withGraph((ui) => {
    ui.change('#graph-kind', 'directed')
    ui.$('#graph-preset-sample').click()
    ui.select('C')
    assert.equal(ui.text('#graph-degree'), 'C: ra 2, vào 2')
  })
})

test('Renderer bỏ qua id lạ: currentVertexId, currentEdge, outputIds, sourceId trỏ tới đỉnh không có thì không tô, không lỗi', () => {
  withGraph((ui) => {
    const graph = buildGraph(false, 3, [[0, 1]])
    const createStep = createGraphStepFactory('neighbors', { representation: 'list', sourceId: 'v99' })
    ui.handle.loadSteps([createStep({
      graph,
      currentVertexId: 'v98',
      currentEdge: { from: 'v1', to: 'v97' },
      outputIds: ['v1', 'v96'],
      message: 'id lạ',
    })])

    assert.deepEqual(ui.vertexLabels(), ['A', 'B', 'C'])
    assert.equal(ui.document.querySelectorAll('#graph-svg .is-current').length, 0)
    assert.equal(ui.document.querySelectorAll('#graph-svg .graph-vertex.is-output').length, 1)
    assert.equal(ui.document.querySelectorAll('#graph-svg .graph-vertex-badge').length, 0)
    assert.equal(ui.text('#graph-degree'), '—')
  })
})

test('Nhãn u/v trên SVG lấy từ sourceId/targetId của bước: đổi select sau khi sinh bước thì SVG không đổi', () => {
  withGraph((ui) => {
    const badgeOf = (label) => ui.vertexByLabel(label).querySelector('.graph-vertex-badge')?.textContent ?? null
    ui.query('has-edge', 'A', 'C')
    ui.$('#graph-next').click()

    ui.select('B', 'D')
    assert.equal(badgeOf('A'), 'u')
    assert.equal(badgeOf('C'), 'v')
    assert.equal(badgeOf('B'), null)
    assert.equal(badgeOf('D'), null)
    assert.equal(ui.text('#graph-reads'), '1', 'bước đang hiển thị giữ nguyên')
  })
})

test('Đồ thị 1 đỉnh: v về "chưa chọn", Kiểm tra kề báo thiếu đỉnh v', () => {
  withGraph((ui) => {
    ui.$('#graph-clear').click()
    ui.$('#graph-add-vertex').click()

    assert.deepEqual(ui.optionLabels('#graph-target'), ['— chưa chọn —', 'A'])
    assert.equal(ui.$('#graph-target').value, '')

    ui.choose('#graph-source', 'A')
    ui.change('#graph-operation', 'has-edge')
    ui.$('#graph-apply').click()
    assert.equal(ui.$('#graph-input-error').textContent, 'Hãy chọn cả đỉnh u và đỉnh v.')

    // Preset có ≥ 3 đỉnh chọn sẵn u = A, v = C; về 1 đỉnh thì v (đã bị xóa) về "chưa chọn".
    ui.$('#graph-preset-tree').click()
    for (const label of ['G', 'F', 'E', 'D', 'C', 'B']) {
      ui.choose('#graph-source', label)
      ui.$('#graph-remove-vertex').click()
    }
    assert.deepEqual(ui.optionLabels('#graph-target'), ['— chưa chọn —', 'A'])
    assert.equal(ui.$('#graph-target').value, '')
  })
})

test('Trạng thái không chỉ bằng màu: đỉnh đang xét có ▶, đỉnh đã ghi nhận có ✓, u/v có nhãn chữ, cạnh đang xét có lớp riêng', () => {
  withGraph((ui) => {
    ui.query('neighbors', 'C')
    ui.$('#graph-next').click()
    ui.$('#graph-next').click()
    ui.$('#graph-next').click()

    const current = ui.vertexByLabel('B')
    assert.ok(current.classList.contains('is-current'))
    assert.equal(current.querySelector('.graph-vertex-marker').textContent, '▶')
    assert.equal(ui.vertexByLabel('A').querySelector('.graph-vertex-check').textContent, '✓')
    assert.equal(ui.vertexByLabel('C').querySelector('.graph-vertex-badge').textContent, 'u')
    assert.equal(ui.document.querySelectorAll('#graph-svg .graph-edge.is-current').length, 1)
    assert.ok(ui.$('#graph-message').getAttribute('aria-live'))
    assert.ok(ui.$('#graph-status').getAttribute('aria-live'))
  })
})

// ===== 7b: hai bảng danh sách kề và ma trận kề song song =====
const listEntries = (ui, label) => [...ui.document
  .querySelectorAll(`#graph-adjacency-list .graph-list-row[data-label="${label}"] .graph-list-entry`)]
  .map((entry) => entry.dataset.label)
const listEntry = (ui, owner, label) => ui.document
  .querySelector(`#graph-adjacency-list .graph-list-row[data-label="${owner}"] .graph-list-entry[data-label="${label}"]`)
const matrixCell = (ui, row, column) => ui.document
  .querySelector(`#graph-adjacency-matrix .graph-matrix-cell[data-row-label="${row}"][data-col-label="${column}"]`)
const matrixRow = (ui, row) => [...ui.document
  .querySelectorAll(`#graph-adjacency-matrix .graph-matrix-cell[data-row-label="${row}"]`)]
  .map((cell) => cell.dataset.value).join('')
const highlighted = (ui, panel, state) => ui.document.querySelectorAll(`${panel} .${state}`).length

test('Bảng danh sách kề và ma trận kề (vô hướng, Mẫu): đúng dữ liệu, có aria-label và chú thích', () => {
  withGraph((ui) => {
    assert.deepEqual(listEntries(ui, 'A'), ['B', 'C'])
    assert.deepEqual(listEntries(ui, 'C'), ['A', 'B', 'D'])
    assert.deepEqual(listEntries(ui, 'G'), [])
    const emptyRow = ui.document.querySelector('#graph-adjacency-list .graph-list-row[data-label="G"] .graph-list-empty')
    assert.equal(emptyRow.textContent, '∅')
    assert.equal(ui.$('#graph-adjacency-list').getAttribute('aria-label'), 'Danh sách kề (vô hướng): 7 danh sách, 10 phần tử.')

    assert.equal(matrixRow(ui, 'C'), '1101000')
    assert.equal(matrixRow(ui, 'G'), '0000000')
    assert.equal(ui.$('#graph-adjacency-matrix').getAttribute('aria-label'), 'Ma trận kề 7 × 7 (vô hướng): 10 ô bằng 1.')
    assert.equal(ui.text('#graph-adjacency-matrix caption'), 'Vô hướng: ma trận đối xứng, M[u][v] = M[v][u].')
    assert.equal(ui.document.querySelectorAll('#graph-adjacency-matrix thead th[scope="col"]').length, 7)
    assert.equal(ui.document.querySelectorAll('#graph-adjacency-matrix tbody th[scope="row"]').length, 7)
  })
})

test('Có hướng: danh sách là đỉnh kề ra; ma trận đúng chiều hàng → cột (M[u][v] = 1 khi có u → v)', () => {
  withGraph((ui) => {
    ui.change('#graph-kind', 'directed')
    ui.$('#graph-preset-sample').click()

    assert.deepEqual(listEntries(ui, 'C'), ['A', 'D'])
    assert.deepEqual(listEntries(ui, 'D'), [])
    assert.equal(matrixCell(ui, 'C', 'D').dataset.value, '1')
    assert.equal(matrixCell(ui, 'D', 'C').dataset.value, '0')
    assert.equal(matrixCell(ui, 'B', 'C').dataset.value, '1')
    assert.equal(matrixCell(ui, 'C', 'B').dataset.value, '0')
    assert.equal(matrixCell(ui, 'A', 'C').dataset.value, '1')
    assert.equal(matrixCell(ui, 'C', 'A').dataset.value, '1')
    assert.equal(
      ui.text('#graph-adjacency-matrix caption'),
      'Có hướng: hàng là đỉnh đi, cột là đỉnh đến (M[u][v] = 1 khi có u → v).',
    )
    assert.equal(ui.$('#graph-adjacency-matrix').getAttribute('aria-label'), 'Ma trận kề 7 × 7 (có hướng): 6 ô bằng 1.')
    assert.equal(ui.$('#graph-adjacency-list').getAttribute('aria-label'), 'Danh sách kề (có hướng): 7 danh sách, 6 phần tử.')
  })
})

test('Kiểm tra kề (A, D) theo danh sách: phần tử đang đọc có ▶ và aria-current, đã đọc có lớp riêng; ma trận không tô', () => {
  withGraph((ui) => {
    ui.query('has-edge', 'A', 'D')
    ui.$('#graph-next').click()
    ui.$('#graph-next').click()

    const current = listEntry(ui, 'A', 'C')
    assert.ok(current.classList.contains('is-current'))
    assert.equal(current.getAttribute('aria-current'), 'true')
    assert.equal(current.querySelector('.graph-entry-marker').textContent, '▶')
    assert.ok(listEntry(ui, 'A', 'B').classList.contains('is-read'))
    assert.equal(highlighted(ui, '#graph-adjacency-list', 'is-current'), 1)
    assert.equal(highlighted(ui, '#graph-adjacency-list', 'is-read'), 1)

    assert.ok(ui.$('#graph-list-panel').classList.contains('is-active'))
    assert.equal(ui.text('#graph-list-panel .graph-panel-badge'), 'đang dùng để truy vấn')
    assert.equal(ui.text('#graph-matrix-panel .graph-panel-badge'), '')
    assert.equal(highlighted(ui, '#graph-adjacency-matrix', 'is-current'), 0)
    assert.equal(highlighted(ui, '#graph-adjacency-matrix', 'is-read'), 0)

    // Bước kết luận: không còn phần tử đang đọc, cả hai phần tử đều đã đọc.
    ui.$('#graph-next').click()
    assert.equal(highlighted(ui, '#graph-adjacency-list', 'is-current'), 0)
    assert.equal(highlighted(ui, '#graph-adjacency-list', 'is-read'), 2)
  })
})

test('Đỉnh kề của C theo ma trận: ô đang đọc có ▶ và aria-current, các ô trước trên hàng C đã đọc; danh sách không tô', () => {
  withGraph((ui) => {
    ui.change('#graph-representation', 'matrix')
    ui.query('neighbors', 'C')
    // Bước 7 (reads 4): đọc M[C][D], sau A, ghi nhận A, B, ghi nhận B, C.
    for (let index = 0; index < 7; index++) ui.$('#graph-next').click()

    assert.equal(ui.text('#graph-reads'), '4')
    const current = matrixCell(ui, 'C', 'D')
    assert.ok(current.classList.contains('is-current'))
    assert.equal(current.getAttribute('aria-current'), 'true')
    assert.equal(current.querySelector('.graph-entry-marker').textContent, '▶')
    assert.deepEqual(
      [...ui.document.querySelectorAll('#graph-adjacency-matrix .graph-matrix-cell.is-read')].map((cell) => cell.dataset.colLabel),
      ['A', 'B', 'C'],
    )
    assert.ok(ui.$('#graph-matrix-panel').classList.contains('is-active'))
    assert.equal(highlighted(ui, '#graph-adjacency-list', 'is-current'), 0)
    assert.equal(highlighted(ui, '#graph-adjacency-list', 'is-read'), 0)
  })
})

test('Kiểm tra kề (A, C) theo ma trận: chỉ tô đúng một ô M[A][C], không ô nào "đã đọc"', () => {
  withGraph((ui) => {
    ui.change('#graph-representation', 'matrix')
    ui.query('has-edge', 'A', 'C')
    ui.$('#graph-next').click()

    assert.ok(matrixCell(ui, 'A', 'C').classList.contains('is-current'))
    assert.equal(highlighted(ui, '#graph-adjacency-matrix', 'is-current'), 1)
    assert.equal(highlighted(ui, '#graph-adjacency-matrix', 'is-read'), 0)
  })
})

test('Sửa đồ thị: hai bảng cập nhật ngay (thêm A–D, xóa đỉnh C)', () => {
  withGraph((ui) => {
    ui.select('A', 'D')
    ui.$('#graph-add-edge').click()
    assert.deepEqual(listEntries(ui, 'A'), ['B', 'C', 'D'])
    assert.equal(matrixCell(ui, 'A', 'D').dataset.value, '1')
    assert.equal(matrixCell(ui, 'D', 'A').dataset.value, '1')

    ui.select('C')
    ui.$('#graph-remove-vertex').click()
    assert.equal(ui.document.querySelectorAll('#graph-adjacency-list .graph-list-row').length, 6)
    assert.equal(ui.document.querySelectorAll('#graph-adjacency-matrix tbody tr').length, 6)
    // Cột theo slot: A, B, D, E, F, G.
    assert.equal(matrixRow(ui, 'A'), '011000')
    assert.equal(ui.$('#graph-adjacency-matrix').getAttribute('aria-label'), 'Ma trận kề 6 × 6 (vô hướng): 6 ô bằng 1.')
  })
})

test('Hai bảng bỏ qua id lạ: matrixCell / currentEdge / sourceId trỏ tới đỉnh không có thì không tô', () => {
  withGraph((ui) => {
    const graph = buildGraph(false, 3, [[0, 1]])
    const matrixStep = createGraphStepFactory('neighbors', { representation: 'matrix', sourceId: 'v99' })
    ui.handle.loadSteps([matrixStep({ graph, matrixCell: { rowId: 'v99', colId: 'v1' }, reads: 2, message: 'id lạ' })])
    assert.equal(highlighted(ui, '#graph-adjacency-matrix', 'is-current'), 0)
    assert.equal(highlighted(ui, '#graph-adjacency-matrix', 'is-read'), 0)

    const listStep = createGraphStepFactory('has-edge', { representation: 'list', sourceId: 'v99', targetId: 'v1' })
    ui.handle.loadSteps([listStep({ graph, currentEdge: { from: 'v99', to: 'v1' }, reads: 1, message: 'id lạ' })])
    assert.equal(highlighted(ui, '#graph-adjacency-list', 'is-current'), 0)
    assert.equal(highlighted(ui, '#graph-adjacency-list', 'is-read'), 0)
  })
})

test('Đồ thị rỗng: danh sách báo rỗng, ma trận 0 × 0', () => {
  withGraph((ui) => {
    ui.$('#graph-clear').click()
    assert.equal(ui.text('#graph-adjacency-list'), 'Đồ thị rỗng.')
    assert.equal(ui.$('#graph-adjacency-matrix').getAttribute('aria-label'), 'Ma trận kề 0 × 0 (vô hướng): 0 ô bằng 1.')
    assert.equal(ui.document.querySelectorAll('#graph-adjacency-matrix .graph-matrix-cell').length, 0)
  })
})

// ===== Learning Panel =====
const sizes = (ui) => [ui.text('#graph-list-size'), ui.text('#graph-matrix-size')]

test('Learning Panel vô hướng: kích thước danh sách / ma trận đọc từ đồ thị đang hiển thị — Mẫu 17/49, Cây 19/49, K6 36/36', () => {
  withGraph((ui) => {
    assert.deepEqual(sizes(ui), ['17', '49'])
    assert.equal(
      ui.text('#graph-complexity-live'),
      'Đồ thị đang hiển thị (vô hướng): V = 7, E = 5. Danh sách kề lưu V + 2E = 17 ô nhớ; ma trận kề lưu V² = 49 ô.',
    )
    assert.equal(ui.text('#graph-density'), 'Danh sách kề tiết kiệm hơn: 17 so với 49 ô (E = 5, tối đa 21 cạnh).')

    ui.$('#graph-preset-tree').click()
    assert.deepEqual(sizes(ui), ['19', '49'])

    ui.$('#graph-preset-complete').click()
    assert.deepEqual(sizes(ui), ['36', '36'])
    assert.equal(ui.text('#graph-density'), 'Hai cách tốn bằng nhau: 36 so với 36 ô (E = 15, tối đa 15 cạnh: đồ thị đầy đủ).')
  })
})

test('Learning Panel có hướng: danh sách V + E — Mẫu 13, Cây 13, K6 21 (ma trận 49, 49, 36)', () => {
  withGraph((ui) => {
    ui.change('#graph-kind', 'directed')
    ui.$('#graph-preset-sample').click()
    assert.deepEqual(sizes(ui), ['13', '49'])
    assert.equal(
      ui.text('#graph-complexity-live'),
      'Đồ thị đang hiển thị (có hướng): V = 7, E = 6. Danh sách kề lưu V + E = 13 ô nhớ; ma trận kề lưu V² = 49 ô.',
    )
    assert.equal(ui.text('#graph-density'), 'Danh sách kề tiết kiệm hơn: 13 so với 49 ô (E = 6, tối đa 42 cạnh).')

    ui.$('#graph-preset-tree').click()
    assert.deepEqual(sizes(ui), ['13', '49'])

    ui.$('#graph-preset-complete').click()
    assert.deepEqual(sizes(ui), ['21', '36'])
  })
})

test('Learning Panel đọc step.graph: nạp bước dùng K6 khi đồ thị đã chốt là Mẫu thì panel hiện số của K6', () => {
  withGraph((ui) => {
    const k6 = buildGraph(false, 6, [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 3], [2, 4], [2, 5], [3, 4], [3, 5], [4, 5]])
    const createStep = createGraphStepFactory('neighbors', { representation: 'matrix', sourceId: 'v1' })
    ui.handle.loadSteps([createStep({ graph: k6, message: 'K6' })])

    assert.deepEqual(sizes(ui), ['36', '36'])
    assert.ok(ui.text('#graph-complexity-live').startsWith('Đồ thị đang hiển thị (vô hướng): V = 6, E = 15.'))
  })
})

test('Learning Panel đồ thị rỗng: 0 ô, không chia cho 0', () => {
  withGraph((ui) => {
    ui.$('#graph-clear').click()
    assert.deepEqual(sizes(ui), ['0', '0'])
    assert.equal(ui.text('#graph-density'), 'Đồ thị rỗng: cả hai cách đều chưa tốn ô nào.')
  })
})

test('Bảng Big-O: danh sách kề so với ma trận kề; "Duyệt mọi cạnh" là lý thuyết; dòng của thao tác đang chọn được đánh dấu bằng chữ', () => {
  withGraph((ui) => {
    const row = (name) => ui.$(`#graph-complexity-table tr[data-row="${name}"]`)
    const cells = (name) => [...row(name).querySelectorAll('td')].map((cell) => cell.textContent.trim())

    assert.deepEqual(cells('space'), ['Θ(V + E)', 'Θ(V²)'])
    assert.deepEqual(cells('has-edge'), ['O(deg(u)), tốt nhất O(1)', 'O(1)'])
    assert.deepEqual(cells('neighbors'), ['Θ(deg(u))', 'Θ(V)'])
    assert.deepEqual(cells('traverse'), ['Θ(V + E)', 'Θ(V²)'])
    assert.equal(row('traverse').querySelector('th').textContent.trim(), 'Duyệt mọi cạnh (lý thuyết, BFS/DFS sẽ đo)')

    assert.ok(row('has-edge').classList.contains('is-active'))
    assert.equal(row('has-edge').querySelector('.graph-row-badge').textContent, 'đang chọn')
    ui.change('#graph-operation', 'neighbors')
    assert.ok(row('neighbors').classList.contains('is-active'))
    assert.equal(row('has-edge').querySelector('.graph-row-badge').textContent, '')

    assert.match(ui.text('#graph-edit-cost'), /không tính chi phí sao chép snapshot/)
  })
})

test('Mã giả và lý thuyết đổi theo thao tác và cách biểu diễn; mã giả lấy từ chính file generator', () => {
  withGraph((ui) => {
    const rendered = () => [...ui.document.querySelectorAll('#graph-pseudocode .pseudocode-line')].map((line) => line.textContent)
    const combos = [
      ['has-edge', 'list', listHasEdgePseudocode],
      ['has-edge', 'matrix', graphView.graphOperations['has-edge'].pseudocode.matrix],
      ['neighbors', 'list', graphView.graphOperations.neighbors.pseudocode.list],
      ['neighbors', 'matrix', matrixNeighborsPseudocode],
    ]
    const descriptions = new Set()

    for (const [operation, representation, pseudocode] of combos) {
      ui.change('#graph-operation', operation)
      ui.change('#graph-representation', representation)
      assert.deepEqual(rendered(), pseudocode)
      descriptions.add(ui.text('#graph-learning-description'))
      assert.notEqual(ui.text('#graph-learning-advantages'), '')
      assert.notEqual(ui.text('#graph-learning-disadvantages'), '')
    }
    assert.equal(descriptions.size, 4, 'mỗi cặp thao tác × biểu diễn có lý thuyết riêng')
  })
})
