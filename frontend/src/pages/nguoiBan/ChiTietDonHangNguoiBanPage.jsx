import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import NutChuyenTrangThaiDon from '../../components/NutChuyenTrangThaiDon.jsx';
import TienTrinhDonHang from '../../components/TienTrinhDonHang.jsx';
import TrangThaiBadge from '../../components/TrangThaiBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { nguoiBanLayChiTietDonHang } from '../../services/donHang.api.js';
import { dinhDangNgayGio, dinhDangTien, maDonHangHienThi, taoUrlAnh } from '../../utils/dinhDang.js';
import { DUONG_DAN, TRANG_THAI_XU_LY } from '../../utils/hangSo.js';
import '../DonHangPage.css';
import './DonHangNguoiBanPage.css';

export default function ChiTietDonHangNguoiBanPage() {
  const { id } = useParams();
  const [donHang, setDonHang] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [maLoi, setMaLoi] = useState(0);
  const [lanTai, setLanTai] = useState(0);
  const taiLai = () => setLanTai((lan) => lan + 1);
  useEffect(() => {
    let daHuy = false;
    setDangTai(true); setLoi('');
    nguoiBanLayChiTietDonHang(id).then((data) => {
      if (!daHuy) setDonHang(data.donHang);
    }).catch((loiApi) => {
      if (!daHuy) { setDonHang(null); setLoi(loiApi.message); setMaLoi(loiApi.status); }
    }).finally(() => { if (!daHuy) setDangTai(false); });
    return () => { daHuy = true; };
  }, [id, lanTai]);

  if (dangTai) return <div className="donHangPage"><Skeleton variant="block" count={4} /></div>;
  if (loi || !donHang) return <div className="donHangPage"><ErrorState message={loi || 'Không tải được đơn hàng'} taiLai={maLoi === 404 ? undefined : taiLai} />
    <Button to={DUONG_DAN.NGUOI_BAN.DON_HANG} variant="secondary">Về danh sách đơn hàng</Button></div>;

  const lyDo = donHang.trangThaiXuLy === TRANG_THAI_XU_LY.DA_HUY ? 'Đơn đã hủy'
    : donHang.trangThaiXuLy === TRANG_THAI_XU_LY.HOAN_THANH ? 'Đơn đã hoàn thành' : 'Đơn chưa thanh toán, vui lòng chờ khách thanh toán';
  return <div className="donHangPage donHangChiTietPage donHangBanPage">
    <Link to={DUONG_DAN.NGUOI_BAN.DON_HANG} className="donHangQuayLai">Về danh sách đơn hàng</Link>
    <header className="donHangChiTietDau"><div><h1>Đơn {maDonHangHienThi(donHang._id)}</h1><p>Đặt ngày {dinhDangNgayGio(donHang.ngayTao)}</p></div>
      <div className="donHangChiTietBadge"><TrangThaiBadge trangThai={donHang.trangThaiXuLy} /><TrangThaiBadge trangThai={donHang.trangThaiThanhToan} /></div></header>
    <TienTrinhDonHang trangThaiXuLy={donHang.trangThaiXuLy} trangThaiThanhToan={donHang.trangThaiThanhToan} />
    <section className="donHangBanHanhDong" aria-label="Xử lý đơn hàng">
      {donHang.coTheCapNhat ? <NutChuyenTrangThaiDon donHang={donHang} onDaCapNhat={setDonHang} onTaiLai={taiLai} /> : <p>{lyDo}</p>}
      {donHang.phuongThucThanhToan === 'COD' && <p>COD — thu tiền khi giao: <strong>{dinhDangTien(donHang.tongThanhToan)}</strong></p>}
    </section>
    <div className="donHangChiTietLuoi"><div className="donHangChiTietChinh">
      <section className="donHangKhung"><h2>Người mua</h2><dl className="donHangThongTin">
        <div><dt>Họ tên</dt><dd>{donHang.nguoiMua.hoTen}</dd></div>
        <div><dt>Số điện thoại</dt><dd>{donHang.nguoiMua.soDienThoai || 'Chưa có'}</dd></div>
        <div><dt>Địa chỉ nhận hàng</dt><dd>{donHang.diaChiNhanHang}</dd></div>
      </dl></section>
      <section className="donHangKhung"><h2>Sản phẩm</h2><div className="donHangChiTietSanPham">{donHang.danhSachChiTiet.map((dong) => {
        const anh = taoUrlAnh(dong.sanPham.hinhAnh?.[0]);
        return <article key={dong._id} className="donHangChiTietDong">
          {anh ? <img src={anh} alt={dong.sanPham.tenSanPham} /> : <div className="donHangAnhTrong"><Icon name="package" title="Chưa có ảnh sản phẩm" /></div>}
          <div className="donHangChiTietMoTa"><strong>{dong.sanPham.tenSanPham}</strong><span>× {dong.soLuong}</span>
            <div className="donHangGiaDong">{dong.giaGocTaiThoiDiemDat > dong.giaBanThucTe && <del>{dinhDangTien(dong.giaGocTaiThoiDiemDat)}</del>}
              <span>{dinhDangTien(dong.giaBanThucTe)}</span></div>
            {dong.yeuCauDoiTra && <small>Yêu cầu {dong.yeuCauDoiTra.loaiYeuCau}: {dong.yeuCauDoiTra.ketQuaXuLy || dong.yeuCauDoiTra.trangThaiXuLy}</small>}
          </div><strong className="donHangThanhTien">{dinhDangTien(dong.thanhTien)}</strong>
        </article>;
      })}</div></section>
    </div><aside className="donHangKhung donHangTongKet"><h2>Tổng kết tiền</h2>
      <div><span>Tổng tiền hàng</span><strong>{dinhDangTien(donHang.tongTienHang)}</strong></div>
      <div><span>Giảm voucher</span><strong>−{dinhDangTien(donHang.tongGiamVoucher)}</strong></div>
      {donHang.voucherApDung.length > 0 && <ul>{donHang.voucherApDung.map((voucher, i) => <li key={i}>{voucher.maVoucher} · {voucher.loaiVoucher}: −{dinhDangTien(voucher.giaTriGiamThucTe)}</li>)}</ul>}
      <div><span>Phí vận chuyển</span><strong>{dinhDangTien(donHang.phiVanChuyen)}</strong></div>
      <div><span>Giảm phí vận chuyển</span><strong>−{dinhDangTien(donHang.giamPhiVanChuyen)}</strong></div>
      <div className="donHangTongCuoi"><span>Tổng thanh toán</span><strong>{dinhDangTien(donHang.tongThanhToan)}</strong></div>
      <div><span>Thanh toán</span><strong>{donHang.trangThaiThanhToan}</strong></div>
    </aside></div>
  </div>;
}
