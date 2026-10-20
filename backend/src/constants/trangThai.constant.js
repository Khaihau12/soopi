const GIOI_TINH = Object.freeze({ NAM: 'Nam', NU: 'Nữ', KHAC: 'Khác' });
const TRANG_THAI_TAI_KHOAN = Object.freeze({ HOAT_DONG: 'Hoạt động', BI_KHOA: 'Bị khóa' });
const TRANG_THAI_YEU_CAU_NGUOI_BAN = Object.freeze({ CHO_PHE_DUYET: 'Chờ phê duyệt', DA_PHE_DUYET: 'Đã phê duyệt', DA_TU_CHOI: 'Đã từ chối' });
const TRANG_THAI_HOAT_DONG_CUA_HANG = Object.freeze({ HOAT_DONG: 'Hoạt động', NGUNG_HOAT_DONG: 'Ngừng hoạt động' });
const TRANG_THAI_KINH_DOANH = Object.freeze({ DANG_KINH_DOANH: 'Đang kinh doanh', NGUNG_KINH_DOANH: 'Ngừng kinh doanh' });
const LOAI_KHUYEN_MAI = Object.freeze({ GIAM_GIA: 'Giảm giá', FLASH_SALE: 'Flash Sale' });
const PHAM_VI_KHUYEN_MAI = Object.freeze({ CUA_HANG: 'Cửa hàng', TOAN_SAN: 'Toàn sàn' });
const TRANG_THAI_KHUYEN_MAI = Object.freeze({ CHUA_BAT_DAU: 'Chưa bắt đầu', DANG_HOAT_DONG: 'Đang hoạt động', DA_KET_THUC: 'Đã kết thúc' });
const LOAI_VOUCHER = Object.freeze({ FREESHIP: 'Freeship', TOAN_SAN: 'Toàn sàn', CUA_HANG: 'Cửa hàng' });
const KIEU_GIAM = Object.freeze({ PHAN_TRAM: 'Phần trăm', SO_TIEN_CO_DINH: 'Số tiền cố định' });
const TRANG_THAI_VOUCHER = Object.freeze({ KICH_HOAT: 'Kích hoạt', VO_HIEU_HOA: 'Vô hiệu hóa' });
const TRANG_THAI_BANNER = Object.freeze({ KICH_HOAT: 'Kích hoạt', VO_HIEU_HOA: 'Vô hiệu hóa' });
const PHUONG_THUC_THANH_TOAN = Object.freeze({ VNPAY: 'VNPay', COD: 'COD' });
const TRANG_THAI_THANH_TOAN_DON = Object.freeze({ CHO_THANH_TOAN: 'Chờ thanh toán', DA_THANH_TOAN: 'Đã thanh toán', THAT_BAI: 'Thất bại', HET_HAN: 'Hết hạn' });
const TRANG_THAI_XU_LY = Object.freeze({ CHO_XAC_NHAN: 'Chờ xác nhận', DA_XAC_NHAN: 'Đã xác nhận', DANG_XU_LY: 'Đang xử lý', DANG_VAN_CHUYEN: 'Đang vận chuyển', HOAN_THANH: 'Hoàn thành', DA_HUY: 'Đã hủy' });
const THU_TU_TRANG_THAI_XU_LY = Object.freeze([
  TRANG_THAI_XU_LY.CHO_XAC_NHAN, TRANG_THAI_XU_LY.DA_XAC_NHAN,
  TRANG_THAI_XU_LY.DANG_XU_LY, TRANG_THAI_XU_LY.DANG_VAN_CHUYEN,
  TRANG_THAI_XU_LY.HOAN_THANH,
]);
const TRANG_THAI_GIAO_DICH = Object.freeze({ CHO_THANH_TOAN: 'Chờ thanh toán', THANH_CONG: 'Thành công', THAT_BAI: 'Thất bại', HET_HAN: 'Hết hạn' });
const LOAI_YEU_CAU = Object.freeze({ DOI_TRA: 'Đổi trả', KHIEU_NAI: 'Khiếu nại' });
const TRANG_THAI_XU_LY_YEU_CAU = Object.freeze({ CHO_XU_LY: 'Chờ xử lý', DA_XU_LY: 'Đã xử lý' });
const KET_QUA_XU_LY = Object.freeze({ CHAP_NHAN: 'Chấp nhận', TU_CHOI: 'Từ chối' });

module.exports = {
  GIOI_TINH,
  TRANG_THAI_TAI_KHOAN,
  TRANG_THAI_YEU_CAU_NGUOI_BAN,
  TRANG_THAI_HOAT_DONG_CUA_HANG,
  TRANG_THAI_KINH_DOANH,
  LOAI_KHUYEN_MAI,
  PHAM_VI_KHUYEN_MAI,
  TRANG_THAI_KHUYEN_MAI,
  LOAI_VOUCHER,
  KIEU_GIAM,
  TRANG_THAI_VOUCHER,
  TRANG_THAI_BANNER,
  PHUONG_THUC_THANH_TOAN,
  TRANG_THAI_THANH_TOAN_DON,
  TRANG_THAI_XU_LY,
  THU_TU_TRANG_THAI_XU_LY,
  TRANG_THAI_GIAO_DICH,
  LOAI_YEU_CAU,
  TRANG_THAI_XU_LY_YEU_CAU,
  KET_QUA_XU_LY,
};
