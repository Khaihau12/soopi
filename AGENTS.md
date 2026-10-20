# AGENTS.md — Soopi

> Hướng dẫn cho AI agent (Codex, Claude Code, Cursor...) khi làm việc trong repo này.
> **Đọc Mục 0 trước.** Các mục sau là phần tra cứu chi tiết.
> Nguồn sự thật: field/collection → `.md/Soopi_3.2.1_Thiet_ke_Collection.md`; nghiệp vụ → báo cáo Soopi trong `.md/Soopi_V11_MOI_cap_nhat_activity/`.
> Khi tạo, sửa hoặc đánh giá giao diện frontend, đọc `DESIGN.md` ở gốc project để dùng chung màu, chữ, bố cục và component; tác vụ chỉ liên quan backend không cần đọc file này. Nghiệp vụ vẫn theo tài liệu Soopi và các quy tắc bên dưới.
> Khi cần xác minh cách Codex đọc chỉ dẫn hoặc hoạt động, tra tài liệu OpenAI Docs chính thức trước khi kết luận.

## 0. Quy tắc cốt lõi

1. Luồng backend: `Route → Controller → Service → Model → MongoDB`. Business logic nằm ở **Service**.
2. Backend là nguồn sự thật. Không tin giá, tổng tiền, tồn kho, role, `taiKhoanId`, `cuaHangId` do client gửi.
3. Tên nghiệp vụ = tiếng Việt **không dấu** (`sanPham`, `donHang`). Tên kỹ thuật = tiếng Anh chuẩn (`req`, `controller`, `useState`). Không tạo tên tiếng Anh song song cho cùng khái niệm (`Product`, `getProducts`).
4. Collection `PascalCase` đúng tài liệu (`SanPham`), field `camelCase` (`tenSanPham`). Với Mongoose phải khai báo `collection: 'SanPham'` (xem Mục 5.5).
5. Text hiển thị, `message` của API, comment nghiệp vụ: tiếng Việt **có dấu**. Giá trị enum lưu đúng chuỗi trong tài liệu (có dấu).
6. Thay đổi nhỏ, đúng phạm vi. Không tự đổi stack, thêm thư viện, hay refactor lan rộng.
7. Code đơn giản, phổ biến, sinh viên đọc và giải thích được khi bảo vệ.
8. Không commit hoặc hard-code `.env`, secret, key VNPay.
9. Trước khi kết thúc: chạy script **có thật** trong `package.json` (test/lint/build). Không bịa script.
10. Gặp điều tài liệu chưa quy định (Mục 18): hỏi lại hoặc nêu rõ giả định. Không tự bịa nghiệp vụ.

## 1. Tổng quan dự án

| Mục | Nội dung |
|---|---|
| Dự án | **Soopi** — sàn thương mại điện tử đa người bán (tiểu luận cuối kỳ) |
| Kiến trúc | MVC + Service Layer |
| Frontend | ReactJS (JavaScript) |
| Backend | Node.js + Express, RESTful API |
| Database | MongoDB **chạy local**, ODM là Mongoose |
| Công cụ | MongoDB Compass (chỉ để xem/sửa dữ liệu, không phải runtime dependency) |
| Thanh toán | VNPay môi trường thử nghiệm |
| Vai trò | `NguoiDung`, `NguoiBan`, `QuanTriVien` |

Lưu ý về tên gọi:

- `NguoiDung` / `NguoiBan` / `QuanTriVien` là **vai trò (actor)**. Dữ liệu tài khoản là collection **`TaiKhoan`**. Không tạo model `NguoiDung`.
- `TaiKhoan.vaiTro` là **mảng**. Tài khoản được duyệt bán hàng có **cả** `Người dùng` và `Người bán`. Kiểm tra quyền bằng `vaiTro.includes(...)`, không dùng `===`.

## 2. Cách làm việc

1. Đọc code hiện có trước khi tạo cấu trúc hoặc pattern mới. Theo style của file xung quanh.
2. Chức năng đi qua nhiều tầng: lần theo đủ luồng View → Route → Controller → Service → Model trước khi sửa.
3. Không đổi framework, database, package manager, không chuyển JavaScript sang TypeScript.
4. Chỉ thêm thư viện production khi thật sự cần, và phải giải thích lý do ngắn gọn.
5. Không tạo abstraction để "trông chuyên nghiệp". Chỉ tách file/tầng khi code dễ hiểu hoặc tái dùng tốt hơn. Không bắt buộc DAO/Repository: Service gọi thẳng Mongoose Model.
6. Không đổi nghiệp vụ trong tài liệu Soopi nếu người dùng không yêu cầu.
7. Khi xong, báo cáo ngắn bằng tiếng Việt: đã sửa file nào, đã chạy lệnh gì, kết quả ra sao, phần nào chưa kiểm tra được.

## 3. Kiến trúc và trách nhiệm từng tầng

```text
React View → (HTTP/REST) → Route → Controller → Service → Mongoose Model → MongoDB local
```

| Tầng | Được làm | KHÔNG làm |
|---|---|---|
| **Route** | Khai báo method + URL, gắn middleware, chuyển tới Controller | Query DB, tính tiền/voucher/tồn kho, logic dài |
| **Controller** | Lấy `params/query/body` và tài khoản đã xác thực từ `req`; gọi Service; chọn HTTP status; trả JSON; chuyển lỗi qua `next(loi)` | Chứa logic đặt hàng, voucher, tồn kho, thanh toán |
| **Service** | Business logic; kiểm tra điều kiện và quyền sở hữu; điều phối nhiều Model; gọi Model trực tiếp | Nhận/trả `req`/`res`; hard-code secret |
| **Model** | Schema, kiểu dữ liệu, `required/enum/min/max/default`, index, `ref` | Logic HTTP, logic nghiệp vụ nhiều bước |
| **Middleware** | Xác thực, phân quyền, xử lý lỗi chung | Business logic |
| **Utils** | Hàm dùng chung nhỏ, thật sự tái sử dụng | Nơi "nhét" business logic |
| **View (React)** | Hiển thị, state giao diện, gọi API, hiện loading/lỗi | Truy cập DB, chứa secret, tự quyết giá/quyền/tồn kho |

Mỗi hàm một trách nhiệm chính. Service dài thì tách helper có tên nghiệp vụ rõ.

## 4. Cấu trúc thư mục

Giữ cấu trúc repo hiện có. Không tạo folder rỗng chỉ để đủ pattern.

```text
soopi/
├── AGENTS.md
├── docs/                    # tài liệu thiết kế, báo cáo
├── frontend/src/
│   ├── pages/               # DangNhapPage.jsx, GioHangPage.jsx
│   ├── components/          # SanPhamCard.jsx, DonHangCard.jsx
│   ├── services/            # sanPham.api.js, donHang.api.js
│   ├── hooks/  assets/  utils/
│   ├── App.jsx
│   └── main.jsx
└── backend/
    ├── app.js  server.js
    └── src/
        ├── config/          # database.js, vnpay config
        ├── routes/          # sanPham.route.js
        ├── controllers/     # sanPham.controller.js
        ├── services/        # sanPham.service.js
        ├── models/          # sanPham.model.js
        ├── middlewares/     # auth.middleware.js, role.middleware.js, error.middleware.js
        ├── constants/       # (tùy chọn) trangThai.constant.js
        └── utils/
```

## 5. Quy ước đặt tên (BẮT BUỘC)

### 5.1 Nguyên tắc

> Nghiệp vụ Soopi dùng tiếng Việt không dấu. Tên kỹ thuật/framework giữ tiếng Anh chuẩn.

Đã chọn `SanPham` thì không tạo thêm `Product`, `productName`, `getProducts()`. Identifier không có dấu. Text hiển thị và comment nghiệp vụ có dấu.

### 5.2 Bảng quy ước nhanh

| Thành phần | Quy tắc | Ví dụ |
|---|---|---|
| Folder kỹ thuật | English, lowercase | `models/`, `services/` |
| File backend nghiệp vụ | camelCase Việt + suffix English | `sanPham.service.js`, `donHang.model.js` |
| File frontend API | camelCase Việt + `.api.js` | `donHang.api.js`, `xacThuc.api.js` |
| Mongoose Model / Collection | PascalCase Việt | `SanPham`, `GiaoDichThanhToan` |
| Schema | camelCase + `Schema` | `sanPhamSchema` |
| Field / biến / hàm | camelCase Việt | `tenSanPham`, `tinhTongTien()` |
| Hằng số nghiệp vụ | UPPER_SNAKE_CASE Việt | `VAI_TRO.NGUOI_BAN`, `TRANG_THAI_XU_LY.HOAN_THANH` |
| React Page/Component | PascalCase Việt + suffix UI | `GioHangPage`, `SanPhamCard`, `ThemSanPhamForm` |
| URL REST | kebab-case Việt | `/api/san-pham`, `/api/don-hang` |
| Kỹ thuật | English chuẩn | `GET`, `req`, `useState`, `PORT`, `MONGODB_URI` |
| Response keys | English cố định | `success`, `message`, `data` |
| UI / message / comment | Tiếng Việt có dấu | `"Đăng nhập thành công"` |

Suffix file hợp lệ: `.model.js`, `.service.js`, `.controller.js`, `.route.js`, `.middleware.js`, `.api.js`, `.constant.js`.
Middleware/config kỹ thuật có thể giữ English (`auth.middleware.js`, `database.js`). Không tạo hai tên cho cùng một chức năng.

Dấu `-` chỉ dùng trong URL. Dấu `_` chỉ dùng khi convention kỹ thuật bắt buộc (`_id`, `UPPER_SNAKE_CASE`). Không dùng cả hai để tách từ trong tên file/collection.

### 5.3 Ví dụ đồng bộ một domain

```text
Collection: SanPham          File route:      sanPham.route.js
Model:      SanPham          File controller: sanPham.controller.js
Schema:     sanPhamSchema    File service:    sanPham.service.js
File model: sanPham.model.js File frontend:   sanPham.api.js
Hàm:        layDanhSachSanPham()   URL: /api/san-pham
Field:      tenSanPham, giaGoc, soLuongTon
Tham chiếu: cuaHangId, danhMucId
```

### 5.4 Quy ước ID và trường tham chiếu

- **Khóa chính:** dùng `_id` của MongoDB. Tài liệu thiết kế gọi là `idSanPham`, `idDonHang`... nhưng khi cài đặt chúng **ánh xạ vào `_id`**. Không khai báo thêm field `idSanPham` trong schema.
- **Trường tham chiếu:** `tên đối tượng + Id`, kiểu `ObjectId` có `ref`: `taiKhoanId`, `cuaHangId`, `danhMucId`, `sanPhamId`, `donHangId`, `chiTietDonHangId`, `gioHangId`, `khuyenMaiId`, `voucherId`, `cuocTroChuyenId`.
- **Hai ngoại lệ có tên riêng** (giữ nguyên theo tài liệu): `giaoDichId` → `GiaoDichThanhToan`, `nguoiGuiId` → `TaiKhoan`.
- Không đổi `taiKhoanId` thành `idTaiKhoan` hoặc ngược lại.
- `createdAt`/`updatedAt` chỉ có khi schema dùng `timestamps: true`. Không thêm trùng với field nghiệp vụ đã có (`ngayTao`, `ngayGui`, `thoiGianTao`...).

### 5.5 Quy ước Mongoose

Mongoose mặc định đổi `SanPham` thành collection `sanphams`. Soopi yêu cầu giữ đúng `SanPham`, nên **luôn** đặt tên collection tường minh:

```js
const sanPhamSchema = new mongoose.Schema(
  { tenSanPham: { type: String, required: true }, giaGoc: { type: Number, min: 0 } },
  { collection: 'SanPham' }
);
module.exports = mongoose.model('SanPham', sanPhamSchema);
```

Chuỗi kết nối và env:

```text
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/soopi
JWT_SECRET=...
```

- URI lấy từ biến môi trường. Không dùng Atlas/cloud nếu không được yêu cầu.
- Có thể có `.env.example` nhưng không chứa giá trị thật.
- MongoDB local chạy standalone thường **không hỗ trợ multi-document transaction**. Xem cách xử lý tồn kho ở Mục 8.

### 5.6 19 Collection của Soopi

`TaiKhoan`, `YeuCauDangKyNguoiBan`, `CuaHang`, `DanhMuc`, `SanPham`, `KhuyenMai`, `ChiTietKhuyenMai`, `Voucher`, `ApDungVoucher`, `BannerQuangCao`, `GioHang`, `ChiTietGioHang`, `DonHang`, `ChiTietDonHang`, `GiaoDichThanhToan`, `DanhGia`, `YeuCauDoiTraKhieuNai`, `CuocTroChuyen`, `TinNhan`.

Không đổi sang `snake_case`, `kebab-case` hay tên tiếng Anh. Field chi tiết xem `docs/Soopi_3_2_1_Thiet_ke_Collection.md`. Ràng buộc **bắt buộc** có trong schema:

| Collection | Ràng buộc |
|---|---|
| `TaiKhoan` | `email` unique |
| `CuaHang` | `taiKhoanId` unique (mỗi tài khoản tối đa 1 cửa hàng) |
| `Voucher` | `maVoucher` unique |
| `GioHang` | `taiKhoanId` unique |
| `ChiTietGioHang` | (`gioHangId`, `sanPhamId`) unique kết hợp |
| `GiaoDichThanhToan` | `maGiaoDich` unique |
| `DanhGia` | `chiTietDonHangId` unique |
| `YeuCauDoiTraKhieuNai` | `chiTietDonHangId` unique |

Các index còn lại theo Bảng 3.45 trong tài liệu thiết kế.

### 5.7 Giá trị enum (lưu đúng chuỗi có dấu, khai báo thành hằng số)

| Field | Giá trị |
|---|---|
| `TaiKhoan.vaiTro` | `Người dùng`, `Người bán`, `Quản trị viên` |
| `TaiKhoan.trangThaiTaiKhoan` | `Hoạt động`, `Bị khóa` |
| `YeuCauDangKyNguoiBan.trangThai` | `Chờ phê duyệt`, `Đã phê duyệt`, `Đã từ chối` |
| `SanPham.trangThaiKinhDoanh` | `Đang kinh doanh`, `Ngừng kinh doanh` |
| `KhuyenMai.trangThai` | `Chưa bắt đầu`, `Đang hoạt động`, `Đã kết thúc` |
| `KhuyenMai.phamVi` | `Cửa hàng`, `Toàn sàn` |
| `Voucher.loaiVoucher` | `Freeship`, `Toàn sàn`, `Cửa hàng` |
| `Voucher.kieuGiam` | `Phần trăm`, `Số tiền cố định` |
| `DonHang.trangThaiThanhToan` | `Chờ thanh toán`, `Đã thanh toán`, `Thất bại`, `Hết hạn` |
| `DonHang.trangThaiXuLy` | `Chờ xác nhận`, `Đã xác nhận`, `Đang xử lý`, `Đang vận chuyển`, `Hoàn thành`, `Đã hủy` |
| `GiaoDichThanhToan.trangThaiThanhToan` | `Chờ thanh toán`, `Thành công`, `Thất bại`, `Hết hạn` |
| `YeuCauDoiTraKhieuNai.ketQuaXuLy` | `Chấp nhận`, `Từ chối` |

Chú ý: giao dịch dùng `Thành công` nhưng đơn hàng dùng `Đã thanh toán`. Giao dịch `Thành công` ⇒ các đơn thuộc giao dịch thành `Đã thanh toán`.
Các enum khác (kể cả những giá trị tài liệu ghi `...`) lấy từ tài liệu thiết kế. Không tự thêm giá trị mới khi chưa hỏi.

## 6. Quy ước REST API

- Resource dùng tiếng Việt không dấu, kebab-case: `/api/xac-thuc`, `/api/tai-khoan`, `/api/cua-hang`, `/api/danh-muc`, `/api/san-pham`, `/api/gio-hang`, `/api/don-hang`, `/api/danh-gia`, `/api/voucher`, `/api/khuyen-mai`, `/api/giao-dich-thanh-toan`, `/api/doi-tra-khieu-nai`, `/api/cuoc-tro-chuyen`. Resource khác đặt theo cùng quy tắc (ví dụ `/api/banner-quang-cao`, `/api/yeu-cau-dang-ky-nguoi-ban`).
- Method: `GET` lấy, `POST` tạo, `PATCH` cập nhật (mặc định, không dùng `PUT` trừ khi code cũ đã dùng), `DELETE` xóa hoặc vô hiệu hóa.
- Không dùng URL kiểu động từ hoặc nửa Anh nửa Việt: `/getAllProducts`, `/api/products`, `/api/them-san-pham`.

```text
GET    /api/san-pham          GET    /api/san-pham/:id
POST   /api/san-pham          PATCH  /api/san-pham/:id
DELETE /api/san-pham/:id
```

**Hành động đặc biệt** (đổi trạng thái, VNPay) dùng sub-path ngắn, mặc định như sau nếu project chưa có:

```text
PATCH /api/don-hang/:id/trang-thai                      # NguoiBan cập nhật trạng thái xử lý
POST  /api/giao-dich-thanh-toan/vnpay/tao-thanh-toan    # tạo URL thanh toán
GET   /api/giao-dich-thanh-toan/vnpay/ket-qua           # VNPay trả về
```

**Endpoint theo vai trò:** dữ liệu riêng của NguoiBan/QuanTriVien dùng prefix `/api/nguoi-ban/...` và `/api/quan-tri-vien/...` (nếu project chưa có kiểu khác). Cửa hàng được suy ra từ tài khoản đăng nhập, không nhận `cuaHangId` từ client để xác định quyền.

**Response:**

```json
{ "success": true,  "message": "Thêm sản phẩm thành công", "data": {} }
{ "success": false, "message": "Không tìm thấy sản phẩm" }
```

## 7. Phạm vi nghiệp vụ và vai trò

- **NguoiDung:** tài khoản, tìm/xem sản phẩm, giỏ hàng, voucher, đặt hàng, VNPay, theo dõi đơn, đánh giá, đổi trả/khiếu nại, nhắn tin với NguoiBan, đăng ký trở thành NguoiBan.
- **NguoiBan:** NguoiDung đã được duyệt (vẫn được mua hàng). Quản lý cửa hàng, sản phẩm, tồn kho, giá/khuyến mãi, voucher cửa hàng, đơn hàng, đổi trả, thống kê **của chính cửa hàng mình**.
- **QuanTriVien:** quản lý tài khoản, duyệt NguoiBan, danh mục/sản phẩm toàn hệ thống, giao dịch, banner/khuyến mãi/voucher hệ thống (Toàn sàn, Freeship), báo cáo tổng quan.
- Ngoài phạm vi đề tài: không có giao hàng thật hay đơn vị vận chuyển (phí và trạng thái vận chuyển chỉ **mô phỏng**), không hoàn tiền tự động.

## 8. Bất biến nghiệp vụ (không được phá vỡ)

**Phân quyền và sở hữu**
- API cần đăng nhập phải xác thực ở backend. API NguoiBan/QuanTriVien phải kiểm tra role ở backend.
- NguoiBan chỉ thao tác cửa hàng, sản phẩm, đơn, voucher, khuyến mãi thuộc cửa hàng mình.
- Tài khoản `Bị khóa` không dùng được chức năng yêu cầu tài khoản hoạt động.

**Giá và khuyến mãi**
- Chỉ QuanTriVien tạo/sửa chương trình `Flash Sale` Toàn sàn; NguoiBan chỉ tạo chương trình `Giảm giá` cho cửa hàng mình. Trang chủ chỉ lấy sản phẩm thuộc Flash Sale Toàn sàn đang hiệu lực.
- `giaGoc` và giá khuyến mãi lưu riêng. Không ghi đè `giaGoc`.
- Giá khuyến mãi lấy từ `ChiTietKhuyenMai` (`tyLeGiam` hoặc `giaKhuyenMai`) của chương trình `Đang hoạt động` và còn trong `ngayBatDau`–`ngayKetThuc`. Giá khuyến mãi ≤ `giaGoc`.
- Backend quyết định giá cuối (`giaBanThucTe`).
- Tiền là số nguyên VND. Không để giá, tổng tiền, mức giảm bị âm.

**Voucher**
- Có 3 loại và có thể kết hợp trên một đơn: `Freeship`, `Toàn sàn`, `Cửa hàng`. Voucher Toàn sàn/Freeship do QuanTriVien tạo (`cuaHangId` rỗng); voucher Cửa hàng do NguoiBan tạo.
- Kiểm tra: trạng thái `Kích hoạt`, thời gian hiệu lực, `giaTriDonToiThieu`, `giamToiDa`, `soLuong`, phạm vi cửa hàng. Mỗi lần áp dụng ghi một bản ghi `ApDungVoucher` với `giaTriGiamThucTe`.
- Không tin mức giảm từ frontend.

**Giỏ hàng**
- Mỗi tài khoản một giỏ. Mỗi sản phẩm một dòng; thêm lại thì tăng `soLuong`. Chỉ dòng `duocChon = true` được đưa vào đơn. `tongGiaTri` tính lại ở backend.

**Đặt hàng**
- Giỏ có nhiều cửa hàng ⇒ **tách thành một `DonHang` riêng cho mỗi cửa hàng**. Các đơn cùng lần thanh toán chung một `GiaoDichThanhToan` (`giaoDichId`).
- Công thức: `tongThanhToan = tongTienHang − tongGiamVoucher + phiVanChuyen − giamPhiVanChuyen`.
- **Snapshot:** `ChiTietDonHang` lưu `soLuong`, `giaGocTaiThoiDiemDat`, `giaBanThucTe`, `thanhTien`; `DonHang` lưu `diaChiNhanHang` tại thời điểm đặt. Đổi giá sản phẩm sau này không làm đổi đơn cũ.

**Tồn kho**
- Không âm, không cho mua vượt. Kiểm tra lại ngay trước khi tạo đơn.
- Trừ tồn kho bằng **một thao tác nguyên tử có điều kiện**, vì MongoDB local thường không có transaction:
  `SanPham.updateOne({ _id, soLuongTon: { $gte: soLuong } }, { $inc: { soLuongTon: -soLuong } })`. Nếu `modifiedCount === 0` thì báo hết hàng.
- Nếu một dòng thất bại giữa chừng, hoàn lại các dòng đã trừ trước đó.
- Đơn tạo thành công thì trừ. Thanh toán thất bại/hết hạn hoặc đơn bị hủy thì **hoàn đúng một lần**.

**Trạng thái đơn**
- Hai trường độc lập: `trangThaiThanhToan` và `trangThaiXuLy`. Đơn mới: `Chờ thanh toán` + `Chờ xác nhận`.
- Luồng xử lý: `Chờ xác nhận → Đã xác nhận → Đang xử lý → Đang vận chuyển → Hoàn thành`. Tiến theo thứ tự, không nhảy cóc, không lùi.
- NguoiBan chỉ xác nhận/xử lý đơn đã `Đã thanh toán`. NguoiBan **không được từ chối** đơn đã thanh toán.
- `Đã hủy` do hệ thống đặt khi thanh toán thất bại/hết hạn. Mọi lần đổi trạng thái phải kiểm tra role, quyền sở hữu và trạng thái hiện tại.

**Đánh giá, đổi trả**
- Chỉ chủ đơn mới tạo `DanhGia`, và chỉ khi đơn chứa `ChiTietDonHang` đó ở trạng thái `Hoàn thành`. Mỗi `ChiTietDonHang` tối đa một `DanhGia` và một `YeuCauDoiTraKhieuNai`.
- NguoiBan chấp nhận/từ chối yêu cầu đổi trả/khiếu nại. Không tự động hoàn tiền.

**Xóa dữ liệu**
- Sản phẩm, cửa hàng, danh mục đã được đơn hàng hoặc dữ liệu khác tham chiếu: không xóa cứng. Chuyển sang trạng thái ngừng (`Ngừng kinh doanh`, `Ngừng hoạt động`).

## 9. VNPay (sandbox)

- Credential VNPay nằm trong biến môi trường, không commit.
- Số tiền do backend tính từ database. Đối chiếu giao dịch bằng `maGiaoDich` và so khớp với `soTien`. Không tin số tiền từ frontend.
- Dùng đúng định dạng số tiền theo tài liệu VNPay (tham số `vnp_Amount` yêu cầu nhân 100). Xem cách project đang làm trước khi sửa.
- Callback/return phải xác thực chữ ký (`vnp_SecureHash`) và mã phản hồi trước khi cập nhật trạng thái.
- **Idempotent:** callback đã xử lý (giao dịch không còn `Chờ thanh toán`) thì bỏ qua, không trừ/hoàn tồn kho lần nữa.
- Thành công: giao dịch `Thành công`, các đơn thuộc giao dịch thành `Đã thanh toán`.
- Thất bại, hoặc **quá 24 giờ** kể từ lúc tạo mà chưa thanh toán: giao dịch `Thất bại`/`Hết hạn`, các đơn thành `Thất bại`/`Hết hạn` + `Đã hủy`, hoàn tồn kho một lần.
- Không đổi VNPay sang cổng khác.

## 10. Authentication và mật khẩu

- Không lưu plaintext, không dùng MD5. Dùng thư viện hash project đang có (bcrypt/bcryptjs).
- Trường mật khẩu là `matKhau`. Không bao giờ trả `matKhau` trong response (nên đặt `select: false`).
- Token/secret trong biến môi trường. Middleware xác thực gắn tài khoản đã xác thực vào request (theo tên code hiện có; nếu chưa có thì dùng `req.taiKhoan`).
- Phân quyền luôn kiểm tra lại ở backend. Giữ cơ chế auth hiện có, không thay toàn bộ.

## 11. Lỗi và validation

- Có error middleware chung. Service `throw` lỗi kèm `statusCode`; Controller `catch` rồi `next(loi)`.
- Validation đơn giản dùng Mongoose + logic Service. Chỉ thêm thư viện validation khi project đã dùng sẵn hoặc thật sự cần.
- Nhóm lỗi và status gợi ý: dữ liệu không hợp lệ (400), chưa đăng nhập (401), không đủ quyền (403), không tìm thấy (404), xung đột nghiệp vụ (409), lỗi server (500).
- Không lộ stack trace, secret, URI database cho client. Log server được chi tiết hơn response.

## 12. Frontend ReactJS

- Function component + hooks (`useState`, `useEffect`). Component nhỏ, rõ mục đích. Không thêm Redux/Zustand/React Query nếu project chưa có.
- `pages/` theo route, `components/` tái sử dụng, `services/` gọi API. Không bắt buộc tách folder theo role; ưu tiên cấu trúc hiện có.
- Gọi API: hiện loading khi cần, hiện lỗi tiếng Việt dễ hiểu. Không hard-code URL API ở nhiều component, dùng config/service chung.
- Frontend có thể validate sớm để UX tốt, nhưng backend vẫn validate lại. Không để secret trong React.

## 13. Code style: đơn giản và phổ biến

- Dùng JavaScript phổ biến: `const/let`, arrow function, destructuring, template string, `async/await`. Không trộn CommonJS (`require`) và ES Modules (`import`) trong backend, theo cái project đang dùng.
- Ưu tiên tên rõ nghĩa hơn code ngắn. Dùng early return/`throw` để tránh `if` lồng sâu.
- Tránh: metaprogramming, decorator, class kế thừa, `reduce` nhiều tầng, Mongoose plugin tự viết, pattern phức tạp (microservices, Clean Architecture, CQRS, event sourcing).
- `aggregate` cho thống kê được phép; mỗi stage một dòng, kèm comment tiếng Việt giải thích.
- Comment chỉ để giải thích **vì sao** (quy tắc nghiệp vụ), viết tiếng Việt có dấu.
- Hằng số cho trạng thái/role lặp nhiều nơi; không dùng magic string rải rác.
- Không format/refactor hàng loạt file không liên quan.
- Khi sửa file cũ đang đặt tên khác: giữ API contract ổn định. Chỉ rename đồng loạt sau khi tìm hết import, route, frontend và dữ liệu liên quan.

**Ví dụ mẫu** (CommonJS; đổi theo project). Chức năng tạo đánh giá, minh họa đủ ba tầng:

```js
// routes/danhGia.route.js
router.post('/', authMiddleware, danhGiaController.taoDanhGia);

// controllers/danhGia.controller.js — ngắn, chỉ nhận request và trả response
const taoDanhGia = async (req, res, next) => {
  try {
    const danhGia = await danhGiaService.taoDanhGia(req.taiKhoan._id, req.body);
    res.status(201).json({ success: true, message: 'Đánh giá sản phẩm thành công', data: danhGia });
  } catch (loi) {
    next(loi);
  }
};

// services/danhGia.service.js — chứa toàn bộ kiểm tra nghiệp vụ
const taoDanhGia = async (taiKhoanId, { chiTietDonHangId, soSao, noiDung }) => {
  const chiTietDonHang = await ChiTietDonHang.findById(chiTietDonHangId);
  if (!chiTietDonHang) throw taoLoi(404, 'Không tìm thấy sản phẩm trong đơn hàng');

  const donHang = await DonHang.findById(chiTietDonHang.donHangId);
  if (donHang.taiKhoanId.toString() !== taiKhoanId.toString()) {
    throw taoLoi(403, 'Bạn không có quyền đánh giá sản phẩm này');
  }
  if (donHang.trangThaiXuLy !== TRANG_THAI_XU_LY.HOAN_THANH) {
    throw taoLoi(409, 'Chỉ được đánh giá sau khi đơn hàng hoàn thành');
  }
  if (await DanhGia.exists({ chiTietDonHangId })) {
    throw taoLoi(409, 'Sản phẩm này đã được đánh giá');
  }

  return DanhGia.create({
    soSao, noiDung, ngayDanhGia: new Date(),
    taiKhoanId, sanPhamId: chiTietDonHang.sanPhamId, chiTietDonHangId,
  });
};
```

`taoLoi(statusCode, message)` là helper nhỏ trong `utils/` (tạo `Error` có `statusCode`). Nếu project chưa có thì tạo, chỉ vài dòng.

## 14. Khi thêm một chức năng mới

1. Xác định actor (NguoiDung/NguoiBan/QuanTriVien) và Model bị ảnh hưởng.
2. Xác định endpoint (Mục 6).
3. Viết theo thứ tự: Route → Controller → Service → Model (nếu cần) → middleware auth/role → View React.
4. Tự kiểm tra: trường hợp thành công, lỗi, và truy cập sai quyền.
5. Chạy script test/lint/build liên quan.

Ví dụ luồng đặt hàng:

```text
CheckoutPage → donHang.api.js → donHang.route → donHang.controller → donHang.service
→ GioHang / SanPham / Voucher / DonHang / GiaoDichThanhToan → MongoDB local
```

## 15. Git và thay đổi source

- Không commit `.env`, secret, credential VNPay.
- Không sửa `package-lock.json` nếu không đổi dependency.
- Không xóa code/file lớn chỉ vì "có vẻ không dùng" khi chưa kiểm tra import/reference.
- Đổi endpoint hoặc field Model: tìm toàn repo và cập nhật mọi nơi dùng, gồm cả frontend.
- Mỗi commit tập trung một chức năng hoặc một nhóm thay đổi liên quan.

## 16. Những điều KHÔNG làm mặc định

- Dùng MongoDB Atlas/cloud; bỏ MVC; nhét logic vào Route hoặc logic lớn vào Controller.
- Bắt buộc DAO/Repository; đưa truy vấn DB vào React.
- Tin giá, tổng tiền, role, `cuaHangId`, tồn kho từ frontend.
- Hard-code secret; lưu mật khẩu plaintext/MD5.
- Đổi React, Express, MongoDB, VNPay sang công nghệ khác.
- Tạo file/folder thừa; viết message giao diện bằng ngôn ngữ khác tiếng Việt.

## 17. Code Review Rules

Khi review code, flag các lỗi sau và nêu theo dạng **vị trí → lý do → cách sửa đơn giản nhất**:

- NguoiBan xem/sửa dữ liệu không thuộc cửa hàng mình; endpoint NguoiBan/QuanTriVien thiếu kiểm tra role hoặc owner; kiểm tra role bằng `===` thay vì `includes` trên `vaiTro`.
- Backend tin `price`, `total`, `discount`, tồn kho, role hoặc `taiKhoanId`/`cuaHangId` từ client.
- Đổi giá sản phẩm làm thay đổi lịch sử `DonHang`; khuyến mãi/voucher tạo giá sai hoặc âm.
- Cho đặt vượt tồn kho, tồn kho âm; dùng đọc-rồi-ghi thay vì `$inc` có điều kiện; callback/retry trừ hoặc hoàn tồn kho nhiều lần.
- Giỏ nhiều cửa hàng nhưng không tách đơn đúng phạm vi.
- Tạo `DanhGia` khi chưa mua hoặc đơn chưa `Hoàn thành`; NguoiBan từ chối đơn đã thanh toán.
- Lộ `.env`, secret, key VNPay, `matKhau`/hash; dùng plaintext/MD5; trả stack trace cho client.
- Route chứa business logic; Controller quá lớn; Service phụ thuộc `req`/`res`.
- Vi phạm Mục 5: cùng domain vừa `SanPham` vừa `Product`; thiếu `collection: '...'` trong schema; field DB lệch Model; file/route nửa Anh nửa Việt; enum không có dấu.
- Thêm DAO/pattern phức tạp không tăng độ rõ ràng; refactor lan rộng ngoài phạm vi.

## 18. Ưu tiên khi mâu thuẫn và điều chưa quy định

**Thứ tự ưu tiên:**

1. Yêu cầu trực tiếp mới nhất của người dùng/giảng viên cho task hiện tại.
2. Code và contract đang chạy trong repo, nếu không trái yêu cầu mới.
3. File `AGENTS.md` này.
4. README/tài liệu kỹ thuật, rồi báo cáo Soopi (phạm vi nghiệp vụ).
5. Best practice chung.

Ngoại lệ: **bất biến ở Mục 8, 9, 10** (giá, tồn kho, thanh toán, phân quyền, mật khẩu) không được vi phạm chỉ vì code cũ đang làm sai. Gặp trường hợp đó, nêu rõ và sửa tối thiểu, không sao chép lỗi.
Code và báo cáo mâu thuẫn đáng kể: chỉ ra mâu thuẫn, làm thay đổi tối thiểu, không tự chọn một bên rồi đổi diện rộng.

**Tài liệu chưa quy định, hỏi lại trước khi code:**

- Điều kiện để gửi đổi trả/khiếu nại (thời hạn, trạng thái đơn).
- NguoiDung có được tự hủy đơn không (báo cáo chỉ nêu hủy tự động).
- Giới hạn số voucher mỗi loại trên một đơn, và cách chia voucher Toàn sàn/Freeship khi giỏ tách nhiều đơn.
- Cách tính phí vận chuyển mô phỏng.
- Cơ chế quên/đặt lại mật khẩu.
- Cách tự động hủy sau 24 giờ (job định kỳ hay kiểm tra khi truy cập).
- Có xóa dòng khỏi giỏ sau khi đặt thành công không.

## 19. Mục tiêu cuối cùng

Codebase mà sinh viên có thể đọc hiểu luồng nhanh, giải thích khi bảo vệ, debug theo từng tầng, thêm chức năng mà không làm rối phần cũ, và giữ đúng MVC + Service Layer, phân quyền ba vai trò, các bất biến về giá/tồn kho/đơn hàng/thanh toán.

Ưu tiên giải pháp **đơn giản nhất nhưng vẫn đúng nghiệp vụ, an toàn và dễ bảo trì**.
