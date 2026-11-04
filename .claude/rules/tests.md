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
- Đếm test bằng dòng `ℹ tests` của `node --test` (grep `^test(` bỏ sót test sinh trong vòng `for`).
- Test import module có thể chưa có export thì dùng namespace import (`import * as m`) để không làm hỏng cả file.

## Assert phần tử DOM
- Không truyền phần tử DOM vào `assert.equal`, `strictEqual`, `notEqual`, `deepEqual`, `deepStrictEqual`, kể cả khi có thông điệp. Khi test đỏ, Node in cả phần tử happy-dom nên tràn heap hoặc treo rất lâu và mất thông điệp lỗi.
- Mẫu chuẩn: `assert.ok(<biểu thức> === null, '<mô tả>')` hoặc `!== null`. Dạng `assert.ok(el, '<mô tả>')` an toàn vì khi đỏ thì `el` là null.
- So sánh hai phần tử: so định danh hoặc thuộc tính (`assert.ok(a === b, '<mô tả>')`, so `id`, `textContent`), không truyền phần tử vào `equal`.
- Thông điệp assert bằng tiếng Việt, nêu rõ phần tử nào và tình huống nào.
- Dò assert nhận phần tử DOM bằng regex nhiều dòng hoặc chạy thật, không dùng grep một dòng: assert viết trên nhiều dòng và helper như `ui.$`, `ui.nodeByValue`, `ui.entryByKey` từng bị bỏ sót.

## Bộ nhớ
- `tests/searching-controller.test.js` cần hơn 512 MB heap khi chạy riêng, ngay cả khi xanh (xanh từ 768 MB). Mọi phép đo bộ nhớ/thời gian phải có mốc đối chứng ở cùng mức heap (xem skill `mutation-test`).

## Test sinh bước
- Dùng helper bất biến chung `tests/helpers/step-invariants.js` (tham chiếu id, đường đi chỉ tăng, trường hằng, finished, bước 0). Module mới bọc mỏng như `bst-step-invariants.js`, `hash-step-invariants.js`, `graph-step-invariants.js`.
  Trường dạng đối tượng (`currentEdge`, `matrixCell`) khai báo `idsOf(value)`; không có `idsOf` thì giá trị chính là id.
- Helper bất biến mới phải có test âm (`assert.throws`), như `tests/step-invariants.test.js`, `tests/graph-bfs-invariants.test.js`.
- Số mong đợi lấy từ dò tay độc lập hoặc cài đặt tham chiếu độc lập, không chép từ output của code đang test.
