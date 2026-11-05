import { getNodeCount, insertValue, validateValue } from '../structures/bst.js'
import { createBstStepFactory } from './bstStep.js'
import { assertWithinStepLimit } from './stepLimit.js'

// Sinh các bước chèn x vào BST (cài bằng vòng lặp). Mỗi nút trên đường đi có một bước so sánh
// (tăng comparisons đúng 1), sau đó là bước đi xuống hoặc bước chèn (không so sánh thêm).
// comparisons cuối = số nút từ gốc tới cha của nút mới; cây rỗng = 0; trùng ở độ sâu d = d + 1.
export const bstInsertPseudocode = [
  'if root == null',
  '    root = new Node(x); return',
  'cur = root',
  'while true',
  '    if x == cur.value: return      // đã tồn tại',
  '    if x < cur.value',
  '        if cur.left == null: cur.left = new Node(x); return',
  '        cur = cur.left',
  '    else',
  '        if cur.right == null: cur.right = new Node(x); return',
  '        cur = cur.right',
]

const LINE = {
  CREATE_ROOT: 2,
  DUPLICATE: 5,
  COMPARE: 6,
  INSERT_LEFT: 7,
  GO_LEFT: 8,
  INSERT_RIGHT: 10,
  GO_RIGHT: 11,
}

// Số bước: 1 (bắt đầu) + 2 bước mỗi nút trên đường đi (so sánh, rồi đi xuống hoặc chèn; trùng chỉ 1) ≤ 2n + 1.
// Cây rỗng: 2 bước (bắt đầu, tạo gốc), trả về trước vòng lặp.
export function bstInsertStepLimit(tree) {
  return Math.max(2, 2 * getNodeCount(tree) + 1)
}

export function generateBstInsertSteps(tree, value) {
  validateValue(value)
  const limit = bstInsertStepLimit(tree)

  const createStep = createBstStepFactory('insert', value)
  const steps = [createStep({ tree, message: `Bắt đầu chèn ${value}.` })]
  const { tree: finalTree, id: newId } = insertValue(tree, value)

  if (tree.rootId === null) {
    steps.push(createStep({
      tree: finalTree,
      currentId: newId,
      foundId: newId,
      pseudocodeLine: LINE.CREATE_ROOT,
      finished: true,
      result: 'inserted',
      message: `Cây rỗng nên ${value} trở thành gốc.`,
    }))

    return steps
  }

  const pathIds = []
  let comparisons = 0
  let currentId = tree.rootId

  while (true) {
    assertWithinStepLimit(steps, limit, 'BST Insert')
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
        pseudocodeLine: LINE.DUPLICATE,
        finished: true,
        result: 'duplicate',
        message: `${value} đã có trong cây nên không chèn.`,
      }))

      return steps
    }

    const goLeft = value < node.value
    const side = goLeft ? 'left' : 'right'
    const sideName = goLeft ? 'trái' : 'phải'

    steps.push(createStep({
      tree,
      currentId,
      pathIds: [...pathIds],
      comparisons,
      pseudocodeLine: LINE.COMPARE,
      message: `${value} ${goLeft ? 'nhỏ hơn' : 'lớn hơn'} ${node.value} nên xét nhánh ${sideName}.`,
    }))

    const childId = node[side]

    if (childId === null) {
      steps.push(createStep({
        tree: finalTree,
        currentId: newId,
        foundId: newId,
        pathIds: [...pathIds],
        comparisons,
        pseudocodeLine: goLeft ? LINE.INSERT_LEFT : LINE.INSERT_RIGHT,
        finished: true,
        result: 'inserted',
        message: `Nhánh ${sideName} của ${node.value} trống: chèn ${value} làm con ${sideName}.`,
      }))

      return steps
    }

    currentId = childId
    steps.push(createStep({
      tree,
      currentId,
      pathIds: [...pathIds],
      comparisons,
      pseudocodeLine: goLeft ? LINE.GO_LEFT : LINE.GO_RIGHT,
      message: `Đi xuống con ${sideName}: ${tree.nodes[childId].value}.`,
    }))
  }
}
