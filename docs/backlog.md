# Backlog AlgoVision

Việc còn tồn tại hoặc cần xác minh; việc đã được xếp giai đoạn vẫn giữ ở đây đến khi có bằng chứng xử lý.
Thêm mục khi phát hiện; chỉ đóng mục sau nghiệm thu, giữ các ghi chú lịch sử cần truy vết.
Lộ trình giai đoạn: [roadmap](roadmap.md#chuẩn-hóa-v100).

## Phân việc cho v1.0.0 (2026-11-14)

Thứ tự: UI v2-3 → C1 → EDU-1–4 → C2 (source) → C3 (test) → C4 (release v1.0.0) → C5 (cleanup).
Đây là phân việc dự kiến, không phải bằng chứng hoàn thành hay quyền triển khai giai đoạn chưa được duyệt.

| Giai đoạn | Việc còn mở / điều kiện đóng |
|---|---|
| UI v2-3 | UI v2-1 MERGED #53, UI v2-2 MERGED #54; CI Ubuntu/Windows PASS theo xác nhận của chủ dự án, browser QA vẫn NOT VERIFIED. Hoàn thiện Visualizer Light Minimal và kiểm shell/Dashboard/Library/Visualizer theo gate trong roadmap. |
| C1 | Rà lại từng mục cũ dưới đây với code hiện hành trước khi phân loại giữ/sửa/hoãn cho release; các mục đã có số đo lịch sử chưa phải lỗi tái hiện hiện tại. Chốt danh mục module/thao tác và acceptance v1.0.0. |
| EDU-1 | Nguồn giáo trình UIT CHƯA XÁC MINH: cần nguồn chính thức, metadata/phiên bản, quyền dùng và mapping chương/mục → module → kiến thức → trạng thái → nguồn. Không tự đặt tên/số chương, sao chép tài liệu có bản quyền hoặc đưa nguồn chưa xác minh vào nội dung release. |
| EDU-2–4 | Biên soạn độc lập theo mapping đã duyệt: nền tảng/Sorting/Searching → cấu trúc dữ liệu → Graph/BFS/DFS và rà học thuật toàn bộ. Giữ Big-O/mã giả đúng implementation; không tự thêm thuật toán hoặc chuyển module cũ sang generator. |
| C2 | Các ứng viên source/hiệu năng như `buildGraph`, logic Searching trùng và tên thuộc tính cần C1 xác nhận. Bắt buộc baseline và benchmark trước–sau, không giảm số test hoặc nâng bundle. |
| C3 | Các ứng viên ở mục “Tối ưu bộ test” chỉ thực hiện sau C2; profile thời gian/RSS/heap theo file, giữ số test/assertion và chứng minh mutation vẫn bị bắt. Những đề xuất đổi assertion cần duyệt riêng vẫn giữ điều kiện đó. |
| C4 | Bằng chứng trên release SHA: CI Ubuntu/Windows hoàn tất PASS, test/build/bundle, browser, accessibility và production smoke. Zoom thật 200%, Firefox/Safari, thiết bị thật, screen reader và Vercel smoke chưa được nghiệm thu cho UI v2; bằng chứng bắt buộc NOT VERIFIED chặn release. |
| C5 | Chỉ cleanup sau release; cần danh sách đường dẫn/ảnh hưởng và phê duyệt riêng trước mọi xóa/di chuyển. Không tự gộp cleanup vào C2/C3 hoặc xóa các ghi chú lịch sử. |

Các accepted risks R7 vẫn là lịch sử của lần nghiệm thu R7; không thay bằng chứng C4.
Không khôi phục theo dõi tiến độ cá nhân, lịch sử truy cập hay trạng thái học tập; đề xuất cũ trái quy tắc này
không thuộc v1.0.0. Chỉ dùng dữ liệu thật hoặc ghi “Minh họa”. Trần raw giữ JS <=154000 B, CSS <=58500 B;
mọi số đo bên dưới là lịch sử nếu chưa được tái đo trên SHA đang nghiệm thu.

## Lỗi
- (hiện không có mục nào)

## Hiệu năng
- `buildGraph` sao chép cả đồ thị sau mỗi lần thêm đỉnh/cạnh (O(n²)). Đo 2026-11-05: sao 300 đỉnh 39–73 ms, 1000 đỉnh 0,7–1,0 s,
  2000 đỉnh 5,6 s. Sửa không đổi hành vi: tách phần sửa tại chỗ dùng nội bộ, `buildGraph` sửa trên một bản nháp riêng; chứng minh
  bằng `deepEqual` với cách dựng cũ (gọi lần lượt `addVertex`/`addEdge`) trên cặp ngẫu nhiên có cạnh trùng, khuyên, cả hai chế độ.
  Chưa đủ để nâng test sao/đường thẳng lên 1000 đỉnh: DFS sao 1000 đỉnh mất 4,1 s, trong đó 2,6 s là bản sao đồ thị của từng bước.
  Đề xuất lịch sử cho giai đoạn 9; hiện là ứng viên C2, cần baseline/benchmark mới và phạm vi C1 duyệt.
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
- UI v2-2: lưới thẻ đã chuyển sang 1–3 cột theo diện tích thật, không ép thẻ cuối chiếm cả hàng; không làm lưới 4 cột. Cần browser QA tại 360, 700/701, 767/768, 900/901, 1100, 1279/1280, 1440 px: reflow, overflow, Tab/Shift+Tab, filter/live announcements, focus và disabled. Trình duyệt tích hợp timeout khi mở local; hiện NOT VERIFIED.
- Ghi chú lịch sử Phase 4: Thư viện Tìm kiếm ở 1280px từng dùng lưới `.algorithm-grid` cố định 3 cột với 2 thẻ, để trống cột thứ ba. UI v2-2 đã chuyển sang grid fluid/`auto-fit`; phần còn lại là kiểm reflow thực tế trên browser/PR Preview — NOT VERIFIED.
- R7d Closeout PARTIAL PASS: 137 Chrome browser QA case duy nhất tại `ef34955fa945a96336195c10dae6a5367ea2dfc6`, không phát hiện P0/P1 trong phạm vi đã kiểm; không suy rộng ra phạm vi chưa kiểm. Chủ dự án chấp thuận hoãn (accepted risks): Chrome browser zoom thật 200%, Vercel browser smoke ở 360/1280 CSS px, Firefox, Safari, thiết bị thật và screen reader đều NOT VERIFIED. Vercel deployment SUCCESS gắn đúng SHA không chứng minh browser smoke PASS. Touch emulation không phải thiết bị thật; DOM/live-region checks không phải screen reader QA. Các khoảng trống này được ghi nhận để kiểm tiếp, không coi là lỗi đã tái hiện hoặc QA toàn diện; xem `docs/development-baseline.md`.
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
- Lịch sử bundle: sau R4 JS 146.811 B/CSS 52.667 B; không phải baseline hiện hành. Trần lịch sử sau R6c là JS 150.500 B, CSS 57.500 B; ngân sách hiện hành sau R7a xem `docs/development-baseline.md`.
- Mở rộng rail bằng overlay ở 768–1279 px (Spec mục 7: "nút mở rộng ở đáy" của rail): R3 ẩn nút thu gọn trong dải này (quyết định 16); làm lại nếu cần mở nhãn mục ở tablet.
- Sidebar có thể cần cuộn ở viewport thấp: mục nav cao 44 px (R3) làm danh sách 11 mục + 3 nhãn dài hơn; vùng cuộn `.sidebar-scroll` đã có, xem số đo ở mô tả PR R3.
- Lệch Spec của shell còn lại sau R3 (rà soát độc lập): "HỌC TẬP" 13px tím nhấn có đường kẻ (Spec: 11px); thanh breadcrumb `.topbar` ở <= 767px cao 60px nằm dưới `.mobile-bar` 64px (Spec: một header 64px có menu, logo, search); padding ngang header theo `.main-content` (40/28), Spec 32; padding tablet 28 ở <= 1100px (Spec 24); ở 701-767px shell là drawer nhưng bố cục nội dung dùng luật của khối 700px (quyết định 16); sidebar padding 24/8/16 và logo 42px không nền (Spec: padding 20x16, logo 32px nền tím; logo đã chốt giữ nguyên); đường dọc và thụt 31px của mục con; trạng thái nav disabled (`#55556A`) chưa có; màu mục cuối breadcrumb `#e3e4ee` còn viết cứng.
- Rail do JS điều khiển (matchMedia) nên lần tải đầu ở 768-1279px có thể nháy sidebar mở rộng một nhịp trước khi JS bật rail; trình duyệt không có `MediaQueryList.addEventListener` (Safari < 14) không cập nhật khi đổi cỡ cửa sổ (không lỗi). Nếu cần, đưa dải rail xuống CSS thuần.
- Padding `.main-content` 40px/28px và chữ mục con 13px lệch Spec (32/24 px; 13,5 px): giữ để không đụng `hash-table-layout`; xem xét cùng 264 px nếu sau này đổi sidebar.
- 4 chỗ chữ nhãn đang dùng `--av-focus` (`#c4b5fd`) chỉ vì giá trị trùng hex cũ, không phải vai trò focus: `.array-count`, `.complexity-card strong`, `.linked-list-node-label`, `.linked-list-null`. Rà lại và đổi sang token đúng vai trò (ví dụ `--av-primary-text`) trong PR thiết kế màn hình tương ứng; sửa danh sách test cùng PR.
- Dashboard (R4) lệch Spec mục 8 có chủ ý, xem quyết định 17: chưa có lời chào "Xin chào, [Tên người học]" (tên là dữ liệu giả); bảng minh họa ghi "Bước 3/31" vì đó là số bước thật của generator (Spec mẫu ghi 3/10); thẻ và chip là `<button>` chứ không phải `<a href>` (app không có routing); lưới Nội dung nổi bật 1 cột ở <= 900 px (Spec 3 cột ở tablet; ở 768 px thẻ chỉ còn ~190 px); chip ở mobile xuống dòng chứ không cuộn ngang (vùng cuộn mới cần `tabindex`); card BFS không có badge độ khó (app chưa xếp độ khó cho BFS).
- Còn 14 alias tạm sau R6c (được `tests/design-tokens.test.js` khóa). R3 gỡ nhóm sidebar, R4 gỡ `--purple-strong`/`--purple-pressed`, R6a gỡ `--accent-color`, R6b gỡ `--purple`; alias còn lại chỉ gỡ theo kế hoạch từng PR, đổi mọi chỗ dùng sang `--av-*` và cập nhật test cùng PR.
- `--border-control` (`#6B6B87`) đã được áp ở Dashboard, Thư viện và một số điều khiển Visualizer (R6b). Backlog cũ liệt kê `.size-control select`, `.search-toolbar input`, `.array-operation-card input`, `.bst-toolbar input, .bst-toolbar select`, `.control-button`, `.primary-button`, `.search-range-panel`; cần đối chiếu từng selector với `src/style.css` trước khi đánh dấu xong, rồi quét toolbar Hash Table/Graph. Quyết định 13 vẫn yêu cầu đo theo màn hình; không mặc định mọi selector trong danh sách đều chưa xử lý.
- R6b đã gỡ `--purple` khỏi canvas BST/Hash/Graph (13 vị trí cũ chuyển sang `--av-primary-text`). R6c đổi dấu ✓ Graph sang `--av-text`; còn 12 chỗ `#22c55e` theo `tests/design-tokens.test.js`. Việc gom các màu trạng thái còn lại vào token là dọn dẹp riêng, cần rà theo vai trò và không được làm đổi màu ngoài phạm vi.
- Còn hex trùng giá trị Spec nhưng Spec không đặt tên token (danh sách ngoại lệ `SPEC_HEX_EXCEPTIONS` trong test): `#fca5a5` (danger-text, 3 chỗ), `#60a5fa` (accent-icon, 2 chỗ). Đặt tên token khi R3–R6 cần rồi xóa mục khỏi danh sách.
- Cỡ chữ lệch bậc Spec nên R2 chưa áp token: `.algorithm-symbol`/`.structure-card-icon` 20px, `.stat-card strong` 21px, `.complexity-card > span`/`p` 11px (xem `FONT_SIZE_SKIPPED` trong `tests/av-tokens.test.js`); input/select không khai báo `font-size`. Quyết theo từng màn hình ở R3–R6.
  Nơi có thể cắt: chuỗi tiếng Việt lặp.
- Cột Insertion đang so sánh nằm trong đoạn đã sắp xếp (khoảng 94% số cột so sánh của Insertion trong mẫu đo 300 mảng) chỉ hiện "đang so sánh",
  mất cue "đã sắp xếp" (`is-comparing` thắng `is-sorted`, `src/sorting-bar-state.js`). Hiện cả hai phải sửa test "cột đang so sánh trong vùng
  đã sắp xếp vẫn hiển thị trạng thái so sánh (Insertion Sort)" và cần cue kết hợp; chú giải Insertion đã ghi "kể cả cột nằm trong đoạn đã sắp xếp".
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
- (R6a đã giải quyết) chỉ báo "Bước x/y" và tốc độ nay thống nhất ở 5 module bằng `src/step-tools.js`; thẻ thống kê "Tiến trình k / N" của Sắp xếp vẫn tồn tại; cần xác minh có trùng thông tin sau khi dùng giao diện R6a/b.
- R6a (từ review độc lập; chưa xác minh trên trình duyệt thật): (1) kéo slider khi đang chạy có thể bị `sync` đặt lại `slider.value`; kết quả seek khi thả vẫn theo giá trị lúc thả. (2) đổi tốc độ khi đang chạy có hiệu lực từ lần đặt timer kế tiếp. (3) dấu ✓ làm nút tốc độ rộng thêm vài px. (4) trình đọc màn hình có thể đọc lặp "Bước, Bước x/y". Kiểm tra hành vi trước khi chọn cách sửa. Ghi chú CSS dư 17 B là số liệu lịch sử trước R6b; hiện dùng baseline/ngân sách sau R7a trong `docs/development-baseline.md`.
- R6b/R7 (a): thanh trượt bước hiện chỉ cập nhật chữ khi kéo, hình vẽ cập nhật khi thả (quyết định 29). Người dùng sẽ thử trên preview; nếu cần xem trước khi kéo thì gọi `seek` theo sự kiện `input` kèm thông báo aria-live gộp (chỉ đọc khi dừng kéo hoặc khi thả), không phá quyết định 29.
- R6b/R7 (b): kiểm tra thẻ thống kê `#step-count` ("k / N") của Sắp xếp và nhãn "Bước x/y" của thanh bước có trùng thông tin không; nếu thừa thì gỡ một trong hai (và sửa test `sorting-controller`, `simulation-visibility`).
- R6b (từ review độc lập): (1) accordion bọc `.learning-section`/`.learning-block`/`.complexity-panel` vốn đã có viền, nền, bo góc và padding nên viền kép và nội dung hẹp thêm khoảng 34 px; lề cũ (`.complexity-panel`, `.learning-section`, `.bst-code-panel`) thành mã chết/cộng dồn: dọn ở R7. (2) Tiêu đề trùng: `<summary>Mã giả</summary>` với `<h4>Mã giả</h4>` (Sắp xếp, Tìm kiếm) và "Kiến thức" với `.learning-heading h3`; trình đọc màn hình đọc lặp: ẩn một trong hai. (3) Khối Kiến thức của Sắp xếp/Tìm kiếm còn 3 `.learning-block` trong lưới 2 cột nên khối cuối đứng lẻ. (4) Bảng so sánh của Đồ thị (`.graph-complexity-table td { white-space: nowrap }`) có thể tràn trong khung hẹp 360 px sau khi accordion lấy thêm lề; đo trang không tràn ngang nhưng chưa đo bên trong khung: bọc `overflow-x: auto` nếu cần. (5) Test "số lượng": `tests/canvas-colors.test.js` kiểm `>= 13` chỗ `var(--av-primary-text)` (lỏng), bù bằng test đếm đúng 13 ở `design-tokens.test.js`.
- R6: chưa có phím tắt nào (→, ←, Space, Enter, n, r, p không đổi gì). Cần thiết kế, tránh xung đột khi gõ vào ô nhập.
- R17: nút/ô nhập cao 38–42px ở 360px (BST, Hash: "Quay lại" 38, ô chọn 42, ô nhập 40, "Thực hiện" 39, nút preset 40; thanh tốc độ cũ 16px đã được thay ở R6a bằng thanh trượt bước và nút tốc độ cao 44px);
  trên mức tối thiểu 24px của WCAG 2.2, dưới mức khuyến nghị 44px.
- R18: Sắp xếp không cho nhập mảng hay chọn preset (chỉ "Tạo mảng mới" ngẫu nhiên), nên không thử được mảng đã sắp xếp, đảo ngược, trùng toàn bộ.
- Một số viền ô nhập còn dùng `--border` cũ; rà theo selector và computed style trước khi kết luận mức 1,33:1 còn đúng sau R6b. Nâng theo `--border-control` khi đúng thành phần điều khiển; đối chiếu quyết định 13 và danh sách selector ở mục trên.
- Chuyển giá trị toàn cục `--border` (sang #2A2A3D), `--text-muted` (sang #9CA2BA) và bảng nền (`--background`/`--panel`/`--panel-hover` sang `--bg`/`--surface`/`--surface-raised`, `--purple-dark` sang `--purple-strong`) trong MỘT PR riêng
  (Redesign Phase 2 chỉ áp token mới cho sidebar và nút chính, không đổi giá trị toàn cục): cần ghi mức đổi màu, đo lại tương phản, sửa test "10 token gốc" và hàng gom hex. Hiện hai bảng nền cùng có mặt trong `:root`
  (sidebar `--bg-sidebar` #0E0E19 và vùng nội dung `--background` #0c0d12 lệch nhẹ), dễ nhầm.
- `--shadow-card` (`0 8px 24px rgba(0, 0, 0, 0.35)`, nay dùng cho tooltip của sidebar thu gọn) và `--glow-purple` (`0 0 0 1px rgba(155, 130, 255, 0.35), 0 8px 28px rgba(155, 130, 255, 0.18)`, chưa dùng) là giá trị tạm do Phase 1 tự chọn, test chốt cứng; xem lại khi áp rộng hơn.
- Ký hiệu ngoài `unicode-range` của JetBrains Mono (chỉ có latin và vietnamese) rơi về font hệ thống. Đo 2026-11-06 (Chrome 152, Windows): → và ∅ (danh sách kề) và Θ (bảng độ phức tạp đồ thị, chữ Hy Lạp) về Consolas;
  ▶ (thứ tự thăm BFS/DFS, ngăn xếp DFS, nhãn bảng băm) về Segoe UI Symbol. Ký hiệu khác như ≤ ✓ chưa đo trong thành phần font mã. Trên Linux, fallback của `monospace`/`system-ui` chưa kiểm (xem preview Vercel).
  Cân nhắc thêm subset greek hoặc vẽ ký hiệu bằng SVG/CSS.

- Thư viện: thẻ, tab, ô tìm và bộ lọc đã triển khai ở Phase 4/R5a/R5b. Mobile bottom sheet chưa triển khai; quyết định 26 ghi rõ không làm bottom sheet khi không còn select. Xem xét lại chỉ khi có yêu cầu thiết kế mới. Visualizer của năm module có controller đã triển khai trong R6; chuyển Array/Stack/Queue/Linked List thành mô phỏng theo bước và token toàn cục vẫn là việc riêng.
- Tìm kiếm nhanh (Ctrl K) và nhớ trạng thái thu gọn của sidebar giữa các lần mở: chưa làm (trạng thái sidebar hiện chỉ trong bộ nhớ của phiên). Spec v1.0 mục 7 muốn nhớ trạng thái thu gọn: khi làm phải cập nhật `tests/meta/no-web-storage.test.js` cùng PR.
- Thuật toán mới (ngoài 3 sắp xếp, 2 tìm kiếm): mỗi thuật toán thêm thẻ `data-algorithm`/`data-search-algorithm`; số thẻ ở `tests/library-cards.test.js` và nhãn đếm viết cứng trong `app.html` phải cập nhật tay.
- UI v2-1 đã thống nhất hover của shared controls cho nút đang bật, disabled dùng nền/chữ trung tính không giảm opacity; giữ thuộc tính disabled và logic cũ. QA Chrome cho UI mới ở 360/767/768/1279/1280/1440 CSS px còn NOT VERIFIED do chưa có kết nối Chrome/CDP khả dụng trong phiên sandbox; không suy rộng 137 case R7. Số đo Foundation lịch sử: CSS raw 58460 B còn 40 B dưới trần; sau UI v2-2 CSS raw 57994 B còn 506 B: các PR Dashboard/Library/Visualizer tiếp theo phải đo lại và thay/gom luật cũ trước khi thêm CSS.
- Redesign v1.0, header: ô tìm Ctrl K toàn cục và chip tài khoản "[Tên người học]" (avatar "?") chưa làm. Spec mục 14: chưa có thiết kế kết quả tìm kiếm hay command palette; tài khoản chỉ là placeholder (dữ liệu giả, `docs/design/decisions.md` mục 5).
- Redesign v1.0, sidebar: Spec mục 7 muốn nhớ trạng thái thu gọn giữa các phiên. Muốn làm phải sửa `tests/meta/no-web-storage.test.js` (hiện cấm `localStorage`/`sessionStorage` trong `src`) cùng PR đó.
- Redesign v1.0, sidebar 264 px (Spec) so với 256 px đang mở: R3 (#34) đã triển khai tablet rail 72 px ở 768–1279 px; rail không làm đổi bề rộng Sidebar khi mở. Chênh lệch 264/256 px với Spec vẫn còn. Nếu đề xuất đổi sang 264 px, cần đánh giá lại `--sidebar-width`, `tests/sidebar-css.test.js` và `tests/hash-table-layout.test.js`; chuỗi chaining 15 khóa rộng 842 px phải vẫn vừa khung ở 1280 px.
- Redesign v1.0, điều hướng: Spec mục 7 có mục "Đệ quy", gộp "Ngăn xếp và hàng đợi", và mục "Trực quan hóa" ở gốc. Hiện không có nội dung Đệ quy, Ngăn xếp/Hàng đợi vẫn là hai màn hình riêng; mục nav "Trực quan hóa" đã được giải quyết ở R5a/R5c theo quyết định 14/22 bằng trang Giải thuật, không thêm mục nav riêng. Chỉ xem lại các khác biệt còn lại nếu có yêu cầu thiết kế mới.
- Redesign v1.0, Visualizer (Spec mục 10): thanh trượt bước và `seek(index)` đã triển khai ở R6a cho năm module có controller. Ô nhập dữ liệu (số nguyên 1–99, tối đa 12 phần tử), chip Mẫu dữ liệu (Ngẫu nhiên, Gần sắp xếp, Đảo ngược, Có phần tử trùng) chưa triển khai; nhập mảng cho Sorting trùng với mục R18 ở trên.
- Redesign v1.0, thẻ cấu trúc dữ liệu: Spec mục 9 và 17 muốn độ khó, phân loại, Thời gian/Bộ nhớ trên card; 7 cấu trúc chưa có nguồn dữ liệu thật cho các trường này nên Phase 4 bỏ chúng (số giả bị cấm). Cần nguồn dữ liệu thật (và đối chiếu với code, như thẻ thuật toán đối chiếu Learning Panel) trước khi thêm.
- Artboard của Spec (ảnh PNG, trang "AlgoVision Design") không có trong repo; khi có thư mục design-source thì đặt ảnh vào `docs/design-refs/` và trỏ tới từ `docs/design/spec.md`.

- Trang Giải thuật (R5a) không có mục sidebar nào active (quyết định 22): người học thấy vị trí qua breadcrumb "AlgoVision / Giải thuật" và tab đang chọn. Nếu muốn tô sáng thì cần quyết định thêm mục nav hoặc tô nhóm THUẬT TOÁN (Spec mục 7 có mục cha "Giải thuật").
- Thư viện (R5b) lệch Spec mục 9 có chủ ý (quyết định 26): chip của tab Giải thuật do R5b tự chọn theo ba section thật (Spec chỉ nêu chip của Cấu trúc dữ liệu); không có nút "Bộ lọc" và bottom sheet ở tablet/mobile (không còn select để mở); chip xuống dòng thay vì cuộn ngang (vùng cuộn mới cần `tabindex`).
- R7c đã giải quyết qua PR #51: Library debounce/dedupe, loại thông báo stale và cleanup thông báo chờ; Searching dùng một kênh live; Queue bỏ live trên vùng vẽ, giữ status. DOM A1–A8 PASS là bằng chứng lịch sử, không chứng minh trải nghiệm screen reader thật.
- Live announcements còn chưa chứng minh cho Sorting/BST/Hash/Graph: chưa xác minh đã ngăn thông báo mỗi timer tick, gộp theo thao tác có ý nghĩa và xử lý thông báo cũ khi reset/đổi màn. Không coi PR #51 đã giải quyết toàn bộ năm Visualizer có controller; cần audit riêng, giữ `role="alert"`, focus và semantics controller.
- Thẻ thuật toán (R5c) lệch Spec mục 9 có chủ ý (quyết định 27): giữ lưới 3 cột thay vì 4 cột desktop / 2 cột tablet (đo: ở 1280 px vùng nội dung 944 px, 4 cột chỉ còn khoảng 218 px mỗi thẻ, hàng "Thời gian (xấu nhất)" + O(...) không vừa); giữ icon + badge ở hàng đầu và không thêm nhãn phân loại bên phải (tiêu đề section đã nói rõ); không làm thẻ gọn của tablet (thời gian trái, bộ nhớ phải); chữ badge giữ CƠ BẢN/TRUNG BÌNH (Spec ghi Dễ/Trung bình/Khó; ○ Khó chưa dùng vì dữ liệu không có mức Khó). Xét lại lưới 4 cột khi bố cục có thêm chỗ (ví dụ sidebar rail ở desktop).
- R7 (giao diện): lưới thư viện dùng 4 cột từ khoảng >= 1440 px (Spec mục 9: lưới 4 cột; ở 1280 px vùng nội dung chỉ 944 px nên chỉ vừa 3 cột, xem quyết định 27). Kiểm tra cỡ 12 px của ký hiệu ● ◐ trong badge độ khó có đủ rõ không (R5c giữ 12 px theo Spec mục 6).
- Hai select lọc Độ khó và Độ phức tạp của Spec mục 9 bị hoãn (quyết định 19): kích hoạt lại khi tab Giải thuật có >= 10 thẻ (hiện 7).
- Ở trang Giải thuật có hai thẻ cùng trạng thái `selected` (Bubble Sort và Linear Search): đó là thẻ thuật toán đang chọn của hai màn riêng, theo hành vi cũ; xét lại khi làm lại thẻ ở R5c.
- Quay lại từ một màn chi tiết đưa focus về `body` (nút "Quay lại" bị ẩn cùng màn chi tiết); nên chuyển focus về thẻ vừa mở. Hành vi có sẵn, chưa đổi ở R5a; xét ở R7.

## Nội dung học thuật (hoãn, KHÔNG làm trong chuỗi Redesign hiện tại)
- D3 chưa quyết: chờ đề cương môn học.
- D7: nguyên tắc trần bundle cho chunk nội dung (nội dung dài tách chunk, tải khi cần, trần riêng ngoài trần JS/CSS của shell).
- D8: nội dung học thuật dài đặt trong panel của Visualizer (không tạo trang đọc riêng).
- D9: câu hỏi ôn tập hoãn sau R6; không chấm điểm, không lưu (quy tắc a).
- D10: nâng Array, Stack, Queue, Linked List lên mức có hàm sinh bước, sau R7 và sau cơ chế tách chunk.

## Dọn dẹp
- `viewchange.detail.topic` vẫn là hợp đồng cần giữ: `navigation.js` phát topic khi mở chi tiết, và `sidebar.js` đọc nó từ R6c để quản lý trạng thái Sidebar. Không gỡ `topic`/`topicId` khi còn được dùng và test bảo vệ.
- Dữ liệu `algovision:progress` đã ghi vào `localStorage` của người dùng trước khi gỡ tiến độ vẫn nằm trong trình duyệt của họ (khoảng dưới 2 kB, không ai đọc). Không có mã xóa; nếu muốn dọn thì thêm
  một lần `removeItem` lúc khởi động và sửa `tests/meta/no-web-storage.test.js` cùng PR (hiện canh gác cả src không được nhắc `localStorage`).
- Đổi tên thuộc tính nội bộ `dequeues`/`dequeuesLabel` trong `src/graph.js` cho khớp `#graph-traversal-count` (không đổi hành vi).
- Khoảng trắng cuối dòng và newline cuối file chưa khớp `.editorconfig`: thiếu newline cuối ở `src/linked-list.js`,
  `src/structures/linkedList.js`, `tests/linked-list.test.js`; khoảng trắng cuối dòng ở `src/array.js:14`, `src/sorting.js:34`,
  `tests/navigation.test.js:88`, `public/templates/app.html:78`. Dọn trong một commit riêng để editor không sinh diff lẫn.
- Gom khoảng 80 hex gần giống nhưng khác giá trị (ước lượng lịch sử sau Phase 1; cần đo lại trước khi dùng làm baseline) theo từng thành phần ở các PR sau, vì gộp sẽ đổi vài đơn vị màu. R6c đổi một chỗ `#22c55e` (dấu ✓ Graph) sang `--av-text`; test token hiện khóa 12 lần xuất hiện của `#22c55e`. Không gộp màu trạng thái chỉ để giảm số lượng hex.
- Chuẩn hóa 17 giá trị `border-radius`, 23 cỡ chữ và 31 giá trị spacing theo token đã định nghĩa (`--radius-*`, `--fs-*`, `--space-*`); mới chỉ các luật của sidebar (Phase 2) dùng token cỡ chữ/spacing/bo góc, phần còn lại của trang chưa áp (test canh gác không cho lan ra).
- Còn 22 chỗ dùng `var(--text-secondary|--border-color|--card-background, <giá trị dự phòng>)` (`style.css`): ba alias luôn được định nghĩa trong `:root` nên giá trị dự phòng không bao giờ dùng tới;
  bỏ được bằng cách như PR `chore/bundle-headroom` (so computed style ở 360px và 1280px). Cùng loại: `.array-panel` và `.array-operation-card` còn `background`/màu viền bị luật `.array-panel, .array-operation-card` ở cuối khối Array ghi đè.

## Tối ưu bộ test (C3, sau C2; không làm trong chuỗi UI v2)
- (a) Helper dựng DOM happy-dom từ `public/templates/app.html` được gọi cho MỖI test ở nhiều file (ví dụ `withFilter` trong `tests/library-filter.test.js`, `withTabs`, `withLibrary`, `withNavigation`): đo chi phí dựng mỗi lần và cân nhắc dựng một lần mỗi file khi test chỉ đọc (test có thao tác sửa DOM vẫn cần DOM mới).
- (b) Ít nhất 5 file test cùng phân tích `src/style.css` riêng (`library-css`, `library-filter-css`, `sidebar-css`, `design-tokens`, `av-tokens`; thêm `dashboard-*`): đo chi phí phân tích rồi quyết có chung một helper phân tích (tính một lần mỗi tiến trình) hay không.
- (c) Mỗi PR Redesign thêm khoảng 38–45 test nên thời gian chạy bộ test tăng dần (25–31 s ở 1527 test; có lần đo 38,7 s khi máy bận): theo dõi bằng skill `test-profile` trước và sau khi làm (a), (b).
- (d) Test tham số hóa theo thẻ (`tests/library-complexity-bar.test.js`, `tests/library-difficulty.test.js`) có thể đang dựng DOM cho MỖI thẻ: đo rồi dựng một lần mỗi file khi test chỉ đọc.
- (e) Các test đếm TUYỆT ĐỐI số chỗ dùng token trong `tests/design-tokens.test.js` (ví dụ `--font-mono` dùng đúng N chỗ) phải sửa ở mọi PR có CSS mới (R4: 8 -> 9, R5c: 9 -> 10). ĐỀ XUẤT: đổi sang khẳng định theo ý nghĩa (ví dụ "mọi font mã đều qua `var(--font-mono)`, không khai báo font mã cứng"). CẦN NGƯỜI DÙNG DUYỆT trước khi đổi; làm sau R7.
- (f) `tests/simulation-controller-seek.test.js` kiểm controller thuần, không cần DOM nên nhanh: là khuôn đáng giữ cho test logic. `tests/controller-seek-render-purity.test.js` dựng ứng dụng đầy đủ (DOM cho 5 module) nên cần đo chi phí (`test-profile`) trước khi quyết giữ nguyên hay gộp dựng DOM.
- (h) Có >= 6 file test phân tích `src/style.css` riêng (thêm `step-tools-css`): đo rồi dùng chung một helper đã phân tích sẵn (một lần mỗi tiến trình, không mỗi file).
- (i) `step-tools-wiring`, `step-tools`, `controller-seek-jump` dựng nhiều lần ứng dụng/module: mở rộng `tests/helpers/visualizer-modules.js` để dựng DOM một lần mỗi file khi test chỉ đọc.
- (j) Các test lặp theo "6 màn hình" (`VISUALIZER_MODULES`) nên tham số hóa một chỗ thay vì vòng lặp ở từng file.
- (g) Gom danh sách phép phá từ các mô tả PR đã có (controller-seek: 16 phép của `seek` + 5 phép bộ vẽ; R5a, R5b, R5c: file cấu hình `mc*.mjs` và bảng "Phá thử" trong `pr-*.md`) thành một kho đầu vào cho bước lưới an toàn của đợt tối ưu test sau R7: mỗi phép phá phải còn bị bắt sau khi gộp hoặc đổi test.

## Công cụ
- `compareSearchAlgorithms` (`src/searching.js`) trùng lặp logic với phần chạy từng thuật toán; gom lại khi sửa module Searching (D15).
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
