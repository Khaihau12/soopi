import { dinhDangTien } from '../utils/dinhDang.js';

export default function TongKetThanhToan({ tongKet, canhBao, dangTai, dangGui, khongTheDat, onDatHang, phuongThucThanhToan }) {
  return <aside className="thanhToanCard thanhToanTongKet" aria-busy={dangTai} aria-label="Tổng kết thanh toán">
    <h2>Tổng kết</h2>
    <div className="thanhToanChiTietTong">
      <div><span>Tổng tiền hàng</span><span>{dinhDangTien(tongKet.tongTienHang)}</span></div>
      <div><span>Giảm voucher</span><span>−{dinhDangTien(tongKet.tongGiamVoucher)}</span></div>
      <div><span>Phí vận chuyển</span><span>{dinhDangTien(tongKet.phiVanChuyen)}</span></div>
      <div><span>Giảm phí vận chuyển</span><span>−{dinhDangTien(tongKet.giamPhiVanChuyen)}</span></div>
    </div>
    <div className="thanhToanGiaCuoi"><strong>Tổng thanh toán</strong><strong>{dinhDangTien(tongKet.tongThanhToan)}</strong></div>
    {dangTai && <p className="thanhToanGhiChu" role="status">Đang cập nhật số tiền…</p>}
    {canhBao.map((noiDung) => <p className="thanhToanCanhBao" role="status" key={noiDung}>{noiDung}</p>)}
    <button className="thanhToanNutDatHang" type="button" disabled={khongTheDat} aria-busy={dangGui || undefined} onClick={onDatHang}>
      {dangGui ? 'Đang đặt hàng…' : 'Đặt hàng'}
    </button>
    <p className="thanhToanGhiChu">{tongKet.tongThanhToan === 0 ? 'Đơn 0đ — không cần thanh toán.' : phuongThucThanhToan === 'COD' ? 'Bạn thanh toán khi nhận hàng.' : 'Bạn sẽ được chuyển sang VNPay để thanh toán.'}</p>
  </aside>;
}
