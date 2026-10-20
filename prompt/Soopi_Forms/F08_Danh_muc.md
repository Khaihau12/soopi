# FORM F08 — DANH MỤC SẢN PHẨM (công khai + quản trị)

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F03, F04, F06.

## 1. Mục tiêu

- Công khai: lấy danh sách danh mục (dùng để lọc sản phẩm, chọn danh mục khi đăng sản phẩm).
- Quản trị viên: thêm, sửa, xóa danh mục trong khu quản trị.

## 2. Nguồn nghiệp vụ

- Báo cáo **Bảng 3.21** (phần danh mục). Collection **Bảng 3.28** (`DanhMuc`: chỉ có `tenDanhMuc`).
- `AGENTS.md` Mục 8 (Xóa dữ liệu). `02`: **`QĐ-14`** (danh mục còn sản phẩm → chặn xóa), `QĐ-22`.

## 3. Quy ước đặt tên route/controller/service theo nhóm quyền (áp dụng cho cả dự án từ form này)

- **Một service + một controller cho mỗi domain** (`danhMuc.service.js`, `danhMuc.controller.js`).
- Hàm dành cho nhóm quyền khác công khai có **tiền tố nhóm**: `quanTri...` (Quản trị viên), `nguoiBan...` (Người bán). Ví dụ `quanTriTaoDanhMuc`.
- **Một file route cho mỗi nhóm quyền**: `danhMuc.route.js` (công khai), `quanTriVienDanhMuc.route.js` (Quản trị viên), sau này `nguoiBanSanPham.route.js`... Mỗi file gắn middleware quyền ở đầu (`router.use(batBuocDangNhap, batBuocVaiTro(...))`) rồi trỏ về cùng controller.
- Prefix gắn trong `routes/index.js`: `/api/danh-muc`, `/api/quan-tri-vien/danh-muc`.

## 4. API

| Method + URL | Quyền | Body / Query | Kết quả |
|---|---|---|---|
| `GET /api/danh-muc` | công khai | — | `data.danhSach` = mảng `{ _id, tenDanhMuc }`, sắp theo tên tăng dần (dùng `collation` locale `vi` để sắp đúng tiếng Việt) |
| `GET /api/quan-tri-vien/danh-muc` | Quản trị viên | — | `data.danhSach` = mảng `{ _id, tenDanhMuc, soSanPham }` |
| `POST /api/quan-tri-vien/danh-muc` | Quản trị viên | `tenDanhMuc` | **201**, `data.danhMuc` |
| `PATCH /api/quan-tri-vien/danh-muc/:id` | Quản trị viên | `tenDanhMuc` | 200, `data.danhMuc` |
| `DELETE /api/quan-tri-vien/danh-muc/:id` | Quản trị viên | — | 200 |

(Danh sách này **không phân trang** vì số danh mục ít; dùng dạng `data.danhSach` không có `phanTrang`.)

## 5. Quy tắc nghiệp vụ và ràng buộc

1. `tenDanhMuc`: bắt buộc, `trim`, không rỗng, ≤ `DO_DAI_TOI_DA.TEN_DANH_MUC` (thêm hằng số = **100**).
2. **Không trùng tên** (không phân biệt hoa/thường, đã `trim`) → 409 "Danh mục này đã tồn tại". *(Giả định kỹ thuật nhỏ vì tài liệu không đặt unique; nêu trong báo cáo cuối. Không thêm unique index.)*
3. **Xóa (`QĐ-14`):** nếu còn **bất kỳ** `SanPham` có `danhMucId` = danh mục này → **409** "Danh mục đang có N sản phẩm nên không thể xóa. Hãy chuyển các sản phẩm sang danh mục khác trước." và **không xóa**. Chưa có sản phẩm → xóa cứng. **Không thêm field trạng thái** cho `DanhMuc`.
4. Sửa/xóa `:id` không tồn tại → 404.
5. `soSanPham` tính bằng một truy vấn nhóm (`aggregate` theo `danhMucId`), **không** lặp truy vấn trong vòng `for` (tránh N+1).

## 6. Backend — file cần tạo/sửa

`routes/danhMuc.route.js`, `routes/quanTriVienDanhMuc.route.js`, `controllers/danhMuc.controller.js`, `services/danhMuc.service.js`; gắn vào `routes/index.js`; thêm hằng số vào `cauHinh.constant.js`.

## 7. Frontend

- `services/danhMuc.api.js`: `layDanhSachDanhMuc` (công khai), `quanTriLayDanhSachDanhMuc`, `quanTriThemDanhMuc`, `quanTriSuaDanhMuc`, `quanTriXoaDanhMuc`.
- `pages/quanTriVien/DanhMucQuanTriPage.jsx` — route `/quan-tri-vien/danh-muc` (nằm trong nhóm route đã bảo vệ ở F06).

**Màn hình quản trị** (trong `QuanTriVienLayout`):
- `PageHeader`: tiêu đề "Danh mục sản phẩm" + nút chính **"Thêm danh mục"**.
- `DataTable`: cột *Tên danh mục*, *Số sản phẩm*, *Thao tác* (nút "Sửa", nút "Xóa" dạng ghost/danger). Mobile tự chuyển thành thẻ.
- **Thêm/Sửa** mở `Modal` chỉ có một `Field` "Tên danh mục" (focus sẵn vào ô), nút "Lưu" và "Hủy"; lỗi 400/409 hiện ngay dưới ô.
- **Xóa** mở `ConfirmDialog` ("Xóa danh mục 'X'? Thao tác này không thể hoàn tác."). Nếu server trả 409 (còn sản phẩm) → hiển thị đúng thông báo của server trong hộp thoại/toast, danh sách giữ nguyên.
- Nút "Xóa" của dòng có `soSanPham > 0` vẫn bấm được nhưng hộp thoại ghi rõ lý do sẽ bị chặn (không ẩn nút để người dùng hiểu vì sao).
- Trạng thái tải (`Skeleton`), rỗng (`EmptyState` "Chưa có danh mục nào" + nút "Thêm danh mục"), lỗi (`ErrorState`).
- Sau mỗi thao tác thành công: toast ngắn + tải lại danh sách.
- Thêm mục "Danh mục" vào `MENU_QUAN_TRI_VIEN` nếu chưa có.

## 8. Không được làm

- Không thêm `trangThai`, `moTa`, `hinhAnh`, danh mục cha–con cho `DanhMuc`.
- Không xóa cứng khi còn sản phẩm; không tự chuyển sản phẩm sang danh mục khác.
- Không cho Người dùng/Người bán gọi các API `quan-tri-vien`.

## 9. Tiêu chí hoàn thành

- [ ] Công khai gọi `GET /api/danh-muc` được khi chưa đăng nhập.
- [ ] Tài khoản `Người dùng` gọi `POST /api/quan-tri-vien/danh-muc` → 403; chưa đăng nhập → 401.
- [ ] Thêm trùng tên (khác hoa/thường) → 409; tên rỗng → 400.
- [ ] Xóa danh mục có sản phẩm → 409 và dữ liệu không đổi; xóa danh mục trống → thành công.
- [ ] `:id` sai định dạng → 400; không tồn tại → 404.
- [ ] Giao diện: thêm/sửa/xóa chạy trọn vẹn, đủ 4 trạng thái, dùng được bằng bàn phím, ổn ở 360px.

## 10. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Nêu rõ giả định "không trùng tên danh mục".
