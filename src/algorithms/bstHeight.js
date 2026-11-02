import { createBstStepFactory } from './bstStep.js'

// Sinh các bước tính chiều cao theo số cạnh (cây rỗng = -1, một nút = 0).
// Theo thứ tự hậu tự: mỗi nút có một bước ở dòng 3 khi đã biết chiều cao của cả hai con.
export const bstHeightPseudocode = [
  'height(node):',
  '    if node == null: return -1',
  '    return 1 + max(height(node.left), height(node.right))',
]

const LINE = {
  EMPTY: 2,
  COMBINE: 3,
}

export function generateBstHeightSteps(tree) {
  const createStep = createBstStepFactory('height', null)
  const steps = [createStep({ tree, message: 'Bắt đầu tính chiều cao (số cạnh trên đường dài nhất từ gốc xuống lá).' })]

  if (tree.rootId === null) {
    steps.push(createStep({
      tree,
      pseudocodeLine: LINE.EMPTY,
      finished: true,
      result: -1,
      message: 'Cây rỗng có chiều cao -1.',
    }))

    return steps
  }

  const heights = {}
  const computedIds = []

  const measure = (nodeId) => {
    if (nodeId === null) {
      return -1
    }

    const node = tree.nodes[nodeId]
    const leftHeight = measure(node.left)
    const rightHeight = measure(node.right)
    const nodeHeight = 1 + Math.max(leftHeight, rightHeight)

    heights[nodeId] = nodeHeight
    computedIds.push(nodeId)

    steps.push(createStep({
      tree,
      currentId: nodeId,
      pathIds: [...computedIds],
      heights: { ...heights },
      pseudocodeLine: LINE.COMBINE,
      message: `Chiều cao của ${node.value} = 1 + max(${leftHeight}, ${rightHeight}) = ${nodeHeight}.`,
    }))

    return nodeHeight
  }

  const treeHeight = measure(tree.rootId)
  const last = steps.at(-1)
  last.finished = true
  last.result = treeHeight
  last.message = `${last.message} Chiều cao của cây là ${treeHeight}.`

  return steps
}
