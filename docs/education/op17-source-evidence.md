# OP-17 — Hồ sơ evidence Selection Sort

> **Đối chiếu hiện hành EDU-2A-P1 (23/11/2026):** xem [mục 8](#8-edu-2a-p1). Mục 1–7 giữ nguyên là hồ sơ lịch sử; academic PASS **0/40**, quyền **RIGHTS_NOT_VERIFIED** và review claim chưa đóng.

Ngày lập hồ sơ: 22/11/2026. Phạm vi: nội dung Learning Panel và regression OP-17.
Trạng thái: OWNER DOC PATCH REVIEW; không phải quyết định đóng technical hoặc academic gate.

## 1. Technical baseline và provenance

- Technical commit: `2bddf29c36aa13f62da0c587c864a346d6c19816`.
- Tree: `783ed15727e672f6736698b534230a7bfa8faac8`; parent: `95a3ff40fc9d6143fcef82d91fef986d859792ec`.
- Commit kỹ thuật chỉ thay ba chuỗi Selection trong `src/sorting.js` và regression controller.
- Mọi file:line trong hồ sơ này áp dụng technical commit trên; không dùng checkout cũ làm baseline code.
- Provenance MAP-017-S: `D:\Code\Projects\algovision\docs\education\knowledge-mapping.md:26`.
- SHA-256 nguyên file mapping, trực tiếp kiểm trước khi tạo hồ sơ: `e4c4f0ba7a1f6b76dcc371f97c33d295f91dc32f76f71be222cb22cf2765b638`.
- Mapping là WIP untracked tại checkout cũ; không có trong baseline/worktree docs, không được nhập vào đây.
- Mapping lịch sử pin source/test tại `89cdc6187f0464276b8e4882d75061f13bda5129`; không thay baseline đó bằng commit OP-17.
- MAP-017-S giữ NOT VERIFIED, UIT-SRC-004 PARTIAL, RIGHTS_NOT_VERIFIED; không sửa ID hoặc hàng gốc.
- Catalog lịch sử có 8 source ID; mapping có 80 ID/40 OP. Hồ sơ này không tạo source ID/mapping ID mới.

## 2. Claim → source → implementation/test → status

PASS kỹ thuật dưới đây chỉ là kết luận đối chiếu; không đồng nghĩa A-EDU PASS hoặc test vừa được chạy.

| Chuỗi / claim | Nguồn và locator | Implementation / regression tại technical SHA | Kết luận và giới hạn |
|---|---|---|---|
| Description: tiền tố có thứ tự/đúng vị trí, không lớn hơn hậu tố; minIndex; ví dụ | Toronto §18.2: Some loop invariants; Implementing the loop | [Controller](../../src/sorting.js):106; [generator](../../src/algorithms/selectionSort.js):37–57, 91–100; [test](../../tests/sorting-controller.test.js):754, 787, 804 | PASS kỹ thuật. Ví dụ từng lượt: [4,3,2,1] → [1,3,2,4] → [1,2,3,4] → [1,2,3,4]. |
| Advantages: n(n−1)/2 comparisons, best/worst Θ(n²) với n≥2, swaps ≤n−1 | Toronto §18.2: Running-time analysis; OpenDSA §12.6.1: bảng comparisons/swaps | Controller:109; generator:37–41, 73–77; test:733, 743, 754, 787 | PASS kỹ thuật. Công thức comparisons và cận actual swap được suy trực tiếp từ vòng lặp; không lấy số swap của biến thể khác. |
| Disadvantages: lõi O(1), copy O(n), trace O(n·S); swap xa có thể phá stability | Toronto §18.2: In-place selection sort; MIT R3 trang PDF 3: In-place and Stability | Controller:111; generator:20–26, 43–44, 59–60, 73–92; test:754, 804, 832 | PASS trong mô hình đã nêu. S là số snapshot; không đồng nhất chi phí trace với lõi/runtime. Chưa kiểm identity sản phẩm. |

Tiền điều kiện phân tích: mảng số hữu hạn, quan hệ so sánh nhất quán và thao tác phần tử chi phí hằng.
Generator không tự xác thực đầy đủ dữ liệu; luồng UI Sorting hiện chỉ tạo mảng ngẫu nhiên.

## 3. Actual swap khác self-swap

- AlgoVision chỉ thực hiện swap và tăng counter khi `minIndex !== i` (generator:73–77).
- Có tối đa n−1 lượt ngoài khi n≥1; mỗi lượt có tối đa một actual swap, có thể không swap.
- Oracle [4,3,2,1]: comparisons tích lũy 3/5/6; actual swaps 1/2/2; lượt cuối không đổi mảng.
- Toronto gọi phép gán hoán đổi cả khi hai chỉ số trùng; vòng ngoài còn xét phần tử cuối.
- MIT chọn max về cuối, gọi swap vô điều kiện mỗi lượt; khác chiều chọn min về đầu của AlgoVision.
- Bảng OpenDSA có swaps Θ(n) cả best-case theo biến thể của nguồn; không áp nguyên cho counter AlgoVision.
- Mảng đã tăng có 0 actual swap trong AlgoVision; điều này không mâu thuẫn best comparisons Θ(n²).

## 4. Nguồn, khả năng truy xuất và quyền

Các quan sát web sau tái sử dụng lượt source review ngày 22/11/2026; không truy cập lại khi lập hồ sơ.
VERIFIED chỉ áp dụng phần đã đọc; không xác nhận phiên bản mới nhất, độ phủ toàn OP hoặc quyền sử dụng.

| Nguồn / URL | Locator và khả năng truy xuất đã ghi nhận | License / giới hạn |
|---|---|---|
| [UIT IT003](https://cntt.uit.edu.vn/attachments/article/4872/decuong_IT003.pdf) | §2.3.3 chọn trực tiếp; định vị lịch sử chương 2/PDF 4, trang in NOT VERIFIED. URL hiện chuyển sang trang khoa; catalog PARTIAL, chưa chứng minh phiên bản hiện hành. | Quyền sao chép/chuyển thể/tái phân phối/AI NOT VERIFIED. Đề cương chủ đề không chứng minh các claim chi tiết. |
| [Toronto — Selection Sort](https://www.teach.cs.toronto.edu/~csc110y/fall/notes/18-sorting/02-selection-sort.html) | Foundations of Computer Science, David Liu và Mario Badr, §18.2. VERIFIED phần in-place/invariant/helper/analysis đã đọc; ngày/revision cố định NOT VERIFIED. | Chưa xác minh giấy phép tái sử dụng; không sao chép code, ví dụ hoặc biểu đạt của nguồn. |
| [OpenDSA — The Cost of Exchange Sorting](https://opendsa.org/OpenDSA/Books/Catalog/html/ExchangeSort.html) | Complete Catalog §12.6.1, bảng chi phí. PARTIAL: có bản lập chỉ mục tìm kiếm; mở trực tiếp timeout. Không gán revision chưa kiểm. | [Notice MIT License](https://opendsa.org/home/license) thấy qua bản lập chỉ mục; mở notice trực tiếp timeout. Chưa nghiệm thu applicability cho nội dung được dùng. |
| [MIT 6.006 — Recitation 3](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/1869dbf640ded6b31f1bd369d2001ef5_MIT6_006S20_r03.pdf) | Spring 2020; Erik Demaine, Jason Ku, Justin Solomon là instructors. VERIFIED trang PDF 3 (tính từ 1), nhãn trang 3: Selection Sort / In-place and Stability. | [OCW terms](https://ocw.mit.edu/pages/privacy-and-terms-of-use/) ghi CC BY-NC-SA 4.0 với điều kiện attribution, NonCommercial, ShareAlike; chưa kết luận tương thích cách tái sử dụng cụ thể của AlgoVision. |

Dẫn link, tham khảo kiến thức, diễn giải độc lập, trích dẫn, chuyển thể, tái phân phối và nạp AI là các hành vi khác nhau.
Khả năng đọc/notice giấy phép không tự cấp mọi quyền; owner approval không thay giấy phép bên thứ ba.
Hồ sơ chỉ ghi locator/nhận định đối chiếu, không chép hoặc dịch code, mã giả, hình, ví dụ hay đoạn giáo trình.
Source rights của OP-17 chưa được nghiệm thu đầy đủ; giữ RIGHTS_NOT_VERIFIED ở cấp acceptance.

## 5. Evidence kiểm chứng đã có

- Lượt OP-17 P2 FIX trước khi commit: targeted 84/84 PASS; full 1804/1804 PASS, fail/skipped/todo = 0.
- Assertion complexity chấp nhận cách viết chung/riêng, đảo thứ tự và whitespace; phản ví dụ best Θ(n), worst Θ(n²) bị bắt.
- Kiểm âm tạm nằm trong file test, đã khôi phục nguyên byte; không thay source để kiểm âm P2.
- Build trước đó PASS: raw JS 153424 B ≤154000 B, CSS 58010 B ≤58500 B.
- Chrome QA trước P2: 360/1280px, chọn Kiến thức bằng keyboard/focus, không tràn ngang, console sạch trong phạm vi đã kiểm.
- P2 chỉ thay test; source không đổi. QA trên không phải kiểm toàn diện accessibility/device/production.
- Đây là evidence từ hội thoại owner đã nghiệm thu về phạm vi; không tạo run URL, log hoặc chữ ký reviewer giả.
- Lượt tạo hồ sơ docs không chạy lại test/build/browser/CI; không trình số liệu lịch sử thành lần đo mới.

## 6. Acceptance còn mở

- Academic PASS giữ 0/40; EDU-1 PARTIAL — MAPPING COMPLETE / ACADEMIC PENDING.
- Average-case chưa nghiệm thu học thuật; complexity cards hiện hành không được thay đổi hoặc nâng trạng thái.
- MAP-017-S/A-EDU/G-EDU không được đóng bằng hồ sơ này; nguồn/quyền còn phải owner quyết định.
- Technical closeout, commit tài liệu, push/PR và kế hoạch OP-18 là các phê duyệt riêng.
- Không nhập catalog/mapping/scope C1/Bubble; không có dependency tương đối tới các file chưa tồn tại.
- Dừng tại OWNER DOC PATCH REVIEW; chưa stage/commit/push/merge hoặc mở giai đoạn tiếp theo.

## 7. Chứng minh bổ sung EDU-1D

**REVIEW_PENDING — lập luận nội bộ, không phải academic acceptance.** Tại [generator baseline b29e4c221c6887eb8eeb9ab9fc5872eac46c79d0](https://github.com/Nggvanchi/AlgoVision/blob/b29e4c221c6887eb8eeb9ab9fc5872eac46c79d0/src/algorithms/selectionSort.js#L37), vòng ngoài i=0…n−2 và vòng trong j=i+1…n−1 cho C=Σ(i=0…n−2)(n−i−1)=n(n−1)/2, với n≥1. Công thức không phụ thuộc thứ tự hoặc số giá trị trùng. Với n=0, vòng lặp rỗng và C=0; n=1 cũng có C=0.

Với n≥2 trong mô hình phần tử hữu hạn, so sánh nhất quán và thao tác phần tử chi phí hằng, best/worst Θ(n²) theo comparisons. Vì C cố định trên mọi input hợp lệ cùng n, E[C]=n(n−1)/2 với mọi phân phối trên các input đó; không cần giả định hoán vị đều. Lõi chỉ thêm công việc O(C+n), nên best/worst/average của lõi đều Θ(n²) trong mô hình này.

Actual swaps W chỉ tăng khi minIndex≠i (dòng 73–77), nên 0≤W≤n−1 với n≥1; mảng đã không giảm có W=0. Không suy số swaps cố định hoặc Θ(n) best-case từ công thức comparisons. Giữ phân biệt Toronto có self-swap, MIT chọn max về cuối và bảng OpenDSA theo biến thể nguồn như mục 3.

Core O(1) bộ nhớ phụ không bao gồm copy O(n), snapshot O(n) hoặc trace O(n·S) với n≥1. Chứng minh cost lõi không phải phân tích runtime generator. Các kết luận average-case chưa nghiệm thu trong hồ sơ lịch sử vẫn giữ nguyên; nguồn/quyền dùng chưa nghiệm thu đầy đủ, RIGHTS_NOT_VERIFIED và academic PASS 0/40. Cần phản biện nội bộ/owner acceptance, không dùng phần này tự đóng MAP-017-S/A-EDU/G-EDU.

## 8. EDU-2A-P1

Đối chiếu ngày 23/11/2026, **STATIC_SUPPORTED / REVIEW_PENDING**, không nghiệm thu claim học thuật. Base `B = ee92d767a640f3338ac56cd798e58e614b956306`. Mục 1–7 giữ nguyên là hồ sơ lịch sử gắn technical SHA; các con số test/build/browser tại mục 5 không phải kết quả của P1.

### Nối technical baseline với B

So Git blob trực tiếp tại B, technical commit `2bddf29c36aa13f62da0c587c864a346d6c19816` và `b29e4c221c6887eb8eeb9ab9fc5872eac46c79d0`:

| File | Blob chung tại ba mốc |
|---|---|
| `src/algorithms/selectionSort.js` | `3bccb58edd0e30b0fef409544404c49bfdcc8238` |
| `src/sorting.js` | `b99bda6de7114b5ab71e307903567269ea48e90a` |
| `tests/sorting-controller.test.js` | `5e5fe6f6978bd50a70276859cb94015041f91f88` |

Vì các file này cùng blob, locator kỹ thuật và oracle tại mục 2–3 còn đối chiếu được tại B; điều này không tái chạy hoặc kéo dài hiệu lực runtime QA/CI từ SHA cũ. Mapping nay đã được commit tại B; ghi chú “WIP untracked/không có trong baseline” ở mục 1 chỉ mô tả thời điểm lập hồ sơ, không mô tả B.

### Claim hiện hành

Tiền điều kiện chung: mảng số hữu hạn, so sánh nhất quán, thao tác phần tử chi phí hằng; generator không tự validation đầy đủ. Ký hiệu B17 dưới đây chỉ là nhãn link evidence, không thêm source ID.

| Claim | Chứng minh/locator và SHA:line tại B | Test evidence tại B | Giới hạn / trạng thái review |
|---|---|---|---|
| Tiền tố đã có thứ tự và đúng vị trí, không lớn hơn hậu tố; chọn min về đầu | [Generator B:37–101][B17-G]; khởi tạo tiền tố rỗng, mỗi lượt đưa min của hậu tố vào i; kế thừa mục 2 | [Controller regression B:754–784][B17-TC], [oracle B:787–801][B17-ORACLE] | Chỉ kết luận phần hoàn tất tại ranh giới lượt; không dùng nguồn chọn max về cuối như cùng một trace. STATIC_SUPPORTED / REVIEW_PENDING. |
| C=n(n−1)/2 cho n≥1; n=0 có C=0 | [Hai vòng for B:37–41][B17-G]; tổng và lập luận giữ tại mục 7 | [complexity B:26–30][B17-T], oracle B:787–801 | C cố định theo n; best/average/worst Θ(n²) của lõi với n≥2 theo mục 7, không phải runtime generator. DRAFT_DERIVATION / REVIEW_PENDING; average chưa nghiệm thu. |
| Actual swaps W có 0≤W≤n−1 với n≥1 | [B:73–88][B17-SWAP] chỉ swap/tăng W nếu minIndex≠i; mỗi lượt nhiều nhất một lần; n=0 có W=0 | complexity B:26–30; oracle [4,3,2,1] tại B:787–801 cho C tích lũy 3/5/6, W 1/2/2 | Mảng không giảm có W=0, không phải n−1 swap. Self-swap của nguồn khác không được cộng vào counter này. STATIC_SUPPORTED / REVIEW_PENDING. |
| Không ổn định với swap không kề | [B:54–77][B17-MIN]; Minh họa logic tự suy: [2ₐ,2ᵦ,1] → [1,2ᵦ,2ₐ] sau lượt đầu | B:754–784 khóa mô tả và giới hạn; B:794 kiểm số [2,2,1] | Nhãn a/b chỉ dùng trong lập luận, không phải input/API hoặc identity được UI lưu; chưa test identity sản phẩm. DRAFT_DERIVATION / REVIEW_PENDING. |
| Core O(1), working copy O(n), snapshot O(n), trace O(n·S) với n≥1 | [B:19–34][B17-COPY], [snapshot và bước cuối B:91–119][B17-END]; dùng mô hình chi phí [Bubble mục C](edu-2-cost-and-bubble-draft.md#c-bộ-nhớ-phụ-generator-snapshot-và-trace) | B:754–784 chỉ khóa nội dung; chưa đo heap/byte | S là số snapshot thực tế của Selection, không dùng công thức S riêng Bubble; n=0/1 vẫn hai step. DRAFT_DERIVATION / REVIEW_PENDING. |

Giữ nguyên khác biệt nguồn tại mục 3–4: Toronto có self-swap, MIT chọn max về cuối, OpenDSA có mô hình swap khác. Những locator/quyền đã ghi là evidence lịch sử, không phải truy xuất mới hoặc nâng applicability/source_status trong P1.

### Gate và quyền hiện hành

EDU-1 Source & Mapping đã [OWNER ACCEPTED / CLOSED](knowledge-mapping.md#9-closeout-hiện-hành--edu-1g); các câu PARTIAL ở mục 6–7 là lịch sử. **Academic PASS 0/40; RIGHTS_NOT_VERIFIED; MAP-017-S vẫn NOT VERIFIED.** READY chỉ là sẵn sàng review hồ sơ. Có lập luận C cố định không tự cho phép đổi trạng thái nghiệm thu average hoặc chuỗi sản phẩm.

Không thêm nguồn/ID, không chép/dịch/chuyển thể tài liệu bên thứ ba và không thay [policy quyền theo hành vi](uit-sources.md#113-quyền-theo-hành-vi-sử-dụng-thực-tế). Test/build/browser/CI **NOT RUN**; chỉ đọc code/test đúng B. Xem [hồ sơ Insertion](op18-source-evidence.md) và [liên kết mapping hiện hành](knowledge-mapping.md#10-edu-2a-p1). Phản biện tiếp theo Codex → ChatGPT → Owner; không tự đóng A-EDU/G-EDU hoặc chuyển P2.

[B17-G]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/src/algorithms/selectionSort.js#L37
[B17-TC]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/tests/sorting-controller.test.js#L754
[B17-ORACLE]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/tests/sorting-controller.test.js#L787
[B17-T]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/tests/complexity.test.js#L26
[B17-SWAP]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/src/algorithms/selectionSort.js#L73
[B17-MIN]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/src/algorithms/selectionSort.js#L54
[B17-COPY]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/src/algorithms/selectionSort.js#L19
[B17-END]: https://github.com/Nggvanchi/AlgoVision/blob/ee92d767a640f3338ac56cd798e58e614b956306/src/algorithms/selectionSort.js#L91
