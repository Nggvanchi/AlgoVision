# Backlog AlgoVision

Việc còn tồn tại, chưa nằm trong PR nào. Thêm mục khi phát hiện; xóa mục ở commit cuối của PR đã xử lý nó.
Lộ trình giai đoạn: `docs/roadmap.md`.

## Lỗi
- (không còn mục nào)

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
- Rà soát giao diện ở 360px (chưa khảo sát, đầu vào cho bước rà soát giao diện): chữ Big-O của linear probing, tiêu đề bảng mốc DFS,
  viền "ô đã dò" bị che ở PR #6/#9.
- L3, màn hình lỗi tải template (`src/bootstrap.js`): khóa nút "Thử lại" bằng `disabled` làm focus rơi về `body` trong lúc đang tải
  (đo Chrome 153: `activeElement` = `body` khi nút disabled, nút nhận lại focus khi tải thất bại). Cân nhắc `aria-disabled="true"` kèm chặn
  click trong listener để nút giữ focus; phải sửa test (h) ở `tests/bootstrap.test.js` cùng lúc (hiện kiểm `button.disabled`).
- Bảng mốc DFS ở 360px (R10): `th` chỉ có padding 1px nên "Đỉnh vào" và "parent trạng thái" dính nhau, nhãn "chưa thăm" xuống 2 dòng trong
  từng hàng; bảng 272px vừa khít khung, không tràn (đo Chrome 153/Linux, bước DFS(D) trên đồ thị mẫu).
- Hai mục 360px cũ KHÔNG tái hiện (Chrome 153/Linux): chữ Big-O trung bình của linear probing rộng 223px trong thẻ 226–296px ở 320/360/390px
  nên luôn 1 dòng, chỉ xuống 2 dòng ở 1280px trong thẻ 177px (chấp nhận); viền "ô đã dò" nằm trọn trong khung (probing: lề ≥ 6px;
  chaining preset 14 khóa: 0/14 ô bị cắt).
- R3, R4: màu là cue duy nhất. Sắp xếp: thanh "đang so sánh" (cam) và "đã sắp xếp" (xanh) chỉ khác màu, không có viền, ký hiệu hay chú giải
  trạng thái. Tìm kiếm: "đã kiểm tra" chỉ khác nền xám + opacity 0,8; "đã loại bỏ" có thêm viền nét đứt. Cần cue ngoài màu, dùng lại bộ ký hiệu
  của BST/Hash/Graph (viền dày, vòng kép, nét đứt, ▶, ✓).
- R8, R9: tô ô không khớp lời giải thích (không lệch bước: Bubble 91, Selection 102, Insertion 92 bước đã duyệt). Insertion: "So sánh 85 với
  giá trị cần chèn 47" chỉ tô 85, và ở bước "Dời 85 sang phải" mảng hiện `85 85` còn 47 biến mất. Selection: bước "Tìm thấy nhỏ hơn" tô (i, min mới),
  bước "So sánh" tô (min, j), không có chú thích phân biệt.
- R12: khung bảng chaining cuộn ngang 21px ở 1280px với preset va chạm nặng (svg 876px, khung 871px, scrollWidth 892px).
- R13, R14: `pre` mã giả và `.graph-panel-frame` cuộn ngang ở 360px nhận focus bằng Tab nhưng thiếu `aria-label`/`role` (khung mảng và danh sách
  liên kết đã có nhãn); không có skip link, mỗi lần Tab đi qua 4 mục điều hướng trước nội dung. Gộp nhóm này: sau PR `fix/ui-copy-round-2`,
  trang Sắp xếp đi từ h2 (tiêu đề trang) sang h4 (`#visualizer-title`) vì đã bỏ h3 "Khu vực mô phỏng"; khi đổi tag cần rà CSS chọn theo `h4`
  trước.
- R5, R7: chưa thống nhất giữa các trang. Chỉ báo "k / N" chỉ có ở Sắp xếp (vd "2 / 97"); Tìm kiếm, BST, Hash, Graph chỉ có câu giải thích.
  Tốc độ là `<select>` ở Sắp xếp nhưng `<input type="range">` ở các trang khác.
- R6: chưa có phím tắt nào (→, ←, Space, Enter, n, r, p không đổi gì). Cần thiết kế, tránh xung đột khi gõ vào ô nhập.
- R17: nút/ô nhập cao 38–42px ở 360px (BST, Hash: "Quay lại" 38, ô chọn 42, ô nhập 40, "Thực hiện" 39, nút preset 40; thanh tốc độ 16px);
  trên mức tối thiểu 24px của WCAG 2.2, dưới mức khuyến nghị 44px.
- R18: Sắp xếp không cho nhập mảng hay chọn preset (chỉ "Tạo mảng mới" ngẫu nhiên), nên không thử được mảng đã sắp xếp, đảo ngược, trùng toàn bộ.
- `document.title` (`index.html:10`, "AlgoVision - Trực quan hóa thuật toán") và breadcrumb (`app.html:44`, "Không gian học tập / Trực quan hóa")
  chưa đổi theo trang: đúng với mọi trang nhưng không nói đang ở đâu.

## Dọn dẹp
- Xóa khối placeholder chết `#category-placeholder` (`public/templates/app.html`, tham chiếu trong `src/navigation.js`, CSS
  `.category-preview`): không route nào bỏ `hidden` (đã thử 30 lần click mọi nút điều hướng), và `[hidden] { display: none !important }`
  chặn CSS đè. Sau PR `fix/ui-copy-and-errors` chỉ còn chữ trung tính. Trước khi xóa, kiểm `pages.structures` có dùng
  `#placeholder-title` / `#placeholder-description` không (hai phần tử này vẫn được `navigation.js` ghi).
  Test liên quan: `tests/template-stale-copy.test.js` ("khung giới thiệu thư viện cấu trúc không hứa Tree/Graph…") đã chịu được việc
  vắng `#placeholder-card-description`, nhưng nó vẫn kiểm `#category-placeholder .visualizer-tag` nên nên rà lại khi xóa khối.
- Đổi tên thuộc tính nội bộ `dequeues`/`dequeuesLabel` trong `src/graph.js` cho khớp `#graph-traversal-count` (không đổi hành vi).
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
