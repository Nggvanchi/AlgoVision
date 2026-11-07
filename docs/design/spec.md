<!-- Nguồn: "AlgoVision Spec.pdf" (8 trang; "AlgoVision design system.pdf" có nội dung giống hệt). Bản chép văn bản, ảnh artboard không có trong repo. -->

✓ BẢN CHỐT v1.0 · ĐÃ ĐIỀU CHỈNH · CHỜ XÁC NHẬN BÀN GIAO

# AlgoVision · Đặc tả thiết kế bàn giao

Tài liệu mô tả bản thiết kế cuối của AlgoVision (ứng dụng học và trực quan hóa cấu trúc dữ liệu, giải thuật). Nguồn sự thật là các artboard trên trang "AlgoVision Design"; tài liệu này diễn giải chúng thành quy tắc triển khai. Giai đoạn này chỉ là thiết kế, chưa có source code. Ngày chốt: 07/11/2026.

Mục lục

1. Design philosophy
2. Design tokens
3. Typography
4. Color system
5. Spacing và layout
6. Component
7. Sidebar và navigation
8. Dashboard
9. Thư viện
10. Visualizer
11. Responsive
12. Interaction states
13. Accessibility
14. Artboards và màn hình
15. Giữ nguyên
16. Thay đổi so với trước
17. Bất biến khi triển khai

## 01 · Design philosophy

AlgoVision là "phòng thí nghiệm thuật toán": giao diện tối, tĩnh, tập trung như một công cụ lập trình nhưng có nhịp điệu của không gian học tập.

- **Vùng mô phỏng là trung tâm.** Panel phụ nằm ở rìa, thu gọn được, không panel nào chiếm quá một phần ba chiều rộng workspace.
- **Dark Modern.** Nền gần đen sắc lạnh. Tím/Violet cho hành động và trạng thái đang chọn, xanh dương cho thông tin phụ. Không glow, không glassmorphism.
- **Sidebar First.** Sidebar là điều hướng duy nhất. Header chỉ có breadcrumb, tìm kiếm và tài khoản. Mobile dùng drawer có overlay.
- **Trạng thái không chỉ bằng màu.** Luôn có ký hiệu hoặc nhãn chữ: ▣ so sánh, ◆ hoán đổi, ✓ đã vào vị trí, ▶ dòng đang chạy; độ khó có ● ◐ ○.
- **Dữ liệu trung thực.** Chưa có dữ liệu thì dùng trạng thái rỗng hoặc placeholder gắn nhãn "Dữ liệu mẫu". Không hiển thị số giả.
- **Chỉ nội dung học thuật.** Sản phẩm không theo dõi tiến độ cá nhân (xem mục 16).

## 02 · Design tokens

Tên CSS custom property đề xuất, đã khớp với artboard 2i. Giá trị là hex đang dùng trong thiết kế.

| TOKEN | GIÁ TRỊ | DÙNG CHO |
|---|---|---|
| `--av-bg` | #0B0B12 | Nền ứng dụng, khung app |
| `--av-sidebar` | #0E0E16 | Nền sidebar, drawer, thanh điều khiển cố định mobile |
| `--av-surface-1` | #12121C | Card, panel, input, header search |
| `--av-surface-2` | #1A1A28 | Hover, tooltip nền phụ |
| `--av-surface-3` | #1E1E2C | Track thanh trượt, skeleton, nút vô hiệu, avatar, chip trung tính |
| `--av-border` | #272738 | Viền card, đường kẻ chính |
| `--av-border-strong` | #2E2E44 | Viền nút viền, select, input |
| `--av-border-dashed` | #3A3A52 | Viền nét đứt (trạng thái rỗng), viền cột chưa xét |
| `--av-text` | #ECECF4 | Chữ chính |
| `--av-text-muted` | #A1A1B5 | Mô tả, nhãn (tỷ lệ tương phản 7:1 trên nền) |
| `--av-text-subtle` | #8A8AA0 | Nhãn phụ cỡ 11–12px, phân loại, tiêu đề cột |
| `--av-primary` | #7C3AED | Nút chính, logo, phần tử hành động |
| `--av-primary-hover` | #6D28D9 | Hover nút chính |
| `--av-primary-text` | #A78BFA | Chữ nhấn, liên kết, tab đang chọn (gạch chân) |
| `--av-primary-line` | #8B5CF6 | Viền hover card, thanh tiến trình bước, chip đang chọn; nền mềm `rgba(139,92,246,.18)` (nav) và .22 (chip, tab) |
| `--av-accent` | #3B82F6 | Xanh dương: nút phụ, thanh độ phức tạp, hoán đổi; chữ `--av-accent-text` #93C5FD (#60A5FA cho icon nhỏ) |
| `--av-success` | #34D399 | Dễ, hoàn tất; chữ #6EE7B7, nền `rgba(52,211,153,.15)`, cột "đã vào vị trí" #1F6F5A |
| `--av-warning` | #FBBF24 | Trung bình; chữ #FCD34D, nền `rgba(251,191,36,.15)` |
| `--av-danger` | #F87171 | Khó, lỗi; chữ #FCA5A5, nền lỗi `rgba(248,113,113,.08)`, nút xóa #B91C1C |
| `--av-focus` | #C4B5FD | Vòng focus (cũng dùng cho chữ "so sánh") |

Nền canvas thiết kế #07070C chỉ là nền bảng vẽ, không thuộc ứng dụng. Màu chữ nav đang chọn #DDD6FE. Chữ vô hiệu #55556A (nav) và #6B6B80 (nút, giá trị trống).

## 03 · Typography system

Hai họ chữ: Be Vietnam Pro (400/500/600/700) cho giao diện; JetBrains Mono (400/500/600) cho mã, số liệu, độ phức tạp, nhãn kỹ thuật. Hỗ trợ đầy đủ dấu tiếng Việt.

| VAI TRÒ | CỠ / ĐẬM | LINE-HEIGHT | DÙNG Ở |
|---|---|---|---|
| Display | 40 / 700 | 1.15 | Chỉ trang khái niệm (1a) |
| Hero | 34 / 700 (tablet 28, mobile 24) | 1.2–1.25, tracking −0.02em | Tiêu đề hero Dashboard |
| Page title | 28 / 700 (tablet/mobile 24) | 1.2 | Tiêu đề trang Thư viện |
| H2 | 24 / 600 | 1.25 | Tên thuật toán ở Visualizer |
| H3 | 18 / 600 | 1.25 | Tiêu đề khối phụ |
| Card / section title | 16–17 / 600 (mobile 15) | 1.3 | Tên card, tiêu đề khối Dashboard |
| Body | 15 / 400 | 1.6–1.65 | Đoạn mô tả, giải thích bước |
| Body nhỏ | 13.5–14 / 400 | 1.5–1.55 | Mô tả trong card, nav |
| Caption | 13 / 500 | 1.5 | Nhãn, chip, tab phụ |
| Label nhỏ | 11–12 / 600 | 1.2–1.4 | Badge, tiêu đề cột; nhóm sidebar 11px, in hoa, tracking .1em |
| Code | 14 / 500 (mono) | — | Pseudocode, ô nhập dữ liệu, giá trị độ phức tạp |

## 04 · Color system

- Primary tím #7C3AED/#A78BFA/#8B5CF6: mọi hành động chính và trạng thái đang chọn.
- Secondary là nền trung tính (surface 1–3) và nút viền #2E2E44. Không dùng thêm màu thương hiệu thứ hai.
- Accent xanh dương #3B82F6: thông tin phụ, độ phức tạp, hoán đổi, liên kết nhanh nhóm Giải thuật.
- Trạng thái: success/warning/danger chỉ dùng cho độ khó (Dễ/Trung bình/Khó), kết quả đúng và lỗi. Mọi trạng thái đi kèm ký hiệu hoặc chữ.

Chế độ: chỉ có chế độ tối. Không thiết kế chế độ sáng.

Màu phân biệt nhau bằng cả độ sáng, ưu tiên cặp tím/xanh dương, tránh phụ thuộc đỏ/xanh lá.

Trạng thái cột trong Visualizer

| TRẠNG THÁI | NỀN CỘT | VIỀN | KÝ HIỆU |
|---|---|---|---|
| Chưa xét | #3A3A52 | không | ■ |
| So sánh | #8B5CF6 | 2px solid #C4B5FD | ▣ |
| Hoán đổi | #3B82F6 | 2px dashed #93C5FD | ◆ |
| Đã vào vị trí | #1F6F5A | không | ✓ (chữ #6EE7B7) |

## 05 · Spacing và layout system

| MỤC | GIÁ TRỊ |
|---|---|
| Spacing scale (4px) | 4, 8, 12, 16, 24, 32, 48, 64 (`--av-space-1…8`) |
| Border radius | 6 chip · 10 nút/input/select/nav item · 12 khối lồng trong card · 14 card mobile · 16 card · 20 modal, hero, bottom sheet · 28 khung thiết bị mobile · 999 pill, avatar |
| Elevation | 0 nền #0B0B12 · 1 card #12121C + viền · 2 hover #1A1A28 · 3 modal/drawer/sheet (có bóng) |
| Shadow | card `0 1px 2px rgba(0,0,0,.4)` · modal `0 24px 48px rgba(0,0,0,.5)` · drawer `0 24px 48px rgba(0,0,0,.6)` · sheet dưới `0 -24px 48px rgba(0,0,0,.5)` · thanh điều khiển cố định `0 -12px 24px rgba(0,0,0,.4)` |
| App shell | CSS grid: cột 1 sidebar (264 mở / 72 thu gọn), cột 2 main. Mobile không có cột sidebar (drawer 300px). |
| Header | Cao 72px (mobile 64px, Visualizer mobile 60px), padding ngang 32px, viền dưới #1E1E2C |
| Padding nội dung | 32px desktop · 24px tablet và Visualizer desktop · 16px mobile |
| Khoảng cách khối | 28px giữa các khối Dashboard desktop · 24px tablet · 20px mobile · 16px lưới thư viện desktop, 14px tablet |
| Vùng chạm | Tối thiểu 44px chiều cao cho mọi nút, link, input. Nút Play 56px (mobile 60px). Nút điều khiển 48px. |

## 06 · Component specifications

| COMPONENT | ĐẶC TẢ |
|---|---|
| Button chính | Cao ≥44, padding ngang 20–22, radius 10, nền #7C3AED chữ trắng 600/14; hover #6D28D9. |
| Button phụ | Viền 1px #3B82F6, nền trong suốt, chữ #93C5FD; hover nền `rgba(59,130,246,.12)`. |
| Button viền | Viền #2E2E44, chữ #ECECF4; hover nền #1A1A28. |
| Button ghost | Không viền, chữ #A1A1B5; hover nền #1A1A28 chữ #ECECF4. |
| Button vô hiệu / xóa | Vô hiệu: nền #1E1E2C chữ #6B6B80. Xóa: nền #B91C1C chữ trắng. |
| Input / select | Cao ≥44, radius 10, nền #12121C (hoặc #0B0B12 trong panel), viền #2E2E44; focus: outline 2px #A78BFA và viền #A78BFA; lỗi: viền #F87171 và thông báo chữ #FCA5A5 bắt đầu bằng "Lỗi:". Dữ liệu số dùng JetBrains Mono. |
| Search | Cao 44, rộng 340 (tablet 200–220), nền #12121C, icon kính lúp, placeholder "Tìm thuật toán, cấu trúc dữ liệu…", gợi ý phím `Ctrl K`. |
| Badge độ khó | Pill, 12/600, padding 4×10, ký hiệu mono + chữ: ● Dễ, ◐ Trung bình, ○ Khó. Badge độ phức tạp: ∑ + O(...) nền xanh dương mềm. |
| Chip bộ lọc | Pill cao 44, 13/600. Đang chọn: viền #8B5CF6, nền `rgba(139,92,246,.22)`, tiền tố "✓ ". |
| Tab | Cao 44–48, 14/600, gạch chân 2px #A78BFA khi chọn, `role="tablist"/"tab"`, `aria-selected`. |
| Card | Nền #12121C, viền #272738, radius 16, padding 20–22 (mobile 16). Card liên kết hover: viền #8B5CF6. |
| Modal | Rộng nội dung, nền #12121C, viền #2E2E44, radius 16–20, bóng modal. Hai nút: Hủy (viền) và hành động chính (tím). Chỉ có mẫu "Đặt lại mô phỏng?". |
| Dropdown | Dùng `<select>` chuẩn có style (độ khó, độ phức tạp, thuật toán). Chưa có menu tùy biến nhiều tầng. |
| Tooltip | Nền #ECECF4, chữ #0B0B12, 12/600, radius 8, padding 6×10. Hiện khi hover hoặc focus (sidebar thu gọn, nút điều khiển). |
| Trạng thái rỗng / đang tải / lỗi | Rỗng: nền #12121C, viền nét đứt #3A3A52, tiêu đề + gợi ý + nút xóa lọc. Đang tải: skeleton #1E1E2C, av-pulse 1.6s. Lỗi: nền đỏ mềm, viền #F87171, nút "Thử lại". |

## 07 · Sidebar và navigation specifications

Mục điều hướng (cuối cùng, theo thứ tự)

1. Dashboard (icon ngôi nhà), không con.
2. Cấu trúc dữ liệu (icon khối xếp lớp), con: Mảng, Danh sách liên kết, Ngăn xếp và hàng đợi, Cây, Đồ thị.
3. Giải thuật (icon ngoặc mã), con: Sắp xếp, Tìm kiếm, Đệ quy.
4. Trực quan hóa (icon biểu đồ cột), không con.

Một nhóm nhãn "Học tập" (11px, in hoa) ở đầu danh sách. Không còn mục Tiến độ học tập.

- **Mở (264px):** padding 20×16, khoảng cách 20. Logo 32px (nền tím, radius 9) + chữ "AlgoVision" 18/700 (phần "Vision" màu #A78BFA). Mục nav cao ≥44, radius 10, icon 20, chữ 14. Mục con thụt vào 31px, đường dẫn dọc #272738, cao ≥44, 13.5px. Chevron xoay 180° khi mở; chỉ mục đang chọn có con mới mở. Nút "Thu gọn" ở đáy, viền #272738.
- **Thu gọn (72px):** chỉ icon 48×48 trong khung, mỗi icon có `aria-label` và tooltip. Nút mở rộng ở đáy. Trạng thái thu gọn được ghi nhớ giữa các phiên.
- **Mobile drawer:** mở từ trái, rộng 300, nền #0E0E16, overlay `rgba(5,5,10,.72)`, mục cao 48 chữ 15. Đóng bằng nút X, phím Esc hoặc chạm overlay. Nút mở là biểu tượng ba gạch cao 44 ở header.
- **Header:** breadcrumb "AlgoVision / mục cha / trang hiện tại", search, chip tài khoản (avatar "?" + "[Tên người học]"). Header không chứa điều hướng chính.
- **Nav item:** trạng thái mặc định, hover, focus, đang chọn, vô hiệu (xem mục 12). Đang chọn có `aria-current="page"` và không chỉ dựa vào màu.

## 08 · Dashboard specifications

Thứ tự thành phần

- **Hero:** lời chào "Xin chào, [Tên người học]" (mono 13px, tím), tiêu đề "Nhìn thấy thuật toán chạy từng bước.", mô tả, hai nút: "Mở trực quan hóa" (chính) và "Xem thư viện" (viền). Bên phải: bảng minh họa Bubble Sort "bước 3/10" nhãn "Minh họa" kèm chú giải ■ ▣ ◆.
- **Nội dung nổi bật:** 3 card (Bubble Sort, Binary Search, Duyệt đồ thị BFS) gồm badge độ khó, phân loại, tên, mô tả, thời gian và bộ nhớ; liên kết "Xem thư viện".
- **Truy cập nhanh:** một card rộng hết hàng, gồm nhóm Cấu trúc dữ liệu và nhóm Giải thuật (chip liên kết cao 44, hover viền tím và xanh dương tương ứng).

Dashboard chỉ có ba khối trên. Không có khối Lộ trình, thống kê, lịch sử hay "Tiếp tục học tập".

| BREAKPOINT | BỐ CỤC |
|---|---|
| Desktop 1440 (1c) | Sidebar 264. Main padding 32, khoảng cách 28. Hero 2 cột (1.15 : 1, gap 32, padding 32, radius 20). Nổi bật 3 cột gap 20. Truy cập nhanh: card padding 22, hai nhóm đặt cạnh nhau (2 cột, gap 32). |
| Tablet 820 (1f) | Sidebar thu gọn 72, search 200. Padding 24, khoảng cách 24. Hero 1 cột (chữ trên, minh họa dưới). Nổi bật 3 cột gap 14. Truy cập nhanh: một card rộng hết hàng, padding 18, hai nhóm xếp dọc, chip tự xuống dòng. |
| Mobile 390 (1d) | Header 64 (menu, logo, tìm kiếm). 1 cột, padding 20×16: hero thu gọn (nút cao 48, không có minh họa) → Nội dung nổi bật (card dọc, chỉ badge, thời gian, tên) → Truy cập nhanh (chip cuộn ngang, chỉ nhóm Cấu trúc dữ liệu). |

Tương tác: mọi card và chip là liên kết; hover/focus theo mục 12. Nút "Mở trực quan hóa" đưa tới Visualizer; "Xem thư viện" đưa tới Thư viện.

## 09 · Algorithm Library specifications

Thư viện có hai tab: Cấu trúc dữ liệu và Giải thuật. Mỗi card chỉ hiển thị thông tin học thuật.

Thành phần card

1. Hàng đầu: badge độ khó (ký hiệu + chữ) bên trái, phân loại (#8A8AA0) bên phải.
2. Tên (17/600), mô tả (13.5, line-height 1.55).
3. Vùng dưới (viền trên #1E1E2C): nhãn độ phức tạp thời gian + giá trị O(...) mono; Bộ nhớ + giá trị O(...); thanh 5 đoạn tốc độ tăng độ phức tạp (trang trí, `aria-hidden`, luôn đi kèm ký hiệu O).
4. Liên kết "Trực quan hóa →" (tím, căn phải).

Không có trên card: nhãn Đã học/Chưa học, số lần truy cập, thanh tiến trình, bất kỳ chỉ báo học cá nhân nào. "Bộ nhớ" ở đây là độ phức tạp không gian của thuật toán, được giữ lại.

| BREAKPOINT | BỐ CỤC |
|---|---|
| Desktop (2a) | Tiêu đề trang "Thư viện" + tab. Thanh lọc: ô tìm, select Độ khó, select Độ phức tạp. Hàng chip phân loại (Tất cả, Tuyến tính, Cây, Đồ thị, Bảng băm) + "Hiển thị 8 mục". Lưới 4 cột gap 16. Ghi chú giải thích thanh 5 đoạn. |
| Tablet (2b) | Sidebar thu gọn. Tab bên phải tiêu đề. Ô tìm + nút "Bộ lọc". Chip phân loại. Lưới 2 cột gap 14; card gọn (thời gian trái, bộ nhớ phải). |
| Mobile (2c) | Header có menu + "Thư viện". Tab chia đôi. Ô tìm + nút "Lọc". Chip cuộn ngang. Danh sách 1 cột. "Lọc" mở bottom sheet (Độ khó, Độ phức tạp thời gian, nút Xóa bộ lọc/Áp dụng). Có trạng thái rỗng, đang tải, lỗi. |

## 10 · Visualizer specifications

Thiết kế mẫu cho Bubble Sort. Vùng mô phỏng luôn là phần lớn nhất; sidebar mặc định thu gọn.

- **Thứ tự (desktop 2d):** thanh nhập liệu (select Thuật toán, ô dữ liệu "số nguyên 1–99, tối đa 12 phần tử", nút Áp dụng, chip Mẫu dữ liệu: Ngẫu nhiên, Gần sắp xếp, Đảo ngược, Có phần tử trùng) → khung mô phỏng (tiêu đề + "Lượt n, j = k", chú giải, nút "Ẩn panel →", các cột cao 320) → thanh điều khiển → 4 ô thống kê (số phép so sánh, số lần hoán đổi, lượt hiện tại, đã vào vị trí).
- **Điều khiển:** Đặt lại (R), Bước lùi (←), Phát/Dừng (Space, 56px), Bước tiến (→); thanh trượt bước (`role="slider"`, nhãn "Bước x/y"); tốc độ 0,5× · 1× · 2× · 4× (`role="radiogroup"`).
- **Panel phải (380px desktop):** 3 accordion luôn thu gọn được: Giải thích bước hiện tại, Pseudocode (dòng đang chạy tô nền `rgba(139,92,246,.20)` + ▶), Độ phức tạp (tốt nhất/trung bình/xấu nhất/bộ nhớ).
- **Tablet (2e):** panel chuyển thành tab dưới vùng mô phỏng (Giải thích, Pseudocode, Độ phức tạp); điều khiển nén một hàng; ô dữ liệu rút gọn với nút "Mẫu ▾".
- **Mobile (2f):** thanh điều khiển cố định đáy (thanh trượt, Đặt lại, lùi, Phát 60px, tiến, tốc độ), dữ liệu thu thành một hàng bấm mở rộng, panel là 3 tab.
- Hoán đổi cột 200ms ease; tắt hoàn toàn khi `prefers-reduced-motion: reduce`.

"Tiến trình/Bước x/y" ở đây là bước của thuật toán đang mô phỏng, không phải tiến độ học.

## 11 · Responsive specifications

| TÊN | KHOẢNG | QUY TẮC | ARTBOARD |
|---|---|---|---|
| Mobile | 360–767 | Sidebar là drawer 300px. Một cột. Thanh điều khiển Visualizer cố định đáy. | 390px: 1d, 2c, 2f |
| Tablet | 768–1023 | Sidebar thu gọn 72px. Thư viện 2 cột. Panel Visualizer thành tab dưới vùng mô phỏng. | 820px: 1f, 2b, 2e |
| Laptop | 1024–1279 | Sidebar thu gọn 72px. Visualizer 2 cột, panel phải 340px, thư viện 3 cột. | Chưa có artboard |
| Desktop | ≥ 1280 | Sidebar 264px (Dashboard, Thư viện) hoặc 72px (Visualizer). Panel phải 380px, thư viện 4 cột. | 1440px: 1c, 2a, 2d |

Giá trị Laptop được suy ra từ quy tắc, chưa kiểm chứng bằng artboard (xem mục 14).

## 12 · Interaction states

| PHẦN TỬ | DEFAULT | HOVER | FOCUS | ACTIVE / CHỌN | DISABLED |
|---|---|---|---|---|---|
| Nav item | Trong suốt, chữ #A1A1B5, 500 | Nền #1A1A28, chữ #ECECF4 | Outline 2px #C4B5FD, offset 2px | Nền `rgba(139,92,246,.18)`, chữ #DDD6FE, 600, `aria-current="page"` | Chữ #55556A |
| Nút chính | #7C3AED | #6D28D9 | Outline #C4B5FD | — | #1E1E2C / #6B6B80 |
| Nút viền / ghost | Viền #2E2E44 / không viền | Nền #1A1A28 | Outline #C4B5FD | — | #1E1E2C |
| Card liên kết | Viền #272738 | Viền #8B5CF6 (xanh dương #3B82F6 cho chip Giải thuật) | Outline #C4B5FD | — | — |
| Chip / tab | Viền #2E2E44, chữ #A1A1B5 | Chữ #ECECF4 | Outline #C4B5FD (tab: offset −2px) | Viền #8B5CF6 + nền mềm + "✓"; tab: gạch chân #A78BFA | — |
| Input / select | Viền #2E2E44 | — | Outline #A78BFA + viền #A78BFA | — | — |

Quy tắc chung: vòng focus `outline: 2px solid var(--av-focus); outline-offset: 2px` trên mọi phần tử tương tác. Phím tắt: Space phát/dừng, ← → lùi/tiến một bước, R đặt lại, Ctrl K tìm kiếm, Esc đóng drawer và modal.

## 13 · Accessibility requirements

- Tương phản chữ ≥ 4.5:1 (chữ phụ #A1A1B5 đạt khoảng 7:1; chữ cỡ 11–12px dùng #8A8AA0 trở lên).
- Vùng chạm ≥ 44px trên mọi thiết bị.
- Dùng phần tử ngữ nghĩa: `<button>`, `<a href>`, `<label>` + `<input>`; không gán click lên `div` / `span`.
- Landmark và vai trò: `nav aria-label="Điều hướng chính"`, breadcrumb `nav aria-label="Breadcrumb"`, `role="tablist"/"tab"`, `role="slider"` cho thanh bước, `role="radiogroup"` cho tốc độ, `role="dialog"` cho drawer và bottom sheet, `aria-expanded` cho accordion.
- Nút chỉ có icon phải có `aria-label`; SVG trang trí `aria-hidden="true"`.
- Trạng thái không chỉ bằng màu: luôn kèm ký hiệu/chữ. Phân biệt màu bằng độ sáng.
- Focus nhìn thấy được, thứ tự Tab theo thứ tự đọc; drawer và modal giữ focus, Esc để đóng, trả focus về nút mở.
- Tôn trọng `prefers-reduced-motion`: tắt mọi animation và chuyển trạng thái tức thì.
- `lang="vi"` trên tài liệu. Lỗi nhập liệu bắt đầu bằng "Lỗi:" và gắn với ô nhập.

## 14 · Artboards và màn hình

Trang "AlgoVision Design" có hai khu. Toàn bộ artboard dưới đây là bản cuối.

| ID | MÀN HÌNH | KÍCH THƯỚC | GHI CHÚ |
|---|---|---|---|
| 1a | Concept tổng thể | 640 | Nguyên tắc thiết kế |
| 1b | Design System | 1120 | Màu, typography, spacing, radius, component, trạng thái rỗng/tải/lỗi |
| 1c | Dashboard Desktop | 1440 | Dùng component sidebar/header |
| 1d | Dashboard Mobile + drawer mở | 390 ×2 | |
| 1f | Dashboard Tablet | 820 | Mới bổ sung để đủ ba kích thước |
| 1e | Sidebar và trạng thái navigation | 760 | Rail 72px, tooltip, 5 trạng thái |
| 2a | Thư viện · Cấu trúc dữ liệu · Desktop | 1440 | |
| 2b | Thư viện · Giải thuật · Tablet | 820 | |
| 2c | Thư viện · Mobile (danh sách, bộ lọc, rỗng, tải, lỗi) | 390 | |
| 2d | Visualizer Desktop (sidebar thu gọn) | 1440 | Bubble Sort |
| 2e | Visualizer Tablet | 820 | |
| 2f | Visualizer Mobile | 390 | |
| 2i | Quy tắc triển khai và kiểm tra nhất quán | 1120 | Token, breakpoint, quy tắc |

Đã loại khỏi bản cuối: 2g (Tiến độ học tập Desktop) và 2h (Tiến độ học tập Tablet/Mobile). Không giữ lại bản cũ để tham chiếu vì chức năng đã bị loại bỏ hoàn toàn khỏi sản phẩm; lịch sử phiên bản của artifact vẫn lưu các bản trước.

Chưa được thiết kế hoặc chưa đủ thông tin

- Trang chi tiết cấu trúc dữ liệu: chưa có artboard. Hiện chỉ có card trong thư viện và liên kết "Trực quan hóa →".
- Trang thuật toán riêng: chưa có artboard. Phần học thuật (mô tả, pseudocode, độ phức tạp) nằm trong Visualizer; chưa quyết định có cần trang đọc riêng không.
- Visualizer cho cấu trúc dữ liệu (mảng, ngăn xếp, cây, đồ thị...) và cho các thuật toán khác: chỉ có thiết kế mẫu Bubble Sort, các cột. Chưa có canvas cho cây/đồ thị.
- Laptop 1024–1279: chưa có artboard; số liệu (panel 340, 3 cột) là quy tắc suy ra.
- Thư viện: chưa có artboard riêng cho Giải thuật bản Desktop và Cấu trúc dữ liệu bản Tablet (dùng cùng mẫu card).
- Visualizer Desktop với sidebar mở rộng (264px): chưa có artboard; quy tắc là thu gọn mặc định.
- Tìm kiếm Ctrl K: chưa có thiết kế kết quả tìm kiếm hay command palette.
- Tài khoản: chip "[Tên người học]" và avatar "?" chỉ là placeholder; chưa có thiết kế đăng nhập, hồ sơ, cài đặt.
- Dropdown tùy biến, toast, form phức tạp: chưa cần và chưa thiết kế.
- Nội dung thật: mô tả, danh sách cấu trúc dữ liệu/giải thuật và tên người học chưa phải nội dung cuối.

## 15 · Các thành phần cần giữ nguyên từ ứng dụng hiện tại

- Phong cách Dark Modern, bảng màu tím/violet + xanh dương.
- Bố cục Sidebar First (264/72px, drawer 300px mobile).
- Typography: Be Vietnam Pro + JetBrains Mono.
- Phong cách card, viền, radius, spacing, icon nét 1.8px.
- Hệ thống phân cấp thông tin và các độ khó Dễ/Trung bình/Khó.
- Mọi chức năng học và trực quan hóa thuật toán: nhập dữ liệu, mẫu dữ liệu, phát/dừng, bước tiến/lùi, tốc độ, giải thích từng bước, pseudocode, độ phức tạp.
- Thư viện: tìm kiếm, lọc theo độ khó, độ phức tạp, phân loại; thông tin thời gian và bộ nhớ.
- Responsive ba kích thước, trạng thái rỗng/đang tải/lỗi.

## 16 · Những thay đổi so với thiết kế trước

| KHU VỰC | THAY ĐỔI |
|---|---|
| Sidebar / drawer / rail | Xóa mục "Tiến độ học tập" và icon. |
| Artboard | Xóa 2g, 2h. Thêm 1f Dashboard Tablet. |
| Dashboard | Xóa thẻ thống kê tiến độ, thẻ "Tiếp tục học tập" và toàn bộ khối "Lộ trình học tập đề xuất" 5 chặng (Desktop 1c, Tablet 1f, Mobile 1d); không thay bằng dữ liệu giả hay thống kê. Bố cục cuối: Hero → Nội dung nổi bật → Truy cập nhanh, thứ tự này giống nhau ở cả ba kích thước. Sidebar và header của 1c dùng component chung. |
| Thư viện | Xóa nhãn "Chưa học/Đã học" trên card, bộ lọc "Trạng thái học" (desktop và bottom sheet), ghi chú về nhãn học. Link "Trực quan hóa →" căn phải. |
| Design system | Xóa badge Đã học/Chưa học, ký hiệu "○ chưa học/chưa bắt đầu". Bổ sung token (surface-3, text-subtle, border-dashed, primary-hover, primary-line, accent-text) và bậc typography Hero 34 và Page 28. |
| Tài liệu | Thêm trang "AlgoVision Spec" (tài liệu này) và banner "Bản chốt v1.0 · đã điều chỉnh". |

## 17 · Yêu cầu không được phép thay đổi khi triển khai

- Không thêm lại bất kỳ chức năng, màn hình, mục điều hướng hay nhãn liên quan đến Tiến độ học tập, lịch sử học và truy cập cá nhân, thống kê học tập, số lần truy cập, thanh tiến trình học cá nhân.
- Không có khối "Lộ trình học tập đề xuất" 5 chặng ở bất kỳ màn hình nào; chưa triển khai và không thay bằng nội dung khác.
- Giữ Dark Modern, chỉ chế độ tối; giữ accent tím/violet (#7C3AED, #A78BFA, #8B5CF6) và xanh dương (#3B82F6) như định nghĩa.
- Sidebar là điều hướng duy nhất; mobile bắt buộc dùng drawer; không đưa điều hướng chính lên header.
- Vùng mô phỏng luôn là trung tâm và chiếm phần lớn diện tích Visualizer.
- Typography, spacing scale 4px, radius và bóng như mục 2–5; không tự thêm giá trị ngoài thang.
- Vùng chạm ≥44px, vòng focus 2px #C4B5FD, trạng thái luôn có ký hiệu/chữ, tôn trọng reduced motion.
- Giữ metadata học thuật trên card: độ khó, phân loại, độ phức tạp thời gian, bộ nhớ.
- Không hiển thị số liệu giả; dùng trạng thái rỗng hoặc nhãn "Dữ liệu mẫu".
- Không thêm màn hình hay chức năng ngoài danh sách ở mục 14 khi chưa có thiết kế được duyệt.
