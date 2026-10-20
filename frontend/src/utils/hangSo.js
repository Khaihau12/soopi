export const VAI_TRO = {
  NGUOI_DUNG: 'Người dùng',
  NGUOI_BAN: 'Người bán',
  QUAN_TRI_VIEN: 'Quản trị viên',
};

export const TRANG_THAI_TAI_KHOAN = {
  HOAT_DONG: 'Hoạt động',
  BI_KHOA: 'Bị khóa',
};

export const TRANG_THAI_YEU_CAU_NGUOI_BAN = {
  CHO_PHE_DUYET: 'Chờ phê duyệt',
  DA_PHE_DUYET: 'Đã phê duyệt',
  DA_TU_CHOI: 'Đã từ chối',
};

export const TRANG_THAI_KINH_DOANH = {
  DANG_KINH_DOANH: 'Đang kinh doanh',
  NGUNG_KINH_DOANH: 'Ngừng kinh doanh',
};

export const TRANG_THAI_KHUYEN_MAI = {
  CHUA_BAT_DAU: 'Chưa bắt đầu',
  DANG_HOAT_DONG: 'Đang hoạt động',
  DA_KET_THUC: 'Đã kết thúc',
};

export const PHAM_VI_KHUYEN_MAI = {
  CUA_HANG: 'Cửa hàng',
  TOAN_SAN: 'Toàn sàn',
};

export const LOAI_KHUYEN_MAI = {
  GIAM_GIA: 'Giảm giá',
  FLASH_SALE: 'Flash Sale',
};

export const LOAI_VOUCHER = {
  FREESHIP: 'Freeship',
  TOAN_SAN: 'Toàn sàn',
  CUA_HANG: 'Cửa hàng',
};

export const KIEU_GIAM = {
  PHAN_TRAM: 'Phần trăm',
  SO_TIEN_CO_DINH: 'Số tiền cố định',
};

export const TRANG_THAI_VOUCHER = {
  KICH_HOAT: 'Kích hoạt',
  VO_HIEU_HOA: 'Vô hiệu hóa',
};

export const MAU_TINH_TRANG_VOUCHER = {
  'Đang hiệu lực': 'success',
  'Chưa bắt đầu': 'info',
  'Đã hết hạn': 'neutral',
  'Hết số lượng': 'warning',
  'Vô hiệu hóa': 'neutral',
};

export const TRANG_THAI_THANH_TOAN_DON = {
  CHO_THANH_TOAN: 'Chờ thanh toán',
  DA_THANH_TOAN: 'Đã thanh toán',
  THAT_BAI: 'Thất bại',
  HET_HAN: 'Hết hạn',
};

export const TRANG_THAI_XU_LY = {
  CHO_XAC_NHAN: 'Chờ xác nhận',
  DA_XAC_NHAN: 'Đã xác nhận',
  DANG_XU_LY: 'Đang xử lý',
  DANG_VAN_CHUYEN: 'Đang vận chuyển',
  HOAN_THANH: 'Hoàn thành',
  DA_HUY: 'Đã hủy',
};

export const TRANG_THAI_GIAO_DICH = {
  CHO_THANH_TOAN: 'Chờ thanh toán',
  THANH_CONG: 'Thành công',
  THAT_BAI: 'Thất bại',
  HET_HAN: 'Hết hạn',
};

export const KET_QUA_XU_LY = {
  CHAP_NHAN: 'Chấp nhận',
  TU_CHOI: 'Từ chối',
};

export const LOAI_YEU_CAU = {
  DOI_TRA: 'Đổi trả',
  KHIEU_NAI: 'Khiếu nại',
};

export const TRANG_THAI_XU_LY_YEU_CAU = {
  CHO_XU_LY: 'Chờ xử lý',
  DA_XU_LY: 'Đã xử lý',
};

export const TRANG_THAI_HOAT_DONG_CUA_HANG = {
  HOAT_DONG: 'Hoạt động',
  NGUNG_HOAT_DONG: 'Ngừng hoạt động',
};

export const GIOI_TINH = {
  NAM: 'Nam',
  NU: 'Nữ',
  KHAC: 'Khác',
};

export const TRANG_THAI_BANNER = {
  KICH_HOAT: 'Kích hoạt',
  VO_HIEU_HOA: 'Vô hiệu hóa',
};

export const DUONG_DAN = {
  TRANG_CHU: '/',
  SAN_PHAM: '/san-pham',
  chiTietSanPham: (id) => '/san-pham/' + id,
  DANG_NHAP: '/dang-nhap',
  DANG_KY: '/dang-ky',
  QUEN_MAT_KHAU: '/quen-mat-khau',
  DAT_LAI_MAT_KHAU: '/dat-lai-mat-khau',
  GIO_HANG: '/gio-hang',
  THANH_TOAN: '/thanh-toan',
  KET_QUA_THANH_TOAN: '/thanh-toan/ket-qua',
  DON_HANG: '/don-hang',
  chiTietDonHang: (id) => '/don-hang/' + id,
  TAI_KHOAN: '/tai-khoan',
  DOI_TRA_KHIEU_NAI: '/doi-tra-khieu-nai',
  TRO_CHUYEN: '/tro-chuyen',
  DANG_KY_NGUOI_BAN: '/dang-ky-nguoi-ban',
  NGUOI_BAN: {
    TONG_QUAN: '/nguoi-ban',
    CUA_HANG: '/nguoi-ban/cua-hang',
    SAN_PHAM: '/nguoi-ban/san-pham',
    THEM_SAN_PHAM: '/nguoi-ban/san-pham/them',
    suaSanPham: (id) => '/nguoi-ban/san-pham/' + id + '/sua',
    KHUYEN_MAI: '/nguoi-ban/khuyen-mai',
    THEM_KHUYEN_MAI: '/nguoi-ban/khuyen-mai/them',
    suaKhuyenMai: (id) => '/nguoi-ban/khuyen-mai/' + id + '/sua',
    VOUCHER: '/nguoi-ban/voucher',
    DON_HANG: '/nguoi-ban/don-hang',
    chiTietDonHang: (id) => '/nguoi-ban/don-hang/' + id,
    DOI_TRA_KHIEU_NAI: '/nguoi-ban/doi-tra-khieu-nai',
    DANH_GIA: '/nguoi-ban/danh-gia',
    TRO_CHUYEN: '/nguoi-ban/tro-chuyen',
    BAO_CAO: '/nguoi-ban/bao-cao',
  },
  QUAN_TRI_VIEN: {
    TONG_QUAN: '/quan-tri-vien',
    TAI_KHOAN: '/quan-tri-vien/tai-khoan',
    CUA_HANG: '/quan-tri-vien/cua-hang',
    DUYET_NGUOI_BAN: '/quan-tri-vien/duyet-nguoi-ban',
    DANH_MUC: '/quan-tri-vien/danh-muc',
    SAN_PHAM: '/quan-tri-vien/san-pham',
    GIAO_DICH: '/quan-tri-vien/giao-dich',
    BANNER: '/quan-tri-vien/banner',
    KHUYEN_MAI: '/quan-tri-vien/khuyen-mai',
    THEM_KHUYEN_MAI: '/quan-tri-vien/khuyen-mai/them',
    suaKhuyenMai: (id) => '/quan-tri-vien/khuyen-mai/' + id + '/sua',
    VOUCHER: '/quan-tri-vien/voucher',
    BAO_CAO: '/quan-tri-vien/bao-cao',
  },
};

export const PHAN_TRANG = { MAC_DINH: 12 };
export const DON_HANG_TABS = [
  { value: 'tat-ca', label: 'Tất cả', query: {} },
  { value: 'cho-thanh-toan', label: 'Chờ thanh toán', query: { trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN, phuongThucThanhToan: 'VNPay' } },
  { value: 'cho-xac-nhan', label: 'Chờ xác nhận', query: { trangThaiXuLy: TRANG_THAI_XU_LY.CHO_XAC_NHAN, thanhToanHopLe: true } },
  { value: 'da-xac-nhan', label: 'Đã xác nhận', query: { trangThaiXuLy: TRANG_THAI_XU_LY.DA_XAC_NHAN, thanhToanHopLe: true } },
  { value: 'dang-xu-ly', label: 'Đang xử lý', query: { trangThaiXuLy: TRANG_THAI_XU_LY.DANG_XU_LY, thanhToanHopLe: true } },
  { value: 'dang-van-chuyen', label: 'Đang vận chuyển', query: { trangThaiXuLy: TRANG_THAI_XU_LY.DANG_VAN_CHUYEN, thanhToanHopLe: true } },
  { value: 'hoan-thanh', label: 'Hoàn thành', query: { trangThaiXuLy: TRANG_THAI_XU_LY.HOAN_THANH, thanhToanHopLe: true } },
  { value: 'da-huy', label: 'Đã hủy', query: { trangThaiXuLy: TRANG_THAI_XU_LY.DA_HUY } },
];
export const HANH_DONG_TIEP_THEO = {
  [TRANG_THAI_XU_LY.CHO_XAC_NHAN]: { nhan: 'Xác nhận đơn', dich: TRANG_THAI_XU_LY.DA_XAC_NHAN },
  [TRANG_THAI_XU_LY.DA_XAC_NHAN]: { nhan: 'Bắt đầu xử lý', dich: TRANG_THAI_XU_LY.DANG_XU_LY },
  [TRANG_THAI_XU_LY.DANG_XU_LY]: { nhan: 'Chuyển sang vận chuyển', dich: TRANG_THAI_XU_LY.DANG_VAN_CHUYEN },
  [TRANG_THAI_XU_LY.DANG_VAN_CHUYEN]: { nhan: 'Hoàn thành đơn', dich: TRANG_THAI_XU_LY.HOAN_THANH },
};
export const CAC_BUOC_XU_LY_DON_HANG = [
  TRANG_THAI_XU_LY.CHO_XAC_NHAN, TRANG_THAI_XU_LY.DA_XAC_NHAN,
  TRANG_THAI_XU_LY.DANG_XU_LY, TRANG_THAI_XU_LY.DANG_VAN_CHUYEN,
  TRANG_THAI_XU_LY.HOAN_THANH,
];
export const CHU_KY_BANNER_MS = 5000;

export const MENU_TAI_KHOAN = (daLaNguoiBan = false) => [
  { nhan: 'Hồ sơ', duongDan: DUONG_DAN.TAI_KHOAN },
  { nhan: 'Đơn hàng', duongDan: DUONG_DAN.DON_HANG },
  { nhan: 'Đổi trả và khiếu nại', duongDan: DUONG_DAN.DOI_TRA_KHIEU_NAI },
  { nhan: 'Trao đổi', duongDan: DUONG_DAN.TRO_CHUYEN },
  daLaNguoiBan
    ? { nhan: 'Kênh người bán', duongDan: DUONG_DAN.NGUOI_BAN.TONG_QUAN }
    : { nhan: 'Đăng ký bán hàng', duongDan: DUONG_DAN.DANG_KY_NGUOI_BAN },
];

export const MAU_TRANG_THAI = {
  [TRANG_THAI_TAI_KHOAN.HOAT_DONG]: 'success',
  [TRANG_THAI_TAI_KHOAN.BI_KHOA]: 'danger',
  [TRANG_THAI_YEU_CAU_NGUOI_BAN.CHO_PHE_DUYET]: 'warning',
  [TRANG_THAI_YEU_CAU_NGUOI_BAN.DA_PHE_DUYET]: 'success',
  [TRANG_THAI_YEU_CAU_NGUOI_BAN.DA_TU_CHOI]: 'danger',
  [TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH]: 'success',
  [TRANG_THAI_KINH_DOANH.NGUNG_KINH_DOANH]: 'neutral',
  [TRANG_THAI_KHUYEN_MAI.CHUA_BAT_DAU]: 'info',
  [TRANG_THAI_KHUYEN_MAI.DANG_HOAT_DONG]: 'success',
  [TRANG_THAI_KHUYEN_MAI.DA_KET_THUC]: 'neutral',
  [TRANG_THAI_VOUCHER.KICH_HOAT]: 'success',
  [TRANG_THAI_VOUCHER.VO_HIEU_HOA]: 'neutral',
  [TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN]: 'warning',
  [TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN]: 'success',
  [TRANG_THAI_THANH_TOAN_DON.THAT_BAI]: 'danger',
  [TRANG_THAI_THANH_TOAN_DON.HET_HAN]: 'danger',
  [TRANG_THAI_XU_LY.CHO_XAC_NHAN]: 'warning',
  [TRANG_THAI_XU_LY.DA_XAC_NHAN]: 'info',
  [TRANG_THAI_XU_LY.DANG_XU_LY]: 'info',
  [TRANG_THAI_XU_LY.DANG_VAN_CHUYEN]: 'info',
  [TRANG_THAI_XU_LY.HOAN_THANH]: 'success',
  [TRANG_THAI_XU_LY.DA_HUY]: 'danger',
  [TRANG_THAI_GIAO_DICH.THANH_CONG]: 'success',
  [TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN]: 'warning',
  [TRANG_THAI_GIAO_DICH.THAT_BAI]: 'danger',
  [TRANG_THAI_GIAO_DICH.HET_HAN]: 'danger',
  [TRANG_THAI_BANNER.KICH_HOAT]: 'success',
  [TRANG_THAI_BANNER.VO_HIEU_HOA]: 'neutral',
  [TRANG_THAI_XU_LY_YEU_CAU.CHO_XU_LY]: 'warning',
  [TRANG_THAI_XU_LY_YEU_CAU.DA_XU_LY]: 'success',
  [KET_QUA_XU_LY.CHAP_NHAN]: 'success',
  [KET_QUA_XU_LY.TU_CHOI]: 'danger',
  [TRANG_THAI_HOAT_DONG_CUA_HANG.NGUNG_HOAT_DONG]: 'neutral',
};

export const MENU_NGUOI_BAN = [
  { nhan: 'Tổng quan', duongDan: DUONG_DAN.NGUOI_BAN.TONG_QUAN, bieuTuong: 'dashboard' },
  { nhan: 'Cửa hàng', duongDan: DUONG_DAN.NGUOI_BAN.CUA_HANG, bieuTuong: 'store' },
  { nhan: 'Sản phẩm', duongDan: DUONG_DAN.NGUOI_BAN.SAN_PHAM, bieuTuong: 'package' },
  { nhan: 'Khuyến mãi', duongDan: DUONG_DAN.NGUOI_BAN.KHUYEN_MAI, bieuTuong: 'tag' },
  { nhan: 'Voucher', duongDan: DUONG_DAN.NGUOI_BAN.VOUCHER, bieuTuong: 'ticket' },
  { nhan: 'Đơn hàng', duongDan: DUONG_DAN.NGUOI_BAN.DON_HANG, bieuTuong: 'cart' },
  { nhan: 'Đổi trả và khiếu nại', duongDan: DUONG_DAN.NGUOI_BAN.DOI_TRA_KHIEU_NAI, bieuTuong: 'alert' },
  { nhan: 'Đánh giá', duongDan: DUONG_DAN.NGUOI_BAN.DANH_GIA, bieuTuong: 'star' },
  { nhan: 'Trao đổi', duongDan: DUONG_DAN.NGUOI_BAN.TRO_CHUYEN, bieuTuong: 'chat' },
  { nhan: 'Báo cáo', duongDan: DUONG_DAN.NGUOI_BAN.BAO_CAO, bieuTuong: 'chart' },
];

export const MENU_QUAN_TRI_VIEN = [
  { nhan: 'Tổng quan', duongDan: DUONG_DAN.QUAN_TRI_VIEN.TONG_QUAN, bieuTuong: 'dashboard' },
  { nhan: 'Tài khoản', duongDan: DUONG_DAN.QUAN_TRI_VIEN.TAI_KHOAN, bieuTuong: 'user' },
  { nhan: 'Cửa hàng', duongDan: DUONG_DAN.QUAN_TRI_VIEN.CUA_HANG, bieuTuong: 'store' },
  { nhan: 'Duyệt người bán', duongDan: DUONG_DAN.QUAN_TRI_VIEN.DUYET_NGUOI_BAN, bieuTuong: 'check' },
  { nhan: 'Danh mục', duongDan: DUONG_DAN.QUAN_TRI_VIEN.DANH_MUC, bieuTuong: 'tag' },
  { nhan: 'Sản phẩm', duongDan: DUONG_DAN.QUAN_TRI_VIEN.SAN_PHAM, bieuTuong: 'package' },
  { nhan: 'Giao dịch', duongDan: DUONG_DAN.QUAN_TRI_VIEN.GIAO_DICH, bieuTuong: 'cart' },
  { nhan: 'Banner', duongDan: DUONG_DAN.QUAN_TRI_VIEN.BANNER, bieuTuong: 'image' },
  { nhan: 'Khuyến mãi', duongDan: DUONG_DAN.QUAN_TRI_VIEN.KHUYEN_MAI, bieuTuong: 'tag' },
  { nhan: 'Voucher', duongDan: DUONG_DAN.QUAN_TRI_VIEN.VOUCHER, bieuTuong: 'ticket' },
  { nhan: 'Báo cáo', duongDan: DUONG_DAN.QUAN_TRI_VIEN.BAO_CAO, bieuTuong: 'chart' },
];
