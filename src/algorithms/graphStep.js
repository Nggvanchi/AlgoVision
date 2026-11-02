import { cloneGraph, hasVertex } from '../structures/graph.js'

// Khuôn bước chung cho mọi thao tác minh họa trên Graph (truy vấn ở PR Graph; BFS/DFS dùng lại qua extraDefaults).
// Các trường lưu dữ liệu, tầng hiển thị lo định dạng chữ. Mọi id là id đỉnh ('v1', …), không phải nhãn.
// graph: bản sao đồ thị riêng của bước (không chia sẻ với bước khác hay với đầu vào).
// operation, representation ('list' | 'matrix'), sourceId (u), targetId (v hoặc null): đầu vào, hằng ở mọi bước.
// currentVertexId: đỉnh đang xét. currentEdge { from, to }: cạnh có thật đang xét, hoặc null.
// matrixCell { rowId, colId }: ô ma trận đang đọc, hoặc null. outputIds: đỉnh đã ghi nhận, chỉ tăng.
// reads: số phần tử danh sách kề hoặc số ô ma trận đã đọc; bước kết luận không tăng.
// result: null cho tới bước cuối.
export const REPRESENTATIONS = ['list', 'matrix']

export function createGraphStepFactory(operation, { representation, sourceId, targetId = null }, extraDefaults = {}) {
  return (fields) => ({
    graph: null,
    operation,
    representation,
    sourceId,
    targetId,
    currentVertexId: null,
    currentEdge: null,
    matrixCell: null,
    outputIds: [],
    reads: 0,
    pseudocodeLine: null,
    message: '',
    finished: false,
    result: null,
    ...extraDefaults,
    ...fields,
  })
}

export function validateQuery(graph, representation, vertexIds) {
  if (!REPRESENTATIONS.includes(representation)) {
    throw new RangeError(`Cách biểu diễn không hợp lệ: ${representation}`)
  }
  for (const id of vertexIds) {
    if (!hasVertex(graph, id)) throw new RangeError(`Đỉnh ${id} không có trong đồ thị.`)
  }
}

// Mỗi bước nhận một bản sao đồ thị riêng: sửa bước này không ảnh hưởng bước khác hay đồ thị đầu vào.
export const snapshotOf = (graph) => cloneGraph(graph)

export const labelOf = (graph, id) => graph.vertices[id].label

export function edgeText(graph, from, to) {
  return `${labelOf(graph, from)} ${graph.directed ? '→' : '–'} ${labelOf(graph, to)}`
}

export const representationNames = { list: 'danh sách kề', matrix: 'ma trận kề' }
