---
name: resume-check
description: Kiểm tra chỉ đọc repo AlgoVision khi bắt đầu hoặc tiếp tục phiên Windows/PowerShell/Codex. Kiểm tra Git refs/status, dependencies và native bindings, CRLF/BOM/lỗi mã hóa, thao tác Git dở dang, mutation chưa khôi phục và baseline lịch sử.
---

# Kiểm tra trước khi làm tiếp

Mục tiêu: biết trạng thái thật trước khi sửa. Phiên trước có thể bị ngắt khi đang mutation test; không khôi phục file hoặc cài dependencies tự động.

## Quy tắc trong lúc kiểm tra

- Không sửa file, không commit, không tạo/đổi branch, không `git stash`, `git clean`, `git reset`, `git restore`.
- Không cài dependency, fetch remote hoặc chạy test/build trong bước kiểm tra chỉ đọc; báo thiếu môi trường để người dùng quyết định bước tiếp theo.
- Kết luận dựa vào NỘI DUNG FILE và lệnh git, không dựa vào tên branch, message commit hay ghi chú trong `docs/development-baseline.md`.

## Các bước

1. Chạy `node .agents/skills/resume-check/scripts/env-check.mjs` từ gốc repo (chỉ đọc, luôn exit 0). Đọc mọi dòng `WARN`.
2. Nếu WARN về dependencies/native bindings thiếu hoặc không phù hợp, ghi lại và dừng; không tự cài, sửa store hoặc cấu hình hệ thống.
3. Nếu WARN về `src/` có thay đổi chưa commit:
   - In `git diff -- src/` và `git diff --cached -- src/`, đối chiếu với ghi chú mutation của phiên trước.
   - Chỉ đọc diff; không ghi patch, không khôi phục file. Báo cáo và chờ người dùng quyết định.
4. Với test đã sửa, đọc cả diff staged/unstaged để kiểm tra mutation chưa khôi phục (ví dụ `=== null` bị đổi thành `!== null`). Script chỉ cảnh báo thay đổi có nguy cơ; không thể kết luận một thay đổi là mutation từ tên file.
5. Chỉ đọc log/branch/ref đã có sẵn trong local repo; không fetch. Đối chiếu `docs/development-baseline.md`, `docs/roadmap.md` và `docs/backlog.md` với trạng thái dự án; ghi rõ mọi điều chưa thể xác minh từ dữ liệu local.
6. Không chạy test/build trong skill chỉ đọc. Dùng skill `check` khi người dùng yêu cầu kiểm chứng hoặc khi quy trình đã được duyệt.

Tham chiếu môi trường: [Windows và PowerShell](../../rules/cross-platform.md). Script dùng root Git và native bindings của nền tảng hiện tại, không khóa vào Windows; CI hai hệ điều hành được giữ nguyên.

## Báo cáo

Trình bày bảng: mục kiểm tra | OK / LỆCH / CHƯA KIỂM ĐƯỢC | bằng chứng (kết quả lệnh). Sau đó chốt ba điều:
- Môi trường đã sẵn sàng chưa, thiếu gì.
- Việc đang làm dở ở trạng thái nào (chưa bắt đầu, dở dang, đã xong chưa push, đã push).
- Việc kế tiếp hợp lý nhất và lý do.

Rồi DỪNG, chờ người dùng.
