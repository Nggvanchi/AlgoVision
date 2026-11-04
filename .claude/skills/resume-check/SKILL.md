---
name: resume-check
description: Kiểm tra trạng thái repo AlgoVision trước khi làm tiếp, chỉ đọc. Dùng khi bắt đầu phiên mới, sau khi đổi máy giữa Windows và Ubuntu, hoặc khi người dùng hỏi "đang làm tới đâu", "kiểm tra tiến độ", "tiếp tục công việc", "vừa chuyển máy". Phát hiện node_modules sai hệ điều hành, CRLF/BOM/lỗi mã hóa, thao tác git dở dang, mutation chưa restore trong src/, và so CLAUDE.md với thực tế.
argument-hint: "[ghi chú việc đang làm dở]"
---

# Kiểm tra trước khi làm tiếp

Mục tiêu: biết chính xác trạng thái thật trước khi sửa bất cứ thứ gì. Phiên trước có thể bị ngắt giữa chừng, ví dụ đang mutation test dở thì đổi máy.

## Quy tắc trong lúc kiểm tra

- Không sửa file, không commit, không tạo/đổi branch, không `git stash`, `git clean`, `git reset`, `git restore`.
- Ngoại lệ duy nhất được ghi: `pnpm install --frozen-lockfile` khi node_modules sai hệ điều hành.
- Kết luận dựa vào NỘI DUNG FILE và lệnh git, không dựa vào tên branch, message commit hay ghi chú trong CLAUDE.md.

## Các bước

1. Chạy `node .claude/skills/resume-check/scripts/env-check.mjs` từ gốc repo (chỉ đọc, luôn exit 0). Đọc mọi dòng `WARN`.
2. Nếu WARN về node_modules: chạy `pnpm install --frozen-lockfile`, rồi xác nhận `git status` không có thay đổi ở package.json và pnpm-lock.yaml.
3. Nếu WARN về `src/` có thay đổi chưa commit:
   - In `git diff -- src/` và đối chiếu với mutation được nhắc trong ghi chú `$ARGUMENTS`.
   - Lưu bản sao trước mọi thao tác: `git diff --output=<thư mục tạm ngoài repo>/before-restore.patch`.
   - KHÔNG restore. Báo cáo và chờ người dùng quyết định.
4. Với test đã sửa mà chưa commit, kiểm xem có chỗ nào đang ở trạng thái "đảo điều kiện" của mutation test hay không (ví dụ `=== null` bị đổi thành `!== null`).
5. `git fetch` rồi so `git log --oneline -10`, `git branch -vv`, `git log main..HEAD`, `git log main..origin/main` để biết việc
   đang làm dở và `main` local có tụt sau GitHub không. Đối chiếu mục **Baseline** trong CLAUDE.md, `docs/roadmap.md` và `docs/backlog.md`
   với thực tế; liệt kê từng câu đã lỗi thời kèm số dòng.
6. Chạy `pnpm test` và `pnpm build`. Ghi số test pass/fail, thời gian, kích thước bundle và so với mục **Baseline**. Nếu đỏ, nêu test nào, lỗi nguyên văn, và bằng chứng xem có phải do khác biệt hệ điều hành không.

## Báo cáo

Trình bày bảng: mục kiểm tra | OK / LỆCH / CHƯA KIỂM ĐƯỢC | bằng chứng (kết quả lệnh). Sau đó chốt ba điều:
- Môi trường đã sẵn sàng chưa, thiếu gì.
- Việc đang làm dở ở trạng thái nào (chưa bắt đầu, dở dang, đã xong chưa push, đã push).
- Việc kế tiếp hợp lý nhất và lý do.

Rồi DỪNG, chờ người dùng.
