**3.2. Thiết kế cơ sở dữ liệu**

**3.2.1. Thiết kế các Collection**

Dựa vào biểu đồ lớp (Hình 3.72) gồm 19 lớp, cơ sở dữ liệu MongoDB của hệ thống Soopi được thiết kế thành 19 Collection, mỗi lớp tương ứng với một Collection. Các nguyên tắc thiết kế được áp dụng như sau:

- Mỗi Collection có một khóa chính (PK) là trường `idXxx` kiểu String, lấy đúng tên thuộc tính định danh trong biểu đồ lớp. Khi cài đặt, trường này được ánh xạ vào `_id` của MongoDB.
- Các thuộc tính của Collection được lấy đúng theo thuộc tính của lớp trong biểu đồ lớp. Phần bổ sung duy nhất là các **trường tham chiếu** (tên có dạng `xxxId`) sinh ra từ quan hệ giữa các lớp.
- Với quan hệ một-nhiều hoặc một-không/một, trường tham chiếu được đặt ở Collection phía "nhiều" (hoặc phía `0..1`), không lưu mảng ID ở phía "một" để tránh dư thừa và sai lệch dữ liệu.
- Các lớp chi tiết/thành phần (`ChiTietGioHang`, `ChiTietDonHang`, `TinNhan`) và các lớp trung gian (`ChiTietKhuyenMai`, `ApDungVoucher`) được tách thành Collection riêng, tham chiếu về Collection cha, vì chúng được truy vấn độc lập (cập nhật từng dòng giỏ hàng, thống kê sản phẩm bán chạy, phân trang tin nhắn), được các Collection khác tham chiếu tới (`DanhGia`, `YeuCauDoiTraKhieuNai` tham chiếu `ChiTietDonHang`) và có thể tăng số lượng không giới hạn.

**a. Thiết kế Collection Tài khoản**

**Bảng 3.25 - Collection TaiKhoan**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idTaiKhoan | String | ID của tài khoản (PK) |
| email | String | Email đăng nhập của tài khoản (duy nhất) |
| matKhau | String | Mật khẩu của tài khoản (lưu dạng đã mã hóa) |
| phienBanToken | Number | Bổ sung theo CR-04 ở F25: số phiên bản JWT, mặc định 0; tăng khi đổi/đặt lại mật khẩu để phiên cũ hết hiệu lực; không trả trong API |
| hoTen | String | Họ và tên |
| ngaySinh | Date | Ngày sinh |
| gioiTinh | String | Giới tính (Nam, Nữ, Khác) |
| soDienThoai | String | Số điện thoại |
| diaChiNhanHang | String | Địa chỉ nhận hàng của tài khoản |
| vaiTro | Array | Danh sách vai trò của tài khoản (Người dùng, Người bán, Quản trị viên). Tài khoản được duyệt bán hàng có đồng thời vai trò Người dùng và Người bán |
| trangThaiTaiKhoan | String | Trạng thái của tài khoản (Hoạt động, Bị khóa) |

**b. Thiết kế Collection Yêu cầu đăng ký Người bán**

**Bảng 3.26 - Collection YeuCauDangKyNguoiBan**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idYeuCau | String | ID của yêu cầu đăng ký Người bán (PK) |
| tenCuaHang | String | Tên cửa hàng dự kiến |
| moTaCuaHang | String | Mô tả cửa hàng dự kiến |
| diaChiCuaHang | String | Địa chỉ cửa hàng dự kiến |
| ngayGui | Date | Ngày gửi yêu cầu |
| trangThai | String | Trạng thái xét duyệt (Chờ phê duyệt, Đã phê duyệt, Đã từ chối) |
| taiKhoanId | String | ID của tài khoản gửi yêu cầu (tham chiếu tới TaiKhoan) |

**c. Thiết kế Collection Cửa hàng**

**Bảng 3.27 - Collection CuaHang**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idCuaHang | String | ID của cửa hàng (PK) |
| tenCuaHang | String | Tên cửa hàng |
| moTa | String | Mô tả cửa hàng |
| diaChi | String | Địa chỉ cửa hàng |
| trangThaiHoatDong | String | Trạng thái hoạt động của cửa hàng (Hoạt động, Ngừng hoạt động,...) |
| taiKhoanId | String | ID của tài khoản sở hữu cửa hàng (tham chiếu tới TaiKhoan, mỗi tài khoản có tối đa một cửa hàng) |

**d. Thiết kế Collection Danh mục**

**Bảng 3.28 - Collection DanhMuc**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idDanhMuc | String | ID của danh mục (PK) |
| tenDanhMuc | String | Tên danh mục sản phẩm |

**đ. Thiết kế Collection Sản phẩm**

**Bảng 3.29 - Collection SanPham**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idSanPham | String | ID của sản phẩm (PK) |
| tenSanPham | String | Tên sản phẩm |
| hinhAnh | Array | Danh sách hình ảnh của sản phẩm (đường dẫn ảnh) |
| moTa | String | Mô tả sản phẩm |
| giaGoc | Number | Giá gốc của sản phẩm (không bị ghi đè khi có khuyến mãi; giá sau khuyến mãi được lưu riêng trong ChiTietKhuyenMai) |
| soLuongTon | Number | Số lượng tồn kho của sản phẩm |
| trangThaiKinhDoanh | String | Trạng thái kinh doanh của sản phẩm (Đang kinh doanh, Ngừng kinh doanh,...) |
| cuaHangId | String | ID của cửa hàng bán sản phẩm (tham chiếu tới CuaHang) |
| danhMucId | String | ID của danh mục chứa sản phẩm (tham chiếu tới DanhMuc) |

**e. Thiết kế Collection Khuyến mãi**

**Bảng 3.30 - Collection KhuyenMai**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idKhuyenMai | String | ID của chương trình khuyến mãi (PK) |
| tenKhuyenMai | String | Tên chương trình khuyến mãi |
| loaiKhuyenMai | String | Loại chương trình khuyến mãi (Giảm giá, Flash Sale,...) |
| phamVi | String | Phạm vi áp dụng của chương trình (Cửa hàng, Toàn sàn) |
| ngayBatDau | Date | Ngày bắt đầu chương trình |
| ngayKetThuc | Date | Ngày kết thúc chương trình |
| trangThai | String | Trạng thái của chương trình (Chưa bắt đầu, Đang hoạt động, Đã kết thúc) |
| cuaHangId | String | ID của cửa hàng tạo chương trình (tham chiếu tới CuaHang; để trống nếu chương trình không gắn với cửa hàng) |

**g. Thiết kế Collection Chi tiết khuyến mãi**

**Bảng 3.31 - Collection ChiTietKhuyenMai**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idChiTietKhuyenMai | String | ID của chi tiết khuyến mãi (PK) |
| tyLeGiam | Number | Tỷ lệ giảm giá (%) của sản phẩm trong chương trình (dùng khi khuyến mãi theo tỷ lệ) |
| giaKhuyenMai | Number | Giá sau khuyến mãi của sản phẩm, nhỏ hơn hoặc bằng giá gốc (dùng khi khuyến mãi theo mức giá) |
| khuyenMaiId | String | ID của chương trình khuyến mãi (tham chiếu tới KhuyenMai) |
| sanPhamId | String | ID của sản phẩm được khuyến mãi (tham chiếu tới SanPham) |

**h. Thiết kế Collection Voucher**

**Bảng 3.32 - Collection Voucher**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idVoucher | String | ID của voucher (PK) |
| maVoucher | String | Mã voucher để Người dùng nhập khi đặt hàng (duy nhất) |
| tenVoucher | String | Tên voucher |
| loaiVoucher | String | Loại voucher (Freeship, Toàn sàn, Cửa hàng) |
| kieuGiam | String | Kiểu giảm của voucher (Phần trăm, Số tiền cố định) |
| giaTriGiam | Number | Giá trị giảm (theo phần trăm hoặc theo số tiền tùy kieuGiam) |
| giamToiDa | Number | Mức giảm tối đa của voucher |
| giaTriDonToiThieu | Number | Giá trị đơn hàng tối thiểu để được áp dụng voucher |
| soLuong | Number | Số lượng voucher có thể sử dụng |
| ngayBatDau | Date | Ngày bắt đầu hiệu lực |
| ngayKetThuc | Date | Ngày kết thúc hiệu lực |
| trangThai | String | Trạng thái của voucher (Kích hoạt, Vô hiệu hóa,...) |
| cuaHangId | String | ID của cửa hàng tạo voucher (tham chiếu tới CuaHang; để trống với voucher Toàn sàn và Freeship do Quản trị viên tạo) |

**i. Thiết kế Collection Áp dụng voucher**

**Bảng 3.33 - Collection ApDungVoucher**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idApDungVoucher | String | ID của bản ghi áp dụng voucher (PK) |
| giaTriGiamThucTe | Number | Giá trị giảm thực tế của voucher tại thời điểm áp dụng |
| thoiGianApDung | Date | Thời gian áp dụng voucher vào đơn hàng |
| voucherId | String | ID của voucher được áp dụng (tham chiếu tới Voucher) |
| donHangId | String | ID của đơn hàng được áp dụng voucher (tham chiếu tới DonHang) |

**k. Thiết kế Collection Banner quảng cáo**

**Bảng 3.34 - Collection BannerQuangCao**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idBanner | String | ID của banner quảng cáo (PK) |
| tieuDe | String | Tiêu đề banner |
| hinhAnh | String | Hình ảnh của banner (đường dẫn ảnh) |
| noiDung | String | Nội dung banner |
| trangThai | String | Trạng thái hiển thị của banner (Kích hoạt, Vô hiệu hóa) |

**l. Thiết kế Collection Giỏ hàng**

**Bảng 3.35 - Collection GioHang**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idGioHang | String | ID của giỏ hàng (PK) |
| tongGiaTri | Number | Tổng giá trị giỏ hàng (tự tính lại khi thay đổi số lượng hoặc giá sản phẩm) |
| taiKhoanId | String | ID của tài khoản sở hữu giỏ hàng (tham chiếu tới TaiKhoan, mỗi tài khoản có tối đa một giỏ hàng) |

**m. Thiết kế Collection Chi tiết giỏ hàng**

**Bảng 3.36 - Collection ChiTietGioHang**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idChiTietGioHang | String | ID của chi tiết giỏ hàng (PK) |
| soLuong | Number | Số lượng sản phẩm trong giỏ hàng |
| duocChon | Boolean | Sản phẩm có được chọn để đặt hàng hay không (true: được chọn) |
| gioHangId | String | ID của giỏ hàng chứa dòng sản phẩm (tham chiếu tới GioHang) |
| sanPhamId | String | ID của sản phẩm trong giỏ hàng (tham chiếu tới SanPham) |

**n. Thiết kế Collection Đơn hàng**

**Bảng 3.37 - Collection DonHang**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idDonHang | String | ID của đơn hàng (PK) |
| diaChiNhanHang | String | Địa chỉ nhận hàng của đơn (lưu lại tại thời điểm đặt hàng) |
| tongTienHang | Number | Tổng tiền hàng của các sản phẩm trong đơn |
| tongGiamVoucher | Number | Tổng giá trị giảm từ các voucher Toàn sàn và Cửa hàng |
| phiVanChuyen | Number | Phí vận chuyển của đơn (giá trị mô phỏng) |
| giamPhiVanChuyen | Number | Giá trị giảm phí vận chuyển (từ voucher Freeship) |
| tongThanhToan | Number | Tổng số tiền cần thanh toán (tổng tiền hàng - giảm voucher + phí vận chuyển - giảm phí vận chuyển) |
| phuongThucThanhToan | String | Phương thức thanh toán của đơn (VNPay) |
| trangThaiThanhToan | String | Trạng thái thanh toán của đơn (Chờ thanh toán, Đã thanh toán, Thất bại, Hết hạn) |
| trangThaiXuLy | String | Trạng thái xử lý đơn (Chờ xác nhận, Đã xác nhận, Đang xử lý, Đang vận chuyển, Hoàn thành, Đã hủy) |
| ngayTao | Date | Ngày tạo đơn hàng |
| taiKhoanId | String | ID của tài khoản đặt hàng (tham chiếu tới TaiKhoan) |
| cuaHangId | String | ID của cửa hàng nhận đơn (tham chiếu tới CuaHang) |
| giaoDichId | String | ID của giao dịch thanh toán chứa đơn hàng (tham chiếu tới GiaoDichThanhToan) |

**o. Thiết kế Collection Chi tiết đơn hàng**

**Bảng 3.38 - Collection ChiTietDonHang**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idChiTietDonHang | String | ID của chi tiết đơn hàng (PK) |
| soLuong | Number | Số lượng sản phẩm đã đặt |
| giaGocTaiThoiDiemDat | Number | Giá gốc của sản phẩm tại thời điểm đặt hàng |
| giaBanThucTe | Number | Giá bán thực tế của sản phẩm tại thời điểm đặt hàng (giá sau khuyến mãi nếu có) |
| thanhTien | Number | Thành tiền của dòng sản phẩm (soLuong x giaBanThucTe) |
| donHangId | String | ID của đơn hàng chứa dòng sản phẩm (tham chiếu tới DonHang) |
| sanPhamId | String | ID của sản phẩm được đặt (tham chiếu tới SanPham) |

**p. Thiết kế Collection Giao dịch thanh toán**

**Bảng 3.39 - Collection GiaoDichThanhToan**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idGiaoDich | String | ID của giao dịch thanh toán (PK) |
| maGiaoDich | String | Mã giao dịch dùng để đối chiếu với cổng thanh toán VNPay (duy nhất) |
| soTien | Number | Số tiền của giao dịch (tổng số tiền thanh toán của các đơn hàng thuộc giao dịch) |
| phuongThucThanhToan | String | Phương thức thanh toán (VNPay) |
| trangThaiThanhToan | String | Trạng thái của giao dịch (Chờ thanh toán, Thành công, Thất bại, Hết hạn) |
| thoiGianTao | Date | Thời gian tạo giao dịch |
| thoiGianHoanTat | Date | Thời gian giao dịch hoàn tất (để trống khi giao dịch chưa hoàn tất) |

**q. Thiết kế Collection Đánh giá**

**Bảng 3.40 - Collection DanhGia**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idDanhGia | String | ID của đánh giá (PK) |
| soSao | Number | Số sao đánh giá sản phẩm |
| noiDung | String | Nội dung đánh giá, bình luận |
| ngayDanhGia | Date | Ngày đánh giá |
| taiKhoanId | String | ID của tài khoản đánh giá (tham chiếu tới TaiKhoan) |
| sanPhamId | String | ID của sản phẩm được đánh giá (tham chiếu tới SanPham) |
| chiTietDonHangId | String | ID của chi tiết đơn hàng mà đánh giá gắn với (tham chiếu tới ChiTietDonHang, mỗi chi tiết đơn hàng có tối đa một đánh giá) |

**r. Thiết kế Collection Yêu cầu đổi trả/khiếu nại**

**Bảng 3.41 - Collection YeuCauDoiTraKhieuNai**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idYeuCau | String | ID của yêu cầu đổi trả/khiếu nại (PK) |
| loaiYeuCau | String | Loại yêu cầu (Đổi trả, Khiếu nại) |
| noiDung | String | Lý do đổi trả hoặc nội dung khiếu nại |
| trangThaiXuLy | String | Trạng thái xử lý của yêu cầu (Chờ xử lý, Đã xử lý,...) |
| ketQuaXuLy | String | Kết quả xử lý của Người bán (Chấp nhận, Từ chối; để trống khi chưa xử lý) |
| ngayTao | Date | Ngày gửi yêu cầu |
| chiTietDonHangId | String | ID của chi tiết đơn hàng phát sinh yêu cầu (tham chiếu tới ChiTietDonHang, mỗi chi tiết đơn hàng có tối đa một yêu cầu) |

**s. Thiết kế Collection Cuộc trò chuyện**

**Bảng 3.42 - Collection CuocTroChuyen**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idCuocTroChuyen | String | ID của cuộc trò chuyện (PK) |
| thoiGianBatDau | Date | Thời gian bắt đầu cuộc trò chuyện |
| thoiGianCapNhat | Date | Thời gian cập nhật gần nhất của cuộc trò chuyện |
| taiKhoanId | String | ID của tài khoản Người dùng tham gia trò chuyện (tham chiếu tới TaiKhoan) |
| cuaHangId | String | ID của cửa hàng tham gia trò chuyện (tham chiếu tới CuaHang) |

**t. Thiết kế Collection Tin nhắn**

**Bảng 3.43 - Collection TinNhan**

| Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| --- | --- | --- |
| idTinNhan | String | ID của tin nhắn (PK) |
| noiDung | String | Nội dung tin nhắn |
| thoiGianGui | Date | Thời gian gửi tin nhắn |
| cuocTroChuyenId | String | ID của cuộc trò chuyện chứa tin nhắn (tham chiếu tới CuocTroChuyen) |
| nguoiGuiId | String | ID của tài khoản gửi tin nhắn (tham chiếu tới TaiKhoan) |

---

**Bảng tổng hợp các trường tham chiếu giữa các Collection (đối chiếu với 26 quan hệ trong Hình 3.72)**

**Bảng 3.44 - Tổng hợp quan hệ và trường tham chiếu**

| STT | Quan hệ trong biểu đồ lớp | Trường tham chiếu | Ghi chú |
| ---: | --- | --- | --- |
| 1 | TaiKhoan 1 - 0..1 CuaHang | CuaHang.taiKhoanId | Duy nhất |
| 2 | TaiKhoan 1 - 0..* YeuCauDangKyNguoiBan | YeuCauDangKyNguoiBan.taiKhoanId | |
| 3 | CuaHang 1 - 0..* SanPham | SanPham.cuaHangId | |
| 4 | DanhMuc 1 - 0..* SanPham | SanPham.danhMucId | |
| 5 | CuaHang 0..1 - 0..* KhuyenMai | KhuyenMai.cuaHangId | Có thể rỗng |
| 6 | KhuyenMai 1 - 1..* ChiTietKhuyenMai | ChiTietKhuyenMai.khuyenMaiId | |
| 7 | SanPham 1 - 0..* ChiTietKhuyenMai | ChiTietKhuyenMai.sanPhamId | |
| 8 | CuaHang 0..1 - 0..* Voucher | Voucher.cuaHangId | Có thể rỗng |
| 9 | Voucher 1 - 0..* ApDungVoucher | ApDungVoucher.voucherId | |
| 10 | DonHang 1 - 0..* ApDungVoucher | ApDungVoucher.donHangId | |
| 11 | TaiKhoan 1 - 0..1 GioHang | GioHang.taiKhoanId | Duy nhất |
| 12 | GioHang 1 - 0..* ChiTietGioHang | ChiTietGioHang.gioHangId | Quan hệ thành phần |
| 13 | SanPham 1 - 0..* ChiTietGioHang | ChiTietGioHang.sanPhamId | |
| 14 | TaiKhoan 1 - 0..* DonHang | DonHang.taiKhoanId | |
| 15 | CuaHang 1 - 0..* DonHang | DonHang.cuaHangId | |
| 16 | DonHang 1 - 1..* ChiTietDonHang | ChiTietDonHang.donHangId | Quan hệ thành phần |
| 17 | SanPham 1 - 0..* ChiTietDonHang | ChiTietDonHang.sanPhamId | |
| 18 | GiaoDichThanhToan 1 - 1..* DonHang | DonHang.giaoDichId | Một giao dịch gồm nhiều đơn |
| 19 | TaiKhoan 1 - 0..* DanhGia | DanhGia.taiKhoanId | |
| 20 | SanPham 1 - 0..* DanhGia | DanhGia.sanPhamId | |
| 21 | ChiTietDonHang 1 - 0..1 DanhGia | DanhGia.chiTietDonHangId | Duy nhất |
| 22 | ChiTietDonHang 1 - 0..1 YeuCauDoiTraKhieuNai | YeuCauDoiTraKhieuNai.chiTietDonHangId | Duy nhất |
| 23 | TaiKhoan 1 - 0..* CuocTroChuyen | CuocTroChuyen.taiKhoanId | |
| 24 | CuaHang 1 - 0..* CuocTroChuyen | CuocTroChuyen.cuaHangId | |
| 25 | CuocTroChuyen 1 - 1..* TinNhan | TinNhan.cuocTroChuyenId | Quan hệ thành phần |
| 26 | TaiKhoan 1 - 0..* TinNhan | TinNhan.nguoiGuiId | Người gửi tin nhắn |

**Bảng 3.45 - Chỉ mục và ràng buộc dữ liệu đề xuất**

| Collection | Trường | Loại | Mục đích |
| --- | --- | --- | --- |
| TaiKhoan | email | Unique | Mỗi email chỉ đăng ký một tài khoản; phục vụ đăng nhập |
| CuaHang | taiKhoanId | Unique | Mỗi tài khoản có tối đa một cửa hàng |
| SanPham | cuaHangId | Index | Người bán xem sản phẩm thuộc cửa hàng của mình |
| SanPham | danhMucId | Index | Lọc sản phẩm theo danh mục |
| SanPham | tenSanPham | Text | Tìm kiếm sản phẩm theo tên |
| ChiTietKhuyenMai | khuyenMaiId, sanPhamId | Index | Tra giá khuyến mãi đang hiệu lực của sản phẩm |
| Voucher | maVoucher | Unique | Mỗi mã voucher là duy nhất |
| ApDungVoucher | donHangId | Index | Lấy các voucher đã áp dụng của một đơn hàng |
| GioHang | taiKhoanId | Unique | Mỗi tài khoản có tối đa một giỏ hàng |
| ChiTietGioHang | gioHangId, sanPhamId | Unique (kết hợp) | Một sản phẩm chỉ xuất hiện một dòng trong giỏ, thêm lại thì tăng số lượng |
| DonHang | taiKhoanId, ngayTao | Index | Lịch sử đơn hàng của Người dùng |
| DonHang | cuaHangId, ngayTao | Index | Đơn hàng và doanh thu của cửa hàng theo thời gian |
| DonHang | giaoDichId | Index | Lấy các đơn hàng thuộc cùng một giao dịch thanh toán |
| ChiTietDonHang | donHangId | Index | Lấy chi tiết của một đơn hàng |
| ChiTietDonHang | sanPhamId | Index | Thống kê sản phẩm bán chạy |
| GiaoDichThanhToan | maGiaoDich | Unique | Đối chiếu kết quả trả về từ VNPay |
| DanhGia | chiTietDonHangId | Unique | Mỗi chi tiết đơn hàng chỉ được đánh giá một lần |
| DanhGia | sanPhamId | Index | Hiển thị đánh giá của sản phẩm |
| YeuCauDoiTraKhieuNai | chiTietDonHangId | Unique | Mỗi chi tiết đơn hàng có tối đa một yêu cầu |
| CuocTroChuyen | taiKhoanId, cuaHangId | Index | Tìm cuộc trò chuyện giữa Người dùng và cửa hàng |
| TinNhan | cuocTroChuyenId, thoiGianGui | Index | Lấy và phân trang tin nhắn theo thời gian |
