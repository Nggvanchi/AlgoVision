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

- Đo 2026-11-05 trên Ubuntu (Node 26.13.0, pnpm 12.16.1).
- `pnpm test`: 754/754 pass, 0 fail, 0 skipped, khoảng 8 s.
- `pnpm build`: JS 139,49 kB (gzip 40,28 kB), CSS 41,93 kB (gzip 8,37 kB), HTML 0,63 kB.

## Kiến trúc

Chi tiết từng module (trường bước, công thức số bước, bất biến, giới hạn UI, dẫn chứng file:dòng): `docs/architecture.md`.
Đọc mục tương ứng trước khi sửa một module.

- `index.html` chỉ có `#app`; `src/main.js` fetch `public/templates/app.html` rồi gọi các hàm `init*`.
- Module UI: `navigation.js`, `sorting.js`, `searching.js`, `array.js`, `stack.js`, `queue.js`, `linked-list.js`,
  `bst.js`, `hash-table.js`, `graph.js`. Array, Stack, Queue, Linked List là module cũ, không có hàm sinh bước.
- Các lớp của một module mới (BST, Hash Table, Graph): cấu trúc thuần `src/structures/*` → sinh bước `src/algorithms/*`
  → bố cục `src/*-layout.js` → view → controller `init*(document, { scheduler })` → template.
- Mã thuần sinh mảng bước; mỗi bước ứng với một thao tác mã giả, lưu dữ liệu, tầng hiển thị lo định dạng chữ.
- `src/simulation-controller.js`: bộ điều khiển mô phỏng dùng chung cho Sorting và Searching
  (state `idle | running | paused | completed`, một timer duy nhất, scheduler inject được).
- `src/pseudocode-view.js`: `renderPseudocode` và `highlightPseudocodeLine`, dùng chung cho Sorting, Searching, BST, Hash Table, Graph.
- Sự kiện `algovision:viewchange` (`CustomEvent` trên `document`, `detail.page`): `navigation.js` phát khi đổi trang hoặc
  mở/đóng màn hình chi tiết; visualizer tự `pause()` khi bị ẩn.
- `navigation.js`: thẻ `data-structure-target="x"` mở `#x-section`; thêm cấu trúc mới không cần sửa navigation.
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
