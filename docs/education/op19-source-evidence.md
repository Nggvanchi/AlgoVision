# OP-19 — Hồ sơ claim và provenance Linear Search

24/11/2026 — **OP19-A / REVIEW_PENDING**. Hồ sơ docs-only, chưa nghiệm thu học thuật hoặc thay nội dung Learning Panel. Giữ **academic PASS 0/40; RIGHTS_NOT_VERIFIED**, A-EDU/G-EDU và mọi gate release còn mở. OP-19 vẫn DEFER_TO_EDU_2_3_4 → EDU-2 theo [disposition](knowledge-mapping.md#8-disposition-40-op--edu-1f).

## 1. Baseline và cách đọc evidence

- `B = eeb9f1a338790243187d189a40e49a3d46ffac89`; mọi locator B:line dưới đây pin commit này, không dùng local main/origin/main cũ.
- `STATIC_SUPPORTED`: hành vi hoặc assertion hiện diện khi đọc source/test tại B. `DRAFT_DERIVATION`: chứng minh, mô hình hoặc oracle tự biên soạn cần phản biện. `NOT_VERIFIED`: thiếu evidence cho phạm vi nhận định. Không trạng thái nào là academic PASS.
- Test evidence là assertion đọc từ file, **không phải kết quả chạy PASS**. Không import/chạy generator để lấy expected; test/build/browser/CI **NOT RUN trong OP19-A**.
- Các nhãn B19 chỉ là link evidence, không phải source ID/mapping ID mới.

| File tại B | Git blob SHA |
|---|---|
| src/algorithms/linearSearch.js | 10151d7e8d93bf97db634572674424c9f76d0736 |
| src/searching.js | d35fa72326d46057299697d01aaaf28faea3b7c0 |
| tests/searching.test.js | 3f6213c604314bd9b9c7ddbbf39d71bbdf3428d5 |
| tests/searching-controller.test.js | 4dd9d5bd8e7bf961138c1e05f1b504243a8a393f |
| tests/complexity.test.js | 3480cd4292dd88b2570c7300c4c1b3ecc781b507 |
| docs/education/knowledge-mapping.md | 6aafc00043370489507e19d66c891b537d4d785e |
| docs/education/uit-sources.md | 58f6ff1705478d25ad1a52fa4eea6cbb6690ac63 |

## 2. Tiền điều kiện và mô hình

Phân tích trên mảng đặc n số hữu hạn và target là số hữu hạn, không thay đổi trong lúc sinh trace đồng bộ; đọc một ô, so sánh `===`, tăng/gán chỉ số có chi phí hằng. Không yêu cầu mảng có thứ tự. Đây là miền phân tích, không phải tuyên bố generator tự validation; không mở hợp đồng sang sparse array, NaN, object/getter hoặc comparator tùy ý.

Mã giả dùng `A[i] == target` như ký hiệu bằng nhau; không đọc nó thành phép coercion `==` của JavaScript. Nhánh implementation thực tế dùng `===` ở B:44.

Gọi C là counter `comparisons` cuối trace, S là số step đã lưu (kể cả bước đầu và bước kết luận nếu có). [B:40–44][B19-LOOP] tăng C đúng một lần trước mỗi `currentValue === target`; không tính kiểm biên, render, copy, message hoặc thời gian browser vào C. Phân tích core loại chi phí lưu trace/message/DOM; mô hình step cố định được giới hạn ở mục 6.

## 3. Claim matrix tại B

Mọi hàng áp dụng tiền điều kiện mục 2 và vẫn REVIEW_PENDING. “Test” dưới đây chỉ là source evidence hiện diện, không phải runtime acceptance.

| Claim | Biến thể / lập luận | Evidence SHA:line tại B | Test evidence tại B | Giới hạn / phân loại |
|---|---|---|---|---|
| Trái → phải, strict equality, không cần sorted | i từ 0 đến n−1; so sánh JS `===`; không sort hoặc ghi input trong generator | [B:40–68][B19-LOOP]; UI chỉ sort khi Binary [B:357–368][B19-ARRAY] | [searching B:27–43][B19-RESULT]; [controller B:390–428][B19-DUP] dùng mảng không có thứ tự | Fixture generator ở B:13–21 đều không giảm; chưa có oracle unsorted đầy đủ trong test thuần. STATIC_SUPPORTED. |
| First-match 0-based, miss=-1 | Bất biến mọi vị trí <i đã không khớp; found trả ngay tại i; hết vòng lặp dùng foundIndex mặc định −1 | [B:22–55][B19-STEP], [B:71–78][B19-MISS]; chứng minh mục 5 | searching B:27–43 kiểm indexOf/counters; controller B:390–428 kiểm duplicates | `return steps` là API generator; index kết quả nằm trong step cuối, không phải return số trực tiếp. DRAFT_DERIVATION. |
| Target cố định trong mỗi trace | Số target truyền vào closure createStep; UI chỉ sinh bước khi chưa có trace, render đọc step.target | [B:22–36][B19-STEP]; [UI B:373–386][B19-PREP], [B:315–325][B19-VALUES] | [searching B:179–212][B19-FIELDS]; [controller B:1418–1443][B19-RESET] | Input/reset tạo trạng thái/trace mới; không tuyên bố target giữ nguyên qua mọi lần tìm. STATIC_SUPPORTED. |
| index khác currentIndex/currentValue | Sau mismatch: index=i+1, currentIndex=i, currentValue=A[i]; found: index=currentIndex=i; đầu/miss kết luận current=null | [B:22–36][B19-STEP], [B:40–76][B19-LOOP] | searching B:185–212 kiểm giá trị vừa xét và index kế tiếp | Comment “index kế tiếp” không áp nguyên xi vào found; UI marker đọc step.index, số đang xét đọc currentIndex. STATIC_SUPPORTED. |
| Found tại k: C=k+1, S=k+2=C+1 | Một initial step, k mismatch steps và một found step có comparison rồi kết thúc | [B:38–68][B19-LOOP]; mục 5 | searching B:27–43 kiểm C/result; B:70–87 kiểm delta C | Công thức S tổng quát là suy dẫn tĩnh; chưa có assertion riêng S=C+1 trên mọi input. DRAFT_DERIVATION. |
| Miss: C=n, S=n+2=C+2; n=0: C=0,S=2 | Initial + n mismatch + một conclusion không comparison | [B:38–78][B19-LOOP] | [searching B:90–98][B19-EMPTY], [B:125–136][B19-CONCLUSION] | Không gọi bước kết luận là phép so sánh thứ n+1. DRAFT_DERIVATION. |
| LINE và finished | Initial: null/false; mismatch: line2/false; found: line3/true; miss conclusion: line4/true | [pseudocode B:5–15][B19-PSEUDO], [B:22–76][B19-STEP] | [searching B:239–253][B19-LINES], B:271–276, [B:309–321][B19-TRACES]; B:27–43 kiểm một finished | Không có step riêng cho mỗi lần for hoặc comparison thành công line2; chỉ step cuối finished. STATIC_SUPPORTED. |
| UI dùng vị trí 1-based | foundIndex/currentIndex vẫn 0-based; message và render cộng 1 để trình bày | [B:45–52][B19-FOUND]; [UI B:301–325][B19-VALUES], [B:252–258][B19-MARKER] | controller B:390–428; [B:1367–1396][B19-UI-TRACE] | Không dùng nhãn “vị trí” trong UI như index API; không đọc số từ message để tính kết quả. STATIC_SUPPORTED. |
| Best core Θ(1), worst core Θ(n), n≥1 | Core Θ(1+C); hit đầu C=1, hit cuối/miss C=n | [B:40–78][B19-LOOP]; mục 6 | [complexity B:40–44][B19-COST] kiểm đầu/cuối/miss | Không suy runtime/heap browser từ counters; Θ là lập luận theo mô hình, không benchmark. DRAFT_DERIVATION. |
| Average successful: E[C]=(n+1)/2, Θ(n) | n giá trị phân biệt, chọn target đều từ n giá trị có mặt; mỗi vị trí đầu tiên có xác suất 1/n | [B:40–55][B19-FOUND]; chứng minh mục 6 | Không có test xác suất/chứng minh average tại B | Không áp cho duplicates, phân phối lệch hoặc mixed hit/miss chưa cho xác suất. DRAFT_DERIVATION; nghiệm thu học thuật NOT_VERIFIED. |
| Core auxiliary O(1), trace O(S) | Chỉ số/giá trị tạm cố định; step có số trường cố định, không copy mảng mỗi step | [B:18–36][B19-STEP], [B:38–78][B19-LOOP]; mục 6 | [searching B:114–120][B19-INPUT] kiểm input không đổi, không đo bộ nhớ | Tách input/UI working copy, array steps và message/DOM/engine; chưa benchmark heap/RSS. DRAFT_DERIVATION. |
| Nội dung Learning Panel hiện hữu | B:19 đã nói first-match; B:23 nêu average/worst “tới n” nhưng chưa cho mô hình xác suất; card space O(1) chưa diễn giải trace | [UI B:9–24][B19-PANEL] | [controller B:1292–1340][B19-UI-PANEL] chỉ kiểm nội dung cơ bản và chuyển thuật toán | Ghi gap, không sửa ba chuỗi/cards hoặc coi UI là chứng minh. STATIC_SUPPORTED; chi tiết nội dung tương lai NOT_VERIFIED. |

## 4. Oracle độc lập — expected, không thực thi

Dò tay theo “xét lần lượt đến khớp đầu tiên hoặc hết mảng”, không lấy expected từ output generator. Các bảng là DRAFT_DERIVATION. Chuỗi line bắt đầu với null của initial step.

| Input A | Target | Expected foundIndex | C | S | Expected pseudocodeLine theo thứ tự |
|---|---|---|---|---|---|
| [] | 7 | -1 | 0 | 2 | null,4 |
| [7] | 7 | 0 | 1 | 2 | null,3 |
| [7] | 9 | -1 | 1 | 3 | null,2,4 |
| [3,1,2] | 3 | 0 | 1 | 2 | null,3 |
| [3,1,2] | 1 | 1 | 2 | 3 | null,2,3 |
| [3,1,2] | 2 | 2 | 3 | 4 | null,2,2,3 |
| [3,1,2] | 9 | -1 | 3 | 5 | null,2,2,2,4 |
| [5,2,2,1] | 5 | 0 | 1 | 2 | null,3 |
| [5,2,2,1] | 2 | 1 | 2 | 3 | null,2,3 |
| [5,2,2,1] | 9 | -1 | 4 | 6 | null,2,2,2,2,4 |

Với mỗi hàng, target có cùng giá trị ở mọi step; foundIndex mặc định −1 cho đến found. Chỉ step cuối finished=true; mảng input không bị ghi. Đây là expected cho hồ sơ, **chưa thêm/chạy test tương ứng**; fixture singleton hiện có là [42], không gọi đó là test đã chạy cho [7].

Chi tiết [3,1,2], target=2 (C tích lũy):

| Step | index | currentIndex | currentValue | foundIndex | C | line | finished |
|---|---|---|---|---|---|---|---|
| 0 | 0 | null | null | -1 | 0 | null | false |
| 1 | 1 | 0 | 3 | -1 | 1 | 2 | false |
| 2 | 2 | 1 | 1 | -1 | 2 | 2 | false |
| 3 | 2 | 2 | 2 | 2 | 3 | 3 | true |

Cùng mảng, target=9: ba mismatch có (index,currentIndex,currentValue) lần lượt (1,0,3), (2,1,1), (3,2,2), đều line2/finished=false. Sau đó conclusion có index=3, currentIndex=currentValue=null, foundIndex=−1, C=3, line4/finished=true. Với duplicates target=2, dừng tại index1, không xét index2.

## 5. Chứng minh bất biến, dừng và số bước

Ở đầu lượt i, bất biến: mọi j<i đều đã được so sánh và A[j] !== target; có đúng i comparison, i mismatch steps và một initial step. Khi i=0, tiền tố rỗng nên đúng. Nếu A[i] không khớp, tăng C rồi tạo mismatch; i tăng một, giữ bất biến. Nếu khớp, tiền tố trước i không có khớp và return ngay, nên i là vị trí đầu tiên. Không bước nào cần quan hệ thứ tự giữa các giá trị. Nếu vòng lặp hết, i=n và mọi phần tử không khớp, nên kết luận −1 đúng.

Vòng for có cận n cố định, i tăng sau mỗi mismatch; hoặc return sớm, hoặc hết n lượt. Bước conclusion không lặp. n=0 bỏ qua vòng lặp, chỉ initial và conclusion. Không khẳng định generator có guard stepLimit hoặc validation mà source không có.

Tại found k, xét k+1 phần tử: C=k+1; S=1+k+1=k+2=C+1. Tại miss, C=n; S=1+n+1=n+2=C+2. Mỗi comparison thành công được ghi trực tiếp ở line3, không tạo thêm step line2; mismatch cuối còn line2/finished=false trước conclusion line4. Vì default finished=false và chỉ nhánh found/conclusion đặt true rồi dừng, đúng một step cuối có finished=true.

Target là số truyền vào một lần, không được gán lại; createStep lấy cùng binding, không có fields nào ghi đè target. UI sinh trace ở prepareSteps và đọc step.target khi render. Nhập/reset thuộc trace mới hoặc trạng thái idle target=null; đó không phải target thay đổi giữa các step của trace cũ.

## 6. Chi phí core, average và bộ nhớ

Core (không lưu trace/message/UI) có công việc Θ(1+C) trong mô hình mục 2. Với n≥1, hit đầu cho C=1 nên best Θ(1); hit cuối hoặc miss cho C=n nên worst Θ(n). n=0 xử lý riêng: C=0, core Θ(1). Những ký hiệu Θ theo n mô tả họ input khi n tăng, không phải phép đo thời gian một mảng cụ thể.

Average chỉ xét **successful search**: cố định mảng gồm n≥1 giá trị phân biệt (không cần sorted), chọn target đều trong n giá trị đó. Gọi K là index khớp; P(K=k)=1/n cho k=0..n−1. Khi đó E[C]=(1/n)Σ(k+1)=(n+1)/2, nên expected core Θ(n). Không cần random hoán vị mảng. Nếu có duplicates hoặc phân phối target không đều thì K không mặc nhiên đều; nếu trộn miss phải chỉ rõ xác suất hit/miss và phân phối có điều kiện trước khi suy kỳ vọng. Cận C≤n vẫn đúng nhưng không phải công thức average.

Core auxiliary O(1) tính thêm ngoài input: chỉ cần biến i/currentValue và trạng thái hằng cho việc tìm. Generator thực tế còn giữ array steps và tạo S object, mỗi object có số trường cố định, không chứa bản copy A. Theo mô hình một số/chỉ số/tham chiếu là một word và không tính payload chuỗi message, metadata trace chiếm O(S) word (array giữ S tham chiếu và S record). S là số step, không phải byte hay số DOM node.

Giới hạn: tổng ký tự message phụ thuộc cách biểu diễn target/currentValue/index; heap engine/GC, độ rộng chỉ số, copy input ở UI [B:119–121][B19-COPY] và B:357–368, DOM/render/scheduler không nằm trong O(1) core hoặc mô hình O(S) word trên. Không gọi O(1) trên complexity card là toàn bộ bộ nhớ ứng dụng, không gán O(n·S) của trace copy mảng Sorting cho Linear Search, không tuyên bố byte/RSS đã đo.

## 7. Nguồn, policy B và các gap còn mở

- [MAP-019-I/S tại B:33–34][B19-MAPPING] là hai hàng lịch sử: implementation PRESENT, source PARTIAL; source-side chi tiết NOT VERIFIED và RIGHTS_NOT_VERIFIED. OP-19 vẫn [DEFER → EDU-2 tại B:286][B19-ROUTING]; không sửa routing hoặc 40 OP/80 mapping ID.
- [UIT-SRC-004 tại B:44–49][B19-UIT] chỉ định vị text trích xuất: PDF4, chương2, mục2.2–2.3 nhận diện chủ đề tra cứu/sắp thứ tự; chưa kiểm trực quan PDF, trang in NOT VERIFIED. Locator cụ thể §2.2 trong mapping không chứng minh strict equality JS, first-match, counters, snapshots hoặc mô hình average.
- Áp dụng [policy B tại B:203–238][B19-POLICY]: tách định danh/phạm vi UIT khỏi claim chi tiết; chứng minh trên là diễn giải độc lập từ implementation AlgoVision, không phải trích/dịch/chuyển thể giáo trình. Không tải lại UIT/OpenDSA đã dừng, không ingestion OpenStax, không thêm source ID hay nâng source_status.
- Quyền phải xét theo hành vi sử dụng thực tế. Hồ sơ chỉ thêm locator code/test và lập luận tự biên soạn; không cấp quyền sao chép/chuyển thể/tái phân phối hoặc AI ingestion tài liệu bên thứ ba. RIGHTS_NOT_VERIFIED giữ nguyên, không đồng nghĩa kết luận bị cấm.
- Gap: phản biện chứng minh/oracle và owner acceptance chưa hoàn tất; applicability/rights của nguồn học thuật chi tiết chưa xác minh. Test hiện hữu chưa khóa mọi oracle unsorted, công thức S tổng quát, mô hình average hoặc memory; không lấy test số học làm chứng minh phân phối/bộ nhớ.
- Nội dung source/tests/CI/UI không thay đổi. Luồng phản biện Codex → ChatGPT → Owner; không tự đóng A-EDU/G-EDU, C4/production hoặc mở OP19-B/OP-20.

[B19-PSEUDO]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/src/algorithms/linearSearch.js#L5-L15
[B19-STEP]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/src/algorithms/linearSearch.js#L18-L76
[B19-LOOP]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/src/algorithms/linearSearch.js#L38-L78
[B19-FOUND]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/src/algorithms/linearSearch.js#L40-L55
[B19-MISS]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/src/algorithms/linearSearch.js#L71-L78
[B19-ARRAY]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/src/searching.js#L357-L368
[B19-PREP]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/src/searching.js#L373-L386
[B19-VALUES]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/src/searching.js#L301-L325
[B19-MARKER]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/src/searching.js#L252-L258
[B19-PANEL]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/src/searching.js#L9-L24
[B19-COPY]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/src/searching.js#L119-L121
[B19-RESULT]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/tests/searching.test.js#L27-L43
[B19-EMPTY]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/tests/searching.test.js#L90-L98
[B19-INPUT]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/tests/searching.test.js#L114-L120
[B19-CONCLUSION]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/tests/searching.test.js#L125-L136
[B19-FIELDS]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/tests/searching.test.js#L179-L212
[B19-LINES]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/tests/searching.test.js#L239-L276
[B19-TRACES]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/tests/searching.test.js#L309-L321
[B19-DUP]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/tests/searching-controller.test.js#L390-L428
[B19-RESET]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/tests/searching-controller.test.js#L1418-L1443
[B19-UI-TRACE]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/tests/searching-controller.test.js#L1367-L1396
[B19-UI-PANEL]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/tests/searching-controller.test.js#L1292-L1340
[B19-COST]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/tests/complexity.test.js#L40-L44
[B19-MAPPING]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/docs/education/knowledge-mapping.md#L33-L34
[B19-ROUTING]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/docs/education/knowledge-mapping.md#L286
[B19-UIT]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/docs/education/uit-sources.md#L44-L49
[B19-POLICY]: https://github.com/Nggvanchi/AlgoVision/blob/eeb9f1a338790243187d189a40e49a3d46ffac89/docs/education/uit-sources.md#L203-L238
