# Lộ trình AlgoVision

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

Trạng thái merge đối chiếu Git local tại `c84f0bfaeffa848de4e1df77e093d6dd2c111ad6`;
CI Ubuntu/Windows PASS là thông tin đã được chủ dự án xác nhận khi duyệt cập nhật này, không phải lần chạy
CI mới trong phiên docs-only. Các số test/build là lịch sử trong [baseline](development-baseline.md).
Visualizer/QA là bước tiếp theo; chưa hoàn tất toàn bộ UI v2. Không suy diễn deployment SUCCESS,
test CSS hoặc 137 case R7 thành browser QA PASS cho Light Minimal v2.

## Chuẩn hóa v1.0.0

Thứ tự bắt buộc: **UI v2-3 → C1 → EDU-1 → EDU-2 → EDU-3 → EDU-4 → C2 → C3 → C4 → C5**.
Kế hoạch chuẩn hóa tài liệu được duyệt ngày 2026-11-14; các giai đoạn triển khai dưới đây chưa bắt đầu
và vẫn cần duyệt kế hoạch riêng. Lộ trình không cam kết lịch phát hành khi gate còn thiếu bằng chứng.

| Giai đoạn | Kết quả cần bàn giao | Phụ thuộc | Trạng thái |
|---|---|---|---|
| UI v2-3 | Visualizer Light Minimal và bằng chứng QA UI v2 | UI v2-1/#53, UI v2-2/#54 | CHƯA BẮT ĐẦU; browser QA v2 NOT VERIFIED |
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
  không kế thừa accepted risks R7 như bằng chứng PASS. **Trạng thái: CHƯA BẮT ĐẦU.**

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
  **Trạng thái: CHƯA BẮT ĐẦU.**

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
  **Trạng thái: CHƯA BẮT ĐẦU.**

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
