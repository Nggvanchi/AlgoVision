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
- Graph (giai đoạn 7, đã merge PR #7; BFS đã merge PR #8; DFS đã merge PR #9):
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
  - DFS (`src/algorithms/graphDfs.js`): một nguồn s, ngăn xếp tường minh (khung = đỉnh + vị trí đọc kế tiếp), thứ tự trùng DFS
    đệ quy (visited lúc VÀO, duyệt theo Adj). Trường thêm: `visitedIds` (thứ tự thăm), `callStackIds` (đáy ở index 0),
    `finishedIds`, `discovery`/`finish` (t tăng 1 mỗi lần vào và ra), `parentIds`. Bước: vào (dòng 2), đọc (dòng 4, +1 reads),
    gọi (dòng 5, gán parent khi w CHƯA thăm), ra (dòng 6); bước "ra s" là bước cuối. Số bước: danh sách 3R + D, ma trận 3R + R·V;
    reads bằng BFS. `currentVertexId` luôn là đỉnh ngăn xếp (null khi rỗng); xám = `callStackIds`. result `{ reachable, maxStackDepth }`.
    `src/graph-dfs-view.js` (không import `graph.js`): ngăn xếp là cột dọc đỉnh ở trên (đủ cao 8 khung), thứ tự thăm, bảng
    vào/ra/parent/trạng thái, vòng chấm `is-open`, tô đọc dở (khung xám đọc tới và gồm con ở khung trên), `describeDfsCost`
    cho `#graph-dfs-cost`, thẻ số lần gọi và độ sâu tối đa tới bước này (`dfsMaxDepthSoFar`, suy từ `parentIds`).
    `src/graph-traversal-view.js`: cạnh cây dùng chung BFS/DFS (`graph-bfs-view.js` export lại tên cũ).
    Bất biến DFS: `assertDfsStepInvariants` (ngăn xếp = đỉnh xám và là đường đi theo parentIds, mốc 1..k).
  - Còn tồn tại: `buildGraph` sao chép đồ thị sau mỗi lần thêm nên chậm ở quy mô lớn (test 1000 đỉnh ~1,3 s; test đồ thị sao
    hạ xuống 300 đỉnh).
- Assert phần tử DOM: KHÔNG truyền phần tử DOM vào `assert.equal/strictEqual/notEqual/deepEqual`, kể cả khi có thông điệp.
  Khi đỏ, Node in cả phần tử happy-dom: có thể tràn heap và mất thông điệp. Mẫu chuẩn `assert.ok(<biểu thức> === null, '<mô tả>')`
  (hoặc `!== null`), luôn kèm thông điệp mô tả để lúc đỏ chỉ in thông điệp. `assert.ok(el, '<mô tả>')` an toàn vì khi đỏ thì el là null.
  Đã sửa 14 chỗ trong 5 file ở `chore/cleanup` (searching-controller 7, bst-controller 4, hash-table-controller 1,
  graph-controller 1, pseudocode-view 1).
  - Kết quả đo (một test riêng, 512 MB): (a) `equal(el, null)` tràn heap; (b) `equal(el, null, 'thông điệp')` treo ~77 s rồi
    RangeError, mất thông điệp; (c), (d), (e) an toàn, in đúng thông điệp trong ~1,2 s. Riêng `tests/searching-controller.test.js`
    cần hơn 512 MB heap ngay cả khi xanh (xanh từ 768 MB). Ở 768 và 1024 MB với mutation `src/searching.js:251` (`|| index === 0`),
    assert cũ tràn heap sau khoảng 71–76 s, assert mới không (45 test, 8 đỏ, đủ thông điệp mới, ~4 s). Chưa đo ở heap mặc định.
  - Cách dò: quét động bằng `--import` bọc assert và các hàm truy vấn DOM của happy-dom (giới hạn: chỉ phủ nhánh test chạy thật;
    có thể báo nhầm; có thể bỏ sót nếu giữa truy vấn và assert còn một assert khác). Grep một dòng từng bỏ sót assert viết nhiều
    dòng và helper như `ui.$`. Quét tĩnh nhiều dòng (tách đúng tham số đầu) trên Ubuntu cũng ra 0 chỗ còn lại.
    Script dò nằm ngoài repo, không commit.
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

## Trạng thái hiện tại (cập nhật 2026-11-04)

- `main` = `6ac3edd` (Merge PR #9, module DFS). Giai đoạn 7 xong cả 5 module (BST, Hash Table, Graph, BFS, DFS).
  Baseline: 737/737 test pass, build OK.
- Đang ở branch `chore/cleanup` (dọn dẹp, không đổi logic): assert DOM, favicon, BOM và thông điệp hỏng mã hóa ở
  `navigation.test.js`, deny rule `git -C`, `engines`. Chờ review.
- Việc còn lại: `packageManager` chưa chốt, chờ xác nhận phiên bản pnpm trên Windows.
- Backlog giai đoạn 9: `tests/searching-controller.test.js` cần hơn 512 MB heap khi xanh, chưa rõ nguyên nhân, có thể là rủi ro
  nếu CI giới hạn bộ nhớ thấp; chưa điều tra.
- Máy phát triển: Windows và Ubuntu dùng chung một repo trên phân vùng NTFS, `core.fileMode=false`.
  Mỗi lần đổi hệ điều hành chạy lại `pnpm install --frozen-lockfile`: `node_modules` chứa binary riêng theo hệ điều hành
  (rolldown, lightningcss).
- Xuống dòng: `core.autocrlf=true` trên Windows, không đặt trên Ubuntu; không gây vấn đề nhờ `.gitattributes`
  (`* text=auto eol=lf`), mọi file text là LF.
- pnpm khác phiên bản giữa hai máy (Windows 12.5.1, Ubuntu 12.16.1); lockfile v9 chạy ổn trên cả hai nên `packageManager`
  chưa ghi cứng. `engines.node` = `^20.19.0 || >=22.12.0` (ràng buộc chặt nhất của vite 8 và rolldown).
- Windows: PowerShell 5.1 làm hỏng ngoặc kép khi truyền tham số cho lệnh ngoài: commit bằng `git commit -F <file message>`.
  Không dùng redirect/`Out-File`/`Set-Content` để ghi file (dễ ra UTF-16/BOM).
- `.claude/settings.json` (đã commit) chặn bằng deny rule cho cả Bash và PowerShell: force push, push lên `main`,
  `reset --hard`, `clean`, `merge`, `--no-verify`. 64 rule: mỗi rule `git <subcommand> …` có thêm bản `git * <subcommand> …`
  để chặn dạng có tùy chọn toàn cục (`git -C . clean`). Đã xác minh trong phiên Claude Code trên Ubuntu: `git -C . clean -n`
  chạy được trước khi sửa và bị deny sau khi sửa. Giới hạn: rule khớp theo chữ của lệnh, không chặn được `sh -c "git ..."`,
  đường dẫn tuyệt đối tới git hay biến `GIT_DIR`; rào chắn thật là branch protection trên GitHub. Bản `git * …` có thể chặn
  nhầm commit message chứa "clean"/"merge": commit bằng `git commit -F <file>`.
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
7. BST (đã merge, PR #5), Hash Table (đã merge, PR #6), Graph (đã merge, PR #7), BFS (đã merge, PR #8), DFS (đã merge, PR #9) — từng module một, có test.
   Để sau: phân loại 4 loại cạnh DFS (cây/ngược/xuôi/chéo) dựa trên mốc vào/ra đã có.
8. Tiến độ học tập bằng `localStorage` (xử lý dữ liệu lỗi/thiếu).
9. Kiểm thử tổng thể, UI/UX, README (README trên GitHub đang lỗi thời), CI, deployment.
   Ghi chú: `main.js` không xử lý lỗi khi fetch template thất bại (trang trắng).
