# EDU-3C1 — Hồ sơ bằng chứng Hash Table OP-30–32

## 1. Baseline, phạm vi và trạng thái

- BASE `262e0ceb46ad747510d496bbe7fd6136c1069c0d`; TREE `39e5747cecadc51f2bf27b862cb681212cbcb1c6`. Chỉ Insert/Search/Delete × chaining/linear probing. Reuse P0, không audit lại nhóm đã CLOSED.
- **STATIC_SUPPORTED / REVIEW_PENDING** cho đối chiếu source; proof/cost/oracle độc lập là **DRAFT_DERIVATION**, chờ review. Owner cung cấp independent static review PASS cho 6 hàng OP/strategy; không phải lần chạy test, browser hoặc academic acceptance mới.
- Academic acceptance giữ **29/40**; EDU-3 PARTIAL. **RIGHTS_NOT_VERIFIED** cho bên thứ ba, 8 source ID, 40 OP/80 mapping ID, source_status/routing lịch sử giữ nguyên. C1 chỉ thêm hồ sơ và liên kết mục 19 mapping, chưa triển khai C2.
- Định vị [MAP-030–032-I/S](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/docs/education/knowledge-mapping.md#L182-L187) và [release scope](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/docs/release/v1.0.0-scope.md#L112-L114); UIT-SRC-004 chỉ định danh/phạm vi, không chứng minh toàn bộ claim/rights. [Policy B §11](uit-sources.md#11-policy-b-và-quyền-theo-hành-vi--edu-1f) áp dụng theo hành vi.

## 2. Contract và invariants

- Input thuần: key và capacity thỏa Number.isInteger, capacity≥1; hai strategy hợp lệ. Hash h(key)=((key%m)+m)%m hỗ trợ key âm theo mô hình số nguyên còn tính toán chính xác; không tự suy Number.isSafeInteger hoặc resource limit đã enforce. [validation/hash/create](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/structures/hashTable.js#L14-L59).
- Bảng hợp lệ do ADT tạo, không bị caller/Proxy sửa: capacity khớp arrays; chaining có m buckets, probing có m cells empty/occupied/tombstone; key phân biệt, ID live phân biệt, nextId tăng trong cùng lineage khi còn biểu diễn chính xác. Chaining mỗi entry nằm ở h(key); probing mỗi live key còn reachable theo vòng dò trước ô empty đầu tiên. Tombstone không mang live ID.
- Chaining không có cận lý thuyết n≤m: α=n/m có thể >1. Probing n+t≤m, t là số tombstone. Không resize/rehash tự động. appendEntry là primitive, không tự kiểm duplicate; contract uniqueness phải đến insertKey/generator hoặc caller đã kiểm.
- UI riêng giới hạn key 0–99, m∈{5,7,11}, chaining tối đa 15 khóa; không gán giới hạn này cho ADT. Capacity/strategy đổi tạo bảng rỗng mới, không rehash bảng cũ; reset chỉ tua lại simulation. [constants](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/hash-table.js#L34-L38), [validation/commit/reset/switch](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/hash-table.js#L615-L696).
- Snapshot bất biến **theo contract**, không defensive freeze. cloneTable sao entry records; duplicate/full/miss chia sẻ input, các bước scan cũng chia sẻ table. Caller sửa input sau generate có thể làm thay đổi lịch sử; không tuyên bố deep freeze runtime. ID e1… ổn định trong lineage; clear/preset/switch có thể cấp lại từ 1. [clone/list](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/structures/hashTable.js#L63-L97), [insert/remove](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/structures/hashTable.js#L148-L207), [step factory](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/algorithms/hashTableStep.js#L10-L30).
- Một step ứng với dòng mã giả; operation/key không đổi; chỉ bước kết luận finished=true. currentBucket/probedBuckets là chỉ số, currentEntryId/foundEntryId/pathEntryIds là ID. Sau delete không giữ dangling ID đã gỡ; chaining suffix đổi position là hợp lệ, không đổi ID/key còn lại.

## 3. Claim matrix — 6 hàng OP/strategy

Mọi hàng STATIC_SUPPORTED / REVIEW_PENDING / RIGHTS_NOT_VERIFIED. Tiền điều kiện chung ở mục 2; postcondition không làm mất live key khác. Complexity dưới đây là lõi, không thay full API/generator ở mục 6. C=occupied-key comparisons; P=probed slots, kể cả empty/tombstone; S tính cả bước đầu.

| OP / strategy | Contract, invariant và postcondition | Core / bounds | Proof, oracle và locator BASE | Disposition |
|---|---|---|---|---|
| OP-30 chaining | Duyệt bucket h(key), prefix chưa match; duplicate dừng first-match, giữ input/nextId; khóa mới nối cuối với ID mới | Θ(1+C); 0≤C≤ℓ≤n; P=0; S=C+3 | P1/P3; O1/O2/O13; [Insert](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/algorithms/hashTableInsert.js#L21-L68) | KEEP generator; FIX-COPY count/clone |
| OP-31 chaining | Chỉ xét bucket h(key); foundEntryId hoặc null ở bước cuối; không mutation | Θ(1+C), best O(1), worst O(n); S=C+3 | P1/P3; O3/O13; [Search](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/algorithms/hashTableSearch.js#L21-L47) | KEEP; FIX-COPY core/trace |
| OP-32 chaining | Tìm rồi gỡ đúng ID, suffix array đổi position; miss giữ input; foundEntryId/current ID cuối cleared | Search Θ(1+C); abstract unlink O(1) nếu đã có liên kết; API không O(1); S=C+3 | P1/P3/P4; O4/O13; [Delete](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/algorithms/hashTableDelete.js#L22-L64) | KEEP; FIX-COPY vị trí/copy |
| OP-30 probing | Nhớ tombstone đầu, vẫn dò duplicate đến match/empty/hết m; ưu tiên tomb đã nhớ; full chỉ khi không free và không match | Θ(1+P); 0≤C≤P≤m; S=2P+3 | P2/P3; O5/O6/O10–13; [Insert](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/algorithms/hashTableInsert.js#L96-L177) | KEEP; FIX-COPY average/clone |
| OP-31 probing | Prefix chưa match; empty chứng minh miss theo reachability; tombstone không kết luận miss; hết m thì dừng | Θ(1+P); S=2P+3−E, E=1 khi stop-empty | P2/P3; O7/O9/O11–13; [Search](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/algorithms/hashTableSearch.js#L78-L128) | KEEP; FIX-COPY average |
| OP-32 probing | Found thay occupied bằng tombstone, giữ reachability/ID khác; miss giữ input; nextId không giảm | Search Θ(1+P); full API clone Θ(m); S=2P+3−E | P2/P3/P4; O8/O11–13; [Delete](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/algorithms/hashTableDelete.js#L89-L138) | KEEP; FIX-COPY tombstone/average |

## 4. Chứng minh độc lập và termination

**P1 — Chaining.** Hash invariant loại được mọi bucket khác. Trước lần xét p, mọi entry trước p đã so sánh và không bằng key. Match đầu trả đúng ID (uniqueness từ contract); hết bucket thì không có key. Insert absent nối cuối đúng bucket, duplicate không cấp ID. Delete bỏ đúng ID; filter giữ thứ tự và ID các entry còn lại nhưng không giữ vị trí suffix. Vòng for tăng chỉ số đến ℓ hữu hạn, do đó dừng.
**P2 — Probing.** Với start=h(key), j=0..m−1 thăm (start+j)%m: các chỉ số là một hoán vị của m cells nên không bỏ ô, không lặp trước m và dừng hữu hạn. Reachability bảo đảm live key không nằm sau empty đầu tiên theo đường của nó; tombstone phải bỏ qua. Insert nhớ free tombstone nhưng tiếp tục kiểm duplicate; nếu absent, vị trí free trước empty hoặc free đầu khi exhaust không phá reachability. Delete dùng tombstone, không empty, nên đường tìm của khóa khác không bị cắt. Full khi quét đủ m và không empty/tombstone; duplicate trên bảng full vẫn không phải full failure.
**P3 — Counters/steps.** [scanChain](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/algorithms/hashTableStep.js#L35-L72) tạo 1 hash + C compare, generator thêm initial+final: S=C+3. [scanProbes](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/algorithms/hashTableStep.js#L82-L154) tạo hash, P probe, P−E occupied/tombstone steps. Search/Delete thêm initial+final ⇒ S=2P+3−E. Insert tạo thêm empty step nếu E=1 ⇒ S=2P+3. Chỉ occupied tăng C, mọi visited slot tăng P, tombstone không tăng C. Các vòng for đã có cận bucket/capacity, không cần explicit step-limit guard theo [rule](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/.agents/rules/algorithms.md#L21-L25); không suy thiếu guard là bug.
**P4 — Snapshot/ID.** Scan chỉ đọc input; append/remove clone trước ghi. Path/probe arrays trong mỗi step là prefix copy; final delete lọc ID đã gỡ. Vì không ghi input/old step và nextId chỉ tăng khi insert thành công, old snapshots/IDs giữ đúng trong contract. Không phải chứng minh chống caller mutation hoặc ID precision overflow.
**P5 — Average chaining, derivation độc lập.** Với fixed bucket lengths ℓᵢ, Σℓᵢ=n: absent query có home bucket đều và độc lập với bảng ⇒ E[C]=Σℓᵢ/m=n/m=α. Successful query chọn đều trong n live keys, n>0 ⇒ E[C]=Σℓᵢ(ℓᵢ+1)/(2n). Nếu thêm giả định resident hashes độc lập/đều, kỳ vọng trên cách phân bố bảng là 1+(n−1)/(2m), vì mỗi cặp unordered cùng bucket với xác suất 1/m. Core kỳ vọng O(1+α), thành O(1) chỉ khi α bị chặn hằng dưới mô hình đó. key mod m trên dữ liệu cố định hoặc key UI 0–99 không tự bảo đảm mô hình; chi phí API clone không vì thế thành expected O(1).
**P6 — Probing không có average từ α đơn độc.** m=5, không tombstone, absent home chọn đều 0..4. Occupied {0,1}: P=[3,2,1,1,1], E[P]=8/5. Occupied {0,2}: P=[2,1,2,1,1], E[P]=7/5. Cùng n=2, α=2/5, t=0 nhưng khác mean. Đây là enumeration độc lập theo stop-empty, không công thức Knuth. Không suy từ α hoặc (n+t)/m một dự đoán probes; cần distribution của bảng/query và cấu trúc cụm. Worst deterministic P≤m vẫn đúng.

## 5. Literal oracle độc lập — 13 nhóm expected

Đây là số dò tay từ contract, không gọi generator lấy expected, không phải runtime PASS. Fixture T: m=5, chèn lần lượt [4,9,14], IDs e1/e2/e3, nextId=4; chaining bucket4=[4,9,14], probing cells=[9,14,empty,empty,4]. Mỗi vector L dưới đây là toàn bộ pseudocodeLine, null là bước đầu. P chaining luôn 0. Trường không nhắc giữ defaults/contract ở mục 2.

| Nhóm | Input / action | Expected literal |
|---|---|---|
| O1 | T chaining insert19 | C=3, P=0, S=6; L=[null,1,3,3,3,5]; e4 cuối bucket4, nextId=5 |
| O2 | T chaining insert9 duplicate | C=2, S=5; L=[null,1,3,3,4]; foundEntryId=e2, table cùng input, nextId=4 |
| O3 | T chaining search14 / search19 | Hit: C=3,S=6,foundEntryId=e3,L=[null,1,3,3,3,4]; miss: C=3,S=6,foundEntryId=null,L=[null,1,3,3,3,5] |
| O4 | T chaining delete9 | C=2,S=5,L=[null,1,3,3,4]; bucket4=[e1:4,e3:14], e3 position2→1; final pathEntryIds=[e1], currentEntryId/foundEntryId=null; nextId=4 |
| O5 | T probing insert19 | probedBuckets=[4,0,1,2], C=3,P=4,S=11; L=[null,1,3,6,3,6,3,6,3,4,9]; e4 vào slot2, nextId=5 |
| O6 | T probing insert9 duplicate | C=2,P=2,S=7; L=[null,1,3,6,3,6,7]; e2 slot0, table cùng input/nextId |
| O7 | T probing search14 / search19 | Hit: C=P=3,S=9,L=[null,1,3,6,3,6,3,6,7],foundEntryId=e3; miss: C=3,P=4,S=10,L=[null,1,3,6,3,6,3,6,3,4],foundEntryId=null |
| O8 | T probing delete9 | C=P=2,S=7,L=[null,1,3,6,3,6,7]; slot0=tombstone, e2 gỡ, nextId=4, final pathEntryIds=[e1], currentEntryId/foundEntryId=null |
| O9 | Sau O8, probing search14 | C=2,P=3,S=9,L=[null,1,3,6,3,5,3,6,7]; bỏ tombstone0, foundEntryId=e3 |
| O10 | Sau O8, probing insert19 / insert14 | Insert19: C=2,P=4,S=11,L=[null,1,3,6,3,5,3,6,3,4,9]; dò tới empty2 nhưng đặt e4 tại tombstone0,nextId=5. Duplicate14: C=2,P=3,S=9,L=[null,1,3,6,3,5,3,6,7],foundEntryId=e3; không chèn vào tombstone, table cùng input |
| O11 | Probing m3,[0,1,2], key5; duplicate2 | key5 home2 visits[2,0,1]; C=P=3,S=9,L=[null,1,3,6,3,6,3,6,8]: insert full, search/delete miss, table cùng input. Duplicate2: C=P=1,S=5,L=[null,1,3,6,7],e3, không báo full |
| O12 | Probing m3, xóa hết [0,1,2], nextId4, key5 | C=0,P=3,S=9; search/delete L=[null,1,3,5,3,5,3,5,8]; insert L=[null,1,3,5,3,5,3,5,9], e4 slot2,nextId5; không vô hạn dù không empty |
| O13 | Empty / singleton m1 | Empty chaining search/delete: C=0,S=3,L=[null,1,5]; insert: L=[null,1,5],ID=e1. Empty probing search/delete: C=0,P=1,S=4,L=[null,1,3,4]; insert: S=5,L=[null,1,3,4,9]. Full m1 chứa4: duplicate4 C=P=1,S=5,L=[null,1,3,6,7]; search/delete miss9 hoặc insert9 full: final8. Delete4 final7 để tombstone; reuse9 C=0,P=1,S=5,L=[null,1,3,5,9],e2 |

## 6. Mô hình chi phí core / API / generator / retained trace

Mô hình mỗi key/ID/ref/field và phép lookup là đơn vị; n live entries, m capacity, t tombstones, ℓ độ dài bucket được xét, C/P/S như mục 3. Tách input được giữ sống, snapshot output mới, workspace tạm và trace mới. Loại chuỗi message, layout/DOM/controller khỏi API; nếu tính message phải cộng tổng độ dài strings. Không phải đo heap/benchmark hoặc bảo đảm engine.

| Lớp / nhánh | Time và space cần phân biệt |
|---|---|
| Chaining core | Search Θ(1+C), worst Θ(1+n); insert mới kiểm hết ℓ rồi append; delete tìm Θ(1+C), abstract unlink O(1) chỉ nếu có liên kết sẵn. Thực tế bucket là array: bỏ phần tử có chi phí filter/suffix Θ(ℓ), không phải linked-list unlink O(1). Auxiliary core có thể O(1), không bao gồm output copy |
| Probing core | Θ(1+P), 1≤P≤m kể cả bảng rỗng, best O(1), worst O(m). Free tombstone nhớ bằng vài biến O(1); duplicate vẫn phải tìm trước khi tái dùng |
| API insertKey / appendEntry | Duplicate: chỉ tìm, trả cùng table. Insert thành công clone toàn bảng: chaining Θ(m+n), probing Θ(m) time/output; API probing có thể probe lại để chọn slot, vẫn O(m). Full không clone. Không đồng nhất C/P với tổng API work |
| API delete / removeEntry | Generator tìm key, sau đó removeEntry còn hasEntry qua listEntries toàn bảng, clone toàn bảng và array map/filter. Chaining hit Θ(m+n) ngoài tìm, output Θ(m+n), suffix/filter Θ(ℓ); probing hit Θ(m), output Θ(m). Miss generator không gọi removeEntry, giữ input. Không suy delete hit bằng chi phí search |
| Count/load/has/toKeys / build | listEntries/count/load duyệt/allocate theo m+n (chaining), m (probing); công thức n/m không biến API loadFactor thành O(1). Build lặp insert/clone các prefix, không có claim toàn build O(1). Create empty cần Θ(m) arrays |
| Chain generator | Nonmutating search/duplicate/miss Θ(1+C²) time và retained fields: tổng copy path prefixes 1+…+C. Insert mới/delete hit thêm snapshot clone Θ(m+n), nên Θ(m+n+C²). Input table chia sẻ qua step, không clone n lần mỗi trace |
| Probing generator | Nonmutating Θ(1+P²) time/retained fields do probedBuckets/pathEntryIds prefix copies; insert mới/delete hit thêm Θ(m) snapshot output. C≤P; tombstone vẫn tốn probe-prefix copy. Không gọi cả trace O(S) chỉ vì step header cố định |
| Layout/UI | Layout chaining Θ(m+n), probing Θ(m) cho tọa độ đầu ra; render/statistics/messages/copy DOM tính riêng. UI commit bảng kết quả ngay sau tạo trace, previous/reset chỉ đổi bước nhìn; không nhầm snapshot cũ là committed input mới |

Căn cứ: [probe/find](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/structures/hashTable.js#L101-L144), [append/insert/remove/build/toKeys](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/structures/hashTable.js#L148-L212), [prefix copies](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/algorithms/hashTableStep.js#L35-L154), [layout](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/hash-table-layout.js#L1-L70), [render/stats](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/hash-table.js#L501-L567), [commit/reset](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/hash-table.js#L636-L696). Empty phải giữ hằng 1 trong Θ(1+C²)/Θ(1+P²); không viết O(0).

## 7. Existing coverage và provenance

Các test dưới đây là **existing source evidence**, chưa chạy trong C1. Không biến tên test/regex/counter assertion thành proof average hoặc runtime PASS. CI/runtime của B3 trước chỉ là lịch sử baseline, không phải chạy lại Hash C1.

| Coverage hiện có | Locator pin BASE | Giới hạn / C2 delta |
|---|---|---|
| Chaining exact traces/ID/counters, search hit/miss/delete suffix | [Insert](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/tests/hash-table-insert.test.js#L21-L90), [Search](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/tests/hash-table-search.test.js#L19-L87), [Delete](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/tests/hash-table-delete.test.js#L19-L89) | Reuse edge cases; không thêm test trùng từng nhánh |
| Probing tombstone/wrap/duplicate/full/all-tomb/m1, cleared IDs | [steps](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/tests/hash-table-probing-steps.test.js#L30-L214), [bounds](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/tests/hash-table-probing-complexity.test.js#L1-L67) | Oracle O5–13 có phần overlap; thêm bảng tích hợp frozen generator/old steps |
| API deepFreeze / copy | [chaining](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/tests/hash-table.test.js#L82-L93), [probing](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/tests/hash-table-probing.test.js#L104-L114), [step invariant helper](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/tests/helpers/hash-step-invariants.js#L1-L41) | API frozen không chứng minh generator frozen input hoặc defensive freeze runtime |
| Cards, live counts/α/tombstones, learning isolation | [controller](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/tests/hash-table-controller.test.js#L493-L602) | 516–541 chỉ khóa UI Knuth hiện tại, không xác minh công thức; C2 thay riêng assertions đó theo mục 8 |
| UI validation/switch/reset/scheduler/pseudocode và layout | [controller](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/tests/hash-table-controller.test.js#L198-L451), [overflow layout](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/tests/hash-table-layout.test.js#L50-L56) | Không coi static tests là browser visual PASS |

### 7.1 Blob manifest

Mỗi locator trên pin đúng BASE; blob SHA là Git object ID, không phải SHA-256 artifact. Danh sách sau cho phép kiểm nội dung dù local branch khác BASE:

| Path | Git blob |
|---|---|
| `src/structures/hashTable.js` | `5b6423ae4f69f7e38366b1074fa083dd3727f275` |
| `src/algorithms/hashTableStep.js` | `ea4ef6cc3553ab7fc32008334723018b15c877ce` |
| `src/algorithms/hashTableInsert.js` | `d2b10bf0fa6f56112e652ebec8233629ccecf26f` |
| `src/algorithms/hashTableSearch.js` | `6066d81a8a7c1f66c891c4b7843a1bcbe737c055` |
| `src/algorithms/hashTableDelete.js` | `75a04ee19aebdca03d96896885d27a7fac06490b` |
| `src/hash-table.js` | `6c939c3d6792e3adffc73a20fe7a400e9d4d95c6` |
| `src/hash-table-layout.js` | `83fc2587b3b8c4cf8bb276cf0c88fff7081c3a4c` |
| `public/templates/app.html` | `11073e958e436c6e6df56755f8e754869d8fbfdd` |
| `tests/hash-table.test.js` | `6871d4197167be1da283e7006fd3fd174e6bc77e` |
| `tests/hash-table-probing.test.js` | `075fb5235274f21470d9ea49cf74df304ef1e14d` |
| `tests/hash-table-insert.test.js` | `b902ce9a39768c071060310690150ad3e0ff0c74` |
| `tests/hash-table-search.test.js` | `46c787ba3e92d388e131df289be156f8a9ef2df9` |
| `tests/hash-table-delete.test.js` | `60ff97eabfca12f8d5bc204ad40b374644c8c740` |
| `tests/hash-table-probing-steps.test.js` | `a0577c9f83a27ead0970ec15eae4d8255d71f3ae` |
| `tests/hash-table-complexity.test.js` | `28e8e4cd81fa4280869ff5aa70453482451987bf` |
| `tests/hash-table-probing-complexity.test.js` | `6bc71dc4545461b5335cc6f41facec21c90dcace` |
| `tests/hash-table-controller.test.js` | `9dec9a047f6eb60c7406fcb7dca6b679ca8e5143` |
| `tests/hash-table-layout.test.js` | `55c2b8a652cf03bf23d20b87630b7257efec0acd` |
| `tests/helpers/hash-step-invariants.js` | `6a0279d6af05f91741952126785f49a5e6b9a468` |
| `docs/education/knowledge-mapping.md` | `57f392a9900bd7ebf00f0c453875fef05922dc24` |
| `docs/education/uit-sources.md` | `58f6ff1705478d25ad1a52fa4eea6cbb6690ac63` |
| `.agents/rules/algorithms.md` | `467b380c907285ceb10fc18813b5eaff7a7e2f43` |
| `docs/release/v1.0.0-scope.md` | `851bfaf812bd1d8142a3b4c8ad26aa04b093b69f` |

## 8. C2 replan — chưa triển khai runtime/tests

Owner chọn bỏ công thức Knuth và unconditional average O(1) probing trong C2. Claim Knuth hiện tại **NOT_VERIFIED** ở mức derivation/source applicability/rights; assertions UI không xác minh học thuật. Giữ dấu vết tại [copy baseline](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/src/hash-table.js#L66-L100) và [tests baseline](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/tests/hash-table-controller.test.js#L516-L541); không tìm nguồn mới, không ingestion. Không kết luận công thức toán học sai chỉ vì evidence hiện tại chưa đủ.

### 8.1 Allowlist và exact copy dự kiến

C2 đề xuất đúng 4 file: `src/hash-table.js`, `public/templates/app.html`, `tests/hash-table-complexity.test.js`, `tests/hash-table-controller.test.js`. Không đổi generator/API/pseudocode, DOM structure/attributes, CSS/dependencies. Cần owner duyệt riêng trước setup/implementation. Plan P0 cũ được thay ở phần Knuth, không phải được quyền sửa C2 trong C1.

14 JS fields dưới đây thay đúng text; xóa riêng hai const KNUTH_FOUND/KNUTH_NOT_FOUND đã hết chỗ dùng và cập nhật comment tương ứng. Giữ best/worst/space values, n/m/α/tombstone live counters; tag probing đổi thành cận worst có căn cứ. Chaining search advantages nói về lõi bucket scan, không bao gồm UI/API enumeration.

| Field tại BASE | Exact replacement |
|---|---|
| `CHAINING_COMPLEXITY.averageNote` | Chi phí lõi kỳ vọng O(1+α) cần mô hình hash và truy vấn phù hợp; key mod m không bảo đảm phân tán đều. Bảng không tự rehash. |
| `PROBING_COMPLEXITY.tag` | O(m) xấu nhất |
| `PROBING_COMPLEXITY.averageNote` | Cần mô hình phân phối để tính trung bình. Cùng α vẫn có cụm va chạm khác nhau; (n+tombstone)/m không dự đoán số ô dò. |
| `complexityFor.probing.insert.average` | Phụ thuộc phân bố/cụm; P≤m |
| `complexityFor.probing.search.average` | Hit/miss phụ thuộc cụm; P≤m |
| `complexityFor.probing.delete.average` | Hit/miss phụ thuộc cụm; P≤m |
| `learningFor.chaining.insert.description` | Duyệt chain tại h(key). Khóa mới so hết ℓ phần tử rồi nối cuối; khóa trùng ở vị trí p (từ 0) dừng với C=p+1. |
| `learningFor.chaining.insert.disadvantages` | Khóa mới phải kiểm hết chain. API chèn thành công còn copy bảng O(m+n); counter không đo copy và trace. |
| `learningFor.chaining.search.disadvantages` | Chain có thể dài n, tìm kiếm lõi O(n). Trace copy các prefix đường tìm; không có chi phí O(1) vô điều kiện. |
| `learningFor.chaining.delete.description` | Tìm rồi gỡ đúng ID khỏi chain. ID/key còn lại giữ nguyên; phần tử phía sau có thể đổi vị trí trong mảng chain. |
| `learningFor.chaining.delete.disadvantages` | Lõi tìm trong một chain; API xóa còn quét/copy bảng O(m+n). Không đồng nhất chi phí với số so sánh. |
| `learningFor.probing.insert.advantages` | Lõi dò các ô liên tiếp. API chèn thành công vẫn copy m ô; không có rehash tự động. |
| `learningFor.probing.search.advantages` | Lõi dừng khi gặp khóa, ô trống hoặc đã dò đủ m ô. |
| `learningFor.probing.delete.disadvantages` | Tombstone có thể kéo dài đường dò; dùng lại tombstone có thể giảm số dấu xóa. Chưa minh họa rehash. |

5 template text regions: chỉ text node/paragraph text, giữ tags/attributes/IDs; paragraph 1901–1905 giữ `<p>` và giải thích n,m,α cũng như chưa rehash. Exact replacement paragraph dưới đây mở rộng bản estimate JS; HTML không tính vào JS budget.

| BASE locator | Exact replacement text |
|---|---|
| [1686](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/public/templates/app.html#L1686-L1686) | O(1 + α) |
| [1862](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/public/templates/app.html#L1862-L1862) | Chi phí lõi và bảng |
| [1875](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/public/templates/app.html#L1875-L1875) | Mô hình trung bình / đường dò |
| [1887](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/public/templates/app.html#L1887-L1887) | Bộ nhớ bảng |
| [1901-1905](https://github.com/Nggvanchi/AlgoVision/blob/262e0ceb46ad747510d496bbe7fd6136c1069c0d/public/templates/app.html#L1901-L1905) | n là số khóa, m là số ô, α=n/m. Chaining tìm trong một chain; probing dò tối đa m ô. Chi phí lõi khác API copy bảng và trace. Bảng m cố định, chưa minh họa rehash. |

### 8.2 Regression, TDD và controls

- **+1 test bảng full trace** trong complexity file: sáu rows T×Insert19/Search14/Delete9×hai strategies, expected literals O1/O3/O4/O5/O7/O8. Khóa toàn vector pseudocodeLine, C/P/S, operation/key, finished, probedBuckets/pathEntryIds, currentBucket/currentEntryId/foundEntryId, final IDs/key/slot/nextId; input deepFreeze và old-step preservation. Expected không gọi generator/reference khác để tính. Reuse existing duplicate/full/m1/all-tomb cases thay vì viết lại chúng. Literal first/last fields cần pin từng row theo source, không suy cùng default cho tất cả nhánh.
- **+1 test template/panel cost scope** trong controller file: đọc template thật, scope đúng Hash; kiểm labels/core/API/trace và exact replacements, chuyển chaining→probing→chaining và Insert/Search/Delete để kiểm isolation. Tăng cường existing six-description test bằng exact strings, giữ assertions cũ về nonempty/unique/tombstone/no rehash. happy-dom cleanup trong finally. Kỳ vọng full **1822** từ baseline 1820, không ép hoặc giảm số test.
- Existing test 493–514 giữ nguyên best/average/worst/space values chaining. Existing probing test 516–541 đổi tên và thay **riêng bảy assertions Knuth/model**: L527→exact search average; L528→cận P≤m/tag O(m) xấu nhất; L531→cần mô hình phân phối; L532→cùng α vẫn khác cụm; L533→không dự đoán probes từ ratio; L534→nhắc (n+tombstone)/m không phải estimator; L540→exact insert average. Không chỉ xóa assertions; giữ title/best/worst/space/tombstone checks và thêm Delete average/isolation. Không thay expected live ratio ở 546–569: ratio là số đo, không phải công thức dự đoán.
- TDD: thêm oracle test (có thể GREEN ngay), exact content tests phải RED đúng assertion trước đổi copy; chỉ sau đó áp copy và GREEN. Script lỗi không tính RED. Targeted trước/full sau; không skip/todo/weakening.
- Ba wording mutations có mục tiêu: bỏ điều kiện distribution chaining; đổi probing cận P≤m/nhãn worst thành average O(1); đổi API clone thành O(1). Mỗi lần phải RED đúng assertion, restore byte/hash trong finally, đối chứng GREEN. Hai **assertion negative controls** riêng: một fixture expected C=3→2, một expected tombstone delete→empty; chỉ anchor một match theo test/row. Không tính controls là implementation mutation, không mutation generator ngoài scope.

### 8.3 Browser và budget gates

- **24 cases = 3 OP × 2 strategies × 4 viewport 360/699/768/1280×900 CSS px, DPR=1**. Mỗi case xác minh heading/nav/controls/strategy/op, đo viewport/DPR/scale; cards/counters/pseudocode và literal expected. UI actions thật cho hit/miss/duplicate; subcases m5/7/11, wrap, full, tombstone skip/reuse, all-tomb khi UI hỗ trợ; không inject dữ liệu/DOM tạo PASS.
- Reset/seek/previous phải theo contract committedTable, capacity/strategy change xóa bảng chứ không rehash. Kiểm focus/keyboard scroll, overflow/clipping, ID theo data-id, accessible names, console/network. Functional và visual riêng; HARNESS_FAIL/PRODUCT_FAIL/ENV_BLOCKED riêng. UI max15 chaining giữ nguyên. Không suy static layout test là browser PASS.
- Cần verify/approve browser execution chain và isolated profile theo phạm vi C2; harness hiện hữu chỉ reuse theo hash/provenance. PNG thật trước/sau trạng thái có nghĩa, đọc lại signature/dimensions/SHA-256, review ảnh; kết quả từng assertion/cleanup lưu ngoài repo. Không nâng exception lịch sử từ cleanup PASS của riêng phiên C2.
- Baseline QA lịch sử **1820 tests, JS153472/CSS58016 B**, không phải C1 run. Limits **154000/58500 B**, headroom **528/484 B**. So UTF-8 source expressions 14 fields: delta **−312 B**; bỏ hai const **−92 B**, tổng source estimate **−404 B** (chưa tính comment/minifier/identifier/escaping). Đây không phải phép đo bundle; không khẳng định JS build=153068 B. HTML đo riêng; CSS dự kiến delta0 nhưng cần build thực tế. Nếu budget FAIL, STOP, không tăng trần hoặc tối ưu C2 ngoài scope.

## 9. Rights, review và residual gates

| Hành vi / claim | Provenance / trạng thái / gate |
|---|---|
| UIT định danh/phạm vi | MAP-030–032-I/S, UIT-SRC-004: chỉ locator chủ đề, chưa chứng minh strategy/tombstone/proof/average; source_status không đổi |
| Claim/diễn đạt/proof/oracle AlgoVision | Tự biên soạn từ code pin BASE và suy luận P1–P6; không sao chép/dịch/chuyển thể tài liệu thứ ba. STATIC_SUPPORTED / DRAFT_DERIVATION, REVIEW_PENDING; chưa academic acceptance OP-30–32 hoặc xác nhận quyền công bố mới |
| Knuth lịch sử | Giữ code/test locator để truy vết, NOT_VERIFIED về source/applicability/proof; owner chọn bỏ UI formula trong C2 thay vì tìm nguồn mới. Không dùng tên Knuth hoặc regex PASS làm claim-level evidence |
| Trích dẫn/copy/chuyển thể/tái phân phối/AI bên thứ ba | Không phát sinh ingestion hoặc tài nguyên thứ ba trong C1; RIGHTS_NOT_VERIFIED khi thiếu căn cứ hành vi. Owner approval và MIT repo không cấp quyền tài liệu nguồn; không suy NOT_VERIFIED nghĩa bị cấm |

- Arithmetic/ID/resource residual: Number.isInteger không enforce safe arithmetic, nextId uniqueness phụ thuộc exact representation; capacity/resource không có trần thuần, caller/Proxy có thể phá invariant. Giữ deferred hardening, không sửa API/generator hoặc giả nhận mọi input số nguyên đều an toàn.
- Giữ **VIS-01** trước release/C4, **Insertion step-limit C2 / negative-mutation C3**, **EX-03/EX-04**, historical config drift UNKNOWN, attribution/runtime overrides NOT_VERIFIED, PNG/runtime/cleanup exceptions lịch sử. Bounded checkpoint policy chỉ metadata C1 đúng namespace/pattern/tree đã duyệt với business integrity PASS, không blanket rebaseline.
- **G-EDU/G-STRUCT/G-RELEASE/C4**, screen reader/zoom/cross-browser/production còn mở. Không mở EDU-4/Hash C2/Graph hoặc đóng EDU-3 từ hồ sơ C1. Runtime/test/build/browser **NOT RUN** trong C1; chỉ docs validation và integrity. Academic acceptance vẫn **29/40**.
