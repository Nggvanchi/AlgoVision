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
