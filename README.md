# AlgoVision

**AlgoVision** là dự án trực quan hóa thuật toán và cấu trúc dữ liệu được xây dựng bằng HTML, CSS và JavaScript. Dự án hướng đến việc giúp người học hiểu cách thuật toán xử lý dữ liệu thông qua mô phỏng từng bước, thay vì chỉ đọc mã nguồn hoặc ghi nhớ lý thuyết.

## Mục tiêu dự án

- Trực quan hóa quá trình hoạt động của các thuật toán cơ bản.
- Quan sát sự thay đổi của dữ liệu trong từng bước thực thi.
- Theo dõi các chỉ số như số lần so sánh, đổi chỗ và dịch chuyển phần tử.
- Thực hành các thao tác cơ bản trên cấu trúc dữ liệu.
- Xây dựng nền tảng để mở rộng thêm thuật toán và cấu trúc dữ liệu trong tương lai.

## Công nghệ sử dụng

- **HTML5:** xây dựng cấu trúc giao diện.
- **CSS3:** thiết kế giao diện tối và bố cục trực quan.
- **JavaScript (ES Modules):** triển khai thuật toán, xử lý dữ liệu và điều khiển giao diện.
- **Vite:** phát triển và build ứng dụng.
- **pnpm:** quản lý package và các lệnh của dự án.
- **Node.js Test Runner:** chạy kiểm thử tự động.
- **happy-dom:** mô phỏng môi trường DOM trong các bài kiểm thử.
- **Git và GitHub:** quản lý mã nguồn.

## Chức năng hiện tại

### 1. Trực quan hóa thuật toán sắp xếp

AlgoVision hiện hỗ trợ ba thuật toán:

| Thuật toán | Độ phức tạp trung bình | Độ phức tạp xấu nhất |
|---|---|---|
| Bubble Sort | O(n²) | O(n²) |
| Selection Sort | O(n²) | O(n²) |
| Insertion Sort | O(n²) | O(n²) |

Các chức năng mô phỏng bao gồm:

- Tạo mảng dữ liệu mới với số lượng phần tử có thể lựa chọn.
- Thực hiện thuật toán theo từng bước hoặc chạy tự động.
- Tạm dừng và tiếp tục quá trình mô phỏng.
- Điều chỉnh tốc độ chạy.
- Đặt lại trạng thái mô phỏng.
- Theo dõi số lần so sánh, đổi chỗ hoặc dịch chuyển phần tử.

### 2. Trực quan hóa thuật toán tìm kiếm

Dự án hỗ trợ:

- **Linear Search:** kiểm tra lần lượt từng phần tử để tìm giá trị mục tiêu.
- **Binary Search:** thu hẹp phạm vi tìm kiếm trên mảng đã được sắp xếp.

Các chức năng bao gồm:

- Nhập giá trị cần tìm.
- Quan sát quá trình kiểm tra và loại bỏ các phần tử khỏi phạm vi tìm kiếm.
- Chạy từng bước hoặc chạy tự động.
- Tạm dừng, đặt lại và điều chỉnh tốc độ.
- Theo dõi số lần so sánh và vị trí tìm thấy.
- So sánh số lần so sánh của hai thuật toán trên cùng dữ liệu.

### 3. Trực quan hóa cấu trúc dữ liệu

#### Array

Array Visualizer hỗ trợ các thao tác:

- Truy cập phần tử theo index.
- Thêm phần tử vào cuối mảng.
- Chèn phần tử tại index được chọn.
- Xóa phần tử theo index.
- Tìm kiếm giá trị trong mảng.
- Khôi phục mảng về trạng thái ban đầu.

Giao diện hiển thị giá trị và index của từng phần tử, giúp người học quan sát sự thay đổi của mảng sau mỗi thao tác.

#### Stack

Stack Visualizer mô phỏng cấu trúc ngăn xếp theo nguyên tắc **LIFO (Last In, First Out)**.

Các thao tác được hỗ trợ:

- **Push:** thêm phần tử lên đỉnh Stack.
- **Pop:** lấy phần tử trên đỉnh ra khỏi Stack.
- **Peek:** xem phần tử trên đỉnh mà không xóa.
- **Reset:** khôi phục Stack về trạng thái ban đầu.

Dự án cũng xử lý các trường hợp như Pop hoặc Peek khi Stack rỗng và dữ liệu đầu vào không hợp lệ.

#### Các cấu trúc dữ liệu dự kiến phát triển

- Queue.
- Linked List.
- Các cấu trúc dữ liệu và thuật toán khác phù hợp với mục tiêu học tập của dự án.

## Cài đặt và chạy dự án

### Yêu cầu

- Node.js tương thích với phiên bản Vite được sử dụng.
- pnpm.

### 1. Clone repository

```bash
git clone https://github.com/Nggvanchi/AlgoVision.git
cd AlgoVision
```

### 2. Cài đặt dependencies

```bash
pnpm install
```

### 3. Chạy môi trường phát triển

```bash
pnpm dev
```

Mở địa chỉ local được Vite hiển thị trong terminal, thông thường là `http://localhost:5173/`.

## Kiểm thử

Chạy toàn bộ bài kiểm thử tự động bằng lệnh:

```bash
pnpm test
```

## Build production

Tạo bản build để triển khai bằng lệnh:

```bash
pnpm build
```

Để chạy thử bản build:

```bash
pnpm preview
```

## Cấu trúc dự án

```text
AlgoVision/
├── public/
│   └── templates/
│       └── app.html
├── src/
│   ├── algorithms/
│   │   ├── bubbleSort.js
│   │   ├── insertionSort.js
│   │   └── selectionSort.js
│   ├── structures/
│   │   ├── array.js
│   │   └── stack.js
│   ├── main.js
│   ├── navigation.js
│   ├── sorting.js
│   ├── searching.js
│   ├── array.js
│   ├── stack.js
│   └── style.css
├── tests/
│   ├── navigation.test.js
│   ├── searching-controller.test.js
│   ├── sorting-controller.test.js
│   ├── sorting.test.js
│   ├── array.test.js
│   ├── array-controller.test.js
│   ├── stack.test.js
│   └── stack-controller.test.js
├── index.html
├── package.json
├── pnpm-lock.yaml
└── README.md
```

## Trạng thái phát triển

AlgoVision đang được phát triển theo từng giai đoạn. Các chức năng sắp xếp, tìm kiếm, Array và Stack đã có phần triển khai và kiểm thử tương ứng.

Các tính năng tiếp theo sẽ tập trung vào việc hoàn thiện trải nghiệm trực quan hóa, bổ sung cấu trúc dữ liệu mới và nâng cao chất lượng kiểm thử.

## Định hướng

Mục tiêu dài hạn của AlgoVision là trở thành một công cụ học tập trực quan, cho phép người học quan sát, thử nghiệm và hiểu sâu hơn về thuật toán cũng như cấu trúc dữ liệu thông qua tương tác trực tiếp.
