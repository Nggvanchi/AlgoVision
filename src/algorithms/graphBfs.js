import { countVertices, listVertices } from '../structures/graph.js'
import {
  createGraphStepFactory, labelOf, maxTraversalReads, representationNames, snapshotOf, validateQuery,
} from './graphStep.js'
import { assertWithinStepLimit } from './stepLimit.js'

// BFS từ một nguồn s (không chạy tiếp các thành phần liên thông khác). Có hướng: chỉ đi theo cạnh ra.
// Đánh dấu visited lúc ENQUEUE, nên mỗi đỉnh vào hàng đợi đúng một lần và dist gán một lần là đúng ngay.
// Trường thêm vào khuôn bước Graph (mọi tham chiếu là id đỉnh):
// - visitedIds: đỉnh đã đánh dấu theo thứ tự đánh dấu (chỉ tăng; độ dài = số lần enqueue);
// - frontierIds: hàng đợi, đầu hàng ở index 0;
// - orderIds: thứ tự lấy khỏi hàng đợi (chỉ tăng; độ dài = số lần dequeue);
// - distance { id: số | null }, parentIds { id: id | null }: key cho mọi đỉnh, null cho tới khi đỉnh được đánh dấu.
// currentVertexId = u vừa dequeue; currentEdge = (u, w) có thật đang xét; matrixCell = ô M[u][w] đang đọc.
// reads: danh sách = số phần tử Adj[u] đã đọc (tổng = tổng bậc ra của các đỉnh tới được);
// ma trận = số ô đã đọc (V ô mỗi lần dequeue, tổng = R·V). Khởi tạo, dequeue, enqueue, return không tăng reads.
// Dòng while (2) và for (4) không có bước riêng; mỗi lần đọc w là một bước ở dòng 5.
// result (bước cuối) = { reachable: số đỉnh tới được từ s }.
export const listBfsPseudocode = [
  'visited[s] ← true; dist[s] ← 0; Q ← [s]',
  'while Q không rỗng:',
  '  u ← dequeue(Q)',
  '  for each w in Adj[u]:',
  '    if not visited[w]:',
  '      visited[w] ← true; dist[w] ← dist[u] + 1; parent[w] ← u; enqueue(Q, w)',
  'return dist, parent',
]

export const matrixBfsPseudocode = [
  'visited[s] ← true; dist[s] ← 0; Q ← [s]',
  'while Q không rỗng:',
  '  u ← dequeue(Q)',
  '  for each w in V:',
  '    if M[u][w] = 1 and not visited[w]:',
  '      visited[w] ← true; dist[w] ← dist[u] + 1; parent[w] ← u; enqueue(Q, w)',
  'return dist, parent',
]

const LINE = { init: 1, dequeue: 3, check: 5, enqueue: 6, finish: 7 }

const nullForEveryVertex = (graph) => Object.fromEntries(listVertices(graph).map((vertex) => [vertex.id, null]))

// Bản sao trạng thái cho một bước: mỗi bước giữ mảng/đối tượng riêng, không chia sẻ với bước khác.
function stateFields(graph, state) {
  return {
    graph: snapshotOf(graph),
    visitedIds: [...state.visited],
    frontierIds: [...state.queue],
    orderIds: [...state.order],
    distance: { ...state.distance },
    parentIds: { ...state.parent },
    reads: state.reads,
  }
}

const queueText = (graph, queue) => (queue.length === 0 ? '(rỗng)' : queue.map((id) => labelOf(graph, id)).join(', '))

function visit(state, vertexId, parentId) {
  state.visited.push(vertexId)
  state.queue.push(vertexId)
  state.distance[vertexId] = parentId === null ? 0 : state.distance[parentId] + 1
  state.parent[vertexId] = parentId
}

function enqueueStep(graph, state, createStep, cursor, neighborId) {
  const { vertexId } = cursor
  visit(state, neighborId, vertexId)
  const label = labelOf(graph, neighborId)

  return createStep({
    ...stateFields(graph, state),
    ...cursor.fields,
    pseudocodeLine: LINE.enqueue,
    message: `Đánh dấu ${label}: dist[${label}] = ${state.distance[neighborId]}, parent[${label}] = ${labelOf(graph, vertexId)}; `
      + `đưa ${label} vào cuối hàng đợi.`,
  })
}

// Danh sách kề: mỗi w trong Adj[u] là một lần đọc.
function scanList(graph, state, createStep, vertexId, steps) {
  for (const neighborId of graph.adjacency[vertexId]) {
    state.reads++
    const fields = { currentVertexId: vertexId, currentEdge: { from: vertexId, to: neighborId } }
    const label = labelOf(graph, neighborId)
    const visited = state.visited.includes(neighborId)

    steps.push(createStep({
      ...stateFields(graph, state),
      ...fields,
      pseudocodeLine: LINE.check,
      message: visited ? `${label} đã được đánh dấu: bỏ qua.` : `${label} chưa được đánh dấu.`,
    }))
    if (!visited) steps.push(enqueueStep(graph, state, createStep, { vertexId, fields }, neighborId))
  }
}

// Ma trận kề: mỗi ô của hàng u là một lần đọc (V ô), kể cả ô bằng 0.
function scanMatrix(graph, state, createStep, vertexId, steps) {
  const rowLabel = labelOf(graph, vertexId)

  for (const { id: columnId } of listVertices(graph)) {
    state.reads++
    const isEdge = graph.adjacency[vertexId].includes(columnId)
    const fields = {
      currentVertexId: vertexId,
      currentEdge: isEdge ? { from: vertexId, to: columnId } : null,
      matrixCell: { rowId: vertexId, colId: columnId },
    }
    const label = labelOf(graph, columnId)
    const visited = state.visited.includes(columnId)
    const cell = `M[${rowLabel}][${label}]`
    let message = `${cell} = 0: bỏ qua.`
    if (isEdge) message = visited ? `${cell} = 1, ${label} đã được đánh dấu: bỏ qua.` : `${cell} = 1, ${label} chưa được đánh dấu.`

    steps.push(createStep({ ...stateFields(graph, state), ...fields, pseudocodeLine: LINE.check, message }))
    if (isEdge && !visited) steps.push(enqueueStep(graph, state, createStep, { vertexId, fields }, columnId))
  }
}

// Số bước: danh sách 2R + D + 2, ma trận 2R + R·V + 2 (R = số đỉnh tới được, D = tổng bậc ra của R đỉnh).
// Giới hạn cho chốt an toàn: thay R = V và D = tổng độ dài danh sách kề (lần chạy đúng không bao giờ vượt).
export function bfsStepLimit(graph, representation) {
  return 2 * countVertices(graph) + maxTraversalReads(graph, representation) + 2
}

export function generateGraphBfsSteps(graph, sourceId, representation) {
  validateQuery(graph, representation, [sourceId])
  const limit = bfsStepLimit(graph, representation)

  const createStep = createGraphStepFactory('bfs', { representation, sourceId }, {
    visitedIds: [],
    frontierIds: [],
    orderIds: [],
    distance: {},
    parentIds: {},
  })
  const state = {
    visited: [],
    queue: [],
    order: [],
    distance: nullForEveryVertex(graph),
    parent: nullForEveryVertex(graph),
    reads: 0,
  }
  const sourceLabel = labelOf(graph, sourceId)
  const scan = representation === 'matrix' ? scanMatrix : scanList

  const steps = [createStep({
    ...stateFields(graph, state),
    message: `BFS từ ${sourceLabel} bằng ${representationNames[representation]}.`,
  })]

  visit(state, sourceId, null)
  steps.push(createStep({
    ...stateFields(graph, state),
    pseudocodeLine: LINE.init,
    message: `Đánh dấu ${sourceLabel}, dist[${sourceLabel}] = 0, đưa ${sourceLabel} vào hàng đợi.`,
  }))

  while (state.queue.length > 0) {
    assertWithinStepLimit(steps, limit, 'BFS')
    const vertexId = state.queue.shift()
    state.order.push(vertexId)
    steps.push(createStep({
      ...stateFields(graph, state),
      currentVertexId: vertexId,
      pseudocodeLine: LINE.dequeue,
      message: `Q không rỗng: lấy ${labelOf(graph, vertexId)} khỏi đầu hàng đợi (dist = ${state.distance[vertexId]}). `
        + `Hàng đợi còn: ${queueText(graph, state.queue)}.`,
    }))
    scan(graph, state, createStep, vertexId, steps)
  }

  const reachable = state.order.length
  steps.push(createStep({
    ...stateFields(graph, state),
    pseudocodeLine: LINE.finish,
    message: `Hàng đợi rỗng: BFS kết thúc. Tới được ${reachable}/${listVertices(graph).length} đỉnh từ ${sourceLabel} `
      + `(đã đọc ${state.reads}).`,
    finished: true,
    result: { reachable },
  }))
  return steps
}
