# Yêu cầu kiểm định và chỉnh sửa giao diện Người mua Soopi trên Figma

> Tài liệu này là đặc tả **khu vực Người mua** của bản demo Figma Soopi. Sửa trực tiếp 20 màn hiện có và bổ sung các frame/trạng thái thiếu. Hai vai trò còn lại được đặc tả trong hai file Markdown riêng. Kết quả cần là **frame Figma có thể biên tập và prototype đi được**, không phải code hay bản nhận xét.

## Phạm vi theo màn

| Màn | Khu vực cần rà soát |
|---|---|
| 01, 07–08 | Trang chủ, tìm kiếm, danh sách và chi tiết sản phẩm |
| 02–06 | Đăng nhập, đăng ký, quên mật khẩu, tài khoản |
| 09–10 | Giỏ hàng, voucher, xác nhận đặt hàng |
| 11–14 | Chuyển hướng VNPay và kết quả thanh toán |
| 15–16 | Lịch sử và chi tiết đơn hàng |
| 17–19 | Đổi trả/khiếu nại, đánh giá, tin nhắn |
| 20 | Đăng ký trở thành Người bán |

## 1. Mục tiêu và nguyên tắc

### Kết quả cần tạo

Hãy kiểm định và CHỈNH SỬA TRỰC TIẾP khu vực User/Người mua trong file Figma Soopi hiện tại. Kiểm tra 20 màn 01–20 đã có, giữ phần đúng, sửa phần sai, tạo thêm màn hoặc trạng thái thật sự thiếu. Tôi cần kết quả là các frame Figma có thể biên tập, không phải bản nhận xét hay kế hoạch. Bám báo cáo Soopi, đặc biệt mục 3.1, thiết kế 19 collection và quy tắc nghiệp vụ trong AGENTS.md. Ưu tiên đúng chức năng, đủ luồng, dễ dùng, dễ làm bằng React hơn chi tiết trang trí.

### Phạm vi và phong cách

Đây là sàn nhiều người bán, có ba vai trò Người dùng, Người bán, Quản trị viên. Một tài khoản được duyệt bán hàng vẫn giữ vai trò Người dùng. File này đặc tả riêng khu vực Người mua; hai khu vực Người bán và Quản trị viên được xử lý trong hai file Markdown đi kèm. Không xóa màn của vai trò khác. Giữ phong cách trắng, xám nhạt, cam Soopi, desktop khoảng 1440 px. Sử dụng Auto Layout, component tái dùng và chữ tiếng Việt có dấu. Mỗi màn có tiêu đề rõ để đối chiếu báo cáo, nhưng số thứ tự “01, 02…” chỉ nên là tên frame trong Figma, không phải tiêu đề lớn của website thật.

### Luồng cần rà soát

Trước khi vẽ, tự rà luồng: khám phá → sản phẩm → giỏ → đặt hàng → VNPay → kết quả → lịch sử/chi tiết đơn → đánh giá, khiếu nại hoặc nhắn tin. Không tạo chức năng, dữ liệu, cam kết dịch vụ hoặc trạng thái mà báo cáo và collection không hỗ trợ.

## 2. Tài khoản và địa chỉ

### Đăng nhập và đăng ký

Sửa màn 02–06. Báo cáo mô tả đăng nhập bằng EMAIL và mật khẩu; đổi nhãn “Email hoặc số điện thoại” thành “Email”. Đăng ký cũng yêu cầu email riêng, không gộp “email hoặc số điện thoại” vào một trường. TaiKhoan có email duy nhất, matKhau, hoTen, ngaySinh, gioiTinh, soDienThoai, diaChiNhanHang, vaiTro và trangThaiTaiKhoan. Không hiển thị hoặc trả lại mật khẩu đã lưu. Bổ sung trạng thái nhập sai, email đã tồn tại, tài khoản “Bị khóa”, thiếu trường và thông báo đăng ký thành công.

### Quên mật khẩu

Màn 04–05 đang tự quyết cơ chế gửi link đặt lại mật khẩu, hiệu lực 15 phút và đếm ngược gửi lại. Cơ chế quên mật khẩu chưa được dự án chốt: giữ màn như phương án thiết kế có chú thích “cần xác nhận cơ chế với nhóm”, bỏ các cam kết thời gian và xác minh không có trong tài liệu. Không mặc định OTP, SMS hoặc đăng nhập mạng xã hội.

### Hồ sơ và địa chỉ nhận hàng

Màn 06 đang có “Tên hiển thị”, email/số điện thoại “đã xác minh”, và “Sổ địa chỉ” nhiều địa chỉ. Collection TaiKhoan chỉ có hoTen và một diaChiNhanHang dạng chuỗi; bỏ tên hiển thị và sổ địa chỉ nhiều bản ghi. Thiết kế một địa chỉ nhận hàng mặc định có thể sửa, cùng lựa chọn nhập địa chỉ cho lần đặt hàng nếu cần. Địa chỉ đã dùng phải được giữ nguyên trong DonHang. Không tự tạo bảng địa chỉ mới. Đừng đặt support@soopi.vn như địa chỉ hỗ trợ thật nếu nhóm chưa cung cấp.

## 3. Trang chủ, tìm kiếm, sản phẩm và cửa hàng

### Trang chủ và dữ liệu minh họa

Rà màn 01, 07, 08. Màn trang chủ hiện có chỗ tiêu đề đè lên phụ đề; ảnh thẻ sản phẩm ở trang chủ trống trong khi các màn sau dùng hình minh họa. Sửa căn lề, kích thước chữ, khoảng cách, nút CTA và ảnh cho nhất quán. Banner phải có nội dung phù hợp BannerQuangCao hoặc chương trình khuyến mãi thật; tránh khẩu hiệu “ưu đãi tháng 10” cố định nếu dữ liệu không có. Không dùng chỉ số bán hàng hoặc đánh giá lặp y hệt trên mọi sản phẩm làm dữ liệu giả lộ rõ.

### Tìm kiếm và danh sách sản phẩm

Danh sách sản phẩm cần trạng thái kết quả tìm kiếm, không có kết quả, lọc theo danh mục/giá và phân trang hợp lý. Chỉ hiện các sản phẩm “Đang kinh doanh”; giá khuyến mãi lấy từ chương trình còn hiệu lực, giá gốc hiển thị riêng. Kiểm tra số lượng kết quả, trang hiện tại và dữ liệu mẫu khớp nhau.

### Chi tiết sản phẩm và trang cửa hàng

SanPham hiện có tên, hình ảnh, mô tả, giaGoc, soLuongTon, trạng thái, cửa hàng và danh mục; KHÔNG có biến thể màu/kích cỡ. Màn 08 và giỏ đang cho chọn “Đen 24 cm/Đen 28 cm”, “Kem 500 ml”; hãy biểu diễn chúng thành các sản phẩm riêng nếu cần, hoặc bỏ lựa chọn biến thể. Sửa trạng thái hết hàng: không cho tăng số lượng hay mua vượt tồn. Bỏ huy hiệu “Cửa hàng đã xác minh” vì CuaHang không có trạng thái xác minh. Nút “Xem cửa hàng” hiện chưa có đích: thêm trang cửa hàng công khai tối giản, gồm tên, mô tả, địa chỉ và sản phẩm đang kinh doanh; nút liên hệ mở Tin nhắn.

## 4. Email shop và đăng ký người bán

### Nguồn dữ liệu của email liên hệ

Đặc biệt xử lý đúng “email shop”. CuaHang KHÔNG có trường email hoặc số điện thoại riêng; CuaHang chỉ có tenCuaHang, moTa, diaChi, trangThaiHoatDong và taiKhoanId trỏ tới TaiKhoan chủ cửa hàng. YeuCauDangKyNguoiBan chỉ lưu tenCuaHang, moTaCuaHang, diaChiCuaHang, ngayGui, trangThai và taiKhoanId. Không tạo “email liên hệ shop”, “xác minh email shop” hay dùng email người mua rồi gọi đó là email riêng của shop. Nếu thật sự cần hiển thị email liên hệ, chỉ ghi rõ “Email tài khoản chủ cửa hàng”, lấy từ TaiKhoan liên kết và chỉ khi nhóm xác nhận muốn công khai; mặc định ưu tiên nút nhắn tin cho shop.

### Biểu mẫu đăng ký Người bán

Thiết kế lại toàn bộ màn 20 theo đúng dữ liệu đăng ký: tên cửa hàng dự kiến, mô tả, địa chỉ cửa hàng, nút gửi yêu cầu, trạng thái xét duyệt “Chờ phê duyệt”, “Đã phê duyệt”, “Đã từ chối”. Bỏ loại hình kinh doanh, CCCD, ảnh giấy tờ, mã số thuế, tài khoản nhận tiền, xác minh email/số điện thoại shop, lưu bản nháp và các bước “xác minh người đại diện” vì project chưa có collection/field và quy trình tương ứng.

### Trạng thái yêu cầu và vai trò

Nếu đã có yêu cầu đang chờ hoặc tài khoản đã có vai trò Người bán, không cho gửi yêu cầu trùng; hiện thông báo và đường dẫn phù hợp. Sau khi duyệt, tài khoản có cả vai trò Người dùng lẫn Người bán, không biến thành tài khoản mua hàng khác.

## 5. Giỏ hàng và chọn voucher

### Chọn sản phẩm và tính tạm tính

Thiết kế lại màn 09 theo cách mua hàng thực tế. Một tài khoản có một GioHang; mỗi sản phẩm một dòng ChiTietGioHang; thêm lại cùng sản phẩm thì tăng số lượng. Checkbox chọn tất cả, chọn theo cửa hàng, chọn từng dòng phải rõ quan hệ và trạng thái. Chỉ các dòng duocChon=true được đưa vào đặt hàng. Hiện lỗi sản phẩm ngừng kinh doanh, hết hàng, số lượng vượt tồn; khi thay số lượng hoặc chọn/bỏ chọn, cập nhật tổng của những dòng đã chọn. Không hiển thị một “tổng thanh toán” chắc chắn ở giỏ khi phí giao hàng/voucher chưa được backend kiểm tra ở bước đặt hàng; dùng “Tạm tính” và chú thích tổng cuối được xác nhận sau.

### Điểm chọn voucher

Voucher hiện bị rải ở từng shop, một danh sách “đã áp dụng” phía dưới và một bảng trừ tiền bên phải nên khó biết chọn ở đâu. Tạo một khu “Chọn voucher” rõ ràng: voucher cửa hàng gắn đúng shop; voucher Toàn sàn và Freeship gắn phạm vi phù hợp. Nút chọn/đổi/xóa mở modal hoặc drawer có các tab tương ứng, mã, mức giảm, đơn tối thiểu, hạn dùng, trạng thái đủ/chưa đủ điều kiện và lý do vô hiệu. Hiển thị số tiền giảm THỰC TẾ sau khi server kiểm tra, không xem mã nhập là đã áp dụng.

### Giới hạn và phân bổ voucher

Bỏ câu “Mỗi nhóm dùng 1 voucher” vì dự án chưa quy định giới hạn đó. Không tự đặt cách chia voucher Toàn sàn/Freeship khi giỏ tách nhiều đơn. Thiết kế phải thể hiện kết quả phân bổ do backend trả về cho từng đơn và tổng giao dịch.

## 6. Đặt hàng và kiểm tra tiền

### Tách đơn theo cửa hàng

Sửa màn 10 thành bước xác nhận cuối trước khi tạo đơn và chuyển VNPay. Người dùng chỉ thấy các sản phẩm đã chọn. Nếu giỏ có hai cửa hàng, phải thấy hai DonHang riêng, mỗi đơn có sản phẩm, số lượng, giá tại lúc đặt, địa chỉ nhận, phí vận chuyển mô phỏng và voucher thuộc đơn. Cùng một lần thanh toán chỉ có một GiaoDichThanhToan. Địa chỉ nhận hàng cho đơn được chụp lại tại lúc đặt; sửa địa chỉ tài khoản sau này không đổi đơn cũ.

### Công thức và dữ liệu mẫu

Trình bày giá đủ rõ: giá gốc và giá bán thực tế của từng dòng; thành tiền = số lượng × giá bán thực tế. Với mỗi đơn: tongThanhToan = tongTienHang − tongGiamVoucher + phiVanChuyen − giamPhiVanChuyen. Tổng VNPay = tổng tongThanhToan của các đơn. Voucher Freeship giảm phí giao hàng, không trừ nhầm vào tiền hàng; không cho giảm quá phí thực tế. Tiền VND là số nguyên, không âm. Dùng một bộ dữ liệu mẫu nhất quán xuyên suốt màn 09–16; kiểm tra phép cộng ở tổng từng shop và tổng thanh toán chung.

### Phương thức thanh toán

Màn “Phương thức thanh toán” chỉ có VNPay, nên không dùng checkbox/radio gợi cảm giác có nhiều lựa chọn. Đổi thành một hàng thông tin “Thanh toán trực tuyến qua VNPay” cùng giải thích ngắn, nút chính “Xác nhận đặt hàng và đến VNPay”. Phí vận chuyển chỉ là mô phỏng; bỏ tên hãng giao hàng, mã vận đơn, ngày giao cam kết hoặc dự báo chính xác nếu không có dữ liệu hỗ trợ.

## 7. VNPay và các kết quả thanh toán

### Màn chuyển hướng VNPay

Thiết kế lại màn 11. Soopi CHỈ tích hợp VNPay; đừng dựng giao diện tự chọn “thẻ thanh toán quốc tế”, Visa/Mastercard/JCB, tài khoản ngân hàng hay biểu mẫu số thẻ/CVV trong trang Soopi. Những cách trả tiền bên trong cổng VNPay, nếu có, thuộc giao diện của VNPay chứ không phải một phương thức riêng trong project. Màn Soopi nên là trạng thái chuyển hướng ngắn: mã giao dịch, số tiền, số đơn liên kết, hướng dẫn kiểm tra số tiền và nút “Tiếp tục tới VNPay”. Nếu muốn minh họa cổng ngoài, dùng frame tách biệt có nhãn rõ “minh họa bên ngoài Soopi”, không giả làm trang checkout do Soopi quản lý.

### Thời hạn giao dịch

Bỏ bộ đếm “14:32” đi kèm mốc hết hạn ngày hôm sau vì gây mâu thuẫn. Quy tắc dự án: giao dịch Chờ thanh toán quá 24 giờ từ khi tạo thì Hết hạn và các đơn liên quan bị hủy. Không nhầm thời gian phiên trên cổng VNPay với hạn 24 giờ của đơn.

### Thành công, thất bại và chờ kết quả

Màn 12 chỉ báo “Thành công” khi Soopi đã xác thực kết quả VNPay. Giao dịch Thành công, các đơn Đã thanh toán nhưng xử lý đơn vẫn “Chờ xác nhận” cho tới khi người bán xác nhận. Màn 13 khi kết quả Thất bại/Hết hạn phải hiện các đơn “Đã hủy”, không để “Chờ thanh toán”; bỏ nút thử lại trên chính giao dịch đã kết thúc. Cho quay về giỏ/mua lại như một luồng mới. Màn 14 là “Chờ kết quả VNPay”, chỉ là trạng thái giao diện; trạng thái lưu vẫn “Chờ thanh toán”. Có nút kiểm tra lại, tránh khuyến khích trả tiền lần hai khi kết quả chưa rõ.

## 8. Lịch sử, chi tiết và trạng thái đơn

### Hai loại trạng thái độc lập

Sửa màn 15–16 để trạng thái đúng collection và rõ hai chiều độc lập. DonHang.trangThaiThanhToan: “Chờ thanh toán”, “Đã thanh toán”, “Thất bại”, “Hết hạn”. DonHang.trangThaiXuLy: “Chờ xác nhận”, “Đã xác nhận”, “Đang xử lý”, “Đang vận chuyển”, “Hoàn thành”, “Đã hủy”. Giao dịch có “Chờ thanh toán”, “Thành công”, “Thất bại”, “Hết hạn”. Không dùng “Đang chuẩn bị”, “Đang giao”, “Đã giao”, “Đã nhận hàng”, “Đã xác minh” như trạng thái dữ liệu mới. Nếu cần chữ thân thiện, ghi phụ đề giải thích dưới enum chính, không thay thế enum.

### Lịch sử đơn và dữ liệu đã chốt

Ở màn thành công thanh toán, đừng tô ngay hai đơn là “Đã xác nhận”: đó là thao tác của Người bán sau thanh toán. Lịch sử phải lọc/tìm theo trạng thái thật, có trường hợp chưa có đơn, có đơn hủy và có giao dịch đang chờ. Mỗi DonHang có mã riêng; cùng giao dịch hiển thị mã giao dịch chung và liên kết đến đơn còn lại, nhưng tổng từng đơn vẫn riêng. Địa chỉ, giá gốc tại thời điểm đặt và giá bán thực tế là bản chụp, không đổi theo giá sản phẩm hiện tại.

### Timeline và hành động của Người mua

Màn 16 hiện timeline có bước “Đã giao”, nút “Đã nhận hàng” và đánh giá ngay khi đơn chưa Hoàn thành. Đổi timeline sang đúng chuỗi xử lý; chỉ hiện bước đã có dữ liệu, không tạo sự kiện giao hàng thực hay quyền người mua xác nhận nhận hàng nếu project chưa quy định. Chỉ cho đánh giá khi đơn Hoàn thành. Không cho người mua tự hủy nếu nhóm chưa chốt nghiệp vụ này.

## 9. Đổi trả, đánh giá và tin nhắn

### Đổi trả và khiếu nại

Sửa màn 17, 18, 19. YeuCauDoiTraKhieuNai gắn với MỘT ChiTietDonHang, tối đa một yêu cầu cho mỗi dòng hàng; gồm loaiYeuCau “Đổi trả” hoặc “Khiếu nại”, noiDung, trangThaiXuLy, ketQuaXuLy “Chấp nhận”/“Từ chối”, ngayTao. Cho chọn đúng dòng sản phẩm thuộc đơn của mình, xem trạng thái và kết quả người bán xử lý. Bỏ cam kết “đổi trả trong 7 ngày”: thời hạn và điều kiện cụ thể chưa được quy định. Bỏ quy trình hoàn tiền “chờ xử lý thủ công/đã hoàn tiền” như trạng thái chính thức; project không tự động hoàn tiền. Ảnh/video bằng chứng, phương án đổi sản phẩm và chat ngay trong phiếu yêu cầu chưa có field tương ứng; không đặt chúng như dữ liệu bắt buộc nếu chưa đổi mô hình.

### Đánh giá sản phẩm

DanhGia chỉ có soSao, noiDung, ngayDanhGia và liên kết tài khoản, sản phẩm, ChiTietDonHang. Chỉ chủ đơn có trạng thái Hoàn thành được đánh giá, một lần mỗi dòng. Màn 18 hiện đơn “Đã giao” đã mở form đánh giá; sửa điều kiện. Chọn 5 sao phải tô đủ 5 sao, không hiển thị 5/5 bên cạnh 5 ngôi sao rỗng. Ảnh đánh giá, đánh giá ẩn danh, bản nháp, phản hồi chính thức của shop chưa có trong model; bỏ hoặc ghi là đề xuất ngoài phạm vi, không trộn vào màn chuẩn.

### Tin nhắn với cửa hàng

CuocTroChuyen giữa Người dùng và CuaHang; TinNhan lưu noiDung dạng chữ, thời gian và người gửi. Giữ luồng hỏi đáp với đúng cửa hàng. Bỏ nút đính kèm ảnh/PDF nếu chưa có dữ liệu và API lưu file. Đừng lặp một cuộc trao đổi khiếu nại giả ở cả màn 17 lẫn 19 gây hai nguồn hội thoại.

## 10. Màn còn thiếu và kiểm tra cuối

### Frame và trạng thái cần bổ sung

Sau khi sửa 20 màn, bổ sung các frame/trạng thái còn thiếu nhưng nằm trong phạm vi: trang cửa hàng công khai làm đích của “Xem cửa hàng”; modal chọn voucher đủ điều kiện và không đủ điều kiện; giỏ rỗng, tìm kiếm không có kết quả, sản phẩm hết hàng, tài khoản bị khóa, form sai dữ liệu, đơn trống, kết quả VNPay hết hạn, yêu cầu đăng ký Người bán đã duyệt/đã từ chối. Chỉ thêm trang riêng khi cần cho luồng; các trạng thái nhỏ có thể là variant của frame hiện có. Nối prototype các đường chính và các nút quay lại, đừng để CTA không có đích.

### Kiểm tra phép tính xuyên màn

Dữ liệu mẫu phải tự nhất quán. Ví dụ màn giỏ hiện dùng: giá gốc 597.000đ, giảm sản phẩm 63.800đ → tiền hàng 533.200đ; phí giao 55.000đ; voucher cửa hàng 15.000đ, Toàn sàn 20.000đ, Freeship 30.000đ → thanh toán 523.200đ. Hai đơn minh họa là 294.500đ + 228.700đ = 523.200đ. Nếu thay số nào, cập nhật toàn bộ màn liên quan. Đừng biến cách phân bổ voucher của ví dụ này thành quy tắc chung khi tài liệu chưa quy định.

### Rà soát thị giác và bàn giao

Kiểm tra lại các lỗi thị giác: chữ đè, text nhỏ, nút thiếu tương phản, khoảng trắng quá lớn, ảnh sản phẩm trống hoặc không khớp, trạng thái cùng ý nhưng khác tên/màu, footer quá xa nội dung. Kiểm tra header khi chưa đăng nhập và sau đăng nhập. Kết thúc bằng danh sách frame đã sửa/thêm, các luồng prototype đã nối và những điểm nghiệp vụ còn cần nhóm quyết định; không tuyên bố hoàn thành nếu vẫn còn frame “Building…” hoặc nội dung placeholder.

