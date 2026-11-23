# OP-18 — Hồ sơ claim và provenance Insertion Sort

23/11/2026 — **EDU-2A-P1 / REVIEW_PENDING**. Chỉ hồ sơ docs-only; chưa nghiệm thu học thuật hoặc triển khai P2. **Academic PASS 0/40; RIGHTS_NOT_VERIFIED** giữ nguyên. OP-18 vẫn DEFER_TO_EDU_2_3_4 theo [disposition đã duyệt](knowledge-mapping.md#8-disposition-40-op--edu-1f), không đổi thành READY/PASS vì có hồ sơ mới.

## 1. Baseline và cách đọc evidence

- `B = ee92d767a640f3338ac56cd798e58e614b956306`; mọi locator source/test trong hồ sơ này pin B, không dùng checkout chính cũ làm baseline.
- Generator `src/algorithms/insertionSort.js` có blob `ebcc10d596483a10bc649d4bdb972d8a9d7a1477`, giống I `89cdc6187f0464276b8e4882d75061f13bda5129` và `b29e4c221c6887eb8eeb9ab9fc5872eac46c79d0`. Vì vậy [lập luận EDU-1D](knowledge-mapping.md#71-op-18-key-shifts-và-nghịch-thế) còn áp dụng cho cùng code; không đồng nghĩa đã nghiệm thu.
- [Config B:114–128][B18-C] vẫn có nội dung Insertion chung, cards O(n)/O(n²)/O(n²)/O(1). Hồ sơ không sửa các chuỗi/cards và không lấy chúng làm chứng minh.
- `STATIC_SUPPORTED`: đọc trực tiếp nhánh source/test. `DRAFT_DERIVATION`: lập luận hoặc oracle tĩnh cần phản biện. Cả hai đều **REVIEW_PENDING**, không phải academic PASS.
- Test evidence chỉ ghi assertion hiện diện, không phải lần chạy PASS; test/build/browser/CI **NOT RUN**. Không import/chạy generator để lập hồ sơ.
- B18 là ký hiệu link evidence, không phải source ID hoặc mapping ID mới.

## 2. Tiền điều kiện và mô hình chi phí

Phân tích trên mảng n số hữu hạn, so sánh nhất quán; đọc/ghi một ô, so sánh hai giá trị và giữ key có chi phí hằng. Đây là tiền điều kiện học thuật, không khẳng định generator đã validation đầu vào; không mở hợp đồng sang NaN, object hoặc comparator tùy ý.

Gọi C là `comparisons`, H là `shifts`, W là `swaps`, S là số snapshot lưu lại. [B:43–65][B18-LOOP] tăng C khi thực sự xét A[j] với key, H khi ghi A[j+1]=A[j]. Kiểm j≥0, gán/giảm chỉ số, chèn key cuối lượt, copy và render không được cộng vào hai counters này. W khởi tạo 0 và không tăng; không gọi một shift là một swap. S không phải C hoặc thời gian thực.

## 3. Claim matrix tại B

Mọi hàng dưới dùng tiền điều kiện mục 2, chứng minh tự biên soạn từ code và giới hạn review đã nêu. Các phép chứng minh chi tiết ở mục 5–6 hoặc mapping được dẫn, không lấy đề mục UIT làm bằng chứng cho công thức.

| Claim | Biến thể / lập luận | Evidence SHA:line tại B | Test evidence tại B | Giới hạn / trạng thái |
|---|---|---|---|---|
| Giữ key riêng; dời chỉ phần tử lớn hơn key | key=A[i]; dừng khi A[j]≤key; j giảm sau shift; chèn lại ở j+1 | [Generator B:39–95][B18-PASS] | [sorting B:260–278][B18-KEY] | while trong code tách khác điều kiện kết hợp của mã giả; không tạo API mới. STATIC_SUPPORTED / REVIEW_PENDING. |
| Bất biến tiền tố và kết thúc | Ở đầu lượt i, A[0..i−1] không giảm và là các phần tử của tiền tố input đã xử lý; dời các phần tử lớn hơn, chèn key, mở rộng thêm một; xem mục 5 | [B:39–95][B18-PASS] | [sorting B:25–105][B18-CASES] kiểm kết quả; kiểm sortedIndices đơn điệu B:231–252 không thay chứng minh | Không diễn giải sortedIndices như toàn bộ dữ liệu giữa lượt đã hoàn tất. DRAFT_DERIVATION / REVIEW_PENDING. |
| Snapshot giữa shift có bản sao tạm | array copy giữ trạng thái vật lý; key có trong trường riêng; chèn key mới khôi phục đủ dữ liệu tại ranh giới lượt | [B:46–78][B18-LOOP], [render key B:181–210][B18-RENDER] | [controller B:428–469][B18-TC] có [85,47] → [85,85] và key47 | Không yêu cầu mọi array snapshot là hoán vị input, không thêm field “ô trống” vào source. STATIC_SUPPORTED / REVIEW_PENDING. |
| H=I₀, W=0; I₀≤C≤I₀+n−1 khi n≥1 | Mỗi shift xử lý một cặp nghịch thế của key; mỗi lượt thêm tối đa một comparison không shift; mục 5 | [B:22–24][B18-INIT], [B:43–83][B18-LOOP] | [sorting B:125–130][B18-COUNT] kiểm [3,2,1]; [complexity B:33–37][B18-T] kiểm tăng/giảm | Chưa có test tổng quát H=I₀ hoặc toàn miền input; không đếm kiểm biên vào C. DRAFT_DERIVATION / REVIEW_PENDING. |
| Best/worst và average-case lõi | Best Θ(n), worst Θ(n²), n≥2; average theo mô hình mục 6; không dựa vào tốc độ JS | [B:39–95][B18-PASS]; [chứng minh EDU-1D](knowledge-mapping.md#72-mô-hình-kỳ-vọng-và-giới-hạn) | complexity B:33–37 chỉ kiểm hai input với n=8 | Không chứng minh mọi phân phối bằng vài test; nghiệm thu average NOT VERIFIED. DRAFT_DERIVATION / REVIEW_PENDING. |
| Stability của lõi | Chỉ vượt qua phần tử >key; phần tử bằng key không bị dời qua nó | [B:60–65][B18-STOP] | sorting B:42–45 kiểm số trùng; controller B:471 kiểm nhãn key trùng | Không phải test identity; generator/UI hiện chỉ dùng số, không có nhãn a/b hoặc comparator. DRAFT_DERIVATION / REVIEW_PENDING. |
| Core/copy/snapshot/trace | Core phụ O(1); working copy O(n); một snapshot O(n); trace O(n·S) với n≥1; xem mục 7 | [B:18–37][B18-INIT], [B:46–95][B18-LOOP], [B:107–119][B18-END] | Test source kiểm input/key/kết quả, chưa benchmark heap/RSS/byte | Phân biệt thuật toán lõi với hệ thống lưu bước; message/engine/DOM ngoài mô hình. DRAFT_DERIVATION / REVIEW_PENDING. |
| Edge cases và LINE/finished | n=0/1: C=H=W=0, S=2, key=null đầu/cuối; LINE so sánh/dời/chèn=4/5/7; chỉ cuối finished | [B:2–16][B18-CODE], [B:26–37][B18-INIT], [B:99–119][B18-END] | sorting B:133–191, [B:274–278][B18-KEY-END], [B:379–395][B18-LINE] | Test hiện diện không phải runtime PASS; không giả định mọi dòng mã giả có một step. STATIC_SUPPORTED / REVIEW_PENDING. |

## 4. Minh họa oracle [3,1,2] — dò tay tĩnh

Dò các nhánh B:39–95, không thực thi generator/test. C/H/W là counters tích lũy; cột “dòng mã giả” là giá trị `pseudocodeLine`, khác số dòng file JS.

| Step | Sự kiện theo source | array | key | C | H | W | Dòng mã giả |
|---|---|---|---|---|---|---|---|
| 0 | Khởi tạo | [3,1,2] | null | 0 | 0 | 0 | null |
| 1 | i=1, key=1; xét 3>1 | [3,1,2] | 1 | 1 | 0 | 0 | 4 |
| 2 | Dời 3 sang phải | [3,3,2] | 1 | 1 | 1 | 0 | 5 |
| 3 | j<0; chèn 1 | [1,3,2] | 1 | 1 | 1 | 0 | 7 |
| 4 | i=2, key=2; xét 3>2 | [1,3,2] | 2 | 2 | 1 | 0 | 4 |
| 5 | Dời 3 sang phải | [1,3,3] | 2 | 2 | 2 | 0 | 5 |
| 6 | Xét 1≤2; dừng dời | [1,3,3] | 2 | 3 | 2 | 0 | 4 |
| 7 | Chèn 2 | [1,2,3] | 2 | 3 | 2 | 0 | 7 |
| 8 | Hoàn thành | [1,2,3] | null | 3 | 2 | 0 | null |

Cuối hai lượt là [1,3,2] rồi [1,2,3]. I₀=2 gồm hai cặp giá trị (3,1), (3,2); C=3, H=2, W=0. Chỉ step 8 có `finished=true`; các step trước không đặt `finished`. Step 2/5 vẫn chứa bản sao tạm; key chỉ chuyển về null ở step hoàn thành, không phải ngay sau mỗi lần chèn.

Đây là oracle mới trong tài liệu, **chưa có test case [3,1,2] được bổ sung/chạy**. Test B:125 kiểm [3,2,1] với C=H=3, là evidence khác, không giả làm test cho bảng này.

## 5. Bất biến, nghịch thế và counters

Khi i=1, tiền tố một phần tử đã có thứ tự. Giữ key của vị trí i, lần lượt dời những phần tử tiền tố lớn hơn key sang phải; các phần tử còn lại không bị đổi thứ tự. Chèn key vào vị trí vừa tạo sẽ cho tiền tố dài i+1 không giảm và bảo toàn các phần tử của tiền tố input đã xử lý. i tăng đến n−1 thì kết quả có thứ tự. Trong vòng trong, j giảm sau mỗi shift hoặc break khi A[j]≤key, nên có tiến triển hữu hạn. File chưa có guard stepLimit; không suy rằng mọi while đã được bảo vệ bằng guard, và không sửa source trong P1.

Với mỗi key, số phần tử đứng trước lớn hơn nó là số nghịch thế kết thúc ở phần tử đó trong input. Mỗi phần tử như vậy bị dời đúng một lần khi chèn key; các cặp nghịch thế được phân chia theo phần tử bên phải. Do đó H=I₀, kể cả duplicates nếu chỉ đếm quan hệ >. Đây là lập luận trên các phần tử logic, không phải đếm nghịch thế trên array snapshot có bản sao tạm.

Mỗi shift có một comparison. Mỗi lượt có thêm tối đa một comparison kết thúc do A[j]≤key; nếu j xuống −1 thì không có comparison bổ sung. Với n≥1, C=H+F, 0≤F≤n−1, suy ra I₀≤C≤I₀+n−1. Với n=0, xử lý riêng C=H=W=0; không áp cận trên I₀+n−1 âm.

## 6. Best/average/worst và stability

- n≥2, input đã không giảm: C=n−1, H=W=0; core best Θ(n).
- n≥2, input giảm nghiêm ngặt: C=H=n(n−1)/2, W=0; core worst Θ(n²).
- Chỉ dưới mô hình hoán vị ngẫu nhiên đều của n giá trị phân biệt, n≥2: dùng E[I₀]=n(n−1)/4 từ [chứng minh chỉ báo Bubble](edu-2-cost-and-bubble-draft.md#g-chứng-minh-bổ-sung-edu-1d). Khi đó E[H]=n(n−1)/4 và n(n−1)/4≤E[C]≤n(n−1)/4+n−1. Lõi có công việc Θ(n+C+H), nên expected cost Θ(n²). Không nhân bản chứng minh chỉ báo và không áp kỳ vọng này cho mọi phân phối hoặc duplicates.
- Cơ sở stability là nhánh dừng A[j]≤key: không dời phần tử bằng key qua key. Đây là lập luận lõi theo so sánh nghiêm ngặt; chưa chứng minh bằng test identity sản phẩm. Không đưa dữ liệu gắn nhãn hoặc object vào API số hiện tại.

Những cận lõi này không phải runtime generator/DOM. Cards đang có O(n²) không thay được giả định average hoặc quyết định nghiệm thu; **REVIEW_PENDING**, nghiệm thu average **NOT VERIFIED**.

## 7. Bộ nhớ và số snapshot

Theo mô hình ô dữ liệu của [Bubble mục C](edu-2-cost-and-bubble-draft.md#c-bộ-nhớ-phụ-generator-snapshot-và-trace), lõi trên mảng có sẵn cần chỉ số/key nên O(1) phụ. Generator copy input O(n); mỗi step copy array dài n và sortedIndices tối đa n, cùng counters/key nên O(n) cho một snapshot, O(n·S) cho trace khi n≥1. Input caller không bị sửa; không nhầm tổng generator là in-place O(1).

Gọi P=max(n−1,0) là số lượt chèn. Source phát một step cho mỗi comparison, mỗi shift, mỗi lần chèn và hai step đầu/cuối: S=C+H+P+2. Oracle mục 4 có S=3+2+2+2=9. n=0/1 có S=2, C=H=0; mảng rỗng vẫn có overhead hai step. Công thức S là suy luận tĩnh từ các lệnh lưu bước, chưa có test tổng quát hoặc benchmark mới; không suy chi phí message, byte/heap, cấp phát tạm hoặc tốc độ browser.

## 8. Quyền sử dụng và gate còn mở

Hồ sơ tự diễn giải code AlgoVision tại B và kế thừa lập luận EDU-1D được định vị rõ. Không sao chép/dịch/chuyển thể văn bản, code, hình, ví dụ hoặc bài tập của tài liệu bên thứ ba. Không thêm source ID, nâng source_status hoặc sửa catalog `uit-sources.md`.

| Hành vi | Phạm vi hồ sơ này | Trạng thái / điều kiện |
|---|---|---|
| Metadata/link và locator | Dẫn source/test AlgoVision, mapping và policy đã có | Không dùng link như quyền sao chép tài liệu đích hoặc chứng minh claim nguồn bên ngoài. |
| Diễn giải/chứng minh độc lập | Mục 3–7 từ code B; oracle tự dò, không lấy từ giáo trình | Provenance có thể review; tính độc lập biểu đạt và claim cần ChatGPT phản biện/Owner quyết định. Chưa academic PASS. |
| Trích dẫn, sao chép, dịch/chuyển thể, tái phân phối học liệu bên thứ ba | Không thực hiện | Nếu sau này dùng, phải có evidence đúng tài nguyên/hành vi; phần thiếu giữ RIGHTS_NOT_VERIFIED, không tự xác nhận tương thích giấy phép. |
| AI và OpenStax | Không tải/đọc/đưa thêm học liệu OpenStax vào AI; chỉ giữ tham chiếu policy hiện hữu | Không suy quyền AI từ notice hoặc khả năng truy cập. RIGHTS_NOT_VERIFIED giữ nguyên theo từng hành vi thiếu evidence. |

Áp dụng [policy B và quyền theo hành vi](uit-sources.md#11-policy-b-và-quyền-theo-hành-vi--edu-1f); hồ sơ không xác minh quyền đối với nguồn bên ngoài hoặc mở rộng phạm vi Runestone/UIT. EDU-1G đóng gate hồ sơ nguồn/mapping, **không** đóng gate claim; academic PASS vẫn 0/40. Các nhận định nguồn/quyền và MAP-018-S chưa đủ evidence vẫn NOT VERIFIED.

Điều kiện tiếp theo: phản biện từng claim (đặc biệt invariant, H=I₀, cận C, average, stability, memory), review biểu đạt/quyền theo sử dụng thật, rồi Owner quyết định acceptance riêng. Test tổng quát, runtime/identity, cập nhật sản phẩm và P2 còn cần duyệt riêng; không tự đánh dấu đã thực hiện hoặc PASS.

[B18-C]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/src/sorting.js#L114
[B18-PASS]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/src/algorithms/insertionSort.js#L39
[B18-LOOP]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/src/algorithms/insertionSort.js#L43
[B18-INIT]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/src/algorithms/insertionSort.js#L18
[B18-STOP]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/src/algorithms/insertionSort.js#L60
[B18-END]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/src/algorithms/insertionSort.js#L99
[B18-CODE]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/src/algorithms/insertionSort.js#L2
[B18-KEY]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/tests/sorting.test.js#L260
[B18-KEY-END]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/tests/sorting.test.js#L274
[B18-COUNT]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/tests/sorting.test.js#L125
[B18-T]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/tests/complexity.test.js#L33
[B18-LINE]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/tests/sorting.test.js#L379
[B18-CASES]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/tests/sorting.test.js#L25
[B18-TC]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/tests/sorting-controller.test.js#L428
[B18-RENDER]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/src/sorting.js#L181
