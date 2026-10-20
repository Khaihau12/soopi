# FORM F15 — GIỎ HÀNG

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F03, F06, F09 (hàm tính giá), F13 (giá khuyến mãi — để kiểm thử tổng tiền).

## 1. Mục tiêu

Người dùng thêm sản phẩm vào giỏ, đổi số lượng, xóa dòng, **chọn/bỏ chọn** các sản phẩm muốn mua; hệ thống **tự tính lại tổng giá trị** ở backend. Header hiển thị số sản phẩm trong giỏ.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.5** (Quản lý giỏ hàng). Collection **Bảng 3.35, 3.36**, chỉ mục **Bảng 3.45**.
- `AGENTS.md` Mục 8 (Giỏ hàng, Tồn kho, Giá). `02`: **`QĐ-17`**, `QĐ-22`.

## 3. API (tất cả cần đăng nhập; mọi vai trò)

| Method + URL | Body | Kết quả |
|---|---|---|
| `GET /api/gio-hang` | — | `data` = **trạng thái giỏ** (xem dưới) |
| `POST /api/gio-hang/chi-tiet` | `sanPhamId`, `soLuong` (mặc định 1) | **201**, `data` = trạng thái giỏ mới |
| `PATCH /api/gio-hang/chi-tiet/:id` | `soLuong` | 200, `data` = trạng thái giỏ mới |
| `DELETE /api/gio-hang/chi-tiet/:id` | — | 200, `data` = trạng thái giỏ mới |
| `PATCH /api/gio-hang/chon` | `duocChon` (bool), `chiTietGioHangIds?` (mảng; **bỏ trống = tất cả dòng**) | 200, `data` = trạng thái giỏ mới |

> **Mọi thao tác ghi đều trả luôn trạng thái giỏ mới** để frontend không cần gọi thêm.

**Trạng thái giỏ (`data`):**
```json
{
  "gioHang": { "_id": "...", "tongGiaTri": 350000 },
  "soLuongSanPham": 3,
  "danhSach": [{
    "_id": "<chiTietGioHangId>", "soLuong": 2, "duocChon": true,
    "coTheMua": true, "lyDoKhongMua": null,
    "sanPham": { "_id": "...", "tenSanPham": "...", "hinhAnh": [], "giaGoc": 200000,
                 "giaBanThucTe": 175000, "khuyenMaiApDung": null, "soLuongTon": 10,
                 "trangThaiKinhDoanh": "Đang kinh doanh" },
    "cuaHang": { "_id": "...", "tenCuaHang": "...", "trangThaiHoatDong": "Hoạt động" }
  }]
}
```
`soLuongSanPham` = số **dòng** (số sản phẩm khác nhau) trong giỏ.

## 4. Quy tắc nghiệp vụ và ràng buộc

1. **Giỏ của ai:** xác định từ `req.taiKhoan`. Không nhận `gioHangId`/`taiKhoanId` từ client. Giỏ chưa có thì **tạo khi cần** bằng thao tác nguyên tử (`findOneAndUpdate` + `upsert` với `$setOnInsert`) để hai request đồng thời không tạo hai giỏ (đã có unique `taiKhoanId`).
2. **Thêm vào giỏ:**
   - `soLuong` là số nguyên ≥ 1, sai → 400.
   - Sản phẩm phải tồn tại, `Đang kinh doanh`, và cửa hàng `Hoạt động`; ngược lại → 404 "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh".
   - **Mỗi sản phẩm một dòng; thêm lại thì cộng dồn `soLuong`** (đã có unique kết hợp `gioHangId + sanPhamId`; nếu gặp lỗi trùng khóa do đua thì thử lại bằng thao tác cộng).
   - Tổng số lượng sau khi cộng **không được vượt `soLuongTon`** → **409** "Chỉ còn N sản phẩm (trong giỏ bạn đã có M)". Không tự cắt số lượng.
   - Dòng mới có `duocChon = true` (`QĐ-17`).
3. **Đổi số lượng:** `soLuong` nguyên ≥ 1 và ≤ `soLuongTon`; sai → 400/409 tương ứng. Muốn bỏ sản phẩm thì dùng xóa dòng (không cho `soLuong = 0`).
4. **Dòng thuộc giỏ của người đăng nhập:** truy vấn luôn kèm `gioHangId` của chính họ; dòng của người khác hoặc không tồn tại → **404**.
5. **Chọn dòng (`/chon`):** chỉ cập nhật các dòng thuộc giỏ của mình; `duocChon` phải là boolean.
6. **Giá luôn do backend quyết định:** mỗi lần đọc giỏ gọi hàm tính giá F09 **một lần cho cả danh sách** (không N+1). Giá thay đổi (khuyến mãi bắt đầu/hết) thì giỏ hiển thị giá mới; **không** lưu giá vào `ChiTietGioHang`.
7. **`coTheMua` (`QĐ-17`)** = sản phẩm còn tồn tại **và** `Đang kinh doanh` **và** cửa hàng `Hoạt động` **và** `soLuongTon ≥ 1` **và** `soLuong ≤ soLuongTon`. Nếu false, `lyDoKhongMua` là câu tiếng Việt ngắn: "Sản phẩm đã ngừng kinh doanh", "Cửa hàng tạm ngừng hoạt động", "Đã hết hàng", "Chỉ còn N sản phẩm". Dòng không mua được **vẫn hiển thị** nhưng **không** tính vào tổng và **không** được chọn để đặt hàng.
8. **`tongGiaTri`** = tổng `soLuong × giaBanThucTe` của các dòng **`duocChon = true` và `coTheMua = true`**. Tính lại ở backend **sau mỗi thao tác ghi và mỗi lần đọc**; nếu khác giá trị lưu thì ghi lại vào `GioHang.tongGiaTri` (số nguyên ≥ 0).
9. Dòng tham chiếu sản phẩm không còn trong DB (dữ liệu hỏng) → bỏ qua khi trả về và xóa dòng đó.

## 5. Backend — file cần tạo

`routes/gioHang.route.js` (toàn bộ `router.use(batBuocDangNhap)`), `controllers/gioHang.controller.js`, `services/gioHang.service.js` (`layGioHang`, `themSanPhamVaoGio`, `capNhatSoLuongDongGio`, `xoaDongGio`, `chonDongGio`, hàm nội bộ `dungTrangThaiGioHang`/`tinhLaiTongGiaTri` dùng chung để mọi hàm trả cùng một cấu trúc). Gắn vào `routes/index.js`.

> **Quan trọng cho form sau:** F16/F17 sẽ gọi lại hàm dựng trạng thái giỏ này (hoặc truy vấn tương đương) để lấy các dòng `duocChon && coTheMua`. Ghi tên hàm vào báo cáo.

## 6. Frontend

**File:** `services/gioHang.api.js`; `hooks/GioHangContext.jsx` (Provider + `useGioHang()`); page `GioHangPage` (`/gio-hang`, bọc `BaoVeRoute`); components `DongGioHang`, `TomTatGioHang`; cập nhật `UserLayout` (header) và `ChiTietSanPhamPage`.

### 6.1 `GioHangContext`
- Giữ trạng thái giỏ; chỉ tải khi **đã đăng nhập**; đăng xuất → xóa sạch. Mọi hàm ghi (`themVaoGio`, `doiSoLuong`, `xoaDong`, `chonDong`) dùng response để cập nhật state.
- Cung cấp `soLuongSanPham` cho header, `dangTai`, `loi`, `taiLai`.
- Bọc `App` (trong `XacThucProvider`).

### 6.2 Header
- Biểu tượng giỏ + **huy hiệu số lượng** (ẩn khi 0; hiện "9+" khi > 9); `aria-label` "Giỏ hàng, N sản phẩm". Chưa đăng nhập: bấm vào dẫn tới đăng nhập.

### 6.3 Chi tiết sản phẩm — thêm vào giỏ (bổ sung F09)
- Khối mua gồm `QuantityInput` (tối thiểu 1, tối đa `soLuongTon`) + nút chính **"Thêm vào giỏ"**.
- `soLuongTon = 0` → nút thành **"Hết hàng"** (khóa).
- Chưa đăng nhập → chuyển `/dang-nhap` với `quayLai` là trang sản phẩm.
- Thành công → toast "Đã thêm vào giỏ hàng" (kèm liên kết "Xem giỏ hàng"); lỗi 409 hiện đúng thông báo server. Nút có trạng thái `loading`.

### 6.4 `GioHangPage`
Hai cột từ 1024px (danh sách | tóm tắt dính khi cuộn); dưới 1024px: tóm tắt thành **thanh dính đáy màn hình**.
- Đầu danh sách: ô **"Chọn tất cả"** (gọi `/chon` không kèm ID) + số sản phẩm đã chọn.
- **Nhóm theo cửa hàng** (mỗi cửa hàng một `Card`): tiêu đề có checkbox chọn cả nhóm (chỉ các dòng mua được) + tên cửa hàng.
- `DongGioHang`: checkbox · ảnh nhỏ (liên kết sản phẩm) · tên · `GiaTien` · `QuantityInput` · thành tiền dòng · nút xóa (`Icon trash`, có `aria-label`).
  - Dòng `coTheMua = false`: làm mờ, checkbox khóa, hiện `lyDoKhongMua` bằng chữ màu cảnh báo; **vẫn xóa được**.
  - Thay đổi số lượng gọi API ngay; khóa điều khiển của dòng đó trong lúc chờ; 409 → toast đúng thông báo và đồng bộ lại số lượng từ server.
  - Xóa dòng: thực hiện ngay + toast "Đã xóa khỏi giỏ hàng" (không cần hộp thoại).
- `TomTatGioHang`: "Tạm tính (N sản phẩm)" + **tổng `tongGiaTri`** (dùng giá trị server), ghi chú nhỏ "Phí vận chuyển và voucher sẽ được tính ở bước thanh toán", nút chính **"Mua hàng"** → `/thanh-toan`, **khóa khi không có dòng nào được chọn và mua được**.
- Giỏ trống → `EmptyState` "Giỏ hàng đang trống" + nút "Xem sản phẩm". Đủ trạng thái tải (`Skeleton`)/lỗi.

## 7. Không được làm

- Không tính tổng tiền ở frontend để gửi lên; không lưu giá vào `ChiTietGioHang`.
- Không cho đặt `soLuong` vượt tồn kho; không tự cắt số lượng im lặng.
- Không thêm field (ghi chú, biến thể...) vào `ChiTietGioHang`.
- Không dùng `localStorage` cho giỏ hàng.

## 8. Tiêu chí hoàn thành

- [ ] Thêm cùng sản phẩm hai lần → **một dòng**, `soLuong` cộng dồn; hai request thêm đồng thời → vẫn một dòng, không lỗi 500.
- [ ] Thêm vượt tồn kho (kể cả cộng dồn) → 409 với số còn lại; `soLuong` = 0/-1/1.5/chữ → 400.
- [ ] Sản phẩm `Ngừng kinh doanh` hoặc cửa hàng `Ngừng hoạt động` → không thêm được (404) — **kiểm tra bằng cách gọi API trực tiếp (curl/Postman), không chỉ nhìn giao diện** (`QĐ-15`: backend phải tự chặn, không dựa vào việc ẩn nút); sản phẩm đã có trong giỏ mà bị ngừng → dòng có `coTheMua=false`, không tính vào `tongGiaTri`.
- [ ] Tạo khuyến mãi (F13) cho sản phẩm trong giỏ → mở lại giỏ thấy `giaBanThucTe` và `tongGiaTri` đổi; DB `tongGiaTri` được cập nhật.
- [ ] Dùng `id` dòng của người khác → 404; chưa đăng nhập → 401.
- [ ] `/chon` với `duocChon:false` không kèm ID → tất cả dòng bỏ chọn và `tongGiaTri = 0`.
- [ ] Giao diện: thêm từ trang sản phẩm → huy hiệu header đổi; giỏ nhóm theo cửa hàng; chọn/bỏ chọn cập nhật tổng; nút "Mua hàng" khóa/mở đúng; thanh tóm tắt dính đáy trên 360px; dùng được bằng bàn phím.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Ghi tên hàm dựng trạng thái giỏ để F16/F17 dùng lại.
