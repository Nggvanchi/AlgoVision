import { hasEdge } from '../structures/graph.js'
import {
  createGraphStepFactory, edgeText, labelOf, representationNames, snapshotOf, validateQuery,
} from './graphStep.js'

// Kiểm tra u có kề v không (có hướng: có cạnh u → v không).
// Danh sách kề: so v với từng w trong Adj[u] (reads +1 mỗi lần), dừng ở w = v; hết danh sách thì kết luận false.
// Ma trận kề: đọc đúng một ô M[u][v] (reads = 1).
export const listHasEdgePseudocode = [
  'for each w in Adj[u]:',
  '  if w = v: return true',
  'return false',
]

export const matrixHasEdgePseudocode = ['return M[u][v] = 1']

const LIST_LINE = { compare: 2, notFound: 3 }
const MATRIX_LINE = { read: 1 }

function listSteps(graph, from, to, createStep) {
  const steps = []
  let reads = 0

  steps.push(createStep({
    graph: snapshotOf(graph),
    message: `Kiểm tra ${edgeText(graph, from, to)} bằng ${representationNames.list}: duyệt Adj[${labelOf(graph, from)}].`,
  }))

  for (const neighborId of graph.adjacency[from]) {
    reads++
    const isMatch = neighborId === to

    steps.push(createStep({
      graph: snapshotOf(graph),
      currentVertexId: neighborId,
      currentEdge: { from, to: neighborId },
      reads,
      pseudocodeLine: LIST_LINE.compare,
      message: isMatch
        ? `So sánh ${labelOf(graph, neighborId)} với ${labelOf(graph, to)}: bằng nhau, có cạnh ${edgeText(graph, from, to)}.`
        : `So sánh ${labelOf(graph, neighborId)} với ${labelOf(graph, to)}: khác, xét phần tử tiếp theo.`,
      ...(isMatch ? { finished: true, result: true } : {}),
    }))

    if (isMatch) return steps
  }

  steps.push(createStep({
    graph: snapshotOf(graph),
    reads,
    pseudocodeLine: LIST_LINE.notFound,
    message: `Đã đọc hết Adj[${labelOf(graph, from)}] (${reads} phần tử): không có cạnh ${edgeText(graph, from, to)}.`,
    finished: true,
    result: false,
  }))
  return steps
}

function matrixSteps(graph, from, to, createStep) {
  const isEdge = hasEdge(graph, from, to)

  return [
    createStep({
      graph: snapshotOf(graph),
      message: `Kiểm tra ${edgeText(graph, from, to)} bằng ${representationNames.matrix}: đọc một ô.`,
    }),
    createStep({
      graph: snapshotOf(graph),
      matrixCell: { rowId: from, colId: to },
      currentEdge: isEdge ? { from, to } : null,
      reads: 1,
      pseudocodeLine: MATRIX_LINE.read,
      message: `M[${labelOf(graph, from)}][${labelOf(graph, to)}] = ${isEdge ? 1 : 0}: `
        + `${isEdge ? 'có' : 'không có'} cạnh ${edgeText(graph, from, to)}.`,
      finished: true,
      result: isEdge,
    }),
  ]
}

export function generateGraphHasEdgeSteps(graph, from, to, representation) {
  validateQuery(graph, representation, [from, to])
  const createStep = createGraphStepFactory('has-edge', { representation, sourceId: from, targetId: to })

  return representation === 'matrix'
    ? matrixSteps(graph, from, to, createStep)
    : listSteps(graph, from, to, createStep)
}
