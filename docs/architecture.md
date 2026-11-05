# Kiến trúc AlgoVision

Tài liệu tra cứu chi tiết cho người (và Claude Code) sửa một module. Tổng quan ngắn nằm trong `CLAUDE.md`.
Dẫn chứng `file:dòng` đối chiếu với code ngày 2026-11-04 (`main` sau PR #10), dòng của `graphBfs.js`, `graphDfs.js` và
`tests/graph-{bfs,dfs}.test.js` đối chiếu lại ngày 2026-11-05 (branch `chore/test-hardening`); khi sửa code làm lệch dòng, cập nhật theo.
Phần mô tả hành vi chi tiết của từng module chuyển từ CLAUDE.md và có test tương ứng; dẫn chứng `file:dòng` chỉ gắn cho định nghĩa chính.

## Các lớp của một module (BST, Hash Table, Graph)

| Lớp | Vị trí | Quy ước |
|---|---|---|
| Cấu trúc thuần | `src/structures/{bst,hashTable,graph}.js` | Snapshot bất biến. Nút BST, phần tử băm (`e1…`), đỉnh (`v1…`, `graph.js:92`) có id ổn định không cấp lại; **ô băm định danh bằng chỉ số** (`hashTable.js:2-4`) |
| Sinh bước | `src/algorithms/bst*.js`, `hashTable*.js`, `graph*.js` + khuôn bước `bstStep.js`, `hashTableStep.js`, `graphStep.js:13` | Mỗi thao tác trả về mảng bước; nút/phần tử/đỉnh tham chiếu bằng id, ô băm và mảng Sorting/Searching bằng chỉ số (`hashTableStep.js:5,7`); chỉ bước cuối `finished` |
| Bố cục vẽ | `src/tree-layout.js:12`, `src/hash-table-layout.js:15`, `src/graph-layout.js` | Hàm thuần, không import gì, test không cần DOM |
| View riêng | `src/pseudocode-view.js:4,19`, `src/graph-bfs-view.js`, `src/graph-dfs-view.js`, `src/graph-traversal-view.js` | View không import controller: `graph-*-view.js` chỉ import `structures/graph.js` và `algorithms/graphStep.js` (`graph-bfs-view.js:1-2`, `graph-dfs-view.js:1-2`, `graph-traversal-view.js:1`) |
| Controller | `src/bst.js:279`, `src/hash-table.js:388`, `src/graph.js:584` (và `sorting.js:8`, `searching.js:42`) | `init*(document, { scheduler })`: nối template, thao tác, Learning Panel |
| Template | `public/templates/app.html` | `src/main.js:16` fetch rồi gọi các `init*` |
| Điều hướng | `src/navigation.js:35-36,74` | Thẻ `data-structure-target="x"` mở `#x-section` (suy ra lúc init, thêm cấu trúc mới không cần sửa navigation; thẻ không có section thì click bị bỏ qua); phát `algovision:viewchange` (`detail.page`) khi đổi trang hoặc mở/đóng màn hình chi tiết |

Array, Stack, Queue, Linked List là module cũ (trước giai đoạn 5): không có hàm sinh bước, không có mã giả; các lớp trên không áp dụng.
Section Sorting có `id="sorting-section"` (`app.html:203`); navigation và test tìm theo id.

## Learning Panel

- Mã giả hiển thị từng dòng bằng `renderPseudocode` (mỗi dòng một `span.pseudocode-line[data-line]`); `highlightPseudocodeLine`
  gắn `is-active` + `aria-current="step"`. Dùng chung cho 5 module: `sorting.js`, `searching.js`, `bst.js`, `hash-table.js`, `graph.js`.
- Mỗi file sinh bước export mảng mã giả và dùng hằng `LINE` nội bộ; `pseudocodeLine` đếm từ 1, null = không tô
  (bước 0, bước hoàn thành của Sorting).
- Số đo thật (so sánh, probes, reads, số lần gọi, độ sâu ngăn xếp) đọc từ bước đang hiển thị, kèm Big-O lý thuyết.
- Riêng BFS/DFS: giữa chừng chỉ ghi số đã đếm, bước cuối mới kết luận Big-O (`graph-bfs-view.js:189`, `graph-dfs-view.js:230`).
- Sorting dùng `#learning-*` và bảng Big-O trong section của nó (query giới hạn trong section); Searching dùng `#search-learning-*`,
  `#search-complexity-*`, `#search-target-value`, `#search-current-value`. Lý thuyết nằm trong `algorithmConfig` (`sorting.js:71`)
  và `searchAlgorithmInfo` (`searching.js:7`).
- CSS: `--state-active` là màu "đang xét" dùng chung cho cột đang so sánh và dòng mã giả đang tô. `renderBars` không gắn
  `is-sorted` cho cột đang so sánh/đổi chỗ (màu xanh sẽ che màu trạng thái).

## Bộ điều khiển mô phỏng (Sorting, Searching)

- `createSimulationController({ getDelay, onChange?, scheduler? })` (`simulation-controller.js:24`) →
  `{ load, run, pause, next, previous, reset, getSnapshot }`; `getSnapshot()` → `{ state, stepIndex, stepCount, step, controls }`;
  `getControlState(state, stepIndex)` (`simulation-controller.js:10`) là hàm thuần. Một `timerId` duy nhất, chuỗi `setTimeout`,
  đọc `getDelay()` ở mỗi tick, mọi đường dừng qua `stopTimer()`.
- Sorting/Searching nghe `algovision:viewchange` và tự `pause()` khi visualizer của mình bị ẩn.
- Searching sinh bước lần đầu bấm Next/Run; Reset, đổi mục tiêu (`change` và `input` của `#search-target`), đổi thuật toán,
  mảng mới đều bỏ các bước cũ (`load([])`). Target được chốt trong mảng bước.

| State | Run (nhãn) | Pause | Next | Prev | Reset |
|---|---|---|---|---|---|
| idle | bật ("Chạy …") | tắt | bật | tắt | bật |
| running | tắt | bật | tắt | tắt | bật |
| paused | bật ("Tiếp tục") | tắt | bật | bật nếu bước > 0 | bật |
| completed | bật ("Chạy lại", từ đầu) | tắt | tắt | bật nếu bước > 0 | bật |

## Sorting và Searching

- `src/algorithms/*Sort.js`: bước `{ array, comparing, swapped, sortedIndices, comparisons, swaps, shifts?, key?, pseudocodeLine, message, finished? }`
  (`shifts`, `key` chỉ có ở Insertion Sort; `key` null ở bước đầu và bước cuối). Bước cuối `finished: true`
  (`bubbleSort.js:113`, `selectionSort.js:115`, `insertionSort.js:118`).
  Bất biến: `sortedIndices` của mỗi bước chứa `sortedIndices` của bước trước.
- `linearSearch.js`, `binarySearch.js`: `(numbers, target)` → bước
  `{ index, mid, left, right, comparisons, foundIndex, finished, target, currentIndex, currentValue, pseudocodeLine, message }`.
  `currentIndex`/`currentValue` là phần tử vừa so sánh (Linear = i, Binary = mid), null ở bước 0 và bước kết luận "không tìm thấy".
  `index` của Linear là con trỏ tới phần tử sẽ xét tiếp (= currentIndex + 1).
  Bất biến: `comparisons` tăng đúng 1 mỗi bước sau bước 0, trừ bước kết luận "không tìm thấy" (tăng 0).

## BST

- `src/structures/bst.js`: `{ rootId, nodes: { id: { id, value, left, right } }, nextId }`. Không chứa giá trị trùng. Tầng này chỉ
  yêu cầu số nguyên; giới hạn 1–99 và 15 nút đặt ở `src/bst.js:23-25`. Chiều cao theo số cạnh: rỗng = -1, một nút = 0.
- `bst{Insert,Search,Delete,Traversal,MinMax,Height}.js` + `bstStep.js`:
  `{ tree, currentId, pathIds, foundId, successorId, output, heights, operation, value, comparisons, pseudocodeLine, message, finished, result }`.
  Bất biến (`tests/helpers/bst-step-invariants.js`): `currentId/foundId/successorId` null hoặc thuộc `tree.nodes` của chính bước đó;
  `pathIds` chỉ tăng (trừ nút bị xóa); chỉ bước cuối `finished`.
- comparisons: Insert = số nút từ gốc tới cha nút mới (rỗng = 0, trùng ở độ sâu d = d + 1); Search/Delete = mỗi nút được xét tính 1,
  gồm nút tìm thấy; bước kết luận "không tìm thấy" không tăng; đi tìm successor, Min/Max, duyệt, Height = 0.
- Delete hai con dùng successor. Bước 12 (`z.value = s.value`) có giá trị trùng tạm thời; bước 13 xóa s theo id. Vì vậy mọi code
  đọc cây của bước (layout, render) phải duyệt theo con trỏ, không dò theo giá trị.
- `src/tree-layout.js:7-8`: x = thứ hạng inorder × 40px, y = độ sâu × 56px (15 nút rộng 600px, cuộn trong `#bst-tree-frame`).
- `src/bst.js`: `initBst(document, { scheduler })`, `renderBstTree(svg, step)` (`bst.js:204`, bỏ qua id không có trong cây),
  `bstOperations` (`bst.js:116`: mã giả, Big-O, lý thuyết theo thao tác). Cây chốt bằng `steps.at(-1).tree` ngay khi sinh bước;
  Reset chỉ tua minh họa (báo qua `#bst-status`). Đang Run thì khóa nút thao tác. n, h đọc từ cây của bước đang hiển thị.

## Hash Table

- `src/structures/hashTable.js`: hai chiến lược. Chaining `{ strategy, capacity, buckets: [[{ id, key }]], nextId }`; linear probing
  `{ strategy, capacity, cells: [{ kind: 'empty' | 'occupied' (id, key) | 'tombstone' }], nextId }`. Tombstone không giữ id.
  n luôn đếm từ dữ liệu. Hàm băm `key mod m` (`hashTable.js:26`, khóa âm vẫn về 0..m-1). Tầng này chỉ yêu cầu khóa nguyên, m nguyên ≥ 1.
  `insertKey` (`hashTable.js:171`) trả `{ table, inserted, full, id }`: kiểm trùng trước kiểm đầy; probing chỉ `full` khi không ô trống,
  không tombstone và khóa chưa có. `containsKey` (`hashTable.js:138`) là cách duy nhất UI dùng để kiểm trùng.
- `hashTable{Insert,Search,Delete}.js` + `hashTableStep.js` (`scanChain` :35, `scanProbes` :82):
  `{ table, operation, key, hashIndex, currentBucket, currentEntryId, pathEntryIds, probedBuckets, foundEntryId, insertedEntryId, comparisons, probes, pseudocodeLine, message, finished, result }`.
  Mỗi file export `chaining*Pseudocode` và `probing*Pseudocode`; `generateHashTable*Steps` chọn theo `table.strategy`.
  Bất biến: `tests/helpers/hash-step-invariants.js`.
- comparisons = số lần so khóa với khóa của một phần tử có thật; probes = số ô đã dò (chỉ probing, gồm ô trống/tombstone).
  Tính hash không phải phép so sánh. Bước kết luận (không tìm thấy, đã tồn tại, đầy) không tăng cả hai.
  Mỗi lần dò probing sinh hai bước: dòng `p = (i + j) mod m` rồi dòng quyết định (trống / tombstone / so khóa).
- Xóa probing để lại tombstone; đặt về trống làm Search khóa phía sau báo nhầm (test: xóa 10 khỏi 3, 10, 17 rồi tìm 17).
- `src/hash-table-layout.js:8-11`: mỗi ô một hàng 48px; chaining nối phần tử sang phải (40px + 16px mũi tên); `scrollTargetFor`
  chọn điểm cuộn (phần tử đang xét → vừa chèn/tìm thấy → ô đang xét), bỏ qua id lạ.
- `src/hash-table.js`: `initHashTable`, `renderHashTable` (:346), `formatLoadFactor` (:170, dấu phẩy cố định), `collisionPresetKeys`
  (:175, 3 + k·m). Giới hạn UI (`hash-table.js:34-37`): khóa 0–99, m ∈ {5, 7, 11}, chaining 15 phần tử, probing m.
  Bảng chốt bằng `steps.at(-1).table`; đổi m/chiến lược tạo bảng rỗng (báo qua `#hash-table-status`; chưa có rehash);
  đang Run khóa cả ô chọn m và chiến lược. Mọi số liệu (n, m, α, tombstone) đọc từ bảng của bước đang hiển thị.

## Graph

- `src/structures/graph.js`: đồ thị đơn `{ directed, vertices: { id: { id, slot, label } }, adjacency, nextId }` (`graph.js:2`).
  Cạnh định danh bằng cặp id `{ from, to }`. slot = số nhỏ nhất chưa dùng, nhãn suy từ slot (xóa C rồi thêm lại thì nhãn C, id mới).
  Danh sách kề sắp theo slot. Vô hướng lưu hai chiều. Ma trận kề không lưu, suy ra bằng `toAdjacencyMatrix` (hàng = đỉnh đi,
  cột = đỉnh đến). `addEdge` (:129) trả `{ graph, added, reason }` (`missing-vertex` → `self-loop` → `duplicate`). `removeVertex` (:102)
  xóa cả cạnh vào. `inDegree` (:78). Tầng này không giới hạn số đỉnh; `buildGraph` (:158) dựng từ cặp slot cho preset và test.
- Khuôn bước `createGraphStepFactory(operation, input, extraDefaults)` (`graphStep.js:13`), mỗi bước một bản sao đồ thị:
  `{ graph, operation, representation, sourceId, targetId, currentVertexId, currentEdge, matrixCell, outputIds, reads, pseudocodeLine, message, finished, result }`.
- `graphHasEdge.js`, `graphNeighbors.js`: mã giả `list*` và `matrix*`. reads = số phần tử Adj[u] hoặc số ô ma trận đã đọc;
  `deg ← 0`, `return deg`, bước kết luận false của danh sách không tăng. Kiểm tra kề theo ma trận chỉ có 2 bước (đọc ô là bước cuối).
  Có hướng: Đỉnh kề chỉ liệt kê đỉnh kề ra; bậc vào tính bằng `inDegree`.
- Bất biến: `tests/helpers/graph-step-invariants.js` (thêm: `currentEdge` là cạnh có thật, reads không giảm, `directed` không đổi,
  vô hướng đối xứng).
- `src/graph-layout.js:2-13`: 8 slot cố định trên vòng tròn tâm (150, 150), R = 115, slot k ở góc −90° + 45°·k, đỉnh bán kính 18.
  Cạnh cắt lùi 18px; u→v và v→u vẽ hai đường cong (điểm điều khiển lệch 12px). Cạnh thẳng cách đỉnh khác ≥ 33px, cạnh cong ≥ 27px.
- `src/graph.js`: `initGraph(document, { scheduler })` trả `{ loadSteps }` CHỈ DÙNG CHO TEST (nạp bước có đồ thị khác đồ thị đã chốt
  hoặc id lạ); `main.js` không dùng. Sửa đồ thị tức thì, truy vấn từng bước, chốt bằng `steps.at(-1).graph`. Select đỉnh có value là id,
  làm mới sau mỗi lần sửa (đỉnh bị xóa về "chưa chọn"). Đổi loại đồ thị tạo đồ thị rỗng. Đang Run khóa 14 điều khiển.
  Giới hạn UI 8 đỉnh (`graph.js:58`, = số slot). Danh sách kề / ma trận kề (`renderAdjacencyList` :444, `renderAdjacencyMatrix` :498)
  vẽ song song từ `step.graph`; Learning Panel tính kích thước (vô hướng V + 2E, có hướng V + E, ma trận V²) từ `step.graph`.
  Nhãn u/v trên SVG lấy từ `sourceId/targetId` của bước. Renderer rẽ nhánh theo `step.operation` của bước, không theo select.

### BFS (`src/algorithms/graphBfs.js`)
- Một nguồn s (dùng lại `#graph-source`), đánh dấu visited lúc ENQUEUE, duyệt theo Adj (khớp thứ tự cột ma trận), có hướng chỉ đi
  cạnh ra. Mỗi lần đọc phần tử Adj[u] / ô ma trận là một bước (kể cả ô 0).
- Trường thêm qua `extraDefaults`: `visitedIds`, `frontierIds` (hàng đợi, đầu hàng ở index 0), `orderIds`, `distance`, `parentIds`.
- Số bước: danh sách 2R + D + 2, ma trận 2R + R·V + 2 (R = số đỉnh tới được, D = tổng bậc ra của R đỉnh); reads = D hoặc R·V
  (chú thích reads ở `graphBfs.js:15`, công thức số bước ở `bfsStepLimit` `graphBfs.js:120`; kiểm bởi `tests/graph-complexity.test.js`).
  Giới hạn chốt an toàn `bfsStepLimit` = công thức với R = V, D = tổng độ dài danh sách kề (`maxTraversalReads`, `graphStep.js:45`).
- `src/graph-bfs-view.js`: hàng đợi (`renderBfsQueue` :72, khung cuộn ngang riêng), thứ tự lấy ra (:107), bảng dist/parent (:140),
  cạnh cây `is-tree` (có hướng chỉ khớp chiều parent → con), vòng nét đứt `is-queued`, `describeBfsCost` (:179) cho `#graph-bfs-cost`.
- Bất biến: `assertBfsStepInvariants` trong `tests/helpers/graph-step-invariants.js`.

### DFS (`src/algorithms/graphDfs.js`)
- Một nguồn s, ngăn xếp tường minh (khung = đỉnh + vị trí đọc kế tiếp), thứ tự trùng DFS đệ quy (visited lúc VÀO, duyệt theo Adj).
- Trường thêm: `visitedIds` (thứ tự thăm), `callStackIds` (đáy ở index 0), `finishedIds`, `discovery`/`finish` (t tăng 1 mỗi lần vào
  và ra, `graphDfs.js:14`), `parentIds`. result `{ reachable, maxStackDepth }`.
- Bước: vào (dòng 2), đọc (dòng 4, +1 reads), gọi (dòng 5, gán parent khi w CHƯA thăm), ra (dòng 6); bước "ra s" là bước cuối.
  Số bước: danh sách 3R + D, ma trận 3R + R·V (`graphDfs.js:21`; giới hạn chốt `dfsStepLimit` với R = V); reads bằng BFS. `currentVertexId` luôn là đỉnh ngăn xếp
  (null khi rỗng); xám = `callStackIds`.
- `src/graph-dfs-view.js`: ngăn xếp là cột dọc, đỉnh ở trên (`renderDfsStack` :98, đủ cao 8 khung), thứ tự thăm (:134), bảng
  vào/ra/parent/trạng thái (:163), vòng chấm `is-open`, tô đọc dở (khung xám đọc tới và gồm con ở khung trên), `describeDfsCost` (:220)
  cho `#graph-dfs-cost`, thẻ số lần gọi và độ sâu tối đa tới bước này (`dfsMaxDepthSoFar` :198, suy từ `parentIds`).
- `src/graph-traversal-view.js`: cạnh cây dùng chung BFS/DFS (`graph-bfs-view.js:33` export lại tên cũ).
- Bất biến: `assertDfsStepInvariants` (ngăn xếp = đỉnh xám và là đường đi theo parentIds, mốc 1..k).

## Cách test một module

- Bất biến bước dùng chung `tests/helpers/step-invariants.js`; module bọc mỏng (`bst-step-invariants.js`, `hash-step-invariants.js`,
  `graph-step-invariants.js` với `assertBfsStepInvariants`, `assertDfsStepInvariants`). Helper bất biến phải có test âm
  (`tests/step-invariants.test.js`, `tests/graph-bfs-invariants.test.js`, `tests/graph-dfs-invariants.test.js`).
- Số dò tay độc lập (thứ tự thăm, số bước, reads…) cho vài đồ thị/cây mẫu, ghi trong test (ví dụ `tests/graph-bfs.test.js:100`).
- Đối chiếu với cài đặt tham chiếu độc lập khi có: DFS ngăn xếp tường minh so với DFS đệ quy, mọi nguồn × 5 đồ thị × 2 chế độ
  × 2 biểu diễn (`tests/graph-dfs.test.js:31,255-273`).
- Test Big-O với số cụ thể: `tests/complexity.test.js`, `bst-complexity`, `hash-table-complexity`, `hash-table-probing-complexity`,
  `graph-complexity`. Quy mô lớn: đường thẳng/sao 300 đỉnh, ma trận 50 đỉnh vì mỗi bước giữ bản sao đồ thị
  (`tests/graph-complexity.test.js:112-116,170-208,267`).
- `deepFreeze` để bắt sửa nhầm snapshot: `tests/helpers/deep-freeze.js`, dùng ở 8 file test graph/hash; BST, Sorting, Searching chưa dùng.
- Chốt an toàn số bước (`src/algorithms/stepLimit.js`): 7 generator có vòng `while` (BFS, DFS, Binary Search, BST Search, Insert,
  Delete, Min/Max) export `*StepLimit` và gọi `assertWithinStepLimit` ở đầu mỗi vòng; vượt giới hạn ném RangeError. Giới hạn:
  BFS 2V + D + 2 / 2V + V² + 2, DFS 3V + D / 3V + V², Binary ⌊log2 n⌋ + 3, BST Search/Delete/MinMax n + 2, Insert max(2, 2n + 1).
  Test: `tests/step-limit.test.js`, `graph-step-limit`, `bst-step-limit`, `binary-search-step-limit` (đầu vào xấu nhất đúng bằng giới hạn).
- Test canh gác ở `tests/meta/`: `no-dom-in-equal` (phần tử DOM trong `assert.equal`…), `no-happy-dom-abort` (dọn cửa sổ bằng `close()`).
- Phá thử logic (mutation, skill `mutation-test`) và ghi kết quả vào mô tả PR.
- Kiểm trình duyệt ở 360px và 1280px: không tràn trang, console sạch. PR #5–#9 ghi đã kiểm bằng Chrome headless nhưng lệnh và
  script không được lưu lại trong repo; từ khi deploy: kiểm bằng link preview Vercel của PR.

## Lỗi đã biết liên quan cấu trúc

- `buildGraph` (`structures/graph.js:158-175`) gọi `addVertex`/`addEdge` lần lượt, mỗi lần tạo bản sao đồ thị: chậm ở quy mô lớn
  (đo 2026-11-05: sao 300 đỉnh 39–73 ms, 1000 đỉnh 0,7–1,0 s, 2000 đỉnh 5,6 s). Phần lớn thời gian test đồ thị lớn lại nằm ở bản sao
  đồ thị của từng bước (DFS sao 1000 đỉnh: 4998 bước, 4,1 s, trong đó 2,6 s là `cloneGraph`), nên sửa `buildGraph` chưa đủ để nâng
  quy mô test sao/đường thẳng lên 1000 đỉnh.
- Một thẻ số đo duyệt chung cho BFS và DFS, id `#graph-traversal-count` và `#graph-traversal-count-label`
  (`graph.js:654-655,770-771`, `app.html:1869-1870`): BFS ghi số lần dequeue, DFS ghi số lần gọi; nhãn và giá trị đổi theo thao tác.
  Đây là MỘT phần tử dùng chung, không phải id trùng; `tests/template-ids.test.js` chặn id trùng thật.
