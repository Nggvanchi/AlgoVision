# AlgoVision

[![CI](https://github.com/Nggvanchi/AlgoVision/actions/workflows/ci.yml/badge.svg)](https://github.com/Nggvanchi/AlgoVision/actions/workflows/ci.yml)

**AlgoVision** là website giáo dục trực quan hóa cấu trúc dữ liệu và giải thuật. Mỗi thao tác được chia thành từng bước;
mỗi bước khớp với một dòng mã giả và hiển thị số đo thật (số phép so sánh, số ô dò, số lần đọc…) đặt cạnh độ phức tạp
Big-O lý thuyết, để người học thấy lý thuyết khớp với những gì thuật toán thực sự làm.

**Demo:** [algo-vision-gamma.vercel.app](https://algo-vision-gamma.vercel.app)

<!-- TODO: ảnh chụp màn hình dashboard -->

## Tính năng

### Thuật toán

- **Sắp xếp:** Bubble Sort, Selection Sort, Insertion Sort.
  Chạy tự động, tạm dừng, đi từng bước, lùi bước, đặt lại; chọn kích thước mảng (8–24 phần tử) và tốc độ;
  đếm số phép so sánh, đổi chỗ (và dịch chuyển với Insertion Sort).
- **Tìm kiếm:** Linear Search, Binary Search.
  Nhập giá trị cần tìm, quan sát phần tử đang xét và phạm vi bị loại; đếm số phép so sánh;
  so sánh số phép so sánh của hai thuật toán trên cùng dữ liệu.

### Cấu trúc dữ liệu

- **Array:** thêm vào cuối, chèn, xóa, tìm kiếm, khôi phục.
- **Stack** (LIFO): Push, Pop, Peek, khôi phục.
- **Queue** (FIFO): Enqueue, Dequeue, Front, đặt lại.
- **Singly Linked List:** thêm vào đầu, thêm vào cuối, chèn, xóa, tìm kiếm, khôi phục.
- **Binary Search Tree:** chèn, tìm kiếm, xóa (nút hai con thay bằng successor), duyệt Inorder / Preorder / Postorder,
  Min, Max, chiều cao. Giá trị 1–99, tối đa 15 nút.
- **Hash Table:** separate chaining và linear probing (xóa để lại tombstone); chèn, tìm kiếm, xóa;
  số ô m ∈ {5, 7, 11}, hệ số tải, bộ khóa mẫu gây va chạm.
- **Graph:** vô hướng hoặc có hướng, tối đa 8 đỉnh; danh sách kề và ma trận kề vẽ song song;
  kiểm tra hai đỉnh kề nhau, liệt kê đỉnh kề và bậc.
  - **BFS:** hàng đợi, thứ tự lấy ra, bảng khoảng cách và đỉnh cha, cạnh cây.
  - **DFS:** ngăn xếp gọi, thứ tự thăm, mốc vào/ra, cạnh cây, độ sâu ngăn xếp tối đa.

Các thao tác bị lỗi đầu vào (giá trị ngoài giới hạn, trùng khóa, cấu trúc rỗng, bảng đầy…) được báo rõ thay vì làm hỏng trạng thái.

### Learning Panel

Đi kèm các trình mô phỏng Sorting, Searching, BST, Hash Table và Graph:

- Mã giả, dòng ứng với bước hiện tại được tô sáng.
- Giải thích lý thuyết và bảng Big-O của thao tác đang chọn.
- Số đo thật của bước đang xem, để đối chiếu với Big-O.

<!-- TODO: GIF Learning Panel -->

## Công nghệ

HTML, CSS và JavaScript (ES Modules), không dùng framework. Vite để chạy thử và build, pnpm để quản lý package,
Node.js Test Runner và happy-dom cho kiểm thử.

## Chạy dự án

Yêu cầu: Node.js `^20.19.0 || >=22.12.0` (trường `engines` trong `package.json`) và pnpm.

```bash
git clone https://github.com/Nggvanchi/AlgoVision.git
cd AlgoVision
pnpm install --frozen-lockfile
pnpm dev        # mở địa chỉ Vite in ra, thường là http://localhost:5173/
pnpm build      # build vào dist/
pnpm preview    # chạy thử bản build
```

## Kiểm thử

```bash
pnpm test                          # toàn bộ test
node --test tests/<file>.test.js   # một file
```

Test giao diện chạy trên happy-dom với template thật. Ngoài kiểm tra kết quả, bộ test kiểm:

- bất biến của từng bước (tham chiếu hợp lệ, đường đi chỉ tăng, chỉ bước cuối kết thúc);
- số bước, thứ tự thăm, số đo so với kết quả dò tay độc lập;
- số đo thật so với Big-O hiển thị, kể cả ở quy mô lớn;
- phá thử (mutation): sửa tạm code để chắc test thật sự bắt được lỗi.

CI chạy `pnpm test`, `pnpm build` và kiểm mã hóa file trên Ubuntu và Windows cho mỗi pull request.

## Kiến trúc

Mỗi module mới đi qua các lớp: cấu trúc thuần → sinh bước → bố cục vẽ → view → controller → template.
Mã thuần không chạm DOM nên test được bằng `node --test` không cần trình duyệt. Chi tiết: [`docs/architecture.md`](docs/architecture.md).

```text
AlgoVision/
├── public/templates/   # template giao diện (app.html)
├── src/
│   ├── structures/     # cấu trúc dữ liệu thuần (snapshot bất biến)
│   ├── algorithms/     # sinh mảng bước và mã giả
│   └── *.js            # layout, view, controller từng module
├── tests/              # node:test + happy-dom; tests/helpers/ không bị quét
└── docs/               # kiến trúc, lộ trình, backlog
```

## Trạng thái

Lộ trình theo giai đoạn: [`docs/roadmap.md`](docs/roadmap.md). Việc còn tồn tại: [`docs/backlog.md`](docs/backlog.md).

## Giấy phép

[MIT](LICENSE).
