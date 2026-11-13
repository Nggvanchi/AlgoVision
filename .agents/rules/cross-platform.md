# Phát triển trên Windows và PowerShell

- Môi trường phát triển cục bộ là Windows + PowerShell + Codex. Bắt đầu bằng skill `resume-check` chỉ đọc.
- Không tự cài dependencies, sửa pnpm store, ACL hoặc cấu hình hệ thống khi kiểm tra bị chặn. Báo lỗi và dừng theo phạm vi đã duyệt.
- `node_modules` có native bindings theo nền tảng/kiến trúc; kiểm tra đúng môi trường đang chạy và khả năng dùng Vite/happy-dom.
  Không chia sẻ thư mục dependencies giữa các môi trường. Khi được phép thiết lập dependencies, dùng `pnpm install --frozen-lockfile`.
- `.gitattributes` (`* text=auto eol=lf`) quy định LF; không tự đổi `core.autocrlf` hoặc `core.fileMode` của máy.
- Repo dùng LF và không BOM. Ghi file bằng công cụ sửa file hoặc Node (`fs.writeFileSync(path, text, 'utf8')`).
  Trên Windows PowerShell 5.1 không dùng `>`, `Out-File`, `Set-Content`, `Add-Content`: chúng có thể ghi UTF-16 hoặc thêm BOM.
- PowerShell 5.1 làm hỏng ngoặc kép khi truyền tham số cho lệnh ngoài: message commit ghi vào file UTF-8 không BOM ngoài repo
  rồi `git commit -F <file>`.
- Lệnh Unix (`head`, `xxd`, `tail -c`, `timeout`, `sed`, heredoc, `python3`) có thể không có trên Windows: dùng Node thay thế
  và nói rõ đã dùng gì.
- Nếu một deny rule chặn lệnh của bạn, không tìm cách né. Dừng và báo lệnh nào, rule nào.
- Script Node phải dùng `path`, `os` và đường dẫn từ root Git; không hardcode ổ đĩa, gọi lệnh Unix bắt buộc hoặc ép `process.platform === 'win32'`.
- CI vẫn kiểm tra Ubuntu và Windows; giữ dependencies/optional bindings đa nền tảng và mọi số liệu đo lịch sử theo hệ điều hành.
