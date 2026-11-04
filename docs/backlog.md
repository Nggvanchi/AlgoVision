# Backlog AlgoVision

Việc còn tồn tại, chưa nằm trong PR nào. Thêm mục khi phát hiện; xóa mục ở commit cuối của PR đã xử lý nó.
Lộ trình giai đoạn: `docs/roadmap.md`.

## Lỗi
- Generator sinh bước chưa có chốt an toàn về số bước tối đa: lỗi kiểu "quên pop" gây treo/tràn heap thay vì ném lỗi rõ ràng.
- `main.js` không xử lý lỗi khi fetch template thất bại (trang trắng).

## Hiệu năng
- `tests/searching-controller.test.js` cần hơn 512 MB heap khi chạy riêng, ngay cả khi xanh; chưa rõ nguyên nhân, rủi ro nếu
  CI giới hạn bộ nhớ thấp. Đo bằng skill `test-profile`.
- `buildGraph` sao chép đồ thị sau mỗi lần thêm nên chậm ở quy mô lớn (1000 đỉnh ~1,3 s; test đồ thị sao hạ xuống 300 đỉnh).

## Giao diện
- Click thẻ thuật toán Sorting luôn tạo mảng mới (hành vi có từ trước).
- Chưa kiểm tra giao diện nút `#search-previous` trên trình duyệt thật.
- Thẻ "Cấu trúc dữ liệu" trên Tổng quan vẫn ghi "Array, Stack, Queue và Linked List", thiếu BST, Hash Table, Graph
  (`public/templates/app.html`).

## Dọn dẹp
- Thẻ số lần gọi DFS dùng chung id `#graph-dequeues` với BFS (nhãn đổi đúng, chỉ tên id gây hiểu nhầm).
- `deepFreeze` định nghĩa lại trong 8 file test thay vì một helper chung. Làm ở PR test/hardening.
- Khoảng trắng cuối dòng và newline cuối file chưa khớp `.editorconfig`: thiếu newline cuối ở `src/linked-list.js`,
  `src/structures/linkedList.js`, `tests/linked-list.test.js`; khoảng trắng cuối dòng ở `src/array.js:14`, `src/sorting.js:34`,
  `tests/navigation.test.js:92`, `public/templates/app.html:13,51`. Dọn trong một commit riêng để editor không sinh diff lẫn.

## Công cụ
- Nâng pnpm Windows lên 12.16.1, thêm `packageManager`, bỏ dòng `version` trong CI (`.github/workflows/ci.yml`).
- Lệnh kiểm trình duyệt bằng Chrome headless (360px/1280px) dùng ở PR #5–#9 chưa được lưu lại trong repo.
- Meta test `no-dom-in-equal` (gói v2) chưa đưa vào repo; để PR test/hardening.
