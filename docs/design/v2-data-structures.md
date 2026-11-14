# UI v2-3b — Data Structures Light Minimal

Base `6ec0d593593be18bb94a543b182e632f747f98da`, branch `feat/ui-v2-3b`, kế thừa [Foundation](v2-foundation.md). Sorting/Searching v2-3a đã MERGED PR #56. Spec/decisions v1 giữ làm lịch sử; quyết định 28–30 về seek, tốc độ và accordion tiếp tục có hiệu lực.

## Phạm vi trình bày

- BST/Hash Table/Graph: toolbar wrap, input/select có min-width 0 và max-width 100%; giữ chiều cao control >=44px và viền `--border-control`.
- Ba màn giữ workspace theo luồng block một cột. Wrapper trực tiếp trong accordion bỏ viền/padding/nền lồng; giữ khung accordion, pre và các thẻ nội dung. Kiến thức một cột; đoạn văn trong visualizer 14px, line-height 1,8, không giới hạn 430px cũ.
- Slider min-width 0; stat min-width 0 và overflow-wrap anywhere. Hover tốc độ chỉ áp khi chưa chọn và không disabled; summary hover dùng surface sáng. Giữ native controls, focus, disabled, ba details mở mặc định và live region ở ngoài.
- Array/Stack/Queue/Linked List: gom panel và heading có khai báo chung; heading flex wrap; input operation card co được. Mô tả dùng rule chung Array/card tăng 13→14px; override riêng của Stack và typography khác được giữ. Giữ lưới thao tác, breakpoint, dữ liệu và thông báo hiện có.
- Gom style chung của frame BST/Hash/Graph; vẫn cuộn trong khung, giữ max-height Hash 440px và SVG Graph co theo khung. Không sửa cue SVG, nét đứt/vòng kép, hatch, dấu ✓, bảng DFS hoặc vùng cuộn BFS/DFS.
- Không sửa JS runtime/template, thuật toán, controller, generator, snapshot, ID, seek, scheduler, navigation, Big-O hoặc nội dung học thuật. Không dependency mới, tracking hoặc dữ liệu giả. Adaptive hai cột thuộc v2-3c.

## Tương đương của phần gom/gỡ CSS

- Gỡ background/border-color lặp ở Array panel/card; Stack card kế thừa display/flex-direction/align-items/min-width; Queue/Linked List card kế thừa min-width 0 từ `.array-operation-card`.
- Ba `pre` của BST/Hash/Graph đều nằm trong `.learning-block`; bỏ rule overflow-x lặp của `.bst-code-panel pre`, giữ rule gốc và nhãn/focus vùng cuộn.
- Panel chung dùng `--panel-bg`/`--border`, có cùng chuỗi giá trị token hiện hành với nền/viền cũ; giữ một nơi dùng alias `--panel-bg` thực sự có hiệu lực. Selector dùng class có cùng specificity; giữ nguyên ngoại lệ margin, media query, overflow và chiều cao. Đặt `.hash-table-frame` cuối nhóm selector chung để test layout hiện hữu đọc được padding/border; thứ tự selector trong cùng nhóm không đổi cascade.
- Trước khi thêm thay đổi trình bày, đối chiếu CSS HEAD và CSS chỉ gom/gỡ trên template thật: 28 phần tử × 17 thuộc tính × 6 viewport (360/640/700/760/768/1280) = 2856 computed-style comparisons KHỚP bằng happy-dom. Đây không phải bằng chứng browser layout hoặc equivalence cho mọi trạng thái động.
- Artifact sau gom/gỡ: CSS 57574 B, gzip 10505 B (giảm 826/42 B từ 58400/10547 B). Byte cuối sau trình bày ghi tại [baseline](../development-baseline.md); không suy giảm bundle từ độ dài source.

## Kiểm chứng

- `tests/v2-data-structures.test.js`: 7 test mới, lần RED 6 fail/1 pass trên CSS cũ; GREEN 7/7 sau CSS. Kiểm scope, toolbar, slider/stat, chữ, card, responsive rules, cue/scroll, contrast chữ >=4,5:1 và control/focus >=3:1. DOM dùng template/CSS thật; computed style kiểm một cột, wrapper và chữ tại 360/760/1280px. CSS/happy-dom không có phép đo reflow browser.
- Nhóm regression CSS/Foundation/accordion/contrast liên quan 80/80 PASS trước bổ sung assert computed style; toàn bộ suite cuối gồm các assert bổ sung được ghi ở baseline. Giữ nguyên test cũ, controller/seek/scheduler/live announcements/heading/scroll và các bộ test thuật toán.
- Mutation nguồn CSS: min-width slider 0→240px; wrapper border 0→1px; border control→border trang trí. Mỗi phép có đối chứng GREEN, mutant exit 1/RED đúng assert; heap 512 MB, timeout 15 s/test, không tràn heap. Restore/verify nguyên byte sau từng phép; SHA-256 CSS tại lần mutation `c7158ca9a3ba30ffc1f58dc83c0ddba938b42bdd14076e05a85b69212f124a60`.
- Lần full suite trước FAIL 1760/1762 do bỏ nơi dùng `--panel-bg` và test layout Hash không đọc được padding/border từ nhóm selector. Đã sửa đúng hai điểm CSS theo phê duyệt, không sửa test. Hai regression **2/2 PASS** (0,095 s); nhóm liên quan gồm 7 test mới **80/80 PASS** (4,019 s); full suite mới **1762/1762 PASS**, 0 fail/skip/todo/cancelled, 47,274 s. Build PASS: JS/CSS raw 152734/58480 B, gzip Node zlib mặc định 44546/10584 B; dư 1266/20 B dưới trần.
- Đối chiếu trước/sau hai sửa: 164 phần tử của bảy module × 25 thuộc tính × 8 viewport (360/640/700/760/768/900/1280/1440) × 2 trạng thái thường/disabled = **65600 computed-style comparisons KHỚP**. Không thay browser QA hoặc chứng minh mọi trạng thái động. CSS cuối SHA-256 `198f5de35cbef85687250e40830b6b76d8b3f567df2cacb95116f1ca420a1a65`; kiểm bỏ riêng hai sửa trong bộ nhớ khớp nguyên byte SHA sau mutation. Không chạy mutation mới trong lượt sửa hai regression; test mới giữ nguyên byte, không còn mutation tạm.

## Browser QA và nghiệm thu còn lại

**NOT VERIFIED**: Vite local `http://127.0.0.1:5199/` khởi chạy, browser tích hợp trả `net::ERR_CONNECTION_TIMED_OUT`. Đã dừng dev server của phiên; không điều khiển Chrome cá nhân. CI, Vercel smoke, zoom thật 200%, browser khác, thiết bị thật và screen reader chưa xác minh.

Checklist trên SHA kèm diff chưa commit; ghi browser/version, viewport, case và artifact:

- Bảy màn ở 360, 700/701, 767/768, 900/901, 1100, 1279/1280, 1440 CSS px; thêm biên 480/640/760 của nội dung hiện hữu và viewport thấp. Không tràn trang; frame rộng cuộn trong khung; không cắt chữ tiếng Việt, cue hoặc focus.
- BST mẫu/cây suy biến 15 nút, xóa hai con/successor; Hash chaining va chạm 15 khóa, probing đầy/tombstone; Graph hai biểu diễn, có/vô hướng, BFS hàng đợi, DFS ngăn xếp và bảng mốc; bốn module cũ với rỗng, đầy/giới hạn, dữ liệu dài và lỗi nhập.
- Tab/Shift+Tab, input/select, slider Home/End/mũi tên/thả kéo, tốc độ radio, accordion đóng/mở, focus 2px, hover/disabled, touch target >=44px, live announcements, drawer/rail và reduced motion. Chữ >=4,5:1; control/focus/cue >=3:1 trên nền thực.

P0: giữ bất biến dữ liệu bước và nội dung học thuật. P1: cascade chung, cue/focus/overflow và ngân sách CSS sát trần cần regression. P2: reflow/font, bảng rộng, zoom/đa trình duyệt/thiết bị/screen reader còn chờ evidence. Chưa đóng exit gate UI v2-3 bằng test/build.
