# FORM F10 — ĐĂNG KÝ TRỞ THÀNH NGƯỜI BÁN + QUẢN TRỊ VIÊN DUYỆT

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F03, F04, F06 (+ `seed:admin` đã chạy để có tài khoản Quản trị viên).

## 1. Mục tiêu

Người dùng gửi yêu cầu trở thành Người bán; Quản trị viên xem và **phê duyệt/từ chối**. Khi phê duyệt, tài khoản **vẫn là Người dùng và được bổ sung vai trò Người bán**, đồng thời có **một cửa hàng** để bắt đầu quản lý.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.11** (Đăng ký trở thành Người bán), **Bảng 3.19** (Duyệt đăng ký Người bán). Collection **Bảng 3.26, 3.27, 3.25**.
- `AGENTS.md` Mục 7, 8. `02`: `QĐ-22`.

## 3. API

| Method + URL | Quyền | Body / Query | Kết quả |
|---|---|---|---|
| `POST /api/yeu-cau-dang-ky-nguoi-ban` | đăng nhập | `tenCuaHang`, `diaChiCuaHang`, `moTaCuaHang?` | **201** `data.yeuCau` |
| `GET /api/yeu-cau-dang-ky-nguoi-ban/cua-toi` | đăng nhập | — | `data = { yeuCau, daLaNguoiBan }` — `yeuCau` là yêu cầu **gần nhất** (`_id` giảm dần) hoặc `null` |
| `GET /api/quan-tri-vien/yeu-cau-dang-ky-nguoi-ban` | Quản trị viên | `trangThai?`, `trang`, `gioiHan` | `data = { danhSach, phanTrang }`; mỗi phần tử kèm `taiKhoan: { _id, hoTen, email, soDienThoai }` |
| `GET /api/quan-tri-vien/yeu-cau-dang-ky-nguoi-ban/:id` | Quản trị viên | — | `data.yeuCau` kèm `taiKhoan: { _id, hoTen, email, soDienThoai, diaChiNhanHang, vaiTro, trangThaiTaiKhoan }` |
| `PATCH /api/quan-tri-vien/yeu-cau-dang-ky-nguoi-ban/:id/xet-duyet` | Quản trị viên | `trangThai`: `Đã phê duyệt` hoặc `Đã từ chối` | 200 |

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Gửi yêu cầu
1. Bắt buộc `tenCuaHang`, `diaChiCuaHang`; `moTaCuaHang` tùy chọn. `trim`, độ dài tối đa theo hằng số (thêm `DO_DAI_TOI_DA.TEN_CUA_HANG = 100`; mô tả/địa chỉ dùng hằng số có sẵn). *(Việc "địa chỉ bắt buộc" là giả định nhỏ vì Bảng 3.11 chỉ nói "thông tin cần thiết" — nêu trong báo cáo.)*
2. `taiKhoanId` lấy từ `req.taiKhoan`, **không** nhận từ body. `ngayGui = now`, `trangThai = 'Chờ phê duyệt'`.
3. Từ chối (409) nếu: tài khoản **đã có vai trò `Người bán`** hoặc **đã có `CuaHang`** ("Tài khoản của bạn đã là Người bán"), hoặc **đã có yêu cầu `Chờ phê duyệt`** ("Bạn đã có yêu cầu đang chờ phê duyệt") — đúng ngoại lệ Bảng 3.11.
4. Yêu cầu trước đó `Đã từ chối` thì **được gửi yêu cầu mới** (quan hệ `TaiKhoan 1 – 0..* YeuCau`).

### 4.2 Xét duyệt (Bảng 3.19) — chú ý không có transaction
Thứ tự thực hiện (service `quanTriXetDuyetYeuCau`):

1. Kiểm tra `trangThai` gửi lên thuộc {`Đã phê duyệt`, `Đã từ chối`}, ngoài ra → 400.
2. **Giành quyền xử lý bằng một thao tác nguyên tử có điều kiện:** `findOneAndUpdate({ _id, trangThai: 'Chờ phê duyệt' }, { trangThai: <đích> })`. Không có bản ghi nào bị đổi → 404 nếu yêu cầu không tồn tại, **409 "Yêu cầu đã được xử lý"** nếu đã xử lý. (Hai Quản trị viên bấm cùng lúc chỉ một người thành công.)
3. **Từ chối:** xong, không đổi quyền tài khoản.
4. **Phê duyệt:** lần lượt
   a. Nạp `TaiKhoan`; không tồn tại hoặc `Bị khóa` → **hoàn tác** (đưa yêu cầu về `Chờ phê duyệt`) và trả 404/409 ("Tài khoản đang bị khóa nên chưa thể phê duyệt").
   b. Nếu tài khoản **chưa có** `CuaHang`: tạo `CuaHang` từ yêu cầu: `tenCuaHang ← tenCuaHang`, `moTa ← moTaCuaHang`, `diaChi ← diaChiCuaHang`, `trangThaiHoatDong = 'Hoạt động'`, `taiKhoanId`. (Nếu đã có thì dùng lại, không tạo trùng.)
   c. `TaiKhoan.updateOne({ _id }, { $addToSet: { vaiTro: 'Người bán' } })` — `$addToSet` để vẫn giữ `Người dùng` và không trùng.
5. **Bù trừ khi lỗi giữa chừng:** nếu bước 4b/4c ném lỗi → xóa `CuaHang` vừa tạo (nếu do lần này tạo) và **đưa yêu cầu về `Chờ phê duyệt`**, rồi trả lỗi (đúng câu "trạng thái yêu cầu trước đó được giữ nguyên" của Bảng 3.19).
6. Vai trò mới có hiệu lực **ngay** ở request kế tiếp vì middleware F06 nạp lại tài khoản từ DB. Không cần đăng nhập lại.

> Việc "tạo `CuaHang` khi phê duyệt" là **suy ra từ mô hình dữ liệu**: Người bán phải có cửa hàng (`CuaHang.taiKhoanId`), và yêu cầu chứa đúng ba thông tin cửa hàng dự kiến. Nêu trong báo cáo cuối.

## 5. Backend — file cần tạo

`routes/yeuCauDangKyNguoiBan.route.js`, `routes/quanTriVienYeuCauDangKyNguoiBan.route.js`, `controllers/yeuCauDangKyNguoiBan.controller.js`, `services/yeuCauDangKyNguoiBan.service.js` (`guiYeuCauDangKyNguoiBan`, `layYeuCauCuaToi`, `quanTriLayDanhSachYeuCau`, `quanTriLayChiTietYeuCau`, `quanTriXetDuyetYeuCau`). Gắn vào `routes/index.js`. Dùng `populate('taiKhoanId', 'hoTen email soDienThoai ...')` chỉ với field cần thiết (**không bao giờ** lấy `matKhau`).

## 6. Frontend

**File:** `services/yeuCauDangKyNguoiBan.api.js`; pages `DangKyNguoiBanPage` (người dùng) và `quanTriVien/DuyetNguoiBanPage`; route `/dang-ky-nguoi-ban` (bọc `BaoVeRoute`, `UserLayout`) và `/quan-tri-vien/duyet-nguoi-ban`.

**Cập nhật chung:**
- `XacThucContext` (F06): **tải lại `GET /xac-thuc/toi` khi tab trình duyệt được focus lại** để vai trò mới (sau khi được duyệt) hiện ra mà không cần đăng nhập lại.
- `MENU_TAI_KHOAN`: nếu **chưa** là Người bán → mục "Đăng ký bán hàng" (`/dang-ky-nguoi-ban`); nếu **đã** là Người bán → mục "Kênh người bán" (`/nguoi-ban`).

### 6.1 `DangKyNguoiBanPage`
Một thẻ ở giữa, rộng tối đa ~560px. Hiển thị **một trong bốn trạng thái** (dựa trên `daLaNguoiBan` và `yeuCau`):

| Trạng thái | Hiển thị |
|---|---|
| Đã là Người bán | Thông báo "Bạn đã là Người bán" + nút chính "Đến kênh người bán" |
| Có yêu cầu `Chờ phê duyệt` | Thẻ tình trạng: tên cửa hàng, ngày gửi (`dinhDangNgayGio`), `Badge` "Chờ phê duyệt" + dòng giải thích ngắn "Quản trị viên sẽ xem xét yêu cầu của bạn". **Không** hiện form |
| Yêu cầu gần nhất `Đã từ chối` | Khối cảnh báo "Yêu cầu trước của bạn đã bị từ chối" + form gửi lại (điền sẵn dữ liệu cũ) |
| Chưa có yêu cầu | Form |

Form: **Tên cửa hàng** (bắt buộc), **Địa chỉ cửa hàng** (bắt buộc), **Mô tả cửa hàng** (`Textarea`, không bắt buộc). Nút chính duy nhất: **"Gửi yêu cầu"**. Thành công → toast "Đã gửi yêu cầu. Vui lòng chờ phê duyệt." và chuyển sang trạng thái "Chờ phê duyệt". Lỗi 409 hiển thị rõ ràng.

### 6.2 `DuyetNguoiBanPage` (Quản trị viên)
- `PageHeader` "Duyệt đăng ký Người bán".
- `Tabs`: **Chờ phê duyệt** (mặc định) · Đã phê duyệt · Đã từ chối.
- `DataTable`: *Người gửi* (họ tên + email), *Tên cửa hàng*, *Ngày gửi*, *Trạng thái* (`TrangThaiBadge`), nút **"Xem"**; `Pagination`.
- "Xem" mở `Modal` rộng: hai khối **Thông tin tài khoản** (họ tên, email, số điện thoại, địa chỉ nhận hàng, trạng thái tài khoản) và **Thông tin cửa hàng đăng ký** (tên, địa chỉ, mô tả, ngày gửi). Với yêu cầu `Chờ phê duyệt`: hai nút **"Phê duyệt"** (chính) và **"Từ chối"** (nguy hiểm), mỗi nút mở `ConfirmDialog` ("Phê duyệt cửa hàng 'X'? Tài khoản sẽ được bổ sung quyền Người bán."). Yêu cầu đã xử lý: chỉ xem.
- Lỗi 409 (đã xử lý bởi người khác / tài khoản bị khóa) hiển thị rõ ràng và tải lại danh sách.
- Đủ trạng thái tải/rỗng/lỗi. Tab "Chờ phê duyệt" rỗng → "Không có yêu cầu nào đang chờ".

## 7. Không được làm

- Không cho Người dùng tự thêm vai trò `Người bán` bằng bất kỳ API nào ngoài luồng duyệt.
- Không thêm field `lyDoTuChoi`, `nguoiDuyetId`, `ngayDuyet` (không có trong tài liệu).
- Không tạo `CuaHang` ngay khi gửi yêu cầu (chỉ khi được phê duyệt).
- Không xóa yêu cầu cũ.

## 8. Tiêu chí hoàn thành

- [ ] Gửi yêu cầu lần 2 khi còn `Chờ phê duyệt` → 409; tài khoản đã là Người bán → 409; thiếu `tenCuaHang` → 400.
- [ ] Người dùng thường gọi API `quan-tri-vien` → 403.
- [ ] **Phê duyệt:** yêu cầu thành `Đã phê duyệt`; `vaiTro` = `['Người dùng','Người bán']` (không mất `Người dùng`, không trùng); có **đúng một** `CuaHang` với dữ liệu từ yêu cầu, `Hoạt động`; `GET /xac-thuc/toi` của chính người đó cho thấy vai trò mới **không cần đăng nhập lại**.
- [ ] Phê duyệt/từ chối lần hai cùng yêu cầu → 409. Hai request phê duyệt gửi đồng thời → chỉ một thành công, chỉ một `CuaHang`.
- [ ] **Từ chối:** `vaiTro` giữ nguyên, không tạo `CuaHang`; người dùng gửi lại được yêu cầu mới.
- [ ] Phê duyệt tài khoản đang `Bị khóa` → 409 và yêu cầu **vẫn `Chờ phê duyệt`**.
- [ ] Giả lập lỗi khi tạo `CuaHang` (ví dụ tạm làm thiếu field bắt buộc trong lúc thử) → yêu cầu quay về `Chờ phê duyệt`, không còn `CuaHang` mồ côi.
- [ ] Giao diện: bốn trạng thái của trang đăng ký đúng; vai trò mới hiện trong menu sau khi quay lại tab; ổn ở 360px.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Nêu rõ hai giả định (địa chỉ bắt buộc; tạo `CuaHang` khi duyệt).
