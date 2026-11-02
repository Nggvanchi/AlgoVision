import { createBstStepFactory } from './bstStep.js'

// Sinh các bước duyệt cây (đệ quy). Mỗi bước sau bước 0 là một lần visit: output tăng đúng 1 phần tử.
// Chưa minh họa ngăn xếp đệ quy; bước chỉ ghi lại thời điểm thăm nút.
export const bstTraversalPseudocode = {
  inorder: [
    'inorder(node):',
    '    if node == null: return',
    '    inorder(node.left)',
    '    visit(node)',
    '    inorder(node.right)',
  ],
  preorder: [
    'preorder(node):',
    '    if node == null: return',
    '    visit(node)',
    '    preorder(node.left)',
    '    preorder(node.right)',
  ],
  postorder: [
    'postorder(node):',
    '    if node == null: return',
    '    postorder(node.left)',
    '    postorder(node.right)',
    '    visit(node)',
  ],
}

const ORDER_NAMES = {
  inorder: 'Inorder (trái, gốc, phải)',
  preorder: 'Preorder (gốc, trái, phải)',
  postorder: 'Postorder (trái, phải, gốc)',
}

const LINE = {
  EMPTY: 2,
  VISIT: { inorder: 4, preorder: 3, postorder: 5 },
}

export function generateBstTraversalSteps(tree, order) {
  if (!Object.hasOwn(bstTraversalPseudocode, order)) {
    throw new RangeError(`Kiểu duyệt không hợp lệ: ${order}.`)
  }

  const createStep = createBstStepFactory(order, null)
  const steps = [createStep({ tree, message: `Bắt đầu duyệt ${ORDER_NAMES[order]} từ gốc.` })]

  if (tree.rootId === null) {
    steps.push(createStep({
      tree,
      pseudocodeLine: LINE.EMPTY,
      finished: true,
      result: [],
      message: 'Cây rỗng nên không có nút nào để thăm.',
    }))

    return steps
  }

  const output = []
  const visitedIds = []

  const visit = (nodeId) => {
    const node = tree.nodes[nodeId]
    output.push(node.value)
    visitedIds.push(nodeId)

    steps.push(createStep({
      tree,
      currentId: nodeId,
      pathIds: [...visitedIds],
      output: [...output],
      pseudocodeLine: LINE.VISIT[order],
      message: `Thăm ${node.value}.`,
    }))
  }

  const walk = (nodeId) => {
    if (nodeId === null) {
      return
    }

    const node = tree.nodes[nodeId]

    if (order === 'preorder') visit(nodeId)
    walk(node.left)
    if (order === 'inorder') visit(nodeId)
    walk(node.right)
    if (order === 'postorder') visit(nodeId)
  }

  walk(tree.rootId)

  const last = steps.at(-1)
  last.finished = true
  last.result = [...output]
  last.message = `${last.message} Đã thăm đủ ${output.length} nút: ${output.join(', ')}.`

  return steps
}
