# FORM F11 — KHU VỰC NGƯỜI BÁN: NỀN TẢNG + CỬA HÀNG

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F03, F06, F10.

## 1. Mục tiêu

1. Dựng **middleware dùng chung cho mọi API Người bán** (xác thực + vai trò + nạp cửa hàng của chính họ).
2. Người bán xem và cập nhật **thông tin cửa hàng** của mình.
3. Dựng khung khu vực `/nguoi-ban` để các form sau cắm vào.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.12** (Quản lý tài khoản và cửa hàng). Collection **Bảng 3.27** (`CuaHang`).
- `AGENTS.md` Mục 6 (endpoint theo vai trò), 8 (Phân quyền và sở hữu). `02`: `QĐ-15`, `QĐ-22`.

## 3. API

| Method + URL | Quyền | Body | Kết quả |
|---|---|---|---|
| `GET /api/nguoi-ban/cua-hang` | Người bán | — | `data.cuaHang` = `{ _id, tenCuaHang, moTa, diaChi, trangThaiHoatDong }` |
| `PATCH /api/nguoi-ban/cua-hang` | Người bán | một hoặc nhiều trong: `tenCuaHang`, `moTa`, `diaChi` | 200, `data.cuaHang` |

> Không có `:id`: **cửa hàng luôn lấy từ tài khoản đăng nhập** (`req.cuaHang`).

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Middleware dùng chung (đặt trong `role.middleware.js`)
- `batBuocCuaHang`: chạy sau `batBuocDangNhap` + `batBuocVaiTro(VAI_TRO.NGUOI_BAN)`. Tìm `CuaHang` theo `taiKhoanId = req.taiKhoan._id`; không có → **403** "Tài khoản của bạn chưa có cửa hàng"; có → gắn `req.cuaHang`.
- Xuất sẵn hai mảng middleware ghép để các route dùng gọn:
  - `batBuocNguoiBan = [batBuocDangNhap, batBuocVaiTro(VAI_TRO.NGUOI_BAN), batBuocCuaHang]`
  - `batBuocQuanTriVien = [batBuocDangNhap, batBuocVaiTro(VAI_TRO.QUAN_TRI_VIEN)]`
- **Mọi** route `nguoiBan*.route.js` từ form này trở đi bắt đầu bằng `router.use(...batBuocNguoiBan)`.
- Cửa hàng `Ngừng hoạt động` (do Quản trị viên đặt, `QĐ-15`) **vẫn đăng nhập và thao tác được** (đặc biệt phải xử lý được đơn đã thanh toán); giao diện chỉ hiện cảnh báo.

### 4.2 Cập nhật cửa hàng
1. Chỉ các field `tenCuaHang`, `moTa`, `diaChi` được sửa (whitelist). **Không** sửa `trangThaiHoatDong`, `taiKhoanId`.
2. `tenCuaHang`, `diaChi` không rỗng sau `trim`; độ dài tối đa theo `DO_DAI_TOI_DA` (`TEN_CUA_HANG`, `DIA_CHI`, `MO_TA`). Sai → 400; không lưu gì.
3. Trường tùy chọn (`moTa`) gửi chuỗi rỗng = xóa giá trị.

## 5. Backend — file cần tạo/sửa

`middlewares/role.middleware.js` (bổ sung), `routes/nguoiBanCuaHang.route.js`, `controllers/cuaHang.controller.js`, `services/cuaHang.service.js` (`nguoiBanLayCuaHang`, `nguoiBanCapNhatCuaHang`). Gắn vào `routes/index.js` ở prefix `/api/nguoi-ban/cua-hang`.

## 6. Frontend

**File:** `services/cuaHang.api.js` (`nguoiBanLayCuaHang`, `nguoiBanCapNhatCuaHang`); `pages/nguoiBan/CuaHangNguoiBanPage.jsx`; cập nhật `NguoiBanLayout`.

### 6.1 Khung khu vực Người bán
- Các route con của `/nguoi-ban` nằm trong nhóm đã bảo vệ ở F06 (cần vai trò `Người bán`).
- **Trang index `/nguoi-ban`** tạm thời `Navigate` tới `/nguoi-ban/cua-hang` (F26 sẽ thay bằng trang Tổng quan).
- Đầu sidebar `NguoiBanLayout` hiện **tên cửa hàng** (tải bằng `nguoiBanLayCuaHang`; trong lúc tải dùng `Skeleton`).
- Menu Người bán lấy từ `MENU_NGUOI_BAN` (F03). Mục chưa có trang tương ứng sẽ hoạt động khi các form sau hoàn thành — **không** tạo trang rỗng giả.
- Nếu cửa hàng `Ngừng hoạt động`: hiện **dải cảnh báo** đầu khu vực: "Cửa hàng đang ngừng hoạt động nên sản phẩm không hiển thị với khách hàng. Vui lòng liên hệ quản trị viên."

### 6.2 `CuaHangNguoiBanPage` (`/nguoi-ban/cua-hang`)
- `PageHeader` "Cửa hàng của tôi" + `Badge` trạng thái (`Hoạt động` / `Ngừng hoạt động`).
- Cùng mô hình với trang hồ sơ (F07): **chế độ xem** (Tên cửa hàng, Địa chỉ, Mô tả; trống → "Chưa cập nhật") + nút chính **"Chỉnh sửa"**; **chế độ sửa** có "Lưu thay đổi" (khóa khi chưa đổi/đang gửi) và "Hủy" (giữ nguyên dữ liệu cũ).
- Lưu xong: toast "Cập nhật cửa hàng thành công", cập nhật tên cửa hàng ở sidebar.
- Lỗi tải → `ErrorState` (kèm thử lại); lỗi 403 "chưa có cửa hàng" hiển thị đúng thông báo.

## 7. Không được làm

- Không nhận `cuaHangId`/`taiKhoanId` từ client để xác định quyền.
- Không cho Người bán đổi `trangThaiHoatDong`.
- Không tạo trang giả cho các mục menu chưa làm.
- Không thêm logo/ảnh bìa cho cửa hàng (không có field).

## 8. Tiêu chí hoàn thành

- [ ] `Người dùng` (chưa duyệt) gọi `GET /api/nguoi-ban/cua-hang` → 403; chưa đăng nhập → 401.
- [ ] Người bán gọi được và chỉ thấy cửa hàng **của chính mình** (thử với hai tài khoản Người bán khác nhau).
- [ ] `PATCH` kèm `trangThaiHoatDong`/`taiKhoanId` → các field đó **không** đổi.
- [ ] `tenCuaHang` rỗng → 400; sau lỗi dữ liệu cũ nguyên vẹn.
- [ ] Tài khoản Người bán bị khóa (đổi trực tiếp DB) → 403 ở mọi API Người bán.
- [ ] Giao diện: sidebar hiện tên cửa hàng, vào `/nguoi-ban` tự về trang cửa hàng, dải cảnh báo hiện khi `Ngừng hoạt động`, ổn ở 360px (sidebar thành ngăn kéo).

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9.
