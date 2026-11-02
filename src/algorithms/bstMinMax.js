import { createBstStepFactory } from './bstStep.js'

// Sinh các bước tìm giá trị nhỏ nhất (đi trái mãi) hoặc lớn nhất (đi phải mãi).
// Kiểm tra cur.left != null không phải phép so sánh khóa nên comparisons giữ 0;
// chi phí O(h) thể hiện ở số nút đã xét (pathIds).
export const bstMinMaxPseudocode = {
  min: [
    'if root == null: return null',
    'cur = root',
    'while cur.left != null',
    '    cur = cur.left',
    'return cur',
  ],
  max: [
    'if root == null: return null',
    'cur = root',
    'while cur.right != null',
    '    cur = cur.right',
    'return cur',
  ],
}

const LINE = {
  EMPTY: 1,
  START: 2,
  GO_DOWN: 4,
  RESULT: 5,
}

export function generateBstMinMaxSteps(tree, kind) {
  if (!Object.hasOwn(bstMinMaxPseudocode, kind)) {
    throw new RangeError(`Thao tác không hợp lệ: ${kind}.`)
  }

  const side = kind === 'min' ? 'left' : 'right'
  const label = kind === 'min' ? 'nhỏ nhất' : 'lớn nhất'
  const createStep = createBstStepFactory(kind, null)
  const steps = [createStep({ tree, message: `Bắt đầu tìm giá trị ${label}.` })]

  if (tree.rootId === null) {
    steps.push(createStep({
      tree,
      pseudocodeLine: LINE.EMPTY,
      finished: true,
      result: null,
      message: `Cây rỗng nên không có giá trị ${label}.`,
    }))

    return steps
  }

  let currentId = tree.rootId
  const pathIds = [currentId]

  steps.push(createStep({
    tree,
    currentId,
    pathIds: [...pathIds],
    pseudocodeLine: LINE.START,
    message: `Bắt đầu ở gốc ${tree.nodes[currentId].value}.`,
  }))

  while (tree.nodes[currentId][side] !== null) {
    currentId = tree.nodes[currentId][side]
    pathIds.push(currentId)

    steps.push(createStep({
      tree,
      currentId,
      pathIds: [...pathIds],
      pseudocodeLine: LINE.GO_DOWN,
      message: `Còn con ${side === 'left' ? 'trái' : 'phải'} nên đi xuống ${tree.nodes[currentId].value}.`,
    }))
  }

  const value = tree.nodes[currentId].value

  steps.push(createStep({
    tree,
    currentId,
    foundId: currentId,
    pathIds: [...pathIds],
    pseudocodeLine: LINE.RESULT,
    finished: true,
    result: value,
    message: `Giá trị ${label} là ${value}.`,
  }))

  return steps
}
