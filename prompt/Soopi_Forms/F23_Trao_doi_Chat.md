# FORM F23 — TRAO ĐỔI NGƯỜI DÙNG ↔ NGƯỜI BÁN (CHAT)

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F09, F11, F19.

## 1. Mục tiêu

Người dùng nhắn tin cho **cửa hàng** về sản phẩm/đơn hàng; Người bán xem và phản hồi. Socket.IO thông báo tin mới sau khi MongoDB lưu thành công (`QĐ-19`); REST vẫn tải danh sách và lịch sử.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.10** (Người dùng), **Bảng 3.18** (Người bán — Hỗ trợ khách hàng). Collection **Bảng 3.42, 3.43**; chỉ mục **Bảng 3.45** (`CuocTroChuyen(taiKhoanId, cuaHangId)` — **nâng lên Unique theo CR-02** ở `02` Mục E, F05 đã làm; `TinNhan(cuocTroChuyenId, thoiGianGui)`).
- `02` (v2): **`QĐ-19`** (có unique index để chống trùng cuộc trò chuyện), `QĐ-22`. `02` Mục E: **CR-02**.

## 3. API

| Method + URL | Quyền | Body / Query | Kết quả |
|---|---|---|---|
| `GET /api/cuoc-tro-chuyen` | đăng nhập | `cuaHangId?`, `trang`, `gioiHan` | `data = { danhSach, phanTrang }` (cuộc trò chuyện **của tôi với tư cách khách**) |
| `POST /api/cuoc-tro-chuyen` | đăng nhập | `cuaHangId`, `noiDung` | **201** `data = { cuocTroChuyen, tinNhan }` (tìm-hoặc-tạo cuộc trò chuyện rồi gửi tin đầu) |
| `GET /api/cuoc-tro-chuyen/:id/tin-nhan` | đăng nhập (thành viên) | `truoc?` hoặc `sau?` (mốc `thoiGianGui` ISO), `gioiHan?` | `data = { danhSach, coTinCuHon }` — `danhSach` luôn xếp **cũ → mới** |
| `POST /api/cuoc-tro-chuyen/:id/tin-nhan` | đăng nhập (thành viên) | `noiDung` | **201** `data.tinNhan` |
| `GET /api/nguoi-ban/cuoc-tro-chuyen` | Người bán | `trang`, `gioiHan` | `data = { danhSach, phanTrang }` (cuộc trò chuyện **gửi tới cửa hàng của tôi**) |

**Phần tử `danhSach` cuộc trò chuyện:** `_id, thoiGianBatDau, thoiGianCapNhat, cuaHang: { _id, tenCuaHang }, nguoiDung: { _id, hoTen }, tinNhanCuoi: { noiDung, thoiGianGui, nguoiGuiId } | null`, sắp `thoiGianCapNhat` giảm dần.
**`tinNhan`:** `_id, noiDung, thoiGianGui, cuocTroChuyenId, nguoiGuiId`.

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Thành viên và quyền
- Một cuộc trò chuyện có **hai phía**: *khách* (`taiKhoanId`) và *cửa hàng* (`cuaHangId`, đại diện bởi chủ cửa hàng).
- Một tài khoản là **thành viên** nếu `cuocTroChuyen.taiKhoanId = req.taiKhoan._id` **hoặc** (có vai trò Người bán và `cuocTroChuyen.cuaHangId` bằng cửa hàng của họ). Không phải thành viên → **404** (không lộ sự tồn tại).
- `nguoiGuiId` luôn là `req.taiKhoan._id` (không nhận từ client). Danh sách `/nguoi-ban/cuoc-tro-chuyen` chỉ gồm cuộc trò chuyện của **cửa hàng mình**.
- Người dùng **không** được nhắn tin cho **cửa hàng của chính mình** → 409 "Bạn không thể nhắn tin cho cửa hàng của chính mình".

### 4.2 Bắt đầu cuộc trò chuyện (`POST /api/cuoc-tro-chuyen`)
1. `cuaHangId` phải là cửa hàng **tồn tại** và `Hoạt động` (không → 404/409). *(Cuộc trò chuyện đã có sẵn với cửa hàng sau này `Ngừng hoạt động` vẫn nhắn tiếp được.)*
2. **Tìm-hoặc-tạo** cuộc trò chuyện theo cặp (`taiKhoanId`, `cuaHangId`) bằng một thao tác (`findOneAndUpdate` + `upsert` + `$setOnInsert`). Vì cặp này đã là **chỉ mục Unique (CR-02)**, hai yêu cầu đến cùng lúc **không thể** tạo hai bản ghi: nếu gặp lỗi trùng khóa `11000` (bên kia vừa tạo xong) thì **tìm lại** bản ghi đã có và dùng nó (thử lại tối đa một lần), không trả lỗi cho người dùng.
3. **Cuộc trò chuyện chỉ được tạo cùng tin nhắn đầu tiên** (khớp bội số `1..*` của tài liệu): nếu tạo tin nhắn lỗi thì xóa cuộc trò chuyện vừa tạo trong lần này. Không có API tạo cuộc trò chuyện rỗng.
4. `GET /api/cuoc-tro-chuyen?cuaHangId=` giúp frontend biết đã có cuộc trò chuyện với cửa hàng đó chưa (trả mảng 0 hoặc 1 phần tử).

### 4.3 Tin nhắn
- `noiDung`: bắt buộc, `trim`, ≤ `DO_DAI_TOI_DA.NOI_DUNG` (1000) → sai 400 "Vui lòng nhập nội dung tin nhắn" (đúng Bảng 3.10/3.18). Hiển thị **văn bản thuần**, không HTML.
- Gửi tin: tạo `TinNhan` (`thoiGianGui = now`) rồi cập nhật `CuocTroChuyen.thoiGianCapNhat = thoiGianGui`. Lỗi ở bước nào → tin nhắn **không được ghi nhận** nếu bước tạo lỗi; nếu chỉ lỗi cập nhật `thoiGianCapNhat` thì ghi log, vẫn trả thành công (không để lệch dữ liệu quan trọng).
- **Phân trang theo `thoiGianGui`:** hằng số `SO_TIN_NHAN_MOI_LAN = 30` (`gioiHan` tối đa 50).
  - Không tham số → **30 tin mới nhất**.
  - `truoc=<ISO>` → các tin có `thoiGianGui ≤ mốc` (cũ hơn) tối đa `gioiHan`, `coTinCuHon` cho biết còn nữa không.
  - `sau=<ISO>` → các tin có `thoiGianGui ≥ mốc` (mới hơn), tối đa 100, dùng đồng bộ sau khi kết nối lại.
  - Hai tham số **không** dùng cùng lúc (400). Mốc dùng **bao gồm biên** (`≤`/`≥`) để không sót tin cùng mili-giây; **frontend khử trùng theo `_id`**.
  - Sắp xếp theo `thoiGianGui` rồi `_id`; luôn trả `danhSach` theo thứ tự cũ → mới.
- Không có đã đọc/chưa đọc, chỉnh sửa, thu hồi, đính kèm (không có field).

### 4.4 Danh sách cuộc trò chuyện
- Gom `tinNhanCuoi` bằng **một** truy vấn nhóm/`$in` cho cả trang (không N+1). Với Người bán: `nguoiDung.hoTen` chỉ gồm `_id`, `hoTen`; với khách: `cuaHang.tenCuaHang`.

## 5. Backend — file cần tạo

`routes/cuocTroChuyen.route.js` (`router.use(batBuocDangNhap)`), `routes/nguoiBanCuocTroChuyen.route.js` (`router.use(...batBuocNguoiBan)`), `controllers/cuocTroChuyen.controller.js`, `services/cuocTroChuyen.service.js` (`layDanhSachCuocTroChuyenCuaToi`, `taoCuocTroChuyenVaGuiTinNhan`, `layTinNhan`, `guiTinNhan`, `nguoiBanLayDanhSachCuocTroChuyen`, hàm nội bộ `kiemTraThanhVien`); hằng số `SO_TIN_NHAN_MOI_LAN`. Gắn vào `routes/index.js`.

## 6. Frontend

**File:** `services/cuocTroChuyen.api.js`; components `KhungTroChuyen`, `DanhSachCuocTroChuyen`, `BongBongTinNhan`; pages `TroChuyenPage` (`/tro-chuyen`), `nguoiBan/TroChuyenNguoiBanPage` (`/nguoi-ban/tro-chuyen`); cập nhật `ChiTietSanPhamPage`, `ChiTietDonHangPage`. Thêm mục **"Trao đổi"** vào `MENU_TAI_KHOAN` và `MENU_NGUOI_BAN`.

### 6.1 Bố cục hai trang (dùng chung `KhungTroChuyen`)
- **Desktop (≥ 768px):** hai khung cạnh nhau — trái `DanhSachCuocTroChuyen` (tên đối phương, tin cuối cắt gọn 1 dòng, thời gian), phải khung hội thoại. **Mobile:** màn danh sách → bấm vào mở màn hội thoại toàn màn hình có nút "Quay lại".
- Khách: `TroChuyenPage` đọc `?cuaHangId=`: nếu đã có cuộc trò chuyện với cửa hàng đó → mở nó; nếu chưa → mở khung **trống** ("Hãy gửi tin nhắn đầu tiên cho *tên cửa hàng*") và tin đầu gọi `POST /cuoc-tro-chuyen`. Người bán: `TroChuyenNguoiBanPage`; chưa có cuộc nào → `EmptyState` "Chưa có tin nhắn nào từ khách hàng".
- Mục tiêu giao diện: gọn, giống ứng dụng nhắn tin quen thuộc; không rườm rà.

### 6.2 `KhungTroChuyen`
- Tiêu đề: tên đối phương. Vùng tin nhắn cuộn (`role="log"`, `aria-live="polite"`): **tin của mình bên phải** (nền `--mauChinhNhat`/chữ `--chu`), **của đối phương bên trái** (nền `--beMat`, viền `--vien`) — so sánh `nguoiGuiId` với `taiKhoan._id`; thời gian nhỏ dưới bong bóng; vạch ngăn ngày khi sang ngày mới.
- Đầu danh sách: nút **"Xem tin nhắn cũ hơn"** (khi `coTinCuHon`) gọi `truoc=` và **giữ nguyên vị trí cuộn**.
- **Socket.IO:** nhận `tin-nhan-moi` để thêm tin và tải lại danh sách; khi kết nối lại gọi REST `sau=<thoiGianGui tin mới nhất>` để lấy tin bỏ lỡ. Ngắt socket khi rời trang; khử trùng theo `_id`; chỉ tự cuộn xuống khi người dùng đang ở gần cuối.
- **Ô soạn tin:** `Textarea` tự giãn tối đa ~4 dòng; `Enter` gửi, `Shift+Enter` xuống dòng; nút gửi khóa khi rỗng/đang gửi; đếm ký tự khi gần giới hạn. Gửi lỗi → giữ nguyên nội dung ô, hiện lỗi dưới ô và cho gửi lại; thành công → thêm tin vào danh sách ngay.
- Chưa đăng nhập: nút "Chat với cửa hàng" ở trang sản phẩm dẫn tới đăng nhập (`quayLai`).

### 6.3 Điểm vào từ nơi khác
- **Trang chi tiết sản phẩm:** trong khối thông tin cửa hàng thêm nút phụ **"Chat với cửa hàng"** → `/tro-chuyen?cuaHangId=<id>`; **ẩn** nếu sản phẩm thuộc cửa hàng của chính người đang xem.
- **Chi tiết đơn hàng (F19):** nút phụ **"Nhắn tin cho cửa hàng"** tương tự.

## 7. Không được làm

- Không thêm "chưa đọc", "đang gõ", ảnh/tệp đính kèm.
- Không nhận `nguoiGuiId` hay `taiKhoanId` từ client; không cho người ngoài cuộc trò chuyện đọc/gửi.
- Không render nội dung tin nhắn bằng HTML.
- Không tạo cuộc trò chuyện không có tin nhắn.
- Không phát tin cho tài khoản không phải thành viên; không phát trước khi MongoDB lưu thành công.

## 8. Tiêu chí hoàn thành

- [ ] Khách gửi tin đầu → tạo đúng **một** `CuocTroChuyen` + một `TinNhan`; gửi tiếp dùng lại cuộc trò chuyện cũ (không tạo thêm).
- [ ] **Chống trùng (CR-02):** chạy script gửi **hai tin đầu tiên cùng lúc** từ cùng một khách tới cùng một cửa hàng (song song) → DB chỉ có **một** `CuocTroChuyen` cho cặp đó, cả hai tin nằm trong cuộc trò chuyện ấy, không có lỗi 500.
- [ ] Người bán của cửa hàng đó thấy cuộc trò chuyện ở danh sách, trả lời được; khách thấy phản hồi qua Socket.IO ngay sau khi tin được lưu.
- [ ] Người thứ ba (khách khác hoặc Người bán cửa hàng khác) đọc/gửi vào cuộc trò chuyện → 404; chưa đăng nhập → 401.
- [ ] Nhắn cho cửa hàng của chính mình → 409; `cuaHangId` không tồn tại → 404; cửa hàng `Ngừng hoạt động` tạo mới → bị từ chối nhưng cuộc trò chuyện cũ vẫn nhắn được.
- [ ] `noiDung` rỗng/toàn khoảng trắng/quá 1000 ký tự → 400.
- [ ] Gửi tin làm `thoiGianCapNhat` của cuộc trò chuyện mới nhất; danh sách sắp đúng.
- [ ] Phân trang: tạo > 30 tin → mặc định trả 30 tin mới nhất, `coTinCuHon = true`; `truoc=` lấy tiếp đúng đoạn cũ hơn **không trùng, không sót**; `truoc` và `sau` cùng lúc → 400.
- [ ] Socket.IO: tin mới xuất hiện, không bị nhân đôi; ngắt kết nối rồi kết nối lại vẫn lấy được tin bỏ lỡ qua REST.
- [ ] Danh sách cuộc trò chuyện không gây N+1.
- [ ] Giao diện: bong bóng đúng bên; "xem tin cũ hơn" không làm nhảy cuộn; Enter/Shift+Enter đúng; mobile có luồng danh sách → hội thoại; nút "Chat với cửa hàng" ẩn với cửa hàng của chính mình.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9.
