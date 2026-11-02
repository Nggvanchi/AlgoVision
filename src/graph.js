import { createSimulationController } from './simulation-controller.js'
import { renderPseudocode, highlightPseudocodeLine } from './pseudocode-view.js'
import { layoutGraph, GRAPH_LAYOUT } from './graph-layout.js'
import {
  addEdge,
  addVertex,
  adjacencyListSize,
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
  toAdjacencyMatrix,
} from './structures/graph.js'
import { createGraphStepFactory, edgeText, labelOf, representationNames } from './algorithms/graphStep.js'
import { generateGraphHasEdgeSteps, listHasEdgePseudocode, matrixHasEdgePseudocode } from './algorithms/graphHasEdge.js'
import {
  generateGraphNeighborsSteps,
  listNeighborsPseudocode,
  matrixNeighborsPseudocode,
} from './algorithms/graphNeighbors.js'
import { generateGraphBfsSteps, listBfsPseudocode, matrixBfsPseudocode } from './algorithms/graphBfs.js'
import { generateGraphDfsSteps, listDfsPseudocode, matrixDfsPseudocode } from './algorithms/graphDfs.js'
import {
  bfsListReadState,
  bfsMatrixReadState,
  bfsVertexMarks,
  describeBfsCost,
  formatBfsResult,
  formatDequeueCount,
  renderBfsOrder,
  renderBfsQueue,
  renderBfsTable,
} from './graph-bfs-view.js'
import {
  describeDfsCost,
  dfsListReadState,
  dfsMatrixReadState,
  dfsMaxDepthSoFar,
  dfsVertexMarks,
  formatCallCount,
  formatDfsResult,
  renderDfsOrder,
  renderDfsStack,
  renderDfsTable,
} from './graph-dfs-view.js'
import { isTreeEdge } from './graph-traversal-view.js'

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
  bfs: {
    name: 'BFS từ s',
    needsTarget: false,
    pseudocode: { list: listBfsPseudocode, matrix: matrixBfsPseudocode },
    generate: (graph, sourceId, _targetId, representation) => generateGraphBfsSteps(graph, sourceId, representation),
  },
  dfs: {
    name: 'DFS từ s',
    needsTarget: false,
    pseudocode: { list: listDfsPseudocode, matrix: matrixDfsPseudocode },
    generate: (graph, sourceId, _targetId, representation) => generateGraphDfsSteps(graph, sourceId, representation),
  },
}

// Thao tác duyệt đồ thị từ một nguồn: vẽ cạnh cây, ô chọn đỉnh thứ nhất gọi là đỉnh nguồn s (cùng một select với u).
const TRAVERSALS = ['bfs', 'dfs']
const isTraversal = (operation) => TRAVERSALS.includes(operation)
const sourceNames = {
  label: (operation) => (isTraversal(operation) ? 'Đỉnh nguồn s' : 'Đỉnh u'),
  missing: (operation) => (isTraversal(operation) ? 'Hãy chọn đỉnh nguồn s.' : 'Hãy chọn đỉnh u.'),
}

const kindName = (directed) => (directed ? 'có hướng' : 'vô hướng')
const readsLabels = { list: 'Phần tử danh sách đã đọc', matrix: 'Ô ma trận đã đọc' }

// Lý thuyết theo thao tác × cách biểu diễn (khớp với generator: reads của danh sách = số phần tử Adj[u] đã đọc,
// của ma trận = số ô đã đọc).
export const graphLearning = {
  'has-edge': {
    list: {
      description: 'Duyệt Adj[u] từ đầu, so từng đỉnh w với v; gặp v thì dừng, hết danh sách mà không gặp thì u không kề v.',
      advantages: 'Chỉ đọc các cạnh thật sự đi ra từ u: đồ thị thưa thì deg(u) nhỏ, kiểm tra rất nhanh.',
      disadvantages: 'Trường hợp xấu nhất (v ở cuối hoặc không có) phải đọc cả deg(u) phần tử, tới V − 1 trong đồ thị dày.',
    },
    matrix: {
      description: 'Đọc thẳng ô M[u][v]: bằng 1 thì có cạnh u → v (vô hướng thì cũng là v → u).',
      advantages: 'Luôn đúng một lần đọc, không phụ thuộc bậc của u: O(1) cả trong đồ thị dày.',
      disadvantages: 'Phải giữ đủ V² ô kể cả khi gần như không có cạnh nào.',
    },
  },
  neighbors: {
    list: {
      description: 'Đọc lần lượt mọi phần tử của Adj[u]; mỗi phần tử là một đỉnh kề, số phần tử là bậc (có hướng: bậc ra).',
      advantages: 'Chi phí đúng bằng số đỉnh kề Θ(deg(u)): không tốn lần đọc nào cho cặp không kề.',
      disadvantages: 'Có hướng thì bậc vào không có sẵn: phải tìm u trong mọi danh sách khác, O(V + E).',
    },
    matrix: {
      description: 'Đọc cả hàng u của ma trận, ô bằng 1 nào thì cột đó là một đỉnh kề.',
      advantages: 'Cột u cho ngay các cạnh đi vào u, nên bậc vào cũng chỉ tốn Θ(V).',
      disadvantages: 'Luôn đọc đủ V ô, kể cả khi u là đỉnh cô lập (bậc 0).',
    },
  },
  bfs: {
    list: {
      description: 'Duyệt theo từng lớp bằng hàng đợi: lấy u ở đầu hàng, đọc từng w trong Adj[u]; w chưa được đánh dấu thì '
        + 'đánh dấu ngay, gán dist[w] = dist[u] + 1, parent[w] = u và đưa vào cuối hàng. Đánh dấu lúc đưa vào hàng nên '
        + 'mỗi đỉnh vào hàng đợi đúng một lần.',
      advantages: 'Mỗi đỉnh tới được lấy ra một lần và chỉ đọc các cạnh thật sự đi ra từ nó (có hướng: bậc ra), '
        + 'nên tổng chi phí O(V + E); dist là số cạnh của đường đi ngắn nhất từ s.',
      disadvantages: 'Chỉ đi tới các đỉnh tới được từ s: đỉnh ở thành phần khác giữ dist = — (cần chạy lại từ nguồn khác). '
        + 'Hàng đợi và mảng visited/dist/parent tốn thêm O(V) bộ nhớ.',
    },
    matrix: {
      description: 'Giống BFS trên danh sách kề, nhưng với mỗi u lấy khỏi hàng đợi phải đọc cả hàng u của ma trận '
        + '(V ô) để tìm các w có M[u][w] = 1.',
      advantages: 'Cài đặt đơn giản, không cần danh sách kề; với đồ thị dày (E gần V²) chi phí tương đương danh sách kề.',
      disadvantages: 'Mỗi lần lấy u ra luôn đọc đủ V ô, kể cả ô bằng 0: tổng R·V ô (R là số đỉnh tới được), tối đa V², '
        + 'tức O(V²) dù đồ thị rất thưa.',
    },
  },
  dfs: {
    list: {
      description: 'Đi sâu trước: vào u thì đánh dấu và ghi mốc vào; đọc từng w trong Adj[u], gặp w chưa thăm thì gán '
        + 'parent[w] = u và gọi DFS(w) ngay (khung mới lên đỉnh ngăn xếp); đọc hết Adj[u] thì ghi mốc ra và quay lui. '
        + 'Minh họa dùng ngăn xếp tường minh nhưng thứ tự giống hệt bản đệ quy.',
      advantages: 'Mỗi đỉnh tới được được gọi đúng một lần và chỉ đọc các cạnh thật sự đi ra từ nó (có hướng: bậc ra), '
        + 'nên tổng chi phí O(V + E), cùng số lần đọc với BFS. Mốc vào/ra lồng nhau cho biết quan hệ tổ tiên – con cháu.',
      disadvantages: 'Không cho đường đi ngắn nhất (Cây hay C5 đi sâu theo một nhánh trước). Ngăn xếp gọi sâu tới V khung '
        + 'khi đồ thị là một đường thẳng: bộ nhớ phụ O(V), và đệ quy thật có thể tràn ngăn xếp.',
    },
    matrix: {
      description: 'Giống DFS trên danh sách kề, nhưng ở mỗi đỉnh u phải dò cả hàng u của ma trận (V ô) để tìm các w có '
        + 'M[u][w] = 1; dò dở thì gọi DFS(w), quay lui rồi dò tiếp từ cột kế tiếp.',
      advantages: 'Cài đặt đơn giản, không cần danh sách kề; đồ thị dày (E gần V²) thì chi phí tương đương danh sách kề.',
      disadvantages: 'Mỗi đỉnh tới được luôn đọc đủ V ô, kể cả ô bằng 0: tổng R·V ô, tối đa V², tức O(V²) dù đồ thị rất thưa.',
    },
  },
}

// Số ô nhớ của hai cách biểu diễn cho đồ thị của bước đang hiển thị.
export function representationSizes(graph) {
  const vertexCount = countVertices(graph)
  return { list: adjacencyListSize(graph), matrix: vertexCount * vertexCount }
}

export function describeRepresentationCost(graph) {
  const { list, matrix } = representationSizes(graph)
  const formula = graph.directed ? 'V + E' : 'V + 2E'
  return `Đồ thị đang hiển thị (${kindName(graph.directed)}): ${graphTotals(graph)} `
    + `Danh sách kề lưu ${formula} = ${list} ô nhớ; ma trận kề lưu V² = ${matrix} ô.`
}

// So sánh thưa/dày tính từ chính đồ thị đang hiển thị (không ghi cứng ví dụ).
export function describeDensity(graph) {
  const vertexCount = countVertices(graph)
  if (vertexCount === 0) return 'Đồ thị rỗng: cả hai cách đều chưa tốn ô nào.'

  const { list, matrix } = representationSizes(graph)
  const edgeCount = countEdges(graph)
  const maxEdges = graph.directed ? vertexCount * (vertexCount - 1) : (vertexCount * (vertexCount - 1)) / 2
  const complete = edgeCount === maxEdges ? ': đồ thị đầy đủ' : ''
  const detail = `${list} so với ${matrix} ô (E = ${edgeCount}, tối đa ${maxEdges} cạnh${complete}).`

  if (list < matrix) return `Danh sách kề tiết kiệm hơn: ${detail}`
  if (list === matrix) return `Hai cách tốn bằng nhau: ${detail}`
  return `Ma trận kề tiết kiệm hơn: ${detail}`
}

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
  if (step.operation === 'bfs') return formatBfsResult(step)
  if (step.operation === 'dfs') return formatDfsResult(step)
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

// BFS/DFS: cạnh cây (parent[w], w) có lớp is-tree (nét liền đậm). Rẽ nhánh theo step.operation, không theo select.
function renderEdges(document, svg, step, layout) {
  const drawsTree = isTraversal(step.operation)
  for (const edge of layout.edges) {
    const isCurrent = isCurrentEdge(step, edge)
    const isTree = drawsTree && isTreeEdge(step, edge)
    const path = createSvgElement(document, 'path', {
      class: ['graph-edge', isCurrent ? 'is-current' : null, isTree ? 'is-tree' : null].filter(Boolean).join(' '),
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

// Trạng thái vẽ đỉnh của truy vấn: đã ghi nhận = outputIds; nhãn "u"/"v" theo sourceId/targetId. Id lạ bị bỏ qua.
function queryVertexMarks(step) {
  const { graph } = step
  const doneIds = new Set((step.outputIds ?? []).filter((id) => hasVertex(graph, id)))
  const badges = new Map()

  for (const { id } of listVertices(graph)) {
    const roles = [step.sourceId === id ? 'u' : null, step.targetId === id ? 'v' : null].filter(Boolean)
    if (roles.length > 0) badges.set(id, roles.join(','))
  }
  return { doneIds, queuedIds: new Set(), badges }
}

// marks { doneIds, queuedIds, openIds?, badges }: của truy vấn (queryVertexMarks), BFS (bfsVertexMarks) hoặc DFS
// (dfsVertexMarks; openIds = đỉnh trong ngăn xếp gọi, vẽ vòng chấm).
function renderVertex(document, svg, step, vertex, point, marks) {
  const radius = GRAPH_LAYOUT.vertexRadius
  const group = createSvgElement(document, 'g', { class: 'graph-vertex', 'data-id': vertex.id, 'data-label': vertex.label })
  const isCurrent = step.currentVertexId === vertex.id
  const isOutput = marks.doneIds.has(vertex.id)

  if (isCurrent) group.classList.add('is-current')
  if (isOutput) {
    group.classList.add('is-output')
    group.appendChild(createSvgElement(document, 'circle', { class: 'graph-vertex-ring', cx: point.x, cy: point.y, r: radius + 4 }))
  }
  if (marks.queuedIds.has(vertex.id)) {
    group.classList.add('is-queued')
    group.appendChild(createSvgElement(document, 'circle', {
      class: 'graph-vertex-queue-ring', cx: point.x, cy: point.y, r: radius + 4,
    }))
  }
  if (marks.openIds?.has(vertex.id)) {
    group.classList.add('is-open')
    group.appendChild(createSvgElement(document, 'circle', {
      class: 'graph-vertex-stack-ring', cx: point.x, cy: point.y, r: radius + 4,
    }))
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

  const badgeText = marks.badges.get(vertex.id)
  if (badgeText) {
    const badge = badgePosition(point)
    appendText(document, group, {
      class: 'graph-vertex-badge', x: badge.x, y: badge.y, dy: '0.35em', 'text-anchor': 'middle',
    }, badgeText)
  }

  svg.appendChild(group)
}

function appendMarker(document, parent) {
  const marker = document.createElement('span')
  marker.className = 'graph-entry-marker'
  marker.setAttribute('aria-hidden', 'true')
  marker.textContent = '▶'
  parent.appendChild(marker)
}

// Đánh dấu một phần tử/ô của bảng: đang đọc (▶, aria-current) hoặc đã đọc (lớp is-read, viền nét đứt).
function markReadState(document, element, state) {
  if (state === 'current') {
    element.classList.add('is-current')
    element.setAttribute('aria-current', 'true')
    appendMarker(document, element)
  } else if (state === 'read') {
    element.classList.add('is-read')
  }
}

// Phần tử của Adj[u] đã đọc trong bước dùng danh sách kề: reads phần tử đầu của Adj[sourceId].
function listReadState(step, ownerId, neighborId, index) {
  const { graph, currentEdge, sourceId } = step
  if (step.representation !== 'list' || ownerId !== sourceId) return null

  const isCurrent = currentEdge !== null && hasEdge(graph, currentEdge.from, currentEdge.to)
    && currentEdge.from === ownerId && currentEdge.to === neighborId
  if (isCurrent) return 'current'
  return index < step.reads ? 'read' : null
}

// Ô ma trận trong bước dùng ma trận kề: ô matrixCell đang đọc; Đỉnh kề đọc lần lượt reads ô đầu của hàng u,
// còn Kiểm tra kề chỉ đọc đúng một ô nên không có ô "đã đọc" nào khác.
function matrixReadState(step, rowId, columnId, columnIndex) {
  const { graph, matrixCell, sourceId } = step
  if (step.representation !== 'matrix' || !hasVertex(graph, rowId)) return null

  const isCurrent = matrixCell !== null && hasVertex(graph, matrixCell.rowId) && hasVertex(graph, matrixCell.colId)
    && matrixCell.rowId === rowId && matrixCell.colId === columnId
  if (isCurrent) return 'current'
  if (step.operation !== 'neighbors' || rowId !== sourceId) return null
  return columnIndex < step.reads ? 'read' : null
}

// Trạng thái đọc theo thao tác của bước: BFS đọc nhiều hàng (mọi đỉnh đã lấy khỏi hàng đợi), DFS đọc hàng của đỉnh
// đã đóng và đọc dở hàng của đỉnh trong ngăn xếp, truy vấn chỉ hàng u.
function readStateOf(step, table) {
  if (step.operation === 'bfs') return table === 'list' ? bfsListReadState : bfsMatrixReadState
  if (step.operation === 'dfs') return table === 'list' ? dfsListReadState : dfsMatrixReadState
  return table === 'list' ? listReadState : matrixReadState
}

// Bảng danh sách kề của đồ thị trong bước: mỗi đỉnh một hàng "A → B C", sắp theo slot.
export function renderAdjacencyList(listElement, step) {
  const document = listElement.ownerDocument
  const { graph } = step
  const vertices = listVertices(graph)
  const entryCount = vertices.reduce((total, vertex) => total + graph.adjacency[vertex.id].length, 0)

  listElement.replaceChildren()
  listElement.setAttribute(
    'aria-label',
    `Danh sách kề (${kindName(graph.directed)}): ${vertices.length} danh sách, ${entryCount} phần tử.`,
  )

  if (vertices.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'graph-list-empty-graph'
    empty.textContent = 'Đồ thị rỗng.'
    listElement.appendChild(empty)
    return
  }

  for (const vertex of vertices) {
    const row = document.createElement('li')
    row.className = 'graph-list-row'
    row.dataset.id = vertex.id
    row.dataset.label = vertex.label

    const head = document.createElement('span')
    head.className = 'graph-list-head'
    head.textContent = `${vertex.label} →`
    row.appendChild(head)

    const neighborIds = graph.adjacency[vertex.id]
    if (neighborIds.length === 0) {
      const empty = document.createElement('span')
      empty.className = 'graph-list-empty'
      empty.textContent = '∅'
      row.appendChild(empty)
    }

    neighborIds.forEach((neighborId, index) => {
      const entry = document.createElement('span')
      entry.className = 'graph-list-entry'
      entry.dataset.id = neighborId
      entry.dataset.label = labelOf(graph, neighborId)
      markReadState(document, entry, readStateOf(step, 'list')(step, vertex.id, neighborId, index))
      entry.append(labelOf(graph, neighborId))
      row.appendChild(entry)
    })

    listElement.appendChild(row)
  }
}

// Bảng ma trận kề suy ra từ đồ thị của bước: hàng là đỉnh đi, cột là đỉnh đến (vô hướng thì đối xứng).
export function renderAdjacencyMatrix(table, step) {
  const document = table.ownerDocument
  const { graph } = step
  const { ids, cells } = toAdjacencyMatrix(graph)
  const ones = cells.reduce((total, row) => total + row.filter((value) => value === 1).length, 0)
  const createCell = (tag, text, attributes = {}) => {
    const cell = document.createElement(tag)
    for (const [key, value] of Object.entries(attributes)) cell.setAttribute(key, value)
    if (text !== null) cell.textContent = text
    return cell
  }

  table.replaceChildren()
  table.setAttribute(
    'aria-label',
    `Ma trận kề ${ids.length} × ${ids.length} (${kindName(graph.directed)}): ${ones} ô bằng 1.`,
  )
  table.appendChild(createCell('caption', graph.directed
    ? 'Có hướng: hàng là đỉnh đi, cột là đỉnh đến (M[u][v] = 1 khi có u → v).'
    : 'Vô hướng: ma trận đối xứng, M[u][v] = M[v][u].'))

  if (ids.length === 0) return

  const head = document.createElement('thead')
  const headRow = document.createElement('tr')
  headRow.appendChild(createCell('td', '', { class: 'graph-matrix-corner' }))
  ids.forEach((id) => headRow.appendChild(createCell('th', labelOf(graph, id), { scope: 'col' })))
  head.appendChild(headRow)
  table.appendChild(head)

  const body = document.createElement('tbody')
  ids.forEach((rowId, rowIndex) => {
    const row = document.createElement('tr')
    row.appendChild(createCell('th', labelOf(graph, rowId), { scope: 'row' }))

    ids.forEach((columnId, columnIndex) => {
      const value = cells[rowIndex][columnIndex]
      const cell = createCell('td', null, {
        class: `graph-matrix-cell${value === 1 ? ' is-one' : ''}`,
        'data-row': rowId,
        'data-col': columnId,
        'data-row-label': labelOf(graph, rowId),
        'data-col-label': labelOf(graph, columnId),
        'data-value': String(value),
      })
      markReadState(document, cell, readStateOf(step, 'matrix')(step, rowId, columnId, columnIndex))
      cell.append(String(value))
      row.appendChild(cell)
    })
    body.appendChild(row)
  })
  table.appendChild(body)
}

// Vẽ đồ thị của một bước. Id không có trong đồ thị của bước (đỉnh, cạnh, đỉnh đã ghi nhận) bị bỏ qua, không tô.
export function renderGraph(svg, step) {
  const document = svg.ownerDocument
  const { graph } = step
  const layout = layoutGraph(graph)
  const markers = { bfs: bfsVertexMarks, dfs: dfsVertexMarks }
  const marks = (markers[step.operation] ?? queryVertexMarks)(step)

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
    renderVertex(document, svg, step, vertex, layout.vertices[vertex.id], marks)
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
  const adjacencyList = $('#graph-adjacency-list')
  const adjacencyMatrix = $('#graph-adjacency-matrix')
  const representationPanels = { list: $('#graph-list-panel'), matrix: $('#graph-matrix-panel') }
  const sourceLabel = $('label[for="graph-source"]')
  const bfs = {
    panel: $('#graph-bfs-panel'),
    queue: $('#graph-bfs-queue'),
    order: $('#graph-bfs-order'),
    table: $('#graph-bfs-table'),
  }
  const dfs = {
    panel: $('#graph-dfs-panel'),
    stack: $('#graph-dfs-stack'),
    order: $('#graph-dfs-order'),
    table: $('#graph-dfs-table'),
  }
  const complexity = {
    title: $('#graph-complexity-title'),
    live: $('#graph-complexity-live'),
    listSize: $('#graph-list-size'),
    matrixSize: $('#graph-matrix-size'),
    density: $('#graph-density'),
    table: $('#graph-complexity-table'),
    bfsCost: $('#graph-bfs-cost'),
    dfsCost: $('#graph-dfs-cost'),
  }
  const learningCells = {
    description: $('#graph-learning-description'),
    advantages: $('#graph-learning-advantages'),
    disadvantages: $('#graph-learning-disadvantages'),
  }
  const stats = {
    vertices: $('#graph-vertex-count'),
    edges: $('#graph-edge-count'),
    degree: $('#graph-degree'),
    readsLabel: $('#graph-reads-label'),
    reads: $('#graph-reads'),
    dequeuesLabel: $('#graph-dequeues-label'),
    dequeues: $('#graph-dequeues'),
    stackDepth: $('#graph-stack-depth'),
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
      const learning = graphLearning[step.operation][step.representation]

      renderPseudocode(pseudocodeCode, operation.pseudocode[step.representation])
      setText(pseudocodeTitle, `Mã giả: ${operation.name} (${representationNames[step.representation]})`)
      setText(complexity.title, `${operation.name} · ${representationNames[step.representation]}`.toUpperCase())
      for (const [key, element] of Object.entries(learningCells)) setText(element, learning[key])
      complexity.table?.querySelectorAll('tbody tr').forEach((row) => {
        const isActive = row.dataset.row === step.operation
        row.classList.toggle('is-active', isActive)
        setText(row.querySelector('.graph-row-badge'), isActive ? 'đang chọn' : '')
      })
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
    // Thẻ thứ năm đếm số lần dequeue (BFS) hoặc số lần gọi (DFS); thẻ độ sâu chỉ có số với DFS.
    const isDfs = step.operation === 'dfs'
    setText(stats.dequeuesLabel, isDfs ? 'Số lần gọi DFS' : 'Số lần dequeue (BFS)')
    setText(stats.dequeues, isDfs ? formatCallCount(step) : formatDequeueCount(step))
    setText(stats.stackDepth, isDfs ? String(dfsMaxDepthSoFar(step)) : '—')
    setText(stats.result, formatResult(step))

    const { list, matrix } = representationSizes(graph)
    setText(complexity.live, describeRepresentationCost(graph))
    setText(complexity.listSize, String(list))
    setText(complexity.matrixSize, String(matrix))
    setText(complexity.density, describeDensity(graph))
  }

  // Số đo BFS/DFS theo bước đang hiển thị; chưa sinh bước (chọn thao tác nhưng chưa bấm Thực hiện) thì chỉ nhắc cách đo.
  const traversalCosts = [
    { element: complexity.bfsCost, describe: describeBfsCost, idle: 'BFS từ s: bấm Thực hiện để đếm số lần dequeue và số lần đọc thật.' },
    {
      element: complexity.dfsCost,
      describe: describeDfsCost,
      idle: 'DFS từ s: bấm Thực hiện để đếm số lần gọi, số lần đọc và độ sâu ngăn xếp thật.',
    },
  ]

  function renderTraversalCost(step, hasSteps) {
    for (const { element, describe, idle } of traversalCosts) {
      if (!element) continue
      const text = describe(step)
      element.hidden = text === null
      if (text !== null) setText(element, hasSteps ? text : idle)
    }
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

  // Hai bảng cùng vẽ đồ thị của bước; bảng ứng với cách biểu diễn của bước được đánh dấu bằng chữ, không chỉ màu.
  function renderRepresentations(step) {
    if (adjacencyList) renderAdjacencyList(adjacencyList, step)
    if (adjacencyMatrix) renderAdjacencyMatrix(adjacencyMatrix, step)

    for (const [representation, panel] of Object.entries(representationPanels)) {
      if (!panel) continue
      const isActive = representation === step.representation
      panel.classList.toggle('is-active', isActive)
      setText(panel.querySelector('.graph-panel-badge'), isActive ? 'đang dùng để truy vấn' : '')
    }
  }

  // Khung BFS (hàng đợi, đã xử lý, dist/parent) hiện theo thao tác của BƯỚC ĐANG HIỂN THỊ, không theo select.
  function renderBfsPanel(step) {
    if (!bfs.panel) return
    const isBfs = step.operation === 'bfs'
    bfs.panel.hidden = !isBfs
    if (!isBfs) return

    if (bfs.queue) renderBfsQueue(bfs.queue, step)
    if (bfs.order) renderBfsOrder(bfs.order, step)
    if (bfs.table) renderBfsTable(bfs.table, step)
  }

  // Khung DFS (ngăn xếp gọi, thứ tự thăm, mốc vào/ra) cũng theo thao tác của BƯỚC ĐANG HIỂN THỊ.
  function renderDfsPanel(step) {
    if (!dfs.panel) return
    const isDfs = step.operation === 'dfs'
    dfs.panel.hidden = !isDfs
    if (!isDfs) return

    if (dfs.stack) renderDfsStack(dfs.stack, step)
    if (dfs.order) renderDfsOrder(dfs.order, step)
    if (dfs.table) renderDfsTable(dfs.table, step)
  }

  // Nhãn ô chọn đỉnh mô tả việc nút Thực hiện sắp làm, nên theo select thao tác.
  function renderSourceLabel() {
    setText(sourceLabel, sourceNames.label(getSelectedOperation()))
  }

  function render(snapshot) {
    const step = snapshot.step ?? createIdleStep()

    renderGraph(svg, step)
    svg.setAttribute('aria-label', describeGraph(step.graph))
    renderBfsPanel(step)
    renderDfsPanel(step)
    renderSourceLabel()
    renderRepresentations(step)
    renderStats(step)
    renderTraversalCost(step, snapshot.step !== null && snapshot.step !== undefined)
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
      showInputError(sourceNames.missing(getSelectedOperation()))
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

  // CHỈ DÙNG CHO TEST: nạp mảng bước tùy ý (vd. bước có đồ thị khác đồ thị đã chốt, bước có id lạ)
  // mà không đổi đồ thị đã chốt. main.js không dùng giá trị trả về này.
  return { loadSteps: (steps) => simulation.load(steps) }
}
