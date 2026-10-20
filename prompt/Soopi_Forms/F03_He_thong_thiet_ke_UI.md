# FORM F03 — HỆ THỐNG THIẾT KẾ GIAO DIỆN (tokens, thành phần nền, layout 3 vai trò)

> **Gửi kèm:** `AGENTS.md`, `01_BOI_CANH_CHUNG.md`, `02_QUYET_DINH_DA_CHOT.md` (đã chốt).
> **Phụ thuộc:** F02. Đây là **đợt quyết định giao diện toàn dự án** — các form sau chỉ *dùng lại* những gì làm ở đây, không tự chế thêm kiểu mới.

## 1. Mục tiêu

Tạo bộ nền giao diện **hiện đại, gọn, đồng nhất** để mọi màn hình sau này lắp ghép nhanh: design tokens (CSS variables), CSS nền, bộ thành phần UI dùng chung, 3 layout (Người dùng / Người bán / Quản trị viên). Không có logic nghiệp vụ.

## 2. Đọc trước

- `01_BOI_CANH_CHUNG.md` Mục 5, 6 (không hard-code; nguyên tắc UI/UX).
- `02` `QĐ-11` (màu, phông, thư viện cho phép).
- `AGENTS.md` Mục 5.2 (đặt tên), 12, 13.

> Nếu `QĐ-11` ghi bạn đã dùng sẵn Tailwind/UI kit: **giữ công nghệ đó**, vẫn làm đủ các thành phần/layout dưới đây nhưng bằng công nghệ sẵn có; "tokens" khi đó là cấu hình theme.

## 3. Bản tóm tắt thiết kế (brief)

- **Chủ đề:** sàn thương mại điện tử đa người bán cho người dùng Việt Nam.
- **Người dùng chính:** người mua phổ thông, đa số dùng điện thoại → **mobile-first**. Người bán/Quản trị viên thao tác trên máy tính nhiều hơn → khu vực quản lý ưu tiên bảng, bộ lọc rõ ràng.
- **Việc chính của giao diện:** (1) tìm sản phẩm → xem giá → mua nhanh; (2) quản lý dữ liệu hiệu quả.
- **Cảm giác:** sạch, thoáng, tin cậy. Ảnh sản phẩm và giá là "nhân vật chính" (xem Mục 8); mọi thứ xung quanh giữ yên tĩnh.
- **Tránh** các dấu hiệu giao diện sinh tự động: gradient trang trí, mũi tên "→" gắn vào mọi nút, nhãn IN HOA giãn chữ trên mọi tiêu đề, mọi thẻ cùng một bo góc + cùng một bóng, đánh số trang trí.

## 4. Design tokens (`src/index.css`, khối `:root`)

> Tên biến dùng **camelCase tiếng Việt không dấu** theo tinh thần AGENTS Mục 5.2 (ví dụ `--mauChinh`). **Không** viết mã màu/khoảng cách trực tiếp trong CSS component — luôn dùng biến.

**Màu — BẢNG MÀU CHÍNH THỨC, ĐÃ KHÓA (`QĐ-11` phiên bản 2).** Đây là bảng màu **duy nhất** của toàn dự án, chốt **trước khi** làm bất kỳ giao diện nào. Quy tắc: (1) không dùng màu nào ngoài bảng này; (2) cần thêm/đổi màu thì **chỉ sửa ở khối `:root`** và báo cáo, không sửa rải rác; (3) tỷ lệ dùng: nền trung tính ~90%, màu chủ đạo chỉ cho nút chính/liên kết/mục đang chọn, màu giá chỉ cho giá và nhãn giảm giá:

| Biến | Giá trị | Dùng cho |
|---|---|---|
| `--mauChinh` | `#0F766E` | Nút chính, liên kết, trạng thái chọn |
| `--mauChinhDam` | `#115E59` | Hover/pressed của màu chính |
| `--mauChinhNhat` | `#CCFBF1` | Nền nhấn nhẹ (mục menu đang chọn) |
| `--mauGia` | `#E11D48` | **Chỉ** giá bán/khuyến mãi và nhãn giảm giá |
| `--mauGiaNhat` | `#FFE4E6` | Nền nhãn giảm giá |
| `--nen` | `#F8FAFC` | Nền trang |
| `--beMat` | `#FFFFFF` | Nền thẻ, ô nhập, bảng |
| `--chu` | `#0F172A` | Chữ chính |
| `--chuPhu` | `#475569` | Chữ phụ |
| `--chuMo` | `#64748B` | Placeholder, chú thích |
| `--vien` / `--vienDam` | `#E2E8F0` / `#CBD5E1` | Viền thẻ / viền ô nhập |
| `--thanhCong`, `--thanhCongNen` | `#15803D`, `#DCFCE7` | |
| `--canhBao`, `--canhBaoNen` | `#B45309`, `#FEF3C7` | |
| `--loi`, `--loiNen` | `#B91C1C`, `#FEE2E2` | |
| `--thongTin`, `--thongTinNen` | `#1D4ED8`, `#DBEAFE` | |
| `--mauBieuDo1` … `--mauBieuDo5` | `#0F766E`, `#1D4ED8`, `#B45309`, `#7C3AED`, `#64748B` | **Dãy màu biểu đồ thống kê** (F26, F27), theo thứ tự dùng; khác nhau đủ rõ cả với người khó phân biệt màu |
| `--mauLuoiBieuDo` | `#E2E8F0` | Đường lưới và trục của biểu đồ |

Chữ trắng trên `--mauChinh` và chữ `--chu` trên `--nen` phải đạt tương phản WCAG AA (đã chọn để đạt).

**Cầu nối token → JavaScript (cho biểu đồ):** tạo `utils/mauSac.js` với hàm `layMauToken('--mauBieuDo1')` đọc giá trị từ `getComputedStyle(document.documentElement)`, để thư viện biểu đồ nhận màu **từ tokens** — **không** gõ mã màu trong JS.

**Phông & cỡ chữ:** một họ phông **Be Vietnam Pro** (400/500/600/700), nạp bằng `<link>` Google Fonts trong `index.html` (`display=swap`, kèm `preconnect`), fallback `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`. Biến `--phongChu`.

| Vai trò | Cỡ | Độ đậm |
|---|---|---|
| Tiêu đề trang (h1) | 1.75rem (≥768px: 2rem) | 700 |
| Tiêu đề mục (h2) | 1.375rem | 600 |
| Tiêu đề nhỏ (h3) | 1.125rem | 600 |
| Thân | 1rem, line-height 1.55 | 400 |
| Phụ | 0.875rem | 400/500 |
| Chú thích | 0.8125rem | 400 |

Dòng văn bản dài tối đa `70ch`. Không dùng chữ IN HOA toàn bộ cho nhãn/tiêu đề.

**Khoảng cách:** `--kc1:4px, --kc2:8px, --kc3:12px, --kc4:16px, --kc5:24px, --kc6:32px, --kc7:48px`.

**Bo góc theo thứ bậc (không dùng một giá trị cho tất cả):** `--boGocNho:8px` (nút, ô nhập), `--boGocVua:12px` (thẻ, bảng, modal), `--boGocTron:999px` (huy hiệu, chip, avatar).

**Đổ bóng:** thẻ thường **phẳng, chỉ có viền**. Chỉ phần *nổi lên trên nội dung* (dropdown, modal, header khi cuộn, toast) mới có `--bongNoi: 0 8px 24px rgba(15,23,42,.12)`.

**Khác:** `--chieuCaoHeader:64px`, `--chieuRongToiDa:1200px`, `--chieuRongSidebar:248px`, `--tangHeader:100`, `--tangDrawer:200`, `--tangModal:300`, `--tangToast:400`, `--thoiGianNhanh:120ms`, `--thoiGianVua:200ms`.

**Điểm ngắt (mobile-first, dùng `min-width`):** 640 / 768 / 1024 / 1280 px (ghi chú ở đầu `index.css`, vì `@media` không dùng được biến).

## 5. CSS nền (`index.css`)

- Reset gọn (`box-sizing: border-box`, bỏ margin mặc định), `body` dùng `--phongChu`, `--chu`, nền `--nen`.
- `:focus-visible` luôn thấy rõ: `outline: 2px solid var(--mauChinh); outline-offset: 2px`.
- `@media (prefers-reduced-motion: reduce)` tắt mọi transition/animation.
- Lớp `.container` (max `--chieuRongToiDa`, padding ngang `--kc4`, `--kc5` từ 768px).
- Ẩn nội dung chỉ-dành-cho-trình-đọc-màn-hình: lớp `.chiDocBangManHinh`.
- Mỗi component có file CSS **cùng thư mục, cùng tên** (`Button.jsx` + `Button.css`), tên class camelCase theo component (`.button`, `.buttonPrimary`). Không tạo bộ utility class khổng lồ.

## 6. Thành phần nền — `src/components/ui/`

> Tên component kỹ thuật dùng tiếng Anh chuẩn (`Button`, `Modal`...). Component mang nghiệp vụ dùng tiếng Việt (xem Mục 7).

| Component | Hành vi bắt buộc |
|---|---|
| `Button` | `variant`: `primary \| secondary \| ghost \| danger`; `size`: `sm \| md \| lg`; `loading` (hiện spinner, **vô hiệu hóa** nút, giữ nguyên độ rộng); `fullWidth`; prop `to` → render `Link` có kiểu nút. Chiều cao tối thiểu 44px trên màn hình cảm ứng. |
| `Input`, `Select`, `Textarea` | Kiểu thống nhất (viền `--vienDam`, focus viền `--mauChinh`, trạng thái lỗi viền `--loi`). |
| `Field` | Bọc nhãn + control + gợi ý + **lỗi dưới ô nhập** (`aria-describedby`, `aria-invalid`). Dấu `*` cho trường bắt buộc kèm `aria-required`. ID sinh bằng `useId`. |
| `Card` | Viền `--vien`, `--boGocVua`, **không bóng**. |
| `Badge` | `variant`: `success \| warning \| danger \| info \| neutral \| brand`. Hình viên thuốc. |
| `Modal` | `role="dialog"`, `aria-modal`, đóng bằng `Esc`/nút đóng/bấm nền, **giữ focus trong hộp thoại** và trả focus khi đóng, khóa cuộn nền. |
| `ConfirmDialog` | Dựa trên `Modal`: tiêu đề, nội dung, nhãn nút xác nhận, `danger`, `loading`. Dùng cho **mọi thao tác xóa/khóa/duyệt/từ chối**. |
| `Toast` + `ThongBaoProvider` | Hook `useThongBao()` (đặt ở `hooks/`) → `thanhCong(msg)`, `loi(msg)`, `thongTin(msg)`. Tự tắt sau ~4s, tối đa 3 cái cùng lúc, `aria-live="polite"`. Bọc `App` bằng provider. |
| `Spinner`, `Skeleton` | Skeleton có biến thể dòng chữ / khối / thẻ sản phẩm. |
| `EmptyState` | Biểu tượng + tiêu đề + mô tả + **một hành động gợi ý** (ví dụ "Xem sản phẩm"). |
| `ErrorState` | Nêu rõ lỗi + nút "Thử lại" (`taiLai`). |
| `Pagination` | Props `trang`, `tongTrang`, `onChange`; nút Trước/Sau + dải số trang rút gọn; `aria-current="page"`; ẩn khi `tongTrang ≤ 1`. |
| `DataTable` | Props `cot: [{ khoa, tieuDe, render? }]`, `hang`, `khoaHang`. Từ 768px: bảng thật (đầu bảng dính). Dưới 768px: **mỗi hàng thành một thẻ** (mỗi ô hiện nhãn cột qua `data-label`). Có sẵn trạng thái tải/rỗng/lỗi (dùng `Skeleton`/`EmptyState`/`ErrorState`). |
| `Tabs` | Điều khiển bằng `value/onChange`, hỗ trợ phím mũi tên, `role="tablist"`. |
| `DropdownMenu` | Mở/đóng bằng nút, đóng khi `Esc` hoặc bấm ra ngoài, điều hướng bằng phím. Dùng cho menu tài khoản. |
| `Avatar` | Chữ cái đầu của `hoTen` trong hình tròn (không có ảnh đại diện vì tài liệu không có field). |
| `QuantityInput` | Nút `−` / ô số / nút `+`; props `value`, `min`, `max`, `onChange`; chặn giá trị ngoài khoảng; nút có `aria-label`. |
| `PageHeader` | Tiêu đề trang + vùng nút hành động bên phải (xuống dòng trên mobile). |
| `Icon` | Một file, `<Icon name="..." size={20} />`, SVG `viewBox 0 0 24 24`, `stroke="currentColor"`, nét 1.75, tự soạn đơn giản. Bộ tối thiểu: `search, cart, user, store, menu, close, chevronDown, chevronLeft, chevronRight, plus, minus, trash, edit, check, alert, info, star, starFill, chat, package, tag, ticket, logout, dashboard, chart, upload, image, lock, eye`. Icon thuần trang trí có `aria-hidden`; nút chỉ có icon phải có `aria-label`. |

## 7. Component nghiệp vụ dùng chung (tiếng Việt)

- **`GiaTien`**: hiển thị giá. Props `giaGoc`, `giaBanThucTe`, `kichThuoc` (`nho | vua | lon`). Nếu `giaBanThucTe < giaGoc`: giá thực tế màu `--mauGia` đậm, `giaGoc` gạch ngang màu `--chuMo`, kèm nhãn `-X%` (tính bằng `Math.round((giaGoc - giaBanThucTe) / giaGoc * 100)`, **chỉ để hiển thị**). Ngược lại chỉ hiện một giá. Luôn dùng `dinhDangTien`.
- **`TrangThaiBadge`**: nhận một giá trị enum, tra bảng `MAU_TRANG_THAI` trong `utils/hangSo.js` (enum → `variant` của `Badge`). Thêm vào `hangSo.js` bảng ánh xạ cho **mọi enum trạng thái** (ví dụ `Hoàn thành`→`success`, `Chờ xác nhận`→`warning`, `Đã hủy`→`danger`, `Đang vận chuyển`→`info`...). Không viết `if` theo trạng thái ở nơi khác.

## 8. Layout

### 8.1 `UserLayout` (công khai + Người dùng)

```text
Desktop
┌────────────────────────────────────────────────────────────────┐
│ Soopi   [ Tìm sản phẩm………………………………  ]   Giỏ hàng   Tài khoản ▾ │  sticky, cao 64px, viền dưới
├────────────────────────────────────────────────────────────────┤
│                  nội dung (.container)                          │
├────────────────────────────────────────────────────────────────┤
│ Footer tối giản                                                 │
└────────────────────────────────────────────────────────────────┘
Mobile: hàng 1 = Soopi + Giỏ hàng + menu; hàng 2 = ô tìm kiếm full-width.
```
- Logo chỉ là chữ "Soopi" (tài liệu không có logo — không bịa logo).
- Ô tìm kiếm: submit → điều hướng `/san-pham?tuKhoa=...` (xóa trang về 1).
- Khi chưa đăng nhập: hai liên kết "Đăng nhập", nút "Đăng ký". (F06 nối trạng thái đăng nhập; F15 nối số lượng giỏ.)
- Header có `--bongNoi` **chỉ khi** trang đã cuộn.
- Footer: tên đề tài + vài liên kết chính; không nhồi nội dung.

### 8.2 `NguoiBanLayout` và `QuanTriVienLayout`

```text
┌─────────┬───────────────────────────────────────────┐
│ Sidebar │ Topbar:  [☰ mobile]  tên khu vực   Avatar ▾ │
│ (menu)  ├───────────────────────────────────────────┤
│         │ PageHeader + nội dung                       │
└─────────┴───────────────────────────────────────────┘
```
- Sidebar cố định (`--chieuRongSidebar`) từ 1024px; dưới 1024px thành **ngăn kéo** mở bằng nút ☰ (có lớp phủ, `Esc` đóng, focus được quản lý).
- Mục menu lấy từ hằng số `MENU_NGUOI_BAN`, `MENU_QUAN_TRI_VIEN` trong `utils/hangSo.js` (mỗi mục: `nhan`, `duongDan`, `bieuTuong`); dùng `NavLink`, mục đang chọn nền `--mauChinhNhat`, chữ `--mauChinh`.
  - Người bán: Tổng quan, Cửa hàng, Sản phẩm, Khuyến mãi, Voucher, Đơn hàng, Đổi trả và khiếu nại, Đánh giá, Trao đổi, Báo cáo.
  - Quản trị viên: Tổng quan, Tài khoản, Cửa hàng, Duyệt người bán, Danh mục, Sản phẩm, Giao dịch, Banner, Khuyến mãi, Voucher, Báo cáo.
- `NguoiBanLayout` có liên kết "Về trang mua sắm" (Người bán vẫn là Người dùng). `QuanTriVienLayout` là khu vực **tách biệt** (đúng mô tả Admin ở mục 3.1.2): **không** có giỏ hàng/mua sắm.
- Cả hai layout dùng `<Outlet />`. (Việc chặn truy cập theo vai trò là F06; ở F03 chỉ dựng khung.)

## 9. Quy tắc dùng lại cho các form sau

- Lưới sản phẩm: 2 cột (mobile) → 3 (≥768) → 4 (≥1024) → 5 (≥1280).
- Một trang chỉ có **một** nút `primary`.
- Trạng thái tải dùng `Skeleton` đúng hình dạng nội dung; trạng thái rỗng/lỗi luôn dùng `EmptyState`/`ErrorState`.
- Không thêm màu/bo góc/bóng/phông mới ngoài tokens. Cần thêm thì **thêm vào tokens** và báo cáo.

## 10. Văn phong giao diện (áp dụng khi viết chữ)

- Nút nêu đúng việc xảy ra: "Lưu thay đổi", "Thêm vào giỏ", "Đặt hàng", "Xóa sản phẩm" — không "Submit/OK".
- Cùng một hành động giữ cùng một tên ở nút, hộp thoại và thông báo.
- Lỗi: nói **chuyện gì xảy ra + cách sửa**, không xin lỗi dài dòng. Ví dụ: "Số lượng vượt quá tồn kho (còn 3). Hãy giảm số lượng."
- Trạng thái rỗng là lời mời hành động: "Giỏ hàng đang trống. Xem sản phẩm để bắt đầu."
- Câu chữ ngắn, đời thường, chữ thường theo kiểu câu (không viết hoa mọi từ).

## 11. Không được làm

- Không cài UI kit, Tailwind (trừ khi đã có sẵn), thư viện icon, thư viện animation. (Thư viện biểu đồ `recharts` sẽ được cài ở F26, không phải ở đây.)
- Không thêm dark mode ở đợt này.
- Không làm trang nghiệp vụ (đăng nhập, sản phẩm...). Muốn xem thử thành phần: tạo **một trang tạm** `GiaoDienMauPage` để kiểm tra, rồi **xóa** trước khi kết thúc.
- Không dùng mã màu/px/z-index rải rác trong component.

## 12. Tiêu chí hoàn thành

- [ ] `npm run build` thành công (và `lint` nếu có).
- [ ] Kiểm tra bằng trang tạm ở **360px, 768px, 1280px**: layout không vỡ, không cuộn ngang ngoài ý muốn.
- [ ] Điều hướng bàn phím: `Tab` đi qua mọi nút/ô nhập, focus nhìn thấy; `Modal` giữ focus và đóng bằng `Esc`; `DropdownMenu` đóng bằng `Esc`.
- [ ] `DataTable` chuyển từ bảng sang thẻ dưới 768px.
- [ ] `GiaTien` hiển thị đúng hai trường hợp (có/không khuyến mãi).
- [ ] Bảng màu trong `index.css` **trùng khớp từng giá trị** với bảng ở Mục 4 (kể cả `--mauBieuDo1…5`, `--mauLuoiBieuDo`); `layMauToken` trả đúng giá trị.
- [ ] Không có mã màu/khoảng cách viết trực tiếp ngoài `index.css` (kiểm tra bằng tìm kiếm `#` và `px` trong các `.css` component — ngoại trừ chiều cao tối thiểu 44px cho vùng bấm có chú thích).
- [ ] Đã xóa trang tạm.

## 13. Báo cáo cuối

Theo mẫu `01_BOI_CANH_CHUNG.md` Mục 9. Kèm danh sách component đã tạo và mọi token **thêm mới** (nếu có).
