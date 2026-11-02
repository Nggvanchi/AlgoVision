// Đồ thị đơn (không cạnh trùng, không khuyên) dạng snapshot thuần:
// { directed, vertices: { id: { id, slot, label } }, adjacency: { id: [id đỉnh kề, …] }, nextId }.
// - Đỉnh định danh bằng id chuỗi ổn định ('v1', 'v2', …) không cấp lại; cạnh định danh bằng cặp id (from, to).
// - slot: số nguyên nhỏ nhất ≥ 0 chưa dùng lúc thêm đỉnh. Layout đặt đỉnh theo slot nên đỉnh cũ không đổi chỗ;
//   label suy ra từ slot (A, B, …). Xóa đỉnh rồi thêm lại thì dùng lại slot và nhãn, nhưng id mới.
// - Danh sách kề luôn sắp theo slot tăng dần, để thứ tự duyệt tất định và khớp thứ tự hàng của ma trận.
// - Vô hướng lưu cả hai chiều: v ∈ Adj[u] ⇔ u ∈ Adj[v]. Ma trận kề không lưu mà suy ra (toAdjacencyMatrix).
// Mọi hàm không sửa đồ thị đầu vào; đồ thị trả về là bản sao độc lập (không chia sẻ mảng hay đối tượng đỉnh).
// Tầng này không giới hạn số đỉnh; giới hạn 8 đỉnh và nhãn A–H do tầng giao diện quyết định.

export function labelForSlot(slot) {
  return slot < 26 ? String.fromCharCode(65 + slot) : `V${slot}`
}

export function createGraph(directed = false) {
  if (typeof directed !== 'boolean') {
    throw new TypeError('Cờ directed của đồ thị phải là boolean.')
  }

  return { directed, vertices: {}, adjacency: {}, nextId: 1 }
}

export function cloneGraph(graph) {
  return {
    ...graph,
    vertices: Object.fromEntries(Object.entries(graph.vertices).map(([id, vertex]) => [id, { ...vertex }])),
    adjacency: Object.fromEntries(Object.entries(graph.adjacency).map(([id, list]) => [id, [...list]])),
  }
}

export function hasVertex(graph, id) {
  return Object.hasOwn(graph.vertices, id)
}

function requireVertex(graph, id) {
  if (!hasVertex(graph, id)) {
    throw new RangeError(`Đỉnh ${id} không có trong đồ thị.`)
  }
}

export function listVertices(graph) {
  return Object.values(graph.vertices).sort((first, second) => first.slot - second.slot)
}

export function countVertices(graph) {
  return Object.keys(graph.vertices).length
}

// Tổng độ dài các danh sách kề: E nếu có hướng, 2E nếu vô hướng.
function countListEntries(graph) {
  return Object.values(graph.adjacency).reduce((total, list) => total + list.length, 0)
}

export function countEdges(graph) {
  const entries = countListEntries(graph)
  return graph.directed ? entries : entries / 2
}

// Số ô nhớ của danh sách kề: V đầu danh sách + mọi phần tử (V + E có hướng, V + 2E vô hướng).
export function adjacencyListSize(graph) {
  return countVertices(graph) + countListEntries(graph)
}

export function hasEdge(graph, from, to) {
  return hasVertex(graph, from) && graph.adjacency[from].includes(to)
}

export function neighbors(graph, id) {
  requireVertex(graph, id)
  return [...graph.adjacency[id]]
}

export function outDegree(graph, id) {
  requireVertex(graph, id)
  return graph.adjacency[id].length
}

export function inDegree(graph, id) {
  requireVertex(graph, id)
  return Object.values(graph.adjacency).filter((list) => list.includes(id)).length
}

function nextFreeSlot(graph) {
  const used = new Set(Object.values(graph.vertices).map((vertex) => vertex.slot))
  let slot = 0
  while (used.has(slot)) slot++
  return slot
}

export function addVertex(graph) {
  const next = cloneGraph(graph)
  const id = `v${graph.nextId}`
  const slot = nextFreeSlot(graph)

  next.vertices[id] = { id, slot, label: labelForSlot(slot) }
  next.adjacency[id] = []
  next.nextId = graph.nextId + 1
  return { graph: next, id }
}

// Xóa đỉnh và mọi cạnh liên quan: cạnh đi ra (Adj[id]) và cạnh đi vào (id trong danh sách của đỉnh khác).
export function removeVertex(graph, id) {
  const next = cloneGraph(graph)
  if (!hasVertex(graph, id)) return { graph: next, removed: false }

  delete next.vertices[id]
  delete next.adjacency[id]
  for (const ownerId of Object.keys(next.adjacency)) {
    next.adjacency[ownerId] = next.adjacency[ownerId].filter((neighborId) => neighborId !== id)
  }
  return { graph: next, removed: true }
}

// Chèn id vào danh sách kề sao cho danh sách vẫn sắp theo slot.
function insertBySlot(graph, list, id) {
  const slot = graph.vertices[id].slot
  const position = list.findIndex((neighborId) => graph.vertices[neighborId].slot > slot)
  if (position === -1) list.push(id)
  else list.splice(position, 0, id)
}

function edgeRejection(graph, from, to) {
  if (!hasVertex(graph, from) || !hasVertex(graph, to)) return 'missing-vertex'
  if (from === to) return 'self-loop'
  if (hasEdge(graph, from, to)) return 'duplicate'
  return null
}

export function addEdge(graph, from, to) {
  const next = cloneGraph(graph)
  const reason = edgeRejection(graph, from, to)
  if (reason) return { graph: next, added: false, reason }

  insertBySlot(next, next.adjacency[from], to)
  if (!graph.directed) insertBySlot(next, next.adjacency[to], from)
  return { graph: next, added: true, reason: null }
}

export function removeEdge(graph, from, to) {
  const next = cloneGraph(graph)
  if (!hasEdge(graph, from, to)) return { graph: next, removed: false }

  next.adjacency[from] = next.adjacency[from].filter((id) => id !== to)
  if (!graph.directed) {
    next.adjacency[to] = next.adjacency[to].filter((id) => id !== from)
  }
  return { graph: next, removed: true }
}

// Ma trận kề suy ra từ danh sách kề: ids theo slot, cells[i][j] = 1 nếu có cạnh ids[i] → ids[j].
export function toAdjacencyMatrix(graph) {
  const ids = listVertices(graph).map((vertex) => vertex.id)
  const cells = ids.map((rowId) => ids.map((columnId) => (graph.adjacency[rowId].includes(columnId) ? 1 : 0)))
  return { ids, cells }
}

// Dựng đồ thị từ số đỉnh và các cặp chỉ số slot [[u, v], …] (dùng cho preset và test).
export function buildGraph(directed, vertexCount, pairs) {
  let graph = createGraph(directed)
  const ids = []

  for (let index = 0; index < vertexCount; index++) {
    const result = addVertex(graph)
    graph = result.graph
    ids.push(result.id)
  }

  for (const [from, to] of pairs) {
    if (!ids[from] || !ids[to]) {
      throw new RangeError(`Cặp slot [${from}, ${to}] nằm ngoài ${vertexCount} đỉnh.`)
    }
    graph = addEdge(graph, ids[from], ids[to]).graph
  }

  return graph
}
