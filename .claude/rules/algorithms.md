---
paths:
  - "src/algorithms/**/*.js"
  - "src/structures/**/*.js"
  - "src/*-layout.js"
---

# Quy tắc cho mã thuần (sinh bước, cấu trúc, bố cục)

- Không import DOM, template hay controller. Các file này phải test được bằng `node --test` thuần, không cần happy-dom.
- Snapshot bất biến: không sửa dữ liệu đầu vào hay bước trước. Test của module mới dùng `deepFreeze` để bắt lỗi này
  (`tests/helpers/deep-freeze.js`, đang dùng ở 8 file test graph/hash; test BST, Sorting, Searching chưa dùng).
- Định danh: trong cấu trúc có id (nút BST, phần tử băm `e1…`, đỉnh `v1…`), bước tham chiếu bằng id ổn định, không bằng giá trị
  hay đối tượng. Mảng của Sorting/Searching và ô băm (`currentBucket`, `probedBuckets`) định danh bằng chỉ số.
- Mỗi bước ứng với một thao tác mã giả. Bước lưu dữ liệu; tầng hiển thị lo định dạng chữ (không tách số từ `message`).
- Mỗi file sinh bước export mảng mã giả và dùng hằng `LINE` nội bộ; `pseudocodeLine` đếm từ 1 theo mảng đó, null = không tô dòng nào.
- Chỉ bước cuối có `finished = true`.
- Số đo cho Learning Panel (so sánh, probes, reads, số lần gọi…) đếm ngay trong bước, để giao diện đọc số đo thật thay vì tính lại.
- Khi thêm hoặc sửa generator: ghi công thức số bước và ánh xạ bước → dòng mã giả trong chú thích (mẫu: `src/algorithms/graphDfs.js:21`)
  và có test cho công thức đó.
- Chốt an toàn số bước: generator có vòng lặp không cận cố định (`while`) export hàm giới hạn `<thao tác>StepLimit(đầu vào)`
  (công thức số bước với kích thước xấu nhất) và gọi `assertWithinStepLimit(steps, limit, '<thao tác>')`
  (`src/algorithms/stepLimit.js`) ở đầu mỗi vòng. Lỗi kiểu "quên pop" khi đó ném RangeError rõ ràng thay vì tràn heap.
  Test giới hạn: số dò tay, mọi đầu vào nhỏ ≤ giới hạn, đầu vào xấu nhất đúng bằng giới hạn (bắt giới hạn quá lỏng).
  Vòng `for` theo độ dài, `capacity` hay độ dài chuỗi không cần chốt.
