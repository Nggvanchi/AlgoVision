// Layout xếp tròn cho Graph (hàm thuần). Đỉnh đặt theo slot trên 8 vị trí cố định nên thêm/xóa đỉnh
// không làm đỉnh khác đổi chỗ. Slot k ở góc -90° + 45°·k quanh tâm (150, 150), bán kính quỹ đạo 115.
// Mọi đỉnh nằm trên một đường tròn nên dây cung giữa hai đỉnh không đi qua đỉnh thứ ba:
// gần nhất là cạnh slot k – k+2, cách đỉnh k+1 khoảng R(1 − cos 45°) ≈ 33,7px > bán kính đỉnh 18px.
// Cạnh được cắt lùi bán kính đỉnh ở hai đầu để không đè lên nhãn.
// Có hướng mà có cả u→v và v→u: mỗi chiều là một đường cong bậc hai, điểm điều khiển lệch 12px theo pháp tuyến
// (phía bên trái của chiều đi), nên hai chiều nằm hai phía; đường cong lệch tối đa 6px khỏi dây cung.
// Tọa độ làm tròn 1 chữ số bằng Number(x.toFixed(1)) để giống nhau trên mọi nền tảng.
export const GRAPH_LAYOUT = {
  size: 300,
  center: 150,
  orbitRadius: 115,
  vertexRadius: 18,
  curveOffset: 12,
  slotCount: 8,
}

const round = (value) => Number(value.toFixed(1))

function slotPosition(slot) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= GRAPH_LAYOUT.slotCount) {
    throw new RangeError(`Slot ${slot} nằm ngoài ${GRAPH_LAYOUT.slotCount} vị trí của layout.`)
  }

  const angle = (-90 + (360 / GRAPH_LAYOUT.slotCount) * slot) * (Math.PI / 180)
  return {
    x: round(GRAPH_LAYOUT.center + GRAPH_LAYOUT.orbitRadius * Math.cos(angle)),
    y: round(GRAPH_LAYOUT.center + GRAPH_LAYOUT.orbitRadius * Math.sin(angle)),
  }
}

// Điểm cách `from` một đoạn `length` theo hướng tới `toward`.
function pointToward(from, toward, length) {
  const dx = toward.x - from.x
  const dy = toward.y - from.y
  const norm = Math.hypot(dx, dy)
  return { x: round(from.x + (dx / norm) * length), y: round(from.y + (dy / norm) * length) }
}

function curveControl(start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const norm = Math.hypot(dx, dy)
  return {
    x: round((start.x + end.x) / 2 + (dy / norm) * GRAPH_LAYOUT.curveOffset),
    y: round((start.y + end.y) / 2 - (dx / norm) * GRAPH_LAYOUT.curveOffset),
  }
}

function layoutEdge(graph, positions, from, to) {
  const start = positions[from]
  const end = positions[to]
  const curved = graph.directed && graph.adjacency[to].includes(from)
  const control = curved ? curveControl(start, end) : null
  const radius = GRAPH_LAYOUT.vertexRadius

  return {
    from,
    to,
    arrow: graph.directed,
    control,
    start: pointToward(start, control ?? end, radius),
    end: pointToward(end, control ?? start, radius),
  }
}

// Danh sách cạnh cần vẽ: có hướng mỗi cung một cạnh; vô hướng mỗi cặp một cạnh, from là đỉnh slot nhỏ hơn.
function edgePairs(graph) {
  return Object.values(graph.vertices)
    .sort((first, second) => first.slot - second.slot)
    .flatMap((vertex) => graph.adjacency[vertex.id]
      .filter((to) => graph.directed || graph.vertices[to].slot > vertex.slot)
      .map((to) => [vertex.id, to]))
}

export function layoutGraph(graph) {
  const positions = Object.fromEntries(
    Object.values(graph.vertices).map((vertex) => [vertex.id, slotPosition(vertex.slot)]),
  )

  return {
    width: GRAPH_LAYOUT.size,
    height: GRAPH_LAYOUT.size,
    vertexRadius: GRAPH_LAYOUT.vertexRadius,
    vertices: positions,
    edges: edgePairs(graph).map(([from, to]) => layoutEdge(graph, positions, from, to)),
  }
}
