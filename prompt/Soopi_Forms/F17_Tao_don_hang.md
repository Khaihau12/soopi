# FORM F17 — TẠO ĐƠN HÀNG (VNPay / COD / đơn 0đ) + TRỪ TỒN KHO + CHUYỂN SANG VNPAY

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F15, F16 (hàm `tinhToanDonHang`), F14.
> **Đây là form rủi ro cao nhất** (tiền + tồn kho + không có transaction). Làm chậm, kiểm thử kỹ.

## 1. Mục tiêu

Khi Người dùng bấm **"Đặt hàng"**: backend **tính lại từ DB**, kiểm tra tồn kho, **tách thành nhiều đơn theo cửa hàng**, tạo giao dịch thanh toán **tùy phương thức**, **trừ tồn kho và lượt voucher an toàn**, ghi snapshot giá. Với **VNPay** (tổng > 0) trả về URL để chuyển sang cổng; với **COD** và **đơn 0đ** thì **không qua cổng**. (Kết quả VNPay, hủy/hoàn kho khi thất bại/hết hạn là **F18**; hủy đơn do người dùng là **F30**.)

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.6**; biểu đồ đặt hàng. Collection **Bảng 3.37–3.39, 3.33**.
- `AGENTS.md` Mục 8 (Đặt hàng, Tồn kho, Trạng thái đơn, Voucher), **Mục 9 (VNPay)**.
- `02` (v2): **`QĐ-05`, `QĐ-07`, `QĐ-13`, `QĐ-15`, `QĐ-16`** (COD, đơn 0đ, giới hạn VNPay), **`QĐ-20`** (thanh toán lại). `02` Mục E: **CR-01** (`COD`).

## 3. API

| Method + URL | Quyền | Body | Kết quả |
|---|---|---|---|
| `POST /api/don-hang` | đăng nhập | `diaChiNhanHang?`, `danhSachMaVoucher?`, `phuongThucThanhToan?` (`VNPay` mặc định / `COD`) | **201** `data` (bên dưới) |
| `POST /api/giao-dich-thanh-toan/vnpay/tao-thanh-toan` | đăng nhập (chủ giao dịch) | `giaoDichId` | 200 `data.duongDanThanhToan` |

**`data` của `POST /api/don-hang`:**
```json
{
  "phuongThucThanhToan": "VNPay",
  "danhSachGiaoDich": [{ "_id": "...", "maGiaoDich": "...", "soTien": 0, "phuongThucThanhToan": "VNPay", "trangThaiThanhToan": "Chờ thanh toán", "thoiGianTao": "..." }],
  "danhSachDonHang": [{ "_id": "...", "cuaHang": { "_id": "...", "tenCuaHang": "..." }, "tongThanhToan": 0, "trangThaiThanhToan": "Chờ thanh toán", "trangThaiXuLy": "Chờ xác nhận" }],
  "canThanhToanVnpay": true,
  "giaoDichVnpayId": "..."        // chỉ có khi canThanhToanVnpay = true
}
```

## 4. Quy tắc nghiệp vụ — tạo đơn (`datHang` trong `donHang.service.js`)

### 4.1 Thứ tự bắt buộc
1. **Tính lại** bằng `tinhToanDonHang` (F16, truyền `phuongThucThanhToan`) từ DB. **Bỏ qua** mọi số tiền/giá từ client. Backend **tự kiểm tra lại trạng thái sản phẩm và cửa hàng** (`Đang kinh doanh` / `Hoạt động`, còn hàng) — **không dựa vào việc giao diện ẩn nút** (`QĐ-15`). Chặn:
   - `thieuDiaChi` → 400 "Vui lòng nhập địa chỉ nhận hàng".
   - Có **bất kỳ** `voucherKhongHopLe` → **409** kèm danh sách mã + lý do, yêu cầu xem lại đơn (`QĐ-13`).
   - `phuongThucThanhToan = VNPay` **và** `0 < tongKet.tongThanhToan < SO_TIEN_VNPAY_TOI_THIEU` (chỉ khi hằng số đã được xác định từ tài liệu VNPay) → 400 "Đơn dưới X đ không thể thanh toán bằng VNPay, hãy chọn COD". **Tổng bằng 0 KHÔNG bị chặn** (xem 4.2).
2. **Trừ tồn kho** từng dòng bằng **thao tác nguyên tử có điều kiện** (đúng AGENTS Mục 8):
   `SanPham.updateOne({ _id, soLuongTon: { $gte: soLuong } }, { $inc: { soLuongTon: -soLuong } })`.
   - `modifiedCount === 0` → dừng, **hoàn lại các dòng đã trừ trước đó**, trả **409** "Sản phẩm 'X' không đủ số lượng. Vui lòng điều chỉnh giỏ hàng".
   - Ghi lại danh sách đã trừ (`daTruKho`) để hoàn tác khi lỗi muộn hơn.
3. **Trừ lượt voucher** (`QĐ-13`): mỗi **voucher khác nhau** 1 lần: `Voucher.updateOne({ _id, soLuong: { $gte: 1 }, trangThai: 'Kích hoạt' }, { $inc: { soLuong: -1 } })`. Thất bại → hoàn tác kho + voucher đã trừ, 409 "Voucher 'X' vừa hết lượt". Ghi lại `daTruVoucher`.
4. **Tạo giao dịch** (`GiaoDichThanhToan`) theo phương thức — xem 4.2.
5. Với **mỗi** đơn: tạo `DonHang` (xem 4.2 về trạng thái thanh toán) + `ChiTietDonHang` (**snapshot**: `soLuong`, `giaGocTaiThoiDiemDat = giaGoc`, `giaBanThucTe`, `thanhTien`) + `ApDungVoucher` cho mỗi voucher có phần giảm > 0 của đơn đó (`giaTriGiamThucTe`, `thoiGianApDung = now`) — dùng mảng `voucherApDung` theo từng đơn của F16.
   `DonHang`: `diaChiNhanHang` (snapshot), các khoản tiền, `phuongThucThanhToan`, `trangThaiXuLy = 'Chờ xác nhận'`, `ngayTao = now`, `taiKhoanId` (từ `req.taiKhoan`), `cuaHangId`, `giaoDichId`; **`ngayHoanThanh` để trống**.
6. **Xóa các dòng giỏ đã đặt** (`duocChon = true`, đúng những dòng đưa vào đơn) và tính lại `GioHang.tongGiaTri` (`QĐ-07`). Chỉ làm **sau khi** mọi bản ghi đã tạo thành công.
7. Trả 201 theo cấu trúc ở Mục 3.

### 4.2 Giao dịch và trạng thái thanh toán theo phương thức (`QĐ-16` v2, CR-01)

| Trường hợp | Giao dịch | `trangThaiThanhToan` đơn | Bước tiếp theo |
|---|---|---|---|
| **VNPay, tổng > 0** | **Một** giao dịch chung: `soTien` = tổng các đơn, `VNPay`, `Chờ thanh toán`, `thoiGianTao = now` | `Chờ thanh toán` | `canThanhToanVnpay = true`; frontend gọi `tao-thanh-toan` rồi chuyển sang VNPay |
| **VNPay, tổng = 0** (voucher giảm hết) | **Một** giao dịch: `soTien = 0`, `VNPay`, **`Thành công`**, `thoiGianHoanTat = now` | **`Đã thanh toán`** | **Không** gọi VNPay (`canThanhToanVnpay = false`). Đơn đi tiếp luồng xử lý của Người bán |
| **COD** | **Mỗi đơn một giao dịch** riêng: `soTien` = `tongThanhToan` của đơn, `COD`, `Chờ thanh toán` | `Chờ thanh toán` (sẽ thành `Đã thanh toán` khi Người bán chuyển `Hoàn thành`, F20) | `canThanhToanVnpay = false`; Người bán xử lý **ngay**; **không** tự hủy sau 24 giờ |
| **COD, đơn có `tongThanhToan = 0`** | Giao dịch của đơn đó: `soTien = 0`, `COD`, **`Thành công`**, `thoiGianHoanTat = now` | **`Đã thanh toán`** | Như trên |

`thoiGianHoanTat` **chỉ** gán khi giao dịch đã `Thành công`. `maGiaoDich` mỗi giao dịch duy nhất (4.3).

### 4.3 `maGiaoDich`
- Chuỗi chữ-số, ngắn, không dấu/ký tự đặc biệt (dùng làm `vnp_TxnRef`): tiền tố hằng số `TIEN_TO_MA_GIAO_DICH = 'SP'` + `yyyyMMddHHmmss` (giờ Việt Nam) + 6 chữ số ngẫu nhiên. **Không chứa chữ `R`** (dành cho phương án dự phòng ở 5.4). Trùng (lỗi `11000`) → sinh lại, tối đa 3 lần.

### 4.4 Hoàn tác khi lỗi (không có transaction — **bắt buộc có**)
- Bọc bước 4–6 trong `try/catch`. Khi lỗi: xóa `ApDungVoucher`, `ChiTietDonHang`, `DonHang`, **mọi** `GiaoDichThanhToan` đã tạo **trong lần này**, **hoàn voucher** (`$inc +1` đúng các voucher đã trừ), **hoàn kho** (`$inc +soLuong` đúng các dòng đã trừ), rồi ném lỗi gốc. Hàm hoàn tác (`hoanTacTaoDon`) chạy **đúng một lần**, không che mất lỗi gốc.

### 4.5 Giới hạn đã biết (ghi vào báo cáo)
- Hai request "Đặt hàng" **cùng lúc** từ cùng giỏ có thể tạo hai bộ đơn (không có khóa giỏ trong mô hình dữ liệu) — giảm thiểu bằng khóa nút ở frontend; tồn kho vẫn đúng nhờ thao tác nguyên tử.

## 5. Quy tắc nghiệp vụ — tạo URL VNPay (`taoThanhToanVnpay`)

> **Không đoán định dạng VNPay.** Đối chiếu **tài liệu VNPay chính thức** (cổng sandbox, mục "Thanh toán PAY") và mã mẫu của họ cho tên tham số, cách sắp xếp, mã hóa, thuật toán ký. Dưới đây chỉ là các điểm bắt buộc theo `AGENTS.md` Mục 9 và `QĐ-20`.

### 5.1 Điều kiện
1. Chỉ **chủ giao dịch**: `DonHang.exists({ giaoDichId, taiKhoanId: req.taiKhoan._id })`; không có → **404**.
2. Giao dịch phải là **`VNPay`** (giao dịch `COD` → **409** "Đơn thanh toán khi nhận hàng không dùng cổng VNPay"), đang `Chờ thanh toán`, chưa quá `THOI_HAN_THANH_TOAN_GIO` (24) kể từ `thoiGianTao`; ngược lại **409**.
3. **Số tiền lấy từ `GiaoDichThanhToan.soTien` trong DB** (không từ client); `vnp_Amount = soTien × 100`. Kiểm tra lại `SO_TIEN_VNPAY_TOI_THIEU` (nếu đã có).
4. **Chỉ tạo URL cho giao dịch hiện có** — **không** tạo đơn mới, **không** trừ kho/voucher lần nữa (`QĐ-20`).

### 5.2 Tham số
- `vnp_TxnRef` — xem 5.4. Thời gian tạo theo múi giờ Việt Nam đúng định dạng VNPay.
- **Hạn thanh toán:** đặt `vnp_ExpireDate = thoiGianTao + 24 giờ` **(AI xác minh tham số này với tài liệu VNPay và báo kết quả)**; nhờ vậy VNPay từ chối thanh toán sau hạn, khớp với tác vụ tự hủy ở F18 (có thêm 10 phút gia hạn).
- IP: `X-Forwarded-For` (phần tử đầu) hoặc `req.socket.remoteAddress`; chuẩn hóa `::1` → `127.0.0.1`, bỏ tiền tố `::ffff:`.
- Ký **HMAC-SHA512** với `VNP_HASH_SECRET` bằng `crypto` có sẵn (**không thêm thư viện**); viết hàm dựng URL và hàm **xác thực chữ ký** trong `utils/vnpay.js` (F18 dùng).
- Biến môi trường (placeholder ở `.env.example`): `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`, `VNP_RETURN_URL`. Thiếu cấu hình → log rõ tên biến ở server, trả 500 chung cho client.
- `vnp_OrderInfo` không dấu, ngắn: "Thanh toan don hang <maGiaoDich>".

### 5.3 **Bắt buộc thử sandbox TRƯỚC KHI hoàn tất F17** (`QĐ-20`)
Thực hiện và **ghi kết quả vào báo cáo**:
1. Tạo URL cho một giao dịch, **đóng tab** trước khi thanh toán. Gọi lại `tao-thanh-toan` **cùng `giaoDichId`** để lấy URL mới với **cùng `vnp_TxnRef`**; mở URL mới trên sandbox.
2. Nếu VNPay **chấp nhận** → dùng cách này (5.4a).
3. Nếu VNPay **báo trùng mã/từ chối** → dùng **phương án dự phòng đã chấp thuận** (5.4b) và ghi rõ trong báo cáo.
4. Kiểm tra `vnp_ExpireDate` (có được chấp nhận không, URL hết hạn đúng thời điểm).
5. Kiểm tra giới hạn **số tiền tối thiểu/tối đa** theo tài liệu VNPay; điền `SO_TIEN_VNPAY_TOI_THIEU` (và tối đa nếu có) vào `cauHinh.constant.js` **hoặc** để `null` nếu không xác định được, rồi báo cho người dùng. **Không được tự đặt 1 VND.**

### 5.4 Cách đặt `vnp_TxnRef`
- **(a)** Dùng lại `maGiaoDich` (nếu 5.3 cho phép).
- **(b) Dự phòng:** `vnp_TxnRef = maGiaoDich + 'R' + 4 chữ số ngẫu nhiên` (mỗi lần tạo URL một giá trị mới). Hàm `tachMaGiaoDichTuTxnRef(txnRef)` lấy phần **trước chữ `R`** để tìm giao dịch ở F18. Phương án này **không** tạo giao dịch mới và **không** đổi database.

## 6. Backend — file cần tạo/sửa

`routes/donHang.route.js` (thêm `POST /`), `controllers/donHang.controller.js`, `services/donHang.service.js` (`datHang`, `hoanTacTaoDon`), `routes/giaoDichThanhToan.route.js`, `controllers/giaoDichThanhToan.controller.js`, `services/giaoDichThanhToan.service.js` (`taoThanhToanVnpay`, `taoMaGiaoDich`, `tachMaGiaoDichTuTxnRef`), `utils/vnpay.js`; hằng số `THOI_HAN_THANH_TOAN_GIO`, `TIEN_TO_MA_GIAO_DICH`, `SO_TIEN_VNPAY_TOI_THIEU` (mặc định `null`); `.env.example`. Gắn route vào `routes/index.js`.

## 7. Frontend

**File:** mở rộng `services/donHang.api.js` (`datHang`), `services/giaoDichThanhToan.api.js` (`taoThanhToanVnpay`); cập nhật `ThanhToanPage` + `TongKetThanhToan` (F16).

- Thêm nút chính **"Đặt hàng"** vào khối tổng kết (và thanh dính đáy trên mobile). **Khóa** khi: đang tải preview, `thieuDiaChi`, đang gửi, hoặc có `canhBao` chặn. Chữ phụ theo phương thức: VNPay → "Bạn sẽ được chuyển sang VNPay để thanh toán"; COD → "Bạn thanh toán khi nhận hàng"; đơn 0đ → "Đơn 0đ — không cần thanh toán".
- Khi bấm: (1) gọi `datHang({ diaChiNhanHang, danhSachMaVoucher, phuongThucThanhToan })`; (2) làm mới giỏ (`GioHangContext`); (3) nếu `canThanhToanVnpay` → gọi `taoThanhToanVnpay(giaoDichVnpayId)` rồi `window.location.assign(duongDanThanhToan)` với lớp phủ **"Đang chuyển tới VNPay…"** (khóa thao tác, `aria-live`); (4) ngược lại (COD / đơn 0đ) → toast ("Đặt hàng thành công. Bạn sẽ thanh toán khi nhận hàng." hoặc "Đặt hàng thành công. Đơn 0đ đã được xác nhận thanh toán.") và chuyển `/don-hang`.
- Lỗi:
  - **409 tồn kho/voucher** → toast đúng message, **gọi lại preview**.
  - **400 thiếu địa chỉ** → focus vào ô địa chỉ. **400 VNPay dưới mức tối thiểu** → hiển thị rõ và gợi ý chọn COD.
  - **Đã tạo đơn nhưng lấy URL VNPay lỗi** → khối thông báo "Đơn hàng đã được tạo nhưng chưa thể mở cổng thanh toán" với nút **"Thử lại"** (gọi lại `taoThanhToanVnpay` cùng `giaoDichVnpayId`) và liên kết "Xem đơn hàng". **Không** tạo đơn lần hai.
- Không lưu `giaoDichId` ở `localStorage`.

## 8. Không được làm

- Không tin giá/tổng/mức giảm/số tiền từ frontend; không nhận danh sách sản phẩm từ client.
- Không trừ kho bằng đọc-rồi-ghi (`find` rồi `save`) — phải dùng thao tác nguyên tử có điều kiện.
- Không gọi VNPay khi tổng bằng 0 hoặc khi chọn COD.
- Không đưa `VNP_HASH_SECRET` vào code/response/log; không đặt mức tối thiểu VNPay theo suy đoán.
- Không tạo `DonHang` trước khi trừ kho thành công; không thêm phương thức nào ngoài `VNPay`, `COD`.

## 9. Tiêu chí hoàn thành (kiểm thử kỹ — ghi lại từng ca)

- [ ] **VNPay, 2 cửa hàng:** DB có **1** `GiaoDichThanhToan` (`Chờ thanh toán`, `soTien` = tổng các đơn) và 2 `DonHang` cùng `giaoDichId`, `Chờ thanh toán` + `Chờ xác nhận`; `ChiTietDonHang` đúng snapshot; `soLuongTon` giảm đúng; voucher `soLuong` giảm đúng 1/voucher, `ApDungVoucher` đúng từng đơn; giỏ chỉ còn các dòng **không** được chọn.
- [ ] **COD, 2 cửa hàng:** DB có **2** giao dịch `COD` (mỗi đơn một), đơn `Chờ thanh toán` + `Chờ xác nhận`, **không** gọi VNPay (`canThanhToanVnpay = false`); kho và voucher trừ đúng như VNPay.
- [ ] **Đơn 0đ (VNPay):** voucher giảm hết → 1 giao dịch `soTien = 0`, `Thành công`, `thoiGianHoanTat` có giá trị; đơn `Đã thanh toán`; **không** có URL VNPay. **Đơn 0đ (COD)** tương tự theo từng đơn. Tổng nhỏ nhưng > 0 với VNPay → **không** bị chặn bởi hằng số tự đặt 1 VND (chỉ bị chặn nếu đã xác định `SO_TIEN_VNPAY_TOI_THIEU`).
- [ ] Đổi `giaGoc` sản phẩm sau khi đặt → đơn cũ **không đổi**.
- [ ] **Thiếu kho giữa chừng:** giỏ có 2 sản phẩm, sản phẩm thứ hai không đủ → 409, sản phẩm thứ nhất **được hoàn đúng số**, không có đơn/giao dịch nào được tạo.
- [ ] **Hai người mua món cuối cùng** (script song song) → đúng **một** thành công, `soLuongTon` không âm.
- [ ] Voucher hết lượt ngay trước khi đặt → 409, kho được hoàn, không còn bản ghi nào.
- [ ] **Hoàn tác:** cố tình làm lỗi bước tạo `ChiTietDonHang` (tạm ném lỗi trong test) → không còn `DonHang`/`GiaoDich`/`ApDungVoucher` mồ côi (**kể cả với COD nhiều giao dịch**); kho và voucher về đúng số; **chỉ hoàn một lần**.
- [ ] **Backend tự chặn (gọi API trực tiếp, không qua giao diện):** đặt hàng khi dòng giỏ thuộc **cửa hàng `Ngừng hoạt động`** hoặc **sản phẩm `Ngừng kinh doanh`** → 409, không trừ kho, không tạo đơn.
- [ ] Gửi kèm `tongThanhToan`/`giaBanThucTe`/`phuongThucThanhToan: "ABC"` tùy ý → số tiền bị bỏ qua; phương thức sai → 400. Thiếu địa chỉ → 400; không chọn dòng → 400; voucher không hợp lệ → 409.
- [ ] **VNPay sandbox (5.3):** URL mở được, **đúng số tiền**, không báo lỗi chữ ký; kết quả thử **dùng lại `vnp_TxnRef`** và **`vnp_ExpireDate`** được ghi vào báo cáo kèm phương án đã chọn (5.4a hay 5.4b); gọi `tao-thanh-toan` lần hai **không** tăng số đơn hay giảm kho; người khác gọi → 404; giao dịch `COD` → 409; giao dịch không còn `Chờ thanh toán` → 409.
- [ ] Giao diện: chọn phương thức đúng; nút khóa khi đang gửi; bấm đúp không tạo hai đơn; COD/0đ không chuyển sang VNPay; lỗi 409 làm mới preview.

## 10. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Liệt kê từng ca ở Mục 9; kết quả **thử sandbox** (5.3) và phương án `vnp_TxnRef` đã chọn; giá trị `SO_TIEN_VNPAY_TOI_THIEU` tìm được (hoặc ghi rõ "chưa xác định"); giới hạn "bấm đặt hai lần đồng thời".
