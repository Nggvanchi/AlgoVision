# EDU-3A1 — Hồ sơ bằng chứng Array, Stack, Queue và Linked List

> Trạng thái hiện hành: [acceptance và G5 bridge tại mục 8](#8-edu-3a--acceptance-và-g5-bridge). OP-01–15 OWNER_ACCEPTED, EDU-3A CLOSED, academic acceptance 20/40; mục 1–7 là hồ sơ A1 lịch sử. STATIC_SUPPORTED mô tả loại evidence, không thay source_status; quyền bên thứ ba vẫn RIGHTS_NOT_VERIFIED.

## 1. Phạm vi, baseline và trạng thái

- BASE: `0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7`; TREE: `b5208e637aad61a7c083726f8cee6550fc622645`. Hồ sơ tự biên soạn từ implementation và review EDU3-P0 đã duyệt; không ingestion hoặc truy xuất lại học liệu bên thứ ba.
- Chỉ OP-01–15; [scope release](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/docs/release/v1.0.0-scope.md#L77-L97) giữ bốn module legacy thao tác trực tiếp, không generator/mã giả/Learning Panel theo bước. Không thêm API/module hoặc đổi behavior. getArrayElement/getAt/clear/getSize/isEmpty chỉ là evidence hỗ trợ, không cộng OP.
- **STATIC_SUPPORTED**: contract, phép đếm và cấu trúc vòng lặp đối chiếu tĩnh tại BASE. Proof/oracle bên dưới là lập luận độc lập tự biên soạn, **chờ phản biện/owner acceptance**, không phải chứng nhận học thuật hoặc runtime PASS.
- **Academic acceptance toàn dự án giữ 5/40** (OP-16–20 đã nghiệm thu); OP-01–15 chưa được nâng acceptance. **RIGHTS_NOT_VERIFIED**, source_status, 8 source ID, 40 OP/80 mapping ID và routing lịch sử giữ nguyên. Hồ sơ này không đổi các hàng mapping.

## 2. Contract chung và mô hình chi phí

n là số phần tử trước thao tác, i là index; mỗi số, tham chiếu, so sánh, đọc/ghi phần tử tính một đơn vị. Cận cho dữ liệu hợp lệ; lỗi validation có thể dừng sớm. O(n) trong bảng được hiểu O(n+1) khi gồm n=0; không suy số byte heap hoặc benchmark từ Big-O. Mô hình mảng dùng copy/slice/splice tuyến tính theo số phần tử xử lý; không tuyên bố thời gian engine cụ thể.

- **ADT/core/API:** LIFO/FIFO mô tả thứ tự; đọc TOP/FRONT hoặc nối đầu list có core O(1). API thực tế có validation, copy hoặc toArray, phải tính cả chúng. Không gán O(1) của một ADT khác cho API này.
- **Space:** auxiliary loại input, trạng thái cấu trúc lâu dài và output; mảng mới là output O(n), không gọi là core auxiliary O(n). Insert/remove Array dùng chính bản copy làm kết quả; Stack/Queue trả bản copy/slice. Primitive return và bookkeeping O(1); chi tiết bộ đệm nội bộ engine không được đo ở đây. Nút mới của list là phần tăng trạng thái lưu trữ O(1); toArray là output O(n).
- **Không gồm UI:** DOM/render, parse input, chuỗi thông báo, controller getters và bản sao UI không thuộc chi phí API thuần. Các legacy module không lưu trace S; không áp công thức trace của Sorting/Searching cho chúng.
- **Array:** helper chỉ kiểm Array.isArray, index nguyên/range và value/target hữu hạn, không kiểm mọi giá trị đã nằm trong mảng. Để diễn giải giáo dục dùng mảng đặc số hữu hạn; không tuyên bố helper enforce điều kiện mạnh này. [array validation](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/array.js#L57-L79); controller kiểm initialNumbers rồi copy, [array controller](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/array.js#L40-L49).
- **Stack/Queue:** every(Number.isFinite) kiểm các phần tử được duyệt; mảng đặc hợp lệ có n lượt kiểm. every bỏ qua holes, nên sparse array không được chứng minh là đã validate từng slot. push/enqueue còn kiểm value mới. [Stack validation](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/stack.js#L2-L20); [Queue validation](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/queue.js#L2-L20).
- **Linked List:** bắt đầu từ instance hợp lệ, không có can thiệp ngoài làm hỏng head/size/next, chain hữu hạn không chu trình. Value hữu hạn; index nguyên đúng range. Không có validator cấu trúc tổng quát, tail cache hoặc immutable snapshot. [constructor/validation](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/linkedList.js#L8-L38).

## 3. Claim matrix OP-01–15

Mỗi hàng có pre/postcondition, invariant và proof locator. `KEEP` nghĩa giữ contract/code; `FIX-COPY` là gap nội dung UI theo P0, không phải thay source trong A1. Tất cả hàng **STATIC_SUPPORTED / REVIEW_PENDING / RIGHTS_NOT_VERIFIED**.

| OP | Precondition → postcondition | Invariant / proof | Time; auxiliary / output | Source tại BASE; oracle |
|---|---|---|---|---|
| OP-01 Array append | Array, value hữu hạn → mảng mới dài n+1, value cuối, input không đổi. | Prefix kết quả bằng input; P1. KEEP/FIX-COPY. | O(n); O(1) ngoài output / O(n). | [A8–13](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/array.js#L8-L13); A1. |
| OP-02 Array insert | i nguyên 0..n, value hữu hạn → chèn tại i, dài n+1, input không đổi. | Prefix 0..i−1 và suffix i..n−1 giữ thứ tự; P1. KEEP/FIX-COPY. | O(n), kể cả i=n vì copy; O(1) ngoài output / O(n). | [A15–24](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/array.js#L15-L24); A2–A4. |
| OP-03 Array remove | n>0, i nguyên 0..n−1 → numbers mới bỏ đúng phần tử i, removedValue=input[i]; input không đổi. | Hai đoạn còn lại nối đúng thứ tự; P1. KEEP/FIX-COPY. | O(n); O(1) ngoài output / O(n). | [A26–42](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/array.js#L26-L42); A5–A6. |
| OP-04 Array find | Array, target hữu hạn; không cần sorted → index khớp đầu bằng === hoặc −1. | Prefix đã xét không khớp target; P2. Không mutation. KEEP/FIX-COPY. | n≥1: best O(1), worst O(n); auxiliary/output O(1). | [A44–55](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/array.js#L44-L55); A7–A9. |
| OP-05 Stack push | Stack hợp lệ, value hữu hạn → stack mới dài n+1, TOP=value; input không đổi. | Dãy từ đáy đến TOP giữ prefix, thêm cuối; P1/P3. KEEP/FIX-COPY. | API O(n) validation+copy; auxiliary O(1) ngoài output / O(n). | [S24–29](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/stack.js#L24-L29); S1. |
| OP-06 Stack pop | Stack hợp lệ, n>0 → poppedValue=TOP cũ, stack mới bỏ cuối; input không đổi. | LIFO; P3. Empty ném RangeError. KEEP/FIX-COPY. | API O(n) validation+slice; auxiliary O(1) ngoài output / O(n). | [S31–44](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/stack.js#L31-L44); S2–S3. |
| OP-07 Stack peek | Stack hợp lệ, n>0 → trả TOP, không xóa/mutation. | Dãy giữ nguyên; P3. Empty ném RangeError. KEEP/FIX-COPY. | Đọc O(1), API O(n) validation; auxiliary/output O(1). | [S46–56](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/stack.js#L46-L56); S4. |
| OP-08 Queue enqueue | Queue hợp lệ, value hữu hạn → queue mới thêm REAR, input không đổi. | FRONT ở đầu, thứ tự cũ giữ nguyên; P1/P3. KEEP/FIX-COPY. | API O(n) validation+copy; auxiliary O(1) ngoài output / O(n). | [Q24–29](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/queue.js#L24-L29); Q1. |
| OP-09 Queue dequeue | Queue hợp lệ, n>0 → dequeuedValue=FRONT cũ, queue mới bỏ đầu, input không đổi. | FIFO, suffix giữ thứ tự; P3. Empty ném RangeError. KEEP/FIX-COPY. | API O(n) validation+slice; auxiliary O(1) ngoài output / O(n). | [Q31–44](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/queue.js#L31-L44); Q2–Q3. |
| OP-10 Queue front | Queue hợp lệ, n>0 → trả FRONT, không xóa/mutation. | Dãy giữ nguyên; P3. Empty ném RangeError. KEEP/FIX-COPY. | Đọc O(1), API O(n) validation; auxiliary/output O(1). | [Q46–56](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/queue.js#L46-L56); Q4. |
| OP-11 List append | List hợp lệ, value hữu hạn → mutate list nối cuối, size+1, trả toArray mới. | HEAD cũ giữ nếu n>0; next cuối=null; P4. KEEP/FIX-COPY. | O(n) đi cuối+toArray; core auxiliary O(1), thêm node O(1), output O(n). | [L40–59](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/linkedList.js#L40-L59); L1. |
| OP-12 List prepend | List hợp lệ, value hữu hạn → mutate HEAD mới, new.next=HEAD cũ, size+1; trả toArray. | Không mất suffix; P4. KEEP/FIX-COPY. | Nối core O(1), API O(n) vì toArray; thêm node O(1), output O(n). | [L61–70](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/linkedList.js#L61-L70); L2. |
| OP-13 List insert | List hợp lệ, value hữu hạn, i nguyên 0..size → mutate chèn đúng vị trí, size+1, trả toArray. | Đầu/cuối delegate; giữa nối predecessor→new→successor; P4. KEEP/FIX-COPY. | API O(n) gồm traversal/toArray; core auxiliary O(1), thêm node O(1), output O(n). | [L72–96](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/linkedList.js#L72-L96); L3–L5. |
| OP-14 List remove | List hợp lệ không rỗng, i nguyên 0..size−1 → mutate bỏ node, size−1; trả removedValue và values mới. | Đổi HEAD hoặc nối predecessor→successor; singleton thành HEAD=null,size=0; P4. KEEP/FIX-COPY. | API O(n) gồm toArray; core auxiliary O(1), output O(n). | [L98–127](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/linkedList.js#L98-L127); L6–L8. |
| OP-15 List find | List hợp lệ, target hữu hạn → index khớp đầu bằng === hoặc −1. | Prefix chain đã duyệt không khớp; P2; head/size/next không đổi. KEEP/FIX-COPY. | n≥1: best O(1), worst O(n); auxiliary/output O(1). | [L129–145](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/linkedList.js#L129-L145); L9–L11. |

## 4. Chứng minh độc lập và điều kiện dừng

**P1 — copy và thứ tự.** Spread/slice ghi các phần tử theo thứ tự vào vùng kết quả riêng; append thêm value sau prefix. Insert dùng bản copy, dời suffix để nhường một vị trí; remove lấy đúng phần tử i rồi nối hai đoạn còn lại. Không có phép gán vào input. Do đó postcondition ở OP-01–03/05/06/08/09 theo trực tiếp cấu trúc kết quả, không cần oracle lấy từ hàm. Các vòng copy hữu hạn theo n; invalid value/index bị ném trước copy/splice. Array empty remove kiểm rỗng trước index; không đổi loại lỗi này.

**P2 — tìm khớp đầu.** Trước lần xét index k, k phần tử trước không bằng target. Nếu phần tử k khớp bằng === thì return ngay, nên không thể trả một match phía sau. Nếu không khớp, tăng k hoặc đi next làm prefix tăng đúng một; n−k giảm đến 0 trong chain hợp lệ, khi đó trả −1. Found ở k xét k+1 phần tử; miss xét n, empty xét 0. Đây là số phép xét suy luận, **không có counter runtime trong API**. Best O(1), worst O(n) khi n≥1, empty O(1). Không đưa average vô điều kiện vào claim/UI; chưa đề xuất acceptance mô hình average ở A1.

**P3 — LIFO/FIFO khác độ phức tạp API.** Stack biểu diễn đáy ở index 0, TOP ở n−1; Push thêm cuối và Pop bỏ cuối, nên giá trị mới nhất còn lại được lấy trước. Queue giữ thứ tự đến, Enqueue thêm cuối và Dequeue lấy index 0, nên giá trị đến sớm nhất còn lại ra trước. Peek/Front chỉ đọc đúng đầu tương ứng, không ghi/xóa. Với mảng đặc hợp lệ, validation every đọc n phần tử trước cả Peek/Front; vì vậy API O(n) dù phép đọc sau validation O(1). Empty validation và báo lỗi là O(1); không gọi cấu trúc này ring buffer hoặc stack push in-place O(1).

**P4 — HEAD, size, NULL và mutable list.** Khởi đầu empty có HEAD=null,size=0. Append rỗng đặt HEAD; append không rỗng tiến đến node cuối có next=null rồi nối node mới. Prepend giữ HEAD cũ trong new.next. Insert giữa giữ successor trong new.next trước khi đổi predecessor.next. Remove bỏ đúng một liên kết; các node còn lại giữ thứ tự và size đổi đúng ±1. Các phép nối này không tạo chu trình từ một chain hợp lệ; node cuối vẫn next=null. Find chỉ đọc biến local. Trong traversal, số node còn lại giảm mỗi lần current=current.next; các vòng for dùng index đã validate nên không vượt chain hợp lệ. Các lỗi validation/rỗng xảy ra trước mutation; không tuyên bố transaction rollback cho lỗi tài nguyên hoặc đối tượng đã bị sửa phá invariant.

**toArray và constructor (support OP-11–15).** [toArray](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/linkedList.js#L159-L169) duyệt chain, push giá trị theo thứ tự vào mảng mới: invariant values là prefix đã đọc; O(n) time/output, O(1) bookkeeping. Return array không alias node/list. Constructor [8–20](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/structures/linkedList.js#L8-L20) gọi append n lần; lần j phải đi chain và tạo mảng j phần tử, tổng 1+…+n = O(n²), trạng thái list cuối O(n). Các mảng return trung gian bị bỏ; tổng lượng phần tử được cấp phát qua các lượt O(n²), không suy peak heap/GC từ đó. Không tối ưu constructor hoặc mở rộng C2 trong A1.

## 5. Oracle literal độc lập — expected, chưa chạy

Các ca mỗi hàng độc lập, trừ chuỗi ghi rõ. Expected dò tay từ dãy/thứ tự và contract; không gọi generator/hàm để tạo expected. Với mọi API trả copy, input vẫn đúng dãy ban đầu; sửa mảng kết quả không được đổi input. Với list, kiểm cả toArray, size, HEAD/next cuối và mảng output tách biệt.

| ID | Input / action | Expected literal |
|---|---|---|
| A1 | append([3,1],2); append([],7) | [3,1,2]; [7]. |
| A2 | insert([3,1],0,2) | [2,3,1]. |
| A3 | insert([3,1],1,2) | [3,2,1]. |
| A4 | insert([3,1],2,2); insert([],0,7) | [3,1,2]; [7]. |
| A5 | remove([3,2,1],1) | {numbers:[3,1], removedValue:2}. |
| A6 | remove([7],0); remove([],0) | {numbers:[],removedValue:7}; RangeError. |
| A7 | find([5,2,2,1],2) | 1, không trả 2. |
| A8 | find([3,1,2],9); find([],7) | −1; −1. |
| A9 | find([7],7); find([7],9) | 0; −1. |
| S1 | push([3,1],2); push([],7) | [3,1,2]; [7]. |
| S2 | pop([3,1,2]); pop([7]) | {stack:[3,1],poppedValue:2}; {stack:[],poppedValue:7}. |
| S3 | push(push([],3),1), rồi pop hai lần | Popped lần lượt 1,3; cuối []; pop thêm RangeError. |
| S4 | peek([3,1,2]); peek([]) | 2, dãy giữ nguyên; RangeError. |
| Q1 | enqueue([3,1],2); enqueue([],7) | [3,1,2]; [7]. |
| Q2 | dequeue([3,1,2]); dequeue([7]) | {queue:[1,2],dequeuedValue:3}; {queue:[],dequeuedValue:7}. |
| Q3 | enqueue(enqueue([],3),1), rồi dequeue hai lần | Dequeued lần lượt 3,1; cuối []; dequeue thêm RangeError. |
| Q4 | front([3,1,2]); front([]) | 3, dãy giữ nguyên; RangeError. |
| L1 | list [3,1], append(2); empty append(7) | [3,1,2],size=3; [7],size=1,HEAD.value=7,next=null. |
| L2 | list [3,1], prepend(2); empty prepend(7) | [2,3,1],size=3; [7],size=1. |
| L3 | list [3,1], insertAt(0,2) | [2,3,1],size=3. |
| L4 | list [3,1], insertAt(1,2) | [3,2,1],size=3. |
| L5 | list [3,1], insertAt(2,2); empty insertAt(0,7) | [3,1,2],size=3; [7],size=1. |
| L6 | list [3,2,1], removeAt(0) | {removedValue:3,values:[2,1]},size=2,HEAD.value=2. |
| L7 | list [3,2,1], removeAt(1); removeAt(2) trên instance khác | {removedValue:2,values:[3,1]}; {removedValue:1,values:[3,2]}; size=2. |
| L8 | list [7], removeAt(0); empty removeAt(0) | {removedValue:7,values:[]},size=0,HEAD=null; RangeError. |
| L9 | list [5,2,2,1], find(2) | 1; head/size/next và giá trị không đổi. |
| L10 | list [3,1,2], find(9); empty find(7) | −1; −1; không mutation. |
| L11 | list [7], find(7); list [7], find(9) | 0; −1. |

Validation oracle bổ sung (không thay contract): Array insert index −1/n+1 → RangeError, index 1.5 → TypeError; value/target Infinity/NaN → TypeError. Stack/Queue dense [3,Infinity] bị TypeError trước thao tác; value mới Infinity bị TypeError. Linked List insert index −1/size+1/1.5 → RangeError; value Infinity/NaN → TypeError; sau lỗi list/input không đổi. Array insert tại n hợp lệ; remove tại n không hợp lệ. Các trường hợp empty có thể báo lỗi rỗng trước lỗi index: không hoán đổi thứ tự để tạo expected.

## 6. Test evidence, UI và gap

Đây là **đọc source test**, không chạy test/build/browser trong EDU-3A1. Baseline CI/QA EDU-2 không tự chứng minh các oracle mới hoặc academic acceptance OP-01–15.

| Nhóm | Evidence test tại BASE đã có | Gap đề xuất A2, chưa triển khai |
|---|---|---|
| Array | [append/copy, insert biên, remove, first-match/miss, lỗi](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/tests/array.test.js#L17-L126); [controller](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/tests/array-controller.test.js#L29-L185). | Copy isolation insert/remove; duplicate đầu tiên ở index 1; khóa copy mới ở template. |
| Stack | [LIFO, push giữ input, pop/peek/rỗng](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/tests/stack.test.js#L12-L71); [controller](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/tests/stack-controller.test.js#L27-L169). | Pop copy independence, singleton và invalid stored value; không viết lại happy path đã đủ. |
| Queue | [FIFO, enqueue/dequeue giữ input, front/rỗng](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/tests/queue.test.js#L12-L98); [controller](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/tests/queue-controller.test.js#L27-L174). | Output independence và assertion nội dung phân biệt validation/API; giữ mọi test cũ. |
| Linked List | [biên, mutation/result, first-match, lỗi](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/tests/linked-list.test.js#L5-L150); [controller](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/tests/linked-list-controller.test.js#L26-L221). | size/next/HEAD/null sau chuỗi thao tác, toArray independence, duplicate first-match index 1. |

Template [Array/Stack](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/public/templates/app.html#L1004-L1185) và [Queue/List](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/public/templates/app.html#L1186-L1428) có mô tả/thẻ thao tác, không Learning Panel dropdown. Array status dùng index 0-based, [find handler](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/array.js#L141-L151); List status gọi là vị trí nhưng truyền index 0-based, [find handler](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/src/linked-list.js#L190-L204). TOP ở phần tử cuối; FRONT đầu/REAR cuối. Bổ sung wording cần owner duyệt A2, không thay DOM/controller/CSS trong A1. Không tuyên bố hiện có mã giả/trace/counter cho các legacy module.

Deferred hardening: sparse arrays, Array existing-element validation, public head/size/next bị sửa, cycle detection, input Proxy/subclass/side effects và lỗi tài nguyên không thuộc chứng minh cho input thông thường. Không tự đổi API để chữa gap. Constructor O(n²) và thao tác copy là đặc điểm implementation đang mô tả, không phải quyền tối ưu C2. Không mở audit BST/Hash hoặc claim ngoài 15 OP trong hồ sơ này.

## 7. Provenance, rights và gate

Theo [Policy B §11](https://github.com/Nggvanchi/AlgoVision/blob/0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7/docs/education/uit-sources.md#L203-L234), UIT-SRC-004 chỉ định danh/phạm vi; Array/Stack/Queue chưa có locator nguồn ADT chi tiết, chủ đề Linked List không tự chứng minh từng contract/Big-O. Không truy xuất lại IT003/OpenDSA, không ingestion, sao chép, dịch hoặc chuyển thể giáo trình. Proof, oracle và biểu đạt trong hồ sơ này do tự biên soạn dựa trên code pin BASE; metadata/link không cấp quyền nội dung đích. Quyền nội dung AlgoVision và quyền tài liệu bên thứ ba phải đánh giá riêng theo hành vi; không suy từ MIT, technical PASS hoặc owner approval. **RIGHTS_NOT_VERIFIED** giữ nguyên đến evidence/acceptance phù hợp cho nội dung thực tế; quyết định quyền của OP-16–20 không tự áp dụng cho nhóm này.

Giữ **STATIC_SUPPORTED**, trạng thái review **REVIEW_PENDING**, academic acceptance **5/40**, mọi source_status/routing và historical mapping. A1 chỉ thêm hồ sơ và liên kết, không tự đóng EDU-3 hoặc gate học thuật. Giữ EX-03 historical NOT VERIFIED; EX-04 chỉ chấp nhận baseline config hiện tại, historical drift NOT VERIFIED; ARTIFACT_PERSISTENCE_NOT_VERIFIED, runtime Chrome profile isolation và cleanup toàn bộ process/profile NOT VERIFIED. Insertion step-limit C2 và negative/mutation C3 bắt buộc trước release; G-EDU/G-STRUCT/G-RELEASE và C4 còn mở. Không triển khai A2/B/C từ hồ sơ docs-only này.

## 8. EDU-3A — Acceptance và G5 bridge

### 8.1. Quyết định owner và phạm vi

Ngày 26/11/2026, owner chấp nhận claims **OP-01–15 OWNER_ACCEPTED** theo A1/A2 và phản biện đã duyệt, trong tiền điều kiện, invariant và mô hình chi phí ở mục 2–4; xác nhận có căn cứ quyền công bố **nội dung AlgoVision tự biên soạn thực tế** của 15 OP. **EDU-3A OWNER_ACCEPTED/CLOSED**; cùng OP-16–20, academic acceptance toàn dự án **20/40**. Đây không phải chứng nhận học thuật bên ngoài. Quyết định được ghi từ phê duyệt owner trong workflow, không tạo citation bên thứ ba cho quyết định này.

Mục 1–7, gồm STATIC_SUPPORTED/REVIEW_PENDING/5/40 và gap A2 chưa triển khai, giữ nguyên làm lịch sử A1. STATIC_SUPPORTED tiếp tục chỉ loại bằng chứng tĩnh; trạng thái owner acceptance hiện hành nằm ở mục 8. Bản đồng bộ docs closeout **chưa commit/publish/merge**; không dùng việc chưa publish để phủ nhận quyết định owner, cũng không tuyên bố PR docs đã merge.

### 8.2. Acceptance matrix và evidence tái sử dụng

Mỗi hàng dưới đây là **OWNER_ACCEPTED** trong contract/mô hình đã ghi, không mở rộng sang sparse array, cấu trúc list bị sửa phá invariant, lỗi tài nguyên hoặc các hardening deferred ở mục 6. Proof/oracle là nội dung độc lập mục 4–5; không suy 28 hàng oracle thành 28 test runtime mới.

| OP | Claim/chi phí được chấp nhận | Proof; oracle A1 | Product/regression bridge A2 |
|---|---|---|---|
| OP-01 Array append | Mảng kết quả riêng, prefix giữ nguyên; API O(n). | P1; A1. | Array A2. |
| OP-02 Array insert | Index 0..n, copy trước chèn; API O(n). | P1; A2–A4. | Array A2. |
| OP-03 Array remove | Index 0..n−1, trả removedValue/copy; API O(n). | P1; A5–A6. | Array A2. |
| OP-04 Array find | ===, first-match 0-based/−1, không mutation; best O(1), worst O(n). | P2; A7–A9. | Array A2. |
| OP-05 Stack push | TOP ở cuối, output riêng, LIFO; API O(n). | P1/P3; S1. | Stack A2. |
| OP-06 Stack pop | Lấy TOP, copy, lỗi rỗng; API O(n). | P3; S2–S3. | Stack A2. |
| OP-07 Stack peek | Đọc O(1), không xóa; toàn API O(n) vì validation. | P3; S4. | Stack A2. |
| OP-08 Queue enqueue | Thêm REAR, output riêng, FIFO; API O(n). | P1/P3; Q1. | Queue A2. |
| OP-09 Queue dequeue | Lấy FRONT, copy, lỗi rỗng; API O(n). | P3; Q2–Q3. | Queue A2. |
| OP-10 Queue front | Đọc O(1), không xóa; toàn API O(n) vì validation. | P3; Q4. | Queue A2. |
| OP-11 List append | Mutable, size+1, đuôi NULL; API O(n). | P4; L1. | Linked List A2. |
| OP-12 List prepend | Mutable HEAD mới; nối core O(1), API O(n) vì toArray. | P4; L2. | Linked List A2. |
| OP-13 List insert | Mutable, index 0..size, giữ suffix; API O(n). | P4; L3–L5. | Linked List A2. |
| OP-14 List remove | Mutable, size−1, singleton thành HEAD=NULL; API O(n). | P4; L6–L8. | Linked List A2. |
| OP-15 List find | First-match/−1, không mutation; best O(1), worst O(n). | P2/P4; L9–L11. | Linked List A2. |

Cận find áp dụng n≥1; empty O(1). Giữ phân biệt ADT/core/API, validation, auxiliary/output/copy, constructor List O(n²) và không gồm DOM. Không thêm average-case, generator, pseudocode hoặc trace cho legacy module.

Locator A1 ở mục 1–7 pin `0d8d8ce906c64c72dd3d42030bfd6dc2f13a90d7` vẫn là provenance ban đầu. Bridge A2 pin merge `cb9ea0cb8c1e9d78679b1bbe3617173922cc2671`:

| Nhóm | Oracle/regression bổ sung | Nội dung từ template thật |
|---|---|---|
| Array A2 | [array.test.js:129](https://github.com/Nggvanchi/AlgoVision/blob/cb9ea0cb8c1e9d78679b1bbe3617173922cc2671/tests/array.test.js#L129) | [array-controller.test.js:192](https://github.com/Nggvanchi/AlgoVision/blob/cb9ea0cb8c1e9d78679b1bbe3617173922cc2671/tests/array-controller.test.js#L192) |
| Stack A2 | [stack.test.js:74](https://github.com/Nggvanchi/AlgoVision/blob/cb9ea0cb8c1e9d78679b1bbe3617173922cc2671/tests/stack.test.js#L74) | [stack-controller.test.js:173](https://github.com/Nggvanchi/AlgoVision/blob/cb9ea0cb8c1e9d78679b1bbe3617173922cc2671/tests/stack-controller.test.js#L173) |
| Queue A2 | [queue.test.js:100](https://github.com/Nggvanchi/AlgoVision/blob/cb9ea0cb8c1e9d78679b1bbe3617173922cc2671/tests/queue.test.js#L100) | [queue-controller.test.js:178](https://github.com/Nggvanchi/AlgoVision/blob/cb9ea0cb8c1e9d78679b1bbe3617173922cc2671/tests/queue-controller.test.js#L178) |
| Linked List A2 | [linked-list.test.js:153](https://github.com/Nggvanchi/AlgoVision/blob/cb9ea0cb8c1e9d78679b1bbe3617173922cc2671/tests/linked-list.test.js#L153) | [linked-list-controller.test.js:225](https://github.com/Nggvanchi/AlgoVision/blob/cb9ea0cb8c1e9d78679b1bbe3617173922cc2671/tests/linked-list-controller.test.js#L225) |

### 8.3. Technical G5 bridge và QA

- A1 [PR #80](https://github.com/Nggvanchi/AlgoVision/pull/80), commit `5386dfa21306e0221472c98490c913eaafabc40b`, merge `3105b9c432926851360986ba7e532fd4606b5279`: hai docs +115/−0, 15 OP, 28 oracle. A1 docs-only không tạo runtime PASS.
- A2 [PR #81](https://github.com/Nggvanchi/AlgoVision/pull/81), commit `d2efc6101305911d593b5f8ebae42a046c8fa6c7`, merge [`cb9ea0cb8c1e9d78679b1bbe3617173922cc2671`](https://github.com/Nggvanchi/AlgoVision/commit/cb9ea0cb8c1e9d78679b1bbe3617173922cc2671), tree `621a3fb57bb9994730923d1283a44ae07749ca3d`: chín file +203/−16, 244 file ngoài scope giữ nguyên blob; template chỉ đổi 16 text nodes, không đổi DOM/attributes/API. Thêm tám test, giữ assertions cũ.
- Local A2: targeted **100/100**, copy assertions RED đúng lý do trước sửa → GREEN; wording mutation **4/4**, assertion negative control Array first-match expected 1→2 RED đúng assertion rồi restore byte/hash → GREEN, báo riêng với implementation mutation. Full **1818/1818**, 0 fail/skip/todo/cancelled; JS/CSS **153845/58016 B**, delta 0/0 so baseline A2, trong budget 154000/58500 B. Không chạy lại trong docs closeout nếu runtime blobs giữ nguyên.
- [CI hậu merge 45778443813](https://github.com/Nggvanchi/AlgoVision/actions/runs/45778443813) trên đúng merge SHA: Ubuntu/Windows **1818/1818**, 0 fail/skip/todo/cancelled, build/encoding SUCCESS; [Vercel](https://vercel.com/nggvanchi-4548/algo-vision/ANgZFLBVY49rUMXY9x9WP9rMBstX) SUCCESS. Tách local QA, CI trên PR và CI hậu merge; không cộng các lần chạy thành số assertion/test unique.
- Browser A2: Chrome 152, bốn module × 360/699/768/1280×900, DPR=1; functional **16/16**, **448/448 assertions PASS**. Visual **12/16 PASS, 4/16 FAIL** ở Linked List; **VIS-01 PRE_EXISTING** được owner chấp nhận có điều kiện cho A2, chưa sửa/đóng, bắt buộc xử lý trước release/C4. Không đổi visual FAIL thành PASS hoặc suy localhost thành production QA.
- Evidence reuse: checkpoint `EDU3A2-1795624357722`, `recovery-1795624932927` và `runner-recovery-1795626161143` (combined manifest, visual review, 32 PNG before/after); `commit-pr-1795626791274` nối committed hashes/CI. Runner corrections có source contract làm căn cứ, phân biệt HARNESS_FAIL với PRODUCT_FAIL; preserve attempts gốc. Chỉ reuse khi hash/phạm vi tương ứng còn hợp lệ, không tính lại mutation/control hoặc assertion attempts.
- Sai lệch đã ghi nhận: remote branch `codex/edu3a-linear-content` đã mất; title merge thực tế là `Merge pull request #81 from Nggvanchi/codex/edu3a-linear-content`, không phải title tiếng Việt dự kiến. Không phục hồi branch hoặc sửa lịch sử.

### 8.4. Rights scope, lịch sử và residual gates

Áp [Policy B §11](uit-sources.md#11-policy-b-và-quyền-theo-hành-vi--edu-1f): UIT-SRC-004 chỉ định danh/phạm vi. Owner xác nhận căn cứ công bố nội dung AlgoVision tự biên soạn thực tế; acceptance này không xác minh quyền sao chép/dịch/chuyển thể hoặc tái phân phối tài liệu bên thứ ba. **RIGHTS_NOT_VERIFIED** của bên thứ ba và source_status giữ nguyên; không suy quyền từ MIT, technical PASS hay owner approval. Không tìm lại IT003/OpenDSA hoặc ingestion mới.

Giữ **8 source ID, 40 OP/80 mapping ID**, routing lịch sử **2 READY/38 DEFER**, mọi hàng mapping/disposition và lịch sử mục 1–7. [Mapping hiện hành mục 16](knowledge-mapping.md#16-edu-3a--owner-academic-closeout-26112026) chỉ nối acceptance, không đổi catalog/routing. Roadmap/backlog đồng bộ trong PR riêng; EDU-3A CLOSED không đóng EDU-3B/C hoặc toàn EDU-3.

Giữ **EX-03/EX-04**, historical config drift **UNKNOWN**, exact diff/attribution/runtime overrides **NOT VERIFIED**; acceptance config/checkpoint chỉ theo phạm vi và nhóm owner đã duyệt, không blanket acceptance cho delta tương lai. Giữ **ARTIFACT_PERSISTENCE_NOT_VERIFIED** lịch sử, runtime Chrome profile isolation và cleanup toàn bộ process/profile **NOT VERIFIED**; 32 PNG A2 đã lưu là evidence riêng, không tự nâng exception lịch sử. Insertion step-limit **C2**, negative/mutation **C3** bắt buộc trước release; **G-EDU/G-STRUCT/G-RELEASE, C4**, screen reader/zoom/cross-browser/production và mọi release gate còn mở. VIS-01 vẫn là finding phải xử lý trước release.
