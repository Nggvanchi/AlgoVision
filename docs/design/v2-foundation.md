# Light Minimal v2 — Foundation

Phạm vi UI v2-1 đã được chủ dự án duyệt, trên baseline `07be7660c61459cb38e8426c5407904cca016aeb` (PR #52). Đây là hợp đồng trình bày mới; [Spec v1](spec.md) và [decisions v1](decisions.md) giữ nguyên làm lịch sử. Chỉ có light theme, không theme toggle.

## Palette và vai trò

| Token | Light v2 |
|---|---|
| `--av-bg` | `#F7F8FC` |
| `--av-sidebar`, `--av-surface-1` | `#FFFFFF` |
| `--av-surface-2`, `--av-surface-3` | `#F1F3F8`, `#E8ECF3` |
| `--av-border` | `#DDE2EB`, chỉ trang trí |
| `--border-control`, `--av-border-strong`, `--av-border-dashed` | `#7C879B` |
| `--av-text`, `--av-text-muted`, `--av-text-subtle` | `#172033`, `#526075`, `#5B677A` |
| `--av-primary`, `--av-primary-hover` | `#6D28D9`, `#5B21B6` |
| `--av-primary-text`, `--av-primary-line`, `--av-focus` | `#6D28D9`, giữ riêng vai trò dù cùng giá trị |
| `--av-nav-active-text`, `--av-nav-active-bg` | `#6D28D9`, `#EDE9FE` |
| `--av-accent`, `--av-accent-text` | `#1D4ED8` |
| `--av-success`, `--av-warning`, `--av-danger` | `#166534`, `#A16207`, `#B91C1C` |
| `--state-active`, `--bar-cue` | `#A16207`, `#0D0F15` |

Giữ font tự host Be Vietnam Pro/JetBrains Mono, cỡ chữ, spacing và kích thước hiện hành. Nền card trắng, hover sáng nhẹ; bỏ gradient tối cũ và giảm bóng tooltip. Native controls dùng `color-scheme: light`.

Nền trạng thái: so sánh `#FEF3C7`, đổi chỗ `#DBEAFE`, hoàn tất `#DCFCE7`, lỗi `#FEE2E2`. Chữ, viền, nét đứt/viền kép và ký hiệu vẫn phân biệt trạng thái; không chỉ dựa vào màu. Giá trị cột Sorting nằm ngoài cột, dùng chữ chính. Searching giữ cue và semantics R7; SVG dùng nét đậm trên surface sáng. Disabled giữ nguyên thuộc tính/logic, không giảm opacity chữ; nền trung tính, chữ subtle, cursor not-allowed và không hover như nút đang bật.

## Tương phản và accessibility

Ngưỡng chữ thường >=4,5:1, UI control/focus/cue đồ họa >=3:1. Viền card trang trí không thay viền control. Outline focus giữ 2px và offset 2px (ngoại lệ inset hiện hành ở vùng cuộn).

Các số tính từ sRGB của palette, không phải bằng chứng browser render: chữ chính/trắng 16,27:1; muted/trắng 6,39:1; subtle/nền app 5,40:1; trắng/nút tím 7,10:1; viền control/nền app 3,41:1; focus/nav active 5,98:1. Test đọc CSS thật để kiểm các cặp trạng thái Searching, cột Sorting, Queue, SVG, disabled và hover, không thay bằng số tương phản viết cứng.

Giữ sidebar 256/72px, drawer <=767px, rail 768–1279px; touch target >=44px, keyboard, focus trap/restore, inert, skip link, vùng cuộn có tên và reduced motion. Không thay đổi navigation hoặc tạo layout hai cột. Không suy rộng 137 case browser R7 thành QA v2.

## Kế thừa và thay thế v1

- Thay phần dark-only/palette/nền và bóng trong Spec mục 1–6, 12–13 bằng hợp đồng này, không sửa tài liệu v1.
- Quyết định 9/12/13: giữ nguyên yêu cầu viền control >=3:1 và ngữ nghĩa dấu hoàn tất; thay giá trị màu dark bằng palette light. Quyết định 30: chỉ đổi màu canvas, giữ ba `<details>` và live region luôn ngoài accordion; vẫn chưa làm hai cột.
- Kế thừa quyết định 4/5/6/16/17/22/25–29: navigation, không lưu tiến độ, dữ liệu thật, demo 3/31, tab/filter và seek/tốc độ giữ hành vi cũ. Không bổ sung nội dung, tài khoản, Ctrl K, framework, dependency hoặc JS runtime.
- Trần raw build vẫn JS <=154000 B, CSS <=58500 B; [baseline](../development-baseline.md) ghi riêng số đo thực tế. Không đổi ngân sách để hợp thức hóa tăng CSS.

## Giới hạn và bước tiếp

Chưa redesign riêng Dashboard/Library/Visualizer; chỉ sửa màu phát sinh từ foundation. QA Chrome ở 360/767/768/1279/1280/1440 CSS px phải có evidence riêng; nếu sandbox/browser không cho phép thì NOT VERIFIED. Zoom thật 200%, Vercel browser smoke, Firefox, Safari, thiết bị thật và screen reader vẫn NOT VERIFIED; deployment SUCCESS không chứng minh browser smoke PASS. Các accepted risks R7 không phải bằng chứng nghiệm thu giao diện mới.
