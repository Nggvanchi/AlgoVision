---
name: check
description: Bộ kiểm tra trước commit của AlgoVision gồm pnpm test, pnpm build, kiểm BOM/CRLF/lỗi mã hóa trên file đã sửa, và rà diff để không mutation nào lọt vào commit. Dùng ngay trước mỗi git commit, trước khi báo cáo một việc là "xong", hoặc khi người dùng nói "kiểm tra", "chạy test", "verify", "build thử".
allowed-tools: Bash(node .claude/skills/check/scripts/check-encoding.mjs) Bash(node .claude/skills/check/scripts/check-encoding.mjs *) Bash(pnpm test) Bash(pnpm build) Bash(git diff) Bash(git diff *) Bash(git status) Bash(git status *)
---

# Kiểm tra trước commit

Chạy đủ các bước, theo thứ tự, từ gốc repo. Bước nào đỏ thì DỪNG, không commit, báo nguyên nhân gốc kèm bằng chứng.
Đường dẫn script là tương đối từ gốc repo (đường dẫn tuyệt đối của repo có dấu cách, nên không dùng `${CLAUDE_SKILL_DIR}`).

1. Mã hóa: `node .claude/skills/check/scripts/check-encoding.mjs --staged` nếu đã `git add`, ngược lại chạy không tham số
   (file đã sửa + file mới). Exit 1 nghĩa là có BOM, CRLF hoặc chuỗi lỗi mã hóa: sửa bằng công cụ sửa file hoặc Node,
   không dùng redirect của PowerShell.
2. Diff: đọc toàn bộ `git diff --staged` (hoặc `git diff`). Xác nhận:
   - Chỉ có các file thuộc việc đang làm.
   - Không còn mutation tạm trong `src/` và không còn điều kiện bị đảo trong `tests/`.
   - Không có file thừa (log, script thử nghiệm, dist/).
   - `git diff --check` (hoặc `--staged --check`) sạch.
3. `pnpm test`: ghi số test (dòng `ℹ tests`), pass, fail, skipped, todo và thời gian. So với mục **Baseline** trong CLAUDE.md.
   Số test chỉ được tăng khi việc đang làm thêm test; nếu giảm, phải giải thích.
4. `pnpm build`: ghi kích thước JS, CSS (kể cả gzip) và so với mục **Baseline**. Nếu tăng đáng kể, nói rõ vì sao.

## Báo cáo

Một bảng ngắn: bước | kết quả | số liệu thật. Nêu rõ phần nào chưa xác minh được (ví dụ hành vi trên trình duyệt thật).
