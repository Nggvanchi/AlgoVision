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
- Cột Insertion đang so sánh nằm trong đoạn đã sắp xếp (khoảng 94% số cột so sánh của Insertion trong mẫu đo 300 mảng) chỉ hiện "đang so sánh",
  mất cue "đã sắp xếp" (`is-comparing` thắng `is-sorted`, `src/sorting-bar-state.js`). Hiện cả hai phải sửa test "cột đang so sánh trong vùng
  đã sắp xếp vẫn hiển thị trạng thái so sánh (Insertion Sort)" và cần cue kết hợp; chú giải Insertion đã ghi "kể cả cột nằm trong đoạn đã sắp xếp".
- Ô "đã loại bỏ" của Binary Search: viền nét đứt sau `opacity: 0,4` chỉ khoảng 1,6:1 so với nền khung (tính WCAG), dưới ngưỡng 3:1 của 1.4.11.
  Giữ nguyên ở PR `feat/sorting-state-cues` vì hành vi có từ trước; cần tăng opacity hoặc màu viền riêng cho ô này.
- Trình đọc màn hình không nghe được trạng thái từng ô/cột: `#search-array` không có `role`/`aria-label`, ô Tìm kiếm là `div` chỉ có giá trị
  (`▶`, `✓` là `aria-hidden`), cột Sắp xếp nằm trong `#array-bars` (`role="img"` một nhãn chung). Trạng thái chỉ được nói theo bước qua
  `#search-message`, `#search-range-message`, `#simulation-message` (`aria-live`). Cần tên trạng thái cho từng ô/cột (aria-label hoặc chữ ẩn).
- Message Selection ở bước "Tìm thấy nhỏ hơn" dài hơn: 4 dòng (94,4 px) ở 360px, 3 dòng (71,6 px) ở 1280px, so với 2 dòng ở bước So sánh
  (đo Chrome, mảng cố định 85, 47, 62…). `#simulation-message` nằm cuối khung nên chỉ làm trang dài thêm 22,8 px, không đẩy nút điều khiển;
  trước PR này vùng đó cũng đã dao động 48,8 ↔ 71,6 px giữa các bước. Chưa xử lý; cân nhắc `min-height` cho vùng message của Sắp xếp.
- R12: khung bảng chaining cuộn ngang 21px ở 1280px với preset va chạm nặng (svg 876px, khung 871px, scrollWidth 892px).
- Thanh bên là `<aside>` chứa 4 nút `button.nav-item`, chưa có `<nav aria-label>`: trình đọc màn hình không có landmark điều hướng chính (skip link
  đã giúp người dùng bàn phím bỏ qua được, nhưng danh sách landmark chỉ có complementary và main).
- Heading "Queue Visualizer" (đổi từ h2 sang h3 ở PR `fix/a11y-landmarks`) giữ kiểu mặc định của h2 cũ: 24px, đậm 700, margin 19,92px (luật
  `.visualizer-header h3` ở `style.css`), lớn hơn các h3 16px của Array, Stack, Linked List, BST, Hash Table, Graph. Thống nhất kiểu cần quyết định thiết kế.
- 20 vùng cuộn (`role="group"` + tên) không có `tabindex`: Chrome tự cho focus bàn phím khi nội dung tràn, Safari có thể không, khi đó người dùng
  bàn phím không cuộn được `pre` mã giả, khung vẽ BST/Hash/Graph, các bảng. Thêm `tabindex="0"` sẽ tạo điểm dừng Tab cả ở khung không tràn;
  cân nhắc gắn bằng JS chỉ khi nội dung tràn. Chưa kiểm trên Safari.
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
- Cải tiến skill `mutation-test`: `run-isolated.mjs` in tên test đỏ và assert đầu tiên thay vì phụ thuộc chuỗi `--expect` (đã báo
  "không thấy thông điệp" sai 7 lần trong hai PR dù đúng test đỏ; phải đọc log bằng tay để xác nhận).
- Nâng pnpm Windows lên 12.16.1, thêm `packageManager`, bỏ dòng `version` trong CI (`.github/workflows/ci.yml`).
- Kiểm giao diện bằng link preview Vercel của mỗi PR ở 360px và 1280px (thay cho lệnh Chrome headless của PR #5–#9,
  vốn không được lưu lại trong repo).
- Hạn chế đã biết của `tests/meta/no-dom-in-equal.test.js`: không quét `row(...)`, vì `row` ở `tests/graph-bfs-view.test.js:143` và
  `tests/graph-dfs-view.test.js:149` trả về mảng (thêm vào báo nhầm 6 chỗ); `row` ở `hash-table-controller.test.js:59` và
  `graph-controller.test.js:706` trả về phần tử DOM nên không được canh. Cũng không bắt biến đã gán phần tử.
- Chốt số bước ở BST Insert, Delete (2 vòng) và Min/Max mới được kiểm bằng test giới hạn (xấu nhất đúng bằng giới hạn), chưa có
  mutation nguồn riêng; PR test/hardening chỉ phá thử BFS, DFS, Binary Search và BST Search.
