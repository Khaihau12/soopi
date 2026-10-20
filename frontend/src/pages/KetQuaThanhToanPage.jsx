import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { layChiTietGiaoDich } from '../services/giaoDichThanhToan.api.js';
import { dinhDangTien } from '../utils/dinhDang.js';
import { DUONG_DAN, TRANG_THAI_GIAO_DICH } from '../utils/hangSo.js';
import './KetQuaThanhToanPage.css';

export default function KetQuaThanhToanPage() {
  const [thamSo] = useSearchParams();
  const giaoDichId = thamSo.get('giaoDichId');
  const coLoi = !giaoDichId && thamSo.has('loi');
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(Boolean(giaoDichId && !coLoi));
  const [loi, setLoi] = useState(false);

  const taiLai = useCallback(async () => {
    if (!giaoDichId || coLoi) return;
    setDangTai(true);
    setLoi(false);
    setDuLieu(null);
    try { setDuLieu(await layChiTietGiaoDich(giaoDichId)); }
    catch { setDuLieu(null); setLoi(true); }
    finally { setDangTai(false); }
  }, [giaoDichId, coLoi]);

  useEffect(() => { void taiLai(); }, [taiLai]);

  const trangThai = duLieu?.giaoDich?.trangThaiThanhToan;
  const thanhCong = trangThai === TRANG_THAI_GIAO_DICH.THANH_CONG;
  const thatBai = [TRANG_THAI_GIAO_DICH.THAT_BAI, TRANG_THAI_GIAO_DICH.HET_HAN].includes(trangThai);
  const dangCho = trangThai === TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN;
  const khongXacMinh = coLoi || !giaoDichId || loi || (!dangTai && duLieu && !thanhCong && !thatBai && !dangCho);

  return <main className="ketQuaThanhToanPage" aria-live="polite">
    {dangTai && !duLieu ? <section className="ketQuaThanhToanCard" role="status"><Skeleton variant="block" count={3} /></section> :
      <section className="ketQuaThanhToanCard">
        {khongXacMinh ? <>
          <div className="ketQuaThanhToanBieuTu ketQuaThanhToanLoi" aria-hidden="true">!</div>
          <h1>Không thể xác minh kết quả thanh toán</h1>
          <p>Vui lòng kiểm tra đơn hàng hoặc liên hệ quản trị viên nếu bạn đã bị trừ tiền.</p>
          <Button to={DUONG_DAN.DON_HANG}>Xem đơn hàng</Button>
        </> : thanhCong ? <>
          <div className="ketQuaThanhToanBieuTu ketQuaThanhToanThanhCong" aria-hidden="true">✓</div>
          <h1>Thanh toán thành công</h1>
          <p>Giao dịch <strong>{duLieu.giaoDich.maGiaoDich}</strong> đã được xác nhận.</p>
          <p className="ketQuaThanhToanSoTien">{dinhDangTien(duLieu.giaoDich.soTien)}</p>
          <h2>Đơn hàng của bạn</h2>
          <ul className="ketQuaThanhToanDonHang">
            {duLieu.danhSachDonHang.map((don) => <li key={don._id}>
              <span>{don.cuaHang?.tenCuaHang || 'Cửa hàng'}</span>
              <span>{dinhDangTien(don.tongThanhToan)} · {don.trangThaiThanhToan} · {don.trangThaiXuLy}</span>
            </li>)}
          </ul>
          <Button to={DUONG_DAN.DON_HANG}>Xem đơn hàng</Button>
          <Link className="ketQuaThanhToanLienKet" to={DUONG_DAN.TRANG_CHU}>Tiếp tục mua sắm</Link>
        </> : thatBai ? <>
          <div className="ketQuaThanhToanBieuTu ketQuaThanhToanLoi" aria-hidden="true">!</div>
          <h1>Thanh toán không thành công</h1>
          <p>Đơn hàng đã bị hủy và số lượng hàng đã được hoàn lại.</p>
          <p className="ketQuaThanhToanGhiChu">Nếu tài khoản ngân hàng của bạn đã bị trừ tiền, vui lòng liên hệ quản trị viên để được hoàn tiền.</p>
          <Button to={DUONG_DAN.GIO_HANG}>Về giỏ hàng</Button>
          <Link className="ketQuaThanhToanLienKet" to={DUONG_DAN.TRANG_CHU}>Tiếp tục mua sắm</Link>
        </> : dangCho ? <>
          <div className="ketQuaThanhToanBieuTu ketQuaThanhToanCho" aria-hidden="true">…</div>
          <h1>Giao dịch đang chờ xử lý</h1>
          <p>Kết quả thanh toán chưa được xác nhận. Bạn có thể kiểm tra lại trạng thái giao dịch.</p>
          <Button onClick={taiLai} loading={dangTai}>Kiểm tra lại</Button>
          <Link className="ketQuaThanhToanLienKet" to={DUONG_DAN.DON_HANG}>Xem đơn hàng</Link>
        </> : null}
      </section>}
  </main>;
}
