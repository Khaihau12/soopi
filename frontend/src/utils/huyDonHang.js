import { dinhDangTien } from './dinhDang.js';

export function noiDungXacNhanHuyDon(donHang) {
  if (donHang.kieuHuy === 'huyGiaoDichChuaThanhToan') {
    const soDon = donHang.soDonSeBiHuy || 1;
    return soDon > 1
      ? `Hủy giao dịch chưa thanh toán? Hệ thống sẽ hủy ${soDon} đơn thuộc giao dịch này, hoàn lại số lượng hàng và voucher đã dùng.`
      : 'Hủy đơn chưa thanh toán? Hệ thống sẽ hoàn lại số lượng hàng và voucher đã dùng.';
  }
  if (donHang.kieuHuy === 'huyDonDaThanhToan') {
    const thongBaoTien = donHang.tongThanhToan > 0
      ? ` Khoản tiền ${dinhDangTien(donHang.tongThanhToan)} chưa được hoàn tự động — Quản trị viên sẽ hoàn thủ công.` : '';
    return `Đơn này đã thanh toán. Hủy đơn sẽ hoàn lại số lượng hàng.${thongBaoTien} Voucher đã dùng không được hoàn lại.`;
  }
  return 'Hủy đơn thanh toán khi nhận hàng? Số lượng hàng sẽ được hoàn lại. Voucher đã dùng không được hoàn lại.';
}

export function lyDoDonDaHuy(donHang) {
  if (donHang.trangThaiThanhToan === 'Hết hạn') return 'Quá thời hạn thanh toán.';
  if (donHang.trangThaiThanhToan === 'Thất bại' && donHang.phuongThucThanhToan === 'VNPay') {
    return 'Thanh toán không thành công hoặc bạn đã hủy giao dịch.';
  }
  return 'Bạn đã hủy đơn.';
}
