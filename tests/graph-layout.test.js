import test from 'node:test'
import assert from 'node:assert/strict'
import { addEdge, addVertex, buildGraph, listVertices, removeVertex } from '../src/structures/graph.js'
import * as layoutModule from '../src/graph-layout.js'

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(deepFreeze)
  }
  return value
}

const SAMPLE_PAIRS = [[0, 1], [0, 2], [1, 2], [2, 3], [4, 5]]
const VERTEX_RADIUS = 18
const CURVE_OFFSET = 12

const completePairs = (count) => {
  const pairs = []
  for (let u = 0; u < count; u++) {
    for (let v = u + 1; v < count; v++) pairs.push([u, v])
  }
  return pairs
}
const layout = (graph) => layoutModule.layoutGraph(graph)
const idOf = (graph, label) => listVertices(graph).find((vertex) => vertex.label === label).id
const distance = (first, second) => Math.hypot(first.x - second.x, first.y - second.y)

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)))
  return distance(point, { x: start.x + t * dx, y: start.y + t * dy })
}

function quadraticPoint(start, control, end, t) {
  const mix = (a, b, c) => (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t ** 2 * c
  return { x: mix(start.x, control.x, end.x), y: mix(start.y, control.y, end.y) }
}

test('8 slot cố định: tâm (150, 150), R = 115, slot k ở góc -90° + 45°·k, làm tròn 1 chữ số', () => {
  const graph = buildGraph(false, 8, [])
  const positions = listVertices(graph).map((vertex) => layout(graph).vertices[vertex.id])

  assert.deepEqual(positions, [
    { x: 150, y: 35 },
    { x: 231.3, y: 68.7 },
    { x: 265, y: 150 },
    { x: 231.3, y: 231.3 },
    { x: 150, y: 265 },
    { x: 68.7, y: 231.3 },
    { x: 35, y: 150 },
    { x: 68.7, y: 68.7 },
  ])
  assert.equal(layout(graph).width, 300)
  assert.equal(layout(graph).height, 300)
  assert.equal(layout(graph).vertexRadius, VERTEX_RADIUS)
})

test('vị trí chỉ phụ thuộc slot: xóa C rồi thêm đỉnh mới vào slot 2, đỉnh khác không đổi chỗ', () => {
  const sample = buildGraph(false, 7, SAMPLE_PAIRS)
  const before = layout(sample).vertices
  const removed = removeVertex(sample, idOf(sample, 'C')).graph
  const added = addVertex(removed)
  const after = layout(added.graph).vertices

  for (const vertex of listVertices(removed)) {
    assert.deepEqual(after[vertex.id], before[vertex.id], `${vertex.label} bị đổi chỗ`)
  }
  assert.deepEqual(after[added.id], before[idOf(sample, 'C')])
  assert.notEqual(added.id, idOf(sample, 'C'))
})

test('vô hướng: mỗi cặp một cạnh thẳng, không mũi tên; from là đỉnh slot nhỏ hơn', () => {
  const graph = buildGraph(false, 7, SAMPLE_PAIRS)
  const { edges } = layout(graph)

  assert.equal(edges.length, 5)
  for (const edge of edges) {
    assert.equal(edge.arrow, false)
    assert.equal(edge.control, null)
    assert.ok(graph.vertices[edge.from].slot < graph.vertices[edge.to].slot)
  }
  assert.deepEqual(edges.map((edge) => [edge.from, edge.to]), [
    ['v1', 'v2'], ['v1', 'v3'], ['v2', 'v3'], ['v3', 'v4'], ['v5', 'v6'],
  ])
})

test('đầu cạnh được cắt lùi đúng bán kính đỉnh (18px), cả cạnh thẳng lẫn cạnh cong', () => {
  for (const graph of [buildGraph(false, 8, completePairs(8)), buildGraph(true, 3, [[0, 1], [1, 0], [1, 2]])]) {
    const { vertices, edges } = layout(graph)
    for (const edge of edges) {
      assert.ok(Math.abs(distance(edge.start, vertices[edge.from]) - VERTEX_RADIUS) <= 0.1)
      assert.ok(Math.abs(distance(edge.end, vertices[edge.to]) - VERTEX_RADIUS) <= 0.1)
    }
  }
})

test('cạnh thẳng (K8 vô hướng): mọi đỉnh cách mọi cạnh không kề nó ≥ 33px', () => {
  const graph = buildGraph(false, 8, completePairs(8))
  const { vertices, edges } = layout(graph)
  let minimum = Infinity

  assert.equal(edges.length, 28)
  for (const edge of edges) {
    for (const vertex of listVertices(graph)) {
      if (vertex.id === edge.from || vertex.id === edge.to) continue
      minimum = Math.min(minimum, distanceToSegment(vertices[vertex.id], vertices[edge.from], vertices[edge.to]))
    }
  }
  // R(1 − cos 45°) ≈ 33,7 (cạnh slot k – k+2, đỉnh k+1).
  assert.ok(minimum >= 33, `khoảng cách nhỏ nhất ${minimum}`)
})

test('cạnh thẳng một chiều (K8 có hướng, mọi cung u→v với slot u < v): mọi đỉnh cách mọi cạnh không kề nó ≥ 33px', () => {
  const graph = buildGraph(true, 8, completePairs(8))
  const { vertices, edges } = layout(graph)
  let minimum = Infinity

  assert.equal(edges.length, 28)
  for (const edge of edges) {
    assert.equal(edge.arrow, true)
    assert.equal(edge.control, null)
    for (const vertex of listVertices(graph)) {
      if (vertex.id === edge.from || vertex.id === edge.to) continue
      minimum = Math.min(minimum, distanceToSegment(vertices[vertex.id], vertices[edge.from], vertices[edge.to]))
    }
  }
  assert.ok(minimum >= 33, `khoảng cách nhỏ nhất ${minimum}`)
})

test('có hướng: cả u→v và v→u thì hai đường cong, điểm điều khiển lệch ±12px theo pháp tuyến; một chiều vẽ thẳng', () => {
  const graph = buildGraph(true, 3, [[0, 1], [1, 0], [1, 2]])
  const { vertices, edges } = layout(graph)
  const find = (from, to) => edges.find((edge) => edge.from === from && edge.to === to)
  const forward = find('v1', 'v2')
  const backward = find('v2', 'v1')
  const oneWay = find('v2', 'v3')

  assert.equal(edges.length, 3)
  edges.forEach((edge) => assert.equal(edge.arrow, true))
  assert.equal(oneWay.control, null)

  const a = vertices.v1
  const b = vertices.v2
  const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  for (const edge of [forward, backward]) {
    const offset = { x: edge.control.x - middle.x, y: edge.control.y - middle.y }
    assert.ok(Math.abs(Math.hypot(offset.x, offset.y) - CURVE_OFFSET) <= 0.1)
    // Vuông góc với dây cung A–B.
    assert.ok(Math.abs(offset.x * (b.x - a.x) + offset.y * (b.y - a.y)) <= 0.1 * distance(a, b))
  }
  // Hai điểm điều khiển nằm hai phía đối xứng qua trung điểm.
  assert.ok(Math.abs(forward.control.x + backward.control.x - 2 * middle.x) <= 0.2)
  assert.ok(Math.abs(forward.control.y + backward.control.y - 2 * middle.y) <= 0.2)
})

// Ngưỡng 27px (không phải 33px như cạnh thẳng): điểm điều khiển lệch 12px nên đỉnh vồng của đường cong bậc hai
// lệch 6px khỏi dây cung; vồng về phía đỉnh k+1 thì còn R(1 − cos 45°) − 6 ≈ 27,7px, vẫn dư ~9,7px so với
// bán kính đỉnh 18px. Đã chọn lệch 12px cho điểm điều khiển (đỉnh vồng lệch 12px sẽ chỉ còn ~21,7px).
test('cạnh cong (K8 có hướng hai chiều): đường cong lệch tối đa 6px khỏi dây cung, mọi đỉnh khác cách ≥ 27px', () => {
  const pairs = completePairs(8).flatMap(([u, v]) => [[u, v], [v, u]])
  const graph = buildGraph(true, 8, pairs)
  const { vertices, edges } = layout(graph)
  let minimum = Infinity

  assert.equal(edges.length, 56)
  for (const edge of edges) {
    const center = { start: vertices[edge.from], end: vertices[edge.to] }
    for (let step = 0; step <= 50; step++) {
      const point = quadraticPoint(center.start, edge.control, center.end, step / 50)
      assert.ok(distanceToSegment(point, center.start, center.end) <= CURVE_OFFSET / 2 + 0.1)
      for (const vertex of listVertices(graph)) {
        if (vertex.id === edge.from || vertex.id === edge.to) continue
        minimum = Math.min(minimum, distance(point, vertices[vertex.id]))
      }
    }
  }
  assert.ok(minimum >= 27, `khoảng cách nhỏ nhất ${minimum}`)
})

test('đồ thị rỗng cho layout rỗng; slot ngoài 8 vị trí bị từ chối', () => {
  const empty = layout(buildGraph(false, 0, []))
  assert.deepEqual(empty.vertices, {})
  assert.deepEqual(empty.edges, [])

  assert.throws(() => layout(buildGraph(false, 9, [])), RangeError)
})

test('layout không sửa đồ thị đầu vào', () => {
  const graph = deepFreeze(addEdge(buildGraph(true, 4, [[0, 1], [1, 0]]), 'v3', 'v4').graph)
  const result = layout(graph)

  assert.equal(result.edges.length, 3)
})
