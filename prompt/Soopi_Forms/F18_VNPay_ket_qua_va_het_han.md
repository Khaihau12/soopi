# FORM F18 — KẾT QUẢ VNPAY, HỦY & HOÀN KHO, TỰ ĐỘNG HẾT HẠN SAU 24 GIỜ

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F17 (`utils/vnpay.js`, giao dịch/đơn đã tạo).
> **Rủi ro cao:** hoàn tồn kho/voucher phải **đúng một lần**, xử lý lặp (callback gửi lại) phải **an toàn**.

## 1. Mục tiêu

1. Tiếp nhận kết quả từ VNPay, **xác thực chữ ký**, cập nhật giao dịch và các đơn liên quan.
2. Thanh toán **thất bại** hoặc **quá 24 giờ** → hủy các đơn, **hoàn đúng một lần** tồn kho và lượt voucher.
3. Trang kết quả cho Người dùng.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.6** (các ngoại lệ VNPay thất bại / quá 24 giờ). Collection **Bảng 3.37–3.39**.
- `AGENTS.md` **Mục 9 (VNPay)**, Mục 8 (Tồn kho, Trạng thái đơn). `02` (v2): **`QĐ-06`**, **`QĐ-13`**, `QĐ-16`, **`QĐ-20`** (phối hợp với thanh toán lại, gia hạn 10 phút, thanh toán đến muộn). **Chỉ áp dụng cho giao dịch `VNPay`** — giao dịch `COD` không đi qua form này (F20 xử lý khi `Hoàn thành`, F30 khi hủy).

## 3. API

| Method + URL | Quyền | Mô tả |
|---|---|---|
| `GET /api/giao-dich-thanh-toan/vnpay/ket-qua` | công khai (trình duyệt người dùng được VNPay chuyển về) | Xử lý kết quả rồi **chuyển hướng 302** sang trang kết quả của frontend |
| `GET /api/giao-dich-thanh-toan/:id` | đăng nhập (chủ giao dịch) | `data = { giaoDich, danhSachDonHang, hanThanhToan }` |

> Khai báo route `/vnpay/ket-qua` và `/vnpay/tao-thanh-toan` **trước** `/:id`.
> Môi trường cục bộ **không** nhận được IPN (server-to-server) từ VNPay nên **không** làm IPN; chỉ dùng trang trả về (return URL). Ghi chú điều này trong báo cáo.

**`giaoDich`:** `_id, maGiaoDich, soTien, phuongThucThanhToan, trangThaiThanhToan, thoiGianTao, thoiGianHoanTat`. **`danhSachDonHang[]`:** `_id, cuaHang: { _id, tenCuaHang }, tongThanhToan, trangThaiThanhToan, trangThaiXuLy`. **`hanThanhToan`:** `thoiGianTao + 24 giờ`.

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Xử lý `ket-qua` (`xuLyKetQuaVnpay(query)`) — **thứ tự bắt buộc**
1. **Xác thực chữ ký** (`vnp_SecureHash`) bằng `utils/vnpay.js` (F17). Sai/thiếu → **không đổi gì trong DB**; chuyển hướng frontend với `?loi=chuKy`.
2. Tìm `GiaoDichThanhToan` theo `maGiaoDich = tachMaGiaoDichTuTxnRef(vnp_TxnRef)` (F17 mục 5.4: nếu dùng phương án dự phòng thì lấy phần trước chữ `R`; nếu dùng lại nguyên `maGiaoDich` thì hàm trả nguyên chuỗi). Không có hoặc giao dịch **không phải `VNPay`** → chuyển hướng `?loi=khongTimThay`, không đổi gì.
3. **So khớp số tiền:** `vnp_Amount` phải bằng `soTien × 100` (số tiền trong **DB**). Lệch → **không** đánh dấu thành công, **không** đổi gì, ghi log cảnh báo ở server, chuyển hướng `?loi=saiSoTien`.
4. **Idempotent:** nếu giao dịch **không còn** `Chờ thanh toán` → **bỏ qua** hoàn toàn (không đổi trạng thái, không hoàn kho lần nữa), chuyển hướng bình thường tới trang kết quả.
5. Xác định thành công: mã phản hồi và mã trạng thái giao dịch theo **tài liệu VNPay chính thức** (thường cả hai bằng `00` — AI phải đối chiếu tài liệu, không đoán). Khác → thất bại (kể cả người dùng tự hủy tại cổng).
6. **Chiếm quyền xử lý bằng thao tác nguyên tử có điều kiện:**
   `GiaoDichThanhToan.findOneAndUpdate({ _id, trangThaiThanhToan: 'Chờ thanh toán' }, { $set: { trangThaiThanhToan: <'Thành công' | 'Thất bại'>, thoiGianHoanTat: now } })`.
   Trả `null` (đã có tiến trình khác xử lý) → **dừng, không làm gì thêm**. Chỉ tiến trình giành được quyền mới đi tiếp.
7. **Thành công:** `DonHang.updateMany({ giaoDichId }, { trangThaiThanhToan: 'Đã thanh toán' })`. `trangThaiXuLy` **giữ** `Chờ xác nhận`.
8. **Thất bại:** gọi `huyGiaoDichVaHoanKho(giaoDich, 'Thất bại')` (4.2).
9. Cuối cùng chuyển hướng `302` tới `${FRONTEND_URL}/thanh-toan/ket-qua?giaoDichId=<_id>`. **Không** truyền kết quả thanh toán qua URL — frontend sẽ đọc trạng thái thật từ DB.

> Lưu ý nhầm lẫn: **giao dịch** dùng `Thành công`, còn **đơn hàng** dùng `Đã thanh toán` (AGENTS Mục 5.7).

### 4.2 `huyGiaoDichVaHoanKho(giaoDich, lyDo)` — dùng chung cho **thất bại**, **hết hạn** và **người dùng hủy giao dịch chưa thanh toán (F30, trường hợp A)**
`lyDo` ∈ {`Thất bại`, `Hết hạn`}: quyết định giá trị `trangThaiThanhToan` của đơn (`Thất bại`/`Hết hạn`), còn `trangThaiXuLy` luôn là `Đã hủy`.
1. Lấy các `DonHang` có `giaoDichId`.
2. Với **từng đơn**, **chiếm quyền hủy đơn** bằng thao tác nguyên tử có điều kiện:
   `DonHang.findOneAndUpdate({ _id, trangThaiXuLy: { $ne: 'Đã hủy' } }, { $set: { trangThaiThanhToan: lyDo, trangThaiXuLy: 'Đã hủy' } })`.
   Nếu `null` (đã hủy rồi) → bỏ qua đơn này. Nếu được → **hoàn kho đúng đơn này**: với mỗi `ChiTietDonHang` của đơn, `SanPham.updateOne({ _id: sanPhamId }, { $inc: { soLuongTon: +soLuong } })` (gộp bằng `bulkWrite`).
3. Sau khi xử lý các đơn: **hoàn lượt voucher** — lấy các `voucherId` **khác nhau** từ `ApDungVoucher` của các đơn thuộc giao dịch, `Voucher.updateOne({ _id }, { $inc: { soLuong: +1 } })` **mỗi voucher đúng 1** (khớp `QĐ-13`: trừ 1 lần/voucher/lần thanh toán). Không xóa các bản ghi `ApDungVoucher` (giữ lịch sử).
4. Thành phần bước 2–3 chỉ chạy bởi tiến trình đã **chiếm quyền ở giao dịch** (4.1 bước 6 hoặc 4.3), nên không bị chạy hai lần.
5. **Giới hạn đã biết** (ghi vào báo cáo): nếu server sập đúng giữa bước 2 và 3 thì voucher có thể chưa được hoàn. Mức đề tài chấp nhận.

### 4.3 Tự động hết hạn (`QĐ-06`) — `xuLyGiaoDichHetHan()`
1. Tìm giao dịch `phuongThucThanhToan = 'VNPay'` (**bỏ qua giao dịch `COD`**), `trangThaiThanhToan = 'Chờ thanh toán'` và `thoiGianTao ≤ now − THOI_HAN_THANH_TOAN_GIO − THOI_GIAN_GIA_HAN_PHUT` (24 giờ ở F17 **cộng thêm** `THOI_GIAN_GIA_HAN_PHUT = 10` phút, hằng số mới). Khoảng gia hạn bảo đảm mọi thanh toán hợp lệ thực hiện **trước** `vnp_ExpireDate` kịp được báo về trước khi hệ thống hủy (`QĐ-20`).
2. Với từng giao dịch: **chiếm quyền** như 4.1 bước 6 nhưng chuyển sang `Hết hạn` (`thoiGianHoanTat = now`); `null` → bỏ qua; thành công → `huyGiaoDichVaHoanKho(giaoDich, 'Hết hạn')`.
3. Lỗi ở một giao dịch **không** được làm dừng các giao dịch còn lại (bắt lỗi từng giao dịch, ghi log).
4. **Lập lịch** trong `server.js` sau khi kết nối DB: chạy **một lần ngay khi khởi động**, rồi `setInterval` mỗi `CHU_KY_QUET_HET_HAN_PHUT` (hằng số mới = **5**) phút. Không dùng thư viện cron. Có cờ chống chạy chồng (lần trước chưa xong thì bỏ lượt này). Lỗi được bắt và log, **không** làm sập tiến trình.
5. Quét trùng với callback VNPay: thao tác chiếm quyền ở giao dịch đảm bảo chỉ một bên thắng.

### 4.4 Chi tiết giao dịch
- `GET /:id`: chủ giao dịch kiểm tra bằng `DonHang.exists({ giaoDichId, taiKhoanId })` (không → 404). Không trả thông tin nhạy cảm của VNPay (chữ ký, secret).

## 5. Backend — file cần tạo/sửa

`services/giaoDichThanhToan.service.js` (thêm `xuLyKetQuaVnpay`, `huyGiaoDichVaHoanKho`, `xuLyGiaoDichHetHan`, `layChiTietGiaoDich`), `controllers/giaoDichThanhToan.controller.js`, `routes/giaoDichThanhToan.route.js` (thêm `GET /vnpay/ket-qua` công khai, `GET /:id` có `batBuocDangNhap`), `server.js` (lập lịch), `cauHinh.constant.js` (`CHU_KY_QUET_HET_HAN_PHUT`). `.env.example`: đảm bảo có `FRONTEND_URL`.

## 6. Frontend

**File:** mở rộng `services/giaoDichThanhToan.api.js` (`layChiTietGiaoDich`); page `KetQuaThanhToanPage` (`/thanh-toan/ket-qua`, bọc `BaoVeRoute`).

**Hành vi:** đọc `giaoDichId` hoặc `loi` từ URL query; nếu có `giaoDichId` thì gọi `layChiTietGiaoDich` và **quyết định hiển thị theo `trangThaiThanhToan` từ API** (không tin tham số URL).

| Trạng thái | Hiển thị |
|---|---|
| `Thành công` | Biểu tượng thành công, "Thanh toán thành công", mã giao dịch, số tiền (`dinhDangTien`), danh sách đơn (cửa hàng · tổng · trạng thái). Nút chính **"Xem đơn hàng"** (`/don-hang`), nút phụ "Tiếp tục mua sắm" |
| `Thất bại` hoặc `Hết hạn` | "Thanh toán không thành công", giải thích "Đơn hàng đã bị hủy và số lượng hàng đã được hoàn lại", kèm dòng nhỏ "Nếu tài khoản ngân hàng của bạn đã bị trừ tiền, vui lòng liên hệ quản trị viên để được hoàn tiền" (phòng trường hợp thanh toán đến muộn), nút chính **"Về giỏ hàng"**, nút phụ "Tiếp tục mua sắm" |
| `Chờ thanh toán` (hiếm: sai số tiền, hoặc xử lý chưa xong) | "Giao dịch đang chờ xử lý", nút **"Kiểm tra lại"** (gọi lại API) và liên kết "Xem đơn hàng" |
| Có `loi` hoặc API 404 | "Không thể xác minh kết quả thanh toán", liên kết "Xem đơn hàng" |

Khối kết quả có `aria-live="polite"`; một nút chính duy nhất; tải bằng `Skeleton`. Không có hiệu ứng ăn mừng rườm rà.

## 7. Không được làm

- Không cập nhật DB khi chữ ký sai hoặc số tiền lệch.
- Không tin tham số kết quả trên URL của frontend.
- Không hoàn kho/voucher ngoài `huyGiaoDichVaHoanKho`; không hoàn kho bằng đọc-rồi-ghi.
- Không tự động hoàn tiền cho VNPay (ngoài phạm vi). **Thanh toán đến muộn** (`QĐ-20`): nếu VNPay báo **thành công** cho giao dịch đã `Hết hạn`/`Thất bại` (kể cả do người dùng hủy ở F30), **không** cập nhật gì, **ghi log mức cảnh báo** kèm `maGiaoDich`, `vnp_Amount` để Quản trị viên hoàn tiền thủ công.
- Không thêm thư viện lập lịch; không thêm đường IPN.

## 8. Tiêu chí hoàn thành (thử trên VNPay sandbox, ghi lại từng ca)

- [ ] **Thanh toán thành công** (dùng thông tin thẻ thử nghiệm do **tài liệu VNPay** cung cấp): giao dịch `Thành công`, `thoiGianHoanTat` có giá trị; **mọi** đơn thuộc giao dịch `Đã thanh toán` + `Chờ xác nhận`; tồn kho **không đổi**.
- [ ] **Người dùng bấm hủy tại cổng:** giao dịch `Thất bại`; các đơn `Thất bại` + `Đã hủy`; `soLuongTon` **trở về đúng** giá trị trước khi đặt; `Voucher.soLuong` trở về; `ApDungVoucher` vẫn còn.
- [ ] **Gọi lại cùng URL kết quả lần 2** (dán lại vào trình duyệt) → không đổi gì, **không hoàn kho thêm** (kiểm tra `soLuongTon` không tăng lần nữa).
- [ ] Sửa 1 ký tự trong query (chữ ký sai) → DB không đổi, frontend báo "không thể xác minh". Sửa `vnp_Amount` → DB không đổi.
- [ ] **Hết hạn:** chỉnh `thoiGianTao` của một giao dịch `Chờ thanh toán` lùi quá 24 giờ → chạy `xuLyGiaoDichHetHan` (hoặc đợi chu kỳ): giao dịch `Hết hạn`, đơn `Hết hạn` + `Đã hủy`, kho/voucher được hoàn **một lần**; chạy lại hàm lần nữa → không đổi gì.
- [ ] Giao dịch còn hạn (< 24 giờ) **không** bị hủy bởi tiến trình quét; giao dịch quá 24 giờ nhưng **chưa quá 24 giờ + 10 phút** cũng **chưa** bị hủy.
- [ ] **Giao dịch `COD` ở trạng thái `Chờ thanh toán` quá 24 giờ KHÔNG bị tác vụ quét đụng tới.**
- [ ] **Thanh toán đến muộn:** với giao dịch đã `Hết hạn` (hoặc `Thất bại`), gọi `ket-qua` với tham số **thành công hợp lệ** → DB **không đổi**, có log cảnh báo, trang kết quả hiển thị dòng liên hệ hoàn tiền.
- [ ] **Phối hợp với thanh toán lại (`QĐ-20`):** (a) lấy URL mới rồi thanh toán thành công → giao dịch `Thành công` đúng một lần, kho không đổi; (b) nếu dùng phương án `vnp_TxnRef` có hậu tố `R`, kết quả trả về vẫn tìm đúng giao dịch; (c) chạy `xuLyGiaoDichHetHan` **đồng thời** với `tao-thanh-toan` ở sát mốc 24 giờ → không có trường hợp giao dịch đã hủy (kho/voucher đã hoàn) mà vẫn nhận thanh toán thành công.
- [ ] **Đua:** gọi đồng thời callback thất bại + `xuLyGiaoDichHetHan` cho cùng giao dịch → kho chỉ hoàn **một** lần.
- [ ] Một giao dịch gồm **2 đơn** (2 cửa hàng): cả hai đơn cùng đổi trạng thái; kho của cả hai được hoàn đúng.
- [ ] `GET /giao-dich-thanh-toan/:id` của người khác → 404; chưa đăng nhập → 401.
- [ ] Tắt/bật server: quét chạy khi khởi động; lỗi trong một giao dịch không làm sập server.
- [ ] Trang kết quả hiển thị đúng 4 trường hợp; ổn ở 360px.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Ghi: mã phản hồi VNPay đã dùng để xác định thành công (kèm nguồn tài liệu), kết quả từng ca ở Mục 8, hai giới hạn đã biết (sập giữa chừng; thanh toán đến muộn).
