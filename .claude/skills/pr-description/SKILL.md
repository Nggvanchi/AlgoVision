---
name: pr-description
description: Soạn mô tả pull request cho branch hiện tại của AlgoVision theo cấu trúc các PR đã merge (Tóm tắt, Thiết kế, Giao diện, Các commit, Kiểm tra, Phá thử, Trình duyệt, Lưu ý khi review, Còn tồn tại). Dùng khi người dùng nói "viết mô tả PR", "soạn PR", "chuẩn bị mở PR", hoặc ở cuối /module-workflow.
argument-hint: "[ghi chú thêm cho người review]"
---

# Soạn mô tả PR

Mục tiêu: mô tả PR đủ để người review hiểu thiết kế và tin số liệu, giống các PR #8 đến #10 của repo (PR #5–#7 dùng cấu trúc cũ
"Tóm tắt / Thay đổi chính / Kiểm thử / Còn tồn tại"). `.github/pull_request_template.md` là bản rút gọn của cấu trúc dưới đây.
Không push, không tạo PR: người dùng tự làm.

## Thu thập (chỉ đọc)

- `git log --reverse --format='%h %s%n%b' main..HEAD`: commit và thân commit.
- `git diff main --stat`.
- Số liệu test/build/phá thử: CHỈ lấy từ lệnh đã chạy trong phiên này hoặc từ thân commit. Không có nguồn thì không ghi số.
- `docs/backlog.md` để lấy các vấn đề còn tồn tại liên quan.

## Cấu trúc (bỏ mục không liên quan, không bịa nội dung)

```
## Tóm tắt
<làm gì, cho module nào, phạm vi và những gì KHÔNG làm>

## Thiết kế
<quyết định chính và lý do: cấu trúc dữ liệu của bước, công thức số bước, bất biến>

## Giao diện
<thành phần mới, trạng thái hiển thị, khả năng truy cập>

## Các commit
| Hash | Nội dung |

## Kiểm tra
- `pnpm test`: X/X (trước PR: Y); `pnpm build` OK; `git diff --check` sạch.
- Số dò tay độc lập: <bảng nếu có>

## Phá thử
| Ca | Kết quả |

## Trình duyệt
<360px và 1280px, console, kiểm trên link preview Vercel của PR; hoặc "CẦN BẠN ĐIỀN">

## Lưu ý khi review
<commit refactor không đổi hành vi, assert cũ bị đổi có chủ ý và lý do>

## Còn tồn tại (không nằm trong PR này)
```

## Quy tắc

- Không để placeholder trá hình như `<ghi kết quả của bạn>`. Chỗ nào bạn không tự kiểm được, ghi rõ `**CẦN BẠN ĐIỀN:** <cần điền gì>` và liệt kê lại tất cả các chỗ đó ở cuối câu trả lời.
- Không thêm dòng ghi công AI hay "Generated with".
- Ghi nội dung vào một file Markdown UTF-8 không BOM NGOÀI repo (thư mục tạm), in đường dẫn file, và in toàn văn để người dùng sao chép.
