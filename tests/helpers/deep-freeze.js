// Đóng băng đệ quy để bắt code sửa nhầm snapshot (đầu vào hoặc bước): ghi vào đối tượng đã đóng băng ném TypeError
// trong ES module (strict mode). Trả lại chính value để dùng nối tiếp: deepFreeze(buildGraph(...)).
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(deepFreeze)
  }
  return value
}
