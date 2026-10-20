# FORM F27 — QUẢN TRỊ VIÊN: TỔNG QUAN, BÁO CÁO VÀ PHÂN TÍCH

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F10, F24, F25 (`utils/thoiGian.js`), **F26** (`TheThongKe`, `BoChonKhoangThoiGian`, `BieuDoDoanhThu` dùng `recharts`, hàm điền mốc trống).

## 1. Mục tiêu

Quản trị viên xem **tổng quan hệ thống** (doanh thu, đơn hàng, số Người dùng, Người bán, sản phẩm), **doanh thu và đơn theo thời gian**, **sản phẩm bán chạy**, **danh mục được quan tâm**, **xu hướng mua hàng**, và **hiệu suất từng Người bán**.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.24** (Báo cáo và phân tích). Collection **Bảng 3.25, 3.27, 3.29, 3.37–3.39**.
- `AGENTS.md` Mục 7. `02` (v2): **`QĐ-18`** (doanh thu theo ngày hoàn thành; nhãn "danh mục được quan tâm"), `QĐ-11` (`recharts`), `QĐ-22`. `02` Mục E: **CR-03**.

## 3. API (Quản trị viên — `router.use(...batBuocQuanTriVien)`)

Tham số chung `tuNgay`, `denNgay` (`YYYY-MM-DD`, múi giờ `Asia/Ho_Chi_Minh`, gồm cả hai đầu; mặc định 30 ngày gần nhất; quy tắc hợp lệ như F26).

| Method + URL | Thêm tham số | Kết quả `data` |
|---|---|---|
| `GET /api/quan-tri-vien/thong-ke/tong-quan` | — | xem dưới |
| `GET /api/quan-tri-vien/thong-ke/doanh-thu` | `nhom` (`ngay`/`thang`) | `{ nhom, danhSach: [{ moc, doanhThu, soDon }] }` (đủ mọi mốc, mốc trống = 0) |
| `GET /api/quan-tri-vien/thong-ke/san-pham-ban-chay` | `gioiHan` (mặc định 5, tối đa 20) | `{ danhSach: [{ sanPham: { _id, tenSanPham, hinhAnh }, cuaHang: { _id, tenCuaHang }, soLuongDaBan, doanhThu }] }` |
| `GET /api/quan-tri-vien/thong-ke/danh-muc-quan-tam` | `gioiHan` (mặc định 10, tối đa 20) | `{ danhSach: [{ danhMuc: { _id, tenDanhMuc }, soLuongDaBan, doanhThu }] }` |
| `GET /api/quan-tri-vien/thong-ke/hieu-suat-nguoi-ban` | `trang`, `gioiHan` | `{ danhSach: [{ cuaHang: { _id, tenCuaHang }, chuCuaHang: { hoTen }, soDonHoanThanh, doanhThu, soSanPhamDaBan }], phanTrang }` |

**`tong-quan`:**
```
{ khoangThoiGian: { tuNgay, denNgay },
  tongDoanhThu, soDonHoanThanh, soDonDaThanhToan,
  soVoiKyTruoc: { doanhThu, soDonHoanThanh },       // % thay đổi so với kỳ liền trước cùng độ dài; null nếu kỳ trước bằng 0
  soNguoiDung, soNguoiBan, soCuaHang, soSanPham, soSanPhamDangKinhDoanh,   // số liệu hiện tại, không lọc ngày
  soYeuCauChoDuyet }                                  // yêu cầu đăng ký Người bán đang Chờ phê duyệt
```

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Định nghĩa (`QĐ-18` — **không tự đổi**)
- **Doanh thu** = Σ `DonHang.tongThanhToan` của đơn `trangThaiXuLy = 'Hoàn thành'` (và `Đã thanh toán`), **lọc theo `DonHang.ngayHoanThanh`** trong khoảng (CR-03; thiếu `ngayHoanThanh` thì dùng `ngayTao`). Là *tổng giá trị thanh toán của đơn đã hoàn thành*, **không phải lợi nhuận**. **Số đơn hoàn thành** = số đơn như trên. Đơn `Đã hủy` (kể cả đơn đã thanh toán rồi bị hủy) không được tính.
- **`soDonDaThanhToan`** = số đơn có `trangThaiThanhToan = 'Đã thanh toán'` tạo trong khoảng (lọc theo `ngayTao`; phản ánh mức độ phát sinh đơn, gồm cả đơn đang xử lý và đơn COD đã hoàn thành).
- **Sản phẩm bán chạy / số sản phẩm đã bán** = Σ `ChiTietDonHang.soLuong` của các đơn `Hoàn thành` trong khoảng; `doanhThu` dòng = Σ `thanhTien`.
- **Danh mục được quan tâm** = Σ `soLuong` nhóm theo `SanPham.danhMucId` trên các đơn `Hoàn thành` trong khoảng (lọc theo `ngayHoanThanh`; dùng `$lookup` tới collection `SanPham`, rồi lấy tên danh mục theo lô). **Lưu ý khi diễn giải (góp ý `QĐ-18`):** chỉ số này đo **số lượng đã bán** chứ không đo lượt xem/tìm kiếm (hệ thống không thu thập). Vì vậy giao diện **bắt buộc** đặt tên "Danh mục được quan tâm" kèm chú thích "tính theo số lượng đã bán".
- **Xu hướng mua hàng** = chuỗi `doanh-thu` (doanh thu + số đơn theo ngày/tháng) kết hợp `soVoiKyTruoc` ở `tong-quan`. Công thức `soVoiKyTruoc` = `(kỳ này − kỳ trước) / kỳ trước × 100`, làm tròn 1 chữ số thập phân; kỳ trước = khoảng liền ngay trước có **cùng số ngày**. *(Đây là cách diễn giải hợp lý của "phân tích xu hướng" khi dữ liệu duy nhất có sẵn là đơn hàng; nêu trong báo cáo.)*
- **Hiệu suất Người bán** = theo từng cửa hàng: số đơn `Hoàn thành`, doanh thu, số sản phẩm đã bán trong khoảng; sắp theo `doanhThu` giảm dần; **chỉ gồm cửa hàng có phát sinh** trong khoảng.
- **Số liệu hiện tại:** `soNguoiDung` = đếm `TaiKhoan` có `vaiTro` chứa `Người dùng` (Người bán cũng là Người dùng; Quản trị viên không tính); `soNguoiBan` = đếm có `vaiTro` chứa `Người bán`; `soCuaHang` = đếm `CuaHang`; `soSanPham` = tất cả `SanPham`; `soSanPhamDangKinhDoanh` = `Đang kinh doanh`.

### 4.2 Khoảng thời gian, dữ liệu rỗng, lỗi
- Dùng `layKhoangNgay` (F25). Sai/ngược/dài hơn `SO_NGAY_THONG_KE_TOI_DA` (F26) → **400** "Khoảng thời gian không hợp lệ, vui lòng chọn lại".
- Từng khối **không có dữ liệu** → số 0/mảng rỗng (200); frontend hiển thị `EmptyState` riêng cho khối đó và vẫn hiện các khối còn lại ("chỉ hiển thị các thống kê hiện có").
- **Lỗi truy xuất** ở bất kỳ API nào → hiển thị lỗi và **không** hiển thị kết quả dở dang (xem 6).

### 4.3 Triển khai
- Aggregation pipeline MongoDB, không cộng ở Node; nhóm ngày/tháng dùng `timezone: 'Asia/Ho_Chi_Minh'`; tái sử dụng `dienMocTrong` (F26).
- `aggregate` **không** tự ép kiểu `ObjectId` — ép tay khi so sánh `_id`.
- Số truy vấn cố định cho mỗi endpoint (không lặp theo từng cửa hàng/danh mục): tên cửa hàng/danh mục/sản phẩm lấy bằng một truy vấn `$in` sau khi nhóm.
- Thêm vào `services/thongKe.service.js` các hàm `quanTriLayTongQuan`, `quanTriLayDoanhThu`, `quanTriLaySanPhamBanChay`, `quanTriLayDanhMucQuanTam`, `quanTriLayHieuSuatNguoiBan`; có thể tách hàm dùng chung với F26 (ví dụ nhận `cuaHangId` tùy chọn) **nếu** giữ mã đơn giản, dễ giải thích.

## 5. Backend — file cần tạo/sửa

`routes/quanTriVienThongKe.route.js`, mở rộng `controllers/thongKe.controller.js` và `services/thongKe.service.js`. Gắn vào `routes/index.js`.

## 6. Frontend

**File:** mở rộng `services/thongKe.api.js`; component mới `BieuDoThanhNgang` (biểu đồ thanh ngang xếp hạng dùng **`recharts`** `BarChart layout="vertical"`, màu từ `layMauToken`); pages `quanTriVien/TongQuanQuanTriPage` (`/quan-tri-vien`), `quanTriVien/BaoCaoQuanTriPage` (`/quan-tri-vien/bao-cao`). Dùng lại `TheThongKe`, `BoChonKhoangThoiGian`, `BieuDoDoanhThu` (F26).

### 6.1 `TongQuanQuanTriPage` (`/quan-tri-vien`)
- `PageHeader` "Tổng quan hệ thống" (khoảng mặc định 30 ngày, ghi rõ).
- Hàng `TheThongKe`: **Doanh thu** và **Đơn hoàn thành** (kèm dòng phụ "tăng/giảm X% so với kỳ trước" — màu thành công/lỗi, **chữ**, không chỉ màu; ẩn khi `null`), **Người dùng**, **Người bán**, **Sản phẩm** (phụ: "N đang kinh doanh"), **Yêu cầu chờ duyệt** (liên kết `/quan-tri-vien/duyet-nguoi-ban`, nhấn mạnh nhẹ khi > 0).
- Dưới: `BieuDoDoanhThu` (doanh thu theo ngày) + Top 5 sản phẩm bán chạy; liên kết "Xem báo cáo chi tiết". Có chú thích: "Doanh thu tính theo các đơn đã hoàn thành, ghi nhận theo ngày hoàn thành; không phải lợi nhuận."

### 6.2 `BaoCaoQuanTriPage` (`/quan-tri-vien/bao-cao`)
- `BoChonKhoangThoiGian` + nhóm **Theo ngày/Theo tháng**.
- Khối **Xu hướng**: `Tabs` "Doanh thu | Số đơn" đổi dữ liệu của cùng một `BieuDoDoanhThu` (có nút chuyển Cột | Đường như F26); kèm `TheThongKe` so với kỳ trước.
- Khối **Sản phẩm bán chạy** (xếp hạng, ảnh, tên, cửa hàng, số lượng, doanh thu).
- Khối **Danh mục được quan tâm** (`BieuDoThanhNgang` theo `soLuongDaBan`), tiêu đề phụ "Tính theo số lượng đã bán".
- Khối **Hiệu suất Người bán** (`DataTable`: cửa hàng + chủ, số đơn hoàn thành, doanh thu, số sản phẩm đã bán; `Pagination`).
- **Tải song song; nếu bất kỳ API nào lỗi → `ErrorState` toàn trang + "Thử lại", không hiện báo cáo dở dang.** Khối nào rỗng thì hiện `EmptyState` nhỏ tại khối đó.
- Khoảng/nhóm lưu trên URL; hủy kết quả cũ khi đổi nhanh; ổn ở 360px (biểu đồ cuộn ngang trong khối).

### 6.3 Menu
- Đảm bảo `MENU_QUAN_TRI_VIEN` có "Tổng quan" (`/quan-tri-vien`) và "Báo cáo" (`/quan-tri-vien/bao-cao`).

## 7. Không được làm

- Không đổi định nghĩa số liệu; không tính tổng ở frontend; chỉ dùng `recharts` cho biểu đồ (không thêm thư viện biểu đồ khác); không gõ mã màu trong JS biểu đồ.
- Không đếm Quản trị viên vào số Người dùng; không hiển thị dữ liệu cá nhân người mua trong báo cáo.
- Không dựng thêm "hành vi người dùng" (lượt xem, tìm kiếm...) vì không có dữ liệu.

## 8. Tiêu chí hoàn thành

- [ ] Với dữ liệu thử nhiều cửa hàng/danh mục, **mọi số liệu khớp tính tay**; đơn `Chờ thanh toán`/`Đã hủy`/chưa hoàn thành **không** nằm trong doanh thu.
- [ ] `soVoiKyTruoc` đúng (ví dụ kỳ trước 100.000, kỳ này 150.000 → 50,0); kỳ trước bằng 0 → `null`.
- [ ] `soNguoiDung`/`soNguoiBan` đúng khi một tài khoản vừa là Người dùng vừa là Người bán (tính ở cả hai) và Admin không bị đếm.
- [ ] Danh mục/sản phẩm bán chạy/hiệu suất sắp đúng thứ tự; hiệu suất chỉ gồm cửa hàng có phát sinh.
- [ ] Khoảng không dữ liệu → 200 rỗng và giao diện hiện trạng thái rỗng theo khối; khoảng sai → 400.
- [ ] Mốc ngày theo giờ Việt Nam (đơn 23:30 vào đúng ngày).
- [ ] Người dùng/Người bán gọi các API → 403; chưa đăng nhập → 401.
- [ ] Số truy vấn mỗi endpoint cố định (không N+1).
- [ ] Giả lập một API lỗi → giao diện chỉ hiện `ErrorState`, không hiện số liệu nửa vời.
- [ ] Giao diện: biểu đồ `recharts`/tab/bảng hoạt động, màu lấy từ tokens, có bảng dữ liệu thay thế, tiếp cận được bằng bàn phím, ổn ở 360px; nhãn "Danh mục được quan tâm — tính theo số lượng đã bán" và chú thích "không phải lợi nhuận" hiển thị đúng.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Nêu cách diễn giải "xu hướng mua hàng" và việc dùng `$lookup`.
