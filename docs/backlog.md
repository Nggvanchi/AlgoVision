# Backlog AlgoVision

Việc còn tồn tại, chưa nằm trong PR nào. Thêm mục khi phát hiện; xóa mục ở commit cuối của PR đã xử lý nó.
Lộ trình giai đoạn: `docs/roadmap.md`.

## Lỗi
- Cửa sổ đua rất hẹp của tiến độ học tập: hai tab đọc rồi ghi đúng cùng lúc thì tab ghi sau đè tab ghi trước và mất một lần đếm
  `openCount` (mỗi lần mở đọc lại bản mới nhất, nên chỉ lệch khi hai cặp `getItem`/`setItem` xen kẽ; hàm `open` trong `src/progress-store.js`).
  Chấp nhận vì chỉ lệch 1 đơn vị đếm, không mất chủ đề; `localStorage` không có khóa. Xem lại khi làm Phase 3b.

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
- Nút xóa tiến độ học tập: phải làm CÙNG giao diện hiển thị ở Phase 3b vì đây là lịch sử xem của người dùng; hiện chỉ có API `clear()`
  (`src/progress-store.js`) và người dùng chỉ xóa được qua DevTools (khóa `algovision:progress`).
- Sự kiện `storage` giữa hai tab: chưa đăng ký (chưa có giao diện đọc tiến độ); thêm khi Phase 3b hiển thị tiến độ để hai tab cùng cập nhật.
- Thời lượng học: đã loại khỏi giai đoạn 8 vì là suy đoán (phải định nghĩa "đang học"); nếu thêm thì nâng `version` lên 2 kèm migrate.
- Tiến độ học tập chưa kiểm trên trình duyệt thật: Chrome/Firefox/Safari, cửa sổ riêng tư (đọc `localStorage` ném lỗi, hết quota) và hai tab
  thật; test chỉ chạy bằng happy-dom với storage giả. Kiểm trên link preview Vercel.
- Click thẻ thuật toán Sorting luôn tạo mảng mới (hành vi có từ trước).
- Rà soát giao diện ở 360px (chưa khảo sát, đầu vào cho bước rà soát giao diện): chữ Big-O của linear probing,
  viền "ô đã dò" bị che ở PR #6/#9.
- L3, màn hình lỗi tải template (`src/bootstrap.js`): khóa nút "Thử lại" bằng `disabled` làm focus rơi về `body` trong lúc đang tải
  (đo Chrome 153: `activeElement` = `body` khi nút disabled, nút nhận lại focus khi tải thất bại). Cân nhắc `aria-disabled="true"` kèm chặn
  click trong listener để nút giữ focus; phải sửa test (h) ở `tests/bootstrap.test.js` cùng lúc (hiện kiểm `button.disabled`).
- Hai mục 360px cũ KHÔNG tái hiện (Chrome 153/Linux): chữ Big-O trung bình của linear probing rộng 223px trong thẻ 226–296px ở 320/360/390px
  nên luôn 1 dòng, chỉ xuống 2 dòng ở 1280px trong thẻ 177px (chấp nhận); viền "ô đã dò" nằm trọn trong khung (probing: lề ≥ 6px;
  chaining preset 14 khóa: 0/14 ô bị cắt).
- Khối "PHIÊN BẢN" của sidebar đã bỏ ở Redesign Phase 2 vì "AlgoVision 0.1.0" không phải dữ liệu thật (`package.json` ghi `0.0.0`, repo không có tag): hiện phiên bản thật khi có nguồn (ví dụ `package.json` hoặc tag release).
- Glyph icon của sidebar rơi về font hệ thống: đo 2026-11-06 (Chrome 152, Windows) 9/11 glyph không dùng font tự host: ⌂ ↕ (Arial), ⌕ ▤ ⋔ ◬ (Cambria Math), ↔ (Segoe UI Semibold), ⛓ (Segoe UI Symbol); chỉ "[ ]" và "#"
  dùng Be Vietnam Pro. Hình sẽ khác giữa Windows và Linux (chưa đo Ubuntu). Nên thay bằng SVG hoặc subset font.
- Icon ▤ trùng giữa "Tất cả cấu trúc" và Stack trong sidebar (cả hai đều là glyph của thẻ); nhất là ở trạng thái thu gọn, hai mục nhìn như nhau (tooltip và tên truy cập vẫn phân biệt được).
- Thanh cuộn mặc định sáng trên nền tối: `.sidebar-scroll` (và mọi vùng cuộn khác của app) chưa có `scrollbar-color`/`scrollbar-width`.
- Nhãn "Tất cả cấu trúc" (sidebar) khác tiêu đề trang "Cấu trúc dữ liệu" (h2 của thư viện); thống nhất cách gọi.
- Nút menu ☰ (vẽ bằng CSS) không đổi thành ✕ khi drawer mở; drawer không đổ bóng; tooltip và mũi tên nút thu gọn không có hiệu ứng mờ/xoay. Cắt để CSS vào ngưỡng 51,5 kB của Phase 2; thêm lại khi CSS còn chỗ.
- Ngưỡng dung lượng CSS: sau Phase 2 chỉ dư 117 B so với ngưỡng 51,5 kB (CSS 51.383 B). PR sau phải xem lại ngưỡng có chủ ý (nâng ngưỡng có lý do, hoặc cắt CSS chết) thay vì lặng lẽ vượt.
- Nâng viền ô nhập lên `--border-control` (đã có ở mục viền ô nhập 1,33:1 phía trên): làm ở PR Visualizer/Structure workspace, không ở sidebar.
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
- `document.title` (`index.html:10`, "AlgoVision - Trực quan hóa thuật toán") và `.topbar` trong `<main>` (breadcrumb tĩnh "Không gian học tập / Trực quan hóa" cùng huy hiệu "Đang phát triển")
  chưa đổi theo trang: đúng với mọi trang nhưng không nói đang ở đâu. Redesign Phase 2 giữ nguyên `.topbar`; thanh trên ☰ của drawer là phần tử riêng.
- Viền ô nhập hiện 1,33:1 (`--border` #292c3a trên `--panel` #12141c), dưới 3:1 của WCAG 1.4.11. Nâng lên `--border-control` (#6B6B87, 3,58:1 trên `--surface`) ở PR Visualizer/Structure workspace;
  Phase 1 mới định nghĩa token, test chặn việc áp sớm.
- Chuyển giá trị toàn cục `--border` (sang #2A2A3D), `--text-muted` (sang #9CA2BA) và bảng nền (`--background`/`--panel`/`--panel-hover` sang `--bg`/`--surface`/`--surface-raised`, `--purple-dark` sang `--purple-strong`) trong MỘT PR riêng
  (Redesign Phase 2 chỉ áp token mới cho sidebar và nút chính, không đổi giá trị toàn cục): cần ghi mức đổi màu, đo lại tương phản, sửa test "10 token gốc" và hàng gom hex. Hiện hai bảng nền cùng có mặt trong `:root`
  (sidebar `--bg-sidebar` #0E0E19 và vùng nội dung `--background` #0c0d12 lệch nhẹ), dễ nhầm.
- `--shadow-card` (`0 8px 24px rgba(0, 0, 0, 0.35)`, nay dùng cho tooltip của sidebar thu gọn) và `--glow-purple` (`0 0 0 1px rgba(155, 130, 255, 0.35), 0 8px 28px rgba(155, 130, 255, 0.18)`, chưa dùng) là giá trị tạm do Phase 1 tự chọn, test chốt cứng; xem lại khi áp rộng hơn.
- Ký hiệu ngoài `unicode-range` của JetBrains Mono (chỉ có latin và vietnamese) rơi về font hệ thống. Đo 2026-11-06 (Chrome 152, Windows): → và ∅ (danh sách kề) và Θ (bảng độ phức tạp đồ thị, chữ Hy Lạp) về Consolas;
  ▶ (thứ tự thăm BFS/DFS, ngăn xếp DFS, nhãn bảng băm) về Segoe UI Symbol. Ký hiệu khác như ≤ ✓ chưa đo trong thành phần font mã. Trên Linux, fallback của `monospace`/`system-ui` chưa kiểm (xem preview Vercel).
  Cân nhắc thêm subset greek hoặc vẽ ký hiệu bằng SVG/CSS.

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
  `tests/navigation.test.js:92`, `public/templates/app.html:78`. Dọn trong một commit riêng để editor không sinh diff lẫn.
- Gom khoảng 80 hex gần giống nhưng khác giá trị (xám ~#9ca3af/#a1a6b9/#a8aec1/#9da2b6/#969bb0/#b4b9ca; nền ~#141620/#151923/#171923/#171b24/#15151d/#101118; tím nhạt ~#c4b5fd/#c4b5ff/#c5b8ff/#c6b8ff/#c2b0ff/#c8bbff)
  theo từng thành phần ở các PR sau, vì gộp sẽ đổi vài đơn vị màu. Sau Phase 1 còn khoảng 208 hex ngoài `:root`; màu visualization (cột, ô, nút đồ thị, `#22c55e` ×13, `#60a5fa` ×4) giữ nguyên.
- Chuẩn hóa 17 giá trị `border-radius`, 23 cỡ chữ và 31 giá trị spacing theo token đã định nghĩa (`--radius-*`, `--fs-*`, `--space-*`); mới chỉ các luật của sidebar (Phase 2) dùng token cỡ chữ/spacing/bo góc, phần còn lại của trang chưa áp (test canh gác không cho lan ra).
- Bốn alias chỉ dùng một chỗ, kèm giá trị dự phòng lỗi thời: `accent-color: var(--accent-color, #6366f1)`, `var(--surface-secondary, #111827)`, `var(--surface-color, #1f2937)`, `var(--panel-bg, rgba(255, 255, 255, 0.03))`.
  Alias luôn được định nghĩa nên giá trị dự phòng không bao giờ dùng tới; dọn khi động tới các thành phần đó.

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
