# FORM F20 — NGƯỜI BÁN XỬ LÝ ĐƠN HÀNG

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F11, F18, F19 (`dungChiTietDonHang`, `TienTrinhDonHang`).

## 1. Mục tiêu

Người bán xem các đơn **của cửa hàng mình**, xem thông tin người mua, và **tiến trạng thái xử lý theo đúng thứ tự** cho các đơn **đã thanh toán hoặc đơn COD** (thu tiền khi giao). Người bán **không** thể từ chối hay hủy đơn. Khi chuyển `Hoàn thành`, hệ thống ghi **`ngayHoanThanh`** và với đơn COD ghi nhận **đã thu tiền**.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.15** (Quản lý đơn hàng). Collection **Bảng 3.37, 3.38**.
- `AGENTS.md` Mục 6 (endpoint đổi trạng thái), Mục 8 (**Trạng thái đơn**, Phân quyền). `02` (v2): `QĐ-03` (hủy đơn do người dùng — F30), **`QĐ-16`** (COD), `QĐ-02`, `QĐ-18`. `02` Mục E: CR-01, CR-03.

## 3. API

| Method + URL | Quyền | Query / Body | Kết quả |
|---|---|---|---|
| `GET /api/nguoi-ban/don-hang` | Người bán | `trangThaiXuLy?`, `trangThaiThanhToan?`, `phuongThucThanhToan?`, `thanhToanHopLe?` (`true`), `trang`, `gioiHan` | `data = { danhSach, phanTrang }` (đơn của cửa hàng mình, `ngayTao` giảm dần) |
| `GET /api/nguoi-ban/don-hang/:id` | Người bán | — | `data.donHang` |
| `PATCH /api/don-hang/:id/trang-thai` | Người bán | `trangThaiXuLy` (trạng thái **kế tiếp**) | 200 `data.donHang` |

> `PATCH` dùng đúng đường dẫn mặc định của AGENTS Mục 6 (`/api/don-hang/:id/trang-thai`), nhưng **chỉ vai trò Người bán** được gọi (middleware ở cấp route).

**Phần tử `danhSach`:** `_id, ngayTao, nguoiMua: { hoTen, soDienThoai }, tongThanhToan, phuongThucThanhToan, trangThaiThanhToan, trangThaiXuLy, soDong, sanPhamDau, trangThaiTiepTheo`.
**`donHang` chi tiết:** như F19 (dùng lại `dungChiTietDonHang`) **nhưng**: có `nguoiMua: { hoTen, soDienThoai }`, `diaChiNhanHang`; **không** có `maGiaoDich`/thông tin giao dịch (chỉ `trangThaiThanhToan`); thêm `trangThaiTiepTheo` (chuỗi hoặc `null`) và `coTheCapNhat` (boolean). Có thể kèm yêu cầu đổi trả của từng dòng (`yeuCauDoiTra`) ở dạng rút gọn.

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Sở hữu
- Mọi truy vấn có `cuaHangId = req.cuaHang._id`. Đơn của cửa hàng khác hoặc không tồn tại → **404**.
- Thông tin người mua chỉ gồm `hoTen`, `soDienThoai` (+ `diaChiNhanHang` của **đơn**). **Không** trả `email`, `vaiTro`, hay trường nào khác của `TaiKhoan`.

### 4.2 Luồng trạng thái xử lý (AGENTS Mục 8)
Thêm vào `trangThai.constant.js`: `THU_TU_TRANG_THAI_XU_LY = [Chờ xác nhận, Đã xác nhận, Đang xử lý, Đang vận chuyển, Hoàn thành]` (dùng các hằng số có sẵn, không gõ lại chuỗi).

`capNhatTrangThaiXuLyDonHang(cuaHang, donHangId, trangThaiMoi)` — kiểm tra theo thứ tự:
1. Đơn thuộc `cuaHang` (404 nếu không).
2. `trangThaiMoi` thuộc `TRANG_THAI_XU_LY`, nếu không → 400. Nếu là `Đã hủy` → **403/409** "Người bán không thể hủy hoặc từ chối đơn hàng" (`Đã hủy` chỉ do hệ thống đặt).
3. **Đơn phải sẵn sàng xử lý (`QĐ-16` v2, CR-01):** `trangThaiThanhToan = 'Đã thanh toán'` **hoặc** (`phuongThucThanhToan = 'COD'` **và** `trangThaiThanhToan = 'Chờ thanh toán'`). Đơn `VNPay` chưa thanh toán/`Thất bại`/`Hết hạn` → **409** "Đơn hàng chưa thanh toán thành công nên chưa thể xử lý".
4. Đơn hiện tại **không** `Đã hủy` và **không** `Hoàn thành` → nếu không **409** ("Đơn hàng đã hủy" / "Đơn hàng đã hoàn thành").
5. `trangThaiMoi` phải là **đúng bước kế tiếp** của trạng thái hiện tại trong `THU_TU_TRANG_THAI_XU_LY`. **Không nhảy cóc, không lùi, không giữ nguyên** → **409** "Trạng thái không hợp lệ: đơn đang ở 'X', bước kế tiếp là 'Y'".
6. Ghi bằng **thao tác nguyên tử có điều kiện**:
   `DonHang.findOneAndUpdate({ _id, cuaHangId, trangThaiXuLy: <hiện tại>, $or: [ { trangThaiThanhToan: 'Đã thanh toán' }, { phuongThucThanhToan: 'COD', trangThaiThanhToan: 'Chờ thanh toán' } ] }, { $set: { trangThaiXuLy: trangThaiMoi } }, { new: true })`.
   **Riêng khi `trangThaiMoi = 'Hoàn thành'`** (cùng **một** thao tác ghi ở trên): thêm `ngayHoanThanh: now`; và nếu là đơn **`COD`** đang `Chờ thanh toán` thì **đồng thời** đặt `trangThaiThanhToan = 'Đã thanh toán'` (đã thu tiền khi giao hàng). Điều kiện bộ lọc phải dùng giá trị `trangThaiThanhToan` hiện tại để không ghi đè nhầm.
   `null` → **409** "Trạng thái đơn vừa thay đổi, vui lòng tải lại" (chống bấm đúp/hai thiết bị cùng lúc, **và khi người dùng vừa hủy đơn ở F30**). Lỗi khác → giữ nguyên trạng thái cũ (đúng Bảng 3.15).
   **Sau khi ghi thành công** một đơn **COD** chuyển `Hoàn thành`: cập nhật giao dịch COD của đơn đó `findOneAndUpdate({ _id: giaoDichId, trangThaiThanhToan: 'Chờ thanh toán' }, { $set: { trangThaiThanhToan: 'Thành công', thoiGianHoanTat: now } })` (thử lại một lần nếu lỗi; vẫn lỗi thì ghi log — đơn là nguồn sự thật, giao dịch COD không bị tác vụ tự hủy đụng tới).
7. Không có endpoint nào khác cho phép đổi `trangThaiXuLy` (Người dùng và Quản trị viên **không** được).

> Không tự cộng/trừ tồn kho khi đổi trạng thái (kho chỉ trừ lúc tạo đơn và hoàn khi hủy hệ thống — F17/F18). Không thêm bước "hoàn thành → hoàn tiền".

### 4.3 `trangThaiTiepTheo`, `coTheCapNhat`
- `trangThaiTiepTheo` = bước kế tiếp nếu đơn **sẵn sàng xử lý** (đã thanh toán, hoặc COD đang chờ thu tiền — theo mục 4.2.3), không `Đã hủy`, chưa `Hoàn thành`; ngược lại `null`.
- `coTheCapNhat = trangThaiTiepTheo !== null`. Frontend chỉ dựa vào cờ này để hiện nút; backend vẫn kiểm tra lại ở 4.2.

## 5. Backend — file cần tạo/sửa

`routes/nguoiBanDonHang.route.js` (`router.use(...batBuocNguoiBan)`), mở rộng `routes/donHang.route.js` (`PATCH /:id/trang-thai` với `batBuocVaiTro(VAI_TRO.NGUOI_BAN)` + `batBuocCuaHang`), `controllers/donHang.controller.js`, `services/donHang.service.js` (`nguoiBanLayDanhSachDonHang`, `nguoiBanLayChiTietDonHang`, `capNhatTrangThaiXuLyDonHang`); hằng số `THU_TU_TRANG_THAI_XU_LY`.

## 6. Frontend

**File:** `services/donHang.api.js` (thêm `nguoiBanLayDanhSachDonHang`, `nguoiBanLayChiTietDonHang`, `capNhatTrangThaiDonHang`); components `NutChuyenTrangThaiDon`; pages `nguoiBan/DonHangNguoiBanPage` (`/nguoi-ban/don-hang`), `nguoiBan/ChiTietDonHangNguoiBanPage` (`/nguoi-ban/don-hang/:id`). Thêm vào `hangSo.js` bảng `HANH_DONG_TIEP_THEO`: ánh xạ trạng thái hiện tại → `{ nhan, dich }` (ví dụ `Chờ xác nhận` → nhãn **"Xác nhận đơn"**; `Đã xác nhận` → **"Bắt đầu xử lý"**; `Đang xử lý` → **"Chuyển sang vận chuyển"**; `Đang vận chuyển` → **"Hoàn thành đơn"**). Dùng chung bảng `TAB_DON_HANG` (ánh xạ tab → tham số lọc) với F19.

### 6.1 `DonHangNguoiBanPage`
- `PageHeader` "Đơn hàng" + `Tabs` giống F19 (**Tất cả · Chờ thanh toán · Chờ xác nhận · Đã xác nhận · Đang xử lý · Đang vận chuyển · Hoàn thành · Đã hủy**), lọc lưu trên URL. Mặc định mở tab **Chờ xác nhận** (đơn cần hành động).
- `DataTable`: *Mã đơn*, *Người mua* (họ tên + SĐT), *Sản phẩm* (đầu + "+N"), *Tổng*, *Thanh toán* và *Xử lý* (`TrangThaiBadge`), *Ngày đặt*, *Thao tác* ("Xem" + nút hành động kế tiếp nếu `coTheCapNhat`). Mobile → thẻ.
- Đơn **VNPay** chưa thanh toán: không có nút hành động; chú thích nhỏ "Chờ khách thanh toán". Đơn **COD**: có nhãn "COD — thu tiền khi giao" kèm số tiền cần thu (`tongThanhToan`); nút **"Hoàn thành đơn"** ở bước cuối dùng hộp thoại xác nhận "Xác nhận đã giao hàng và thu đủ X đ?".
- Nút hành động (`NutChuyenTrangThaiDon`) luôn qua `ConfirmDialog` ("Chuyển đơn #… sang 'Đã xác nhận'?"); lỗi 409 hiển thị đúng thông báo và **tải lại danh sách**.
- Đủ trạng thái tải/rỗng ("Chưa có đơn hàng nào ở mục này")/lỗi; `Pagination`.

### 6.2 `ChiTietDonHangNguoiBanPage`
- Đầu trang: mã đơn, ngày đặt, hai `Badge`; **`TienTrinhDonHang`** (F19) cho thấy vị trí hiện tại; khối **hành động chính** (một nút chính theo `trangThaiTiepTheo`) — ẩn nếu `coTheCapNhat = false`, thay bằng dòng giải thích lý do ("Đơn chưa thanh toán", "Đơn đã hủy", "Đơn đã hoàn thành").
- Thẻ **Người mua**: họ tên, số điện thoại, địa chỉ nhận hàng.
- Danh sách sản phẩm (giá/ số lượng/ thành tiền **snapshot**), với từng dòng có yêu cầu đổi trả hiển thị nhãn trạng thái (liên kết chi tiết sẽ có ở F22).
- Tổng kết tiền như F19 (tổng tiền hàng, giảm voucher, phí vận chuyển, giảm phí vận chuyển, **tổng thanh toán**) và trạng thái thanh toán.
- 404 → `ErrorState` + nút về danh sách.
- Thêm/kiểm tra mục "Đơn hàng" trong `MENU_NGUOI_BAN`.

## 7. Không được làm

- Không cho Người bán tạo `Đã hủy`, từ chối đơn đã thanh toán, nhảy cóc hoặc lùi trạng thái.
- Không cho xử lý đơn **VNPay** chưa thanh toán; không cho Quản trị viên/Người dùng đổi `trangThaiXuLy` (Người dùng chỉ hủy qua F30).
- Không lộ email/thông tin tài khoản người mua ngoài `hoTen`, `soDienThoai`.
- Không tin `cuaHangId` từ client.

## 8. Tiêu chí hoàn thành (kiểm thử đầy đủ)

- [ ] Người bán A xem/đổi trạng thái đơn của cửa hàng B → 404. `Người dùng`/Quản trị viên gọi `PATCH` → 403. Chưa đăng nhập → 401.
- [ ] Đơn **VNPay** `Chờ thanh toán` / `Thất bại` / `Hết hạn` và mọi đơn `Đã hủy` → `PATCH` bị **409**; `coTheCapNhat = false`.
- [ ] **Đơn COD** (`Chờ thanh toán`) đi đúng thứ tự đến `Hoàn thành`: ở bước `Hoàn thành` đơn thành `Đã thanh toán`, **`ngayHoanThanh` có giá trị**, giao dịch COD của đơn thành `Thành công` + `thoiGianHoanTat`; các bước trước đó `trangThaiThanhToan` vẫn `Chờ thanh toán`.
- [ ] Đơn VNPay đã thanh toán chuyển `Hoàn thành` → `ngayHoanThanh` có giá trị, `trangThaiThanhToan` giữ `Đã thanh toán`.
- [ ] Đơn 0đ (tự động `Đã thanh toán`) xử lý được bình thường.
- [ ] Đơn đã thanh toán đi **đúng thứ tự** `Chờ xác nhận → Đã xác nhận → Đang xử lý → Đang vận chuyển → Hoàn thành` (từng bước 200).
- [ ] Nhảy cóc (`Chờ xác nhận → Đang xử lý`), lùi, giữ nguyên, gửi `Đã hủy`, gửi giá trị lạ → đều bị từ chối (400/409), DB không đổi.
- [ ] Đơn `Hoàn thành` không đổi được nữa.
- [ ] Hai request cùng chuyển một bước đồng thời → chỉ một thành công (một cái 409).
- [ ] Sau khi chuyển trạng thái, Người dùng mở lại `GET /api/don-hang/:id` thấy trạng thái mới; đơn `Hoàn thành` làm `coTheDanhGia/coTheGuiYeuCau` thành `true` ở phía Người dùng (kiểm tra cho F21/F22).
- [ ] Response chi tiết không chứa `email`, `matKhau`, `maGiaoDich`.
- [ ] Giao diện: tab/ lọc đúng; nút hành động đổi theo trạng thái; ConfirmDialog hoạt động; lỗi 409 tải lại dữ liệu; ổn ở 360px.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Liệt kê kết quả từng ca ở Mục 8.
