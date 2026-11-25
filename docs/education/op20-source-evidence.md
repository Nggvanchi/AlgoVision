# OP-20 — Hồ sơ claim và provenance Binary Search

> Trạng thái hiện hành: xem [EDU2-AC3b — Acceptance và G5 bridge](#7-edu2-ac3b--acceptance-và-g5-bridge). Các phần trước checkpoint đó giữ nguyên như hồ sơ lịch sử.

**OP20-A / REVIEW_PENDING.** Baseline B=`ae90928ca630260086efcd18066bcfc92a96ff5e`. Giữ **academic PASS 0/40; RIGHTS_NOT_VERIFIED** và mọi gate.

`STATIC_SUPPORTED`: hành vi/assertion đọc từ source. `DRAFT_DERIVATION`: lập luận/oracle độc lập chờ phản biện. `NOT_VERIFIED`: thiếu evidence. Các trạng thái này không phải academic PASS; test evidence dưới đây không phải kết quả chạy mới. Test/build/browser/CI **NOT RUN trong OP20-A**.

## 1. Baseline, provenance và hợp đồng

Mọi locator B:line pin đúng B; không dùng local main/origin/main cũ. Các nhãn B20 chỉ là liên kết evidence, không phải source ID/mapping ID mới.

| File tại B | Git blob SHA |
|---|---|
| src/algorithms/binarySearch.js | 9fda5126b3a7a6026e1c434e798fd6c984d1b830 |
| src/searching.js | f68f14af55e4735db4e54af4a179fe6a15b3a872 |
| tests/searching.test.js | 9ecee590177de51f7c480a1d38eb926a09f24520 |
| tests/searching-controller.test.js | 3dea5074ae60e95463023c2b77c973371c86227b |
| tests/complexity.test.js | 3480cd4292dd88b2570c7300c4c1b3ecc781b507 |
| tests/binary-search-step-limit.test.js | 97d47a98cd0036e8dd11c873290b9562afd9a97e |
| src/algorithms/stepLimit.js | 39228c9aab6a196a412ec614ebc2e20e3fb63ab8 |
| docs/education/knowledge-mapping.md | ca917da496fa41ab7e183fd7904a9b4ad1a598b7 |
| docs/education/uit-sources.md | 58f6ff1705478d25ad1a52fa4eea6cbb6690ac63 |

Mảng đặc gồm n số hữu hạn, sắp không giảm; target hữu hạn và cố định. Đọc ô, so sánh số, phép toán chỉ số có chi phí hằng. Generator không tự kiểm các tiền điều kiện này. Không mở rộng kết luận sang sparse array, NaN, object/getter hoặc comparator tùy ý.

Mã giả dùng `==` làm ký hiệu bằng nhau; JavaScript thực tế dùng `===` ([B:7–17][B20-PSEUDO], [B:61–76][B20-HIT]). Generator **trả mảng steps**, không trả trực tiếp một index: kết quả tìm kiếm là `steps.at(-1).foundIndex`, một index khớp từ 0 hoặc −1. Với duplicates, không cam kết khớp đầu tiên. UI hiển thị vị trí index+1 trên mảng đã sắp ([B:301–325][B20-UI]).

## 2. Claim matrix

| Claim | Source/test tại B | Giới hạn và review |
|---|---|---|
| Sorted input, strict equality, target cố định | [G:33–76][B20-STEP]; [Q:133–142][B20-TARGET], [357–386][B20-ARRAY]; [T:180–204][B20-FIELDS] | STATIC_SUPPORTED; finite/sorted là tiền điều kiện, không phải validation của generator. |
| Invariant, termination, duplicates | [G:59–100][B20-LOOP]; [T:46–65][B20-RESULT], [295–307][B20-HIT-TEST] | Hành vi STATIC_SUPPORTED; chứng minh mục 3 DRAFT_DERIVATION. |
| C đếm lần xét mid | [G:61–66][B20-HIT]; [T:71–88][B20-COUNTER] | Không đếm tổng toán tử `===`, `<`, điều kiện while. |
| Hit S=C+1; miss S=C+2 | [G:57–107][B20-TRACE]; [T:91–99][B20-EMPTY], [139–165][B20-BOUND-TEST] | Công thức DRAFT_DERIVATION; oracle mục 4. |
| Biên sau cập nhật; phần tử vừa xét | [G:83–100][B20-BOUND]; [T:139–165][B20-BOUND-TEST], [186–204][B20-FIELDS] | STATIC_SUPPORTED; mid có thể nằm ngoài đoạn mới. |
| Pseudocode và conclusion | [G:7–24][B20-PSEUDO], [66–107][B20-TRACE]; [T:240–269][B20-LINES], [295–325][B20-HIT-TEST] | Lines 5/7/9/10; chỉ step cuối finished=true. |
| Worst C và step-limit | [G:27–30][B20-LIMIT]; [C:46–60][B20-COST-TEST]; [L:6–24][B20-LIMIT-TEST] | Cận theo miền hợp lệ; không suy guard thay chứng minh dừng. |
| Average successful và memory | [G:35–55][B20-STEP], [59–107][B20-TRACE] | DRAFT_DERIVATION theo mô hình mục 5; không phải benchmark. |

G/Q/T/C/L lần lượt là generator, controller, searching tests, complexity tests và binary-search-step-limit tests trong bảng provenance. Controller tests [B:430–475][B20-DUP-UI], [664–703][B20-SORT-UI] kiểm duplicates và việc sort/reset khi chọn Binary; không dùng test UI đó làm chứng minh first-match.

## 3. Chứng minh đúng và dừng

Ở đầu mỗi lượt, nếu target có trong input thì mọi vị trí khớp còn có thể trả về nằm trong đoạn `[left,right]`. Ban đầu đoạn là toàn mảng.

Nếu `A[mid] === target`, trả mid hợp lệ dưới dạng foundIndex trong step cuối. Nếu `A[mid] < target`, tính không giảm cho biết mọi vị trí ≤mid đều không khớp; đặt `left=mid+1`. Trường hợp còn lại, mọi vị trí ≥mid đều lớn hơn target; đặt `right=mid−1`. Lập luận vẫn đúng khi có duplicates.

Gọi m là độ dài đoạn còn xét. Sau một mismatch, đoạn mới có nhiều nhất `floor(m/2)` phần tử, nên giảm nghiêm ngặt. Vì vậy vòng lặp dừng; khi `left>right`, không còn vị trí khớp và kết luận −1 đúng.

Mỗi lượt tăng C một lần và tạo một step. Có một initial step; hit kết thúc ngay trong comparison step, còn miss có thêm conclusion step không tăng C. Do đó hit `S=C+1`, miss `S=C+2`. Empty không vào vòng lặp: `C=0,S=2`.

Target là binding tham số không được gán lại; mỗi record lấy cùng target. UI chốt target khi prepareSteps và đọc step.target khi render ([B:315–325][B20-UI], [373–386][B20-ARRAY]). Input/change tạo trace mới hoặc idle, không thay target trong trace cũ ([B:514–517][B20-RESET]).

## 4. Oracle dò tay độc lập

Chuỗi mid dưới đây chỉ gồm các lần so sánh; không lấy expected từ generator. C là comparisons cuối; S là độ dài mảng steps, gồm initial và conclusion nếu có. Toàn bộ oracle là DRAFT_DERIVATION, chưa chạy trong OP20-A.

| ID | Input / target | Mid lần lượt | foundIndex | C | S | pseudocodeLine, kể initial |
|---|---|---|---:|---:|---:|---|
| O1 | `[] / 7` | — | −1 | 0 | 2 | null,10 |
| O2 | `[7] / 7` | 0 | 0 | 1 | 2 | null,5 |
| O3 | `[7] / 2` | 0 | −1 | 1 | 3 | null,9,10 |
| O4 | `[7] / 9` | 0 | −1 | 1 | 3 | null,7,10 |
| O5 | `[1,2] / 2` | 0,1 | 1 | 2 | 3 | null,7,5 |
| O6 | `[1,3] / 2` | 0,1 | −1 | 2 | 4 | null,7,9,10 |
| O7 | `[1,2,2,2,5] / 2` | 2 | 2 | 1 | 2 | null,5 |
| O8 | `[1,2,3,4,5,6,7,8] / 5` | 3,5,4 | 4 | 3 | 4 | null,7,9,5 |
| O9 | `[1,2,3,4,5,6,7,8] / 0` | 3,1,0 | −1 | 3 | 5 | null,9,9,9,10 |
| O10 | `[1,2,3,4,5,6,7,8] / 9` | 3,5,6,7 | −1 | 4 | 6 | null,7,7,7,7,10 |

Các checkpoint biên sau comparison:

- O3: `(left,right)=(0,−1)`; O4: `(1,0)`.
- O6: `(1,1)→(1,0)`.
- O8: `(4,7)→(4,4)`, rồi hit mid=4.
- O9: `(0,2)→(0,0)→(0,−1)`.
- O10: `(4,7)→(6,7)→(7,7)→(8,7)`.

Initial có mid=−1, C=0, currentIndex/currentValue=null, foundIndex=−1, finished=false. Comparison lưu currentIndex=mid và currentValue=A[mid]; mismatch giữ finished=false. Miss conclusion giữ mid/biên cuối nhưng currentIndex/currentValue=null, không tăng C. `index` của Binary vẫn bằng 0 theo record mặc định, không dùng làm foundIndex hoặc con trỏ Linear. Target giống nhau trong mọi step; input không đổi.

## 5. Chi phí và average

Với n≥1, số lần xét tối đa thỏa `L(n)=1+L(floor(n/2))`, `L(0)=0`, nên `L(n)=floor(log₂n)+1`. O10 đạt cận tại n=8. Đây là cận trên chặt theo họ input/target, không khẳng định mọi query đều đạt nó.

Core có chi phí Θ(1+C): best Θ(1); worst Θ(log(n+1)), thường viết Θ(log n) khi n tăng. Empty là Θ(1), không dùng log 0.

Average chỉ xét tìm thành công trên n≥1 giá trị phân biệt, target chọn đều trong n giá trị. Với pivot giữa cố định, gọi T(n) là tổng số lần xét để tìm mọi giá trị:

`T(0)=0`

`T(n)=n+T(floor((n−1)/2))+T(ceil((n−1)/2))`

`E[C]=T(n)/n`.

Cận trên là L(n). Trong cây quyết định, tối đa `2^d−1` giá trị được tìm trong ≤d lần xét. Chọn d xấp xỉ log₂n−1 thì một tỷ lệ hằng các target cần Ω(log n) lần xét; do đó E[C]=Θ(log n). Không suy kết quả này cho target thiên lệch, duplicates hoặc hỗn hợp hit/miss chưa có phân phối.

Core auxiliary O(1) ngoài input. Generator lưu S record có số trường cố định và S tham chiếu: metadata trace O(S) word, không copy mảng trong từng step. Payload message, heap/GC, DOM/render và copy/sort của UI nằm ngoài mô hình này ([B:119–121][B20-COPY], [357–368][B20-ARRAY], [419][B20-COMPARE-COPY]). Không coi card O(1) là toàn bộ bộ nhớ ứng dụng; không mặc định hiệu năng `Array.sort` được chuẩn JavaScript bảo đảm O(n log n).

Step-limit là `32−clz32(n)+2`: empty 2, còn lại `floor(log₂n)+3`, trong miền độ dài mảng hợp lệ. Guard kiểm số step hiện có ở đầu vòng ([B:59–60][B20-LOOP], [guard B:5–13][B20-GUARD]); không phải validation input hoặc dự báo mọi step tương lai.

## 6. Nguồn và gate

[MAP-020-I/S][B20-MAPPING] giữ nguyên implementation PRESENT, source PARTIAL và source-side chi tiết NOT VERIFIED theo hồ sơ lịch sử. [UIT-SRC-004][B20-UIT] chỉ định vị PDF4/chương2/mục2.2 về chủ đề; chưa chứng minh các counters, trace, biến thể hoặc phân phối average trên.

Áp dụng [policy B][B20-POLICY]: lập luận tự biên soạn từ code AlgoVision, không trích/dịch/chuyển thể giáo trình chưa có quyền; không tải lại nguồn đã dừng, ingestion OpenStax, thêm source ID hoặc nâng source_status.

Cần phản biện chứng minh/oracle, owner acceptance và evidence quyền phù hợp nếu dùng nội dung bên thứ ba. Giữ academic PASS 0/40, RIGHTS_NOT_VERIFIED, A-EDU/G-EDU và mọi gate release. OP20-A không thay source/tests/UI, không mở OP20-B.

[B20-PSEUDO]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/algorithms/binarySearch.js#L7-L24
[B20-STEP]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/algorithms/binarySearch.js#L33-L76
[B20-HIT]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/algorithms/binarySearch.js#L61-L76
[B20-LOOP]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/algorithms/binarySearch.js#L59-L100
[B20-TRACE]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/algorithms/binarySearch.js#L57-L107
[B20-BOUND]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/algorithms/binarySearch.js#L83-L100
[B20-LIMIT]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/algorithms/binarySearch.js#L27-L30
[B20-TARGET]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/searching.js#L133-L142
[B20-ARRAY]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/searching.js#L357-L386
[B20-UI]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/searching.js#L301-L325
[B20-RESET]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/searching.js#L514-L517
[B20-COPY]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/searching.js#L119-L121
[B20-COMPARE-COPY]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/searching.js#L419
[B20-RESULT]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/tests/searching.test.js#L46-L65
[B20-COUNTER]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/tests/searching.test.js#L71-L88
[B20-EMPTY]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/tests/searching.test.js#L91-L99
[B20-BOUND-TEST]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/tests/searching.test.js#L139-L165
[B20-FIELDS]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/tests/searching.test.js#L180-L204
[B20-LINES]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/tests/searching.test.js#L240-L269
[B20-HIT-TEST]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/tests/searching.test.js#L295-L325
[B20-COST-TEST]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/tests/complexity.test.js#L46-L60
[B20-LIMIT-TEST]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/tests/binary-search-step-limit.test.js#L6-L24
[B20-GUARD]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/src/algorithms/stepLimit.js#L5-L13
[B20-DUP-UI]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/tests/searching-controller.test.js#L430-L475
[B20-SORT-UI]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/tests/searching-controller.test.js#L664-L703
[B20-MAPPING]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/docs/education/knowledge-mapping.md#L35-L36
[B20-UIT]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/docs/education/uit-sources.md#L44-L49
[B20-POLICY]: https://github.com/Nggvanchi/AlgoVision/blob/ae90928ca630260086efcd18066bcfc92a96ff5e/docs/education/uit-sources.md#L203-L234

## 7. EDU2-AC3b — Acceptance và G5 bridge

Quyết định owner trong EDU2-AC3b chấp nhận claims OP-16–20 theo AC2a/AC3a và xác nhận có căn cứ quyền công bố **nội dung tự biên soạn thực tế** của năm OP. Đây là acceptance của owner trong phạm vi nêu dưới đây, không phải chứng nhận học thuật bên ngoài. Bản đồng bộ AC3b hiện chưa commit/publish/merge; chưa phải closeout EDU-2. Các trạng thái REVIEW_PENDING, academic PASS 0/40 và ghi chú quyền trong phần trước được giữ làm lịch sử tại SHA của chúng.

Theo [Policy B §11](uit-sources.md#11-policy-b-và-quyền-theo-hành-vi--edu-1f), UIT-SRC-004 chỉ định danh/phạm vi chủ đề. Lập luận, oracle và diễn đạt độc lập không phải sao chép/dịch giáo trình. Acceptance quyền của nội dung AlgoVision không mở rộng sang tài liệu bên thứ ba: **RIGHTS_NOT_VERIFIED** và source_status giữ nguyên; không suy quyền từ MIT, owner approval hoặc technical PASS. Không ingestion mới, không tìm lại IT003/OpenDSA.

Giữ EX-03 historical NOT VERIFIED; EX-04 chỉ chấp nhận baseline cấu hình hiện tại, không chứng minh historical config drift hoặc runtime isolation. Insertion step-limit thuộc C2, negative/mutation thuộc C3 và bắt buộc trước release; G-STRUCT không được miễn. EDU-2 vẫn IN_PROGRESS/PARTIAL; G-EDU, G-STRUCT và G-RELEASE toàn dự án còn mở.

| Claim hiện hành — OP-20 Binary Search | Evidence và disposition |
|---|---|
| Tiền điều kiện mảng số hữu hạn sorted nondecreasing, target cố định; thu hẹp khoảng chứa target. Duplicates trả một match, không hứa first-match. C đếm lần xét mid; worst C=⌊log₂n⌋+1 khi n≥1. Hit S=C+1, miss S=C+2; empty C=0, S=2. Average Θ(log n) trong mô hình tìm thành công, các giá trị phân biệt, target chọn đều và chứng minh cây quyết định trong hồ sơ. | OWNER_ACCEPTED trong phạm vi AC2a/AC3a; chứng minh và oracle độc lập ở các mục gốc phía trên, không tính lại như claim mới. |
| Lõi dùng O(1) bộ nhớ phụ; trace O(S) theo mô hình mỗi step có số trường cố định. Không bao gồm chuỗi message, DOM, UI copy/sort hoặc byte heap thực tế. | Mô hình chi phí trừu tượng; không phải benchmark hay đo byte heap. |
| Generator trả steps; foundIndex của bước cuối là kết quả, không phải giá trị trả về trực tiếp của generator. C không đếm từng toán tử; biên cập nhật và pseudocode giữ nguyên. | Giới hạn bắt buộc giữ khi trình bày/test. |

G5 nối technical [#75](https://github.com/Nggvanchi/AlgoVision/pull/75), merge `109e3be1d0dfa2f08a4fab2fdd6cb746efc7443a`, với content/Compare [#77](https://github.com/Nggvanchi/AlgoVision/pull/77), merge baseline `e558deed7b8daba179520367722db9edeec5e757`. Hồ sơ docs qua [#74](https://github.com/Nggvanchi/AlgoVision/pull/74); không thay thế lịch sử provenance trong hồ sơ.

- Generator tại baseline: [binarySearch.js:33](https://github.com/Nggvanchi/AlgoVision/blob/e558deed7b8daba179520367722db9edeec5e757/src/algorithms/binarySearch.js#L33-L109).
- Learning Panel/test tại baseline: [searching-controller.test.js:1334](https://github.com/Nggvanchi/AlgoVision/blob/e558deed7b8daba179520367722db9edeec5e757/tests/searching-controller.test.js#L1334-L1387); nội dung [searching.js:19](https://github.com/Nggvanchi/AlgoVision/blob/e558deed7b8daba179520367722db9edeec5e757/src/searching.js#L19-L39). Các locator pin BASE mô tả bản đã merge, không giả nhận wording AC3b chưa merge có SHA mới.
- Evidence cũ của #77: 1810/1810 tests, mutation/control 5/5; [CI hậu merge 45549814244](https://github.com/Nggvanchi/AlgoVision/actions/runs/45549814244) Ubuntu/Windows test/build/encoding trên BASE. Đây là bằng chứng lịch sử, không phải kết quả chạy AC3b; QA hiện tại phải báo riêng theo hash. Searching/Compare chỉ tái sử dụng khi source/template/CSS/test liên quan nguyên byte.

Academic acceptance: **OP-20 OWNER_ACCEPTED**; tổng phạm vi OP-16–20 là **5/40**, không nâng 35 OP khác hoặc quyền tài liệu bên thứ ba. Cập nhật wording trạng thái Sorting ở AC3b chỉ phản ánh quyết định này, giữ nguyên mọi claim/giả định.
