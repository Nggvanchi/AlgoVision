import { countVertices, listVertices } from '../structures/graph.js'
import {
  createGraphStepFactory, labelOf, maxTraversalReads, representationNames, snapshotOf, validateQuery,
} from './graphStep.js'
import { assertWithinStepLimit } from './stepLimit.js'

// DFS từ một nguồn s (không chạy tiếp các thành phần liên thông khác). Có hướng: chỉ đi theo cạnh ra.
// Cài bằng NGĂN XẾP TƯỜNG MINH (mỗi khung: đỉnh u và vị trí kế tiếp sẽ đọc trong Adj[u] hoặc hàng u của ma trận),
// không đệ quy thật, nhưng thứ tự bước trùng DFS đệ quy: đánh dấu visited LÚC VÀO đỉnh, duyệt đỉnh kề theo thứ tự Adj
// (khớp thứ tự cột ma trận).
// Trường thêm vào khuôn bước Graph (mọi tham chiếu là id đỉnh):
// - visitedIds: thứ tự thăm (lúc vào), chỉ tăng; callStackIds: ngăn xếp gọi, đáy ở index 0, đỉnh ở cuối;
// - finishedIds: thứ tự đóng (lúc ra), chỉ tăng;
// - discovery, finish { id: số | null }: mốc vào/ra, đồng hồ t tăng 1 mỗi lần vào và mỗi lần ra (lớn nhất 2R);
// - parentIds { id: id | null }: gán ở bước "gọi" khi w CHƯA thăm (w được thăm ở bước "vào w" ngay sau).
// Trắng/xám/đen suy ra từ dữ liệu: trắng = chưa thăm, xám = callStackIds, đen = finishedIds.
// currentVertexId = đỉnh của ngăn xếp (null khi rỗng); currentEdge = (u, w) có thật ở bước đọc và bước gọi;
// matrixCell = ô M[u][w] ở bước đọc và bước gọi ngay sau.
// reads: danh sách = số phần tử Adj[u] đã đọc (tổng = tổng bậc ra của các đỉnh tới được); ma trận = số ô đã đọc
// (V ô mỗi đỉnh, tổng = R·V). Vào, gọi, ra không tăng reads.
// Số bước: danh sách 3R + D, ma trận 3R + R·V (bước 0, R lần vào, mỗi lần đọc, R − 1 lần gọi, R lần ra).
// Bước "ra s" là bước cuối (không có bước kết thúc riêng); result = { reachable: R, maxStackDepth: số khung tối đa }.
export const listDfsPseudocode = [
  'DFS(u):',
  '  visited[u] ← true; t ← t + 1; vào[u] ← t',
  '  for each w in Adj[u]:',
  '    if not visited[w]:',
  '      parent[w] ← u; DFS(w)',
  '  t ← t + 1; ra[u] ← t; return',
]

export const matrixDfsPseudocode = [
  'DFS(u):',
  '  visited[u] ← true; t ← t + 1; vào[u] ← t',
  '  for each w in V:',
  '    if M[u][w] = 1 and not visited[w]:',
  '      parent[w] ← u; DFS(w)',
  '  t ← t + 1; ra[u] ← t; return',
]

const LINE = { enter: 2, check: 4, call: 5, finish: 6 }

const nullForEveryVertex = (graph) => Object.fromEntries(listVertices(graph).map((vertex) => [vertex.id, null]))
const labelsText = (graph, ids) => ids.map((id) => labelOf(graph, id)).join(', ')

// Bản sao trạng thái cho một bước: mỗi bước giữ mảng/đối tượng riêng, không chia sẻ với bước khác.
function stateFields(graph, state) {
  const callStackIds = state.stack.map((frame) => frame.vertexId)
  return {
    graph: snapshotOf(graph),
    visitedIds: [...state.visited],
    callStackIds,
    finishedIds: [...state.finished],
    discovery: { ...state.discovery },
    finish: { ...state.finish },
    parentIds: { ...state.parent },
    currentVertexId: callStackIds.at(-1) ?? null,
    reads: state.reads,
  }
}

function enterStep(graph, state, createStep, vertexId) {
  state.stack.push({ vertexId, next: 0 })
  state.maxDepth = Math.max(state.maxDepth, state.stack.length)
  state.visited.push(vertexId)
  state.discovery[vertexId] = ++state.clock
  const label = labelOf(graph, vertexId)

  return createStep({
    ...stateFields(graph, state),
    pseudocodeLine: LINE.enter,
    message: `Vào DFS(${label}): đánh dấu ${label}, vào[${label}] = ${state.discovery[vertexId]}. `
      + `Ngăn xếp (đáy → đỉnh): ${labelsText(graph, state.stack.map((frame) => frame.vertexId))}.`,
  })
}

// Danh sách: đọc phần tử kế tiếp của Adj[u]. Ma trận: đọc ô kế tiếp của hàng u (kể cả ô bằng 0).
function readNext(graph, representation, frame) {
  const { vertexId } = frame
  const columns = representation === 'matrix' ? listVertices(graph).map((vertex) => vertex.id) : graph.adjacency[vertexId]
  if (frame.next >= columns.length) return null

  const neighborId = columns[frame.next++]
  return { neighborId, isEdge: representation === 'list' || graph.adjacency[vertexId].includes(neighborId) }
}

function readMessage(graph, representation, vertexId, neighborId, isEdge, visited) {
  const label = labelOf(graph, neighborId)
  if (representation === 'list') return visited ? `${label} đã được thăm: bỏ qua.` : `${label} chưa được thăm.`

  const cell = `M[${labelOf(graph, vertexId)}][${label}]`
  if (!isEdge) return `${cell} = 0: bỏ qua.`
  return visited ? `${cell} = 1, ${label} đã được thăm: bỏ qua.` : `${cell} = 1, ${label} chưa được thăm.`
}

function finishStep(graph, state, createStep, representation) {
  const { vertexId } = state.stack.pop()
  state.finished.push(vertexId)
  state.finish[vertexId] = ++state.clock
  const label = labelOf(graph, vertexId)
  const scanned = representation === 'matrix' ? `hàng ${label}` : `Adj[${label}]`
  const head = `Đọc hết ${scanned}: ra[${label}] = ${state.finish[vertexId]}`
  const done = state.stack.length === 0

  if (!done) {
    return createStep({
      ...stateFields(graph, state),
      pseudocodeLine: LINE.finish,
      message: `${head}, trả về ${labelOf(graph, state.stack.at(-1).vertexId)}.`,
    })
  }
  const reachable = state.visited.length
  return createStep({
    ...stateFields(graph, state),
    pseudocodeLine: LINE.finish,
    message: `${head}, DFS(${label}) trả về, ngăn xếp rỗng. Đã thăm ${reachable}/${listVertices(graph).length} đỉnh `
      + `(đã đọc ${state.reads}).`,
    finished: true,
    result: { reachable, maxStackDepth: state.maxDepth },
  })
}

// Giới hạn cho chốt an toàn: công thức số bước với R = V và D = tổng độ dài danh sách kề.
export function dfsStepLimit(graph, representation) {
  return 3 * countVertices(graph) + maxTraversalReads(graph, representation)
}

export function generateGraphDfsSteps(graph, sourceId, representation) {
  validateQuery(graph, representation, [sourceId])
  const limit = dfsStepLimit(graph, representation)

  const createStep = createGraphStepFactory('dfs', { representation, sourceId }, {
    visitedIds: [],
    callStackIds: [],
    finishedIds: [],
    discovery: {},
    finish: {},
    parentIds: {},
  })
  const state = {
    stack: [],
    visited: [],
    finished: [],
    discovery: nullForEveryVertex(graph),
    finish: nullForEveryVertex(graph),
    parent: nullForEveryVertex(graph),
    clock: 0,
    reads: 0,
    maxDepth: 0,
  }

  const steps = [createStep({
    ...stateFields(graph, state),
    message: `DFS từ ${labelOf(graph, sourceId)} bằng ${representationNames[representation]}.`,
  })]
  steps.push(enterStep(graph, state, createStep, sourceId))

  while (state.stack.length > 0) {
    assertWithinStepLimit(steps, limit, 'DFS')
    const frame = state.stack.at(-1)
    const read = readNext(graph, representation, frame)
    if (read === null) {
      steps.push(finishStep(graph, state, createStep, representation))
      continue
    }

    const { vertexId } = frame
    const { neighborId, isEdge } = read
    const visited = state.visited.includes(neighborId)
    state.reads++
    const position = {
      currentEdge: isEdge ? { from: vertexId, to: neighborId } : null,
      matrixCell: representation === 'matrix' ? { rowId: vertexId, colId: neighborId } : null,
    }

    steps.push(createStep({
      ...stateFields(graph, state),
      ...position,
      pseudocodeLine: LINE.check,
      message: readMessage(graph, representation, vertexId, neighborId, isEdge, visited),
    }))
    if (!isEdge || visited) continue

    state.parent[neighborId] = vertexId
    steps.push(createStep({
      ...stateFields(graph, state),
      ...position,
      pseudocodeLine: LINE.call,
      message: `parent[${labelOf(graph, neighborId)}] = ${labelOf(graph, vertexId)}; gọi DFS(${labelOf(graph, neighborId)}).`,
    }))
    steps.push(enterStep(graph, state, createStep, neighborId))
  }
  return steps
}
