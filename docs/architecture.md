# Kiến trúc AlgoVision

Tài liệu tra cứu chi tiết cho người (và Claude Code) sửa một module. Tổng quan ngắn nằm trong `CLAUDE.md`.
Dẫn chứng `file:dòng` ở phần module lịch sử được ghi nhận theo các lần đối chiếu nêu tại từng mục; các mô tả Sidebar/Visualizer cập nhật theo `main` tại merge R6c `e23b560` (PR #42). Khi sửa code làm lệch dòng hoặc hành vi, cập nhật dẫn chứng tương ứng.
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
| Điều hướng | `src/navigation.js:36-44,70-80,158-167` | Thẻ `data-structure-target="x"` mở `#x-section` (suy ra lúc init, thêm cấu trúc mới không cần sửa navigation; thẻ không có section thì click bị bỏ qua); phát `algovision:viewchange` (`detail: { page, topic }`) khi đổi trang hoặc mở/đóng màn hình chi tiết. `topic` là id chi tiết hoặc `null`; Sidebar đọc `topic` từ R6c, module mô phỏng dùng sự kiện để tạm dừng khi bị ẩn. |

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
  `{ load, run, pause, next, previous, seek, reset, getSnapshot }`; `getSnapshot()` → `{ state, stepIndex, stepCount, step, controls }`;
  `getControlState(state, stepIndex)` (`simulation-controller.js:10`) là hàm thuần. Một `timerId` duy nhất, chuỗi `setTimeout`,
  đọc `getDelay()` ở mỗi tick, mọi đường dừng qua `stopTimer()`.
- `seek(index)` (quyết định 28): kẹp chỉ số vào [0, số bước - 1], bỏ qua đầu vào mà `parseFloat` cho NaN (không phải số, `null`, chuỗi rỗng, boolean, mảng rỗng, đối tượng) hoặc khi chưa có bước, cắt phần thập phân;
  luôn dừng phát (hủy timer) rồi `paused`, tới bước cuối thì `completed`; đúng một `onChange` nên mỗi vùng `aria-live` cập nhật một lần
  và các bước bị nhảy qua không được vẽ; cùng chỉ số mà không đang phát thì không notify. Dựa vào việc bộ vẽ của Sorting, Searching,
  BST, Hash Table, Graph là hàm thuần của `snapshot.step` (khóa bởi `tests/controller-seek-render-purity.test.js`): module mới phải giữ tính chất này.
  Giới hạn của test đó: so `innerHTML` của khu vực visualizer giữa đường tiến và đường lùi ở các bước giữa; không thấy thuộc tính JS
  (`value`, `scrollTop`), phần tử ngoài khu vực, bước cuối, và không mô phỏng cú nhảy nhiều bước (phần đó do `tests/controller-seek-jump.test.js` của R6a làm).
  Từ R6a thanh trượt bước (`src/step-tools.js`) gọi `seek`; `tests/controller-seek-jump.test.js` chứng minh nhảy nhiều bước thật cho DOM giống hệt đi từng bước ở cả 5 module.
- Thanh bước dùng chung (`src/step-tools.js`, R6a): `createStepTools(root, { seek })` → `{ sync({ stepIndex, stepCount }), getDelay() }`. `root` là khối `[data-step-tools]` trong template của từng màn hình: `input[type=range][data-step-slider]` (min 0, max = số bước - 1, khóa khi chưa có bước, `aria-valuetext` "Bước x/y" với x = chỉ số + 1), `[data-step-label]` (aria-hidden, chỉ để nhìn), `[role=radiogroup]` tốc độ gồm 4 radio thật. `getDelay()` = `BASE_DELAY / hệ số` (đọc ở mỗi tick); BASE_DELAY = 650 ms (chuẩn hóa từ 650/600/700 cũ). Sắp xếp luôn có mảng sau khi mở nên thanh trượt mở sẵn; Tìm kiếm chỉ có bước sau lần Next/Run đầu. Hàm vẽ của mỗi module gọi `sync` TRƯỚC khi thoát sớm vì không có bước.
- Panel accordion (R6b): mỗi màn hình Sắp xếp, Tìm kiếm, BST, Bảng băm, Đồ thị có ba `<details class="panel-accordion" open>` theo thứ tự Mã giả, Độ phức tạp, Kiến thức (`<summary>` là con đầu); mặc định mở. Sắp xếp và Tìm kiếm rút khối mã giả (`#learning-pseudocode`, `#search-learning-pseudocode`) khỏi khối Kiến thức; BST, Bảng băm, Đồ thị bọc khối mã giả sẵn có. Vùng `aria-live` giải thích bước (`#simulation-message`, `#search-message`, `#bst-message`, `#hash-table-message`, `#graph-message`) nằm ngoài mọi accordion vì vùng live trong `<details>` đóng không được đọc (`tests/panel-accordion.test.js` khóa). Không có bố cục hai cột (panel phải 380/340 px): backlog.
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
- Landmark: hai `<nav>`: `aria-label="Điều hướng chính"` trong `<aside id="sidebar">` (xem mục Sidebar) và `aria-label="Đường dẫn trang"` (breadcrumb) trong `header.topbar`; `aria-current="page"` đúng một phần tử ở sidebar và đúng một ở mục cuối breadcrumb.
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

## Tiến độ học tập (đã gỡ)

Spec v1.0 mục 16–17: sản phẩm không theo dõi tiến độ cá nhân. PR `chore/remove-learning-progress` (số PR ghi sau) gỡ kho `localStorage`, trang "Tiến độ học tập", khối tiến độ và nút hero theo ngữ cảnh
ở Dashboard, nhãn Đã mở/Chưa mở trên thẻ thư viện. `tests/progress-removed.test.js` canh gác các định danh cũ; `tests/meta/no-web-storage.test.js` canh việc không file nào trong `src` dùng kho của trình duyệt.
Khóa `algovision:progress` đã ghi trong trình duyệt người dùng trước đó không bị xóa chủ động (xem `docs/backlog.md`). Lịch sử thiết kế cũ: `docs/roadmap.md` (giai đoạn 8, Phase 3b).

### Thẻ thư viện (Redesign Phase 4)

- **Thẻ thuật toán** (`.algorithm-card`, Sắp xếp và Tìm kiếm): pill độ khó (nhãn CƠ BẢN / TRUNG BÌNH giữ nguyên), `<h4>`, mô tả, hai hàng `.card-metric` "Thời gian (xấu nhất)" và "Bộ nhớ" viết tĩnh trong `app.html`,
  rồi `.card-status` chứa `.card-link` "Trực quan hóa →". Hai hàng độ phức tạp phải khớp bảng Learning Panel của cùng thuật toán (`tests/library-cards.test.js` đối chiếu).
  Thư viện Sắp xếp có id `#sorting-algorithm-library` (cùng kiểu `#search-algorithm-library`) và vẫn giữ class `.algorithm-section`; `navigation.js` tìm theo id.
- **Thẻ cấu trúc** (`button.structure-card`): cùng khung, KHÔNG pill độ khó, KHÔNG hàng Thời gian/Bộ nhớ; có `.card-status` với `.structure-card-link.card-link`. Giữ `.structure-card-icon|title|description|link`
  (`.structure-card-title` là nguồn nhãn của sidebar và breadcrumb). CSS của thẻ cấu trúc gom selector vào luật thẻ thuật toán; luật riêng chỉ còn lưới 2 cột, căn trái biểu tượng, `:focus-visible` (dùng chung `.back-button`) và 1 cột ở <= 700px.
- Test: `tests/library-ids.test.js`, `library-cards.test.js`, `library-structure-cards.test.js`. Phần trạng thái Đã mở/Chưa mở của Phase 4 (`library-status.js`) đã gỡ theo Spec v1.0.


## Sidebar: nhóm, mục con, thu gọn, drawer (Redesign Phase 2, cập nhật ở R3)

**Cập nhật R3 (`feat/app-shell`):** điểm gãy của shell theo Spec mục 11: Mobile <= 767px (drawer), Tablet và Laptop 768–1279px (rail 72px TỰ ĐỘNG), Desktop >= 1280px (mở rộng, thu gọn bằng tay). `sidebar.js` export `DRAWER_BREAKPOINT = 767` và `RAIL_RANGE = { min: 768, max: 1279 }`; trạng thái thu gọn HIỆU LỰC = thu gọn bằng tay (nhớ trong bộ nhớ) HOẶC đang ở dải rail; nút thu gọn bị ẩn trong dải rail (CSS ẩn `.sidebar-footer`) và nếu đang giữ focus lúc bước vào rail thì focus chuyển sang mục điều hướng đang mở. Chỉ luật shell dùng 767/768; các khối `max-width: 700px` còn lại là bố cục nội dung và chưa đổi. Thêm nhãn gốc `p.nav-root-label` "HỌC TẬP" (tím nhấn, có đường kẻ chân, khác kiểu nhãn nhóm) ở đầu vùng cuộn. Breadcrumb nằm trong `<nav aria-label="Đường dẫn trang">`, gốc "AlgoVision", mục cuối `aria-current="page"`. Header 72px (mobile 64px, không ô tìm kiếm), mục nav cao 44px bo 10px (`--av-radius-control`), icon 20px, drawer `min(300px, 86vw)` dưới thanh trên 64px, lớp phủ `rgba(5, 5, 10, 0.72)`, tooltip nền `--av-text` chữ `--av-bg`. Test: `sidebar-rail.test.js` (19), `fake-media.test.js` (5; `fake-media.js` giả BỀ RỘNG và `app-dom.js` mặc định 1280px). Các dòng bên dưới ghi giá trị trước R3 ở chỗ nào lệch (700/701px, 56px, 288px, 40/36px); khi mâu thuẫn, CSS, `sidebar.js` và test là chuẩn.

Test: `tests/sidebar-structure.test.js` (DOM), `sidebar-navigation.test.js` (viewchange, aria-current), `sidebar-collapse-drawer.test.js`
(thu gọn, tooltip, drawer; `matchMedia` giả ở `tests/helpers/fake-media.js`), `sidebar-css.test.js` (CSS thật: tương phản, kích thước, luật drawer, ngân sách bề rộng).
Tổng 185 test cho bốn file trên (đo 2026-11-07; nhiều test sinh từ bảng).

**HTML** (`public/templates/app.html`): `a.skip-link` rồi `.app-layout` gồm `.mobile-bar` (nút `#sidebar-toggle`: `aria-expanded`, `aria-controls="sidebar"`; chỉ hiện <= 700px),
`aside.sidebar#sidebar`, `.sidebar-overlay` (`aria-hidden`), `main`. Thứ tự Tab: skip link, nút menu, sidebar, nội dung. Trong aside: `.brand` (h1 "AlgoVision"), rồi
`<nav class="sidebar-nav" aria-label="Điều hướng chính">` chứa `div.sidebar-scroll[role="group"][aria-label="Danh sách mục điều hướng"]` (vùng cuộn thứ 21), rồi `.sidebar-footer`
với nút thu gọn `#sidebar-collapse` (ngoài `<nav>`). Trong vùng cuộn: Tổng quan (`ul > li > button.nav-item[data-page]`), nhãn nhóm `p.section-label#nav-group-*` và `ul[aria-labelledby]`
cho THUẬT TOÁN (Sắp xếp, Tìm kiếm) và CẤU TRÚC DỮ LIỆU ("Tất cả cấu trúc" + `ul.nav-sublist#structure-nav-list`). Mọi nút có `type="button"`; nhãn nằm trong `.nav-label`, icon
`.nav-icon[aria-hidden]`. Khối "PHIÊN BẢN 0.1.0" đã bỏ (không phải dữ liệu thật). `.topbar` trong `<main>` có breadcrumb động (chữ, mục cuối đậm) do `renderTopbar()` của `navigation.js` cập nhật cùng `document.title` mỗi lần `notifyViewChange`; icon là sprite SVG tự vẽ ở đầu template (`<symbol id="icon-...">`).

**`src/navigation.js`**
- `openStructure(target)` (dùng chung cho thẻ ở thư viện và mục con): ẩn thư viện, hiện `#<target>-section`, đặt `currentStructure`, cập nhật điều hướng, phát ĐÚNG MỘT viewchange
  `{ page: 'structures', topic: 'structure:<tên>' }`; trả `false` (không phát gì) nếu không có section.
- `renderStructureNav()` sinh mục con từ `[data-structure-target]` lúc init (nhãn từ `.structure-card-title`, icon là symbol SVG `icon-structure-<tên>`); thẻ không có section thì không có mục con.
  Mục con dùng `data-structure-nav` và class `nav-subitem`, KHÔNG dùng `data-structure-target` (thuộc tính của thẻ; mục con sinh từ các thẻ đó) và KHÔNG dùng class `nav-item`
  (nhiều test lấy `.nav-item[data-page="structures"]` đầu tiên).
- Mục con từ trang khác gọi `renderPage('structures')` (không phát sự kiện) rồi `openStructure`, nên chỉ có một viewchange và không có sự kiện topic null xen giữa.
- `updateNavigation()`: `.nav-item` của trang hiện tại có class `active`; ở chi tiết cấu trúc, mục con cũng `active`. `aria-current="page"` chỉ nằm trên ĐÚNG MỘT phần tử: mục con khi đang ở
  chi tiết cấu trúc (mục cha vẫn `active` nhưng không có `aria-current`), ngược lại là `.nav-item` của trang. `renderPage` đặt lại `currentStructure = null`.

| Kịch bản | viewchange |
|---|---|
| Bấm thẻ cấu trúc ở thư viện | 1 × `{structures, structure:x}` (như trước) |
| Mục con khi đang ở thư viện, hoặc ở chi tiết cấu trúc khác | 1 × `{structures, structure:x}`, không có null xen giữa |
| Mục con từ Tổng quan, Sắp xếp (kể cả đang chạy), Tìm kiếm | 1 × `{structures, structure:x}`; mô phỏng đã tạm dừng |
| Bấm lại mục con của cấu trúc đang mở | 0 (drawer vẫn đóng ở mobile) |
| Quay lại (`data-back-to-structures`) | 1 × `{structures, null}` (như trước); mục cha có `aria-current` |
| `.nav-item` (kể cả "Tất cả cấu trúc") | 1 × `{page, null}` (như trước) |

**`src/sidebar.js`** — `initSidebar(document, { matchMedia } = {})`, gọi SAU `initNavigation` (mục con do navigation sinh) (`main.js`, `withFullApp`);
`export const DRAWER_BREAKPOINT = 767` phải bằng `@media (max-width: 767px)` của luật drawer (test so hai nơi; R3: trước là 700). Trả về `{ toggleCollapse, isCollapsed, isAutoCollapsed, openDrawer, closeDrawer, toggleDrawer, isDrawerOpen }`.
Trạng thái (`collapsed`, `drawerOpen`) chỉ nằm trong bộ nhớ của phiên: file này không nhắc `localStorage`, `sessionStorage`, cookie, `indexedDB` (`tests/meta/no-web-storage.test.js` đọc mã nguồn: không file nào trong `src` dùng kho của trình duyệt).
- Thu gọn (>= 768px; bằng tay từ 1280px, tự động ở 768–1279px): nút `#sidebar-collapse` đổi class `is-sidebar-collapsed` trên `.app-layout`, `aria-expanded` và nhãn "Thu gọn thanh bên" <-> "Mở rộng thanh bên". R6c bổ sung thu gọn tự động khi vào màn chi tiết Visualizer ở >=1280px nếu Sidebar trước đó đang mở. Khi rời màn chi tiết, trạng thái ban đầu được khôi phục; nếu người dùng bấm nút trong Visualizer, lựa chọn thủ công mới được giữ và không bị trạng thái tự động ghi đè. Chuyển topic Visualizer sang topic Visualizer khác không được xem là rời màn. Trạng thái thủ công/tự động chỉ ở bộ nhớ của lần chạy app, không dùng storage. CSS chỉ trong
  `@media (min-width: 768px)`: sidebar rộng `--sidebar-width-collapsed` (72px), `.main-content` `margin-left: 72px` (luật riêng, không đụng luật `.main-content` mà test R12 đọc). Nhãn mục, chữ logo
  (`.brand-text`, chứa h1) và nhãn nhóm ẩn bằng clip kiểu sr-only (`position: absolute; 1px; overflow: hidden; clip-path: inset(50%)`), KHÔNG `display: none`: tên truy cập, h1 và nhãn nhóm vẫn có trong cây
  trợ năng. Nhãn nhóm thành đường kẻ; mục active giữ vạch tím và `aria-current`.
- Tooltip khi thu gọn: MỘT phần tử `.sidebar-tooltip` (`aria-hidden`, `position: fixed`, `pointer-events: none`) do JS đặt `left`/`top` theo mép phải sidebar. Không dùng `::after` trên từng nút vì
  `.sidebar-scroll` (overflow-y: auto kéo theo overflow-x: auto) cắt tooltip nằm trong nút. Hiện khi rê chuột hoặc focus bàn phím (`:focus-visible`), tắt khi rời, khi Escape và khi mở rộng lại.
  Tên truy cập luôn là chữ thật trong `.nav-label`; tooltip chỉ là phần phụ.
- Drawer (<= 767px): đóng sẵn bằng `visibility: hidden` + `transform: translateX(-100%)` (transition `visibility 0s 200ms` để trượt xong mới ẩn), nên 0 phần tử focus được trong sidebar; chỉ `.brand`
  được `visibility: visible` riêng để h1 còn trong cây trợ năng. Cao `calc(100vh - 64px)` rồi `calc(100dvh - 64px)` (dự phòng), nằm dưới thanh trên 64px (`top: 64px`) để nút menu vẫn bấm được.
  Mở (chỉ khi `matchMedia` hẹp): class `is-open` trên sidebar và lớp phủ, `aria-expanded`/nhãn của nút menu, `#main-content` và `.skip-link` thành `inert`, focus vào `.nav-item` đầu tiên. Không `role="dialog"`,
  không bẫy focus. Đóng bằng nút menu, lớp phủ, Escape, hoặc chọn một mục (kể cả bấm lại mục con đang mở): trả focus về nút menu; riêng khi cửa sổ rộng ra qua 767px thì đóng mà KHÔNG kéo focus.
  Nút menu dùng symbol SVG `icon-menu` và không đổi hình khi mở; khi drawer mở `<body>` có class `is-drawer-open` (khóa cuộn nền, giữ chỗ thanh cuộn). `prefers-reduced-motion` dùng luật chung sẵn có (`transition-duration: 0.01ms !important`).

**Token đang dùng cho sidebar** (nhóm `TOKEN MỚI, ĐANG DÙNG`, 16 token sau R3; chỉ trong luật của sidebar/tooltip/nút chính, `tests/sidebar-css.test.js` canh gác không cho cỡ chữ/spacing/bo góc lan ra ngoài):
`--font-ui`, `--font-mono`; `--sidebar-width` (256px), `--sidebar-width-collapsed` (72px); `--purple-strong`, `--purple-pressed` (nút chính, hẹn gỡ R4); `--fs-xs/sm/md`, `--space-1/2/3/4/6`, `--radius-sm`, `--shadow-card` (tooltip). Màu của sidebar dùng thẳng `--av-*` (R3 đã gỡ `--bg-sidebar`, `--surface-raised`, `--text-label`, `--purple-hover`, `--purple-active`).

**Ngân sách bề rộng**: sidebar 256px + `padding: 0 40px` của `.main-content` cho khung bảng băm ở 1280px nội dung rộng 861px (`1280 - 15 - 256 - 2×40 - 2×(24+1) - 2×(1+8)`; trước: 250 + 46 cho 855px).
Chuỗi chaining 15 khóa rộng 842px còn dư 19px; sidebar tối đa 263px nếu giữ padding 46px. `.main-content` PHẢI viết `margin-left` và `padding` bằng số trực tiếp (không `var()`/`calc()`):
`tests/hash-table-layout.test.js` đọc style.css bằng regex và ném lỗi nếu khai báo khác dạng; `tests/sidebar-css.test.js` khẳng định 256 = `--sidebar-width`, 72 = `--sidebar-width-collapsed`, cả hai là bội số của 4.
Đo CDP (Chrome 152, Windows, 2026-11-06): khung 871 -> 877px (nội dung 861px), tràn 0.

**Tương phản** (các cặp Sidebar dưới đây được khóa bởi test token): nhãn nhóm `--av-text-subtle` trên `--av-sidebar` 4,74+; mục active `--av-nav-active-text` trên nền pill `--av-nav-active-bg` (hiện ra `#251C3E`) 11,51; vạch 3px `--av-primary-text` trên pill 5,87;
nút "Mở trực quan hóa" và "Thử lại" (class `dashboard-primary-button`) chữ trắng trên `--av-primary` 5,70, hover `--av-primary-hover` 7,10.

**Tương phản Visualizer (R6c)**: chữ thường cần đạt >= 4,5:1; đường viền/trạng thái đồ họa cần >= 3:1 khi tiêu chí phi văn bản áp dụng. `tests/visualizer-contrast.test.js` tính các cặp đã chọn từ khai báo CSS và token thật: trạng thái Searching (đang xét/tìm thấy/đã kiểm tra/đã loại bỏ), placeholder Array, nút chính bình thường/hover, dấu ✓ Graph, nhãn Queue và một số chỉ báo của Sorting/BST/Graph. Test này chỉ bảo vệ các cặp/selector liệt kê, không chứng minh toàn bộ ứng dụng đạt WCAG 2.1 AA; màu cần đánh giá trên nền thực tế, không suy ra đạt chuẩn chỉ từ opacity.

**Thư viện** (R5a, `public/templates/app.html`, `src/navigation.js`): `#structure-panel` (`#structure-library`) và `#algorithm-panel` (`#sorting-algorithm-library`, `#search-algorithm-library`, `#graph-algorithm-library`) là hai `role="tabpanel"` do thanh tab `.library-tabs` điều khiển. Trang `algorithms` (trang thứ năm của `pages`, không có mục sidebar) hiện cả ba section thuật toán; panel ẩn khi mọi section con ẩn (`renderTopbar` đồng bộ cả thanh tab: `aria-selected`, roving `tabindex`). Thẻ BFS/DFS là `button.algorithm-card[data-dashboard-open]` không có `data-algorithm` (selector đó thuộc nút Sắp xếp) và không có độ khó/chỉ số (D12). `libraryOrigin` (xóa ở `renderPage` và `openStructure`) nhớ nơi mở chi tiết để "Quay lại" về trang Giải thuật. Test: `tests/library-panels.test.js`, `library-algorithms.test.js`, `library-tabs.test.js`, `library-css.test.js`.

**Thẻ thuật toán** (R5c, `public/templates/app.html`): badge `.difficulty.easy|medium` gồm `.visually-hidden` "Độ khó: ", `.difficulty-symbol[aria-hidden]` (● hoặc ◐) và chữ hiển thị (CƠ BẢN, TRUNG BÌNH); ○ (Khó) chưa dùng. Thanh `.complexity-bar[aria-hidden]` gồm 5 `span` (`.on` = đoạn đầy) nằm cuối `.card-footer` của 5 thẻ thuật toán thư viện; bậc: O(1)=1, O(log n)=2, O(n)=3, O(n log n)=4, O(n²)=5, `tests/library-complexity-bar.test.js` khóa số đoạn với chữ O hiển thị. `.library-legend` (ghi chú) nằm trong `.library-filters` với `data-tab="algorithms"`: `library-filter.js` dùng chung một cơ chế `[data-tab]` để hiện nhóm chip và ghi chú theo tab. Test: `tests/library-difficulty.test.js`, `library-complexity-bar.test.js`, `library-card-css.test.js`.

**Lọc thư viện** (R5b, `src/library-filter.js`): `initLibraryFilter(document)` nghe `algovision:viewchange` (đọc `detail.page`; `navigation.js` cập nhật `.library-tabs.hidden` trước khi phát sự kiện, module dựa vào thứ tự đó). Chỉ khi trang là `structures` hoặc `algorithms` và thanh tab đang hiện: ô tìm (`normalize`: hạ chữ thường, bỏ dấu, `đ` -> `d`, gộp khoảng trắng kể cả xuống dòng của template thành một dấu cách; khớp tiêu đề và mô tả của thẻ, KHÔNG khớp nhãn "Trực quan hóa" hay Big-O) AND chip phân loại (`data-category` trên 14 thẻ) ẩn thẻ bằng `hidden`, section hết thẻ ẩn bằng class `.is-filtered-out` (không dùng `hidden` của section vì `navigation.js` quản lý), bộ đếm "Hiển thị N mục" (`role="status"`), trạng thái rỗng có nút "Xóa bộ lọc". Ở mọi nơi khác (Dashboard, Sắp xếp, Tìm kiếm, màn chi tiết) `showAll()` hiện lại mọi thẻ vì các thẻ này cũng nằm trong thư viện riêng. Chip nhớ riêng từng tab, chuỗi tìm dùng chung, chỉ trong bộ nhớ. Test: `tests/library-categories.test.js`, `library-filter.test.js`, `library-filter-css.test.js`.

**Dashboard** (R4, `public/templates/app.html` `#dashboard-section`, CSS `.dashboard-*`): ba khối. Hero (h2 "Nhìn thấy thuật toán chạy từng bước.", nút chính mở Bubble Sort, nút viền "Xem thư viện" viền `--border-control`, bảng SVG tĩnh Bubble Sort bước 3/31 gắn nhãn "Minh họa"; `tests/dashboard-demo.test.js` khóa mảng, chiều cao cột, cột đổi chỗ và số bước với `generateBubbleSortSteps([5,3,8,1,6,2])`; ẩn ở <= 700 px). Nội dung nổi bật (3 `button.dashboard-card`: Bubble Sort, Binary Search trùng chữ/độ khó/Big-O với thẻ thư viện, BFS không badge độ khó; `tests/dashboard-featured.test.js`). Truy cập nhanh (7 chip cấu trúc khớp 7 thẻ thư viện, 2 chip giải thuật; nhóm giải thuật ẩn ở <= 700 px). `navigation.js` có `openTopic(spec)` cho `data-dashboard-open="<loại>:<tên>[:<thao tác>]"` (`sorting:bubble`, `searching:binary`, `structure:graph:bfs`): đi qua thẻ thư viện / mục con có sẵn nên mỗi lần mở chỉ phát MỘT `viewchange`; thao tác của cấu trúc đặt bằng `#<tên>-operation` + sự kiện `change` (`tests/dashboard-open.test.js`). Luật `.dashboard-grid` 1 cột ở <= 900 px phải đứng SAU luật gốc của nó trong file CSS.

**Kích thước** (R3): mục chính và mục con cao tối thiểu 44px, bo 10px; nút menu 44×44px; thanh trên mobile 64px; header desktop 72px. (Trước R3: 40/36px, 56px.)

## Token thiết kế và font tự host (Redesign Phase 1, cập nhật ở R2)

**Cập nhật R2 (`feat/design-tokens`):** `:root` có thêm khối `--av-*` đứng TRƯỚC nhóm CŨ (comment `=== TOKEN --av-* ===`): 21 màu Spec mục 2, `--av-nav-active-text` (`#DDD6FE`), `--av-space-1…8` (4/8/12/16/24/32/48/64) và 11 token cỡ chữ `--av-fs-*` (display 40, hero 34, page 28, h2 24, h3 18, card 16, body 15, body-sm 14, caption 13, label 12, code 14; tên do R2 chọn vì Spec không đặt tên). Test `tests/av-tokens.test.js` (55 test) khóa tên và giá trị. Luật `:focus-visible` chung (2px `--av-focus`, offset 2px) đứng ngay sau `button:focus-visible`, độ ưu tiên thấp nhất: phủ select, input, textarea, `[tabindex]`, `pre` và vùng cuộn Chrome tự cho focus; `.main-content:focus` và `.array-operation-card input` (`outline: none`) vẫn thắng nhờ đứng sau (test canh thứ tự).
Các token Phase 1/2 còn 14 alias tạm trỏ vào `--av-*` sau R6c (mỗi alias có chú thích "tạm, gỡ ở R?"; `tests/design-tokens.test.js` đếm). `--purple` đã gỡ ở R6b: chữ/canvas dùng token theo vai trò (`--av-primary-text`, `--av-primary-line`, `--av-focus`). `--border-control` thuộc nhóm MỚI, ĐANG DÙNG; nhóm CHƯA ĐƯỢC DÙNG rỗng. Nền mềm nav là `--av-nav-active-bg` (`rgba(139, 92, 246, 0.18)`); alias `--purple-active` đã gỡ ở R3. Không còn hex trùng giá trị Spec đã có token ngoài `:root` (test canh; ngoại lệ `#fca5a5`, `#60a5fa` có lý do). Các đoạn dưới đây mô tả Phase 1/2 và giá trị cũ; khi mâu thuẫn, `:root` và test là chuẩn.

Phase 1 thêm nền móng (token trong `:root`, font tự host, gom hex khớp token); R2 và R3 chuyển nguồn giá trị sang khối `--av-*`. Test: `tests/av-tokens.test.js` (khối `--av-*` khớp Spec, token cỡ chữ,
luật cỡ chữ đã áp), `tests/design-tokens.test.js` (nhóm token, alias, tương phản, hex trùng Spec, vòng focus) và hai helper `tests/helpers/contrast.js` (tỉ lệ WCAG, có test riêng) và
`tests/helpers/css-tokens.js` (parser nhỏ đọc `:root`, `@font-face`, `@import`, khai báo của từng luật). Mọi giá trị đọc từ `style.css`.

**Các nhóm token trong `:root` sau R3** (comment `=== TOKEN --av-* ===`, `=== TOKEN CŨ ===`, `=== TOKEN MỚI, ĐANG DÙNG ===`, `=== TOKEN MỚI, CHƯA ĐƯỢC DÙNG ===`; test kiểm mỗi token nằm đúng nhóm):

| Nhóm | Token | Quy tắc |
|---|---|---|
| TOKEN --av-* | 21 màu Spec mục 2, `--av-nav-active-text`, `--av-nav-active-bg`, `--av-radius-control`, `--av-space-1…8`, 11 token `--av-fs-*` | nguồn giá trị duy nhất; test khóa tên và giá trị, không cho token `--av-*` ngoài danh sách |
| TOKEN CŨ | 18 token: alias tạm trỏ vào `--av-*` (`--background`, `--panel`, `--panel-hover`, `--border`, `--text`, `--muted`, `--text-muted`, `--purple-dark` và 7 alias của alias), `--purple` (giá trị riêng cho canvas), `--state-active`, `--bar-cue` | mỗi alias có chú thích "tạm, gỡ ở R?"; test đếm đúng 18 alias tạm (gồm 2 của nhóm ĐANG DÙNG) |
| TOKEN MỚI, ĐANG DÙNG | 15 token: `--border-control`, `--font-ui`, `--font-mono`, `--sidebar-width(-collapsed)`, `--fs-xs/sm/md`, `--space-1/2/3/4/6`, `--radius-sm`, `--shadow-card` | mỗi token phải có ít nhất một luật tham chiếu (test) |
| TOKEN MỚI, CHƯA ĐƯỢC DÙNG | Rỗng | test xác nhận nhóm này không có khai báo token |

R2 đã xóa `--bg`, `--surface`, `--purple-soft`, `--purple-tint`, `--violet`, `--blue`, `--success`, `--glow-purple` và các token cỡ chữ/spacing/bo góc chưa dùng; R3 gỡ thêm 5 alias sidebar
(`--bg-sidebar`, `--surface-raised`, `--text-label`, `--purple-hover`, `--purple-active`; test có mục "đã gỡ, không còn tham chiếu" cho từng token).

**Tương phản** (tính từ token thật, bảng `PAIRS` trong test): chữ trắng trên `--purple` (#9B82FF) chỉ **2,99:1, bị cấm**; chữ trắng chỉ trên `--av-primary` (5,70) hoặc `--av-primary-hover` (7,10).
`--border-control` đạt 3,61:1 trên `--av-surface-1`. Danh sách `WHITE_ON_PURPLE_KNOWN` trong test rỗng và phải khớp chính xác (thêm vi phạm mới làm test đỏ).

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
- `tests/helpers/app-dom.js`: `withFullApp(run, { matchMedia, title })` dựng toàn bộ app như `main.js` (mọi `init*` kể cả `initSidebar`, scheduler giả; `matchMedia` giả từ `tests/helpers/fake-media.js` cho drawer; `run` nhận thêm `sidebar`) và `SCREENS` mở 15 màn hình thật bằng click; dùng cho test
  nhìn cả trang (landmark, heading, vùng cuộn). Test của một module vẫn dùng helper riêng.
- `deepFreeze` để bắt sửa nhầm snapshot: `tests/helpers/deep-freeze.js`, dùng ở 8 file test graph/hash; BST, Sorting, Searching chưa dùng.
- Chốt an toàn số bước (`src/algorithms/stepLimit.js`): 7 generator có vòng `while` (BFS, DFS, Binary Search, BST Search, Insert,
  Delete, Min/Max) export `*StepLimit` và gọi `assertWithinStepLimit` ở đầu mỗi vòng; vượt giới hạn ném RangeError. Giới hạn:
  BFS 2V + D + 2 / 2V + V² + 2, DFS 3V + D / 3V + V², Binary ⌊log2 n⌋ + 3, BST Search/Delete/MinMax n + 2, Insert max(2, 2n + 1).
  Test: `tests/step-limit.test.js`, `graph-step-limit`, `bst-step-limit`, `binary-search-step-limit` (đầu vào xấu nhất đúng bằng giới hạn).
- Test canh gác ở `tests/meta/`: `no-dom-in-equal` (phần tử DOM trong `assert.equal`…), `no-happy-dom-abort` (dọn cửa sổ bằng `close()`),
  `no-web-storage` (không file nào trong `src` dùng `localStorage`/`sessionStorage`). Ngoài `tests/meta/`: `tests/progress-removed.test.js` (định danh của tiến độ đã gỡ không được quay lại).
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
