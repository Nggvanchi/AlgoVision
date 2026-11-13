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

## Lịch sử ngưỡng và số đo trước R6c

Chuyển nguyên số liệu từ tài liệu hướng dẫn cũ tại commit `59c99f0` để bảo toàn lịch sử. Các mức dưới đây không thay thế ngân sách hiện hành sau R7a; trần cuối Redesign là ước tính, không phải mức được áp dụng cho cleanup này.

Ngưỡng trước R6b (trần riêng của R6a, ƯỚC TÍNH không qua bản mẫu): JS <= 151,5 kB (gzip <= 44,5), CSS <= 56,5 kB (gzip <= 11,5); số đo sau R6a: 1636 test, JS 150.223 B, CSS 56.483 B.
Ngưỡng trước R6a (trần riêng của `feat/controller-seek`): JS <= 150,0 kB (gzip <= 44,0), CSS <= 55,5 kB (gzip <= 11,0); số đo sau PR đó: 1580 test, JS 149.903 B, CSS 55.079 B.
Trần cuối cho toàn Redesign (ước tính, người dùng đặt): JS <= 158 kB (gzip <= 46), CSS <= 64 kB (gzip <= 12,8). Trần của PR trước không áp cho PR sau: mỗi PR đo và đặt trần riêng.
Ngưỡng trước `feat/controller-seek` (trần riêng của R5c): JS <= 150,0 kB (gzip <= 44,0), CSS <= 55,5 kB (gzip <= 11,0); số đo sau R5c: 1547 test, JS 149.708 B, CSS 55.079 B. Ngưỡng trước R5c (trần riêng của R5b): JS <= 150,0 kB (gzip <= 44,0), CSS <= 55,0 kB (gzip <= 11,0); số đo sau R5b: 1527 test, JS 149.716 B, CSS 54.576 B. Ngưỡng trước R5b (trần riêng của R5a): JS <= 148,0 kB (gzip <= 43,5), CSS <= 53,5 kB (gzip <= 10,5); số đo sau R5a: 1482 test, JS 147.962 B, CSS 53.226 B. Ngưỡng trước R5a (trần riêng của R4): JS <= 147,0 kB (gzip <= 43,0), CSS <= 53,0 kB (gzip <= 10,5); số đo sau R4: 1444 test, JS 146.811 B, CSS 52.667 B. Ngưỡng trước R4 (trần riêng của R3): JS <= 147,0 kB (gzip <= 43,0), CSS <= 51,0 kB (gzip <= 10,5); số đo sau R3: 1415 test, JS 146.358 B, CSS 50.399 B. Ngưỡng trước R3 (trần riêng của R2): JS <= 146,0 kB (gzip <= 42,5), CSS <= 51,0 kB (gzip <= 10,5); trước nữa (sau khi gỡ Tiến độ học tập): CSS <= 49,5 kB (gzip <= 10,0). Đã duyệt hạ ngưỡng từ mức Phase 4 (JS 160 kB / gzip 47,0; CSS 52,5 kB / gzip 10,5) vì PR `chore/remove-learning-progress` gỡ mã và CSS của tiến độ
(JS -13,6 kB, CSS -3,1 kB so với `main` trước PR). Redesign v1.0: mỗi PR cần trần bundle riêng, duyệt ở bước lập kế hoạch; không nâng ngưỡng khi chưa được duyệt.
