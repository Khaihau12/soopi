# FORM F14 — VOUCHER (Người bán, Quản trị viên, hiển thị công khai, hàm tính giảm)

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F09, F11, F13 (mẫu làm việc giống nhau).

## 1. Mục tiêu

- **Người bán** tạo/sửa/bật-tắt/xóa **voucher cửa hàng**.
- **Quản trị viên** chỉ tạo/quản lý voucher **Toàn sàn** và **Freeship**, theo dõi mức độ sử dụng của hai loại này. Voucher cửa hàng do Người bán quản lý.
- **Người dùng** xem voucher đang áp dụng (ở trang chi tiết sản phẩm) và sao chép mã.
- Dựng **hàm kiểm tra điều kiện + tính mức giảm của một voucher** để F16/F17 (đặt hàng) dùng lại. **Chưa** áp voucher vào đơn ở form này.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.14** (voucher cửa hàng), **Bảng 3.23** (voucher hệ thống), **Bảng 3.6** (kết hợp Freeship/Toàn sàn/Cửa hàng), **Bảng 3.4**. Collection **Bảng 3.32, 3.33**.
- `AGENTS.md` Mục 8 (Voucher). `02`: **`QĐ-04`**, **`QĐ-13`**, **`QĐ-14`**, `QĐ-22`.

## 3. API

| Method + URL | Quyền | Body / Query | Kết quả |
|---|---|---|---|
| `GET /api/voucher` | công khai | `cuaHangId?` | `data.danhSach` voucher đang dùng được |
| `GET /api/nguoi-ban/voucher` | Người bán | `trangThai?`, `tuKhoa?`, `trang`, `gioiHan` | `data = { danhSach, phanTrang }` |
| `GET /api/nguoi-ban/voucher/:id` | Người bán | — | `data.voucher` |
| `POST /api/nguoi-ban/voucher` | Người bán | `maVoucher`, `tenVoucher`, `kieuGiam`, `giaTriGiam`, `giamToiDa?`, `giaTriDonToiThieu?`, `soLuong`, `ngayBatDau`, `ngayKetThuc` | **201** |
| `PATCH /api/nguoi-ban/voucher/:id` | Người bán | `tenVoucher`, `kieuGiam`, `giaTriGiam`, `giamToiDa`, `giaTriDonToiThieu`, `soLuong`, `ngayBatDau`, `ngayKetThuc` | 200 |
| `PATCH /api/nguoi-ban/voucher/:id/trang-thai` | Người bán | `trangThai` (`Kích hoạt`/`Vô hiệu hóa`) | 200 |
| `DELETE /api/nguoi-ban/voucher/:id` | Người bán | — | 200 |
| `GET /api/quan-tri-vien/voucher` | Quản trị viên | `loaiVoucher?` (`Toàn sàn`/`Freeship`), `trangThai?`, `tuKhoa?`, `trang`, `gioiHan` | chỉ voucher hệ thống; lọc `Cửa hàng` → 400 |
| `GET /api/quan-tri-vien/voucher/:id` | Quản trị viên | — | chi tiết voucher hệ thống; voucher cửa hàng → 404 |
| `POST /api/quan-tri-vien/voucher` | Quản trị viên | như Người bán **+ `loaiVoucher`** (`Toàn sàn` hoặc `Freeship`) | **201** |
| `PATCH`, `DELETE /api/quan-tri-vien/voucher/:id` | Quản trị viên | — | chỉ voucher `Toàn sàn`/`Freeship` |
| `PATCH /api/quan-tri-vien/voucher/:id/trang-thai` | Quản trị viên | `trangThai` | chỉ voucher hệ thống; voucher cửa hàng → 404 |

**Phần tử voucher trả về (Người bán/Quản trị viên):** `_id, maVoucher, tenVoucher, loaiVoucher, kieuGiam, giaTriGiam, giamToiDa, giaTriDonToiThieu, soLuong, ngayBatDau, ngayKetThuc, trangThai, cuaHang: { _id, tenCuaHang } | null, soDonDaApDung`.
**Công khai:** chỉ `maVoucher, tenVoucher, loaiVoucher, kieuGiam, giaTriGiam, giamToiDa, giaTriDonToiThieu, ngayKetThuc`.

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Kiểm tra dữ liệu (làm hết trước khi ghi; lỗi → 400, **không lưu/kích hoạt** — đúng Bảng 3.23)
1. `maVoucher`: bắt buộc khi tạo, chuẩn hóa `trim + UPPERCASE`, chỉ chữ/số, 4–20 ký tự *(giả định kỹ thuật nhỏ; nêu trong báo cáo)*; **trùng → 409** "Mã voucher đã tồn tại". **Không cho sửa** `maVoucher`, `loaiVoucher`, `cuaHangId` sau khi tạo.
2. `tenVoucher` bắt buộc, ≤ 200 ký tự.
3. `kieuGiam` ∈ {`Phần trăm`, `Số tiền cố định`}. `giaTriGiam` số nguyên ≥ 1; nếu `Phần trăm` thì ≤ 100.
4. `giamToiDa`: **tùy chọn**, nếu có là số nguyên ≥ 1; **để trống = không giới hạn** (`QĐ-13`).
5. `giaTriDonToiThieu`: số nguyên ≥ 0 (mặc định 0). `soLuong`: số nguyên ≥ 1 khi tạo, ≥ 0 khi sửa.
6. `ngayBatDau`, `ngayKetThuc` hợp lệ, `ngayKetThuc > ngayBatDau`, và khi tạo `ngayKetThuc > hiện tại`.
7. `trangThai` khi tạo mặc định `Kích hoạt`.
8. **Người bán:** `loaiVoucher = 'Cửa hàng'`, `cuaHangId = req.cuaHang._id` — bỏ qua mọi giá trị trong body. **Quản trị viên:** `loaiVoucher` bắt buộc ∈ {`Toàn sàn`, `Freeship`}, `cuaHangId` rỗng; gửi `Cửa hàng` → 400.

### 4.2 Sở hữu, sửa, xóa
- Người bán chỉ thấy/sửa/xóa voucher có `cuaHangId` của mình (khác → 404).
- Quản trị viên chỉ xem/sửa/bật-tắt/xóa voucher `Toàn sàn`/`Freeship` không thuộc cửa hàng; mọi thao tác theo ID với voucher `Cửa hàng` → 404.
- **Xóa (`QĐ-14`):** voucher **đã có** `ApDungVoucher` → **không xóa cứng**, chuyển `Vô hiệu hóa` (message nói rõ); chưa có → xóa cứng.
- Vô hiệu hóa → ngừng cho áp dụng ngay (F16/F17 kiểm tra `trangThai`).
- `soLuong` là số lượng **còn lại**; checkout sẽ trừ dần (F17). Khi sửa `soLuong`, ghi trực tiếp giá trị mới (chấp nhận khả năng đua rất nhỏ với đơn hàng đang tạo; nêu trong báo cáo).

### 4.3 Công khai `GET /api/voucher`
- Chỉ voucher **đang dùng được**: `trangThai = Kích hoạt`, `ngayBatDau ≤ nay ≤ ngayKetThuc`, `soLuong ≥ 1`.
- Luôn trả voucher `Toàn sàn` và `Freeship`. Voucher `Cửa hàng` **chỉ trả khi có `cuaHangId`** (của cửa hàng đó, và cửa hàng đó `Hoạt động`) — không liệt kê voucher của mọi cửa hàng.
- Sắp xếp: `ngayKetThuc` tăng dần.

### 4.4 Hàm dùng lại cho đặt hàng — `services/voucher.service.js`
Xuất (tên gợi ý) hai hàm **thuần, dễ kiểm thử**, F16/F17 sẽ gọi:

1. `kiemTraDieuKienVoucher(voucher, { cuaHangId, tongTienHangCuaHang, tongTienHangToanBo, thoiDiem })` → `{ hopLe: true }` hoặc `{ hopLe: false, lyDo: '...' }`. Kiểm tra theo `QĐ-13`/`QĐ-04`: `trangThai = Kích hoạt`; trong thời gian hiệu lực; `soLuong ≥ 1`; **phạm vi**: `Cửa hàng` chỉ hợp lệ khi `voucher.cuaHangId` **bằng** `cuaHangId` của đơn; `giaTriDonToiThieu` so với `tongTienHangCuaHang` (voucher `Cửa hàng`) hoặc `tongTienHangToanBo` (`Toàn sàn`/`Freeship`). `lyDo` là câu tiếng Việt hiển thị cho người dùng (ví dụ "Voucher đã hết lượt sử dụng", "Đơn chưa đạt giá trị tối thiểu 200.000đ").
2. `tinhMucGiamVoucher(voucher, giaTriCoSo)` → số nguyên: `Phần trăm` → `Math.round(giaTriCoSo × giaTriGiam / 100)`; `Số tiền cố định` → `giaTriGiam`; sau đó **kẹp**: không vượt `giamToiDa` (nếu có), không vượt `giaTriCoSo`, không âm.

Hai hàm **không truy cập DB**, không trừ `soLuong`; việc trừ/hoàn `soLuong` và ghi `ApDungVoucher` là của F17/F18.

## 5. Backend — file cần tạo

`routes/voucher.route.js`, `routes/nguoiBanVoucher.route.js`, `routes/quanTriVienVoucher.route.js`, `controllers/voucher.controller.js`, `services/voucher.service.js` (`layDanhSachVoucherDangDung`, `nguoiBan...`, `quanTri...`, `kiemTraDieuKienVoucher`, `tinhMucGiamVoucher`). `soDonDaApDung` tính bằng **một** truy vấn nhóm `ApDungVoucher` theo `voucherId` cho cả trang kết quả (không N+1). Thêm regex mã voucher vào `cauHinh.constant.js`.

## 6. Frontend

**File:** `services/voucher.api.js`; `utils/voucher.js` (`moTaVoucher(voucher)`, `tinhTinhTrangVoucher(voucher)`); components `VoucherForm`, `VoucherChip`; pages `nguoiBan/VoucherNguoiBanPage` (`/nguoi-ban/voucher`), `quanTriVien/VoucherQuanTriPage` (`/quan-tri-vien/voucher`); cập nhật `ChiTietSanPhamPage`.

- `moTaVoucher`: sinh câu mô tả từ dữ liệu, ví dụ "Giảm 10% (tối đa 50.000đ) cho đơn từ 200.000đ"; Freeship: "Giảm phí vận chuyển …". Dùng `dinhDangTien`.
- `tinhTinhTrangVoucher`: chỉ để **hiển thị** (`Đang hiệu lực` / `Chưa bắt đầu` / `Đã hết hạn` / `Hết số lượng` / `Vô hiệu hóa`), tính từ các field có sẵn, không lưu.

### 6.1 Trang quản lý (Người bán và Quản trị viên dùng cùng khung)
- `PageHeader` + nút chính **"Tạo voucher"**; bộ lọc trạng thái (Quản trị viên thêm loại voucher) + ô tìm mã/tên, lưu trên URL.
- `DataTable`: *Mã* (nhãn chữ đậm dạng monospace + nút "Sao chép"), *Tên*, *Ưu đãi* (`moTaVoucher`), *Hiệu lực*, *Còn lại*, *Đã áp dụng (đơn)*, *Trạng thái* (`Badge` + nhãn từ `tinhTinhTrangVoucher`), *Thao tác*: "Sửa", công tắc **Bật/Tắt**, "Xóa" (`ConfirmDialog`; thông báo nêu rõ nếu voucher đã dùng sẽ chỉ bị vô hiệu hóa).
- Quản trị viên: cột *Loại* chỉ hiển thị `Toàn sàn` hoặc `Freeship`; bộ lọc không có `Cửa hàng`.
- **`VoucherForm`** trong `Modal` rộng (lưới 2 cột từ 768px, 1 cột trên mobile): Mã (khóa khi sửa), Tên, [Loại — chỉ Quản trị viên: `Select` Toàn sàn/Freeship], Kiểu giảm, Giá trị giảm (hậu tố `%` hoặc `đ` tùy kiểu), Giảm tối đa (gợi ý "Để trống nếu không giới hạn"), Đơn tối thiểu, Số lượng, Bắt đầu, Kết thúc. Dưới form luôn hiện **câu xem trước** từ `moTaVoucher`. Nút chính **"Lưu voucher"**.
- Đủ trạng thái tải/rỗng/lỗi.

### 6.2 Trang chi tiết sản phẩm — mục "Voucher"
- Gọi `GET /api/voucher?cuaHangId=<cửa hàng của sản phẩm>`; nhóm hiển thị bằng `VoucherChip` (mã, mô tả ngắn, hạn dùng, nút "Sao chép mã" + phản hồi "Đã sao chép").
- Không có voucher → **ẩn cả mục** (không hiện khung trống).
- Đặt dưới khối giá, gọn, cuộn ngang trên mobile.

## 7. Không được làm

- Không tin mức giảm hay mã do frontend gửi; không áp/trừ voucher ở form này.
- Không thêm `loaiVoucher`/`kieuGiam` mới; không thêm giới hạn "mỗi người dùng một lần" (tài liệu không quy định).
- Không cho sửa `maVoucher`; không để voucher Người bán mang loại `Toàn sàn`/`Freeship`.
- Không liệt kê voucher `Cửa hàng` của mọi cửa hàng ở API công khai.

## 8. Tiêu chí hoàn thành

- [ ] Người bán tạo voucher → `loaiVoucher = Cửa hàng`, `cuaHangId` là cửa hàng mình, kể cả khi body cố gán loại/cửa hàng khác. Quản trị viên tạo `Cửa hàng` → 400.
- [ ] `maVoucher` trùng → 409; `abc` (3 ký tự) hoặc có khoảng trắng → 400; `Phần trăm` với `giaTriGiam = 150` → 400; `giaTriGiam = 0`, `soLuong = 0` khi tạo, `ngayKetThuc ≤ ngayBatDau` → 400. Nhập `ab12cd` được lưu thành `AB12CD`.
- [ ] Người bán A sửa/xóa/bật-tắt voucher của B → 404. Quản trị viên không thấy voucher `Cửa hàng` trong danh sách; xem/sửa/bật-tắt/xóa theo ID → 404; Người bán vẫn quản lý voucher của mình.
- [ ] Xóa voucher đã có `ApDungVoucher` (chèn tạm một bản ghi) → chuyển `Vô hiệu hóa`; chưa có → xóa hẳn.
- [ ] `GET /api/voucher` không trả voucher `Vô hiệu hóa`, hết hạn, chưa bắt đầu, `soLuong = 0`; không có `cuaHangId` → không có voucher `Cửa hàng`; có `cuaHangId` → có voucher của cửa hàng đó và **không** có của cửa hàng khác.
- [ ] Kiểm thử hai hàm thuần bằng **script tạm** (xóa sau): `Phần trăm` 10% của 1.000.000 với `giamToiDa 50.000` → 50.000; `Số tiền cố định` 100.000 với đơn 80.000 → 80.000 (không vượt cơ sở); không có `giamToiDa` → không bị kẹp; voucher `Cửa hàng` dùng cho cửa hàng khác → `hopLe: false`; đơn dưới `giaTriDonToiThieu` → `hopLe: false` kèm `lyDo`.
- [ ] Giao diện: tạo/sửa/bật-tắt/xóa/sao chép mã chạy đúng; mục Voucher ở trang sản phẩm ẩn khi trống; ổn ở 360px.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Ghi lại **tên + chữ ký chính xác** hai hàm thuần để F16/F17 dùng đúng.
