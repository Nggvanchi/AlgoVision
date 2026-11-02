// Cây nhị phân tìm kiếm dạng snapshot thuần: { rootId, nodes: { id: { id, value, left, right } }, nextId }.
// Nút được tham chiếu bằng id ổn định chứ không bằng giá trị, để khi xóa nút có hai con
// (chép giá trị successor vào nút z) giao diện vẫn tô đúng nút z.
// Mọi hàm không thay đổi cây đầu vào. Cây không chứa giá trị trùng.
// Tầng này chỉ yêu cầu số nguyên; giới hạn 1–99 và 15 nút do tầng giao diện quyết định.

export function validateValue(value) {
  if (!Number.isInteger(value)) {
    throw new TypeError('Giá trị của nút BST phải là số nguyên.')
  }
}

export function createTree() {
  return { rootId: null, nodes: {}, nextId: 1 }
}

export function cloneTree(tree) {
  const nodes = {}

  for (const [id, node] of Object.entries(tree.nodes)) {
    nodes[id] = { ...node }
  }

  return { rootId: tree.rootId, nodes, nextId: tree.nextId }
}

export function getNodeCount(tree) {
  return Object.keys(tree.nodes).length
}

export function findNodeId(tree, value) {
  let currentId = tree.rootId

  while (currentId !== null) {
    const node = tree.nodes[currentId]

    if (value === node.value) {
      return currentId
    }

    currentId = value < node.value ? node.left : node.right
  }

  return null
}

// Trả về { tree, inserted, id }. Giá trị đã tồn tại thì inserted = false, cây giữ nguyên.
export function insertValue(tree, value) {
  validateValue(value)

  const existingId = findNodeId(tree, value)

  if (existingId !== null) {
    return { tree, inserted: false, id: existingId }
  }

  const nextTree = cloneTree(tree)
  const id = nextTree.nextId

  nextTree.nodes[id] = { id, value, left: null, right: null }
  nextTree.nextId = id + 1

  if (nextTree.rootId === null) {
    nextTree.rootId = id
    return { tree: nextTree, inserted: true, id }
  }

  let parent = nextTree.nodes[nextTree.rootId]

  while (true) {
    const side = value < parent.value ? 'left' : 'right'

    if (parent[side] === null) {
      parent[side] = id
      return { tree: nextTree, inserted: true, id }
    }

    parent = nextTree.nodes[parent[side]]
  }
}

export function buildTree(values) {
  return values.reduce(
    (tree, value) => insertValue(tree, value).tree,
    createTree(),
  )
}

// Chiều cao tính bằng số cạnh: cây rỗng là -1, cây một nút là 0.
export function getHeight(tree, nodeId = tree.rootId) {
  if (nodeId === null) {
    return -1
  }

  const node = tree.nodes[nodeId]

  return 1 + Math.max(getHeight(tree, node.left), getHeight(tree, node.right))
}

export function getDepth(tree, nodeId) {
  if (!tree.nodes[nodeId]) {
    return -1
  }

  let depth = 0
  let currentId = tree.rootId

  while (currentId !== null && currentId !== nodeId) {
    const node = tree.nodes[currentId]
    currentId = tree.nodes[nodeId].value < node.value ? node.left : node.right
    depth++
  }

  return currentId === null ? -1 : depth
}

export function toInorderIds(tree, nodeId = tree.rootId, ids = []) {
  if (nodeId === null) {
    return ids
  }

  const node = tree.nodes[nodeId]

  toInorderIds(tree, node.left, ids)
  ids.push(nodeId)
  toInorderIds(tree, node.right, ids)

  return ids
}

export function toInorderValues(tree) {
  return toInorderIds(tree).map((id) => tree.nodes[id].value)
}

// Hợp lệ khi: mọi nút đều nối được từ gốc, mỗi nút nằm trong khoảng (min, max)
// do tổ tiên quy định (so sánh nghiêm ngặt nên không có giá trị trùng).
export function isValidBst(tree) {
  const visited = new Set()

  const check = (nodeId, min, max) => {
    if (nodeId === null) {
      return true
    }

    const node = tree.nodes[nodeId]

    if (!node || visited.has(nodeId)) {
      return false
    }

    visited.add(nodeId)

    if (node.value <= min || node.value >= max) {
      return false
    }

    return check(node.left, min, node.value) && check(node.right, node.value, max)
  }

  return check(tree.rootId, -Infinity, Infinity) && visited.size === getNodeCount(tree)
}
