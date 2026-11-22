# EDU-2 P1 — Nền tảng chi phí và Bubble Sort OP-16

18/11/2026 — **DRAFT — AWAITING_OWNER_P1_REVIEW**. Bản thảo docs-only, chưa nghiệm thu học thuật; academic PASS toàn dự án vẫn **0/40**. Ngoại lệ dependency EDU-1 chỉ áp dụng bản thảo này, không đóng EDU-1 hoặc mở P2.

## A. Phạm vi, baseline và giới hạn nguồn

Chỉ OP-16 và mô hình chi phí cần để hiểu Bubble hiện tại. Diễn giải dưới đây được xây dựng từ implementation AlgoVision và lập luận trên vòng lặp, không sao chép/chuyển thể giáo trình, code hoặc mã giả bên ngoài.

- `I` = `89cdc6187f0464276b8e4882d75061f13bda5129`, tree `e291aacc15fa5b39fb29ac68b63034c2e0b240ea`. Code/test đọc bằng git show, không thực thi.
- Checkout vẫn branch feat/ui-v2-dashboard-library, HEAD `f67539933f2f315de581f33ea3b39ee31d17cfa5`, tree `6310ef09d7440a45178189a9f4524f803dfab082`; không tương đương I. Index trước sửa SHA-256 `71e928297325c908d4fd3b061ade7cfa544ec390f97c03e4c6ef447b70489249`. Đã ghi status/diff và hash 408 file có sẵn trong bộ nhớ; bản thảo chưa tồn tại.
- Tham chiếu [mapping OP-16](knowledge-mapping.md) và [catalog nguồn](uit-sources.md). UIT-SRC-004 vẫn PARTIAL, không chứng minh phiên bản hiện hành hoặc luận giải chi tiết.
- EXT-SRC-001 Runestone §5.7 chỉ đối chiếu sự hiện diện biến thể dừng sớm; không coi thuật toán Bubble không tối ưu và biến thể dừng sớm có cùng best-case. Không lấy phân tích trung bình của nguồn làm kết luận cho code này khi chưa review giả định.
- EXT-SRC-002 OpenStax chỉ metadata/link/notice kế thừa trong catalog; không tải/đọc/trích xuất nội dung OpenStax trong P1 và không dùng sách làm evidence cho các nhận định dưới đây. Quyền dùng/AI chưa xác minh.

## B. Mô hình chi phí và các trường hợp

Gọi `n` là số phần tử đầu vào. Giả định đầu vào là mảng gồm các số hữu hạn, có thứ tự so sánh nhất quán; không mở rộng kết luận sang NaN hoặc kiểu dữ liệu tùy ý. Đây là tiền điều kiện của phân tích, không phải validation thực tế: generator không tự xác thực đầy đủ kiểu mảng hoặc tính hữu hạn của từng phần tử. Giả định truy cập phần tử, so sánh hai giá trị và đổi chỗ hai ô có chi phí hằng trong mô hình thuật toán. Đây không phải số đo thời gian JS/browser hoặc bộ nhớ byte.

Big-O biểu diễn cận trên tăng trưởng theo n; không tự nói một đầu vào cụ thể mất bao nhiêu mili giây. Với cùng n, best-case chọn đầu vào ít công việc nhất, worst-case chọn nhiều nhất; average-case cần mô hình phân phối/giả định xác suất. Các assertions trên vài đầu vào không tự chứng minh một định lý tiệm cận hay kỳ vọng.

Trong [generator tại I][G], comparisons tăng một lần cho mỗi cặp kề được xét, swaps tăng khi thực sự đổi chỗ. Không đếm số bước hiển thị, số lần kiểm cờ, sao chép mảng hoặc thao tác DOM vào comparisons. Không dùng số test làm số thao tác thuật toán.

## C. Bộ nhớ phụ, generator, snapshot và trace

| Phạm vi | Phân tích dự thảo theo code, chưa review học thuật |
|---|---|
| Lõi Bubble thao tác trên một mảng có sẵn | Chỉ cần chỉ số, cờ và biến tạm đổi chỗ: bộ nhớ phụ O(1), không tính bản thân mảng. Đây là mô hình lõi; không mô tả toàn generator. |
| Mảng làm việc của generator | Hàm copy input trước khi xử lý nên riêng mảng này đã cần O(n) ô; input của caller không bị sửa. |
| Một snapshot | Lưu bản sao array dài n, các chỉ số/counters và sortedIndices dài tối đa n: O(n) ô với n≥1 trong mô hình giá trị cố định. |
| Toàn trace | Gọi S là số step lưu lại. Riêng các bản sao array chiếm n·S ô, tổng phần dữ liệu mảng/index là O(n·S) với n≥1; còn mảng làm việc O(n). Không cộng đồng thời S snapshot rồi vẫn gọi tổng bộ nhớ O(1). |

Với generator [G] tại SHA pin khi trả về bình thường, số snapshot `S = C + W + P + 2`: C = comparisons, W = swaps, P = số lượt ngoài kết thúc (kể cả lượt dừng sớm), +2 = bước initial/final. Mỗi lần so sánh, mỗi lần swap và mỗi cuối lượt sinh một step. Với n=0/1, C=W=P=0 nên S=2. S không đồng nhất comparisons, runtime hoặc lượng bộ nhớ. Best-case đã tăng với n≥2 có S tăng tuyến tính; worst-case S tăng bậc hai. Do mỗi step copy n phần tử, phần lưu mảng của trace có thể tăng bậc hai ở best-case và bậc ba ở worst-case. Đây là **suy luận tĩnh**, chưa benchmark hoặc xác nhận RSS/heap/thời gian.

Mô hình trên chưa định lượng chuỗi message, cấp phát tạm, biểu diễn số của engine hoặc DOM/render. Thời gian sao chép snapshot cũng nằm ngoài số so sánh; không gán best O(n)/worst O(n²) của lõi cho tổng runtime generator. Reviewer cần kiểm riêng mô hình này trước P2.

## D. Hành vi Bubble và bất biến tại I

[G] duyệt phần chưa hoàn tất từ trái sang phải bằng các cặp kề. Nếu giá trị trái lớn hơn phải thì đổi chỗ, tăng swaps và bật cờ đã đổi; nếu không thì giữ nguyên. Cờ được đặt lại đầu mỗi lượt. Sau một lượt có đổi chỗ, một phần tử lớn nhất của đoạn đang xét đã về cuối đoạn đó; các lượt sau thu ngắn phạm vi để không xét lại hậu tố đã hoàn tất.

Bất biến tại ranh giới lượt: hậu tố đã hoàn tất có thứ tự và nằm ở các vị trí cuối phù hợp của kết quả tăng dần. Tại ranh giới lượt, mọi phần tử thuộc tiền tố chưa hoàn tất không lớn hơn mọi phần tử thuộc hậu tố đã hoàn tất. Khởi tạo: hậu tố hoàn tất rỗng. Duy trì: mỗi lượt đưa một phần tử lớn nhất của đoạn chưa hoàn tất về cuối đoạn, giữ hậu tố cũ và mở rộng nó. Kết thúc: hết các lượt cần thiết thì mảng có thứ tự. Nếu một lượt không có swap thì mọi cặp kề trong đoạn đang xét đã đúng thứ tự; cùng hậu tố đã hoàn tất, cả mảng có thứ tự nên dừng sớm. Nhánh này đánh dấu toàn mảng trong sortedIndices. Không suy rằng mọi phần tử của đoạn chưa hoàn tất đều đã đúng vị trí ở giữa lượt.

Lõi Bubble chỉ swap cặp kề khi giá trị trái `>` giá trị phải, nên không trực tiếp đảo hai phần tử bằng nhau. Với quan hệ so sánh nhất quán, đây là cơ sở lập luận tính ổn định của lõi; chưa có kiểm thử định danh phần tử và chưa hoàn tất phản biện nội bộ/owner acceptance về tính ổn định trong sản phẩm.

Mỗi step giữ dữ liệu riêng để UI đọc; LINE ánh xạ các nhánh so sánh/swap/kiểm cờ/break vào mã giả đã có trong source. Controller [R] render từ step, đọc counters comparisons/swaps và dùng pseudocodeLine để tô dòng mã giả. Các assertions [TS] hiện diện trong source, không phải kết quả test PASS. Không phải mọi dòng điều khiển đều sinh một snapshot. Bước đầu/cuối không tô dòng; bước cuối finished. Mảng rỗng hoặc một phần tử bỏ qua các lượt, vẫn có bước đầu/kết luận; không áp số lượt cho n≥2 vào hai trường hợp này.

## E. Best/worst và giới hạn average-case

| Trường hợp của lõi | Điều kiện và lập luận từ I | Kết luận dự thảo |
|---|---|---|
| Best-case | n≥2, mảng đã không giảm: xét n−1 cặp, không swap, kết thúc sau lượt đầu. | O(n) theo mô hình lõi; không bao gồm lưu trace. |
| Worst-case | Dãy giảm nghiêm ngặt khiến mọi cặp đang xét đều phải swap; các lượt thu ngắn cho tổng so sánh n(n−1)/2. Không có cận vòng lặp lớn hơn bậc hai. | O(n²) theo mô hình lõi; không bao gồm copy snapshot. |
| Average-case | Config [C] đang hiển thị O(n²), nhưng chưa có phân phối đầu vào và luận chứng kỳ vọng được review cho biến thể này. | **NOT VERIFIED** về xác minh học thuật trung bình. Không sửa config hoặc nâng trạng thái từ nội dung sẵn có. |

Các biểu thức trên được suy từ vòng lặp; không phải số liệu thực thi mới. [T] có assertions best/worst trên dữ liệu test cố định; việc đọc các assertions chỉ chứng minh test hiện diện, không chứng minh lần chạy hiện tại PASS hoặc mọi n đều được kiểm.

## F. Bảng nhận định, evidence và điều kiện nghiệm thu

`STATIC_SUPPORTED` = có căn cứ từ source/test đọc tại I; `DRAFT_DERIVATION` = lập luận trong bản thảo cần review; cả hai đều **REVIEW_PENDING**, không phải academic PASS. Test/build/browser/CI: **NOT RUN**.

| Nhận định | Evidence source/test tại I | Điều kiện | Trạng thái | Gap/reviewer |
|---|---|---|---|---|
| Cặp kề, swap nghiêm ngặt, cờ và dừng sớm | [G], [TS] | Số hữu hạn, cùng biến thể I | STATIC_SUPPORTED / REVIEW_PENDING | Reviewer thuật toán xác nhận từng nhánh; không dùng nguyên phân tích Bubble không dừng sớm. |
| Hậu tố hoàn tất, lượt không swap kết luận cả mảng | [G], [TI] | Đúng ranh giới lượt, không suy cho mọi trạng thái trung gian | DRAFT_DERIVATION / REVIEW_PENDING | Review cơ sở và bước duy trì bất biến; test source không thay chứng minh. |
| Kết quả tăng dần, input caller không đổi | [G], [TR] | Phạm vi input/test hợp lệ đã nêu | STATIC_SUPPORTED / REVIEW_PENDING | Assertions hữu hạn, chưa chạy; không mở hợp đồng cho NaN. |
| Best O(n), worst O(n²) của lõi | [G], [C], [T] | Mô hình đơn vị chi phí và điều kiện mục E | DRAFT_DERIVATION / REVIEW_PENDING | Review công thức/cận; không dùng test presence làm chứng nhận tiệm cận. |
| Average-case O(n²) đang được config hiển thị | [C] | Chỉ xác nhận nội dung config hiện có | NOT VERIFIED học thuật | Thiếu mô hình phân phối/luận chứng; giữ gap, không tự patch. |
| O(1) phụ của lõi khác copy O(n), snapshot O(n), trace O(n·S) | [G] | n≥1; đếm ô dữ liệu, không byte/DOM/engine | DRAFT_DERIVATION / REVIEW_PENDING | Reviewer thuật toán kiểm mô hình lưu trace; không có benchmark. |
| LINE/finished và đầu vào rỗng/một phần tử | [G], [TS], [TR] | Mã giả của AlgoVision tại I | STATIC_SUPPORTED / REVIEW_PENDING | Không sao chép mã giả sách; test source chưa được thực thi. |

Acceptance P1: chỉ hai file được duyệt thay đổi; nguồn mới có ID/metadata/giới hạn/attribution và quyền được ghi riêng; mỗi nhận định truy vết được tới đúng I hoặc lập luận được đánh dấu; average/AI/quyền thiếu vẫn NOT VERIFIED. Giữ nguyên 80 mapping ID, 6 nguồn UIT, academic PASS 0/40 và các gate cũ. Kiểm Markdown/link, UTF-8 không BOM/LF, whitespace, diff/status/hash và HEAD/index; không cần test/build vì không sửa sản phẩm.

Review OP-16 theo luồng nội bộ trong [catalog, mục 10.3](uit-sources.md#103-ranh-giới-tham-khảo-và-tái-sử-dụng): **Codex** đối chiếu code/test, lập luận, nguồn và evidence đúng SHA, phân loại từng nhận định → **ChatGPT** phản biện lượt hai, đối chiếu bằng chứng truy cập hợp lệ, nêu thiếu sót/bất đồng → **Owner** phê duyệt cuối cùng theo phạm vi và bằng chứng. Nhận định chưa được owner nghiệm thu giữ **PENDING_REVIEW**; không coi phản biện này là chứng nhận học thuật độc lập. Không bắt buộc reviewer/giảng viên bên ngoài hoặc biên bản hình thức; không miễn academic/rights gate. Review quyền theo từng hành vi sử dụng; owner approval không cấp quyền nội dung bên thứ ba. Chưa kết luận CC BY-NC-SA tương thích với AlgoVision, quyền tái phân phối hoặc sử dụng nội dung trong AI; giữ RIGHTS_NOT_VERIFIED khi thiếu bằng chứng, gồm quyền dùng OpenStax trong AI. Chỉ đề nghị **READY_FOR_OWNER_P1_REVIEW** về bản thảo có gap công khai; không tự mở P2, OP-17…20 hoặc EDU-3–4.

## G. Chứng minh bổ sung EDU-1D

**REVIEW_PENDING — chứng minh nội bộ từ implementation, chưa nghiệm thu học thuật.** Baseline đối chiếu: `b29e4c221c6887eb8eeb9ab9fc5872eac46c79d0`; generator không đổi so với I. Các trạng thái NOT VERIFIED ở mục E/F là trạng thái nghiệm thu, không được nâng bởi phần bổ sung này.

Gọi I₀ là số cặp vị trí p<q có A[p]>A[q] trong input. Giữ giả định mục B. Trong [generator tại baseline](https://github.com/Nggvanchi/AlgoVision/blob/b29e4c221c6887eb8eeb9ab9fc5872eac46c79d0/src/algorithms/bubbleSort.js#L42), mỗi swap kề chỉ xảy ra khi trái lớn hơn phải (dòng 59–65). Swap loại đúng một nghịch thế giữa hai phần tử đó; tổng quan hệ nghịch thế với mọi phần tử khác không đổi. Do kết quả cuối có thứ tự, số nghịch thế cuối bằng 0, nên tổng swaps W=I₀.

Early exit không phá đẳng thức: một lượt không swap chứng minh đoạn còn xét không giảm; kết hợp bất biến hậu tố ở mục D, toàn mảng có thứ tự, không còn nghịch thế bị bỏ lại. Mỗi swap cần một comparison, còn các vòng lặp thu hẹp cho C≤n(n−1)/2; vì vậy W≤C≤n(n−1)/2 với n≥1.

**Mô hình trung bình có điều kiện:** n≥2, input là hoán vị ngẫu nhiên đều của n giá trị phân biệt. Với mỗi cặp vị trí p<q, biến chỉ báo nghịch thế có kỳ vọng 1/2. Theo tính tuyến tính của kỳ vọng, E[I₀]=n(n−1)/4; không cần giả định các biến chỉ báo độc lập. Từ E[W]=E[I₀]≤E[C]≤n(n−1)/2 suy ra E[C]=Θ(n²). Trong mô hình đơn vị chi phí của lõi, thao tác vòng lặp/kiểm cờ/swap có tổng chi phí O(C+n), nên expected cost lõi là Θ(n²). Early exit giữ lợi ích best-case nhưng không phá cận kỳ vọng này.

Với duplicates, W=I₀ vẫn đúng cho nghịch thế nghiêm ngặt, nhưng công thức kỳ vọng trên không tự áp dụng; không kết luận Θ(n²) cho mọi phân phối. Khi n=0/1: I₀=C=W=P=0, không chạy lượt ngoài và S=2. Công thức S=C+W+P+2 ở mục C giữ nguyên. Bộ nhớ phụ lõi O(1), copy input O(n), snapshot O(n) và trace O(n·S) với n≥1 là các phạm vi riêng; n=0 vẫn có overhead của hai step. Expected cost lõi không phải runtime generator, thời gian sao chép hoặc số byte bộ nhớ.

Chứng minh này không lấy phân tích trung bình từ Runestone/OpenStax, không sao chép biểu đạt giáo trình và không thay A-EDU/G-EDU. Cần phản biện nội bộ và owner nghiệm thu riêng; giữ EDU-1 PARTIAL, academic PASS 0/40 và RIGHTS_NOT_VERIFIED.

[G]: https://github.com/Nggvanchi/AlgoVision/blob/89cdc6187f0464276b8e4882d75061f13bda5129/src/algorithms/bubbleSort.js#L20
[C]: https://github.com/Nggvanchi/AlgoVision/blob/89cdc6187f0464276b8e4882d75061f13bda5129/src/sorting.js#L79
[R]: https://github.com/Nggvanchi/AlgoVision/blob/89cdc6187f0464276b8e4882d75061f13bda5129/src/sorting.js#L197
[T]: https://github.com/Nggvanchi/AlgoVision/blob/89cdc6187f0464276b8e4882d75061f13bda5129/tests/complexity.test.js#L20
[TS]: https://github.com/Nggvanchi/AlgoVision/blob/89cdc6187f0464276b8e4882d75061f13bda5129/tests/sorting.test.js#L320
[TI]: https://github.com/Nggvanchi/AlgoVision/blob/89cdc6187f0464276b8e4882d75061f13bda5129/tests/sorting.test.js#L398
[TR]: https://github.com/Nggvanchi/AlgoVision/blob/89cdc6187f0464276b8e4882d75061f13bda5129/tests/sorting.test.js#L58
