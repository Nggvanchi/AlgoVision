# AlgoVision — Hướng dẫn cho Claude Code

AlgoVision là website giáo dục trực quan hóa cấu trúc dữ liệu và giải thuật (portfolio cá nhân).
Repo: https://github.com/Nggvanchi/AlgoVision

## Lệnh

```
pnpm install    # chạy lại nếu build báo thiếu native binding (node_modules có thể được cài từ Linux)
pnpm test       # node --test, DOM giả lập bằng happy-dom
pnpm build      # vite build
pnpm dev        # chạy thử trên trình duyệt
```

## Kiến trúc

- `index.html` chỉ có `#app`; `src/main.js` fetch `public/templates/app.html` rồi gọi các hàm `init*`.
- Module UI: `navigation.js`, `sorting.js`, `searching.js`, `array.js`, `stack.js`, `queue.js`, `linked-list.js`.
- `src/simulation-controller.js`: bộ điều khiển mô phỏng dùng chung cho Sorting và Searching
  (state `idle | running | paused | completed`, một timer duy nhất, scheduler inject được). Chi tiết API ở mục Giai đoạn 5.
  `initSorting(options)` / `initSearching(options)` nhận `options.scheduler` và truyền vào controller.
- `src/algorithms/*Sort.js`: hàm thuần sinh mảng bước `{ array, comparing, swapped, sortedIndices, comparisons, swaps, shifts?, message, finished? }`.
- `src/algorithms/linearSearch.js`, `binarySearch.js`: hàm thuần `(numbers, target)` sinh mảng bước
  `{ index, mid, left, right, comparisons, foundIndex, finished, message }`; target được chốt trong `message`.
- Sự kiện `algovision:viewchange` (`CustomEvent` trên `document`, `detail.page`): `navigation.js` phát mỗi khi đổi trang
  hoặc mở/đóng màn hình chi tiết; Sorting/Searching lắng nghe và tự `pause()` khi visualizer của mình bị ẩn.
- `src/structures/*`: logic thuần của cấu trúc dữ liệu.
- `tests/*.test.js`: Node Test Runner + happy-dom, nạp template thật từ `public/templates/app.html`.
- `tests/helpers/fake-scheduler.js`: scheduler thời gian ảo cho test timer (không bị `node --test` quét).

## Quy tắc làm việc (bắt buộc)

### Giao tiếp
- Trả lời bằng tiếng Việt. Người dùng là sinh viên CNTT: giải thích lý do kỹ thuật như senior mentor junior.
- Với mỗi thay đổi: nêu file, nội dung, lý do, kết quả test, vấn đề còn tồn tại.
- Không bịa kết quả. Chỉ nói "test pass" khi đã thực sự chạy và thấy output.

### Nhịp làm việc theo giai đoạn
- Làm đúng MỘT giai đoạn của roadmap mỗi lần. Không tự chuyển sang giai đoạn tiếp theo.
- Cuối mỗi giai đoạn: chạy `pnpm test`, `pnpm build`, `git diff --check`, push branch, viết báo cáo theo mẫu bên dưới, rồi DỪNG và chờ người dùng trả lời "đồng ý".
- Dừng sớm và hỏi nếu: baseline test đỏ, cần thêm dependency, cần sửa ngoài phạm vi giai đoạn, gặp conflict, hoặc phát hiện thông tin trong file này sai với code thực tế.

### Git
- Mỗi giai đoạn một branch `feat/...` tạo từ `main` mới nhất. Không commit trực tiếp lên `main`.
- KHÔNG merge vào `main`, không force push, không `git reset --hard`, không `git clean`, không `--no-verify`. Người dùng tự review và merge Pull Request trên GitHub.
- `git add` theo tên file cụ thể, không `git add .`.
- Mỗi commit một mục đích. Commit message: Conventional Commits, tiếng Việt có dấu (vd: `fix: Sửa lỗi nhân bản sự kiện khi chọn thuật toán sắp xếp`).
- File dùng LF (đã có `.gitattributes`).
- Không thêm dòng Co-Authored-By hay 'Generated with Claude Code' vào commit message hoặc mô tả PR.

### Code và test
- Cải tiến trên kiến trúc hiện tại. Không viết lại module đang chạy, không đổi framework, không thêm dependency.
- ES6+, tên rõ nghĩa, hàm một nhiệm vụ, không over-engineering.
- Sửa bug: viết test trước, chạy thấy ĐỎ, rồi mới sửa và chạy thấy XANH. Báo cáo cả hai lần chạy.
- Test timer không phụ thuộc thời gian thực: inject `{ schedule, cancel }` vào controller và dùng fake scheduler trong test.
- Số test chỉ được tăng, không được giảm. Không sửa test cũ để "cho qua" mà không giải thích.
- Không hiển thị lý thuyết sai: Big-O và mô tả phải khớp với implementation thực tế.
- Thứ tự ưu tiên: Correctness → Maintainability → Testability → UX → Visual polish.

### Mẫu báo cáo cuối giai đoạn
1. Các commit (hash + message) và file thay đổi.
2. Lỗi đã sửa: nguyên nhân gốc, cách phát hiện, cách sửa.
3. Kết quả `pnpm test` (số pass/fail, trước và sau) và `pnpm build`.
4. Checklist để người dùng tự kiểm tra trên trình duyệt (`pnpm dev`).
5. Vấn đề còn tồn tại, đề xuất cho giai đoạn sau.

## Trạng thái hiện tại (cập nhật 2026-11-01)

- `main` = `a9fce5d` (Merge PR #2, giai đoạn 4).
- Branch `feat/simulation-controls` (giai đoạn 5) đã xong và đã push, CHỜ người dùng tạo/review PR.
  Kết quả: 191/191 test pass (baseline 140), build OK, `git diff --check` sạch.
- Môi trường: Windows, `core.autocrlf=true` + `.gitattributes` (`* text=auto eol=lf`), mọi file text là LF.
- `.claude/settings.json` (đã commit) chặn bằng deny rule cho cả Bash và PowerShell: force push, push lên `main`,
  `reset --hard`, `clean`, `merge`, `--no-verify`. Rule khớp theo chữ của lệnh, không chặn được dạng `git -C . clean`.
  `.claude/settings.local.json` đã nằm trong `.gitignore`.

## Giai đoạn 5: Chuẩn hóa Simulation Controls (đã xong, chờ merge)

### Lỗi đã sửa (mỗi lỗi có test ĐỎ → XANH)
- **A** `sorting.js`: `selectAlgorithm()` đăng ký thêm listener mỗi lần chạy, listener nhân đôi sau mỗi click;
  selector bắt nhầm thẻ Searching → chỉ đăng ký một lần trong `initSorting()`, selector `.algorithm-card[data-algorithm]`.
- **B** class `selected` của thẻ Sorting không cập nhật → toggle trong `selectAlgorithm()`.
- **C** `getTarget()` đọc lại ở mỗi bước → generator chốt target trong mảng bước. Thêm phương án B: sự kiện
  `input` của `#search-target` reset mô phỏng giống `change` (đang gõ là về idle, bước 0).
  Thông báo kết quả lấy target từ `step.message`; `getTarget()` chỉ được gọi trong `prepareSteps()` và phần So sánh.
- **D** kéo slider tốc độ làm hủy/tạo lại `setInterval` → controller đọc `getDelay()` ở mỗi tick.
- **E** mô phỏng chạy ngầm khi rời màn hình → `navigation.js` phát `algovision:viewchange`
  (`detail.page`); Sorting/Searching tự `pause()` khi visualizer bị ẩn.
- **F/G** tiêu đề, mô tả, Big-O và thẻ `selected` của Searching đồng bộ với dropdown.

### Kiến trúc mới
- `src/simulation-controller.js`:
  `createSimulationController({ getDelay, onChange?, scheduler? })` → `{ load, run, pause, next, previous, reset, getSnapshot }`;
  `getSnapshot()` → `{ state, stepIndex, stepCount, step, controls }`; `getControlState(state, stepIndex)` là hàm thuần.
  Một `timerId` duy nhất, chuỗi `setTimeout`, mọi đường dừng qua `stopTimer()`.
- Bảng nút (Sorting và Searching dùng chung):

  | State | Run (nhãn) | Pause | Next | Prev | Reset |
  |---|---|---|---|---|---|
  | idle | bật ("Chạy …") | tắt | bật | tắt | bật |
  | running | tắt | bật | tắt | tắt | bật |
  | paused | bật ("Tiếp tục") | tắt | bật | bật nếu bước > 0 | bật |
  | completed | bật ("Chạy lại", từ đầu) | tắt | tắt | bật nếu bước > 0 | bật |

- `src/algorithms/linearSearch.js`, `binarySearch.js`: sinh bước `{ index, mid, left, right, comparisons, foundIndex, finished, message }`;
  bước 0 là trạng thái đầu, mỗi bước sau là một phép so sánh. Searching sinh bước lần đầu bấm Next/Run;
  Reset/đổi mục tiêu/đổi thuật toán/mảng mới bỏ các bước cũ (`load([])`).
- `initSorting(options)` và `initSearching(options)` nhận `options.scheduler`.

### Quy ước test
- `tests/helpers/fake-scheduler.js`: scheduler với thời gian ảo (`advance(ms)`, `pendingCount`, `cancelCount`, `scheduledDelays`).
  Thư mục `tests/helpers/` không bị `node --test` quét.
- Khi cần chứng minh lỗi trên code chưa inject được scheduler, dùng `t.mock.timers` của `node:test`.
- Helper DOM (`withSortingDom`, `setupSearching`, `withApp`) dọn timer trong `finally` để test đỏ không làm treo tiến trình.

### Còn tồn tại
- Click thẻ thuật toán Sorting luôn tạo mảng mới (hành vi có từ trước).
- Chưa kiểm tra giao diện nút `#search-previous` trên trình duyệt thật.

## Roadmap sau giai đoạn 5 (chỉ làm khi được đồng ý)
6. Learning Panel: theory, pseudocode highlight theo bước, giải thích từng bước, Big-O khớp code.
   Ghi chú: `insertionSort.js` có bước dời phần tử với `sortedIndices: []` làm vùng đã sắp xếp nhấp nháy.
7. BST, Hash Table, Graph, BFS, DFS — từng module một, có test.
8. Tiến độ học tập bằng `localStorage` (xử lý dữ liệu lỗi/thiếu).
9. Kiểm thử tổng thể, UI/UX, README (README trên GitHub đang lỗi thời), CI, deployment.
   Ghi chú: `main.js` không xử lý lỗi khi fetch template thất bại (trang trắng).
