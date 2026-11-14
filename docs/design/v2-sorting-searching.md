# UI v2-3a — Sorting & Searching

Hợp đồng trình bày trên base `c9b5ed5f2992291502b36d38f5481f3fbd5c2e43`, branch `feat/ui-v2-3a`, kế thừa [Light Foundation](v2-foundation.md). Spec/decisions v1 vẫn là lịch sử; quyết định 28–30 về seek, tốc độ và accordion được giữ.

## Trình bày

- Giữ thứ tự DOM và workspace một cột. Không làm panel bên phải, tab mobile hay thanh điều khiển cố định đáy; layout adaptive thuộc v2-3c.
- Toolbar Sorting tự xuống hàng; heading/count cũng wrap. Input Searching có nền/chữ từ token, select giới hạn trong khung chứa. Không thêm nhập mảng, preset hoặc thao tác mới.
- Giá trị cột Sorting dùng font 12px, nằm dưới chân cột thay vì trên đỉnh biến thiên. Canvas desktop/mobile cao 280/240px, padding dưới 56px; ở <=700px, nhãn theo ba hàng cách nhau 16px. Cột vẫn dùng chiều cao từ dữ liệu gốc; không sửa giá trị, thứ tự hay cue so sánh/đổi chỗ/đã sắp xếp. Bỏ đường lưới trang trí để dành ngân sách cho khả năng đọc và co giãn.
- Slider có min-width 0; thẻ thống kê có min-width 0 và ngắt chuỗi dài để không ép rộng workspace. Giữ native slider/radio, nhãn bước, dấu ✓, thuộc tính disabled và focus 2px hiện hành.
- Hover tốc độ chỉ khi chưa chọn và không disabled; hover summary dùng surface sáng. Nút chính/phụ, trạng thái và contrast kế thừa Foundation.
- Bỏ padding/viền/nền của wrapper trực tiếp bên trong accordion ở hai màn; giữ khung accordion, pre và các khối nội dung. Kiến thức xếp một cột để ba khối không đứng lẻ; đoạn văn 14px, line-height 1,8 và bỏ max-width 430px cũ. Giữ tiêu đề, nội dung học thuật, ba details mở mặc định và live region ngoài accordion.
- Gỡ các khai báo lề panel đã bị luật accordion ghi đè, heading h2 không được dùng, khai báo đoạn văn bị luật phía sau ghi đè và display thừa của bảng so sánh. Giữ luật `[hidden]` chung. Không thay đổi computed style của ba module BST/Hash/Graph trong mẫu đối chiếu 30 phần tử × 11 thuộc tính bằng happy-dom; đây không phải QA layout browser.

Chỉ CSS thay đổi ở sản phẩm. Các selector mới dùng `:where(#sorting-section, #search-section)`; selector đặc thù được sửa đã đối chiếu với template. Không thay JS runtime, template, thuật toán, generator, controller, scheduler, seek, navigation, dependency hay dữ liệu học thuật. Không tracking hoặc dữ liệu giả.

## Kiểm chứng

- `tests/v2-sorting-searching.test.js`: 7 test RED trên CSS cũ, GREEN sau triển khai; bổ sung kiểm nhãn dưới chân cột theo RED → GREEN. Kiểm CSS thực, scope, co giãn, vùng chạm >=44px, focus/hover/disabled, chữ >=4,5:1 và control/focus/cue >=3:1. Regression hiện có bảo vệ dữ liệu bước, cue, seek, tốc độ, accordion và live announcements.
- Ba mutation nguồn CSS: font nhãn 12→8px, thêm lại viền wrapper accordion, min-width slider 0→240px. Mỗi phép có đối chứng GREEN, mutant exit 1 đúng assert, heap 512 MB, timeout 15 s/test, không tràn heap. Snapshot restore/verify KHỚP nguyên byte sau mỗi phép; không sửa assert để phá thử. Kết quả full test/build và byte thật ở [baseline](../development-baseline.md).

## Browser và rủi ro còn lại

Gate test/build/bundle hiện **PASS**: đã khôi phục duy nhất comment mốc `/* Bảng phân tích thuật toán */`, không đổi test hoặc logic CSS. Test cũ và 7 test mới 17/17 PASS; full suite 1755/1755 PASS, 0 fail/skip/todo, 46,798 s. Build PASS: JS/CSS raw 152734/58400 B, gzip Node zlib mặc định 44546/10547 B; CSS còn 100 B dưới trần. Lỗi comment của lần kiểm trước đã được xử lý; nghiệm thu render UI vẫn chưa xác minh.

Browser QA **NOT VERIFIED**: Vite local `http://127.0.0.1:5199/` khởi chạy, nhưng browser tích hợp báo `net::ERR_CONNECTION_TIMED_OUT` khi mở. Không thao tác cửa sổ Chrome cá nhân. Không dùng test CSS/happy-dom thay bằng chứng render.

Cần kiểm hai màn với cả ba thuật toán Sorting, hai thuật toán Searching tại 360, 700/701, 767/768, 900/901, 1100, 1279/1280, 1440 CSS px; ghi browser/version, SHA kèm diff chưa commit, viewport, case và artifact. Kiểm 8/12/16/20/24 cột, nhãn 10–100, cue giao nhau, key Insertion, mục tiêu tìm thấy/không thấy, comparison/range panel, không tràn trang hoặc cắt nhãn; Tab/Shift+Tab, slider Home/End/mũi tên/thả kéo, radio, accordion, focus, hover/disabled, drawer/rail và reduced motion. Giữ focus/keyboard của pre cuộn ngang.

P2 chờ QA: font thực tế và ba hàng nhãn 24 cột trên màn hẹp, reflow toolbar, chuỗi trạng thái dài, zoom thật 200%, browser khác/thiết bị thật/screen reader. Tiêu đề Mã giả lặp vẫn giữ để bảo toàn heading và accessible name trong phạm vi không sửa template. CI/Vercel smoke chưa xác minh. UI v2-3 tổng thể chưa đạt exit gate; các nhóm cấu trúc dữ liệu và QA tổng thể còn lại.
