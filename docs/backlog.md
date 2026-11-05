# Backlog AlgoVision

Việc còn tồn tại, chưa nằm trong PR nào. Thêm mục khi phát hiện; xóa mục ở commit cuối của PR đã xử lý nó.
Lộ trình giai đoạn: `docs/roadmap.md`.

## Lỗi
- `main.js` không xử lý lỗi khi fetch template thất bại (trang trắng).

## Hiệu năng
- `buildGraph` sao chép cả đồ thị sau mỗi lần thêm đỉnh/cạnh (O(n²)). Đo 2026-11-05: sao 300 đỉnh 39–73 ms, 1000 đỉnh 0,7–1,0 s,
  2000 đỉnh 5,6 s. Sửa không đổi hành vi: tách phần sửa tại chỗ dùng nội bộ, `buildGraph` sửa trên một bản nháp riêng; chứng minh
  bằng `deepEqual` với cách dựng cũ (gọi lần lượt `addVertex`/`addEdge`) trên cặp ngẫu nhiên có cạnh trùng, khuyên, cả hai chế độ.
  Chưa đủ để nâng test sao/đường thẳng lên 1000 đỉnh: DFS sao 1000 đỉnh mất 4,1 s, trong đó 2,6 s là bản sao đồ thị của từng bước.
  Đề xuất cho giai đoạn 9.
- `tests/graph-controller.test.js` vẫn tốn 511–679 MB RSS ở heap mặc định (71 test, mỗi test nạp `app.html` vào một cửa sổ riêng).
  Ứng viên số một cho việc dùng chung cửa sổ trong PR `chore/test-consolidate`.
- `tests/graph-complexity.test.js` giảm RSS 360 → 243 MB sau PR test-hardening dù không dùng happy-dom; chưa rõ nguyên nhân.

## Giao diện
- Click thẻ thuật toán Sorting luôn tạo mảng mới (hành vi có từ trước).
- Thẻ "Cấu trúc dữ liệu" trên Tổng quan vẫn ghi "Array, Stack, Queue và Linked List", thiếu BST, Hash Table, Graph
  (`public/templates/app.html:112-113`).
- Khung giới thiệu của thư viện cấu trúc dữ liệu ghi "Array, Stack, Queue, Linked List, Tree và Graph sẽ được bổ sung." dù Tree
  (BST) và Graph đã có (`public/templates/app.html:677`, `#placeholder-card-description`; không có JS nào ghi đè). Chưa kiểm trên
  trình duyệt khi nào khung này hiện.

## Dọn dẹp
- Thẻ số lần gọi DFS dùng chung id `#graph-dequeues` với BFS (nhãn đổi đúng, chỉ tên id gây hiểu nhầm).
- Khoảng trắng cuối dòng và newline cuối file chưa khớp `.editorconfig`: thiếu newline cuối ở `src/linked-list.js`,
  `src/structures/linkedList.js`, `tests/linked-list.test.js`; khoảng trắng cuối dòng ở `src/array.js:14`, `src/sorting.js:34`,
  `tests/navigation.test.js:92`, `public/templates/app.html:13,51`. Dọn trong một commit riêng để editor không sinh diff lẫn.

## Công cụ
- Nâng pnpm Windows lên 12.16.1, thêm `packageManager`, bỏ dòng `version` trong CI (`.github/workflows/ci.yml`).
- Kiểm giao diện bằng link preview Vercel của mỗi PR ở 360px và 1280px (thay cho lệnh Chrome headless của PR #5–#9,
  vốn không được lưu lại trong repo).
- Hạn chế đã biết của `tests/meta/no-dom-in-equal.test.js`: không quét `row(...)`, vì `row` ở `tests/graph-bfs-view.test.js:143` và
  `tests/graph-dfs-view.test.js:149` trả về mảng (thêm vào báo nhầm 6 chỗ); `row` ở `hash-table-controller.test.js:59` và
  `graph-controller.test.js:706` trả về phần tử DOM nên không được canh. Cũng không bắt biến đã gán phần tử.
- Chốt số bước ở BST Insert, Delete (2 vòng) và Min/Max mới được kiểm bằng test giới hạn (xấu nhất đúng bằng giới hạn), chưa có
  mutation nguồn riêng; PR test/hardening chỉ phá thử BFS, DFS, Binary Search và BST Search.
