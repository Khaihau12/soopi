# DESIGN.md — Quy chuẩn giao diện Soopi

> Phạm vi: website Người mua, bảng quản lý Người bán và Quản trị viên. Đây là **quy chuẩn thiết kế để dùng khi làm UI**, không phải tài liệu thay thế nghiệp vụ hoặc yêu cầu cài thư viện. Cập nhật quy chuẩn này khi nhóm chốt nhận diện hoặc khi frontend thực tế có quyết định khác.

## 1. Project Overview

Soopi là sàn thương mại điện tử nhiều người bán. Ba khu vực dùng chung ngôn ngữ thị giác nhưng khác nhiệm vụ: Người mua khám phá và đặt hàng; Người bán quản lý đúng cửa hàng của mình; Quản trị viên quản lý dữ liệu toàn sàn. Thanh toán hỗ trợ VNPay và COD theo QĐ-16; vận chuyển chỉ mô phỏng bằng phí và trạng thái.

**Tình trạng hiện tại:** `frontend/` đã có Vite + React, router và các tiện ích nền từ F02. F03 chốt bộ token và thành phần giao diện trong `frontend/src/index.css`, `components/` và `layouts/`. Bản Figma cũ dùng sắc cam; màu triển khai chính thức là teal theo `02_QUYET_DINH_DA_CHOT.md` QĐ-11 và F03. Logo SVG đơn giản nằm tại `frontend/public/logo-soopi.svg`.

Nguồn nghiệp vụ trong project: AGENTS.md; `prompt/Soopi_Forms/02_QUYET_DINH_DA_CHOT.md`; .md/Soopi_3.2.1_Thiet_ke_Collection.md; .md/Soopi_V11_MOI_cap_nhat_activity/Soopi_V11_MOI_cap_nhat_activity.md. Ba file .md/Soopi_Figma_Kiem_dinh_giao_dien_NguoiMua.md, .md/Soopi_Figma_Kiem_dinh_giao_dien_NguoiBan.md và .md/Soopi_Figma_Kiem_dinh_giao_dien_QuanTriVien.md bổ sung các lỗi cần tránh theo từng màn. Quyết định mới đã chốt trong `02` ưu tiên hơn quy tắc cũ khi chúng mâu thuẫn; DESIGN.md quy định cách thể hiện.

## 2. Design Vision & Principles

**Modern Marketplace — clean, professional, friendly, trustworthy.** Tạo cảm giác mua sắm nhanh và đáng tin, với ảnh sản phẩm, giá cuối và hành động chính dễ nhận thấy. Bảng quản lý ưu tiên khả năng đọc, lọc và quyết định hơn hiệu ứng trang trí.

1. **Một màn, một việc chính:** CTA nổi bật gắn với bước tiếp theo; hành động phụ nhẹ hơn; hành động nguy hiểm cần xác nhận.
2. **Thông tin có thứ bậc:** tên/ảnh sản phẩm → giá và trạng thái → chi tiết; trên dashboard: số cần xử lý → bảng tác vụ → phân tích.
3. **Mật độ vừa đủ:** khoảng trắng để phân nhóm, không tạo vùng trống lớn khiến form hay bảng bé khó đọc.
4. **Nhìn thấy trạng thái thật:** màu đi kèm chữ; loading, rỗng, lỗi và thành công luôn có nội dung hữu ích.
5. **Dữ liệu thật trước vẻ ngoài:** giá, voucher, trạng thái đơn, quyền vai trò, email cửa hàng phải phù hợp tài liệu Soopi.

## 3. Brand Identity

- Logo: ô bo góc teal với nét chữ S trắng, kèm chữ “Soopi” teal đậm. Dùng thống nhất `frontend/public/logo-soopi.svg` ở header và sidebar; giữ khoảng trống quanh logo, không thêm hiệu ứng trang trí.
- Teal `#0F766E` là màu nhận diện và CTA đã chốt. Giá bán và nhãn giảm giá dùng rose `#E11D48`; văn bản dài và bảng dùng màu chữ trung tính.
- Tính cách nội dung: gần gũi, rõ ràng, trung thực về phí, voucher và kết quả VNPay. Không dùng đồng hồ đếm ngược hoặc cam kết giao hàng khi hệ thống không có dữ liệu.
- Hình ảnh sản phẩm cần nổi bật, có tỉ lệ và phong cách xử lý nhất quán. Không dùng hàng loạt ảnh trống hay cùng một hình cho các sản phẩm khác nhau.

## 4. Visual Theme & Atmosphere

Nền xanh xám rất nhẹ, surface trắng, viền slate mảnh, nhấn teal và chữ xanh than. Trang mua sắm ưu tiên ảnh và giá; dashboard giữ bảng dễ quét. Không dùng glassmorphism, gradient trang trí hoặc hiệu ứng mạnh trên giỏ hàng, thanh toán và quản trị.

Trên desktop, header mua sắm có tìm kiếm rõ; bảng điều khiển dùng sidebar + topbar. Các khối cần thẳng hàng theo grid; ưu tiên một mức đổ bóng nhẹ hoặc viền, không chồng cả hai quá mạnh.

## 5. Color Palette & Semantic Tokens

Bảng màu **chính thức theo QĐ-11 và F03**. Mọi giá trị dưới đây được khai báo một lần ở `frontend/src/index.css` trong `:root`; component chỉ dùng `var(--token)`.

| Token | HEX | Vai trò |
|---|---|---|
| `--mauChinh`, `--mauChinhDam`, `--mauChinhNhat` | `#0F766E`, `#115E59`, `#CCFBF1` | CTA, hover, mục đang chọn |
| `--mauGia`, `--mauGiaNhat` | `#E11D48`, `#FFE4E6` | Giá bán, nhãn giảm giá |
| `--nen`, `--beMat` | `#F8FAFC`, `#FFFFFF` | Nền trang, surface |
| `--chu`, `--chuPhu`, `--chuMo` | `#0F172A`, `#475569`, `#64748B` | Chữ chính, phụ, chú thích |
| `--vien`, `--vienDam` | `#E2E8F0`, `#CBD5E1` | Viền thẻ và ô nhập |
| `--thanhCong`, `--thanhCongNen` | `#15803D`, `#DCFCE7` | Thành công |
| `--canhBao`, `--canhBaoNen` | `#B45309`, `#FEF3C7` | Cần chú ý |
| `--loi`, `--loiNen` | `#B91C1C`, `#FEE2E2` | Lỗi |
| `--thongTin`, `--thongTinNen` | `#1D4ED8`, `#DBEAFE` | Thông tin |
| `--mauBieuDo1` đến `--mauBieuDo5` | `#0F766E`, `#1D4ED8`, `#B45309`, `#7C3AED`, `#64748B` | Biểu đồ F26/F27 |
| `--mauLuoiBieuDo` | `#E2E8F0` | Lưới biểu đồ |

Màu chủ đạo dành cho hành động chính và điều hướng; màu giá chỉ dành cho giá/khuyến mãi. Màu trạng thái luôn đi kèm nhãn chữ. Muốn thêm màu phải sửa token `:root` và ghi rõ trong báo cáo thay đổi.

## 6. Typography

**Font đã chốt:** Be Vietnam Pro (400/500/600/700), nạp qua Google Fonts trong `frontend/index.html` với `display=swap`. Fallback: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`. Dùng `--phongChu` và giữ fallback khi không tải được font.

| Vai trò | Desktop: size / line-height / weight | Mobile | Quy tắc |
|---|---|---|---|
| H1 | 2rem / 1.25 / 700 | 1.75rem / 1.25 | Một H1 mỗi trang |
| H2 | 1.375rem / 1.3 / 600 | như desktop | Đầu nhóm nội dung lớn |
| H3 | 1.125rem / 1.4 / 600 | như desktop | Card/chương |
| Body | 1rem / 1.55 / 400 | như desktop | Nội dung chính, tối đa 70ch mỗi dòng dài |
| Phụ, bảng, nhãn | .875rem / 1.5 / 400–500 | như desktop | Không co xuống để nhét cột |
| Chú thích | .8125rem / 1.5 / 400 | như desktop | Thông tin phụ |
| Giá bán | 1.5rem / 1.25 / 700 | 1.25rem / 1.3 | Căn theo đơn vị đ; không cắt |
| Giá gốc | .875rem / 1.5 / 400 | như desktop | Gạch ngang khi có giá bán thực tế |

Không dùng toàn chữ in hoa cho tiếng Việt dài. Số tiền, số lượng và phần trăm dùng chữ số tabular nếu font hỗ trợ để cột dễ so sánh. Không cắt trạng thái quan trọng bằng dấu ba chấm.

## 7. Spacing & Layout System

- Thang khoảng cách chính thức `--kc1` đến `--kc7`: **4, 8, 12, 16, 24, 32, 48px**. Chỉ dùng token trong CSS component.
- Container mua sắm: tối đa **1200px** (`--chieuRongToiDa`); lề 16px trên mobile, 24px từ 768px. Nội dung dạng đọc/form dài tối đa 70ch.
- Khoảng cách section: 48px desktop, 32px tablet, 24px mobile. Trong card: padding 24px desktop, 16px mobile; giữa các trường form 16px.
- Grid desktop 12 cột, gap 24px; tablet 8 cột gap 16px; mobile 4 cột gap 12px. Không ép toàn bộ nội dung vào vùng 600px khi viewport còn rộng.
- Dashboard sidebar **248px** (`--chieuRongSidebar`) từ 1024px; topbar 64px (`--chieuCaoHeader`); nội dung tự chiếm phần còn lại. Số tiền căn phải, nhãn căn trái.

## 8. Grid & Responsive Breakpoints

| Viewport | Quy tắc bố cục | Danh sách sản phẩm | Dashboard |
|---|---|---|---|
| Mobile: dưới 640px | Lề 16px; một cột cho form/checkout; CTA quan trọng dễ chạm | 2 cột khi ảnh và giá còn đọc được; dưới 360px dùng 1 cột | Sidebar thành drawer; bảng nhiều cột đổi thành card hoặc danh sách có nhãn |
| Tablet: 640–1023px | Lề 24px từ 768px; tóm tắt checkout xuống dưới nếu cột hẹp | 2–3 cột tùy chiều rộng | Sidebar là ngăn kéo; biểu đồ và bảng xếp dọc |
| Desktop: 1024–1279px | Grid 12 cột, container linh hoạt | 4 cột | Sidebar đầy đủ; bảng có ưu tiên cột |
| Wide: từ 1280px | Container tối đa 1200px cho mua sắm | 5 cột khi card còn đủ rộng | Nội dung quản lý mở rộng hợp lý, không kéo dòng chữ quá dài |

Breakpoint đã chốt: 640 / 768 / 1024 / 1280px, viết mobile-first bằng `min-width`. Không để trang cuộn ngang vì bảng: dưới 768px đổi hàng thành card có nhãn cột. Ảnh sản phẩm grid tỉ lệ 1:1; gallery chi tiết có khung lớn nhất quán. Drawer/modal trên mobile dùng gần toàn màn, nút xác nhận luôn nhìn thấy.

## 9. Borders, Radius, Shadows & Elevation

| Thành phần | Thông số |
|---|---|
| Viền | `--doDayVien` solid `--vien`; input dùng `--vienDam` |
| Radius nhỏ | `--boGocNho`: 8px cho nút, ô nhập |
| Radius vừa | `--boGocVua`: 12px cho card, bảng, modal |
| Radius viên thuốc | `--boGocTron`: badge, chip, avatar |
| Bóng phần nổi | `--bongNoi` chỉ cho dropdown, modal, toast, header khi cuộn |
| Overlay | `--lopPhu` |

Một tầng nổi phải có mục đích: base → card → dropdown → modal. Không dùng nhiều lớp bóng, card lồng card hoặc viền đậm mọi nơi.

## 10. Icons & Imagery

Icon nét thống nhất 20px (24px cho hành động lớn), độ dày nét khoảng 1.75–2px. Icon đi cùng nhãn đối với tác vụ có rủi ro hoặc không hiển nhiên. Không sử dụng emoji làm icon sản phẩm. Ảnh sản phẩm rõ, có nền trung tính nhất quán, không bóp méo; nếu thiếu ảnh, dùng placeholder có nhãn trung thực. Banner chỉ dùng hình và nội dung có nguồn trong BannerQuangCao hoặc khuyến mãi thật; không hứa hẹn ưu đãi không tồn tại.

Không sao chép ảnh, logo, khẩu hiệu hoặc màu nhận diện của thương hiệu tham khảo. Nếu dùng ảnh mẫu ngoài project, kiểm tra quyền sử dụng khi đưa vào sản phẩm chính thức.

## 11. Component Design Specifications

Các thông số là mặc định; mỗi component có trạng thái **default, hover, focus-visible, disabled, loading** khi thích hợp. Trạng thái lỗi hoặc thành công được thêm theo ngữ cảnh, không tạo variant rỗng.

| Component | Quy chuẩn cụ thể |
|---|---|
| Button | `primary` teal/chữ trắng, `secondary` nền trắng/viền, `ghost` và `danger`; cỡ `sm/md/lg`. Vùng chạm tối thiểu 44px; loading giữ nguyên chiều rộng và khóa gửi lặp. |
| Input / Textarea / Select | Cao input/select 44px; textarea tối thiểu 96px; label ở trên, helper/error ở dưới; viền focus 2px; lỗi có chữ và màu. Không dựa vào placeholder thay label. |
| Checkbox / Radio | Vùng bấm tối thiểu 24×24px, ưu tiên 44px cho hàng trên mobile. Ở checkout dùng radio thật để chọn VNPay hoặc COD. |
| Search | Một ô tìm kiếm rõ, nút tìm hoặc Enter; hiện từ khóa, kết quả và trạng thái không tìm thấy; bộ lọc đang áp dụng có thể xóa. |
| Card chung | Padding theo thang `--kc`, radius `--boGocVua`, viền `--vien`, không bóng; không nhồi nhiều CTA cùng trọng lượng. |
| Product Card | Ảnh 1:1; tên tối đa 2 dòng; giá hiện tại nổi bật, giá gốc riêng; thông tin khuyến mãi và tồn kho chỉ khi có dữ liệu; toàn card hoặc CTA có vùng bấm rõ. |
| Gallery / Quantity | Ảnh chính lớn, thumbnail có focus; số lượng không dưới 1 và không vượt tồn; hết hàng khóa hành động mua. |
| Voucher Card | Loại, mã, mức giảm, điều kiện tối thiểu, hạn và trạng thái đủ/không đủ điều kiện; nút chọn/đổi/xóa rõ; số giảm thực tế theo kết quả hệ thống. |
| Cart / Order Card | Nhóm theo cửa hàng; ảnh, tên, số lượng, giá chốt, trạng thái; mã đơn của từng cửa hàng riêng. Không trộn tổng giao dịch với tổng từng đơn. |
| Badge / Status | Chip chữ 12–14px, padding 4×8px, màu nền nhạt và chữ đậm; dùng đúng enum nghiệp vụ, không đổi tên tùy tiện. |
| Table | Header rõ, vùng thao tác tối thiểu 44px, số căn phải; lọc và phân trang sát bảng. Dưới 768px mỗi hàng thành thẻ có nhãn cột. |
| Tabs | 2–5 nhãn dễ hiểu, active có cả chữ/đường chỉ thị; không ẩn chức năng quan trọng trong tab khó thấy. |
| Modal / Dialog | Rộng 480–640px, tiêu đề + mô tả hậu quả, primary và hủy; ESC/đóng và focus hợp lý. Xác nhận riêng cho khóa/vô hiệu hóa/từ chối. |
| Drawer / Dropdown | Drawer chọn voucher/lọc có nút áp dụng và xóa chọn; dropdown đóng khi chọn, click ngoài hoặc ESC, không cắt bởi card. |
| Tooltip | Chỉ hỗ trợ thông tin phụ, không chứa điều kiện quan trọng mà người dùng cần đọc để quyết định. |
| Pagination | Hiện trang hiện tại/tổng trang và số kết quả; mobile cho “Trước/Tiếp”; không hiển thị số trang không khớp dữ liệu. |
| Toast | Thành công 3–5 giây, lỗi quan trọng tồn tại tới khi đọc/đóng; không thay thế thông báo lỗi ngay tại form. |
| Skeleton / Empty State | Skeleton có kích thước gần nội dung thực; empty state có lý do và hành động tiếp theo hữu ích. |
| Statistic Card / Chart | Ghi nhãn, đơn vị, kỳ đo và cách hiểu; không tự tạo KPI lợi nhuận/hoa hồng/conversion không có dữ liệu. |

## 12. Customer Website Guidelines

- **Header:** wordmark, tìm kiếm, danh mục, giỏ và tài khoản. Trạng thái chưa/sau đăng nhập khác nhau; mobile ưu tiên tìm kiếm và giỏ. Không đẩy toàn bộ navigation lên một hàng chật.
- **Trang chủ:** banner có nội dung hợp lệ, danh mục phẳng, nhóm sản phẩm đang kinh doanh và khuyến mãi đang hiệu lực. “Flash Sale” chỉ là loại chương trình khi có dữ liệu; không dùng đồng hồ giả. Hero không lấn lên chữ hoặc sản phẩm.
- **Danh sách/chi tiết:** tìm `tuKhoa`, lọc danh mục/chương trình khuyến mãi và sắp xếp mới nhất theo QĐ-21; chưa có lọc hoặc sắp xếp theo khoảng giá. Trạng thái kết quả, ảnh đồng bộ, giá gốc và giá bán thực tế tách biệt; không giả biến thể màu/kích cỡ nếu `SanPham` không có field. Chỉ làm trang cửa hàng công khai khi form nghiệp vụ yêu cầu; không tự công khai email chủ cửa hàng.
- **Giỏ và voucher:** checkbox từng dòng/nhóm/đại diện có quan hệ dễ hiểu; chỉ dòng đã chọn vào checkout. “Tạm tính” trước khi phí/voucher được xác nhận. Chọn voucher trong một modal/drawer có điều kiện và lý do không áp dụng; voucher cửa hàng theo đúng shop.
- **Checkout:** nhóm đơn theo cửa hàng; mỗi đơn có địa chỉ chụp tại lúc đặt, giá từng dòng, voucher và phí vận chuyển mô phỏng. Chọn **VNPay hoặc COD** theo QĐ-16; đơn 0đ đi tiếp không qua cổng. Không vẽ biểu mẫu thẻ tín dụng trên Soopi.
- **Sau thanh toán:** tách giao dịch “Thành công/Thất bại/Hết hạn/Chờ thanh toán” khỏi trạng thái xử lý đơn. Thành công thanh toán chưa có nghĩa Người bán đã xác nhận. Không gợi ý trả tiền lần hai khi kết quả còn chưa rõ.
- **Đơn, đánh giá, khiếu nại, chat:** dùng enum thật, đánh giá chỉ sau khi đơn “Hoàn thành”, một đánh giá/yêu cầu theo dòng hàng như dữ liệu cho phép. Chat chữ giữa Người dùng và cửa hàng; không giả chức năng file đính kèm.

## 13. Seller Dashboard Guidelines

Sidebar nhóm Tổng quan, Cửa hàng, Sản phẩm, Bán hàng, Khách hàng và Thống kê; chỉ hiện mục có màn/chức năng tương ứng. Mỗi trang có tiêu đề, breadcrumb, một CTA chính, bộ lọc liền kề bảng và trạng thái rỗng. Người bán chỉ thấy dữ liệu cửa hàng của tài khoản hiện tại; không có bộ chọn cửa hàng khác.

Sản phẩm: form tên, ảnh, mô tả, giá gốc, tồn kho, danh mục, trạng thái kinh doanh. Khuyến mãi nằm ở chương trình và chi tiết sản phẩm, không ghi đè giá gốc. Voucher Người bán chỉ loại Cửa hàng. Đơn VNPay chỉ được xử lý sau thanh toán; đơn COD có thể xử lý ngay theo QĐ-16. Luồng tuần tự: Chờ xác nhận → Đã xác nhận → Đang xử lý → Đang vận chuyển → Hoàn thành. Không có nút từ chối đơn đã thanh toán. Tồn kho và doanh thu có mốc thời gian rõ; không dựng hãng giao hàng, mã vận đơn, hoàn tiền tự động hay trả lời đánh giá công khai khi dữ liệu chưa hỗ trợ.

## 14. Admin Dashboard Guidelines

Điều hướng theo nhiệm vụ: Tổng quan, Tài khoản, Duyệt Người bán, Cửa hàng, Danh mục, Sản phẩm, Giao dịch, Banner, Khuyến mãi, Voucher hệ thống và Báo cáo. Bảng tài khoản hiển thị vai trò có thể chồng nhau; không cộng số Người dùng và Người bán như hai nhóm luôn tách biệt.

Danh mục là danh sách phẳng theo thiết kế collection hiện tại. Form banner dùng tiêu đề, hình ảnh, nội dung, trạng thái; không tạo lịch/CTA/link nếu chưa có trường. Khuyến mãi Toàn sàn gắn sản phẩm cụ thể; điều kiện đơn tối thiểu thuộc voucher. Voucher của Admin gồm Toàn sàn và Freeship. Giao dịch VNPay/COD là dữ liệu đối soát để xem, không có nút sửa tay kết quả thanh toán. Báo cáo ghi kỳ đo và cơ sở tính; doanh thu lọc theo `DonHang.ngayHoanThanh` của đơn `Hoàn thành` theo QĐ-18, không tự suy lợi nhuận, hoa hồng hay lượt xem.

## 15. Forms & Validation UX

Một cột form chính cho tác vụ tuần tự; chỉ dùng hai cột khi các trường thật sự song song. Dấu bắt buộc cạnh label; helper nêu định dạng trước khi nhập; lỗi nêu trường và cách sửa sau khi blur/submit. Giữ dữ liệu đã nhập khi lỗi; tập trung vào lỗi đầu tiên và có tóm tắt ngắn nếu form dài. Nút submit ở cuối nhóm dữ liệu, không rải nhiều nút “Lưu” trong một biểu mẫu.

Đăng nhập bằng **email** và mật khẩu theo thiết kế tài khoản; không mặc định đăng nhập số điện thoại. Quên mật khẩu dùng liên kết đặt lại theo QĐ-01, triển khai ở F28; trong môi trường phát triển liên kết phục vụ demo, không hứa gửi email. Đăng ký Người bán chỉ hỏi các trường trong `YeuCauDangKyNguoiBan`; không yêu cầu CCCD, ngân hàng, email shop riêng. Validation UI giúp người dùng sửa nhanh nhưng backend vẫn là nguồn xác thực cuối.

## 16. Loading, Empty, Error & Success States

| Trạng thái | Cách thể hiện |
|---|---|
| Loading | Skeleton đúng hình khối; nút xử lý có spinner + nhãn tiến trình, tránh gửi lặp |
| Empty | Nói rõ chưa có sản phẩm/đơn/tin nhắn; đề nghị hành động hợp lệ |
| Không có kết quả lọc | Giữ từ khóa/bộ lọc, có nút xóa lọc; không giả “hết dữ liệu” |
| Form lỗi | Lỗi cạnh trường + thông báo tổng nếu cần, giữ dữ liệu đã nhập |
| Hết hàng/ngừng kinh doanh | Nhãn rõ, khóa mua/tăng số lượng, có đường quay lại danh sách |
| VNPay chưa rõ kết quả | “Chờ kết quả VNPay”, cho kiểm tra lại; tránh tạo giao dịch trùng |
| Thành công/thất bại | Hiện mã liên quan, trạng thái đúng, CTA tiếp theo có đích |
| Không đủ quyền/tài khoản bị khóa | Nêu lý do dễ hiểu và đường về phù hợp, không lộ dữ liệu vai trò khác |

## 17. Accessibility Standards

Hướng tới WCAG 2.2 AA: chữ thường tương phản tối thiểu **4,5:1**, chữ lớn **3:1**; thành phần điều khiển/ranh giới cần tương phản phù hợp. Focus-visible dễ thấy và không bị header/drawer che. Vùng bấm đạt tối thiểu WCAG AA **24×24 CSS px** hoặc ngoại lệ khoảng cách; mục tiêu thiết kế Soopi là **44×44px** cho CTA, icon button và hàng chọn trên mobile. Label phải gắn với form, lỗi không chỉ biểu thị bằng màu, icon button có tên truy cập được. Tab, modal, dropdown và drawer thao tác được bằng bàn phím; modal giữ focus bên trong và trả focus về nút mở khi đóng. Kiểm tra zoom 200%, chữ tiếng Việt dài và mobile 320px.

Tham khảo chuẩn gốc: [W3C Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum), [W3C Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum). Các con số tương phản của bảng màu cần kiểm tra lại khi màu thực tế thay đổi.

## 18. Motion & Interaction

Chỉ dùng chuyển động để xác nhận trạng thái hoặc giúp định hướng: hover/focus 120–180ms, mở drawer/modal 180–240ms, skeleton không nhấp nháy mạnh. Không cho card sản phẩm phóng to làm xô grid; không tạo auto carousel nhanh hoặc đồng hồ khuyến mãi giả. Với prefers-reduced-motion, bỏ chuyển động không thiết yếu. Một CTA phải có phản hồi ngay: loading, lỗi hoặc chuyển màn; tránh nhấp mà không đổi gì.

## 19. Content & Vietnamese UI Copy Guidelines

Toàn bộ chữ giao diện tiếng Việt có dấu, câu ngắn và hành động cụ thể: “Thêm vào giỏ”, “Chọn voucher”, “Thanh toán qua VNPay” hoặc “Đặt hàng COD”, “Xem chi tiết đơn”. Không đưa tên field kỹ thuật lên giao diện. Tiền là số nguyên VND, định dạng 523.200 đ; phần trăm ghi rõ dấu %. Không gọi email tài khoản chủ cửa hàng là “email shop”. Trạng thái chính dùng đúng chuỗi enum trong tài liệu; nếu cần dễ hiểu hơn, thêm chú thích dưới nhãn thay vì đổi tên trạng thái. Lỗi có hướng giải quyết, không đổ lỗi cho người dùng.

## 20. Design Do's and Don'ts

| Nên làm | Tránh |
|---|---|
| Dùng token, thang khoảng cách và component chung | Chọn màu/radius/font mới cho mỗi trang |
| Hiện giá cuối, phí, voucher và tổng theo đúng đơn | Giảm giá âm, cộng sai, đánh đồng đơn và giao dịch |
| Dùng ảnh sản phẩm đủ lớn và nhãn dễ đọc | Ảnh trống, text 10px, nhiều badge tranh nhau |
| Cho bảng lọc/sắp xếp/trạng thái rỗng rõ | Bảng dày đặc, nút “Xuất”/“Sửa” vô đích |
| Chỉ tạo tính năng có dữ liệu Soopi hỗ trợ | Thẻ tín dụng, email shop, biến thể, shipper, hoàn tiền tự động |
| Thiết kế responsive theo nội dung | Thu nhỏ nguyên desktop xuống mobile |

## 21. Design Consistency Checklist

Trước khi bàn giao một màn, kiểm:

- [ ] Đọc DESIGN.md và đối chiếu nghiệp vụ trong AGENTS.md/tài liệu collection; không tự thêm field hay quyền.
- [ ] Chỉ một CTA chính; mọi nút và liên kết có đích hoặc trạng thái phản hồi.
- [ ] Chữ, ảnh, giá, voucher, tồn kho, mã đơn và trạng thái nhất quán giữa các màn liên quan.
- [ ] Dùng đúng token màu, type scale, khoảng cách, radius và component.
- [ ] Có loading, empty, error, success phù hợp; trạng thái không dựa vào màu đơn độc.
- [ ] Kiểm tra 320px, 390px, 768px, 1024px và 1440px; không tràn hoặc che CTA.
- [ ] Kiểm tra keyboard/focus, tương phản, label và vùng bấm.
- [ ] Nếu có demo Figma, frame có thể biên tập, không còn placeholder và prototype đi đủ luồng.

## 22. Instructions for Future Coding Agents

Khi được yêu cầu **tạo, sửa, đánh giá hoặc chuyển Figma thành giao diện Soopi**, đọc DESIGN.md trước khi chọn màu, font, bố cục hoặc component; sau đó xem code frontend thật và tuân theo stack đang có. Chỉ lấy các token ở đây làm mặc định nếu code chưa có chuẩn rõ ràng. Không cài skill hay thư viện UI chỉ vì được nêu ở nguồn tham khảo. Với task thuần backend/database, không cần đọc DESIGN.md.

Thứ tự quyết định: yêu cầu trực tiếp mới nhất → contract frontend đang chạy nếu không trái bất biến nghiệp vụ → AGENTS.md và tài liệu Soopi cho nghiệp vụ → DESIGN.md cho cách thể hiện. Nếu giao diện cũ trái nghiệp vụ, sửa trong phạm vi tác vụ; nếu màu/logo đã được nhóm chốt chính thức, cập nhật DESIGN.md trước khi dùng đại trà. Khi hoàn thành một tác vụ UI, nêu ngắn những token/component đã áp dụng, viewport đã kiểm tra và điểm nào chưa xác minh.

**Prompt ngắn để dùng về sau:** “Đọc DESIGN.md ở gốc Soopi và tài liệu nghiệp vụ liên quan; giữ stack frontend hiện có; tạo/sửa giao diện [tên màn] theo token và component chung cho đúng vai trò; kiểm tra desktop/mobile, trạng thái rỗng/lỗi và tính nhất quán dữ liệu.”

## 23. References & Design Decisions

| Nguồn đã đọc | Điều học hỏi | Quyết định riêng cho Soopi |
|---|---|---|
| [VoltAgent awesome-design-md](https://github.com/VoltAgent/awesome-design-md) và [ví dụ Airbnb DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/airbnb/DESIGN.md) | Cấu trúc mô tả khí chất, token, typography, component, layout, trạng thái và hướng dẫn cho agent | Chỉ dùng **cách tổ chức tài liệu**; không sao chép màu, font, logo hay hình ảnh Airbnb |
| [Superdesign prompts](https://github.com/superdesigndev/superdesign-prompts) và [ví dụ e-commerce](https://github.com/superdesigndev/superdesign-prompts/tree/main/prompts/brutalist-e-commerce-page) | Prompt chia trang thành navigation, hero, product grid, CTA với thông số rõ | Dùng cách mô tả từng khu vực; không dùng phong cách brutalist/hiệu ứng mạnh cho Soopi |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Khuyến nghị thiết kế theo loại sản phẩm, anti-pattern, kiểm tra trước bàn giao và responsive | Áp dụng checklist, không cài skill/chạy script hoặc thêm dependency |
| [OpenAI Docs: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | Codex tự nạp AGENTS.md theo cây thư mục; tài liệu chuyên biệt cần được chỉ đến theo ngữ cảnh | Đặt DESIGN.md ở gốc project và dẫn tới nó từ AGENTS.md cho tác vụ UI |
| Báo cáo V11, thiết kế collection, ba tài liệu rà Figma trong .md/ | Phạm vi ba vai trò, thanh toán, nhiều cửa hàng, enum và các lỗi demo | Giữ nghiệp vụ làm nguồn sự thật; màu và token thị giác theo QĐ-11/F03 |

**Tình trạng nguồn giao diện:** frontend dùng teal theo QĐ-11/F03; bản Figma màu cam là tư liệu cũ. Logo SVG Soopi đã được tạo theo yêu cầu mới của chủ dự án. Ảnh sản phẩm sẽ theo dữ liệu thật khi các form nghiệp vụ triển khai.
