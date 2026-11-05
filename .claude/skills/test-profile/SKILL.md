---
name: test-profile
description: Đo bộ test của AlgoVision theo từng file (thời gian, bộ nhớ đỉnh, số test, tràn heap) để tối ưu dựa trên số liệu. Dùng khi người dùng nói "test chậm", "tốn bộ nhớ", "tối ưu bộ test", "file test nào nặng nhất", hoặc trước và sau một thay đổi có thể ảnh hưởng hiệu năng test.
argument-hint: "[file test...] [--heap MB]"
---

# Đo bộ test

Tối ưu phải bắt đầu từ số đo, không từ cảm giác. Script chạy TUẦN TỰ từng file trong tiến trình riêng, nên tổng thời gian lớn hơn `pnpm test` (vốn chạy song song). Dùng nó để so sánh các file với nhau và so trước/sau, không để thay `pnpm test`.

## Lệnh

Chạy từ gốc repo (đường dẫn tương đối; đường dẫn tuyệt đối của repo có dấu cách):

```
node .claude/skills/test-profile/scripts/profile-tests.mjs [file...] [--heap MB] [--timeout giây] [--json <file ngoài repo>]
```

Không truyền file thì đo mọi `tests/**/*.test.js`. Bảng xếp theo thời gian giảm dần; cuối bảng có TỔNG, RSS lớn nhất và các file KHÔNG XANH.

## Quy trình

1. Đo mốc ở heap mặc định, lưu `--json` ra file ngoài repo.
2. Nếu cần tìm file nhạy bộ nhớ: đo lại với `--heap 512`. File XANH ở mặc định mà TRÀN HEAP ở 512 MB là ứng viên rò bộ nhớ (ví dụ cửa sổ happy-dom không được đóng).
3. Chọn tối đa 3 file nặng nhất để điều tra. Với mỗi file, nêu giả thuyết cụ thể kèm bằng chứng từ code (`file:dòng`), chưa sửa gì.
4. Sau khi sửa: đo lại đúng các file đó, cùng tham số, và báo bảng trước/sau. `pnpm test` phải giữ nguyên số test và xanh.

## Không được làm để "tối ưu"

- Xóa test, giảm số trường hợp, hạ quy mô test Big-O, hay bỏ assert chỉ để chạy nhanh hơn. Nếu thấy cần, đề xuất và chờ người dùng quyết.
- Đổi hành vi code trong `src/` trong cùng commit với thay đổi test.
