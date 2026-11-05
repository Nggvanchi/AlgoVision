import { cloneTree, getNodeCount, validateValue } from '../structures/bst.js'
import { createBstStepFactory } from './bstStep.js'
import { assertWithinStepLimit } from './stepLimit.js'

// Sinh các bước xóa x khỏi BST, đủ ba trường hợp; nút hai con dùng successor (nhỏ nhất của cây con phải).
// comparisons đếm giống Search: mỗi nút được xét trên đường tìm z tính 1, gồm cả z.
// Đi tìm successor (s.left != null) không phải phép so sánh khóa nên không tăng comparisons.
// Bước làm một nút biến mất thì đặt foundId/successorId của nút đó về null (không để id treo).
export const bstDeletePseudocode = [
  'z = root, parent = null',
  'while z != null and z.value != x',
  '    parent = z',
  '    z = (x < z.value) ? z.left : z.right',
  'if z == null: return                    // không có x',
  'if z.left == null and z.right == null   // TH1: lá',
  '    thay z bằng null trong parent',
  'else if z.left == null or z.right == null   // TH2: một con',
  '    thay z bằng con duy nhất của z',
  'else                                    // TH3: hai con',
  '    s = z.right; while s.left != null: s = s.left',
  '    z.value = s.value',
  '    xóa s khỏi cây con phải             // s không có con trái',
]

const LINE = {
  GO_DOWN: 4,
  NOT_FOUND: 5,
  CASE_LEAF: 6,
  REMOVE_LEAF: 7,
  CASE_ONE_CHILD: 8,
  LIFT_CHILD: 9,
  CASE_TWO_CHILDREN: 10,
  FIND_SUCCESSOR: 11,
  COPY_SUCCESSOR: 12,
  REMOVE_SUCCESSOR: 13,
}

// Trả về cây mới trong đó nút removedId được thay bằng replacementId (có thể null) dưới parentId.
function replaceNode(tree, parentId, removedId, replacementId) {
  const nextTree = cloneTree(tree)

  if (parentId === null) {
    nextTree.rootId = replacementId
  } else {
    const parent = nextTree.nodes[parentId]
    const side = parent.left === removedId ? 'left' : 'right'
    parent[side] = replacementId
  }

  delete nextTree.nodes[removedId]

  return nextTree
}

function keepExisting(tree, ids) {
  return ids.filter((id) => Object.hasOwn(tree.nodes, id))
}

// Số bước tối đa n + 2: không tìm thấy 1 + k + 1 (k ≤ n nút đã xét); lá 1 + d + 2 với d ≤ n − 1 tổ tiên;
// một con d + 3 với d ≤ n − 2; hai con d + m + 5 (m lần đi trái tìm successor) với d + m + 3 ≤ n
// (tổ tiên, z, z.left, z.right và m nút trên đường tới successor là các nút khác nhau).
export function bstDeleteStepLimit(tree) {
  return getNodeCount(tree) + 2
}

export function generateBstDeleteSteps(tree, value) {
  validateValue(value)
  const limit = bstDeleteStepLimit(tree)

  const createStep = createBstStepFactory('delete', value)
  const steps = [createStep({ tree, message: `Bắt đầu tìm ${value} để xóa.` })]
  const pathIds = []
  let comparisons = 0
  let parentId = null
  let zId = tree.rootId

  while (zId !== null && tree.nodes[zId].value !== value) {
    assertWithinStepLimit(steps, limit, 'BST Delete')
    const node = tree.nodes[zId]
    const goLeft = value < node.value
    pathIds.push(zId)
    comparisons++

    steps.push(createStep({
      tree,
      currentId: zId,
      pathIds: [...pathIds],
      comparisons,
      pseudocodeLine: LINE.GO_DOWN,
      message: `${value} ${goLeft ? 'nhỏ hơn' : 'lớn hơn'} ${node.value} nên đi sang con ${goLeft ? 'trái' : 'phải'}.`,
    }))

    parentId = zId
    zId = goLeft ? node.left : node.right
  }

  if (zId === null) {
    steps.push(createStep({
      tree,
      pathIds: [...pathIds],
      comparisons,
      pseudocodeLine: LINE.NOT_FOUND,
      finished: true,
      result: 'not-found',
      message: `Không có ${value} trong cây nên không xóa.`,
    }))

    return steps
  }

  const z = tree.nodes[zId]
  pathIds.push(zId)
  comparisons++

  if (z.left === null && z.right === null) {
    steps.push(createStep({
      tree,
      currentId: zId,
      foundId: zId,
      pathIds: [...pathIds],
      comparisons,
      pseudocodeLine: LINE.CASE_LEAF,
      message: `Tìm thấy ${value}. Nút này là lá (TH1).`,
    }))

    const nextTree = replaceNode(tree, parentId, zId, null)
    steps.push(createStep({
      tree: nextTree,
      pathIds: keepExisting(nextTree, pathIds),
      comparisons,
      pseudocodeLine: LINE.REMOVE_LEAF,
      finished: true,
      result: 'deleted',
      message: `Gỡ lá ${value} khỏi cây.`,
    }))

    return steps
  }

  if (z.left === null || z.right === null) {
    const childId = z.left ?? z.right

    steps.push(createStep({
      tree,
      currentId: zId,
      foundId: zId,
      pathIds: [...pathIds],
      comparisons,
      pseudocodeLine: LINE.CASE_ONE_CHILD,
      message: `Tìm thấy ${value}. Nút này chỉ có một con (TH2).`,
    }))

    const nextTree = replaceNode(tree, parentId, zId, childId)
    steps.push(createStep({
      tree: nextTree,
      currentId: childId,
      pathIds: keepExisting(nextTree, pathIds),
      comparisons,
      pseudocodeLine: LINE.LIFT_CHILD,
      finished: true,
      result: 'deleted',
      message: `Xóa ${value} và nối con ${tree.nodes[childId].value} lên thay chỗ.`,
    }))

    return steps
  }

  steps.push(createStep({
    tree,
    currentId: zId,
    foundId: zId,
    pathIds: [...pathIds],
    comparisons,
    pseudocodeLine: LINE.CASE_TWO_CHILDREN,
    message: `Tìm thấy ${value}. Nút này có hai con (TH3): cần tìm successor.`,
  }))

  let successorParentId = zId
  let successorId = z.right

  steps.push(createStep({
    tree,
    currentId: successorId,
    foundId: zId,
    successorId,
    pathIds: [...pathIds],
    comparisons,
    pseudocodeLine: LINE.FIND_SUCCESSOR,
    message: `Bắt đầu từ con phải ${tree.nodes[successorId].value}.`,
  }))

  while (tree.nodes[successorId].left !== null) {
    assertWithinStepLimit(steps, limit, 'BST Delete')
    successorParentId = successorId
    successorId = tree.nodes[successorId].left

    steps.push(createStep({
      tree,
      currentId: successorId,
      foundId: zId,
      successorId,
      pathIds: [...pathIds],
      comparisons,
      pseudocodeLine: LINE.FIND_SUCCESSOR,
      message: `Còn con trái nên đi xuống ${tree.nodes[successorId].value}.`,
    }))
  }

  const successor = tree.nodes[successorId]

  // Bước 12: z và s tạm thời cùng giá trị; cây chỉ hợp lệ trở lại sau bước 13.
  const copiedTree = cloneTree(tree)
  copiedTree.nodes[zId].value = successor.value

  steps.push(createStep({
    tree: copiedTree,
    currentId: zId,
    foundId: zId,
    successorId,
    pathIds: [...pathIds],
    comparisons,
    pseudocodeLine: LINE.COPY_SUCCESSOR,
    message: `Successor là ${successor.value}: chép ${successor.value} vào nút đang chứa ${value}.`,
  }))

  // Bước 13: gỡ s theo id (s không có con trái nên thay s bằng con phải của nó).
  const finalTree = replaceNode(copiedTree, successorParentId, successorId, successor.right)

  steps.push(createStep({
    tree: finalTree,
    currentId: zId,
    foundId: zId,
    pathIds: keepExisting(finalTree, pathIds),
    comparisons,
    pseudocodeLine: LINE.REMOVE_SUCCESSOR,
    finished: true,
    result: 'deleted',
    message: `Gỡ nút successor ${successor.value} cũ khỏi cây con phải.`,
  }))

  return steps
}
