# Quyết định cho Redesign v1.0

Nguồn thiết kế: `docs/design/spec.md` (chép văn bản từ `AlgoVision Spec.pdf`; ảnh artboard không có trong repo). File này ghi những quyết định đã chốt khi áp Spec vào ứng dụng hiện tại, và hai quy tắc sản phẩm của Spec cần nhớ mỗi khi sửa UI. Đọc cả hai file trước khi sửa UI.

## Hai quy tắc sản phẩm (không được vi phạm)

**(a) Không theo dõi tiến độ cá nhân.** Không thêm lại Tiến độ học tập, nhãn Đã mở / Chưa mở, lịch sử truy cập, số lần truy cập, thống kê học tập, thanh tiến trình học cá nhân, "Tiếp tục học tập", khối "Lộ trình" 5 chặng (Spec mục 1, 14, 16, 17). `tests/progress-removed.test.js` canh các định danh cũ. "Tiến trình / Bước x/y" trong Visualizer là bước của thuật toán đang mô phỏng, không phải tiến độ học, và được giữ (Spec mục 10).

**(b) Không số giả.** Mọi dữ liệu hiển thị phải là dữ liệu thật, hoặc dùng trạng thái rỗng, hoặc gắn nhãn "Minh họa" / "Dữ liệu mẫu" (Spec mục 1, 17). Ví dụ: bảng Bubble Sort "bước 3/10" ở hero Dashboard phải gắn nhãn "Minh họa"; chip tài khoản "[Tên người học]" là placeholder nên không làm.

## 16 quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Tiến độ học tập đã gỡ ở PR #30 (trang, khối Dashboard, nhãn Đã mở/Chưa mở, `localStorage`). | Spec mục 16 và 17 cấm; chủ dự án đã duyệt gỡ. |
| 2 | Spec chuyển thành `docs/design/spec.md`; không commit file PDF. | Hai PDF giống hệt nhau, nặng khoảng 5 MB mỗi file, và văn bản đọc/diff/tìm kiếm được trong git. |
| 3 | Thẻ cấu trúc dữ liệu giữ như Phase 4: không độ khó, không hàng Thời gian/Bộ nhớ. | Chưa có dữ liệu thật cho 7 cấu trúc; thêm vào là số giả (quy tắc b). |
| 4 | Sidebar giữ 7 cấu trúc; không tạo mục "Đệ quy"; không gộp Ngăn xếp và hàng đợi. | Ứng dụng chưa có nội dung Đệ quy (không thêm mục rỗng, quy tắc b); Ngăn xếp và Hàng đợi là hai màn hình riêng đã có. |
| 5 | Không làm chip tài khoản và ô tìm Ctrl K toàn cục. | Chip chỉ là placeholder (dữ liệu giả); Spec mục 14 ghi chưa có thiết kế kết quả tìm kiếm hay command palette. |
| 6 | Không lưu trạng thái sidebar vào `localStorage`. | `tests/meta/no-web-storage.test.js` canh; nếu sau này làm thì sửa test cùng PR đó. |
| 7 | Sidebar giữ 256 px cho đến khi làm tablet rail. | 264 px làm hẹp khung bảng Hash Table (chuỗi chaining 15 khóa cần khung chứa được 842 px) và đụng test `sidebar-css`, `hash-table-layout`; đổi cùng lúc với rail để đo một lần. |
| 8 | Nhập dữ liệu, chip Mẫu dữ liệu, thanh trượt bước để sau, trừ khi `src/simulation-controller.js` đã hỗ trợ nhảy bước. | Đây là chức năng mới (Sorting hiện không cho nhập mảng), không phải thay đổi giao diện; thanh trượt cần controller nhảy tới bước tùy ý. |
| 9 | Viền ô nhập giữ `--border-control` (3,57:1), không dùng màu Spec `#2E2E44`. | Màu Spec trên `#12121C` chỉ 1,41:1, không đạt WCAG 1.4.11 (≥ 3:1) cho thành phần giao diện. |
| 10 | Mỗi PR có trần bundle riêng, duyệt ở bước lập kế hoạch. | Trần hiện là JS ≤ 147,0 kB, CSS ≤ 51,0 kB (R3); CSS là ràng buộc chính nên mỗi PR phải đo và xin trần trước khi làm. |
| 11 | Mỗi PR một nhánh ngắn từ `main`; không tạo `feat/redesign-v1`. | Nhánh dài sống lâu dễ xung đột và khó review; PR nhỏ merge từng bước giữ `main` luôn chạy được. |
| 12 | Viền điều khiển (ô nhập, select, nút viền) giữ `--border-control` (`#6B6B87`), không dùng `--av-border-strong`; dấu "✓" ở cột đã sắp xếp dùng `--av-text` ở R6, không dùng `#6EE7B7` trên `#1F6F5A`. | Quyết định 9 áp dụng cho mọi điều khiển; `#6EE7B7` trên `#1F6F5A` chỉ 3,96:1 (< 4,5:1) cho chữ. |
| 13 | Lịch áp `--border-control`: R5b (ô tìm và bộ lọc ở Thư viện), R6 (điều khiển Visualizer và các toolbar), R7 đo lại toàn bộ. | `--border-control` hiện chưa luật nào dùng (R2 chỉ giữ token); áp theo màn hình để mỗi PR tự kiểm ảnh và byte. |
| 14 | Mục "Trực quan hóa" của Spec mục 7 CHƯA có trong sidebar ở R3 (không thêm mục rỗng hay lối tắt); giải quyết ở R5a khi có trang Thư viện gộp theo hướng ít đụng nhất. | Mục này không có trang đích riêng: lối tắt tới một visualizer làm hai mục nav trỏ cùng một màn (phá quy tắc đúng một `aria-current`); "Visualizer gần nhất" là lịch sử truy cập (quy tắc a); màn danh mục 12 thẻ trùng phạm vi R5a. |
| 15 | Sidebar giữ 256 px trong toàn bộ chuỗi Redesign (cập nhật quyết định 7: không đổi 264 cùng lúc với rail). Nếu sau này cần 264 thì ghi backlog. | `hash-table-layout` khóa 256 + padding 40 cho khung bảng băm; Spec 264 chỉ đi cùng padding 32. Rail 72 px không đổi bề rộng mở. |
| 16 | Rail 72 px TỰ ĐỘNG ở 768–1279 px (nút thu gọn ẩn trong dải này); thu gọn bằng tay chỉ ở >= 1280 px và nhớ trong bộ nhớ của phiên; drawer ở <= 767 px; chỉ luật shell đổi điểm gãy, các khối `max-width: 700px` của nội dung giữ nguyên. Chỗ lệch Spec đã chọn: nhãn breadcrumb "Đường dẫn trang" (Spec: "Breadcrumb"), không ghi nhớ trạng thái thu gọn giữa các phiên (Spec có; quyết định 6), drawer chưa là `role="dialog"` và chưa bẫy focus (Spec mục 13; để R7), tooltip và mục con theo Spec nhưng chữ mục con 13 px, padding `.main-content` 40/28 px. | Spec mục 11: Tablet/Laptop dùng rail 72 px; mở rộng bằng overlay ở 768–1279 để backlog. Giữ nguyên nội dung ở 700 px để từng PR màn hình tự đổi điểm gãy của mình. |
