# UI v2-3d.2a — fix transition contrast

Base HEAD 841a04e15f49fb828e36b28e2add8a1b37abd2ee, branch fix/ui-v2-3d2-contrast.
Diff chưa commit; evidence nhận diện bằng base + CSS SHA-256
`d22fcac89566489f520867f32d8ed2aede83cf7f8fddd1f276debda29fdf4828`.
Không gọi base SHA là commit fix mới.

## Phạm vi

Chỉ override transition-property: transform cho .adaptive-visualizer .control-button,
sau luật container chung, specificity 0,2,0 cao hơn luật .control-button 0,1,0.
Bỏ nội suy background; giữ transform, palette, hover/focus/disabled. Không đổi thuật toán,
controller, scheduler, seek, dependency hoặc bốn legacy.

## TDD và mutation

Test mới tests/v2-control-transition.test.js áp CSS thật lên template bằng happy-dom:
5 ca Adaptive RED đúng lý do trước patch, 4 ca legacy vẫn GREEN; sau patch 9/9 GREEN.
Các trạng thái enabled → disabled → enabled chỉ transition transform ở Adaptive;
legacy giữ transition nền cũ. Đây là hợp đồng CSS, không thay browser frame regression.
Mutation nguồn đổi transform thành background-color: đối chứng GREEN, mutant RED
đúng thông điệp (heap 512 MB, timeout 30s), restore/verify và Buffer nguyên byte PASS,
đối chứng sau restore GREEN. Không còn mutation tạm.

## Browser regression trên Windows host

Artifact gốc ngoài repo: fix-qa-2026-11-15T04-39-17-573Z/fix-qa-results.json,
trong thư mục artifact của chat. Edge runtime 157.0.4341.46, Chrome runtime 152.0.7977.83;
viewport thực 1280×900. Profile QA riêng, không tác động Chrome cá nhân.

| Phép kiểm | Edge | Chrome |
|---|---|---|
| Graph DFS End→Home, ba lượt/browser, 25 frame/lượt enabled | PASS, min 7,1048929785:1 | PASS, min 7,1048929785:1 |
| Frame enabled dưới 4,5:1 | 0 | 0 |
| Disabled, 18 frame/lượt | PASS, min 4,8346330894:1 | PASS, min 4,8346330894:1 |
| Smoke sáu luồng: enabled/disabled, focus/hover, active transform | 6/6 PASS | 6/6 PASS |
| Mouse-only dropdown, sáu luồng | 6/6 PASS | 6/6 PASS |

Từng frame ghi disabled, màu chữ/nền, opacity, hover/focus, transition và animation.
P2 gốc ở base được tái hiện trên hai browser trước fix; lịch sử 297 PASS/1 FAIL/36 NOT VERIFIED
được bảo toàn, không cộng trùng với lượt regression fix. P2 đã có evidence hết lỗi ở patch
hiện tại, chưa phải nghiệm thu mọi control/state hoặc mọi biến thể thuật toán.

### Mouse-only hoàn tất — Windows native mouse

Lượt gui-mouse-2026-11-15T11-31-19-256Z: **12/12 PASS**, Edge 157.0.4341.46
và Chrome 152.0.7977.83, CSS viewport đo thực 1280×900. Sáu luồng mỗi browser:
Sorting, Searching, BST, Hash Table, Graph BFS và DFS; mỗi ca chọn bằng chuột đủ
Độ phức tạp → Kiến thức → Mã giả, xác nhận đúng value, một pane hiện và các pane khác ẩn.
36 lựa chọn có native-input-log.json; 36 screenshot tương ứng trong mouse-results.json,
không thiếu file. Không dùng keyboard, assignment hoặc synthetic DOM event để chọn option.
Windows Computer Use activate/refresh state và xác minh URL local trước click; screenshot
native popup 86/87px được quan sát, chọn option bằng sky.click theo screenshot. Guard không bị tắt.
Một lần AX read sau click còn stale; host observer đã xác nhận riêng value/pane và lưu ảnh
trước khi chuyển request tiếp. Không lấy snapshot stale làm kết quả FAIL hoặc tạo PASS giả.
Server và hai browser QA do runner tạo đã đóng; phiên browser cá nhân không bị tác động.

### Lịch sử các lượt bị chặn trước khi hoàn tất

Mouse-only: CDP thực mở popup và chụp ảnh, option bbox DOM bằng 0; click theo vùng popup
quan sát được chưa đổi value. Không dùng synthetic events/assign value để thay PASS.
Đây là giới hạn driver, không kết luận lỗi select. GUI với profile QA riêng đã nhận đúng
URL local qua CDP nhưng báo window is minimized, cả sau Browser.setWindowBounds(normal)
và Page.bringToFront; đã dừng nhánh đó, không bypass hoặc tạo PASS. Artifact: hai lượt
gui-mouse-2026-11-15T04-44-36-512Z và gui-mouse-2026-11-15T04-46-47-549Z.
12 ca mouse-only vẫn NOT VERIFIED; mọi kiểm bổ sung sau đó phải ghi evidence riêng.
Lượt Windows Computer Use tiếp theo (gui-mouse-2026-11-15T08-54-39-433Z) đã activate
được cửa sổ và quan sát URL local trong address bar/document, nhưng click bị chặn bởi
minimized/user-input state guard; refresh vẫn trả minimized. Đã dừng, không bypass
input guard. Không có lựa chọn option bằng chuột nào được xác nhận từ lượt GUI này.
Lượt gate cuối gui-mouse-2026-11-15T09-38-30-190Z đã quan sát đúng URL/window,
nhưng click bị user-input guard từ chối; đã dừng theo chỉ dẫn, không retry/bypass.
Bảng manual M01–M12 được xuất ngoài repo tại ui-v2-3d2a-12-mouse-cases.md;
chưa có kết quả manual, cả 12 case giữ NOT VERIFIED. Không chạy lại full suite
vì source/test không đổi.

## Accepted risks và gate

- 12 ca zoom trình duyệt thật 200%: **NOT VERIFIED — chủ dự án chấp thuận hoãn đến C4**.
- 12 ca screen reader thật: **NOT VERIFIED — chủ dự án chấp thuận hoãn đến C4**.
- C4 phải kiểm trên release candidate trước release; AX snapshot không thay screen reader,
  CSS viewport/device scale không thay browser zoom. Không chuyển hai nhóm này thành PASS.
- 12 ca pure-mouse nay PASS; P2 có regression PASS trên patch. Đề xuất nghiệm thu
  UI v2-3d.2/2a trong phạm vi đã kiểm, chờ chủ dự án chấp thuận. Hai nhóm C4 vẫn
  NOT VERIFIED theo accepted risks. Chưa triển khai v2-3d.3 hoặc đóng toàn bộ UI v2.

Gate lần này: 1796/1796 PASS, 0 fail/skip/todo/cancelled; build PASS.
JS raw/gzip 153111/44652 B, CSS 57973/10641 B; encoding/diff PASS.
PR #59 MERGED tại base; CI hậu merge Ubuntu/Windows PASS theo xác nhận chủ dự án,
không phải CI của diff fix chưa commit.
