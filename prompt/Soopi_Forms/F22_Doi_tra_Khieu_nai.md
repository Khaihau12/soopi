# FORM F22 — ĐỔI TRẢ & KHIẾU NẠI

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F19, F20 (cần đơn `Hoàn thành`).

## 1. Mục tiêu

- **Người dùng** gửi yêu cầu **đổi trả** hoặc **khiếu nại** cho một sản phẩm trong đơn đã hoàn thành, và theo dõi kết quả.
- **Người bán** xem yêu cầu liên quan sản phẩm của cửa hàng mình và **chấp nhận hoặc từ chối**.
- Hệ thống **không** tự hoàn tiền/đổi hàng (ngoài phạm vi).

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.8** (Người dùng), **Bảng 3.16** (Người bán). Collection **Bảng 3.41**; chỉ mục **Bảng 3.45** (`chiTietDonHangId` unique).
- `AGENTS.md` Mục 7, 8 (Đánh giá, đổi trả). `02` (v2): **`QĐ-02`** (điều kiện gửi **có hạn 7 ngày** + quy trình khi bị từ chối), `QĐ-22`. `02` Mục E: CR-03 (`DonHang.ngayHoanThanh`).

## 3. API

| Method + URL | Quyền | Body / Query | Kết quả |
|---|---|---|---|
| `POST /api/doi-tra-khieu-nai` | đăng nhập | `chiTietDonHangId`, `loaiYeuCau` (`Đổi trả`/`Khiếu nại`), `noiDung` | **201** `data.yeuCau` |
| `GET /api/doi-tra-khieu-nai` | đăng nhập | `trangThaiXuLy?`, `trang`, `gioiHan` | `data = { danhSach, phanTrang }` (yêu cầu của mình) |
| `GET /api/doi-tra-khieu-nai/:id` | đăng nhập (chủ yêu cầu) | — | `data.yeuCau` |
| `GET /api/nguoi-ban/doi-tra-khieu-nai` | Người bán | `trangThaiXuLy?`, `loaiYeuCau?`, `trang`, `gioiHan` | `data = { danhSach, phanTrang }` |
| `GET /api/nguoi-ban/doi-tra-khieu-nai/:id` | Người bán | — | `data.yeuCau` |
| `PATCH /api/nguoi-ban/doi-tra-khieu-nai/:id/xu-ly` | Người bán | `ketQuaXuLy` (`Chấp nhận`/`Từ chối`) | 200 `data.yeuCau` |

**`yeuCau`:** `_id, loaiYeuCau, noiDung, trangThaiXuLy, ketQuaXuLy, ngayTao, chiTietDonHang: { _id, soLuong, giaBanThucTe, thanhTien, sanPham: { _id, tenSanPham, hinhAnh } }, donHang: { _id, ngayTao, cuaHang: { _id, tenCuaHang } }`; phía Người bán thêm `nguoiGui: { hoTen, soDienThoai }`.

## 4. Quy tắc nghiệp vụ và ràng buộc

### 4.1 Gửi yêu cầu (`QĐ-02`)
1. Dòng đơn `chiTietDonHangId` phải tồn tại và **đơn của dòng đó thuộc `req.taiKhoan`** (không → **404**).
2. Đơn phải `trangThaiXuLy = 'Hoàn thành'` (không → **409** "Đơn hàng chưa đủ điều kiện gửi yêu cầu") **và còn trong hạn gửi (`QĐ-02` v2):** `hiện tại ≤ ngayHoanThanh + SO_NGAY_DOI_TRA_TOI_DA` (hằng số **7** ngày **đã được thêm ở F19** vào `cauHinh.constant.js`; thiếu `ngayHoanThanh` thì tính từ `ngayTao`). Quá hạn → **409** "Đã quá thời hạn gửi yêu cầu (7 ngày kể từ khi đơn hoàn thành)". Dùng **cùng một hàm** `tinhHanGuiYeuCau` đã viết ở F19 (không viết lại logic).
3. Mỗi dòng đơn **tối đa một** yêu cầu (đã có → **409** "Sản phẩm này đã có yêu cầu"); xử lý cả lỗi trùng khóa `11000` do đua. Yêu cầu bị từ chối **không** được gửi lại (mỗi dòng đơn chỉ có một yêu cầu theo mô hình dữ liệu); vì vậy **giao diện phải nói rõ điều này trước khi gửi** và hướng dẫn trao đổi thêm với cửa hàng qua tin nhắn (xem 6.1, 6.2).
4. `loaiYeuCau` ∈ `LOAI_YEU_CAU`; `noiDung` bắt buộc, `trim`, ≤ 1000 ký tự (thiếu → 400 "Vui lòng nhập lý do/nội dung" — đúng Bảng 3.8).
5. Tạo với `trangThaiXuLy = 'Chờ xử lý'`, **không** có `ketQuaXuLy` (không gán `null`), `ngayTao = now`.

### 4.2 Xem
- Người dùng chỉ thấy yêu cầu **của mình**. Cách làm gợi ý (đơn giản): lấy `_id` các `DonHang` của mình → `_id` các `ChiTietDonHang` thuộc các đơn đó → lọc `YeuCauDoiTraKhieuNai` bằng `$in`; các thông tin hiển thị lấy bằng truy vấn theo `$in` (**không** N+1). Yêu cầu của người khác → **404**.
- Người bán chỉ thấy yêu cầu có dòng đơn thuộc đơn của **cửa hàng mình** (tương tự, theo `DonHang.cuaHangId = req.cuaHang._id`); khác → **404** (đúng Bảng 3.16: "không liên quan sản phẩm thuộc cửa hàng thì không xử lý").
- Người bán thấy `nguoiGui` chỉ gồm `hoTen`, `soDienThoai`.
- Sắp xếp: `ngayTao` giảm dần.

### 4.3 Xử lý (Người bán)
1. Yêu cầu phải thuộc cửa hàng mình (404 nếu không).
2. `ketQuaXuLy` ∈ {`Chấp nhận`, `Từ chối`}, khác → 400.
3. Chỉ xử lý khi đang `Chờ xử lý`; ghi bằng thao tác nguyên tử có điều kiện:
   `findOneAndUpdate({ _id, trangThaiXuLy: 'Chờ xử lý' }, { $set: { trangThaiXuLy: 'Đã xử lý', ketQuaXuLy } }, { new: true })`.
   `null` (đã xử lý) → **409** "Yêu cầu đã được xử lý". **Kết quả không thể thay đổi** sau đó.
4. **Chấp nhận/Từ chối chỉ ghi nhận kết quả.** Không đổi trạng thái đơn, không cộng/trừ tồn kho, không hoàn tiền, không tạo bản ghi nào khác.
5. Không có lý do từ chối (không có field). Nếu cần trao đổi, dùng tin nhắn (F23).
6. Lỗi ghi → giữ nguyên trạng thái cũ.

## 5. Backend — file cần tạo

`routes/doiTraKhieuNai.route.js` (`router.use(batBuocDangNhap)`), `routes/nguoiBanDoiTraKhieuNai.route.js` (`router.use(...batBuocNguoiBan)`), `controllers/doiTraKhieuNai.controller.js`, `services/doiTraKhieuNai.service.js` (`guiYeuCauDoiTraKhieuNai`, `layDanhSachYeuCauCuaToi`, `layChiTietYeuCauCuaToi`, `nguoiBanLayDanhSachYeuCau`, `nguoiBanLayChiTietYeuCau`, `nguoiBanXuLyYeuCau`). Gắn vào `routes/index.js`.

## 6. Frontend

**File:** `services/doiTraKhieuNai.api.js`; component `DoiTraKhieuNaiForm`; pages `DoiTraKhieuNaiPage` (`/doi-tra-khieu-nai`), `nguoiBan/DoiTraKhieuNaiNguoiBanPage` (`/nguoi-ban/doi-tra-khieu-nai`); cập nhật `ChiTietDonHangPage` (F19). Thêm mục **"Đổi trả và khiếu nại"** vào `MENU_TAI_KHOAN` và `MENU_NGUOI_BAN`.

### 6.1 Gửi yêu cầu (từ chi tiết đơn)
- Mỗi dòng sản phẩm có `coTheGuiYeuCau = true` hiện nút phụ **"Đổi trả / khiếu nại"**. Dòng đã có yêu cầu (`yeuCauDoiTra`) hiện `Badge` trạng thái (ví dụ "Đổi trả · Chờ xử lý" / "Khiếu nại · Đã chấp nhận") kèm liên kết tới `/doi-tra-khieu-nai`. Đơn chưa `Hoàn thành`: không hiện nút; hiển thị chữ phụ "Chỉ gửi được sau khi đơn hoàn thành".
- **Lưu ý trước khi gửi** (hiển thị trong hộp thoại, chữ rõ, không in nghiêng nhạt): "Mỗi sản phẩm chỉ gửi **một** yêu cầu và không thể gửi lại sau khi bị từ chối. Hãy mô tả đầy đủ. Bạn còn **X ngày** để gửi yêu cầu cho đơn này." (X từ `hanGuiYeuCau`; hết hạn thì thay nút gửi bằng thông báo "Đã quá thời hạn gửi yêu cầu").
- Nút mở `Modal` `DoiTraKhieuNaiForm`: tóm tắt sản phẩm đang chọn · chọn **loại** (hai lựa chọn dạng thẻ radio: "Đổi trả" / "Khiếu nại") · `Textarea` có nhãn đổi theo loại ("Lý do đổi trả" / "Nội dung khiếu nại"), đếm ký tự · nút chính **"Gửi yêu cầu"**. Lỗi 409/400 hiện rõ trong hộp thoại; thành công → toast "Đã gửi yêu cầu", tải lại chi tiết đơn.

### 6.2 `DoiTraKhieuNaiPage` (Người dùng)
- `PageHeader` "Đổi trả và khiếu nại" + `Tabs` (Tất cả · Chờ xử lý · Đã xử lý), lọc trên URL.
- Thẻ yêu cầu: ảnh + tên sản phẩm, `Badge` loại, ngày gửi, `TrangThaiBadge` trạng thái; khi **Đã xử lý** hiện kết quả: `Chấp nhận` (màu thành công) → "Người bán đã chấp nhận yêu cầu của bạn"; `Từ chối` (màu lỗi) → "Người bán đã từ chối yêu cầu của bạn" **kèm hướng dẫn xử lý tiếp (quy trình khi bị từ chối, `QĐ-02`):** "Yêu cầu này không thể gửi lại. Bạn có thể nhắn tin cho cửa hàng để trao đổi thêm." + nút **"Nhắn tin cho cửa hàng"** (`/tro-chuyen?cuaHangId=…`, F23). Việc Quản trị viên phân xử **không** có trong phiên bản này.
- Bấm thẻ mở `Modal` chi tiết (nội dung đã gửi, cửa hàng, liên kết tới đơn hàng). Rỗng → `EmptyState` "Bạn chưa có yêu cầu nào". `Pagination`, đủ tải/lỗi.

### 6.3 `DoiTraKhieuNaiNguoiBanPage`
- `PageHeader` "Đổi trả và khiếu nại" + `Tabs` (**Chờ xử lý** mặc định · Đã xử lý · Tất cả) + chip lọc loại.
- `DataTable`: *Sản phẩm*, *Loại*, *Người gửi* (họ tên, SĐT), *Ngày gửi*, *Trạng thái/Kết quả*, "Xem". Mobile → thẻ.
- "Xem" mở `Modal` chi tiết: thông tin đơn (liên kết `/nguoi-ban/don-hang/:id`), sản phẩm, số lượng, loại, nội dung. Yêu cầu `Chờ xử lý`: hai nút **"Chấp nhận"** (chính) và **"Từ chối"** (nguy hiểm), mỗi nút qua `ConfirmDialog` ghi rõ "Kết quả không thể thay đổi sau khi xác nhận". Có ghi chú "Soopi không tự động hoàn tiền hoặc đổi hàng". Yêu cầu đã xử lý: chỉ xem.
- Lỗi 409 → toast + tải lại danh sách. Rỗng → "Chưa có yêu cầu nào".

## 7. Không được làm

- Không tự đổi trạng thái đơn/tồn kho/tiền khi chấp nhận; không cho sửa hoặc rút yêu cầu; không cho xử lý lại.
- Không thêm `lyDoTuChoi`, ảnh đính kèm, trạng thái "khiếu nại lại" (không có field). Hạn đổi trả **không** lưu thành field — luôn tính từ `ngayHoanThanh` + hằng số.
- Không cho Quản trị viên xử lý yêu cầu (báo cáo giao cho Người bán).
- Không gán `ketQuaXuLy = null`.

## 8. Tiêu chí hoàn thành

- [ ] Đơn chưa `Hoàn thành` → 409; dòng đơn của người khác → 404; thiếu `noiDung`, `loaiYeuCau` sai → 400.
- [ ] Gửi lần hai cùng dòng → 409 (kể cả bị từ chối trước đó); hai request đồng thời → một thành công.
- [ ] **Hạn 7 ngày:** đơn hoàn thành 6 ngày trước → gửi được; chỉnh `ngayHoanThanh` lùi 8 ngày → **409** quá hạn, giao diện hiển thị thông báo và không cho gửi; đơn thiếu `ngayHoanThanh` dùng `ngayTao`.
- [ ] Yêu cầu bị `Từ chối` → giao diện hiển thị hướng dẫn và nút nhắn tin cho cửa hàng; không có nút gửi lại.
- [ ] Người dùng chỉ thấy yêu cầu của mình (người khác → 404); chi tiết đơn (F19) phản ánh `yeuCauDoiTra` và `coTheGuiYeuCau = false` sau khi gửi.
- [ ] Người bán A xem/xử lý yêu cầu của cửa hàng B → 404; `Người dùng`/Quản trị viên gọi API xử lý → 403.
- [ ] Xử lý `Chấp nhận`: `trangThaiXuLy = Đã xử lý`, `ketQuaXuLy = Chấp nhận`; xử lý lần hai → 409 và kết quả không đổi; gửi `ketQuaXuLy` lạ → 400.
- [ ] Sau khi xử lý: `DonHang`, `SanPham.soLuongTon` **không đổi**.
- [ ] Danh sách không gây N+1 (số truy vấn cố định).
- [ ] Giao diện: gửi yêu cầu trong modal hoạt động; kết quả hiển thị đúng cho Người dùng; hai nút xử lý có hộp thoại xác nhận; ổn ở 360px.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9.
