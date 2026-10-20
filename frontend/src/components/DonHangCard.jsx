import Badge from './ui/Badge.jsx';
import Button from './ui/Button.jsx';
import Icon from './ui/Icon.jsx';
import { dinhDangNgayGio, dinhDangTien, maDonHangHienThi, taoUrlAnh } from '../utils/dinhDang.js';
import { DUONG_DAN, MAU_TRANG_THAI, TRANG_THAI_THANH_TOAN_DON } from '../utils/hangSo.js';
import { lyDoDonDaHuy } from '../utils/huyDonHang.js';

export default function DonHangCard({ donHang, onThanhToan, dangChuyen, onHuy, dangHuy }) {
  const trangThai = donHang.trangThaiThanhToan === TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN
    && donHang.phuongThucThanhToan === 'VNPay' ? donHang.trangThaiThanhToan : donHang.trangThaiXuLy;
  const sanPham = donHang.sanPhamDau;
  const anh = taoUrlAnh(sanPham?.hinhAnh?.[0]);
  return <article className="donHangCard">
    <div className="donHangCardDau">
      <div><strong>{donHang.cuaHang?.tenCuaHang || 'Cửa hàng'}</strong><small>{maDonHangHienThi(donHang._id)}</small></div>
      <Badge variant={MAU_TRANG_THAI[trangThai] || 'neutral'}>{trangThai}</Badge>
    </div>
    <div className="donHangCardSanPham">
      {anh ? <img src={anh} alt={sanPham?.tenSanPham || 'Sản phẩm'} /> : <div className="donHangAnhTrong"><Icon name="package" title="Chưa có ảnh sản phẩm" /></div>}
      <div><strong>{sanPham?.tenSanPham || 'Sản phẩm không còn hiển thị'}</strong>
        <span>× {sanPham?.soLuong || 0}</span>
        {donHang.soDong > 1 && <small>và {donHang.soDong - 1} sản phẩm khác</small>}
      </div>
    </div>
    <div className="donHangCardChan">
      <small>Đặt ngày {dinhDangNgayGio(donHang.ngayTao)}</small>
      <p>Tổng thanh toán <strong>{dinhDangTien(donHang.tongThanhToan)}</strong></p>
      <div className="donHangCardHanhDong">
        <Button variant="secondary" to={DUONG_DAN.chiTietDonHang(donHang._id)}>Xem chi tiết</Button>
        {donHang.coTheThanhToanLai && <Button disabled={dangChuyen} onClick={() => onThanhToan(donHang.giaoDichId)}>Thanh toán</Button>}
        {donHang.coTheHuy && <Button variant="secondary" className="donHangNutHuy" disabled={Boolean(dangHuy)} onClick={() => onHuy(donHang)}>Hủy đơn</Button>}
      </div>
      {donHang.trangThaiXuLy === 'Đã hủy' && <small className="donHangCardLyDo">{lyDoDonDaHuy(donHang)}{donHang.canHoanTienThuCong && ` Khoản ${dinhDangTien(donHang.tongThanhToan)} đang chờ hoàn tiền thủ công.`}</small>}
    </div>
  </article>;
}
