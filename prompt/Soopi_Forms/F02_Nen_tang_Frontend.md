# FORM F02 — NỀN TẢNG FRONTEND (khung, router, gọi API, tiện ích)

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt).
> **Phụ thuộc:** F01 (để có API gốc). **Chưa** làm giao diện đẹp — phần đó là **F03**.

## 1. Mục tiêu

Dựng **khung ReactJS** để mọi trang sau này cắm vào: router, lớp gọi API dùng chung, tiện ích định dạng, hằng số (đường dẫn, enum), hook tải dữ liệu. Không có logic nghiệp vụ.

## 2. Đọc trước

- `AGENTS.md`: Mục 4 (cấu trúc), 5.2, 12, 13.
- `01_BOI_CANH_CHUNG.md`: Mục 4.2–4.5, 5, 6.
- `02`: `QĐ-11`.
- Cấu trúc frontend phải thể hiện đủ: giao diện (`pages/`, `components/`) · gọi API (`services/httpClient.js` + `*.api.js`) · hiển thị dữ liệu (`hooks/useGoiApi.js`) · sự kiện/form/state (React hooks/Context).

## 3. Bước 0 — Khảo sát `frontend/`

Đã có project React chưa? Build tool là gì (Vite/CRA)? Đã có thư viện UI/CSS nào chưa (Tailwind…)?
- **Đã có** → giữ nguyên build tool và thư viện; chỉ bổ sung phần thiếu. Tên biến môi trường theo build tool (Vite: `VITE_API_URL`; CRA: `REACT_APP_API_URL`).
- **Chưa có** → tạo bằng **Vite + React (JavaScript, không TypeScript)**. Chỉ cài thêm `react-router-dom`.

## 4. Việc cần làm

### 4.1 Cấu trúc (đúng AGENTS Mục 4)

```text
frontend/
├── .env.example                 # VITE_API_URL=http://localhost:3000/api (placeholder)
├── index.html
└── src/
    ├── main.jsx                 # BrowserRouter + render App
    ├── App.jsx                  # khai báo Routes
    ├── index.css                # (F03 sẽ viết tokens; F02 chỉ tạo file trống có chú thích)
    ├── pages/KhongTimThayPage.jsx
    ├── services/httpClient.js
    ├── hooks/useGoiApi.js
    └── utils/hangSo.js, dinhDang.js
```

> Các `components/`, `assets/` sẽ được tạo ở F03 khi có file thật. Không tạo thư mục rỗng.

### 4.2 `index.html`
- `lang="vi"`, `<title>Soopi</title>`, thẻ `viewport` chuẩn mobile.
- (Phông chữ do F03 xử lý.)

### 4.3 `services/httpClient.js` — **một** điểm gọi API duy nhất

Hàm `goiApi(duongDan, { method = 'GET', query, body, formData })`:
- URL gốc lấy từ biến môi trường (xem Bước 0), **không** viết cứng ở chỗ khác.
- `query`: dựng bằng `URLSearchParams`, **bỏ** giá trị `undefined/null/''`.
- `body`: gửi JSON (`Content-Type: application/json`). `formData`: gửi `FormData`, **không** tự đặt `Content-Type` (để trình duyệt tự thêm boundary) — dùng cho tải ảnh ở F12.
- Luôn `credentials: 'include'` (cookie JWT).
- Đọc JSON trả về dạng `{ success, message, data }`. Trả `data` khi thành công. Nếu `success=false` hoặc HTTP lỗi → `throw new LoiApi(message, status)`.
- Lỗi mạng/không parse được → `LoiApi('Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.', 0)`.
- Export `class LoiApi extends Error` (có `status`).
- Export `dangKyXuLyHetPhien(callback)`: khi gặp **401** ở request **không phải** đăng nhập/`/xac-thuc/toi`, gọi callback (F06 sẽ dùng để xóa trạng thái đăng nhập). Không tự `window.location` redirect ở đây.

Quy ước file API từng domain (các form sau tạo): `services/sanPham.api.js` export các hàm như `layDanhSachSanPham(query)`; **component không gọi `fetch` trực tiếp**.

### 4.4 `hooks/useGoiApi.js`

Hook nhỏ, dễ giải thích khi bảo vệ:

```
const { duLieu, dangTai, loi, taiLai } = useGoiApi(() => layDanhSachSanPham(query), [query])
```
- Tự gọi khi mount/đổi phụ thuộc; `dangTai` đúng; `loi` là **chuỗi message tiếng Việt**.
- **Bỏ qua kết quả cũ** nếu đã có lần gọi mới (tránh hiển thị sai khi đổi bộ lọc nhanh) và khi component đã unmount.
- `taiLai()` gọi lại thủ công (nút "Thử lại").
- Không thêm thư viện cache.

### 4.5 `utils/hangSo.js`

Nơi duy nhất chứa hằng số giao diện:

1. **Enum phản chiếu backend** (đúng chuỗi AGENTS Mục 5.7, có dấu): `VAI_TRO`, `TRANG_THAI_TAI_KHOAN`, `TRANG_THAI_YEU_CAU_NGUOI_BAN`, `TRANG_THAI_KINH_DOANH`, `TRANG_THAI_KHUYEN_MAI`, `PHAM_VI_KHUYEN_MAI`, `LOAI_KHUYEN_MAI` (`Giảm giá`, `Flash Sale`), `LOAI_VOUCHER`, `KIEU_GIAM`, `TRANG_THAI_VOUCHER` (`Kích hoạt`, `Vô hiệu hóa`), `TRANG_THAI_THANH_TOAN_DON`, `TRANG_THAI_XU_LY`, `TRANG_THAI_GIAO_DICH`, `KET_QUA_XU_LY`, `LOAI_YEU_CAU` (`Đổi trả`, `Khiếu nại`), `TRANG_THAI_XU_LY_YEU_CAU` (`Chờ xử lý`, `Đã xử lý`), `TRANG_THAI_HOAT_DONG_CUA_HANG` (`Hoạt động`, `Ngừng hoạt động`), `GIOI_TINH`, `TRANG_THAI_BANNER` (`Kích hoạt`, `Vô hiệu hóa`).
2. **`DUONG_DAN`** — toàn bộ route frontend (bản đồ ở Mục 4.6), dạng hằng số/hàm: `DUONG_DAN.SAN_PHAM`, `DUONG_DAN.chiTietSanPham(id)`, `DUONG_DAN.NGUOI_BAN.SAN_PHAM`...
3. `PHAN_TRANG = { MAC_DINH: 12 }`. Chat hiện dùng Socket.IO theo `QĐ-19` cập nhật; không thêm lại hằng số polling.

> Tên hằng đúng quy ước AGENTS: `UPPER_SNAKE_CASE` tiếng Việt không dấu.

### 4.6 Bản đồ route frontend (đặt vào `DUONG_DAN`; **chưa** cần tạo page ngoài trang 404 và trang chủ tạm)

| Nhóm | Đường dẫn | Page (form tạo) |
|---|---|---|
| Công khai | `/` | `TrangChuPage` (F09) |
| | `/san-pham`, `/san-pham/:id` | `DanhSachSanPhamPage`, `ChiTietSanPhamPage` (F09) |
| | `/dang-nhap`, `/dang-ky` | `DangNhapPage`, `DangKyPage` (F06) |
| | `/quen-mat-khau`, `/dat-lai-mat-khau` | (F28) |
| Người dùng | `/gio-hang` | `GioHangPage` (F15) |
| | `/thanh-toan`, `/thanh-toan/ket-qua` | `ThanhToanPage` (F17), `KetQuaThanhToanPage` (F18) |
| | `/don-hang`, `/don-hang/:id` | `DonHangPage`, `ChiTietDonHangPage` (F19) |
| | `/tai-khoan` | `HoSoPage` (F07) |
| | `/doi-tra-khieu-nai` | `DoiTraKhieuNaiPage` (F22) |
| | `/tro-chuyen` | `TroChuyenPage` (F23) |
| | `/dang-ky-nguoi-ban` | `DangKyNguoiBanPage` (F10) |
| Người bán | `/nguoi-ban` (tổng quan), `/nguoi-ban/cua-hang`, `/nguoi-ban/san-pham`, `/nguoi-ban/san-pham/them`, `/nguoi-ban/san-pham/:id/sua`, `/nguoi-ban/khuyen-mai`, `/nguoi-ban/khuyen-mai/them`, `/nguoi-ban/khuyen-mai/:id/sua`, `/nguoi-ban/voucher`, `/nguoi-ban/don-hang`, `/nguoi-ban/don-hang/:id`, `/nguoi-ban/doi-tra-khieu-nai`, `/nguoi-ban/danh-gia`, `/nguoi-ban/tro-chuyen`, `/nguoi-ban/bao-cao` | F11–F14, F20–F23, F26 |
| Quản trị viên | `/quan-tri-vien` (tổng quan), `/quan-tri-vien/tai-khoan`, `/cua-hang`, `/duyet-nguoi-ban`, `/danh-muc`, `/san-pham`, `/giao-dich`, `/banner`, `/khuyen-mai`, `/khuyen-mai/them`, `/khuyen-mai/:id/sua`, `/voucher`, `/bao-cao` | F08, F10, F13, F14, F24, F25, F27 |

### 4.7 `utils/dinhDang.js`
`dinhDangTien(so)` (VND, `vi-VN`), `dinhDangNgay(date)`, `dinhDangNgayGio(date)`, `dinhDangNgayChoInput(date)` (dạng `YYYY-MM-DD` cho `<input type="date">`). Dùng `Intl`, múi giờ `Asia/Ho_Chi_Minh`. Giá trị rỗng/không hợp lệ trả `''`.

Thêm **`taoUrlAnh(duongDan)`**: đường dẫn bắt đầu bằng `/uploads/` → ghép với **gốc (origin) của máy chủ API** (lấy từ biến môi trường URL API, bỏ phần `/api`); URL `http(s)://` giữ nguyên; rỗng → `''`. **Mọi thẻ `<img>` hiển thị ảnh sản phẩm/banner phải dùng hàm này** (ảnh upload nằm ở máy chủ API, không phải ở máy chủ frontend).

### 4.8 `App.jsx`, `main.jsx`
- `main.jsx`: `BrowserRouter`.
- `App.jsx`: chỉ `Routes` với trang chủ tạm (một dòng chữ "Soopi") và `*` → `KhongTimThayPage` (thông báo tiếng Việt + liên kết về trang chủ). Các form sau tự thêm route của mình.

## 5. Không được làm

- Không cài Redux/Zustand/React Query/axios/UI kit.
- Không gọi `fetch` ngoài `httpClient.js`.
- Không viết cứng URL API, đường dẫn route, chuỗi enum ở component.
- Không tạo page cho các form sau.
- Chưa viết CSS giao diện (để F03).

## 6. Tiêu chí hoàn thành

- [ ] `npm run build` thành công (và `lint` nếu có script).
- [ ] `npm run dev` hiển thị trang chủ tạm; đường dẫn lạ hiện trang 404 tiếng Việt.
- [ ] Gọi thử `GET /api/kiem-tra` qua `goiApi` (tạm, trong console hoặc 1 đoạn thử rồi xóa) thành công; tắt backend → nhận `LoiApi` với thông báo tiếng Việt.
- [ ] Không còn mã URL/đường dẫn cứng ngoài `.env`, `httpClient.js`, `hangSo.js`.
- [ ] Chuỗi enum trong `hangSo.js` khớp **từng ký tự** với AGENTS 5.7.

## 7. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9.
