# Làm việc trên Windows và Ubuntu (cùng một repo trên ổ NTFS)

- Đổi hệ điều hành thì chạy `pnpm install --frozen-lockfile` trước tiên: `node_modules` chứa binary riêng theo hệ điều hành
  (rolldown, lightningcss). Kiểm nhanh bằng skill `resume-check`.
- `core.fileMode=false` trên cả hai máy. `core.autocrlf=true` trên Windows, không đặt trên Ubuntu; không gây vấn đề nhờ
  `.gitattributes` (`* text=auto eol=lf`).
- Repo dùng LF và không BOM. Ghi file bằng công cụ sửa file hoặc Node (`fs.writeFileSync(path, text, 'utf8')`).
  Trên Windows PowerShell 5.1 không dùng `>`, `Out-File`, `Set-Content`, `Add-Content`: chúng có thể ghi UTF-16 hoặc thêm BOM.
- PowerShell 5.1 làm hỏng ngoặc kép khi truyền tham số cho lệnh ngoài: message commit ghi vào file UTF-8 không BOM ngoài repo
  rồi `git commit -F <file>`.
- Lệnh Unix (`head`, `xxd`, `tail -c`, `timeout`, `sed`, heredoc, `python3`) có thể không có trên Windows: dùng Node thay thế
  và nói rõ đã dùng gì.
- Nếu một deny rule chặn lệnh của bạn, không tìm cách né. Dừng và báo lệnh nào, rule nào.
