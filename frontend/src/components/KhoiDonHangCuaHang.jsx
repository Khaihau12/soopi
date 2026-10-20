import { dinhDangTien, taoUrlAnh } from '../utils/dinhDang.js';
import ChonVoucher from './ChonVoucher.jsx';

export default function KhoiDonHangCuaHang({ donHang, duLieu, maDaChon, onThayDoi, dangTai }) {
  return <section className="thanhToanCard"><h2>{donHang.cuaHang.tenCuaHang}</h2>
    <div className="thanhToanDongSanPham">{donHang.danhSachSanPham.map((dong) => <div className="thanhToanSanPham" key={dong.chiTietGioHangId}>
      {taoUrlAnh(dong.sanPham.hinhAnh?.[0]) ? <img src={taoUrlAnh(dong.sanPham.hinhAnh[0])} alt="" /> : <div className="thanhToanAnhTrong">Chưa có ảnh</div>}
      <div><strong>{dong.sanPham.tenSanPham}</strong><small>Số lượng: {dong.soLuong} · Giá bán: {dinhDangTien(dong.giaBanThucTe)}</small>{dong.giaGoc !== dong.giaBanThucTe && <small>Giá gốc: <s>{dinhDangTien(dong.giaGoc)}</s></small>}</div>
      <b>{dinhDangTien(dong.thanhTien)}</b>
    </div>)}</div>
    <ChonVoucher loai="Cửa hàng" cuaHang={donHang.cuaHang} duLieu={duLieu} maDaChon={maDaChon} onThayDoi={onThayDoi} dangTai={dangTai} />
    <div className="thanhToanDongTien"><span>Tiền hàng</span><span>{dinhDangTien(donHang.tongTienHang)}</span></div>
    <div className="thanhToanDongTien"><span>Phí vận chuyển</span><span>{dinhDangTien(donHang.phiVanChuyen)}</span></div>
    {donHang.tongGiamVoucher > 0 && <div className="thanhToanDongTien"><span>Giảm voucher</span><span>−{dinhDangTien(donHang.tongGiamVoucher)}</span></div>}
    {donHang.giamPhiVanChuyen > 0 && <div className="thanhToanDongTien"><span>Giảm phí vận chuyển</span><span>−{dinhDangTien(donHang.giamPhiVanChuyen)}</span></div>}
    <div className="thanhToanDongTien thanhToanTongDon"><strong>Tổng của đơn</strong><strong>{dinhDangTien(donHang.tongThanhToan)}</strong></div>
    {donHang.tuDongDaThanhToan && <p className="thanhToanGhiChu">Đơn 0đ — không cần thanh toán.</p>}
  </section>;
}
