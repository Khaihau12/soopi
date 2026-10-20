# Yêu cầu chỉnh sửa giao diện Người bán Soopi trên Figma

> Dùng toàn bộ nội dung file này làm **một yêu cầu duy nhất** cho Figma Agent. Hãy sửa trực tiếp bộ màn hình Người bán hiện có, giữ bố cục và màu nhận diện Soopi nếu còn phù hợp, đồng thời tạo thêm các trạng thái/màn hình được nêu bên dưới. Đây là **Figma demo**, không cần viết code, thiết kế API hoặc thêm chức năng ngoài phạm vi đề tài.

## 1. Mục tiêu và giới hạn chung

Thiết kế lại 15 màn Người bán đang có sao cho người xem hiểu được luồng: xem tổng quan → quản lý cửa hàng → sản phẩm/tồn kho/giá/khuyến mãi/voucher → xử lý đơn đã thanh toán → xử lý đổi trả/khiếu nại → xem thống kê/đánh giá → nhắn tin. Ưu tiên làm rõ tác vụ chính, trạng thái, dữ liệu và quan hệ giữa các màn. Không biến demo thành một sàn thương mại điện tử có thêm ngân hàng, giao vận thật, hoàn tiền tự động, SKU/biến thể sản phẩm hay chính sách đổi trả riêng khi tài liệu Soopi chưa có các dữ liệu đó.

Nguồn đối chiếu: `Soopi_3.2.1_Thiet_ke_Collection.md`, báo cáo nghiệp vụ Soopi V11 và quy tắc dự án `AGENTS.md`. Các tên trường dưới đây chỉ dùng để xác định **nội dung giao diện nào có cơ sở**; không cần hiện tên field kỹ thuật lên màn hình. Văn bản trên giao diện dùng tiếng Việt có dấu.

### Quy tắc phải áp dụng trên mọi màn

- Người bán đồng thời vẫn là Người dùng. Giao diện chỉ hiển thị và thao tác dữ liệu của **cửa hàng gắn với tài khoản đang đăng nhập**. Không có ô chọn cửa hàng khác hoặc trường nhập `cuaHangId` để đổi phạm vi quản lý.
- Mỗi sản phẩm thuộc đúng một cửa hàng và một danh mục. Trạng thái kinh doanh dùng **“Đang kinh doanh” / “Ngừng kinh doanh”**. Không dùng “Bản nháp”, “Đang bán”, “Ẩn sản phẩm” như trạng thái dữ liệu nếu chưa có trong tài liệu.
- Giá gốc là giá của sản phẩm; khuyến mãi là chương trình riêng, có thời gian hiệu lực và chi tiết áp dụng cho sản phẩm. Không đặt ô “giá khuyến mãi” như một thuộc tính cố định của sản phẩm. Đơn cũ phải hiển thị giá đã chốt lúc đặt, không đổi theo giá hiện tại.
- Voucher Người bán chỉ là **voucher Cửa hàng**. Voucher Toàn sàn và Freeship thuộc Quản trị viên. Không tự đặt quy tắc “mỗi khách một lần”, “mỗi đơn một voucher cửa hàng”, “chỉ áp dụng một sản phẩm” khi tài liệu chưa quy định.
- Một lần thanh toán có thể chứa nhiều đơn thuộc nhiều cửa hàng; Người bán chỉ thấy **đơn của chính cửa hàng mình**. Mỗi đơn có hai trạng thái độc lập: thanh toán và xử lý. Chỉ cho Người bán tiến đơn **đã thanh toán** theo đúng thứ tự: Chờ xác nhận → Đã xác nhận → Đang xử lý → Đang vận chuyển → Hoàn thành. Không có nút từ chối đơn đã thanh toán.
- Vận chuyển chỉ mô phỏng bằng phí và trạng thái. Không vẽ đối tác giao hàng, mã vận đơn, bản đồ giao hàng, lịch lấy hàng hay tự động hoàn tiền.
- Người bán được **xem** đánh giá, không có quyền trả lời công khai, sửa hay xóa đánh giá. Tin nhắn là nội dung văn bản; không giả lập tính năng đính kèm ảnh, online hoặc đã xem như thể có dữ liệu hỗ trợ.
- Số liệu trên dashboard, đơn hàng, doanh thu, tồn kho và sản phẩm phải tính/ghi nhất quán. Nếu dùng cùng một đơn mẫu giữa các màn, giữ nguyên mã đơn, người mua, sản phẩm, số tiền, thời điểm và trạng thái. Không dùng số minh họa mâu thuẫn giữa các màn.

## 2. Lỗi thiết kế lặp lại cần sửa đồng loạt

1. **Khả năng đọc:** chữ phụ đang quá nhỏ và nhạt; vùng nội dung quá hẹp trong khi có nhiều khoảng trống. Tăng cỡ chữ nội dung, độ tương phản, khoảng cách giữa các khối và dùng độ rộng bảng/form phù hợp màn desktop. Không đặt phần chính của form thành những dòng chữ giống bản mô tả tĩnh; phải nhìn rõ input, select, textarea, nút, trạng thái bắt buộc và lỗi nhập liệu.
2. **Điều hướng:** sidebar có quá nhiều mục cùng cấp, nhãn chữ nhỏ, mục đang chọn chưa nổi bật. Nhóm thành Tổng quan, Cửa hàng, Sản phẩm, Bán hàng, Khách hàng, Thống kê; trong nhóm Sản phẩm có Danh sách sản phẩm/Tồn kho/Giá & khuyến mãi, trong Bán hàng có Voucher/Đơn hàng/Đổi trả & khiếu nại, trong Khách hàng có Đánh giá/Tin nhắn. Giữ nhãn trang và breadcrumb nhất quán. Đừng tạo đường dẫn dẫn đến trang chưa vẽ.
3. **Hành động:** mỗi trang nên có một hành động chính nổi bật; hành động nguy hiểm dùng nhãn cụ thể và hộp xác nhận. Các nút “Lưu”, “Chỉnh sửa”, “Xem chi tiết” phải dẫn đến trạng thái hoặc trang tương ứng trong demo. Không để button nhìn có thể bấm nhưng không có đích. Trạng thái đang tải, thành công, lỗi nhập liệu, danh sách rỗng và không có kết quả lọc phải được mô tả cho các luồng quan trọng.
4. **Bảng dữ liệu:** cột đủ rộng, số tiền căn phải, trạng thái thành chip màu có chữ, hàng có phân cách rõ, nút chi tiết đủ vùng bấm. Đặt bộ lọc sát bảng; cho thấy khi nào bộ lọc đang áp dụng và cách xóa lọc. Tránh vừa có nhiều thẻ thống kê lớn vừa có một bảng chi chít thông tin lặp lại.
5. **Cảnh báo:** banner cam đang xuất hiện dày đặc, có cả nơi không phải lỗi. Chỉ dùng cảnh báo cho vấn đề thật sự cần xử lý; thông tin hướng dẫn đặt cạnh trường liên quan hoặc dưới tiêu đề. Không hiển thị hạn xử lý 48 giờ, đổi trả 7 ngày, ngưỡng tồn 10 sản phẩm như quy tắc chính thức vì tài liệu không quy định.
6. **Dữ liệu cá nhân:** email tài khoản của chủ shop, nếu cần hiển thị, phải ghi rõ là “Email tài khoản” và lấy từ `TaiKhoan`. Không tạo “email cửa hàng” độc lập. Địa chỉ nhận hàng của khách chỉ xuất hiện trong chi tiết đơn có liên quan, không đưa vào các trang tổng quan hay màn khác.
7. **Tính nhất quán ngôn ngữ:** dùng “Cửa hàng”, “Sản phẩm”, “Đơn hàng”, “Khuyến mãi”, “Voucher cửa hàng”, “Đổi trả/Khiếu nại”, “Tin nhắn”. Giữ một cách gọi cho mỗi trạng thái; không trộn “đang bán/hoạt động/kinh doanh” cho cùng một trạng thái.

## 3. Sửa chi tiết từng màn hiện có

### 01 — Tổng quan cửa hàng

- Giữ 4 nhóm thông tin hữu ích nhưng đổi nhãn rõ nghĩa: “Doanh thu từ đơn hoàn thành”, “Đơn đã thanh toán chờ xác nhận”, “Sản phẩm cần kiểm tra tồn kho”, “Yêu cầu đổi trả/khiếu nại chờ xử lý”. Với doanh thu, ghi rõ khoảng thời gian đang xem và định nghĩa tiền thống nhất với trang Thống kê; không cộng đơn chưa hoàn thành vào doanh thu hoàn thành.
- Card “2 sản phẩm tồn thấp” đang ngầm dùng ngưỡng dưới 10. Nếu chưa có ngưỡng trong dự án, đổi thành “Sản phẩm hết hàng” dựa trên tồn kho bằng 0, hoặc chỉ hiện số sản phẩm có tồn thấp sau khi thống nhất quy tắc. Không ghi con số ngưỡng giả.
- Bỏ câu “cần phản hồi trước 18/10” hoặc thời hạn phản hồi 48 giờ. Có thể thay bằng “Có yêu cầu đang chờ xử lý” và CTA “Xem yêu cầu”.
- Bảng “Đơn hàng cần xác nhận” chỉ đưa đơn **Đã thanh toán + Chờ xác nhận**. Hiện mã đơn, người mua, thời gian đặt, số sản phẩm, số tiền của **đơn cửa hàng**, trạng thái thanh toán và nút “Xem đơn”. Nếu trống, có empty state dễ hiểu.
- Các card phải dẫn đến trang đã lọc tương ứng. Khối “Hoạt động cửa hàng” chỉ hiển thị sự kiện có dữ liệu thật từ đơn/sản phẩm/yêu cầu; không bịa nhật ký hệ thống nếu không có trường lưu. Bỏ những khối lặp số liệu hoặc thông báo không giúp ra quyết định.

### 02 — Thông tin cửa hàng

- Thiết kế lại thành một form gọn với đúng dữ liệu cửa hàng: **Tên cửa hàng, Mô tả, Địa chỉ**, và **Trạng thái hoạt động** để xem. Có chế độ xem và “Chỉnh sửa” rõ ràng, hiển thị lỗi cho trường bắt buộc, thao tác Lưu/Hủy.
- Nếu cần thông tin chủ sở hữu, tách thành khối chỉ đọc “Tài khoản người bán” với tên và “Email tài khoản”; không gọi đó là email cửa hàng, không cho sửa tại trang cửa hàng nếu luồng sửa tài khoản nằm nơi khác.
- Bỏ hẳn hoặc chuyển sang phạm vi tương lai: tải logo nếu schema chưa có trường ảnh/logo cửa hàng; số điện thoại cửa hàng độc lập; giờ mở cửa; loại hình kinh doanh; CCCD/giấy tờ xác minh; tài khoản ngân hàng; “xác minh lại hồ sơ”; chính sách đổi trả riêng; các cam kết giao hàng. Không để nút “Sửa chính sách”, “Xem giấy tờ”, “Chỉnh sửa tài khoản ngân hàng” vô đích.
- Trạng thái `trangThaiHoatDong` có thể hiện bằng chip, nhưng không thêm công tắc để người bán tự đổi nếu nghiệp vụ chưa quy định quyền đó. Link “Xem cửa hàng” chỉ đặt nếu đã có trang công khai cửa hàng tương ứng.

### 03 — Danh sách sản phẩm

- Thay nhóm thống kê “Đang bán/Bản nháp/Ngừng bán” bằng “Tổng sản phẩm / Đang kinh doanh / Ngừng kinh doanh / Hết hàng” hoặc bớt card nếu chúng lặp bảng. **Không có bản nháp** trong model hiện tại.
- Bảng cần ảnh đại diện nhỏ, tên sản phẩm, danh mục, giá gốc, giá bán đang áp dụng (nếu có khuyến mãi hợp lệ), số lượng tồn, trạng thái kinh doanh và hành động. Nếu cần mã, dùng mã hiển thị suy từ `_id`; không giả định có SKU riêng.
- Giá bán khuyến mãi phải phân biệt bằng giá gốc gạch ngang + giá đang áp dụng và chỉ xuất hiện trong thời gian chương trình có hiệu lực. Nếu chưa có chương trình, hiển thị giá gốc một lần.
- Bộ lọc nên có tên/danh mục/trạng thái/tình trạng tồn; có “Xóa bộ lọc”. Không thêm lọc “Bản nháp”. Hành động theo hàng: “Xem/Sửa”, “Ngừng kinh doanh” hoặc “Đưa vào kinh doanh” với xác nhận; không đưa “Xóa nháp”. Với sản phẩm từng có đơn, tránh xóa cứng.
- Thêm trạng thái không có sản phẩm, không tìm thấy, sản phẩm đã ngừng kinh doanh. CTA “Thêm sản phẩm” dẫn sang màn 04.

### 04 — Thêm sản phẩm

- Rút form dài hiện tại thành các nhóm dễ quét: **Thông tin cơ bản** (tên, danh mục, mô tả), **Hình ảnh** (danh sách ảnh/preview nếu demo có hỗ trợ), **Giá và tồn kho** (giá gốc VND, số lượng tồn ban đầu), **Trạng thái kinh doanh**. Trường cần nhập phải trông như control thật, có nhãn, placeholder, thông báo lỗi và số liệu mẫu hợp lý.
- Bỏ SKU, thương hiệu, màu/kích cỡ/biến thể, cân nặng, giới hạn mua, bảo hành và chính sách đổi trả mặc định nếu chúng không có trong thiết kế collection. Không thêm những trường này chỉ để form “đầy đủ”.
- Bỏ ô giá khuyến mãi, phần trăm giảm và ngày chạy khuyến mãi khỏi form sản phẩm. Sau khi lưu sản phẩm, có thể cho CTA phụ “Tạo khuyến mãi cho sản phẩm” dẫn sang màn 07.
- Bỏ nút “Lưu bản nháp”. Nút chính “Thêm sản phẩm”, nút phụ “Hủy”; nếu cho chọn trạng thái ban đầu, dùng đúng “Đang kinh doanh/Ngừng kinh doanh”. Có xác nhận trước khi rời form nếu đã nhập dữ liệu chưa lưu.
- Làm ví dụ lỗi: giá âm, tồn kho âm, thiếu tên/danh mục, ảnh sai/không có ảnh nếu giao diện yêu cầu ảnh. Không tự công bố giới hạn dung lượng ảnh nếu tài liệu chưa quy định.

### 05 — Sửa sản phẩm

- Dùng cùng cấu trúc với màn 04, điền dữ liệu hiện tại và hiển thị mã sản phẩm chỉ đọc. Chỉ sửa dữ liệu có trong sản phẩm: tên, danh mục, ảnh, mô tả, giá gốc, số lượng tồn, trạng thái kinh doanh.
- Khối “Giá hiện tại” phải phân biệt giá gốc với giá khuyến mãi từ một chương trình đang hoạt động; thêm link “Xem khuyến mãi” thay vì sửa giảm giá trực tiếp trong form. Khi sửa giá gốc, nhắc ngắn rằng đơn đã đặt vẫn dùng giá tại thời điểm đặt.
- Với tồn kho, nếu có màn quản lý tồn kho riêng thì tại đây chỉ hiển thị số hiện tại và link “Điều chỉnh tồn kho” để tránh hai luồng chỉnh cùng một dữ liệu. Hành động “Ngừng kinh doanh” có xác nhận, không dùng xóa cứng cho sản phẩm đã phát sinh đơn.
- Bỏ toàn bộ trường giả giống màn 04. Không đặt trang này quá dài vì nhiều khoảng trống; chia 2 cột hoặc các thẻ gọn, giữ thanh Lưu/Hủy dễ thấy.

### 06 — Tồn kho

- Bảng tồn kho chỉ thể hiện dữ liệu có cơ sở: ảnh/tên sản phẩm, trạng thái kinh doanh, `soLuongTon` hiện tại và hành động “Điều chỉnh”. Không tách “Tồn khả dụng / Đang giữ cho đơn” như hai con số độc lập: dự án trừ tồn kho ngay khi tạo đơn và hoàn lại khi thanh toán thất bại/hết hạn/hủy theo quy tắc.
- Không hiện “ngưỡng cảnh báo 10”, “ngưỡng riêng cho từng sản phẩm”, “lần cập nhật cuối” hoặc “lịch sử điều chỉnh” có người sửa/lý do/thời điểm nếu chưa có dữ liệu lưu. Có thể lọc “Hết hàng” (`soLuongTon = 0`) và “Còn hàng”.
- Dialog điều chỉnh tồn kho: hiển thị số hiện tại, trường số mới hoặc số lượng tăng/giảm, số sau điều chỉnh, nút Lưu/Hủy. Chặn số âm; nếu giảm nhiều hơn tồn hiện có, hiện lỗi. Không cho Người bán can thiệp vào tồn kho thuộc cửa hàng khác.
- Nếu cần phần lịch sử để demo, hãy ghi rõ “Đề xuất mở rộng dữ liệu, chưa thuộc Soopi 3.2.1” và đặt ở khu vực riêng; tốt hơn là bỏ khỏi bản bàn giao chính để không hiểu nhầm đã có chức năng audit.

### 07 — Giá và khuyến mãi

- Tách rõ **“Giá gốc sản phẩm”** và **“Chương trình khuyến mãi”**. Bảng có thể hiển thị tên sản phẩm, giá gốc, giá đang áp dụng, tên chương trình và thời gian hiệu lực. Nút sửa giá gốc dẫn về màn 05; nút tạo/sửa khuyến mãi dẫn tới form chương trình riêng.
- Tạo danh sách chương trình khuyến mãi thuộc cửa hàng: tên, loại, phạm vi Cửa hàng, ngày bắt đầu/kết thúc, trạng thái **Chưa bắt đầu / Đang hoạt động / Đã kết thúc**, số sản phẩm áp dụng và nút chi tiết. Khi tạo/sửa: nhập tên, loại, thời gian, chọn các sản phẩm thuộc cửa hàng; với mỗi sản phẩm chọn **tỷ lệ giảm hoặc giá khuyến mãi** theo thiết kế, xem trước giá cuối và bảo đảm không cao hơn giá gốc/không âm.
- Không biến “đang áp dụng” thành một trạng thái lưu của sản phẩm. Không cho tạo khuyến mãi cho sản phẩm của cửa hàng khác. Khuyến mãi Toàn sàn thuộc Quản trị viên, không có nút tạo từ trang Người bán.
- Dùng ví dụ thời gian hợp lý: “Chưa bắt đầu” nếu ngày tương lai, “Đang hoạt động” chỉ khi trong thời gian hiệu lực, “Đã kết thúc” nếu đã qua ngày kết thúc. Lưu giá gốc riêng, không trình bày như bị ghi đè.

### 08 — Voucher cửa hàng

- Tiêu đề, bộ lọc và form phải nói rõ đây là **Voucher Cửa hàng**. Người bán không chọn loại Freeship/Toàn sàn. Form hợp lý gồm: mã voucher, tên voucher, kiểu giảm **Phần trăm/Số tiền cố định**, giá trị giảm, giảm tối đa khi phù hợp, giá trị đơn tối thiểu, số lượng, ngày bắt đầu/kết thúc, trạng thái và cửa hàng chỉ đọc.
- Với phần trăm, hiển thị `%` và trường giảm tối đa; với số tiền cố định, hiển thị `đ` và không ép trường giới hạn phần trăm. Preview một ví dụ đủ điều kiện/không đủ điều kiện để người xem hiểu kết quả. Không tự đưa vào trường “mỗi người mua 1 lượt”, “sản phẩm áp dụng” hoặc quy định tối đa một voucher của mỗi loại.
- Bảng liệt kê mã, tên, mức giảm, đơn tối thiểu, thời gian, số lượng, trạng thái và hành động. Nếu hiển thị “đã dùng 24/100”, hãy bảo đảm tính được từ `ApDungVoucher` và định nghĩa rõ 100 là số lượng ban đầu; nếu demo không có dữ liệu này, chỉ hiển thị số lượng còn có thể dùng.
- Tránh form chi tiết quá dài với nhiều chữ nhỏ. Dùng “Tạo voucher”, “Sửa voucher”, “Vô hiệu hóa” hoặc trạng thái phù hợp với tài liệu; các thao tác có xác nhận và phản hồi. Không sao chép câu “mỗi đơn chỉ được một voucher cửa hàng” vì nghiệp vụ chưa ấn định giới hạn.

### 09 — Danh sách đơn hàng

- Hiển thị **hai trạng thái riêng** trong bảng: thanh toán và xử lý. Các tab xử lý chỉ là cách lọc; đừng làm người xem tưởng “Đã thanh toán” là bước sau “Đang vận chuyển”. Cho lọc đơn đã thanh toán, chờ thanh toán, thất bại, hết hạn; và lọc trạng thái xử lý bao gồm Đã hủy. Các đơn thất bại/hết hạn/hủy chỉ xem, không có hành động xác nhận.
- Bảng cần mã đơn, thời gian đặt, người mua, tóm tắt sản phẩm, tổng thanh toán của đơn cửa hàng, chip trạng thái thanh toán, chip trạng thái xử lý, nút “Xem chi tiết”. Nếu một lần thanh toán có nhiều cửa hàng, Người bán chỉ xem dòng của cửa hàng mình.
- Không dùng “Từ chối đơn”. Không có hành động cập nhật trạng thái ngay trên từng hàng nếu chưa thể hiện điều kiện; đưa vào chi tiết đơn. Đặt thông báo điều kiện “Chỉ xử lý đơn đã thanh toán” gần bộ lọc/trạng thái, không làm banner cam chiếm ngang toàn trang.
- Nếu có “Xuất đơn hàng”, phải có đích rõ; vì báo cáo không yêu cầu xuất file, có thể bỏ khỏi demo. Thêm empty state cho từng lọc và tìm kiếm không có kết quả.

### 10 — Chi tiết đơn / cập nhật trạng thái

- Đặt phần đầu rõ ràng: mã đơn, cửa hàng, người mua, thời điểm đặt, **trạng thái thanh toán** và **trạng thái xử lý**. Phân tách địa chỉ nhận hàng, sản phẩm trong đơn, tóm tắt tiền, thanh toán VNPay và hành động.
- Dòng sản phẩm phải lấy giá tại thời điểm đặt: số lượng, giá gốc tại thời điểm đặt, giá bán thực tế và thành tiền. Tổng tiền thể hiện công thức bằng các dòng: tiền hàng − giảm voucher + phí vận chuyển − giảm phí vận chuyển = tổng thanh toán; dùng cùng con số như màn 09. Không hiển thị đơn hoặc mặt hàng của cửa hàng khác.
- Thanh tiến trình xử lý dùng đúng 5 bước. Chỉ bước tiếp theo được phép chọn; ví dụ từ “Chờ xác nhận” chỉ có “Xác nhận đơn”. Nút cập nhật bị vô hiệu hóa và giải thích lý do nếu chưa thanh toán, thanh toán thất bại/hết hạn, hoặc đơn đã hủy/hoàn thành. Không có từ chối đơn đã thanh toán, không có nhảy cóc/lùi trạng thái.
- Bỏ “Ghi chú nội bộ”, “Ghi chú người mua” nếu chưa có trường tương ứng. Bỏ mốc giờ chi tiết cho từng lần đổi trạng thái nếu không có dữ liệu lưu; có thể giữ timeline quy trình và đánh dấu bước hiện tại, không gán timestamp giả. `DonHang.ngayTao` vẫn hiển thị được.
- Nút “Nhắn tin với người mua” mở hội thoại của cửa hàng và người mua. Nếu thông tin liên quan yêu cầu đổi trả, link phải mở đúng yêu cầu, không tạo luồng xử lý khác.

### 11 — Danh sách đổi trả / khiếu nại

- Dùng tên “Yêu cầu đổi trả/khiếu nại”. Mỗi yêu cầu gắn với **một dòng sản phẩm trong đơn**; trong bảng phải có mã yêu cầu, mã đơn, sản phẩm, người mua, loại yêu cầu, ngày tạo, trạng thái xử lý và kết quả xử lý.
- Phân biệt rõ “Chờ xử lý/Đã xử lý” với kết quả “Chấp nhận/Từ chối”. Bỏ trạng thái “Đã đóng” nếu nó không nằm trong dữ liệu; không dùng card “Đang chờ người mua gửi hàng” vì không có quy trình vận chuyển hàng hoàn trong đề tài.
- Bỏ hạn phản hồi 48 giờ và cảnh báo quá hạn. Đặt CTA “Xem yêu cầu” cho từng hàng; nếu còn chờ xử lý, chip và thứ tự hiển thị giúp dễ ưu tiên. Không để người bán thấy yêu cầu thuộc cửa hàng khác.
- Card tổng quan nên có “Chờ xử lý”, “Đã chấp nhận”, “Đã từ chối” nếu muốn; không đếm chồng các nhóm khiến tổng không khớp.

### 12 — Chi tiết và xử lý yêu cầu

- Bố cục phần chi tiết: người mua/mã đơn, sản phẩm và số lượng liên quan, loại yêu cầu, nội dung người mua, ngày tạo, trạng thái xử lý, kết quả xử lý. Cho xem lại chi tiết đơn để có bối cảnh.
- Chỉ có hai quyết định thuộc phạm vi Người bán: **Chấp nhận** hoặc **Từ chối** yêu cầu. Trước khi xác nhận, có dialog nói rõ đây là quyết định của yêu cầu; sau khi xử lý, trạng thái/kết quả là chỉ đọc. Không vẽ nút “Hoàn tiền”, “Đổi sản phẩm tự động”, “Xác nhận giao lại”, “Tạo vận đơn”.
- Bỏ “đổi trả trong 7 ngày”, “phản hồi trước 48 giờ”, yêu cầu người mua tải ảnh/video, giải pháp mong muốn, địa chỉ hoàn hàng, phương án đổi cùng loại và nhật ký xử lý chi tiết nếu chưa có trường dữ liệu. Không đặt ô nhập “phản hồi của người bán” như thông tin sẽ lưu khi model không có trường đó. Có thể dùng Tin nhắn cho trao đổi văn bản ngoài quyết định xử lý.
- Nếu muốn thiết kế thêm các tính năng đó cho phiên bản sau, gom vào mục “Đề xuất mở rộng” riêng, **không đưa vào màn hình demo chính**.

### 13 — Thống kê cửa hàng

- Thống kê chỉ của cửa hàng hiện tại. Không cho chọn hoặc nhập cửa hàng khác. Bộ lọc ngày/tháng rõ ràng; khi đổi kỳ, toàn bộ card và bảng cập nhật cùng kỳ.
- Doanh thu nên ghi cụ thể là từ **đơn hoàn thành**. Đơn chưa thanh toán, thất bại, hết hạn, đã hủy không được tính vào doanh thu này. Giữ số đơn hoàn thành, số sản phẩm bán và giá trị đơn trung bình nhất quán với doanh thu, bảng đơn và ví dụ sản phẩm.
- Tách “Doanh thu theo thời gian” và “Sản phẩm bán chạy”. Nếu tính doanh thu theo sản phẩm, đừng lấy nguyên tổng thanh toán của đơn đa sản phẩm để gán cho từng sản phẩm; thể hiện cách đọc đơn giản theo `ChiTietDonHang.thanhTien`, tránh số liệu tự mâu thuẫn. Không cần vẽ KPI giả như lợi nhuận ròng, chi phí quảng cáo, tỉ lệ hoàn tiền khi không có dữ liệu.
- Khi kỳ lọc không có đơn hoàn thành, hiển thị biểu đồ/empty state và số 0 đúng cách. Bỏ nút “Xuất báo cáo” nếu demo chưa có luồng tương ứng; hoặc vẽ trạng thái tải file thật rõ nếu muốn giữ như một ý tưởng mở rộng.

### 14 — Đánh giá

- Trang Người bán chỉ để **xem đánh giá sản phẩm thuộc cửa hàng mình**. Bảng/card nên có số sao, nội dung, sản phẩm, người đánh giá, ngày đánh giá và link đến sản phẩm/đơn liên quan nếu phù hợp. Bộ lọc theo sản phẩm, số sao và thời gian.
- Bỏ card “Chưa phản hồi” và toàn bộ ô “Phản hồi công khai”, nút “Gửi phản hồi”, nhãn “Đã phản hồi” vì `DanhGia` không có phản hồi Người bán và báo cáo chỉ cho Người bán xem đánh giá. Không cho sửa/xóa đánh giá.
- Nếu ghi “Đánh giá đã xác minh”, cần hiểu đó là suy ra từ quy tắc chỉ đánh giá sau khi đơn hoàn thành, không phải một trạng thái xác minh riêng; tốt nhất chỉ ghi “Đánh giá”. Điểm trung bình và phân bố sao phải khớp số đánh giá thực tế.
- Thêm trường hợp chưa có đánh giá hoặc lọc không có kết quả, tránh bảng trống không giải thích.

### 15 — Tin nhắn

- Dùng bố cục hai cột gọn: danh sách hội thoại với người mua ở trái, nội dung trò chuyện ở phải. Header hội thoại ghi tên người mua/cửa hàng; một hội thoại chỉ có tin nhắn thuộc cặp người mua và cửa hàng đó. Tin nhắn văn bản có người gửi, nội dung, thời gian gửi; ô nhập tin nhắn và nút Gửi.
- Bỏ trạng thái “Đang trực tuyến”, “Đã xem”, số tin chưa đọc nếu dữ liệu không có trạng thái online/read; bỏ nút tải ảnh/file và tin nhắn chứa ảnh vì `TinNhan` chỉ có nội dung văn bản. Không cho một chat giả liên kết trực tiếp với mã đơn/yêu cầu như trường dữ liệu có sẵn; nếu muốn đặt link ngữ cảnh, chỉ đặt khi xác định được quan hệ từ luồng mở trang.
- Mẫu tin phải phù hợp: đừng viết “đã nhận ảnh” khi không có tin ảnh. Khi chưa chọn hội thoại, có empty state “Chọn cuộc trò chuyện”. Khi chưa có hội thoại, hướng dẫn quay về đơn/người mua để bắt đầu nhắn tin nếu luồng đó được thiết kế.
- Tách nút Gửi khỏi phím nhập, hiển thị lỗi khi tin trống hoặc gửi thất bại; giữ thanh nhập luôn thấy được khi cuộn.

## 4. Những màn/trạng thái nên tạo thêm trong cùng file Figma

1. **Chi tiết chương trình khuyến mãi và form tạo/sửa khuyến mãi:** đây là thiếu sót quan trọng nhất của màn 07. Có danh sách sản phẩm áp dụng, mức giảm của từng sản phẩm, thời gian và trạng thái chương trình. Tạo ít nhất một ví dụ chương trình sắp bắt đầu và một ví dụ đang hoạt động.
2. **Form tạo/sửa voucher cửa hàng:** màn 08 hiện giống trang mô tả dài. Làm một frame form có input thật và một frame xem voucher đã tạo; thể hiện hai nhánh giảm theo phần trăm và giảm số tiền cố định.
3. **Trạng thái đơn chưa thanh toán / thanh toán thất bại hoặc hết hạn / đã hủy:** trên màn 10 hoặc các frame biến thể, thể hiện việc vô hiệu hóa nút xử lý; chỉ trạng thái đơn đã thanh toán mới cho tiến bước. Có thể dùng cùng layout và dữ liệu mẫu khác nhau.
4. **Hộp xác nhận cập nhật trạng thái đơn:** nêu mã đơn, trạng thái hiện tại, trạng thái tiếp theo; sau xác nhận chuyển đúng một bước. Không thêm nút từ chối.
5. **Hai kết quả xử lý yêu cầu:** frame “Chấp nhận” và “Từ chối” cho màn 12, có trạng thái Đã xử lý và kết quả tương ứng, không có hoàn tiền tự động.
6. **Trạng thái rỗng và lỗi cần thiết:** chưa có sản phẩm, hết hàng, không có đơn đúng bộ lọc, chưa có yêu cầu, chưa có đánh giá, chưa có hội thoại, kỳ thống kê không có dữ liệu; thêm ví dụ validation cho form sản phẩm/voucher và trạng thái lưu thành công. Tận dụng component/variant thay vì nhân bản nguyên trang nếu Figma thuận tiện.
7. **Trang công khai cửa hàng của phía Người mua:** chỉ thêm nếu bộ Figma Người mua chưa có nhưng menu “Xem cửa hàng” của Người bán đang dẫn đến đó. Dùng dữ liệu tên/mô tả/địa chỉ và sản phẩm đang kinh doanh; không tự tạo thông tin email shop, số điện thoại hay đánh giá cửa hàng nếu không có dữ liệu.

## 5. Yêu cầu hoàn thiện Figma demo

- Giữ hệ màu Soopi nhưng tăng tương phản; một màu nhấn chính cho CTA, màu trạng thái dùng có nhãn chữ, không chỉ dựa vào màu. Đồng bộ chiều cao input/nút, bo góc, khoảng cách, icon, tiêu đề, breadcrumb, sidebar, table header giữa 15 màn.
- Với form dài, nhóm trường thành từng thẻ ngắn, bố trí 2 cột khi phù hợp và đặt hành động Lưu/Hủy dễ thấy. Với bảng dài, làm header dễ đọc, cột hành động cố định hoặc đủ chỗ, tránh chữ co quá nhỏ.
- Tạo prototype tối thiểu cho các đường chính: Dashboard → Đơn chờ xác nhận → Chi tiết đơn → Xác nhận; Sản phẩm → Thêm/Sửa; Tồn kho → Điều chỉnh; Khuyến mãi → Tạo; Voucher → Tạo; Yêu cầu → Chấp nhận/Từ chối; Đơn → Tin nhắn. Các nút không thuộc phạm vi phải bỏ thay vì để nút giả.
- Trước khi bàn giao, rà lại **toàn bộ 15 màn**: không có giá trị enum sai; không có “bản nháp”, “email cửa hàng”, ngân hàng, CCCD, phí giao hàng thật, mã vận đơn, hoàn tiền tự động, phản hồi đánh giá, file chat, “đã xem”, hạn 48 giờ/7 ngày; dữ liệu mẫu khớp giữa bảng và chi tiết; tiền tính đúng; Người bán chỉ quản lý cửa hàng mình.
- Nếu một chi tiết mong muốn nhưng tài liệu chưa quy định, chỉ ghi vào một ghi chú riêng cuối file Figma là “Cần xác nhận nghiệp vụ”, không thiết kế như chức năng đã chốt.
