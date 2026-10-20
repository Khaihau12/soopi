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

Nếu database cũ có Flash Sale do Người bán tạo, chạy `npm --prefix backend run migrate:flash-sale` một lần. Script sao lưu các chương trình đó vào `backend/backups/` (không đưa lên Git), rồi chuyển chúng thành chương trình `Giảm giá`. Chỉ Quản trị viên tạo Flash Sale Toàn sàn; `seed:demo` tạo một chương trình mẫu để thử mục Flash Sale trên trang chủ.

## VNPay sandbox và kiểm thử

Đăng ký môi trường thử nghiệm trên [cổng VNPay](https://sandbox.vnpayment.vn/) để lấy `VNP_TMN_CODE` và `VNP_HASH_SECRET`, điền vào `backend/.env`; cấu hình URL nhận kết quả trỏ về API local. Chưa có tài khoản sandbox vẫn thử được luồng COD. Không gửi khóa qua chat hoặc đưa `.env` vào Git.

```powershell
npm --prefix frontend run build
npm --prefix backend run test:f30
npm --prefix backend run test:realtime
npm --prefix backend run test:cloudinary
```

Các script `test:f12` đến `test:f30` nằm trong `backend/package.json`; mỗi script dùng database kiểm thử tách riêng. Chạy thêm các script liên quan tới chức năng đang sửa.

Chat dùng Socket.IO để báo tin mới sau khi MongoDB lưu thành công. REST vẫn dùng để gửi tin, lấy danh sách/lịch sử và đồng bộ sau khi mất kết nối. Ảnh mới được tải lên Cloudinary; ảnh cũ trong `backend/uploads` tiếp tục hiển thị. Khi thay/xóa ảnh sản phẩm hoặc banner, hệ thống xóa ảnh Cloudinary chỉ nếu không còn bản ghi nào tham chiếu. Ảnh tải lên rồi bỏ dở biểu mẫu được quét sau 24 giờ, mỗi ngày một lần; cần giữ backend chạy để quét.

## Giới hạn đã biết

- Vận chuyển chỉ mô phỏng; không có giao hàng hay hoàn tiền tự động. Đơn đã thanh toán cần hoàn tiền được đánh dấu để xử lý thủ công.
- MongoDB local không có transaction nhiều tài liệu: hai lần đặt cùng giỏ hoặc tiến trình dừng giữa các bước hoàn tác kho/voucher cần kiểm tra và đối soát thủ công.
- VNPay local chưa có IPN; thanh toán đến sau khi giao dịch hết hạn cần xử lý thủ công. Cần tài khoản sandbox để kiểm tra thật qua cổng.
- Người mua được hủy đơn còn chờ xác nhận. Hủy giao dịch VNPay chưa trả tiền sẽ hủy mọi đơn cùng giao dịch và hoàn lượt voucher; hủy đơn đã thanh toán hoặc COD chỉ hủy đơn đó, không hoàn voucher. Tiền đã thanh toán cần Quản trị viên hoàn thủ công.
- Nếu tiến trình dừng sau khi chiếm quyền hủy nhưng trước khi hoàn tất cập nhật kho/giao dịch/voucher, cần đối soát thủ công. Thanh toán VNPay đến sau khi giao dịch đã hủy cũng cần đối soát và hoàn tiền thủ công.
- Người bán có thể bật lại sản phẩm bị Admin ngừng do dữ liệu chưa lưu người ra quyết định. Chưa lọc/sắp xếp chính xác theo giá sau khuyến mãi. Ảnh `/uploads` cũ chưa được tự chuyển sang Cloudinary hoặc dọn khỏi ổ đĩa.
- Doanh thu là tổng thanh toán của đơn hoàn thành, không phải lợi nhuận. Token đăng nhập cũ bị vô hiệu ở request kế tiếp sau khi đổi hoặc đặt lại mật khẩu.
