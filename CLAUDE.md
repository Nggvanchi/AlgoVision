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
- `src/algorithms/*Sort.js`: hàm thuần sinh mảng bước `{ array, comparing, swapped, sortedIndices, comparisons, swaps, shifts?, message, finished? }`.
- `src/structures/*`: logic thuần của cấu trúc dữ liệu.
- `tests/*.test.js`: Node Test Runner + happy-dom, nạp template thật từ `public/templates/app.html`.

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

- `main` = `a9fce5d` (Merge PR #2, giai đoạn 4). Baseline trên `main`: 140/140 test pass, build OK.
- Đang ở branch `feat/simulation-controls`. File `.gitattributes` (`* text=auto eol=lf`) đã staged nhưng CHƯA commit
  (commit trên Linux thất bại do thiếu git user.name/email). Đây là commit đầu tiên cần làm:
  `chore: Chuẩn hóa ký tự xuống dòng LF cho toàn dự án`.
- Trước đây working tree từng bị đổi sang CRLF; nội dung đã xác minh giống hệt bản commit.

## Giai đoạn 5: Chuẩn hóa Simulation Controls (đang làm)

### Đã xác minh bằng chạy thử (Chromium + Node), cần xác nhận lại bằng test của dự án

- **Lỗi A (nghiêm trọng)** `sorting.js`: `selectAlgorithm()` gọi `addEventListener` cho các thẻ mỗi lần chạy,
  trong khi `initSorting()` cũng đăng ký ở cuối hàm. Listener nhân đôi mỗi click (2, 4, 8... 512 sau 8 click),
  `createNewArray()` chạy 2^k lần mỗi click. Selector `.algorithm-card` còn bắt nhầm 2 thẻ Searching.
- **Lỗi B** `sorting.js`: class `selected` của thẻ Sorting không bao giờ được cập nhật (`navigation.js` chỉ toggle thẻ Searching).
  Test hiện tại pass chỉ vì class được viết cứng trong HTML.
- **Lỗi C** `searching.js`: `getTarget()` được đọc lại ở MỖI bước; chỉ sự kiện `change` mới reset. Gõ mục tiêu mới giữa chừng
  (chưa blur) làm kết quả sai. Mảng [10..90], tìm 80, bước 1, đổi thành 20:
  Binary Search báo "Không tìm thấy 20 trong mảng." (đã loại nửa trái khi còn tìm 80);
  Linear Search báo "Đã tìm thấy 20 tại vị trí 2." nhưng bộ đếm so sánh trộn số lần của cả hai mục tiêu.
- **Lỗi D** `searching.js`: mỗi sự kiện `input` của slider tốc độ hủy và tạo lại `setInterval`; kéo slider liên tục thì animation đứng yên.
- **Lỗi E**: mô phỏng tiếp tục chạy ngầm khi rời màn hình (đổi trang hoặc bấm Back) ở cả Sorting và Searching.
- **Lỗi F** `searching.js`/`app.html`: tiêu đề và tag Big-O của `#search-section` viết cứng "Linear Search / O(n)", không đổi khi chọn Binary Search.
- **Lỗi G**: đổi dropdown `#search-algorithm` không đồng bộ class `selected` của thẻ Searching.
- Lệch đặc tả: Sorting dùng state `'ready'` (không phải `idle`) và vẫn `'ready'` sau khi bấm Next; Run kiêm Resume;
  Run bị khóa sau `completed` (phải Reset); Searching không có Previous Step và không có lịch sử bước.

### Đã kiểm tra và KHÔNG phải lỗi
- Không rò rỉ timer: số timer đang sống luôn ≤ 1 qua Run×5, đổi tốc độ, Pause, hoàn thành.
- Linear/Binary Search đúng trên 618 trường hợp ngẫu nhiên và biên (rỗng, 1 phần tử, trùng, không tìm thấy).
- 3 hàm sinh bước Sorting đúng trên 3000 mảng ngẫu nhiên; Big-O hiển thị khớp code
  (n=24: Bubble/Insertion 23 so sánh khi đã sắp xếp, 276 khi đảo ngược; Selection luôn 276).

### Kế hoạch commit trên `feat/simulation-controls`
0. `chore: Chuẩn hóa ký tự xuống dòng LF cho toàn dự án` — `.gitattributes` (đã staged).
1. `fix: Sửa lỗi nhân bản sự kiện khi chọn thuật toán sắp xếp` — sửa A, B.
   - Selector thành `.algorithm-card[data-algorithm]`; trong `selectAlgorithm()` thay vòng `addEventListener` bằng
     `card.classList.toggle('selected', card.dataset.algorithm === algorithm)`. GIỮ vòng đăng ký listener ở cuối `initSorting()`.
   - Test: helper `withSortingDom`; spy `t.mock.method(Math, 'random')`: mỗi click thẻ phải gọi đúng `#array-size` lần
     (mặc định 12; trước khi sửa là 24, 48...); test `.selected` khớp thuật toán và tiêu đề.
2. `fix: Đồng bộ tiêu đề và thẻ thuật toán tìm kiếm` — sửa F, G. Thêm `id` cho tiêu đề/tag trong `app.html`;
   `searching.js` cập nhật tiêu đề, Big-O (Linear O(n), Binary O(log n)) và thẻ `selected` khi dropdown đổi.
   Giữ nguyên phần toggle trong `navigation.js` (test navigation có thể phụ thuộc vào nó).
3. `feat: Thêm bộ điều khiển mô phỏng dùng chung` — `src/simulation-controller.js` (~80 dòng, hàm thuần):
   state `idle | running | paused | completed`; chuỗi `setTimeout` đọc `getDelay()` mỗi tick (đổi tốc độ không tạo lại timer);
   một `timerId` duy nhất, mọi đường dừng qua `stopTimer()`; scheduler inject được; test riêng với fake scheduler.
   Bảng nút: idle (Run, Next, Reset) · running (Pause, Reset) · paused (Resume, Next, Prev nếu bước > 0, Reset) ·
   completed (Run = chạy lại từ đầu, Prev, Reset).
4. `refactor: Dùng bộ điều khiển mô phỏng cho Sorting` — giữ `algorithmConfig`, `renderArray`;
   nút Run đổi nhãn theo state ("Chạy …" / "Tiếp tục" / "Chạy lại").
5. `feat: Chuyển Searching sang mô hình bước và thêm Bước trước` — `src/algorithms/linearSearch.js`, `binarySearch.js`
   sinh bước, chốt target một lần khi sinh bước (sửa C); dùng controller (sửa D); thêm nút Bước trước. 24 test Searching cũ phải pass.
6. `feat: Tạm dừng mô phỏng khi rời khỏi màn hình` — `navigation.js` phát `CustomEvent('algovision:viewchange')`;
   Sorting/Searching tự pause (không reset) khi visualizer bị ẩn (sửa E).

## Roadmap sau giai đoạn 5 (chỉ làm khi được đồng ý)
6. Learning Panel: theory, pseudocode highlight theo bước, giải thích từng bước, Big-O khớp code.
   Ghi chú: `insertionSort.js` có bước dời phần tử với `sortedIndices: []` làm vùng đã sắp xếp nhấp nháy.
7. BST, Hash Table, Graph, BFS, DFS — từng module một, có test.
8. Tiến độ học tập bằng `localStorage` (xử lý dữ liệu lỗi/thiếu).
9. Kiểm thử tổng thể, UI/UX, README (README trên GitHub đang lỗi thời), CI, deployment.
   Ghi chú: `main.js` không xử lý lỗi khi fetch template thất bại (trang trắng).
