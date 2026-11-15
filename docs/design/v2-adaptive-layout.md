# UI v2-3c — Adaptive Two-column Layout

## Kết quả mới nhất — sửa P1 Library, 2026-11-15

**PASS gate test/build/bundle; P1 Library đã sửa. Diff chưa commit, chờ nghiệm thu.** Lượt này chỉ di chuyển h2 Giải thuật ra ngay trước algorithm-panel; CSS/navigation giữ nguyên byte. Panel trở lại đúng ba section trực tiếp; logic hidden dùng trạng thái hiện có, không thêm state.

- TDD regression vị trí RED trước sửa, GREEN sau sửa; test mới khóa sibling/parent, đúng ba section và hidden khi chuyển Dashboard/Sorting/Searching/Structures, mở chi tiết/Quay lại từ Giải thuật. Library/accessibility/navigation **13/13 PASS**, 0 fail/skip/todo, 1,454 s; nhóm UI **347/347 PASS**, 8,995 s.
- Full pnpm test **1775/1775 PASS**, 0 fail/skipped/todo/cancelled, **37,268 s**. Giữ nguyên assertion cũ của library-panels/a11y; không giảm test. Tăng một test vị trí so với lượt trước.
- Build PASS, Vite 8.3.5 **139 ms**, tổng lệnh **450 ms**. JS raw/gzip **152843/44574 B**, CSS **58402/10707 B**, không đổi so với trước sửa vị trí h2. Gzip Node zlib mặc định. Dư **1157/98 B** dưới trần JS/CSS 154000/58500 B.
- Browser local ChatGPT in-app, window.innerWidth **1600px**, height 900px: Giải thuật có h2 trước panel, panel chỉ ba section; mở Bubble Sort ẩn h2 thư viện/giới thiệu, h2 thật Bubble Sort còn trong accessibility tree; Quay lại hiện h2 Giải thuật và title “Giải thuật - AlgoVision”. Stage/Panel không chồng lấp, không page overflow; Panel 380px, cả bốn Big-O card clientWidth/scrollWidth **166/166px**. Đã trả viewport mặc định và dừng dev server. Không gọi kết quả này là QA toàn diện.
- Hai blocker Big-O/heading trước đó tiếp tục PASS trong phạm vi đã kiểm; 110 resize case của lượt trước được giữ làm bằng chứng lịch sử, lượt này kiểm lại riêng vị trí heading/panel và Big-O tại 1600px. Browser version chính xác, exact 701/901, đa trình duyệt/thiết bị/screen reader/zoom thật/CI/preview của diff vẫn NOT VERIFIED.
- Kế thừa mutation cũ, không chạy mutation mới: SHA xác nhận CSS/navigation nguyên byte; đảo riêng phép chuyển h2 trong bộ nhớ cho template khớp nguyên byte bản sau restore mutation trước. Vùng Big-O, h2 Sorting, wrapper Stage và các điều kiện hidden/threshold đã mutation không đổi; test giữ kiểm tra hành vi cũ và thêm vị trí mới.
- SHA-256 cuối: CSS fd2d047cdec180b24e0463e07a1eac42fa436ec19f17d43690485a0ea205b1a6; template aa9c5b4da5c5046296ae169c37738775407b49b602b64afec6fb3147e2e2f2c5; navigation eb0986c7e29e7e94a31e127b86cb1f53674f69721d4040687aedd316bd4392a4. Base f14986febf78878404ee5d8e0b7e8ea75339b771 kèm diff hiện tại.
- Không phát hiện P0/P1 mới trong phạm vi kiểm. P2 còn các mục NOT VERIFIED nêu trên và CSS chỉ dư 98 B. Không commit/push/merge, không tác động worktree khác.

## Lịch sử hợp đồng và các lượt kiểm trước

Các trạng thái FAIL/blocker/chờ duyệt bên dưới được giữ để truy vết thời điểm phát hiện; kết quả hiện tại là mục mới nhất phía trên.

Base `f14986febf78878404ee5d8e0b7e8ea75339b771`, branch `feat/ui-v2-3c`. PR #57 MERGED được xác nhận từ Git local; CI hậu merge PASS theo xác nhận của chủ dự án, không phải lần kiểm CI trong phiên này. Hợp đồng kế thừa Foundation/v2-3a/v2-3b; chỉ thay phần workspace một cột bằng Grid thích ứng ở năm Visualizer có controller.

## Trình bày và bất biến

- Sorting, Searching, BST, Hash Table, Graph: thêm đúng hai div Stage và Learning Panel trong wrapper visualizer hiện hữu. Stage đứng trước Panel; Panel chứa nguyên ba details mở mặc định. Live giải thích bước vẫn nằm ngoài details, trong Stage.
- Giữ mọi ID, nội dung, thuộc tính control, thứ tự DOM/focus và controller bindings. Kiểm cây DOM sau tháo hai wrapper trong bộ nhớ khớp base; fingerprint ID/thuộc tính/thứ tự focus độc lập của từng màn giữ nguyên. Không sửa runtime JS, generator, snapshot, seek, scheduler, navigation, Big-O hoặc dữ liệu học thuật.
- Section là inline-size container, wrapper cũ thành Grid một cột mặc định. Browser không hỗ trợ container query giữ một cột. Grid gap 24px; hai vùng min-width 0; không dùng order, dense, overflow hidden hoặc clip để che lỗi.
- Container riêng Hash để không kích hoạt theo ngưỡng của bốn màn còn lại. Ngưỡng hiện tại: container 1094px/1288px, tương ứng Grid content dự kiến 1044px/1238px sau padding/viền 50px. Stage tối thiểu 680px/874px; panel minmax(340px,380px). Đây là ngưỡng ứng viên đã đo, chưa nghiệm thu cuối vì regression card bên dưới.
- Array/Stack/Queue/Linked List không thêm wrapper/Grid. Không dependency hoặc tính năng mới.

## CSS và kiểm thử

- Trước Grid, gom bảy nhóm khai báo SVG/badge trùng, giữ nguyên selector, specificity, cue và thứ tự ưu tiên trạng thái. 4770 computed-style comparisons KHỚP tại 360/700/768/1280/1440px trên template + SVG mẫu trạng thái giao nhau; 46 test liên quan PASS. Đây không thay browser QA.
- CSS baseline 58480 B/gzip 10584 B; sau gom tương đương 57816/10562 B; sau Grid artifact 58292/10677 B. JS giữ 152734/44546 B. Headroom CSS 208 B, JS 1266 B dưới trần 58500/154000 B.
- TDD `tests/v2-adaptive-layout.test.js`: RED 8/8 trước wrapper/Grid, GREEN 8/8 sau; khóa DOM, Stage/Panel, ID/focus, details/live, scope và điều kiện container. Test cũ v2-3b chỉ thay một assertion display block bằng ba assertion Grid, fallback một cột và hai vùng; không giảm số test. Nhóm liên quan 118/118 PASS, 8,454 s.
- Full suite sau mutation restore: **1770/1770 PASS**, 0 fail/skipped/todo/cancelled, 40,575 s. Build PASS trước browser QA, Vite 8.3.5, 136 ms. CSS/happy-dom không chứng minh layout browser.
- Ba mutation nguồn (heap 512 MB, timeout 15 s/test): min-width Stage 0→240px; ngưỡng Hash 1288→1094px; wrapper Stage→Panel. Mỗi đối chứng GREEN exit 0, 0,6 s/16 dòng; mutant RED đúng assert exit 1, 0,6 s, lần lượt 34/4111/43 dòng, không tràn heap. Restore/verify nguyên byte sau từng phép, snapshot đã clear.
- CSS SHA-256 `803d8471c4089773332638ca21fb0885a2bd19a93f7ac4c26bef622e683f84f9`; template `0b5d77912cc41cc4900fcd849513dbaa0349d563f177313b6fa49b63340265f2`.

## Browser QA: PARTIAL, có regression — chưa đạt gate

Browser tích hợp ChatGPT mở được local Vite trong lượt này; không kế thừa lỗi timeout của các lượt trước. Phiên bản browser chính xác NOT VERIFIED. SHA evidence là base ở đầu tài liệu kèm diff chưa commit, viewport height 900px. Đã dừng dev server sau khi phát hiện lỗi.

Đo 75 case resize ổn định = năm màn × 15 viewport/case; mỗi lần đổi viewport chụp render trước khi đọc kích thước. Dữ liệu thử: Bubble Sort mặc định, Linear Search, BST mẫu, Graph mẫu, Hash preset va chạm nặng. Không thấy page overflow hoặc Stage/Panel overlap trong 75 case đó; không suy rộng thành QA đầy đủ các thao tác.

| Màn | Viewport thực tế đã đo (CSS px) | Kết quả chuyển cột |
|---|---|---|
| Sorting/Searching/BST/Graph | 360,700,702,767,768,900,902,1100,1258,1260,1262,1279,1280,1440,1600 | 1260: Grid 1043,2px một cột; 1262: Stage 680px + gap 24px + Panel 341,6px. 1440: Stage 819,2px + Panel 380px. |
| Hash | 360,700,702,767,768,900,902,1100,1279,1280,1440,1454,1456,1600,1800 | 1454: Grid 1237,6px một cột; 1456: Stage 874px + gap 24px + Panel 341,2px. 1600: Stage 979,2px + Panel 380px. |

Viewport yêu cầu 701/901 được runtime làm tròn thành 702/902; case đúng 701/901 **NOT VERIFIED**. Không dùng số yêu cầu thay số thực đo. Hash ở màn hẹp cuộn trong frame (360px: client 282px, scroll 808px), không tràn trang trong mẫu này.

**P1 / blocker tái hiện:** Sorting, viewport 1600px, Panel 380px vẫn dùng complexity-grid bốn cột theo viewport lớn. Hai card trung bình/xấu nhất có clientWidth 76px, scrollWidth 81px (giá trị O(n²) không vừa). Full suite PASS không bắt được lỗi nội bộ card này. Dừng sửa code theo yêu cầu khi có regression; chưa chốt breakpoint hoặc nghiệm thu UI.

Đề xuất patch tiếp theo cần duyệt: cho complexity-grid trong Learning Panel hai cột theo vùng Panel, thêm regression theo chiều rộng Panel và browser kiểm lại ở panel 340–380px; giữ nội dung học thuật và trần bundle. Không đổi stage/canvas/thuật toán để chữa lỗi này.

P0: chưa phát hiện trong phạm vi đã kiểm, bất biến được giữ. P1: card overflow đang chặn nghiệm thu; cần rà tương tự panel của các màn còn lại. P2: thứ tự focus đã khóa DOM nhưng keyboard thực, slider/radio/accordion, touch, hover/disabled, drawer/rail, reduced motion, toàn bộ biến thể dữ liệu, zoom thật 200%, browser khác/thiết bị/screen reader và CI/Vercel smoke của diff này còn NOT VERIFIED. Contrast/touch regression CSS hiện hữu PASS không thay bằng chứng browser toàn diện.

## Bổ sung page-heading — quy tắc mới, chưa đạt gate accessibility

Theo yêu cầu bổ sung, giữ nguyên HTML/CSS khối giới thiệu và đủ ba nội dung. Chỉ sửa navigation.hidden trong renderTopbar, dùng currentPage/currentDetail hiện hữu, không thêm state: hiện ở thư viện Sorting/Searching/Structures; ẩn Dashboard/Giải thuật tổng hợp/mọi chi tiết; Quay lại khôi phục theo thư viện gốc. Đây là ngoại lệ navigation được chủ dự án duyệt riêng, thay cho giới hạn không sửa runtime JS của phần Grid ban đầu.

TDD: regression trong page-heading.test.js/navigation.test.js RED trước sửa navigation, GREEN **7/7**, 0 fail/skip/todo, 1,223 s. Khóa các đường Dashboard → thư viện → chi tiết → Quay lại và Giải thuật → Sorting/Searching/BFS → Quay lại, giữ title, breadcrumb aria-current, viewchange và focus hiện có. CSS/template SHA vẫn khớp nguyên byte phần Grid trước bổ sung.

**P1 / blocker mới:** hai test trong tests/a11y-headings.test.js FAIL sau khi ẩn giới thiệu: các màn chi tiết không còn h2 và xuất hiện h1 → h3. Không sửa assertion hoặc HTML để che lỗi; dừng sửa code theo chỉ dẫn người dùng. Full suite/build/bundle của diff bổ sung **NOT RUN/NOT VERIFIED** sau regression. Số 1770 PASS và bundle ghi phía trên là lượt trước thay đổi navigation, không phải trạng thái hiện tại.

Cần duyệt cách giữ heading ngữ nghĩa cho mỗi màn chi tiết và thư viện Giải thuật, đồng thời vẫn ẩn .page-heading. Hướng đề xuất: h2 riêng theo màn thay cho vai trò h2 của giới thiệu; giữ nguyên nội dung giới thiệu, không giảm tiêu chí heading. Cần thống nhất DOM/CSS/ARIA phù hợp trước khi sửa template hoặc thêm code. P1 card Big-O của layout vẫn chưa xử lý; browser QA sau bổ sung heading NOT VERIFIED.

## Xử lý hai blocker được duyệt — 2026-11-15

**Kết quả hiện tại: hai blocker mục tiêu PASS trong nhóm kiểm và browser; full gate vẫn FAIL do regression cấu trúc Library mới.** Các mục blocker trước đó là lịch sử của các lượt dừng, không phải kết quả mới.

- Big-O: selector thật là .visualizer-panel .complexity-grid, bốn .complexity-card. Dùng auto-fit/minmax với minimum min(100%,148px); ở Panel 340–380px có hai cột, ở màn hẹp hơn tự về một cột. Chỉ scope Learning Panel, không đổi simulation-stats của Stage. Test dùng template/CSS áp thật ở width 283/340/380, kiểm min-width và không cắt overflow; browser đo kích thước thật để bổ sung bằng chứng render.
- Heading: nâng tiêu đề thật h3→h2 ở chín chi tiết, giữ ID/nội dung và 54 computed properties về font/margin/color khớp trước–sau. Thêm h3.visually-hidden “Mô phỏng” để nhóm h4 không nhảy cấp. Không lặp lại tên màn dưới h3. Thư viện Giải thuật có h2.visually-hidden riêng, hiện đúng trang; .page-heading và đủ ba nội dung giữ nguyên, chỉ hiện ở Sorting/Searching/Tất cả cấu trúc.
- TDD: hai test a11y-headings RED trước sửa; hai regression mới trong v2-adaptive-layout RED trước sửa. Sau sửa, nhóm a11y/page-heading/navigation/adaptive 20/20 PASS (1,562 s); nhóm UI rộng 344/344 PASS, 0 fail/skip/todo (14,586 s). Không hạ assertion accessibility. Bổ sung assertion h2 Giải thuật trong page-heading: 2/2 PASS (0,759 s).
- Build trước full suite PASS, Vite 8.3.5, 294 ms. JS raw/gzip 152843/44574 B; CSS 58402/10707 B (Node zlib mặc định); headroom JS/CSS 1157/98 B dưới trần 154000/58500 B. So với lượt Grid trước sửa blocker: JS +109/+28 B, CSS +110/+30 B; so với base f14986f: JS +109/+28 B, CSS -78/+123 B.
- Mutation mới: Big-O về bốn cột, h2 Sorting→h3, đảo hidden h2 Giải thuật. Đối chứng GREEN exit 0, mutant RED đúng assert exit 1; heap 512 MB, timeout 15 s/test, không tràn heap; restore/verify nguyên byte và clear snapshot. Thời gian đối chứng 0,6/0,5/0,6 s, mutant 0,6/0,6/0,7 s; số dòng mutant 37/34/30.

### Browser evidence của lượt sửa

Browser: ChatGPT in-app browser local; phiên bản chính xác **NOT VERIFIED** (runtime không cung cấp navigator/version). SHA base f14986febf78878404ee5d8e0b7e8ea75339b771 kèm diff; CSS SHA-256 fd2d047cdec180b24e0463e07a1eac42fa436ec19f17d43690485a0ea205b1a6, template 544dae256baca98f785f2846c3eebbb4d87d84f75c37ea50fe052c668c888740, navigation eb0986c7e29e7e94a31e127b86cb1f53674f69721d4040687aedd316bd4392a4.

110 case resize = chín chi tiết × 12 width + Hash thêm 1454/1456px; mỗi resize chụp render trước đo. window.innerWidth thực: **360,700,702,767,768,900,902,1100,1279,1280,1440,1600**; Hash thêm **1454,1456**; height 900px. Case đúng 701/901 **NOT VERIFIED** vì runtime làm tròn. Dữ liệu: Bubble Sort, Binary Search, BST mẫu, Hash va chạm nặng, Graph mẫu và bốn legacy mặc định. Không page overflow, Stage/Panel overlap, card overflow hoặc heading jump; mỗi màn đúng một h2 trong mẫu đã kiểm. Không suy rộng thành mọi biến thể dữ liệu/thuật toán.

| Case Sorting | Panel width | clientWidth/scrollWidth của bốn card |
|---|---:|---|
| 360px | 283,2px | 248/248px, cả bốn card |
| 1279px | 358,4px | 155/155px, cả bốn card |
| 1440/1600px | 380px | 166/166px, cả bốn card; lỗi cũ 76/81px đã hết |

Browser accessibility tree có h2 “Bubble Sort” / “Binary Search” và h3 “Mô phỏng”. Các legacy/BST/Hash/Graph có h2 từ tiêu đề thật tương ứng. Ba thư viện riêng hiện giới thiệu; Dashboard h2 hero, Giải thuật h2 “Giải thuật”, đều ẩn giới thiệu. Kiểm mẫu bàn phím Sorting 1600px: slider End tới max 93, Home về 0; radio ArrowRight đổi 1×→2×; Enter đóng/mở accordion, focus ở summary; không control hiện hữu nào thấp hơn 43,9px trong phép đo. Focus hiện rõ, runtime báo outline 1,6px trong khi source 2px; không coi đây là đo pixel/zoom chuẩn. Console warn/error của tab rỗng. Ảnh Sorting 1600px đã hiển thị inline trong phiên QA; chưa xuất artifact ảnh lâu dài.

### Regression mới chặn gate — đã dừng

Full pnpm test sau restore **FAIL**. Output phần cuối xác nhận tests/library-panels.test.js:28: hợp đồng yêu cầu algorithm-panel chỉ có ba section con, nhưng h2 mới là con trực tiếp thứ tư. Không sửa/xóa test cũ; dừng sửa code ngay theo giới hạn đã duyệt. Tổng PASS/FAIL full suite chưa chốt từ phần summary (lệnh chỉ trả phần cuối lỗi), không dùng 344 PASS thay kết quả full suite. Không chạy lại build sau khi full gate FAIL; artifact build ở trên cùng đúng SHA nguồn đã restore.

Đề xuất tiếp theo cần duyệt: đặt h2 Giải thuật vào section con phù hợp đang có, hoặc vị trí khác bảo toàn đúng ba section trực tiếp của panel; vẫn chỉ hiện h2 đó trên trang Giải thuật, giữ nội dung/ID/focus/event. Thêm regression vị trí và chạy lại Library + full gate, không giảm assertion cấu trúc hiện hữu.

P0 chưa phát hiện trong phạm vi đã kiểm; P1 hiện tại là regression Library ở trên; hai P1 ban đầu đã có bằng chứng xử lý. P2 còn browser version, viewport chính xác 701/901, mọi biến thể dữ liệu, keyboard toàn app, reduced motion/zoom thật, đa trình duyệt/thiết bị/screen reader/CI/Vercel smoke của diff. Không commit/push/merge, không thay đổi worktree khác; dev server đã dừng.
