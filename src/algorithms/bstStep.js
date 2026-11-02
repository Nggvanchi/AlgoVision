// Khuôn bước chung cho mọi thao tác BST. Các trường lưu dữ liệu; tầng hiển thị lo định dạng chữ.
// tree: snapshot cây tại bước đó (không bao giờ bị sửa sau khi tạo).
// currentId / foundId / successorId: null hoặc id có trong tree.nodes của chính bước đó.
// pathIds: các nút đã xét trên đường đi, chỉ tăng (trừ nút bị xóa khỏi cây).
// output: dãy giá trị đã thăm (duyệt cây). heights: { id: chiều cao } (thao tác Height).
export function createBstStepFactory(operation, value) {
  return (fields) => ({
    tree: null,
    currentId: null,
    pathIds: [],
    foundId: null,
    successorId: null,
    output: [],
    heights: {},
    operation,
    value,
    comparisons: 0,
    pseudocodeLine: null,
    message: '',
    finished: false,
    result: null,
    ...fields,
  })
}
