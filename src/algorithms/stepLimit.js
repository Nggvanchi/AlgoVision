// Chốt an toàn cho generator có vòng lặp không cận cố định (while): gọi ở đầu mỗi vòng.
// limit = số bước tối đa theo công thức số bước của thao tác, tính từ kích thước đầu vào, nên lần chạy đúng
// không bao giờ vượt. Vượt nghĩa là vòng lặp không dừng (ví dụ quên pop/shift): ném RangeError rõ ràng thay vì
// sinh bước tới khi tràn heap. limit phải là số nguyên không âm; NaN sẽ làm phép so luôn sai và tắt chốt âm thầm.
export function assertWithinStepLimit(steps, limit, operation) {
  if (!Number.isInteger(limit) || limit < 0) {
    throw new TypeError(`${operation}: giới hạn số bước phải là số nguyên không âm, nhận ${String(limit)}.`)
  }
  if (steps.length > limit) {
    throw new RangeError(
      `${operation}: đã sinh ${steps.length} bước, vượt giới hạn ${limit} theo kích thước đầu vào (vòng lặp không dừng?).`,
    )
  }
}
