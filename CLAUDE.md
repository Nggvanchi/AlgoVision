# AlgoVision — Hướng dẫn cho Claude Code

AlgoVision là website giáo dục trực quan hóa cấu trúc dữ liệu và giải thuật (portfolio cá nhân).
Repo: https://github.com/Nggvanchi/AlgoVision

## Lệnh

```
pnpm install --frozen-lockfile   # sau mỗi lần đổi hệ điều hành (node_modules chứa binary riêng theo OS)
pnpm test                        # node --test, DOM giả lập bằng happy-dom; đếm test bằng dòng "ℹ tests"
node --test tests/<file>.test.js # chạy riêng một file
pnpm build                       # vite build
pnpm dev                         # chạy thử trên trình duyệt
```

## Baseline

Chỗ DUY NHẤT ghi số liệu chuẩn; skill `check` và `resume-check` so với mục này.
Cập nhật ở commit cuối của mỗi PR làm thay đổi các số dưới đây.

- Đo 2026-11-07 trên Windows 11 x64 (Node v24.21.0, pnpm 12.5.1). Baseline trước Phase 4 đo trên Ubuntu/Linux x64 (Node v26.13.0, pnpm 12.16.1).
- `pnpm test`: 1626/1626 pass, 0 fail, 0 skipped, khoảng 31–39 s tùy tải máy (đo sau R6a, Windows; `main` trước R6a: 1580 test; Ubuntu trước đây 16–23 s).
- `pnpm build` sau R6a: JS 150,22 kB (150.223 B; gzip 43,79 kB), CSS 56,48 kB (56.483 B; gzip 10,93 kB), HTML 0,75 kB (746 B). So với `main` trước R6a (149.903 B / 55.079 B): JS +320 B, CSS +1.404 B.
  Ngưỡng hiện hành (trần riêng của PR R6a `feat/visualizer-controls`, ƯỚC TÍNH không qua bản mẫu rồi làm tròn lên 0,5 kB): JS <= 151,5 kB (gzip <= 44,5), CSS <= 56,5 kB (gzip <= 11,5). JS dư 1.277 B, CSS dư 17 B (đã phải rút gọn CSS nhiều lần để vào trần).
  Ngưỡng trước R6a (trần riêng của `feat/controller-seek`): JS <= 150,0 kB (gzip <= 44,0), CSS <= 55,5 kB (gzip <= 11,0); số đo sau PR đó: 1580 test, JS 149.903 B, CSS 55.079 B.
  Trần cuối cho toàn Redesign (ước tính, người dùng đặt): JS <= 158 kB (gzip <= 46), CSS <= 64 kB (gzip <= 12,8). Trần của PR trước không áp cho PR sau: mỗi PR đo và đặt trần riêng.
  Ngưỡng trước `feat/controller-seek` (trần riêng của R5c): JS <= 150,0 kB (gzip <= 44,0), CSS <= 55,5 kB (gzip <= 11,0); số đo sau R5c: 1547 test, JS 149.708 B, CSS 55.079 B. Ngưỡng trước R5c (trần riêng của R5b): JS <= 150,0 kB (gzip <= 44,0), CSS <= 55,0 kB (gzip <= 11,0); số đo sau R5b: 1527 test, JS 149.716 B, CSS 54.576 B. Ngưỡng trước R5b (trần riêng của R5a): JS <= 148,0 kB (gzip <= 43,5), CSS <= 53,5 kB (gzip <= 10,5); số đo sau R5a: 1482 test, JS 147.962 B, CSS 53.226 B. Ngưỡng trước R5a (trần riêng của R4): JS <= 147,0 kB (gzip <= 43,0), CSS <= 53,0 kB (gzip <= 10,5); số đo sau R4: 1444 test, JS 146.811 B, CSS 52.667 B. Ngưỡng trước R4 (trần riêng của R3): JS <= 147,0 kB (gzip <= 43,0), CSS <= 51,0 kB (gzip <= 10,5); số đo sau R3: 1415 test, JS 146.358 B, CSS 50.399 B. Ngưỡng trước R3 (trần riêng của R2): JS <= 146,0 kB (gzip <= 42,5), CSS <= 51,0 kB (gzip <= 10,5); trước nữa (sau khi gỡ Tiến độ học tập): CSS <= 49,5 kB (gzip <= 10,0). Đã duyệt hạ ngưỡng từ mức Phase 4 (JS 160 kB / gzip 47,0; CSS 52,5 kB / gzip 10,5) vì PR `chore/remove-learning-progress` gỡ mã và CSS của tiến độ
  (JS -13,6 kB, CSS -3,1 kB so với `main` trước PR). Redesign v1.0: mỗi PR cần trần bundle riêng, duyệt ở bước lập kế hoạch; không nâng ngưỡng khi chưa được duyệt.
- Font tự host: `public/fonts` có 10 woff2 = 172.912 B (ngưỡng 175 kB) và 2 giấy phép OFL; không nằm trong bundle JS/CSS.

## Kiến trúc

Chi tiết từng module (trường bước, công thức số bước, bất biến, giới hạn UI, dẫn chứng file:dòng): `docs/architecture.md`.
Đọc mục tương ứng trước khi sửa một module.

- `index.html` chỉ có `#app`; `src/main.js` gọi `bootApp` (`src/bootstrap.js`): fetch `public/templates/app.html`, dựng vào `#app`, rồi mới gọi
  các hàm `init*` (`startApp`). Fetch lỗi (reject, HTTP lỗi, đọc nội dung lỗi) thì hiện màn hình `role="alert"` có nút "Thử lại" và không gọi `init*`;
  lỗi của chính `init*` không bị bắt.
- Module UI: `navigation.js`, `sidebar.js`, `sorting.js`, `searching.js`, `array.js`, `stack.js`, `queue.js`, `linked-list.js`,
  `bst.js`, `hash-table.js`, `graph.js`, `library-filter.js`. Array, Stack, Queue, Linked List là module cũ, không có hàm sinh bước.
- Các lớp của một module mới (BST, Hash Table, Graph): cấu trúc thuần `src/structures/*` → sinh bước `src/algorithms/*`
  → bố cục `src/*-layout.js` → view → controller `init*(document, { scheduler })` → template.
- Mã thuần sinh mảng bước; mỗi bước ứng với một thao tác mã giả, lưu dữ liệu, tầng hiển thị lo định dạng chữ.
- `src/simulation-controller.js`: bộ điều khiển mô phỏng dùng chung cho Sorting, Searching, BST, Hash Table và Graph (cả năm module có bước)
  (state `idle | running | paused | completed`, một timer duy nhất, scheduler inject được; có `seek(index)` nhảy tới bước tùy ý, quyết định 28, chưa nối vào giao diện).
- `src/pseudocode-view.js`: `renderPseudocode` và `highlightPseudocodeLine`, dùng chung cho Sorting, Searching, BST, Hash Table, Graph.
- Sự kiện `algovision:viewchange` (`CustomEvent` trên `document`, `detail: { page, topic }`): `navigation.js` phát khi đổi trang hoặc
  mở/đóng màn hình chi tiết; visualizer tự `pause()` khi bị ẩn. `topic` là id chủ đề (`sorting:bubble`, `searching:linear`,
  `structure:bst`) khi mở màn chi tiết, `null` ở dashboard, thư viện và khi bấm Quay lại. Hiện không mã nào trong `src` đọc `topic` (chỉ test đọc; xem `docs/backlog.md`).
- Thư viện (Redesign R5a): hai tab "Cấu trúc dữ liệu" (trang `structures`) và "Giải thuật" (trang `algorithms`: Sắp xếp, Tìm kiếm, Duyệt đồ thị BFS/DFS); thanh tab `.library-tabs` (ARIA tabs, ←/→/Home/End) chỉ hiện ở hai trang này; KHÔNG có mục sidebar "Thư viện" (quyết định 22). Mở chi tiết từ trang Giải thuật thì "Quay lại" về trang đó (`libraryOrigin` trong `navigation.js`). Chi tiết: `docs/architecture.md`.
- Lọc thư viện (Redesign R5b): `src/library-filter.js` (`initLibraryFilter`, gọi sau `initSidebar`) nghe `algovision:viewchange`; ở hai trang có thanh tab hiện ô tìm (bỏ dấu, tiêu đề + mô tả), chip phân loại theo `data-category` của thẻ, bộ đếm "Hiển thị N mục" và trạng thái rỗng; ở nơi khác mọi thẻ hiện lại đầy đủ. Không có select Độ khó/Độ phức tạp (quyết định 19). Trạng thái chỉ trong bộ nhớ. Chi tiết: `docs/architecture.md`.
- Thẻ thuật toán (Redesign R5c): badge độ khó có ký hiệu ● (CƠ BẢN) hoặc ◐ (TRUNG BÌNH) `aria-hidden` và chữ ẩn thị giác "Độ khó:" (`.visually-hidden`); thanh 5 đoạn `.complexity-bar` `aria-hidden` ở 5 thẻ Sắp xếp/Tìm kiếm của thư viện (số đoạn đầy theo bậc của O thời gian xấu nhất); BFS/DFS, thẻ cấu trúc và thẻ Dashboard không có thanh; BFS/DFS và thẻ cấu trúc không có độ khó (quyết định 3, 23). Chi tiết: `docs/architecture.md`.
- Sidebar (Redesign Phase 2, R3): nhãn gốc "HỌC TẬP" rồi `<nav aria-label="Điều hướng chính">` trong `aside#sidebar` với hai nhóm (THUẬT TOÁN; CẤU TRÚC DỮ LIỆU có "Tất cả cấu trúc" và 7 mục con
  `button.nav-subitem[data-structure-nav]` do `navigation.js` sinh từ `[data-structure-target]`). `aria-current="page"` đúng MỘT phần tử của sidebar (trừ trang Giải thuật: sidebar không có mục active, chỉ breadcrumb có `aria-current`; quyết định 25). `src/sidebar.js`
  (`initSidebar`, gọi sau `initNavigation`): thu gọn 72px (nút `#sidebar-collapse` ở >= 1280px; rail 72px TỰ ĐỘNG ở 768–1279px, nút bị ẩn; tooltip) và drawer <= 767px (nút `#sidebar-toggle`, `inert`, trả focus);
  trạng thái chỉ trong bộ nhớ, KHÔNG `localStorage` (`tests/meta/no-web-storage.test.js` canh gác; nếu Redesign duyệt nhớ trạng thái thu gọn thì sửa test đó cùng PR). `.main-content` viết số 256px / `0 40px` trực tiếp vì test R12 đọc bằng regex. Chi tiết: `docs/architecture.md`.
- Không có theo dõi tiến độ học tập (Spec v1.0 mục 16–17): đã gỡ trang Tiến độ, khối tiến độ ở Dashboard, nhãn Đã mở/Chưa mở trên thẻ và kho `localStorage`. App không lưu gì vào trình duyệt
  (`tests/meta/no-web-storage.test.js`); `tests/progress-removed.test.js` canh gác các định danh cũ, không cho thêm lại.
- Token thiết kế và font (Redesign R2, R3): `:root` của `src/style.css` có khối `--av-*` (nguồn giá trị duy nhất, theo Spec mục 2 và 3: màu, `--av-space-1…8`, `--av-fs-*`, `--av-nav-active-bg`, `--av-radius-control`) rồi ba nhóm
  token cũ: CŨ (alias tạm trỏ vào `--av-*`, mỗi alias có chú thích "tạm, gỡ ở R?"; còn 15 alias tạm sau R6a (R4 gỡ `--purple-strong`, `--purple-pressed`; R6a gỡ `--accent-color`); `--purple` còn giá trị riêng cho canvas), MỚI ĐANG DÙNG (gồm `--border-control`, dùng ở nút viền và chip của Dashboard), MỚI CHƯA ĐƯỢC DÙNG (rỗng sau R4).
  Viết màu mới bằng `var(--av-*)`, không thêm hex trùng màu Spec ngoài `:root` (test canh). Font Be Vietnam Pro và
  JetBrains Mono tự host ở `public/fonts` (không dùng Google Fonts); font mã luôn qua `var(--font-mono)`. Test: `tests/av-tokens.test.js`, `tests/design-tokens.test.js`.
- `src/step-tools.js` (Redesign R6a): thanh bước dùng chung của 5 module có controller; markup `[data-step-tools]` nằm trong template (thanh trượt bước, nhãn "Bước x/y", `radiogroup` tốc độ 0,5×/1×/2×/4×, 1× = `BASE_DELAY` 650 ms); mỗi module gọi `stepTools.sync(snapshot)` ở đầu hàm vẽ và dùng `stepTools.getDelay`. Kéo thanh trượt (`input`) chỉ đổi chữ "Bước x/y"; `seek` chỉ gọi khi thả (`change`) để vùng `aria-live` đọc đúng một lần (quyết định 29). Chi tiết: `docs/architecture.md`.
- `navigation.js`: thẻ `data-structure-target="x"` mở `#x-section`; thêm cấu trúc mới không cần sửa navigation (mục con của sidebar tự được sinh theo thẻ).
  Mục con KHÔNG được mang `data-structure-target` (thuộc tính của thẻ; mục con được sinh từ các thẻ đó) hay class `nav-item` (nhiều test lấy `.nav-item` đầu tiên).
- Quy tắc theo loại file nằm ở `.claude/rules/`: `tests.md` (test), `algorithms.md` (mã thuần), `cross-platform.md` (mọi phiên).

## Quy tắc làm việc (bắt buộc)

### Giao tiếp
- Trả lời bằng tiếng Việt. Người dùng là sinh viên CNTT: giải thích lý do kỹ thuật như senior mentor junior.
- Với mỗi thay đổi: nêu file, nội dung, lý do, kết quả test, vấn đề còn tồn tại.
- Không bịa kết quả. Chỉ nói "test pass" khi đã thực sự chạy và thấy output.

### Nhịp làm việc theo giai đoạn
- Làm đúng MỘT giai đoạn của roadmap mỗi lần. Không tự chuyển sang giai đoạn tiếp theo.
- Quy trình một giai đoạn/module: `/module-workflow <branch> "<mục tiêu>"` (kế hoạch → làm → báo cáo theo mẫu trong skill).
  Cuối giai đoạn chạy skill `check` (`pnpm test`, `pnpm build`, `git diff --check`, mã hóa), commit, báo cáo, rồi DỪNG
  và chờ người dùng trả lời "đồng ý".
- Dừng sớm và hỏi nếu: baseline test đỏ, cần thêm dependency, cần sửa ngoài phạm vi giai đoạn, gặp conflict, hoặc phát hiện
  thông tin trong file này hay `docs/architecture.md` sai với code thực tế.

### Git
- Mỗi giai đoạn một branch tạo từ `main` mới nhất: `feat/...` cho tính năng, `fix/...`, `chore/...`, `docs/...` cho việc khác.
  Không commit trực tiếp lên `main`.
- KHÔNG merge vào `main`, không push, không force push, không `git reset --hard`, không `git clean`, không `git stash`,
  không `--no-verify`. Người dùng tự push, review và merge Pull Request trên GitHub.
- `git add` theo tên file cụ thể, không `git add .` hay `-A`.
- Mỗi commit một mục đích. Commit message: Conventional Commits, tiếng Việt có dấu
  (vd: `fix: Sửa lỗi nhân bản sự kiện khi chọn thuật toán sắp xếp`). Message ghi vào file UTF-8 không BOM ngoài repo
  rồi `git commit -F <file>`; kiểm lại bằng `git log -1 --format=%B`.
- File dùng LF, không BOM (`.gitattributes`: `* text=auto eol=lf`).
- Không thêm dòng Co-Authored-By hay 'Generated with Claude Code' vào commit message hoặc mô tả PR
  (`.claude/settings.json` cũng tắt attribution).

### Code và test
- Cải tiến trên kiến trúc hiện tại. Không viết lại module đang chạy, không đổi framework, không thêm dependency.
- ES6+, tên rõ nghĩa, hàm một nhiệm vụ, không over-engineering.
- Sửa bug: viết test trước, chạy thấy ĐỎ, rồi mới sửa và chạy thấy XANH. Báo cáo cả hai lần chạy (skill `mutation-test`).
- Test timer không phụ thuộc thời gian thực: inject `{ schedule, cancel }` vào controller và dùng fake scheduler trong test.
- Số test chỉ được tăng, không được giảm. Không sửa test cũ để "cho qua" mà không giải thích.
- Không hiển thị lý thuyết sai: Big-O và mô tả phải khớp với implementation thực tế.
- Thứ tự ưu tiên: Correctness → Maintainability → Testability → UX → Visual polish.

## Công cụ Claude Code trong repo

- Skill (`.claude/skills/`): `resume-check` (đầu phiên, sau khi đổi máy), `check` (trước commit), `mutation-test`
  (TDD, phá thử, đo heap), `test-profile` (đo từng file test: thời gian, RSS, tràn heap), `module-workflow` (gọi tay),
  `pr-description` (soạn mô tả PR). Script Node chạy từ gốc repo
  bằng đường dẫn tương đối (đường dẫn tuyệt đối của repo có dấu cách).
- `.claude/settings.json` có 64 deny rule cho Bash và PowerShell: force push, push lên `main`, `reset --hard`, `clean`,
  `merge`, `--no-verify`, kể cả dạng có tùy chọn toàn cục (`git -C . clean`). Rule khớp theo chữ của lệnh, không chặn được
  `sh -c "git ..."`, đường dẫn tuyệt đối tới git hay `GIT_DIR`; rào chắn thật là branch protection trên GitHub.
  Bản `git * …` có thể chặn nhầm lệnh có chữ "clean"/"merge" trong message: dùng `git commit -F <file>`.
- `.claude/settings.local.json` nằm trong `.gitignore`.

## Trạng thái hiện tại

Chạy `/resume-check`.

## Thiết kế UI

Đọc `docs/design/spec.md` (Spec Redesign v1.0, chép từ PDF) và `docs/design/decisions.md` (28 quyết định đã chốt, đánh số 1–29, bỏ số 18 dành cho chủ đề mới) trước khi sửa UI. Hai quy tắc sản phẩm: (a) không theo dõi tiến độ cá nhân, không thêm lại Tiến độ học tập, nhãn Đã mở hay lịch sử truy cập; (b) không số giả, dữ liệu hiển thị phải là dữ liệu thật hoặc gắn nhãn "Minh họa".

## Roadmap

`docs/roadmap.md` (chỉ làm giai đoạn mới khi được đồng ý).

## Còn tồn tại

`docs/backlog.md` (nhóm: lỗi, hiệu năng, giao diện, nội dung học thuật, dọn dẹp, công cụ).
