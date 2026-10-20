# 04 — BẢN VÁ TÀI LIỆU (TÙY CHỌN — KHÔNG CẦN GỬI CHO AI)

> **Tệp này chỉ dành cho bạn.** Các thay đổi (CR-01, CR-02, CR-03 và thay đổi chức năng) **đã được chốt** trong `02_QUYET_DINH_DA_CHOT.md` Mục E; AI làm theo `02`, **không cần** tệp này.
> Nếu bạn muốn **tài liệu thiết kế/`AGENTS.md`/báo cáo khớp với mã** (để bảo vệ không bị lệch), hãy dán các đoạn dưới đây vào. Không dán cũng không sao.

## 1. Ba thay đổi thiết kế dữ liệu (CR)

| Mã | Thay đổi | Lý do | Form ảnh hưởng | Duyệt |
|---|---|---|---|---|
| **CR-01** | Thêm giá trị **`COD`** vào `DonHang.phuongThucThanhToan` và `GiaoDichThanhToan.phuongThucThanhToan` (hiện chỉ có `VNPay`) | Bạn yêu cầu có COD để demo, bỏ qua cổng thanh toán; dùng cho đơn nhỏ/đơn không muốn trả online | F04, F05, F16, F17, F18, F19, F20, F25, F30 | ✔ Đã chốt |
| **CR-02** | Đổi chỉ mục `CuocTroChuyen(taiKhoanId, cuaHangId)` từ *Index* thành **Unique** | Chặn tạo trùng cuộc trò chuyện khi hai yêu cầu đến cùng lúc (góp ý QĐ-19) | F05, F23 | ✔ Đã chốt |
| **CR-03** | Thêm field **`DonHang.ngayHoanThanh`** (Date, **không bắt buộc**, chỉ có giá trị khi đơn `Hoàn thành`) | (1) Tính hạn đổi trả từ lúc hoàn thành (góp ý QĐ-2); (2) doanh thu ghi nhận theo ngày hoàn thành, báo cáo tháng cũ không bị đổi khi đơn cũ hoàn thành muộn (góp ý QĐ-18) | F05, F20, F22, F26, F27, F30 | ✔ Đã chốt |


## 2. Thay đổi chức năng (không đổi cấu trúc dữ liệu)

| Mã | Chức năng | Ở đâu |
|---|---|---|
| FA-01 | **Người dùng tự hủy đơn** khi đơn còn `Chờ xác nhận` (kèm quy tắc thanh toán/tồn kho) | `F30` (QĐ-3) |
| FA-02 | **Đổi mật khẩu khi đang đăng nhập** cho cả 3 vai trò | `F07` (QĐ-24) |
| FA-03 | Đơn có **tổng thanh toán = 0đ** tự động được coi là đã thanh toán, **không qua cổng** | `F17` (QĐ-16) |
| FA-04 | **Thanh toán COD**: không qua VNPay; trả tiền khi nhận hàng | `F16`–`F20` (QĐ-16) |
| FA-05 | **Hạn gửi đổi trả 7 ngày** kể từ lúc hoàn thành + hướng dẫn khi bị từ chối | `F22` (QĐ-2) |
| FA-06 | **Vô hiệu hóa khuyến mãi** = đặt `Đã kết thúc` cố định, giữ nguyên ngày | `F13` (QĐ-12) |
| FA-07 | Cho phép thư viện biểu đồ **`recharts`** (chỉ cho thống kê) | `F26`, `F27` (QĐ-11) |

## 3. Bản vá cho tài liệu thiết kế Collection (`Soopi_3_2_1_Thiet_ke_Collection.md`)

**Bảng 3.37 — Collection `DonHang`**
- Sửa dòng `phuongThucThanhToan` thành:
  `| phuongThucThanhToan | String | Phương thức thanh toán của đơn (VNPay hoặc COD) |`
- Thêm một dòng ngay **sau** dòng `ngayTao`:
  `| ngayHoanThanh | Date | Thời điểm đơn chuyển sang Hoàn thành (không bắt buộc; trống khi đơn chưa hoàn thành) |`

**Bảng 3.39 — Collection `GiaoDichThanhToan`**
- Sửa dòng `phuongThucThanhToan` thành:
  `| phuongThucThanhToan | String | Phương thức thanh toán (VNPay hoặc COD) |`

**Bảng 3.45 — Chỉ mục và ràng buộc**
- Sửa dòng `CuocTroChuyen` thành:
  `| CuocTroChuyen | taiKhoanId, cuaHangId | Unique | Mỗi cặp Người dùng – cửa hàng chỉ có một cuộc trò chuyện |`

**Mô tả trường trong các bảng khác nếu có nhắc "chỉ VNPay":** đổi thành "VNPay hoặc COD".

## 4. Bản vá cho `AGENTS.md`

1. **Mục 5.7 (bảng enum)** — thêm hai dòng:
   ```
   | `DonHang.phuongThucThanhToan` | `VNPay`, `COD` |
   | `GiaoDichThanhToan.phuongThucThanhToan` | `VNPay`, `COD` |
   ```
2. **Mục 7 (Phạm vi và vai trò)**
   - Ở dòng **NguoiDung**, thêm: "đổi mật khẩu khi đang đăng nhập, hủy đơn khi đơn còn `Chờ xác nhận`".
   - Dòng "Ngoài phạm vi đề tài" giữ nguyên "không hoàn tiền tự động" và thêm: "đơn đã thanh toán bị hủy được đánh dấu *cần hoàn tiền thủ công* để Quản trị viên xử lý ngoài hệ thống".
3. **Mục 8 — "Trạng thái đơn"**: thay hai gạch đầu dòng cuối bằng:
   - "NguoiBan chỉ xác nhận/xử lý đơn đã `Đã thanh toán` **hoặc** đơn `COD`. NguoiBan **không được từ chối hay hủy** đơn."
   - "`Đã hủy` do hệ thống đặt khi thanh toán thất bại/hết hạn, **hoặc** do chủ đơn hủy khi đơn còn `Chờ xác nhận`. Mọi lần đổi trạng thái phải kiểm tra role, quyền sở hữu và trạng thái hiện tại."
   - "Đơn `COD`: `trangThaiThanhToan` giữ `Chờ thanh toán` cho tới khi NguoiBan chuyển `Hoàn thành`; khi đó thành `Đã thanh toán` và ghi `ngayHoanThanh`."
   - "Đơn có `tongThanhToan = 0`: coi là `Đã thanh toán` ngay khi tạo, không qua cổng thanh toán."
   - "Đơn `Hoàn thành` luôn có `ngayHoanThanh`."
4. **Mục 9 (VNPay)** — thêm:
   - "Không gọi VNPay khi tổng thanh toán của giao dịch bằng 0. Đơn `COD` không tạo giao dịch VNPay."
   - "Kiểm tra giới hạn số tiền tối thiểu/tối đa theo tài liệu VNPay chính thức trước khi tạo URL thanh toán."
5. **Mục 2 / quy tắc thư viện** — thêm: "Được dùng `recharts` cho biểu đồ thống kê (F26, F27). Không thêm thư viện biểu đồ khác."
6. **Mục 18 — danh sách "chưa quy định, hỏi lại"**: ghi chú ở cuối "Các điểm trên đã được chốt trong `02_QUYET_DINH_DA_CHOT.md`".

## 5. Bản vá cho báo cáo (gợi ý ngắn)

- **Bảng 3.3** (Quản lý thông tin cá nhân): thêm luồng *Đổi mật khẩu* (nhập mật khẩu hiện tại, mật khẩu mới, xác nhận; sau khi đổi phải đăng nhập lại).
- **Bảng 3.6** (Đặt hàng và thanh toán): thêm phương thức *COD*; đơn tổng 0đ không qua cổng; số tiền VNPay theo giới hạn của VNPay.
- **Bảng 3.7** (Theo dõi đơn): thêm *Hủy đơn* khi đơn còn `Chờ xác nhận`; nêu cách xử lý thanh toán/tồn kho.
- **Bảng 3.8** (Đổi trả): thêm điều kiện *trong 7 ngày kể từ khi hoàn thành* và hướng dẫn khi yêu cầu bị từ chối.
- **Bảng 3.14, 3.23** (Khuyến mãi): nêu cách vô hiệu hóa chương trình (đặt `Đã kết thúc`, không đổi ngày).
- **Bảng 3.17, 3.24** (Báo cáo): doanh thu tính theo đơn **đã hoàn thành**, ghi nhận theo **ngày hoàn thành**; "Danh mục được quan tâm" đo bằng số lượng đã bán; doanh thu **không phải lợi nhuận**.
- **Class diagram / ERD:** thêm thuộc tính `DonHang.ngayHoanThanh`, giá trị `COD`; thêm thao tác `TaiKhoan.doiMatKhau()`, `DonHang.huyDon()`.
