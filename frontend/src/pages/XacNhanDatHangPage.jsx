import { Link, useLocation } from 'react-router-dom';
import { DUONG_DAN } from '../utils/hangSo.js';
import { dinhDangTien } from '../utils/dinhDang.js';

export default function XacNhanDatHangPage() {
  const ketQua = useLocation().state?.ketQuaDatHang;
  return <main className="thanhToanPage">
    <h1>Đơn hàng</h1>
    {ketQua ? <section className="thanhToanCard" role="status">
      <h2>Đặt hàng thành công</h2>
      <p>Đã tạo {ketQua.danhSachDonHang.length} đơn hàng. {ketQua.phuongThucThanhToan === 'COD' ? 'Thanh toán khi nhận hàng.' : 'Đơn 0đ đã được xác nhận thanh toán.'}</p>
      {ketQua.danhSachDonHang.map((don) => <p key={don._id}>{don.cuaHang.tenCuaHang}: {dinhDangTien(don.tongThanhToan)} — {don.trangThaiThanhToan}</p>)}
    </section> : <p>Trang lịch sử đơn hàng sẽ được bổ sung ở bước tiếp theo.</p>}
    <Link to={DUONG_DAN.TRANG_CHU}>Tiếp tục mua sắm</Link>
  </main>;
}
