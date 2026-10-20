# FORM F29 — HOÀN THIỆN, RÀ SOÁT TOÀN HỆ THỐNG, TÀI LIỆU CHẠY

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt), toàn bộ tài liệu trong `docs/`.
> **Phụ thuộc:** **tất cả** form F01–F27 và **F30** và F28 đã hoàn thành.
> **Tính chất:** đây là đợt **rà soát và sửa lỗi**, **không thêm tính năng mới**. Mọi chỗ phát hiện sai lệch → sửa theo đúng form gốc, báo cáo từng điểm.

## 1. Mục tiêu

Bảo đảm hệ thống **chạy trọn vẹn, đúng tài liệu, an toàn, nhất quán**, và có hướng dẫn chạy cho người khác. Gồm: bản đồ phủ use case, rà soát bảo mật/quyền, rà soát "không hard-code", rà soát giao diện, kiểm thử luồng đầu–cuối, dữ liệu mẫu, README.

## 2. Việc 1 — Ma trận phủ use case (bắt buộc điền và nộp trong báo cáo)

Mỗi dòng: xác nhận đã có **API + trang giao diện + đã tự kiểm thử**.

| Bảng báo cáo | Chức năng | Form |
|---|---|---|
| 3.1, 3.2 | Đăng nhập, đăng ký (+ quên mật khẩu) | F06, F28 |
| 3.3 | Quản lý thông tin cá nhân (+ đổi mật khẩu, `QĐ-24`) | F07 |
| 3.4 | Xem, tìm kiếm sản phẩm; hiển thị giá khuyến mãi, Flash Sale, voucher | F09, F13, F14 |
| 3.5 | Quản lý giỏ hàng | F15 |
| 3.6 | Đặt hàng và thanh toán (VNPay, **COD**, **đơn 0đ**, thất bại, quá 24 giờ, thanh toán lại) | F16, F17, F18 |
| 3.7 | Quản lý và theo dõi đơn hàng (+ **hủy đơn** khi `Chờ xác nhận`) | F19, **F30** |
| 3.8 | Đổi trả và khiếu nại (Người dùng) | F22 |
| 3.9 | Đánh giá sản phẩm | F21 |
| 3.10 | Trao đổi với Người bán | F23 |
| 3.11 | Đăng ký trở thành Người bán | F10 |
| 3.12 | Quản lý tài khoản và cửa hàng (Người bán) | F11 |
| 3.13 | Quản lý sản phẩm và tồn kho | F12 |
| 3.14 | Quản lý khuyến mãi và voucher (Người bán) | F13, F14 |
| 3.15 | Quản lý đơn hàng (Người bán) | F20 |
| 3.16 | Quản lý đổi trả (Người bán) | F22 |
| 3.17 | Quản lý doanh thu và báo cáo (Người bán) | F26 |
| 3.18 | Hỗ trợ khách hàng (Người bán) | F23 |
| 3.19 | Duyệt đăng ký Người bán | F10 |
| 3.20 | Quản lý tài khoản và hệ thống | F24 |
| 3.21 | Quản lý danh mục và sản phẩm | F08, F25 |
| 3.22 | Quản lý giao dịch thanh toán | F25 |
| 3.23 | Quản lý quảng cáo, khuyến mãi, voucher hệ thống | F13, F14, F25 |
| 3.24 | Báo cáo và phân tích | F27 |

Mục nào **chưa đủ** → quay lại sửa trong đợt này (không tạo form mới) hoặc ghi rõ vào báo cáo cuối.

## 2b. Việc 1b — Kiểm tra kiến trúc (theo `AGENTS.md`)

- Backend: `app.js`/`server.js`, `routes/` (chỉ khai báo), `controllers/` (chỉ nhận/trả), `services/` (nghiệp vụ, không nhận `req/res`), `models/` (schema), `config/`, `middlewares/`; luồng một chiều Route → Controller → Service → Model.
- Frontend: giao diện (`pages/`, `components/`) · gọi API (`services/httpClient.js` + `*.api.js`, **không** component nào gọi `fetch` trực tiếp) · hiển thị dữ liệu (`useGoiApi`) · sự kiện/form/state.
- Tìm và sửa vi phạm: controller chứa truy vấn/logic dài, route chứa logic, model chứa nghiệp vụ.

## 3. Việc 2 — Rà soát quyền và sở hữu (bảo mật)

Lập bảng **mọi endpoint** (đối chiếu `01` Mục 10) × {chưa đăng nhập, Người dùng, Người bán, Quản trị viên, tài khoản bị khóa, chủ sở hữu khác} và **thực sự gọi thử** (curl/Postman hoặc script tạm). Kỳ vọng:

- Chưa đăng nhập vào API cần đăng nhập → **401**; thiếu vai trò → **403**; tài khoản `Bị khóa` → **403** ở mọi API có xác thực.
- Mọi route có `:id` của dữ liệu riêng tư (đơn, giỏ, đánh giá/yêu cầu của mình, cuộc trò chuyện, sản phẩm/khuyến mãi/voucher của cửa hàng, giao dịch) **kiểm tra chủ sở hữu** và trả **404** với dữ liệu của người khác.
- Không có API nào cho phép tự gán `vaiTro`, đổi `trangThaiXuLy` đơn ngoài Người bán đúng quy tắc, đổi giá/tổng tiền từ client.
- Không response nào chứa `matKhau`, `JWT_SECRET`, secret VNPay, stack trace, chuỗi kết nối DB.
- Quét mã: không còn secret/URL/URI thật trong repo (`git grep` các từ `mongodb://`, `secret`, `hashsecret`, `password`); `.env` nằm trong `.gitignore`; `.env.example` chỉ có placeholder và **đủ** biến cần dùng (`PORT, MONGODB_URI, JWT_SECRET, FRONTEND_URL, NODE_ENV, VNP_*, ADMIN_*`, và `DEMO_*` nếu có).
- Mọi input đưa vào regex đã được escape; không có `dangerouslySetInnerHTML`; cookie `token` có `httpOnly`.
- Tìm mọi chỗ trừ/cộng `soLuongTon`, `Voucher.soLuong`: chỉ nằm ở **F17 (trừ)**, **F18 (hoàn khi thất bại/hết hạn)**, **F30 (hoàn khi người dùng hủy)**, `F12 (người bán chỉnh tồn kho)` — và đều dùng thao tác nguyên tử có điều kiện, hoàn **đúng một lần**.
- **Kiểm tra backend tự chặn (không dựa giao diện):** gọi API trực tiếp thêm giỏ/xem trước/đặt hàng với sản phẩm `Ngừng kinh doanh` hoặc cửa hàng `Ngừng hoạt động` → bị từ chối (`QĐ-15`).
- **Đối chiếu 3 thay đổi đã duyệt (`02` Mục E):** mã nguồn chỉ có thêm đúng `COD` trong enum phương thức thanh toán, đúng field `DonHang.ngayHoanThanh`, và đúng unique `CuocTroChuyen(taiKhoanId, cuaHangId)`; **không** có field/enum nào khác ngoài tài liệu Collection (kể cả 3 thay đổi CR ở `02` Mục E).

## 4. Việc 3 — Rà soát tính nhất quán dữ liệu

Chạy script/kiểm thử tạm (xóa sau) trên dữ liệu thật của các luồng đầu–cuối ở Mục 6, rồi xác nhận:

- Không có `DonHang` mồ côi (thiếu `GiaoDichThanhToan`/`ChiTietDonHang`), không có `ChiTietDonHang` tham chiếu đơn không tồn tại.
- Sau mỗi kịch bản **thất bại/hết hạn**: tổng `soLuongTon` và `Voucher.soLuong` **trở về đúng** giá trị trước đó.
- `GioHang.tongGiaTri` khớp công thức F15 sau mọi thao tác.
- Không có `TaiKhoan.vaiTro` rỗng hoặc trùng giá trị; mỗi Người bán có **đúng một** `CuaHang`.
- `tongThanhToan = tongTienHang − tongGiamVoucher + phiVanChuyen − giamPhiVanChuyen` đúng ở **mọi** `DonHang`, và `GiaoDichThanhToan.soTien = Σ tongThanhToan` của các đơn thuộc nó.
- Không có enum nào trong DB nằm ngoài danh sách hợp lệ của AGENTS 5.7 **kể cả CR ở `02` Mục E** (có thêm `COD` ở phương thức thanh toán).
- **Mọi** đơn `Hoàn thành` đều có `ngayHoanThanh`; đơn **COD** `Hoàn thành` có `trangThaiThanhToan = Đã thanh toán` và giao dịch COD `Thành công`; đơn `Chờ xác nhận`/`Đã xác nhận`… chưa có `ngayHoanThanh`.
- Mỗi cặp (`taiKhoanId`, `cuaHangId`) có tối đa **một** `CuocTroChuyen`.
- Đơn `Đã hủy` **không** làm sai doanh thu (không được tính); đơn VNPay `Đã hủy` + `Đã thanh toán` + `tongThanhToan > 0` đều hiện trong danh sách "cần hoàn tiền thủ công" của Quản trị viên.

## 5. Việc 4 — Rà soát "không hard-code" và chất lượng mã

- Tìm chuỗi enum có dấu (`'Hoàn thành'`, `'Đã hủy'`, `'Chờ xác nhận'`...) viết trực tiếp **ngoài** file hằng số → thay bằng hằng số.
- Tìm URL/port/đường dẫn route/số "ma thuật" (24, 30000, 5000, 12, 50...) viết trực tiếp ngoài `.env`/`cauHinh.constant.js`/`hangSo.js` → đưa về nơi đúng.
- Tìm mã màu, `px` cho khoảng cách/bo góc/z-index viết trực tiếp trong CSS component (ngoại trừ vùng bấm 44px có chú thích) → dùng tokens.
- Tìm `console.log` còn sót, mã chú thích bị bỏ, file tạm, trang `GiaoDienMauPage`, script thử → **xóa**.
- Tìm hàm lặp lại cùng logic (tính giá, kiểm tra quyền sở hữu, dựng chi tiết đơn) → dùng lại hàm dùng chung, **không** refactor lớn ngoài phạm vi.
- Tìm truy vấn N+1 ở các danh sách (sản phẩm, giỏ, đơn, đánh giá, yêu cầu, chat, thống kê) → số truy vấn phải **cố định**.
- Chạy toàn bộ script `lint`/`test`/`build` **có trong `package.json`** của backend và frontend; sửa mọi lỗi/cảnh báo.

## 6. Việc 5 — Kiểm thử luồng đầu–cuối (làm tay, ghi kết quả từng bước)

Dùng hai trình duyệt/hồ sơ riêng (hoặc cửa sổ ẩn danh) để mô phỏng nhiều vai trò. Có thể dùng dữ liệu mẫu ở Việc 6.

1. **Khách:** xem trang chủ, tìm kiếm "áo", lọc danh mục, xem chi tiết (thấy giá gốc/giá khuyến mãi, voucher, đánh giá), thêm giỏ → bị chuyển đăng nhập.
2. **Đăng ký → đăng nhập → hồ sơ** (nhập địa chỉ).
3. **Đăng ký Người bán** (hai tài khoản A, B) → **Quản trị viên duyệt** A, từ chối B; A thấy menu "Kênh người bán" **không cần đăng nhập lại**.
4. **Người bán A:** sửa cửa hàng; thêm 2–3 sản phẩm có ảnh; tạo chương trình `Giảm giá`; tạo voucher cửa hàng. (Có thêm Người bán C với cửa hàng thứ hai để thử tách đơn.)
5. **Quản trị viên:** tạo voucher Toàn sàn và Freeship; banner; Flash Sale Toàn sàn.
6. **Người dùng mua hàng:** giỏ có sản phẩm của **2 cửa hàng** → chọn một phần → xem trước đơn (tách 2 đơn, voucher đủ loại, voucher sai bị loại có lý do) → đặt hàng → VNPay sandbox: **(a)** thanh toán thành công; **(b)** lần khác: hủy tại cổng; **(c)** lần khác: bỏ dở và ép hết hạn (chỉnh `thoiGianTao` lùi 25 giờ).
7. **Người bán** xử lý đơn đã thanh toán đi hết các trạng thái đến `Hoàn thành`; **Người dùng** theo dõi từng bước.
8. **Người dùng:** đánh giá sản phẩm; gửi đổi trả/khiếu nại → Người bán chấp nhận; (một dòng khác) Người bán từ chối.
9. **Chat hai chiều** giữa Người dùng và Người bán (gửi/nhận/ xem tin cũ).
10. **Quản trị viên:** khóa tài khoản đang đăng nhập (phiên bị chặn ngay), mở khóa; đặt lại mật khẩu; ngừng hoạt động cửa hàng (sản phẩm biến mất, Người bán vẫn xử lý đơn đã thanh toán); xử lý sản phẩm; xem giao dịch; xem báo cáo — số liệu khớp các đơn vừa tạo.
11. **Hai người mua món cuối cùng** cùng lúc (chạy song song) → chỉ một thành công.
12. **Đổi giá/khuyến mãi** sau khi đặt → đơn cũ không đổi.
13. **COD:** đặt hàng chọn COD (giỏ 2 cửa hàng) → 2 đơn `Chờ thanh toán`, không qua VNPay; Người bán xử lý ngay đến `Hoàn thành` → đơn thành `Đã thanh toán`, có `ngayHoanThanh`, giao dịch COD `Thành công`; đơn COD quá 24 giờ **không** bị tự hủy.
14. **Đơn 0đ:** dùng voucher giảm hết → đơn `Đã thanh toán` ngay, không có bước VNPay (cả VNPay lẫn COD).
15. **Hủy đơn (F30):** (a) giao dịch VNPay chưa thanh toán gồm 2 đơn → hủy cả hai, kho + voucher hoàn đúng; (b) đơn VNPay đã thanh toán, `Chờ xác nhận` → `Đã hủy`, kho hoàn, Quản trị viên thấy "cần hoàn tiền thủ công"; (c) đơn COD → `Đã hủy`; (d) đơn đã `Đã xác nhận` → không hủy được; (e) đua "hủy" với "xác nhận".
16. **Đổi mật khẩu (F07):** cho cả Người dùng, Người bán, Quản trị viên: đổi thành công → bị đăng xuất, đăng nhập lại bằng mật khẩu mới; thử các ca sai.
17. **Hạn đổi trả (F22):** hoàn thành 3 ngày → gửi được; quá 7 ngày → bị từ chối; yêu cầu bị từ chối → có hướng dẫn nhắn tin cho cửa hàng.
18. **Khuyến mãi (F13) — ca góp ý:** vô hiệu hóa chương trình `Chưa bắt đầu` → `Đã kết thúc` **cố định**, ngày giữ nguyên, không bao giờ quay lại `Chưa bắt đầu`; giá luôn là giá gốc.
19. **Báo cáo (F26, F27):** đơn đặt cuối tháng, hoàn thành đầu tháng sau → doanh thu thuộc tháng sau; chú thích "không phải lợi nhuận" và "danh mục được quan tâm — theo số lượng đã bán" hiển thị; biểu đồ `recharts` dùng màu từ tokens.
20. **Chat đồng thời (F23):** hai tin đầu cùng lúc → chỉ một `CuocTroChuyen`.
21. **VNPay thanh toán lại (F17, F18):** đóng tab rồi thanh toán lại; thanh toán đến muộn sau khi hết hạn bị bỏ qua và ghi log.

Ghi lại từng bước: ✔/✘, ảnh chụp màn hình hoặc mô tả ngắn, lỗi phát hiện và cách sửa.

## 7. Việc 6 — Dữ liệu mẫu (tùy chọn, **mặc định CÓ**)

- Tạo `backend/scripts/taoDuLieuMau.js` + script npm `seed:demo`: tạo vài danh mục, 2–3 Người bán + cửa hàng, ~10 sản phẩm (chưa cần ảnh thật; ảnh trống dùng khung thay thế), một khuyến mãi + một Flash Sale, vài voucher, 1–2 banner (cần đường dẫn ảnh hợp lệ — có thể bỏ qua banner nếu chưa có ảnh).
- Mật khẩu tài khoản mẫu lấy từ biến `.env` (`DEMO_PASSWORD`), **không** ghi cứng trong mã; chạy lặp lại không tạo trùng; **từ chối chạy khi `NODE_ENV=production`**.
- Nếu bạn (người dùng) không muốn → bỏ qua và ghi rõ trong báo cáo.

## 8. Việc 7 — Giao diện: rà soát cuối

Đi qua **mọi trang** (liệt kê theo `DUONG_DAN`) ở **360px, 768px, 1280px**:
- Không cuộn ngang ngoài ý muốn; không chữ bị tràn/cắt xấu; ảnh không méo.
- Mỗi trang gọi API đều có đủ **tải / rỗng / lỗi / thành công**; không có trang trắng khi lỗi.
- Điều hướng bàn phím trọn vẹn, focus nhìn thấy; hộp thoại giữ focus; mọi nút icon có `aria-label`; ảnh có `alt`; trường form có nhãn; lỗi form gắn `aria-describedby`.
- Tương phản chữ đủ (chữ chính/phụ/placeholder, chữ trên nút chính, nhãn giá).
- Văn phong thống nhất: cùng một hành động cùng một tên; thông báo lỗi nói rõ cách sửa; không còn chữ tiếng Anh/chữ giữ chỗ.
- Một trang chỉ một nút chính; mọi thao tác xóa/khóa/duyệt/từ chối qua `ConfirmDialog`.
- Mọi mục menu, liên kết, nút điều hướng đều dẫn tới trang tồn tại (không có liên kết chết); mọi route trong `DUONG_DAN` có trang.
- Console trình duyệt không có lỗi/cảnh báo (key trùng, thuộc tính không hợp lệ, hook thiếu phụ thuộc...).
- Hiệu năng cơ bản: ảnh `loading="lazy"`, không tải lại không cần thiết, danh sách lớn có phân trang.

## 9. Việc 8 — `README.md` (một file ở thư mục gốc, ngắn gọn, tiếng Việt)

Chỉ gồm: giới thiệu 3 dòng; yêu cầu cài đặt (Node, MongoDB local); các bước chạy backend/frontend (đúng script có thật); bảng biến môi trường (tên, ý nghĩa — **không** giá trị thật); cách tạo Quản trị viên (`seed:admin`) và dữ liệu mẫu (`seed:demo` nếu có); cách cấu hình VNPay sandbox (nơi lấy `VNP_TMN_CODE`, `VNP_HASH_SECRET`); **danh sách giới hạn đã biết** (lấy từ báo cáo các form: đặt hàng hai lần đồng thời, sập giữa chừng khi hoàn voucher, không IPN, **không hoàn tiền tự động (chỉ đánh dấu cần hoàn tiền thủ công)**, thanh toán VNPay đến muộn cần xử lý thủ công, phiên đăng nhập cũ **không thu hồi được** sau khi đổi/đặt lại mật khẩu, Người bán bật lại sản phẩm bị Admin ngừng, hủy riêng một đơn không hoàn voucher, chưa lọc/sắp xếp theo giá, ảnh cũ không tự xóa, doanh thu ≠ lợi nhuận). Không tạo thêm tài liệu khác.

## 10. Không được làm

- Không thêm tính năng, field, collection, endpoint mới ngoài các form đã làm.
- Không sửa tài liệu thiết kế (`docs/`) hay AGENTS.md; không đổi cấu trúc thư mục lớn.
- Không "dọn dẹp" kiểu viết lại hàng loạt; chỉ sửa những gì rà soát chỉ ra.
- Không che giấu lỗi chưa sửa được — ghi vào báo cáo.

## 11. Tiêu chí hoàn thành

- [ ] Ma trận use case (Mục 2) đầy đủ ✔.
- [ ] Bảng kiểm quyền/sở hữu (Mục 3) đã gọi thử thật, **không** có ô sai kỳ vọng còn tồn tại.
- [ ] Các kiểm tra nhất quán (Mục 4) đạt.
- [ ] Rà soát hard-code/N+1/dọn dẹp (Mục 5) xong; `lint`/`test`/`build` hiện có đều chạy sạch.
- [ ] 21 kịch bản đầu–cuối (Mục 6) đều ✔ (hoặc ghi rõ lý do chưa làm được).
- [ ] Giao diện (Mục 8) đạt ở 3 kích thước.
- [ ] `README.md` đủ để người khác chạy được từ máy trống.

## 12. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9, kèm: ma trận use case, bảng kiểm quyền (rút gọn các ô lỗi đã sửa), kết quả 21 kịch bản, danh sách mọi sai lệch đã phát hiện và cách xử lý, danh sách giới hạn đã biết.
