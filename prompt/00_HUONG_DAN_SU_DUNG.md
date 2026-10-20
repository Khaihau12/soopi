# SOOPI — BỘ FORM GIAO VIỆC CHO AI (HƯỚNG DẪN CHO BẠN)

Bộ này gồm **30 form nhỏ** (F01–F30) chia theo tính năng. **Mọi quyết định đã chốt** trong `02_QUYET_DINH_DA_CHOT.md` (bạn đã chấp nhận hết) — AI **làm luôn, không hỏi lại**. Toàn bộ bám theo 3 tệp tài liệu của bạn (`AGENTS.md`, báo cáo, thiết kế Collection).

---

## 1. Danh sách tệp

| Tệp | Dùng để làm gì | Gửi cho AI? |
|---|---|---|
| `00_HUONG_DAN_SU_DUNG.md` | Tệp này, chỉ để **bạn** đọc | Không |
| `01_BOI_CANH_CHUNG.md` | Quy ước chung: không đoán, hợp đồng API tổng, không hard-code, nguyên tắc UI/UX, mẫu báo cáo | **Có, mọi phiên** |
| `02_QUYET_DINH_DA_CHOT.md` | 25 quyết định đã chốt + 3 thay đổi dữ liệu đã duyệt (COD, unique chat, `ngayHoanThanh`) | **Có, mọi phiên** |
| `04_BAN_VA_TAI_LIEU_TUY_CHON.md` | Đoạn chữ để bạn **tự dán** vào tài liệu/`AGENTS.md`/báo cáo cho khớp (không bắt buộc) | Không |
| `F01` … `F30` | Từng đợt công việc | **Có, mỗi phiên một form** |

## 2. Chuẩn bị (làm một lần)

1. **Đặt tài liệu vào repo:** `AGENTS.md` ở thư mục gốc; trong `docs/` đổi tên `Soopi_3_2_1_Thiet_ke_Collection_2_.md` → **`Soopi_3_2_1_Thiet_ke_Collection.md`**, giữ báo cáo `Soopi_V11_MOI_cap_nhat_activity.md`, thêm `01` và `02`.
2. **Môi trường:** MongoDB cài **local**; Node.js; tài khoản **VNPay sandbox** (`TMN Code`, `Hash Secret`) — cần trước khi làm F17.
3. *(Tùy chọn)* dán các đoạn trong `04` vào tài liệu để mã và tài liệu khớp nhau khi bảo vệ.
4. Repo đã có code thì **cứ để nguyên**; mỗi form có "Bước 0 — khảo sát repo".

## 3. Cách gửi một form

Mỗi phiên **đính kèm**: `AGENTS.md` + `01` + `02` + (tài liệu Collection, báo cáo khi form cần) + **form Fxx**, rồi dán:

```text
Bạn là AI lập trình viên của dự án Soopi. Đọc kỹ theo thứ tự:
AGENTS.md → 01_BOI_CANH_CHUNG.md → 02_QUYET_DINH_DA_CHOT.md → tài liệu Collection/báo cáo → FORM Fxx.

Mọi quyết định đã chốt trong 02, hãy làm theo và KHÔNG hỏi lại. Chỉ làm đúng phạm vi FORM Fxx.
Điều gì chưa có ở đâu cả thì chọn phương án đơn giản, gần tài liệu nhất, ghi vào "Giả định đã dùng" rồi làm tiếp.

Trước khi viết mã: tóm tắt 5–8 dòng bạn hiểu form yêu cầu gì và liệt kê các tệp sẽ tạo/sửa.
Sau đó thực hiện, tự kiểm tra theo "Tiêu chí hoàn thành", rồi báo cáo cuối theo mẫu ở 01 Mục 9.
```

> AI chỉ chat (không đọc được repo)? Dán thêm nội dung các tệp liên quan và yêu cầu AI đưa **toàn bộ tệp** đã tạo/sửa.

## 4. Thứ tự làm (mỗi đợt dựa vào đợt trước)

| Giai đoạn | Form |
|---|---|
| **Nền móng** | F01 Backend · F02 Frontend · F03 Hệ thống thiết kế UI · F04–F05 Model |
| **Tài khoản** | F06 Xác thực · F07 Hồ sơ + đổi mật khẩu (cần `seed:admin`) |
| **Hàng hóa** | F08 Danh mục · F09 Sản phẩm công khai + trang chủ |
| **Người bán** | F10 Đăng ký & duyệt · F11 Cửa hàng · F12 Sản phẩm/tồn kho |
| **Ưu đãi** | F13 Khuyến mãi · F14 Voucher |
| **Mua hàng** | F15 Giỏ · F16 Xem trước · **F17 Tạo đơn** · **F18 VNPay/hết hạn** (cần VNPay sandbox) |
| **Sau mua** | F19 Đơn của tôi · F20 Người bán xử lý đơn · **F30 Hủy đơn (làm ngay sau F20)** |
| | F21 Đánh giá · F22 Đổi trả · F23 Chat |
| **Quản trị** | F24 Tài khoản/Cửa hàng · F25 Giao dịch/Sản phẩm/Banner |
| **Báo cáo** | F26 Thống kê Người bán → F27 Thống kê Admin |
| **Bổ sung** | F28 Quên mật khẩu |
| **Kết thúc** | **F29 Hoàn thiện & kiểm thử** (làm sau cùng) |

Mặc định làm **tuần tự**; chỉ làm song song trên nhánh git riêng khi các form không đụng cùng tệp (ví dụ F21/F22/F23).

## 5. Sau mỗi đợt, bạn làm gì (5 phút)

1. Đọc **báo cáo cuối**: mục "Giả định đã dùng" và "Vấn đề cần biết".
2. **Chạy thử** các tiêu chí chính (đăng nhập, thao tác trên điện thoại hoặc thu nhỏ trình duyệt).
3. Kiểm tra không còn tệp lạ/tạm; `npm run build` chạy được.
4. **Commit git** rõ ràng (ví dụ `F12: quan ly san pham va ton kho`).
5. Đổi AI/phiên mới: **dán báo cáo cuối của đợt trước** vào đầu phiên để AI biết tên hàm/tệp đã tạo.

## 6. Những chỗ AI hay làm sai (hãy soi kỹ)

| Dấu hiệu | Cách xử lý |
|---|---|
| Thêm field/enum không có trong tài liệu (ngoài `CR-01..03`) | Yêu cầu bỏ; trích `01` Mục 2 |
| Tin giá/tổng tiền từ frontend | Tính lại ở backend (F16/F17) |
| Trừ kho bằng "đọc rồi ghi" | Thao tác nguyên tử có điều kiện (F17) |
| Quên hoàn kho/voucher khi thất bại/hết hạn/hủy, hoặc hoàn **hai lần** | Soi F18, F30; chạy kịch bản gọi trùng |
| Quên kiểm tra chủ sở hữu ở route `:id` | Thử bằng hai tài khoản (có sẵn trong tiêu chí mỗi form) |
| Viết cứng chuỗi `'Hoàn thành'`, URL, màu | Dùng hằng số/tokens (`01` Mục 5) |
| Màu/bo góc khác nhau giữa các trang; mã màu trong biểu đồ | Màu chỉ lấy từ tokens (bảng màu đã khóa ở F03); biểu đồ lấy màu qua `layMauToken` |
| Controller viết truy vấn dài, route chứa logic, component gọi `fetch` | Tách đúng tầng Route → Controller → Service → Model |
| Thêm thư viện lạ (axios, socket.io, MUI, thư viện biểu đồ khác `recharts`) | Không chấp nhận (`01` Mục 4.7) |
| Tự đặt mức tối thiểu VNPay là 1 VND, hoặc chặn đơn 0đ | `QĐ-16`: đơn 0đ không qua cổng; mức VNPay lấy từ tài liệu VNPay |
| Báo "xong" nhưng chưa chạy thử | Yêu cầu liệt kê lệnh đã chạy và kết quả |

## 7. Mẫu yêu cầu sửa khi AI làm lệch

```text
Phần <tên phần> chưa đúng FORM Fxx, mục <số mục>: <mô tả ngắn chỗ lệch>.
Hãy sửa đúng theo form, không đổi các phần khác, rồi chạy lại các tiêu chí hoàn thành
liên quan và báo cáo kết quả.
```

## 8. Những điều cố ý chưa làm (hướng phát triển)

Lọc/sắp xếp theo giá · trang riêng của cửa hàng · dark mode · WebSocket · chưa đọc/đang gõ · giới hạn tốc độ đăng nhập · lý do từ chối (không có field) · hoàn tiền tự động (chỉ đánh dấu "cần hoàn tiền thủ công") · Admin phân xử đổi trả · ghi nguồn gốc ngừng bán sản phẩm · thu hồi phiên đăng nhập cũ · IPN của VNPay (local không nhận được).

## 9. Lưu ý về VNPay

Tên tham số, cách ký và mã phản hồi **phải theo tài liệu chính thức của VNPay**; form chỉ nêu các điểm bắt buộc theo `AGENTS.md`. AI sẽ **đối chiếu tài liệu VNPay và thử trên sandbox** (F17, F18). Bạn cũng tự thử thanh toán thành công/thất bại bằng thông tin thử nghiệm do VNPay cung cấp.
