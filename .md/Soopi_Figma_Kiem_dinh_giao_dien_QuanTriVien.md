# Yêu cầu kiểm định và chỉnh sửa giao diện Quản trị viên Soopi trên Figma

> Dùng **toàn bộ file này như một prompt duy nhất** cho Figma Agent. Hãy sửa trực tiếp **13 màn Quản trị viên** trong ảnh tham chiếu, bổ sung các màn/trạng thái được chỉ rõ ở cuối file. Đây là bản thiết kế Figma demo, **không viết code**. Giữ nhận diện màu cam của Soopi, nhưng ưu tiên giao diện dễ đọc, đúng dữ liệu và đúng quyền của Quản trị viên.

## 1. Căn cứ và mục tiêu

Đối chiếu thiết kế với `Soopi_3.2.1_Thiet_ke_Collection.md`, báo cáo nghiệp vụ Soopi V11 và `AGENTS.md` trong dự án. Ảnh tham chiếu có các màn 01–13: Tổng quan, Tài khoản, Chi tiết tài khoản, Đăng ký Người bán, Chi tiết xét duyệt, Danh mục, Sản phẩm toàn sàn, Danh sách giao dịch, Chi tiết giao dịch, Banner, Khuyến mãi toàn sàn, Voucher Toàn sàn/Freeship, Báo cáo.

Hãy làm cho người xem hiểu rõ Quản trị viên có thể **duyệt Người bán; khóa/mở tài khoản; quản lý cửa hàng, danh mục, sản phẩm toàn sàn; theo dõi giao dịch VNPay; quản lý banner, khuyến mãi Toàn sàn, voucher Toàn sàn/Freeship; xem thống kê**. Quản trị viên không cần thay Người bán cập nhật đơn, giá, tồn kho; không sửa tay kết quả VNPay; không tự động hoàn tiền; không tích hợp hãng giao hàng thật.

### Các ràng buộc xuyên suốt

- `TaiKhoan.vaiTro` là **mảng**. Tài khoản Người bán vẫn có vai trò **Người dùng** và vẫn được mua hàng. “Người dùng” không đồng nghĩa “chỉ mua hàng”; số lượng vai trò có thể chồng nhau. Trạng thái tài khoản dùng đúng **Hoạt động / Bị khóa**.
- Duyệt hồ sơ `YeuCauDangKyNguoiBan` chỉ có ba kết quả: **Chờ phê duyệt / Đã phê duyệt / Đã từ chối**. Khi duyệt, bổ sung vai trò Người bán và tạo cửa hàng cho tài khoản hiện tại; không tạo tài khoản khác.
- `DanhMuc` hiện chỉ có **tên danh mục** (ngoài `_id`). Chưa có danh mục cha, cấp, thứ tự, mô tả hoặc trạng thái ẩn/hiện.
- `SanPham` có tên, ảnh, mô tả, giá gốc, số lượng tồn, trạng thái kinh doanh, cửa hàng, danh mục. Trạng thái là **Đang kinh doanh / Ngừng kinh doanh**. Chưa có SKU riêng, “tồn khả dụng” tách khỏi tồn hiện tại, lý do kiểm duyệt hay nhật ký kiểm duyệt.
- Khuyến mãi sản phẩm nằm ở `KhuyenMai` và `ChiTietKhuyenMai`: chương trình có tên, loại, phạm vi **Cửa hàng / Toàn sàn**, ngày bắt đầu/kết thúc, trạng thái **Chưa bắt đầu / Đang hoạt động / Đã kết thúc**; chi tiết gắn với **sản phẩm cụ thể** và mức giảm theo tỷ lệ hoặc giá khuyến mãi. Điều kiện đơn tối thiểu và giảm tối đa là dữ liệu **Voucher**, không phải dữ liệu chương trình khuyến mãi sản phẩm.
- Voucher của Quản trị viên chỉ gồm **Toàn sàn** và **Freeship** (`cuaHangId` để trống); voucher **Cửa hàng** do Người bán quản lý. Không đặt quy tắc số lượt trên từng khách, nhóm khách nhận, một mã trên mỗi giao dịch hoặc cách chia voucher khi giỏ nhiều shop nếu chưa được chốt trong tài liệu.
- Một `GiaoDichThanhToan` có thể gắn **nhiều `DonHang` của nhiều cửa hàng**. Giao dịch lưu trạng thái **Chờ thanh toán / Thành công / Thất bại / Hết hạn**. Đơn hàng dùng trạng thái thanh toán **Chờ thanh toán / Đã thanh toán / Thất bại / Hết hạn** và trạng thái xử lý riêng. Tổng `GiaoDichThanhToan.soTien` phải bằng tổng `DonHang.tongThanhToan` của các đơn liên quan.
- Banner hiện có `tieuDe`, `hinhAnh`, `noiDung`, `trangThai` (**Kích hoạt / Vô hiệu hóa**). Chưa có vị trí, link đích, nhãn CTA, thứ tự, lịch bắt đầu/kết thúc hoặc trạng thái “Sắp diễn ra”.
- Toàn bộ tiền là số nguyên VND. Báo cáo chỉ tính đơn theo định nghĩa nhất quán, ghi rõ khoảng thời gian và cách tính. Không suy ra lợi nhuận, hoa hồng, phí nền tảng, số lượt xem/click, “danh mục được quan tâm” nếu không có dữ liệu cho chúng.

## 2. Các lỗi ưu tiên phải sửa trước khi tinh chỉnh thẩm mỹ

| Mức | Vị trí hiện tại | Bất hợp lý | Cách sửa trực tiếp trên Figma |
|---|---|---|---|
| Cao | 01, 02 | `12.480 = 12.194 người mua + 286 người bán`, nhưng dòng “Người mua” lại ghi “Có quyền mua hàng”; Người bán cũng có quyền mua, nên cách đếm đang tự mâu thuẫn. | Đổi thành **“Tài khoản chỉ có vai trò Người dùng”** và **“Tài khoản có vai trò Người bán”** nếu muốn hai nhóm không chồng nhau, ghi rõ tài khoản quản trị được tính riêng. Hoặc hiển thị “Tài khoản duy nhất” và số tài khoản có từng vai trò, không cộng các card vai trò với nhau. |
| Cao | 04, 05 | Duyệt Người bán dựa vào CCCD, ảnh giấy tờ, ngân hàng, email/điện thoại shop, checklist xác minh; tất cả đều không có trong hồ sơ đăng ký Soopi. | Bỏ các khối xác minh đó khỏi luồng chính. Chỉ hiện dữ liệu yêu cầu và tài khoản có thật. |
| Cao | 06 | Danh mục đang là cây cha–con, có thứ tự, mô tả, trạng thái và nút Ẩn dù collection chỉ có tên. | Chuyển thành danh sách phẳng; form thêm/sửa tên. Không thiết kế Ẩn/Xếp thứ tự/Cấp danh mục như đã có chức năng. |
| Cao | 10 | Banner quản lý link, vị trí, CTA, lịch hiển thị nhưng thiếu trọng tâm là **ảnh banner** trong bản xem trước. Các trường đó không nằm trong collection. | Form chỉ gồm tiêu đề, ảnh, nội dung, trạng thái. Preview dùng ảnh thật/ảnh mẫu và text có sẵn. |
| Cao | 11 | Chương trình khuyến mãi toàn sàn đang thiết kế như voucher: giảm tối đa, đơn tối thiểu, quy tắc không cộng voucher; lại thiếu danh sách sản phẩm và mức giảm từng sản phẩm. | Thiết kế `KhuyenMai` + `ChiTietKhuyenMai`: chọn sản phẩm, nhập tỷ lệ giảm hoặc giá khuyến mãi, xem giá cuối. Bỏ các điều kiện voucher. |
| Cao | 08, 09 | Chi tiết giao dịch hiển thị mã VNPay, mã phản hồi, mã ngân hàng, nhật ký xác minh, “xem dữ liệu xác minh” như dữ liệu được lưu lâu dài; collection hiện không có các trường đó. | Chỉ hiển thị mã Soopi, số tiền, phương thức VNPay, trạng thái, thời gian tạo/hoàn tất, đơn liên kết. Không có thao tác sửa trạng thái hoặc mở dữ liệu chữ ký/hash. |
| Cao | 13 | Báo cáo ghi “theo ngày hoàn thành” nhưng `DonHang` chỉ lưu `ngayTao`, không có ngày hoàn thành. Đồng thời doanh thu theo sản phẩm sau voucher không chia được chính xác về từng dòng nếu chưa có quy tắc phân bổ. | Ghi “Đơn tạo trong kỳ và hiện đã hoàn thành” nếu dùng ngày tạo; tách **giá trị hàng bán theo dòng** khỏi **doanh thu đơn sau voucher**. |
| Trung bình | Điều hướng | Không có trang **Cửa hàng toàn sàn**, trong khi Quản trị viên phải quản lý trạng thái cửa hàng và dashboard đã đếm cửa hàng hoạt động. | Thêm danh sách/chi tiết cửa hàng, liên kết từ tài khoản và hồ sơ duyệt. |
| Trung bình | 02, 03, 04, 07, 08, 09, 13 | Rất nhiều nút “Xuất danh sách/đối soát/CSV” nhưng chưa có luồng demo hoặc yêu cầu chính trong báo cáo. | Bỏ khỏi bản chính hoặc tạo một luồng xuất thật rõ và có lý do dùng; dành chỗ cho hành động chính. |

## 3. Sửa cụ thể 13 màn hiện có

### 01 — Tổng quan hệ thống

- Đổi phần KPI tài khoản thành **Tổng tài khoản duy nhất**, **Tài khoản có quyền Người bán**, **Cửa hàng Hoạt động**, **Đơn hoàn thành trong kỳ** hoặc một cấu trúc không khiến vai trò bị cộng hai lần. Nếu vẫn hiện “12.194 người mua + 286 người bán”, phải đổi “người mua” thành “tài khoản chỉ có quyền Người dùng”, ghi rõ có/không tính Quản trị viên và kiểm tra tổng 12.480. Không dùng “Người mua” như vai trò độc lập vì enum là “Người dùng”.
- Card doanh thu phải liên kết sang màn 13 và ghi đúng định nghĩa của màn 13, ví dụ “Giá trị hàng bán từ đơn hoàn thành”; không lẫn với tổng giao dịch VNPay thành công hoặc tổng tiền có phí vận chuyển. Hiện kỳ “01–16/10/2026” hoặc “Tháng 10 đến ngày 16” để người xem không tưởng đã đủ tháng.
- “3 hồ sơ chờ duyệt” là việc cần xử lý và nên có CTA “Xem hồ sơ”. Hai giao dịch thất bại, một hết hạn là **trạng thái để theo dõi**, không phải công việc để admin sửa tay; bỏ câu cảnh báo dài mang tính kỹ thuật ở giữa dashboard. Thay bằng các card/link nhỏ “Theo dõi giao dịch” và giải thích ngắn trong chi tiết giao dịch.
- Bảng hồ sơ chờ duyệt có thể giữ nhưng làm gọn và đưa trạng thái thành chip. Các dòng phải khớp danh sách màn 04. Hai khối cuối “Giao dịch và đối soát” và “Quản lý nội dung” đang lặp thông tin trang khác; rút xuống thành liên kết nhanh hoặc bỏ để dashboard không quá dài.
- Bỏ “Xuất dữ liệu” nếu không có luồng xuất. Các card có thể bấm mở trang đã lọc. Nếu không có hồ sơ chờ duyệt, thể hiện empty state thay vì khung trống.

### 02 — Danh sách tài khoản

- Sửa card **Tổng 12.480 / Người mua 12.194 / Người bán 286** theo quy tắc vai trò mảng nêu trên. “Người bán” có cả quyền mua hàng; bảng không chỉ ghi một nhãn “Người bán” gây hiểu nhầm mất vai trò Người dùng. Hiển thị chip “Người dùng” và “Người bán” trên cùng dòng; bộ lọc vai trò dùng logic “có vai trò”.
- Đổi trạng thái bảng “Đã khóa” thành đúng enum **“Bị khóa”**; dùng “Khóa tài khoản” cho động từ của nút. Bộ lọc trạng thái chỉ có “Hoạt động” và “Bị khóa”.
- `TaiKhoan` không có ngày tạo trong tài liệu collection. Bỏ cột “Ngày tạo” và các thống kê dựa trên ngày tạo nếu chưa thống nhất thêm timestamps; thay bằng họ tên, email, điện thoại, vai trò, trạng thái. Không bao giờ hiện mật khẩu/hash.
- Dòng U-0001 Nguyễn Minh Anh phải cho thấy hai vai trò Người dùng + Người bán; điều này cũng đồng bộ với hồ sơ HS-SHOP-1026-001 đã duyệt ở màn 04. Số tài khoản bị khóa 28 phải là tập con của tổng, không tính thêm vào tổng.
- Nút chính “Xuất danh sách” không phù hợp khi tác vụ chính là tra cứu/khóa tài khoản. Bỏ hoặc đặt thành hành động phụ chỉ khi có prototype xuất. Tăng tương phản bảng, làm hàng tài khoản gọn hơn, hiển thị bộ lọc đã chọn và nút xóa lọc.

### 03 — Chi tiết / Khóa–mở tài khoản

- Tiêu đề riêng “Chi tiết tài khoản · Võ Thanh Tâm”; hành động “Mở khóa tài khoản” đặt ở khu vực hành động, không biến toàn trang thành form thay đổi quyền truy cập. Dùng đúng chip trạng thái **Bị khóa**. Khối hồ sơ chỉ gồm họ tên, email, số điện thoại, vai trò, trạng thái và dữ liệu tài khoản có thật.
- Dòng “Đã khóa từ 15/10/2026”, “Lý do”, “Người thực hiện” và cả bảng “Nhật ký quản trị” **không có nơi lưu trong 19 collection**. Bỏ khỏi demo chính hoặc ghi rõ đó là đề xuất mở rộng cần bổ sung mô hình dữ liệu. Không thiết kế như nhật ký đã tồn tại. Tương tự, “Ngày tạo” không có trong tài liệu nếu chưa dùng timestamps.
- Có thể giữ form lý do ở **hộp xác nhận tạm thời** để người quản trị cân nhắc trước khi bấm, nhưng không hứa lý do sẽ lưu/hiện trong lịch sử hoặc được gửi đi nếu không có dữ liệu hỗ trợ. Nếu muốn quy trình lưu lý do thật, phải đưa sang mục cần chốt nghiệp vụ/dữ liệu.
- Trường “Thao tác” đang mặc định mở khóa với tài khoản đã khóa, rồi có “Trạng thái sau cập nhật” lặp ý. Thay bằng một CTA cụ thể, dialog xác nhận “Mở khóa Võ Thanh Tâm?”, nút Hủy/Mở khóa; sau khi mở, chip chuyển Hoạt động. Với tài khoản đang Hoạt động thì nút Khóa và dialog tương ứng. Không cho admin tự khóa chính tài khoản đang dùng trong demo.
- Không nói đơn đã thanh toán của tài khoản bị khóa sẽ tự chuyển trạng thái; việc khóa chỉ chặn truy cập, dữ liệu đơn/giao dịch vẫn được giữ. Nếu báo cáo có chức năng “đặt lại mật khẩu”, chỉ thêm sau khi xác định cơ chế; không hiện mật khẩu tạm hoặc gửi email giả.

### 04 — Đăng ký Người bán

- Đổi mô tả “Xác minh hồ sơ cửa hàng và thông tin nhận tiền” thành **“Xem thông tin đăng ký cửa hàng và xét duyệt quyền Người bán”**. Hồ sơ có tên cửa hàng dự kiến, mô tả, địa chỉ, ngày gửi, trạng thái và tài khoản gửi; không có giấy tờ hay ngân hàng.
- Card “Đã duyệt tháng 10” và “Từ chối tháng 10” hiện có vẻ đếm theo **ngày ra quyết định**, nhưng `YeuCauDangKyNguoiBan` chỉ có `ngayGui`. Đổi nhãn thành “Hồ sơ gửi trong tháng 10 đã phê duyệt/từ chối”, hoặc chỉ đếm tổng theo trạng thái và bỏ lời khẳng định về ngày xử lý.
- Bảng các hồ sơ dùng đúng nhãn **Chờ phê duyệt / Đã phê duyệt / Đã từ chối**; hiện tài khoản gửi, tên cửa hàng dự kiến, ngày gửi, trạng thái. Nút “Xem hồ sơ” mở màn 05. Nút “Xem lý do” của hồ sơ từ chối không có dữ liệu lý do để đọc, nên đổi thành “Xem chi tiết” và bỏ phần lý do lưu nếu chưa mở rộng collection.
- Bỏ “Xuất hồ sơ” và thông báo “Từ chối phải nêu rõ lý do để người đăng ký bổ sung đúng hồ sơ” khỏi luồng chính, vì chưa có trường lý do và chưa có cơ chế gửi lại hồ sơ được mô tả. Giữ kết quả duyệt/từ chối minh bạch qua trạng thái.

### 05 — Chi tiết duyệt / Từ chối Người bán

- Đây là màn sai phạm vi dữ liệu nhiều nhất. Chỉ giữ: mã hồ sơ, ngày gửi, tên/mô tả/địa chỉ cửa hàng **dự kiến**, trạng thái yêu cầu; khối tài khoản gửi gồm họ tên, email, số điện thoại lấy từ `TaiKhoan`. Email trong ảnh `gom.moc@example.com` đang được gọi là “email liên hệ shop”, trong khi tài khoản Đặng Thảo My ở màn 02 có `thaomy@example.com`; sửa thành **Email tài khoản: thaomy@example.com**, hoặc chọn một giá trị thống nhất cho cả hai màn.
- Bỏ “loại hình cá nhân”, “điện thoại shop đã xác minh”, CCCD, nút mở mặt trước/mặt sau, tài khoản ngân hàng, người nhận tiền, các hàng checklist “Đạt”, và lời xác nhận giấy tờ/tiền khớp. Không biến dữ liệu không có thành điều kiện duyệt bắt buộc.
- Hai nút “Duyệt và kích hoạt shop” và “Từ chối hồ sơ” nên là **hai quyết định tách biệt**, không dùng thêm dropdown “Quyết định” đã đặt sẵn Duyệt. Mỗi nút mở dialog xác nhận: Duyệt → yêu cầu thành Đã phê duyệt, tài khoản bổ sung vai trò Người bán và có một cửa hàng từ thông tin đã đăng ký; Từ chối → yêu cầu thành Đã từ chối, tài khoản giữ vai trò Người dùng. Chỉ cho thao tác khi yêu cầu còn Chờ phê duyệt.
- Không hiện ô “Ghi chú/Lý do từ chối” như dữ liệu được lưu lâu dài, hoặc câu “nhận thông báo qua email”, vì yêu cầu không có trường lý do và chưa có cơ chế email. Nếu giảng viên muốn lưu lý do từ chối, ghi rõ đây là thay đổi cần bổ sung vào collection trước khi thiết kế luồng chính.
- Sau duyệt, dùng frame kết quả có link sang **Chi tiết cửa hàng** và Chi tiết tài khoản cùng người. Sau từ chối, frame chỉ đọc thể hiện đúng trạng thái; không còn hai nút quyết định hoạt động.

### 06 — Danh mục

- Xóa mô hình cây đang thể hiện “Đồ gia dụng → Dụng cụ nhà bếp”, lọc “Tất cả cấp”, cột Danh mục cha, cột Thứ tự, trạng thái Hoạt động/Ẩn và trường Mô tả. `DanhMuc` không có các thuộc tính này. Chuyển thành **danh sách danh mục phẳng** với Tên danh mục, mã hiển thị suy từ `_id` (nếu muốn), số sản phẩm liên quan tính từ `SanPham`, nút Sửa/Xem sản phẩm.
- Ví dụ “Dụng cụ nhà bếp” có thể là một danh mục riêng độc lập, không trình bày là con của “Đồ gia dụng”. Bộ lọc tìm theo tên, không có bộ lọc cấp/trạng thái. Form thêm/sửa chỉ nhập tên và có Lưu/Hủy, lỗi bỏ trống/trùng tên nếu dự án có ràng buộc phù hợp.
- Với danh mục đang có sản phẩm hoặc đã được dữ liệu khác tham chiếu, **không xóa cứng**. Hiện nút Xóa chỉ khi có thể xóa an toàn; nếu chưa có chức năng chuyển sản phẩm sang danh mục khác, hãy vô hiệu hóa và giải thích thay vì thêm “Ẩn” giả. Nếu muốn chức năng ẩn danh mục, cần thêm trạng thái vào thiết kế dữ liệu; để ở ghi chú mở rộng.
- Không cần một bảng 6 dòng rất cao rồi thêm form chỉnh sửa dài ngay dưới. Dùng dialog hoặc panel bên phải cho Thêm/Sửa để điều hướng gọn và dễ hiểu.

### 07 — Sản phẩm toàn sàn

- Bộ lọc theo tên, cửa hàng, danh mục, trạng thái kinh doanh. Bỏ từ khóa “SKU” và mã kiểu `NX-001`, `TC-001` như field nghiệp vụ nếu không có SKU trong collection; có thể hiện “Mã sản phẩm” rút gọn từ `_id` cho demo. Bảng nên có ảnh đại diện, tên, cửa hàng, danh mục, giá gốc, giá bán hiệu lực nếu có, `soLuongTon`, trạng thái và nút Xem.
- Đổi mọi nhãn “Đang bán” thành **Đang kinh doanh**, “Ngừng bán” thành **Ngừng kinh doanh**. Không gọi tồn kho là “Tồn khả dụng” nếu không có hàng đang giữ/đang phân bổ. Nếu giá khuyến mãi đang hiện, phân biệt rõ nguồn `ChiTietKhuyenMai` của chương trình còn hiệu lực, không sửa trực tiếp trong sản phẩm.
- Hành động quản trị chính là **kiểm tra và ngừng kinh doanh sản phẩm không phù hợp**, sau xác nhận trạng thái đổi, nhưng vẫn giữ lịch sử đơn. Không cho admin sửa giá hoặc tồn kho thay Người bán. Nếu seller tự ngừng sản phẩm, không tự gắn lý do kiểm duyệt từ admin.
- Khối “Kiểm soát hiển thị” đang yêu cầu lý do kiểm duyệt, ghi chú cho người bán và hứa “người bán nhận được lý do”, nhưng chưa có trường lưu/luồng thông báo. Bỏ các phần này khỏi giao diện chính; đặt một dialog xác nhận đơn giản với tên sản phẩm, cửa hàng, trạng thái mới, hậu quả hiển thị. Nếu muốn quản lý lý do thật, ghi chú cần mở rộng dữ liệu.
- Màn này thiếu **chi tiết sản phẩm chỉ đọc** để admin xem ảnh, mô tả, danh mục, cửa hàng và giá trước khi quyết định. Bổ sung frame chi tiết đó. Không có nút Xóa cứng sản phẩm đã phát sinh đơn.

### 08 — Danh sách giao dịch VNPay

- Đây là trang **theo dõi**, không phải nơi sửa kết quả thanh toán. Bảng nên có mã giao dịch Soopi, người mua (suy từ đơn liên kết nếu cần), số đơn liên kết, số tiền, thời gian tạo, thời gian hoàn tất (nếu có), chip trạng thái và “Xem chi tiết”. Không ép “Người mua/Đơn” vào một ô khi có thể có nhiều đơn/cửa hàng.
- Các card “3 Thành công, 1 Chờ, 2 Thất bại, 1 Hết hạn” đang thuộc **danh sách gần đây**. Ghi rõ cùng một phạm vi thời gian với bảng, tránh người xem tưởng là tổng toàn hệ thống. Số tiền “1.041.800đ đã xác minh” là tổng ba giao dịch mẫu thành công và có thể giữ nếu nhất quán; không cộng giao dịch chờ/thất bại/hết hạn.
- Ví dụ giao dịch **SOOPI-TXN-1026-019** tạo lúc **16/10 08:45** nhưng đã “Hết hạn” trên cùng màn có ngày 16/10, trong khi Soopi quy định **quá 24 giờ chưa thanh toán** mới hết hạn. Sửa thời gian tạo thành một ngày trước, hoặc đổi trạng thái thành “Chờ thanh toán” nếu chưa đủ 24 giờ. Kiểm tra tương tự mọi ví dụ khác.
- Bỏ “Xuất đối soát” nếu không tạo luồng xuất cụ thể. Không có nút “Xác nhận đã thanh toán”, “Đánh dấu thành công”, “Hoàn tiền”, “Thử lại callback” trên trang quản trị. Với giao dịch Thành công thì đơn liên kết hiển thị Đã thanh toán; Thất bại/Hết hạn thì đơn liên kết cũng phản ánh thất bại/hết hạn và Đã hủy.

### 09 — Chi tiết giao dịch

- Giữ hai khối chính: **Giao dịch Soopi** (`maGiaoDich`, `soTien`, phương thức VNPay, trạng thái, thời gian tạo/hoàn tất) và **các đơn liên kết**. Ví dụ 294.500đ + 228.700đ = 523.200đ là đúng, tiếp tục dùng đúng mã đơn/cửa hàng ở các trang liên quan. Một giao dịch có thể chứa hai đơn thuộc hai shop; không chia nó thành hai giao dịch.
- Bỏ hoặc không khẳng định dữ liệu lâu dài ở khối “Kết quả từ VNPay”: mã giao dịch VNPay `146821001`, mã phản hồi `00`, mã ngân hàng `NCB`, “Chữ ký: Hợp lệ”, thời điểm callback chi tiết — các trường này không nằm trong `GiaoDichThanhToan` của thiết kế hiện tại. Chỉ có thể diễn đạt chung “Trạng thái giao dịch: Thành công” dựa trên dữ liệu đã cập nhật. Nếu dự án sau này lưu thông tin trả về của VNPay, bổ sung model rồi mới thêm khối đối soát chi tiết.
- Bỏ bảng “Nhật ký xác minh” 3 mốc, vì chưa có collection sự kiện/audit; không tô vẽ một lịch sử mà không thể truy xuất. Bỏ nút “Xem dữ liệu xác minh”, đặc biệt không để hiểu là có thể mở chữ ký/hash bí mật, và bỏ “Xuất chi tiết đối soát” nếu chưa có.
- Đơn liên kết cần hiện **hai trạng thái riêng**: thanh toán và xử lý. Với giao dịch thành công, tất cả đơn đều “Đã thanh toán” nhưng có thể ở những bước xử lý khác nhau. Với giao dịch thất bại/hết hạn, thể hiện các đơn tương ứng bị hủy, không có nút thao tác bằng tay. Khu này là **chỉ đọc** cho Quản trị viên.

### 10 — Banner

- Bỏ cột/trường **Vị trí, Liên kết, Thời gian, Thứ tự, Nhãn nút**. Bỏ trạng thái “Hoạt động/Sắp diễn ra”, thay bằng **Kích hoạt/Vô hiệu hóa** đúng `BannerQuangCao`. Không đặt lịch chạy 01–31/10 hoặc link `/khuyen-mai/thang-10` như dữ liệu hệ thống sẽ lưu.
- Danh sách banner cần ảnh thumbnail, tiêu đề, trích đoạn nội dung, trạng thái và thao tác Xem/Sửa/Kích hoạt/Vô hiệu hóa. Form tạo/sửa chỉ có **Tiêu đề, Hình ảnh, Nội dung, Trạng thái**. Nếu ảnh chưa tải, khu preview nên là trạng thái “Chưa có ảnh”, không dựng một banner chữ rồi gọi đó là bản hiển thị cuối của dữ liệu có `hinhAnh`.
- Bản preview đặt cạnh form hoặc ngay dưới ảnh, thể hiện đúng tỷ lệ và cách cắt ảnh của banner trên trang mua hàng. Không thêm nút CTA có thể bấm mà không có link lưu trong collection. Nếu cần một banner có CTA trong bản Figma Người mua, phải xác định link đích là quy tắc tĩnh của giao diện, không giả làm thuộc tính từng banner.
- Dùng từ “Vô hiệu hóa banner” thay cho “Ẩn banner” để khớp trạng thái; có dialog xác nhận và trạng thái sau lưu. Form hiện quá dài, nhiều khoảng trắng và chữ như văn bản tĩnh; làm input rõ ràng và có ảnh thực sự.

### 11 — Khuyến mãi toàn sàn

- Giữ danh sách chương trình nhưng đổi cột: **Tên chương trình, Loại (Giảm giá/Flash Sale nếu dùng), Phạm vi Toàn sàn, Thời gian, Trạng thái, số sản phẩm áp dụng, Xem/Sửa**. Không gọi giá trị “Giảm 5% tối đa 50.000đ” là thuộc tính chung của chương trình nếu trong schema tỷ lệ/giá áp dụng nằm ở từng `ChiTietKhuyenMai`.
- Bỏ “Phạm vi: Danh mục Sách/Đồ gia dụng” như một giá trị của `KhuyenMai.phamVi`; field này chỉ có **Cửa hàng/Toàn sàn**. Nếu muốn một chiến dịch nhắm sản phẩm trong danh mục Sách, dùng bộ lọc để **chọn những sản phẩm cụ thể** rồi tạo chi tiết áp dụng. Không tự áp cho mọi sản phẩm tương lai trong danh mục.
- Form tạo/sửa cần: tên, loại chương trình, phạm vi Toàn sàn (không cho admin tạo thay khuyến mãi Cửa hàng tại đây), ngày bắt đầu/kết thúc, danh sách sản phẩm chọn từ toàn sàn, mức giảm cho từng sản phẩm (tỷ lệ % hoặc giá khuyến mãi), giá xem trước. Không cho giá sau khuyến mãi âm hoặc cao hơn giá gốc, không ghi đè giá gốc.
- Bỏ **Giảm tối đa, Giá trị đơn tối thiểu, Quy tắc kết hợp với voucher, “mỗi đơn chỉ một ưu đãi toàn sàn”** khỏi form này. Chúng đang trộn với voucher hoặc quy tắc chưa được định nghĩa. Câu “Người mua xem ưu đãi tại bước thanh toán” cũng gây hiểu nhầm: giá khuyến mãi sản phẩm cần thể hiện từ danh sách/chi tiết sản phẩm đến giỏ/đặt hàng, và chốt ở đơn.
- Trạng thái đúng của chương trình là **Chưa bắt đầu / Đang hoạt động / Đã kết thúc**. Với ngày demo 16/10, chương trình 20–25/10 phải là Chưa bắt đầu, không phải “Sắp diễn ra” như dữ liệu. Nếu muốn nút “Dừng” chương trình giữa kỳ, cần làm rõ trạng thái lưu và quy tắc vô hiệu hóa; hiện schema không có trạng thái “Đã dừng”, nên bỏ nút đó khỏi luồng chính hoặc ghi là cần chốt.
- Flash Sale nếu muốn demo chỉ là một `loaiKhuyenMai` của chương trình, không tạo bảng Flash Sale riêng, hạn mức/đồng hồ đếm ngược/tồn riêng khi chưa có dữ liệu.

### 12 — Voucher Toàn sàn / Freeship

- Admin chỉ tạo voucher **Toàn sàn** và **Freeship**. Phân biệt rõ: voucher Toàn sàn giảm tiền hàng, Freeship giảm phí vận chuyển mô phỏng, không có hãng vận chuyển hay “phí vận chuyển thực tế”. `cuaHangId` để trống cho cả hai; không có loại Cửa hàng trong form này.
- Form cần đúng dữ liệu `Voucher`: mã (duy nhất), tên, loại, kiểu giảm **Phần trăm/Số tiền cố định**, giá trị giảm, giảm tối đa khi phù hợp, đơn tối thiểu, số lượng, thời gian, trạng thái **Kích hoạt/Vô hiệu hóa**. Khi chọn Freeship, giải thích mức giảm không vượt phí vận chuyển của đơn; đừng tự đặt “tối đa 1 mã trên giao dịch” hoặc “có thể kết hợp đúng 1 voucher cửa hàng” vì cách chia voucher khi nhiều shop chưa được quy định.
- Bỏ các trường “Lượt/Người mua: 2”, “Đối tượng: tất cả người mua” vì không có trong model. Dòng “215/1.000 đã dùng/giới hạn” chỉ có thể có nếu định nghĩa rõ `soLuong` là số ban đầu hay còn lại và đối chiếu `ApDungVoucher`; nếu demo chưa làm, thay bằng **số lượng còn có thể sử dụng** từ dữ liệu thật, không hứa một chỉ số gốc không được lưu.
- Bảng cần tách thao tác “Sửa/Xem” thành cột riêng, không ghép vào dòng Loại. Dùng chip trạng thái đúng enum. Voucher FREE20 vừa hết hạn thời gian vừa dùng 500/500 lượt: nếu giữ, chỉ nhãn “Hết hiệu lực” dạng diễn giải UI, không giả làm giá trị enum lưu trong `trangThai` nếu tài liệu chỉ ghi Kích hoạt/Vô hiệu hóa.
- Nút “Dừng phát hành” đổi thành “Vô hiệu hóa voucher” với xác nhận; lưu và hủy là hai hành động riêng. Form hiện một cột dài nhiều khoảng trống; chuyển thành các nhóm “Thông tin mã / Mức giảm / Điều kiện / Thời gian”, có preview tính giảm cho một ví dụ hợp lệ.

### 13 — Báo cáo doanh thu, đơn và sản phẩm

- Báo cáo hiện có một điểm đúng cần giữ: 40.000.000 + 62.000.000 + 84.240.000 = **186.240.000đ**, 80 + 100 + 140 = **320 đơn**, 180 + 230 + 330 = **740 sản phẩm**, và 186.240.000 / 320 = **582.000đ/đơn**. Bảng cửa hàng cũng cộng đúng tổng; khi sửa UI phải giữ tính nhất quán này. Tuy nhiên phải làm rõ **định nghĩa** của từng chỉ số.
- Không ghi “Đơn hoàn thành theo ngày hoàn thành” vì `DonHang` chỉ có `ngayTao`, chưa có ngày hoàn thành. Cách sửa trong phạm vi hiện tại: bộ lọc chọn ngày tạo, nhãn **“Đơn tạo trong kỳ, hiện đã hoàn thành”** và ghi chú tương tự cho doanh thu; hoặc thêm trường thời gian hoàn thành ở phần yêu cầu nghiệp vụ sau, không giả vờ đã có.
- Chia rõ **“Giá trị hàng bán trước voucher đơn”** = tổng `ChiTietDonHang.thanhTien` của các đơn đủ điều kiện, và **“Doanh thu hàng sau voucher, không gồm vận chuyển”** = tổng `DonHang.tongTienHang - DonHang.tongGiamVoucher` nếu báo cáo muốn con số sau voucher. Không dùng một nhãn “Doanh thu sản phẩm” cho cả hai. Voucher Freeship giảm phí vận chuyển, không trừ vào giá trị hàng bán.
- Bảng **sản phẩm bán chạy** lấy số lượng từ `ChiTietDonHang.soLuong` của các đơn hoàn thành. Tiền theo sản phẩm có thể dùng tổng `thanhTien` sau giá khuyến mãi **trước khi phân bổ voucher đơn**; không khẳng định đã trừ voucher Toàn sàn/Cửa hàng theo sản phẩm vì dữ liệu chưa có quy tắc chia giảm cho từng dòng. Ghi nhãn cột “Giá trị hàng bán” thay cho “Doanh thu ròng”.
- Báo cáo theo cửa hàng có thể so sánh số đơn, số lượng và doanh thu của từng `cuaHangId`; Quản trị viên được lọc tất cả cửa hàng hoặc một cửa hàng. Bỏ tìm kiếm “SKU” vì không có SKU. “Các cửa hàng khác” là nhóm tổng hợp, không đặt nút “Xem báo cáo” như thể đó là một cửa hàng riêng; dùng “Xem danh sách cửa hàng” hoặc chỉ cho dòng cửa hàng thật có nút.
- Tách khu **xu hướng theo thời gian**, **hiệu suất cửa hàng**, **sản phẩm bán chạy** bằng tiêu đề và khoảng cách. Nếu muốn “danh mục được quan tâm”, không dùng lượt xem vì không có sự kiện xem; chỉ có thể gọi “Danh mục có nhiều sản phẩm được mua” tính từ đơn hoàn thành. Không thêm doanh thu thuần/lợi nhuận/hoa hồng nếu chưa có dữ liệu.
- Bỏ hoặc cho nút “Xuất báo cáo CSV” một màn kết quả/prototype cụ thể. Có empty state khi kỳ lọc không có đơn. Các số trên dashboard 01 và báo cáo 13 phải dùng cùng kỳ và cùng định nghĩa.

## 4. Màn và trạng thái còn thiếu nên bổ sung

1. **14 — Cửa hàng toàn sàn: danh sách.** Sidebar thêm mục Cửa hàng. Bảng: tên cửa hàng, chủ sở hữu (link sang tài khoản), địa chỉ, trạng thái Hoạt động/Ngừng hoạt động, số sản phẩm và số đơn suy từ dữ liệu liên quan, nút Xem. Bộ lọc theo tên/chủ sở hữu/trạng thái. Không có email shop, ngân hàng, giấy tờ hay số điện thoại shop độc lập.
2. **15 — Chi tiết cửa hàng:** tên, mô tả, địa chỉ, trạng thái, tài khoản chủ sở hữu, link tới sản phẩm và báo cáo cửa hàng. Nếu Quản trị viên có quyền ngừng hoạt động cửa hàng theo nghiệp vụ, đặt hành động trong dialog xác nhận và nêu ảnh hưởng lên hiển thị bán hàng; không xóa cứng cửa hàng đã được đơn tham chiếu. Không để nút admin sửa giá/tồn kho của sản phẩm trong cửa hàng.
3. **Chi tiết sản phẩm để kiểm tra trước xử lý:** frame chỉ đọc từ màn 07 với ảnh, mô tả, giá gốc, giá hiện hành, tồn, cửa hàng, danh mục, trạng thái. Nút ngừng kinh doanh nằm sau phần xem chi tiết, có hộp xác nhận.
4. **Biến thể kết quả duyệt hồ sơ:** một frame đã phê duyệt, một frame đã từ chối, nút quyết định không còn khả dụng. Cho thấy vai trò Người bán được thêm nhưng vai trò Người dùng vẫn còn; duyệt cùng một hồ sơ lần hai không tạo cửa hàng/tài khoản trùng.
5. **Giao dịch theo bốn trạng thái:** Thành công, Chờ thanh toán, Thất bại, Hết hạn. Ở ba trạng thái sau, trạng thái đơn liên kết phù hợp và không có nút admin chuyển tay. Trường hợp Hết hạn phải có thời gian tạo cách thời điểm xét quá 24 giờ.
6. **Form tạo mới banner/khuyến mãi/voucher:** hiện bộ ảnh chỉ có form chỉnh sửa nằm dưới bảng. Tạo frame mới cho từng tác vụ, có trường thật, lỗi nhập liệu, Hủy/Lưu và trạng thái thành công. Banner phải có preview ảnh; khuyến mãi có chọn sản phẩm và mức giảm từng sản phẩm; voucher có hai nhánh Toàn sàn/Freeship.
7. **Trạng thái rỗng/lỗi chính:** không có hồ sơ chờ duyệt, không tìm thấy tài khoản/sản phẩm/giao dịch, chưa có banner, kỳ báo cáo rỗng, lỗi lưu form và xác nhận thao tác có ảnh hưởng. Làm dạng component/variant nếu Figma thuận tiện, không cần nhân bản toàn bộ trang.
8. **Màn đơn toàn sàn chỉ đọc nếu cần:** từ giao dịch có thể mở đơn liên kết để xem tiền và hai trạng thái. Không thêm chức năng quản trị cập nhật trạng thái xử lý đơn hoặc hoàn tiền.

## 5. Chuẩn hóa giao diện Figma và kiểm tra trước bàn giao

- Sidebar hiện để các mục như một danh sách dài, ít phân nhóm. Gom thành **Tổng quan**, **Tài khoản & Cửa hàng** (Tài khoản, Duyệt Người bán, Cửa hàng), **Danh mục & Sản phẩm**, **Giao dịch**, **Nội dung & Ưu đãi** (Banner, Khuyến mãi Toàn sàn, Voucher Toàn sàn/Freeship), **Báo cáo**. Giữ điều hướng “Về khu mua hàng” nhưng không làm người xem nhầm vai trò quản trị với vai trò người bán.
- Chữ bảng và mô tả đang nhỏ, nhạt; số dòng cao nhưng thưa, nhiều form giống một trang văn bản hơn là màn nhập liệu. Tăng kích thước chữ nội dung, tăng tương phản, giảm khoảng trắng vô dụng, thống nhất chiều cao input/button và chiều rộng cột. Số tiền căn phải; trạng thái dùng chip có chữ, không chỉ màu. Nút trong bảng có vùng bấm đủ lớn.
- Chỉ một CTA chính trên từng màn. Hành động khó đảo ngược như khóa tài khoản, từ chối hồ sơ, ngừng sản phẩm, vô hiệu hóa banner/voucher cần dialog xác nhận có tên đối tượng cụ thể. Nút “Lọc” phải hiển thị lọc nào đang áp dụng; có “Xóa bộ lọc”. Nếu trang chỉ đọc, không thêm CTA màu cam “Xuất” để trang có vẻ có hành động.
- Rà chéo ví dụ: **U-0001 Nguyễn Minh Anh** là cả Người dùng và Người bán, gắn cửa hàng Nhà Xinh by Minh Anh; **U-0006 Đặng Thảo My** là người gửi hồ sơ Gốm Mộc Studio; **SOOPI-TXN-1026-001** có đúng hai đơn 294.500đ và 228.700đ tổng 523.200đ; **SOOPI-TXN-1026-016** số tiền 294.500đ đúng ở dashboard và danh sách giao dịch; tồn tại một mock date chung 16/10/2026 cho các nhãn “hôm nay”, “gần đây”, “hết hạn”.
- Prototype tối thiểu: Dashboard → Hồ sơ chờ duyệt → Duyệt/Từ chối → Tài khoản/Cửa hàng; Tài khoản → Chi tiết → Khóa/Mở; Danh mục → Thêm/Sửa; Sản phẩm toàn sàn → Chi tiết → Ngừng kinh doanh; Giao dịch → Chi tiết → Đơn liên kết; Banner/Khuyến mãi/Voucher → Tạo/Sửa → Xem kết quả; Báo cáo → Lọc cửa hàng/kỳ.
- Sau sửa, kiểm tra không còn CCCD/ngân hàng/email shop, vai trò Người bán bị mất quyền mua, danh mục cha–con/ẩn, SKU như field riêng, ảnh banner bị bỏ trống, ưu đãi khuyến mãi bị trộn với voucher, hạn thanh toán dưới 24 giờ, admin sửa tay VNPay, hoàn tiền tự động, dữ liệu chữ ký lộ ra, thống kê theo thời gian hoàn thành không có timestamp. Chi tiết nào thật sự cần nhưng dữ liệu chưa hỗ trợ phải đặt ở ghi chú cuối file Figma: **“Cần xác nhận nghiệp vụ và bổ sung collection trước khi triển khai”**, không thể hiện như chức năng đã chốt.
