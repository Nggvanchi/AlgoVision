# AlgoVision — Hướng dẫn cho Codex

AlgoVision là website giáo dục trực quan hóa cấu trúc dữ liệu và giải thuật. Mục tiêu là giải thích hành vi thuật toán bằng mô phỏng đúng với code, dễ tiếp cận và không lưu tiến độ cá nhân.

## Kiến trúc và tài liệu

- Đi theo luồng hiện có: cấu trúc thuần → sinh bước → bố cục → view/controller → template. Module cũ Array, Stack, Queue, Linked List chưa sinh bước.
- Mỗi bước tương ứng một thao tác mã giả; dữ liệu trong bước là nguồn cho giao diện. Không đổi framework, không thêm dependency, không viết lại module đang chạy.
- Đọc [kiến trúc](docs/architecture.md) trước khi sửa module; [roadmap](docs/roadmap.md) trước khi chọn giai đoạn; [backlog](docs/backlog.md) cho việc còn tồn tại; [spec UI](docs/design/spec.md) và [quyết định](docs/design/decisions.md) trước khi sửa UI.
- Baseline lịch sử và giới hạn bundle đã duyệt: [docs/development-baseline.md](docs/development-baseline.md). Số liệu trong đó là lần đo được ghi nhận, không phải kết quả kiểm tra hiện tại.
- Quy tắc chi tiết: [thuật toán](.agents/rules/algorithms.md), [test](.agents/rules/tests.md), [Windows và PowerShell](.agents/rules/cross-platform.md).

## Quy tắc sản phẩm và kỹ thuật

- Trả lời bằng tiếng Việt, giải thích lý do kỹ thuật rõ ràng; báo file thay đổi, kết quả kiểm tra thực tế và vấn đề còn tồn tại.
- Không thêm theo dõi tiến độ cá nhân, lịch sử truy cập hoặc lưu trạng thái học tập. Không dùng số giả: dữ liệu phải thật hoặc ghi rõ “Minh họa”.
- Big-O và nội dung học thuật phải khớp implementation. Giữ bất biến bước, ID ổn định, snapshot bất biến và giới hạn số bước của generator.
- Số test không được giảm; không sửa test để che lỗi. Bugfix dùng TDD; timer dùng scheduler giả thay vì thời gian thực.
- Ưu tiên: đúng đắn → dễ bảo trì → dễ kiểm thử → UX → trình bày.
- File văn bản UTF-8 không BOM, LF. Trên PowerShell 5.1 tránh redirect/`Out-File`/`Set-Content` để ghi file; dùng công cụ sửa file hoặc Node.

## Git và an toàn

- Quy trình: **Plan → Approve → Implement → Verify**. Mỗi giai đoạn một branch từ `main`, một mục tiêu; chỉ bắt đầu sau khi người dùng duyệt kế hoạch. Nếu gặp lỗi nền, xung đột hoặc việc ngoài phạm vi, dừng và báo cáo.
- Không commit trực tiếp lên `main`; không push (kể cả refspec tới `main`), merge, force-push (kể cả `-f` hoặc refspec `+`), `git reset --hard`, `git clean`, `git stash`, `git restore` hoặc bỏ hooks bằng `--no-verify`/`git commit -n`. Quy tắc cũng áp dụng khi lệnh có tùy chọn toàn cục như `git -C`; không né bằng shell con, đường dẫn Git khác hoặc biến môi trường.
- Chỉ `git add` file cụ thể. Commit riêng theo mục đích, Conventional Commits tiếng Việt; message UTF-8 không BOM qua file ngoài repo và `git commit -F`. Không thêm attribution AI.
- Trước khi sửa, kiểm tra branch, HEAD và working tree; không đụng thay đổi chưa commit ngoài phạm vi.
- Các quy tắc Git ở đây là hướng dẫn, không phải bộ lọc lệnh. Cấu hình Claude Code đã gỡ từng có 64 deny rule cho Bash/PowerShell và tắt attribution; chúng không tự áp dụng cho Codex. Quyền sandbox/approval phụ thuộc phiên; chưa xác minh bộ chặn lệnh hoặc cấu hình attribution tương đương trong Codex. Branch protection trên GitHub phải được kiểm tra riêng, không suy ra từ tài liệu này.

## Lệnh dự án

```powershell
pnpm install --frozen-lockfile  # thiết lập dependencies khi đã được phép; không tự cài để chữa lỗi môi trường
pnpm test
pnpm build
pnpm dev
```

Chạy skill `check` để kiểm tra trước khi báo hoàn tất/commit. Không tuyên bố test/build pass nếu chưa chạy và đọc kết quả thật. CI chạy trên Ubuntu và Windows; kết quả CI chỉ xác nhận sau khi workflow thực tế hoàn tất.

## Quy trình giai đoạn

Theo skill `module-workflow`: lập kế hoạch và chờ duyệt; triển khai đúng phạm vi; kiểm tra diff, đường dẫn, encoding, test và build; báo cáo file/số liệu/vấn đề còn lại rồi dừng chờ review. Không commit/push/merge nếu chưa được yêu cầu riêng.
