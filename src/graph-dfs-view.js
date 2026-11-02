import { hasVertex, listVertices } from './structures/graph.js'
import { labelOf } from './algorithms/graphStep.js'

// Phần hiển thị riêng của DFS: hàm thuần suy trạng thái vẽ từ bước, và vẽ ngăn xếp gọi / thứ tự thăm / bảng mốc vào-ra.
// Mọi thứ đọc từ step.graph của bước đang hiển thị; id không có trong đồ thị đó bị bỏ qua (không tô, không lỗi).
// File này KHÔNG import src/graph.js (graph.js import file này) để tránh vòng import.
// Bước nhàn rỗi (chưa sinh bước) có thể thiếu các trường DFS nên mọi trường đều có giá trị mặc định rỗng.

const knownIn = (graph) => (id) => hasVertex(graph, id)
const idsOf = (step, field) => (step[field] ?? []).filter(knownIn(step.graph))
const stampOf = (step, field, id) => step[field]?.[id] ?? null
const stampText = (value) => (value === null ? '—' : String(value))
const labelsText = (graph, ids) => ids.map((id) => labelOf(graph, id)).join(', ')

// Trắng / xám / đen suy từ dữ liệu: đã đóng = finishedIds, đang mở = đã thăm chưa đóng, còn lại chưa thăm.
export const dfsStatusText = { unvisited: 'chưa thăm', open: 'đang mở', closed: 'đã đóng' }

export function dfsVertexStatus(step, id) {
  if (idsOf(step, 'finishedIds').includes(id)) return 'closed'
  if (idsOf(step, 'visitedIds').includes(id)) return 'open'
  return 'unvisited'
}

// doneIds: đỉnh đã đóng (✓); openIds: đỉnh trong ngăn xếp gọi (vòng chấm); queuedIds luôn rỗng (chỉ BFS dùng).
// badges: nguồn "s" (chưa vào) hoặc "s·vào/ra"; đỉnh khác đã thăm "vào/ra", chưa ra thì "vào/–".
export function dfsVertexMarks(step) {
  const doneIds = new Set(idsOf(step, 'finishedIds'))
  const openIds = new Set(idsOf(step, 'callStackIds'))
  const badges = new Map()

  for (const { id } of listVertices(step.graph)) {
    const discovery = stampOf(step, 'discovery', id)
    const finish = stampOf(step, 'finish', id)
    const stamps = discovery === null ? null : `${discovery}/${finish ?? '–'}`
    if (id === step.sourceId) badges.set(id, stamps === null ? 's' : `s·${stamps}`)
    else if (stamps !== null) badges.set(id, stamps)
  }
  return { doneIds, openIds, queuedIds: new Set(), badges }
}

// Vị trí cuối cùng đã đọc của hàng u khi bước không có ô/phần tử đang đọc trên hàng đó: mỗi đỉnh con đã thăm
// (parent = u) được gọi ngay khi đọc tới nó, nên u đã đọc tới và gồm vị trí của con có vị trí lớn nhất; chưa có con: -1.
function lastChildPosition(step, ownerId, columns) {
  const visited = idsOf(step, 'visitedIds')
  return columns.reduce((last, columnId, index) => (
    step.parentIds?.[columnId] === ownerId && visited.includes(columnId) ? index : last
  ), -1)
}

// Đỉnh đã đóng: đọc hết hàng. Đỉnh đang mở: nếu bước đang đọc trên hàng này thì trước vị trí đó là "đã đọc", vị trí đó
// "đang đọc"; nếu không, đọc tới và gồm vị trí của đỉnh con gần nhất (khung xám dưới đỉnh ngăn xếp đọc tới con ở khung trên).
function rowReadState(step, ownerId, columns, index, currentIndex) {
  const status = dfsVertexStatus(step, ownerId)
  if (status === 'closed') return 'read'
  if (status !== 'open' || !idsOf(step, 'callStackIds').includes(ownerId)) return null

  if (currentIndex !== -1) {
    if (index === currentIndex) return 'current'
    return index < currentIndex ? 'read' : null
  }
  return index <= lastChildPosition(step, ownerId, columns) ? 'read' : null
}

export function dfsListReadState(step, ownerId, neighborId, index) {
  const { graph, currentEdge } = step
  if (step.representation !== 'list' || !hasVertex(graph, ownerId)) return null

  const columns = graph.adjacency[ownerId]
  const isCurrentRow = currentEdge && currentEdge.from === ownerId && hasVertex(graph, currentEdge.to)
  const currentIndex = isCurrentRow ? columns.indexOf(currentEdge.to) : -1
  return rowReadState(step, ownerId, columns, index, currentIndex)
}

export function dfsMatrixReadState(step, rowId, columnId, columnIndex) {
  const { graph, matrixCell } = step
  if (step.representation !== 'matrix' || !hasVertex(graph, rowId)) return null

  const columns = listVertices(graph).map((vertex) => vertex.id)
  const isCurrentRow = matrixCell && matrixCell.rowId === rowId && hasVertex(graph, matrixCell.colId)
  const currentIndex = isCurrentRow ? columns.indexOf(matrixCell.colId) : -1
  return rowReadState(step, rowId, columns, columnIndex, currentIndex)
}

function createElement(document, tag, className, text = null) {
  const element = document.createElement(tag)
  element.className = className
  if (text !== null) element.textContent = text
  return element
}

function appendMarker(document, parent) {
  const marker = createElement(document, 'span', 'graph-entry-marker', '▶')
  marker.setAttribute('aria-hidden', 'true')
  parent.appendChild(marker)
}

// Ngăn xếp gọi là một cột dọc: khung đỉnh ở TRÊN (khác dải hàng đợi nằm ngang của BFS), nhãn chữ "đỉnh"/"đáy".
export function renderDfsStack(listElement, step) {
  const document = listElement.ownerDocument
  const { graph } = step
  const stack = idsOf(step, 'callStackIds')
  const topFirst = [...stack].reverse()

  listElement.replaceChildren()
  if (stack.length === 0) {
    listElement.setAttribute('aria-label', 'Ngăn xếp gọi rỗng.')
    listElement.appendChild(createElement(document, 'li', 'graph-dfs-stack-empty', '(rỗng)'))
    return
  }

  listElement.setAttribute('aria-label', `Ngăn xếp gọi (đỉnh → đáy): ${labelsText(graph, topFirst)}.`)
  topFirst.forEach((id, index) => {
    const label = labelOf(graph, id)
    const item = createElement(document, 'li', 'graph-dfs-stack-item')
    item.dataset.id = id
    item.dataset.label = label

    const isTop = index === 0
    if (isTop) {
      item.classList.add('is-current')
      item.setAttribute('aria-current', 'true')
      appendMarker(document, item)
    }
    item.appendChild(createElement(document, 'span', 'graph-dfs-stack-call', `DFS(${label})`))
    item.appendChild(createElement(document, 'span', 'graph-dfs-stack-time', `vào ${stampText(stampOf(step, 'discovery', id))}`))

    const tags = [isTop ? 'đỉnh' : null, index === topFirst.length - 1 ? 'đáy' : null].filter(Boolean)
    if (tags.length > 0) item.appendChild(createElement(document, 'span', 'graph-dfs-stack-tag', tags.join(' · ')))
    listElement.appendChild(item)
  })
}

// Thứ tự thăm (visitedIds, lúc vào); đỉnh của ngăn xếp có ▶ và aria-current.
export function renderDfsOrder(listElement, step) {
  const document = listElement.ownerDocument
  const { graph } = step
  const order = idsOf(step, 'visitedIds')

  listElement.replaceChildren()
  if (order.length === 0) {
    listElement.setAttribute('aria-label', 'Thứ tự thăm (lúc vào): chưa có.')
    listElement.appendChild(createElement(document, 'li', 'graph-dfs-order-empty', '(chưa có)'))
    return
  }

  listElement.setAttribute('aria-label', `Thứ tự thăm (lúc vào): ${labelsText(graph, order)}.`)
  for (const id of order) {
    const item = createElement(document, 'li', 'graph-dfs-order-item')
    item.dataset.id = id
    item.dataset.label = labelOf(graph, id)
    if (id === step.currentVertexId) {
      item.classList.add('is-current')
      item.setAttribute('aria-current', 'true')
      appendMarker(document, item)
    }
    item.append(labelOf(graph, id))
    listElement.appendChild(item)
  }
}

// Bảng vào / ra / parent / trạng thái: mỗi đỉnh một hàng. Ở bước "gọi DFS(w)" w đã có parent nhưng còn "chưa thăm"
// (visited đánh dấu ở bước "vào w" ngay sau): đây là chủ ý, khớp mã giả "parent[w] ← u; DFS(w)".
export function renderDfsTable(table, step) {
  const document = table.ownerDocument
  const { graph } = step
  const cell = (tag, text, attributes = {}) => {
    const element = document.createElement(tag)
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value)
    element.textContent = text
    return element
  }

  table.replaceChildren(cell('caption', 'Mốc vào / ra (t tăng 1 mỗi lần vào và mỗi lần ra) và đỉnh cha; — là chưa có.'))
  const headRow = document.createElement('tr')
  ;['Đỉnh', 'vào', 'ra', 'parent', 'trạng thái'].forEach((text) => headRow.appendChild(cell('th', text, { scope: 'col' })))
  const head = document.createElement('thead')
  head.appendChild(headRow)
  table.appendChild(head)

  const body = document.createElement('tbody')
  for (const vertex of listVertices(graph)) {
    const parentId = step.parentIds?.[vertex.id] ?? null
    const row = document.createElement('tr')
    row.dataset.id = vertex.id
    if (vertex.id === step.currentVertexId) row.classList.add('is-current')
    row.appendChild(cell('th', vertex.label, { scope: 'row' }))
    row.appendChild(cell('td', stampText(stampOf(step, 'discovery', vertex.id))))
    row.appendChild(cell('td', stampText(stampOf(step, 'finish', vertex.id))))
    row.appendChild(cell('td', parentId !== null && hasVertex(graph, parentId) ? labelOf(graph, parentId) : '—'))
    row.appendChild(cell('td', dfsStatusText[dfsVertexStatus(step, vertex.id)]))
    body.appendChild(row)
  }
  table.appendChild(body)
}

// Độ sâu ngăn xếp lớn nhất từ bước 0 tới bước này, suy từ dữ liệu của chính bước: khi vào v, ngăn xếp có đúng
// (độ dài chuỗi parent từ v về nguồn) khung, nên lấy max trên các đỉnh đã thăm. Đỉnh lạ bị bỏ qua.
export function dfsMaxDepthSoFar(step) {
  const visited = idsOf(step, 'visitedIds')
  // Giới hạn số bước đi lên bằng số đỉnh đã thăm để dữ liệu hỏng (parent vòng) không làm treo.
  const depthOf = (id) => {
    let depth = 0
    let current = id
    while (current !== null && hasVertex(step.graph, current) && depth <= visited.length) {
      depth++
      current = step.parentIds?.[current] ?? null
    }
    return depth
  }
  return visited.reduce((max, id) => Math.max(max, depthOf(id)), 0)
}

// Số lần gọi DFS tới bước này = số đỉnh đã thăm (mỗi lần vào một đỉnh là một lần gọi).
export function formatCallCount(step) {
  return step.operation === 'dfs' ? String(idsOf(step, 'visitedIds').length) : '—'
}

// Số đo DFS cho Learning Panel: số lần gọi (= R khi xong), reads và độ sâu ngăn xếp của bước đang hiển thị.
// Chỉ bước cuối mới kết luận Big-O; giữa chừng chỉ ghi số đã đếm. Không phải bước DFS thì trả null.
export function describeDfsCost(step) {
  if (step.operation !== 'dfs') return null

  const { graph } = step
  const isList = step.representation === 'list'
  const source = hasVertex(graph, step.sourceId) ? labelOf(graph, step.sourceId) : 's'
  const representation = isList ? 'danh sách kề' : 'ma trận kề'
  const calls = idsOf(step, 'visitedIds').length
  const depth = dfsMaxDepthSoFar(step)

  if (!step.finished) {
    return `DFS từ ${source} đang chạy (${representation}): đã ${calls} lần gọi, đã đọc ${step.reads} `
      + `${isList ? 'phần tử' : 'ô'}, ngăn xếp gọi sâu nhất tới bước này ${depth} khung.`
  }

  const vertexCount = listVertices(graph).length
  const cost = isList
    ? `${step.reads} phần tử đã đọc (tổng bậc${graph.directed ? ' ra' : ''} của ${calls} đỉnh tới được) → O(V + E)`
    : `${step.reads} ô đã đọc = R·V = ${calls}·${vertexCount} (tối đa V² = ${vertexCount * vertexCount}) → O(V²)`
  return `DFS từ ${source} (${representation}): R = ${calls} lần gọi + ${cost}. `
    + `Ngăn xếp gọi sâu nhất ${depth} khung (tối đa V = ${vertexCount}) → bộ nhớ phụ O(V).`
}

export function formatDfsResult(step) {
  if (!step.finished || step.result === null) return 'Chưa có'
  const order = idsOf(step, 'visitedIds')
  return `Tới được ${order.length}/${listVertices(step.graph).length} đỉnh: ${labelsText(step.graph, order)}`
}
