# FORM F01 — NỀN TẢNG BACKEND

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt).
> **Phụ thuộc:** không. **Làm đầu tiên.**

## 1. Mục tiêu

Dựng **khung backend chạy được** theo MVC + Service Layer: khởi động server, kết nối MongoDB local, middleware chung, xử lý lỗi thống nhất, hằng số nền, tiện ích dùng chung. **Chưa** có model nghiệp vụ, chưa có đăng nhập.

## 2. Đọc trước

- `AGENTS.md`: Mục 0, 3, 4, 5.5, 6 (Response), 11, 13.
- `01_BOI_CANH_CHUNG.md`: Mục 4.2, 4.4, 4.5, 5.
- `02`: `QĐ-09`, `QĐ-22`.

## 3. Bước 0 — Khảo sát repo (bắt buộc)

Kiểm tra `backend/` đã có gì: `package.json`, `app.js`, `server.js`, kiểu module (`require` hay `import`), thư viện đã cài, script hiện có.
- **Đã có** → giữ nguyên cách làm hiện tại, chỉ bổ sung phần còn thiếu theo form này, không đổi kiểu module.
- **Chưa có** → khởi tạo mới bằng **CommonJS**.

## 4. Việc cần làm

### 4.1 Cấu trúc (chỉ tạo thư mục sẽ có file)

```text
backend/
├── app.js            # tạo express app, gắn middleware + route
├── server.js         # đọc env, kết nối DB, listen
├── .env.example
└── src/
    ├── config/database.js
    ├── routes/index.js              # gom route, gắn prefix /api   ← API Routes
    ├── routes/kiemTra.route.js      # route mẫu: GET /kiem-tra
    ├── controllers/kiemTra.controller.js   # ← Controller: nhận req, gọi service, trả JSON
    ├── services/kiemTra.service.js         # ← logic nghiệp vụ (ở đây: đọc tình trạng kết nối CSDL)
    ├── middlewares/error.middleware.js
    ├── constants/vaiTro.constant.js
    ├── constants/cauHinh.constant.js
    └── utils/taoLoi.js, phanTrang.js
```

> Thư mục `models/` (khối **Model**) sẽ được tạo ở **F04** khi có file thật. Thứ tự luồng một chiều: `Route → Controller → Service → Model → MongoDB`.

### 4.2 `config/database.js`
- Kết nối bằng `process.env.MONGODB_URI` (ví dụ giá trị mẫu `mongodb://127.0.0.1:27017/soopi`). **Không** Atlas.
- Kết nối lỗi → ghi log rõ ràng rồi dừng tiến trình (không chạy server khi chưa có DB).

### 4.3 `app.js`
- `cors({ origin: process.env.FRONTEND_URL, credentials: true })`, `express.json()`, `cookie-parser`.
- Route kiểm tra **đi qua đủ ba tầng** để làm mẫu kiến trúc: `routes/kiemTra.route.js` → `controllers/kiemTra.controller.js` → `services/kiemTra.service.js`. `GET /api/kiem-tra` → `{ success: true, message: "Soopi API đang hoạt động", data: { coSoDuLieu: "Đã kết nối" | "Chưa kết nối" } }` (service đọc `mongoose.connection.readyState`). Route chỉ khai báo; controller chỉ gọi service và trả JSON; service không nhận `req/res`.
- Gắn `routes/index.js` ở prefix `/api` (các form sau sẽ thêm từng route vào đây).
- Cuối cùng: handler **404 JSON** cho route không tồn tại, rồi **error middleware**.

### 4.4 `server.js`
- `require('dotenv').config()` trước mọi thứ dùng env.
- Kiểm tra biến bắt buộc `PORT`, `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`; thiếu → báo rõ **tên biến thiếu** (không in giá trị) rồi dừng.
- Kết nối DB xong mới `listen`.

### 4.5 `error.middleware.js`
Một nơi duy nhất trả lỗi, đúng `01` Mục 4.2:
- Lỗi có `statusCode` (từ `taoLoi`) → trả đúng status + `message`.
- `CastError` → 400 "ID không hợp lệ".
- `ValidationError` (Mongoose) → 400, gom message tiếng Việt.
- Lỗi trùng khóa `code 11000` → 409 "Dữ liệu đã tồn tại".
- Còn lại → 500 "Lỗi hệ thống. Vui lòng thử lại sau." — **log chi tiết ở server, không trả stack/URI/secret** cho client.

### 4.6 Hằng số và tiện ích
- `vaiTro.constant.js`: `VAI_TRO = { NGUOI_DUNG: 'Người dùng', NGUOI_BAN: 'Người bán', QUAN_TRI_VIEN: 'Quản trị viên' }` (đúng chuỗi AGENTS 5.7).
- `cauHinh.constant.js` — **chỉ** các giá trị dùng chung từ F01 trở đi (các form sau tự thêm giá trị của mình, không tạo sẵn hằng số chưa dùng):
  - `PHAN_TRANG = { MAC_DINH: 12, TOI_DA: 50 }`
  - `DO_DAI_MAT_KHAU_TOI_THIEU = 8`, `SO_VONG_BAM_MAT_KHAU = 10`
  - `TEN_COOKIE_TOKEN = 'token'`
  - `REGEX_SO_DIEN_THOAI` (theo `QĐ-22`)
  - `DO_DAI_TOI_DA = { TEN_SAN_PHAM: 200, MO_TA: 5000, DIA_CHI: 500, NOI_DUNG: 1000 }`
- `utils/taoLoi.js`: `taoLoi(statusCode, message)` trả `Error` có `statusCode` (vài dòng).
- `utils/phanTrang.js`: hàm đọc `trang`, `gioiHan` từ query (ép số nguyên, chặn âm, chặn vượt `TOI_DA`) và hàm dựng `phanTrang = { trang, gioiHan, tongSo, tongTrang }`.

### 4.7 Cấu hình dự án
- `.env.example` chỉ có **placeholder**: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV` (hạn token là hằng số nghiệp vụ ở F06, không để trong `.env`).
- `.gitignore` có `.env`, `node_modules`.
- `package.json`: script `start` (và `dev` nếu dùng nodemon). Cài đúng thư viện ở `01` Mục 4.7 (chưa cần `multer`, `jsonwebtoken`, `bcryptjs` nếu form này chưa dùng — cài khi cần ở F06).

## 5. Không được làm

- Không tạo model/route nghiệp vụ.
- Không viết route 404/handler lỗi rải rác ở nhiều file.
- Không để `JWT_SECRET`, URI thật trong code hay `.env.example`.
- Không bịa script trong `package.json`.

## 6. Tiêu chí hoàn thành (tự kiểm tra)

- [ ] `npm run dev` (hoặc `start`) chạy được khi MongoDB local đang bật; tắt MongoDB → báo lỗi rõ và dừng.
- [ ] `GET /api/kiem-tra` trả JSON đúng định dạng, có `data.coSoDuLieu`; tắt MongoDB lúc server đang chạy → trả `Chưa kết nối` (không sập).
- [ ] **Kiến trúc (`AGENTS.md`):** có `app.js`, `server.js`, `routes/`, `controllers/`, `services/`, `config/`, `middlewares/`; route kiểm tra đi đúng luồng Route → Controller → Service; không có logic nghiệp vụ trong route.
- [ ] `GET /api/khong-co` → 404 JSON `{ success:false, message }`.
- [ ] Thiếu biến `.env` bắt buộc → báo tên biến thiếu.
- [ ] Gửi request tới route có `:id` sai định dạng (khi có route ở form sau) → 400, không 500. (Có thể kiểm tra tạm bằng một route thử rồi xóa.)
- [ ] Response lỗi không chứa stack/URI.
- [ ] Preflight CORS từ `FRONTEND_URL` với `credentials` hoạt động.

## 7. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9.
