# UI v2-3d.1 — Learning Panel Dropdown

Ngày ghi nhận: 2026-11-15, Windows x64. Branch `feat/ui-v2-3d-learning-panel`,
base `d639b42ad87e7f282950a88b653fd0030ea6350d`. Diff chưa commit, chờ review;
browser QA bị chặn nên chưa đủ bằng chứng đóng gate.

## Hợp đồng đã duyệt và triển khai

- Áp dụng cho Sorting, Searching, BST, Hash Table và Graph (gồm BFS/DFS).
- Mỗi Learning Panel có một native `select` trong `label` “Nội dung học tập”,
  đúng ba lựa chọn Mã giả / Độ phức tạp / Kiến thức; mặc định Mã giả.
- Ba `div.learning-pane[data-learning-pane]` giữ nguyên nội dung và ID cũ.
  Hai pane không được chọn có `hidden`; không dựng lại DOM khi chuyển pane.
- `initLearningPanels(root)` trong `src/learning-panel.js`, gọi một lần từ
  `src/main.js`, chỉ nghe `change` và cập nhật `hidden` trong cùng Panel.
  Giá trị native select giữ riêng trong DOM của từng màn qua điều hướng;
  tải lại trang trở về Mã giả, không lưu trạng thái học tập.
- Không gọi focus khi chuyển pane. Giữ nhãn `aria-labelledby`, `tabindex`
  của mã giả, và vùng giải thích bước `aria-live="polite"` ngoài các pane.
  Controller vẫn cập nhật nguyên node khi pane ẩn.
- Gỡ CSS accordion cũ, giữ focus chung, select cao tối thiểu 44px và dùng
  token viền control/nền/chữ. Không đổi thuật toán, controller, scheduler,
  seek, bốn legacy hoặc dependencies.

Quyết định 20/30 trong [decision log](decisions.md) giữ làm lịch sử R6b;
quyết định 31 ghi thay đổi hiện hành. Layout hai cột kế thừa v2-3c.

## Bằng chứng tự động

- Baseline thực tế trước sửa: 1775/1775 PASS, 0 fail/skip/todo/cancelled,
  39,642 s; build PASS. JS raw/gzip 152843/44574 B; CSS 58402/10707 B.
- TDD `tests/learning-panel.test.js`: RED 12/12 vì chưa có dropdown,
  sau triển khai GREEN 12/12. Bao gồm mã giả ẩn vẫn cập nhật ở sáu luồng
  (Sorting, Searching, BST, Hash, BFS, DFS), giữ node/focus/live và lựa chọn riêng.
- Hợp đồng accordion cũ được chuyển thành hợp đồng pane/dropdown;
  fingerprint vẫn dùng hash base cũ, chỉ chuẩn hóa picker mới và ba summary
  đã được thay theo phạm vi duyệt. Không thay hash để chấp nhận ID/focus cũ đổi.
- Lần full trước lượt nghiệm thu: 1787/1787 PASS, 0 fail/skip/todo/cancelled,
  39,161 s; build PASS. JS raw/gzip 153111/44652 B; CSS 57906/10624 B
  (gzip Node zlib mặc định). Dư JS 889 B, CSS 594 B dưới trần 154000/58500 B.
- Kiểm lại sau cập nhật tài liệu: regression 208/208 PASS (8,391 s), full 1787/1787 PASS
  (54,530 s), 0 fail/skip/todo/cancelled; build PASS (Vite 8.3.5, 286 ms).
  JS raw/gzip 153111/44652 B; CSS 57906/10624 B, không đổi.
  Encoding và diff check được kiểm lại cuối lượt; xem [baseline](../development-baseline.md).
  Happy-dom không xác nhận tương tác bàn phím, kích thước render hoặc screen reader thật.

### Mutation nguồn đã chạy trước lượt nghiệm thu

Heap 512 MB, timeout 30 s/test. Đối chứng GREEN; các mutant exit 1, không tràn heap.

| Mutation | Test bắt lỗi | Kết quả | Dòng output / thời gian |
|---|---|---|---|
| Đảo `!== select.value` thành `=== select.value` | sorting: dropdown; “chỉ pane đã chọn được hiện” | ĐỎ đúng thông điệp | 42 / 0,9 s |
| Lấy pane toàn root thay vì từng Panel | dropdown giữ; “mỗi màn chỉ hiện pane đã chọn riêng” | ĐỎ đúng thông điệp | 40 / 0,9 s |
| Bỏ `hidden` mặc định khỏi pane Complexity Sorting | sorting: dropdown; “mặc định chỉ hiện Mã giả” | ĐỎ đúng thông điệp | 46 / 0,9 s |

Mỗi lần save/restore/verify và so Buffer nguyên byte đều PASS; đối chứng sau restore GREEN.
Module SHA-256 `4a610a87a05bb0655173fe1bbf46cab06d381a503936e4940a5a24f08f5954e3`;
template `5139f4a8bf582841176eb77f6587536ae5dc837457dc97ef62cb3e24697bafc6`.
Lượt đầu snapshot không truy cập được từ lần gọi shell khác vì thư mục TEMP của sandbox
khác nhau; đã khôi phục khớp hash rồi chạy lại toàn chu kỳ trong cùng lần gọi.
Mutation toàn root ban đầu đỏ ở assert không có message; đã bổ sung message ở lượt trước
và chạy lại đối chứng/mutant/restore thành công. Không tính hai lần thử này là bằng chứng PASS.
Lượt nghiệm thu hiện tại giữ nguyên code/test và không chạy lại mutation.

## Browser QA: NOT VERIFIED

Không có viewport ứng dụng thực đo. 360×900, 1280×900 và 1600×900 là kích thước
dự kiến trong script, **không phải** các case đã chạy hoặc screenshot đã quan sát.

| Cách thử / phiên bản | Quan sát thực tế | Trạng thái smoke |
|---|---|---|
| Chrome executable 152.0.7977.83 | Profile tạm riêng tồn tại nhưng rỗng; process thoát 4294930433. Stderr: `TransactNamedPipe ... (0x6D)`, `crash server failed to launch, self-terminating`. Không có DevToolsActivePort. | NOT VERIFIED |
| Edge executable 157.0.4341.46 | Profile tạm riêng tạo DevToolsActivePort, stderr xác nhận CDP nghe trên loopback. Kết nối `/json/version` bị `connect EACCES 127.0.0.1:59180`; stderr còn báo `CreateAppContainerProfile ... 0x80070057`. Đã dừng tiến trình thử. | NOT VERIFIED |
| Browser tương tác tích hợp Codex | Mở `http://127.0.0.1:5173/` khi Vite đang ready nhưng nhận `net::ERR_CONNECTION_TIMED_OUT`. Engine/version chưa đọc được. | NOT VERIFIED |

Phiên bản Chrome/Edge ở trên lấy từ metadata executable, chưa xác nhận bằng runtime CDP.
Chưa đủ bằng chứng xác định mọi nguyên nhân hệ điều hành; đã xác nhận lỗi khởi động Chrome
và lỗi quyền kết nối loopback ở tiến trình kiểm thử Edge. Không dùng `--no-sandbox`,
không tắt bảo mật, nâng quyền, sửa cấu hình hệ thống hoặc cài thêm công cụ.

| Màn hình | Default/chọn pane | Tab/Shift+Tab/focus | Live/nội dung động | Đổi màn/Quay lại | Overflow/responsive |
|---|---|---|---|---|---|
| Sorting | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Searching | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| BST | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Hash Table | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Graph, gồm BFS/DFS | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |

Không quan sát được lỗi UI P0/P1 mới; điều này không xác nhận UI không có lỗi.
Screen reader, zoom thật 200%, Firefox/Safari, thiết bị thật và production smoke
đều NOT VERIFIED; không suy kết quả từ DOM/happy-dom. CI mới chưa chạy.

## Checklist để tiếp tục nghiệm thu browser

1. Trên browser truy cập được dev server, ghi version runtime và `innerWidth/innerHeight`
   thực ở các viewport dự kiến; kiểm lại cả năm màn, thêm BFS và DFS trong Graph.
2. Kiểm default Mã giả, chọn từng option bằng chuột/bàn phím, chỉ một pane hiện;
   Tab/Shift+Tab bỏ qua pane ẩn, focus select còn rõ sau đổi lựa chọn.
3. Theo dõi live khi đổi pane; chạy bước trong lúc mã giả/Big-O/kiến thức ẩn,
   đổi thuật toán/thao tác rồi hiện lại để kiểm nội dung động đúng.
4. Đổi màn và dùng Quay lại, mở lại từng màn để xác nhận lựa chọn độc lập;
   đo overflow trang, pane, Big-O card ở desktop/mobile và ghi console error thực.
5. Kiểm screen reader riêng trước khi kết luận hành vi đọc live/nhãn truy cập.
