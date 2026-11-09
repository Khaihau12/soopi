# Soopi

Soopi là sàn thương mại điện tử đa người bán phục vụ đồ án cuối kỳ. Giao diện React/Vite có ba khu vực Người dùng, Người bán và Quản trị viên. API Express dùng Mongoose với MongoDB chạy local.

## Yêu cầu

- Node.js 24 và npm.
- MongoDB local đang chạy.
- Hai terminal để chạy backend và frontend.

## Cài đặt và chạy

Trong thư mục gốc dự án:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
npm --prefix backend install
npm --prefix frontend install
```

Chỉ sao chép `.env.example` nếu chưa có `.env`. Điền bí mật riêng vào `backend/.env`, giữ URL/cổng phù hợp với máy. Sau đó mở hai terminal:

```powershell
cd backend
npm start
```

```powershell
cd frontend
npm run dev
```

Truy cập `http://localhost:5173`; kiểm tra API tại `http://localhost:3000/api/kiem-tra`.

## Khám phá sản phẩm và cửa hàng

Trang `/san-pham` hỗ trợ tìm theo tên, lọc danh mục, cửa hàng, khoảng giá bán thực tế sau khuyến mãi và số sao đánh giá. Có thể sắp xếp theo giá bán thực tế, đánh giá hoặc thời điểm đăng; các bộ lọc đang áp dụng được thể hiện trên URL và có thể bỏ từng mục. Bấm tên cửa hàng trên thẻ sản phẩm hoặc trang chi tiết để mở `/cua-hang/:id`, xem thông tin cửa hàng, sản phẩm đang bán, đánh giá từ đơn đã hoàn thành và đường dẫn trò chuyện. Cửa hàng ngừng hoạt động không hiển thị công khai.

Bộ lọc **Chỉ hiện sản phẩm còn hàng** dùng `conHang=true` trên URL. Backend lọc `soLuongTon > 0` trước khi tính số kết quả, bộ lọc cửa hàng/danh mục và phân trang; khi bỏ lọc, sản phẩm hết hàng lại hiển thị với nhãn rõ ràng.

Khi tài khoản Người mua/Người bán mở trang chi tiết sản phẩm đang bán, Soopi lưu tối đa 8 ID sản phẩm vừa xem trong tài khoản MongoDB. Mục **Sản phẩm vừa xem** trên `/tai-khoan` hiển thị giá và tồn kho hiện tại để quay lại nhanh; sản phẩm/cửa hàng ngừng hoạt động không hiện trong danh sách. Danh sách tự thay thế mục cũ khi xem sản phẩm mới, không có thao tác xóa thủ công. Lịch sử không lưu bằng `localStorage`; ảnh tiếp tục lấy từ URL Cloudinary và trình duyệt có thể lưu cache. Chạy `npm --prefix backend run test:san-pham-da-xem` để kiểm tra quyền và luồng chính.

## Biến môi trường

| Biến | Ý nghĩa |
| --- | --- |
| `PORT` | Cổng API. |
| `MONGODB_URI` | URI MongoDB local và tên database. |
| `JWT_SECRET` | Bí mật ký token đăng nhập/đặt lại mật khẩu. |
| `FRONTEND_URL` | Gốc URL frontend để CORS và tạo liên kết đặt lại mật khẩu. |
| `NODE_ENV` | Môi trường chạy; `seed:demo` bị chặn ở production. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_HO_TEN` | Thông tin tạo Quản trị viên đầu tiên. |
| `DEMO_PASSWORD` | Mật khẩu cho tài khoản dữ liệu mẫu F29. |
| `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`, `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | Tài khoản mẫu cũ của script `seed:demo-accounts`. |
| `VNP_TMN_CODE`, `VNP_HASH_SECRET` | Mã website và khóa bảo mật VNPay sandbox. |
| `VNP_URL`, `VNP_RETURN_URL` | URL cổng thử nghiệm và địa chỉ nhận kết quả. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Tài khoản Cloudinary để lưu/xóa ảnh sản phẩm và banner; chỉ điền vào `backend/.env`. |
| `VITE_API_URL` | URL gốc API mà frontend gọi; đặt trong `frontend/.env`. |

## Tài khoản và dữ liệu mẫu

Điền các biến `ADMIN_*` rồi chạy `npm run seed:admin` trong `backend` để tạo Quản trị viên. Điền `DEMO_PASSWORD` rồi chạy `npm run seed:demo` để tạo 1 Người mua, 3 Người bán có cửa hàng, 10 sản phẩm, 2 khuyến mãi và 4 voucher. Có thể chạy lại mà không tạo trùng; dữ liệu cũ không bị đặt lại mật khẩu.

Các tài khoản F29 dùng chung mật khẩu từ `DEMO_PASSWORD`: `nguoi-mua-f29@soopi.test`, `nguoi-ban-f29-a@soopi.test`, `nguoi-ban-f29-b@soopi.test`, `nguoi-ban-f29-c@soopi.test`. Nếu đã tồn tại với mật khẩu khác, script giữ nguyên mật khẩu đó.

Ảnh mẫu sản phẩm và banner đã lưu trên Cloudinary, URL công khai nằm trong `backend/data/anhMau.json`. Sau khi tạo dữ liệu mẫu, chạy `npm --prefix backend run seed:images` để gắn ảnh cho các bản ghi có ảnh trống hoặc đường dẫn `/anh-demo/` cũ. Lệnh nhận diện sản phẩm theo tên và cửa hàng, bỏ qua ảnh đã tải thủ công; chạy lại không tạo ảnh trùng. Tệp ảnh gốc trên máy không cần cho quá trình cài đặt; lệnh kiểm tra URL Cloudinary trước khi gắn vào MongoDB.

Nếu database cũ có Flash Sale do Người bán tạo, chạy `npm --prefix backend run migrate:flash-sale` một lần. Script sao lưu các chương trình đó vào `backend/backups/` (không đưa lên Git), rồi chuyển chúng thành chương trình `Giảm giá`. Chỉ Quản trị viên tạo Flash Sale Toàn sàn; `seed:demo` tạo một chương trình mẫu để thử mục Flash Sale trên trang chủ.

## VNPay sandbox và kiểm thử

Đăng ký môi trường thử nghiệm trên [cổng VNPay](https://sandbox.vnpayment.vn/) để lấy `VNP_TMN_CODE` và `VNP_HASH_SECRET`, điền vào `backend/.env`; cấu hình URL nhận kết quả trỏ về API local. Chưa có tài khoản sandbox vẫn thử được luồng COD. Không gửi khóa qua chat hoặc đưa `.env` vào Git.

```powershell
npm --prefix frontend run build
npm --prefix backend run test:f30
npm --prefix backend run test:realtime
npm --prefix backend run test:cloudinary
npm --prefix backend run test:kham-pha
```

Các script `test:f12` đến `test:f30` nằm trong `backend/package.json`; mỗi script dùng database kiểm thử tách riêng. Chạy thêm các script liên quan tới chức năng đang sửa.

Chat dùng Socket.IO để báo tin mới sau khi MongoDB lưu thành công. REST vẫn dùng để gửi tin, lấy danh sách/lịch sử và đồng bộ sau khi mất kết nối. Ảnh sản phẩm và banner được tải lên Cloudinary; backend không phục vụ thư mục ảnh local. Khi thay/xóa ảnh sản phẩm hoặc banner, hệ thống xóa ảnh Cloudinary chỉ nếu không còn bản ghi nào tham chiếu. Ảnh tải lên rồi bỏ dở biểu mẫu được quét sau 24 giờ, mỗi ngày một lần; cần giữ backend chạy để quét. Trình duyệt có thể tiếp tục hiện ảnh đã tải nhờ cache khi mất mạng; đó không phải kho lưu ảnh của ứng dụng.

## Yêu thích, thông báo và phản hồi đánh giá

- Người mua và Người bán có thể lưu sản phẩm đang bán vào **Sản phẩm yêu thích**; danh sách vẫn hiển thị sản phẩm về sau ngừng bán để người dùng chủ động bỏ lưu. Quản trị viên không dùng chức năng mua sắm này.
- **Thông báo** được lưu theo tài khoản, có số chưa đọc, lọc và đánh dấu đã đọc. Hệ thống tạo thông báo khi Người bán đổi trạng thái đơn, xét duyệt đăng ký bán hàng, có tin nhắn mới, VNPay trả kết quả, hoặc Người bán phản hồi đánh giá. Socket.IO cập nhật số chưa đọc và danh sách khi đang mở trang; dữ liệu vẫn lấy từ REST/MongoDB khi tải lại.
- Người bán chỉ phản hồi một lần trên đánh giá thuộc sản phẩm của cửa hàng mình. Phản hồi hiển thị công khai dưới đánh giá trên trang sản phẩm và cửa hàng. Mức dài tối đa 1.000 ký tự.
- Hai collection bổ sung cho tính năng mới là `SanPhamYeuThich` và `ThongBao`; `DanhGia` có thêm `phanHoiNguoiBan` và `ngayPhanHoi`. Đây là phần mở rộng so với 19 collection gốc, không thay đổi dữ liệu lịch sử. Chạy `npm --prefix backend run test:tinh-nang-moi` để kiểm tra các quyền và luồng chính.

## Sổ địa chỉ và mua lại

- Người mua quản lý tối đa 10 địa chỉ tại `/tai-khoan`: thêm, sửa, xóa và chọn mặc định. Địa chỉ hồ sơ cũ được đưa vào sổ khi mở lần đầu; `TaiKhoan.diaChiNhanHang` tiếp tục lưu địa chỉ mặc định để tương thích dữ liệu cũ. `TaiKhoan.diaChiDaLuu` là mảng địa chỉ gắn trong tài khoản, không tạo collection mới.
- Khi đặt hàng, chọn một địa chỉ đã lưu hoặc nhập địa chỉ chỉ dùng cho lần này. Đơn mới vẫn lưu bản chụp địa chỉ tại thời điểm đặt; sửa sổ địa chỉ không làm đổi đơn cũ.
- Đơn `Hoàn thành` hoặc `Đã hủy` có nút **Mua lại**. Sản phẩm còn bán được thêm vào giỏ với số lượng cũ; món ngừng bán/hết hàng hoặc vượt tồn kho được báo rõ. Giá, khuyến mãi, voucher và tổng tiền được tính lại khi xem giỏ và thanh toán, không sao chép giá cũ. Chạy `npm --prefix backend run test:so-dia-chi-mua-lai` để kiểm tra API và các trường hợp lỗi.

## Tồn kho Người bán

- Trang **Người bán → Sản phẩm** báo các sản phẩm đang kinh doanh có tồn kho bằng hoặc dưới ngưỡng. Ngưỡng mặc định là 5 và có thể chỉnh riêng từng sản phẩm; đặt 0 để chỉ báo khi hết hàng.
- Hộp **Cập nhật** cho xem số lượng hiện tại, mức chênh lệch trước khi lưu và ngưỡng cảnh báo. Nếu đơn hàng làm số lượng thay đổi trong lúc đang mở hộp, hệ thống báo xung đột để người bán kiểm tra lại, tránh ghi đè số lượng mới.
- **Lịch sử** ghi số lượng tăng/giảm khi tạo sản phẩm, điều chỉnh thủ công, đặt hàng, hoàn tác tạo đơn và hoàn kho khi hủy hoặc thanh toán thất bại. Số lượng và biến động được ghi trong cùng một thao tác MongoDB trên `SanPham`. Chỉ Người bán sở hữu cửa hàng xem được lịch sử này. Chạy `npm --prefix backend run test:ton-kho` để kiểm tra.
- Mỗi sản phẩm lưu tối đa 300 biến động gần nhất để dữ liệu không tăng vô hạn. Sản phẩm tạo trước tính năng này bắt đầu ghi lịch sử từ biến động tiếp theo; không suy diễn lịch sử cũ.

## Giới hạn đã biết

- Vận chuyển chỉ mô phỏng; không có giao hàng hay hoàn tiền tự động. Đơn đã thanh toán cần hoàn tiền được đánh dấu để xử lý thủ công.
- MongoDB local không có transaction nhiều tài liệu: hai lần đặt cùng giỏ hoặc tiến trình dừng giữa các bước hoàn tác kho/voucher cần kiểm tra và đối soát thủ công.
- VNPay local chưa có IPN; thanh toán đến sau khi giao dịch hết hạn cần xử lý thủ công. Cần tài khoản sandbox để kiểm tra thật qua cổng.
- Người mua được hủy đơn còn chờ xác nhận. Hủy giao dịch VNPay chưa trả tiền sẽ hủy mọi đơn cùng giao dịch và hoàn lượt voucher; hủy đơn đã thanh toán hoặc COD chỉ hủy đơn đó, không hoàn voucher. Tiền đã thanh toán cần Quản trị viên hoàn thủ công.
- Nếu tiến trình dừng sau khi chiếm quyền hủy nhưng trước khi hoàn tất cập nhật kho/giao dịch/voucher, cần đối soát thủ công. Thanh toán VNPay đến sau khi giao dịch đã hủy cũng cần đối soát và hoàn tiền thủ công.
- Người bán có thể bật lại sản phẩm bị Admin ngừng do dữ liệu chưa lưu người ra quyết định.
- Doanh thu là tổng thanh toán của đơn hoàn thành, không phải lợi nhuận. Token đăng nhập cũ bị vô hiệu ở request kế tiếp sau khi đổi hoặc đặt lại mật khẩu.
