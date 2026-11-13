# Baseline phát triển AlgoVision

Đây là bản ghi số liệu lịch sử R6c–R7, không phải kết quả đo trong phiên hiện tại. Chạy lại các lệnh trên đúng môi trường trước khi kết luận trạng thái hiện nay.

## Lần đo lịch sử sau R6c

- Môi trường: Windows, Vite 8.3.5.
- `pnpm test`: 1.680 test, tất cả pass; 0 fail, 0 skipped.
- `pnpm build`: thành công.
- Bundle: JavaScript 150.493 B; CSS 57.207 B. HTML và gzip không phải ngưỡng được dùng lần đo này.
- Font tự host: 10 WOFF2, tổng 172.912 B, cùng 2 giấy phép OFL; ngưỡng ghi nhận 175 kB. Font không nằm trong bundle JS/CSS.

## R7c — bằng chứng lịch sử, PR #51

- Baseline sau merge: `ef34955fa945a96336195c10dae6a5367ea2dfc6` ([PR #51](https://github.com/Nggvanchi/AlgoVision/pull/51)).
- Unit tests: 1725 PASS, 0 FAIL; build PASS. Đây là kết quả lịch sử R7c, không chạy lại trong Closeout docs-only.
- Bundle lịch sử: JS 152734 B; CSS 57819 B. So với trần hiện hành 154000 B/58500 B, dư 1266 B JS và 681 B CSS; không nâng ngân sách.
- DOM A1–A8 PASS; cleanup VERIFIED trong phạm vi R7c. Không thay thế xác minh screen reader hoặc mọi module ngoài phạm vi PR #51.

## R7d — Closeout PARTIAL PASS với accepted risks

- Chủ dự án phê duyệt Closeout PARTIAL PASS; không tuyên bố QA toàn diện. SHA của toàn bộ evidence: `ef34955fa945a96336195c10dae6a5367ea2dfc6`.
- 137 browser QA case duy nhất PASS = 124 kế thừa + 13 mới, đã đối chiếu SHA và tên case để không cộng trùng. Đây là browser cases, không cộng vào 1725 unit tests R7c.
- Môi trường evidence: Chrome 152.0.7977.83, Windows 10.0.26200 x64.
- 84 responsive case PASS = 12 màn × 7 viewport CSS (360, 700, 701, 767, 768, 1279, 1280 px): Dashboard, hai tab Library, Sorting, Searching, Array, Stack, Queue, Linked List, BST, Hash Table, Graph.
- Drawer/rail, focus restore, resize qua breakpoint, keyboard/controls và overflow PASS trong phạm vi case đã kiểm; viewport thấp và Chrome touch EMULATION PASS. Tab/Shift+Tab là kiểm mẫu (12 lượt Tab và một lượt ngược mỗi màn), không chứng minh mọi tổ hợp bàn phím. Touch emulation không chứng minh thiết bị thật.
- Evidence report: `r7d-evidence-1794568325490/report.json` (runner `r7d-qa-4`, artifact ngoài repo trong thư mục visualization của phiên QA). Report chứa 13 case mới và 124 PASS kế thừa từ report trước; 0 application exception, 0 console error, 0 failed request trong báo cáo, không phải phép đo mới tại Closeout.
- Không phát hiện P0/P1 trong phạm vi đã kiểm; không suy diễn bên ngoài. P0/P1 phát hiện sau cần patch riêng; P2 ghi backlog UI v2, không triển khai trong Closeout.
- Accepted risks đã được chủ dự án chấp thuận hoãn: Chrome zoom thật 200%, Vercel browser smoke 360/1280, Firefox, Safari, thiết bị thật và screen reader đều NOT VERIFIED. Không dùng CDP viewport/touch emulation để thay browser zoom hoặc thiết bị thật.
- Vercel deployment SUCCESS gắn đúng SHA trên GitHub ([deployment](https://vercel.com/nggvanchi-4548/algo-vision/Af9yL1YCJbnC2LHwDmJeRB4Ykykh)); trạng thái triển khai không chứng minh browser smoke PASS.
- Phiên Closeout docs-only: 137 browser cases, unit tests, build và mutation NOT RUN theo phạm vi đã duyệt; chỉ kiểm diff, UTF-8/LF, Markdown và tính nhất quán số liệu/tham chiếu. Giữ nguyên lịch sử R6c/R7a và ngân sách hiện hành.

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
