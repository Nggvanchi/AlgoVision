import { assertStepInvariants, lineText } from './step-invariants.js'

// Bất biến cho mọi mảng bước BST, dựa trên bộ kiểm chung step-invariants.js:
// - currentId / foundId / successorId là null hoặc thuộc tree.nodes của CHÍNH bước đó (không có id treo);
// - mọi id trong pathIds đều thuộc tree.nodes của bước đó;
// - pathIds chỉ tăng: chứa pathIds của bước trước, trừ các nút đã bị xóa khỏi cây;
// - operation và value giống nhau ở mọi bước (chốt khi sinh bước);
// - chỉ bước cuối có finished = true; bước 0 không tô mã giả.
const hasNode = (step, id) => Object.hasOwn(step.tree.nodes, id)

const bstOptions = {
  references: ['currentId', 'foundId', 'successorId'].map((field) => ({ field, exists: hasNode })),
  paths: [{ field: 'pathIds', exists: hasNode }],
  constantFields: ['operation', 'value'],
}

export function assertBstStepInvariants(steps) {
  assertStepInvariants(steps, bstOptions)
}

export { lineText }
