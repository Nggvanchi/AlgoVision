# EDU-1A — Xác minh nguồn UIT

Trạng thái hiện hành: xem [closeout EDU-1G](#12-closeout-hiện-hành--edu-1g); chỉ nghiệm thu hồ sơ nguồn/mapping.

**Lịch sử EDU-1A:** Ngày đối soát: 18/11/2026. **EDU-1A PARTIAL — AWAITING_SOURCE_CONFIRMATION.** Owner đã duyệt dừng tìm kiếm lặp lại IT003; cần owner xác nhận nguồn IT003 phù hợp trước EDU-1B. Chưa mapping 9 module/40 thao tác, chưa biên soạn EDU-2–4. Quyết định hiện hành ở mục 9; evidence các lượt trước giữ nguyên.

EDU-2 P1 ngày 18/11/2026 bổ sung **2 INDEPENDENT_REFERENCE** ở mục 10: catalog tổng 8 ID (6 UIT giữ nguyên + 2 EXT). Các trạng thái/mốc EDU-1A ở trên là lịch sử; không dùng phần bổ sung này để đóng EDU-1 hoặc nâng academic PASS.

## 1. Baseline và phương pháp

- Source/test kiểm kê: `89cdc6187f0464276b8e4882d75061f13bda5129`, tree `e291aacc15fa5b39fb29ac68b63034c2e0b240ea`.
- Checkout giữ nguyên: branch `feat/ui-v2-dashboard-library`, HEAD `f67539933f2f315de581f33ea3b39ee31d17cfa5`, tree `6310ef09d7440a45178189a9f4524f803dfab082`. Không tương đương tree kiểm kê.
- Trước sửa: staged rỗng; ba tracked docs đã modified (roadmap/backlog/development-baseline); untracked gồm QA, release và 7 skill/172 file. Ghi nhận status/diff và hash 406 file tracked/untracked không ignored trong bộ nhớ; không tạo log/backup.
- Index SHA-256: `71e928297325c908d4fd3b061ade7cfa544ec390f97c03e4c6ef447b70489249`; diff tracked trước sửa, stdout UTF-8 trimEnd, SHA-256: `0e3189f051e160d99e5a366ed27fed5a91207786fa77b79d15345bbb0fe7ba23`.
- Đã đọc [AGENTS](../../AGENTS.md), [roadmap](../roadmap.md), [backlog](../backlog.md), [scope](../release/v1.0.0-scope.md), [kiến trúc](../architecture.md), [quy tắc thuật toán](../../.agents/rules/algorithms.md) và [quyết định sản phẩm](../design/decisions.md). Chưa có thư mục education trước lượt này; các ghi chú audit UIT lịch sử không thay nguồn gốc có thể kiểm chứng.
- Tra cứu bằng công cụ web/text, không chạy browser ứng dụng. Ngày truy cập: **18/11/2026**; mốc ghi nhận sau truy xuất cuối: **12:37:28 UTC (19:37:28 UTC+7)**. Không dùng ngày crawl/search làm ngày ban hành. Không tải/lưu tài liệu gốc hoặc ảnh PDF vào repo, không có hash nguyên byte của nguồn web.

## 2. Cách hiểu trạng thái

- VERIFIED: trực tiếp đọc được đúng thông tin định danh/đầu mối chính thức được nêu; chỉ áp dụng phạm vi bằng chứng của dòng đó.
- PARTIAL: đọc được một phần nhưng còn mâu thuẫn truy cập, phiên bản hoặc thiếu xác minh cần thiết.
- NOT VERIFIED: chưa đọc được nội dung/metadata đủ để xác nhận.
- Trạng thái nguồn độc lập với quyền sử dụng, mức bao phủ và owner approval. VERIFIED của danh mục không có nghĩa giáo trình đã được nghiệm thu, đủ mapping, là phiên bản mới nhất hoặc runtime PASS.

## 3. Catalog nguồn

**Sau supplement: 6 source ID: VERIFIED 4 / PARTIAL 1 / NOT VERIFIED 1.** Ba VERIFIED là nguồn ngữ cảnh/đầu mối; nguồn mới UIT-SRC-006 chỉ VERIFIED xuất xứ công bố, đối tượng và phạm vi ôn tập. Chưa có đề cương IT003 đầy đủ VERIFIED làm chuẩn. Giữ 5 ID cũ; URL thay thế của cùng ứng viên không được cộng thành nguồn độc lập. Phân loại và bằng chứng supplement ở mục 8.

| source_id | Tên/đơn vị hoặc tác giả có bằng chứng | URL chính thức và định vị | Phiên bản/ngày | Trạng thái và phạm vi |
|---|---|---|---|---|
| UIT-SRC-001 | Danh mục môn học; Cổng thông tin UIT, không thấy tác giả cá nhân | [Danh mục](https://portal.uit.edu.vn/danh-muc-mon-hoc?trang=7), dòng STT 656, mã IT003 | Không thấy phiên bản/ngày ban hành: NOT VERIFIED | VERIFIED định danh môn, đơn vị KHMT, 3 tín chỉ LT + 1 TH; nguồn chính thức về thông tin môn, không có nội dung chương/trang. |
| UIT-SRC-002 | Bảng tóm tắt môn học; Cổng thông tin đào tạo UIT, không thấy tác giả cá nhân | [Tóm tắt](https://daa.uit.edu.vn/content/bang-tom-tat-mon-hoc), STT 241, IT003 | Phiên bản/ngày: NOT VERIFIED | VERIFIED mô tả tổng quát về tổ chức dữ liệu, thuật toán và kỹ năng lập trình; nguồn chính thức ngữ cảnh, không phải đề cương chi tiết. |
| UIT-SRC-003 | Danh mục đề cương ngành Khoa học Dữ liệu chính quy; Thư viện UIT | [Danh mục thư viện](https://thuvien.uit.edu.vn/page/dcmh-nganh-khoa-hoc-du-lieu-cqui), STT 58, IT003, liên kết Xem tài liệu | Phiên bản/ngày danh mục và đề cương đích: NOT VERIFIED | VERIFIED đầu mối chính thức dẫn UIT-SRC-005; không xác nhận nội dung tài liệu đích. |
| UIT-SRC-004 | Đề cương IT003 – Cấu trúc dữ liệu và giải thuật; UIT/Khoa KHMT; người biên soạn Đỗ Văn Nhơn, Trịnh Quốc Sơn theo bản trích xuất | [Ứng viên PDF](https://cntt.uit.edu.vn/attachments/article/4872/decuong_IT003.pdf); [URL khác](https://fit.uit.edu.vn/attachments/article/4872/decuong_IT003.pdf). Metadata tại PDF 1, định vị nội dung ở mục 4 dưới đây | Bản trích xuất 8 trang; phiên bản/ngày ban hành và tính hiện hành: NOT VERIFIED | PARTIAL: đọc được text, nhưng xác minh ảnh/truy cập không nhất quán; chưa có file/hash. Nguồn trên miền UIT, chưa duyệt làm chuẩn. |
| UIT-SRC-005 | Tài liệu được danh mục UIT liên kết dưới nhãn IT003; tên đầy đủ, tác giả, đơn vị phát hành của tài liệu: NOT VERIFIED | [Bản ghi kho ĐHQG-HCM](https://ir.vnulib.edu.vn/entities/publication/a623d035-16fe-4a8e-90ea-aaaef4327d2f), đích của UIT-SRC-003 | Phiên bản/ngày/số trang: NOT VERIFIED | NOT VERIFIED nội dung: timeout/không truy cập được qua công cụ. Có đầu mối UIT xác nhận liên kết, chưa chứng minh là cùng bản UIT-SRC-004. |
| UIT-SRC-006 | Đề cương dạy ôn tập thi cao học, phần B về đồ thị; Phòng ĐTSĐH & KHCN UIT công bố; tác giả cá nhân NOT VERIFIED | [Bài đăng chính thức](https://sdh.uit.edu.vn/bai-viet/de-cuong-thi-cao-hoc-mon-ly-thuyet-do-thi) liên kết [PDF 2 trang](https://sdh.uit.edu.vn/sites/default/files/201705/decuong-dothi04-2017.pdf); PDF 1, mục I.7 nêu BFS/DFS | Bài đăng ghi 04/05/2017, 19:01, không nêu múi giờ; ngày biên soạn/phiên bản PDF và tính hiện hành NOT VERIFIED | VERIFIED trong phạm vi xuất xứ công bố, đối tượng ôn thi cao học và chủ đề đọc được; UIT_SUPPLEMENTARY, không phải IT003. Giới hạn ảnh/quyền dùng ở mục 8. |

Ngày truy cập/mốc ghi nhận lượt đầu của UIT-SRC-001–005 ở mục 1; supplement cho 004–006 ở mục 8. UIT-SRC-001–003 đọc được HTML không cần đăng nhập trong lượt đầu; không suy ra điều kiện cho file đích. UIT-SRC-004 chỉ xác nhận text do công cụ trả về. UIT-SRC-005 chưa xác định yêu cầu tài khoản.

Đối chứng đầu mối: [danh mục Kỹ thuật Phần mềm của Thư viện UIT](https://thuvien.uit.edu.vn/page/dcmh-nganh-ky-thuat-phan-mem), STT 14, cũng trỏ tới UIT-SRC-005; tiêu đề phụ ghi chương trình tiếng Anh. Không mặc định hai chương trình dùng cùng phiên bản đề cương, không cộng URL đối chứng thành nguồn học thuật mới.

## 4. Định vị đã đọc và giới hạn kỹ thuật

UIT-SRC-004: các định vị dưới đây lấy từ text trích xuất, **chưa kiểm trực quan PDF**. Số PDF tính từ 1, khác chỉ số trang 0-based của công cụ; số trang in: NOT VERIFIED. Đây là chỉ mục nguồn, không phải mapping module/OP.

| Vị trí trong bản trích xuất | Chủ đề nhận diện, diễn giải ngắn |
|---|---|
| PDF 3–4; chương 1, mục 1.4 | Phân tích chi phí thuật toán |
| PDF 4; chương 2, mục 2.2–2.3 | Tra cứu và sắp thứ tự dữ liệu |
| PDF 4–5; chương 3, mục 3.3–3.5 | Danh sách động và biến thể |
| PDF 5–6; chương 4, mục 4.2–4.3 | Cây nhị phân, cây tìm kiếm |
| PDF 6–7; chương 5, mục 5.1–5.4 | Băm, xử lý va chạm và phân tích |
| PDF 8; mục 8 | Danh mục tài liệu đọc thêm; chưa kiểm các bản sách |

Không thấy mục Graph/BFS/DFS được nêu rõ trong bản trích xuất đã đọc; không suy thành UIT không dạy các nội dung này. Chưa đủ nguồn chi tiết cho Array/Stack/Queue hoặc toàn bộ 40 thao tác; không suy diễn từ tiêu đề tổng quát.

| URL/kiểm tra | Kết quả quan sát và hệ quả |
|---|---|
| Hai URL UIT-SRC-004; web open | Trả text 8 trang. Nhãn tiêu đề công cụ khác tiêu đề IT003 trong thân; không dùng nhãn đó làm tên tài liệu. |
| cntt URL; screenshot PDF 1/8 | Một lần chuyển về `https://ise.uit.edu.vn/vi`; lần khác cache miss. |
| fit URL; screenshot PDF 4/8 | Báo content type không phải PDF; không đọc được ảnh. |
| UIT-SRC-005; mở từ hai danh mục rồi mở trực tiếp | Timeout/không truy cập được; không xác nhận HTTP status hay nguyên nhân máy chủ. |

Giữ mâu thuẫn text/ảnh là giới hạn của công cụ trong lượt này; chưa kết luận URL gốc đã mất hoặc server luôn redirect. Không thay bằng mirror bên thứ ba, không coi hai URL PDF có cùng hash khi chưa đọc byte.

## 5. Quyền truy cập và sử dụng — lịch sử lượt đầu

Bảng lượt đầu dưới đây giữ nguyên; bảng quyền tách riêng đọc/trích dẫn/sao chép/tái phân phối cho đủ 6 nguồn ở mục 8.3 là kết luận supplement hiện hành.

| source_id | Bản quyền/giấy phép | Trích dẫn, diễn giải, sao chép/tái phân phối |
|---|---|---|
| UIT-SRC-001 | NOT VERIFIED giấy phép tái sử dụng | NOT VERIFIED quyền cụ thể; chỉ ghi metadata và URL trong audit này. |
| UIT-SRC-002 | NOT VERIFIED giấy phép tái sử dụng | NOT VERIFIED quyền cụ thể; không chép mô tả môn học vào sản phẩm. |
| UIT-SRC-003 | NOT VERIFIED giấy phép tái sử dụng | NOT VERIFIED quyền đối với danh mục và file đích; liên kết không cấp quyền sao chép file. |
| UIT-SRC-004 | NOT VERIFIED chủ thể quyền/giấy phép áp dụng | NOT VERIFIED quyền trích dẫn/sử dụng/tái phân phối; không lưu bản gốc, code mẫu hoặc hình vào repo. |
| UIT-SRC-005 | NOT VERIFIED, chưa đọc bản ghi | NOT VERIFIED điều kiện truy cập và mọi quyền sử dụng nội dung. |

Không thấy bằng chứng giấy phép rõ ràng trong phần đã đọc; đây không phải kết luận rằng giấy phép không tồn tại. Công khai URL không đồng nghĩa giấy phép mở. Việc ghi metadata/dẫn nguồn ở đây không chứng nhận quyền dùng trong release; cần xác nhận phạm vi được dùng trước khi tái sử dụng nội dung. Không liên hệ tác giả/đơn vị trong lượt này.

## 6. Khoảng trống, đề xuất và gate owner — lịch sử lượt đầu

Giữ đề xuất ban đầu để truy vết; nguồn Graph bổ sung và đề xuất hiện hành ở mục 8.4.

1. **Ưu tiên đầu mối UIT-SRC-003 → UIT-SRC-005** để xin/đọc bản đề cương có phiên bản xác định và điều kiện sử dụng. Chưa đủ bằng chứng chọn làm chuẩn EDU-1B.
2. UIT-SRC-004 là ứng viên tham khảo chỉ mục; cần bản truy xuất ổn định, kiểm trang thật và xác nhận phiên bản áp dụng trước khi owner chọn. Không coi đề cương là giáo trình chứa đủ chứng minh/mã giả.
3. Cần nguồn UIT được xác nhận bổ sung cho Graph/BFS/DFS và chi tiết thao tác chưa có bằng chứng. Kết quả tìm kiếm không đủ để kết luận thiếu tuyệt đối hoặc thay bằng giáo trình giả.
4. Owner cần quyết định: bản/khóa học nào làm chuẩn; cách cung cấp quyền truy cập hợp lệ; ai xác nhận học thuật và quyền sử dụng; có duyệt việc thu thập nguồn bổ sung hay không. Phê duyệt scope C1 không thay quyết định nguồn này.
5. Chỉ đề nghị nghiệm thu nguồn khi định danh, phiên bản, định vị và quyền sử dụng dự kiến có evidence; mọi thiếu hụt phải có quyết định xử lý rõ ràng. EDU-1A vẫn **PARTIAL**, chờ owner review, không tự mở EDU-1B/C hoặc EDU-2–4.

Giữ C1/UI v2-3 CLOSED, 24 C4 NOT VERIFIED/DEFERRED và ngoại lệ CI đúng phạm vi cũ. C4 là gate release riêng; không tạo mapping hay công nhận học thuật/runtime PASS trong catalog này. Không đổi trần raw JS 154000 B/CSS 58500 B.

## 7. Kiểm tra tài liệu và bảo toàn

- Chỉ thêm file này; không cập nhật roadmap/backlog/baseline/QA/source/test/skill.
- Kiểm URL bằng truy xuất thực tế nêu trên; lỗi/giới hạn vẫn được giữ, không báo tất cả URL PASS.
- Hậu kiểm yêu cầu UTF-8 không BOM/LF, link nội bộ, source ID duy nhất, `git diff --check` và kiểm whitespace cả file untracked mới; đối chiếu hash/status/diff/HEAD/index với snapshot bộ nhớ trước sửa.
- Không chạy browser/test/build/CI, cài package, Git ghi hoặc lưu tài liệu gốc. Dừng chờ owner duyệt nguồn.

## 8. EDU-1A Supplement — 18/11/2026

**PARTIAL — chờ owner duyệt nguồn, không tự đóng EDU-1A.** Chỉ sửa catalog này. Đã đọc lại AGENTS, catalog và quyết định C1 CLOSED; không mapping hoặc biên soạn nội dung.

### 8.1 Snapshot và phạm vi phân loại

- Snapshot trước supplement trong bộ nhớ: 407 file tracked/untracked không ignored, gồm 172 file/7 skill; status đầy đủ, diff/index đã ghi nhận. HEAD/branch/tree và index vẫn đúng mục 1; tree kiểm kê vẫn `e291aacc15fa5b39fb29ac68b63034c2e0b240ea`.
- Catalog trước sửa SHA-256: `e1f2c476474d798f1abc1fc70ab94a60e764012a4efd547c32f5caadf914ee35`. Diff tracked trước sửa SHA-256: `0e3189f051e160d99e5a366ed27fed5a91207786fa77b79d15345bbb0fe7ba23` (stdout UTF-8 trimEnd); staged rỗng.
- Ngày kiểm ba đầu mối: 18/11/2026; mốc ghi nhận sau truy xuất cuối **12:47:05 UTC / 19:47:05 UTC+7**. Không lấy ngày trong URL hoặc ngày crawl làm ngày biên soạn. Không có file nguồn/hash nguyên byte; không lưu giáo trình hoặc ảnh nguồn.

| source_id | Phân loại | Giới hạn áp dụng |
|---|---|---|
| UIT-SRC-001 | UIT_SUPPLEMENTARY | Metadata môn học; không phải nội dung học thuật chi tiết. |
| UIT-SRC-002 | UIT_SUPPLEMENTARY | Ngữ cảnh mục tiêu môn học. |
| UIT-SRC-003 | UIT_SUPPLEMENTARY | Đầu mối thư viện; không xác minh thay nội dung file đích. |
| UIT-SRC-004 | IT003_PRIMARY_CANDIDATE | Ứng viên, PARTIAL; owner chưa chọn, chưa xác minh bản hiện hành. |
| UIT-SRC-005 | UNVERIFIED | Đầu mối có liên kết chính thức nhưng chưa đọc được bản ghi. |
| UIT-SRC-006 | UIT_SUPPLEMENTARY | Ôn thi cao học; không đồng nhất với chương trình IT003 hoặc nguồn đủ cho toàn bộ release. |

Phân loại không thay trạng thái xác minh; không nâng VERIFIED chỉ vì tên miền UIT. UIT-SRC-001–003 giữ bằng chứng lượt đầu, không báo đã kiểm lại trong supplement.

### 8.2 Kết quả ba đầu mối

| Đầu mối | Bằng chứng truy xuất supplement | Metadata/định vị và kết luận |
|---|---|---|
| UIT-SRC-004, URL cntt tại catalog | Web open trả HTML và redirect về `https://ise.uit.edu.vn/vi`, không trả nội dung IT003 trong lần kiểm này. URL fit đã có ở catalog vẫn trả text 8 trang. | Giữ metadata/định vị trích xuất ở mục 3–4 như bằng chứng text, chưa kiểm ảnh. Không thấy phiên bản/ngày ban hành; chưa chứng minh mới nhất, cùng byte giữa hai URL hoặc còn áp dụng. **PARTIAL**, chưa đủ đề nghị làm chuẩn hiện hành vô điều kiện. |
| UIT-SRC-005, URL bản ghi tại catalog | Web open báo không truy cập được qua công cụ; lượt đầu từng timeout. | Không đọc được metadata, ngày, mục/trang, tác giả hay điều kiện tài khoản. **NOT VERIFIED**. Không kết luận bản ghi bị xóa hoặc suy đoán mã HTTP/nguyên nhân. |
| UIT-SRC-006, bài đăng và PDF tại catalog | Đọc được bài đăng chính thức, bấm chính liên kết đính kèm trả text PDF 2 trang. Kiểm ảnh trang 2 báo cache miss; chưa xác minh trực quan. | Có chuỗi bài đăng UIT → file, không chỉ có tên miền. **VERIFIED giới hạn**: công bố phục vụ ôn thi cao học và có chủ đề Graph/BFS/DFS. Tác giả, phiên bản PDF, tính hiện hành và quyền dùng vẫn chưa xác minh. |

UIT-SRC-006: đối tượng là người ôn thi cao học. PDF 1 có mục I.1–I.3 về nền tảng/biểu diễn, I.7 về duyệt DFS/BFS; PDF 2 có mục IV về cây. Đây là định vị trong text, PDF tính từ 1; trang in NOT VERIFIED. Tài liệu là đề mục ôn tập, chưa chứng minh có mã giả/phân tích đầy đủ. Không mở rộng scope sang thuật toán khác được liệt kê.

Nhãn tiêu đề công cụ cho PDF 006 hiển thị “Đại học Văn Lang”, khác thân tài liệu và bài đăng UIT. Không dùng nhãn đó để gán tác giả/đơn vị biên soạn; chỉ xác nhận UIT công bố liên kết. Ngày 04/05/2017 là ngày bài đăng, không phải ngày biên soạn PDF. Không coi tài liệu này là đề cương IT003.

### 8.3 Quyền đọc/trích dẫn/sao chép/tái phân phối

`RIGHTS_NOT_VERIFIED` nghĩa chưa có bằng chứng cấp phép cho hành vi tương ứng; không phải kết luận hành vi bị cấm. Khả năng đọc công khai là quan sát kỹ thuật, không phải giấy phép. Không suy quyền từ catalog, quyền truy cập hoặc nguồn tham khảo được liệt kê.

| source_id | Truy cập quan sát được | Quyền đọc | Quyền trích dẫn | Quyền sao chép | Quyền tái phân phối |
|---|---|---|---|---|---|
| UIT-SRC-001 | HTML đọc được ở lượt đầu | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED |
| UIT-SRC-002 | HTML đọc được ở lượt đầu | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED |
| UIT-SRC-003 | HTML đọc được ở lượt đầu; file đích chưa đọc được | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED |
| UIT-SRC-004 | Text URL fit; URL cntt redirect trong supplement | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED |
| UIT-SRC-005 | Công cụ không truy cập được | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED |
| UIT-SRC-006 | Bài đăng và text PDF đọc được; ảnh chưa xác minh | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED | RIGHTS_NOT_VERIFIED |

Không có bằng chứng cấp phép trong phần đã đọc cho các hành vi trên. Chỉ ghi metadata/chỉ mục và dẫn URL trong audit; chưa duyệt sao chép nội dung, hình hoặc code vào sản phẩm/repo. Không liên hệ đơn vị/tác giả hoặc dùng tài khoản riêng trong lượt này.

### 8.4 Đề xuất owner review và điều kiện còn thiếu

- **Chuẩn IT003:** UIT-SRC-004 chỉ đủ trình owner như IT003_PRIMARY_CANDIDATE có điều kiện. Cần xác nhận phiên bản áp dụng, truy xuất ổn định/định vị trang và quyền sử dụng dự kiến; chưa có ứng viên đủ VERIFIED toàn diện để tự chốt chuẩn EDU-1B.
- **Bổ trợ Graph:** có thể đề xuất UIT-SRC-006 cho chủ đề trong đề mục đã kiểm, với giới hạn tài liệu ôn thi cao học năm công bố 2017. Owner cần duyệt vai trò bổ trợ; không dùng thay đề cương IT003 hoặc kết luận phủ đủ kiến thức/mã giả.
- **VNU Library:** giữ UIT-SRC-005 UNVERIFIED, chưa thể đề nghị làm chuẩn nội dung. Cần truy cập hợp lệ hoặc xác nhận metadata từ đầu mối có thẩm quyền; chưa chứng minh cùng bản 004.
- Còn thiếu: nguồn chi tiết đủ cho 9 module/40 thao tác, quyền dùng cụ thể và người duyệt học thuật. Chủ đề xuất hiện trong nguồn không chứng minh độ phủ từng thao tác; supplement không thực hiện mapping để lấp khoảng trống này.
- Owner quyết định nguồn/phiên bản chuẩn, vai trò 006, cách xử lý quyền và truy cập thiếu, rồi phê duyệt EDU-1B riêng. Không tự đóng EDU-1A, không tạo knowledge-mapping.md, không nâng bất kỳ kết luận runtime/QA nào.

Hậu kiểm supplement: kiểm trực tiếp catalog untracked (nội dung, ID, Markdown/link, encoding/whitespace) bên cạnh git diff --check; so hash toàn bộ file có sẵn ngoài catalog và status/diff/HEAD/index với snapshot trước sửa. Không thay roadmap/backlog/baseline/QA/skills/source/test hoặc Git refs.

## 9. Owner Source Review Closeout — 18/11/2026

**EDU-1A PARTIAL — AWAITING_SOURCE_CONFIRMATION.** Owner phê duyệt dừng tìm kiếm lặp lại nguồn IT003 do không thể truy cập bài giảng số. Lượt này chỉ ghi quyết định owner, không truy xuất web lại và không đóng EDU-1A thành hoàn tất.

- **Bài giảng số IT003:** theo thông tin owner cung cấp, không truy cập được từ phía owner; nội dung, phiên bản và quyền dùng chưa xác minh. Đây là thông tin do owner báo, không phải kết quả truy cập mới của agent. Không suy bài giảng số là cùng tài liệu với đề cương hoặc bản ghi VNU; không tạo source ID/metadata/URL mới khi chưa có evidence.
- **UIT-SRC-004:** đề cương IT003 giữ PARTIAL / IT003_PRIMARY_CANDIDATE; chưa chứng minh tính hiện hành, chưa được owner chọn làm chuẩn.
- **UIT-SRC-006:** nguồn Graph/BFS/DFS công bố năm 2017 giữ UIT_SUPPLEMENTARY, VERIFIED giới hạn xuất xứ công bố/chủ đề như mục 8; không thay thế IT003.
- **UIT-SRC-005:** VNU Library giữ NOT VERIFIED / UNVERIFIED. Không có bằng chứng mới để nâng trạng thái.
- **Quyền sao chép/tái phân phối:** giữ RIGHTS_NOT_VERIFIED cho cả 6 nguồn; các giới hạn quyền đọc/trích dẫn ở mục 8.3 không đổi.
- Giữ đủ 6 source ID, phân loại, metadata và evidence hiện có; không suy đoán phiên bản, chương/mục/trang hoặc quyền sử dụng.

**Blocker trước EDU-1B:** cần owner xác nhận nguồn IT003 phù hợp, phiên bản áp dụng và cách xử lý quyền dùng chưa xác minh; phê duyệt dừng tìm kiếm không đồng nghĩa phê duyệt nguồn chuẩn. Không tiếp tục các đề xuất tìm nguồn ở mục 6/8 khi chưa có chỉ đạo mới. Dừng chờ owner; không mapping, EDU-1B/C hoặc EDU-2–4.

## 10. Nguồn độc lập cho bản thảo EDU-2 P1 — 18/11/2026

Owner cho phép đúng catalog này và [bản thảo chi phí/Bubble](edu-2-cost-and-bubble-draft.md), với ngoại lệ dependency chỉ cho bản thảo docs-only. Giữ nguyên 6 source ID/evidence UIT, IT003 PARTIAL và quyền UIT RIGHTS_NOT_VERIFIED; không thay nguồn chuẩn hoặc cập nhật 80 mapping ID.

### 10.1 EXT-SRC-001 — Runestone PythonDS3

- Phân loại: **INDEPENDENT_REFERENCE**. Tác giả: Brad/Bradley N. Miller và David L. Ranum; trang sách ghi Luther College, phát hành trên Runestone Academy.
- Định danh: Problem Solving with Algorithms and Data Structures using Python, bản web ghi 3rd edition. [Trang sách](https://runestone.academy/ns/books/published/pythonds3/index.html?mode=browsing); [mục 5.7, Bubble](https://runestone.academy/ns/books/published/pythonds3/SortSearch/TheBubbleSort.html), phần thảo luận dừng sớm/ActiveCode 2. Định vị HTML, không gán trang PDF/trang in.
- Kiểm trực tiếp 18/11/2026: đọc được trang sách và mục 5.7 bằng web/text; không chạy code/animation. Trang ghi copyright 2014, không dùng làm năm xuất bản bản 3 hoặc ngày sửa cuối. Revision cố định/tính mới nhất: NOT VERIFIED; không lưu bản sách/hash.
- Phạm vi xác minh: **VERIFIED giới hạn** tác giả, nhãn edition, khả năng đọc, thông báo giấy phép và sự hiện diện biến thể Bubble dừng sớm. Chưa chứng nhận tất cả luận giải hoặc sự phù hợp từng nhận định AlgoVision; source applicability **PARTIAL**, chờ reviewer.
- Thông báo trên trang sách: **CC BY-NC-SA 4.0**. Attribution tham chiếu: tên sách, Miller–Ranum, URL trang/mục và [giấy phép](https://creativecommons.org/licenses/by-nc-sa/4.0/); copyright 2014 khi ghi notice. Chưa sao chép/chuyển thể văn bản, hình, bảng, code hay mã giả nguồn.
- Quyền áp dụng cho cách dùng cụ thể tại AlgoVision, tái phân phối và quyền AI riêng: **RIGHTS_NOT_VERIFIED**. Việc đọc được hoặc có CC notice không tự chứng minh tương thích với giấy phép dự án hay cấp quyền ngoài phạm vi notice.

### 10.2 EXT-SRC-002 — OpenStax

- Phân loại: **INDEPENDENT_REFERENCE**. Metadata kế thừa P0/preparation đã cung cấp trong hội thoại: Introduction to Computer Science; OpenStax thuộc Rice University. Danh sách tác giả cá nhân, edition/revision chính xác: **NOT VERIFIED**, không tự điền.
- Chỉ ghi liên kết/metadata: [trang sách](https://openstax.org/details/books/introduction-computer-science), [Preface/notice](https://openstax.org/books/introduction-computer-science/pages/preface), [mục 3.3](https://openstax.org/books/introduction-computer-science/pages/3-3-formal-properties-of-algorithms). Mục 3.3 là đầu mối dự kiến cho mô hình chi phí, không được dùng làm bằng chứng nội dung trong bản thảo này.
- Đối soát metadata hội thoại ngày 18/11/2026, **BASELINE ONLY**; không truy xuất, tải, đọc hoặc trích xuất sách/trang OpenStax trong P1. Quyền đưa nội dung sách vào Codex/AI chưa xác minh; giới hạn owner này được giữ nguyên, không áp ngược việc đã truy cập ở lượt trước thành quyền cho lượt này.
- Giấy phép theo notice đã cung cấp ở P0/preparation: **CC BY-NC-SA 4.0**, chưa xác minh lại trong P1; không suy giấy phép chung của website áp cho mọi tài nguyên. Attribution metadata dự kiến: tên sách, OpenStax/Rice University, URL sách/notice và giấy phép; cần xác nhận tác giả/notice đầy đủ trước tái sử dụng.
- Trạng thái **PARTIAL về hồ sơ metadata**, nội dung/applicability và quyền dùng/AI/tái phân phối **NOT VERIFIED / RIGHTS_NOT_VERIFIED**. Không nhập văn bản, code, hình, bảng, mã giả hoặc luận giải của sách vào bản thảo. Không coi nguồn này là nguồn UIT hoặc nguồn học thuật đã nghiệm thu.

### 10.3 Ranh giới tham khảo và tái sử dụng

- Bản thảo diễn giải độc lập từ source AlgoVision và lập luận thuật toán; EXT-SRC-001 chỉ là tham chiếu về sự hiện diện biến thể, EXT-SRC-002 chỉ metadata/link. Không chép hoặc dịch/chuyển thể nội dung của hai sách. Dẫn link không cấp quyền sao chép.
- Theo [CC BY-NC-SA 4.0, điều khoản chính thức](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.en): khi sử dụng quyền được cấp và chia sẻ nội dung, cần giữ thông tin tác giả/notice phù hợp, URL/giấy phép và chỉ rõ sửa đổi; mục đích sử dụng phải đáp ứng NonCommercial. Khi chia sẻ bản chuyển thể, phải tuân ShareAlike và không thêm hạn chế trái giấy phép.
- Không suy rằng mọi diễn giải đều độc lập hoặc mọi bản dịch đều được dùng tự do. Cần review riêng tính chuyển thể, phạm vi nội dung/tài nguyên, mục đích sử dụng, attribution và giấy phép áp dụng; chưa kết luận tương thích với AlgoVision, không tự đổi LICENSE của repo. Quyền đọc/trích dẫn/sao chép/tái phân phối/AI phải được xác nhận theo hành vi dự kiến; điểm chưa rõ giữ RIGHTS_NOT_VERIFIED.
- Với OpenStax, không suy thông báo CC là quyền nạp sách vào AI; chỉ tiếp tục metadata/link đến khi có xác nhận phù hợp. Không tìm lại URL UIT đã dừng hoặc tải giáo trình gốc.
- Quy trình review nội bộ áp dụng EDU-1–4, theo thứ tự:
  1. **Codex:** đối chiếu code/test, lập luận thuật toán, nguồn và evidence đúng SHA; phân loại từng nhận định.
  2. **ChatGPT:** phản biện lượt hai, đối chiếu bằng chứng có thể truy cập hợp lệ, phát hiện thiếu sót và nêu bất đồng; không gọi đây là chứng nhận học thuật độc lập.
  3. **Owner:** phê duyệt cuối cùng theo từng phạm vi và bằng chứng.
  Không bắt buộc reviewer/giảng viên bên ngoài hoặc biên bản hình thức. Quy trình không miễn academic/rights gate; owner approval không cấp quyền nội dung bên thứ ba. Chỉ thêm hồ sơ nguồn; không tự nâng nguồn UIT, 80 mapping ID hoặc academic PASS 0/40, không mở P2/OP-17…20/EDU-3–4.

## 11. Policy B và quyền theo hành vi — EDU-1F

Bổ sung ngày 22/11/2026; giữ nguyên 8 source ID, metadata, evidence và trạng thái lịch sử. **EDU-1 PARTIAL; academic PASS 0/40; RIGHTS_NOT_VERIFIED.** Đây là policy nguồn và cách phân tuyến acceptance, không phải nghiệm thu học thuật hoặc cấp quyền nội dung.

### 11.1 Hai lớp evidence

1. **UIT — định danh/phạm vi:** nguồn 001–003 hỗ trợ định danh/ngữ cảnh/đầu mối; 004 là IT003_PRIMARY_CANDIDATE PARTIAL, chưa xác minh tính hiện hành; 005 chưa truy cập đủ; 006 là UIT_SUPPLEMENTARY, chỉ VERIFIED xuất xứ/chủ đề đã đọc. Không dùng tên miền hoặc đề mục để suy mã giả, Big-O, tính đúng hay độ phủ 40 OP.
2. **Claim chi tiết:** dùng nguồn học thuật độc lập có tác giả/đơn vị, URL, edition/revision hoặc giới hạn phiên bản, ngày truy cập, locator và nội dung thực sự hỗ trợ đúng biến thể/giả định. Chứng minh tự biên soạn từ implementation phải nêu SHA:line, tiền điều kiện, mô hình chi phí, lập luận và giới hạn; kèm phản biện nội bộ/owner acceptance. Phân biệt chứng minh riêng AlgoVision với kiến thức tổng quát; không buộc giáo trình mô tả counters/snapshot riêng của sản phẩm. Không coi một lập luận nội bộ là bằng chứng đã xác minh nội dung nguồn bên ngoài.

Không bắt buộc một tài liệu UIT chứng minh toàn bộ OP. Giữ phản biện Codex → ChatGPT → Owner; không gọi đây là chứng nhận học thuật độc lập hoặc tự miễn A-EDU/G-EDU. Không tìm lại IT003/OpenDSA đã được quyết định dừng.

### 11.2 Catalog và nguồn dẫn bổ trợ

Catalog vẫn có đúng **8 source ID: 6 UIT + 2 EXT**. Runestone chỉ hỗ trợ phạm vi đã xác minh; OpenStax chỉ metadata/link theo giới hạn hiện có. Toronto, MIT và OpenDSA được dẫn tại [hồ sơ OP-17, mục 4](op17-source-evidence.md#4-nguồn-khả-năng-truy-xuất-và-quyền), không tự trở thành source ID mới, nguồn UIT hoặc catalog entry đã nghiệm thu. Tái sử dụng evidence đúng locator/giới hạn; chưa xác minh revision, applicability hoặc quyền thì giữ nguyên trạng thái đó.

### 11.3 Quyền theo hành vi sử dụng thực tế

| Hành vi | Evidence/điều kiện phải ghi | Giới hạn hiện hành |
|---|---|---|
| Metadata/link/dẫn nguồn | Định danh, URL, locator và vai trò tham khảo | Có link/metadata không cấp quyền sao chép tài liệu đích. |
| Tự diễn giải/chứng minh | Provenance từ code/lập luận; review biểu đạt độc lập, phân biệt với dịch/chuyển thể | Không đồng nhất quyền đối với tài liệu bên thứ ba với bản giải thích độc lập AlgoVision; không tự gán giấy phép hoặc xác nhận độc lập tuyệt đối. |
| Trích dẫn | Đoạn/tài nguyên cụ thể, phạm vi, attribution và căn cứ áp dụng | Chưa có evidence đủ thì RIGHTS_NOT_VERIFIED; không thêm trích dẫn dài để lấp gap. |
| Chuyển thể | Tài nguyên gốc, phần thay đổi, giấy phép áp dụng và điều kiện attribution/NC/SA nếu có | Notice chung không chứng minh tương thích với cách dùng AlgoVision. |
| Sao chép | Nội dung/byte/hình/code cụ thể và căn cứ được phép | Không đưa giáo trình hoặc tài nguyên nguồn chưa được phép vào repo/sản phẩm. |
| Tái phân phối/công bố | Nội dung thực sự được phát hành, phạm vi giấy phép/quyền và nghĩa vụ đi kèm | Công bố hồ sơ kiểm kê không cấp quyền phân phối tài liệu nguồn. |
| AI | Tách đọc/ingestion/training, tài nguyên và dịch vụ/quy trình cụ thể | Không suy quyền AI từ mua sách, khả năng đọc hoặc CC notice; giữ giới hạn OpenStax. |

Bảng trên là quy tắc evidence, không nâng quyền của bất kỳ nguồn nào. Giữ RIGHTS_NOT_VERIFIED cho hành vi thiếu căn cứ; cũng không diễn giải NOT VERIFIED thành kết luận bị cấm. Owner approval không thay giấy phép bên thứ ba. Chỉ dùng nội dung có provenance và quyền phù hợp với hành vi dự kiến; claim dựa trên nguồn chưa xác minh không được tự nghiệm thu vì đã merge.

### 11.4 Gate hồ sơ và gate nội dung

**Lịch sử điều kiện EDU-1F:** EDU-1 chỉ có thể được owner đóng riêng sau khi danh mục/mapping, policy và [routing gap 40 OP](knowledge-mapping.md#8-disposition-40-op--edu-1f) được nghiệm thu. Mọi claim học thuật và quyền liên quan nội dung bắt buộc còn thiếu được giao EDU-2–4 với acceptance rõ; chưa đạt vẫn chặn release. Nguồn đang giữ làm metadata/đầu mối không được dùng như evidence nội dung VERIFIED. Không nâng source_status, rights_status, academic PASS hoặc tự mở giai đoạn.

## 12. Closeout hiện hành — EDU-1G

**EDU-1 Source & Mapping — OWNER ACCEPTED / CLOSED**, quyết định owner ngày 22/11/2026.

Bằng chứng: [PR #67](https://github.com/Nggvanchi/AlgoVision/pull/67), merge SHA `7369060373396a6e73c446a66be47b9c0245317d`; [CI sau merge 45031433630](https://github.com/Nggvanchi/AlgoVision/actions/runs/45031433630) Ubuntu/Windows **SUCCESS**, [Vercel SUCCESS](https://vercel.com/nggvanchi-4548/algo-vision/4P8m4HveH4g3oJJtD9B9VzFy2z1t), đã đối chiếu đúng merge SHA.

Owner nghiệm thu policy B, rights matrix theo hành vi, catalog **8 source ID** và giới hạn từng nguồn, cùng [routing/acceptance 40 OP](knowledge-mapping.md#8-disposition-40-op--edu-1f). Giữ nguyên metadata, evidence, mọi source_status và **RIGHTS_NOT_VERIFIED**; đây không phải cấp phép nội dung bên thứ ba hoặc xác nhận quyền AI.

Chỉ đóng gate hồ sơ nguồn/mapping. **Academic PASS 0/40**; EDU-2–4 phải nghiệm thu claim và quyền theo hành vi sử dụng thực tế. 40 OP/80 mapping ID, 2 READY/38 DEFER (5/27/8 OP đến EDU-2/3/4) không đổi; mỗi gap còn acceptance tại giai đoạn đích, không miễn G-EDU/G-RELEASE hoặc đổi scope/dependency. Các ghi chú PARTIAL/chưa đóng trước mục này là lịch sử; không tự mở OP-18/EDU-2–4.
