---
name: module-workflow
description: Quy trình làm một module hoặc một giai đoạn roadmap của AlgoVision trên branch riêng, từ kế hoạch tới báo cáo chờ review. Gọi thủ công bằng /module-workflow <branch> "<mục tiêu>".
---

# Làm việc trên branch `$branch`: $goal

Một branch, một PR, một chủ đề. Người dùng tự push, tạo PR và merge. Bạn dừng ở các điểm DỪNG.

## Pha A: Kế hoạch (chưa sửa gì)

1. Chạy skill `resume-check`. Nếu có LỆCH chưa giải quyết thì DỪNG.
2. `git fetch`, rồi xác nhận `main` = `origin/main` và working tree sạch (trừ file người dùng đã dặn để nguyên).
3. Đọc `docs/roadmap.md` và mục liên quan trong AGENTS.md, đọc `docs/architecture.md` (các lớp của một module, chi tiết từng module,
   cách test), rồi đọc code thật của module gần nhất làm mẫu.
4. Trình bày kế hoạch:
   - Phạm vi và những gì KHÔNG làm.
   - File sẽ tạo/sửa, theo đúng các lớp trong `docs/architecture.md` (cấu trúc thuần, sinh bước, bố cục, view, controller, template).
   - Danh sách test sẽ viết, kể cả trường hợp lỗi và biên: bất biến bước, số dò tay độc lập, cài đặt tham chiếu (nếu có), Big-O có số cụ thể, quy mô lớn.
   - Rủi ro và mutation dự kiến cho từng nhóm test.
   - Thứ tự commit.
   - Câu hỏi nếu đặc tả chưa rõ. Đừng tự quyết điều roadmap không nói.

**DỪNG. Chờ người dùng duyệt.**

## Pha B: Làm

1. `git switch -c $branch main`.
2. Với từng phần theo thứ tự đã duyệt:
   - Viết test trước, chạy và cho thấy test ĐỎ đúng lý do.
   - Cài đặt cho tới khi XANH.
   - Chứng minh test bắt được lỗi theo skill `mutation-test`.
   - Chạy skill `check`.
   - Chỉ commit nếu người dùng yêu cầu rõ trong phạm vi đã duyệt: mỗi commit một mục đích, `git add` theo file cụ thể, message qua file UTF-8 không BOM ngoài repo và `git commit -F`; kiểm `git log -1 --format=%B`. Nếu không được yêu cầu commit, dừng với diff để review.
3. Gặp điều ngoài kế hoạch (lỗi cũ, con số trong AGENTS.md sai, phạm vi phình ra): DỪNG và hỏi, đừng tự mở rộng.

## Pha C: Kết thúc

1. Cập nhật `docs/development-baseline.md`, `docs/roadmap.md`, `docs/backlog.md` và `docs/architecture.md` chỉ ở những dòng mà việc này làm thay đổi sự thật. Không nhúng lịch sử số liệu dài vào AGENTS.md.
2. Chạy `check` lần cuối trên toàn branch.
3. Nếu có giao diện mới, kiểm trên trình duyệt thật ở 360px và 1280px khi môi trường cho phép; nếu không, ghi rõ CHƯA xác minh. Dùng preview Vercel của PR khi đã có.
4. Soạn mô tả PR theo skill `pr-description`.
5. Báo cáo theo mẫu dưới, rồi **DỪNG** và chờ người dùng trả lời "đồng ý". Không push, không tạo PR, không merge.

## Mẫu báo cáo

```
## Kết quả: $branch
Commit (git log main..HEAD --oneline): <hash + message>, file thay đổi
git status: ...
git diff main --stat: ...
Lỗi đã sửa (nếu có): nguyên nhân gốc, cách phát hiện, cách sửa, lần chạy ĐỎ và lần chạy XANH
Test: <số> pass / <số> fail (trước: <baseline>), thời gian ...
Build: JS ... kB (gzip ...), CSS ... kB (trước: ...)
Mutation: bảng theo skill mutation-test
Đã xác minh: ...
CHƯA xác minh: ... (ví dụ: hành vi trên trình duyệt thật)
Checklist cho người dùng kiểm tay (pnpm dev): ...
Còn tồn tại, đề xuất cho giai đoạn sau: ...
```
