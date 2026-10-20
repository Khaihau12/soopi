# FORM F19 — ĐƠN HÀNG CỦA NGƯỜI DÙNG: DANH SÁCH, CHI TIẾT, THEO DÕI

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F17, F18. *(F30 sẽ bổ sung hủy đơn vào chính các hàm của form này.)*

## 1. Mục tiêu

Người dùng xem **lịch sử đơn hàng**, **chi tiết** từng đơn (sản phẩm, giá tại thời điểm đặt, voucher đã áp dụng, phí, tổng, phương thức/trạng thái thanh toán) và **theo dõi trạng thái xử lý**. Đơn còn hạn thanh toán có nút **"Thanh toán"**. **Chỉ xem** — không sửa đơn.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.7** (Quản lý và theo dõi đơn hàng). Collection **Bảng 3.37–3.39, 3.33, 3.40, 3.41**.
- `AGENTS.md` Mục 8 (Trạng thái đơn). `02` (v2): **`QĐ-02`** (hạn đổi trả 7 ngày), **`QĐ-03`** (hủy đơn — làm ở F30), **`QĐ-16`** (COD), **`QĐ-20`**. `02` Mục E: CR-01, CR-03.

## 3. API

| Method + URL | Quyền | Query | Kết quả |
|---|---|---|---|
| `GET /api/don-hang` | đăng nhập | `trangThaiXuLy?`, `trangThaiThanhToan?`, `phuongThucThanhToan?`, `thanhToanHopLe?` (`true`), `trang`, `gioiHan` | `data = { danhSach, phanTrang }`, sắp `ngayTao` giảm dần |
| `GET /api/don-hang/:id` | đăng nhập (chủ đơn) | — | `data.donHang` |

**Phần tử `danhSach`:** `_id, ngayTao, cuaHang: { _id, tenCuaHang }, tongThanhToan, trangThaiThanhToan, trangThaiXuLy, soDong, sanPhamDau: { tenSanPham, hinhAnh, soLuong }`.

**`donHang` chi tiết:**
```
_id, ngayTao, diaChiNhanHang, tongTienHang, tongGiamVoucher, phiVanChuyen, giamPhiVanChuyen,
tongThanhToan, phuongThucThanhToan, trangThaiThanhToan, trangThaiXuLy,
cuaHang: { _id, tenCuaHang },
giaoDich: { _id, maGiaoDich, trangThaiThanhToan, thoiGianTao },
hanThanhToan, coTheThanhToanLai,
ngayHoanThanh, hanGuiYeuCau,            // hanGuiYeuCau = ngayHoanThanh + SO_NGAY_DOI_TRA_TOI_DA ngày (null nếu chưa hoàn thành)
coTheHuy, kieuHuy, soDonSeBiHuy, canHoanTienThuCong,   // do F30 bổ sung
voucherApDung: [{ maVoucher, tenVoucher, loaiVoucher, giaTriGiamThucTe }],
danhSachChiTiet: [{
  _id, soLuong, giaGocTaiThoiDiemDat, giaBanThucTe, thanhTien,
  sanPham: { _id, tenSanPham, hinhAnh },
  coTheDanhGia, daDanhGia, yeuCauDoiTra: { _id, loaiYeuCau, trangThaiXuLy, ketQuaXuLy } | null,
  coTheGuiYeuCau
}]
```

## 4. Quy tắc nghiệp vụ và ràng buộc

1. **Sở hữu:** mọi truy vấn có `taiKhoanId = req.taiKhoan._id`. Đơn của người khác hoặc không tồn tại → **404** (không dùng 403).
2. **Hiển thị snapshot:** giá/số lượng/thành tiền lấy từ `ChiTietDonHang` (giá **tại thời điểm đặt**), không lấy giá hiện tại của sản phẩm. Sản phẩm sau này bị ngừng/xóa vẫn hiển thị theo dữ liệu đã lưu (tên/ảnh lấy từ `SanPham`; nếu không còn → "Sản phẩm không còn hiển thị").
3. **Cờ thao tác** (cho các form sau, tính ở backend):
   - `coTheThanhToanLai` = đơn **`VNPay`**, `giaoDich.trangThaiThanhToan = 'Chờ thanh toán'` **và** chưa quá `thoiGianTao + THOI_HAN_THANH_TOAN_GIO` (`QĐ-20`). `hanThanhToan` = `thoiGianTao + 24 giờ` (chỉ với `VNPay`; đơn `COD` → `coTheThanhToanLai = false`, `hanThanhToan = null`).
   - `coTheDanhGia` = đơn `trangThaiXuLy = 'Hoàn thành'` **và** chưa có `DanhGia` cho dòng đó. `daDanhGia` tương ứng. *(Sử dụng ở F21.)*
   - `coTheGuiYeuCau` = đơn `Hoàn thành` **và** **còn trong hạn gửi** (`hiện tại ≤ ngayHoanThanh + SO_NGAY_DOI_TRA_TOI_DA`; **thêm hằng số `SO_NGAY_DOI_TRA_TOI_DA = 7` vào `cauHinh.constant.js` ở form này** và viết một hàm `tinhHanGuiYeuCau(donHang)` dùng chung với F22; thiếu `ngayHoanThanh` thì tính từ `ngayTao`) **và** chưa có `YeuCauDoiTraKhieuNai` cho dòng đó (`QĐ-02`). `yeuCauDoiTra` là yêu cầu hiện có (nếu có). *(Sử dụng ở F22.)*
   Nếu `DanhGia`/`YeuCauDoiTraKhieuNai` chưa có dữ liệu → `daDanhGia = false`, `yeuCauDoiTra = null` — **không** lỗi.
4. **Không N+1:** danh sách dùng truy vấn cố định (đơn → `ChiTietDonHang` theo `$in` các `donHangId` của trang → sản phẩm đầu). Chi tiết dùng số truy vấn cố định (đơn, cửa hàng, giao dịch, chi tiết + sản phẩm, đánh giá theo `$in`, yêu cầu theo `$in`, `ApDungVoucher` + voucher).
5. **Không có API sửa đơn** cho Người dùng. *Hủy đơn* do **F30** thêm (`PATCH /api/don-hang/:id/huy`) và bổ sung `coTheHuy`, `kieuHuy`, `soDonSeBiHuy`, `canHoanTienThuCong` vào dữ liệu đơn.
6. Lọc: `trangThaiXuLy`, `trangThaiThanhToan`, `phuongThucThanhToan` phải thuộc hằng số hợp lệ, sai → 400. **`thanhToanHopLe=true`** = đơn đã sẵn sàng vào luồng xử lý: `trangThaiThanhToan = Đã thanh toán` **hoặc** (`phuongThucThanhToan = COD` và `trangThaiThanhToan = Chờ thanh toán`) — dùng ở các tab xử lý bên dưới (và F20).
7. Dùng chung: viết hàm dựng chi tiết đơn đầy đủ (`dungChiTietDonHang`) để **F20 (Người bán) dùng lại** với phạm vi dữ liệu khác.

## 5. Backend — file cần tạo/sửa

Mở rộng `routes/donHang.route.js` (`GET /`, `GET /:id`), `controllers/donHang.controller.js`, `services/donHang.service.js` (`layDanhSachDonHangCuaToi`, `layChiTietDonHangCuaToi`, `dungChiTietDonHang`).

## 6. Frontend

**File:** mở rộng `services/donHang.api.js` (`layDanhSachDonHang`, `layChiTietDonHang`); `hooks/useThanhToanVnpay.js` (gọi `taoThanhToanVnpay` rồi `window.location.assign`, có `dangChuyen`, `loi`); pages `DonHangPage` (`/don-hang`), `ChiTietDonHangPage` (`/don-hang/:id`); components `DonHangCard`, `TienTrinhDonHang`; thêm `maDonHangHienThi(id)` vào `utils/dinhDang.js` (hiển thị "#" + 8 ký tự cuối của `_id` viết hoa — chỉ để hiển thị). Thêm mục "Đơn hàng" vào `MENU_TAI_KHOAN` và vào `DUONG_DAN`.

### 6.1 `DonHangPage`
- `PageHeader` "Đơn hàng của tôi".
- `Tabs` cuộn ngang (trạng thái trên URL query): **Tất cả · Chờ thanh toán · Chờ xác nhận · Đã xác nhận · Đang xử lý · Đang vận chuyển · Hoàn thành · Đã hủy**. Ánh xạ tab → tham số nằm trong `hangSo.js` (không `if` rải rác): *Chờ thanh toán* → `trangThaiThanhToan = Chờ thanh toán` **và** `phuongThucThanhToan = VNPay` (đơn VNPay chưa trả tiền; đơn COD **không** nằm ở tab này); các tab xử lý (*Chờ xác nhận … Hoàn thành*) → `trangThaiXuLy = …` **và** `thanhToanHopLe = true` (gồm cả đơn COD đang chờ Người bán xử lý); *Đã hủy* → `trangThaiXuLy = Đã hủy`.
- `DonHangCard` (mỗi đơn một thẻ): hàng đầu = tên cửa hàng + `TrangThaiBadge` (trạng thái xử lý; nếu chưa thanh toán thì badge trạng thái thanh toán); thân = ảnh nhỏ + tên sản phẩm đầu + "× số lượng" + "và N sản phẩm khác" nếu có; chân = ngày đặt, **Tổng thanh toán** (nhấn mạnh), nút **"Xem chi tiết"**, và nút chính **"Thanh toán"** khi `coTheThanhToanLai` (xem 6.2).
- `Pagination`; chưa có đơn → `EmptyState` "Bạn chưa có đơn hàng nào" + nút "Xem sản phẩm" (đúng ngoại lệ Bảng 3.7); đủ tải/lỗi.

### 6.2 `ChiTietDonHangPage`
- Đầu trang: "Đơn #XXXXXXXX", ngày đặt, `TrangThaiBadge` xử lý + thanh toán.
- **`TienTrinhDonHang`** (stepper ngang trên desktop, dọc trên mobile): *Chờ xác nhận → Đã xác nhận → Đang xử lý → Đang vận chuyển → Hoàn thành*; bước hiện tại nổi bật, các bước trước đã hoàn thành. Đơn `Đã hủy` → **không** hiện stepper mà hiện khối "Đơn hàng đã bị hủy" kèm lý do suy ra từ `trangThaiThanhToan` ("do thanh toán không thành công" / "do quá thời hạn thanh toán").
- Khối **chờ thanh toán** (khi `coTheThanhToanLai`): "Vui lòng thanh toán trước *hanThanhToan*" + nút chính **"Thanh toán ngay"** dùng `useThanhToanVnpay` (lớp phủ "Đang chuyển tới VNPay…"; lỗi hiện rõ).
- **Danh sách sản phẩm:** ảnh (liên kết trang sản phẩm), tên, số lượng, giá tại thời điểm đặt (nếu `giaGocTaiThoiDiemDat > giaBanThucTe` hiện giá gốc gạch ngang), thành tiền. *(Nút "Đánh giá"/"Yêu cầu đổi trả" sẽ do F21/F22 gắn vào mỗi dòng dựa trên `coTheDanhGia`, `coTheGuiYeuCau`.)*
- **Thông tin:** địa chỉ nhận hàng, cửa hàng, phương thức thanh toán (**VNPay** hoặc **COD** — với COD hiển thị "Thanh toán khi nhận hàng: X đ" và không có mã giao dịch VNPay), mã giao dịch, trạng thái thanh toán. Đơn đã `Hoàn thành` còn hạn: dòng "Còn X ngày để gửi yêu cầu đổi trả/khiếu nại" (từ `hanGuiYeuCau`).
- **Tổng kết tiền:** Tổng tiền hàng · Giảm voucher (kèm danh sách voucher đã áp dụng: mã + số tiền) · Phí vận chuyển · Giảm phí vận chuyển · **Tổng thanh toán**.
- 404 → `ErrorState` "Không tìm thấy đơn hàng" + nút về danh sách.

## 7. Không được làm

- Không cho Người dùng sửa đơn (hủy đơn thuộc F30); không hiển thị giá hiện tại thay giá snapshot.
- Không lộ `maGiaoDich`/dữ liệu của đơn người khác; không lấy đơn theo `id` mà không kiểm tra chủ sở hữu.
- Không thêm field (mã đơn, lịch sử trạng thái, ghi chú) vào `DonHang`.

## 8. Tiêu chí hoàn thành

- [ ] Người A gọi `GET /api/don-hang/:id` của người B → 404; chưa đăng nhập → 401; `id` sai định dạng → 400.
- [ ] Danh sách chỉ có đơn của chính mình, mới nhất trước; bộ lọc theo từng trạng thái đúng; tham số lọc sai → 400; `gioiHan` bị chặn.
- [ ] Đổi `giaGoc`/giá khuyến mãi của sản phẩm sau khi đặt → chi tiết đơn vẫn hiện giá cũ.
- [ ] Voucher đã áp dụng hiển thị đúng mã và số tiền theo đơn.
- [ ] Đơn `Chờ thanh toán` còn hạn → `coTheThanhToanLai = true` và nút "Thanh toán" hoạt động (tạo URL VNPay mới); đơn đã hủy/hết hạn/đã thanh toán → không có nút.
- [ ] Đơn `Hoàn thành` chưa đánh giá → dòng có `coTheDanhGia = true`; chưa có dữ liệu đánh giá/đổi trả vẫn không lỗi.
- [ ] **Hạn đổi trả:** đơn hoàn thành 3 ngày trước → `coTheGuiYeuCau = true`, `hanGuiYeuCau` đúng; chỉnh `ngayHoanThanh` lùi 8 ngày → `coTheGuiYeuCau = false` (giao diện hiển thị "đã quá hạn").
- [ ] **COD:** đơn COD `Chờ thanh toán` **không** có nút "Thanh toán", không nằm ở tab "Chờ thanh toán" mà nằm ở tab theo trạng thái xử lý (nhờ `thanhToanHopLe`); đơn VNPay chưa trả tiền **không** nằm ở các tab xử lý.
- [ ] Số truy vấn của danh sách 12 đơn **cố định**, không tăng theo số đơn.
- [ ] Giao diện: các tab lọc đúng; stepper đúng mọi trạng thái (kể cả `Đã hủy`); thẻ đơn/ chi tiết ổn ở 360px; dùng được bằng bàn phím.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Ghi tên hàm `dungChiTietDonHang` để F20 dùng lại.
