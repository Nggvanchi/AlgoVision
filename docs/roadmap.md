# Lộ trình AlgoVision

## EDU2-F — Closeout hiện hành, 25/11/2026

**EDU-2 CLOSED theo owner acceptance:** hoàn tất 5/5 OP (OP-16–20), gồm nền tảng chi phí, Sorting, Searching và Compare trong phạm vi đã nghiệm thu; academic acceptance toàn dự án **5/40**, không nâng 35 OP còn lại. Đây là quyết định closeout owner đã phê duyệt; bản đồng bộ docs EDU2-F này **chưa commit/PR/merge**, không giả nhận đã publish patch hoặc có CI mới.

- Baseline sản phẩm: [PR #78](https://github.com/Nggvanchi/AlgoVision/pull/78) đã MERGED, SHA [`71c840b8b417fed4a752fd43749e76db8a4ae53d`](https://github.com/Nggvanchi/AlgoVision/commit/71c840b8b417fed4a752fd43749e76db8a4ae53d), tree `ff0c79c3a4e085f6b89dfd84416e4ff9c1eeabcf`. [Mapping/acceptance và G5 bridge](education/knowledge-mapping.md#14-edu2-f--owner-closeout-25112026) nối hồ sơ OP-16–20; quyền công bố chỉ áp dụng nội dung AlgoVision tự biên soạn thực tế được owner xác nhận.
- **Evidence hiện hành tại BASE:** [CI hậu merge 45637065693](https://github.com/Nggvanchi/AlgoVision/actions/runs/45637065693), event push/main đúng merge SHA, Ubuntu/Windows **1810/1810 PASS**, không skip; test/build/encoding SUCCESS. Đây là CI hậu merge, khác local QA và CI PR.
- **Evidence tái sử dụng theo runtime blob/hash:** AC3b-ex04-1795611082619 — full local 1810/1810, JS/CSS raw **153845/58016 B** (headroom **155/484 B**); TDD 3 RED/GREEN và một negative control wording đã khôi phục byte/hash; Chrome Sorting **12/12** (3 thuật toán × 360/768/1280/1440×900 CSS px, DPR delta≤1e-6), ảnh inline đã review. Searching/Compare reuse 8 cases/568 assertions theo hash; không coi là lần chạy mới hoặc production QA. EDU2-F docs-only không lặp test/build/browser khi runtime nguyên byte.
- **Lịch sử:** checkpoint AC3b, OP20, EDU-R và các mốc trước đó giữ nguyên; chữ “hiện hành”, PARTIAL, 0/40 hoặc chưa commit/merge trong các checkpoint đó mô tả thời điểm ghi nhận. Trạng thái mới đọc tại EDU2-F; không viết lại evidence cũ hoặc gán số liệu #77 cho lần đo #78.
- **Giữ nguyên:** 8 source ID, 40 OP/80 mapping ID, source_status và routing lịch sử 2 READY/38 DEFER. Quyền tài liệu bên thứ ba **RIGHTS_NOT_VERIFIED**; owner closeout không cấp quyền bên thứ ba hoặc nâng source_status.
- **Residual bắt buộc:** EX-03 historical NOT VERIFIED; EX-04 chỉ chấp nhận baseline config hiện tại, historical config drift vẫn NOT VERIFIED. **ARTIFACT_PERSISTENCE_NOT_VERIFIED**, runtime Chrome profile isolation và cleanup toàn bộ process/profile **NOT VERIFIED**. Insertion step-limit **C2**, negative/mutation **C3**, bắt buộc trước release, không miễn G-STRUCT.
- **Tiếp theo:** EDU-3 **READY FOR PLANNING, NOT STARTED**; chưa triển khai hoặc tự mở scope. G-EDU/G-STRUCT/G-RELEASE và C4 còn mở; giữ dependency v1.0.0 và mọi gate screen reader/cross-browser/production.

## EDU2-AC3b — Acceptance sync (25/11/2026)

- **EDU-2: IN_PROGRESS/PARTIAL, chưa CLOSED.** Năm OP-16–20 đã TECHNICAL CLOSED; owner chấp nhận claims trong phạm vi AC2a/AC3a và căn cứ công bố nội dung tự biên soạn thực tế. Academic acceptance hiện hành **5/40**, không nâng 35 OP còn lại. Bản sync này **chưa commit/publish/merge**; closeout chính thức cần review riêng.
- [Mapping và G5 bridge](education/knowledge-mapping.md#13-edu2-ac3b--acceptance-hiện-hành-op-1620) nối hồ sơ OP-16–20, technical PR và [#77](https://github.com/Nggvanchi/AlgoVision/pull/77), BASE `e558deed7b8daba179520367722db9edeec5e757`. Giữ 8 source ID, 40 OP/80 mapping ID, routing lịch sử 2 READY/38 DEFER, source_status và lịch sử; các checkpoint 0/40/REVIEW_PENDING bên dưới là trạng thái tại thời điểm cũ.
- Quyền chỉ áp dụng nội dung AlgoVision tự biên soạn đã được owner xác nhận; tài liệu bên thứ ba vẫn **RIGHTS_NOT_VERIFIED** theo Policy B. Không suy quyền từ MIT, technical PASS hoặc owner approval; không ingestion mới.
- Insertion step-limit **DEFER C2**, negative/mutation **C3**, bắt buộc trước release, không miễn **G-STRUCT**. G-EDU/G-STRUCT/G-RELEASE toàn dự án, C4/production và screen reader/cross-browser còn mở; chưa mở EDU-3/UI v3.
- Evidence lịch sử #77: 1810/1810 tests, mutation/control 5/5, raw JS/CSS 153834/58016 B; [CI hậu merge 45549814244](https://github.com/Nggvanchi/AlgoVision/actions/runs/45549814244) Ubuntu/Windows test/build/encoding trên BASE. Không nhận đây là lần đo AC3b; kết quả AC3b và browser Sorting phải có evidence mới, Searching/Compare chỉ reuse theo hash/phạm vi nguyên byte.
- **EX-03 historical NOT VERIFIED** giữ nguyên. EX-04 chấp nhận baseline config hiện tại; historical config drift, runtime Chrome profile isolation và cleanup toàn bộ process/profile vẫn NOT VERIFIED. Không thay dependency/scope/exit gate.

Giữ các bảng dưới đây làm lịch sử. Lộ trình tiếp theo và gate v1.0.0 nằm ở mục
[Chuẩn hóa v1.0.0](#chuẩn-hóa-v100). Chỉ bắt đầu giai đoạn mới khi người dùng duyệt kế hoạch;
mỗi PR một branch, một mục tiêu nhỏ (quy trình: skill `module-workflow`). Một giai đoạn có thể tách
thành nhiều PR tuần tự; cập nhật trạng thái theo bằng chứng của từng PR.

| Giai đoạn | Nội dung | Trạng thái | PR |
|---|---|---|---|
| 1–4 | Nền tảng: Sorting, Searching, Array, Stack, Queue, Linked List; bố cục và CSS | Xong | trước khi dùng PR (commit trực tiếp), #1, #2 |
| 5 | Chuẩn hóa Simulation Controls (bộ điều khiển dùng chung, scheduler inject được) | Xong | #3 |
| 6 | Learning Panel: mã giả tô theo bước, lý thuyết, Big-O khớp code | Xong | #4 |
| 7 | BST, Hash Table, Graph, BFS, DFS; dọn dẹp sau giai đoạn | Xong | #5, #6, #7, #8, #9, #10 |
| — | Công cụ Claude Code (rule, skill, `docs/architecture.md`) | Xong | #11 |
| — | Cấu trúc repo: CI, `.editorconfig`, LICENSE, roadmap/backlog, README | Xong | #12 |
| — | Gia cố bộ test: dọn cửa sổ happy-dom, chốt số bước, test canh gác, timeout | Xong | branch `chore/test-hardening` |
| 8 | Tiến độ học tập bằng `localStorage` (xử lý dữ liệu lỗi/thiếu) | Xong: lưu dữ liệu tiến độ (chủ đề đã mở, lần mở đầu/gần nhất, số lần mở); giao diện đọc và xóa ở Redesign Phase 3b | branch `feat/progress-storage`; giao diện: Phase 3b |
| 9 | Kiểm thử tổng thể, UI/UX, deployment | Một phần: deployment xong (Vercel, tự deploy từ `main`) | — |
| — | Redesign Phase 1: token thiết kế, font tự host (Be Vietnam Pro, JetBrains Mono), gom 13 hex khớp đúng token; không đổi diện mạo trừ font | Xong | branch `feat/ui-tokens-fonts` |
| — | Redesign Phase 2: sidebar nhóm (Thuật toán / Cấu trúc dữ liệu, 7 mục con), thu gọn 72px, drawer mobile, landmark `<nav>`, `aria-current`; sửa tương phản nút "Bắt đầu học" và logo | Xong | #24 (`feat/sidebar-groups`) |
| — | Redesign Phase 2b: sprite SVG tự vẽ cho icon điều hướng, breadcrumb động và `document.title` theo màn hình, khóa cuộn nền khi drawer mở, thanh cuộn tối của sidebar, mục active dạng pill | Xong | #25 |
| — | Dọn mã chết và khai báo CSS thừa để có chỗ trong ngân sách bundle (JS -542 B, CSS -1.282 B), không đổi diện mạo | Xong | #26 (`chore/bundle-headroom`) |
| — | Redesign Phase 3b: Dashboard và Learning Progress: trang "Tiến độ học tập" (`#progress-section`, mục thứ hai của sidebar), khối tiến độ và nút hero theo ngữ cảnh ở Dashboard, "Mở lại" chủ đề, xóa lịch sử qua khung xác nhận (đường riêng cho dữ liệu của phiên bản mới hơn), `subscribe` và sự kiện `storage` giữa hai tab; chỉ nói "đã mở" | Xong | #27 (`feat/dashboard-learning-progress`) |
| — | Redesign Phase 4: Thư viện, chỉ thẻ: thẻ thuật toán Sắp xếp/Tìm kiếm làm lại (pill độ khó, hàng Thời gian (xấu nhất) và Bộ nhớ khớp Learning Panel, trạng thái Đã mở / Chưa mở đọc từ tiến độ, "Trực quan hóa →"), thẻ Cấu trúc dữ liệu chung khung (không hàng Thời gian/Bộ nhớ, không pill độ khó, cùng trạng thái), id #sorting-algorithm-library; không đổi màn chi tiết. Dùng trần bundle riêng đã duyệt (JS 160 kB / gzip 46,9 kB; CSS 56 kB / gzip 11,0 kB). Không làm thêm PR gỡ mã chết trước Phase 4: số đo cho thấy chỉ gỡ được khoảng 0,1 kB CSS và dưới 0,3 kB JS (PR #26 đã gỡ lượt đầu) | Xong | #29 (`feat/library-cards`) |
| — | Gỡ Tiến độ học tập và nhãn Đã mở/Chưa mở theo Spec v1.0 (mục 16–17): trang Tiến độ, khối tiến độ và nút hero ở Dashboard, mục sidebar, kho `localStorage`, `library-status` | Xong | #30 (`chore/remove-learning-progress`) |
| — | Redesign Phase 4, mục 3c: tab gộp "Thư viện", ô tìm, bộ lọc, sheet mobile, sidebar tự thu gọn ở tablet (701–1024px) | Một phần: tab/ô tìm/bộ lọc hoàn thành ở R5a/R5b (#36/#37); mobile bottom sheet chưa triển khai (quyết định 26 không làm bottom sheet). Tablet rail 72px đã triển khai ở R3 (#34), breakpoint 768–1279px; không mặc định rail này đáp ứng đầy đủ yêu cầu tự thu gọn Sidebar của Phase 4 vì phạm vi breakpoint và hành vi khác nhau. Cần đối chiếu riêng yêu cầu Sidebar của Phase 4 nếu đây vẫn là yêu cầu sản phẩm | #34, #36, #37 |
| — | Redesign Phase 5: khung Visualizer chung cho Sorting và Searching (tiêu đề, thanh điều khiển, thống kê, chú giải, Learning Panel) | Một phần đã xác nhận trong R6a/R6b/R6c: thanh bước/tốc độ dùng chung, panel accordion trên 5 Visualizer có controller, tương phản một số trạng thái và Sidebar khi vào Visualizer desktop. Mức hoàn tất của các thành phần Phase 5 còn lại (tiêu đề, thống kê, chú giải và phạm vi ngoài các hạng mục R6) cần đối chiếu riêng; chưa tuyên bố hoàn thành toàn Phase 5 | #40, #41, #42 |
| — | Redesign Phase 6: workspace cấu trúc dữ liệu, chia hai phần: (1) Array, Stack, Queue, Linked List; (2) BST, Hash Table, Graph | Một phần: (1) chưa làm; (2) các Visualizer có controller dùng chung điều khiển/panel từ R6a/R6b và hoàn tất R6c; Array/Stack/Queue/Linked List vẫn là module cũ không có hàm sinh bước | #40, #41, #42 |

## Redesign v1.0 (Spec v1.0)

Hướng thiết kế hiện tại: `docs/design/spec.md`; quyết định đã chốt: `docs/design/decisions.md`. R1 là PR đưa hai tài liệu này và lộ trình vào repo (chỉ docs). Mỗi PR dưới đây một nhánh ngắn từ `main`;
số PR ghi sau khi tạo PR. Các dòng Phase 5/6 ở bảng tổng quan phía trên là mốc lịch sử; trạng thái đã được phân rã và cập nhật chi tiết trong bảng R2–R7 dưới đây.

| PR | Nhánh gợi ý | Nội dung | Trạng thái | Số PR |
|---|---|---|---|---|
| R2 | `feat/design-tokens` | Token `--av-*`, bảng màu, vòng focus `#C4B5FD`, bảng cỡ chữ cơ bản; đổi giá trị toàn cục trong MỘT PR. Đo và đề xuất trần bundle cuối cho cả Redesign | Đã merge (6 commit: khối `--av-*`, alias và vai trò `--purple`, hex trùng Spec, cỡ chữ, docs, vòng focus chung) | #33 |
| R3 | `feat/app-shell` | Nhãn "HỌC TẬP", breadcrumb ngữ nghĩa, điểm gãy shell 767/768/1279, rail 72 px tự động, header 72/64, nav 44, drawer 300; sidebar vẫn 256 px; "Trực quan hóa" để R5a (quyết định 14) | Đã merge | #34 |
| R4 | `feat/dashboard-v1` | Dashboard 3 khối: Hero (bảng minh họa gắn nhãn "Minh họa"), Nội dung nổi bật (3 thẻ), Truy cập nhanh; bỏ thẻ "Sẽ phát triển"; kiểm chứng BFS có visualizer thật trước khi đặt thẻ BFS; mở thẳng màn chi tiết bằng `data-dashboard-open`; gỡ alias `--purple-strong`/`--purple-pressed` (quyết định 17) | Đã merge | #35 |
| R5a | `feat/library-tabs` | Thư viện 2 tab (Cấu trúc dữ liệu, Giải thuật): trang `algorithms` gộp Sắp xếp, Tìm kiếm và thẻ Duyệt đồ thị BFS/DFS (D12); thanh tab ARIA có bàn phím; "Xem thư viện" của Dashboard mở trang Giải thuật; KHÔNG thêm mục nav "Thư viện" (D11, quyết định 22); không trạng thái đang tải/lỗi (D14, quyết định 24) | Đã merge | #36 |
| R5b | `feat/library-filters` | Ô tìm trong trang và chip phân loại; áp `--border-control` cho ô nhập; chỉ lọc dữ liệu thẻ thật. HOÃN hai select lọc Độ khó và Độ phức tạp (D4, quyết định 19): kích hoạt lại khi tab Giải thuật có >= 10 thẻ. Làm: `data-category` cho 14 thẻ, `src/library-filter.js` (ô tìm bỏ dấu, chip, bộ đếm, trạng thái rỗng), CSS dùng `--border-control` (quyết định 26) | Đã merge | #37 |
| R5c | `feat/library-cards-v1` | Thẻ thuật toán theo Spec: ký hiệu độ khó ● ◐ + chữ thay thế "Độ khó:" cho trình đọc màn hình, thanh 5 đoạn `aria-hidden` (chỉ thẻ có dữ liệu thật; BFS/DFS không có, quyết định 23), ghi chú giải thích ở tab Giải thuật; giữ lưới 3 cột (quyết định 27) | Đã merge | #38 |
| (trước R6) | `feat/controller-seek` | Thêm `seek(index)` vào `src/simulation-controller.js` kèm test và phép phá (D6, quyết định 21, 28). Đã kiểm: bộ vẽ của cả 5 module là hàm thuần của bước nên không sửa bộ vẽ; chưa nối vào giao diện (thanh trượt là việc của R6) | Đã merge | #39 |
| R6a | `feat/visualizer-controls` | Tách từ R6 (thanh bước dùng chung): "Bước x/y", thanh trượt bước dùng `seek`, tốc độ `radiogroup` 0,5×/1×/2×/4× cho 5 module; test nhảy nhiều bước thật | Đã merge | #40 |
| R6b | `feat/visualizer-panel` | Tách từ R6: panel accordion (Mã giả, Độ phức tạp, Kiến thức; "Giải thích bước" là vùng aria-live ngoài accordion), màu canvas (gỡ `--purple`), `--border-control` cho 5 luật điều khiển còn lại | Đã merge | #41 |
| R6c | `feat/visualizer-a11y-contrast` | Tách tiếp: sửa tương phản Visualizer, dấu "✓" dùng `--av-text`, Sidebar tự thu gọn ở Visualizer >= 1280 px bằng `detail.topic` và tôn trọng thao tác thủ công | Đã merge | #42 |
| R6 (gốc) | `feat/visualizer-frame` | Khung Visualizer, điều khiển, tốc độ `radiogroup`, "Bước x/y", panel accordion và nội dung học tập trong panel; thanh trượt bước cần controller có `seek` | Hoàn thành qua R6a/R6b/R6c; phạm vi là năm Visualizer đã có controller, không bao gồm chuyển Array/Stack/Queue/Linked List thành mô phỏng theo bước. Cách gọi số lượng accordion giữa quyết định 20 và 30 cần người duyệt làm rõ, không thay đổi nội dung quyết định ở đây | #40, #41, #42 |
| R7 | `chore/a11y-responsive-audit` | Audit trợ năng và responsive, chia nhỏ theo nhóm: R7a Drawer/focus management; R7b focus bàn phím, vùng cuộn, touch target; R7c thông báo và screen reader; R7d xác minh responsive, đa trình duyệt và thiết bị thật | R7a đã merge PR #44. R7b đã merge qua PR #46 (triển khai), #47 (semantics Drawer/docs/tests); PR #48 sửa focus-visible cho input Array. R7b đạt nghiệm thu Chrome CDP trên mã sau merge #48 (`59eecbaa`): 360/699/768/1280 px không tràn ngang; Drawer/inert/focus; Array focus; 7 vùng overflow cuộn bằng bàn phím; hover/active/disabled, touch target và Sorting/Searching controls. Số liệu lịch sử: 1715/1715 test; JS 152.328 B, CSS 57.819 B (không phải lần chạy hiện tại). R7c hoàn thành qua PR #51. R7d Closeout PARTIAL PASS theo phê duyệt của chủ dự án: 137 Chrome browser QA case hợp lệ tại `ef34955fa945a96336195c10dae6a5367ea2dfc6`; không phải QA toàn diện. Accepted risks và phạm vi còn hoãn ghi tại `docs/backlog.md` và `docs/development-baseline.md` | #44, #46, #47, #48, #51 |

Quy tắc cho cả lộ trình:
- Mỗi PR xin trần bundle riêng ở bước lập kế hoạch, người dùng duyệt trước khi làm. Sau R7a, ngân sách hiện hành đã duyệt là JS <= 154.000 B, CSS <= 58.500 B; điều chỉnh để giữ tính năng drawer/focus accessibility đã thêm ở R7a. Số đo và giới hạn R6c là lịch sử; xem `docs/development-baseline.md`. R5c và các mức cũ bên dưới chỉ là lịch sử.
- R2 phải đo và đề xuất trần cuối cho cả Redesign (đề xuất tạm: JS <= 158 kB, CSS <= 56 kB) để người dùng duyệt một lần; các PR sau làm trong trần đó và vẫn báo byte từng commit.
- Hai quy tắc sản phẩm trong `docs/design/decisions.md` (không theo dõi tiến độ cá nhân; không số giả) áp dụng cho mọi PR ở bảng này.
Ghi chú:
- Giai đoạn 1–4 gộp từ lịch sử git: CLAUDE.md và commit không ghi tên riêng từng giai đoạn; mốc duy nhất là
  "Merge PR #2, giai đoạn 4" (bản đầu tiên của CLAUDE.md, commit `718eb96`).
- Giai đoạn 8, Redesign Phase 3b và phần trạng thái thẻ của Phase 4 (các dòng trên) giữ nguyên làm lịch sử; phần tiến độ đã gỡ theo Spec v1.0 ở PR #30 `chore/remove-learning-progress` (dòng "Gỡ Tiến độ học tập").
- Giai đoạn 9 ban đầu gồm cả README và CI; hai phần này làm ở PR cấu trúc repo.
- Deployment: Vercel, production https://algo-vision-gamma.vercel.app tự deploy từ `main`, mỗi PR có link preview.
  Cấu hình nằm trên Vercel, không có file trong repo.
- Mỗi Phase redesign cần dư địa bundle riêng (ngưỡng hiện hành ghi tại `docs/development-baseline.md`). Không nâng ngưỡng khi chưa được người dùng duyệt;
  trần của một PR trước đó (Phase 3b: JS 160 kB, CSS 54,5 kB; Phase 4: JS 160 kB, CSS 56 kB) không áp cho PR sau.
  Sau khi gỡ tiến độ ngưỡng là JS 146,0 kB và CSS 49,5 kB; R2 nâng riêng CSS lên 51,0 kB; R3 nâng riêng JS lên 147,0 kB (đo 146.358 B, dư 642 B; các số này là lịch sử). Mỗi PR Redesign v1.0 cần trần riêng, duyệt riêng ở bước lập kế hoạch.
- Để sau: phân loại 4 loại cạnh DFS (cây/ngược/xuôi/chéo) dựa trên mốc vào/ra đã có.
- Việc còn tồn tại, chưa xếp vào giai đoạn nào: `docs/backlog.md`.

## UI Redesign v2

| Giai đoạn | Phạm vi | Trạng thái |
|---|---|---|
| UI v2-1 | Light Minimal Foundation: palette, shell/header/sidebar và shared controls; sửa tương phản phát sinh trên các màn, giữ JS/layout hiện hành | MERGED PR #53; CI Ubuntu/Windows PASS; số liệu lịch sử 1740 test PASS, build PASS; browser QA NOT VERIFIED. Hợp đồng: [Foundation](design/v2-foundation.md) |
| UI v2-2 | Dashboard/Library Light Minimal: grid fluid 1–3 cột, Hero/CTA, card/chip và search reflow; giữ dữ liệu/handlers | MERGED PR #54; CI Ubuntu/Windows PASS; số liệu lịch sử 1748 test PASS, build JS 152734 B / CSS 57994 B; browser QA NOT VERIFIED. Hợp đồng: [Dashboard/Library](design/v2-dashboard-library.md) |
| UI v2-3a | Sorting/Searching Light Minimal | MERGED PR #56 tại `6ec0d593593be18bb94a543b182e632f747f98da`; bằng chứng đo trước commit giữ trong baseline; browser QA NOT VERIFIED. |
| UI v2-3b | Data Structures Light Minimal, CSS/test/docs | MERGED PR #57 tại `f14986febf78878404ee5d8e0b7e8ea75339b771`; CI hậu merge PASS theo xác nhận chủ dự án; bằng chứng trước commit giữ trong baseline; browser QA riêng v2-3b chưa nghiệm thu toàn diện. |
| UI v2-3c | Adaptive Grid cho năm Visualizer | MERGED PR #58 theo Git local tại `d639b42ad87e7f282950a88b653fd0030ea6350d`; giữ số đo 1775/1775 PASS và raw JS/CSS 152843/58402 B như bằng chứng lịch sử. QA có giới hạn tại [hợp đồng](design/v2-adaptive-layout.md); chưa đóng gate UI v2 toàn diện. |
| UI v2-3d.1 | Learning Panel Dropdown, một native select cho năm Visualizer | Đã triển khai, diff chưa commit, chờ review. Full trước lượt nghiệm thu 1787/1787 PASS, build PASS, raw JS/CSS 153111/57906 B, mutation 3/3 có restore nguyên byte. Chrome/Edge/browser tương tác bị chặn; browser QA NOT VERIFIED. [Hợp đồng, chẩn đoán và checklist](design/v2-learning-panel.md); lần kiểm lại xem [baseline](development-baseline.md). |
| UI v2-3d.2a | Sửa P2 contrast enabled trong năm Adaptive Visualizer | Diff chưa commit; frame regression Edge/Chrome PASS trên base + CSS hash; mouse-only 12/12 PASS, đề xuất nghiệm thu chờ duyệt. 24 ca zoom/screen reader NOT VERIFIED, chủ dự án chấp thuận hoãn C4. [Bằng chứng](design/v2-learning-panel-contrast.md). |

Trạng thái merge đối chiếu Git local tại `c84f0bfaeffa848de4e1df77e093d6dd2c111ad6`;
CI Ubuntu/Windows PASS là thông tin đã được chủ dự án xác nhận khi duyệt cập nhật này, không phải lần chạy
CI mới trong phiên docs-only. Các số test/build là lịch sử trong [baseline](development-baseline.md).
Visualizer/QA là bước tiếp theo; chưa hoàn tất toàn bộ UI v2. Không suy diễn deployment SUCCESS,
test CSS hoặc 137 case R7 thành browser QA PASS cho Light Minimal v2.

## Chuẩn hóa v1.0.0

Thứ tự bắt buộc: **UI v2-3 → C1 → EDU-1 → EDU-2 → EDU-3 → EDU-4 → C2 → C3 → C4 → C5**.

### Trạng thái owner hiện hành — cập nhật D1, 22/11/2026

> Snapshot D1 dưới đây được giữ làm lịch sử; trạng thái EDU-2 hiện hành xem [checkpoint EDU-R](#edu-r--checkpoint-hiện-hành-24112026).

- **C1: CLOSED — OWNER APPROVED, 18/11/2026.** [Scope C1](release/v1.0.0-scope.md) giữ quyết định 180/180 ID; hồ sơ Git đang đồng bộ trong D1, không phải chốt release v1.0.0.
- **EDU-1: PARTIAL — MAPPING COMPLETE / ACADEMIC PENDING; academic PASS 0/40.** Catalog/mapping còn là WIP ở checkout cũ, không được nhập trong D1.
- **OP-16/OP-17: technical MERGED**, lần lượt qua [PR #62](https://github.com/Nggvanchi/AlgoVision/pull/62) và [PR #63](https://github.com/Nggvanchi/AlgoVision/pull/63). [Hồ sơ OP-17](education/op17-source-evidence.md) không phải A-EDU PASS; source/rights chưa nghiệm thu đầy đủ, average-case chưa nghiệm thu học thuật.
- [QA closeout](qa/ui-v2-3-closeout-2026-11-18.md) và [JSON](qa/ui-v2-3-closeout-2026-11-18.json) là historical evidence tại `89cdc6187f0464276b8e4882d75061f13bda5129`; D1 chỉ đồng bộ hồ sơ, không kiểm lại artifacts/backup/manifest ngoài repo.
- Giữ dependency **C1 → EDU-1 → EDU-2** và toàn bộ gate. Ngoại lệ triển khai OP-16/17 không tự mở D2/OP-18 hoặc miễn academic/rights gate.

### OP20 — Checkpoint hiện hành, 25/11/2026

**EDU-2: IN_PROGRESS / PARTIAL; 5/5 OP (OP-16–20) TECHNICAL CLOSED, chưa đóng EDU-2.** Technical closeout không phải nghiệm thu học thuật/quyền hoặc đạt exit gate. Baseline source của checkpoint: `109e3be1d0dfa2f08a4fab2fdd6cb746efc7443a`.

| Phạm vi | Trạng thái kỹ thuật | Evidence |
|---|---|---|
| OP-16/17/18/19 | TECHNICAL CLOSED trong phạm vi đã nghiệm thu; giữ lịch sử PR và giới hạn claim | [Checkpoint EDU-R](#edu-r--checkpoint-hiện-hành-24112026); OP-16/17 qua #62/#63, OP-18 qua #70, OP19-A/B qua #71/#72 |
| OP20-A | TECHNICAL CLOSED — hồ sơ bằng chứng Binary Search | [#74](https://github.com/Nggvanchi/AlgoVision/pull/74), merge `708f0f3f689701d28815fd9e45dc4657b90a8204`; [hồ sơ OP-20](education/op20-source-evidence.md) giữ REVIEW_PENDING cho claim, không phải academic PASS |
| OP20-B | TECHNICAL CLOSED — nội dung Binary Learning Panel và regression | [#75](https://github.com/Nggvanchi/AlgoVision/pull/75), merge `109e3be1d0dfa2f08a4fab2fdd6cb746efc7443a`; HEAD QA `2660d5d25d363588e819c51c818eb4016ce4a093`, tree `dc1b227e5c570f2b678f071336878a62ff7ea75e` bằng merge tree |

- **Local QA B1 đã ghi nhận, không chạy lại trong D1:** full 1809/1809 PASS, fail/skip/cancel/todo=0; targeted 90/90; mutation/control 3/3 gồm hai source mutations và một oracle negative control, phục hồi byte/hash. Raw JS **153753 B**, CSS **58010 B**, headroom **247 B/490 B** dưới trần **154000 B/58500 B**.
- **Browser local B1:** Chrome 152.0.7977.83/Playwright 1.62.1, 360/768/1280/1440 ×900 CSS px, DPR=1; 4/4 viewport, 305 lượt assertion PASS, 16 PNG đã kiểm chữ ký/kích thước/hash. Copy, overflow/clipping, focus/keyboard, navigation, Linear/Binary, hit/miss và next/previous/reset đạt trong mẫu; console/network không lỗi. Đã đóng context/browser QA và Vite của lượt này, localhost ngừng phục vụ. Không suy thành kiểm toàn bộ Chrome process/profile.
- **CI hậu merge riêng:** [run 45451640840](https://github.com/Nggvanchi/AlgoVision/actions/runs/45451640840) SUCCESS đúng merge SHA `109e3be1d0dfa2f08a4fab2fdd6cb746efc7443a`; Ubuntu/Windows PASS test/build/encoding. CI không thay browser local hoặc production smoke.
- **Giới hạn giữ nguyên:** chỉ Chrome localhost/bốn viewport đã kiểm; screen reader thật, cross-browser, thiết bị thật và C4/production chưa được chứng minh bởi QA này. MCP screenshot root cause, runtime Chrome profile isolation và cleanup toàn bộ Chrome process/profile tiếp tục NOT VERIFIED.
- **Gate giữ nguyên:** academic PASS **0/40**, **RIGHTS_NOT_VERIFIED**, A-EDU/G-EDU/G-RELEASE, source_status, 40 OP/80 mapping ID, routing, dependencies và scope release. EDU-2 còn cần nghiệm thu claim/quyền; không tự mở EDU-3. [UI v3](#ui-v3--modern-academic-workspace) chỉ PLANNED/NOT STARTED sau C5 CLOSED; mọi PR cần approval riêng.

### EDU-R — Checkpoint hiện hành, 24/11/2026

> Checkpoint EDU-R giữ làm lịch sử; trạng thái mới xem [checkpoint OP20](#op20--checkpoint-hiện-hành-25112026).

**EDU-2: IN_PROGRESS / PARTIAL — chưa CLOSED.** Baseline kỹ thuật: `8b85f8ba96aaa9158a7115816119211cd2bd8ae9`. EDU-1 Source & Mapping giữ closeout EDU-1G đã ghi nhận; không nâng gate claim/quyền.

| OP | Trạng thái kỹ thuật | PR và merge SHA |
|---|---|---|
| OP-16 Bubble | Technical MERGED; hồ sơ claim còn gate học thuật/quyền | [#62](https://github.com/Nggvanchi/AlgoVision/pull/62), `95a3ff40fc9d6143fcef82d91fef986d859792ec` |
| OP-17 Selection | Technical MERGED; hồ sơ claim còn gate học thuật/quyền | [#63](https://github.com/Nggvanchi/AlgoVision/pull/63), `f5fdbbe73141c116a77fde8957078fe65c5f4ddf` |
| OP-18 Insertion | EDU-2A-P2 TECHNICAL CLOSED | [#70](https://github.com/Nggvanchi/AlgoVision/pull/70), `eeb9f1a338790243187d189a40e49a3d46ffac89` |
| OP-19 Linear Search | OP19-A/B TECHNICAL CLOSED | [#71](https://github.com/Nggvanchi/AlgoVision/pull/71), `213b183bd3187d082412676d05ca1362359443ba`; [#72](https://github.com/Nggvanchi/AlgoVision/pull/72), `8b85f8ba96aaa9158a7115816119211cd2bd8ae9` |

Hồ sơ claim/provenance OP-16–18 đã merge qua [#69](https://github.com/Nggvanchi/AlgoVision/pull/69), `f232cbbd08cd1761817aa92bbf95ce9946852862`; [mapping](education/knowledge-mapping.md) và các hồ sơ pin SHA giữ nguyên trạng thái/lịch sử, không dùng technical closeout thay academic acceptance.

- **Local QA đã ghi nhận cho diff OP19-B, sau đó commit thành `a4958df2a66bab3b9e0d10cc7c422f96d3473ed8`:** 1808/1808 tests PASS, fail/skip/cancel/todo=0; raw JS 153782 B, CSS 58010 B; headroom 218 B/490 B so với trần 154000 B/58500 B. Chrome localhost 360/768/1280/1440 ×900, DPR=1: 4/4 viewport, 293 lượt assertion PASS. Đây là evidence đã có, không phải lần chạy mới của EDU-R.
- **CI hậu merge:** [run 45337979192](https://github.com/Nggvanchi/AlgoVision/actions/runs/45337979192) SUCCESS trên baseline `8b85f8ba96aaa9158a7115816119211cd2bd8ae9`; Ubuntu/Windows đều PASS test/build/encoding. Merge tree bằng HEAD tree. CI không thay browser QA local hoặc production smoke.
- **Tiếp theo đề xuất:** OP-20 Binary Search — readiness/plan riêng về tiền điều kiện sorted, thu hẹp biên, duplicates, comparisons/trace và nội dung Learning Panel; chưa khởi động hoặc được phép triển khai.
- **Gate giữ nguyên:** academic PASS **0/40**, **RIGHTS_NOT_VERIFIED**, source_status, 40 OP/80 mapping ID, routing, scope release và dependency. EDU-2 chưa đạt exit gate; A-EDU/G-EDU/G-RELEASE, screen reader, cross-browser và C4/production vẫn còn mở. Các bảng/ghi chú cũ là evidence theo thời điểm, không bị thay bằng số liệu này.

### Mốc kế hoạch và trạng thái lịch sử — 14/11/2026

Các trạng thái chưa bắt đầu/đang triển khai dưới đây được giữ làm lịch sử; trạng thái owner hiện hành ở mục trên.

Kế hoạch chuẩn hóa tài liệu được duyệt ngày 2026-11-14; các giai đoạn triển khai dưới đây chưa bắt đầu
và vẫn cần duyệt kế hoạch riêng. Lộ trình không cam kết lịch phát hành khi gate còn thiếu bằng chứng.

| Giai đoạn | Kết quả cần bàn giao | Phụ thuộc | Trạng thái |
|---|---|---|---|
| UI v2-3 | Visualizer Light Minimal và bằng chứng QA UI v2 | UI v2-1/#53, UI v2-2/#54 | ĐANG TRIỂN KHAI: v2-3a/#56, v2-3b/#57, v2-3c/#58 MERGED theo Git local; v2-3d.1 diff chưa commit, browser QA NOT VERIFIED, chưa đóng gate |
| C1 | Kiểm kê và chốt phạm vi release v1.0.0 | UI v2-3 đạt exit gate | CHƯA BẮT ĐẦU |
| EDU-1 | Nguồn UIT đã xác minh và mapping chương/mục | C1 | CHƯA BẮT ĐẦU; nguồn UIT CHƯA XÁC MINH |
| EDU-2 | Nội dung nền tảng, Sorting và Searching theo mapping | EDU-1 | CHƯA BẮT ĐẦU |
| EDU-3 | Nội dung cấu trúc dữ liệu theo mapping | EDU-2 | CHƯA BẮT ĐẦU |
| EDU-4 | Nội dung Graph/BFS/DFS và nghiệm thu học thuật toàn bộ | EDU-3 | CHƯA BẮT ĐẦU |
| C2 | Chuẩn hóa source có baseline/benchmark trước–sau | EDU-4 | CHƯA BẮT ĐẦU |
| C3 | Chuẩn hóa test, giữ số test và khả năng bắt lỗi | C2 | CHƯA BẮT ĐẦU |
| C4 | Nghiệm thu và release v1.0.0 có đủ bằng chứng | C3 | CHƯA BẮT ĐẦU |
| C5 | Cleanup sau release, từng xóa/di chuyển được duyệt riêng | C4 đã release | CHƯA BẮT ĐẦU; cần phê duyệt riêng |

### Gate chung cho mọi giai đoạn

- Tuân thủ [kiến trúc](architecture.md), [quy tắc thuật toán](../.agents/rules/algorithms.md),
  [quy tắc test](../.agents/rules/tests.md), hợp đồng UI v2 và các quyết định sản phẩm còn hiệu lực.
  Không đổi framework, thêm dependency hoặc viết lại module đang chạy.
- Không theo dõi tiến độ cá nhân/lịch sử truy cập/trạng thái học tập. Chỉ dùng dữ liệu thật;
  ví dụ tĩnh phải ghi “Minh họa”. Mapping EDU là trạng thái nội dung dự án, không phải tiến độ người học.
- Giữ trần raw hiện hành **JS <=154000 B, CSS <=58500 B**; không tự nâng ngân sách.
  Số liệu trong baseline là lịch sử; PR triển khai phải đo mới, ghi cả raw/gzip và môi trường.
- Mỗi PR nhỏ có scope, out-of-scope, acceptance criteria và bằng chứng gắn SHA; không lấy bằng chứng
  trên SHA cũ để xác nhận mã mới. Bugfix dùng TDD; timer dùng scheduler giả; không giảm số test,
  bỏ assertion, skip test hoặc hạ ngưỡng để làm xanh. Mutation phải được khôi phục trước kiểm cuối.
- Kiểm tra theo thay đổi: docs-only kiểm Markdown/link/UTF-8 không BOM/LF/diff/phạm vi;
  PR source/test chạy `check`, test liên quan và full test/build; UI thêm browser QA.
  CI chỉ PASS khi workflow Ubuntu và Windows trên SHA được nghiệm thu đã hoàn tất.
- Exit gate chỉ đóng khi có bằng chứng và người dùng nghiệm thu; thiếu công cụ/quyền/nguồn thì ghi
  BLOCKED hoặc NOT VERIFIED cùng lý do. Chuyển mục chưa xử lý sang [backlog](backlog.md) có chủ đích,
  không tự coi việc hoãn là đạt gate.

### UI v2-3 — Visualizer và QA UI v2

- **Mục tiêu/scope:** hoàn thiện trình bày Light Minimal của Visualizer, giữ điều khiển, mã giả,
  canvas và panel khớp dữ liệu bước; kiểm lại Dashboard/Library/shell sau #53/#54.
  Bao gồm cả kiểm hiển thị Array/Stack/Queue/Linked List cũ.
- **Ngoài phạm vi:** chuyển bốn module cũ sang generator, thêm thuật toán, layout hai cột hoặc đổi
  seek/tốc độ/navigation khi chưa có thiết kế riêng được duyệt.
- **Dependencies/PR nhỏ:** sau #53/#54; tách PR trình bày theo nhóm Sorting/Searching,
  nhóm cấu trúc dữ liệu, rồi PR bằng chứng QA và sửa lỗi đã tái hiện.
- **Acceptance/kiểm thử:** không tràn trang, không mất cue/chữ tiếng Việt; bàn phím, focus,
  drawer/rail, slider, tốc độ, accordion, hover/disabled và live announcements giữ hành vi.
  Chữ thường >=4,5:1; control/focus/cue >=3:1; trạng thái không chỉ dùng màu, reduced motion được giữ.
  Browser kiểm 360, 700/701, 767/768, 900/901, 1100, 1279/1280, 1440 CSS px;
  ghi browser/version, viewport, SHA, case và artifact, kèm test/build/CI theo gate chung.
- **Rủi ro/exit gate:** dư CSS lịch sử sau #54 chỉ 506 B; thay/gom luật trong scope trước khi thêm.
  QA bị chặn phải ghi NOT VERIFIED. Đóng gate khi phạm vi UI v2 đã được nghiệm thu bằng evidence;
  khoảng trống zoom/đa trình duyệt/thiết bị/screen reader phải được xử lý hoặc ghi rõ để C4 kiểm lại,
  không kế thừa accepted risks R7 như bằng chứng PASS. **Trạng thái: ĐANG TRIỂN KHAI** —
  Sorting/Searching v2-3a MERGED PR #56; số đo trước commit: test 1755/1755 PASS, build PASS, JS/CSS raw 152734/58400 B;
  [hợp đồng và checklist](design/v2-sorting-searching.md).
  Nhóm cấu trúc dữ liệu v2-3b MERGED PR #57; [hợp đồng](design/v2-data-structures.md) và baseline ghi bằng chứng riêng. Browser QA NOT VERIFIED; QA tổng thể chưa hoàn tất. Layout adaptive hai cột thuộc v2-3c.

### C1 — Kiểm kê và chốt phạm vi v1.0.0

- **Mục tiêu/scope:** đối chiếu roadmap, backlog, hợp đồng UI và implementation; lập danh sách
  module/thao tác/nội dung thật, lỗi đã tái hiện, khoảng trống và quyết định giữ/hoãn cho v1.0.0.
- **Ngoài phạm vi:** sửa source/test, thêm tính năng hoặc xóa các mục lịch sử để làm sạch danh sách.
- **Dependencies/PR nhỏ:** UI v2-3 đạt gate; một PR kiểm kê, một PR chốt acceptance và phân việc
  EDU/C2/C3/C4 sau review nếu cần.
- **Acceptance/kiểm thử:** mỗi mục release có module, bằng chứng hiện trạng, giai đoạn xử lý và gate;
  phân biệt bốn module cũ không sinh bước với năm Visualizer có controller. Đối chiếu link/docs/Git;
  không dùng tên branch hay ghi chú lịch sử làm kết quả kiểm hiện tại.
- **Rủi ro/exit gate:** backlog cũ có thể lỗi thời; xác minh trước khi nhận sửa. Chủ dự án duyệt
  danh mục release và phần hoãn; mọi mục bắt buộc có nơi xử lý. **Trạng thái: CHƯA BẮT ĐẦU.**

### EDU-1 — Xác minh giáo trình UIT và lập mapping

- **Mục tiêu/scope:** tìm nguồn chính thức UIT phù hợp phạm vi C1; xác minh tên học phần/tài liệu,
  tác giả/đơn vị, phiên bản/năm, URL, ngày truy cập, chương/mục/trang và quyền sử dụng.
  Mapping dưới đây là khung công việc, chưa phải danh mục chương của một giáo trình đã xác minh.
- **Ngoài phạm vi:** tự đặt số/tên chương, coi tài liệu bên thứ ba là nguồn UIT đã xác minh,
  sao chép giáo trình/slide/hình/bài tập có bản quyền hoặc công bố tệp nguồn chưa được phép.
- **Dependencies/PR nhỏ:** sau C1; PR danh mục nguồn và bằng chứng xác thực, rồi PR mapping
  phạm vi đủ cho EDU-2–4. Nếu nguồn cần đăng nhập hoặc chưa truy cập được, ghi blocker và yêu cầu
  nguồn hợp lệ; không tự lấp bằng kiến thức nhớ lại.
- **Acceptance/kiểm thử:** mỗi dòng mapping có định vị chương/mục thật, module/thao tác, kiến thức,
  trạng thái nội dung và nguồn truy vết; nội dung thiếu module được ghi hoãn, không tự mở rộng scope.
  Kiểm URL, metadata và đối chiếu trực tiếp mục lục/nội dung nguồn; diễn giải độc lập và dẫn nguồn.
- **Rủi ro/exit gate:** khác phiên bản hoặc quyền truy cập có thể làm sai mapping. Chỉ đóng gate khi
  nguồn, quyền dùng và mapping được review; mọi dòng chưa xác minh phải giải quyết hoặc được duyệt
  loại khỏi release. **Trạng thái: CHƯA BẮT ĐẦU; nguồn UIT CHƯA XÁC MINH.**

| Đợt | Chương/mục UIT | Module dự kiến, cần đối chiếu C1 | Kiến thức cần đối chiếu | Trạng thái nội dung | Nguồn |
|---|---|---|---|---|---|
| EDU-2 | Chưa xác minh, không gán số chương | Sorting, Searching | Ý tưởng, điều kiện đầu vào, bất biến, Big-O | Chưa mapping/biên soạn | Chưa xác minh nguồn UIT; bổ sung URL + phiên bản + mục/trang ở EDU-1 |
| EDU-3 | Chưa xác minh, không gán số chương | Array, Stack, Queue, Linked List, BST, Hash Table | ADT, thao tác, bất biến, trường hợp biên, Big-O | Chưa mapping/biên soạn | Chưa xác minh nguồn UIT; bổ sung URL + phiên bản + mục/trang ở EDU-1 |
| EDU-4 | Chưa xác minh, không gán số chương | Graph, BFS, DFS | Biểu diễn, duyệt, thứ tự thăm, Big-O | Chưa mapping/biên soạn | Chưa xác minh nguồn UIT; bổ sung URL + phiên bản + mục/trang ở EDU-1 |

#### EDU-1F — Tiêu chí hiện hành theo policy B

**Lịch sử EDU-1F:** Bổ sung ngày 22/11/2026; giữ phần EDU-1 ở trên làm lịch sử. Policy B dưới đây điều chỉnh tiêu chí nguồn/mapping, không phải quyết định đóng gate. **EDU-1 vẫn PARTIAL — MAPPING COMPLETE / ACADEMIC PENDING; academic PASS 0/40; RIGHTS_NOT_VERIFIED.**

- **Hai lớp evidence:** UIT xác minh định danh học phần/phạm vi/chủ đề đã đọc; claim chi tiết dùng nguồn học thuật độc lập phù hợp hoặc chứng minh tự biên soạn từ implementation. Không bắt buộc một tài liệu UIT chứng minh toàn bộ 40 OP, không gắn nguồn ngoài thành UIT. Xem [policy và quyền theo hành vi](education/uit-sources.md#11-policy-b-và-quyền-theo-hành-vi--edu-1f).
- **Nguồn và claim:** ghi tác giả/đơn vị, URL, edition/revision hoặc giới hạn chưa xác minh, ngày truy cập và locator thật. Nguồn chỉ nêu chủ đề không chứng minh mã giả/Big-O. Chứng minh độc lập cần SHA:line, tiền điều kiện, mô hình chi phí, giới hạn, phản biện Codex → ChatGPT → quyết định Owner; không thay nguồn truy xuất được bằng suy đoán.
- **Gate hồ sơ EDU-1:** đủ 8 source ID, 80 mapping ID/40 OP; vai trò và giới hạn từng nguồn rõ; quyền được phân loại theo hành vi thực tế; mọi gap có claim/OP, giai đoạn chịu trách nhiệm và acceptance. Owner phải nghiệm thu hồ sơ/policy và quyết định đóng EDU-1 riêng. NOT VERIFIED được giữ như gap có routing, không chuyển thành PASS hoặc tự loại khỏi release.
- **Gate học thuật EDU-2–4:** nghiệm thu từng claim thực tế dùng trong nội dung, nguồn/chứng minh phù hợp, Big-O/mã giả khớp biến thể và quyền cho nội dung bên thứ ba được sử dụng. Trước release, mọi claim bắt buộc phải đạt gate tương ứng hoặc có quyết định scope riêng của owner; không được bỏ qua chỉ vì đã đóng gate hồ sơ.
- **Phân tuyến:** [disposition 40 OP](education/knowledge-mapping.md#8-disposition-40-op--edu-1f) có 2 READY (OP-16/17), 38 DEFER. READY chỉ là sẵn sàng trình hồ sơ/claim; DEFER là giao việc cho EDU-2/3/4, không miễn acceptance hay loại khỏi v1.0.0.
- **Dependencies giữ nguyên:** C1 → EDU-1 → EDU-2 → EDU-3 → EDU-4 → C2 → C3 → C4 → C5; triển khai từng giai đoạn cần owner duyệt riêng. Ngoại lệ OP-16/17 không tự mở OP-18. G-RELEASE, QA và ngân sách không đổi.
- **Cách đọc tiêu chí lịch sử:** yêu cầu nguồn tại EDU-1/EDU-2/EDU-4 được áp dụng theo hai lớp trên. Thay điều kiện phải giải quyết hoặc loại mọi dòng NOT VERIFIED ngay tại EDU-1 bằng hồ sơ gap/routing được owner duyệt; việc nghiệm thu học thuật/quyền của nội dung release vẫn bắt buộc ở giai đoạn đích.

#### EDU-1G — Closeout hiện hành nguồn và mapping

**EDU-1 Source & Mapping — OWNER ACCEPTED / CLOSED**, quyết định owner ngày 22/11/2026. Các ghi chú PARTIAL/chưa đóng EDU-1 trước mục này là lịch sử.

Bằng chứng: [PR #67](https://github.com/Nggvanchi/AlgoVision/pull/67), merge SHA `7369060373396a6e73c446a66be47b9c0245317d`; [CI sau merge 45031433630](https://github.com/Nggvanchi/AlgoVision/actions/runs/45031433630) Ubuntu/Windows **SUCCESS**, [Vercel SUCCESS](https://vercel.com/nggvanchi-4548/algo-vision/4P8m4HveH4g3oJJtD9B9VzFy2z1t), đã đối chiếu đúng merge SHA.

- **Phạm vi đã nghiệm thu:** policy B, rights matrix theo hành vi, catalog 8 source ID và giới hạn từng nguồn; 40 OP/80 mapping ID, routing 2 READY/38 DEFER và acceptance/nơi xử lý từng gap. EDU-2/3/4 nhận 5/27/8 OP; giữ nguyên các hàng lịch sử.
- **Giới hạn:** academic PASS **0/40**, **RIGHTS_NOT_VERIFIED** và mọi source_status chưa xác minh giữ nguyên. CLOSED chỉ là gate hồ sơ nguồn/mapping; EDU-2–4 vẫn phải nghiệm thu từng claim và quyền cho nội dung thực tế. READY không phải academic PASS; DEFER không miễn release gate.
- G-EDU/G-RELEASE, phạm vi v1.0.0, lịch sử và chuỗi dependency giữ nguyên. Không tự mở OP-18/EDU-2–4; triển khai tiếp cần owner duyệt riêng. Xem [closeout catalog](education/uit-sources.md#12-closeout-hiện-hành--edu-1g) và [mapping](education/knowledge-mapping.md#9-closeout-hiện-hành--edu-1g).

### EDU-2 — Nền tảng, Sorting và Searching

- **Mục tiêu/scope:** theo mapping đã duyệt ở EDU-1, diễn giải kiến thức nền tảng, ba thuật toán
  sắp xếp và hai tìm kiếm hiện có; giải thích điều kiện Binary Search, bước/mã giả, ví dụ và Big-O
  khớp implementation, phân biệt tốt nhất/trung bình/xấu nhất khi có cơ sở.
- **Ngoài phạm vi:** thêm thuật toán/module, viết lại generator hoặc chép văn bản/hình từ giáo trình.
- **Dependencies/PR nhỏ:** EDU-1 đạt gate; PR kiến thức nền và Sorting, sau đó PR Searching;
  mỗi PR cập nhật mapping và nguồn cho nội dung thực tế đã review.
- **Acceptance/kiểm thử:** dò tay ví dụ với bước generator và số đo thật; mã giả không mô tả thao tác
  khác code. Kiểm regression nội dung/Big-O và browser khi thay Learning Panel, full test/build/CI
  khi có thay đổi sản phẩm; bản thảo docs-only theo gate docs.
- **Rủi ro/exit gate:** định nghĩa bộ nhớ/phép so sánh có thể khác giáo trình; ghi rõ mô hình đang đo.
  Nghiệm thu học thuật và mapping của nhóm này, không còn nội dung release thiếu nguồn.
  **Trạng thái hiện hành: CLOSED theo owner EDU2-F; 5/5 OP, academic acceptance toàn dự án 5/40.** Xem [checkpoint EDU2-F](#edu2-f--closeout-hiện-hành-25112026); giữ scope và các residual/gate đã phân tuyến, không miễn release gate.

### EDU-3 — Cấu trúc dữ liệu

- **Mục tiêu/scope:** theo mapping UIT đã duyệt, chuẩn hóa ADT/thao tác, bất biến và Big-O của
  Array/Stack/Queue/Linked List/BST/Hash Table; làm rõ cây không cân bằng, collision và điều kiện tải.
- **Ngoài phạm vi:** cây cân bằng, cấu trúc mới hoặc chuyển bốn module cũ thành mô phỏng theo bước.
- **Dependencies/PR nhỏ:** EDU-2 đạt gate; PR nhóm tuyến tính, PR BST, PR Hash Table;
  mỗi PR giữ mô tả đúng thao tác và biểu diễn hiện có.
- **Acceptance/kiểm thử:** dò ví dụ rỗng/một phần tử/trùng khóa/collision và các nhánh thao tác có thật;
  kiểm Big-O với implementation, snapshot/ID/giới hạn bước ở module có generator;
  regression nội dung, browser khi UI đổi, test/build/CI theo gate chung.
- **Rủi ro/exit gate:** độ phức tạp ADT lý tưởng có thể khác cách cài đặt mảng/clone hiện tại;
  phân biệt rõ, không gán trung bình O(1) vô điều kiện. Mapping và nội dung nhóm được nghiệm thu.
  **Trạng thái: READY FOR PLANNING, NOT STARTED.** Chỉ lập kế hoạch sau phê duyệt riêng; chưa triển khai.

### EDU-4 — Đồ thị và nghiệm thu giáo dục

- **Mục tiêu/scope:** Graph/BFS/DFS theo mapping; giải thích danh sách kề/ma trận kề,
  directed/undirected, thứ tự duyệt, mốc DFS và chi phí theo biểu diễn; rà thuật ngữ/nguồn toàn bộ EDU.
- **Ngoài phạm vi:** thuật toán đồ thị mới và phân loại bốn loại cạnh DFS chưa được duyệt.
- **Dependencies/PR nhỏ:** EDU-3 đạt gate; PR nội dung Graph/BFS, PR DFS, PR đối chiếu toàn bộ mapping.
- **Acceptance/kiểm thử:** dò tay thứ tự thăm, hàng đợi/ngăn xếp/mốc và mã giả với snapshot thật;
  phân biệt O(V+E)/O(V²) với chi phí clone của mô phỏng; regression Big-O/bước, browser khi UI đổi,
  test/build/CI theo gate chung. Mỗi mục C1 có trạng thái đủ/hoãn/không áp dụng và lý do, nguồn.
- **Rủi ro/exit gate:** khác quy ước thứ tự kề có thể đổi kết quả duyệt hợp lệ; ghi quy ước của code.
  Nghiệm thu học thuật EDU-1–4, không còn nguồn chưa xác minh trong nội dung release.
  **Trạng thái: CHƯA BẮT ĐẦU.**

### C2 — Chuẩn hóa source

- **Mục tiêu/scope:** từ kiểm kê C1 và kết quả EDU, sửa nguồn theo từng vấn đề đã xác minh;
  giữ luồng cấu trúc thuần → sinh bước → bố cục → view/controller → template.
  Ưu tiên giảm chi phí có số đo (ví dụ `buildGraph`) và làm rõ ranh giới module.
- **Ngoài phạm vi:** đổi framework/dependency, viết lại module, cleanup hàng loạt hoặc tối ưu dựa trên
  số lịch sử chưa tái đo; không sửa test để che thay đổi hành vi.
- **Dependencies/PR nhỏ:** EDU-4 đạt gate; PR baseline/benchmark và danh sách mục tiêu trước,
  rồi một PR cho từng cải tiến nguồn; bugfix TDD riêng khi có lỗi tái hiện.
- **Acceptance/kiểm thử:** baseline trên SHA trước sửa gồm số test/pass/fail/skip/todo, test/build,
  raw/gzip, runtime/memory của workload cố định. Benchmark trước–sau cùng Node/OS/lệnh/input/seed,
  số lần lặp và giới hạn heap/timeout; báo dao động, không chọn một lần nhanh nhất để kết luận.
  Đối chiếu kết quả với implementation tham chiếu khi tối ưu; giữ snapshot bất biến, ID ổn định,
  giới hạn bước, Big-O/nội dung đã duyệt; full test/build/CI và browser cho đường chạy ảnh hưởng.
- **Rủi ro/exit gate:** clone có thể là nguồn chi phí chính; đo từng phần, không tăng quy mô test mù.
  Nghiệm thu diff nhỏ, benchmark chứng minh mục tiêu đã duyệt và không vượt bundle/giảm số test;
  lỗi nền hoặc kết quả lệch thì dừng báo. **Trạng thái: CHƯA BẮT ĐẦU.**

### C3 — Chuẩn hóa test

- **Mục tiêu/scope:** tối ưu dựng/dọn DOM, helper và test trùng chi phí theo số đo; giữ khả năng
  bắt lỗi, cách ly trạng thái và tính quyết định. Dùng `test-profile` và `mutation-test`.
- **Ngoài phạm vi:** xóa/gộp làm giảm số test, bỏ assertion, tăng timeout/heap để che lỗi,
  nới test token hoặc bỏ kiểm accessibility khi chưa có phê duyệt riêng; không đổi hành vi sản phẩm.
- **Dependencies/PR nhỏ:** C2 đạt gate; PR baseline/profile từng file và kho mutation,
  rồi PR từng nhóm helper/fixture; tách test chỉ đọc khỏi test có mutation DOM.
- **Acceptance/kiểm thử:** đo trước–sau cùng điều kiện: số test/pass/fail/skip/todo, thời gian,
  RSS/heap đỉnh theo file, timeout/OOM và lệnh tái lập. Có baseline GREEN trước mỗi mutation;
  từng phép phá phải còn bị bắt sau tối ưu, chạy riêng với heap/timeout rồi khôi phục nguyên byte.
  Scheduler giả cho timer; kiểm chạy riêng và cả suite để phát hiện rò trạng thái; full build/CI.
- **Rủi ro/exit gate:** dùng chung DOM có thể làm test phụ thuộc thứ tự hoặc lọt lỗi.
  Chỉ đóng gate khi số test không giảm, không thêm skip/todo, sức bắt lỗi được chứng minh và cải thiện
  hiệu năng đạt mục tiêu duyệt trước; nếu chưa đạt thì giữ phương án cũ. **Trạng thái: CHƯA BẮT ĐẦU.**

### C4 — Release v1.0.0

- **Mục tiêu/scope:** tập hợp bằng chứng trên release candidate, chốt phiên bản/changelog/tài liệu
  đúng thực tế và nghiệm thu production. Việc tạo tag/release/deploy chỉ làm khi được yêu cầu riêng.
- **Ngoài phạm vi:** thêm tính năng, coi deployment SUCCESS là smoke PASS, kế thừa QA cũ cho SHA mới,
  hoặc cleanup/xóa/di chuyển trước release.
- **Dependencies/PR nhỏ:** C3 và mọi mục bắt buộc của C1 đạt gate; PR hồ sơ release candidate,
  PR sửa blocker riêng nếu có, rồi PR tài liệu phiên bản/release theo phê duyệt.
- **Acceptance/kiểm thử:** hồ sơ phải có SHA, workflow URL/kết quả hoàn tất Ubuntu và Windows,
  full test/build, số test không giảm và bundle trong trần; browser evidence cho Dashboard,
  hai Library và mọi Visualizer, các breakpoint UI v2, viewport thấp và zoom thật 200%.
  Có kiểm keyboard/focus/drawer/rail, tương phản, reduced motion, screen reader và báo cáo
  accessibility; ghi browser/OS/version, Firefox/Safari và thiết bị thật theo ma trận đã duyệt,
  không dùng emulation thay thiết bị thật hoặc DOM thay screen reader.
- **Production smoke:** trên URL production gắn đúng release SHA, kiểm tải template/font/assets,
  điều hướng, filter/empty state, mở và chạy từng module, seek/tốc độ nơi có hỗ trợ,
  keyboard/focus và overflow ở 360/1280; lưu console/network, kết quả và thời điểm kiểm.
- **Rủi ro/exit gate:** môi trường production có thể khác preview; cần phương án rollback được duyệt
  và kiểm lại sau deploy. Không P0/P1 mở; các rủi ro thấp còn lại phải có phê duyệt và backlog.
  Bất kỳ bằng chứng bắt buộc nào NOT VERIFIED đều chặn release; sau sửa phải kiểm lại phạm vi ảnh hưởng.
  Gate chỉ đóng khi chủ dự án nghiệm thu và release cùng smoke hoàn tất. **Trạng thái: CHƯA BẮT ĐẦU.**

### C5 — Cleanup sau release

- **Mục tiêu/scope:** sau C4 đã release, kiểm kê mã/tài liệu/asset có thể dọn; giữ lịch sử và nguồn
  học thuật, loại bỏ phần thừa đã chứng minh không còn được tham chiếu.
- **Ngoài phạm vi:** đổi hành vi/tính năng, xóa lịch sử, tác động worktree khác hoặc tự coi approval
  roadmap là quyền xóa/di chuyển.
- **Dependencies/PR nhỏ:** C4 đạt gate; PR kiểm kê chỉ đọc, sau đó từng PR cleanup có danh sách
  đường dẫn cụ thể, bằng chứng không còn dùng, ảnh hưởng link/import/build/deploy và cách khôi phục.
  **Mọi xóa/di chuyển phải được chủ dự án phê duyệt riêng trước khi thực hiện.**
- **Acceptance/kiểm thử:** rà reference và link trước–sau; docs-only kiểm Markdown/encoding/diff;
  nếu ảnh hưởng sản phẩm chạy full test/build/CI, benchmark khi cần và browser/smoke liên quan.
  Giữ số test, ngân sách bundle và nội dung học thuật đã nghiệm thu.
- **Rủi ro/exit gate:** tham chiếu động hoặc URL ngoài repo có thể không thấy trong tìm kiếm tĩnh;
  thiếu bằng chứng thì giữ lại. Đóng gate theo từng cleanup đã được duyệt và nghiệm thu,
  không lấy release làm quyền dọn hàng loạt. **Trạng thái: CHƯA BẮT ĐẦU; cần phê duyệt riêng.**

## UI v3 — Modern Academic Workspace

**Trạng thái: PLANNED / NOT STARTED — DEFERRED UNTIL C5 CLOSED.** Đây là roadmap đã duyệt, không phải phê duyệt triển khai, cài công cụ hoặc mở UI3-0.

**Dependency:** C5 CLOSED → UI3-0 → UI3-1 → UI3-2 → UI3-3 → UI3-4 → UI3-5 → UI3-6 → UI3-7 → UI3-8 → UI3-9 → UI3-10.

Giữ nguyên chuỗi **UI v2-3 → C1 → EDU-1 → EDU-2 → EDU-3 → EDU-4 → C2 → C3 → C4 → C5**. Trong EDU-2–4, chỉ nghiên cứu UI/UX read-only khi được duyệt riêng; không thay source hoặc gián đoạn gate.

| ID | Phạm vi | Deliverables / exit gate |
|---|---|---|
| UI3-0 | Audit UI/UX và skill | Baseline, findings, compatibility và scope được duyệt |
| UI3-1 | Design System | Tokens, wireframes Desktop/Tablet/Mobile, hợp đồng thiết kế được duyệt |
| UI3-2 | Application Shell | Navigation, drawer, keyboard/focus đúng |
| UI3-3 | Dashboard/Library | Bố cục, filter và điều hướng đúng |
| UI3-4 | Sorting/Searching | Workspace chuẩn, giữ generator và hành vi |
| UI3-5 | Linear Data Structures | Array/Stack/Queue/Linked List đúng hợp đồng |
| UI3-6 | Advanced Data Structures | BST/Hash/Graph giữ ID, snapshot và cue |
| UI3-7 | Learning Experience | Panel nhất quán, giữ nội dung học thuật |
| UI3-8 | Responsive/Accessibility | Ma trận browser, thiết bị, WCAG được nghiệm thu |
| UI3-9 | Source Optimization | Bằng chứng phần dư phát sinh từ UI v3 và benchmark trước/sau |
| UI3-10 | QA/Release | Regression, CI, production smoke, owner acceptance |

UI/UX Pro Max chỉ hỗ trợ design/review, **không phải production dependency**. UI3-0 kiểm provenance/license và compatibility Codex/Windows trước khi sử dụng; không cài skill trong D1. Giữ kiến trúc hiện hành, bất biến thuật toán, nội dung học thuật, ngân sách raw JS ≤154000 B/CSS ≤58500 B và khả năng bắt lỗi.

### Phân tuyến công cụ ứng viên

| Tuyến | Công cụ / mục đích dự kiến | Giới hạn |
|---|---|---|
| C2 — source | Knip, jscpd (src), Dependency Cruiser, ESLint/SonarJS, Stylelint, Rollup Visualizer | Chỉ audit/benchmark và sửa vấn đề có evidence sau approval; unused/clone/complexity là findings cần xác minh, không quyền xóa hoặc auto-fix |
| C3 — test | jscpd (tests), fast-check, StrykerJS | Rà trùng và khả năng bắt lỗi; không giảm tests/nới assertions; không tích hợp lại chức năng mutation đã đủ bằng chứng |
| C4 — QA | Playwright, axe-core, Lighthouse CI | Browser/a11y/performance evidence; không thay screen reader, cross-browser/thiết bị thật hoặc production smoke bắt buộc |
| GH — tài liệu | Best-README-Template, Shields.io, Markdownlint, Lychee | Template/badge/link/lint tài liệu theo scope được duyệt; badge không thay kết quả workflow thực tế |
| UI3 — thiết kế và phần dư | UI/UX Pro Max, Mermaid; tái sử dụng công cụ C2/C3/C4 khi cần | UI3-9 chỉ xử lý phần dư do redesign UI v3, không lặp audit/cleanup tổng quát đã phân tuyến |

Ưu tiên audit cách ly, công cụ hiện hữu và evidence đúng SHA/hash. Danh sách là ứng viên, **không mặc định tích hợp toàn bộ**, không thêm dependency vào runtime và không đổi CI/config trong D1. Phạm vi tools source/test/QA được giao C2/C3/C4, tài liệu giao GH; mỗi lần tích hợp cần chứng minh khoảng trống, compatibility/chi phí và approval riêng.

Mọi PR cần plan và owner approval riêng. Không theo dõi tiến độ học tập cá nhân, không dùng dữ liệu giả, không tự nâng academic/rights/release gates. Phiên bản release tiếp theo do owner quyết định. C5 CLOSED chỉ là dependency, không tự cấp quyền bắt đầu UI3.
