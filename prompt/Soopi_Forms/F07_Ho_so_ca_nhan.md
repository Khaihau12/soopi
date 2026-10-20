# FORM F07 — HỒ SƠ CÁ NHÂN VÀ ĐỔI MẬT KHẨU

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F06.

## 1. Mục tiêu

Người dùng đã đăng nhập (mọi vai trò) xem và cập nhật thông tin cá nhân (họ tên, ngày sinh, giới tính, số điện thoại, địa chỉ nhận hàng) và **đổi mật khẩu** khi đang đăng nhập (`QĐ-24` phiên bản 2).

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.3** (Quản lý thông tin cá nhân). Tài liệu Collection **Bảng 3.25** (`TaiKhoan`).
- `02`: `QĐ-22`, **`QĐ-24`** (đổi mật khẩu — đã chốt; xem `02` QĐ-24).

## 3. API

| Method + URL | Quyền | Body | Kết quả |
|---|---|---|---|
| `GET /api/tai-khoan/ho-so` | đăng nhập | — | `data.taiKhoan` |
| `PATCH /api/tai-khoan/doi-mat-khau` | đăng nhập (mọi vai trò) | `matKhauHienTai`, `matKhauMoi`, `xacNhanMatKhauMoi` | 200, xóa cookie đăng nhập (xem 4.2) |
| `PATCH /api/tai-khoan/ho-so` | đăng nhập | một hoặc nhiều trong: `hoTen`, `ngaySinh`, `gioiTinh`, `soDienThoai`, `diaChiNhanHang` | `200`, `data.taiKhoan` đã cập nhật |

## 4. Quy tắc nghiệp vụ và ràng buộc

1. Tài khoản được xác định từ **`req.taiKhoan`** (token), **không** nhận `id` từ URL/body.
2. **Danh sách trường cho phép sửa là cố định** (whitelist): `hoTen`, `ngaySinh`, `gioiTinh`, `soDienThoai`, `diaChiNhanHang`. Mọi trường khác (`email`, `vaiTro`, `trangThaiTaiKhoan`, `matKhau`...) trong body bị **bỏ qua**.
3. Kiểm tra (ở service, theo `QĐ-22`): `hoTen` không rỗng sau `trim` và ≤ giới hạn; `ngaySinh` là ngày hợp lệ, **không ở tương lai**; `gioiTinh` ∈ `Nam`, `Nữ`, `Khác` (hằng số `GIOI_TINH`); `soDienThoai` đúng `REGEX_SO_DIEN_THOAI`; `diaChiNhanHang` ≤ `DO_DAI_TOI_DA.DIA_CHI`.
4. Trường tùy chọn gửi chuỗi rỗng = **xóa giá trị** (dùng `$unset`/gán `undefined`), riêng `hoTen` không được rỗng.
5. Dữ liệu sai → 400 kèm thông báo tiếng Việt chỉ rõ trường nào sai. Không thay đổi gì nếu có bất kỳ trường nào không hợp lệ.
6. Đổi mật khẩu là chức năng **riêng** (mục 4.2), không đi qua `PATCH ho-so`.

### 4.2 Đổi mật khẩu (`doiMatKhau` trong `taiKhoan.service.js`)
1. Tài khoản lấy từ `req.taiKhoan`; nạp lại kèm `matKhau` (`select('+matKhau')`). **Áp dụng cho cả Người dùng, Người bán và Quản trị viên** (mỗi người chỉ đổi mật khẩu **của chính mình**; quy tắc "không thao tác tài khoản Quản trị viên" của F24 chỉ áp dụng cho người khác).
2. Kiểm tra **theo thứ tự**: ba trường đều có → `matKhauHienTai` đúng bằng `bcryptjs.compare()` (sai → **400** "Mật khẩu hiện tại không chính xác") → `matKhauMoi` ≥ `DO_DAI_MAT_KHAU_TOI_THIEU` (8) → `matKhauMoi` **khớp** `xacNhanMatKhauMoi` → `matKhauMoi` **khác** `matKhauHienTai`. Sai bước nào → 400, thông báo tiếng Việt rõ cách sửa, **không đổi gì**.
3. Hợp lệ → `bcryptjs.hash()` (`SO_VONG_BAM_MAT_KHAU`) rồi cập nhật **trực tiếp** `TaiKhoan.matKhau`. **Không** cho đổi `email`, `vaiTro`, `trangThaiTaiKhoan` qua chức năng này.
4. Thành công → **xóa cookie `token` hiện tại** (dùng hàm xóa cookie của F06, đúng các tùy chọn) và trả 200; người dùng **phải đăng nhập lại**.
5. **Giới hạn đã biết (ghi vào báo cáo):** phiên đăng nhập cũ trên thiết bị khác **chưa thể thu hồi ngay** vì chưa có cơ chế quản lý phiên/token.
6. Không log mật khẩu; không trả mật khẩu/băm. Không thêm Collection/field.
7. Chưa đăng nhập → 401; tài khoản bị khóa → 403 (qua middleware F06).

## 5. Backend — file cần tạo/sửa

`routes/taiKhoan.route.js`, `controllers/taiKhoan.controller.js`, `services/taiKhoan.service.js` (`layHoSo`, `capNhatHoSo`, `doiMatKhau`); gắn vào `routes/index.js`; cả route dùng `batBuocDangNhap`.

## 6. Frontend

- `services/taiKhoan.api.js`: `layHoSo`, `capNhatHoSo`, `doiMatKhau`.
- Component dùng chung `DoiMatKhauForm` (trong `Modal`) — gắn vào **cả ba nơi**: (1) trang hồ sơ (`HoSoPage`), (2) menu avatar của `NguoiBanLayout`, (3) menu avatar của `QuanTriVienLayout` (mục **"Đổi mật khẩu"**). Quản trị viên không có trang hồ sơ nên chỉ dùng hộp thoại.
- `pages/HoSoPage.jsx` (route `/tai-khoan`, bọc `BaoVeRoute`, dùng `UserLayout`).
- Thêm mục **"Hồ sơ"** vào `MENU_TAI_KHOAN` (`hangSo.js`).

**Bố cục trang** (một cột, rộng tối đa ~720px, trong `Card`):
- Đầu trang: `Avatar` lớn + họ tên + email (chỉ đọc) + các `Badge` vai trò (chỉ đọc).
- **Chế độ xem** (mặc định): danh sách nhãn–giá trị (Họ tên, Ngày sinh, Giới tính, Số điện thoại, Địa chỉ nhận hàng). Giá trị trống hiện "Chưa cập nhật" (màu phụ). Một nút chính **"Chỉnh sửa"**.
- **Chế độ sửa** (đúng luồng Bảng 3.3: chỉnh sửa → xác nhận hoặc hủy): form với `Field` cho từng trường (ngày sinh dùng `<input type="date">`, giới tính dùng `Select`, địa chỉ dùng `Textarea`). Hai nút: **"Lưu thay đổi"** (chính; khóa khi chưa có thay đổi hoặc đang gửi) và **"Hủy"** (quay lại chế độ xem, **giữ nguyên dữ liệu cũ**).
- Ghi chú dưới ô địa chỉ: "Địa chỉ này được dùng khi đặt hàng."
- Lưu thành công → cập nhật `XacThucContext` bằng `capNhatTaiKhoan`, toast "Cập nhật thông tin thành công", về chế độ xem.
- Trạng thái tải dùng `Skeleton`; lỗi tải dùng `ErrorState`.
- Mobile: nút xếp dọc, full-width.
- **Khối "Bảo mật"** (một `Card` thứ hai ở cuối trang): dòng "Mật khẩu" + nút phụ **"Đổi mật khẩu"** mở `DoiMatKhauForm`.

**`DoiMatKhauForm`:** ba ô — **Mật khẩu hiện tại**, **Mật khẩu mới** (gợi ý "Tối thiểu 8 ký tự, khác mật khẩu hiện tại"), **Nhập lại mật khẩu mới**; mỗi ô có nút hiện/ẩn (có `aria-label`), `autoComplete` đúng (`current-password`, `new-password`); kiểm tra khớp/độ dài ở frontend **và** hiển thị lỗi 400 từ server dưới ô tương ứng; nút chính **"Đổi mật khẩu"** (khóa khi đang gửi). Thành công → xóa các ô khỏi state, toast "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.", **đăng xuất phía frontend** (`taiKhoan = null`) và chuyển `/dang-nhap`.

## 7. Không được làm

- Không cho sửa email/vai trò qua hồ sơ; không thêm ảnh đại diện (không có field). Mật khẩu chỉ đổi qua chức năng ở mục 4.2.
- Không gọi API ở chế độ xem nếu dữ liệu đã có sẵn trong context — **nhưng** vẫn gọi `GET ho-so` khi vào trang để đảm bảo dữ liệu mới.

## 8. Tiêu chí hoàn thành

- [ ] `PATCH` với `{ "vaiTro": ["Quản trị viên"], "hoTen": "An" }` → chỉ `hoTen` đổi, `vaiTro` giữ nguyên.
- [ ] `ngaySinh` ở tương lai → 400; `soDienThoai` sai định dạng → 400; `hoTen` rỗng → 400; không có field nào bị đổi khi có lỗi.
- [ ] Chưa đăng nhập → 401.
- [ ] Hủy sửa → dữ liệu cũ nguyên vẹn; Lưu → hiển thị dữ liệu mới sau khi tải lại trang.
- [ ] Xóa số điện thoại (để trống rồi lưu) → trường bị xóa khỏi bản ghi.
- [ ] **Đổi mật khẩu:** sai mật khẩu hiện tại → 400; mới < 8 ký tự → 400; mới không khớp xác nhận → 400; mới trùng hiện tại → 400; hợp lệ → 200, cookie bị xóa, `GET /api/xac-thuc/toi` sau đó → 401; đăng nhập bằng mật khẩu **cũ** thất bại, bằng **mới** thành công; trong DB là chuỗi băm; gửi kèm `email`/`vaiTro` → bị bỏ qua.
- [ ] Làm được cho cả **Người dùng, Người bán, Quản trị viên** (mỗi người đổi mật khẩu của chính mình); chưa đăng nhập → 401.
- [ ] Giao diện dùng đúng tokens/component F03, ổn ở 360px; hộp thoại đổi mật khẩu có ở trang hồ sơ, menu Người bán và menu Quản trị viên.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9.
