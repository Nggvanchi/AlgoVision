import { validateValue } from '../structures/bst.js'
import { createBstStepFactory } from './bstStep.js'

// Sinh các bước tìm x trên BST. Mỗi bước sau bước 0 là một lần xét nút (so sánh ba nhánh tính là 1),
// riêng bước kết luận "không tìm thấy" thì không so sánh (giống Binary Search).
export const bstSearchPseudocode = [
  'cur = root',
  'while cur != null',
  '    if x == cur.value: return cur',
  '    if x < cur.value: cur = cur.left',
  '    else: cur = cur.right',
  'return null',
]

const LINE = {
  FOUND: 3,
  GO_LEFT: 4,
  GO_RIGHT: 5,
  NOT_FOUND: 6,
}

export function generateBstSearchSteps(tree, value) {
  validateValue(value)

  const createStep = createBstStepFactory('search', value)
  const steps = [createStep({ tree, message: `Bắt đầu tìm ${value} từ gốc.` })]
  const pathIds = []
  let comparisons = 0
  let currentId = tree.rootId

  while (currentId !== null) {
    const node = tree.nodes[currentId]
    pathIds.push(currentId)
    comparisons++

    if (value === node.value) {
      steps.push(createStep({
        tree,
        currentId,
        foundId: currentId,
        pathIds: [...pathIds],
        comparisons,
        pseudocodeLine: LINE.FOUND,
        finished: true,
        result: 'found',
        message: `Đã tìm thấy ${value}.`,
      }))

      return steps
    }

    const goLeft = value < node.value
    const nextId = goLeft ? node.left : node.right
    const sideName = goLeft ? 'trái' : 'phải'
    const comparison = `${value} ${goLeft ? 'nhỏ hơn' : 'lớn hơn'} ${node.value}`

    steps.push(createStep({
      tree,
      currentId,
      pathIds: [...pathIds],
      comparisons,
      pseudocodeLine: goLeft ? LINE.GO_LEFT : LINE.GO_RIGHT,
      message: nextId === null
        ? `${comparison} nhưng ${node.value} không có con ${sideName}.`
        : `${comparison} nên đi sang con ${sideName}.`,
    }))

    currentId = nextId
  }

  steps.push(createStep({
    tree,
    pathIds: [...pathIds],
    comparisons,
    pseudocodeLine: LINE.NOT_FOUND,
    finished: true,
    result: 'not-found',
    message: `Không tìm thấy ${value} trong cây.`,
  }))

  return steps
}
