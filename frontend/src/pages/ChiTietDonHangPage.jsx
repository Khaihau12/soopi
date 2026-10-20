import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TienTrinhDonHang from '../components/TienTrinhDonHang.jsx';
import DanhGiaForm from '../components/DanhGiaForm.jsx';
import DoiTraKhieuNaiForm from '../components/DoiTraKhieuNaiForm.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Icon from '../components/ui/Icon.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import useThanhToanVnpay from '../hooks/useThanhToanVnpay.js';
import useThongBao from '../hooks/useThongBao.js';
import { huyDonHang, layChiTietDonHang } from '../services/donHang.api.js';
import { dinhDangNgayGio, dinhDangTien, maDonHangHienThi, taoUrlAnh } from '../utils/dinhDang.js';
import { DUONG_DAN, MAU_TRANG_THAI, TRANG_THAI_XU_LY } from '../utils/hangSo.js';
import { lyDoDonDaHuy, noiDungXacNhanHuyDon } from '../utils/huyDonHang.js';
import './DonHangPage.css';

export default function ChiTietDonHangPage() {
  const { id } = useParams();
  const [donHang, setDonHang] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [maLoi, setMaLoi] = useState(0);
  const [lanTai, setLanTai] = useState(0);
  const [dongDanhGia, setDongDanhGia] = useState(null);
  const [dongYeuCau, setDongYeuCau] = useState(null);
  const [moXacNhanHuy, setMoXacNhanHuy] = useState(false);
  const [dangHuy, setDangHuy] = useState(false);
  const thongBao = useThongBao();
  const { thanhToan, dangChuyen, loi: loiThanhToan } = useThanhToanVnpay();

  useEffect(() => {
    let daHuy = false;
    setDangTai(true); setLoi('');
    layChiTietDonHang(id).then((data) => {
      if (!daHuy) setDonHang(data.donHang);
    }).catch((loiApi) => {
      if (!daHuy) { setDonHang(null); setLoi(loiApi.status === 404 ? 'Không tìm thấy đơn hàng' : loiApi.message); setMaLoi(loiApi.status); }
    }).finally(() => { if (!daHuy) setDangTai(false); });
    return () => { daHuy = true; };
  }, [id, lanTai]);

  const xacNhanHuy = async () => {
    if (!donHang || dangHuy) return;
    setDangHuy(true);
    try {
      const data = await huyDonHang(id);
      thongBao.thanhCong(data.ketQua.thongBao);
      setMoXacNhanHuy(false);
      setLanTai((lan) => lan + 1);
    } catch (loiApi) {
      thongBao.loi(loiApi.message);
      if (loiApi.status === 409) { setMoXacNhanHuy(false); setLanTai((lan) => lan + 1); }
    } finally { setDangHuy(false); }
  };

  if (dangTai) return <div className="donHangPage"><Skeleton variant="block" count={4} /></div>;
  if (loi || !donHang) return <div className="donHangPage"><ErrorState message={loi || 'Không tải được đơn hàng'} taiLai={maLoi === 404 ? undefined : () => setLanTai((lan) => lan + 1)} /><Button to={DUONG_DAN.DON_HANG} variant="secondary">Về danh sách đơn hàng</Button></div>;

  const daHoanThanh = donHang.trangThaiXuLy === TRANG_THAI_XU_LY.HOAN_THANH;
  const conNgay = donHang.hanGuiYeuCau ? Math.max(0, Math.ceil((new Date(donHang.hanGuiYeuCau).getTime() - Date.now()) / 86400000)) : 0;
  const laVnpay = donHang.phuongThucThanhToan === 'VNPay';

  return <div className="donHangPage donHangChiTietPage">
    <Link to={DUONG_DAN.DON_HANG} className="donHangQuayLai">Về danh sách đơn hàng</Link>
    <header className="donHangChiTietDau"><div><h1>Đơn {maDonHangHienThi(donHang._id)}</h1><p>Đặt ngày {dinhDangNgayGio(donHang.ngayTao)}</p></div>
      <div className="donHangChiTietBadge"><Badge variant={MAU_TRANG_THAI[donHang.trangThaiXuLy] || 'neutral'}>{donHang.trangThaiXuLy}</Badge>
        <Badge variant={MAU_TRANG_THAI[donHang.trangThaiThanhToan] || 'neutral'}>{donHang.trangThaiThanhToan}</Badge></div></header>
    <TienTrinhDonHang trangThaiXuLy={donHang.trangThaiXuLy} trangThaiThanhToan={donHang.trangThaiThanhToan} />
    {donHang.coTheHuy && <Button variant="secondary" className="donHangNutHuy donHangNutHuyChiTiet" disabled={dangHuy} onClick={() => setMoXacNhanHuy(true)}>Hủy đơn</Button>}
    {donHang.trangThaiXuLy === TRANG_THAI_XU_LY.DA_HUY && <section className="donHangDaHuy" aria-label="Thông tin hủy đơn"><strong>{lyDoDonDaHuy(donHang)}</strong>
      {donHang.canHoanTienThuCong && <p>Đơn đã hủy sau khi thanh toán. Khoản {dinhDangTien(donHang.tongThanhToan)} đang chờ hoàn tiền thủ công.</p>}</section>}
    {donHang.coTheThanhToanLai && <section className="donHangCanThanhToan" aria-label="Thanh toán đơn hàng"><div><strong>Đơn hàng đang chờ thanh toán</strong>
      <p>Vui lòng thanh toán trước {dinhDangNgayGio(donHang.hanThanhToan)}.</p></div>
      <Button disabled={dangChuyen} onClick={() => thanhToan(donHang.giaoDich._id)}>Thanh toán ngay</Button></section>}
    {loiThanhToan && <p className="donHangLoiThanhToan" role="alert">{loiThanhToan}</p>}
    {dangChuyen && <div className="donHangLopPhu" role="status" aria-live="polite">Đang chuyển tới VNPay…</div>}
    <div className="donHangChiTietLuoi"><div className="donHangChiTietChinh">
      <section className="donHangKhung"><h2>Sản phẩm</h2><div className="donHangChiTietSanPham">
        {donHang.danhSachChiTiet.map((dong) => {
          const anh = taoUrlAnh(dong.sanPham.hinhAnh?.[0]);
          const ten = dong.sanPham.tenSanPham;
          const conSanPham = ten !== 'Sản phẩm không còn hiển thị';
          return <article key={dong._id} className="donHangChiTietDong">
            {anh ? <img src={anh} alt={ten} /> : <div className="donHangAnhTrong"><Icon name="package" title="Chưa có ảnh sản phẩm" /></div>}
            <div className="donHangChiTietMoTa">{conSanPham ? <Link to={DUONG_DAN.chiTietSanPham(dong.sanPham._id)}>{ten}</Link> : <strong>{ten}</strong>}
              <span>× {dong.soLuong}</span><div className="donHangGiaDong">
                {dong.giaGocTaiThoiDiemDat > dong.giaBanThucTe && <del>{dinhDangTien(dong.giaGocTaiThoiDiemDat)}</del>}
                <span>{dinhDangTien(dong.giaBanThucTe)}</span></div>
              {dong.daDanhGia && <small>Đã đánh giá</small>}
              {dong.coTheDanhGia && <Button size="sm" variant="secondary" className="donHangNutDanhGia" onClick={() => setDongDanhGia(dong)}>Đánh giá</Button>}
              {dong.yeuCauDoiTra && <Link to={DUONG_DAN.DOI_TRA_KHIEU_NAI}><Badge variant={MAU_TRANG_THAI[dong.yeuCauDoiTra.ketQuaXuLy] || MAU_TRANG_THAI[dong.yeuCauDoiTra.trangThaiXuLy] || 'neutral'}>{dong.yeuCauDoiTra.loaiYeuCau} · {dong.yeuCauDoiTra.ketQuaXuLy || dong.yeuCauDoiTra.trangThaiXuLy}</Badge></Link>}
              {dong.coTheGuiYeuCau && <Button size="sm" variant="secondary" className="donHangNutDanhGia" onClick={() => setDongYeuCau(dong)}>Đổi trả / khiếu nại</Button>}
              {!daHoanThanh && <small>Chỉ gửi được sau khi đơn hoàn thành</small>}
              {daHoanThanh && !dong.coTheGuiYeuCau && !dong.yeuCauDoiTra && <small>Đã quá thời hạn gửi yêu cầu</small>}
            </div><strong className="donHangThanhTien">{dinhDangTien(dong.thanhTien)}</strong>
          </article>;
        })}</div></section>
      <section className="donHangKhung"><h2>Thông tin đơn hàng</h2>
        {donHang.cuaHang?._id && <Button variant="secondary" size="sm" to={`${DUONG_DAN.TRO_CHUYEN}?cuaHangId=${donHang.cuaHang._id}`}
          state={{ tenCuaHang: donHang.cuaHang.tenCuaHang }}>Nhắn tin cho cửa hàng</Button>}
        <dl className="donHangThongTin"><div><dt>Cửa hàng</dt><dd>{donHang.cuaHang?.tenCuaHang || 'Cửa hàng không còn hiển thị'}</dd></div>
          <div><dt>Địa chỉ nhận hàng</dt><dd>{donHang.diaChiNhanHang}</dd></div>
          <div><dt>Phương thức thanh toán</dt><dd>{laVnpay ? 'VNPay' : `Thanh toán khi nhận hàng: ${dinhDangTien(donHang.tongThanhToan)}`}</dd></div>
          {laVnpay && <div><dt>Mã giao dịch</dt><dd>{donHang.giaoDich?.maGiaoDich || 'Chưa có'}</dd></div>}
          <div><dt>Trạng thái thanh toán</dt><dd>{donHang.trangThaiThanhToan}</dd></div>
          {daHoanThanh && <div><dt>Đổi trả / khiếu nại</dt><dd>{conNgay > 0 ? `Còn ${conNgay} ngày để gửi yêu cầu đổi trả/khiếu nại` : 'Đã quá hạn gửi yêu cầu đổi trả/khiếu nại'}</dd></div>}
        </dl></section>
    </div><aside className="donHangKhung donHangTongKet"><h2>Tổng kết tiền</h2>
      <div><span>Tổng tiền hàng</span><strong>{dinhDangTien(donHang.tongTienHang)}</strong></div>
      <div><span>Giảm voucher</span><strong>−{dinhDangTien(donHang.tongGiamVoucher)}</strong></div>
      {donHang.voucherApDung.length > 0 && <ul>{donHang.voucherApDung.map((voucher, i) => <li key={i}>{voucher.maVoucher} · {voucher.loaiVoucher}: −{dinhDangTien(voucher.giaTriGiamThucTe)}</li>)}</ul>}
      <div><span>Phí vận chuyển</span><strong>{dinhDangTien(donHang.phiVanChuyen)}</strong></div>
      <div><span>Giảm phí vận chuyển</span><strong>−{dinhDangTien(donHang.giamPhiVanChuyen)}</strong></div>
      <div className="donHangTongCuoi"><span>Tổng thanh toán</span><strong>{dinhDangTien(donHang.tongThanhToan)}</strong></div>
    </aside></div>
    <DanhGiaForm open={Boolean(dongDanhGia)} onClose={() => setDongDanhGia(null)} chiTietDonHangId={dongDanhGia?._id}
      onThanhCong={() => setLanTai((lan) => lan + 1)} />
    <DoiTraKhieuNaiForm open={Boolean(dongYeuCau)} onClose={() => setDongYeuCau(null)} dong={dongYeuCau} hanGuiYeuCau={donHang.hanGuiYeuCau}
      onThanhCong={() => setLanTai((lan) => lan + 1)} />
    <ConfirmDialog open={moXacNhanHuy} onClose={() => setMoXacNhanHuy(false)} onConfirm={xacNhanHuy}
      title="Xác nhận hủy đơn" message={noiDungXacNhanHuyDon(donHang)}
      confirmLabel="Hủy đơn" cancelLabel="Giữ đơn" danger loading={dangHuy} />
  </div>;
}
