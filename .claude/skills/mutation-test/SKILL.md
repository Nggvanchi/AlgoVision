---
name: mutation-test
description: Quy trình mutation test và đo bộ nhớ/thời gian cho test của AlgoVision (node:test + happy-dom). Luôn chạy mốc đối chứng trước, chạy riêng từng test với giới hạn heap và timeout, khôi phục file an toàn kể cả khi file đang có sửa đổi chưa commit, và bảo đảm không mutation nào lọt vào commit. Dùng khi viết test theo TDD, khi cần chứng minh một test bắt được lỗi, khi đo tràn heap, hoặc khi người dùng nhắc "mutation", "đảo điều kiện", "test có bắt được lỗi không".
---

# Mutation test

## Nguyên tắc

- **Mốc đối chứng trước.** Chạy đúng lệnh, đúng heap, đúng file nhưng KHÔNG có thay đổi. Nếu mốc đã đỏ hoặc đã tràn heap thì mọi kết quả ở điều kiện đó vô giá trị: tăng heap hoặc đổi cách đo, rồi chạy lại mốc. (Ví dụ thật: trước khi dọn cửa sổ happy-dom bằng `close()`, `tests/graph-controller.test.js` tràn heap ở 768 MB ngay cả khi xanh, nên mọi mutation trên file đó ở mức heap cũ vô giá trị. Đo 2026-11-05: file nặng nhất xanh từ 128 MB.)
- **Mỗi lần một thay đổi**, chạy riêng test liên quan bằng `--name`, để biết chính xác assert nào đỏ.
- **Phân biệt hai loại bằng chứng** và ghi rõ loại nào trong báo cáo:
  - *Mutation nguồn* (sửa `src/`): chứng minh test bắt được hồi quy thật.
  - *Đảo điều kiện* (sửa assert trong `tests/`): chỉ chứng minh đường thất bại an toàn và in đúng thông điệp.

## Công cụ

Chạy từ gốc repo (đường dẫn tương đối; đường dẫn tuyệt đối của repo có dấu cách).

Chạy một test có giới hạn (script luôn exit 0; đọc dòng VERDICT):

```
node .claude/skills/mutation-test/scripts/run-isolated.mjs <file-test> --heap 512 --timeout 60 \
  --name "<regex tên test>" --expect "<thông điệp assert mới>" --label "<nhãn>" --log <file ngoài repo>
```

512 MB gấp 4 lần mức tối thiểu của file nặng nhất (`graph-controller.test.js` 128 MB, `searching-controller.test.js` 64 MB).
`--expect` so với output nguyên văn: lỗi ném ra in dạng `RangeError [Error]: <thông điệp>`, nên chỉ đặt phần thông điệp.

Khôi phục file:
- File KHÔNG có sửa đổi chưa commit: `git restore <file>`.
- File ĐANG có sửa đổi chưa commit (ví dụ test vừa viết): KHÔNG dùng `git restore` vì sẽ xóa luôn công sức thật. Dùng
  `node .claude/skills/mutation-test/scripts/snapshot.mjs save <file>` trước khi sửa tạm, rồi
  `node .claude/skills/mutation-test/scripts/snapshot.mjs restore <file>` (phải in KHỚP).
  Xong việc chạy `node .claude/skills/mutation-test/scripts/snapshot.mjs clear`.
- Không bao giờ dùng `git stash` hay `git reset` cho việc này.

## Quy trình cho mỗi mutation

1. Chạy mốc đối chứng, ghi VERDICT (phải XANH).
2. Lưu bản sao nếu file đang có sửa đổi chưa commit.
3. Áp đúng một mutation. Ghi lại file:dòng và nội dung trước/sau.
4. Chạy `run-isolated.mjs` với `--expect` là thông điệp assert mong đợi. Đạt khi VERDICT là "ĐỎ đúng thông điệp" và không tràn heap.
5. Khôi phục, rồi xác nhận: `git diff --stat -- src` trống, và `git diff` của `tests/` chỉ còn đúng các sửa đổi thật.
6. Lặp lại cho mutation tiếp theo.

Nếu VERDICT là "ĐỎ nhưng KHÔNG thấy thông điệp", có thể một assert khác đỏ trước. Thu hẹp `--name` hoặc chọn mutation khác; đừng ghi là đạt.

## Báo cáo

Bảng: chỗ được kiểm | loại bằng chứng (nguồn / đảo điều kiện) | mutation | heap | exit | VERDICT | số dòng output | thời gian. Kèm kết quả mốc đối chứng ở từng mức heap đã dùng, và danh sách chỗ CHƯA chứng minh được.
