import { listVertices } from '../structures/graph.js'
import {
  createGraphStepFactory, labelOf, representationNames, snapshotOf, validateQuery,
} from './graphStep.js'

// Liệt kê đỉnh kề của u và tính bậc (có hướng: đỉnh kề ra, bậc ra; bậc vào không thuộc thao tác này).
// Danh sách kề: mỗi w trong Adj[u] một bước ghi nhận (reads +1) → Θ(deg(u)).
// Ma trận kề: mỗi ô của hàng u một bước đọc (reads +1), ô bằng 1 thêm một bước ghi nhận → Θ(V).
// Bước "deg ← 0" và "return deg" không đọc gì nên không tăng reads. result = bậc (số nguyên).
export const listNeighborsPseudocode = [
  'deg ← 0',
  'for each w in Adj[u]:',
  '  ghi nhận w; deg ← deg + 1',
  'return deg',
]

export const matrixNeighborsPseudocode = [
  'deg ← 0',
  'for each w in V:',
  '  if M[u][w] = 1:',
  '    ghi nhận w; deg ← deg + 1',
  'return deg',
]

const LIST_LINE = { init: 1, record: 3, finish: 4 }
const MATRIX_LINE = { init: 1, read: 3, record: 4, finish: 5 }

function openingSteps(graph, vertexId, representation, createStep, line) {
  const label = labelOf(graph, vertexId)
  const source = representation === 'matrix' ? `hàng ${label} của ma trận kề` : `Adj[${label}]`

  return [
    createStep({
      graph: snapshotOf(graph),
      message: `Liệt kê đỉnh kề của ${label} bằng ${representationNames[representation]}.`,
    }),
    createStep({
      graph: snapshotOf(graph),
      pseudocodeLine: line,
      message: `Khởi tạo deg = 0, bắt đầu duyệt ${source}.`,
    }),
  ]
}

function finishStep(graph, vertexId, createStep, line, state) {
  const label = labelOf(graph, vertexId)
  const names = state.outputIds.map((id) => labelOf(graph, id)).join(', ')

  return createStep({
    graph: snapshotOf(graph),
    outputIds: [...state.outputIds],
    reads: state.reads,
    pseudocodeLine: line,
    message: state.outputIds.length === 0
      ? `${label} không có đỉnh kề: deg = 0 (đã đọc ${state.reads}).`
      : `Đỉnh kề của ${label}: ${names}; deg = ${state.outputIds.length} (đã đọc ${state.reads}).`,
    finished: true,
    result: state.outputIds.length,
  })
}

function listSteps(graph, vertexId, createStep) {
  const steps = openingSteps(graph, vertexId, 'list', createStep, LIST_LINE.init)
  const state = { outputIds: [], reads: 0 }

  for (const neighborId of graph.adjacency[vertexId]) {
    state.reads++
    state.outputIds.push(neighborId)

    steps.push(createStep({
      graph: snapshotOf(graph),
      currentVertexId: neighborId,
      currentEdge: { from: vertexId, to: neighborId },
      outputIds: [...state.outputIds],
      reads: state.reads,
      pseudocodeLine: LIST_LINE.record,
      message: `Ghi nhận ${labelOf(graph, neighborId)}: deg = ${state.outputIds.length}.`,
    }))
  }

  steps.push(finishStep(graph, vertexId, createStep, LIST_LINE.finish, state))
  return steps
}

function matrixSteps(graph, vertexId, createStep) {
  const steps = openingSteps(graph, vertexId, 'matrix', createStep, MATRIX_LINE.init)
  const state = { outputIds: [], reads: 0 }
  const row = graph.adjacency[vertexId]
  const label = labelOf(graph, vertexId)

  for (const { id: columnId } of listVertices(graph)) {
    state.reads++
    const isEdge = row.includes(columnId)
    const cell = {
      graph: snapshotOf(graph),
      currentVertexId: columnId,
      currentEdge: isEdge ? { from: vertexId, to: columnId } : null,
      matrixCell: { rowId: vertexId, colId: columnId },
      reads: state.reads,
    }

    steps.push(createStep({
      ...cell,
      outputIds: [...state.outputIds],
      pseudocodeLine: MATRIX_LINE.read,
      message: `M[${label}][${labelOf(graph, columnId)}] = ${isEdge ? 1 : 0}`
        + `${isEdge ? ': có cạnh.' : ': bỏ qua.'}`,
    }))

    if (!isEdge) continue

    state.outputIds.push(columnId)
    steps.push(createStep({
      ...cell,
      graph: snapshotOf(graph),
      outputIds: [...state.outputIds],
      pseudocodeLine: MATRIX_LINE.record,
      message: `Ghi nhận ${labelOf(graph, columnId)}: deg = ${state.outputIds.length}.`,
    }))
  }

  steps.push(finishStep(graph, vertexId, createStep, MATRIX_LINE.finish, state))
  return steps
}

export function generateGraphNeighborsSteps(graph, vertexId, representation) {
  validateQuery(graph, representation, [vertexId])
  const createStep = createGraphStepFactory('neighbors', { representation, sourceId: vertexId })

  return representation === 'matrix'
    ? matrixSteps(graph, vertexId, createStep)
    : listSteps(graph, vertexId, createStep)
}
