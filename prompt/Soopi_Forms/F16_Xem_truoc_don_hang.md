# FORM F16 — XEM TRƯỚC ĐƠN HÀNG (tách đơn, voucher, phí vận chuyển, tổng tiền)

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F09 (giá), F14 (hàm voucher), F15 (giỏ hàng).

## 1. Mục tiêu

Trước khi đặt hàng, Người dùng thấy **đơn hàng sẽ được tách thế nào theo từng cửa hàng**, giá từng dòng, **voucher nào áp dụng được**, phí vận chuyển và **tổng thanh toán** — tất cả do backend tính. **Form này không ghi gì vào DB** (không tạo đơn, không trừ kho, không trừ voucher). Việc tạo đơn là F17.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.6** (Đặt hàng và thanh toán). Collection **Bảng 3.37, 3.38, 3.33**.
- `AGENTS.md` Mục 8 (Voucher, Giỏ hàng, Đặt hàng — công thức `tongThanhToan`). `02`: **`QĐ-04`**, **`QĐ-05`**, **`QĐ-13`**, **`QĐ-16`** (v2: COD, đơn 0đ), **`QĐ-17`**. `02` Mục E: CR-01.

## 3. API

| Method + URL | Quyền | Body | Kết quả |
|---|---|---|---|
| `POST /api/don-hang/xem-truoc` | đăng nhập | `diaChiNhanHang?` (chuỗi), `danhSachMaVoucher?` (mảng mã), **`phuongThucThanhToan?`** (`VNPay` mặc định hoặc `COD`) | 200 `data` (bên dưới) |

> Đây là `POST` (không phải `GET`) vì có body, nhưng **không thay đổi dữ liệu**.

**Cấu trúc `data`:**
```json
{
  "diaChiNhanHang": "…",           // địa chỉ đã chọn (từ body, nếu không có thì từ hồ sơ) hoặc null
  "thieuDiaChi": false,
  "phuongThucThanhToan": "VNPay",             // phương thức đang chọn (đã kiểm tra hợp lệ)
  "danhSachDonHang": [{
    "cuaHang": { "_id": "...", "tenCuaHang": "..." },
    "danhSachSanPham": [{
      "chiTietGioHangId": "...",
      "sanPham": { "_id": "...", "tenSanPham": "...", "hinhAnh": [] },
      "soLuong": 2, "giaGoc": 200000, "giaBanThucTe": 175000, "thanhTien": 350000
    }],
    "tongTienHang": 350000, "phiVanChuyen": 30000,
    "giamVoucherCuaHang": 0, "giamVoucherToanSan": 0, "tongGiamVoucher": 0,
    "giamPhiVanChuyen": 0, "tongThanhToan": 380000,
    "tuDongDaThanhToan": false,            // true khi đơn này (hoặc cả giao dịch VNPay) có tổng 0đ → không qua cổng
    "voucherApDung": [{ "voucherId": "...", "maVoucher": "...", "loaiVoucher": "Cửa hàng", "giaTriGiamThucTe": 0 }]
  }],
  "tongKet": { "tongTienHang": 0, "tongGiamVoucher": 0, "phiVanChuyen": 0,
               "giamPhiVanChuyen": 0, "tongThanhToan": 0 },
  "voucherApDung": [{ "maVoucher": "...", "tenVoucher": "...", "loaiVoucher": "Toàn sàn", "giaTriGiamThucTe": 0 }],
  "voucherKhongHopLe": [{ "maVoucher": "...", "lyDo": "..." }],
  "voucherGoiY": [{ "maVoucher": "...", "tenVoucher": "...", "loaiVoucher": "...", "kieuGiam": "...",
                    "giaTriGiam": 0, "giamToiDa": 0, "giaTriDonToiThieu": 0, "cuaHangId": null,
                    "dapUngDieuKien": true, "lyDo": null }],
  "canhBao": []
}
```

## 4. Quy tắc nghiệp vụ và ràng buộc

Tạo `services/donHang.service.js` với hàm **lõi dùng chung** `tinhToanDonHang(taiKhoan, { diaChiNhanHang, danhSachMaVoucher })`. **F17 sẽ gọi lại đúng hàm này** để tính lại từ DB lúc tạo đơn — vì vậy hàm phải **thuần tính toán, không ghi DB**.

### 4.1 Lấy sản phẩm
1. Lấy trạng thái giỏ bằng hàm của F15; chỉ dùng các dòng `duocChon = true`.
2. Không có dòng nào được chọn → **400** "Bạn chưa chọn sản phẩm nào để đặt hàng".
3. Có dòng được chọn nhưng `coTheMua = false` → **409**, message liệt kê **tên sản phẩm + lý do** ("Vui lòng quay lại giỏ hàng và điều chỉnh") — đúng ngoại lệ "tồn kho không đủ" của Bảng 3.6.
4. Giá của dòng = `giaBanThucTe` từ hàm F09 (không bao giờ lấy từ client). `thanhTien = soLuong × giaBanThucTe`.

### 4.2 Tách đơn và phí vận chuyển
- **Mỗi cửa hàng một đơn** (nhóm theo `cuaHangId` của sản phẩm). `tongTienHang` = tổng `thanhTien` của đơn.
- `phiVanChuyen` mỗi đơn = hằng số `PHI_VAN_CHUYEN_MAC_DINH` (`QĐ-05`, mặc định 30.000). Thêm hằng số vào `cauHinh.constant.js`.

### 4.3 Địa chỉ
- `diaChiNhanHang` lấy từ body (đã `trim`) nếu có, ngược lại từ `req.taiKhoan.diaChiNhanHang`. Độ dài ≤ `DO_DAI_TOI_DA.DIA_CHI`.
- Trống → `thieuDiaChi = true`, `diaChiNhanHang = null`. **Preview vẫn trả kết quả** (để người dùng thấy tiền); việc **chặn** do F17.

### 4.4 Voucher (`QĐ-04`, `QĐ-13`)
1. `danhSachMaVoucher`: chuẩn hóa `trim + UPPERCASE`, bỏ trùng, tối đa `SO_VOUCHER_TOI_DA_MOI_LAN` (hằng số mới, **10**) → vượt thì 400.
2. Mã không tồn tại → vào `voucherKhongHopLe` với `lyDo` "Mã voucher không tồn tại".
3. Mỗi voucher kiểm tra bằng `kiemTraDieuKienVoucher` của F14. Truyền đúng ngữ cảnh: `Cửa hàng` → `tongTienHangCuaHang` của cửa hàng đó (voucher của cửa hàng **không có trong giỏ** → không hợp lệ, `lyDo` "Voucher không áp dụng cho sản phẩm trong giỏ"); `Toàn sàn`/`Freeship` → `tongTienHangToanBo` (tổng tiền hàng tất cả đơn, **trước** mọi voucher).
4. **Giới hạn mỗi lần thanh toán:** tối đa 1 `Freeship`, 1 `Toàn sàn`, và 1 `Cửa hàng` cho **mỗi** cửa hàng. Mã thừa (theo thứ tự người dùng gửi, mã đứng trước được giữ) → `voucherKhongHopLe` với `lyDo` nêu rõ giới hạn.
5. **Thứ tự tính:**
   - (a) `Cửa hàng`: `giam_i = tinhMucGiamVoucher(v, tongTienHang_i)`.
   - (b) `Toàn sàn`: cơ sở = Σ(`tongTienHang_i − giamCuaHang_i`); mức giảm = `tinhMucGiamVoucher(v, cơ sở)`; **chia cho các đơn theo tỷ lệ** `(tongTienHang_i − giamCuaHang_i)`.
   - (c) `Freeship`: cơ sở = Σ`phiVanChuyen_i`; mức giảm = `tinhMucGiamVoucher(v, cơ sở)` (không vượt cơ sở); **chia theo tỷ lệ** `phiVanChuyen_i`.
6. **Hàm chia `phanBoTheoTyLe(tong, danhSachTrongSo)`** (thuần, đặt trong `utils/phanBoTheoTyLe.js`): mỗi phần = `Math.floor(tong × trongSo_i / Σtrọng số)`; phần dư (còn lại do làm tròn xuống) cộng cho **đơn cuối trước**, không để phần nào vượt trọng số của chính nó (nếu vượt thì dồn sang đơn đứng trước). Tổng các phần **luôn bằng đúng `tong`**. Trọng số tổng bằng 0 → mọi phần bằng 0.
7. Mỗi đơn: `tongGiamVoucher_i = giamCuaHang_i + giamToanSan_i`; `giamPhiVanChuyen_i` = phần Freeship chia cho đơn; **công thức bắt buộc** `tongThanhToan_i = tongTienHang_i − tongGiamVoucher_i + phiVanChuyen_i − giamPhiVanChuyen_i` (≥ 0, đảm bảo bởi các phép kẹp ở trên).
8. `voucherApDung` (cấp `data`): mỗi voucher hợp lệ với `giaTriGiamThucTe` = **tổng** giảm thực tế của nó trên tất cả đơn. **Mỗi phần tử của `danhSachDonHang` cũng có mảng `voucherApDung` riêng** (`voucherId`, `maVoucher`, `loaiVoucher`, `giaTriGiamThucTe` = phần chia cho **đơn đó**, chỉ gồm phần > 0). F17 dùng đúng mảng theo từng đơn này để ghi `ApDungVoucher`; tổng theo voucher của các đơn phải **bằng** `giaTriGiamThucTe` ở cấp `data`.
9. Voucher không hợp lệ **không** được tính giá trị giảm, kèm `lyDo` tiếng Việt (đúng Bảng 3.6).

### 4.5 Gợi ý voucher (`voucherGoiY`)
- Gồm các voucher **đang dùng được** (như `GET /api/voucher` ở F14): hệ thống (`Toàn sàn`, `Freeship`) + voucher `Cửa hàng` của **các cửa hàng có trong giỏ**.
- Mỗi voucher gắn `dapUngDieuKien` (qua `kiemTraDieuKienVoucher` với giỏ hiện tại) và `lyDo` nếu chưa đạt (ví dụ "Cần mua thêm 50.000đ"). Chỉ để giao diện gợi ý — **không** thay thế việc kiểm tra ở bước tạo đơn.

### 4.6 Tổng kết và cảnh báo
- `tongKet` là tổng các đơn.
- **Phương thức thanh toán (`QĐ-16` v2, CR-01):** `phuongThucThanhToan` ∈ {`VNPay`, `COD`}, thiếu = `VNPay`, giá trị khác → 400. Không ảnh hưởng cách tính tiền; chỉ ảnh hưởng cờ/cảnh báo dưới đây và cách F17 tạo giao dịch.
- **Đơn 0đ — `tuDongDaThanhToan`:** `VNPay`: nếu **tổng cả lần thanh toán = 0** thì **mọi đơn** có cờ `true` (không qua cổng). `COD`: **từng đơn** có `tongThanhToan = 0` có cờ `true` (đơn 0đ coi như đã thanh toán).
- `canhBao` (mảng chuỗi tiếng Việt, **không** chặn ở preview): nếu `VNPay` và `0 < tổng < SO_TIEN_VNPAY_TOI_THIEU` (chỉ khi hằng số này đã được xác định từ tài liệu VNPay — `QĐ-16`) → "Đơn dưới X đ không thể thanh toán bằng VNPay. Hãy chọn thanh toán khi nhận hàng (COD) hoặc thêm sản phẩm."; nếu có đơn `tuDongDaThanhToan` → "Đơn 0đ sẽ được xác nhận thanh toán ngay, không cần qua cổng thanh toán." F17 mới chặn.
- **Không** thay đổi `soLuongTon`, `Voucher.soLuong`, giỏ hàng hay bất kỳ bản ghi nào.

## 5. Backend — file cần tạo

`routes/donHang.route.js` (có thể chỉ có `POST /xem-truoc` lúc này; `router.use(batBuocDangNhap)`), `controllers/donHang.controller.js`, `services/donHang.service.js` (`xemTruocDonHang`, `tinhToanDonHang`, `goiYVoucherChoGioHang`), `utils/phanBoTheoTyLe.js`; bổ sung hằng số `PHI_VAN_CHUYEN_MAC_DINH`, `SO_VOUCHER_TOI_DA_MOI_LAN`, `SO_TIEN_VNPAY_TOI_THIEU` (đặt `null` = chưa kiểm tra, cho tới khi AI xác định được từ tài liệu VNPay chính thức — `QĐ-16`). Gắn vào `routes/index.js`.
Không tạo `DonHang` thật; chỉ dựng đối tượng JSON trả về.

## 6. Frontend

**File:** mở rộng `services/donHang.api.js` (`xemTruocDonHang`); page `ThanhToanPage` (`/thanh-toan`, bọc `BaoVeRoute`); components `KhoiDiaChiNhanHang`, `KhoiDonHangCuaHang`, `KhoiVoucher`, `TongKetThanhToan`. **Chưa có nút "Đặt hàng"** (F17 thêm).

### 6.1 Bố cục
Hai cột từ 1024px (nội dung | tổng kết dính); dưới 1024px một cột, **tổng kết rút gọn thành thanh dính đáy** hiện "Tổng thanh toán" (nút đặt hàng sẽ nằm ở đó ở F17).

**Cột trái**
1. **Địa chỉ nhận hàng** (`Card`): hai lựa chọn dạng radio — "Dùng địa chỉ trong hồ sơ" (hiện địa chỉ; ẩn nếu hồ sơ chưa có) và "Nhập địa chỉ khác" (`Textarea`). Hồ sơ chưa có địa chỉ → mặc định chọn "Nhập địa chỉ khác" và hiện nhắc "Vui lòng nhập địa chỉ nhận hàng". Đổi địa chỉ chỉ ảnh hưởng đơn này (muốn lưu lâu dài thì sửa ở hồ sơ — có liên kết).
2. **Đơn theo từng cửa hàng** (`KhoiDonHangCuaHang`, mỗi cửa hàng một `Card`): tên cửa hàng, danh sách dòng (ảnh nhỏ, tên, số lượng, `GiaTien`, thành tiền), dòng "Phí vận chuyển", "Giảm voucher", và **Tổng của đơn**. Ghi chú nhỏ giải thích: "Giỏ có nhiều cửa hàng nên được tách thành nhiều đơn".
3. **Phương thức thanh toán** (`Card`): hai lựa chọn radio — **"Thanh toán qua VNPay"** (mặc định) và **"Thanh toán khi nhận hàng (COD)"**. Chọn COD hiện ghi chú "Bạn thanh toán bằng tiền mặt khi nhận hàng. Đơn được chuyển cho người bán xử lý ngay.". Đổi phương thức gọi lại preview (gửi `phuongThucThanhToan`). Khi `tuDongDaThanhToan` hiện dòng "Đơn 0đ — không cần thanh toán" thay cho ghi chú cổng.

**Cột phải — `KhoiVoucher` + `TongKetThanhToan`**
- Ô nhập "Nhập mã voucher" + nút **"Áp dụng"**; mã nhập thêm vào danh sách đã chọn rồi gọi lại preview.
- **Gợi ý voucher** (`VoucherChip`): bấm để thêm/bỏ; voucher chưa đạt điều kiện hiển thị mờ kèm `lyDo`.
- Voucher đang áp dụng hiện dạng nhãn có nút "x" để bỏ; **voucher không hợp lệ** hiện khối cảnh báo liệt kê `maVoucher` + `lyDo` (và tự bị loại khỏi danh sách đã chọn).
- `TongKetThanhToan`: Tổng tiền hàng · Giảm voucher · Phí vận chuyển · Giảm phí vận chuyển · **Tổng thanh toán** (chữ lớn, màu `--mauGia` hoặc `--chu` — chỉ giá trị này nhấn mạnh).

### 6.2 Hành vi
- Vào trang: gọi `xemTruocDonHang({})`. Mỗi lần đổi địa chỉ (khi rời ô)/thêm/bỏ voucher: gọi lại, hiển thị `Skeleton`/trạng thái mờ trên phần tiền trong lúc chờ để tránh số nhảy.
- Danh sách voucher đã chọn giữ ở state trang; **chỉ** gửi mã, **không** gửi số tiền.
- 400 "chưa chọn sản phẩm" hoặc 409 "sản phẩm không mua được" → `ErrorState` kèm nút **"Quay lại giỏ hàng"**.
- `canhBao` hiển thị dưới tổng kết.
- Mọi số tiền hiển thị lấy nguyên từ response (không tự cộng trừ ở frontend).

## 7. Không được làm

- Không ghi/ sửa bất kỳ dữ liệu nào trong form này (kể cả "giữ chỗ" tồn kho).
- Không tin giá/mức giảm/tổng từ frontend; không nhận `danhSachSanPham` từ client (luôn lấy từ giỏ).
- Không thêm phương thức thanh toán nào ngoài `VNPay` và `COD`.
- Không tự thêm "voucher tự động áp dụng".

## 8. Tiêu chí hoàn thành

- [ ] Giỏ gồm sản phẩm của **2 cửa hàng** → `danhSachDonHang` có **2** phần tử; `tongKet` bằng tổng hai đơn; mỗi đơn đúng công thức `tongThanhToan`.
- [ ] Không chọn dòng nào → 400; có dòng được chọn nhưng hết hàng/ngừng bán → 409 nêu tên sản phẩm.
- [ ] Voucher `Cửa hàng` chỉ giảm đơn của đúng cửa hàng đó; dùng cho cửa hàng khác/không có trong giỏ → `voucherKhongHopLe`.
- [ ] Voucher dưới `giaTriDonToiThieu`, hết hạn, `Vô hiệu hóa`, `soLuong = 0`, mã sai → `voucherKhongHopLe` kèm `lyDo`; **giá trị giảm không được tính**.
- [ ] Gửi 2 mã `Toàn sàn` hợp lệ → chỉ mã đứng trước được áp dụng, mã sau vào `voucherKhongHopLe`.
- [ ] `Toàn sàn` giảm cố định 10.001đ chia cho 2 đơn: tổng phần chia **đúng 10.001** (không lệch 1đ); không phần nào làm `tongThanhToan` âm. Kiểm thử `phanBoTheoTyLe` bằng script tạm (trọng số bằng 0, một phần tử, số lẻ) rồi xóa.
- [ ] `Freeship` không bao giờ giảm quá tổng phí vận chuyển.
- [ ] Sau nhiều lần gọi preview, `SanPham.soLuongTon`, `Voucher.soLuong`, số đơn hàng, giỏ hàng **không đổi**.
- [ ] Gửi kèm số tiền/giá tùy ý trong body → bị bỏ qua.
- [ ] Thiếu địa chỉ → `thieuDiaChi = true` nhưng vẫn 200.
- [ ] `phuongThucThanhToan` = `abc` → 400; bỏ trống → `VNPay`. Voucher giảm hết (tổng 0đ) → `tuDongDaThanhToan = true` ở mọi đơn (VNPay) hoặc ở từng đơn 0đ (COD), **không** có cảnh báo về mức tối thiểu 1 VND; tổng nhỏ nhưng > 0 với VNPay → chỉ cảnh báo khi đã có `SO_TIEN_VNPAY_TOI_THIEU`.
- [ ] Giao diện: địa chỉ/voucher/tổng kết cập nhật đúng sau mỗi thao tác; thanh tổng kết dính đáy trên 360px; dùng được bằng bàn phím.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Ghi tên + chữ ký của `tinhToanDonHang` (F17 dùng lại) và cấu trúc đối tượng trả về.
