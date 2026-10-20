# FORM F13 — KHUYẾN MÃI & FLASH SALE (Người bán, Quản trị viên, hiển thị công khai)

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F09 (hàm tính giá), F11, F12.

## 1. Mục tiêu

- **Người bán** tạo/sửa/xóa chương trình khuyến mãi của cửa hàng mình (giảm giá hoặc Flash Sale) cho một hoặc nhiều sản phẩm.
- **Quản trị viên** tạo chương trình **Toàn sàn** (kể cả Flash Sale) và **vô hiệu hóa** chương trình bất kỳ.
- **Người dùng** xem các chương trình đang diễn ra; giá bán thực tế tự cập nhật nhờ hàm F09.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.14** (Người bán), **Bảng 3.23** (Quản trị viên), **Bảng 3.4** (hiển thị giá gốc/giá KM, Flash Sale). Collection **Bảng 3.30, 3.31**.
- `AGENTS.md` Mục 8 (Giá và khuyến mãi). `02`: **`QĐ-12`**, **`QĐ-14`**, `QĐ-22`.

## 3. API

| Method + URL | Quyền | Body / Query | Kết quả |
|---|---|---|---|
| `GET /api/khuyen-mai` | công khai | `loaiKhuyenMai?` | `data.danhSach` các chương trình **đang hiệu lực** |
| `GET /api/san-pham?khuyenMaiId=` | công khai | (mở rộng F09) | sản phẩm thuộc chương trình đang hiệu lực đó |
| `GET /api/nguoi-ban/khuyen-mai` | Người bán | `trangThai?`, `trang`, `gioiHan` | `data = { danhSach, phanTrang }` (chỉ của cửa hàng mình) |
| `GET /api/nguoi-ban/khuyen-mai/:id` | Người bán | — | `data.khuyenMai` kèm `chiTiet[]` |
| `POST /api/nguoi-ban/khuyen-mai` | Người bán | xem **Mẫu body** | **201** |
| `PATCH /api/nguoi-ban/khuyen-mai/:id` | Người bán | như `POST` (các field cần đổi) | 200 |
| `DELETE /api/nguoi-ban/khuyen-mai/:id` | Người bán | — | 200 |
| `GET /api/quan-tri-vien/khuyen-mai` | Quản trị viên | `phamVi?`, `loaiKhuyenMai?`, `trangThai?`, `trang`, `gioiHan` | danh sách tất cả chương trình |
| `GET /api/quan-tri-vien/khuyen-mai/:id` | Quản trị viên | — | chi tiết |
| `POST /api/quan-tri-vien/khuyen-mai` | Quản trị viên | như Người bán (không có `phamVi`/`cuaHangId`) | **201**, `phamVi = Toàn sàn` |
| `PATCH`, `DELETE /api/quan-tri-vien/khuyen-mai/:id` | Quản trị viên | — | chỉ với chương trình `Toàn sàn` |
| `PATCH /api/quan-tri-vien/khuyen-mai/:id/vo-hieu-hoa` | Quản trị viên | — | 200 |

**Mẫu body `POST`/`PATCH`:**
```json
{
  "tenKhuyenMai": "Sale cuối tuần",
  "loaiKhuyenMai": "Flash Sale",
  "ngayBatDau": "2026-10-10T00:00:00+07:00",
  "ngayKetThuc": "2026-10-12T23:59:00+07:00",
  "chiTiet": [
    { "sanPhamId": "...", "tyLeGiam": 20 },
    { "sanPhamId": "...", "giaKhuyenMai": 150000 }
  ]
}
```
**`chiTiet` trả về:** `{ _id, sanPham: { _id, tenSanPham, hinhAnh, giaGoc }, tyLeGiam, giaKhuyenMai, giaSauKhuyenMai }` (`giaSauKhuyenMai` tính bằng cùng công thức F09).
**Phần tử danh sách:** `_id, tenKhuyenMai, loaiKhuyenMai, phamVi, ngayBatDau, ngayKetThuc, trangThai, cuaHang: { _id, tenCuaHang } | null, soSanPham`.

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Trạng thái theo thời gian (`QĐ-12`)
- Hàm `tinhTrangThaiKhuyenMai(khuyenMai, thoiDiem)` (nhận **cả bản ghi**, không chỉ hai ngày): **nếu `khuyenMai.trangThai` đang là `Đã kết thúc` thì luôn trả `Đã kết thúc`** (trạng thái **cố định, một chiều** — đúng `QĐ-12` v2, không bao giờ bị ghi đè thành `Chưa bắt đầu`/`Đang hoạt động` dù ngày còn ở tương lai). Ngược lại: trước `ngayBatDau` → `Chưa bắt đầu`; trong khoảng → `Đang hoạt động`; sau `ngayKetThuc` → `Đã kết thúc`.
- **Mọi response** trả `trangThai` đã **tính theo thời điểm hiện tại** (không phụ thuộc giá trị cũ trong DB).
- Hàm `dongBoTrangThaiKhuyenMai()` cập nhật field `trangThai` trong DB cho khớp (vài `updateMany`); gọi khi tạo/sửa và khi đọc danh sách. Hàm này **không bao giờ** đưa chương trình `Đã kết thúc` quay lại trạng thái khác.
- Hàm tính giá F09 dựa trên **ngày trong khoảng** **và** `trangThai ≠ Đã kết thúc`, nên giá luôn đúng dù DB chưa đồng bộ — và chương trình bị vô hiệu hóa **không bao giờ** được áp dụng lại dù ngày còn hiệu lực.

### 4.2 Kiểm tra khi tạo/sửa (làm hết **trước khi ghi**, lỗi → 400)
1. `tenKhuyenMai` bắt buộc, `trim`, ≤ 200 ký tự. `loaiKhuyenMai` ∈ {`Giảm giá`, `Flash Sale`}.
2. `ngayBatDau`, `ngayKetThuc` là ngày hợp lệ; `ngayKetThuc > ngayBatDau` **và** `ngayKetThuc > hiện tại` (Bảng 3.14/3.23: thời gian không hợp lệ → báo lỗi, không lưu).
3. `chiTiet` có **ít nhất 1** phần tử, **không trùng** `sanPhamId`.
4. Mỗi phần tử có **đúng một** trong hai: `tyLeGiam` (số, `0 < x < 100`) **hoặc** `giaKhuyenMai` (số nguyên, `1 ≤ x ≤ giaGoc` của sản phẩm). Giá sau khuyến mãi **lớn hơn giá gốc → không cho lưu** (Bảng 3.14).
5. Sản phẩm phải **tồn tại**. Người bán: phải thuộc **cửa hàng của mình** (không → 400 "Sản phẩm không thuộc cửa hàng của bạn"). Quản trị viên: sản phẩm của bất kỳ cửa hàng.
6. Người bán: `phamVi = 'Cửa hàng'`, `cuaHangId = req.cuaHang._id` (bỏ qua giá trị từ body). Quản trị viên: `phamVi = 'Toàn sàn'`, `cuaHangId` rỗng.
7. Cho phép một sản phẩm thuộc nhiều chương trình cùng thời gian (giá thấp nhất thắng, đã xử lý ở F09).

### 4.3 Sửa, xóa, vô hiệu hóa
- **Sở hữu:** Người bán chỉ thao tác chương trình có `cuaHangId` của mình (khác → 404). Quản trị viên chỉ `PATCH`/`DELETE` chương trình `Toàn sàn`; chương trình của cửa hàng chỉ **vô hiệu hóa** được (thao tác khác → 409 "Chương trình của cửa hàng chỉ có thể vô hiệu hóa").
- **Sửa:** chương trình `Đã kết thúc` → 409 "Chương trình đã kết thúc, không thể chỉnh sửa". Cập nhật `chiTiet` theo thứ tự an toàn: tạo/cập nhật dòng mới **trước**, xóa dòng bị bỏ **sau cùng**.
- **Xóa** (`QĐ-14`): xóa cứng chương trình và toàn bộ `ChiTietKhuyenMai` của nó (đơn hàng đã lưu snapshot giá nên không bị ảnh hưởng). Giá của sản phẩm quay về `giaGoc` hoặc chương trình khác.
- **Vô hiệu hóa** (Quản trị viên) — **`QĐ-12` v2:** chỉ đặt `trangThai = 'Đã kết thúc'` bằng thao tác nguyên tử có điều kiện (`findOneAndUpdate({ _id, trangThai: { $ne: 'Đã kết thúc' } }, ...)`); **KHÔNG sửa `ngayBatDau`/`ngayKetThuc`** → không bao giờ tạo khoảng ngày sai (kể cả chương trình `Chưa bắt đầu`), giữ nguyên lịch sử. Áp dụng như nhau cho `Đang hoạt động` và `Chưa bắt đầu`. Đã `Đã kết thúc` → 409. Không có thao tác bật lại; muốn dùng tiếp thì tạo chương trình mới. Vì tra giá luôn loại trừ `trangThai = Đã kết thúc` (F09), giá quay về ngay.

### 4.4 Công khai
- `GET /api/khuyen-mai`: chỉ chương trình đang hiệu lực (ngày trong khoảng, `trangThai ≠ Đã kết thúc`); sắp theo `ngayKetThuc` tăng dần. Với chương trình `Cửa hàng`, chỉ trả khi cửa hàng `Hoạt động`.
- `GET /api/san-pham?khuyenMaiId=`: nếu chương trình không còn hiệu lực → trả danh sách rỗng (không lỗi). Vẫn áp dụng đầy đủ điều kiện hiển thị sản phẩm của F09.

## 5. Backend — file cần tạo/sửa

`routes/khuyenMai.route.js`, `routes/nguoiBanKhuyenMai.route.js`, `routes/quanTriVienKhuyenMai.route.js`, `controllers/khuyenMai.controller.js`, `services/khuyenMai.service.js` (`layDanhSachKhuyenMaiDangDienRa`, `nguoiBan...`, `quanTri...`, `tinhTrangThaiKhuyenMai`, `dongBoTrangThaiKhuyenMai`); sửa `services/sanPham.service.js` (thêm lọc `khuyenMaiId`). Dùng chung một hàm kiểm tra `kiemTraDuLieuKhuyenMai` cho cả hai nhóm quyền.

## 6. Frontend

**Cập nhật `DUONG_DAN`/route** (thêm vào bản đồ ở F02): `/nguoi-ban/khuyen-mai/them`, `/nguoi-ban/khuyen-mai/:id/sua`, `/quan-tri-vien/khuyen-mai/them`, `/quan-tri-vien/khuyen-mai/:id/sua`.
**File:** `services/khuyenMai.api.js`; component `KhuyenMaiForm` (dùng chung hai vai trò, prop `phamVi`); pages `nguoiBan/KhuyenMaiNguoiBanPage`, `nguoiBan/FormKhuyenMaiPage`, `quanTriVien/KhuyenMaiQuanTriPage`, `quanTriVien/FormKhuyenMaiQuanTriPage`; cập nhật `TrangChuPage`, `DanhSachSanPhamPage`.

### 6.1 Danh sách chương trình (Người bán / Quản trị viên)
- `PageHeader` + nút chính **"Tạo chương trình"**.
- `DataTable`: *Tên*, *Loại* (`Badge`), *Thời gian* (bắt đầu – kết thúc, `dinhDangNgayGio`), *Trạng thái* (`TrangThaiBadge`), *Số sản phẩm* (và *Phạm vi/Cửa hàng* ở bản Quản trị viên), *Thao tác*.
- Người bán: "Sửa" (ẩn khi `Đã kết thúc`), "Xóa" (`ConfirmDialog`). Quản trị viên: "Sửa/Xóa" chỉ với `Toàn sàn`; "Vô hiệu hóa" (`ConfirmDialog`: "Chương trình sẽ dừng ngay và không thể bật lại") cho chương trình chưa kết thúc.
- Bộ lọc (trạng thái; Quản trị viên thêm phạm vi, loại) lưu trên URL; `Pagination`; đủ 4 trạng thái.

### 6.2 `KhuyenMaiForm` (trang riêng, 2 `Card`)
1. **Thông tin chương trình:** Tên, Loại (`Select`), Bắt đầu và Kết thúc (`<input type="datetime-local">`, ghi chú "Giờ Việt Nam"; khi gửi chuyển sang ISO).
2. **Sản phẩm tham gia:** nút "Chọn sản phẩm" mở `Modal` có ô tìm theo tên và danh sách chọn nhiều (Người bán dùng `GET /nguoi-ban/san-pham`; Quản trị viên dùng `GET /san-pham` công khai). Các sản phẩm đã chọn hiện trong bảng: *Sản phẩm* · *Giá gốc* · *Kiểu giảm* (`Select`: "Theo phần trăm" / "Theo giá sau giảm") · *Giá trị* · *Giá sau khuyến mãi* (**xem trước chỉ để hiển thị**, cùng công thức với backend) · nút xóa. Lỗi hiện **ngay trên dòng** (ví dụ "Giá sau giảm phải ≤ giá gốc").
- Nút chính duy nhất **"Lưu chương trình"**, nút "Hủy". Backend vẫn là nơi quyết định cuối cùng.

### 6.3 Hiển thị cho khách
- **Trang chủ:** thêm khu **Flash Sale** (giữa danh mục và sản phẩm mới): lấy chương trình `Flash Sale` đang hiệu lực kết thúc **sớm nhất** → tiêu đề "Flash Sale", dòng "Kết thúc lúc …", dải 6 sản phẩm (`SanPhamCard`) + liên kết "Xem tất cả" tới `/san-pham?khuyenMaiId=…`. Dưới đó (nếu có) dải thẻ các chương trình `Giảm giá` đang diễn ra, mỗi thẻ dẫn tới danh sách lọc. Không có chương trình → **bỏ qua cả khu**.
- **Danh sách sản phẩm:** khi có `khuyenMaiId` hiện tên chương trình ở tiêu đề kèm nút "Xem tất cả sản phẩm".
- `GiaTien`/chip khuyến mãi ở thẻ và chi tiết đã có từ F09.

## 7. Không được làm

- Không ghi đè `giaGoc`; không lưu giá khuyến mãi vào `SanPham`.
- Không thêm trạng thái "Vô hiệu hóa" vào `KhuyenMai.trangThai`; không thêm giá trị `loaiKhuyenMai` mới.
- Không bật lại chương trình đã kết thúc; không tính giá ở frontend (ngoài xem trước hiển thị).
- Không cho Người bán chọn sản phẩm của cửa hàng khác.

## 8. Tiêu chí hoàn thành

- [ ] `giaKhuyenMai > giaGoc` → 400; `tyLeGiam = 0/100/150` → 400; có cả `tyLeGiam` lẫn `giaKhuyenMai` → 400; `chiTiet` rỗng → 400; `ngayKetThuc ≤ ngayBatDau` hoặc đã qua → 400; chọn sản phẩm cửa hàng khác → 400; không có dòng nào được ghi khi có lỗi.
- [ ] Người bán A sửa/xóa chương trình của B → 404; `POST` kèm `phamVi: "Toàn sàn"` → vẫn lưu `Cửa hàng`.
- [ ] Tạo chương trình đang hiệu lực → `GET /api/san-pham` (F09) trả `giaBanThucTe < giaGoc` đúng công thức; `giaGoc` trong DB không đổi. Chương trình chưa bắt đầu/hết hạn/bị vô hiệu hóa → giá quay về `giaGoc`.
- [ ] Quản trị viên tạo Toàn sàn thành công; sửa/xóa chương trình của cửa hàng → 409; vô hiệu hóa chương trình của cửa hàng → giá quay về ngay; vô hiệu hóa lần hai → 409. **Ca góp ý (bắt buộc thử):** chương trình bắt đầu 20/10, kết thúc 25/10; vô hiệu hóa ngày 15/10 → `trangThai = Đã kết thúc`, **`ngayBatDau`/`ngayKetThuc` vẫn 20/10 và 25/10**; sau đó chạy `dongBoTrangThaiKhuyenMai()` và mở danh sách vào các ngày 15/10, 21/10, 26/10 (giả lập thời gian) → trạng thái **luôn** `Đã kết thúc`, **không** quay lại `Chưa bắt đầu`/`Đang hoạt động`, giá luôn là `giaGoc`.
- [ ] Xóa chương trình xóa luôn `ChiTietKhuyenMai`.
- [ ] `GET /api/khuyen-mai` không trả chương trình hết hạn/chưa bắt đầu/của cửa hàng `Ngừng hoạt động`.
- [ ] `Người dùng` thường gọi API Người bán/Quản trị viên → 403.
- [ ] Giao diện: form chạy trọn vẹn với nhiều sản phẩm; xem trước giá đúng; Flash Sale hiện trang chủ khi có, biến mất khi không; ổn ở 360px.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9.
