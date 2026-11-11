# Baseline phát triển AlgoVision

Đây là bản ghi số liệu lịch sử sau R6c, không phải kết quả đo trong phiên hiện tại. Chạy lại các lệnh trên đúng môi trường trước khi kết luận trạng thái hiện nay.

## Lần đo gần nhất được ghi nhận sau R6c

- Môi trường: Windows, Vite 8.3.5.
- `pnpm test`: 1.680 test, tất cả pass; 0 fail, 0 skipped.
- `pnpm build`: thành công.
- Bundle: JavaScript 150.493 B; CSS 57.207 B. HTML và gzip không phải ngưỡng được dùng lần đo này.
- Font tự host: 10 WOFF2, tổng 172.912 B, cùng 2 giấy phép OFL; ngưỡng ghi nhận 175 kB. Font không nằm trong bundle JS/CSS.

## Ngân sách bundle lịch sử sau R6b/R6c

- JavaScript: tối đa 150.500 B.
- CSS: tối đa 57.500 B.
- Đây là giới hạn lịch sử; đã được thay thế sau R7a.

## Ngân sách bundle hiện hành đã duyệt sau R7a

- JavaScript: tối đa 154.000 B.
- CSS: tối đa 58.500 B.
- R7a bổ sung drawer modal, vòng focus bàn phím và khôi phục focus. Chủ dự án duyệt giữ nguyên các tính năng accessibility này và điều chỉnh ngân sách thay vì gỡ chúng.
- Build M0.4b ghi nhận JS 152.328 B và CSS 57.659 B; đây là số đo của lần build đó, không phải kết quả hiện tại. So với giới hạn mới, phần dự phòng khi đo là 1.672 B JS và 841 B CSS.
- Mỗi PR tiếp theo vẫn cần đo lại bằng cùng lệnh build và xin giới hạn riêng ở bước lập kế hoạch. Không tự nâng ngân sách.
- Số đo và giới hạn R6c ở trên là lịch sử; không dùng chúng làm kết quả build hiện tại.
