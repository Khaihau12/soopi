# 01 — BỐI CẢNH CHUNG (đính kèm cho MỌI phiên làm việc với AI)

> File này đi kèm **mọi form F01–F30**. Nó gom các quy ước dùng chung để các form không phải lặp lại.
> Nếu form và file này mâu thuẫn: **form (nhiệm vụ cụ thể) thắng**, nhưng không được vi phạm `AGENTS.md` Mục 8, 9, 10.

---

## 1. Bạn là ai, làm gì

Bạn là AI lập trình viên, xây dựng dự án **Soopi** (sàn thương mại điện tử đa người bán, tiểu luận cuối kỳ) **theo từng đợt**. Mỗi đợt có một form (F01…F30). Chỉ làm đúng phạm vi của form hiện tại.

**Bắt buộc đọc trước khi viết bất kỳ dòng code nào:**

1. `AGENTS.md` (ở thư mục gốc repo) — quy tắc cốt lõi, đặt tên, bất biến nghiệp vụ. Mục 0, 5, 8, 9, 10 là bắt buộc.
2. `docs/Soopi_3_2_1_Thiet_ke_Collection.md` — **nguồn sự thật** cho tên collection, field, kiểu dữ liệu, index.
3. `docs/` báo cáo Soopi (`Soopi_V11_...md`) — nguồn sự thật cho nghiệp vụ. Mỗi form có ghi rõ mục báo cáo liên quan (Bảng 3.x).
4. `02_QUYET_DINH_DA_CHOT.md` — **tất cả quyết định đã chốt** (mã `QĐ-xx`) và **4 thay đổi dữ liệu đã duyệt** (`CR-01..04`, Mục E; CR-04 theo yêu cầu trực tiếp ở F25). Chủ dự án đã chấp nhận hết: **làm theo, không hỏi lại.** Nếu mâu thuẫn với phần cũ trong form thì `02` thắng.
5. Code hiện có trong repo (đọc trước, theo style hiện có).

## 2. Nguyên tắc không đoán (rất quan trọng)

- **Không bịa** field, collection, enum, endpoint nghiệp vụ, quy tắc nghiệp vụ. Mọi thứ phải truy được về: tài liệu Collection, báo cáo, `AGENTS.md`, hoặc một `QĐ-xx` trong file 02.
- Nếu form yêu cầu thứ mà tài liệu và `02` **đều không nêu**: **không dừng chờ hỏi** — chọn phương án **đơn giản nhất, gần tài liệu nhất, không đổi cấu trúc dữ liệu**, làm tiếp, và ghi rõ vào "Giả định đã dùng" của báo cáo cuối.
- Mọi giả định kỹ thuật nhỏ (không đổi nghiệp vụ) phải được **nêu rõ** trong báo cáo cuối.
- Không thêm field ngoài tài liệu Collection (ví dụ không thêm `ngayTao` cho `SanPham`, không thêm `lyDoTuChoi`, không thêm `daDoc` cho `TinNhan`). Cần "sản phẩm mới nhất" thì sắp xếp theo `_id` giảm dần. **Ngoại lệ DUY NHẤT** là các thay đổi đã duyệt ở `02` Mục E (**CR-01**: giá trị `COD`; **CR-02**: unique chỉ mục chat; **CR-03**: `DonHang.ngayHoanThanh`; **CR-04**: `TaiKhoan.phienBanToken` theo yêu cầu trực tiếp ở F25) — làm **đúng nguyên văn**, không mở rộng thêm.
- Không đổi stack, không thêm thư viện ngoài danh sách cho phép ở mục 4.7.

## 3. Tóm tắt dự án (để định hướng, chi tiết xem AGENTS.md)

| Mục | Nội dung |
|---|---|
| Kiến trúc | Theo `AGENTS.md`: MVC + Service Layer, luồng một chiều `Route → Controller → Service → Model → MongoDB` (Frontend ReactJS gọi API REST của Express). Route chỉ khai báo, Controller chỉ điều phối, Service giữ nghiệp vụ, Model không chứa nghiệp vụ |
| Frontend | ReactJS (JavaScript) |
| Backend | Node.js + Express, RESTful API, **CommonJS** (`require`) trừ khi repo đang dùng ES Modules |
| Database | MongoDB **local** (standalone, **không có transaction**), Mongoose, 19 collection |
| Thanh toán | Hai phương thức: **`VNPay`** (sandbox) và **`COD`** (thu tiền khi nhận hàng — CR-01). Đơn 0đ tự động coi là đã thanh toán, không qua cổng |
| Vai trò | `Người dùng`, `Người bán`, `Quản trị viên` (mảng `TaiKhoan.vaiTro`) |
| Đăng nhập | Một trang đăng nhập chung; Quản trị viên được chuyển sang khu vực quản trị riêng |
| Ngoài phạm vi | Giao hàng thật, đơn vị vận chuyển, **hoàn tiền tự động** (đơn đã thanh toán bị hủy chỉ được đánh dấu "cần hoàn tiền thủ công") |

## 4. Quy ước kỹ thuật bổ sung (áp dụng cho TẤT CẢ form — đây là hợp đồng chung)

> Các quy ước dưới đây **không trái** `AGENTS.md`; chúng lấp các chỗ AGENTS để trống để mọi đợt làm việc nhất quán.

### 4.1 Nhóm URL

| Nhóm | Prefix | Quyền |
|---|---|---|
| Công khai / Người dùng | `/api/...` | Công khai hoặc đăng nhập (ghi rõ ở từng endpoint) |
| Người bán | `/api/nguoi-ban/...` | Đăng nhập + `vaiTro.includes('Người bán')` + có cửa hàng |
| Quản trị viên | `/api/quan-tri-vien/...` | Đăng nhập + `vaiTro.includes('Quản trị viên')` |

- Cửa hàng của Người bán **luôn suy ra từ tài khoản đăng nhập** (`req.cuaHang`), không nhận `cuaHangId` từ client để xác định quyền.
- Frontend route dùng cùng tên: `/nguoi-ban/...`, `/quan-tri-vien/...`.

### 4.2 Response và phân trang

```json
{ "success": true,  "message": "Thêm sản phẩm thành công", "data": {} }
{ "success": false, "message": "Không tìm thấy sản phẩm" }
```

- Danh sách có phân trang: `data = { danhSach: [...], phanTrang: { trang, gioiHan, tongSo, tongTrang } }`. Danh sách ngắn không phân trang (ví dụ danh mục): `data = { danhSach: [...] }`.
- Query phân trang: `trang` (mặc định 1), `gioiHan` (mặc định 12, tối đa 50). Hằng số đặt ở `cauHinh.constant.js`.
- Sắp xếp mặc định "mới nhất": `_id` giảm dần (vì nhiều collection không có field ngày tạo). Collection có field ngày thì dùng field đó (`DonHang.ngayTao`, `TinNhan.thoiGianGui`...).
- Mã lỗi: 400 dữ liệu sai, 401 chưa đăng nhập, 403 không đủ quyền/bị khóa, 404 không thấy, 409 xung đột nghiệp vụ, 500 lỗi server. `message` tiếng Việt có dấu, nói rõ **lỗi gì** và **cách sửa**.
- Error middleware chung phải chuyển `CastError` (ID sai) → 400, `ValidationError` → 400, lỗi trùng khóa (`11000`) → 409, và **không** lộ stack/URI/secret.

### 4.3 Đặt tên query/body

- Tên tham số nghiệp vụ: camelCase tiếng Việt không dấu (`tuKhoa`, `danhMucId`, `tuNgay`, `denNgay`, `trangThaiXuLy`).
- Giá trị enum gửi/nhận **đúng chuỗi trong tài liệu, có dấu** (`"Đang kinh doanh"`, `"Chờ xác nhận"`). Backend validate bằng hằng số, không so chuỗi rải rác.
- Ngày gửi lên: chuỗi ISO 8601. `tuNgay`/`denNgay` hiểu theo múi giờ `Asia/Ho_Chi_Minh` (đầu ngày → cuối ngày).

### 4.4 Xác thực

- Đăng nhập thành công → backend tạo JWT (payload chứa id tài khoản và `phienBanToken` theo CR-04, không chứa dữ liệu cá nhân), lưu vào **cookie httpOnly** tên `token` (đúng mô tả biểu đồ hoạt động: "tạo token, lưu cookie").
- Cookie: `httpOnly`, `sameSite: 'lax'`, `secure` khi `NODE_ENV=production`. CORS: `origin = FRONTEND_URL`, `credentials: true`. Frontend gọi API với `credentials: 'include'`.
- **Mỗi request** có xác thực: middleware đọc token → **nạp lại `TaiKhoan` từ DB** (để vai trò mới sau khi được duyệt có hiệu lực ngay, và tài khoản `Bị khóa` bị chặn ngay) → gắn `req.taiKhoan`.
- Kiểm tra vai trò: `req.taiKhoan.vaiTro.includes(VAI_TRO.X)`, **không** dùng `===`.
- Không bao giờ trả `matKhau` (schema `select: false`).

### 4.5 Tiền, ngày, múi giờ

- Tiền: số nguyên VND, không âm. Làm tròn bằng `Math.round` tại **một** hàm duy nhất.
- Lưu `Date` UTC. Nhóm thống kê theo ngày/tháng dùng timezone `Asia/Ho_Chi_Minh`.
- Frontend: `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` và `Intl.DateTimeFormat('vi-VN')`, đặt trong **một** file tiện ích.

### 4.6 Tầng và đặt tên (nhắc lại ngắn)

- Route chỉ khai báo; Controller chỉ nhận/trả + `next(loi)`; Service chứa nghiệp vụ; Service **không** nhận `req/res`.
- File: `sanPham.route.js`, `sanPham.controller.js`, `sanPham.service.js`, `sanPham.model.js`, `sanPham.api.js` (frontend).
- Service gọi thẳng Mongoose Model. Không DAO/Repository. Lỗi nghiệp vụ: `throw taoLoi(statusCode, message)`.
- Hàm service đặt tên động từ + danh từ nghiệp vụ: `layDanhSachSanPham`, `taoDonHang`, `capNhatTrangThaiDonHang`.
- **Quy ước theo nhóm quyền (chốt ở F08, áp dụng cả dự án):** một service + một controller cho mỗi domain; hàm dành cho nhóm quyền khác công khai có tiền tố nhóm (`quanTri...`, `nguoiBan...`); **một file route cho mỗi nhóm quyền** (`danhMuc.route.js`, `quanTriVienDanhMuc.route.js`, `nguoiBanSanPham.route.js`), mỗi file gắn middleware quyền ở đầu rồi trỏ về cùng controller. Nếu repo đã có cách khác đang chạy thì giữ cách đó và dùng nhất quán.

### 4.7 Thư viện được phép (ngoài danh sách này: phải hỏi)

| Phía | Được dùng | Lý do |
|---|---|---|
| Backend | `express`, `mongoose`, `dotenv`, `cors`, `cookie-parser`, `jsonwebtoken`, `bcryptjs`, `multer` (chỉ F12) | Khung chuẩn của stack; cookie/JWT theo mô tả báo cáo; `multer` để tải ảnh sản phẩm/banner lên local |
| Backend dev | `nodemon` (nếu repo đã dùng) | Chạy dev |
| Frontend | `react`, `react-dom`, `react-router-dom`; **`recharts`** (chỉ cho biểu đồ thống kê ở F26, F27) | Router cho `pages/` theo route; `recharts` giúp vẽ biểu đồ cột/đường, tooltip, responsive bằng ít mã (`QĐ-11` phiên bản 2) |
| Không dùng | Redux/Zustand/React Query, axios (dùng `fetch`), UI kit (MUI/Ant/Chakra), thư viện biểu đồ **khác `recharts`**, moment/dayjs, TypeScript | AGENTS Mục 2, 12; Socket.IO dùng riêng cho thông báo chat theo `QĐ-19` |

VNPay: dùng `crypto` có sẵn của Node, **không** thêm thư viện.

## 5. Quy tắc "không hard-code" (nhưng vẫn đơn giản)

Hard-code = nhét giá trị cấu hình/nghiệp vụ trực tiếp rải rác trong code. Cách đúng:

**Backend**

| Loại giá trị | Đặt ở đâu |
|---|---|
| Secret, URI, key, URL | `.env` (có `.env.example` chỉ chứa placeholder) |
| Tên vai trò, mọi enum trạng thái | `constants/vaiTro.constant.js`, `constants/trangThai.constant.js` (chuỗi đúng tài liệu, có dấu) |
| Số liệu nghiệp vụ: phí vận chuyển mô phỏng, hạn 24 giờ, độ dài mật khẩu tối thiểu, `gioiHan` mặc định, chu kỳ quét hết hạn | `constants/cauHinh.constant.js` |

**Frontend**

| Loại giá trị | Đặt ở đâu |
|---|---|
| URL API gốc | biến môi trường của build tool (Vite: `VITE_API_URL`), đọc ở **một** file `services/httpClient.js` |
| Đường dẫn route | `utils/hangSo.js` → `DUONG_DAN` |
| Nhãn hiển thị enum, màu huy hiệu theo trạng thái | `utils/hangSo.js` (một bảng ánh xạ), không viết `if (trangThai === '...')` rải rác |
| Định dạng tiền/ngày | `utils/dinhDang.js` (`dinhDangTien`, `dinhDangNgay`, `dinhDangNgayGio`) |
| Màu, cỡ chữ, khoảng cách, bo góc | CSS variables (design tokens) ở `src/index.css` — **không** viết mã màu trực tiếp trong component |
| Số phân trang | `utils/hangSo.js` |

> Chỉ tách thành hằng số khi giá trị là **quy tắc nghiệp vụ/cấu hình** hoặc **dùng từ 2 nơi trở lên**. Không tạo lớp cấu hình phức tạp.

## 6. Nguyên tắc UI/UX chung (chi tiết hệ thống thiết kế nằm ở F03)

Giao diện phải **hiện đại, gọn, dễ dùng**, giống trải nghiệm các sàn TMĐT phổ biến (báo cáo tham khảo Shopee/Lazada/Tiki) nhưng **không sao chép nhận diện** của họ.

1. **Mobile-first, responsive** (≥ 360px). Bảng dữ liệu trên màn hình nhỏ chuyển thành danh sách thẻ.
2. **Mỗi màn hình một việc chính.** Hành động chính (nút chính) chỉ có một, đặt dễ thấy.
3. **Đủ 4 trạng thái** cho mọi màn gọi API: đang tải (skeleton), rỗng (có lời mời hành động), lỗi (nói rõ + nút thử lại), thành công (toast ngắn).
4. **Form:** nhãn rõ, lỗi hiện ngay dưới ô nhập bằng tiếng Việt, nút gửi bị khóa + hiện trạng thái khi đang gửi (chống bấm đúp).
5. **Hành động nguy hiểm** (xóa, khóa tài khoản, phê duyệt/từ chối) luôn qua hộp thoại xác nhận (báo cáo yêu cầu "sau khi thao tác được xác nhận").
6. **Văn bản giao diện:** nút nêu đúng việc sẽ xảy ra ("Lưu thay đổi", "Đặt hàng", không "Submit"); cùng một hành động giữ cùng một tên xuyên suốt; lỗi không xin lỗi dài dòng, nói rõ cách sửa; câu chữ ngắn, đời thường.
7. **Tránh dấu hiệu "giao diện sinh tự động":** không gradient trang trí, không mũi tên "→" gắn vào mọi nút/liên kết, không nhãn IN HOA giãn chữ phía trên mọi tiêu đề, không dùng cùng một bo góc + cùng một bóng cho mọi thứ.
8. **Dồn sự chú ý vào một chỗ:** ảnh sản phẩm + giá là nhân vật chính; phần còn lại giữ yên tĩnh.
9. **Truy cập:** focus nhìn thấy được, tương phản chữ đủ, vùng bấm ≥ 44px trên mobile, `alt` cho ảnh, tôn trọng `prefers-reduced-motion`. Chuyển động chỉ để phản hồi hành động của người dùng.
10. **Bộ lọc/tìm kiếm** lưu trên URL query để chia sẻ và bấm Back không mất trạng thái.

## 7. Quy trình bắt buộc cho MỖI form

1. Đọc mục "Đọc trước" của form + các `QĐ-xx` được nhắc.
2. Đọc code hiện có (cấu trúc, cách đặt tên, cách xử lý lỗi/auth đang dùng). **Theo code đang chạy** nếu không trái bất biến AGENTS Mục 8–10.
3. Lập kế hoạch ngắn (liệt kê file sẽ tạo/sửa) rồi làm theo thứ tự: Model → Service → Controller → Route → middleware → frontend `.api.js` → Page/Component.
4. Tự kiểm tra các "Tiêu chí hoàn thành" của form: trường hợp thành công, lỗi, **sai quyền**.
5. Chạy **script có thật** trong `package.json` (lint/test/build). Không bịa script. Nếu không có script nào, nói rõ và kiểm tra thủ công (ghi lại các lệnh `curl`/thao tác đã thử).
6. Không refactor ngoài phạm vi. Không đụng file không liên quan.

## 8. Khi gặp điều chưa rõ

- Có `QĐ-xx` tương ứng → dùng đúng quyết định trong `02` (đã chốt, **không hỏi lại**).
- Không có → chọn phương án đơn giản, gần tài liệu nhất, không đổi cấu trúc dữ liệu; **ghi vào "Giả định đã dùng"** và làm tiếp. Không tự bịa field/collection/enum mới.

## 9. Mẫu báo cáo cuối (bằng tiếng Việt, ngắn gọn)

```
## Báo cáo F__
1. Đã làm: (danh sách tính năng/endpoint)
2. File đã tạo/sửa: (liệt kê đường dẫn)
3. Lệnh đã chạy + kết quả: (lint/test/build/curl)
4. Giả định đã dùng: (nếu có)
5. Chưa kiểm tra được / còn thiếu: (nếu có)
6. Vấn đề cần chủ dự án biết: (chỉ khi thật sự cần một quyết định mới; mặc định mọi thứ đã chốt ở `02`)
7. Việc ảnh hưởng form sau: (nếu có)
```

## 10. Bảng hợp đồng API tổng (nguồn chung để các đợt khớp nhau)

> Chi tiết body/response/quy tắc nằm trong form tương ứng. Đừng đổi URL/method ở bảng này khi chưa hỏi.

| Nhóm | Method + URL | Quyền | Form |
|---|---|---|---|
| Xác thực | `POST /api/xac-thuc/dang-ky`, `POST /dang-nhap`, `POST /dang-xuat`, `GET /toi` | công khai / đăng nhập | F06 |
| Xác thực | `POST /api/xac-thuc/quen-mat-khau`, `POST /dat-lai-mat-khau` | công khai | F28 |
| Hồ sơ | `GET, PATCH /api/tai-khoan/ho-so`; **`PATCH /api/tai-khoan/doi-mat-khau`** (đổi mật khẩu — `QĐ-24`) | đăng nhập (mọi vai trò) | F07 |
| Danh mục | `GET /api/danh-muc` | công khai | F08 |
| Danh mục (admin) | `GET, POST /api/quan-tri-vien/danh-muc`, `PATCH, DELETE /:id` | admin | F08 |
| Sản phẩm | `GET /api/san-pham` (có `khuyenMaiId` từ F13), `GET /api/san-pham/:id` | công khai | F09, F13 |
| Banner | `GET /api/banner-quang-cao` (chỉ `Kích hoạt`) | công khai | F09 |
| Đăng ký bán | `POST /api/yeu-cau-dang-ky-nguoi-ban`, `GET /cua-toi` | đăng nhập | F10 |
| Duyệt bán (admin) | `GET /api/quan-tri-vien/yeu-cau-dang-ky-nguoi-ban`, `GET /:id`, `PATCH /:id/xet-duyet` | admin | F10 |
| Cửa hàng (bán) | `GET, PATCH /api/nguoi-ban/cua-hang` | người bán | F11 |
| Tải ảnh | `POST /api/tep-tin/hinh-anh` | người bán / admin | F12 |
| Sản phẩm (bán) | `GET, POST /api/nguoi-ban/san-pham`; `GET, PATCH, DELETE /:id`; `PATCH /:id/ton-kho` | người bán | F12 |
| Khuyến mãi | `GET /api/khuyen-mai` (đang hiệu lực) | công khai | F13 |
| Khuyến mãi (bán) | `GET, POST /api/nguoi-ban/khuyen-mai`; `GET, PATCH, DELETE /:id` | người bán | F13 |
| Khuyến mãi (admin) | `GET, POST /api/quan-tri-vien/khuyen-mai`; `GET, PATCH, DELETE /:id`; `PATCH /:id/vo-hieu-hoa` | admin | F13 |
| Voucher | `GET /api/voucher` (đang dùng được; `cuaHangId?`) | công khai | F14 |
| Voucher (bán) | `GET, POST /api/nguoi-ban/voucher`; `GET, PATCH, DELETE /:id`; `PATCH /:id/trang-thai` | người bán | F14 |
| Voucher (admin) | `GET, POST /api/quan-tri-vien/voucher`; `GET, PATCH, DELETE /:id`; `PATCH /:id/trang-thai` | admin | F14 |
| Giỏ hàng | `GET /api/gio-hang`; `POST /chi-tiet`; `PATCH /chi-tiet/:id`; `DELETE /chi-tiet/:id`; `PATCH /chon` | đăng nhập | F15 |
| Đặt hàng | `POST /api/don-hang/xem-truoc` (F16); `POST /api/don-hang` (F17) | đăng nhập | F16, F17 |
| Thanh toán | `POST /api/giao-dich-thanh-toan/vnpay/tao-thanh-toan` (F17); `GET /vnpay/ket-qua` (F18, VNPay chuyển về); `GET /api/giao-dich-thanh-toan/:id` (F18) | đăng nhập / công khai (`ket-qua`) | F17, F18 |
| Đơn hàng (user) | `GET /api/don-hang`; `GET /api/don-hang/:id` (F19); **`PATCH /api/don-hang/:id/huy`** (hủy đơn — F30) | đăng nhập (chủ đơn) | F19, F30 |
| Đơn hàng (bán) | `GET /api/nguoi-ban/don-hang`; `GET /:id`; **`PATCH /api/don-hang/:id/trang-thai`** (đường dẫn mặc định của AGENTS Mục 6; chỉ vai trò Người bán) | người bán | F20 |
| Đánh giá | `GET /api/danh-gia?sanPhamId=` (công khai); `GET /api/danh-gia/co-the-danh-gia?sanPhamId=`; `POST /api/danh-gia` | công khai / đăng nhập | F21 |
| Đánh giá (bán) | `GET /api/nguoi-ban/danh-gia` | người bán | F21 |
| Đổi trả/khiếu nại | `POST, GET /api/doi-tra-khieu-nai`; `GET /:id` | đăng nhập (chủ yêu cầu) | F22 |
| Đổi trả (bán) | `GET /api/nguoi-ban/doi-tra-khieu-nai`; `GET /:id`; `PATCH /:id/xu-ly` | người bán | F22 |
| Trao đổi | `GET, POST /api/cuoc-tro-chuyen`; `GET, POST /api/cuoc-tro-chuyen/:id/tin-nhan`; `GET /api/nguoi-ban/cuoc-tro-chuyen` | đăng nhập (thành viên) / người bán | F23 |
| Admin tài khoản | `GET /api/quan-tri-vien/tai-khoan`; `GET /:id`; `PATCH /:id/trang-thai`; `PATCH /:id/mat-khau` | admin | F24 |
| Admin cửa hàng | `GET /api/quan-tri-vien/cua-hang`; `PATCH /:id/trang-thai` | admin | F24 |
| Admin giao dịch | `GET /api/quan-tri-vien/giao-dich-thanh-toan`; `GET /:id` | admin | F25 |
| Admin sản phẩm | `GET /api/quan-tri-vien/san-pham`; `GET /:id`; `PATCH /:id/trang-thai` | admin | F25 |
| Admin banner | `GET, POST /api/quan-tri-vien/banner-quang-cao`; `PATCH, DELETE /:id`; `PATCH /:id/trang-thai` | admin | F25 |
| Thống kê (bán) | `GET /api/nguoi-ban/thong-ke/tong-quan`, `/doanh-thu`, `/san-pham-ban-chay`, `/lich-su-giao-dich` | người bán | F26 |
| Thống kê (admin) | `GET /api/quan-tri-vien/thong-ke/tong-quan`, `/doanh-thu`, `/san-pham-ban-chay`, `/danh-muc-quan-tam`, `/hieu-suat-nguoi-ban` | admin | F27 |
