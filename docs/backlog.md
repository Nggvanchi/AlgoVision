# Backlog AlgoVision

Việc còn tồn tại, chưa nằm trong PR nào. Thêm mục khi phát hiện; xóa mục ở commit cuối của PR đã xử lý nó.
Lộ trình giai đoạn: `docs/roadmap.md`.

## Lỗi
- (hiện không có mục nào)

## Hiệu năng
- `buildGraph` sao chép cả đồ thị sau mỗi lần thêm đỉnh/cạnh (O(n²)). Đo 2026-11-05: sao 300 đỉnh 39–73 ms, 1000 đỉnh 0,7–1,0 s,
  2000 đỉnh 5,6 s. Sửa không đổi hành vi: tách phần sửa tại chỗ dùng nội bộ, `buildGraph` sửa trên một bản nháp riêng; chứng minh
  bằng `deepEqual` với cách dựng cũ (gọi lần lượt `addVertex`/`addEdge`) trên cặp ngẫu nhiên có cạnh trùng, khuyên, cả hai chế độ.
  Chưa đủ để nâng test sao/đường thẳng lên 1000 đỉnh: DFS sao 1000 đỉnh mất 4,1 s, trong đó 2,6 s là bản sao đồ thị của từng bước.
  Đề xuất cho giai đoạn 9.
- `tests/graph-controller.test.js` vẫn tốn 511–679 MB RSS ở heap mặc định (71 test, mỗi test nạp `app.html` vào một cửa sổ riêng).
  Ứng viên số một cho việc dùng chung cửa sổ trong PR `chore/test-consolidate`.
- `tests/graph-complexity.test.js` giảm RSS 360 → 243 MB sau PR test-hardening dù không dùng happy-dom; chưa rõ nguyên nhân.
- Cache font trên Vercel: mặc định `Cache-Control: public, max-age=0, must-revalidate`, nên `/fonts/*.woff2` được xác thực lại (304) ở mỗi lần tải. Cân nhắc tên file có hash hoặc header cache dài khi có `vercel.json`
  (cấu hình Vercel hiện nằm trên Vercel, không có file trong repo).

## Giao diện
- Thời lượng học: đã loại khỏi giai đoạn 8 vì là suy đoán (phải định nghĩa "đang học"); nếu thêm thì nâng `version` lên 2 kèm migrate.
- Click thẻ thuật toán Sorting luôn tạo mảng mới (hành vi có từ trước).
- Thẻ thư viện (Redesign Phase 4): `.algorithm-card.selected` chỉ là class hình ảnh (viền tím), thiếu ARIA (`aria-pressed` hoặc `aria-current`), nên trình đọc màn hình không nghe được thẻ nào đang chọn.
- Thẻ thư viện: nhãn đếm "03 THUẬT TOÁN" và "02 THUẬT TOÁN" (`.count-label`) viết cứng trong `app.html`; thêm hoặc bớt thẻ phải sửa tay (thẻ Cấu trúc dùng nhãn "DATA STRUCTURES").
- CSS của thẻ thư viện (kích thước, màu, bố cục, điểm gãy) chưa có test hành vi: test chỉ khóa DOM, thứ tự selector gom chung và điểm gãy 700px; giá trị hiển thị mới kiểm bằng ảnh Chrome headless (Windows) và số đo tương phản.
- Lưới 7 thẻ cấu trúc: thẻ Graph (thứ 7) nằm lẻ, rộng một nửa, ở 820px và 1280px (2 cột, hành vi có từ trước). Giữ nguyên 2 cột; nếu muốn, cho thẻ lẻ chiếm cả hàng hoặc đổi sang 4 cột ở >= 1280px.
- Thư viện Tìm kiếm ở 1280px: lưới `.algorithm-grid` là 3 cột nhưng chỉ có 2 thẻ nên cột thứ ba để trống (hành vi có từ trước, thấy khi rà ảnh Phase 4); cân nhắc 2 cột khi thư viện chỉ có 2 thẻ.
- Thẻ thư viện chưa kiểm trên Safari, Firefox, thiết bị di động thật và trình đọc màn hình thật; xem preview Vercel.
- Rà soát giao diện ở 360px (chưa khảo sát, đầu vào cho bước rà soát giao diện): chữ Big-O của linear probing,
  viền "ô đã dò" bị che ở PR #6/#9.
- L3, màn hình lỗi tải template (`src/bootstrap.js`): khóa nút "Thử lại" bằng `disabled` làm focus rơi về `body` trong lúc đang tải
  (đo Chrome 153: `activeElement` = `body` khi nút disabled, nút nhận lại focus khi tải thất bại). Cân nhắc `aria-disabled="true"` kèm chặn
  click trong listener để nút giữ focus; phải sửa test (h) ở `tests/bootstrap.test.js` cùng lúc (hiện kiểm `button.disabled`).
- Hai mục 360px cũ KHÔNG tái hiện (Chrome 153/Linux): chữ Big-O trung bình của linear probing rộng 223px trong thẻ 226–296px ở 320/360/390px
  nên luôn 1 dòng, chỉ xuống 2 dòng ở 1280px trong thẻ 177px (chấp nhận); viền "ô đã dò" nằm trọn trong khung (probing: lề ≥ 6px;
  chaining preset 14 khóa: 0/14 ô bị cắt).
- Khối "PHIÊN BẢN" của sidebar đã bỏ ở Redesign Phase 2 vì "AlgoVision 0.1.0" không phải dữ liệu thật (`package.json` ghi `0.0.0`, repo không có tag): hiện phiên bản thật khi có nguồn (ví dụ `package.json` hoặc tag release).
- Thanh cuộn mảnh và tối mới có ở `.sidebar-scroll` (`scrollbar-width`/`scrollbar-color`, PR #25); các vùng cuộn khác của app (mã giả, khung vẽ BST/Hash/Graph, bảng) vẫn dùng thanh cuộn mặc định sáng trên nền tối.
- Nhãn "Tất cả cấu trúc" (sidebar) khác tiêu đề trang "Cấu trúc dữ liệu" (h2 của thư viện); thống nhất cách gọi.
- Nút menu ☰ không đổi thành ✕ khi drawer mở; drawer không đổ bóng; tooltip và mũi tên nút thu gọn không có hiệu ứng mờ/xoay. Cắt để CSS vào ngưỡng của Phase 2; thêm lại khi CSS còn chỗ.
- Ngưỡng dung lượng bundle sau R2: JS 145.918 B (dư 82 B so với 146,0 kB), CSS 50.170 B (dư 830 B so với 51,0 kB). Mỗi PR Redesign v1.0 cần trần riêng, duyệt riêng ở bước lập kế hoạch.
- Ô nhập Mảng (`.array-operation-card input`) dùng `outline: none` kèm glow `box-shadow` (`rgba(139, 92, 246, 0.15)`) thay cho vòng focus 2px `--av-focus` theo Spec; luật `:focus-visible` chung đứng trước nên không áp cho các ô này. Việc cho R7 (rà soát a11y): quyết dùng vòng chuẩn hay giữ glow đủ tương phản.
- 4 chỗ chữ nhãn đang dùng `--av-focus` (`#c4b5fd`) chỉ vì giá trị trùng hex cũ, không phải vai trò focus: `.array-count`, `.complexity-card strong`, `.linked-list-node-label`, `.linked-list-null`. Đổi sang token đúng vai trò (ví dụ `--av-primary-text`) khi màn hình tương ứng được thiết kế lại (R5c/R6), và sửa danh sách trong test cùng PR.
- Gỡ 23 alias tạm của token cũ (mỗi alias có chú thích "tạm, gỡ ở R?" trong `:root`; `tests/design-tokens.test.js` đếm đúng 23): R3 gỡ nhóm sidebar (`--bg-sidebar`, `--surface-raised`, `--text-label`, `--purple-active`, `--purple-hover`), R4 gỡ `--purple-strong`/`--purple-pressed`, R6 gỡ phần còn lại. Gỡ alias nào thì đổi chỗ dùng sang `--av-*` và sửa danh sách trong test cùng PR.
- `--border-control` (`#6B6B87`) chưa luật nào dùng. Cần chuyển các selector viền ô nhập/nút sau (lịch ở quyết định 13: R5b, R6, R7 đo lại): `.size-control select`, `.speed-control select`, `.search-toolbar input`, `.array-operation-card input`, `.bst-toolbar input, .bst-toolbar select`, `.control-button`, `.primary-button`, `.search-range-panel`. Còn phải quét tiếp toolbar của Hash Table và Graph (chưa kiểm hết).
- 13 chỗ `var(--purple)` (`#9b82ff`) còn lại là canvas BST/Hash/Graph (`.bst-*`, `.hash-*`, `.graph-*`): Spec không quy định màu canvas, R6 quyết rồi gỡ `--purple`. `--state-active` (`#f6c76a`) và `#22c55e` (13 chỗ) cũng giữ đến R6.
- Còn hex trùng giá trị Spec nhưng Spec không đặt tên token (danh sách ngoại lệ `SPEC_HEX_EXCEPTIONS` trong test): `#fca5a5` (danger-text, 3 chỗ), `#60a5fa` (accent-icon, 2 chỗ). Đặt tên token khi R3–R6 cần rồi xóa mục khỏi danh sách.
- Cỡ chữ lệch bậc Spec nên R2 chưa áp token: `.algorithm-symbol`/`.structure-card-icon` 20px, `.stat-card strong` 21px, `.complexity-card > span`/`p` 11px (xem `FONT_SIZE_SKIPPED` trong `tests/av-tokens.test.js`); input/select không khai báo `font-size`. Quyết theo từng màn hình ở R3–R6.
  Nơi có thể cắt: chuỗi tiếng Việt lặp.
- Nâng viền ô nhập lên `--border-control` (đã có ở mục viền ô nhập 1,33:1 phía trên): lịch ở quyết định 13 (R5b, R6, R7 đo lại), không ở sidebar.
- Chưa kiểm sidebar trên thiết bị di động thật (`100dvh`, thanh địa chỉ co giãn, chạm), trình đọc màn hình thật (CDP không liệt kê `aria-current` trong cây trợ năng), Firefox/Safari (`inert`, `:focus-visible`) và preview Vercel.
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
- Comment đầu `src/hash-table-layout.js` ghi "để vẽ mũi tên" nhưng chuỗi chaining chỉ vẽ đường nối thẳng (`line`, không đầu mũi tên); sửa comment hoặc thêm đầu mũi tên.
- Bảng mốc DFS (PR `fix/layout-tables`): font mã nay là JetBrains Mono tự host (0,6em, cùng bề rộng ký tự với DejaVu Sans Mono của Linux) nên không còn phụ thuộc font monospace của hệ điều hành.
  Đã đo trên Windows (Chrome 152): bảng 257px bằng khung ở 360px, khe nhỏ nhất giữa chữ các ô 11px (360px) và 11,92px (1280px), không ô nào xuống dòng; xác nhận lại trên preview Vercel (Linux thật).
- Heading "Queue Visualizer" (đổi từ h2 sang h3 ở PR `fix/a11y-landmarks`) giữ kiểu mặc định của h2 cũ: 24px, đậm 700, margin 19,92px (luật
  `.visualizer-header h3` ở `style.css`), lớn hơn các h3 16px của Array, Stack, Linked List, BST, Hash Table, Graph. Thống nhất kiểu cần quyết định thiết kế.
- 21 vùng cuộn (`role="group"` + tên, gồm `.sidebar-scroll`) không có `tabindex`: Chrome tự cho focus bàn phím khi nội dung tràn, Safari có thể không, khi đó người dùng
  bàn phím không cuộn được `pre` mã giả, khung vẽ BST/Hash/Graph, các bảng. Thêm `tabindex="0"` sẽ tạo điểm dừng Tab cả ở khung không tràn;
  cân nhắc gắn bằng JS chỉ khi nội dung tràn. Chưa kiểm trên Safari.
- R5, R7: chưa thống nhất giữa các trang. Chỉ báo "k / N" chỉ có ở Sắp xếp (vd "2 / 97"); Tìm kiếm, BST, Hash, Graph chỉ có câu giải thích.
  Tốc độ là `<select>` ở Sắp xếp nhưng `<input type="range">` ở các trang khác.
- R6: chưa có phím tắt nào (→, ←, Space, Enter, n, r, p không đổi gì). Cần thiết kế, tránh xung đột khi gõ vào ô nhập.
- R17: nút/ô nhập cao 38–42px ở 360px (BST, Hash: "Quay lại" 38, ô chọn 42, ô nhập 40, "Thực hiện" 39, nút preset 40; thanh tốc độ 16px);
  trên mức tối thiểu 24px của WCAG 2.2, dưới mức khuyến nghị 44px.
- R18: Sắp xếp không cho nhập mảng hay chọn preset (chỉ "Tạo mảng mới" ngẫu nhiên), nên không thử được mảng đã sắp xếp, đảo ngược, trùng toàn bộ.
- Viền ô nhập hiện 1,33:1 (`--border` #292c3a trên `--panel` #12141c), dưới 3:1 của WCAG 1.4.11. Nâng lên `--border-control` (#6B6B87, 3,58:1 trên `--surface`) ở PR Visualizer/Structure workspace;
  Phase 1 mới định nghĩa token, test chặn việc áp sớm.
- Chuyển giá trị toàn cục `--border` (sang #2A2A3D), `--text-muted` (sang #9CA2BA) và bảng nền (`--background`/`--panel`/`--panel-hover` sang `--bg`/`--surface`/`--surface-raised`, `--purple-dark` sang `--purple-strong`) trong MỘT PR riêng
  (Redesign Phase 2 chỉ áp token mới cho sidebar và nút chính, không đổi giá trị toàn cục): cần ghi mức đổi màu, đo lại tương phản, sửa test "10 token gốc" và hàng gom hex. Hiện hai bảng nền cùng có mặt trong `:root`
  (sidebar `--bg-sidebar` #0E0E19 và vùng nội dung `--background` #0c0d12 lệch nhẹ), dễ nhầm.
- `--shadow-card` (`0 8px 24px rgba(0, 0, 0, 0.35)`, nay dùng cho tooltip của sidebar thu gọn) và `--glow-purple` (`0 0 0 1px rgba(155, 130, 255, 0.35), 0 8px 28px rgba(155, 130, 255, 0.18)`, chưa dùng) là giá trị tạm do Phase 1 tự chọn, test chốt cứng; xem lại khi áp rộng hơn.
- Ký hiệu ngoài `unicode-range` của JetBrains Mono (chỉ có latin và vietnamese) rơi về font hệ thống. Đo 2026-11-06 (Chrome 152, Windows): → và ∅ (danh sách kề) và Θ (bảng độ phức tạp đồ thị, chữ Hy Lạp) về Consolas;
  ▶ (thứ tự thăm BFS/DFS, ngăn xếp DFS, nhãn bảng băm) về Segoe UI Symbol. Ký hiệu khác như ≤ ✓ chưa đo trong thành phần font mã. Trên Linux, fallback của `monospace`/`system-ui` chưa kiểm (xem preview Vercel).
  Cân nhắc thêm subset greek hoặc vẽ ký hiệu bằng SVG/CSS.

- Thư viện (Library) đã làm phần thẻ ở Redesign Phase 4 (tab, ô tìm, bộ lọc, sheet mobile là mục 3c, chưa làm); Visualizer/Structure workspace và token toàn cục (xem mục chuyển `--border`, `--text-muted`, bảng nền ở trên) là các giai đoạn Redesign sau.
- Tìm kiếm nhanh (Ctrl K) và nhớ trạng thái thu gọn của sidebar giữa các lần mở: chưa làm (trạng thái sidebar hiện chỉ trong bộ nhớ của phiên). Spec v1.0 mục 7 muốn nhớ trạng thái thu gọn: khi làm phải cập nhật `tests/meta/no-web-storage.test.js` cùng PR.
- Sidebar chưa tự thu gọn ở màn hình tablet (701–1024px): hiện chỉ có hai chế độ, rộng 256px (>= 701px) hoặc drawer (<= 700px).
- Thuật toán mới (ngoài 3 sắp xếp, 2 tìm kiếm): mỗi thuật toán thêm thẻ `data-algorithm`/`data-search-algorithm`; số thẻ ở `tests/library-cards.test.js` và nhãn đếm viết cứng trong `app.html` phải cập nhật tay.
- `.control-button` hover khác nhau giữa nút bật và nút `disabled`: `.control-button:hover:not(:disabled)` (nền `#222031`, viền `#7965b6`, độ đặc hiệu cao hơn) chỉ áp khi nút bật, còn nút `disabled` rơi về
  `.control-button:hover` (nền `#1d4ed8`), nên nút bị khóa lại đổi sang xanh đậm khi rê chuột. Cần quyết định thiết kế một kiểu hover (và nút khóa không đổi khi hover) rồi gom về một luật.
- Redesign v1.0, header: ô tìm Ctrl K toàn cục và chip tài khoản "[Tên người học]" (avatar "?") chưa làm. Spec mục 14: chưa có thiết kế kết quả tìm kiếm hay command palette; tài khoản chỉ là placeholder (dữ liệu giả, `docs/design/decisions.md` mục 5).
- Redesign v1.0, sidebar: Spec mục 7 muốn nhớ trạng thái thu gọn giữa các phiên. Muốn làm phải sửa `tests/meta/no-web-storage.test.js` (hiện cấm `localStorage`/`sessionStorage` trong `src`) cùng PR đó.
- Redesign v1.0, sidebar 264 px (Spec) so với 256 px hiện tại: giữ 256 px đến khi làm tablet rail. Đổi sang 264 px cần sửa `--sidebar-width`, `tests/sidebar-css.test.js` và `tests/hash-table-layout.test.js` (chuỗi chaining 15 khóa 842 px phải vẫn vừa khung bảng băm ở 1280 px).
- Redesign v1.0, điều hướng: Spec mục 7 có mục "Đệ quy", gộp "Ngăn xếp và hàng đợi", và mục "Trực quan hóa" ở gốc; ứng dụng không có nội dung Đệ quy và có 7 cấu trúc riêng. Chưa làm; mục "Trực quan hóa" trỏ tới đâu phải hỏi người dùng khi làm R3.
- Redesign v1.0, Visualizer (Spec mục 10): ô nhập dữ liệu "số nguyên 1–99, tối đa 12 phần tử", chip Mẫu dữ liệu (Ngẫu nhiên, Gần sắp xếp, Đảo ngược, Có phần tử trùng) và thanh trượt bước `role="slider"` là chức năng mới. Thanh trượt cần `simulation-controller.js` nhảy tới bước tùy ý (kiểm tra khi lập kế hoạch R6); nhập mảng cho Sorting trùng với mục R18 ở trên.
- Redesign v1.0, thẻ cấu trúc dữ liệu: Spec mục 9 và 17 muốn độ khó, phân loại, Thời gian/Bộ nhớ trên card; 7 cấu trúc chưa có nguồn dữ liệu thật cho các trường này nên Phase 4 bỏ chúng (số giả bị cấm). Cần nguồn dữ liệu thật (và đối chiếu với code, như thẻ thuật toán đối chiếu Learning Panel) trước khi thêm.
- Artboard của Spec (ảnh PNG, trang "AlgoVision Design") không có trong repo; khi có thư mục design-source thì đặt ảnh vào `docs/design-refs/` và trỏ tới từ `docs/design/spec.md`.

## Dọn dẹp
- `viewchange.detail.topic` và `topicId` (hàm một dòng trong `src/navigation.js`): sau khi gỡ Tiến độ học tập không mã nào trong `src` đọc `topic` (năm listener của visualizer chỉ gọi `pause()`); chỉ test
  (`navigation-topic`, `sidebar-navigation`, `sidebar-topbar`) kiểm nó. Gỡ cả hai nếu Redesign không cần; giữ nguyên trong PR gỡ tiến độ để không đổi hợp đồng sự kiện.
- Dữ liệu `algovision:progress` đã ghi vào `localStorage` của người dùng trước khi gỡ tiến độ vẫn nằm trong trình duyệt của họ (khoảng dưới 2 kB, không ai đọc). Không có mã xóa; nếu muốn dọn thì thêm
  một lần `removeItem` lúc khởi động và sửa `tests/meta/no-web-storage.test.js` cùng PR (hiện canh gác cả src không được nhắc `localStorage`).
- Đổi tên thuộc tính nội bộ `dequeues`/`dequeuesLabel` trong `src/graph.js` cho khớp `#graph-traversal-count` (không đổi hành vi).
- Khoảng trắng cuối dòng và newline cuối file chưa khớp `.editorconfig`: thiếu newline cuối ở `src/linked-list.js`,
  `src/structures/linkedList.js`, `tests/linked-list.test.js`; khoảng trắng cuối dòng ở `src/array.js:14`, `src/sorting.js:34`,
  `tests/navigation.test.js:88`, `public/templates/app.html:78`. Dọn trong một commit riêng để editor không sinh diff lẫn.
- Gom khoảng 80 hex gần giống nhưng khác giá trị (xám ~#9ca3af/#a1a6b9/#a8aec1/#9da2b6/#969bb0/#b4b9ca; nền ~#141620/#151923/#171923/#171b24/#15151d/#101118; tím nhạt ~#c4b5fd/#c4b5ff/#c5b8ff/#c6b8ff/#c2b0ff/#c8bbff)
  theo từng thành phần ở các PR sau, vì gộp sẽ đổi vài đơn vị màu. Sau Phase 1 còn khoảng 208 hex ngoài `:root`; màu visualization (cột, ô, nút đồ thị, `#22c55e` ×13, `#60a5fa` ×4) giữ nguyên.
- Chuẩn hóa 17 giá trị `border-radius`, 23 cỡ chữ và 31 giá trị spacing theo token đã định nghĩa (`--radius-*`, `--fs-*`, `--space-*`); mới chỉ các luật của sidebar (Phase 2) dùng token cỡ chữ/spacing/bo góc, phần còn lại của trang chưa áp (test canh gác không cho lan ra).
- Còn 22 chỗ dùng `var(--text-secondary|--border-color|--card-background, <giá trị dự phòng>)` (`style.css`): ba alias luôn được định nghĩa trong `:root` nên giá trị dự phòng không bao giờ dùng tới;
  bỏ được bằng cách như PR `chore/bundle-headroom` (so computed style ở 360px và 1280px). Cùng loại: `.array-panel` và `.array-operation-card` còn `background`/màu viền bị luật `.array-panel, .array-operation-card` ở cuối khối Array ghi đè.

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
- PR `chore/measure-ui` riêng để lưu script đo CDP (Chrome headless và `WebSocket` tích hợp của Node, không dependency): tràn ngang 15 màn hình ở 360/1280, bảng DFS (R10), bảng băm (R12), `CSS.getPlatformFontsForNode`,
  byte font, layout-shift, lỗi console. Phase 1 giữ script ngoài repo; số đo trước/sau nằm ở mô tả PR.
- Hash tên file JS của bundle Vite đổi mỗi khi CSS đổi dù JS không đổi byte nào (đo 2026-11-06: `index-DdswGc2A.js` → `BDM0k7yO` → `BbRAiLa6` → `BgwmUazq`, luôn 145.265 B); các lần build lặp trên cùng một commit cho cùng tên file.
  Ghi nhận là hành vi của công cụ build (nghi hash tính cả đồ thị phụ thuộc CSS), không làm gì thêm. Để biết JS có đổi hay không thì so byte và `git diff --name-only`, đừng so tên file.
