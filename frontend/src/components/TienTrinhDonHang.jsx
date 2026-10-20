import { CAC_BUOC_XU_LY_DON_HANG, TRANG_THAI_THANH_TOAN_DON, TRANG_THAI_XU_LY } from '../utils/hangSo.js';

export default function TienTrinhDonHang({ trangThaiXuLy, trangThaiThanhToan }) {
  if (trangThaiXuLy === TRANG_THAI_XU_LY.DA_HUY) {
    const lyDo = trangThaiThanhToan === TRANG_THAI_THANH_TOAN_DON.THAT_BAI
      ? 'do thanh toán không thành công'
      : trangThaiThanhToan === TRANG_THAI_THANH_TOAN_DON.HET_HAN ? 'do quá thời hạn thanh toán' : '';
    return <section className="donHangDaHuy" role="status"><strong>Đơn hàng đã bị hủy</strong>{lyDo && <p>Đơn hàng đã bị hủy {lyDo}.</p>}</section>;
  }
  const viTri = CAC_BUOC_XU_LY_DON_HANG.indexOf(trangThaiXuLy);
  return <ol className="tienTrinhDonHang" aria-label="Tiến trình xử lý đơn hàng">{CAC_BUOC_XU_LY_DON_HANG.map((buoc, index) => <li key={buoc}
    className={index < viTri ? 'daQua' : index === viTri ? 'hienTai' : ''}
    aria-current={index === viTri ? 'step' : undefined}><span aria-hidden="true">{index < viTri ? '✓' : index + 1}</span>{buoc}</li>)}</ol>;
}
