# 02 — QUYẾT ĐỊNH ĐÃ CHỐT (AI LÀM THEO, KHÔNG CẦN XÁC NHẬN LẠI)

> **Chủ dự án đã chấp nhận TOÀN BỘ các quyết định dưới đây** (mặc định và các bổ sung theo góp ý). Đây là **quyết định chính thức**.
>
> **Quy tắc cho AI:** (1) Áp dụng ngay, **không hỏi lại, không chờ xác nhận**. (2) Mục **E** là các thay đổi dữ liệu đã duyệt — làm đúng nguyên văn kể cả khi tài liệu Collection/`AGENTS.md` chưa được cập nhật. (3) Điều gì chưa có ở đâu cả: chọn phương án đơn giản, gần tài liệu nhất, ghi vào "Giả định đã dùng" của báo cáo rồi làm tiếp.
>
> Mục `QĐ-01` → `QĐ-07` là các điểm `AGENTS.md` Mục 18 yêu cầu hỏi lại (nay đã chốt). Mục `QĐ-08` → `QĐ-25` là các điểm phát hiện khi đối chiếu 3 tài liệu.

---

## A. Các điểm AGENTS.md Mục 18 yêu cầu hỏi lại

### QĐ-01 — Quên / đặt lại mật khẩu (Người dùng)
- **Nguồn:** Báo cáo 3.1.1, Bảng 3.1 có "Quên mật khẩu"; AGENTS Mục 18: "chưa quy định cơ chế". Dự án không có dịch vụ email.
- **Quyết định:** Làm ở form **F28** (làm sau cùng). Backend tạo JWT sống 15 phút, ký bằng `JWT_SECRET` ghép với chuỗi băm mật khẩu hiện tại (nên tự hết hiệu lực sau khi đổi mật khẩu, **không cần thêm field**). Vì không có email, liên kết đặt lại được **ghi ra log server**; response luôn trả thông báo trung tính ("Nếu email tồn tại, hướng dẫn đặt lại đã được tạo") để không lộ email nào tồn tại. Chỉ khi `NODE_ENV=development` mới trả thêm `lienKetDatLai` để demo/bảo vệ.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-02 — Điều kiện gửi đổi trả / khiếu nại
- **Nguồn:** Bảng 3.8; góp ý: "không giới hạn thời gian là chưa hợp lý; cần thời hạn và quy trình khi yêu cầu bị từ chối".
- **Quyết định:**
  1. Chỉ **chủ đơn**, đơn `Hoàn thành`, và dòng đơn **chưa có** yêu cầu.
  2. **Thời hạn gửi: 7 ngày** kể từ `DonHang.ngayHoanThanh` (field mới **CR-03**, xem Mục E). Hằng số `SO_NGAY_DOI_TRA_TOI_DA = 7`. Quá hạn → 409 "Đã quá thời hạn gửi yêu cầu (7 ngày kể từ khi đơn hoàn thành)". Giao diện hiển thị "Còn X ngày để gửi yêu cầu". Đơn thiếu `ngayHoanThanh` (dữ liệu cũ) → tính từ `ngayTao`.
  3. **Quy trình khi bị từ chối:** kết quả hiển thị rõ cho người dùng; giao diện **dẫn tới nhắn tin cho cửa hàng** để trao đổi thêm; mỗi dòng đơn **chỉ có một yêu cầu** (đúng mô hình dữ liệu) nên **không gửi lại được** — giao diện **nói rõ điều này trước khi gửi** để người dùng mô tả đầy đủ. Việc phân xử của Quản trị viên **không** làm (hướng phát triển).
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-03 — Người dùng tự hủy đơn
- **Nguồn:** góp ý: "người dùng không hủy được đơn đặt nhầm là hạn chế; nên cho hủy trước khi Người bán xử lý, nhưng phải thiết kế rõ thanh toán và tồn kho".
- **Quyết định — làm ở form F30:** Người dùng **được hủy đơn khi đơn còn `Chờ xác nhận`** (Người bán chưa bắt đầu xử lý). Từ `Đã xác nhận` trở đi: **không hủy được**. Người bán **vẫn không** được từ chối/hủy đơn.

| Tình huống | Xử lý | Tồn kho | Voucher | Tiền |
|---|---|---|---|---|
| **VNPay chưa thanh toán** | Hủy **cả giao dịch** (mọi đơn thuộc giao dịch đó) | Hoàn tất cả | **Hoàn** | Chưa thu |
| **Đã thanh toán** (VNPay, hoặc đơn 0đ) | Hủy **riêng đơn đó**; giữ trạng thái thanh toán | Hoàn đơn đó | Không hoàn | **Không hoàn tiền tự động**; đánh dấu **"cần hoàn tiền thủ công"** để Quản trị viên xử lý ngoài hệ thống |
| **COD** | Hủy **riêng đơn đó** | Hoàn đơn đó | Không hoàn | Chưa thu |

- Hoàn kho **đúng một lần** (chiếm quyền nguyên tử). Đua với "Người bán xác nhận" → chỉ một bên thắng.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-04 — Giới hạn voucher trên một đơn & cách chia khi giỏ tách nhiều đơn
- **Nguồn:** Bảng 3.6 ("kết hợp Freeship, Toàn sàn, Cửa hàng"); AGENTS Mục 18.
- **Quyết định:** Mỗi **lần thanh toán** (một giao dịch có thể gồm nhiều đơn) áp dụng tối đa: **1 voucher Freeship**, **1 voucher Toàn sàn**, và **1 voucher Cửa hàng cho mỗi cửa hàng**.
  - Voucher Cửa hàng: kiểm tra và giảm trên `tongTienHang` của **đơn của cửa hàng đó**.
  - Voucher Toàn sàn: kiểm tra `giaTriDonToiThieu` trên **tổng tiền hàng cả lần thanh toán**; mức giảm tính trên tổng tiền hàng **sau khi trừ voucher Cửa hàng**, rồi **chia cho các đơn theo tỷ lệ** `tongTienHang`.
  - Voucher Freeship: kiểm tra trên tổng tiền hàng cả lần thanh toán; mức giảm tính trên **tổng phí vận chuyển** (không vượt tổng phí), **chia cho các đơn theo tỷ lệ** `phiVanChuyen`.
  - Chia bằng làm tròn xuống số nguyên, đơn cuối nhận phần dư để tổng khớp; không đơn nào giảm quá `tongTienHang` (hoặc `phiVanChuyen`) của nó.
  - Mỗi đơn nhận **một bản ghi `ApDungVoucher` cho mỗi voucher có phần giảm > 0**, `giaTriGiamThucTe` = phần được chia cho đơn đó.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-05 — Phí vận chuyển mô phỏng
- **Nguồn:** Mục 1.3 báo cáo ("chỉ mô phỏng"); AGENTS Mục 18.
- **Quyết định:** Phí cố định **30.000 VND cho mỗi đơn** (mỗi cửa hàng), đặt trong `cauHinh.constant.js` (`PHI_VAN_CHUYEN_MAC_DINH`). Không phụ thuộc địa chỉ/cân nặng. Con số 30.000 là giá trị mô phỏng đã chốt.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-06 — Cơ chế tự động hủy sau 24 giờ
- **Nguồn:** Bảng 3.6; AGENTS Mục 9, 18.
- **Quyết định:** Hàm `xuLyGiaoDichHetHan()` (trong service thanh toán) chạy bằng `setInterval` mỗi **5 phút** (hằng số) và **một lần khi server khởi động**. Không dùng thư viện cron. Không phụ thuộc người dùng có truy cập hay không. *(v2)* Chỉ áp dụng cho giao dịch **VNPay**; giao dịch **COD không bị tự hủy**; chỉ hủy khi đã quá 24 giờ **cộng 10 phút gia hạn** (xem `QĐ-20`).
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-07 — Có xóa dòng khỏi giỏ sau khi đặt thành công không
- **Nguồn:** AGENTS Mục 18.
- **Quyết định:** **Có** — ngay khi tạo đơn thành công (tồn kho đã được giữ), xóa các dòng `duocChon = true` khỏi giỏ và tính lại `tongGiaTri`. (Nếu thanh toán thất bại, người dùng đặt lại từ trang sản phẩm.)
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

---

## B. Các điểm phát hiện khi đối chiếu tài liệu

### QĐ-08 — Tạo tài khoản Quản trị viên đầu tiên
- **Vấn đề:** Không có chức năng đăng ký Admin; nếu không có Admin thì không duyệt được Người bán.
- **Quyết định:** Script `npm run seed:admin` đọc `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_HO_TEN` từ `.env`, tạo `TaiKhoan` với `vaiTro = ['Quản trị viên']`. API đăng ký công khai **luôn** chỉ tạo `['Người dùng']`. Script chạy lặp lại không tạo trùng.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-09 — Cơ chế xác thực và thư viện nền
- **Nguồn:** Biểu đồ hoạt động Hình 3.24 ("tạo token, lưu cookie"); AGENTS Mục 10.
- **Quyết định:** JWT lưu trong **cookie httpOnly** `token`, hạn **7 ngày** (hằng số `SO_NGAY_HET_HAN_TOKEN`); hash mật khẩu bằng **bcryptjs**; thư viện backend cho phép: `express, mongoose, dotenv, cors, cookie-parser, jsonwebtoken, bcryptjs` (+ `multer` ở QĐ-10). Nếu repo **đã có** cơ chế auth khác đang chạy thì **giữ nguyên** (AGENTS Mục 10) và AI chỉ báo lại khác biệt.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-10 — Tải ảnh sản phẩm / banner
- **Nguồn:** `SanPham.hinhAnh` là mảng đường dẫn ảnh; `BannerQuangCao.hinhAnh` là đường dẫn ảnh.
- **Quyết định:** Dùng **multer**, lưu file vào `backend/uploads/`, phục vụ tĩnh tại `/uploads`; trường `hinhAnh` lưu đường dẫn tương đối (`/uploads/<tên-file>`). Chỉ nhận `jpeg/png/webp`, tối đa **5 MB**/ảnh, tối đa **8 ảnh**/sản phẩm (hằng số), đổi tên file ngẫu nhiên; thêm `uploads/` vào `.gitignore`. Chỉ Người bán/Admin được tải lên.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-11 — Công nghệ giao diện, bảng màu, thư viện biểu đồ
- **Nguồn:** AGENTS Mục 2, 12; góp ý của bạn: "chốt bảng màu thống nhất ngay từ đầu" và "có thư viện biểu đồ thì dùng cho code đơn giản".
- **Quyết định:**
  - **Bảng màu đã khóa** (xem `F03` Mục 4): chủ đạo **teal `#0F766E`**, màu giá/khuyến mãi **`#E11D48`**, nền trung tính xanh xám, bốn màu trạng thái, **dãy 5 màu biểu đồ** (`#0F766E`, `#1D4ED8`, `#B45309`, `#7C3AED`, `#64748B`). **Mọi màu đều là token** ở một khối `:root`; không đổi sau khi bắt đầu F03 trừ khi bạn báo trước.
  - **Biểu đồ dùng thư viện `recharts`** (chỉ ở F26, F27), thay cho tự vẽ SVG. Màu của biểu đồ lấy từ tokens qua `utils/mauSac.js` (không gõ mã màu trong JS). Vẫn có bảng dữ liệu thay thế cho trình đọc màn hình. **Không** thêm thư viện biểu đồ nào khác.
  - CSS thuần + CSS variables (không UI kit/Tailwind; nếu repo **đã** dùng sẵn thì giữ nguyên và ghi vào báo cáo).
  - Phông **Be Vietnam Pro** (`<link>` Google Fonts, fallback `system-ui`); biểu tượng SVG nội bộ; không dark mode ở giai đoạn này; cho phép `react-router-dom`.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-12 — Khuyến mãi: trạng thái, vô hiệu hóa, chồng lấn
- **Vấn đề (góp ý):** vô hiệu hóa chương trình `Chưa bắt đầu` bằng cách đổi `ngayKetThuc` về hiện tại sẽ làm ngày kết thúc **nhỏ hơn** ngày bắt đầu (mâu thuẫn `ngayKetThuc > ngayBatDau`); và trạng thái `Đã kết thúc` do Admin đặt không được bị tính lại thành `Chưa bắt đầu`.
- **Quyết định:**
  1. Trạng thái **tính từ thời gian** (`Chưa bắt đầu` / `Đang hoạt động` / `Đã kết thúc`), **nhưng `Đã kết thúc` là trạng thái cố định (một chiều)**: đã `Đã kết thúc` (hết hạn hoặc bị vô hiệu hóa) thì **không bao giờ** bị tính lại thành trạng thái khác, dù ngày còn ở tương lai.
  2. **Vô hiệu hóa (Admin) = chỉ đặt `trangThai = 'Đã kết thúc'`, GIỮ NGUYÊN `ngayBatDau` và `ngayKetThuc`.** Áp dụng như nhau cho chương trình `Đang hoạt động` và `Chưa bắt đầu` → **không bao giờ tạo khoảng ngày sai**, không mất lịch sử. Không bật lại; muốn dùng lại thì tạo chương trình mới.
  3. Khi **tra giá**: chương trình chỉ có hiệu lực khi ngày hiện tại nằm trong `[ngayBatDau, ngayKetThuc]` **và** `trangThai ≠ Đã kết thúc` (nên chương trình bị vô hiệu hóa lập tức không còn áp dụng).
  4. Sản phẩm nằm trong nhiều chương trình đang hiệu lực: lấy **giá thấp nhất**; `giaBanThucTe = min(giá KM, giaGoc)`.
  5. Khi tạo: `ngayKetThuc > ngayBatDau` và `ngayKetThuc > hiện tại`; mỗi `ChiTietKhuyenMai` dùng **một trong hai** `tyLeGiam` (0 < x < 100) hoặc `giaKhuyenMai` (1 ≤ x ≤ `giaGoc`); có **ít nhất 1** chi tiết.
  6. `loaiKhuyenMai` chỉ `Giảm giá` hoặc `Flash Sale`.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-13 — Voucher: tính giảm, số lượng, hoàn lại, voucher không hợp lệ
- **Nguồn:** Bảng 3.6, 3.14, 3.23; AGENTS Mục 8 (Voucher).
- **Quyết định:**
  1. Voucher hợp lệ khi: `trangThai = Kích hoạt`, `ngayBatDau ≤ hiện tại ≤ ngayKetThuc`, `soLuong ≥ 1`, đạt `giaTriDonToiThieu`, đúng phạm vi cửa hàng (`Cửa hàng` chỉ dùng cho đơn của đúng cửa hàng đó).
  2. Mức giảm: `Phần trăm` → `base × giaTriGiam / 100`, không vượt `giamToiDa`; `Số tiền cố định` → `giaTriGiam` (cũng không vượt `giamToiDa` nếu có); luôn làm tròn nguyên, không âm, không vượt phần có thể giảm.
  3. `soLuong` giảm **1 cho mỗi voucher mỗi lần thanh toán** (trừ nguyên tử có điều kiện `soLuong ≥ 1`); **hoàn lại đúng 1 lần** khi giao dịch `Thất bại/Hết hạn` (cùng chỗ hoàn tồn kho, cùng cơ chế chống lặp).
  4. Không giới hạn số lần một người dùng dùng một voucher (tài liệu không quy định).
  5. `maVoucher` chuẩn hóa `trim + chữ HOA`; unique.
  6. **Xem trước đơn (F16):** voucher không hợp lệ bị bỏ qua và được liệt kê kèm lý do (đúng Bảng 3.6). **Tạo đơn (F17):** nếu có voucher đã chọn không còn hợp lệ thì trả **409** yêu cầu xem lại (để không tính tiền khác với con số người dùng đã xác nhận).
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-14 — Xóa mềm hay xóa cứng
- **Vấn đề:** AGENTS Mục 8: dữ liệu đã được tham chiếu thì không xóa cứng; nhưng `DanhMuc` **không có** field trạng thái để "ngừng".
- **Quyết định:**

| Đối tượng | Quy tắc |
|---|---|
| `SanPham` | Có tham chiếu (`ChiTietDonHang`, `DanhGia`, `ChiTietKhuyenMai`, `ChiTietGioHang`) → chuyển `Ngừng kinh doanh`. Không tham chiếu → xóa cứng. |
| `DanhMuc` | Còn sản phẩm thuộc danh mục → **từ chối xóa (409)**. Không thêm field. Chưa có sản phẩm → xóa cứng. |
| `KhuyenMai` | Xóa cứng cùng `ChiTietKhuyenMai` (đơn hàng đã lưu snapshot giá nên không ảnh hưởng). *Nếu sau này cần thống kê hiệu quả từng chương trình: chỉ cho xóa chương trình `Chưa bắt đầu`, các chương trình khác dùng vô hiệu hóa để giữ lịch sử (Quản trị viên vô hiệu hóa không xóa dữ liệu — xem QĐ-12).* |
| `Voucher` | Đã có `ApDungVoucher` → chuyển `Vô hiệu hóa`. Chưa dùng → xóa cứng. |
| `BannerQuangCao` | Xóa cứng. |
| `CuaHang` | Không xóa; chỉ `Ngừng hoạt động` (Admin, QĐ-15). |

- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-15 — Admin "xử lý sản phẩm vi phạm" và "quản lý cửa hàng"
- **Nguồn:** Bảng 3.21 ("xử lý sản phẩm"), mục 3.1.2 ("quản lý … cửa hàng"). Tài liệu không nói cụ thể "xử lý" là gì.
- **Quyết định:**
  - Admin "xử lý sản phẩm" = đổi `trangThaiKinhDoanh` giữa `Đang kinh doanh` ↔ `Ngừng kinh doanh` (không thêm trạng thái mới).
  - Admin "quản lý cửa hàng" = xem danh sách và đổi `trangThaiHoatDong` giữa `Hoạt động` ↔ `Ngừng hoạt động`. Cửa hàng `Ngừng hoạt động`: sản phẩm bị **ẩn khỏi công khai**, **không thêm vào giỏ / không đặt mới**; Người bán vẫn xử lý được các đơn đã thanh toán.
  - **Kiểm tra ở backend, không chỉ ẩn nút:** trạng thái sản phẩm/cửa hàng được kiểm tra lại ở **mọi** API thêm giỏ, xem trước đơn và tạo đơn (F15, F16, F17); phải kiểm thử bằng cách **gọi API trực tiếp**.
  - **Hạn chế đã biết:** không phân biệt ai đặt `Ngừng kinh doanh` (Người bán có thể bật lại sản phẩm bị Admin ngừng) vì tài liệu không có field phân biệt. Ghi nhận là hướng phát triển.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-16 — Thanh toán: thêm COD, đơn 0đ, giới hạn số tiền VNPay
- **Góp ý/yêu cầu của bạn:** không giả định VNPay chấp nhận 1 VND; thêm **COD** để demo (bỏ qua bước thanh toán); đơn **0đ** phải đi tiếp được như các sàn TMĐT.
- **Quyết định — thay đổi dữ liệu duyệt ở Mục E (CR-01):**
  1. **COD** là phương thức thứ hai (`phuongThucThanhToan = COD`). Chọn ở bước thanh toán; **không** qua VNPay. Mỗi đơn COD có **giao dịch riêng** (`COD`, `Chờ thanh toán`); Người bán **xử lý được ngay** (không cần chờ thanh toán); khi Người bán chuyển `Hoàn thành` thì đơn thành `Đã thanh toán`, giao dịch `Thành công`, ghi `ngayHoanThanh` (đúng thực tế "thu tiền khi giao"). Đơn COD **không** bị tự hủy sau 24 giờ và **không** có "thanh toán lại".
  2. **Đơn 0đ** (voucher giảm hết): **không qua cổng** — kỹ thuật các sàn dùng: tạo ngay giao dịch ở trạng thái `Thành công` (số tiền 0) và đơn `Đã thanh toán`, bất kể phương thức. Với VNPay, nếu **tổng cả lần thanh toán = 0** thì bỏ qua cổng; nếu > 0 thì thanh toán VNPay đúng tổng đó.
  3. **VNPay số tiền > 0:** hằng số `SO_TIEN_VNPAY_TOI_THIEU`. **AI phải đối chiếu tài liệu VNPay chính thức** để lấy giới hạn tối thiểu (và tối đa nếu có) rồi báo lại; **chưa xác định được thì để trống (không kiểm tra) và ghi vào báo cáo** — *không được tự đặt 1 VND*. Nếu `0 < tổng < mức tối thiểu` → 400 gợi ý chọn COD.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-17 — Giỏ hàng
- **Nguồn:** Bảng 3.5, 3.35, 3.36; AGENTS Mục 8 (Giỏ hàng).
- **Quyết định:**
  - `duocChon` mặc định `true` khi thêm mới.
  - `GioHang.tongGiaTri` = tổng `soLuong × giaBanThucTe` của các dòng **được chọn và mua được**; tính lại mỗi lần thay đổi **và mỗi lần đọc giỏ** (vì giá có thể đổi).
  - Thêm/sửa số lượng làm tổng số lượng vượt `soLuongTon` → **409** kèm số còn lại (không tự cắt số lượng).
  - Dòng có sản phẩm `Ngừng kinh doanh`, hết hàng, hoặc cửa hàng `Ngừng hoạt động`: vẫn hiện nhưng **gắn cờ "không mua được"**, không tính vào tổng, và chặn ở bước đặt hàng (409 kèm tên sản phẩm).
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-18 — Định nghĩa các số liệu thống kê
- **Nguồn:** Bảng 3.17, 3.24; góp ý: doanh thu theo ngày tạo đơn làm báo cáo tháng cũ đổi khi đơn cũ hoàn thành muộn; "danh mục được quan tâm" thực chất đo bán chạy; doanh thu ≠ lợi nhuận.
- **Quyết định:**
  - **Doanh thu** = tổng `DonHang.tongThanhToan` của đơn `Hoàn thành`, **lọc theo `DonHang.ngayHoanThanh`** (field mới **CR-03**) → báo cáo của một tháng **không đổi** khi đơn tháng trước hoàn thành muộn. Đây là *tổng giá trị thanh toán của đơn đã hoàn thành*, **không phải lợi nhuận** (đã gồm phí vận chuyển, trừ giảm giá).
  - **Số đơn hoàn thành / sản phẩm đã bán / bán chạy / hiệu suất Người bán / danh mục**: cùng tập đơn `Hoàn thành` lọc theo `ngayHoanThanh`.
  - **Danh mục được quan tâm** = tổng số lượng đã bán theo `SanPham.danhMucId`. Giao diện đặt tên **"Danh mục được quan tâm"** kèm dòng chú thích **"tính theo số lượng đã bán"** (hệ thống không thu thập lượt xem/tìm kiếm).
  - **Xu hướng mua hàng** = chuỗi số đơn + doanh thu theo ngày/tháng (+ so với kỳ trước ở trang Admin).
  - **Lịch sử giao dịch của Người bán** = đơn `Đã thanh toán` của cửa hàng (gồm đơn COD đã hoàn thành), lọc theo `ngayTao`.
  - Nhóm theo ngày/tháng theo múi giờ `Asia/Ho_Chi_Minh`.
  - **Bắt buộc ghi chú trên giao diện báo cáo:** "Doanh thu tính theo các đơn đã hoàn thành, ghi nhận theo ngày hoàn thành; không phải lợi nhuận."
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-19 — Trao đổi Người dùng – Người bán
- **Nguồn:** Bảng 3.10, 3.18. Góp ý: polling 5 giây là phù hợp đồ án; nhưng có thể tạo **trùng cuộc trò chuyện** khi hai yêu cầu đến cùng lúc.
- **Quyết định:** **Polling** mỗi 5 giây (hằng số), **không** socket.io. Cuộc trò chuyện tạo khi gửi **tin đầu tiên**. **Chỉ mục `(taiKhoanId, cuaHangId)` nâng lên Unique (CR-02, xem Mục E)** nên tìm-hoặc-tạo an toàn: `upsert`, gặp lỗi trùng khóa thì tìm lại bản đã có. Không có "chưa đọc". Không chat với cửa hàng của chính mình. Phân trang tin nhắn theo `thoiGianGui`.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-20 — Thanh toán lại giao dịch VNPay đang chờ
- **Vấn đề:** người dùng đóng tab VNPay giữa chừng thì giao dịch vẫn `Chờ thanh toán` tới 24 giờ. Góp ý: mục tiêu đúng nhưng **chưa xác minh** việc dùng lại `vnp_TxnRef`; không được tạo thêm đơn/trừ kho lần nữa; phải phối hợp với tác vụ tự hủy (QĐ-06).
- **Quyết định:**
  1. **Giữ chức năng** "Thanh toán" cho giao dịch **VNPay** còn `Chờ thanh toán` và còn hạn 24 giờ. Chỉ **tạo lại URL** cho **giao dịch hiện có** — **không** tạo đơn mới, **không** trừ kho/voucher lần nữa.
  2. **BẮT BUỘC thử trên VNPay sandbox trước khi hoàn tất F17** và ghi kết quả vào báo cáo: có dùng lại cùng `vnp_TxnRef` được không. Nếu **không**: dùng **phương án dự phòng đã chấp thuận** — `vnp_TxnRef = maGiaoDich + "R" + 4 chữ số ngẫu nhiên`; khi VNPay trả về thì tách phần trước chữ `R` để tìm giao dịch. Phương án này **không thêm giao dịch, không đổi database**. AI phải nêu rõ trong báo cáo đang dùng phương án nào.
  3. **Phối hợp với tự hủy (QĐ-06):** URL luôn đặt hạn thanh toán (`vnp_ExpireDate`) = `thoiGianTao + 24 giờ` (AI xác minh tham số với tài liệu VNPay). Tác vụ tự hủy chỉ hủy giao dịch khi `thoiGianTao ≤ hiện tại − 24 giờ − THOI_GIAN_GIA_HAN_PHUT` (hằng số **10 phút**), để mọi thanh toán hợp lệ kịp báo về. Việc "thanh toán lại" và "hủy" đều **chiếm quyền bằng thao tác nguyên tử** trên trạng thái giao dịch.
  4. Thanh toán đến muộn sau khi giao dịch đã `Hết hạn`/`Thất bại`: **bỏ qua cập nhật**, ghi log, giao diện báo "liên hệ để hoàn tiền" — xử lý hoàn tiền thủ công.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-21 — Tìm kiếm và lọc sản phẩm
- **Nguồn:** Bảng 3.4; chỉ mục Text trên `tenSanPham` (Bảng 3.45).
- **Quyết định:** Hỗ trợ `tuKhoa` (dùng `$text`; nếu không ra kết quả thì thử lại bằng regex đã **escape**, không dùng input thô làm regex), lọc `danhMucId`, lọc theo chương trình khuyến mãi, sắp xếp mới nhất. **Chưa làm** lọc/sắp xếp theo khoảng giá (giá hiển thị là giá sau khuyến mãi tính động nên không lọc/sắp xếp chính xác bằng truy vấn đơn giản) — ghi nhận hướng phát triển.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-22 — Quy tắc kiểm tra dữ liệu nhỏ (chưa có trong tài liệu)
- **Mặc định đề xuất** (đặt trong `cauHinh.constant.js`):
  - Đăng ký: bắt buộc `email`, `matKhau`, `hoTen`; `soDienThoai` tùy chọn. Email chuẩn hóa `trim + lowercase`. `matKhau` ≥ **8** ký tự.
  - Số điện thoại Việt Nam: 10 chữ số bắt đầu bằng `0` (hoặc `+84` + 9 chữ số). `ngaySinh` không ở tương lai. `gioiTinh` ∈ `Nam, Nữ, Khác`.
  - `soSao` nguyên 1–5. `noiDung` đánh giá/đổi trả/tin nhắn: bắt buộc, `trim`, tối đa **1000** ký tự. Tên sản phẩm ≤ 200, mô tả ≤ 5000, địa chỉ ≤ 500.
  - Phân trang: mặc định 12, tối đa 50.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-23 — Admin và tài khoản Quản trị viên
- **Nguồn:** Bảng 3.20 (Admin quản lý Người dùng và Người bán).
- **Quyết định:** Admin **không** khóa / đặt lại mật khẩu cho tài khoản có vai trò `Quản trị viên` (kể cả chính mình). Đặt lại mật khẩu: **Admin nhập mật khẩu mới** (theo quy tắc ≥ 8 ký tự), hệ thống chỉ lưu bản băm; Admin tự thông báo cho người dùng.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

### QĐ-24 — Đổi mật khẩu khi đang đăng nhập
- **Quyết định:** Người dùng/Người bán/Quản trị viên **tự đổi mật khẩu** khi đã đăng nhập. Endpoint `PATCH /api/tai-khoan/doi-mat-khau`, body `matKhauHienTai`, `matKhauMoi`, `xacNhanMatKhauMoi`.
  - Backend dùng `bcryptjs.compare()` kiểm tra mật khẩu hiện tại; `matKhauMoi` tối thiểu **8 ký tự** (QĐ-22), phải **khớp** `xacNhanMatKhauMoi`, và **khác** mật khẩu hiện tại; sau đó `bcryptjs.hash()` và cập nhật `TaiKhoan.matKhau`.
  - **Không** cho đổi `email`, `vaiTro` qua chức năng này.
  - Đổi thành công → **xóa cookie đăng nhập hiện tại**, yêu cầu **đăng nhập lại**.
  - Không thêm Collection/field; không đổi Class Diagram (chỉ thêm thao tác `doiMatKhau()`).
  - **Giới hạn đã biết:** phiên đăng nhập cũ trên thiết bị khác chưa thể thu hồi ngay (chưa có cơ chế quản lý phiên/token) — ghi vào báo cáo.
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.
---

### QĐ-25 — Các giả định kỹ thuật nhỏ mà các form đã dùng (để bạn duyệt một lần)
- **Nguồn:** các form có chỗ báo cáo chỉ nói "thông tin cần thiết" hoặc chưa nêu giới hạn. Đây **không** đổi nghiệp vụ, chỉ là quy tắc kiểm tra/hiển thị hợp lý.
- **Quyết định:**
  - Tên danh mục **không trùng** (không phân biệt hoa/thường) — kiểm ở service, không thêm unique index (F08).
  - Đăng ký Người bán: `tenCuaHang`, `diaChiCuaHang` **bắt buộc**, `moTaCuaHang` tùy chọn (F10). Khi phê duyệt, hệ thống **tạo `CuaHang`** từ yêu cầu (F10).
  - `giaGoc` sản phẩm là số nguyên **≥ 1** (F12).
  - `maVoucher`: chỉ chữ/số, **4–20 ký tự**, tự viết hoa (F14).
  - Đánh giá công khai hiển thị **họ tên** người đánh giá, không hiển thị email/SĐT (F21).
  - Cửa hàng `Ngừng hoạt động` vẫn đăng nhập và xử lý đơn đã thanh toán được (F11).
  - Thống kê Admin có thêm `soVoiKyTruoc` (% so với kỳ liền trước) để thể hiện "xu hướng" (F27).
  - Thống kê: mặc định **30 ngày gần nhất**, tối đa **366 ngày** mỗi lần xem (F26, F27).
  - Dữ liệu mẫu (`seed:demo`) tạo theo F29, mật khẩu lấy từ `.env`, không chạy ở production.
  - Hạn gửi đổi trả **7 ngày** (`SO_NGAY_DOI_TRA_TOI_DA`), gia hạn kỹ thuật tự hủy **10 phút** (`THOI_GIAN_GIA_HAN_PHUT`); mật khẩu mới phải **khác** mật khẩu hiện tại (F07).
  - Hủy đơn không hoàn lượt voucher trừ khi hủy cả giao dịch VNPay chưa thanh toán (F30).
- **Trạng thái: ĐÃ CHỐT** — làm theo quyết định trên.

---

---

## E. Thay đổi thiết kế dữ liệu ĐÃ DUYỆT (ngoại lệ hợp lệ của nguyên tắc "không thêm field/enum")

AI làm **đúng nguyên văn** các mục sau, kể cả khi tài liệu Collection hoặc `AGENTS.md` chưa cập nhật:

| Mã | Thay đổi | Ảnh hưởng |
|---|---|---|
| **CR-01** | Thêm giá trị **`COD`** cho `DonHang.phuongThucThanhToan` và `GiaoDichThanhToan.phuongThucThanhToan` (tài liệu gốc chỉ có `VNPay`) | F04, F05, F16–F20, F25, F30 |
| **CR-02** | Chỉ mục `CuocTroChuyen(taiKhoanId, cuaHangId)` là **Unique** (gốc: Index thường) | F05, F23 |
| **CR-03** | Thêm field **`DonHang.ngayHoanThanh`** (Date, không bắt buộc, không default; gán khi đơn chuyển `Hoàn thành`) | F05, F19, F20, F22, F26, F27, F30 |

Thay đổi chức năng đi kèm (đã chốt): hủy đơn (F30) · đổi mật khẩu (F07) · đơn 0đ không qua cổng · COD · hạn đổi trả 7 ngày · vô hiệu hóa khuyến mãi = `Đã kết thúc` cố định · dùng `recharts` cho biểu đồ.

Các bất biến của `AGENTS.md` Mục 8 được điều chỉnh tương ứng: Người bán xử lý được đơn **đã thanh toán hoặc COD**; `Đã hủy` có thể do hệ thống **hoặc do chủ đơn** (khi `Chờ xác nhận`); đơn tổng 0đ coi là đã thanh toán; không gọi VNPay khi tổng 0đ hoặc COD.

> Việc sửa lại tài liệu thiết kế/`AGENTS.md` cho khớp là **tùy chọn** của chủ dự án (xem `04_BAN_VA_TAI_LIEU_TUY_CHON.md`); **không** ảnh hưởng việc AI làm.

---

## C. Điểm lệch giữa các tài liệu (để bạn biết — AI đã được hướng dẫn cách xử lý)

| # | Điểm lệch | Cách form xử lý |
|---|---|---|
| 1 | Báo cáo nói Người bán "xóa sản phẩm"; AGENTS cấm xóa cứng dữ liệu đã được tham chiếu | Theo AGENTS + `QĐ-14` |
| 2 | `DanhMuc` không có field trạng thái nhưng AGENTS yêu cầu "ngừng" thay vì xóa | `QĐ-14`: chặn xóa khi còn sản phẩm |
| 3 | `KhuyenMai.trangThai` không có giá trị "vô hiệu hóa" nhưng Bảng 3.23 yêu cầu | `QĐ-12` (v2: `Đã kết thúc` cố định, giữ nguyên ngày) |
| 4 | Báo cáo 3.1.1 nói "lựa chọn phương thức thanh toán" nhưng tài liệu chỉ có VNPay | **v2:** thêm `COD` (CR-01, `QĐ-16`) — đã chốt ở Mục E |
| 5 | `DonHang` không có ngày hoàn thành; báo cáo cần doanh thu theo thời gian và hạn đổi trả | **v2:** thêm `ngayHoanThanh` (CR-03, `QĐ-02`, `QĐ-18`) |
| 6 | `YeuCauDoiTraKhieuNai.trangThaiXuLy` ghi `Chờ xử lý, Đã xử lý,...` (có dấu "...") | Chỉ dùng 2 giá trị đã nêu; không thêm |
| 7 | `CuaHang.trangThaiHoatDong`, `SanPham.trangThaiKinhDoanh`, `Voucher.trangThai` cũng có dấu "..." | Chỉ dùng giá trị đã nêu rõ trong AGENTS 5.7 / tài liệu |
| 8 | Báo cáo có Người bán "từ chối đơn"? — Không: Bảng 3.15 cấm từ chối đơn đã thanh toán; đơn chưa thanh toán thì không xử lý được | Người bán không có thao tác từ chối |
| 9 | Báo cáo Chương 2 và mục 3.2.1 "Ví dụ: Truyện" là **mẫu thừa chưa xóa** | AI bỏ qua các phần mẫu đó |
| 10 | AGENTS gọi tài liệu là `docs/Soopi_3_2_1_Thiet_ke_Collection.md`; file bạn gửi tên `..._2_.md` | Bạn đổi tên khi đưa vào `docs/` |

## D. Những thứ **cố ý chưa làm** (hướng phát triển, AI không tự thêm)

Lọc/sắp xếp theo khoảng giá • trang riêng của cửa hàng • dark mode • socket thời gian thực • đếm tin chưa đọc • rate limiting đăng nhập • lý do từ chối đơn/đăng ký/đổi trả (không có field) • **hoàn tiền tự động** (đơn đã thanh toán bị hủy chỉ được đánh dấu cần hoàn tiền thủ công) • Admin phân xử đổi trả/khiếu nại bị từ chối • ghi lại ai là người ngừng kinh doanh sản phẩm (cần thêm field) • thu hồi phiên đăng nhập cũ sau khi đổi/đặt lại mật khẩu • IPN của VNPay (môi trường local không nhận được) • thống kê hiệu quả từng chương trình khuyến mãi.
