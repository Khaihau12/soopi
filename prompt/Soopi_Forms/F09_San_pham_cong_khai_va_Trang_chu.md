# FORM F09 — SẢN PHẨM CÔNG KHAI, GIÁ BÁN THỰC TẾ, TRANG CHỦ, BANNER

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F03, F04, F05, F08.

## 1. Mục tiêu

Khách và Người dùng **xem danh sách, tìm kiếm, lọc theo danh mục, xem chi tiết sản phẩm**; thấy **giá gốc và giá sau khuyến mãi** riêng biệt. Có **trang chủ** (banner, danh mục, sản phẩm mới). Đây cũng là đợt tạo **hàm tính giá bán thực tế** dùng lại cho giỏ hàng, đặt hàng, khuyến mãi sau này.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.4** (Xem, tìm kiếm sản phẩm). Collection **Bảng 3.29–3.31, 3.34**; chỉ mục **Bảng 3.45** (text `tenSanPham`).
- `AGENTS.md` Mục 8 (Giá và khuyến mãi). `02`: **`QĐ-12`**, **`QĐ-15`**, **`QĐ-21`**, `QĐ-11`.

## 3. API

| Method + URL | Quyền | Query | Kết quả |
|---|---|---|---|
| `GET /api/san-pham` | công khai | `tuKhoa`, `danhMucId`, `trang`, `gioiHan` | `data = { danhSach, phanTrang }` |
| `GET /api/san-pham/:id` | công khai | — | `data.sanPham` chi tiết |
| `GET /api/banner-quang-cao` | công khai | — | `data.danhSach` các banner `Kích hoạt` |

**Phần tử `danhSach` (sản phẩm):** `_id, tenSanPham, hinhAnh, giaGoc, giaBanThucTe, khuyenMaiApDung, soLuongTon, cuaHang: { _id, tenCuaHang }, danhMucId`.
**`sanPham` chi tiết:** các trường trên + `moTa`, `danhMuc: { _id, tenDanhMuc }`, `cuaHang: { _id, tenCuaHang, moTa, diaChi }`, `khuyenMaiDangApDung` (mảng).
**`khuyenMaiApDung` / phần tử `khuyenMaiDangApDung`:** `{ khuyenMaiId, tenKhuyenMai, loaiKhuyenMai, ngayKetThuc }` hoặc `null` nếu không có.
**Banner:** `{ _id, tieuDe, hinhAnh, noiDung }`.

> Các form sau sẽ **mở rộng** chi tiết sản phẩm (thống kê đánh giá ở F21, voucher ở F14) — không làm ở đây.

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Sản phẩm nào được hiển thị công khai
- `trangThaiKinhDoanh = 'Đang kinh doanh'` **và** cửa hàng của sản phẩm có `trangThaiHoatDong = 'Hoạt động'` (`QĐ-15`).
- Cách làm đơn giản: lấy trước danh sách `_id` cửa hàng đang hoạt động (`CuaHang.find({...}).distinct('_id')`), lọc `cuaHangId: { $in: ... }`.
- Chi tiết sản phẩm không thỏa điều kiện trên → **404** "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh".
- Sản phẩm `soLuongTon = 0` **vẫn hiển thị** (gắn nhãn "Hết hàng" ở giao diện).

### 4.2 Tìm kiếm và lọc (`QĐ-21`)
- `tuKhoa` (đã `trim`, tối đa 100 ký tự): dùng `$text` trên `tenSanPham`; có `tuKhoa` thì sắp theo độ liên quan (`textScore`) giảm dần, ngược lại sắp `_id` giảm dần (**mới nhất**; `SanPham` không có field ngày tạo).
- Nếu `$text` trả **0 kết quả** → thử lại bằng **regex không phân biệt hoa thường** trên `tenSanPham`, **bắt buộc escape ký tự đặc biệt** của từ khóa (tạo `utils/thoatKyTuRegex.js`). Không bao giờ đưa input thô vào `RegExp`.
- `danhMucId`: lọc theo danh mục (ID sai định dạng → 400).
- **Chưa làm** lọc/sắp xếp theo giá.
- Phân trang theo `01` Mục 4.2.

### 4.3 Hàm tính giá bán thực tế — **trọng tâm của form**
Tạo `services/giaSanPham.service.js` với hàm dùng chung (gợi ý tên) `gomGiaBanThucTe(danhSachSanPham, thoiDiem = new Date())`:

1. Tìm các `KhuyenMai` thỏa **cả hai**: `ngayBatDau ≤ thoiDiem ≤ ngayKetThuc` **và** `trangThai ≠ 'Đã kết thúc'` (đúng `QĐ-12`: ngày quyết định, trạng thái `Đã kết thúc` loại trừ chương trình đã bị vô hiệu hóa). *Không phụ thuộc* việc field `trangThai` đã được đồng bộ hay chưa.
2. Tìm các `ChiTietKhuyenMai` có `khuyenMaiId` thuộc tập trên và `sanPhamId` thuộc danh sách cần tính (**một truy vấn cho cả danh sách**, không truy vấn từng sản phẩm).
3. Giá theo từng chi tiết: có `giaKhuyenMai` → dùng; ngược lại có `tyLeGiam` → `Math.round(giaGoc × (100 − tyLeGiam) / 100)`. Sau đó **`Math.min(giá, giaGoc)`** và không âm.
4. Một sản phẩm có nhiều chương trình đang hiệu lực → xếp theo giá tăng dần; `giaBanThucTe` là giá **thấp nhất**; `khuyenMaiApDung` là chương trình tương ứng; `khuyenMaiDangApDung` là toàn bộ danh sách.
5. Không có chương trình → `giaBanThucTe = giaGoc`, `khuyenMaiApDung = null`.
6. **Không bao giờ ghi đè `giaGoc`**. **Không tin giá từ frontend.**
7. Hàm là **nguồn duy nhất** tính giá; F15 (giỏ), F16–F17 (đặt hàng), F13 (khuyến mãi) đều gọi lại hàm này.

Vì F13 chưa làm, chưa có dữ liệu khuyến mãi thật: **tự chèn thử** vài bản ghi `KhuyenMai` + `ChiTietKhuyenMai` bằng script tạm để kiểm tra, rồi xóa script.

### 4.4 Banner
Chỉ trả banner `trangThai = 'Kích hoạt'`, sắp `_id` giảm dần. (Admin quản lý banner ở F25.)

## 5. Backend — file cần tạo

`routes/sanPham.route.js`, `controllers/sanPham.controller.js`, `services/sanPham.service.js` (`layDanhSachSanPham`, `layChiTietSanPham`), `services/giaSanPham.service.js`, `routes/bannerQuangCao.route.js`, `controllers/bannerQuangCao.controller.js`, `services/bannerQuangCao.service.js`, `utils/thoatKyTuRegex.js`; gắn vào `routes/index.js`.
Dùng `.lean()` cho truy vấn chỉ đọc; chỉ `select` các field cần thiết.

## 6. Frontend

**File:** `services/sanPham.api.js`, `services/bannerQuangCao.api.js`; pages `TrangChuPage`, `DanhSachSanPhamPage`, `ChiTietSanPhamPage`; components `SanPhamCard`, `LuoiSanPham`, `BannerCarousel`, `DanhMucChips`, `ThuVienAnh`. Route `/`, `/san-pham`, `/san-pham/:id` dùng `UserLayout`. Hằng số mới trong `hangSo.js`: `CHU_KY_BANNER_MS = 5000`.

### 6.1 `SanPhamCard` — nhân vật chính của giao diện
- Mọi ảnh (thẻ sản phẩm, thư viện ảnh, banner) dùng hàm **`taoUrlAnh`** của F02 cho thuộc tính `src`.
- Cả thẻ là **một liên kết** tới chi tiết (không lồng nút bên trong).
- Ảnh vuông (`aspect-ratio: 1/1`, `object-fit: cover`, `loading="lazy"`, `alt` = tên sản phẩm); không có ảnh → khối nền trung tính + `Icon image`.
- Dưới ảnh: tên (tối đa 2 dòng, cắt bằng `line-clamp`), `GiaTien` (F03), tên cửa hàng (chữ phụ, 1 dòng).
- `soLuongTon = 0` → nhãn "Hết hàng" trên ảnh, ảnh hơi mờ.
- Viền `--vien`, `--boGocVua`, **không bóng**; hover chỉ đổi màu viền (không nhảy/phóng to).
- `LuoiSanPham`: lưới 2/3/4/5 cột (F03 Mục 9) + hiển thị `Skeleton` thẻ khi đang tải.

### 6.2 Trang chủ `TrangChuPage`
1. **Banner** (`BannerCarousel`): một banner mỗi lần; từ 768px chia đôi (ảnh | khối chữ `tieuDe` + `noiDung` trên nền đặc — **không** đè chữ lên ảnh để tránh lỗi tương phản), mobile xếp dọc. Tự chuyển mỗi `CHU_KY_BANNER_MS`, **dừng khi hover/focus** và **không tự chuyển** nếu `prefers-reduced-motion`. Có nút Trước/Sau và chấm điều hướng (đều có `aria-label`). Ảnh banner hiển thị theo tỷ lệ **16:9** (`aspect-ratio: 16/9`, `object-fit: cover`). Không có banner nào → **bỏ qua cả khu vực** (không hiện khung trống).
2. **Danh mục** (`DanhMucChips`): dải chip cuộn ngang trên mobile; mỗi chip dẫn tới `/san-pham?danhMucId=...`.
3. **Sản phẩm mới**: lưới 12 sản phẩm đầu + liên kết "Xem tất cả sản phẩm".
(Khu Flash Sale sẽ do F13 thêm vào giữa mục 2 và 3.)

### 6.3 Danh sách `DanhSachSanPhamPage`
- Đầu trang: tiêu đề ("Tất cả sản phẩm" hoặc `Kết quả cho "từ khóa"`) + tổng số kết quả.
- Bộ lọc danh mục bằng `DanhMucChips` (có chip "Tất cả"), chip đang chọn nổi bật.
- **Bộ lọc/từ khóa/trang nằm trên URL query** (`tuKhoa`, `danhMucId`, `trang`); đổi lọc thì về `trang=1`; nút Back của trình duyệt hoạt động đúng.
- `Pagination` dưới lưới.
- Không có kết quả → `EmptyState`: "Không tìm thấy sản phẩm phù hợp" + nút "Xóa bộ lọc" (đúng ngoại lệ trong Bảng 3.4).
- Ô tìm kiếm ở header (F03) điều hướng tới trang này.

### 6.4 Chi tiết `ChiTietSanPhamPage`
- Bố cục: từ 1024px hai cột (thư viện ảnh | thông tin); dưới 1024px xếp dọc.
- `ThuVienAnh`: ảnh lớn + dải ảnh nhỏ; chọn ảnh nhỏ bằng chuột/bàn phím đổi ảnh lớn; không có ảnh → khối thay thế.
- Thông tin: tên (h1), `GiaTien` cỡ lớn, nếu có khuyến mãi hiện chip chương trình (ví dụ "Flash Sale · kết thúc lúc 22:00 09/10/2026" bằng `dinhDangNgayGio`) — **hiển thị đúng `loaiKhuyenMai`**, "Còn N sản phẩm" (hoặc "Hết hàng"), danh mục, khối **thông tin cửa hàng** (tên, địa chỉ).
- Mô tả: hiển thị dạng **văn bản thuần** giữ xuống dòng (`white-space: pre-line`); **không** dùng `dangerouslySetInnerHTML`.
- Sản phẩm không tồn tại/ngừng bán → `ErrorState` 404 thân thiện + nút về danh sách.
- *(Nút "Thêm vào giỏ" do F15 thêm; mục đánh giá do F21; voucher do F14; nút chat do F23.)*

## 7. Không được làm

- Không lưu giá khuyến mãi vào `SanPham`; không ghi đè `giaGoc`.
- Không tính giá ở frontend (chỉ tính **phần trăm hiển thị** trong `GiaTien`).
- Không tạo trang riêng cho cửa hàng, không lọc/sắp xếp theo giá, không đếm lượt xem/đã bán (không có field).
- Không dùng `dangerouslySetInnerHTML`, không đưa input thô vào regex.

## 8. Tiêu chí hoàn thành

- [ ] Sản phẩm `Ngừng kinh doanh` hoặc thuộc cửa hàng `Ngừng hoạt động` không xuất hiện ở danh sách và chi tiết trả 404.
- [ ] Sản phẩm có chương trình đang hiệu lực: `giaBanThucTe < giaGoc`, `giaGoc` giữ nguyên trong DB. Có **hai** chương trình cùng lúc → lấy giá thấp hơn. Chương trình hết hạn/`Đã kết thúc`/chưa bắt đầu → không áp dụng. `giaKhuyenMai` lớn hơn `giaGoc` (dữ liệu sai) → `giaBanThucTe = giaGoc`.
- [ ] Danh sách 12 sản phẩm chỉ tốn **số truy vấn cố định** cho giá (không N+1).
- [ ] Tìm "áo th" (từ chưa đủ) vẫn ra "Áo thun…" nhờ regex dự phòng; từ khóa chứa `.*(` không gây lỗi.
- [ ] `danhMucId=abc` → 400; `trang=-1`/`gioiHan=1000` được chặn về giá trị hợp lệ.
- [ ] Banner `Vô hiệu hóa` không được trả ra.
- [ ] Giao diện: lưới đúng 2/3/4/5 cột; có đủ trạng thái tải/rỗng/lỗi; URL giữ bộ lọc; ổn ở 360px; tab được qua các thẻ sản phẩm.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Ghi lại **tên hàm tính giá** cuối cùng để các form sau dùng đúng.
