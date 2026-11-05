import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGraph, listVertices } from '../src/structures/graph.js'
import * as bfsModule from '../src/algorithms/graphBfs.js'
import * as dfsModule from '../src/algorithms/graphDfs.js'

// Giới hạn số bước = công thức số bước với R = V (mọi đỉnh tới được), D = tổng độ dài danh sách kề
// (E có hướng, 2E vô hướng): BFS danh sách 2V + D + 2, ma trận 2V + V² + 2; DFS danh sách 3V + D, ma trận 3V + V².
const SAMPLE_PAIRS = [[0, 1], [0, 2], [1, 2], [2, 3], [4, 5]]
const COMPLETE_PAIRS = []
for (let u = 0; u < 6; u++) {
  for (let v = u + 1; v < 6; v++) COMPLETE_PAIRS.push([u, v])
}
const graphs = {
  'Mẫu vô hướng (V 7, E 5)': () => buildGraph(false, 7, SAMPLE_PAIRS),
  'Mẫu có hướng (V 7, E 6)': () => buildGraph(true, 7, [...SAMPLE_PAIRS, [2, 0]]),
  'K6 vô hướng (V 6, E 15)': () => buildGraph(false, 6, COMPLETE_PAIRS),
  'Đường có hướng 5 đỉnh (V 5, E 4)': () => buildGraph(true, 5, [[0, 1], [1, 2], [2, 3], [3, 4]]),
  'Một đỉnh (V 1, E 0)': () => buildGraph(false, 1, []),
}

test('giới hạn số bước BFS/DFS theo số dò tay: Mẫu vô hướng, Mẫu có hướng, K6, một đỉnh', () => {
  const limits = (graph) => [
    bfsModule.bfsStepLimit(graph, 'list'), bfsModule.bfsStepLimit(graph, 'matrix'),
    dfsModule.dfsStepLimit(graph, 'list'), dfsModule.dfsStepLimit(graph, 'matrix'),
  ]
  // Mẫu vô hướng: V 7, D 10 → BFS 14 + 10 + 2 = 26, 14 + 49 + 2 = 65; DFS 21 + 10 = 31, 21 + 49 = 70.
  assert.deepEqual(limits(graphs['Mẫu vô hướng (V 7, E 5)']()), [26, 65, 31, 70])
  // Mẫu có hướng: V 7, D 6 → BFS 22, 65; DFS 27, 70.
  assert.deepEqual(limits(graphs['Mẫu có hướng (V 7, E 6)']()), [22, 65, 27, 70])
  // K6: V 6, D 30 → BFS 12 + 30 + 2 = 44, 12 + 36 + 2 = 50; DFS 18 + 30 = 48, 18 + 36 = 54.
  assert.deepEqual(limits(graphs['K6 vô hướng (V 6, E 15)']()), [44, 50, 48, 54])
  // Một đỉnh: BFS 2 + 0 + 2 = 4, 2 + 1 + 2 = 5; DFS 3, 4.
  assert.deepEqual(limits(graphs['Một đỉnh (V 1, E 0)']()), [4, 5, 3, 4])
})

for (const [name, build] of Object.entries(graphs)) {
  test(`${name}: mọi nguồn × 2 biểu diễn, số bước ≤ giới hạn; tới được mọi đỉnh thì đúng bằng giới hạn`, () => {
    const graph = build()
    const vertexCount = listVertices(graph).length
    for (const { id } of listVertices(graph)) {
      for (const representation of ['list', 'matrix']) {
        const cases = [
          ['BFS', bfsModule.generateGraphBfsSteps(graph, id, representation), bfsModule.bfsStepLimit(graph, representation)],
          ['DFS', dfsModule.generateGraphDfsSteps(graph, id, representation), dfsModule.dfsStepLimit(graph, representation)],
        ]
        for (const [operation, steps, limit] of cases) {
          const where = `${operation} ${representation} từ ${graph.vertices[id].label}`
          assert.ok(steps.length <= limit, `${where}: ${steps.length} bước vượt giới hạn ${limit}`)
          if (steps.at(-1).result.reachable === vertexCount) {
            assert.equal(steps.length, limit, `${where}: tới được cả ${vertexCount} đỉnh nên phải đúng bằng giới hạn`)
          }
        }
      }
    }
  })
}
