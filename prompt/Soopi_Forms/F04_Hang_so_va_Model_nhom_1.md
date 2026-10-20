# FORM F04 — HẰNG SỐ TRẠNG THÁI + MODEL NHÓM 1 (10 collection)

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md`, `docs/Soopi_3_2_1_Thiet_ke_Collection.md`.
> **Phụ thuộc:** F01.

## 1. Mục tiêu

Tạo file hằng số enum và **10 Mongoose model** của nhóm *Tài khoản – Cửa hàng – Danh mục – Sản phẩm – Khuyến mãi – Voucher – Banner*. Chỉ là **schema** (dữ liệu + ràng buộc); chưa có route/service.

## 2. Đọc trước

- `docs/Soopi_3_2_1_Thiet_ke_Collection.md`: Bảng 3.25 → 3.34 và Bảng 3.44, 3.45. **Đây là nguồn sự thật tuyệt đối cho tên và kiểu field.**
- `AGENTS.md`: Mục 5.4, 5.5, 5.6, 5.7, 8.
- `02`: `QĐ-12`, `QĐ-13`, `QĐ-22`.

## 3. Quy tắc bắt buộc cho mọi model

1. Tên collection **tường minh**: `{ collection: 'SanPham' }` (Mongoose không được tự đổi thành `sanphams`).
2. **Không** khai báo field `idXxx` (khóa chính là `_id`). Trường tham chiếu: `ObjectId` có `ref`, đặt tên đúng tài liệu (`cuaHangId`, `danhMucId`...).
3. **Không thêm field** ngoài tài liệu (**ngoại lệ duy nhất đã duyệt:** các mục CR trong `02` Mục E), **không** bật `timestamps` (tài liệu đã có field ngày riêng; những collection không có field ngày thì cũng không cần).
4. Enum dùng **hằng số** từ `trangThai.constant.js` / `vaiTro.constant.js`, không gõ chuỗi trực tiếp trong schema.
5. Tiền (`giaGoc`, `giaKhuyenMai`, `giaTriGiam`, `giamToiDa`, `giaTriDonToiThieu`...) là **số nguyên không âm**: `min: 0` + validator số nguyên (đặt validator dùng chung ở `utils/kiemTra.js` để không lặp).
6. Field enum **không dùng `default: null`** (enum của Mongoose sẽ từ chối `null`). Cho trống = không có field.
7. Mỗi file model: `schema` → index → `module.exports = mongoose.model('Tên', schema)`. Tên file `taiKhoan.model.js`... đặt ở `backend/src/models/`.
8. Chỉ tạo index đúng Bảng 3.45 (không tự thêm index khác).

## 4. File hằng số `constants/trangThai.constant.js`

Khai báo (UPPER_SNAKE_CASE Việt không dấu; **giá trị là chuỗi có dấu đúng từng ký tự** AGENTS 5.7 / tài liệu Collection):

| Hằng | Khóa → Giá trị |
|---|---|
| `GIOI_TINH` | `NAM`→`Nam`, `NU`→`Nữ`, `KHAC`→`Khác` |
| `TRANG_THAI_TAI_KHOAN` | `HOAT_DONG`→`Hoạt động`, `BI_KHOA`→`Bị khóa` |
| `TRANG_THAI_YEU_CAU_NGUOI_BAN` | `CHO_PHE_DUYET`→`Chờ phê duyệt`, `DA_PHE_DUYET`→`Đã phê duyệt`, `DA_TU_CHOI`→`Đã từ chối` |
| `TRANG_THAI_HOAT_DONG_CUA_HANG` | `HOAT_DONG`→`Hoạt động`, `NGUNG_HOAT_DONG`→`Ngừng hoạt động` |
| `TRANG_THAI_KINH_DOANH` | `DANG_KINH_DOANH`→`Đang kinh doanh`, `NGUNG_KINH_DOANH`→`Ngừng kinh doanh` |
| `LOAI_KHUYEN_MAI` | `GIAM_GIA`→`Giảm giá`, `FLASH_SALE`→`Flash Sale` |
| `PHAM_VI_KHUYEN_MAI` | `CUA_HANG`→`Cửa hàng`, `TOAN_SAN`→`Toàn sàn` |
| `TRANG_THAI_KHUYEN_MAI` | `CHUA_BAT_DAU`→`Chưa bắt đầu`, `DANG_HOAT_DONG`→`Đang hoạt động`, `DA_KET_THUC`→`Đã kết thúc` |
| `LOAI_VOUCHER` | `FREESHIP`→`Freeship`, `TOAN_SAN`→`Toàn sàn`, `CUA_HANG`→`Cửa hàng` |
| `KIEU_GIAM` | `PHAN_TRAM`→`Phần trăm`, `SO_TIEN_CO_DINH`→`Số tiền cố định` |
| `TRANG_THAI_VOUCHER` | `KICH_HOAT`→`Kích hoạt`, `VO_HIEU_HOA`→`Vô hiệu hóa` |
| `TRANG_THAI_BANNER` | `KICH_HOAT`→`Kích hoạt`, `VO_HIEU_HOA`→`Vô hiệu hóa` |
| `PHUONG_THUC_THANH_TOAN` | `VNPAY`→`VNPay`, `COD`→`COD` *(giá trị `COD` thuộc **CR-01** đã duyệt ở `02` Mục E; tài liệu Collection gốc chỉ có `VNPay`)* |
| `TRANG_THAI_THANH_TOAN_DON` | `CHO_THANH_TOAN`→`Chờ thanh toán`, `DA_THANH_TOAN`→`Đã thanh toán`, `THAT_BAI`→`Thất bại`, `HET_HAN`→`Hết hạn` |
| `TRANG_THAI_XU_LY` | `CHO_XAC_NHAN`→`Chờ xác nhận`, `DA_XAC_NHAN`→`Đã xác nhận`, `DANG_XU_LY`→`Đang xử lý`, `DANG_VAN_CHUYEN`→`Đang vận chuyển`, `HOAN_THANH`→`Hoàn thành`, `DA_HUY`→`Đã hủy` |
| `TRANG_THAI_GIAO_DICH` | `CHO_THANH_TOAN`→`Chờ thanh toán`, `THANH_CONG`→`Thành công`, `THAT_BAI`→`Thất bại`, `HET_HAN`→`Hết hạn` |
| `LOAI_YEU_CAU` | `DOI_TRA`→`Đổi trả`, `KHIEU_NAI`→`Khiếu nại` |
| `TRANG_THAI_XU_LY_YEU_CAU` | `CHO_XU_LY`→`Chờ xử lý`, `DA_XU_LY`→`Đã xử lý` |
| `KET_QUA_XU_LY` | `CHAP_NHAN`→`Chấp nhận`, `TU_CHOI`→`Từ chối` |

> **Lưu ý đã có trong AGENTS:** giao dịch dùng `Thành công` còn đơn hàng dùng `Đã thanh toán` — đừng gộp.
> Với các enum tài liệu ghi dấu "..." (`trangThaiHoatDong`, `trangThaiKinhDoanh`, `loaiKhuyenMai`, `trangThai` voucher, `trangThaiXuLy` yêu cầu đổi trả) **chỉ dùng các giá trị đã nêu rõ ở bảng trên**, không tự thêm.

Có thể xuất cùng file này danh sách giá trị (ví dụ `Object.values(...)`) để dùng cho `enum` của schema.

## 5. Đặc tả 10 model

> Cột "Bắt buộc" áp dụng ở schema Mongoose (`required`). "Mặc định" theo ghi chú.

### 5.1 `TaiKhoan` (`taiKhoan.model.js`)
| Field | Kiểu | Bắt buộc | Mặc định / Ràng buộc |
|---|---|---|---|
| `email` | String | ✔ | **unique**, `trim`, `lowercase` |
| `matKhau` | String | ✔ | `select: false` (không bao giờ trả ra) |
| `hoTen` | String | ✔ | `trim` |
| `ngaySinh` | Date | | |
| `gioiTinh` | String | | enum `GIOI_TINH` |
| `soDienThoai` | String | | |
| `diaChiNhanHang` | String | | |
| `vaiTro` | [String] | ✔ | enum `VAI_TRO`; mặc định `['Người dùng']`; không được rỗng |
| `trangThaiTaiKhoan` | String | ✔ | enum; mặc định `Hoạt động` |

### 5.2 `YeuCauDangKyNguoiBan`
`tenCuaHang` (String ✔), `moTaCuaHang` (String), `diaChiCuaHang` (String), `ngayGui` (Date, mặc định `Date.now`), `trangThai` (enum, mặc định `Chờ phê duyệt`), `taiKhoanId` (ObjectId ref `TaiKhoan` ✔).

### 5.3 `CuaHang`
`tenCuaHang` (String ✔), `moTa`, `diaChi`, `trangThaiHoatDong` (enum, mặc định `Hoạt động`), `taiKhoanId` (ObjectId ref `TaiKhoan` ✔, **unique**).

### 5.4 `DanhMuc`
`tenDanhMuc` (String ✔, `trim`).

### 5.5 `SanPham`
| Field | Kiểu | Ràng buộc |
|---|---|---|
| `tenSanPham` | String ✔ | `trim`; **Text index** (xem dưới) |
| `hinhAnh` | [String] | đường dẫn ảnh, mặc định `[]` |
| `moTa` | String | |
| `giaGoc` | Number ✔ | số nguyên ≥ 0 |
| `soLuongTon` | Number ✔ | số nguyên ≥ 0, mặc định `0` |
| `trangThaiKinhDoanh` | String | enum, mặc định `Đang kinh doanh` |
| `cuaHangId` | ObjectId ref `CuaHang` ✔ | **Index** |
| `danhMucId` | ObjectId ref `DanhMuc` ✔ | **Index** |

Text index: `sanPhamSchema.index({ tenSanPham: 'text' }, { default_language: 'none' })` (tắt stemming tiếng Anh, tránh lỗi với tiếng Việt).

### 5.6 `KhuyenMai`
`tenKhuyenMai` (✔), `loaiKhuyenMai` (enum ✔), `phamVi` (enum ✔), `ngayBatDau` (Date ✔), `ngayKetThuc` (Date ✔), `trangThai` (enum, mặc định `Chưa bắt đầu`), `cuaHangId` (ObjectId ref `CuaHang`, mặc định `null` — rỗng khi `Toàn sàn`). Có thể thêm validator `ngayKetThuc > ngayBatDau`.

### 5.7 `ChiTietKhuyenMai`
`tyLeGiam` (Number, 0–100), `giaKhuyenMai` (Number, số nguyên ≥ 0), `khuyenMaiId` (ref `KhuyenMai` ✔), `sanPhamId` (ref `SanPham` ✔). Index `{ khuyenMaiId: 1, sanPhamId: 1 }` (**không** unique — đúng Bảng 3.45).
> Quy tắc "chỉ một trong `tyLeGiam`/`giaKhuyenMai`" và "giá KM ≤ giaGoc" kiểm tra ở **service** (F13), không đưa vào schema.

### 5.8 `Voucher`
| Field | Kiểu | Ràng buộc |
|---|---|---|
| `maVoucher` | String ✔ | **unique**, `trim`, `uppercase` |
| `tenVoucher` | String ✔ | |
| `loaiVoucher` | String ✔ | enum `LOAI_VOUCHER` |
| `kieuGiam` | String ✔ | enum `KIEU_GIAM` |
| `giaTriGiam` | Number ✔ | ≥ 0 (phần trăm 0–100 kiểm ở service) |
| `giamToiDa` | Number | số nguyên ≥ 0; **không có default** — để trống = không giới hạn (theo `QĐ-13`) |
| `giaTriDonToiThieu` | Number | số nguyên ≥ 0, mặc định `0` |
| `soLuong` | Number ✔ | số nguyên ≥ 0 |
| `ngayBatDau`, `ngayKetThuc` | Date ✔ | |
| `trangThai` | String | enum, mặc định `Kích hoạt` |
| `cuaHangId` | ObjectId ref `CuaHang` | mặc định `null` (voucher Toàn sàn/Freeship) |

### 5.9 `ApDungVoucher`
`giaTriGiamThucTe` (Number ✔, số nguyên ≥ 0), `thoiGianApDung` (Date, mặc định `Date.now`), `voucherId` (ref `Voucher` ✔), `donHangId` (ref `DonHang` ✔). Index `{ donHangId: 1 }`.
> Ref tới `DonHang` khi model đó chưa tồn tại (tạo ở F05) vẫn hợp lệ — chỉ là chuỗi `ref`.

### 5.10 `BannerQuangCao`
`tieuDe` (✔), `hinhAnh` (String ✔ — đường dẫn ảnh), `noiDung` (String), `trangThai` (enum, mặc định `Kích hoạt`).

## 6. Không được làm

- Không thêm field `ngayTao`, `trangThai` cho `DanhMuc`, `lyDoTuChoi`, `anhDaiDien`... (không có trong tài liệu).
- Không viết logic nghiệp vụ trong model (không hook băm mật khẩu; băm ở service F06).
- Không tạo route/controller/service ở form này.
- Không dùng `default: null` cho field enum.

## 7. Tiêu chí hoàn thành

- [ ] Chạy một **script tạm** (xóa sau khi kiểm tra) `require` cả 10 model và in `Model.collection.name`: phải đúng `TaiKhoan`, `YeuCauDangKyNguoiBan`, `CuaHang`, `DanhMuc`, `SanPham`, `KhuyenMai`, `ChiTietKhuyenMai`, `Voucher`, `ApDungVoucher`, `BannerQuangCao` (viết hoa đúng, không có chữ `s` cuối).
- [ ] In `schema.indexes()`: có unique `email`, unique `cuaHang.taiKhoanId`, unique `maVoucher`, text `tenSanPham`, index `cuaHangId`/`danhMucId` của `SanPham`, index kép của `ChiTietKhuyenMai`, index `donHangId` của `ApDungVoucher`.
- [ ] Thử tạo bản ghi sai (thiếu field bắt buộc, enum sai, `giaGoc` âm/thập phân, email trùng) → bị từ chối.
- [ ] `matKhau` không xuất hiện khi `find()` mặc định.
- [ ] Chuỗi enum khớp từng ký tự với AGENTS 5.7. Không còn chuỗi enum gõ trực tiếp trong schema.

## 8. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9.
