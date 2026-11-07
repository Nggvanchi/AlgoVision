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
| — | Redesign Phase 4: Thư viện, chỉ thẻ: thẻ thuật toán Sắp xếp/Tìm kiếm làm lại (pill độ khó, hàng Thời gian (xấu nhất) và Bộ nhớ khớp Learning Panel, trạng thái Đã mở / Chưa mở đọc từ tiến độ, "Trực quan hóa →"), thẻ Cấu trúc dữ liệu chung khung (không hàng Thời gian/Bộ nhớ, không pill độ khó, cùng trạng thái), id #sorting-algorithm-library; không đổi màn chi tiết. Dùng trần bundle riêng đã duyệt (JS 160 kB / gzip 46,9 kB; CSS 56 kB / gzip 11,0 kB). Không làm thêm PR gỡ mã chết trước Phase 4: số đo cho thấy chỉ gỡ được khoảng 0,1 kB CSS và dưới 0,3 kB JS (PR #26 đã gỡ lượt đầu) | Xong (chờ merge) | branch `feat/library-cards` (số PR ghi sau khi tạo PR) |
| — | Redesign Phase 4, mục 3c: tab gộp "Thư viện", ô tìm, bộ lọc, sheet mobile, sidebar tự thu gọn ở tablet (701–1024px) | Chưa làm | — |
| — | Redesign Phase 5: khung Visualizer chung cho Sorting và Searching (tiêu đề, thanh điều khiển, thống kê, chú giải, Learning Panel) | Chưa làm (cần trần bundle riêng, duyệt riêng ở bước lập kế hoạch) | — |
| — | Redesign Phase 6: workspace cấu trúc dữ liệu, chia hai PR: (1) Array, Stack, Queue, Linked List; (2) BST, Hash Table, Graph | Chưa làm (mỗi PR cần trần bundle riêng, duyệt riêng ở bước lập kế hoạch) | — |

Ghi chú:
- Giai đoạn 1–4 gộp từ lịch sử git: CLAUDE.md và commit không ghi tên riêng từng giai đoạn; mốc duy nhất là
  "Merge PR #2, giai đoạn 4" (bản đầu tiên của CLAUDE.md, commit `718eb96`).
- Giai đoạn 9 ban đầu gồm cả README và CI; hai phần này làm ở PR cấu trúc repo.
- Deployment: Vercel, production https://algo-vision-gamma.vercel.app tự deploy từ `main`, mỗi PR có link preview.
  Cấu hình nằm trên Vercel, không có file trong repo.
- Mỗi Phase redesign cần dư địa bundle riêng (ngưỡng hiện hành ở mục Baseline của CLAUDE.md). Không nâng ngưỡng khi chưa được người dùng duyệt;
  trần của một PR trước đó (Phase 3b: JS 160 kB, CSS 54,5 kB; Phase 4: JS 160 kB, CSS 56 kB) không áp cho PR sau.
  Sau Phase 4 dư địa JS chỉ còn khoảng 0,5 kB so với trần 160 kB (477 B): Phase 5 và Phase 6 mỗi phase cần trần riêng, duyệt riêng ở bước lập kế hoạch, hoặc phải cắt mã trước.
- Để sau: phân loại 4 loại cạnh DFS (cây/ngược/xuôi/chéo) dựa trên mốc vào/ra đã có.
- Việc còn tồn tại, chưa xếp vào giai đoạn nào: `docs/backlog.md`.
