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

- Đo 2026-11-07 trên Ubuntu/Linux x64 (Node v26.13.0, pnpm 12.16.1).
- `pnpm test`: 1504/1504 pass, 0 fail, 0 skipped, 16–23 s tùy tải máy (đo 16,2 s đến 22,8 s; Windows trước đây 10–30 s).
- `pnpm build`: JS 159,01 kB (159.007 B; gzip 46,38 kB), CSS 52,83 kB (52.825 B; gzip 10,34 kB), HTML 0,75 kB (746 B).
  Ngưỡng của Redesign Phase 3b (số đo thật làm tròn lên 0,5 kB gần nhất; nằm dưới trần đã duyệt riêng cho PR này là JS 160 kB / gzip 47 kB
  và CSS 54,5 kB / gzip 11,2 kB): JS <= 159,5 kB (gzip <= 46,5), CSS <= 53 kB (gzip <= 10,5). JS dư 493 B, CSS dư 175 B: PR sau phải xem lại ngưỡng có chủ ý (`docs/backlog.md`).
  Phase 3b vượt ngưỡng cũ của Phase 2 (JS 150 kB, CSS 51,5 kB) vì thêm giao diện đọc tiến độ (trang Tiến độ và khối Dashboard); trước đó PR `chore/bundle-headroom` gỡ mã chết
  (JS -542 B, CSS -1.282 B) và ghi nhận JS gzip trên `main` đã vượt ngưỡng cũ 43,5 kB (43,54 kB).
- Font tự host: `public/fonts` có 10 woff2 = 172.912 B (ngưỡng 175 kB) và 2 giấy phép OFL; không nằm trong bundle JS/CSS.

## Kiến trúc

Chi tiết từng module (trường bước, công thức số bước, bất biến, giới hạn UI, dẫn chứng file:dòng): `docs/architecture.md`.
Đọc mục tương ứng trước khi sửa một module.

- `index.html` chỉ có `#app`; `src/main.js` gọi `bootApp` (`src/bootstrap.js`): fetch `public/templates/app.html`, dựng vào `#app`, rồi mới gọi
  các hàm `init*` (`startApp`). Fetch lỗi (reject, HTTP lỗi, đọc nội dung lỗi) thì hiện màn hình `role="alert"` có nút "Thử lại" và không gọi `init*`;
  lỗi của chính `init*` không bị bắt.
- Module UI: `navigation.js`, `sidebar.js`, `progress-view.js`, `dashboard-progress.js`, `sorting.js`, `searching.js`, `array.js`, `stack.js`, `queue.js`, `linked-list.js`,
  `bst.js`, `hash-table.js`, `graph.js`. Array, Stack, Queue, Linked List là module cũ, không có hàm sinh bước.
- Các lớp của một module mới (BST, Hash Table, Graph): cấu trúc thuần `src/structures/*` → sinh bước `src/algorithms/*`
  → bố cục `src/*-layout.js` → view → controller `init*(document, { scheduler })` → template.
- Mã thuần sinh mảng bước; mỗi bước ứng với một thao tác mã giả, lưu dữ liệu, tầng hiển thị lo định dạng chữ.
- `src/simulation-controller.js`: bộ điều khiển mô phỏng dùng chung cho Sorting và Searching
  (state `idle | running | paused | completed`, một timer duy nhất, scheduler inject được).
- `src/pseudocode-view.js`: `renderPseudocode` và `highlightPseudocodeLine`, dùng chung cho Sorting, Searching, BST, Hash Table, Graph.
- Sự kiện `algovision:viewchange` (`CustomEvent` trên `document`, `detail: { page, topic }`): `navigation.js` phát khi đổi trang hoặc
  mở/đóng màn hình chi tiết; visualizer tự `pause()` khi bị ẩn. `topic` là id chủ đề (`sorting:bubble`, `searching:linear`,
  `structure:bst`) khi mở màn chi tiết, `null` ở dashboard, trang Tiến độ (`page: 'progress'`), thư viện và khi bấm Quay lại.
- Sidebar (Redesign Phase 2): `<nav aria-label="Điều hướng chính">` trong `aside#sidebar` với hai nhóm (THUẬT TOÁN; CẤU TRÚC DỮ LIỆU có "Tất cả cấu trúc" và 7 mục con
  `button.nav-subitem[data-structure-nav]` do `navigation.js` sinh từ `[data-structure-target]`; mục "Tiến độ học tập" `.nav-item[data-page="progress"]` ngay dưới Tổng quan trong `ul` đầu). `aria-current="page"` đúng MỘT phần tử. `src/sidebar.js`
  (`initSidebar`, gọi sau `initNavigation`): thu gọn 72px (nút `#sidebar-collapse`, tooltip) và drawer <= 700px (nút `#sidebar-toggle`, `inert`, trả focus);
  trạng thái chỉ trong bộ nhớ, KHÔNG `localStorage`. `.main-content` viết số 256px / `0 40px` trực tiếp vì test R12 đọc bằng regex. Chi tiết: `docs/architecture.md`.
- Tiến độ học tập: `src/progress-store.js` (lõi thuần + `createProgressStore`, không DOM) và `src/progress-init.js` (`initProgress`, nơi
  DUY NHẤT chạm `localStorage` và sự kiện `storage`) ghi chủ đề đã MỞ vào khóa `algovision:progress` và trả `{ read, readState, recordOpen, clear, subscribe, catalog }`.
  Giao diện đọc (Phase 3b): trang "Tiến độ học tập" (`src/progress-view.js`, mục thứ hai của sidebar, `#progress-section`) và khối tiến độ cùng nút hero theo ngữ cảnh ở Dashboard
  (`src/dashboard-progress.js`), dùng chung hàm tóm tắt `src/progress-summary.js`. "Mở lại" dùng điều khiển có sẵn của `navigation.js`; xóa chỉ ở trang Tiến độ (khung xác nhận tại chỗ,
  đường riêng cho dữ liệu của phiên bản mới hơn). Chỉ nói "đã mở": không hoàn thành, không phần trăm, không streak.
- Token thiết kế và font: `:root` của `src/style.css` chia ba nhóm (token cũ giữ nguyên, token mới đang dùng, token mới CHƯA được dùng); font Be Vietnam Pro và
  JetBrains Mono tự host ở `public/fonts` (không dùng Google Fonts); font mã luôn qua `var(--font-mono)`. Test: `tests/design-tokens.test.js`.
- `navigation.js`: thẻ `data-structure-target="x"` mở `#x-section`; thêm cấu trúc mới không cần sửa navigation (mục con của sidebar tự được sinh theo thẻ).
  Mục con KHÔNG được mang `data-structure-target` (initProgress đếm chủ đề theo thuộc tính này) hay class `nav-item` (nhiều test lấy `.nav-item` đầu tiên).
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

## Roadmap

`docs/roadmap.md` (chỉ làm giai đoạn mới khi được đồng ý).

## Còn tồn tại

`docs/backlog.md` (nhóm: lỗi, hiệu năng, giao diện, dọn dẹp, công cụ).
