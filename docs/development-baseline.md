# Baseline phát triển AlgoVision

Đây là bản ghi số liệu lịch sử R6c–R7, không phải kết quả đo trong phiên hiện tại. Chạy lại các lệnh trên đúng môi trường trước khi kết luận trạng thái hiện nay.

## Lần đo lịch sử sau R6c

- Môi trường: Windows, Vite 8.3.5.
- `pnpm test`: 1.680 test, tất cả pass; 0 fail, 0 skipped.
- `pnpm build`: thành công.
- Bundle: JavaScript 150.493 B; CSS 57.207 B. HTML và gzip không phải ngưỡng được dùng lần đo này.
- Font tự host: 10 WOFF2, tổng 172.912 B, cùng 2 giấy phép OFL; ngưỡng ghi nhận 175 kB. Font không nằm trong bundle JS/CSS.

## UI v2-3b — Data Structures, Windows 2026-11-14

**Trạng thái mới nhất sau sửa hai regression được duyệt: test/build/bundle PASS; browser QA NOT VERIFIED.** Các số FAIL bên dưới giữ làm bằng chứng lần kiểm trước.

- Sửa tối thiểu: panel chung dùng `var(--panel-bg)` thực sự có hiệu lực (alias trỏ `--panel`); `.hash-table-frame` đứng cuối nhóm selector chung để bộ đọc test thấy padding/border. Không sửa test cũ/test mới, JS runtime hoặc template. Hai regression 2/2 PASS, 0 fail/skip/todo, 0,095 s; nhóm liên quan gồm 7 test mới 80/80 PASS, 4,019 s.
- Đối chiếu CSS trước/sau hai sửa bằng happy-dom: 164 phần tử × 25 thuộc tính × 8 viewport (360/640/700/760/768/900/1280/1440) × default/disabled = 65600 đối chiếu KHỚP; không thay browser render QA.
- Full `pnpm test` mới **1762/1762 PASS**, 0 fail/skipped/todo/cancelled, **47,274 s**. `pnpm build` PASS, Vite 8.3.5, 149 ms (tổng lệnh 743 ms): JS raw/gzip **152734/44546 B**, CSS raw/gzip **58480/10584 B** (Node zlib mặc định). So với trước sửa hai lỗi: JS +0/+0 B, CSS +3/+6 B; so với base: CSS +80/+37 B. Headroom JS/CSS **1266/20 B**, không nâng trần 154000/58500 B.
- Không mutation mới trong lượt sửa regression. Đối chiếu trong bộ nhớ: ngoài đúng hai sửa được duyệt, CSS khớp nguyên byte SHA sau restore mutation cũ. CSS cuối SHA-256 `198f5de35cbef85687250e40830b6b76d8b3f567df2cacb95116f1ca420a1a65`; test mới SHA-256 không đổi `ea02e938ee8d8d7c424a4e33bdd33559acd12d9b3a8d7e01856b8cb555c9ab1c`.
- Thử browser lại: Vite ready 528 ms, browser tích hợp vẫn `net::ERR_CONNECTION_TIMED_OUT` tại `http://127.0.0.1:5199/`; đã dừng dev server của phiên. Browser/CI/Vercel smoke/zoom thật/đa trình duyệt/thiết bị/screen reader vẫn NOT VERIFIED. Diff chờ nghiệm thu, chưa commit/push/merge.

### Bằng chứng lượt triển khai đầu và lần FAIL trước sửa

- Base `6ec0d593593be18bb94a543b182e632f747f98da`, branch `feat/ui-v2-3b`; diff chưa commit. Trước triển khai: 1755/1755 PASS, 0 fail/skip/todo/cancelled, 46,065 s; JS/CSS raw 152734/58400 B, gzip Node zlib mặc định 44546/10547 B. Dependencies đã đầy đủ, không cài lại trong triển khai.
- Chỉ `src/style.css`, test mới và docs; không sửa JS runtime/template/thuật toán. Sau gom/gỡ thuần: 2856 computed-style comparisons KHỚP bằng happy-dom trên 28 phần tử × 17 thuộc tính × 6 viewport; CSS artifact 57574 B/gzip 10505 B, giảm 826/42 B. Không coi đây là browser layout QA.
- TDD 7 test mới: RED 6 fail/1 pass trước CSS, GREEN 7/7 sau CSS. Nhóm regression liên quan 80/80 PASS (3,842 s); sau đó bổ sung assert computed style 360/760/1280 trong test mới, 7/7 PASS (0,676 s). Full suite **FAIL: 1760/1762 PASS, 2 FAIL, 0 skipped/todo/cancelled, 50,583 s**. Hai regression: `tests/dead-code-removed.test.js:101` yêu cầu đúng một nơi dùng `var(--panel-bg)` nhưng gom panel đã bỏ nơi dùng; `tests/hash-table-layout.test.js:128` đọc rule `.hash-table-frame` riêng không tìm thấy padding sau khi gom vào selector chung. Không sửa/giảm test; dừng triển khai theo gate người dùng, chờ duyệt xử lý CSS. Computed style tương đương không đủ bảo vệ các hợp đồng nguồn này.
- Build trước full suite PASS, Vite 8.3.5, 144 ms: JS raw/gzip 152734/44546 B (không đổi), CSS raw/gzip 58477/10578 B (+77/+31 B). Dư 1266 B JS và 23 B CSS dưới trần 154000/58500 B; không nâng ngân sách. CSS giữ nguyên sau build/mutation; không chạy lại build sau khi gate test FAIL.
- Mutation nguồn CSS, heap 512 MB, timeout 15 s/test: slider 0→240px (GREEN 0,6 s/16 dòng, mutant exit 1, 0,6 s/34 dòng); wrapper border 0→1px (GREEN 0,6 s/16 dòng, mutant exit 1, 0,6 s/36 dòng); control border-control→border (GREEN 0,7 s/16 dòng, mutant exit 1, 0,6 s/30 dòng). Tất cả mutant RED đúng assert, không tràn heap. Restore/verify KHỚP nguyên byte sau mỗi phép; snapshot tạm đã clear. CSS SHA-256 `c7158ca9a3ba30ffc1f58dc83c0ddba938b42bdd14076e05a85b69212f124a60`.
- Browser NOT VERIFIED: Vite local `127.0.0.1:5199` khởi chạy nhưng browser tích hợp trả `net::ERR_CONNECTION_TIMED_OUT`; đã dừng dev server. Không tác động Chrome cá nhân. CI/Vercel smoke/zoom thật 200%/đa trình duyệt/thiết bị thật/screen reader chưa xác minh. [Hợp đồng và checklist](design/v2-data-structures.md). Chưa đóng exit gate UI v2-3.

## UI v2-3a — Sorting & Searching, test/build PASS, Windows 2026-11-14

Trạng thái hiện tại: MERGED PR #56 tại `6ec0d593593be18bb94a543b182e632f747f98da`. Các dòng bên dưới giữ nguyên bằng chứng đo trước commit; “diff chưa commit” mô tả thời điểm đo đó.

- Base `c9b5ed5f2992291502b36d38f5481f3fbd5c2e43`, branch `feat/ui-v2-3a`; diff chưa commit. Sản phẩm chỉ sửa `src/style.css`; không sửa runtime JS/template/dependency.
- Baseline đo trước triển khai trong phiên: 1748 PASS, 0 FAIL/skipped/todo/cancelled; 50,804 s. Build PASS, Vite 8.3.5, 268 ms: JS raw 152734 B, CSS raw 57994 B; gzip Node zlib mặc định 44546/10535 B. Dư 1266/506 B dưới trần 154000/58500 B.
- TDD: 7 test mới RED trên CSS cũ rồi GREEN; refinement nhãn dưới chân cột cũng RED → GREEN. Nhóm liên quan 167/167 PASS, 13,239 s; nhóm CSS/token/scroll riêng 274/274 PASS. Đối chiếu happy-dom 30 phần tử × 11 thuộc tính của BST/Hash/Graph không khác baseline; không phải browser layout QA.
- Lần trước full suite FAIL 1754/1755 do đổi comment mốc `/* Bảng phân tích thuật toán */`, khiến assert tại `tests/step-tools-css.test.js:88` đỏ. Đã khôi phục chính xác comment tại chỗ cũ, không sửa test hoặc logic CSS. Lần kiểm chứng mới nhất: test cũ và 7 test mới **17/17 PASS**, 0,847 s; full suite **1755/1755 PASS**, 0 FAIL/skipped/todo/cancelled, 46,798 s. Tăng 7 test so với baseline 1748.
- Build mới nhất **PASS**, Vite 8.3.5, 160 ms: JS raw 152734 B, CSS raw 58400 B; gzip Node zlib mặc định 44546/10547 B. So với baseline: JS raw/gzip +0/+0 B, CSS raw/gzip +406/+12 B. Dư 1266 B JS và 100 B CSS dưới trần 154000/58500 B. Đây là số đo artifact build mới, thay cho ước lượng lightningcss riêng trước đó.
- Ba mutation nguồn CSS đều bị bắt đúng assert, heap 512 MB, timeout 15 s/test, không tràn heap: font nhãn 12→8px (đối chứng 0,9 s / 16 dòng, mutant exit 1, 0,7 s / 34 dòng); viền wrapper 0→1px (0,8 s / 16 dòng; exit 1, 0,7 s / 36 dòng); min-width slider 0→240px (0,8 s / 16 dòng; exit 1, 0,7 s / 34 dòng). Mọi đối chứng exit 0/GREEN; mọi mutant ĐỎ đúng thông điệp. Snapshot restore/verify KHỚP sau từng phép; SHA-256 trước sửa comment `5ff0ba26bf59e266b7fc8d6c8c5fe01f9b5c0d94d11fe14ce92256e1d183319f`. CSS cuối `d5a9a47b342e7f077b86cea44049cfb36f2e46bb9d0a10fe4cf2d63521fa9ab1`; đối chiếu SHA sau chuẩn hóa duy nhất comment KHỚP bản đã khôi phục mutation. Không chạy mutation mới trong lượt sửa comment; không còn mutation tạm.
- Browser **NOT VERIFIED**: Vite `127.0.0.1:5199` khởi chạy, browser tích hợp trả `net::ERR_CONNECTION_TIMED_OUT`. Không tác động Chrome cá nhân. CI, Vercel smoke, zoom 200%, browser khác, thiết bị thật và screen reader chưa xác minh. Checklist ở [hợp đồng v2-3a](design/v2-sorting-searching.md).
- Test/build/bundle đạt gate kỹ thuật; nghiệm thu UI/browser còn NOT VERIFIED, chưa đóng exit gate UI v2-3. Giữ diff để review, không commit/push/merge. Kiểm UTF-8 không BOM/LF, diff và phạm vi thực hiện sau cập nhật báo cáo.

## UI v2-2 — Dashboard & Library, Windows 2026-11-14

- Base `5e506b436c7021d46a061d57b57d96ae6ff0d40c`, branch `feat/ui-v2-dashboard-library`, thay đổi chưa commit. Không đổi runtime JS, template, controller hoặc Visualizer.
- TDD: 8 test mới RED trước CSS, GREEN sau triển khai. Full suite mới: 1748 PASS, 0 FAIL, 0 skipped, 0 todo; 41,159 s. Các regression dữ liệu/handlers/keyboard/live announcements cũ giữ nguyên; hai assertion layout v1 được thay bằng hợp đồng grid fluid/mobile v2 cụ thể, không hạ ngưỡng accessibility.
- Hai mutation nguồn CSS (grid bốn cột; ô tìm cố định 520px) bị regression mới bắt, exit 1, heap 512 MB, timeout 15 s; sau mỗi mutation khôi phục nguyên byte, test GREEN. SHA-256 sau khôi phục: `03c30f1fec40b20e5e7d460580004ada8c748fd256703a2aa6ba381a67e70172`.
- Build PASS: JS raw 152734 B, CSS raw 57994 B; so với Foundation JS +0 B, CSS -466 B. Đạt mục tiêu CSS <=58400 B; dư 1266 B JS, 506 B CSS dưới trần 154000/58500 B. Gzip Node zlib mặc định: JS 44546 B, CSS 10535 B (không phải ngưỡng nghiệm thu).
- Browser QA NOT VERIFIED: Vite local 127.0.0.1:5199 khởi chạy được nhưng trình duyệt tích hợp trả ERR_CONNECTION_TIMED_OUT. Không suy diễn test CSS/toán ngưỡng thành browser reflow PASS; các viewport và checklist còn lại ghi tại `docs/design/v2-dashboard-library.md`.
- Encoding UTF-8/LF, diff check và kiểm phạm vi chạy riêng sau cập nhật docs; không cài dependencies, không commit/push/PR.

## UI v2-1 — bằng chứng trước review, Windows ngày 2026-11-13

- Branch `feat/ui-v2-foundation`, base `07be7660c61459cb38e8426c5407904cca016aeb`; thay đổi chưa commit khi đo. Chỉ CSS, test và docs; không đổi JS runtime/template, Spec hoặc decisions v1.
- TDD: hợp đồng token light RED trước khi sửa CSS (23 giá trị palette chưa đúng); sau triển khai GREEN. Full suite trước review: 1739 tests PASS, 0 FAIL, 0 skipped, 0 todo, 45,327 s; tăng 14 test so với 1725 của R7c.
- `pnpm build` PASS (Vite 8.3.5): JS raw 152734 B, CSS raw 58452 B. So với R7c: JS +0 B, CSS +633 B. Dư 1266 B JS và 48 B CSS dưới trần 154000/58500 B. Gzip do Vite hiển thị: JS 44,81 kB, CSS 10,58 kB; không phải trần nghiệm thu.
- Build đầu CSS 58654 B vượt trần; đã gỡ luật hover/disabled dư trong phạm vi, không nâng ngân sách. Số đo cuối ở trên thay cho lần build vượt trần.
- Encoding UTF-8/LF, diff và test tương phản palette/control/focus/trạng thái PASS. Tính màu từ CSS không thay browser QA; xem `docs/design/v2-foundation.md`.
- Mutation nguồn CSS: đổi chữ chính thành trắng bị bốn test nền sáng bắt (exit 1, heap 512 MB). Snapshot helper không truy xuất được bản tạm giữa lệnh sandbox; đã khôi phục thay đổi chính xác và đối chiếu SHA-256 trước/sau: `ac6cd1d7ca0efac3a22d380bedc5987d859f77c1d1154da0f291def98f11cff5` (trước lần sửa comment thuần túy cuối). Full test/build cuối chạy sau khôi phục; không để mutation trong diff.
- Chrome 360/767/768/1279/1280/1440 CSS px: NOT VERIFIED, chưa có Chrome/CDP khả dụng trong phiên sandbox. Zoom thật 200%, Vercel browser smoke, Firefox/Safari/thiết bị thật/screen reader vẫn NOT VERIFIED. 137 case R7 là lịch sử của palette v1, không nghiệm thu light v2.
- Dashboard/Library/Visualizer redesign riêng và layout hai cột chưa triển khai. Browser QA và review còn lại; không commit/push/PR trong phiên này.

## UI v2-1 — nghiệm thu ba patch sau review

- Khôi phục marker comment `TOKEN --av-*` mà không đổi test; riêng `.hash-cell` đổi stroke từ viền trang trí sang `--border-control`. Viền ô/khung đạt 3,62:1/3,41:1 từ token thật. Giữ mọi viền trang trí khác.
- Regression Hash Table RED trước patch; test marker cũng RED. Sau patch, nhóm focused 154/154 PASS. Test track WebKit/Firefox giải nền và màu track từ CSS hiện hành, vẫn giữ ngưỡng >=3:1; không dùng cặp dark viết cứng.
- Full suite mới trên trạng thái cuối: 1740 PASS, 0 FAIL, 0 skipped, 0 todo; 55,857 s. Build PASS: JS raw 152734 B; CSS raw 58460 B (dư 1266/40 B dưới trần). Gzip đo bằng Node zlib mặc định: JS 44546 B, CSS 10529 B; khác thiết lập gzip do Vite hiển thị.
- Phạm vi cuối là 14 file (12 modified, 2 untracked): 13 file Foundation ban đầu cộng `tests/step-tools-css.test.js` đã được chủ dự án chỉ định sửa. Không stage/commit hoặc thay đổi runtime/template.
- Kiểm inventory Chrome trực tiếp: chỉ có cửa sổ cá nhân, chưa có cửa sổ QA riêng hoặc kết nối Chrome trong công cụ; không tác động cửa sổ cá nhân. Browser QA 360/767/768/1279/1280/1440 CSS px vẫn NOT VERIFIED; không dùng PASS của unit/CSS test thay cho browser.

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
