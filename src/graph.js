import { createSimulationController } from './simulation-controller.js'
import { renderPseudocode, highlightPseudocodeLine } from './pseudocode-view.js'
import { layoutGraph, GRAPH_LAYOUT } from './graph-layout.js'
import {
  addEdge,
  addVertex,
  buildGraph,
  countEdges,
  countVertices,
  createGraph,
  hasEdge,
  hasVertex,
  inDegree,
  listVertices,
  outDegree,
  removeEdge,
  removeVertex,
} from './structures/graph.js'
import { createGraphStepFactory, edgeText, labelOf, representationNames } from './algorithms/graphStep.js'
import { generateGraphHasEdgeSteps, listHasEdgePseudocode, matrixHasEdgePseudocode } from './algorithms/graphHasEdge.js'
import {
  generateGraphNeighborsSteps,
  listNeighborsPseudocode,
  matrixNeighborsPseudocode,
} from './algorithms/graphNeighbors.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

// Giới hạn của giao diện (tầng structures không giới hạn số đỉnh). 8 đỉnh = 8 vị trí của layout xếp tròn.
const MAX_VERTICES = GRAPH_LAYOUT.slotCount
const DEFAULT_SPEED = 700
const IDLE_MESSAGE = 'Chọn đỉnh u, v để sửa đồ thị, hoặc chọn truy vấn rồi bấm Thực hiện.'
const RESET_NOTE = 'Đã tua minh họa về bước đầu. Đồ thị đã chốt không đổi.'

// Preset theo slot: [số đỉnh, cặp [u, v]]. Có hướng thì cặp u → v; preset Mẫu có hướng thêm C → A (chu trình có hướng).
const SAMPLE_PAIRS = [[0, 1], [0, 2], [1, 2], [2, 3], [4, 5]]
const COMPLETE_PAIRS = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5],
  [2, 3], [2, 4], [2, 5], [3, 4], [3, 5], [4, 5]]
const TREE_PAIRS = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]]

export const graphPresets = {
  sample: {
    name: 'Đồ thị mẫu',
    build: (directed) => buildGraph(directed, 7, directed ? [...SAMPLE_PAIRS, [2, 0]] : SAMPLE_PAIRS),
    note: (directed) => (directed
      ? 'có chu trình có hướng A → B → C → A, thành phần {E, F} và đỉnh cô lập G.'
      : 'có chu trình A – B – C, thành phần {E, F} và đỉnh cô lập G.'),
  },
  complete: {
    name: 'Đầy đủ K6',
    build: (directed) => buildGraph(directed, 6, COMPLETE_PAIRS),
    note: (directed) => (directed ? 'mọi cặp u → v với u đứng trước v.' : 'mọi cặp đỉnh đều kề nhau (đồ thị dày).'),
  },
  tree: {
    name: 'Cây 7 đỉnh',
    build: (directed) => buildGraph(directed, 7, TREE_PAIRS),
    note: () => 'E = V − 1, không có chu trình (đồ thị thưa).',
  },
}

export const graphOperations = {
  'has-edge': {
    name: 'Kiểm tra kề',
    needsTarget: true,
    pseudocode: { list: listHasEdgePseudocode, matrix: matrixHasEdgePseudocode },
    generate: (graph, sourceId, targetId, representation) => (
      generateGraphHasEdgeSteps(graph, sourceId, targetId, representation)
    ),
  },
  neighbors: {
    name: 'Đỉnh kề và bậc',
    needsTarget: false,
    pseudocode: { list: listNeighborsPseudocode, matrix: matrixNeighborsPseudocode },
    generate: (graph, sourceId, _targetId, representation) => (
      generateGraphNeighborsSteps(graph, sourceId, representation)
    ),
  },
}

const kindName = (directed) => (directed ? 'có hướng' : 'vô hướng')
const readsLabels = { list: 'Phần tử danh sách đã đọc', matrix: 'Ô ma trận đã đọc' }

export function describeGraph(graph) {
  return `Đồ thị ${kindName(graph.directed)}, V = ${countVertices(graph)}, E = ${countEdges(graph)}.`
}

const graphTotals = (graph) => `V = ${countVertices(graph)}, E = ${countEdges(graph)}.`

// Bậc của u trong đồ thị của bước; u không có trong đồ thị (hoặc chưa chọn) thì "—".
export function formatDegree(graph, vertexId) {
  if (vertexId === null || !hasVertex(graph, vertexId)) return '—'

  const label = labelOf(graph, vertexId)
  if (!graph.directed) return `deg(${label}) = ${outDegree(graph, vertexId)}`
  return `${label}: ra ${outDegree(graph, vertexId)}, vào ${inDegree(graph, vertexId)}`
}

export function formatResult(step) {
  if (!step.finished || step.result === null) return 'Chưa có'

  const { graph, sourceId, targetId } = step
  if (step.operation === 'has-edge') {
    return `${step.result ? 'Có cạnh' : 'Không có cạnh'} ${edgeText(graph, sourceId, targetId)}`
  }

  const names = step.outputIds.filter((id) => hasVertex(graph, id)).map((id) => labelOf(graph, id))
  const degreeName = graph.directed ? 'deg ra' : 'deg'
  const base = `${degreeName}(${labelOf(graph, sourceId)}) = ${step.result}`
  return names.length > 0 ? `${base}: ${names.join(', ')}` : base
}

function createSvgElement(document, name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name)
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value))
  }
  return element
}

function appendText(document, parent, attributes, text) {
  const element = createSvgElement(document, 'text', attributes)
  element.textContent = text
  parent.appendChild(element)
  return element
}

function appendArrowMarker(document, defs, id) {
  const marker = createSvgElement(document, 'marker', {
    id,
    viewBox: '0 0 10 10',
    refX: 10,
    refY: 5,
    markerWidth: 7,
    markerHeight: 7,
    orient: 'auto-start-reverse',
  })
  marker.appendChild(createSvgElement(document, 'path', { d: 'M0,0 L10,5 L0,10 z', class: 'graph-arrow-head' }))
  defs.appendChild(marker)
}

function edgePath(edge) {
  const { start, end, control } = edge
  return control
    ? `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`
    : `M ${start.x} ${start.y} L ${end.x} ${end.y}`
}

// Cạnh đang xét của bước (chỉ khi là cạnh có thật); vô hướng thì khớp cả hai chiều.
function isCurrentEdge(step, edge) {
  const current = step.currentEdge
  if (!current || !hasEdge(step.graph, current.from, current.to)) return false

  const sameDirection = current.from === edge.from && current.to === edge.to
  const reversed = current.from === edge.to && current.to === edge.from
  return sameDirection || (!step.graph.directed && reversed)
}

function renderEdges(document, svg, step, layout) {
  for (const edge of layout.edges) {
    const isCurrent = isCurrentEdge(step, edge)
    const path = createSvgElement(document, 'path', {
      class: `graph-edge${isCurrent ? ' is-current' : ''}`,
      d: edgePath(edge),
      'data-from': edge.from,
      'data-to': edge.to,
    })
    if (edge.arrow) path.setAttribute('marker-end', `url(#${isCurrent ? 'graph-arrow-current' : 'graph-arrow'})`)
    svg.appendChild(path)
  }
}

// Nhãn "u"/"v" đặt phía ngoài vòng tròn, cạnh đỉnh: trạng thái có chữ, không chỉ màu.
function badgePosition(point) {
  const { center } = GRAPH_LAYOUT
  const dx = point.x - center
  const dy = point.y - center
  const norm = Math.hypot(dx, dy) || 1
  const distance = GRAPH_LAYOUT.vertexRadius + 10
  return { x: Number((point.x + (dx / norm) * distance).toFixed(1)), y: Number((point.y + (dy / norm) * distance).toFixed(1)) }
}

function renderVertex(document, svg, step, vertex, point, outputIds) {
  const radius = GRAPH_LAYOUT.vertexRadius
  const group = createSvgElement(document, 'g', { class: 'graph-vertex', 'data-id': vertex.id, 'data-label': vertex.label })
  const isCurrent = step.currentVertexId === vertex.id
  const isOutput = outputIds.has(vertex.id)

  if (isCurrent) group.classList.add('is-current')
  if (isOutput) {
    group.classList.add('is-output')
    group.appendChild(createSvgElement(document, 'circle', { class: 'graph-vertex-ring', cx: point.x, cy: point.y, r: radius + 4 }))
  }

  group.appendChild(createSvgElement(document, 'circle', { class: 'graph-vertex-circle', cx: point.x, cy: point.y, r: radius }))
  appendText(document, group, { class: 'graph-vertex-label', x: point.x, y: point.y, dy: '0.35em', 'text-anchor': 'middle' }, vertex.label)

  if (isCurrent) {
    appendText(document, group, {
      class: 'graph-vertex-marker', x: point.x - radius - 4, y: point.y, dy: '0.35em', 'text-anchor': 'end',
    }, '▶')
  }
  if (isOutput) {
    appendText(document, group, {
      class: 'graph-vertex-check', x: point.x + radius - 2, y: point.y - radius + 4, 'text-anchor': 'middle',
    }, '✓')
  }

  const roles = [step.sourceId === vertex.id ? 'u' : null, step.targetId === vertex.id ? 'v' : null].filter(Boolean)
  if (roles.length > 0) {
    const badge = badgePosition(point)
    appendText(document, group, {
      class: 'graph-vertex-badge', x: badge.x, y: badge.y, dy: '0.35em', 'text-anchor': 'middle',
    }, roles.join(','))
  }

  svg.appendChild(group)
}

// Vẽ đồ thị của một bước. Id không có trong đồ thị của bước (đỉnh, cạnh, đỉnh đã ghi nhận) bị bỏ qua, không tô.
export function renderGraph(svg, step) {
  const document = svg.ownerDocument
  const { graph } = step
  const layout = layoutGraph(graph)
  const outputIds = new Set((step.outputIds ?? []).filter((id) => hasVertex(graph, id)))

  svg.replaceChildren()
  svg.setAttribute('width', String(layout.width))
  svg.setAttribute('height', String(layout.height))
  svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`)

  const defs = createSvgElement(document, 'defs')
  appendArrowMarker(document, defs, 'graph-arrow')
  appendArrowMarker(document, defs, 'graph-arrow-current')
  svg.appendChild(defs)

  if (countVertices(graph) === 0) {
    appendText(document, svg, {
      class: 'graph-empty', x: layout.width / 2, y: layout.height / 2, 'text-anchor': 'middle',
    }, 'Đồ thị rỗng: thêm đỉnh hoặc chọn đồ thị mẫu.')
    return layout
  }

  renderEdges(document, svg, step, layout)
  for (const vertex of listVertices(graph)) {
    renderVertex(document, svg, step, vertex, layout.vertices[vertex.id], outputIds)
  }
  return layout
}

export function initGraph(document, options = {}) {
  const $ = (selector) => document.querySelector(selector)

  const section = $('#graph-section')
  const kindSelect = $('#graph-kind')
  const representationSelect = $('#graph-representation')
  const sourceSelect = $('#graph-source')
  const targetSelect = $('#graph-target')
  const operationSelect = $('#graph-operation')
  const applyButton = $('#graph-apply')
  const addVertexButton = $('#graph-add-vertex')
  const removeVertexButton = $('#graph-remove-vertex')
  const addEdgeButton = $('#graph-add-edge')
  const removeEdgeButton = $('#graph-remove-edge')
  const inputError = $('#graph-input-error')
  const presetButtons = {
    sample: $('#graph-preset-sample'),
    complete: $('#graph-preset-complete'),
    tree: $('#graph-preset-tree'),
  }
  const clearButton = $('#graph-clear')
  const speedInput = $('#graph-speed')
  const speedValue = $('#graph-speed-value')
  const svg = $('#graph-svg')
  const resetButton = $('#graph-reset')
  const previousButton = $('#graph-previous')
  const nextButton = $('#graph-next')
  const runButton = $('#graph-run')
  const pauseButton = $('#graph-pause')
  const message = $('#graph-message')
  const status = $('#graph-status')
  const pseudocodeTitle = $('#graph-pseudocode-title')
  const pseudocodeCode = $('#graph-pseudocode')
  const stats = {
    vertices: $('#graph-vertex-count'),
    edges: $('#graph-edge-count'),
    degree: $('#graph-degree'),
    readsLabel: $('#graph-reads-label'),
    reads: $('#graph-reads'),
    result: $('#graph-result'),
  }

  const requiredElements = [
    section, kindSelect, representationSelect, sourceSelect, targetSelect, operationSelect, applyButton,
    addVertexButton, removeVertexButton, addEdgeButton, removeEdgeButton, svg,
    resetButton, previousButton, nextButton, runButton, pauseButton, message,
  ]

  if (requiredElements.some((element) => !element)) {
    console.error('Không thể khởi tạo Graph: thiếu phần tử HTML cần thiết.')
    return null
  }

  // Đồ thị đã chốt: kết quả của lần sửa hoặc truy vấn gần nhất (truy vấn chốt bằng steps.at(-1).graph).
  let committedGraph = graphPresets.sample.build(false)
  let idleMessage = IDLE_MESSAGE
  let renderedInfo = null

  const simulation = createSimulationController({
    getDelay: () => Number(speedInput?.value) || DEFAULT_SPEED,
    onChange: render,
    scheduler: options.scheduler,
  })

  const isRunning = () => simulation.getSnapshot().state === 'running'
  const setText = (element, text) => {
    if (element) element.textContent = text
  }

  function getSelectedOperation() {
    return graphOperations[operationSelect.value] ? operationSelect.value : 'has-edge'
  }

  function getSelectedRepresentation() {
    return Object.hasOwn(representationNames, representationSelect.value) ? representationSelect.value : 'list'
  }

  // Giá trị select là id đỉnh; rỗng = chưa chọn.
  const selectedId = (select) => (select.value === '' ? null : select.value)

  function createIdleStep() {
    const sourceId = selectedId(sourceSelect)
    const targetId = selectedId(targetSelect)
    return createGraphStepFactory(getSelectedOperation(), {
      representation: getSelectedRepresentation(),
      sourceId: sourceId !== null && hasVertex(committedGraph, sourceId) ? sourceId : null,
      targetId: targetId !== null && hasVertex(committedGraph, targetId) ? targetId : null,
    })({ graph: committedGraph, message: idleMessage })
  }

  // Làm mới select đỉnh theo đồ thị đã chốt. keep = true giữ lựa chọn nếu đỉnh còn tồn tại,
  // đỉnh đã bị xóa thì về "chưa chọn"; defaults dùng khi thay cả đồ thị (preset, đổi loại).
  function refreshVertexSelects({ keep = true, defaults = [null, null] } = {}) {
    const vertices = listVertices(committedGraph)

    ;[sourceSelect, targetSelect].forEach((select, index) => {
      const previous = keep ? selectedId(select) : defaults[index]
      const options = [{ value: '', text: '— chưa chọn —' }, ...vertices.map((vertex) => ({ value: vertex.id, text: vertex.label }))]

      select.replaceChildren(...options.map(({ value, text }) => {
        const option = document.createElement('option')
        option.value = value
        option.textContent = text
        return option
      }))
      select.value = previous !== null && hasVertex(committedGraph, previous) ? previous : ''
    })
  }

  function defaultSelection(graph) {
    const ids = listVertices(graph).map((vertex) => vertex.id)
    return [ids[0] ?? null, ids[2] ?? null]
  }

  function getRunLabel(runMode) {
    if (runMode === 'resume') return 'Tiếp tục'
    if (runMode === 'restart') return 'Chạy lại'
    return 'Chạy minh họa'
  }

  // Mã giả chỉ vẽ lại khi đổi thao tác hoặc cách biểu diễn; mỗi bước chỉ đổi dòng được tô.
  function renderOperationInfo(step) {
    const operation = graphOperations[step.operation]
    const infoKey = `${step.operation}:${step.representation}`

    if (renderedInfo !== infoKey) {
      renderPseudocode(pseudocodeCode, operation.pseudocode[step.representation])
      setText(pseudocodeTitle, `Mã giả: ${operation.name} (${representationNames[step.representation]})`)
      renderedInfo = infoKey
    }
    highlightPseudocodeLine(pseudocodeCode, step.pseudocodeLine)
  }

  // Mọi số liệu đọc từ đồ thị của BƯỚC ĐANG HIỂN THỊ, không từ đồ thị đã chốt.
  function renderStats(step) {
    const { graph } = step
    setText(stats.vertices, String(countVertices(graph)))
    setText(stats.edges, String(countEdges(graph)))
    setText(stats.degree, formatDegree(graph, step.sourceId))
    setText(stats.readsLabel, readsLabels[step.representation])
    setText(stats.reads, String(step.reads))
    setText(stats.result, formatResult(step))
  }

  function renderControls({ stepCount, controls }) {
    const hasSteps = stepCount > 0
    const running = isRunning()

    runButton.textContent = getRunLabel(controls.runMode)
    runButton.disabled = !hasSteps || !controls.run
    pauseButton.disabled = !controls.pause
    nextButton.disabled = !hasSteps || !controls.next
    previousButton.disabled = !controls.previous

    // Đang chạy thì khóa mọi thứ có thể đổi đồ thị, đầu vào hoặc cách biểu diễn giữa chừng minh họa.
    const lockable = [
      kindSelect, representationSelect, sourceSelect, targetSelect, operationSelect, applyButton,
      addVertexButton, removeVertexButton, addEdgeButton, removeEdgeButton,
      ...Object.values(presetButtons), clearButton,
    ]
    for (const element of lockable) {
      if (element) element.disabled = running
    }
  }

  function render(snapshot) {
    const step = snapshot.step ?? createIdleStep()

    renderGraph(svg, step)
    svg.setAttribute('aria-label', describeGraph(step.graph))
    renderStats(step)
    renderOperationInfo(step)
    message.textContent = step.message
    renderControls(snapshot)
  }

  function showInputError(text) {
    if (!inputError) return
    inputError.textContent = text
    inputError.hidden = text === ''
  }

  function setStatus(text) {
    setText(status, text)
  }

  // Sửa đồ thị: cập nhật tức thì, bỏ minh họa cũ (nếu có), làm mới select đỉnh.
  function commitEdit(graph, statusText) {
    committedGraph = graph
    idleMessage = IDLE_MESSAGE
    showInputError('')
    setStatus(statusText)
    refreshVertexSelects()
    simulation.load([])
  }

  // Thay cả đồ thị (preset, xóa toàn bộ, đổi loại).
  function loadGraph(graph, text, statusText = '') {
    committedGraph = graph
    idleMessage = text
    kindSelect.value = graph.directed ? 'directed' : 'undirected'
    showInputError('')
    setStatus(statusText)
    refreshVertexSelects({ keep: false, defaults: defaultSelection(graph) })
    simulation.load([])
  }

  // Trả về [u, v] hợp lệ hoặc null (đã báo lỗi).
  function readPair() {
    const sourceId = selectedId(sourceSelect)
    const targetId = selectedId(targetSelect)

    if (sourceId === null || targetId === null) {
      showInputError('Hãy chọn cả đỉnh u và đỉnh v.')
      return null
    }
    if (!hasVertex(committedGraph, sourceId) || !hasVertex(committedGraph, targetId)) {
      showInputError('Đỉnh đã chọn không còn trong đồ thị.')
      return null
    }
    return [sourceId, targetId]
  }

  function readSource() {
    const sourceId = selectedId(sourceSelect)
    if (sourceId === null) {
      showInputError('Hãy chọn đỉnh u.')
      return null
    }
    if (!hasVertex(committedGraph, sourceId)) {
      showInputError('Đỉnh đã chọn không còn trong đồ thị.')
      return null
    }
    return sourceId
  }

  function handleAddVertex() {
    if (isRunning()) return
    if (countVertices(committedGraph) >= MAX_VERTICES) {
      showInputError(`Đồ thị đã đủ ${MAX_VERTICES} đỉnh (A–H): hãy xóa bớt trước khi thêm.`)
      return
    }

    const { graph, id } = addVertex(committedGraph)
    commitEdit(graph, `Đã thêm đỉnh ${labelOf(graph, id)}. ${graphTotals(graph)}`)
  }

  function handleRemoveVertex() {
    if (isRunning()) return
    const sourceId = readSource()
    if (sourceId === null) return

    const label = labelOf(committedGraph, sourceId)
    const { graph } = removeVertex(committedGraph, sourceId)
    const removedEdges = countEdges(committedGraph) - countEdges(graph)
    commitEdit(graph, `Đã xóa đỉnh ${label} và ${removedEdges} cạnh liên quan. ${graphTotals(graph)}`)
  }

  const edgeRejections = {
    duplicate: (from, to) => `Cạnh ${edgeText(committedGraph, from, to)} đã tồn tại.`,
    'self-loop': () => 'Không cho phép khuyên (cạnh nối một đỉnh với chính nó): đồ thị ở đây là đồ thị đơn.',
    'missing-vertex': () => 'Đỉnh đã chọn không còn trong đồ thị.',
  }

  function handleAddEdge() {
    if (isRunning()) return
    const pair = readPair()
    if (pair === null) return

    const [from, to] = pair
    const { graph, added, reason } = addEdge(committedGraph, from, to)
    if (!added) {
      showInputError(edgeRejections[reason](from, to))
      return
    }
    commitEdit(graph, `Đã thêm cạnh ${edgeText(graph, from, to)}. ${graphTotals(graph)}`)
  }

  function handleRemoveEdge() {
    if (isRunning()) return
    const pair = readPair()
    if (pair === null) return

    const [from, to] = pair
    const { graph, removed } = removeEdge(committedGraph, from, to)
    if (!removed) {
      showInputError(`Không có cạnh ${edgeText(committedGraph, from, to)} để xóa.`)
      return
    }
    commitEdit(graph, `Đã xóa cạnh ${edgeText(committedGraph, from, to)}. ${graphTotals(graph)}`)
  }

  // Truy vấn chạy trên đồ thị đã chốt; chốt lại bằng steps.at(-1).graph ngay khi sinh bước.
  function applyQuery() {
    if (isRunning()) return

    const operationName = getSelectedOperation()
    const operation = graphOperations[operationName]
    const input = operation.needsTarget ? readPair() : readSource()
    if (input === null) return

    const [sourceId, targetId] = operation.needsTarget ? input : [input, null]
    showInputError('')
    setStatus('')

    const steps = operation.generate(committedGraph, sourceId, targetId, getSelectedRepresentation())
    committedGraph = steps.at(-1).graph
    simulation.load(steps)
  }

  // Đổi loại đồ thị: tạo đồ thị rỗng mới (không chuyển đổi cạnh giữa hai loại).
  function recreateEmptyGraph() {
    if (isRunning()) return
    const directed = kindSelect.value === 'directed'
    loadGraph(
      createGraph(directed),
      'Đồ thị đang rỗng. Hãy thêm đỉnh hoặc chọn một đồ thị mẫu.',
      `Đã tạo đồ thị ${kindName(directed)} rỗng mới (đổi loại đồ thị không giữ đỉnh và cạnh cũ).`,
    )
  }

  // Đổi thao tác hoặc cách biểu diễn: bỏ minh họa cũ (đồ thị đã chốt không mất).
  function discardIllustration() {
    if (isRunning()) return
    idleMessage = IDLE_MESSAGE
    showInputError('')
    setStatus('')
    simulation.load([])
  }

  function resetIllustration() {
    const hasSteps = simulation.getSnapshot().stepCount > 0
    simulation.reset()
    if (hasSteps) setStatus(RESET_NOTE)
  }

  applyButton.addEventListener('click', applyQuery)
  addVertexButton.addEventListener('click', handleAddVertex)
  removeVertexButton.addEventListener('click', handleRemoveVertex)
  addEdgeButton.addEventListener('click', handleAddEdge)
  removeEdgeButton.addEventListener('click', handleRemoveEdge)
  nextButton.addEventListener('click', simulation.next)
  previousButton.addEventListener('click', simulation.previous)
  runButton.addEventListener('click', simulation.run)
  pauseButton.addEventListener('click', simulation.pause)
  resetButton.addEventListener('click', resetIllustration)
  kindSelect.addEventListener('change', recreateEmptyGraph)
  operationSelect.addEventListener('change', discardIllustration)
  representationSelect.addEventListener('change', discardIllustration)

  // Đổi đỉnh u/v không bỏ minh họa đang có (bước đã chốt đầu vào); chưa có bước thì vẽ lại bậc của u mới.
  ;[sourceSelect, targetSelect].forEach((select) => {
    select.addEventListener('change', () => {
      if (isRunning()) return
      showInputError('')
      render(simulation.getSnapshot())
    })
  })

  for (const [name, button] of Object.entries(presetButtons)) {
    button?.addEventListener('click', () => {
      if (isRunning()) return
      const preset = graphPresets[name]
      const directed = kindSelect.value === 'directed'
      const graph = preset.build(directed)
      loadGraph(graph, `Đã nạp ${preset.name} (${kindName(directed)}): ${graphTotals(graph)} ${preset.note(directed)}`)
    })
  }

  clearButton?.addEventListener('click', () => {
    if (isRunning()) return
    loadGraph(createGraph(kindSelect.value === 'directed'), 'Đã xóa toàn bộ đồ thị. Hãy thêm đỉnh đầu tiên.')
  })

  speedInput?.addEventListener('input', () => {
    if (speedValue) speedValue.textContent = `${speedInput.value} ms`
  })

  // Rời màn hình mô phỏng thì tạm dừng (giữ nguyên bước hiện tại).
  document.addEventListener('algovision:viewchange', () => {
    if (svg.closest('[hidden]')) simulation.pause()
  })

  refreshVertexSelects({ keep: false, defaults: defaultSelection(committedGraph) })
  render(simulation.getSnapshot())

  // Dùng cho test: nạp mảng bước tùy ý (vd. bước có đồ thị khác đồ thị đã chốt) mà không đổi đồ thị đã chốt.
  return { loadSteps: (steps) => simulation.load(steps) }
}
