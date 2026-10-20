# FORM F06 — XÁC THỰC: ĐĂNG KÝ, ĐĂNG NHẬP, ĐĂNG XUẤT, PHÂN QUYỀN

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), `docs/Soopi_3_2_1_Thiet_ke_Collection.md`, báo cáo Soopi.
> **Phụ thuộc:** F01, F02, F03, F04 (model `TaiKhoan`).

## 1. Mục tiêu

Người dùng đăng ký tài khoản, đăng nhập, đăng xuất. Backend có **middleware xác thực** và **middleware phân quyền theo vai trò** dùng cho mọi form sau. Frontend có trạng thái đăng nhập toàn cục, route bảo vệ, trang đăng nhập/đăng ký.

## 2. Nguồn nghiệp vụ

- Báo cáo: **Bảng 3.1** (Đăng nhập), **Bảng 3.2** (Đăng ký); biểu đồ hoạt động đăng nhập ("tạo token, lưu cookie, chuyển về trang chủ"); mục 3.1.2 (Quản trị viên vào khu quản lý riêng).
- `AGENTS.md`: Mục 8 (phân quyền), 10 (mật khẩu/token), 11.
- `02`: `QĐ-08`, `QĐ-09`, `QĐ-22`, `QĐ-24`.

## 3. API

| Method + URL | Quyền | Body | Thành công | Lỗi |
|---|---|---|---|---|
| `POST /api/xac-thuc/dang-ky` | công khai | `email`, `matKhau`, `hoTen`, `soDienThoai?` | **201**, `data.taiKhoan` (không có `matKhau`). **Không** tự đăng nhập | 400 thiếu/sai định dạng; 409 email đã tồn tại |
| `POST /api/xac-thuc/dang-nhap` | công khai | `email`, `matKhau` | 200, đặt cookie `token`, `data.taiKhoan` | 400 thiếu; **401** sai email/mật khẩu; **403** tài khoản bị khóa |
| `POST /api/xac-thuc/dang-xuat` | công khai | — | 200, xóa cookie | — |
| `GET /api/xac-thuc/toi` | đăng nhập | — | 200, `data.taiKhoan` hiện tại | 401; 403 nếu bị khóa |

`data.taiKhoan` chỉ gồm: `_id, email, hoTen, ngaySinh, gioiTinh, soDienThoai, diaChiNhanHang, vaiTro, trangThaiTaiKhoan`.

## 4. Quy tắc nghiệp vụ và ràng buộc (backend)

1. **Đăng ký:** bắt buộc `email`, `matKhau`, `hoTen` (`QĐ-22`). Email chuẩn hóa `trim + lowercase` và đúng định dạng; `matKhau` ≥ `DO_DAI_MAT_KHAU_TOI_THIEU`; `soDienThoai` (nếu có) theo `REGEX_SO_DIEN_THOAI`.
2. **Chống gán quyền trái phép:** bỏ qua mọi `vaiTro`, `trangThaiTaiKhoan` gửi trong body. Tài khoản đăng ký luôn có `vaiTro = ['Người dùng']`, `trangThaiTaiKhoan = 'Hoạt động'`.
3. **Mật khẩu:** băm bằng `bcryptjs` (`SO_VONG_BAM_MAT_KHAU`) **trong service**; không lưu plaintext, không MD5, không log mật khẩu, không trả `matKhau` ở bất kỳ response nào.
4. **Đăng nhập:** thông báo sai email **và** sai mật khẩu phải **giống nhau**: "Email hoặc mật khẩu không chính xác" (không lộ email nào tồn tại). Chỉ khi thông tin **chính xác** mà tài khoản `Bị khóa` mới trả 403 "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên" (đúng Bảng 3.1).
5. **Token:** JWT, payload **chỉ** `{ taiKhoanId }`, ký bằng `JWT_SECRET`. Hạn dùng bằng hằng số `SO_NGAY_HET_HAN_TOKEN = 7` (đặt ở `cauHinh.constant.js`; dùng **cùng** giá trị cho `expiresIn` và `maxAge` cookie).
6. **Cookie** `token` (tên lấy từ `TEN_COOKIE_TOKEN`): `httpOnly: true`, `sameSite: 'lax'`, `secure: process.env.NODE_ENV === 'production'`. Đăng xuất xóa cookie bằng **đúng** các tùy chọn đó.
7. **Middleware `batBuocDangNhap`** (`auth.middleware.js`), chạy ở **mỗi** request cần đăng nhập:
   - Không có cookie / token sai / hết hạn → 401 "Vui lòng đăng nhập để tiếp tục".
   - **Nạp lại `TaiKhoan` từ DB** theo `taiKhoanId`; không còn → 401; `Bị khóa` → 403 "Tài khoản của bạn đã bị khóa".
   - Gắn `req.taiKhoan` (document đã nạp, không có `matKhau`).
8. **Middleware `batBuocVaiTro(...cacVaiTro)`** (`role.middleware.js`): đúng nếu `req.taiKhoan.vaiTro` **chứa ít nhất một** vai trò yêu cầu (`includes`/`some`, **không** `===`); sai → 403 "Bạn không có quyền thực hiện chức năng này". Dùng hằng số `VAI_TRO`.
   > Middleware kiểm tra "Người bán có cửa hàng" (`req.cuaHang`) làm ở F11, không làm ở đây.
9. **Tài khoản Quản trị viên đầu tiên (`QĐ-08`):** tạo script `backend/scripts/taoQuanTriVien.js` + script npm `seed:admin`. Đọc `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_HO_TEN` từ `.env` (thêm placeholder vào `.env.example`), tạo `TaiKhoan` với `vaiTro = ['Quản trị viên']`. Chạy lại nhiều lần không tạo trùng (nếu email đã có thì báo "đã tồn tại" và thoát bình thường). Không in mật khẩu ra console.
10. Lỗi trùng email: kiểm tra trước (409 "Email này đã được đăng ký") **và** vẫn xử lý lỗi `11000` do race condition.

**Cần cài thêm (đã được phép ở `01` Mục 4.7):** `jsonwebtoken`, `bcryptjs`.

## 5. Backend — file cần tạo/sửa

`routes/xacThuc.route.js`, `controllers/xacThuc.controller.js`, `services/xacThuc.service.js`, `middlewares/auth.middleware.js`, `middlewares/role.middleware.js`, `scripts/taoQuanTriVien.js`; gắn route vào `routes/index.js`; bổ sung `cauHinh.constant.js` (`SO_NGAY_HET_HAN_TOKEN`), `.env.example` (`ADMIN_*`), `package.json` (script `seed:admin`).

Thứ tự hàm trong service gợi ý: `dangKyTaiKhoan`, `dangNhap` (trả về `{ taiKhoan, token }`; controller đặt cookie), `layThongTinTaiKhoan`.

## 6. Frontend

### 6.1 Trạng thái đăng nhập
- `services/xacThuc.api.js`: `dangKy`, `dangNhap`, `dangXuat`, `layThongTinToi`.
- `hooks/XacThucContext.jsx`: Provider + hook `useXacThuc()` trả `{ taiKhoan, dangTai, dangNhap, dangXuat, capNhatTaiKhoan, coVaiTro }`.
  - Khi mở app gọi `GET /xac-thuc/toi` **một lần**; 401 là bình thường (khách) → `taiKhoan = null`, không hiện lỗi.
  - Đăng ký `dangKyXuLyHetPhien` (F02): khi API trả 401 giữa phiên → đặt `taiKhoan = null` (và chuyển về đăng nhập nếu đang ở trang bảo vệ).
  - `coVaiTro(vaiTro)` dùng `includes`.
- Bọc `App` bằng provider (cùng `ThongBaoProvider` của F03).

### 6.2 Route bảo vệ
- `components/BaoVeRoute.jsx`: nhận prop `vaiTro?`.
  - Đang kiểm tra phiên → hiện skeleton toàn trang (không nháy sang trang đăng nhập).
  - Chưa đăng nhập → chuyển `/dang-nhap`, lưu trang đang xem vào `state.quayLai`.
  - Thiếu vai trò → trang `KhongCoQuyenPage` (403, tiếng Việt, nút về trang chủ).
- Gắn vào `App.jsx`: nhóm route `/nguoi-ban/*` (cần `Người bán`, dùng `NguoiBanLayout`) và `/quan-tri-vien/*` (cần `Quản trị viên`, dùng `QuanTriVienLayout`). Các trang con do form sau thêm.

### 6.3 Trang `DangNhapPage`, `DangKyPage`
Bố cục: nền `--nen`, một thẻ giữa màn hình rộng tối đa 420px, chữ "Soopi" phía trên (liên kết về trang chủ). Không dùng `UserLayout`.

| | Đăng nhập | Đăng ký |
|---|---|---|
| Trường | Email, Mật khẩu | Họ tên, Email, Số điện thoại (không bắt buộc), Mật khẩu, Nhập lại mật khẩu (**chỉ kiểm tra ở frontend**) |
| Nút chính (một nút) | **Đăng nhập** | **Tạo tài khoản** |
| Liên kết phụ | "Chưa có tài khoản? Đăng ký" | "Đã có tài khoản? Đăng nhập" |
| Sau khi thành công | Quản trị viên → `/quan-tri-vien`; còn lại → `state.quayLai` nếu có, ngược lại `/` | Chuyển `/dang-nhap`, toast "Đăng ký thành công. Hãy đăng nhập.", điền sẵn email |

UX bắt buộc: nhãn trên ô nhập (không dùng placeholder thay nhãn); nút hiện/ẩn mật khẩu (có `aria-label`); thuộc tính `autoComplete` đúng (`email`, `current-password`, `new-password`, `name`, `tel`); kiểm tra khi rời ô và khi gửi, lỗi hiện dưới ô, **focus vào ô lỗi đầu tiên**; lỗi từ server (401/403/409) hiện ở khối cảnh báo trên nút (`role="alert"`); Enter để gửi; nút khóa khi đang gửi. Đã đăng nhập mà vào hai trang này → chuyển về `/`.

### 6.4 Header (`UserLayout`)
- Chưa đăng nhập: liên kết "Đăng nhập" + nút "Đăng ký".
- Đã đăng nhập: `DropdownMenu` với `Avatar` + `hoTen`. **Chỉ thêm mục "Đăng xuất" ở form này**; các form sau tự thêm mục menu của mình vào hằng số `MENU_TAI_KHOAN` trong `hangSo.js` (Hồ sơ → F07, Đơn hàng → F19, Trao đổi → F23, Kênh người bán/Đăng ký bán hàng → F10...).
- Thanh trên của `NguoiBanLayout`/`QuanTriVienLayout`: `Avatar` + menu có "Đăng xuất".

## 7. Không được làm

- Không lưu token trong `localStorage`/`sessionStorage` (dùng cookie httpOnly).
- Không tin vai trò gửi từ frontend; không trả `matKhau`.
- Không làm đổi mật khẩu (thuộc **F07**, `QĐ-24`) hay quên mật khẩu (thuộc **F28**) ở form này.
- Không thêm rate limiting, OAuth, refresh token.
- Khi viết hàm đăng xuất/xóa cookie, tách riêng thành hàm dùng lại được (F07 cần xóa cookie sau khi đổi mật khẩu).
- Không hiện liên kết "Quên mật khẩu" ở form này.

## 8. Tiêu chí hoàn thành (kiểm tra cả sai quyền)

- [ ] Đăng ký thành công → `201`, DB có bản ghi `vaiTro=['Người dùng']`, `matKhau` là chuỗi băm (không phải plaintext).
- [ ] Đăng ký email trùng → 409; thiếu `hoTen` → 400; gửi kèm `vaiTro:['Quản trị viên']` → **vẫn** là `['Người dùng']`.
- [ ] Đăng nhập đúng → cookie `token` có cờ `HttpOnly`; `GET /api/xac-thuc/toi` (kèm cookie) → 200.
- [ ] Đăng nhập sai email và sai mật khẩu → **cùng một** thông báo 401.
- [ ] Đổi `trangThaiTaiKhoan` thành `Bị khóa` trực tiếp trong DB → đăng nhập báo 403; và phiên đang đăng nhập gọi `GET /toi` cũng bị 403 (middleware nạp lại DB).
- [ ] Route thử dùng `batBuocVaiTro(VAI_TRO.QUAN_TRI_VIEN)` với tài khoản `Người dùng` → 403; không cookie → 401 (xóa route thử sau khi kiểm tra).
- [ ] `npm run seed:admin` tạo Admin; chạy lần hai không tạo trùng.
- [ ] Frontend: đăng nhập/đăng xuất chạy đúng; tải lại trang vẫn giữ đăng nhập; vào `/nguoi-ban` khi chưa đăng nhập → về `/dang-nhap`, đăng nhập xong quay lại đúng trang; `Người dùng` vào `/nguoi-ban` → trang 403.
- [ ] Form hoạt động bằng bàn phím, hiển thị tốt ở 360px.

## 9. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Ghi rõ nếu repo đã có cơ chế auth khác và bạn đã giữ nguyên (AGENTS Mục 10).
