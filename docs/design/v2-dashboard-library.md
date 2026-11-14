# UI v2-2 — Dashboard & Library

Hợp đồng trình bày trên base `5e506b436c7021d46a061d57b57d96ae6ff0d40c`, kế thừa [Light Foundation](v2-foundation.md). Không sửa Spec/decisions v1 lịch sử.

- Dashboard: Hero cân dòng tiêu đề, bỏ khoảng trống đầu; CTA tự xuống hàng, chia diện tích khi đủ chỗ. Giữ minh họa Bubble Sort bước 3/31, ba card nổi bật và truy cập nhanh cùng dữ liệu/handlers cũ.
- Dashboard và hai Library dùng chung grid auto-fit, gap 16px, tối thiểu 260px/card (co xuống 100% khi vùng chứa hẹp hơn). Công thức minimum `min(100%, max(260px, calc((100% - 32px) / 3)))` giới hạn tối đa ba cột; hai cột cần ít nhất 536px, ba cột cần 812px nội dung. Đây là tính toán ngưỡng, không phải phép đo browser.
- Shell mobile <=767px luôn một cột. Giữ drawer/rail/sidebar, không suy số cột chỉ từ viewport; thanh cuộn, sidebar mở/thu gọn và padding đều làm đổi diện tích thật. Bỏ các luật ép cột ở 700/900/1100 và luật kéo thẻ cuối ra cả hàng. Hero vẫn giữ breakpoint 900px; minh họa vẫn ẩn <=700px.
- Card thống nhất padding 20px/radius 16px, mô tả Library 14px; Dashboard giữ padding 16px ở mobile. Không thêm metadata: vẫn đúng 7 cấu trúc + 7 giải thuật, BFS/DFS không có badge độ khó giả.
- Chip Dashboard/Library dùng chung luật 44px, border-control, hover và focus kế thừa. Chip chọn thêm chữ đậm 700 cùng viền/nền chọn. Wrapper search co giãn, input width 100%/min-width 0; empty state nền panel trắng. Không thay semantics ARIA hoặc logic debounce/dedupe.
- Chỉ CSS thay đổi ở sản phẩm; template, JS runtime, controller, thuật toán, seek, dữ liệu và canvas/controls Visualizer giữ nguyên. Không thêm dependency/tính năng/progress tracking.

## Kiểm chứng và giới hạn

Regression v2 đọc CSS thật, kiểm grid, wrapper input, chip/card, focus và ngưỡng tương phản chữ >=4,5:1, UI/focus >=3:1. Test layout v1 được chuyển sang hợp đồng fluid/mobile cụ thể, giữ các regression dữ liệu/keyboard/live announcements. Xem [baseline](../development-baseline.md) cho kết quả test/build và mutation thực tế.

Browser QA vẫn NOT VERIFIED: dev server chạy nhưng trình duyệt tích hợp timeout khi mở local. Cần đo trực tiếp 360, 700/701, 767/768, 900/901, 1100, 1279/1280, 1440 CSS px: số cột/card rộng thực, overflow, chữ tiếng Việt, Tab/Shift+Tab, filter/empty state/live announcements, focus, hover/disabled và drawer/rail. Không coi unit/CSS test hoặc 137 case R7 lịch sử là bằng chứng render UI mới. Rollback khi được duyệt bằng việc hoàn nguyên riêng diff trình bày của bước này, không rewrite history.
