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
- Module UI: `navigation.js`, `sorting.js`, `searching.js`, `array.js`, `stack.js`, `queue.js`, `linked-list.js`,
  `bst.js`, `hash-table.js`, `graph.js`.
- `src/simulation-controller.js`: bộ điều khiển mô phỏng dùng chung cho Sorting và Searching
  (state `idle | running | paused | completed`, một timer duy nhất, scheduler inject được). Chi tiết API ở mục Giai đoạn 5.
  `initSorting(options)` / `initSearching(options)` nhận `options.scheduler` và truyền vào controller.
- `src/algorithms/*Sort.js`: hàm thuần sinh mảng bước
  `{ array, comparing, swapped, sortedIndices, comparisons, swaps, shifts?, key?, pseudocodeLine, message, finished? }`
  (`shifts`, `key` chỉ có ở Insertion Sort; `key` là null ở bước đầu và bước cuối).
- `src/algorithms/linearSearch.js`, `binarySearch.js`: hàm thuần `(numbers, target)` sinh mảng bước
  `{ index, mid, left, right, comparisons, foundIndex, finished, target, currentIndex, currentValue, pseudocodeLine, message }`.
  `currentIndex`/`currentValue` là phần tử vừa so sánh (Linear = i, Binary = mid), null ở bước 0 và bước kết luận
  "không tìm thấy". `index` của Linear giữ nghĩa con trỏ tới phần tử sẽ xét tiếp (= currentIndex + 1).
- Mỗi file `src/algorithms/*.js` export mảng mã giả (`bubbleSortPseudocode`, …, `binarySearchPseudocode`) và dùng hằng
  `LINE` nội bộ. `pseudocodeLine` đếm từ 1 theo mảng đó; null = không tô dòng nào (bước 0, bước hoàn thành của Sorting).
  Nguyên tắc: mỗi bước ứng với một thao tác mã giả; bước lưu dữ liệu, tầng hiển thị lo định dạng chữ (không tách số từ message).
- Bất biến bước tìm kiếm: `comparisons` tăng đúng 1 ở mỗi bước sau bước 0, trừ bước kết luận "không tìm thấy" (tăng 0).
  Bất biến bước sắp xếp: `sortedIndices` của mỗi bước chứa `sortedIndices` của bước trước.
- `src/pseudocode-view.js`: `renderPseudocode(codeEl, lines)` (mỗi dòng một `span.pseudocode-line[data-line]`) và
  `highlightPseudocodeLine(codeEl, line)` (class `is-active` + `aria-current="step"`). Dùng chung cho Sorting và Searching.
- Learning Panel: Sorting dùng `#learning-*` và bảng Big-O trong section của nó (query giới hạn trong section);
  Searching dùng `#search-learning-*`, `#search-complexity-*`, `#search-target-value`, `#search-current-value`.
  Nội dung lý thuyết nằm trong `algorithmConfig` (sorting.js) và `searchAlgorithmInfo` (searching.js).
- CSS: `--state-active` là màu "đang xét" dùng chung cho cột đang so sánh và dòng mã giả đang tô.
  `renderBars` không gắn `is-sorted` cho cột đang so sánh/đổi chỗ (màu xanh sẽ che màu trạng thái).
- Sự kiện `algovision:viewchange` (`CustomEvent` trên `document`, `detail.page`): `navigation.js` phát mỗi khi đổi trang
  hoặc mở/đóng màn hình chi tiết; Sorting/Searching lắng nghe và tự `pause()` khi visualizer của mình bị ẩn.
- `src/structures/*`: logic thuần của cấu trúc dữ liệu.
- BST (giai đoạn 7):
  - `src/structures/bst.js`: cây snapshot thuần `{ rootId, nodes: { id: { id, value, left, right } }, nextId }`.
    Nút tham chiếu bằng id ổn định, không bằng giá trị. Không chứa giá trị trùng. Tầng này chỉ yêu cầu số nguyên;
    giới hạn 1–99 và 15 nút đặt ở `src/bst.js`. Chiều cao theo số cạnh: rỗng = -1, một nút = 0.
  - `src/algorithms/bst{Insert,Search,Delete,Traversal,MinMax,Height}.js` + khuôn bước `bstStep.js`:
    `{ tree, currentId, pathIds, foundId, successorId, output, heights, operation, value, comparisons, pseudocodeLine, message, finished, result }`.
    Bất biến (kiểm bằng `tests/helpers/bst-step-invariants.js`, lớp bọc của helper chung): `currentId/foundId/successorId` là null hoặc thuộc
    `tree.nodes` của chính bước đó; `pathIds` chỉ tăng (trừ nút bị xóa); chỉ bước cuối `finished`.
  - comparisons: Insert = số nút từ gốc tới cha nút mới (rỗng = 0, trùng ở độ sâu d = d + 1); Search/Delete = mỗi nút
    được xét tính 1, gồm nút tìm thấy; bước kết luận "không tìm thấy" không tăng; đi tìm successor, Min/Max, duyệt, Height = 0.
  - Delete hai con dùng successor. Bước 12 (`z.value = s.value`) có giá trị trùng tạm thời; bước 13 xóa s theo id.
    Vì vậy mọi code đọc cây của bước (layout, render) phải duyệt theo con trỏ, không dò theo giá trị.
  - `src/tree-layout.js`: x = thứ hạng inorder × 40px, y = độ sâu × 56px (15 nút rộng 600px, cuộn trong `#bst-tree-frame`).
  - `src/bst.js`: `initBst(document, { scheduler })`, `renderBstTree(svg, step)` (bỏ qua id không có trong cây),
    `bstOperations` (mã giả, Big-O, lý thuyết theo thao tác). Cây được chốt bằng `steps.at(-1).tree` ngay khi sinh bước;
    Reset chỉ tua minh họa (báo qua `#bst-status`). Đang Run thì khóa nút thao tác. n, h đọc từ cây của bước đang hiển thị.
- Hash Table (giai đoạn 7):
  - `src/structures/hashTable.js`: snapshot thuần, hai chiến lược. Chaining `{ strategy, capacity, buckets: [[{ id, key }]], nextId }`;
    linear probing `{ strategy, capacity, cells: [{ kind: 'empty' | 'occupied' (id, key) | 'tombstone' }], nextId }`.
    Ô định danh bằng chỉ số, phần tử bằng id chuỗi `e1, e2, …` không cấp lại; tombstone không giữ id. n luôn đếm từ dữ liệu.
    Hàm băm `key mod m` (khóa âm vẫn về 0..m-1). Tầng này chỉ yêu cầu khóa nguyên, m nguyên ≥ 1.
    `insertKey` trả `{ table, inserted, full, id }`: kiểm trùng trước kiểm đầy; probing chỉ `full` khi không ô trống,
    không tombstone và khóa chưa có. `containsKey` là cách duy nhất UI dùng để kiểm trùng.
  - `src/algorithms/hashTable{Insert,Search,Delete}.js` + `hashTableStep.js` (khuôn bước, `scanChain`, `scanProbes`):
    `{ table, operation, key, hashIndex, currentBucket, currentEntryId, pathEntryIds, probedBuckets, foundEntryId,
    insertedEntryId, comparisons, probes, pseudocodeLine, message, finished, result }`. Mỗi file export mã giả
    `chaining*Pseudocode` và `probing*Pseudocode`; hàm `generateHashTable*Steps` chọn theo `table.strategy`.
    Bất biến kiểm bằng `tests/helpers/hash-step-invariants.js` (lớp bọc của helper chung `step-invariants.js`).
  - comparisons = số lần so khóa với khóa của một phần tử có thật; probes = số ô đã dò (chỉ probing, gồm ô trống/tombstone).
    Tính hash không phải phép so sánh. Bước kết luận (không tìm thấy, đã tồn tại, đầy) không tăng cả hai.
    Mỗi lần dò probing sinh hai bước: dòng `p = (i + j) mod m` rồi dòng quyết định (trống / tombstone / so khóa).
  - Xóa probing để lại tombstone; đặt về trống làm Search khóa phía sau báo nhầm (test: xóa 10 khỏi 3, 10, 17 rồi tìm 17).
  - `src/hash-table-layout.js`: mỗi ô một hàng 48px; chaining nối phần tử sang phải (40px + 16px mũi tên);
    `scrollTargetFor` chọn điểm cuộn (phần tử đang xét → vừa chèn/tìm thấy → ô đang xét), bỏ qua id lạ.
  - `src/hash-table.js`: `initHashTable(document, { scheduler })`, `renderHashTable`, `formatLoadFactor` (dấu phẩy cố định),
    `collisionPresetKeys` (3 + k·m). Giới hạn UI: khóa 0–99, m ∈ {5, 7, 11}, chaining 15 phần tử, probing m.
    Bảng chốt bằng `steps.at(-1).table`; đổi m/chiến lược tạo bảng rỗng (báo qua `#hash-table-status`; chưa có rehash);
    đang Run khóa cả ô chọn m và chiến lược. Mọi số liệu (n, m, α, tombstone) đọc từ bảng của bước đang hiển thị.
- Graph (giai đoạn 7, đã merge PR #7; BFS đã merge PR #8; DFS trên `feat/dfs`):
  - `src/structures/graph.js`: đồ thị đơn dạng snapshot thuần `{ directed, vertices: { id: { id, slot, label } }, adjacency, nextId }`.
    Id `v1, v2, …` không cấp lại; cạnh định danh bằng cặp id `{ from, to }`. slot = số nhỏ nhất chưa dùng, nhãn suy từ slot
    (xóa C rồi thêm lại thì nhãn C, id mới). Danh sách kề sắp theo slot. Vô hướng lưu hai chiều. Ma trận kề không lưu,
    suy ra bằng `toAdjacencyMatrix` (hàng = đỉnh đi, cột = đỉnh đến). `addEdge` trả `{ graph, added, reason }`
    (`missing-vertex` → `self-loop` → `duplicate`). `removeVertex` xóa cả cạnh vào. Tầng này không giới hạn số đỉnh.
  - Khuôn bước `src/algorithms/graphStep.js` (`createGraphStepFactory(operation, input, extraDefaults)`), mỗi bước một bản sao đồ thị:
    `{ graph, operation, representation, sourceId, targetId, currentVertexId, currentEdge, matrixCell, outputIds, reads, pseudocodeLine, message, finished, result }`.
    BFS thêm trường qua `extraDefaults`: `visitedIds`, `frontierIds` (hàng đợi, đầu hàng ở index 0), `orderIds`, `distance`, `parentIds`.
  - `graphHasEdge.js`, `graphNeighbors.js`: mỗi thao tác có mã giả `list*` và `matrix*`. reads = số phần tử Adj[u] hoặc số ô ma trận đã đọc;
    `deg ← 0`, `return deg`, bước kết luận false của danh sách không tăng. Kiểm tra kề theo ma trận chỉ có 2 bước (đọc ô là bước cuối).
    Có hướng: Đỉnh kề chỉ liệt kê đỉnh kề ra; bậc vào tính bằng `inDegree`.
  - Bất biến: `tests/helpers/graph-step-invariants.js` (lớp bọc mỏng của `step-invariants.js`, thêm: `currentEdge` là cạnh có thật,
    reads không giảm, `directed` không đổi, vô hướng đối xứng).
  - `src/graph-layout.js`: 8 slot cố định trên vòng tròn tâm (150, 150), R = 115, slot k ở góc −90° + 45°·k, đỉnh bán kính 18.
    Cạnh cắt lùi 18px; u→v và v→u vẽ hai đường cong (điểm điều khiển lệch 12px). Cạnh thẳng cách đỉnh khác ≥ 33px, cạnh cong ≥ 27px.
  - `src/graph.js`: `initGraph(document, { scheduler })` trả `{ loadSteps }` CHỈ DÙNG CHO TEST (nạp bước có đồ thị khác đồ thị đã chốt
    hoặc id lạ); `main.js` không dùng. Sửa đồ thị tức thì, truy vấn từng bước, chốt bằng `steps.at(-1).graph`. Select đỉnh có value là id,
    làm mới sau mỗi lần sửa (đỉnh bị xóa về "chưa chọn"). Đổi loại đồ thị tạo đồ thị rỗng. Đang Run khóa 14 điều khiển.
    Giới hạn UI 8 đỉnh. Hai bảng danh sách kề / ma trận kề vẽ song song từ `step.graph`; Learning Panel tính kích thước
    (vô hướng V + 2E, có hướng V + E, ma trận V²) từ `step.graph`. Nhãn u/v trên SVG lấy từ `sourceId/targetId` của bước.
  - BFS (`src/algorithms/graphBfs.js`): một nguồn s (dùng lại `#graph-source`), đánh dấu visited lúc ENQUEUE, duyệt theo Adj
    (khớp thứ tự cột ma trận), có hướng chỉ đi cạnh ra. Mỗi lần đọc phần tử Adj[u] / ô ma trận là một bước (kể cả ô 0).
    Số bước: danh sách 2R + D + 2, ma trận 2R + R·V + 2 (R = số đỉnh tới được, D = tổng bậc ra của R đỉnh); reads = D hoặc R·V.
    `src/graph-bfs-view.js` (không import `graph.js`): hàng đợi (khung cuộn ngang riêng), thứ tự lấy ra (`orderIds`), bảng
    dist/parent, cạnh cây `is-tree` (có hướng chỉ khớp chiều parent → con), vòng nét đứt `is-queued`, `describeBfsCost`
    cho `#graph-bfs-cost` (bước cuối mới kết luận Big-O). Renderer rẽ nhánh theo `step.operation` của bước, không theo select.
    Bất biến BFS: `assertBfsStepInvariants` trong `tests/helpers/graph-step-invariants.js`.
  - Còn tồn tại: `buildGraph` sao chép đồ thị sau mỗi lần thêm nên chậm ở quy mô lớn (test 1000 đỉnh ~1,3 s; test đồ thị sao
    hạ xuống 300 đỉnh); `favicon.ico` 404 trên toàn site; `tests/navigation.test.js` có BOM UTF-8 (file duy nhất).
    Assert so sánh trực tiếp phần tử DOM (`assert.equal(el, null)`) khi đỏ làm Node tràn bộ nhớ lúc in phần tử happy-dom:
    viết `assert.equal(el === null, true)`; còn 9 chỗ cũ (graph-controller, pseudocode-view, searching-controller).
- `navigation.js`: thẻ `data-structure-target="x"` mở section `#x-section` (suy ra lúc init, kể cả danh sách cần ẩn);
  thêm cấu trúc mới không cần sửa navigation. Thẻ không có section thì click bị bỏ qua, thư viện giữ nguyên.
- Section Sorting có `id="sorting-section"` (navigation và test tìm theo id, không dùng chuỗi `:not(...)` nữa).
- `tests/*.test.js`: Node Test Runner + happy-dom, nạp template thật từ `public/templates/app.html`.
- `tests/helpers/fake-scheduler.js`: scheduler thời gian ảo cho test timer (không bị `node --test` quét).
- `tests/complexity.test.js`, `tests/bst-complexity.test.js`, `tests/hash-table-complexity.test.js`,
  `tests/hash-table-probing-complexity.test.js`, `tests/graph-complexity.test.js`: đối chiếu số phép so sánh / số ô dò /
  số lần đọc thực tế với Big-O hiển thị.
- `tests/helpers/step-invariants.js`: bất biến bước dùng chung (tham chiếu id, đường đi chỉ tăng, trường hằng, finished, bước 0).
  Trường dạng đối tượng (`currentEdge`, `matrixCell`) khai báo `idsOf(value)`; không có `idsOf` thì giá trị chính là id.
- Đếm test bằng dòng `ℹ tests` của `node --test` (grep `^test(` bỏ sót test sinh trong vòng `for`).
  Test import module có thể thiếu export thì dùng namespace import để không làm hỏng cả file.

## Quy tắc làm việc (bắt buộc)

### Giao tiếp
- Trả lời bằng tiếng Việt. Người dùng là sinh viên CNTT: giải thích lý do kỹ thuật như senior mentor junior.
- Với mỗi thay đổi: nêu file, nội dung, lý do, kết quả test, vấn đề còn tồn tại.
- Không bịa kết quả. Chỉ nói "test pass" khi đã thực sự chạy và thấy output.

### Nhịp làm việc theo giai đoạn
- Làm đúng MỘT giai đoạn của roadmap mỗi lần. Không tự chuyển sang giai đoạn tiếp theo.
- Cuối mỗi giai đoạn: chạy `pnpm test`, `pnpm build`, `git diff --check`, commit trên branch (người dùng tự push và tạo PR), viết báo cáo theo mẫu bên dưới, rồi DỪNG và chờ người dùng trả lời "đồng ý".
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

## Trạng thái hiện tại (cập nhật 2026-11-03)

- `main` = `42b43ee` (Merge PR #8, giai đoạn 7 module BFS). Baseline: 644/644 test pass, build OK.
- Giai đoạn 7, module DFS (PR 3 của Graph) trên branch `feat/dfs`: ĐANG LẬP KẾ HOẠCH, chờ người dùng duyệt.
- Máy phát triển: Windows và Ubuntu (repo trên phân vùng NTFS, `core.filemode=false`).
- Windows: `core.autocrlf=true` + `.gitattributes` (`* text=auto eol=lf`), mọi file text là LF.
  PowerShell 5.1 làm hỏng ngoặc kép khi truyền tham số cho lệnh ngoài: commit bằng `git commit -F <file message>`.
- `.claude/settings.json` (đã commit) chặn bằng deny rule cho cả Bash và PowerShell: force push, push lên `main`,
  `reset --hard`, `clean`, `merge`, `--no-verify`. Rule khớp theo chữ của lệnh, không chặn được dạng `git -C . clean`.
  `.claude/settings.local.json` đã nằm trong `.gitignore`.

## Giai đoạn 5: Chuẩn hóa Simulation Controls (đã merge, PR #3)

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
  bước 0 là trạng thái đầu, mỗi bước sau là một phép so sánh (giai đoạn 6 đã đổi: bước kết luận "không tìm thấy"
  là bước riêng, không so sánh — xem mục Kiến trúc). Searching sinh bước lần đầu bấm Next/Run;
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
6. Learning Panel (đã merge, PR #4).
7. BST (đã merge, PR #5), Hash Table (đã merge, PR #6), Graph (đã merge, PR #7), BFS (đã merge, PR #8), DFS (đang lập kế hoạch) — từng module một, có test.
8. Tiến độ học tập bằng `localStorage` (xử lý dữ liệu lỗi/thiếu).
9. Kiểm thử tổng thể, UI/UX, README (README trên GitHub đang lỗi thời), CI, deployment.
   Ghi chú: `main.js` không xử lý lỗi khi fetch template thất bại (trang trắng).
