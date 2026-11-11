---
name: resume-check
description: Kiểm tra trạng thái repo AlgoVision trước khi làm tiếp, chỉ đọc. Dùng khi bắt đầu phiên mới, sau khi đổi máy giữa Windows và Ubuntu, hoặc khi người dùng hỏi "đang làm tới đâu", "kiểm tra tiến độ", "tiếp tục công việc", "vừa chuyển máy". Phát hiện node_modules sai hệ điều hành, CRLF/BOM/lỗi mã hóa, thao tác git dở dang, mutation chưa restore trong src/, và so AGENTS.md với thực tế.
---

# Kiểm tra trước khi làm tiếp

Mục tiêu: biết chính xác trạng thái thật trước khi sửa bất cứ thứ gì. Phiên trước có thể bị ngắt giữa chừng, ví dụ đang mutation test dở thì đổi máy.

## Quy tắc trong lúc kiểm tra

- Không sửa file, không commit, không tạo/đổi branch, không `git stash`, `git clean`, `git reset`, `git restore`.
- Không cài dependency, fetch remote hoặc chạy test/build trong bước kiểm tra chỉ đọc; báo thiếu môi trường để người dùng quyết định bước tiếp theo.
- Kết luận dựa vào NỘI DUNG FILE và lệnh git, không dựa vào tên branch, message commit hay ghi chú trong `docs/development-baseline.md`.

## Các bước

1. Chạy `node .agents/skills/resume-check/scripts/env-check.mjs` từ gốc repo (chỉ đọc, luôn exit 0). Đọc mọi dòng `WARN`.
2. Nếu WARN về node_modules sai hệ điều hành hoặc thiếu, ghi lại và dừng; không tự cài.
3. Nếu WARN về `src/` có thay đổi chưa commit:
   - In `git diff -- src/` và đối chiếu với mutation được nhắc trong ghi chú `$ARGUMENTS`.
   - Chỉ đọc diff; không ghi patch, không khôi phục file. Báo cáo và chờ người dùng quyết định.
4. Với test đã sửa mà chưa commit, kiểm xem có chỗ nào đang ở trạng thái "đảo điều kiện" của mutation test hay không (ví dụ `=== null` bị đổi thành `!== null`).
5. Chỉ đọc log/branch/ref đã có sẵn trong local repo; không fetch. Đối chiếu `docs/development-baseline.md`, `docs/roadmap.md` và `docs/backlog.md` với trạng thái dự án; ghi rõ mọi điều chưa thể xác minh từ dữ liệu local.
6. Không chạy test/build trong skill chỉ đọc. Dùng skill `check` khi người dùng yêu cầu kiểm chứng hoặc khi quy trình đã được duyệt.

## Báo cáo

Trình bày bảng: mục kiểm tra | OK / LỆCH / CHƯA KIỂM ĐƯỢC | bằng chứng (kết quả lệnh). Sau đó chốt ba điều:
- Môi trường đã sẵn sàng chưa, thiếu gì.
- Việc đang làm dở ở trạng thái nào (chưa bắt đầu, dở dang, đã xong chưa push, đã push).
- Việc kế tiếp hợp lý nhất và lý do.

Rồi DỪNG, chờ người dùng.
