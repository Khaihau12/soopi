# FORM F05 — MODEL NHÓM 2 (9 collection còn lại)

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md`, `docs/Soopi_3_2_1_Thiet_ke_Collection.md`.
> **Phụ thuộc:** F04 (hằng số + 10 model đầu).
> **Có 3 thay đổi thiết kế đã được duyệt (CR-01, CR-02, CR-03 trong `02` Mục E)** — đánh dấu **[CR]** bên dưới. Đây là ngoại lệ hợp lệ duy nhất của nguyên tắc "không thêm field/enum".

## 1. Mục tiêu

Hoàn tất **19/19 model**: nhóm *Giỏ hàng – Đơn hàng – Thanh toán – Đánh giá – Đổi trả – Trao đổi*. Chỉ schema, chưa có route/service.

## 2. Đọc trước

- `docs/Soopi_3_2_1_Thiet_ke_Collection.md`: Bảng 3.35 → 3.43, Bảng 3.44, 3.45.
- `AGENTS.md`: Mục 5.4–5.7, 8 (Giỏ hàng, Đặt hàng, Tồn kho, Đánh giá/đổi trả).
- `02`: `QĐ-17`, `QĐ-22`.
- **Quy tắc bắt buộc cho model:** giống hệt F04 Mục 3 (collection tường minh, không `idXxx`, không thêm field, enum dùng hằng số, tiền là số nguyên ≥ 0, không `default: null` cho enum, chỉ index theo Bảng 3.45).

## 3. Đặc tả 9 model

### 3.1 `GioHang`
| Field | Kiểu | Ràng buộc |
|---|---|---|
| `tongGiaTri` | Number | số nguyên ≥ 0, mặc định `0` (backend tự tính lại, xem F15) |
| `taiKhoanId` | ObjectId ref `TaiKhoan` ✔ | **unique** |

### 3.2 `ChiTietGioHang`
| Field | Kiểu | Ràng buộc |
|---|---|---|
| `soLuong` | Number ✔ | số nguyên ≥ **1** |
| `duocChon` | Boolean | mặc định `true` (`QĐ-17`) |
| `gioHangId` | ObjectId ref `GioHang` ✔ | |
| `sanPhamId` | ObjectId ref `SanPham` ✔ | |

Index **unique kết hợp** `{ gioHangId: 1, sanPhamId: 1 }` (mỗi sản phẩm một dòng).

### 3.3 `DonHang`
| Field | Kiểu | Ràng buộc |
|---|---|---|
| `diaChiNhanHang` | String ✔ | địa chỉ lưu tại thời điểm đặt |
| `tongTienHang` | Number ✔ | số nguyên ≥ 0 |
| `tongGiamVoucher` | Number | số nguyên ≥ 0, mặc định `0` |
| `phiVanChuyen` | Number | số nguyên ≥ 0, mặc định `0` |
| `giamPhiVanChuyen` | Number | số nguyên ≥ 0, mặc định `0` |
| `tongThanhToan` | Number ✔ | số nguyên ≥ 0 |
| `phuongThucThanhToan` | String | enum `PHUONG_THUC_THANH_TOAN` (`VNPay`, **`COD`** — **[CR-01]**), mặc định `VNPay` |
| `trangThaiThanhToan` | String | enum `TRANG_THAI_THANH_TOAN_DON`, mặc định `Chờ thanh toán` |
| `trangThaiXuLy` | String | enum `TRANG_THAI_XU_LY`, mặc định `Chờ xác nhận` |
| `ngayTao` | Date | mặc định `Date.now` |
| `ngayHoanThanh` | Date | **[CR-03]** không bắt buộc, **không** có default; chỉ được gán khi đơn chuyển sang `Hoàn thành` (F20) |
| `taiKhoanId` | ObjectId ref `TaiKhoan` ✔ | |
| `cuaHangId` | ObjectId ref `CuaHang` ✔ | |
| `giaoDichId` | ObjectId ref `GiaoDichThanhToan` ✔ | (tên riêng theo tài liệu) |

Index: `{ taiKhoanId: 1, ngayTao: -1 }`, `{ cuaHangId: 1, ngayTao: -1 }`, `{ giaoDichId: 1 }`.

### 3.4 `ChiTietDonHang`
`soLuong` (✔, số nguyên ≥ 1), `giaGocTaiThoiDiemDat` (✔ ≥ 0), `giaBanThucTe` (✔ ≥ 0), `thanhTien` (✔ ≥ 0), `donHangId` (ref `DonHang` ✔), `sanPhamId` (ref `SanPham` ✔). Index `{ donHangId: 1 }` và `{ sanPhamId: 1 }`.

### 3.5 `GiaoDichThanhToan`
| Field | Kiểu | Ràng buộc |
|---|---|---|
| `maGiaoDich` | String ✔ | **unique** |
| `soTien` | Number ✔ | số nguyên ≥ 0 |
| `phuongThucThanhToan` | String | enum (`VNPay`, **`COD`** — **[CR-01]**), mặc định `VNPay` |
| `trangThaiThanhToan` | String | enum `TRANG_THAI_GIAO_DICH`, mặc định `Chờ thanh toán` |
| `thoiGianTao` | Date | mặc định `Date.now` |
| `thoiGianHoanTat` | Date | **không** có default (trống khi chưa hoàn tất) |

### 3.6 `DanhGia`
`soSao` (✔, số nguyên 1–5), `noiDung` (✔, `trim`), `ngayDanhGia` (Date, mặc định `Date.now`), `taiKhoanId` (✔), `sanPhamId` (✔), `chiTietDonHangId` (ref `ChiTietDonHang` ✔, **unique**). Index `{ sanPhamId: 1 }`.

### 3.7 `YeuCauDoiTraKhieuNai`
`loaiYeuCau` (enum `LOAI_YEU_CAU` ✔), `noiDung` (✔), `trangThaiXuLy` (enum `TRANG_THAI_XU_LY_YEU_CAU`, mặc định `Chờ xử lý`), `ketQuaXuLy` (enum `KET_QUA_XU_LY`, **không default** — trống khi chưa xử lý), `ngayTao` (Date, mặc định `Date.now`), `chiTietDonHangId` (ref `ChiTietDonHang` ✔, **unique**).

### 3.8 `CuocTroChuyen`
`thoiGianBatDau` (Date, mặc định `Date.now`), `thoiGianCapNhat` (Date, mặc định `Date.now`), `taiKhoanId` (ref `TaiKhoan` ✔), `cuaHangId` (ref `CuaHang` ✔). Index **unique** `{ taiKhoanId: 1, cuaHangId: 1 }` — **[CR-02]** (mỗi cặp Người dùng – cửa hàng chỉ một cuộc trò chuyện; bản gốc của tài liệu là Index thường, đã được duyệt nâng lên Unique).

### 3.9 `TinNhan`
`noiDung` (✔, `trim`), `thoiGianGui` (Date, mặc định `Date.now`), `cuocTroChuyenId` (ref `CuocTroChuyen` ✔), `nguoiGuiId` (ref `TaiKhoan` ✔ — tên riêng theo tài liệu). Index `{ cuocTroChuyenId: 1, thoiGianGui: 1 }`.

## 4. Không được làm

- Không thêm `daDoc`, `trangThai` cho `TinNhan`; không thêm `maVNPay`/`vnpTransactionNo` cho giao dịch; không thêm `lyDoTuChoi` cho yêu cầu đổi trả; không thêm field nào ngoài `ngayHoanThanh` (CR-03) cho `DonHang`; không thêm giá trị enum nào ngoài `COD` (CR-01). (Không có trong tài liệu; nếu thật sự cần, **hỏi** thay vì tự thêm.)
- Không bật `timestamps`.
- Không viết nghiệp vụ trong model.

## 5. Tiêu chí hoàn thành

- [ ] Script tạm in `Model.collection.name` cho cả **19 model** đúng tên PascalCase (không `s` cuối), rồi xóa script.
- [ ] `schema.indexes()` có đủ: unique `GioHang.taiKhoanId`, unique kết hợp `ChiTietGioHang(gioHangId, sanPhamId)`, unique `GiaoDichThanhToan.maGiaoDich`, unique `DanhGia.chiTietDonHangId`, unique `YeuCauDoiTraKhieuNai.chiTietDonHangId`, các index của `DonHang`, `ChiTietDonHang`, `DanhGia.sanPhamId`, **unique** `CuocTroChuyen(taiKhoanId, cuaHangId)` (CR-02), `TinNhan`.
- [ ] Thử chèn trùng ở các ràng buộc unique → lỗi `11000` (error middleware F01 đổi thành 409).
- [ ] Thử `soSao = 6`, `soLuong = 0`, `soTien` âm, enum sai → bị từ chối.
- [ ] `DonHang` có `ngayHoanThanh` (không default); `phuongThucThanhToan` nhận `COD`; chèn hai `CuocTroChuyen` cùng cặp → lỗi `11000`.
- [ ] Đối chiếu **toàn bộ 19 model** với Bảng 3.25–3.43 (**kể cả 3 thay đổi CR ở `02` Mục E**): không thiếu/thừa field, đúng kiểu, đúng tham chiếu (Bảng 3.44: 26 quan hệ).

## 6. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Kèm bảng đối chiếu ngắn "collection — số field — đã khớp tài liệu (✔)".
