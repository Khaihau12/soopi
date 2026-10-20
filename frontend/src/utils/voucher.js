import { dinhDangTien } from './dinhDang.js';
import { KIEU_GIAM, LOAI_VOUCHER, TRANG_THAI_VOUCHER } from './hangSo.js';

export const moTaVoucher = (voucher) => {
  if (!voucher) return '';
  const mucGiam = voucher.kieuGiam === KIEU_GIAM.PHAN_TRAM ? `${voucher.giaTriGiam}%` : dinhDangTien(voucher.giaTriGiam);
  const gioiHan = voucher.giamToiDa ? ` (tối đa ${dinhDangTien(voucher.giamToiDa)})` : '';
  const donToiThieu = voucher.giaTriDonToiThieu ? ` cho đơn từ ${dinhDangTien(voucher.giaTriDonToiThieu)}` : '';
  return `${voucher.loaiVoucher === LOAI_VOUCHER.FREESHIP ? 'Giảm phí vận chuyển' : 'Giảm'} ${mucGiam}${gioiHan}${donToiThieu}`;
};

export const tinhTinhTrangVoucher = (voucher, thoiDiem = new Date()) => {
  if (voucher.trangThai === TRANG_THAI_VOUCHER.VO_HIEU_HOA) return 'Vô hiệu hóa';
  if (thoiDiem < new Date(voucher.ngayBatDau)) return 'Chưa bắt đầu';
  if (thoiDiem > new Date(voucher.ngayKetThuc)) return 'Đã hết hạn';
  if (voucher.soLuong < 1) return 'Hết số lượng';
  return 'Đang hiệu lực';
};
