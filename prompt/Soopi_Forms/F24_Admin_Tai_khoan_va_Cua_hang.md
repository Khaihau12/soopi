# FORM F24 — QUẢN TRỊ VIÊN: TÀI KHOẢN & CỬA HÀNG

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F06, F10, F11.

## 1. Mục tiêu

Quản trị viên xem danh sách/chi tiết **tài khoản Người dùng và Người bán**, **khóa/mở khóa**, **đặt lại mật khẩu**; xem danh sách **cửa hàng** và đổi trạng thái hoạt động.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.20** (Quản lý tài khoản và hệ thống) và mục 3.1.2 ("quản lý … cửa hàng"). Collection **Bảng 3.25, 3.27**.
- `AGENTS.md` Mục 8 (Phân quyền, Xóa dữ liệu), Mục 10. `02`: **`QĐ-15`** (quản lý cửa hàng), **`QĐ-23`** (không thao tác tài khoản Quản trị viên; Admin nhập mật khẩu mới), `QĐ-22`.

## 3. API (tất cả: Quản trị viên — `router.use(...batBuocQuanTriVien)`)

| Method + URL | Query / Body | Kết quả |
|---|---|---|
| `GET /api/quan-tri-vien/tai-khoan` | `vaiTro?` (`Người dùng`/`Người bán`), `trangThaiTaiKhoan?`, `tuKhoa?`, `trang`, `gioiHan` | `data = { danhSach, phanTrang }` |
| `GET /api/quan-tri-vien/tai-khoan/:id` | — | `data.taiKhoan` |
| `PATCH /api/quan-tri-vien/tai-khoan/:id/trang-thai` | `trangThaiTaiKhoan` (`Hoạt động`/`Bị khóa`) | 200 `data.taiKhoan` |
| `PATCH /api/quan-tri-vien/tai-khoan/:id/mat-khau` | `matKhauMoi` | 200 (không trả mật khẩu) |
| `GET /api/quan-tri-vien/cua-hang` | `trangThaiHoatDong?`, `tuKhoa?`, `trang`, `gioiHan` | `data = { danhSach, phanTrang }` |
| `PATCH /api/quan-tri-vien/cua-hang/:id/trang-thai` | `trangThaiHoatDong` (`Hoạt động`/`Ngừng hoạt động`) | 200 `data.cuaHang` |

- **`danhSach` tài khoản:** `_id, email, hoTen, soDienThoai, vaiTro, trangThaiTaiKhoan`.
- **`taiKhoan` chi tiết:** thêm `ngaySinh, gioiTinh, diaChiNhanHang` và `cuaHang: { _id, tenCuaHang, trangThaiHoatDong } | null`. **Không bao giờ** có `matKhau`.
- **`danhSach` cửa hàng:** `_id, tenCuaHang, diaChi, trangThaiHoatDong, chuCuaHang: { _id, hoTen, email }, soSanPham`.

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Tài khoản
1. **Phạm vi (`QĐ-23`):** danh sách/chi tiết/thao tác chỉ áp dụng cho tài khoản **không** có vai trò `Quản trị viên` (lọc `vaiTro: { $nin: ['Quản trị viên'] }` — dùng hằng số). Tài khoản Quản trị viên (kể cả của chính mình) → **404** ở chi tiết, **409** "Không thể thao tác với tài khoản Quản trị viên" ở khóa/đặt lại mật khẩu *do người khác thực hiện*. (Mỗi Quản trị viên **tự đổi mật khẩu của chính mình** bằng chức năng đổi mật khẩu ở F07 — không thuộc form này.)
2. `tuKhoa`: tìm theo `email`, `hoTen`, `soDienThoai`, không phân biệt hoa/thường, **escape ký tự đặc biệt** (dùng `utils/thoatKyTuRegex.js` của F09).
3. **Khóa/mở khóa:** chỉ nhận hai giá trị `trangThaiTaiKhoan` hợp lệ; đặt lại đúng trạng thái đang có → 409 "Tài khoản đã ở trạng thái này". Có hiệu lực **ngay** (middleware F06 nạp lại DB mỗi request, nên phiên đang mở cũng bị chặn → 403).
4. **Đặt lại mật khẩu:** `matKhauMoi` ≥ `DO_DAI_MAT_KHAU_TOI_THIEU`; băm bằng bcryptjs; chỉ lưu bản băm; **không** log/không trả mật khẩu. Admin tự thông báo mật khẩu mới cho người dùng. *(Giới hạn đã biết: phiên đăng nhập cũ vẫn dùng được tới khi token hết hạn vì không có cơ chế thu hồi token — ghi vào báo cáo.)*
5. `:id` sai định dạng → 400; không tồn tại → 404. Lỗi giữa chừng → dữ liệu giữ nguyên (đúng Bảng 3.20).
6. Khóa tài khoản **không** tự động ngừng cửa hàng hay ẩn sản phẩm (tài liệu không quy định). Khi khóa một Người bán, giao diện **nhắc** Quản trị viên cân nhắc ngừng hoạt động cửa hàng ở mục Cửa hàng.

### 4.2 Cửa hàng (`QĐ-15`)
1. Chỉ đổi `trangThaiHoatDong` giữa `Hoạt động` ↔ `Ngừng hoạt động`; **không** sửa tên/mô tả/địa chỉ và **không** xóa cửa hàng.
2. Đặt lại đúng trạng thái đang có → 409.
3. Tác động (đã cài ở các form trước, kiểm tra lại ở đây): cửa hàng `Ngừng hoạt động` → sản phẩm **ẩn khỏi công khai** và **không thêm giỏ/đặt mới** (F09, F15, F16); Người bán **vẫn** xử lý được các đơn đã thanh toán (F20).
4. `soSanPham` tính bằng **một** truy vấn nhóm cho cả trang (không N+1); `chuCuaHang` lấy bằng `populate` có `select` hẹp.

## 5. Backend — file cần tạo/sửa

`routes/quanTriVienTaiKhoan.route.js`, `routes/quanTriVienCuaHang.route.js`; mở rộng `controllers/taiKhoan.controller.js` + `services/taiKhoan.service.js` (`quanTriLayDanhSachTaiKhoan`, `quanTriLayChiTietTaiKhoan`, `quanTriCapNhatTrangThaiTaiKhoan`, `quanTriDatLaiMatKhau`) và `controllers/cuaHang.controller.js` + `services/cuaHang.service.js` (`quanTriLayDanhSachCuaHang`, `quanTriCapNhatTrangThaiCuaHang`). Gắn vào `routes/index.js`.

## 6. Frontend

**File:** mở rộng `services/taiKhoan.api.js` và `services/cuaHang.api.js`; pages `quanTriVien/TaiKhoanQuanTriPage` (`/quan-tri-vien/tai-khoan`), `quanTriVien/CuaHangQuanTriPage` (`/quan-tri-vien/cua-hang`). Menu đã có từ F03.

### 6.1 `TaiKhoanQuanTriPage`
- `PageHeader` "Tài khoản". Thanh lọc (lưu trên URL): ô tìm (email/họ tên/SĐT), chọn **Vai trò** (Tất cả/Người dùng/Người bán), chọn **Trạng thái** (Tất cả/Hoạt động/Bị khóa).
- `DataTable`: *Người dùng* (`Avatar` + họ tên + email), *Số điện thoại*, *Vai trò* (các `Badge`), *Trạng thái* (`TrangThaiBadge`), *Thao tác* ("Xem"). `Pagination`; đủ tải/rỗng/lỗi.
- **"Xem" mở `Modal` chi tiết:** thông tin tài khoản (họ tên, email, ngày sinh, giới tính, SĐT, địa chỉ, vai trò, trạng thái) + nếu là Người bán: khối cửa hàng (tên, trạng thái, liên kết sang trang Cửa hàng đã lọc).
  - Nút **"Khóa tài khoản"** (nguy hiểm) hoặc **"Mở khóa"** tùy trạng thái → `ConfirmDialog`. Khi khóa Người bán, nội dung hộp thoại nhắc: "Cửa hàng của tài khoản này vẫn hiển thị. Hãy cân nhắc ngừng hoạt động cửa hàng ở mục Cửa hàng."
  - Nút **"Đặt lại mật khẩu"** mở hộp thoại nhỏ: ô **Mật khẩu mới** (có nút hiện/ẩn) + **Nhập lại** (kiểm tra ở frontend), gợi ý "Tối thiểu 8 ký tự. Hãy báo mật khẩu mới cho người dùng qua kênh an toàn.", nút chính **"Đặt lại mật khẩu"**. Thành công → toast, **xóa mật khẩu khỏi state**.
- Lỗi 409 (tài khoản Quản trị viên) hiển thị đúng thông báo.

### 6.2 `CuaHangQuanTriPage`
- `PageHeader` "Cửa hàng"; lọc trạng thái + ô tìm (tên cửa hàng, hỗ trợ nhận `tuKhoa` từ liên kết ở 6.1).
- `DataTable`: *Cửa hàng* (tên + địa chỉ), *Chủ cửa hàng* (họ tên + email), *Số sản phẩm*, *Trạng thái* (`TrangThaiBadge`), *Thao tác*: nút **"Ngừng hoạt động"** (nguy hiểm) hoặc **"Kích hoạt lại"** → `ConfirmDialog` nêu rõ tác động ("Sản phẩm của cửa hàng sẽ ẩn khỏi trang bán; khách không thể thêm giỏ hay đặt mới. Người bán vẫn xử lý được đơn đã thanh toán.").
- Đủ trạng thái tải/rỗng/lỗi; `Pagination`.

## 7. Không được làm

- Không xóa tài khoản/cửa hàng; không cho sửa email/vai trò/thông tin cá nhân của người khác.
- Không cho thao tác trên tài khoản Quản trị viên; không trả/ghi log mật khẩu.
- Không tự khóa/ngừng dây chuyền (khóa tài khoản ≠ ngừng cửa hàng).
- Không thêm tính năng "đăng nhập thay người dùng".

## 8. Tiêu chí hoàn thành

- [ ] `Người dùng`/Người bán gọi bất kỳ API ở Mục 3 → 403; chưa đăng nhập → 401.
- [ ] Danh sách **không** chứa tài khoản `Quản trị viên`; `GET`/`PATCH` vào `_id` của Admin → 404/409.
- [ ] Khóa tài khoản đang đăng nhập → request kế tiếp của họ trả 403 và đăng nhập lại bị từ chối với thông báo "bị khóa"; mở khóa → đăng nhập lại được.
- [ ] Đặt lại mật khẩu: đăng nhập bằng mật khẩu **cũ** thất bại, bằng mật khẩu mới thành công; mật khẩu < 8 ký tự → 400; trong DB là chuỗi băm; response/log không chứa mật khẩu.
- [ ] `tuKhoa` chứa ký tự đặc biệt (`.*(`) không gây lỗi.
- [ ] Ngừng hoạt động cửa hàng → sản phẩm biến mất khỏi `GET /api/san-pham`, thêm giỏ bị từ chối; Người bán vẫn gọi được `GET /api/nguoi-ban/don-hang` và đổi trạng thái đơn đã thanh toán. Kích hoạt lại → sản phẩm hiện lại.
- [ ] Số truy vấn của danh sách cửa hàng cố định (không N+1).
- [ ] Giao diện: lọc/URL, modal chi tiết, hộp thoại xác nhận, đặt lại mật khẩu hoạt động; ổn ở 360px.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Nêu giới hạn "token cũ vẫn dùng được sau khi đặt lại mật khẩu".
