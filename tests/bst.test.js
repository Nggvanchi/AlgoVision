import test from 'node:test'
import assert from 'node:assert/strict'

import * as bst from '../src/structures/bst.js'

const BALANCED_VALUES = [50, 30, 70, 20, 40, 60, 80]

function valueOf(tree, id) {
  return id === null ? null : tree.nodes[id].value
}

test('createTree tạo cây rỗng', () => {
  const tree = bst.createTree()

  assert.equal(tree.rootId, null)
  assert.deepEqual(tree.nodes, {})
  assert.equal(bst.getNodeCount(tree), 0)
})

test('buildTree chèn lần lượt theo quy tắc BST', () => {
  const tree = bst.buildTree(BALANCED_VALUES)
  const root = tree.nodes[tree.rootId]

  assert.equal(root.value, 50)
  assert.equal(valueOf(tree, root.left), 30)
  assert.equal(valueOf(tree, root.right), 70)
  assert.equal(valueOf(tree, tree.nodes[root.left].left), 20)
  assert.equal(valueOf(tree, tree.nodes[root.left].right), 40)
  assert.equal(bst.getNodeCount(tree), 7)
})

test('Inorder của cây luôn tăng dần', () => {
  const tree = bst.buildTree([42, 7, 93, 15, 3, 61, 88, 1, 99, 50])

  assert.deepEqual(
    bst.toInorderValues(tree),
    [1, 3, 7, 15, 42, 50, 61, 88, 93, 99],
  )
})

test('Mỗi nút có id riêng, id không trùng nhau', () => {
  const tree = bst.buildTree(BALANCED_VALUES)
  const ids = Object.keys(tree.nodes).map(Number)

  assert.equal(new Set(ids).size, 7)
  ids.forEach((id) => assert.equal(tree.nodes[id].id, id))
  assert.ok(ids.every((id) => id < tree.nextId))
})

test('insertValue bỏ qua giá trị đã tồn tại', () => {
  const tree = bst.buildTree([5, 3, 8])
  const result = bst.insertValue(tree, 3)

  assert.equal(result.inserted, false)
  assert.deepEqual(result.tree, tree)
})

test('buildTree bỏ qua giá trị trùng, cây không chứa giá trị trùng', () => {
  const tree = bst.buildTree([5, 3, 5, 8, 3, 8])

  assert.deepEqual(bst.toInorderValues(tree), [3, 5, 8])
})

test('insertValue không thay đổi cây đầu vào', () => {
  const tree = bst.buildTree(BALANCED_VALUES)
  const before = structuredClone(tree)

  const result = bst.insertValue(tree, 45)

  assert.equal(result.inserted, true)
  assert.deepEqual(tree, before)
  assert.notEqual(result.tree.nodes, tree.nodes)
  assert.equal(valueOf(result.tree, result.id), 45)
})

test('buildTree không thay đổi mảng đầu vào', () => {
  const values = [3, 1, 2]

  bst.buildTree(values)

  assert.deepEqual(values, [3, 1, 2])
})

test('Từ chối giá trị không phải số nguyên', () => {
  for (const value of [1.5, Number.NaN, Infinity, '5', null, undefined]) {
    assert.throws(
      () => bst.insertValue(bst.createTree(), value),
      TypeError,
      `phải từ chối ${String(value)}`,
    )
  }
})

test('Tầng cấu trúc chỉ yêu cầu số nguyên, không giới hạn 1–99', () => {
  const tree = bst.buildTree([0, -5, 150])

  assert.deepEqual(bst.toInorderValues(tree), [-5, 0, 150])
})

test('Chiều cao tính theo số cạnh: rỗng -1, một nút 0', () => {
  assert.equal(bst.getHeight(bst.createTree()), -1)
  assert.equal(bst.getHeight(bst.buildTree([10])), 0)
  assert.equal(bst.getHeight(bst.buildTree(BALANCED_VALUES)), 2)
})

test('Cây suy biến n nút có chiều cao n - 1', () => {
  const values = Array.from({ length: 15 }, (_, index) => index + 1)

  assert.equal(bst.getHeight(bst.buildTree(values)), 14)
})

test('findNodeId trả về id theo giá trị hoặc null', () => {
  const tree = bst.buildTree(BALANCED_VALUES)

  assert.equal(valueOf(tree, bst.findNodeId(tree, 60)), 60)
  assert.equal(bst.findNodeId(tree, 65), null)
})

test('isValidBst nhận cây hợp lệ và cây rỗng', () => {
  assert.equal(bst.isValidBst(bst.createTree()), true)
  assert.equal(bst.isValidBst(bst.buildTree(BALANCED_VALUES)), true)
})

test('isValidBst phát hiện nút cháu vi phạm ràng buộc của tổ tiên', () => {
  // 50 → trái 30 → phải 60: 60 nằm trong cây con trái của 50 là sai.
  const tree = {
    rootId: 1,
    nextId: 4,
    nodes: {
      1: { id: 1, value: 50, left: 2, right: null },
      2: { id: 2, value: 30, left: null, right: 3 },
      3: { id: 3, value: 60, left: null, right: null },
    },
  }

  assert.equal(bst.isValidBst(tree), false)
})

test('isValidBst từ chối giá trị trùng', () => {
  const tree = {
    rootId: 1,
    nextId: 3,
    nodes: {
      1: { id: 1, value: 50, left: null, right: 2 },
      2: { id: 2, value: 50, left: null, right: null },
    },
  }

  assert.equal(bst.isValidBst(tree), false)
})

test('isValidBst từ chối nút treo không nối với gốc', () => {
  const tree = {
    rootId: 1,
    nextId: 3,
    nodes: {
      1: { id: 1, value: 50, left: null, right: null },
      2: { id: 2, value: 70, left: null, right: null },
    },
  }

  assert.equal(bst.isValidBst(tree), false)
})

test('getDepth: gốc là 0, id không có trong cây là -1', () => {
  const tree = bst.buildTree(BALANCED_VALUES)

  assert.equal(bst.getDepth(tree, tree.rootId), 0)
  assert.equal(bst.getDepth(tree, bst.findNodeId(tree, 60)), 2)
  assert.equal(bst.getDepth(tree, 999), -1)
})
