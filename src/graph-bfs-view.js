import { hasEdge, hasVertex, listVertices } from './structures/graph.js'
import { labelOf } from './algorithms/graphStep.js'

// Phần hiển thị riêng của BFS: hàm thuần suy trạng thái vẽ từ bước, và vẽ hàng đợi / thứ tự xử lý / bảng dist–parent.
// Mọi thứ đọc từ step.graph của bước đang hiển thị; id không có trong đồ thị đó bị bỏ qua (không tô, không lỗi).
// File này KHÔNG import src/graph.js (graph.js import file này) để tránh vòng import.
// Bước nhàn rỗi (chưa sinh bước) có thể thiếu các trường BFS nên mọi trường đều có giá trị mặc định rỗng.

const knownIn = (graph) => (id) => hasVertex(graph, id)
const idsOf = (step, field) => (step[field] ?? []).filter(knownIn(step.graph))
const distanceOf = (step, id) => step.distance?.[id] ?? null

export function formatDistance(value) {
  return value === null || value === undefined ? '—' : String(value)
}

// doneIds: đỉnh đã lấy khỏi hàng đợi, trừ u đang xử lý (u mang ▶; bước cuối không còn u nên mọi đỉnh đều ✓).
// queuedIds: đỉnh đang trong hàng đợi. badges: nhãn cạnh đỉnh — nguồn "s·0" (bước 0: "s"), đỉnh đã đánh dấu "d=k".
export function bfsVertexMarks(step) {
  const doneIds = new Set(idsOf(step, 'orderIds').filter((id) => id !== step.currentVertexId))
  const queuedIds = new Set(idsOf(step, 'frontierIds'))
  const badges = new Map()

  for (const { id } of listVertices(step.graph)) {
    const distance = distanceOf(step, id)
    if (id === step.sourceId) badges.set(id, distance === null ? 's' : `s·${distance}`)
    else if (distance !== null) badges.set(id, `d=${distance}`)
  }
  return { doneIds, queuedIds, badges }
}

// Cạnh cây BFS: dùng chung với DFS (graph-traversal-view.js); giữ tên cũ để không đổi API của file này.
export { treeEdges as bfsTreeEdges, isTreeEdge as isBfsTreeEdge } from './graph-traversal-view.js'

// Hàng của đỉnh đã xử lý xong (đã lấy ra, không phải u) đã đọc hết; hàng u đọc tới vị trí đang xét.
function rowReadState(step, ownerId, index, currentIndex) {
  if (!idsOf(step, 'orderIds').includes(ownerId)) return null
  if (ownerId !== step.currentVertexId) return 'read'
  if (currentIndex === -1) return null
  if (index === currentIndex) return 'current'
  return index < currentIndex ? 'read' : null
}

export function bfsListReadState(step, ownerId, neighborId, index) {
  const { graph, currentEdge } = step
  if (step.representation !== 'list' || !hasVertex(graph, ownerId)) return null

  const isCurrentRow = currentEdge && currentEdge.from === ownerId && hasEdge(graph, currentEdge.from, currentEdge.to)
  const currentIndex = isCurrentRow ? graph.adjacency[ownerId].indexOf(currentEdge.to) : -1
  return rowReadState(step, ownerId, index, currentIndex)
}

export function bfsMatrixReadState(step, rowId, columnId, columnIndex) {
  const { graph, matrixCell } = step
  if (step.representation !== 'matrix' || !hasVertex(graph, rowId)) return null

  const isCurrentRow = matrixCell && matrixCell.rowId === rowId && hasVertex(graph, matrixCell.colId)
  const currentIndex = isCurrentRow ? listVertices(graph).findIndex((vertex) => vertex.id === matrixCell.colId) : -1
  return rowReadState(step, rowId, columnIndex, currentIndex)
}

function createItem(document, className, text) {
  const item = document.createElement('li')
  item.className = className
  item.textContent = text
  return item
}

const labelsText = (graph, ids) => ids.map((id) => labelOf(graph, id)).join(', ')

// Dải hàng đợi nằm ngang: đầu hàng bên trái, đầu/cuối có nhãn chữ.
export function renderBfsQueue(listElement, step) {
  const document = listElement.ownerDocument
  const { graph } = step
  const queue = idsOf(step, 'frontierIds')

  listElement.replaceChildren()
  if (queue.length === 0) {
    listElement.setAttribute('aria-label', 'Hàng đợi rỗng.')
    listElement.appendChild(createItem(document, 'graph-bfs-queue-empty', '(rỗng)'))
    return
  }

  listElement.setAttribute('aria-label', `Hàng đợi (đầu → cuối): ${labelsText(graph, queue)}.`)
  queue.forEach((id, index) => {
    const item = document.createElement('li')
    item.className = 'graph-bfs-queue-item'
    item.dataset.id = id

    const label = document.createElement('span')
    label.className = 'graph-bfs-queue-label'
    label.textContent = labelOf(graph, id)
    item.appendChild(label)

    const tags = [index === 0 ? 'đầu' : null, index === queue.length - 1 ? 'cuối' : null].filter(Boolean)
    if (tags.length > 0) {
      const tag = document.createElement('span')
      tag.className = 'graph-bfs-queue-tag'
      tag.textContent = tags.join(' · ')
      item.appendChild(tag)
    }
    listElement.appendChild(item)
  })
}

// Thứ tự lấy khỏi hàng đợi (orderIds); u đang xử lý có ▶ và aria-current.
export function renderBfsOrder(listElement, step) {
  const document = listElement.ownerDocument
  const { graph } = step
  const order = idsOf(step, 'orderIds')

  listElement.replaceChildren()
  if (order.length === 0) {
    listElement.setAttribute('aria-label', 'Đã lấy khỏi hàng đợi (đã xử lý): chưa có.')
    listElement.appendChild(createItem(document, 'graph-bfs-order-empty', '(chưa có)'))
    return
  }

  listElement.setAttribute('aria-label', `Đã lấy khỏi hàng đợi (đã xử lý): ${labelsText(graph, order)}.`)
  for (const id of order) {
    const item = document.createElement('li')
    item.className = 'graph-bfs-order-item'
    item.dataset.id = id
    item.dataset.label = labelOf(graph, id)
    if (id === step.currentVertexId) {
      item.classList.add('is-current')
      item.setAttribute('aria-current', 'true')
      const marker = document.createElement('span')
      marker.className = 'graph-entry-marker'
      marker.setAttribute('aria-hidden', 'true')
      marker.textContent = '▶'
      item.appendChild(marker)
    }
    item.append(labelOf(graph, id))
    listElement.appendChild(item)
  }
}

// Bảng dist / parent: mỗi đỉnh của đồ thị một hàng, chưa tới (hoặc không tới được) là "—".
export function renderBfsTable(table, step) {
  const document = table.ownerDocument
  const { graph } = step
  const cell = (tag, text, attributes = {}) => {
    const element = document.createElement(tag)
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value)
    element.textContent = text
    return element
  }

  table.replaceChildren(cell('caption', 'Khoảng cách từ s và đỉnh cha (— là chưa tới hoặc không tới được).'))
  const headRow = document.createElement('tr')
  ;['Đỉnh', 'dist', 'parent'].forEach((text) => headRow.appendChild(cell('th', text, { scope: 'col' })))
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
    row.appendChild(cell('td', formatDistance(distanceOf(step, vertex.id))))
    row.appendChild(cell('td', parentId !== null && hasVertex(graph, parentId) ? labelOf(graph, parentId) : '—'))
    body.appendChild(row)
  }
  table.appendChild(body)
}

export function formatBfsResult(step) {
  if (!step.finished || step.result === null) return 'Chưa có'
  const order = idsOf(step, 'orderIds')
  return `Tới được ${order.length}/${listVertices(step.graph).length} đỉnh: ${labelsText(step.graph, order)}`
}

// Số đo BFS cho Learning Panel: số lần dequeue (= R khi xong) và reads của bước đang hiển thị.
// Chỉ bước cuối mới kết luận Big-O; giữa chừng chỉ ghi số đã đếm. Không phải bước BFS thì trả null.
export function describeBfsCost(step) {
  if (step.operation !== 'bfs') return null

  const { graph } = step
  const isList = step.representation === 'list'
  const source = hasVertex(graph, step.sourceId) ? labelOf(graph, step.sourceId) : 's'
  const representation = isList ? 'danh sách kề' : 'ma trận kề'
  const dequeues = idsOf(step, 'orderIds').length
  const unit = isList ? 'phần tử' : 'ô'

  if (!step.finished) {
    return `BFS từ ${source} đang chạy (${representation}): đã ${dequeues} lần dequeue, đã đọc ${step.reads} ${unit}.`
  }

  const vertexCount = listVertices(graph).length
  const cost = isList
    ? `${step.reads} phần tử đã đọc (tổng bậc${graph.directed ? ' ra' : ''} của ${dequeues} đỉnh tới được) → O(V + E)`
    : `${step.reads} ô đã đọc = R·V = ${dequeues}·${vertexCount} (tối đa V² = ${vertexCount * vertexCount}) → O(V²)`
  return `BFS từ ${source} (${representation}): R = ${dequeues} lần dequeue + ${cost}. `
    + 'Bộ nhớ phụ O(V): hàng đợi, visited, dist, parent.'
}

export function formatDequeueCount(step) {
  return step.operation === 'bfs' ? String(idsOf(step, 'orderIds').length) : '—'
}
