---
paths:
  - "tests/**/*.test.js"
  - "tests/helpers/**/*.js"
---

# Quy tắc viết test (node:test + happy-dom)

## Hạ tầng
- `tests/*.test.js` chạy bằng Node Test Runner; test giao diện dùng happy-dom và nạp template thật từ `public/templates/app.html`.
- `tests/helpers/` không bị `node --test` quét. `fake-scheduler.js`: thời gian ảo (`advance(ms)`, `pendingCount`, `cancelCount`, `scheduledDelays`).
  Test timer không phụ thuộc thời gian thực: inject `{ schedule, cancel }`; với code chưa inject được thì dùng `t.mock.timers`.
- Helper DOM (`withSortingDom`, `setupSearching`, `withApp`) dọn timer trong `finally` để test đỏ không làm treo tiến trình.
- Dọn cửa sổ happy-dom bằng `window.happyDOM.close()`, không bằng `abort()`: `abort()` chỉ hủy tác vụ đang chờ, không giải phóng
  DOM (mỗi cửa sổ nạp `app.html` bị giữ khoảng 11 MB). `tests/meta/no-happy-dom-abort.test.js` chặn tự động.
- `deepFreeze` dùng chung từ `tests/helpers/deep-freeze.js`, không định nghĩa lại trong file test.
- `tests/meta/`: test canh gác quy tắc, quét mã nguồn của chính `tests/` (`no-dom-in-equal`, `no-happy-dom-abort`, `no-web-storage`).
- `pnpm test` đặt `--test-timeout=30000`: chỉ bắt test async bị treo; vòng lặp đồng bộ thì do chốt số bước trong generator chặn.
- Đếm test bằng dòng `ℹ tests` của `node --test` (grep `^test(` bỏ sót test sinh trong vòng `for`).
- Test import module có thể chưa có export thì dùng namespace import (`import * as m`) để không làm hỏng cả file.

## Assert phần tử DOM
- Không truyền phần tử DOM vào `assert.equal`, `strictEqual`, `notEqual`, `deepEqual`, `deepStrictEqual`, kể cả khi có thông điệp. Khi test đỏ, Node in cả phần tử happy-dom nên tràn heap hoặc treo rất lâu và mất thông điệp lỗi.
- Mẫu chuẩn: `assert.ok(<biểu thức> === null, '<mô tả>')` hoặc `!== null`. Dạng `assert.ok(el, '<mô tả>')` an toàn vì khi đỏ thì `el` là null.
- So sánh hai phần tử: so định danh hoặc thuộc tính (`assert.ok(a === b, '<mô tả>')`, so `id`, `textContent`), không truyền phần tử vào `equal`.
- Thông điệp assert bằng tiếng Việt, nêu rõ phần tử nào và tình huống nào.
- Dò assert nhận phần tử DOM bằng regex nhiều dòng hoặc chạy thật, không dùng grep một dòng: assert viết trên nhiều dòng và helper như `ui.$`, `ui.nodeByValue`, `ui.entryByKey` từng bị bỏ sót.
- `tests/meta/no-dom-in-equal.test.js` quét tự động theo `DOM_QUERY_NAMES`; thêm helper mới trả về phần tử DOM thì thêm tên vào đó.
  Hạn chế: không quét `row(...)` (trùng tên helper trả về mảng ở `graph-bfs-view`, `graph-dfs-view`) và biến đã gán phần tử.

## Bộ nhớ
- Mức heap tối thiểu để xanh khi chạy riêng (đo 2026-11-05, Ubuntu): `tests/graph-controller.test.js` 128 MB (112 MB tràn),
  `tests/searching-controller.test.js` 64 MB (56 MB tràn). Trước khi đổi sang `close()`: 1280 MB và 576 MB.
  Mọi phép đo bộ nhớ/thời gian phải có mốc đối chứng ở cùng mức heap (xem skill `mutation-test`); so thời gian bằng các lần chạy
  xen kẽ trước/sau ngay sau nhau, vì tải máy làm số đo lệch tới gấp đôi.

## Test sinh bước
- Dùng helper bất biến chung `tests/helpers/step-invariants.js` (tham chiếu id, đường đi chỉ tăng, trường hằng, finished, bước 0). Module mới bọc mỏng như `bst-step-invariants.js`, `hash-step-invariants.js`, `graph-step-invariants.js`.
  Trường dạng đối tượng (`currentEdge`, `matrixCell`) khai báo `idsOf(value)`; không có `idsOf` thì giá trị chính là id.
- Helper bất biến mới phải có test âm (`assert.throws`), như `tests/step-invariants.test.js`, `tests/graph-bfs-invariants.test.js`.
- Số mong đợi lấy từ dò tay độc lập hoặc cài đặt tham chiếu độc lập, không chép từ output của code đang test.
