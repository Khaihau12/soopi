# FORM F26 — NGƯỜI BÁN: TỔNG QUAN, DOANH THU VÀ BÁO CÁO

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F11, F20, F25 (`utils/thoiGian.js`). Cần có đơn `Hoàn thành` để kiểm thử.

## 1. Mục tiêu

Người bán xem **doanh thu, số đơn hoàn thành, số sản phẩm đã bán, sản phẩm bán chạy, lịch sử giao dịch** của cửa hàng mình trong khoảng thời gian chọn, kèm **biểu đồ vẽ bằng thư viện `recharts`** (`QĐ-11` phiên bản 2). Đồng thời có **trang Tổng quan** `/nguoi-ban` (thay trang chuyển hướng tạm của F11). Tạo bộ thành phần thống kê dùng lại ở F27.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.17** (Quản lý doanh thu và báo cáo). Collection **Bảng 3.37–3.39**.
- `AGENTS.md` Mục 8 (Phân quyền). `02` (v2): **`QĐ-18`** (định nghĩa số liệu — doanh thu theo **ngày hoàn thành**), `QĐ-16` (COD), `QĐ-22`. `02` Mục E: **CR-03** (`DonHang.ngayHoanThanh`).

## 3. API (Người bán — `router.use(...batBuocNguoiBan)`)

Tham số chung: `tuNgay`, `denNgay` (dạng `YYYY-MM-DD`, múi giờ `Asia/Ho_Chi_Minh`, **bao gồm cả hai đầu**).

| Method + URL | Thêm tham số | Kết quả `data` |
|---|---|---|
| `GET /api/nguoi-ban/thong-ke/tong-quan` | — | `{ khoangThoiGian: { tuNgay, denNgay }, tongDoanhThu, soDonHoanThanh, soSanPhamDaBan, soDonChoXacNhan }` |
| `GET /api/nguoi-ban/thong-ke/doanh-thu` | `nhom` (`ngay`/`thang`, mặc định `ngay`) | `{ nhom, danhSach: [{ moc, doanhThu, soDon }] }` |
| `GET /api/nguoi-ban/thong-ke/san-pham-ban-chay` | `gioiHan` (mặc định 5, tối đa 20) | `{ danhSach: [{ sanPham: { _id, tenSanPham, hinhAnh }, soLuongDaBan, doanhThu }] }` |
| `GET /api/nguoi-ban/thong-ke/lich-su-giao-dich` | `trang`, `gioiHan` | `{ danhSach, phanTrang }` — mỗi phần tử `{ _id, ngayTao, maGiaoDich, nguoiMua: { hoTen }, tongThanhToan, trangThaiXuLy }` |

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Định nghĩa số liệu (`QĐ-18`) — **không tự đổi công thức**
- **Doanh thu** = tổng `DonHang.tongThanhToan` của các đơn thuộc cửa hàng mình có `trangThaiXuLy = 'Hoàn thành'` (và `trangThaiThanhToan = 'Đã thanh toán'` — đơn COD chỉ thành `Đã thanh toán` lúc `Hoàn thành`, nên vẫn đủ điều kiện), **lọc theo `DonHang.ngayHoanThanh`** trong khoảng (CR-03). Nhờ đó báo cáo một tháng **không đổi** khi đơn của tháng trước hoàn thành muộn. Đây là *tổng giá trị thanh toán của đơn đã hoàn thành* (đã gồm phí vận chuyển, đã trừ giảm giá) — **không phải lợi nhuận**. Đơn `Đã hủy` (kể cả đơn đã thanh toán rồi bị hủy ở F30) **không** được tính.
- **Số đơn hoàn thành** = số đơn như trên.
- **Số sản phẩm đã bán** = tổng `ChiTietDonHang.soLuong` của các đơn như trên.
- **Sản phẩm bán chạy**: nhóm theo `sanPhamId` trên các đơn như trên; `soLuongDaBan = Σ soLuong`, `doanhThu = Σ thanhTien`; sắp `soLuongDaBan` giảm dần, đồng hạng thì `doanhThu` giảm dần.
- **`soDonChoXacNhan`** (chỉ dùng cho trang Tổng quan, **không** lọc theo ngày) = số đơn của cửa hàng ở trạng thái `Chờ xác nhận` **và** sẵn sàng xử lý (`Đã thanh toán`, hoặc `COD` đang `Chờ thanh toán`).
- **Lịch sử giao dịch** = các đơn của cửa hàng có `trangThaiThanhToan = 'Đã thanh toán'` (gồm đơn VNPay đã trả, đơn 0đ và đơn COD đã hoàn thành) trong khoảng, lọc/sắp theo `ngayTao` giảm dần; `maGiaoDich` lấy từ `GiaoDichThanhToan` (một truy vấn theo lô). Không trả thông tin VNPay nhạy cảm.

### 4.2 Khoảng thời gian
- Dùng `layKhoangNgay` của F25 (đầu ngày `tuNgay` → cuối ngày `denNgay` giờ Việt Nam). **Mặc định** khi thiếu tham số: **30 ngày gần nhất** (`SO_NGAY_THONG_KE_MAC_DINH = 30`, hằng số mới).
- Ngày sai định dạng, `tuNgay > denNgay`, hoặc khoảng dài hơn `SO_NGAY_THONG_KE_TOI_DA = 366` ngày → **400** với thông báo tiếng Việt "Khoảng thời gian không hợp lệ, vui lòng chọn lại" (đúng Bảng 3.17).
- Không có dữ liệu → trả số 0 / mảng rỗng (**không** lỗi).

### 4.3 Triển khai
- Dùng **aggregation pipeline** của MongoDB (không đọc toàn bộ đơn về Node rồi cộng).
- Nhóm theo ngày/tháng bằng `$dateToString` trên **`ngayHoanThanh`** với `timezone: 'Asia/Ho_Chi_Minh'` (`'%Y-%m-%d'` hoặc `'%Y-%m'`). `moc` trả đúng chuỗi đó. `$match` khoảng thời gian cũng dùng `ngayHoanThanh` (đơn thiếu `ngayHoanThanh` — dữ liệu cũ — dùng `ngayTao` làm dự phòng).
- **Điền các mốc trống bằng 0** để biểu đồ liên tục: `danhSach` của `doanh-thu` phải có **đủ** mọi ngày (hoặc tháng) trong khoảng, theo thứ tự tăng dần (viết hàm tiện ích riêng, kiểm thử được).
- Kết nối `ChiTietDonHang` bằng `$lookup` (tên collection tường minh `ChiTietDonHang`) hoặc truy vấn hai bước theo `$in`; chọn cách đơn giản, đúng, và nêu trong báo cáo.
- **Sở hữu:** mọi pipeline bắt đầu bằng `$match` với `cuaHangId = req.cuaHang._id` (đã là `ObjectId`; nhớ ép kiểu nếu dùng trong `aggregate`, vì `aggregate` **không** tự ép kiểu như `find`).
- Lỗi khi truy xuất → trả lỗi (500 chung); **không** trả báo cáo dở dang.

## 5. Backend — file cần tạo

`routes/nguoiBanThongKe.route.js`, `controllers/thongKe.controller.js`, `services/thongKe.service.js` (`nguoiBanLayTongQuan`, `nguoiBanLayDoanhThu`, `nguoiBanLaySanPhamBanChay`, `nguoiBanLayLichSuGiaoDich`, hàm tiện ích `dienMocTrong`); bổ sung `utils/thoiGian.js` nếu cần; hằng số `SO_NGAY_THONG_KE_MAC_DINH`, `SO_NGAY_THONG_KE_TOI_DA`. Gắn vào `routes/index.js`.

## 6. Frontend

**File:** `services/thongKe.api.js`; `utils/mauSac.js` (đã có từ F03); **cài `recharts`** (đã được duyệt, chỉ cho F26–F27); **components dùng lại ở F27:** `TheThongKe`, `BoChonKhoangThoiGian`, `BieuDoDoanhThu` (Recharts); pages `nguoiBan/TongQuanNguoiBanPage` (`/nguoi-ban`, thay thế redirect của F11), `nguoiBan/BaoCaoNguoiBanPage` (`/nguoi-ban/bao-cao`).

### 6.1 Thành phần dùng chung
- **`TheThongKe`**: thẻ số liệu (`Card`): nhãn nhỏ, **giá trị lớn** (dùng `dinhDangTien` hoặc số), chú thích phụ tùy chọn, có thể là liên kết. Skeleton khi tải.
- **`BoChonKhoangThoiGian`**: các **nút chọn nhanh** (`Hôm nay · 7 ngày · 30 ngày · Tháng này · Tùy chọn`), khi "Tùy chọn" hiện hai `<input type="date">` + nút **"Xem báo cáo"**; tự kiểm tra `từ ≤ đến` và ≤ 366 ngày (báo lỗi ngay, không gọi API); đồng bộ `tuNgay`, `denNgay` lên URL; nhóm `Theo ngày / Theo tháng` nằm ở trang báo cáo. Tính ngày "hôm nay" theo giờ Việt Nam.
- **`BieuDoDoanhThu`** (dùng **`recharts`**): props `duLieu: [{ moc, doanhThu, soDon }]`, `chiSo` (`doanhThu`/`soDon`), `kieu` (`cot`/`duong`). `ResponsiveContainer` + `BarChart`/`LineChart`; `CartesianGrid` và trục dùng `layMauToken('--mauLuoiBieuDo')`; cột/đường dùng `layMauToken('--mauBieuDo1')` — **mọi màu lấy từ tokens, không gõ mã màu trong JS**; `Tooltip` hiển thị nhãn ngày/tháng `vi-VN` và giá trị bằng `dinhDangTien` hoặc số; trục Y rút gọn kiểu "1,2 tr"; trục X thưa bớt khi nhiều mốc (`interval`); tắt hoạt ảnh khi `prefers-reduced-motion`; chiều cao cố định hợp lý (~280px), không làm tràn ngang trang. **Tiếp cận:** bọc `role="img"` + `aria-label` tóm tắt (tổng, mốc cao nhất) và thêm `<details>` **"Xem dạng bảng"** chứa bảng dữ liệu thật. Dữ liệu rỗng → `EmptyState`. Chú ý: Recharts có thể cảnh báo khi vùng chứa chưa có kích thước — bảo đảm cha của `ResponsiveContainer` có chiều cao xác định.

### 6.2 `TongQuanNguoiBanPage` (`/nguoi-ban`)
- `PageHeader` "Tổng quan" (khoảng mặc định 30 ngày gần nhất, ghi rõ trên giao diện). Dưới khối thẻ có chú thích về cách tính doanh thu (xem mục 6.3, dòng "Chú thích bắt buộc").
- Hàng 4 `TheThongKe`: **Doanh thu**, **Đơn hoàn thành**, **Sản phẩm đã bán**, **Đơn chờ xác nhận** (liên kết tới `/nguoi-ban/don-hang?...tab Chờ xác nhận`; nhấn mạnh nhẹ khi > 0).
- Dưới: `BieuDoDoanhThu` (doanh thu theo ngày) và danh sách **Top 5 bán chạy** rút gọn + liên kết "Xem báo cáo chi tiết".
- Cửa hàng chưa có dữ liệu → `EmptyState` thân thiện kèm nút "Thêm sản phẩm".

### 6.3 `BaoCaoNguoiBanPage` (`/nguoi-ban/bao-cao`)
- `BoChonKhoangThoiGian` + chọn **Theo ngày / Theo tháng** (nhóm).
- Hàng `TheThongKe` (Doanh thu, Đơn hoàn thành, Sản phẩm đã bán).
- `BieuDoDoanhThu`: nút chuyển **Doanh thu | Số đơn** và **Cột | Đường** (hai nhóm nút nhỏ, có `aria-pressed`), dữ liệu cùng một API `doanh-thu`.
- Khối **Sản phẩm bán chạy** (xếp hạng số, ảnh nhỏ, tên, số lượng, doanh thu).
- Khối **Lịch sử giao dịch** (`DataTable`: thời gian, mã giao dịch, người mua, tổng, trạng thái xử lý; `Pagination`).
- **Gọi các API song song, hiển thị khi tất cả xong; nếu bất kỳ API nào lỗi → `ErrorState` toàn khối kèm "Thử lại", không hiển thị báo cáo dở dang** (đúng Bảng 3.17). Khoảng không có dữ liệu → `EmptyState` "Chưa có dữ liệu bán hàng trong khoảng thời gian này".
- Thay đổi khoảng/nhóm cập nhật URL; Back hoạt động; hủy kết quả cũ khi đổi khoảng nhanh.
- **Chú thích bắt buộc trên trang báo cáo và tổng quan** (dòng chữ phụ dưới khối thẻ số liệu): "Doanh thu tính theo các đơn đã hoàn thành, ghi nhận theo ngày hoàn thành; đã gồm phí vận chuyển và không phải lợi nhuận." (`QĐ-18` v2).

## 7. Không được làm

- Không đổi công thức doanh thu (ví dụ cộng đơn chưa hoàn thành, trừ phí vận chuyển).
- Không tính tổng ở frontend từ danh sách đơn; không cho Người bán xem số liệu cửa hàng khác.
- Chỉ được thêm **`recharts`** (đã duyệt, `QĐ-11` v2); không thêm thư viện biểu đồ khác hoặc thư viện xử lý ngày giờ.
- Không dùng `new Date()` cục bộ của máy chủ để cắt ngày (phải theo `Asia/Ho_Chi_Minh`).

## 8. Tiêu chí hoàn thành

- [ ] Dữ liệu thử (ít nhất 3 đơn `Hoàn thành` **có `ngayHoanThanh` ở 2 ngày/2 tháng khác nhau**, 1 đơn `Đã hủy`, 1 đơn VNPay `Chờ thanh toán`, 1 đơn COD đã `Hoàn thành`): tổng quan, doanh thu theo ngày/tháng, bán chạy khớp **tính tay**; đơn chưa hoàn thành/đã hủy **không** được tính; đơn COD hoàn thành **được** tính.
- [ ] **Ca góp ý (bắt buộc thử):** đơn đặt ngày 28/9 (`ngayTao`) hoàn thành ngày 2/10 (`ngayHoanThanh`) → doanh thu **tính vào tháng 10, không đổi báo cáo tháng 9**. Đơn hoàn thành lúc 23:30 giờ Việt Nam rơi vào **đúng ngày** (không lệch sang ngày hôm sau do UTC).
- [ ] `doanh-thu` có đủ mọi ngày trong khoảng (ngày không có đơn = 0), tăng dần.
- [ ] Khoảng không có dữ liệu → 200 với số 0/mảng rỗng; `tuNgay > denNgay`, ngày sai định dạng, khoảng > 366 ngày → 400.
- [ ] Người bán A không thấy số liệu của cửa hàng B (kiểm tra bằng hai cửa hàng có dữ liệu khác nhau); `Người dùng` thường → 403.
- [ ] `lich-su-giao-dich` chỉ gồm đơn đã thanh toán của cửa hàng mình, phân trang đúng, không N+1, không có dữ liệu VNPay nhạy cảm.
- [ ] Giao diện: biểu đồ `recharts` đúng số liệu, **màu lấy từ tokens** (không có mã màu trong mã JS biểu đồ), có bảng dữ liệu thay thế, tooltip hiển thị đúng; ổn ở 360px (không vỡ trang); lỗi một API → `ErrorState` toàn khối; bộ chọn khoảng thời gian dùng được bằng bàn phím.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Nêu cách nối `ChiTietDonHang` đã chọn.
