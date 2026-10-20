# FORM F25 — QUẢN TRỊ VIÊN: GIAO DỊCH, SẢN PHẨM TOÀN HỆ THỐNG, BANNER

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F08, F09, F12 (`TaiAnhLen`), F18, F24.

## 1. Mục tiêu

Ba mảng quản trị độc lập, làm lần lượt trong cùng form:
1. **Giao dịch thanh toán:** xem danh sách và chi tiết (chỉ đọc).
2. **Sản phẩm toàn hệ thống:** xem và **xử lý** (đổi trạng thái kinh doanh).
3. **Banner quảng cáo:** thêm, sửa, bật/tắt, xóa.

(Khuyến mãi và voucher hệ thống đã làm ở F13, F14.)

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.21** (danh mục & sản phẩm), **Bảng 3.22** (giao dịch), **Bảng 3.23** (banner). Collection **Bảng 3.29, 3.37, 3.39, 3.34**.
- `AGENTS.md` Mục 7, 8. `02`: **`QĐ-10`** (ảnh), **`QĐ-14`** (xóa banner), **`QĐ-15`** (xử lý sản phẩm), **`QĐ-03`/`QĐ-16`** (đơn hủy cần hoàn tiền thủ công, giao dịch COD), `QĐ-22`.

## 3. API (tất cả: Quản trị viên — `router.use(...batBuocQuanTriVien)`)

| Method + URL | Query / Body | Kết quả |
|---|---|---|
| `GET /api/quan-tri-vien/giao-dich-thanh-toan` | `trangThaiThanhToan?`, `phuongThucThanhToan?` (`VNPay`/`COD`), `canHoanTien?` (`true`), `tuKhoa?` (mã giao dịch), `tuNgay?`, `denNgay?`, `trang`, `gioiHan` | `data = { danhSach, phanTrang }` |
| `GET /api/quan-tri-vien/giao-dich-thanh-toan/:id` | — | `data.giaoDich` |
| `GET /api/quan-tri-vien/san-pham` | `tuKhoa?`, `danhMucId?`, `cuaHangId?`, `trangThaiKinhDoanh?`, `trang`, `gioiHan` | `data = { danhSach, phanTrang }` |
| `GET /api/quan-tri-vien/san-pham/:id` | — | `data.sanPham` |
| `PATCH /api/quan-tri-vien/san-pham/:id/trang-thai` | `trangThaiKinhDoanh` | 200 `data.sanPham` |
| `GET /api/quan-tri-vien/banner-quang-cao` | `trangThai?`, `trang`, `gioiHan` | `data = { danhSach, phanTrang }` |
| `POST /api/quan-tri-vien/banner-quang-cao` | `tieuDe`, `hinhAnh`, `noiDung?`, `trangThai?` | **201** |
| `PATCH /api/quan-tri-vien/banner-quang-cao/:id` | `tieuDe`, `hinhAnh`, `noiDung` | 200 |
| `PATCH /api/quan-tri-vien/banner-quang-cao/:id/trang-thai` | `trangThai` (`Kích hoạt`/`Vô hiệu hóa`) | 200 |
| `DELETE /api/quan-tri-vien/banner-quang-cao/:id` | — | 200 |

**Giao dịch (danh sách):** `_id, maGiaoDich, soTien, phuongThucThanhToan, trangThaiThanhToan, thoiGianTao, thoiGianHoanTat, soDonHang, soDonCanHoanTien, nguoiMua: { hoTen, email }`.
**Giao dịch (chi tiết):** như trên + `danhSachDonHang: [{ _id, ngayTao, cuaHang: { _id, tenCuaHang }, tongThanhToan, phuongThucThanhToan, trangThaiThanhToan, trangThaiXuLy, canHoanTien }]` (đơn liên quan — đúng Bảng 3.22: "mã giao dịch, đơn hàng liên quan, số tiền, phương thức, trạng thái").
**Sản phẩm (danh sách):** `_id, tenSanPham, hinhAnh, giaGoc, giaBanThucTe, soLuongTon, trangThaiKinhDoanh, danhMuc: { _id, tenDanhMuc }, cuaHang: { _id, tenCuaHang, trangThaiHoatDong }, chuCuaHang: { hoTen }`; chi tiết thêm `moTa`.
**Banner:** `_id, tieuDe, hinhAnh, noiDung, trangThai`.

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Giao dịch (chỉ đọc)
- **Không có** thao tác sửa/xóa/hoàn tiền nào. Không trả dữ liệu nhạy cảm của VNPay (chữ ký, secret).
- **Đơn cần hoàn tiền thủ công (`QĐ-03`, F30):** `canHoanTien = true` khi đơn `Đã hủy` **và** `trangThaiThanhToan = Đã thanh toán` **và** `phuongThucThanhToan = VNPay` **và** `tongThanhToan > 0` (suy ra từ dữ liệu có sẵn, **không thêm field**). `soDonCanHoanTien` đếm số đơn như vậy trong giao dịch. Bộ lọc `canHoanTien=true` chỉ trả giao dịch có ít nhất một đơn như vậy (lấy `giaoDichId` từ các đơn thỏa điều kiện trước, rồi lọc `$in`). Hệ thống **không** gọi VNPay để hoàn tiền; Quản trị viên hoàn tiền ngoài hệ thống.
- Giao dịch `COD` hiển thị bình thường (mỗi đơn một giao dịch; `Chờ thanh toán` cho tới khi Người bán chuyển đơn `Hoàn thành`).
- `tuNgay`/`denNgay` lọc theo `thoiGianTao`, hiểu theo múi giờ `Asia/Ho_Chi_Minh` (đầu ngày → cuối ngày). Tạo `utils/thoiGian.js` với hàm `layKhoangNgay(tuNgay, denNgay)` (kiểm tra ngày hợp lệ; `tuNgay > denNgay` → 400 "Khoảng thời gian không hợp lệ"). **F26 và F27 dùng lại hàm này.**
- `tuKhoa` khớp một phần `maGiaoDich` (escape ký tự đặc biệt).
- `soDonHang`, `nguoiMua` lấy bằng truy vấn **theo lô** (`$in` các `giaoDichId` của trang), không N+1. `nguoiMua` lấy từ `taiKhoanId` của đơn đầu tiên thuộc giao dịch. Giao dịch không có đơn → `nguoiMua = null`.

### 4.2 Xử lý sản phẩm (`QĐ-15`)
- Chỉ đổi `trangThaiKinhDoanh` giữa `Đang kinh doanh` ↔ `Ngừng kinh doanh`; đặt lại đúng trạng thái đang có → 409. **Không** sửa nội dung, giá, tồn kho của sản phẩm; **không** xóa.
- Hậu quả (đã cài sẵn ở form trước, kiểm tra lại): ngừng kinh doanh → ẩn khỏi công khai (F09), dòng trong giỏ bị gắn `coTheMua = false` (F15), đơn đã tạo **không bị ảnh hưởng**.
- **Hạn chế đã biết (ghi trong báo cáo):** Người bán vẫn có thể bật lại sản phẩm bị Quản trị viên ngừng, vì không có field phân biệt người đặt.
- `giaBanThucTe` dùng hàm tính giá F09 **theo lô**. Bộ lọc `cuaHangId` phải là ID hợp lệ (sai → 400).

### 4.3 Banner
- `tieuDe` bắt buộc, `trim`, ≤ 200; `noiDung` tùy chọn, ≤ `DO_DAI_TOI_DA.NOI_DUNG`.
- `hinhAnh` bắt buộc, kiểm tra **cùng quy tắc** với ảnh sản phẩm (F12): chuỗi bắt đầu `/uploads/` hoặc URL `http(s)://`, chặn `javascript:`/`data:`. **Tách hàm kiểm tra này thành tiện ích dùng chung** (`utils/kiemTra.js`) nếu F12 chưa tách, và dùng ở cả hai nơi.
- Tạo mới: `trangThai` mặc định `Kích hoạt`. Bật/tắt chỉ đổi `trangThai`.
- Xóa: **xóa cứng** (`QĐ-14`); không xóa file ảnh trên đĩa.
- Dữ liệu không hợp lệ → 400, không lưu (đúng Bảng 3.23: "thông tin không hợp lệ thì không lưu").
- Banner `Kích hoạt` hiển thị ở trang chủ qua `GET /api/banner-quang-cao` (F09); `Vô hiệu hóa` thì không.

## 5. Backend — file cần tạo/sửa

`routes/quanTriVienGiaoDichThanhToan.route.js`, `routes/quanTriVienSanPham.route.js`, `routes/quanTriVienBannerQuangCao.route.js`; mở rộng `controllers/`/`services/` của `giaoDichThanhToan`, `sanPham`, `bannerQuangCao` (hàm tiền tố `quanTri...`); `utils/thoiGian.js`; `utils/kiemTra.js` (tách `laDuongDanAnhHopLe`, nếu chưa có). Gắn vào `routes/index.js`.

## 6. Frontend

**File:** mở rộng `services/giaoDichThanhToan.api.js`, `services/sanPham.api.js`, `services/bannerQuangCao.api.js`; pages `quanTriVien/GiaoDichQuanTriPage` (`/quan-tri-vien/giao-dich`), `quanTriVien/SanPhamQuanTriPage` (`/quan-tri-vien/san-pham`), `quanTriVien/BannerQuanTriPage` (`/quan-tri-vien/banner`).

### 6.1 `GiaoDichQuanTriPage`
- Bộ lọc (URL): trạng thái, **phương thức (VNPay/COD)**, ô tìm mã giao dịch, từ ngày – đến ngày (`<input type="date">`; từ > đến → báo lỗi ngay, không gọi API), và công tắc **"Chỉ hiện giao dịch cần hoàn tiền"** (`canHoanTien=true`).
- `DataTable`: *Mã giao dịch*, *Người mua*, *Số tiền*, *Phương thức*, *Trạng thái* (`TrangThaiBadge`), *Thời gian tạo*, *Số đơn*, "Xem". "Xem" mở `Modal`: thông tin giao dịch + bảng **đơn liên quan** (cửa hàng, tổng, phương thức, trạng thái thanh toán và xử lý); đơn `canHoanTien` có `Badge` cảnh báo **"Cần hoàn tiền thủ công"** kèm số tiền. Chỉ đọc. Dòng giao dịch có `soDonCanHoanTien > 0` cũng hiện nhãn cảnh báo ở bảng.
- Đủ tải/rỗng ("Không có giao dịch phù hợp")/lỗi; `Pagination`.

### 6.2 `SanPhamQuanTriPage`
- Bộ lọc (URL): ô tìm tên, danh mục (`Select`), trạng thái kinh doanh; (lọc theo cửa hàng nhận `cuaHangId` từ URL — liên kết từ trang khác).
- `DataTable`: *Sản phẩm* (ảnh + tên), *Cửa hàng/Người bán* (tên cửa hàng + chủ + `Badge` nếu cửa hàng `Ngừng hoạt động`), *Giá* (`GiaTien` nhỏ), *Tồn kho*, *Trạng thái*, *Thao tác*: nút **"Ngừng kinh doanh"** (nguy hiểm) / **"Cho kinh doanh lại"** → `ConfirmDialog` nêu tác động ("Sản phẩm sẽ ẩn khỏi trang bán. Đơn hàng đã đặt không bị ảnh hưởng."). Dòng "Xem" mở `Modal` chi tiết chỉ đọc (mô tả, ảnh).
- Đủ trạng thái; `Pagination`.

### 6.3 `BannerQuanTriPage`
- `PageHeader` "Banner quảng cáo" + nút chính **"Thêm banner"**.
- `DataTable`: *Hình* (thumbnail), *Tiêu đề*, *Nội dung* (cắt gọn), *Trạng thái* (**công tắc** Bật/Tắt gọi `PATCH .../trang-thai`, có `aria-label`), *Thao tác* ("Sửa", "Xóa" qua `ConfirmDialog`).
- Form thêm/sửa trong `Modal`: Tiêu đề, Nội dung (`Textarea`), **Hình ảnh** (`TaiAnhLen` ở chế độ **một ảnh**, có xem trước; gợi ý "Ảnh ngang tỷ lệ 16:9"), nút chính **"Lưu banner"**. Lỗi 400 hiện dưới ô.
- Kiểm tra `BannerCarousel` (F09) hiển thị ảnh theo tỷ lệ **16:9** (`aspect-ratio: 16/9`, `object-fit: cover`); chỉnh nếu F09 làm khác.
- Đủ trạng thái tải/rỗng ("Chưa có banner nào")/lỗi.

## 7. Không được làm

- Không thêm chức năng hoàn tiền/hủy/sửa giao dịch; không cho đổi trạng thái đơn.
- Không sửa nội dung sản phẩm của Người bán; không xóa sản phẩm.
- Không thêm field `link`, `thuTu`, `ngayBatDau/ngayKetThuc` cho banner (không có trong tài liệu).
- Không lộ dữ liệu VNPay nhạy cảm.

## 8. Tiêu chí hoàn thành

- [ ] `Người dùng`/Người bán gọi các API ở Mục 3 → 403; chưa đăng nhập → 401.
- [ ] **Hoàn tiền thủ công:** đơn VNPay đã thanh toán rồi bị hủy (F30 trường hợp B) → `canHoanTien = true`, giao dịch xuất hiện khi lọc `canHoanTien=true`; đơn 0đ hoặc COD bị hủy → **không** có cờ.
- [ ] Giao dịch `COD` hiện đúng, lọc theo phương thức đúng.
- [ ] Giao dịch: lọc theo trạng thái/mã/khoảng ngày đúng (kiểm tra mép ngày theo giờ Việt Nam); `tuNgay > denNgay` → 400; chi tiết liệt kê đủ đơn liên quan; không có route sửa/xóa (404/405); số truy vấn danh sách cố định.
- [ ] Sản phẩm: `Ngừng kinh doanh` → biến mất khỏi `GET /api/san-pham`, dòng giỏ có `coTheMua=false`, đơn cũ không đổi; đặt lại trạng thái cũ → 409; lọc theo cửa hàng/danh mục đúng.
- [ ] Banner: tạo với `hinhAnh` hợp lệ → xuất hiện ở trang chủ; `javascript:` hoặc thiếu `tieuDe` → 400; tắt → biến mất khỏi trang chủ; xóa → mất hẳn.
- [ ] Công tắc banner và nút "Ngừng kinh doanh" cập nhật giao diện đúng sau khi gọi API; lỗi hiển thị rõ.
- [ ] Giao diện ổn ở 360px; mọi hành động nguy hiểm qua hộp thoại xác nhận.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Nêu hạn chế "Người bán có thể bật lại sản phẩm đã bị Quản trị viên ngừng".
