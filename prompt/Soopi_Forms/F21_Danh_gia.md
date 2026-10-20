# FORM F21 — ĐÁNH GIÁ SẢN PHẨM

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F09, F12, F19, F20 (cần đơn `Hoàn thành` để kiểm thử).

## 1. Mục tiêu

- **Ai cũng xem được** đánh giá của sản phẩm (không cần đăng nhập).
- **Chủ đơn** đánh giá sản phẩm **sau khi đơn `Hoàn thành`**, mỗi dòng đơn hàng tối đa một đánh giá.
- **Người bán** chỉ **xem** đánh giá sản phẩm của cửa hàng mình (không sửa/xóa).

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.9** (Đánh giá sản phẩm), **Bảng 3.13** (Người bán xem đánh giá, không chỉnh sửa/xóa), **Bảng 3.4**. Collection **Bảng 3.40**; chỉ mục **Bảng 3.45** (`chiTietDonHangId` unique, `sanPhamId` index).
- `AGENTS.md` Mục 8 (Đánh giá, đổi trả). `02`: `QĐ-22`.

## 3. API

| Method + URL | Quyền | Body / Query | Kết quả |
|---|---|---|---|
| `GET /api/danh-gia` | công khai | `sanPhamId` (**bắt buộc**), `trang`, `gioiHan` | `data = { danhSach, phanTrang, thongKe }` |
| `GET /api/danh-gia/co-the-danh-gia` | đăng nhập | `sanPhamId` | `data.danhSach` các dòng đơn đủ điều kiện đánh giá |
| `POST /api/danh-gia` | đăng nhập | `chiTietDonHangId`, `soSao`, `noiDung` | **201** `data.danhGia` |
| `GET /api/nguoi-ban/danh-gia` | Người bán | `sanPhamId?`, `soSao?`, `trang`, `gioiHan` | `data = { danhSach, phanTrang, thongKe? }` |

- **Phần tử `danhSach` (công khai):** `_id, soSao, noiDung, ngayDanhGia, taiKhoan: { hoTen }`.
- **`thongKe`:** `{ diemTrungBinh (làm tròn 1 chữ số thập phân, 0 nếu chưa có), soDanhGia, phanBoSao: { "1": n, "2": n, "3": n, "4": n, "5": n } }`.
- **`co-the-danh-gia`:** mảng `{ chiTietDonHangId, donHangId, ngayTao }`.
- **Phần tử Người bán:** thêm `sanPham: { _id, tenSanPham, hinhAnh }`.
- **Mở rộng F09:** `GET /api/san-pham/:id` thêm `thongKeDanhGia: { diemTrungBinh, soDanhGia }`.

> Đặt route `/co-the-danh-gia` đủ rõ để không bị nhầm với tham số động.

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Gửi đánh giá (`POST`)
1. Dòng đơn `chiTietDonHangId` phải tồn tại và **đơn của dòng đó thuộc về `req.taiKhoan`** (nếu không → **404** "Không tìm thấy sản phẩm trong đơn hàng của bạn").
2. Đơn phải `trangThaiXuLy = 'Hoàn thành'`; nếu không → **409** "Bạn chỉ có thể đánh giá sau khi đơn hàng hoàn thành" (Bảng 3.9).
3. Mỗi dòng đơn **tối đa một** đánh giá: đã có → **409** "Bạn đã đánh giá sản phẩm này"; **vẫn phải xử lý lỗi trùng khóa `11000`** (đua) thành cùng 409.
4. `soSao`: số nguyên 1–5. `noiDung`: bắt buộc, `trim`, ≤ `DO_DAI_TOI_DA.NOI_DUNG` (1000). Sai → 400 (đúng ngoại lệ "nội dung không hợp lệ / chưa nhập").
5. `sanPhamId` **lấy từ dòng đơn** (không nhận từ client); `taiKhoanId` từ token; `ngayDanhGia = now`.
6. Không có API sửa/xóa đánh giá.

### 4.2 Đọc
- **Công khai:** thiếu/sai `sanPhamId` → 400. Sắp `ngayDanhGia` giảm dần (đồng hạng thì `_id` giảm dần). `taiKhoan` chỉ trả **`hoTen`** (không email/SĐT/ID).
- **`thongKe`** tính bằng **một truy vấn nhóm** (`aggregate` theo `sanPhamId`), không đọc toàn bộ đánh giá về để tính.
- **`co-the-danh-gia`:** các `ChiTietDonHang` của sản phẩm đó thuộc đơn của mình, đơn `Hoàn thành`, **chưa có** `DanhGia`. Dùng truy vấn cố định, không lặp từng dòng.
- **Người bán:** chỉ đánh giá của sản phẩm thuộc cửa hàng mình. `sanPhamId` gửi lên mà sản phẩm không thuộc cửa hàng mình → **404**. Không có `sanPhamId` → gộp tất cả sản phẩm của cửa hàng (lấy danh sách `_id` sản phẩm của cửa hàng trước, lọc bằng `$in`). Có bộ lọc `soSao` (1–5). `thongKe` chỉ trả khi có `sanPhamId`.
- Đánh giá **vẫn hiển thị** nếu sản phẩm sau này bị ngừng kinh doanh (chỉ phía Người bán xem được).

## 5. Backend — file cần tạo/sửa

`routes/danhGia.route.js` (`GET /` công khai; `GET /co-the-danh-gia` và `POST /` có `batBuocDangNhap`), `routes/nguoiBanDanhGia.route.js`, `controllers/danhGia.controller.js`, `services/danhGia.service.js` (`layDanhSachDanhGia`, `layDongCoTheDanhGia`, `taoDanhGia`, `nguoiBanLayDanhSachDanhGia`, `tinhThongKeDanhGia`); sửa `services/sanPham.service.js` (thêm `thongKeDanhGia` vào chi tiết). Gắn vào `routes/index.js`.

## 6. Frontend

**File:** `services/danhGia.api.js`; components `SaoDanhGia` (hiển thị và nhập sao), `DanhGiaForm`, `KhoiDanhGiaSanPham`; page `nguoiBan/DanhGiaNguoiBanPage` (`/nguoi-ban/danh-gia`); cập nhật `ChiTietSanPhamPage` và `ChiTietDonHangPage`.

### 6.1 `SaoDanhGia`
- Chế độ **hiển thị** (số sao, có thể lẻ → làm tròn nửa sao hoặc tô theo %) dùng `Icon star/starFill`, kèm `aria-label` "4,5 trên 5 sao".
- Chế độ **nhập**: nhóm radio 1–5 sao (cỡ lớn, vùng bấm ≥ 44px), điều khiển bằng bàn phím (mũi tên), có nhãn chữ bên cạnh khi chọn ("Rất tệ … Rất tốt" — chữ hiển thị do frontend đặt, chỉ để gợi ý).

### 6.2 Trang chi tiết sản phẩm — mục "Đánh giá sản phẩm" (`KhoiDanhGiaSanPham`)
- **Tổng quan:** điểm trung bình lớn + `SaoDanhGia` + "N đánh giá", kèm biểu đồ thanh ngang phân bổ 5→1 sao (vẽ bằng CSS, không thư viện).
- **Danh sách:** mỗi đánh giá = `Avatar` chữ cái đầu + họ tên + sao + ngày (`dinhDangNgay`) + nội dung (văn bản thuần, giữ xuống dòng). `Pagination`. Chưa có → `EmptyState` "Sản phẩm chưa có đánh giá nào".
- **Nút "Viết đánh giá":** chỉ hiện khi đã đăng nhập **và** `co-the-danh-gia` có ít nhất 1 dòng. Mở `Modal` `DanhGiaForm`: (nếu nhiều dòng đủ điều kiện) `Select` "Đơn hàng" (ghi ngày đặt) · `SaoDanhGia` nhập · `Textarea` nội dung (đếm ký tự) · nút chính **"Gửi đánh giá"**. Thành công → toast "Cảm ơn bạn đã đánh giá", đóng hộp thoại, tải lại danh sách + thống kê.
- Chưa đăng nhập: dòng gợi ý nhỏ "Đăng nhập và mua sản phẩm để viết đánh giá" (không chặn xem).
- `ChiTietSanPhamPage` hiển thị `thongKeDanhGia` (sao + số đánh giá) cạnh tên sản phẩm; bấm vào cuộn tới mục đánh giá.

### 6.3 Chi tiết đơn hàng (F19) — gắn nút theo từng dòng
- `coTheDanhGia = true` → nút **"Đánh giá"** mở `DanhGiaForm` (đã biết `chiTietDonHangId`, không cần chọn đơn).
- `daDanhGia = true` → nhãn "Đã đánh giá" (không có nút).

### 6.4 `DanhGiaNguoiBanPage`
- `PageHeader` "Đánh giá của khách".
- Bộ lọc (lưu trên URL): chọn **sản phẩm** (`Select` nạp từ `nguoiBanLayDanhSachSanPham`, tối đa 50 sản phẩm mỗi lần — nêu giới hạn trong báo cáo; có ô tìm theo tên nếu cửa hàng nhiều sản phẩm) và chip lọc **số sao**.
- Khi chọn sản phẩm: khối thống kê (điểm trung bình, phân bổ sao).
- Danh sách **chỉ đọc** (không có nút sửa/xóa/trả lời): sản phẩm (ảnh nhỏ + tên), người đánh giá (họ tên), sao, ngày, nội dung. `Pagination`; đủ tải/rỗng/lỗi.
- Thêm liên kết "Xem đánh giá" ở mỗi dòng của trang sản phẩm Người bán (F12) trỏ tới `/nguoi-ban/danh-gia?sanPhamId=`.

## 7. Không được làm

- Không cho đánh giá khi đơn chưa `Hoàn thành`, hoặc đánh giá dòng của người khác.
- Không cho sửa/xóa đánh giá (Người dùng, Người bán, Quản trị viên đều không có API sửa/xóa trong báo cáo).
- Không nhận `sanPhamId`/`taiKhoanId` từ client khi tạo đánh giá.
- Không lộ email/SĐT của người đánh giá; không dùng `dangerouslySetInnerHTML`.
- Không thêm trả lời đánh giá, ảnh đánh giá, lượt "hữu ích" (không có field).

## 8. Tiêu chí hoàn thành

- [ ] Đơn chưa `Hoàn thành` → `POST` trả 409; đơn của người khác → 404; `soSao` = 0/6/2.5/chữ → 400; `noiDung` rỗng/toàn khoảng trắng/quá dài → 400.
- [ ] Đánh giá lần hai cùng dòng → 409; hai request đồng thời → một thành công, một 409 (không lỗi 500).
- [ ] Sau khi đánh giá: `co-the-danh-gia` không còn dòng đó; chi tiết đơn (F19) có `daDanhGia = true`; đánh giá xuất hiện ở trang sản phẩm và `thongKe` đổi đúng (kiểm tra số học: ví dụ 5 sao + 4 sao → 4,5).
- [ ] Khách chưa đăng nhập xem được đánh giá; `GET /danh-gia` thiếu `sanPhamId` → 400.
- [ ] Response công khai không có email/SĐT/ID tài khoản.
- [ ] Người bán A xem đánh giá sản phẩm của cửa hàng B → 404; không `sanPhamId` → chỉ thấy đánh giá sản phẩm của chính mình. Người bán gọi `PATCH/DELETE` đánh giá → không có route (404/405).
- [ ] `thongKe` tính bằng một truy vấn nhóm.
- [ ] Giao diện: nhập sao bằng bàn phím; modal giữ focus; danh sách phân trang; thống kê cập nhật sau khi gửi; ổn ở 360px.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9.
