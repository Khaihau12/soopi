# FORM F12 — NGƯỜI BÁN: QUẢN LÝ SẢN PHẨM, TỒN KHO, TẢI ẢNH

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F03, F08, F09 (hàm tính giá), F11 (middleware Người bán).

## 1. Mục tiêu

Người bán **thêm, sửa, xóa/ngừng bán sản phẩm của cửa hàng mình, cập nhật tồn kho, tải ảnh sản phẩm**, xem giá hiện tại (giá gốc + chương trình khuyến mãi đang áp dụng).

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.13** (Quản lý sản phẩm và tồn kho), **Bảng 3.14** (phần giá gốc). Collection **Bảng 3.29**.
- `AGENTS.md` Mục 8 (Giá, Tồn kho, Xóa dữ liệu). `02`: **`QĐ-10`** (tải ảnh), **`QĐ-14`** (xóa), `QĐ-22`.

## 3. API

| Method + URL | Quyền | Body / Query | Kết quả |
|---|---|---|---|
| `POST /api/tep-tin/hinh-anh` | Người bán hoặc Quản trị viên | `multipart/form-data`, field **`hinhAnh`** (1 file) | **201** `data.duongDan` (HTTPS URL Cloudinary) |
| `GET /api/nguoi-ban/san-pham` | Người bán | `tuKhoa`, `trangThaiKinhDoanh`, `danhMucId`, `trang`, `gioiHan` | `data = { danhSach, phanTrang }` |
| `GET /api/nguoi-ban/san-pham/:id` | Người bán | — | `data.sanPham` |
| `POST /api/nguoi-ban/san-pham` | Người bán | `tenSanPham`, `giaGoc`, `soLuongTon`, `danhMucId`, `hinhAnh[]`, `moTa?`, `trangThaiKinhDoanh?` | **201** `data.sanPham` |
| `PATCH /api/nguoi-ban/san-pham/:id` | Người bán | một hoặc nhiều: `tenSanPham`, `moTa`, `giaGoc`, `danhMucId`, `hinhAnh`, `trangThaiKinhDoanh` | 200 |
| `PATCH /api/nguoi-ban/san-pham/:id/ton-kho` | Người bán | `soLuongTon` | 200 |
| `DELETE /api/nguoi-ban/san-pham/:id` | Người bán | — | 200 (xem 4.4) |

**Phần tử `danhSach`:** `_id, tenSanPham, hinhAnh, giaGoc, giaBanThucTe, khuyenMaiApDung, soLuongTon, trangThaiKinhDoanh, danhMuc: { _id, tenDanhMuc }`.
**`sanPham` chi tiết:** các trường trên + `moTa`, `danhMucId`, `khuyenMaiDangApDung[]` (từ hàm tính giá F09).

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Sở hữu (quan trọng nhất)
- Mọi truy vấn/ghi trên `SanPham` đều có điều kiện `cuaHangId = req.cuaHang._id`. `cuaHangId` khi tạo lấy từ `req.cuaHang`, **bỏ qua** mọi `cuaHangId` trong body.
- Sản phẩm không thuộc cửa hàng mình → **404** "Không tìm thấy sản phẩm" (không dùng 403 để không lộ sự tồn tại). Đúng ngoại lệ Bảng 3.13: "không được xem hoặc chỉnh sửa sản phẩm của Người bán khác".

### 4.2 Kiểm tra dữ liệu (trong service)
- `tenSanPham`: bắt buộc, `trim`, ≤ `DO_DAI_TOI_DA.TEN_SAN_PHAM`. `moTa` ≤ `DO_DAI_TOI_DA.MO_TA`.
- `giaGoc`: **số nguyên ≥ 1** (giả định: sản phẩm không miễn phí; nêu trong báo cáo). `soLuongTon`: số nguyên ≥ 0 (không âm, không thập phân).
- `danhMucId`: phải **tồn tại** trong `DanhMuc` (không → 400 "Danh mục không hợp lệ").
- `hinhAnh`: mảng tối đa `ANH.TOI_DA_MOI_SAN_PHAM` (8); mỗi phần tử là chuỗi **bắt đầu bằng `/uploads/`** (đường dẫn do hệ thống tải lên sinh ra) hoặc URL `http(s)://`; chặn mọi dạng khác (đặc biệt `javascript:`/`data:`). Phần tử đầu là **ảnh chính**. **Đặt hàm kiểm tra này ở `utils/kiemTra.js` (`laDuongDanAnhHopLe`)** để F25 (banner) dùng lại.
- `trangThaiKinhDoanh` ∈ `TRANG_THAI_KINH_DOANH`; mặc định khi tạo là `Đang kinh doanh`.
- **Sửa (`PATCH /:id`) không cho đổi `soLuongTon`** — chỉ có một đường cập nhật tồn kho (4.3) để tránh hai nơi cùng ghi.
- Đổi `giaGoc` **không** đụng tới `ChiTietKhuyenMai`; giá bán thực tế vẫn được hàm F09 kẹp `min(giá KM, giaGoc)`.

### 4.3 Tồn kho (`PATCH /:id/ton-kho`)
- `soLuongTon` mới là số nguyên ≥ 0, sai → 400 "Số lượng tồn kho không hợp lệ".
- Vì đơn hàng có thể trừ kho cùng lúc, **không ghi đè mù**: đọc giá trị hiện tại rồi cập nhật có điều kiện `{ _id, cuaHangId, soLuongTon: giáTrịĐãĐọc }`; nếu không khớp thì đọc lại và thử tối đa 2 lần, vẫn lỗi → 409 "Tồn kho vừa thay đổi, vui lòng tải lại và thử lại".

### 4.4 Xóa (`QĐ-14`)
- Kiểm tra sản phẩm có được tham chiếu bởi `ChiTietDonHang`, `DanhGia`, `ChiTietKhuyenMai` hoặc `ChiTietGioHang` hay không (dùng `exists`).
  - **Có** → **không xóa cứng**: đặt `trangThaiKinhDoanh = 'Ngừng kinh doanh'`, trả message "Sản phẩm đã phát sinh dữ liệu nên được chuyển sang Ngừng kinh doanh".
  - **Không** → xóa cứng, message "Đã xóa sản phẩm".
- Frontend luôn qua `ConfirmDialog` trước khi gọi (Bảng 3.13).

### 4.5 Tải ảnh (`QĐ-10`)
- Dùng `multer` trong bộ nhớ, kiểm tra chữ ký ảnh rồi tải lên Cloudinary bằng backend; **chỉ** `image/jpeg`, `image/png`, `image/webp`, tối đa `ANH.DUNG_LUONG_TOI_DA_MB` = 5 MB. Sai loại/quá dung lượng → 400 với thông báo tiếng Việt. Cấu hình Cloudinary chỉ ở `backend/.env`.
- `app.js` tiếp tục phục vụ tĩnh `/uploads` cho dữ liệu cũ; ảnh mới lưu HTTPS URL. Ảnh thay/xóa chỉ được xóa trên Cloudinary khi không còn sản phẩm/banner tham chiếu.
- Chỉ Người bán hoặc Quản trị viên được tải. Không nhận tên file do client đặt.
- Không tự xóa file ảnh cũ khi sản phẩm bị sửa/xóa (chấp nhận ở mức đề tài; ghi nhận hướng phát triển).

## 5. Backend — file cần tạo/sửa

`middlewares/upload.middleware.js`, `routes/tepTin.route.js`, `controllers/tepTin.controller.js` (chỉ trả đường dẫn, không có nghiệp vụ nên không cần service), `routes/nguoiBanSanPham.route.js`, mở rộng `controllers/sanPham.controller.js` và `services/sanPham.service.js` với `nguoiBanLayDanhSachSanPham`, `nguoiBanLayChiTietSanPham`, `nguoiBanTaoSanPham`, `nguoiBanCapNhatSanPham`, `nguoiBanCapNhatTonKho`, `nguoiBanXoaSanPham`. Cập nhật `app.js`, `cauHinh.constant.js` (`ANH`), `.gitignore`. Cài `multer`.

## 6. Frontend

**File:** mở rộng `services/sanPham.api.js` (các hàm `nguoiBan...`), `services/tepTin.api.js` (`taiAnhLen` dùng `formData`); components `TaiAnhLen`, `SanPhamForm`; pages `nguoiBan/SanPhamNguoiBanPage`, `nguoiBan/FormSanPhamPage`. Dùng `taoUrlAnh` (F02) cho mọi thẻ `<img>` hiển thị ảnh đã tải lên. Route: `/nguoi-ban/san-pham`, `/nguoi-ban/san-pham/them`, `/nguoi-ban/san-pham/:id/sua`.

### 6.1 `SanPhamNguoiBanPage`
- `PageHeader` "Sản phẩm" + nút chính **"Thêm sản phẩm"**.
- Thanh lọc: ô tìm theo tên, chọn trạng thái, chọn danh mục (nằm trên URL query).
- `DataTable`: *Sản phẩm* (ảnh nhỏ 48px + tên), *Giá* (`GiaTien` cỡ nhỏ: thấy giá gốc và giá đang áp dụng), *Tồn kho* (số + nhãn "Hết hàng" khi 0 + nút nhỏ "Cập nhật"), *Trạng thái* (`TrangThaiBadge`), *Thao tác* ("Sửa", "Xóa"). Mobile → thẻ.
- "Cập nhật" tồn kho mở `Modal` nhỏ (`QuantityInput`/ô số, nút "Lưu"); lỗi 409 hiển thị rõ.
- "Xóa" → `ConfirmDialog`; toast hiển thị đúng message server (đã xóa hay đã chuyển ngừng kinh doanh) rồi tải lại danh sách.
- Đủ trạng thái tải/rỗng ("Cửa hàng chưa có sản phẩm" + nút "Thêm sản phẩm")/lỗi.

### 6.2 `FormSanPhamPage` (thêm/sửa) với `SanPhamForm`
Ba `Card` nối tiếp, một cột (rộng tối đa ~800px):
1. **Thông tin cơ bản:** Tên sản phẩm, Danh mục (`Select` từ `layDanhSachDanhMuc`), Mô tả (`Textarea`).
2. **Hình ảnh** (`TaiAnhLen`, có prop `toiDa` — mặc định 8, F25 dùng `toiDa = 1` cho banner): bấm hoặc kéo-thả để chọn nhiều ảnh, tải **lần lượt**, mỗi ảnh hiện thumbnail + trạng thái (đang tải/lỗi/xong); nút xóa ảnh; nút "Đặt làm ảnh chính"; hiện "Tối đa 8 ảnh, JPG/PNG/WEBP, ≤ 5 MB"; điều khiển được bằng bàn phím, có `aria-label`.
3. **Giá và kho:** Giá gốc (ô số + dòng xem trước `dinhDangTien`), **Tồn kho** (khi *thêm*: ô nhập số lượng ban đầu; khi *sửa*: hiện số hiện tại chỉ đọc + liên kết "Cập nhật tồn kho"), Trạng thái kinh doanh (`Select`).
   - Khi *sửa* và đang có khuyến mãi: khối thông tin chỉ đọc "Giá bán hiện tại: X — đang áp dụng chương trình 'Y' đến …" (đúng Bảng 3.14: thấy giá gốc cùng chương trình đang áp dụng).
- Nút: **"Lưu sản phẩm"** (chính) và "Hủy"; trên mobile thanh nút dính đáy màn hình. Kiểm tra dữ liệu trước khi gửi, lỗi hiện dưới từng ô, focus vào ô lỗi đầu tiên. Lưu xong → toast + về danh sách.

## 7. Không được làm

- Không cho sửa `cuaHangId`; không cho sửa tồn kho qua `PATCH /:id`.
- Không lưu ảnh dạng base64 trong DB; không nhận tên file từ client.
- Không xóa cứng sản phẩm đã phát sinh dữ liệu.
- Không tính hay lưu giá khuyến mãi vào `SanPham`.

## 8. Tiêu chí hoàn thành (kiểm tra cả sai quyền)

- [ ] Người bán A gọi `GET/PATCH/DELETE` sản phẩm của cửa hàng B → 404; `POST` kèm `cuaHangId` của B → vẫn tạo vào cửa hàng của A.
- [ ] `Người dùng` thường → 403; chưa đăng nhập → 401.
- [ ] `giaGoc = 0`, `-5`, `10.5`, `soLuongTon = -1`, danh mục không tồn tại, `hinhAnh` chứa `javascript:alert(1)` → đều 400.
- [ ] Tải file `.exe`/`.svg`/ảnh 6 MB → 400 với thông báo đúng; tải ảnh hợp lệ → URL Cloudinary mở được trên trình duyệt qua `taoUrlAnh`.
- [ ] Xóa sản phẩm **chưa** có tham chiếu → biến mất khỏi DB; **đã** có (chèn tạm một `DanhGia` hoặc `ChiTietKhuyenMai` tham chiếu) → chuyển `Ngừng kinh doanh`, không mất dữ liệu; và biến mất khỏi danh sách công khai (F09).
- [ ] Cập nhật tồn kho hợp lệ chạy; giá trị không hợp lệ → 400; gửi 2 request tồn kho đồng thời → không lỗi 500.
- [ ] Sản phẩm vừa tạo xuất hiện ở trang chủ (F09) nếu `Đang kinh doanh` và cửa hàng `Hoạt động`.
- [ ] Giao diện: thêm/sửa/xóa/tải ảnh/cập nhật kho chạy trọn vẹn, đủ 4 trạng thái, dùng được bàn phím, ổn ở 360px.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Nêu giả định `giaGoc ≥ 1` và việc cài `multer`.
