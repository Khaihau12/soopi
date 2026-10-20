# FORM F30 — NGƯỜI DÙNG TỰ HỦY ĐƠN (trước khi Người bán xác nhận)

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F17, **F18** (`huyGiaoDichVaHoanKho`), F19, F20. **Làm ngay sau F20** (thứ tự tệp là F30 nhưng thứ tự làm xem `00`).
> **Rủi ro cao:** đụng tới tiền, tồn kho, voucher, không có transaction.

## 1. Mục tiêu

Người dùng đặt nhầm có thể **hủy đơn khi đơn còn `Chờ xác nhận`** (Người bán chưa bắt đầu xử lý). Hệ thống xử lý đúng **thanh toán, tồn kho, voucher** theo từng trường hợp, không tự động hoàn tiền.

## 2. Nguồn nghiệp vụ

- `02`: **`QĐ-03`**. `02` Mục E: CR-01. `AGENTS.md` Mục 8 (Trạng thái đơn, Tồn kho), Mục 9. Báo cáo **Bảng 3.7** (bổ sung theo `02` Mục E).
- Hạn chế: **không hoàn tiền tự động** (`AGENTS.md` Mục 7) → đơn đã thanh toán bị hủy được **đánh dấu cần hoàn tiền thủ công**.

## 3. API

| Method + URL | Quyền | Body | Kết quả |
|---|---|---|---|
| `PATCH /api/don-hang/:id/huy` | đăng nhập (chủ đơn) | — (không có lý do vì không có field lưu) | 200 `data = { donHang, ketQua }` |

`ketQua`: `{ kieuHuy, soDonBiHuy, canHoanTienThuCong, thongBao }` với `kieuHuy` ∈ `huyGiaoDichChuaThanhToan` · `huyDonDaThanhToan` · `huyDonCod`.

**Bổ sung vào dữ liệu đơn hàng của F19 (hàm `dungChiTietDonHang` và danh sách):**
`coTheHuy` (bool), `kieuHuy` (như trên, `null` nếu không hủy được), `soDonSeBiHuy` (số đơn bị hủy theo — chỉ > 1 khi `huyGiaoDichChuaThanhToan`), `canHoanTienThuCong` (bool, dùng cho đơn đã hủy).

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Điều kiện chung
1. Đơn thuộc `req.taiKhoan` (không → **404**).
2. Chỉ hủy khi `trangThaiXuLy = 'Chờ xác nhận'`; ngược lại → **409** "Đơn hàng đã được xử lý hoặc đã hủy nên không thể hủy". `coTheHuy = true` đúng khi điều kiện này đúng.
3. **Mọi thay đổi trạng thái đều dùng thao tác nguyên tử có điều kiện** (chiếm quyền), để hủy đơn và "Người bán xác nhận"/"VNPay trả về" **không thể cùng thắng**.

### 4.2 Ba trường hợp (chọn theo `phuongThucThanhToan` và `trangThaiThanhToan` của đơn)

| Trường hợp | Điều kiện đơn | Cách xử lý | Tồn kho | Voucher | Tiền |
|---|---|---|---|---|---|
| **A. Hủy giao dịch chưa thanh toán** (`huyGiaoDichChuaThanhToan`) | `VNPay` + `Chờ thanh toán` | Chiếm quyền giao dịch: `GiaoDichThanhToan.findOneAndUpdate({ _id, trangThaiThanhToan: 'Chờ thanh toán' }, { $set: { trangThaiThanhToan: 'Thất bại', thoiGianHoanTat: now } })`. `null` → **409** "Giao dịch vừa được xử lý (có thể bạn vừa thanh toán), vui lòng tải lại". Rồi gọi **`huyGiaoDichVaHoanKho(giaoDich, 'Thất bại')` (F18)** → **tất cả** đơn thuộc giao dịch thành `Thất bại` + `Đã hủy` | Hoàn **tất cả** đơn của giao dịch (đúng một lần) | **Hoàn** lượt voucher (một lần/voucher, do toàn bộ lần thanh toán bị hủy) | Chưa thu tiền |
| **B. Hủy đơn đã thanh toán** (`huyDonDaThanhToan`) | `trangThaiThanhToan = Đã thanh toán` (VNPay đã trả, hoặc đơn 0đ tự động) | Chiếm quyền **đơn**: `DonHang.findOneAndUpdate({ _id, taiKhoanId, trangThaiXuLy: 'Chờ xác nhận', trangThaiThanhToan: 'Đã thanh toán' }, { $set: { trangThaiXuLy: 'Đã hủy' } })`. **Giữ nguyên** `trangThaiThanhToan = Đã thanh toán` và **không** đổi giao dịch/đơn khác | Hoàn **chỉ đơn này** | **Không** hoàn (voucher coi là đã dùng) | **Không tự hoàn.** `canHoanTienThuCong = (tongThanhToan > 0)` → Quản trị viên hoàn thủ công ngoài hệ thống |
| **C. Hủy đơn COD** (`huyDonCod`) | `COD` + `Chờ thanh toán` | Chiếm quyền **đơn**: điều kiện `trangThaiXuLy: 'Chờ xác nhận', trangThaiThanhToan: 'Chờ thanh toán', phuongThucThanhToan: 'COD'` → `{ trangThaiXuLy: 'Đã hủy', trangThaiThanhToan: 'Thất bại' }`. Sau đó giao dịch COD **của đơn này**: `findOneAndUpdate({ _id: giaoDichId, trangThaiThanhToan: 'Chờ thanh toán' }, { $set: { trangThaiThanhToan: 'Thất bại', thoiGianHoanTat: now } })` | Hoàn **chỉ đơn này** | **Không** hoàn | Chưa thu tiền |

Trường hợp khác (đơn đã `Thất bại`/`Hết hạn`/`Đã hủy`) đã bị chặn ở 4.1.2.

### 4.3 Hoàn tồn kho — **đúng một lần**
- Chỉ **tiến trình đã chiếm quyền** (4.2) mới được hoàn kho: với mỗi `ChiTietDonHang` của đơn, `SanPham.updateOne({ _id: sanPhamId }, { $inc: { soLuongTon: +soLuong } })` (gộp `bulkWrite`).
- Tách thành hàm dùng chung `hoanTonKhoTheoDonHang(donHangId)` (cho B, C). Trường hợp A tái sử dụng logic của `huyGiaoDichVaHoanKho` (F18). Gọi API lần hai cho cùng đơn → **409** và **không** hoàn thêm.
- Lỗi sau khi đã chiếm quyền mà chưa hoàn kho xong: ghi log lỗi nghiêm trọng, **không** đưa đơn về trạng thái cũ (tránh hoàn hai lần), trả lỗi 500 chung; nêu giới hạn này trong báo cáo (không có transaction).

### 4.4 Giới hạn đã biết (ghi vào báo cáo)
- Người dùng hủy giao dịch VNPay (A) **đúng lúc** đang thanh toán ở cổng: nếu VNPay báo thành công sau khi giao dịch đã `Thất bại`, F18 **bỏ qua** (idempotent) và ghi log "thanh toán đến muộn — cần hoàn tiền thủ công". Quản trị viên xử lý ngoài hệ thống.
- Hoàn tiền (B và trường hợp đến muộn) **không tự động**.
- Voucher không được hoàn khi hủy riêng một đơn (B, C) vì dữ liệu không có khóa nhóm lần thanh toán đủ để hoàn chính xác từng phần.

## 5. Tác động tới các form khác (làm luôn trong F30)

- **F19:** thêm `coTheHuy`, `kieuHuy`, `soDonSeBiHuy`, `canHoanTienThuCong` vào dữ liệu đơn; câu giải thích đơn `Đã hủy` theo bảng:
  | `trangThaiThanhToan` + phương thức | Lý do hiển thị |
  |---|---|
  | `Thất bại` + `VNPay` | "Thanh toán không thành công hoặc bạn đã hủy giao dịch" |
  | `Thất bại` + `COD` | "Bạn đã hủy đơn" |
  | `Hết hạn` | "Quá thời hạn thanh toán" |
  | `Đã thanh toán` | "Bạn đã hủy đơn" (+ khối thông tin hoàn tiền nếu `canHoanTienThuCong`) |
- **F20:** đơn `Đã hủy` do người dùng vẫn hiện ở tab "Đã hủy"; thao tác Người bán thấy 409 nếu người dùng vừa hủy.
- **F25:** màn Giao dịch hiển thị đơn **cần hoàn tiền thủ công** (xem F25 mục 4.1).

## 6. Backend — file cần sửa/tạo

`routes/donHang.route.js` (thêm `PATCH /:id/huy` — chỉ cần `batBuocDangNhap`), `controllers/donHang.controller.js`, `services/donHang.service.js` (`huyDonHangCuaToi`, `hoanTonKhoTheoDonHang`, mở rộng `dungChiTietDonHang`), có thể mở rộng `services/giaoDichThanhToan.service.js`.

## 7. Frontend

**File:** mở rộng `services/donHang.api.js` (`huyDonHang`); cập nhật `DonHangCard`, `ChiTietDonHangPage`.

- Nút phụ **"Hủy đơn"** (kiểu nguy hiểm dạng viền) ở thẻ đơn và trang chi tiết khi `coTheHuy = true`; luôn qua `ConfirmDialog`, nội dung theo `kieuHuy`:
  - `huyGiaoDichChuaThanhToan`: "Hủy giao dịch chưa thanh toán? Hệ thống sẽ hủy **N đơn** thuộc giao dịch này, hoàn lại số lượng hàng và voucher đã dùng." (N = `soDonSeBiHuy`; N = 1 thì viết "hủy đơn chưa thanh toán").
  - `huyDonDaThanhToan`: "Đơn này đã thanh toán. Hủy đơn sẽ hoàn lại số lượng hàng. **Khoản tiền X đ chưa được hoàn tự động — Quản trị viên sẽ hoàn thủ công.** Voucher đã dùng không được hoàn lại." (bỏ câu về tiền nếu `tongThanhToan = 0`).
  - `huyDonCod`: "Hủy đơn thanh toán khi nhận hàng? Số lượng hàng sẽ được hoàn lại. Voucher đã dùng không được hoàn lại."
  Nút xác nhận ghi đúng việc: **"Hủy đơn"**; nút còn lại "Giữ đơn".
- Thành công → toast với `thongBao` của server, tải lại dữ liệu; đơn chuyển trạng thái `Đã hủy`. 409 → hiển thị message và tải lại.
- Đơn đã hủy có `canHoanTienThuCong = true`: khối thông tin cố định ở chi tiết đơn "Đơn đã hủy sau khi thanh toán. Khoản X đ đang chờ hoàn tiền thủ công."
- Khóa nút và hiện `loading` trong lúc gửi (chống bấm đúp).

## 8. Không được làm

- Không cho hủy khi đơn đã `Đã xác nhận` trở đi; không cho Người bán/Quản trị viên dùng API này thay chủ đơn.
- Không gọi API VNPay để hoàn tiền; không thêm trạng thái "Đã hoàn tiền"/field lý do hủy.
- Không hoàn kho bằng đọc-rồi-ghi; không hoàn kho hai lần.
- Không hủy từng đơn riêng lẻ trong giao dịch VNPay chưa thanh toán (phải hủy cả giao dịch, vì cổng thanh toán dùng một số tiền chung).

## 9. Tiêu chí hoàn thành (ghi lại từng ca)

- [ ] **A:** giao dịch VNPay chưa thanh toán gồm **2 đơn** (2 cửa hàng, có voucher): hủy một đơn → **cả hai** `Đã hủy` + `Thất bại`; giao dịch `Thất bại`; kho cả hai về đúng; `Voucher.soLuong` về đúng; hủy lần hai → 409 và kho **không tăng thêm**.
- [ ] **B:** đơn VNPay đã thanh toán, `Chờ xác nhận` → `Đã hủy` + vẫn `Đã thanh toán`; chỉ kho của đơn đó hoàn; đơn khác cùng giao dịch **không đổi**; voucher **không** hoàn; `canHoanTienThuCong = true`. Đơn 0đ tương tự nhưng `canHoanTienThuCong = false`.
- [ ] **C:** đơn COD → `Đã hủy` + `Thất bại`; giao dịch COD của đơn `Thất bại`; kho hoàn; voucher không hoàn.
- [ ] Đơn đã `Đã xác nhận` trở đi → 409; đơn của người khác → 404; chưa đăng nhập → 401; Người bán gọi API → chỉ được nếu chính họ là chủ đơn (theo `taiKhoanId`).
- [ ] **Đua với Người bán:** gọi song song "hủy" và "xác nhận đơn" (F20) → đúng **một** thành công; không có đơn nào vừa `Đã hủy` vừa được xử lý.
- [ ] **Đua hai lần hủy:** hai request cùng lúc → kho hoàn **một lần** (kiểm tra `soLuongTon` đúng số).
- [ ] Sau khi hủy: thống kê (F26, F27) **không** tính đơn đó; danh sách Người bán thấy ở tab "Đã hủy".
- [ ] Giao diện: hộp thoại xác nhận đúng nội dung từng trường hợp; khối hoàn tiền hiện đúng; ổn ở 360px.

## 10. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9; liệt kê kết quả từng ca ở Mục 9 và các giới hạn ở 4.4.
