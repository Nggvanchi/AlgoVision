# EDU-3B1 — Hồ sơ bằng chứng BST OP-21–29

> Trạng thái hiện hành: [mục 11 — Owner acceptance và G5 bridge](#11-edu-3b--owner-acceptance-và-g5-bridge-26112026): OP-21–29 OWNER_ACCEPTED, EDU-3B CLOSED, toàn dự án 29/40; EDU-3 vẫn PARTIAL. Mục 1–10 giữ lịch sử B1; docs sync B3 chưa commit/publish/merge.

## 1. Phạm vi, baseline và trạng thái

- BASE: `eb285745b22ebe83a4f1194e2f9322e755b21369`; TREE: `f8f91f2313366f4012287386aa1e7f6a4528742f`. Chỉ BST OP-21–29; không mở Hash/Graph, C2 hoặc thay generator/UI. Reuse C1/P0 và phương pháp EDU-3A, không suy acceptance nhóm trước sang BST.
- **STATIC_SUPPORTED / REVIEW_PENDING** cho contract và đối chiếu source; proof, cost derivation và expected oracle là **DRAFT_DERIVATION**, chờ review/acceptance. Owner cung cấp kết quả ChatGPT independent static review 9/9 OP và literal oracle của P0 phù hợp code; không phải runtime PASS mới, academic acceptance hoặc chứng nhận bên ngoài.
- Academic acceptance toàn dự án giữ **20/40**, EDU-3A CLOSED; EDU-3 toàn giai đoạn chưa CLOSED. **RIGHTS_NOT_VERIFIED**, 8 source ID, 40 OP/80 mapping ID, source_status và routing lịch sử giữ nguyên.
- [Mapping MAP-021–029-I/S](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/docs/education/knowledge-mapping.md#L157-L174) và [scope release OP-21–29](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/docs/release/v1.0.0-scope.md#L103-L111) định tuyến EDU-3/G-STRUCT/G-EDU/G-RELEASE, không tự cấp acceptance. Các locator I lịch sử giữ nguyên; locator bên dưới pin BASE mới.
- Hồ sơ tự biên soạn từ implementation/lập luận; không ingestion, tìm lại IT003/OpenDSA, sao chép/dịch/chuyển thể học liệu. B1 chỉ hồ sơ và liên kết mapping, không triển khai B2.

## 2. Contract, invariant và mô hình chi phí

**Input hợp lệ.** Tree có dạng `{rootId,nodes,nextId}`; node phẳng `{id,value,left,right}`, ID/key khớp, mọi node nối được từ root, không chu trình hoặc dangling reference, khóa phân biệt và ordering nghiêm ngặt theo toàn bộ tổ tiên. Input do API tạo, không bị caller/Proxy sửa phá contract. Value phải thỏa Number.isInteger, không tự giới hạn 1–99 hoặc 15 nút ở tầng thuần; không tuyên bố Number.isSafeInteger đã được enforce. UI riêng giới hạn số nguyên 1–99, tối đa 15 nút, vẫn minh họa duplicate khi đầy: [structure:7–14](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/structures/bst.js#L7-L14), [UI:23–29](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/bst.js#L23-L29), [UI validation:465–482](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/bst.js#L465-L482).

**Ordering/ID.** Với mỗi node: mọi khóa cây trái nhỏ hơn, cây phải lớn hơn; không chỉ so hai con trực tiếp. ID mới lấy nextId rồi tăng, không cấp lại ID đã gỡ trong cùng lineage khi bộ đếm còn biểu diễn chính xác. Clear/preset tạo cây độc lập nên có thể bắt đầu lại ID từ 1. Duplicate không chèn, nextId/cây giữ nguyên. Delete hai con giữ ID z nhưng đổi value; ID successor bị gỡ. Không đồng nhất định danh với giá trị.

**Các lớp chi phí.** n là số node trước thao tác; h là số cạnh trên đường dài nhất (empty −1, singleton 0); k là số node xét trên một đường; S gồm bước đầu. Với n>0, 1≤k≤h+1≤n; cận đường đi dùng O(h+1), không O(0) ở singleton. Empty luôn O(1). Mỗi field/node/reference/so sánh tính một đơn vị, lookup plain object giả định O(1); không suy byte heap, benchmark hoặc bảo đảm engine từ mô hình này. Không tính message/DOM/layout/controller, validation UI hoặc dựng preset vào chi phí lõi; chi phí chuỗi có thể ghi riêng theo tổng độ dài.

- **Core/ADT:** đi theo liên kết hoặc đệ quy trên cây hợp lệ. Core path dùng vài con trỏ O(1); DFS cần stack O(h+1). Output traversal cần Θ(n); Height lõi trả số, không cần bảng heights để tính.
- **API thực tế:** [cloneTree](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/structures/bst.js#L17-L25) duyệt Object.entries và tạo node records mới: Θ(n) time/output, workspace Object.entries O(n). Insert mới gọi findNodeId, clone, rồi tìm vị trí chèn; tổng Θ(n) với n>0, không phải full API O(log n) trên cây cân bằng. Duplicate trực tiếp insertValue không clone, chỉ O(k). [insert/buildTree](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/structures/bst.js#L48-L87); buildTree với n input phân biệt có tổng Θ(n²) do clone prefix, kể cả hình dạng cuối cân bằng; nếu có duplicates phải tách số input và số khóa phân biệt.
- **Generator:** Insert/Search/Delete/Min-Max đều tính limit qua [getNodeCount](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/structures/bst.js#L27-L29): Object.keys tạo mảng Θ(n), trước cả trường hợp gặp gốc. Counter C không đo công việc này, traversal ẩn trong API hoặc số toán tử JavaScript.
- **Retained trace:** factory có số trường cố định nhưng pathIds/output/heights tăng kích thước; không suy cả trace O(S). Tree thường được chia sẻ qua tham chiếu, không phải mỗi step clone toàn cây. Insert tạo một cây kết quả mới; Delete lá/một con clone một lần, hai con clone khi chép và khi gỡ. Tách vùng input được giữ sống, snapshot output mới, workspace tạm và trace fields.

| Nhóm generator | Time theo mô hình, n>0 | Retained trace mới, chưa gồm input/message | Căn cứ |
|---|---|---|---|
| Insert/Search/Min-Max | Θ(n+k²); copy prefix path cộng 1+…+k | Search/Min-Max Θ(S+k²); Insert thêm snapshot output Θ(n) nếu chèn mới | [Insert:60–125](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstInsert.js#L60-L125), [Search:33–87](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstSearch.js#L33-L87), [Min-Max:60–96](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstMinMax.js#L60-L96) |
| Delete | O(n+(d+1)²+(m+1)(d+1)), do đó O(n+(h+1)²) | Cùng cận trên cho clone/path retained, cộng O(S) headers | d tổ tiên của z; m lần đi trái từ z.right tới successor; path successor giữ prefix tìm z, không thêm mọi successor vào pathIds. [Delete:72–238](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstDelete.js#L72-L238) |
| Inorder/Preorder/Postorder | Θ(n²), dù lõi Θ(n) | Θ(n²) do cả output và visited prefix; tree chia sẻ | [Traversal:60–97](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstTraversal.js#L60-L97) |
| Height | Θ(n²), dù lõi Θ(n) | Θ(n²) do copy computedIds và heights prefix; tree chia sẻ | [Height:32–64](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstHeight.js#L32-L64) |

Các công thức trên là derivation đọc code, không phải kết quả đo memory/runtime. Không tự tối ưu clone hoặc trace trong EDU-3B1/B2. Không có claim average-case O(log n): balanced là điều kiện hình dạng, chưa có mô hình phân phối và chứng minh average.

## 3. Claim matrix 9 OP

Mọi hàng **STATIC_SUPPORTED / REVIEW_PENDING / RIGHTS_NOT_VERIFIED**. Proof P1–P6 ở mục 4, oracle literal ở mục 5. Chi phí core trong bảng không thay chi phí API/generator ở mục 2.

| OP | Precondition → postcondition; invariant | Core time; auxiliary/output | Proof/oracle; locator | Gap / disposition đề xuất |
|---|---|---|---|---|
| OP-21 Insert | Cây hợp lệ, value nguyên → inserted với node ID mới đúng nhánh, hoặc duplicate giữ cây/ID/nextId. Khoảng khóa của tổ tiên được giữ. | O(h+1), auxiliary O(1); snapshot output mới Θ(n) ở API. | P1/P5, O1; [Insert](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstInsert.js#L38-L125) | KEEP algorithm; FIX-COPY phân biệt C chèn mới/duplicate và chi phí lõi. |
| OP-22 Search | Nếu target còn có thể tồn tại thì ở subtree hiện tại; foundId hoặc null, result found/not-found; cây không đổi. | O(h+1), best Θ(1), worst Θ(n); auxiliary/output O(1). | P1, O2; [Search](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstSearch.js#L28-L89) | KEEP; FIX-COPY điều kiện cân bằng, không hứa toàn API chèn/xóa nhanh. |
| OP-23 Delete | Miss giữ cây; lá gỡ, một con nối lên; hai con giữ ID z, chép value successor, gỡ ID successor và nối con phải nếu có. | O(h+1), auxiliary O(1) cho core; snapshot clone Θ(n) trong generator. | P2/P5, O3/O12; [replaceNode](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstDelete.js#L38-L56), [ba ca](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstDelete.js#L111-L238) | KEEP; FIX-COPY transient duplicate/ID/counter; ordering nghiêm ngặt chỉ cam kết input và cây cuối. |
| OP-24 Inorder | Valid BST → trái, gốc, phải; mỗi node một visit; result tăng nghiêm ngặt. | Θ(n), stack O(h+1), output Θ(n). | P3, O4; [Traversal](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstTraversal.js#L40-L97) | KEEP; FIX-COPY tách output/trace và không xem output sorted là validator cấu trúc tổng quát. |
| OP-25 Preorder | Gốc, trái, phải; không sửa tree. Tái chèn khóa phân biệt khôi phục hình dạng/value, không bảo đảm ID cũ. | Θ(n), stack O(h+1), output Θ(n). | P3/P6, O5/O13; [Traversal](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstTraversal.js#L60-L97) | FIX-COPY ID và “không bảo đảm tăng dần”, không nói mọi output đều không tăng. |
| OP-26 Postorder | Trái, phải, gốc; hậu duệ được visit trước cha, tree không đổi. | Θ(n), stack O(h+1), output Θ(n). | P3, O6/O13; [Traversal](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstTraversal.js#L60-L97) | KEEP order; FIX-COPY “không bảo đảm tăng dần”. |
| OP-27 Min | Empty → null; nếu không, đi trái tới node không có con trái, trả value/foundId. | O(h+1), best Θ(1), auxiliary/output O(1). | P1, O7; [Min-Max](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstMinMax.js#L37-L98) | KEEP; C=0 không chứng minh tổng chi phí O(1). |
| OP-28 Max | Đối xứng Min theo phải. | O(h+1), best Θ(1), auxiliary/output O(1). | P1, O8; [Min-Max](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstMinMax.js#L37-L98) | KEEP; không giả định BST luôn cân bằng. |
| OP-29 Height | Null −1; tính hai con trước khi combine; result là số cạnh dài nhất. | Θ(n), stack O(h+1), scalar output O(1); annotation map/trace tính riêng. | P4, O9; [Height](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstHeight.js#L16-L64), [getHeight](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/structures/bst.js#L89-L98) | KEEP recurrence; FIX-COPY không đồng nhất h với tổng chi phí mô phỏng. |

## 4. Chứng minh độc lập và điều kiện dừng

**P1 — đường đi/order.** Trước mỗi lần xét, target chỉ có thể ở subtree nằm trong khoảng (low,high) do tổ tiên quy định. So sánh bằng trả ngay; nhỏ/lớn chọn duy nhất trái/phải nên không bỏ một khóa có thể khớp. Mỗi bước xuống giảm số node còn lại trên đường hữu hạn; null kết luận miss hoặc vị trí chèn. Chèn vào null giữ khoảng và mọi liên kết/khóa cũ. Min đi hết trái: bất kỳ node ngoài nhánh đó đều lớn hơn node cuối; Max đối xứng. Không suy mỗi bước loại một nửa số node khi cây không cân bằng.

**P2 — Delete.** Lá thay liên kết cha bằng null; một con thay bằng con đó, hoặc thay rootId. Trường hợp hai con: successor là node trái cùng của cây con phải nên không có con trái; value của nó lớn hơn mọi khóa cây trái của z và không lớn hơn khóa còn lại trong cây phải. Bước COPY giữ ID z và ID successor cùng tồn tại với value bằng nhau: lúc này ordering nghiêm ngặt tạm không đúng, không ép isValidBst trên mọi step. Gỡ đúng successor ID, nối successor.right dưới cha successor (kể cả successor là con phải trực tiếp của z), khôi phục ordering và n−1 node; z không bị xóa theo ID. Filter pathIds và reset reference của node mất bảo đảm không dangling currentId/foundId/successorId/pathIds ở step cuối.

**P3 — traversal.** Quy nạp kích thước subtree: null không visit; hai cây con nhỏ hơn được visit đúng một lần, đặt visit root trước/giữa/sau cho Pre/In/Postorder. Với ordering nghiêm ngặt, Inorder nối trái < root < phải nên tăng nghiêm ngặt. Pre/Postorder chỉ quy định thứ tự thăm, không bảo đảm sorted; O13 là phản ví dụ cho wording tuyệt đối “không tăng dần”. Generator chỉ ghi visit, không minh họa mọi call/return hoặc call stack.

**P4 — height.** Null có −1 cạnh; nếu biết hL,hR thì đường dài nhất từ node có 1+max(hL,hR) cạnh. Hậu tự bảo đảm hai giá trị con có trước combine. Hai subtree nhỏ hơn nên dừng trên cây hợp lệ; singleton trả 0. Cận stack O(h+1) cho n>0, empty O(1); không coi h=0 là không có stack.

**P5 — copy/ID/snapshot.** Node records clone mới chứa primitives/references ID, thay link/value trên bản clone không ghi input. nextId tăng khi insert thành công, không giảm khi delete; duplicate không cấp ID. Steps trước/sau dùng tree tham chiếu hoặc các snapshot clone riêng khi cấu trúc/value đổi. Prefix path/output/heights được copy ở lúc push nên generator không sửa step đã tạo; chỉnh last.finished/result/message trong traversal/height xảy ra trước return. Đây là immutability theo contract, **không defensive freeze/clone mọi step**: caller sửa input/tree dùng chung sau return có thể đổi step cũ. Không tuyên bố output Object.freeze hoặc bảo vệ khỏi caller mutation.

**P6 — rebuild Preorder.** Với BST khóa phân biệt và quy tắc insert hiện tại, phần đầu sau root là toàn bộ subtree trái, sau đó subtree phải; quy nạp khôi phục hình dạng và value khi chèn lại Preorder. ID được cấp theo thứ tự chèn mới nên không nhất thiết bằng IDs cũ; không khôi phục metadata/nextId từ dãy value.

## 5. Oracle literal độc lập — expected, không chạy trong B1

T: chèn [4,2,6,5,7], IDs lần lượt 1→4, 2→2, 3→6, 4→5, 5→7; rootId=1, nextId=6. Các hàng độc lập, không dùng generator/API để tính expected. C là counter trace, S gồm bước 0; chỉ bước cuối finished=true, operation/value cố định. Ký hiệu L là dãy pseudocodeLine gồm null bước đầu.

| ID / OP | Input/action | Expected literal |
|---|---|---|
| O1 / 21 | T, Insert 3 | inserted, ID6; node2.right=6; n=6,nextId=7; C=2,S=5; L=[null,6,8,6,10]. Duplicate 5 trên T riêng: duplicate, foundId=4, cây/nextId giữ nguyên; C=3,S=6; L=[null,6,11,6,8,5]. |
| O2 / 22 | T, Search 5; Search 3 riêng | Hit: found, foundId=4, C=3,S=4,L=[null,5,4,3]. Miss: not-found, foundId/currentId=null, C=2,S=4,L=[null,4,5,6]. |
| O3 / 23 | T, Delete 4 | C=1,S=6,L=[null,10,11,11,12,13]. COPY: ID1 và ID4 cùng value5, không cùng ID. Cuối deleted, rootId=1,value5; gỡ ID4; node3.left=null; inorder=[2,5,6,7],nextId=6; currentId/foundId=1,successorId=null. |
| O4 / 24 | T, Inorder | output/result=[2,4,5,6,7]; visit IDs=[2,1,4,3,5]; C=0,S=6; L=[null,4,4,4,4,4]. |
| O5 / 25 | T, Preorder | output/result=[4,2,6,5,7]; visit IDs=[1,2,3,4,5]; C=0,S=6; L=[null,3,3,3,3,3]. |
| O6 / 26 | T, Postorder | output/result=[2,5,7,6,4]; visit IDs=[2,4,5,3,1]; C=0,S=6; L=[null,5,5,5,5,5]. |
| O7 / 27 | T, Min | result=2,foundId=2,pathIds=[1,2],C=0,S=4,L=[null,2,4,5]. |
| O8 / 28 | T, Max | result=7,foundId=5,pathIds=[1,3,5],C=0,S=5,L=[null,2,4,4,5]. |
| O9 / 29 | T, Height | result=2; combine (ID,height)=[(2,0),(4,0),(5,0),(3,1),(1,2)]; C=0,S=6,L=[null,3,3,3,3,3]. |
| O10 / empty, singleton | Empty; cây [7] độc lập | Empty: Insert7 C=0,S=2,L=[null,2],ID1; Search/Delete7 C=0,S=2, result not-found, kết luận dòng6/5; Min/Max null,S=2,dòng1; traversal [],S=2,dòng2; Height−1,S=2,dòng2. Singleton: Height0,S=2; Min/Max7,S=3; Search7 C=1,S=2; miss8 C=1,S=3; Delete7 C=1,S=3,L=[null,6,7],rootId=null. |
| O11 / skewed | [1,2,3], từng thao tác độc lập | h=2; Search3 C=3,S=4; miss4 C=3,S=5; Insert4 C=3,S=7; duplicate3 C=3,S=6; Delete3 C=3,S=5; Min1 C=0,S=3; Max3 C=0,S=5; Height2,S=4. |
| O12 / successor có con phải | [40,20,80,60,90,50,55], Delete40 | IDs theo thứ tự chèn1…7; d=0,m=2,C=1,S=7,L=[null,10,11,11,11,12,13]. Giữ root ID1 đổi value50; gỡ ID6; node4.left=7; inorder cuối=[20,50,55,60,80,90],nextId=8. Insert10 sau đó dùng ID8, không cấp lại ID6. |
| O13 / sorted và rebuild | Right chain [1,2,3]; left chain [3,2,1]; [4,2,6,1,3,5,7] | Preorder right chain=[1,2,3]; Postorder left chain=[1,2,3]: đều tăng. Với cây cuối, Preorder=[4,2,1,3,6,5,7]; tái chèn giữ hình dạng/value nhưng value6 đổi ID3→5, value1 đổi ID4→3. |

Validation expected: generators Insert/Search/Delete và API insertValue từ chối 1.5, NaN, Infinity, string/null theo validateValue; Min/Max kind khác min/max và traversal order khác ba order bị RangeError. Helper findNodeId chỉ duyệt, không tự validateValue; không coi nó là validator input. Không dùng cùng expected cho mọi error precedence/UI. UI nhận 1…99, 15 node; full tree vẫn minh họa duplicate nhưng chặn khóa mới. Không nói API thuần cũng có giới hạn UI.

## 6. Counters, pseudocode, số bước và guards

- Insert mới ở độ sâu D: C=D; empty C=0,S=2; nonempty S=2C+1. Duplicate ở độ sâu d: C=d+1,S=2C. C chỉ là số nút xét trong trace, không cộng tìm kiếm/clone ẩn của insertValue. [Insert:5–35](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstInsert.js#L5-L35).
- Search hit C=d+1,S=C+1; miss C=k,S=C+2. Delete hit C=d+1, miss C=k; successor walk không tăng C. Delete lá/một con S=d+3; hai con S=d+m+5. Với hai con, d+m+3≤n nên S≤n+2; các node đếm gồm tổ tiên, z, con trái z, con phải z và m node thêm trên đường successor. [Delete:5–8](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstDelete.js#L5-L8), [Delete:59–78](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstDelete.js#L59-L78).
- Min/Max có k node trên extreme path: C=0,S=k+2; empty S=2. Duyệt/Height C=0, nonempty S=n+1, empty S=2. Counter 0 không nghĩa không làm việc.
- **Explicit guards:** Insert max(2,2n+1); Search/Delete/Min-Max n+2. assertWithinStepLimit ở đầu while; nó kiểm steps.length>limit. Proof công thức là cơ sở rằng mọi trace đúng nằm trong limit, không mặc định guard sau mọi push. [stepLimit](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/stepLimit.js#L1-L14), [step-limit tests](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-step-limit.test.js#L9-L53).
- **Không explicit guard:** Traversal/Height dừng do recursion trên subtree hữu hạn; S suy từ mỗi node một visit/combine. Không có export limit/assertWithinStepLimit trong hai file này. Không tuyên bố chống mọi input cycle hoặc stack overflow. API findNodeId/insertValue còn có while ngoài guard generator; contract input hợp lệ là bắt buộc.
- Pseudocode chỉ ghi các dòng có step: Traversal visit 4/3/5, Height combine3; base case empty dòng2. Delete COPY12/REMOVE13; intermediate duplicate không phải lỗi tự động. [step factory](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstStep.js#L1-L23) và [invariant helper](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/helpers/bst-step-invariants.js#L3-L18) kiểm references/path/constant fields/finished, không tự chứng minh mọi ordering/immutability/chi phí.

## 7. Existing evidence và gap test/runtime

B1 chỉ đọc source; oracle mục 5 chưa chạy. Reuse baseline [architecture BST](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/docs/architecture.md#L110-L124) và [CI hậu merge #83 45804519028](https://github.com/Nggvanchi/AlgoVision/actions/runs/45804519028): 1818/1818 mỗi OS, test/build/encoding/Vercel SUCCESS theo closeout đã kiểm. CI có sẵn không biến oracle mới thành runtime PASS hoặc học thuật PASS.

| Coverage đã có tại BASE | Evidence source | Gap tối thiểu đề xuất |
|---|---|---|
| Insert empty/new/duplicate, C, trace và tree cũ | [Insert tests](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-insert.test.js#L25-L121) | Không viết lại trace đã đủ; frozen-input/old-step preservation chưa có. |
| Search hit/miss, dòng mã giả, fixed value/tree | [Search tests](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-search.test.js#L24-L87) | Reuse; không suy deepcopy từ tree identity. |
| Delete ba ca, direct/deep successor có con phải, COPY duplicate, ID và n−1 | [Delete tests](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-delete.test.js#L65-L197) | Reuse; literal IDs fixture mới và frozen input trong test bảng đề xuất. |
| Ba traversal: output literal, visit line, each-node-once, empty | [Traversal tests](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-traversal.test.js#L10-L85) | Không lặp; bổ sung wording “không bảo đảm sorted” và scope trace. |
| Min/Max và Height, singleton/skew, postorder heights | [Min/Max/Height tests](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-min-max-height.test.js#L24-L119) | Literal heights map độc lập trong test bảng, không chỉ gọi getHeight làm expected. |
| Counters theo h/d và n visits; limits qua 720 hoán vị | [complexity tests](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-complexity.test.js#L18-L107), [limits](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-step-limit.test.js#L25-L53) | Chứng minh counts, không benchmark full generator Θ(n). Guard-negative/mutation chưa tự coi hoàn tất. |
| UI value/full tree, Reset/committed tree, Run/pause/nav, panel và pseudocode isolation | [controller](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-controller.test.js#L129-L281), [panel](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-controller.test.js#L405-L481) | Content test chủ yếu nonempty/keyword; chưa khóa exact copy/scope core. |
| References hợp lệ, pathIds, fields hằng, finished | [helper](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/helpers/step-invariants.js#L12-L53) | Không kiểm deepFreeze/order mọi step; COPY không được ép strict ordering. |

[committedTree/apply/reset](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/bst.js#L485-L535) chốt cây cuối ngay khi sinh steps. Reset/Previous chỉ tua hình minh họa; thao tác mới vẫn dùng committedTree, không rollback dữ liệu. [render stats](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/bst.js#L389-L422) đọc n/h/C từ snapshot; Delete COPY có hai node cùng value nên browser assertion phải dùng data-id, không chọn mơ hồ theo data-value. Reuse tests, không thay behavior.

Deferred hardening **đề xuất cần owner quyết định**, không tự miễn gate: malformed/cyclic/dangling input, caller mutation, safe-ID exhaustion/safe integers, recursion/resource limits và negative/mutation guards. Tách khỏi B2 content; không tự mở C2/C3 hoặc sửa validator/generator.

## 8. UI findings và B2 đề xuất — chưa triển khai

Current UI ở [bstOperations/learning](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/bst.js#L35-L187) và [BST template](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/public/templates/app.html#L1428-L1668):

- O(h)/O(n), O(1)/O(h) cards thiếu scope core/copy/trace; comment “khớp generator” không chứng minh full-generator cost.
- Insert wording chưa nói duplicate C=d+1; Search advantages dễ bị hiểu toàn API chèn/xóa nhanh.
- Delete cần nói ID z/value thay đổi, gỡ successor theo ID và COPY tạm trùng.
- Inorder “kiểm tra BST” không thay validator topology/input; Preorder rebuild không giữ IDs.
- Preorder/Postorder “Dãy kết quả không tăng dần” quá tuyệt đối: O13 có output tăng. Cần **không bảo đảm tăng dần**.
- Height mô tả h không phải tổng chi phí mô phỏng; full generator có annotation prefix copies.

**B2 allowlist đề xuất:** src/bst.js, public/templates/app.html, tests/bst-controller.test.js, tests/bst-complexity.test.js. Không đổi generator/pseudocode, Big-O values, DOM/attributes, CSS/API/behavior/dependencies. Điều chỉnh comment scope nếu cần, không thay controller flow.

| Trường JS (learning; traversal nằm trong TRAVERSAL_LEARNING) | Exact copy đề xuất | Δ UTF-8 string |
|---|---|---|
| `insert.description` | Đi trái nếu x nhỏ hơn, đi phải nếu lớn hơn; gặp null thì chèn, gặp khóa bằng thì bỏ qua. Chèn mới ở độ sâu d có C=d; gặp khóa trùng ở độ sâu d có C=d+1. | -134 B |
| `search.advantages` | Khi cây cân bằng, đường tìm dài O(log n); BST hiện tại không tự cân bằng. | -60 B |
| `delete.description` | Tìm z rồi xử lý: lá thì gỡ; một con thì nối con lên; hai con thì chép giá trị nhỏ nhất cây con phải vào z, giữ ID z rồi gỡ ID successor. Bước chép tạm trùng giá trị; cây cuối mới khôi phục thứ tự nghiêm ngặt. | -57 B |
| `delete.disadvantages` | Đi tìm successor không tăng C; O(h) chỉ tính đường đi, chưa gồm copy cây và trace. | -89 B |
| `inorder.advantages` | Với cây hợp lệ, xuất dãy tăng nghiêm ngặt bằng duyệt lõi O(n); output cần O(n). | -27 B |
| `preorder.description` | Thăm gốc → trái → phải. Với BST khóa phân biệt, chèn lại dãy này khôi phục hình dạng và giá trị, không bảo đảm ID cũ. | -41 B |
| `height.advantages` | Cho biết độ dài đường đi dài nhất; không phải tổng chi phí mô phỏng. | +5 B |
| `preorder.disadvantages` | Dãy kết quả không bảo đảm tăng dần; đệ quy tốn ngăn xếp O(h+1). | +15 B |
| `postorder.disadvantages` | Dãy kết quả không bảo đảm tăng dần; đệ quy tốn ngăn xếp O(h+1). | +15 B |

Đúng **9 JS fields**: bảy trường P0 và hai disadvantages Pre/Postorder sau phản biện. Net UTF-8 literal **−373 B** so với −403 B của bảy trường; hai sửa mới +15 B mỗi trường. Đây là estimate chuỗi, không build result hoặc quyền tăng budget. Baseline reuse JS/CSS **153845/58016 B**, headroom 155/484 B; vẫn phải build ≤154000/58500 B. HTML text tách khỏi JS estimate; CSS dự kiến không đổi, chưa đo build mới.

Template đề xuất chỉ text: complexity heading “Chi phí lõi”; ghi chú O(h) hiểu O(h+1) với n>0, empty O(1), chưa gồm đếm nút/output/copy/trace/DOM; counter “Lần xét nút theo khóa (C)” và hint C trong trace, successor/Min/Max/traversal/Height không tăng C; balanced note là điều kiện, không khẳng định mỗi mức luôn gấp đôi; intro phân biệt cây đã chốt và COPY tạm trùng. Các giá trị Big-O giữ nguyên.

**Test delta đề xuất +2, full kỳ vọng 1820 từ 1818:** một test bảng pure frozen input cho chín OP với literal mục 5, IDs/heights/counts/lines và old-step preservation; một controller/template test scope chi phí/counter. Tăng cường exact-copy/isolation ở test hiện hữu, giữ assertions cũ; chín hàng bảng không phải chín test mới. Reuse deep-freeze/fake-scheduler, happy-dom close trong finally.

TDD content/template RED đúng assertion trước sửa → GREEN; oracle có thể GREEN ngay. Ba wording mutations có mục tiêu và hai assertion negative controls báo riêng, restore byte/hash trong finally. Không mutation generator ngoài allowlist, không tính parser/harness errors thành RED hợp lệ. Browser đề xuất chín OP × 360/699/768/1280×900 DPR=1, UI actions thật, copy/cards/counters/pseudocode, thao tác/validation, Reset/Previous/seek/nav, focus/overflow, console/network và PNG thực tế đọc lại/hash. Không reuse QA linear thành BST QA; browser execution chain cần approval/readiness phù hợp trước B2.

## 9. Provenance blob pin BASE

Bảng là locator kỹ thuật, **không thêm source ID học thuật/catalog**. Mọi link pin BASE ở mục 1; historical locator I và nguồn UIT giữ nguyên.

| File tại BASE | Git blob SHA |
|---|---|
| [src/structures/bst.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/structures/bst.js) | `0cd64818db016668a9a6ae6c75506b5a72f66583` |
| [src/algorithms/bstInsert.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstInsert.js) | `3ec096e85e1ba6394e51675fa657e71c2030b36e` |
| [src/algorithms/bstSearch.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstSearch.js) | `ae37ec3a72e382760408d475a72e89457d6273ea` |
| [src/algorithms/bstDelete.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstDelete.js) | `88d77c477c3a18d397a4ca31c7ec96cd59118ba1` |
| [src/algorithms/bstTraversal.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstTraversal.js) | `adede0ef08da2c62dcb759ce818bdf682351806f` |
| [src/algorithms/bstMinMax.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstMinMax.js) | `930420ee67e5fc7705c3ccd1861a2b02f4b6e0ca` |
| [src/algorithms/bstHeight.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstHeight.js) | `303a0355127f8837f13fce2a2834a874611875f5` |
| [src/algorithms/bstStep.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/bstStep.js) | `4ae435e5d8d0fa4f668dfbff1da6fe11b0594063` |
| [src/algorithms/stepLimit.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/algorithms/stepLimit.js) | `39228c9aab6a196a412ec614ebc2e20e3fb63ab8` |
| [src/bst.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/src/bst.js) | `333df37d1c0f8bb4efeca81e0bf26478919bed00` |
| [public/templates/app.html](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/public/templates/app.html) | `a166b117090197d4f69964c5bfb0497f9d2856bc` |
| [tests/bst.test.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst.test.js) | `557fff582197944366c9cd203bc3c100c940724c` |
| [tests/bst-insert.test.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-insert.test.js) | `f0ce992ce24164adb7d7c27d1bb953b2500b8a94` |
| [tests/bst-search.test.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-search.test.js) | `64f54a11dc67e9825e1abd52964257e897ea631a` |
| [tests/bst-delete.test.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-delete.test.js) | `a2b90ba1c7b84f194f4876e1f3eb2075e533b7de` |
| [tests/bst-traversal.test.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-traversal.test.js) | `e1e0f5216acac78cceb1fdf34ffa8f518d94f49c` |
| [tests/bst-min-max-height.test.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-min-max-height.test.js) | `e5efc243d76904062f1fbc0debc2585577261afa` |
| [tests/bst-complexity.test.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-complexity.test.js) | `468f4646b78a6dd59576675947f410a2afceef1c` |
| [tests/bst-step-limit.test.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-step-limit.test.js) | `420ecdf7ad89ce0840d6fbb9be76851e9710a5cc` |
| [tests/bst-controller.test.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/bst-controller.test.js) | `6159c85dab141837b924eed0f0c9d699dc87da8f` |
| [tests/helpers/bst-step-invariants.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/helpers/bst-step-invariants.js) | `6ad1d4fecddda35ab70fc6584495c14d99f340b4` |
| [tests/helpers/step-invariants.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/helpers/step-invariants.js) | `df5b5476c32e6e148a294daa93b18c3005de2e15` |
| [tests/helpers/deep-freeze.js](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/tests/helpers/deep-freeze.js) | `e1eb764c263b43f48b32f8b6341b6e2069d860a2` |

## 10. Policy B, rights và residual gates

[Policy B §11](https://github.com/Nggvanchi/AlgoVision/blob/eb285745b22ebe83a4f1194e2f9322e755b21369/docs/education/uit-sources.md#L203-L234) tách UIT định danh/phạm vi với claim evidence chi tiết. MAP-021–028-I/S chỉ định vị chủ đề cây PDF 5–6, chương4/mục4.2–4.3; Height có locator riêng NOT VERIFIED. Không tự xác nhận nội dung/phiên bản nguồn ngoài, không tìm lại IT003/OpenDSA. Proof/oracle ở đây tự biên soạn từ code pin BASE, không phải bản dịch hoặc citation giả; cần phản biện/owner review cho claim và căn cứ công bố nội dung thực tế. Acceptance 20/40 nhóm trước không tự cấp acceptance hoặc rights cho OP-21–29.

Giữ **STATIC_SUPPORTED/REVIEW_PENDING**, **RIGHTS_NOT_VERIFIED**, source_status, 8 source ID, 40 OP/80 mapping ID và routing lịch sử; không nâng academic acceptance hoặc tự đóng EDU-3B. Không suy quyền bên thứ ba từ MIT, technical PASS hoặc owner approval; mỗi hành vi metadata/link, diễn giải, trích dẫn, chuyển thể, sao chép/công bố/AI cần evidence đúng scope.

Giữ VIS-01 PRE_EXISTING trước C4/release, Insertion step-limit C2 và negative/mutation C3 bắt buộc; EX-03/EX-04, historical config drift UNKNOWN, attribution/IPC/runtime overrides NOT VERIFIED, ARTIFACT_PERSISTENCE_NOT_VERIFIED lịch sử, runtime profile isolation/process cleanup NOT VERIFIED. Limited config/checkpoint acceptance chỉ đúng workflow/nhóm được owner duyệt, không rebaseline hoặc mở trust. G-EDU/G-STRUCT/G-RELEASE, C4, screen reader/zoom/cross-browser/production và mọi release gate còn mở. B1 docs-only không chạy test/build/browser, install, stage/commit/push/merge hoặc mở B2/Hash/Graph.

## 11. EDU-3B — Owner acceptance và G5 bridge, 26/11/2026

**EDU-3B OWNER_ACCEPTED/CLOSED** theo quyết định owner: **9/9 OP-21–29 OWNER_ACCEPTED** trong contract, giả định và mô hình chi phí đã phản biện. Cộng 20 OP đã nghiệm thu, academic acceptance toàn dự án là **29/40**; EDU-3 toàn giai đoạn vẫn **PARTIAL**, không mở EDU-3C. ChatGPT academic review 9/9 PASS trong scope đã được owner ghi nhận; không phải chứng nhận học thuật bên ngoài. Owner xác nhận có căn cứ công bố **nội dung BST AlgoVision tự biên soạn thực tế**, không cấp quyền tài liệu bên thứ ba.

Đây là closeout được owner duyệt, còn bản đồng bộ docs B3 **chưa commit/publish/merge**. Các mục 1–10 là hồ sơ B1 tại thời điểm ghi, gồm STATIC_SUPPORTED/REVIEW_PENDING, DRAFT_DERIVATION, 20/40 và kế hoạch B2; giữ nguyên lịch sử, không diễn giải đó là trạng thái acceptance hiện hành. Không nâng source_status hoặc rights của catalog.

### 11.1 Ma trận nghiệm thu 9 OP và phạm vi proof

Các hàng đều **OWNER_ACCEPTED** theo scope trên. P1–P6 và O1–O13 là nhãn nội bộ của mục 4–5; chi phí dưới đây không gồm message/DOM/UI và không giả định cây luôn cân bằng.

| OP | Claim/invariant và chi phí được nghiệm thu | Proof/oracle; bridge runtime |
|---|---|---|
| OP-21 Insert | Giữ khoảng khóa tổ tiên; mới cấp ID/nextId, duplicate giữ cây. Chèn mới C=D, duplicate tại d có C=d+1. Core O(h+1), phụ O(1); API mới Θ(n), generator Θ(n+k²). | P1/P5; O1/O10/O11. Test bảng T: Insert3 ID6,C2,S5; browser có chèn mới/duplicate và committedTree. |
| OP-22 Search | Target cố định, chỉ đi subtree có thể chứa target; foundId/null, không mutation. Core best Θ(1), worst O(h+1)≤O(n), phụ O(1); generator Θ(n+k²). | P1; O2/O10/O11. Test T Search5 ID4,C3,S4; existing hit/miss và browser hit/miss. |
| OP-23 Delete | Ba ca; hai con giữ ID z, gỡ ID successor, nối successor.right. COPY tạm trùng khóa; strict order cam kết input/cây cuối. Core O(h+1), phụ O(1); generator hit cận trên O(n+(h+1)²); miss xem 11.2. | P2/P5; O3/O10/O11/O12. Test T Delete4 C1,S6,ID1 value5/gỡID4; existing tests và browser COPY/data-id, successor có con phải. |
| OP-24 Inorder | Trái→gốc→phải, mỗi node một visit; valid strict BST cho output tăng nghiêm ngặt. Core Θ(n), stack O(h+1), output Θ(n); generator/retained trace Θ(n²). | P3; O4/O10. Test T [2,4,5,6,7],C0,S6; browser khóa output/counters/pseudocode. |
| OP-25 Preorder | Gốc→trái→phải; không bảo đảm sorted. Reinsert khóa phân biệt khôi phục shape/value, không bảo đảm IDs. Core Θ(n), stack O(h+1), output Θ(n); trace Θ(n²). | P3/P6; O5/O10/O13. Test T [4,2,6,5,7]; wording/regression/browser. Rebuild-ID và counterexample O13 là proof/oracle tĩnh, không gán runtime PASS mới. |
| OP-26 Postorder | Trái→phải→gốc, hậu duệ trước cha; không bảo đảm sorted. Core Θ(n), stack O(h+1), output Θ(n); trace Θ(n²). | P3; O6/O10/O13. Test T [2,5,7,6,4]; browser output literal; O13 left-chain tăng dần là expected tĩnh. |
| OP-27 Min | Đi hết trái, empty null; C=0 không đồng nghĩa toàn generator O(1). Core O(h+1), best Θ(1), phụ/output O(1); generator Θ(n+k²). | P1; O7/O10/O11. Test T result2/ID2,C0,S4; browser result20/S5 và empty. |
| OP-28 Max | Đối xứng Min theo phải; không giả định balanced. Core O(h+1), best Θ(1), phụ/output O(1); generator Θ(n+k²). | P1; O8/O10/O11. Test T result7/ID5,C0,S5; browser result80/S5 và empty. |
| OP-29 Height | Số cạnh: null−1, singleton0; hậu tự 1+max(hL,hR). Core Θ(n), stack O(h+1), output số O(1); generator/retained trace Θ(n²), annotation tính riêng. | P4/P5; O9/O10/O11. Test T result2/heights literal/C0/S6; browser height2/S8, empty−1. |

Áp dụng mô hình mục 2: n trước thao tác, h theo cạnh, k số node trên đường, S gồm bước đầu; **empty Θ(1)**, cây không rỗng dùng **h+1**. Giả định tree hữu hạn/acyclic/strict ordering, không dangling ID hoặc caller mutation; lookup/field theo mô hình đơn vị. Không có chứng minh average-case O(log n); balanced chỉ là điều kiện hình dạng. Tách core/API/validation/copy/Object.keys/entries, output/recursion, prefix copies và input tree dùng chung. Snapshot bất biến theo contract, không defensive freeze; explicit guards của Insert/Search/Delete/Min-Max khác số bước Traversal/Height suy từ cấu trúc. Không nghiệm thu khả năng chịu mọi malformed input hoặc recursion/resource exhaustion.

### 11.2 Clarification Delete miss — không có clone cây kết quả

Với n>0 và miss sau k node, [limit/count và vòng tìm](https://github.com/Nggvanchi/AlgoVision/blob/3f89bb93d900d31dbf70f9815ec3b082fa8248c4/src/algorithms/bstDelete.js#L59-L108) tạo Object.keys Θ(n), các path-prefix copies tổng 1+…+k=Θ(k²), S=k+2, C=k. Vì vậy **generator time Θ(n+k²)**, **retained trace mới Θ(1+k²)** theo mô hình fields/reference đơn vị; input tree được chia sẻ, không tính lại Θ(n) vào phần trace mới. Không clone cây kết quả khi miss; empty Θ(1). **Core O(h+1)** với n>0 (miss cụ thể Θ(k)), phụ O(1). Công thức d/m ở mục 2 là cận hit; bổ sung trường hợp miss ở đây, không viết lại checkpoint B1 hoặc đồng nhất counter với chi phí copy/trace/message/DOM.

### 11.3 Technical/product/QA bridge — reuse theo SHA và hash

- **B1 [#84](https://github.com/Nggvanchi/AlgoVision/pull/84):** 9 OP, 6 proof, **13 nhóm expected oracle** tự dò tay; 23 provenance blobs/48 locators pin BASE B1. Merge [c8c4b8e01e73e68612cf93bf04efecdb183ec43d](https://github.com/Nggvanchi/AlgoVision/commit/c8c4b8e01e73e68612cf93bf04efecdb183ec43d), tree 0cf573f6b3abe6a8011220f5629f3f94eda10c21; [CI hậu merge 45811830621](https://github.com/Nggvanchi/AlgoVision/actions/runs/45811830621) 1818/1818 mỗi OS, build/encoding/Vercel SUCCESS. B1 không chạy oracle/test/build/browser local.
- **B2 [#85](https://github.com/Nggvanchi/AlgoVision/pull/85):** commit 2446e44a0fe746c62efe556c31e700c1142d6fe0; merge [3f89bb93d900d31dbf70f9815ec3b082fa8248c4](https://github.com/Nggvanchi/AlgoVision/commit/3f89bb93d900d31dbf70f9815ec3b082fa8248c4), tree **c0795b5a8fb93cffa8e4fcb43b54c3c95121ddda**. Đúng 9 JS fields/6 template text regions/+2 tests; không đổi generator/API/flow/pseudocode/Big-O values/DOM/attributes/CSS. [CI hậu merge 45819093340](https://github.com/Nggvanchi/AlgoVision/actions/runs/45819093340) Ubuntu/Windows **1820/1820 mỗi OS**, fail/skip/todo/cancelled đều 0; build/encoding/Vercel SUCCESS trên đúng merge SHA.
- **Assertions thực sự chạy:** targeted BST **108/108**, full **1820/1820**, wording mutations **3/3**, assertion negative controls **2/2**, exact byte/hash restore. [Test bảng 9 OP](https://github.com/Nggvanchi/AlgoVision/blob/3f89bb93d900d31dbf70f9815ec3b082fa8248c4/tests/bst-complexity.test.js#L113-L167) dùng literal T, frozen input, old-step preservation; [exact copy/isolation](https://github.com/Nggvanchi/AlgoVision/blob/3f89bb93d900d31dbf70f9815ec3b082fa8248c4/tests/bst-controller.test.js#L475-L508) và [template/counter](https://github.com/Nggvanchi/AlgoVision/blob/3f89bb93d900d31dbf70f9815ec3b082fa8248c4/tests/bst-controller.test.js#L522-L556). Không gọi 13 nhóm expected là 13 runtime case đã chạy đầy đủ; existing coverage ở mục 7 được tái sử dụng, không ghi đã chạy riêng mọi biến thể/O13 trong B2.
- **Build local B2:** raw JS/CSS **153472/58016 B**, delta **−373/0 B**, HTML +138 B; trần **154000/58500 B**, encoding/diff PASS. Đây là evidence B2 đã kiểm, không phải build mới trong B3.
- **Browser B2:** Chrome 152/Playwright 1.62.1, 9 OP × 360/699/768/1280×900 DPR=1: functional **36/36**, visual **36/36**, **1528/1528 assertions PASS**, **72 PNG** before/after đọc lại chữ ký/kích thước/hash và review. Input browser khác T được ghi literal riêng; không suy coverage toàn bộ 13 nhóm từ 36 records. Copy/cards/counters/pseudocode, hit/miss/duplicate/empty, successor/data-id, committedTree/reset/seek/previous, navigation/focus, overflow, console/network đã có evidence.
- **Chain/cleanup chỉ lượt B2:** CIM exact QA PID/parent/start time/executable hash/actual args, temporary profile, đóng context/browser/server, PID kết thúc/profile tạm không còn/localhost ngừng phục vụ PASS. Giữ nguyên evidence BLOCKED CDP và lỗi runner ENOENT trước recovery; không biến chúng thành lỗi sản phẩm hoặc xóa khỏi lịch sử. Không nâng exceptions lịch sử runtime/cleanup/PNG hoặc suy localhost thành C4/production.

Bốn blob product/test cập nhật tại merge B2 dưới đây nối catalog B1 với trạng thái hiện hành; các blob provenance khác và locator lịch sử giữ nguyên, không thêm source ID học thuật:

| File tại BASE B3 | Blob SHA |
|---|---|
| [src/bst.js](https://github.com/Nggvanchi/AlgoVision/blob/3f89bb93d900d31dbf70f9815ec3b082fa8248c4/src/bst.js) | `32826be56e1fec1732f15d02d81e84fafbabc2d8` |
| [public/templates/app.html](https://github.com/Nggvanchi/AlgoVision/blob/3f89bb93d900d31dbf70f9815ec3b082fa8248c4/public/templates/app.html) | `11073e958e436c6e6df56755f8e754869d8fbfdd` |
| [tests/bst-controller.test.js](https://github.com/Nggvanchi/AlgoVision/blob/3f89bb93d900d31dbf70f9815ec3b082fa8248c4/tests/bst-controller.test.js) | `aa2f9745ed814ad986fc3ed94b390e9d7c4ecc6c` |
| [tests/bst-complexity.test.js](https://github.com/Nggvanchi/AlgoVision/blob/3f89bb93d900d31dbf70f9815ec3b082fa8248c4/tests/bst-complexity.test.js) | `fb6a5c5550999fc1c664375cb32a7806539b9841` |

### 11.4 Policy B, rights và residual

[Policy B §11](uit-sources.md#11-policy-b-và-quyền-theo-hành-vi--edu-1f) tách UIT định danh/phạm vi khỏi claim evidence. Owner nghiệm thu claims và xác nhận căn cứ công bố nội dung BST AlgoVision tự biên soạn thực tế theo scope trên; không suy quyền tài liệu bên thứ ba từ MIT, review hoặc merge. Giữ **RIGHTS_NOT_VERIFIED** cho bên thứ ba/hành vi thiếu evidence, **8 source ID, 40 OP/80 mapping ID**, source_status và routing lịch sử **2 READY/38 DEFER**. Không ingestion/copy/dịch/chuyển thể học liệu mới, không nâng catalog hoặc tự xác minh nội dung nguồn ngoài.

Giữ VIS-01 PRE_EXISTING trước C4/release; Insertion step-limit C2, negative/mutation C3 bắt buộc; EX-03/EX-04, historical config drift UNKNOWN, checkpoint attribution/IPC/runtime overrides NOT VERIFIED, ARTIFACT_PERSISTENCE_NOT_VERIFIED lịch sử, runtime profile isolation/process cleanup NOT VERIFIED lịch sử. Current B2 chain/cleanup PASS không xóa giới hạn đó. Malformed/cyclic input, safe integers/ID exhaustion, caller mutation, recursion/resource limits và guard hardening vẫn là residual cần disposition, không tự miễn G-STRUCT. **G-EDU/G-STRUCT/G-RELEASE, C4**, screen reader/zoom/cross-browser/production và mọi release gate còn mở. EDU-3B CLOSED không đóng toàn EDU-3 hoặc mở EDU-3C; B3 docs-only không lặp QA runtime.
