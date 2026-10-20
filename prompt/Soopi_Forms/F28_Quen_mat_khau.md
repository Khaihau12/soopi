# FORM F28 — QUÊN / ĐẶT LẠI MẬT KHẨU

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F06.
> **Đã chốt:** `QĐ-01` được chấp nhận → làm form này như mô tả (không còn điều kiện).

## 1. Mục tiêu

Người dùng quên mật khẩu có thể tạo yêu cầu đặt lại và đặt mật khẩu mới. Vì dự án **không có dịch vụ email**, hướng dẫn đặt lại được tạo ở phía server (ghi log) và, **chỉ ở môi trường phát triển**, hiển thị lại để demo.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.1** (use case Đăng nhập có mở rộng "Quên mật khẩu").
- `AGENTS.md` Mục 10, **Mục 18** (cơ chế chưa quy định → đã chốt ở `QĐ-01`). `02`: **`QĐ-01`**, `QĐ-22`, `QĐ-24`.

## 3. API (công khai)

| Method + URL | Body | Kết quả |
|---|---|---|
| `POST /api/xac-thuc/quen-mat-khau` | `email` | **Luôn 200** với thông báo trung tính "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được tạo." Khi `NODE_ENV = 'development'`: `data.lienKetDatLai` có thêm liên kết (nếu tài khoản tồn tại) |
| `POST /api/xac-thuc/dat-lai-mat-khau` | `token`, `matKhauMoi` | 200 khi thành công; 400 nếu liên kết không hợp lệ/hết hạn |

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Tạo yêu cầu (`quenMatKhau`)
1. `email` chuẩn hóa (`trim + lowercase`). Thiếu/sai định dạng → 400.
2. **Không lộ email nào tồn tại:** dù tìm thấy hay không, response **giống hệt nhau** (cùng status, cùng message, cùng cấu trúc `data` — trừ trường `lienKetDatLai` ở môi trường phát triển).
3. Chỉ tạo token nếu tài khoản tồn tại và **không** `Bị khóa` (tài khoản bị khóa: không tạo, vẫn trả thông báo trung tính). Không áp dụng cho tài khoản `Quản trị viên` (theo tinh thần `QĐ-23`) — vẫn trả thông báo trung tính.
4. **Token (không thêm field vào DB — `QĐ-01`):** JWT payload `{ taiKhoanId, mucDich: 'datLaiMatKhau' }`, ký bằng **`JWT_SECRET` nối với chuỗi băm mật khẩu hiện tại** của tài khoản, hạn `THOI_HAN_TOKEN_DAT_LAI_PHUT = 15` phút (hằng số mới). Nhờ đó token **tự vô hiệu** ngay khi mật khẩu đổi (dùng được **một lần**).
5. Liên kết: `${FRONTEND_URL}/dat-lai-mat-khau?token=<token>`. **Ghi liên kết ra log server** (mức thông tin) để thay cho việc gửi email; **không** ghi email người dùng cùng mật khẩu băm.

### 4.2 Đặt lại (`datLaiMatKhau`)
1. Giải mã token **không xác minh** để lấy `taiKhoanId` (dùng `jwt.decode`), nạp tài khoản kèm `matKhau` (`select('+matKhau')`), rồi **xác minh** bằng `jwt.verify` với bí mật ghép như 4.1.4. Sai chữ ký/hết hạn/không đúng `mucDich`/tài khoản không tồn tại/đang `Bị khóa`/là Quản trị viên → **cùng một** thông báo 400 "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn".
2. `matKhauMoi` ≥ `DO_DAI_MAT_KHAU_TOI_THIEU`, sai → 400 (thông báo rõ yêu cầu).
3. Băm bằng bcryptjs, cập nhật `matKhau`. **Không** tự đăng nhập; trả 200 để frontend chuyển sang trang đăng nhập.
4. Dùng lại token lần hai → 400 (vì mật khẩu đã đổi).
5. Không log token/mật khẩu mới.

## 5. Backend — file cần sửa

`routes/xacThuc.route.js` (thêm hai route công khai), `controllers/xacThuc.controller.js`, `services/xacThuc.service.js` (`quenMatKhau`, `datLaiMatKhau`), `cauHinh.constant.js`.

## 6. Frontend

**File:** mở rộng `services/xacThuc.api.js`; pages `QuenMatKhauPage` (`/quen-mat-khau`), `DatLaiMatKhauPage` (`/dat-lai-mat-khau`) — cùng khung thẻ giữa màn hình như trang đăng nhập (F06). Cập nhật `DangNhapPage`: thêm liên kết **"Quên mật khẩu?"** dưới ô mật khẩu.

### 6.1 `QuenMatKhauPage`
- Một ô **Email**, nút chính **"Gửi hướng dẫn"**; có liên kết "Quay lại đăng nhập".
- Sau khi gửi (bất kể email có tồn tại): hiện khối thông báo trung tính (như response) — **không** nói email có/không tồn tại.
- Nếu response có `lienKetDatLai` (môi trường phát triển): thêm dòng nhỏ rõ ràng "**Chỉ hiển thị ở môi trường phát triển:**" kèm liên kết bấm được.

### 6.2 `DatLaiMatKhauPage`
- Đọc `token` từ URL rồi **xóa token khỏi thanh địa chỉ** (`replace`) để không rò rỉ qua Referer/lịch sử; giữ token trong state của trang. Không có token → hiện `ErrorState` kèm liên kết "Yêu cầu liên kết mới".
- Form: **Mật khẩu mới** (hiện/ẩn, gợi ý "Tối thiểu 8 ký tự"), **Nhập lại mật khẩu** (kiểm tra ở frontend), nút chính **"Đặt lại mật khẩu"**, `autoComplete="new-password"`.
- 400 từ server → khối cảnh báo + liên kết "Yêu cầu liên kết mới". Thành công → toast "Đặt lại mật khẩu thành công. Hãy đăng nhập." và chuyển `/dang-nhap`.
- Không lưu token/mật khẩu ở `localStorage`.

## 7. Không được làm

- Không thêm field `resetToken`/`hanDatLai` vào `TaiKhoan`; không gửi email thật; không thêm thư viện.
- Không tiết lộ email có tồn tại hay không; không trả liên kết ở môi trường production.
- Không làm chức năng đổi mật khẩu khi đang đăng nhập (`QĐ-24`).

## 8. Tiêu chí hoàn thành

- [ ] Email tồn tại và không tồn tại → response **giống hệt** nhau ở production; ở `development` chỉ khác trường `lienKetDatLai`.
- [ ] Dùng liên kết còn hạn → đặt lại được; đăng nhập bằng mật khẩu **mới** thành công, **cũ** thất bại.
- [ ] Dùng lại cùng liên kết → 400; liên kết hết hạn (chỉnh tạm hạn xuống vài giây để thử) → 400; sửa 1 ký tự token → 400; `mucDich` khác (token đăng nhập) → 400.
- [ ] Tài khoản `Bị khóa` hoặc Quản trị viên → không tạo được token, thông báo vẫn trung tính; dùng token cũ của tài khoản vừa bị khóa → 400.
- [ ] Mật khẩu mới < 8 ký tự → 400.
- [ ] Log server chỉ chứa liên kết ở môi trường phát triển; không có mật khẩu.
- [ ] Giao diện: luồng liên kết "Quên mật khẩu?" → gửi → mở liên kết → đặt lại → đăng nhập chạy trọn; token biến mất khỏi URL; ổn ở 360px; dùng được bằng bàn phím.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9.
