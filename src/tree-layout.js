// Tính tọa độ vẽ cây nhị phân (thuần, không đụng DOM).
// x = thứ hạng inorder × độ rộng cột: mỗi nút một cột nên không bao giờ chồng nhau,
// và trục x giữ đúng thứ tự BST. y = độ sâu × chiều cao hàng.
// Duyệt theo con trỏ left/right chứ không dò theo giá trị, vì cây ở bước chép successor
// của Delete có giá trị trùng tạm thời.
export const TREE_LAYOUT = Object.freeze({
  COLUMN_WIDTH: 40,
  ROW_HEIGHT: 56,
  NODE_RADIUS: 16,
})

export function computeTreeLayout(tree) {
  const { COLUMN_WIDTH, ROW_HEIGHT } = TREE_LAYOUT
  const positions = {}
  let rank = 0
  let maxDepth = -1

  const place = (nodeId, depth) => {
    if (nodeId === null) {
      return
    }

    const node = tree.nodes[nodeId]

    place(node.left, depth + 1)
    positions[nodeId] = {
      x: rank * COLUMN_WIDTH + COLUMN_WIDTH / 2,
      y: depth * ROW_HEIGHT + ROW_HEIGHT / 2,
    }
    rank++
    maxDepth = Math.max(maxDepth, depth)
    place(node.right, depth + 1)
  }

  place(tree.rootId, 0)

  return {
    positions,
    width: rank * COLUMN_WIDTH,
    height: (maxDepth + 1) * ROW_HEIGHT,
  }
}
