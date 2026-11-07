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
| Template | `public/templates/app.html` | `bootApp` (`src/bootstrap.js:46`) fetch và dựng template; `startApp` (`src/main.js:14`) gọi các `init*` sau khi dựng xong. Chỉ fetch và `response.text()` được bắt lỗi (`bootstrap.js:49-62`): lỗi thì hiện màn hình `role="alert"` + nút "Thử lại", `start` ném lỗi thì ném ra bình thường |
| Điều hướng | `src/navigation.js:36-44,70-80` | Thẻ `data-structure-target="x"` mở `#x-section` (suy ra lúc init, thêm cấu trúc mới không cần sửa navigation; thẻ không có section thì click bị bỏ qua); phát `algovision:viewchange` (`detail: { page, topic }`, xem mục Tiến độ học tập) khi đổi trang hoặc mở/đóng màn hình chi tiết |

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

## Truy cập: landmark, heading, vùng cuộn

- `app.html` bắt đầu bằng `a.skip-link[href="#main-content"]`, rồi `.app-layout`. `<main class="main-content" id="main-content" tabindex="-1">` là đích: không bao giờ bị
  `hidden` (`navigation.js` chỉ bật tắt các `section` bên trong), nhận focus bằng mã và bỏ vòng focus (`.main-content:focus`). Skip link ẩn bằng
  `position: fixed` + `transform` ra ngoài màn hình (không `display: none`, vì như vậy không focus được), hiện ở góc trên trái khi focus (phủ logo và h1).
  Neo thuần, không JS: URL thêm `#main-content`, nút Back xóa hash và app giữ nguyên trang. Màn hình lỗi tải template (`bootstrap.js`) không có skip link.
- Landmark: một `<nav aria-label="Điều hướng chính">` trong `<aside id="sidebar">` (xem mục Sidebar); `aria-current="page"` đúng một phần tử ở sidebar.
- Heading: h1 là "AlgoVision" ở thanh bên; mỗi màn hình đúng một h2 (`.page-heading h2`, hoặc h2 hero ở dashboard); cấp không nhảy quá một bậc
  (`tests/a11y-headings.test.js`). `#visualizer-title` (Sắp xếp) và "Queue Visualizer" là h3. Luật CSS theo thẻ heading phải đổi cùng lúc với thẻ:
  `.visualizer-heading h3`, `.visualizer-header h3`.
- Vùng cuộn: mọi luật `overflow` auto/scroll trong `style.css` ứng với 21 phần tử (5 `pre` mã giả, `#comparison-array`, khung mảng/Stack/Queue/Linked List,
  khung vẽ BST/Hash/Graph, 2 khung hàng đợi/ngăn xếp của BFS/DFS, 5 `.graph-panel-frame`, và `.sidebar-scroll` của sidebar). Mỗi vùng có `role="group"` và tên: `aria-label` tĩnh,
  hoặc `aria-labelledby` trỏ tiêu đề h4 (5 `pre`; BST/Hash/Graph đổi chữ theo thao tác); `.sidebar-scroll` có nhãn tĩnh "Danh sách mục điều hướng". Không đặt `tabindex`: Chrome tự cho focus khi tràn.
  `tests/a11y-scroll-regions.test.js` tìm vùng cuộn từ chính `style.css` (`tests/helpers/css-scroll-selectors.js`) và có bảng đặc tả 21 vùng: thêm vùng cuộn mới
  phải thêm nhãn và một dòng vào bảng đó, nếu không test đỏ.

## Sorting và Searching

- `src/algorithms/*Sort.js`: bước `{ array, comparing, swapped, sortedIndices, comparisons, swaps, shifts?, key?, pseudocodeLine, message, finished? }`
  (`shifts`, `key` chỉ có ở Insertion Sort; `key` null ở bước đầu và bước cuối). Bước cuối `finished: true`
  (`bubbleSort.js:113`, `selectionSort.js:115`, `insertionSort.js:118`).
  Bất biến: `sortedIndices` của mỗi bước chứa `sortedIndices` của bước trước.
- `src/sorting.js`: `renderInsertionKey` điều khiển nhãn `#insertion-key` ("Đang chèn: <key>"). Trạng thái suy ra từ bước đang hiển thị:
  không có trường `key` (Bubble, Selection) → `hidden`; `key` null (bước đầu, bước cuối) → class `is-idle` (`visibility: hidden`, vẫn chiếm chỗ);
  còn lại hiện chữ. Dòng key cao cố định `1.5em` để khung không nhảy giữa các bước. Nhãn không nằm trong `requiredElements`
  (thiếu thì bỏ qua). Mảng ở bước Dời của Insertion vẫn có bản sao (`85 85`) vì key được giữ riêng, không nằm trong mảng.
- `src/sorting-bar-state.js`: `getBarStateClasses(step, index)` (hàm thuần) trả `is-comparing`, `is-swapped`, `is-sorted` của một cột; `renderBars` và test chú giải
  dùng chung. `is-sorted` chỉ khi cột không comparing và không swapped; cột vừa so sánh vừa đổi chỗ có cả hai lớp và CSS cho `is-swapped` thắng.
  Trạng thái thật mỗi thuật toán (đo bằng cách chạy generator): Bubble và Selection có comparing, swapped, sorted; Insertion có comparing (cả trong
  vùng đã sắp xếp) và sorted, không bao giờ swapped.
- Cue ngoài màu của cột (`style.css`, quanh `.array-bar.is-comparing`): nằm trong cột nên không chiếm chỗ. Đang so sánh = viền dày (`box-shadow` inset 2px),
  đã đổi chỗ = viền nét đứt (hai dải gradient 2px, vì `outline: dashed` hiện như nét liền ở cột 7,6px = 24 cột ở 360px), đã sắp xếp = viền kép
  (inset 1px). Màu cue `--bar-cue` gần đen: >= 4,78:1 với nền cột (viền ngoài của cột cách nền khung >= 8,5:1).
- Chú giải `#sort-legend` (ngay dưới `#array-bars`, trước `#insertion-key`): mỗi mục có `data-algorithms` và `data-state`, mẫu `.sort-legend-swatch` vẽ đúng
  kiểu viền. `selectAlgorithm` ẩn mục không thuộc thuật toán (Bubble và Selection 3 mục, Insertion 2 mục). Ở <= 700px `min-height: 78px` để chiều cao
  không đổi giữa các thuật toán.
- Lời giải thích Selection đánh số vị trí từ 1; hai loại bước dùng cặp cột tô khác nhau: So sánh `[minIndex, j]`, Tìm thấy nhỏ hơn `[i, minIndex]`
  (`selectionSort.js:45`, `:61`). `tests/fixtures/selection-sort-main.json` khóa số bước, mảng, bộ đếm, `comparing`, `pseudocodeLine` (không có `message`).
- `linearSearch.js`, `binarySearch.js`: `(numbers, target)` → bước
  `{ index, mid, left, right, comparisons, foundIndex, finished, target, currentIndex, currentValue, pseudocodeLine, message }`.
  `currentIndex`/`currentValue` là phần tử vừa so sánh (Linear = i, Binary = mid), null ở bước 0 và bước kết luận "không tìm thấy".
  `index` của Linear là con trỏ tới phần tử sẽ xét tiếp (= currentIndex + 1).
- Ô Tìm kiếm (`getCellClass`, `searching.js:259`): `is-found` > `is-current` > `is-eliminated` (Binary) > `is-checked` (Linear). Ô `is-current`/`is-found` có thêm
  `span.search-cell-marker` (`aria-hidden`, `position: absolute` góc trên trái). Glyph `▶`/`✓` nằm ở `data-marker` và CSS vẽ bằng `::before`, nên
  `textContent` của ô vẫn là giá trị (test đọc `cell.textContent`). Cue viền dùng lại màu chữ của ô để đạt >= 3:1 (6,37; 6,49; 5,81).
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
- `src/hash-table-layout.js:8-11`: mỗi ô một hàng 48px; chaining nối phần tử sang phải (40px + khe `LINK_GAP` 10px, đường nối thẳng; test `tests/hash-table-layout.test.js` giữ chuỗi dài nhất của preset va chạm, m ∈ {5, 7, 11}, vừa nội dung khung 855px ở 1280px); `scrollTargetFor`
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
  vào/ra/parent/trạng thái (:163; 5 cột nên có luật CSS riêng `.graph-dfs-table` sau luật của BFS: padding ngang 4px, ô không xuống dòng, `min-width: min(264px, 100%)`), vòng chấm `is-open`, tô đọc dở (khung xám đọc tới và gồm con ở khung trên), `describeDfsCost` (:220)
  cho `#graph-dfs-cost`, thẻ số lần gọi và độ sâu tối đa tới bước này (`dfsMaxDepthSoFar` :198, suy từ `parentIds`).
- `src/graph-traversal-view.js`: cạnh cây dùng chung BFS/DFS (`graph-bfs-view.js:33` export lại tên cũ).
- Bất biến: `assertDfsStepInvariants` (ngăn xếp = đỉnh xám và là đường đi theo parentIds, mốc 1..k).

## Tiến độ học tập (chủ đề đã mở)

Lưu chủ đề nào đã được MỞ (vào màn hình chi tiết), mở lần đầu và gần nhất lúc nào, mở bao nhiêu lần. "Đã mở" không nói gì về mức độ đã
học: không có trường, nhãn hay comment "hoàn thành/completed" (test canh gác chặn). Dữ liệu chỉ nằm trong `localStorage` của trình duyệt
người dùng, không gửi đi đâu. Giao diện đọc và xóa có từ Redesign Phase 3b (mục "Giao diện đọc tiến độ" bên dưới).

| Tệp | Vai trò |
|---|---|
| `src/progress-store.js` | Lõi thuần (`emptyProgress`, `parseProgress`, `recordOpen`, `serializeProgress`, `keepKnownTopics`, `topicId`) và `createProgressStore({ storage, knownTopics, now })` → `{ read, readState, recordOpen, clear }`. `readState()` trả `{ progress, status, persisted }`: `status` là `empty \| ok \| corrupt \| unavailable \| future-version`; `persisted` là `false` khi đang hiện bản nhớ của phiên (kho không dùng được, ghi lỗi, hoặc version mới hơn). Không DOM, không `window`; `storage` inject được (`getItem/setItem/removeItem` hoặc `null`) |
| `src/progress-init.js` | `initProgress(document, { storage, now })`: nghe `algovision:viewchange`, suy `catalog` `[{ id, label, kind }]` từ template (nhãn từ `.algorithm-card h4`, `[data-search-algorithm] h4`, `.structure-card-title`; cùng chỗ với danh sách chủ đề hợp lệ), trả `{ read, readState, recordOpen, clear, subscribe, catalog }`. `subscribe(callback)` (trả hàm hủy) báo dữ liệu có thể đã đổi: SAU mỗi lần mở chủ đề, sau `clear()` ở tab này, và khi sự kiện `storage` trên `window` có `key === 'algovision:progress'` hoặc `key === null`; người nghe ném lỗi bị nuốt. Nơi DUY NHẤT chạm `localStorage` và `storage` event (`browserStorage` bọc `try/catch`) |
| `src/progress-summary.js` | Hàm thuần: `summarizeProgress(progress, catalog)` → `{ total, opened, totalOpens, lastOpenedAt, groups, recent }`, `formatOpenedAt(ts, { now, timeZone })`, `isoTimestamp(ts)` |
| `src/progress-view.js` | `initProgressView(document, progress)` vẽ `#progress-section`; xuất hàm dùng chung `createTopicRow`, `reopenTopic`, `openPage`, `progressNotice`, `createConfirmBox`, `focusMain` |
| `src/dashboard-progress.js` | `initDashboardProgress(document, progress)`: khối `.dashboard-progress` và nút hero theo ngữ cảnh ở Dashboard |
| `src/main.js` | gọi `const progress = initProgress(document)` sau `initNavigation(document)`, rồi `initProgressView(document, progress)` và `initDashboardProgress(document, progress)` |

**Lược đồ (khóa `algovision:progress`, version 1).** Một khóa duy nhất, JSON:
`{ "version": 1, "topics": { "<id>": { "firstOpenedAt": ms, "lastOpenedAt": ms, "openCount": n } } }`. Chỉ lưu chủ đề đã mở, không có mục
mặc định. Id có dạng `loại:tên` (regex trong `progress-store.js`): `sorting:{bubble,selection,insertion}`, `searching:{linear,binary}`,
`structure:{array,stack,queue,linked-list,bst,hash-table,graph}` (12 chủ đề; danh sách lấy từ `data-algorithm`,
`data-search-algorithm`, `data-structure-target` lúc `initProgress` chạy, không gõ tay). Giới hạn: chuỗi đọc ≤ 16000 ký tự
(`MAX_STORED_LENGTH`), `openCount` ≤ 1.000.000 (`MAX_OPEN_COUNT`); 12 chủ đề chiếm dưới 2 kB. Hiện chưa có hàm migrate vì mới có version 1:
khi nâng version phải thêm migrate cho bản cũ trong `parseProgress`.

**Sự kiện `algovision:viewchange`: `detail: { page, topic }`.** `topic` là id chủ đề khi mở màn chi tiết, `null` ở dashboard, thư viện, khi bấm
Quay lại và khi đổi trang (`navigation.js`: `notifyViewChange(topic = null)`; chỉ `showSortingDetail`, `showSearchingDetail` và handler thẻ
cấu trúc truyền topic). `detail.page` và tên sự kiện không đổi; các listener `pause()` không đọc `topic`.

**Cơ chế `currentTopic` (`initProgress`).** Biến `currentTopic` theo `detail.topic`: `null` thì đặt lại `null` và không ghi; topic mới khác
`currentTopic` thì ghi và cập nhật; cùng topic phát liên tiếp không đếm đôi; viewchange không có `detail` coi như `null`. Màn chi tiết
Tìm kiếm có `<select id="search-algorithm">` để đổi thuật toán ngay tại chỗ, không phát viewchange (sẽ làm mô phỏng tự pause): `initProgress`
nghe `change` của select, chỉ ghi khi `currentTopic` bắt đầu bằng `searching:` và id mới khác `currentTopic`. Khi click thẻ,
`navigation.js` gán select và phát `change` TRƯỚC `viewchange` (`tests/navigation-topic.test.js` cố định thứ tự này), lúc đó `currentTopic`
còn `null` nên không đếm đôi. Màn chi tiết Sắp xếp không có bộ chọn thuật toán nên không cần cơ chế này.

**Hành vi khi lỗi (đúng với code hiện tại).** Mọi hàm của kho không ném.

| Tình huống | Hành vi |
|---|---|
| Đọc `window.localStorage` ném (cửa sổ riêng tư/bị chặn), `storage = null` | `browserStorage` trả `null`; `read()` trả bản nhớ của phiên, `recordOpen` trả `false`; app chạy bình thường |
| `getItem` ném | Như trên (trạng thái unavailable), mỗi lần đọc lại thử lại |
| `setItem` ném (hết quota) | Nuốt lỗi, `recordOpen` trả `false`, không thử lại; `read()` trả bản nhớ phiên cho tới lần ghi thành công kế tiếp |
| Không có khóa | Tiến độ rỗng, không ghi gì |
| JSON hỏng, gốc sai kiểu, thiếu/sai `version`, `topics` không phải object, chuỗi quá 16000 ký tự | Trạng thái corrupt: coi như rỗng; đọc không xóa khóa, lần ghi hợp lệ kế tiếp ghi đè |
| Một mục sai (timestamp không nguyên/âm, `last < first`, `openCount` < 1 hoặc không nguyên, id sai dạng như `__proto__`) | Bỏ đúng mục đó, giữ mục đúng; trường lạ bị bỏ; `openCount` > 1.000.000 bị kẹp |
| `version` > 1 | Trạng thái future-version: không đọc, KHÔNG ghi đè khóa; `recordOpen` trả `false`; phiên vẫn nhớ trong bộ nhớ; `clear()` (người dùng chủ động) vẫn xóa |
| Chủ đề đã bị xóa khỏi app | `parseProgress` giữ mục (id đúng dạng); `read()` lọc bằng `keepKnownTopics`; mỗi lần ghi giữ nguyên mục lạ trong storage. `recordOpen` từ chối id app không biết (`false`) |
| Hai tab | Mỗi lần mở: đọc lại bản mới nhất trong storage rồi cộng thêm 1 (không dùng cache), nên không đè mất lần mở của tab kia. `initProgress` đăng ký một listener `storage` trên `window`: tab khác đổi hoặc xóa khóa thì `subscribe` báo và giao diện vẽ lại (chưa kiểm với hai tab thật). Không có `mergeProgress`/`migrate` (đã bỏ khỏi kế hoạch ban đầu) |
| Đồng hồ trả giá trị sai hoặc ném | `recordOpen` trả `false`, không ghi, không coi là lỗi ghi (`read()` vẫn đọc storage thật) |
| Lỗi bất ngờ ở listener | `initProgress` bọc `try/catch`: ghi tiến độ không phá điều hướng |

### Giao diện đọc tiến độ (Redesign Phase 3b)

- **Trang "Tiến độ học tập"**: `navigation.js` có `pages.progress = { title: 'Tiến độ học tập' }`, `#progress-section` trong `hideAllSections` và nhánh `renderPage('progress')`; `.page-heading` ẩn cả ở trang này
  (trước đây chỉ ở dashboard). Vào trang phát đúng MỘT `viewchange` `{ page: 'progress', topic: null }` và không ghi tiến độ; mô phỏng đang chạy vẫn tự `pause()`. Mục `button.nav-item[data-page="progress"]`
  (symbol `icon-progress`) là mục thứ hai trong `ul` đầu của sidebar. `progress-view.js` vẽ lại CHỈ vùng dữ liệu (`#progress-data`) khi `subscribe` báo và khi vào trang; không chạm khung xác nhận đang mở.
- **Nội dung**: ba ô (Đã mở N / 12 chủ đề, Tổng lượt mở, Mở gần nhất), ba thẻ nhóm (Sắp xếp, Tìm kiếm, Cấu trúc dữ liệu: "x / n" và danh sách chủ đề), "Mở gần đây" (tối đa 5) và khu "Dữ liệu" (nút xóa). Hàng đã mở có
  nút "Mở lại <tên>" (`aria-label`), `<time datetime>` cho thời điểm; hàng chưa mở ghi "Chưa mở". Vùng `#progress-status` (`role="status"`, `aria-live="polite"`) luôn có trong DOM.
- **Trạng thái**: trống (câu hướng dẫn, nút "Mở Sắp xếp", nút xóa `aria-disabled` kèm "Chưa có gì để xóa"); dữ liệu hỏng ("bị bỏ qua, lần mở tiếp theo ghi đè"); không lưu được (`persisted === false`); phiên bản mới hơn (chỉ thông báo,
  không số liệu, không ghi đè hay chuyển đổi). Dashboard dùng chung chữ thông báo (`progressNotice`) và không có nút xóa.
- **Hai đường xóa**, cùng một thành phần `createConfirmBox` (`role="group"`, `aria-labelledby`, focus vào Hủy khi mở, Escape hủy, không `confirm()` hay `<dialog>`): "Xóa lịch sử học tập" và, chỉ khi `status === 'future-version'`,
  "Xóa dữ liệu của phiên bản mới hơn" (khung và câu cảnh báo riêng). Lúc xác nhận trạng thái được đọc lại: đường thường từ chối khi kho đang là phiên bản mới hơn (nếu không `clear()` xóa luôn dữ liệu đó), đường riêng từ chối khi không còn là phiên bản mới hơn.
  Xóa xong: focus về ô tóm tắt đầu (`[data-progress-summary]`, `tabindex="-1"`) và thông báo qua `#progress-status`; `clear()` trả `false` thì thông báo không xóa được khỏi trình duyệt nhưng lịch sử phiên đã làm mới.
- **"Mở lại" (`reopenTopic`)** dùng điều khiển có sẵn, không thêm hàm vào `navigation.js`: cấu trúc qua `button[data-structure-nav]`; Sắp xếp và Tìm kiếm qua `.nav-item[data-page]` rồi thẻ `.algorithm-card[data-algorithm]` hoặc `[data-search-algorithm]`.
  Một lần bấm là một lần mở thật (`openCount` +1 đúng một lần; Tìm kiếm phát `change` trước `viewchange` nên không đếm đôi), rồi focus về `#main-content` (`tabindex="-1"`).
- **Dashboard**: `.dashboard-progress` hiện "Đã mở N / 12 chủ đề", "Sắp xếp a/3 · Tìm kiếm b/2 · Cấu trúc dữ liệu c/7" và tối đa 3 hàng mở gần đây (cùng `createTopicRow` ở dạng `recent`); nút "Xem tiến độ chi tiết"
  (`data-dashboard-target="progress"`). Nút hero giữ `data-dashboard-target="sorting"` và class `dashboard-primary-button`; nhãn nằm trong `#dashboard-hero-label`: người mới "Bắt đầu với Bubble Sort", người đã mở "Tiếp tục: <chủ đề mở gần nhất>",
  bấm thì mở chủ đề đó (điều hướng cũ chạy trước và về thư viện Sắp xếp rồi mới mở thẳng chủ đề). Vẽ lại khi `subscribe` báo và khi `viewchange` về `dashboard`.
- Test: `tests/progress-navigation.test.js`, `progress-view.test.js`, `dashboard-progress.test.js`, `progress-init.test.js` (subscribe, catalog); `tests/meta/progress-storage-boundary.test.js` cũng canh `progress-view.js`.
  Mã của `progress-view.js` được viết trước, test viết sau; bằng chứng là mutation (35 mutation: 34 bị bắt, 1 là nhánh thừa đã bỏ); `dashboard-progress.js` làm theo TDD và mutation 19/19.

Chưa xác minh trên trình duyệt thật: test chạy bằng happy-dom (xem `docs/backlog.md`).

## Sidebar: nhóm, mục con, thu gọn, drawer (Redesign Phase 2)

Test: `tests/sidebar-structure.test.js` (DOM), `sidebar-navigation.test.js` (viewchange, ghi tiến độ, aria-current), `sidebar-collapse-drawer.test.js`
(thu gọn, tooltip, drawer; `matchMedia` giả ở `tests/helpers/fake-media.js`), `sidebar-css.test.js` (CSS thật: tương phản, kích thước, luật drawer, ngân sách bề rộng).
Tổng 175 test: 90 viết riêng, 85 sinh từ bảng.

**HTML** (`public/templates/app.html`): `a.skip-link` rồi `.app-layout` gồm `.mobile-bar` (nút `#sidebar-toggle`: `aria-expanded`, `aria-controls="sidebar"`; chỉ hiện <= 700px),
`aside.sidebar#sidebar`, `.sidebar-overlay` (`aria-hidden`), `main`. Thứ tự Tab: skip link, nút menu, sidebar, nội dung. Trong aside: `.brand` (h1 "AlgoVision"), rồi
`<nav class="sidebar-nav" aria-label="Điều hướng chính">` chứa `div.sidebar-scroll[role="group"][aria-label="Danh sách mục điều hướng"]` (vùng cuộn thứ 21), rồi `.sidebar-footer`
với nút thu gọn `#sidebar-collapse` (ngoài `<nav>`). Trong vùng cuộn: Tổng quan và Tiến độ học tập (`ul > li > button.nav-item[data-page]`), nhãn nhóm `p.section-label#nav-group-*` và `ul[aria-labelledby]`
cho THUẬT TOÁN (Sắp xếp, Tìm kiếm) và CẤU TRÚC DỮ LIỆU ("Tất cả cấu trúc" + `ul.nav-sublist#structure-nav-list`). Mọi nút có `type="button"`; nhãn nằm trong `.nav-label`, icon
`.nav-icon[aria-hidden]`. Khối "PHIÊN BẢN 0.1.0" đã bỏ (không phải dữ liệu thật). `.topbar` trong `<main>` có breadcrumb động (chữ, mục cuối đậm) do `renderTopbar()` của `navigation.js` cập nhật cùng `document.title` mỗi lần `notifyViewChange`; icon là sprite SVG tự vẽ ở đầu template (`<symbol id="icon-...">`).

**`src/navigation.js`**
- `openStructure(target)` (dùng chung cho thẻ ở thư viện và mục con): ẩn thư viện, hiện `#<target>-section`, đặt `currentStructure`, cập nhật điều hướng, phát ĐÚNG MỘT viewchange
  `{ page: 'structures', topic: 'structure:<tên>' }`; trả `false` (không phát gì) nếu không có section.
- `renderStructureNav()` sinh mục con từ `[data-structure-target]` lúc init (nhãn từ `.structure-card-title`, icon là symbol SVG `icon-structure-<tên>`); thẻ không có section thì không có mục con.
  Mục con dùng `data-structure-nav` và class `nav-subitem`, KHÔNG dùng `data-structure-target` (`initProgress` đếm 12 chủ đề theo thuộc tính này) và KHÔNG dùng class `nav-item`
  (nhiều test lấy `.nav-item[data-page="structures"]` đầu tiên).
- Mục con từ trang khác gọi `renderPage('structures')` (không phát sự kiện) rồi `openStructure`, nên chỉ có một viewchange và không có sự kiện topic null xen giữa.
- `updateNavigation()`: `.nav-item` của trang hiện tại có class `active`; ở chi tiết cấu trúc, mục con cũng `active`. `aria-current="page"` chỉ nằm trên ĐÚNG MỘT phần tử: mục con khi đang ở
  chi tiết cấu trúc (mục cha vẫn `active` nhưng không có `aria-current`), ngược lại là `.nav-item` của trang. `renderPage` đặt lại `currentStructure = null`.

| Kịch bản | viewchange | Ghi tiến độ |
|---|---|---|
| Bấm thẻ cấu trúc ở thư viện | 1 × `{structures, structure:x}` (như trước) | 1 |
| Mục con khi đang ở thư viện, hoặc ở chi tiết cấu trúc khác | 1 × `{structures, structure:x}`, không có null xen giữa | 1 |
| Mục con từ Tổng quan, Sắp xếp (kể cả đang chạy), Tìm kiếm | 1 × `{structures, structure:x}`; mô phỏng đã tạm dừng | 1 |
| Bấm lại mục con của cấu trúc đang mở | 0 | 0 (drawer vẫn đóng ở mobile) |
| Quay lại (`data-back-to-structures`) | 1 × `{structures, null}` (như trước); mục cha có `aria-current` | 0 |
| `.nav-item` (kể cả "Tất cả cấu trúc") | 1 × `{page, null}` (như trước) | 0 |

**`src/sidebar.js`** — `initSidebar(document, { matchMedia } = {})`, gọi SAU `initNavigation` (mục con do navigation sinh) và trước `initProgress` (`main.js`, `withFullApp`);
`export const DRAWER_BREAKPOINT = 700` phải bằng `@media (max-width: 700px)` (test so hai nơi). Trả về `{ toggleCollapse, isCollapsed, openDrawer, closeDrawer, toggleDrawer, isDrawerOpen }`.
Trạng thái (`collapsed`, `drawerOpen`) chỉ nằm trong bộ nhớ của phiên: file này không nhắc `localStorage`, `sessionStorage`, cookie, `indexedDB` (test đọc mã nguồn; `progress-init.js` vẫn là nơi duy nhất chạm kho lưu trữ).
- Thu gọn (>= 701px): nút `#sidebar-collapse` đổi class `is-sidebar-collapsed` trên `.app-layout`, `aria-expanded` và nhãn "Thu gọn thanh bên" <-> "Mở rộng thanh bên". CSS chỉ trong
  `@media (min-width: 701px)`: sidebar rộng `--sidebar-width-collapsed` (72px), `.main-content` `margin-left: 72px` (luật riêng, không đụng luật `.main-content` mà test R12 đọc). Nhãn mục, chữ logo
  (`.brand-text`, chứa h1) và nhãn nhóm ẩn bằng clip kiểu sr-only (`position: absolute; 1px; overflow: hidden; clip-path: inset(50%)`), KHÔNG `display: none`: tên truy cập, h1 và nhãn nhóm vẫn có trong cây
  trợ năng. Nhãn nhóm thành đường kẻ; mục active giữ vạch tím và `aria-current`.
- Tooltip khi thu gọn: MỘT phần tử `.sidebar-tooltip` (`aria-hidden`, `position: fixed`, `pointer-events: none`) do JS đặt `left`/`top` theo mép phải sidebar. Không dùng `::after` trên từng nút vì
  `.sidebar-scroll` (overflow-y: auto kéo theo overflow-x: auto) cắt tooltip nằm trong nút. Hiện khi rê chuột hoặc focus bàn phím (`:focus-visible`), tắt khi rời, khi Escape và khi mở rộng lại.
  Tên truy cập luôn là chữ thật trong `.nav-label`; tooltip chỉ là phần phụ.
- Drawer (<= 700px): đóng sẵn bằng `visibility: hidden` + `transform: translateX(-100%)` (transition `visibility 0s 200ms` để trượt xong mới ẩn), nên 0 phần tử focus được trong sidebar; chỉ `.brand`
  được `visibility: visible` riêng để h1 còn trong cây trợ năng. Cao `calc(100vh - 56px)` rồi `calc(100dvh - 56px)` (dự phòng), nằm dưới thanh trên 56px (`top: 56px`) để nút menu vẫn bấm được.
  Mở (chỉ khi `matchMedia` hẹp): class `is-open` trên sidebar và lớp phủ, `aria-expanded`/nhãn của nút menu, `#main-content` và `.skip-link` thành `inert`, focus vào `.nav-item` đầu tiên. Không `role="dialog"`,
  không bẫy focus. Đóng bằng nút menu, lớp phủ, Escape, hoặc chọn một mục (kể cả bấm lại mục con đang mở): trả focus về nút menu; riêng khi cửa sổ rộng ra qua 700px thì đóng mà KHÔNG kéo focus.
  Nút menu dùng symbol SVG `icon-menu` và không đổi hình khi mở; khi drawer mở `<body>` có class `is-drawer-open` (khóa cuộn nền, giữ chỗ thanh cuộn). `prefers-reduced-motion` dùng luật chung sẵn có (`transition-duration: 0.01ms !important`).

**Token Phase 2 đang dùng** (nhóm `TOKEN MỚI, ĐANG DÙNG`, 20 token; chỉ trong luật của sidebar/tooltip/nút chính, `tests/sidebar-css.test.js` canh gác không cho cỡ chữ/spacing/bo góc lan ra ngoài):
`--font-ui`, `--font-mono` (Phase 1); `--sidebar-width` (256px), `--sidebar-width-collapsed` (72px); `--bg-sidebar`, `--surface-raised`, `--text-label`, `--purple-strong`, `--purple-pressed`, `--purple-tint`;
`--fs-xs/sm/md`, `--space-1/2/3/4/6`, `--radius-sm`, `--shadow-card` (tooltip). Giá trị toàn cục của token cũ (`--border`, `--text-muted`, `--background`, `--panel`) KHÔNG đổi.

**Ngân sách bề rộng**: sidebar 256px + `padding: 0 40px` của `.main-content` cho khung bảng băm ở 1280px nội dung rộng 861px (`1280 - 15 - 256 - 2×40 - 2×(24+1) - 2×(1+8)`; trước: 250 + 46 cho 855px).
Chuỗi chaining 15 khóa rộng 842px còn dư 19px; sidebar tối đa 263px nếu giữ padding 46px. `.main-content` PHẢI viết `margin-left` và `padding` bằng số trực tiếp (không `var()`/`calc()`):
`tests/hash-table-layout.test.js` đọc style.css bằng regex và ném lỗi nếu khai báo khác dạng; `tests/sidebar-css.test.js` khẳng định 256 = `--sidebar-width`, 72 = `--sidebar-width-collapsed`, cả hai là bội số của 4.
Đo CDP (Chrome 152, Windows, 2026-11-06): khung 871 -> 877px (nội dung 861px), tràn 0.

**Tương phản** (tính từ token thật trong test): nhãn nhóm `--text-label` trên `--bg-sidebar` 6,00 (cỡ 12px; trước 4,29 ở 10px); chữ mục thường 6,68; mục active `--text` trên `--purple-tint` 12,80, icon 5,15, vạch 3px 6,42;
hover 14,30; logo "A" chữ trắng trên `--purple-strong` 5,31 (trước: gradient bắt đầu ở #ad98ff, 2,41); nút "Bắt đầu học" và "Thử lại" (cùng class `dashboard-primary-button`) 5,31, hover `--purple-pressed` 6,84.

**Kích thước**: mục chính cao tối thiểu 40px, mục con 36px (desktop); 44px ở <= 700px; nút menu 44×44px; thanh trên 56px.

## Token thiết kế và font tự host (Redesign Phase 1)

Phase 1 chỉ thêm nền móng, **không đổi diện mạo trừ font**: token trong `:root` của `src/style.css`, font tự host, gom 13 hex khớp đúng token.
Test: `tests/design-tokens.test.js` (107 test: 42 viết riêng, 65 sinh từ bảng; Phase 2 bỏ 1 hàng gom hex và thêm 1 test) và hai helper `tests/helpers/contrast.js` (tỉ lệ WCAG, có test riêng)
và `tests/helpers/css-tokens.js` (parser nhỏ đọc `:root`, `@font-face`, `@import`, khai báo của từng luật). Mọi giá trị đọc từ `style.css`.

**Ba nhóm token trong `:root`** (comment `=== TOKEN CŨ ===`, `=== TOKEN MỚI, ĐANG DÙNG ===`, `=== TOKEN MỚI, CHƯA ĐƯỢC DÙNG ===`; test kiểm mỗi token nằm đúng nhóm):

| Nhóm | Token | Quy tắc |
|---|---|---|
| TOKEN CŨ | 18 token: 10 giá trị gốc (`--background`, `--panel`, `--panel-hover`, `--border`, `--text`, `--muted`, `--purple`, `--purple-dark`, `--state-active`, `--bar-cue`) và 8 alias (`--text-muted`, `--border-color`, `--card-background`, `--text-secondary`, `--accent-color`, `--surface-secondary`, `--surface-color`, `--panel-bg`) | giữ NGUYÊN tên và giá trị (Phương án A); test kiểm từng giá trị và từng alias |
| TOKEN MỚI, ĐANG DÙNG | 20 token. Phase 1: `--font-ui` (`'Be Vietnam Pro', system-ui, sans-serif`, font nền của `:root`), `--font-mono` (`'JetBrains Mono', ui-monospace, monospace`, đúng 7 chỗ font mã). Phase 2: 18 token áp vào sidebar, tooltip và nút chính (danh sách ở mục Sidebar) | mỗi token phải có ít nhất một luật tham chiếu (test) |
| TOKEN MỚI, CHƯA ĐƯỢC DÙNG | 18 token còn lại sau Phase 2 (Phase 1 định nghĩa 34, Phase 2 áp 16): `--bg`, `--surface`, `--purple-soft`, `--blue`, `--success`, `--border-control`, `--fs-base/lg/xl/display`, `--space-5/8/10/12`, `--radius-md/lg/pill`, `--glow-purple` | chỉ ĐỊNH NGHĨA; không luật nào được tham chiếu (test bắt nếu áp, ngưỡng >= 18) |

Bảng nền mới tồn tại SONG SONG với token cũ (`--bg` ứng với `--background`, `--surface` với `--panel`, `--surface-raised` với `--panel-hover`,
`--purple-strong` với `--purple-dark`), dễ nhầm; việc chuyển `--border` sang #2A2A3D và `--text-muted` sang #9CA2BA để PR riêng (Phase 2 không đổi giá trị toàn cục). `--shadow-card` (nay dùng cho tooltip) và `--glow-purple`
là giá trị tạm do Phase 1 tự chọn, test chốt cứng.

**Tương phản** (tính từ token thật, 29 cặp trong test): chữ trắng trên `--purple` (#9B82FF) chỉ **2,99:1, bị cấm**; chữ trắng chỉ trên `--purple-strong` (5,31)
hoặc `--purple-pressed` (6,84), chữ tối `--bg` trên `--purple` (6,56). `--border-control` đạt 3,58:1 trên `--surface` (viền ô nhập hiện tại chỉ 1,33:1, chưa nâng).
Ngoại lệ từng có (`.dashboard-primary-button`) đã sửa ở Phase 2 (nền `--purple-strong`); danh sách `WHITE_ON_PURPLE_KNOWN` trong test giờ rỗng và phải khớp
chính xác (thêm vi phạm mới làm test đỏ).

**Font tự host** (`public/fonts`, 10 woff2 = 172.912 B, ngưỡng 175 kB; không còn `@import` hay yêu cầu tới `fonts.googleapis.com`/`fonts.gstatic.com`):
- 10 `@font-face` ở đầu `style.css`, `font-display: swap`, `src: url('/fonts/...') format('woff2')`. Đường dẫn `/fonts/...` tuyệt đối vì `public/` được phục vụ ở gốc
  (dev và build, không có `vite.config`). `unicode-range` lấy từ css gốc của Google nên trình duyệt chỉ tải subset thật sự dùng.
- Be Vietnam Pro: 8 file tĩnh `be-vietnam-pro-{latin,vietnamese}-{400,500,600,700}.woff2`. JetBrains Mono: 2 file **biến thiên** (trục `wght` 400..800)
  `jetbrains-mono-{latin,vietnamese}-variable.woff2`, khai báo `font-weight: 400 800` (test đọc bảng `fvar` của woff2 để chống đặt tên "variable" cho font tĩnh).
- Chỉ có hai subset latin và vietnamese. Ký hiệu ngoài range (→ ∅ Θ ▶) rơi về font hệ thống; đo 2026-11-06 (Chrome 152, Windows): → ∅ Θ về Consolas, ▶ về Segoe UI Symbol.
  Chữ và số của mọi phần tử font mã đều là JetBrains Mono tự host (`isCustomFont = true`).
- `index.html` preload đúng MỘT face: `be-vietnam-pro-latin-400.woff2`. Đo (mạng giả lập 1,6 Mbps, trễ 150 ms, 5 lần mỗi ứng viên, bằng chứng yếu): face này vẽ 59% ký tự
  ở màn Tổng quan và sẵn sàng sớm hơn 947 ms (1554 → 607 ms), đánh đổi FCP chậm thêm khoảng 100 ms.
- Giấy phép SIL OFL kèm theo: `public/fonts/OFL-BeVietnamPro.txt`, `OFL-JetBrainsMono.txt`. Giữ nguyên văn bản, chỉ chuẩn hóa đuôi dòng thành LF. Dòng 21 có khoảng trắng cuối
  là của bản gốc, nên `.gitattributes` (`public/fonts/OFL-*.txt -whitespace`) và `.editorconfig` (mục `[public/fonts/OFL-*.txt]`, `trim_trailing_whitespace = false`)
  miễn trừ RIÊNG hai file này; test canh gác không cho nới ra ngoài. `.gitattributes` có `*.woff2 binary`.
- JetBrains Mono rộng 0,6em mỗi ký tự, so với Consolas 0,5498em (+9,1%) ở bảy chỗ font mã (mã giả, nhãn `[i]` bảng băm, danh sách kề, ma trận kề và bảng mốc BFS/DFS,
  bảng độ phức tạp đồ thị, hàng đợi/thứ tự thăm, ngăn xếp DFS). Đo trước/sau (Chrome 152, Windows): R12 (chuỗi chaining 14 và 15 khóa ở 1280px) không đổi; R10 (bảng DFS ở 360px)
  bảng 257px bằng khung, không ô xuống dòng, khe nhỏ nhất giữa chữ các ô 12,98 → 11 px (360px) và 13,91 → 11,92 px (1280px), cao ô 17–19 → 19–21 px.

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
- `tests/helpers/app-dom.js`: `withFullApp(run, { storage, matchMedia, now })` dựng toàn bộ app như `main.js` (mọi `init*` kể cả `initSidebar`, `initProgress`, `initProgressView` và `initDashboardProgress`, scheduler giả; `storage` inject cho tiến độ, `matchMedia` giả từ `tests/helpers/fake-media.js` cho drawer; `run` nhận thêm `sidebar`) và `SCREENS` mở 16 màn hình thật bằng click (thêm `progress`; `options.now` inject đồng hồ cho `initProgress`); dùng cho test
  nhìn cả trang (landmark, heading, vùng cuộn). Test của một module vẫn dùng helper riêng.
- `deepFreeze` để bắt sửa nhầm snapshot: `tests/helpers/deep-freeze.js`, dùng ở 8 file test graph/hash; BST, Sorting, Searching chưa dùng.
- Chốt an toàn số bước (`src/algorithms/stepLimit.js`): 7 generator có vòng `while` (BFS, DFS, Binary Search, BST Search, Insert,
  Delete, Min/Max) export `*StepLimit` và gọi `assertWithinStepLimit` ở đầu mỗi vòng; vượt giới hạn ném RangeError. Giới hạn:
  BFS 2V + D + 2 / 2V + V² + 2, DFS 3V + D / 3V + V², Binary ⌊log2 n⌋ + 3, BST Search/Delete/MinMax n + 2, Insert max(2, 2n + 1).
  Test: `tests/step-limit.test.js`, `graph-step-limit`, `bst-step-limit`, `binary-search-step-limit` (đầu vào xấu nhất đúng bằng giới hạn).
- Test canh gác ở `tests/meta/`: `no-dom-in-equal` (phần tử DOM trong `assert.equal`…), `no-happy-dom-abort` (dọn cửa sổ bằng `close()`),
  `progress-storage-boundary` (`localStorage` chỉ ở `progress-init.js`; `progress-store.js` không nhắc `document`/`window`; không chữ "completed"/"hoàn thành" trong hai file tiến độ; `main.js` gọi `initProgress` sau `initNavigation`; `progress-view.js` không chạm kho trình duyệt và không có chữ cấm kể cả trong comment).
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
