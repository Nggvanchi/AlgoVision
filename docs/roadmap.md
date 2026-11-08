# Lộ trình AlgoVision

Mỗi giai đoạn một dòng. Chỉ bắt đầu giai đoạn mới khi người dùng đồng ý; mỗi giai đoạn một branch, một PR
(quy trình: skill `module-workflow`). Cập nhật trạng thái ở commit cuối của PR tương ứng.

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
| — | Redesign Phase 4, mục 3c: tab gộp "Thư viện", ô tìm, bộ lọc, sheet mobile, sidebar tự thu gọn ở tablet (701–1024px) | Chưa làm | — |
| — | Redesign Phase 5: khung Visualizer chung cho Sorting và Searching (tiêu đề, thanh điều khiển, thống kê, chú giải, Learning Panel) | Chưa làm (cần trần bundle riêng, duyệt riêng ở bước lập kế hoạch) | — |
| — | Redesign Phase 6: workspace cấu trúc dữ liệu, chia hai PR: (1) Array, Stack, Queue, Linked List; (2) BST, Hash Table, Graph | Chưa làm (mỗi PR cần trần bundle riêng, duyệt riêng ở bước lập kế hoạch) | — |

## Redesign v1.0 (Spec v1.0)

Hướng thiết kế hiện tại: `docs/design/spec.md`; quyết định đã chốt: `docs/design/decisions.md`. R1 là PR đưa hai tài liệu này và lộ trình vào repo (chỉ docs). Mỗi PR dưới đây một nhánh ngắn từ `main`;
số PR ghi sau khi tạo PR. Các dòng "Redesign Phase 5" và "Redesign Phase 6" ở bảng trên chưa làm và được lộ trình này thay thế.

| PR | Nhánh gợi ý | Nội dung | Trạng thái | Số PR |
|---|---|---|---|---|
| R2 | `feat/design-tokens` | Token `--av-*`, bảng màu, vòng focus `#C4B5FD`, bảng cỡ chữ cơ bản; đổi giá trị toàn cục trong MỘT PR. Đo và đề xuất trần bundle cuối cho cả Redesign | Đã merge (6 commit: khối `--av-*`, alias và vai trò `--purple`, hex trùng Spec, cỡ chữ, docs, vòng focus chung) | #33 |
| R3 | `feat/app-shell` | Nhãn "HỌC TẬP", breadcrumb ngữ nghĩa, điểm gãy shell 767/768/1279, rail 72 px tự động, header 72/64, nav 44, drawer 300; sidebar vẫn 256 px; "Trực quan hóa" để R5a (quyết định 14) | Đã làm, chờ PR (6 commit) | |
| R4 | `feat/dashboard-v1` | Dashboard 3 khối: Hero (bảng minh họa gắn nhãn "Minh họa"), Nội dung nổi bật (3 thẻ), Truy cập nhanh; bỏ thẻ "Sẽ phát triển"; kiểm chứng BFS có visualizer thật trước khi đặt thẻ BFS | Chưa làm | |
| R5a | `feat/library-tabs` | Gộp thành trang Thư viện với 2 tab (Cấu trúc dữ liệu, Giải thuật) | Chưa làm | |
| R5b | `feat/library-filters` | Ô tìm trong trang, lọc độ khó và độ phức tạp chỉ ở tab thuật toán, chip phân loại; chỉ lọc dữ liệu thẻ thật | Chưa làm | |
| R5c | `feat/library-cards-v1` | Thẻ thuật toán theo Spec: ký hiệu độ khó, thanh 5 đoạn `aria-hidden` | Chưa làm | |
| R6 | `feat/visualizer-frame` | Khung Visualizer, điều khiển, tốc độ `radiogroup`, "Bước x/y", panel 3 accordion; thanh trượt bước chỉ khi controller có nhảy bước (bước lập kế hoạch phải kiểm tra) | Chưa làm | |
| R7 | `chore/a11y-responsive-audit` | Vùng chạm 44 px, focus, `tabindex` vùng cuộn, đo Tab bằng bàn phím thật | Chưa làm | |

Quy tắc cho cả lộ trình:
- Mỗi PR xin trần bundle riêng ở bước lập kế hoạch, người dùng duyệt trước khi làm. CSS là ràng buộc chính: trần hiện tại JS <= 147,0 kB, CSS <= 51,0 kB (trần riêng của R3; mục Baseline của CLAUDE.md). R3 đo được JS 146.224 B, CSS 50.399 B.
- R2 phải đo và đề xuất trần cuối cho cả Redesign (đề xuất tạm: JS <= 158 kB, CSS <= 56 kB) để người dùng duyệt một lần; các PR sau làm trong trần đó và vẫn báo byte từng commit.
- Hai quy tắc sản phẩm trong `docs/design/decisions.md` (không theo dõi tiến độ cá nhân; không số giả) áp dụng cho mọi PR ở bảng này.
Ghi chú:
- Giai đoạn 1–4 gộp từ lịch sử git: CLAUDE.md và commit không ghi tên riêng từng giai đoạn; mốc duy nhất là
  "Merge PR #2, giai đoạn 4" (bản đầu tiên của CLAUDE.md, commit `718eb96`).
- Giai đoạn 8, Redesign Phase 3b và phần trạng thái thẻ của Phase 4 (các dòng trên) giữ nguyên làm lịch sử; phần tiến độ đã gỡ theo Spec v1.0 ở PR #30 `chore/remove-learning-progress` (dòng "Gỡ Tiến độ học tập").
- Giai đoạn 9 ban đầu gồm cả README và CI; hai phần này làm ở PR cấu trúc repo.
- Deployment: Vercel, production https://algo-vision-gamma.vercel.app tự deploy từ `main`, mỗi PR có link preview.
  Cấu hình nằm trên Vercel, không có file trong repo.
- Mỗi Phase redesign cần dư địa bundle riêng (ngưỡng hiện hành ở mục Baseline của CLAUDE.md). Không nâng ngưỡng khi chưa được người dùng duyệt;
  trần của một PR trước đó (Phase 3b: JS 160 kB, CSS 54,5 kB; Phase 4: JS 160 kB, CSS 56 kB) không áp cho PR sau.
  Sau khi gỡ tiến độ ngưỡng là JS 146,0 kB và CSS 49,5 kB; R2 nâng riêng CSS lên 51,0 kB; R3 nâng riêng JS lên 147,0 kB (đo 146.224 B, dư 776 B; mục Baseline của CLAUDE.md). Mỗi PR Redesign v1.0 cần trần riêng, duyệt riêng ở bước lập kế hoạch.
- Để sau: phân loại 4 loại cạnh DFS (cây/ngược/xuôi/chéo) dựa trên mốc vào/ra đã có.
- Việc còn tồn tại, chưa xếp vào giai đoạn nào: `docs/backlog.md`.
