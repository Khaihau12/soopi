import { useState } from 'react';
import Modal from './ui/Modal.jsx';
import { dinhDangTien } from '../utils/dinhDang.js';
import { LOAI_VOUCHER } from '../utils/hangSo.js';
import { moTaVoucher } from '../utils/voucher.js';
import './ChonVoucher.css';

export default function ChonVoucher({ loai, cuaHang, duLieu, maDaChon, onThayDoi, dangTai }) {
  const [mo, setMo] = useState(false);
  const [chiTiet, setChiTiet] = useState(null);
  const [maNhap, setMaNhap] = useState('');
  const [loiNhap, setLoiNhap] = useState('');
  const [banNhap, setBanNhap] = useState({});
  const laCuaHang = loai === LOAI_VOUCHER.CUA_HANG;
  const voucher = duLieu.voucherGoiY.filter((item) => laCuaHang
    ? item.loaiVoucher === LOAI_VOUCHER.CUA_HANG && String(item.cuaHangId) === String(cuaHang._id)
    : item.loaiVoucher === LOAI_VOUCHER.TOAN_SAN || item.loaiVoucher === LOAI_VOUCHER.FREESHIP);
  const maThuocPhamVi = new Set(voucher.map((item) => item.maVoucher));
  const daChon = voucher.filter((item) => maDaChon.includes(item.maVoucher));
  const apDung = duLieu.voucherApDung.filter((item) => daChon.some((chon) => chon.maVoucher === item.maVoucher));

  const batDauChon = () => {
    setBanNhap(Object.fromEntries(daChon.map((item) => [item.loaiVoucher, item.maVoucher])));
    setMaNhap(''); setLoiNhap(''); setChiTiet(null); setMo(true);
  };
  const chon = (item) => setBanNhap((hienTai) => ({ ...hienTai,
    [item.loaiVoucher]: hienTai[item.loaiVoucher] === item.maVoucher ? null : item.maVoucher }));
  const nhapMa = (event) => {
    event.preventDefault();
    const ma = maNhap.trim().toUpperCase();
    const item = voucher.find((goiY) => goiY.maVoucher === ma);
    if (!item) { setLoiNhap('Mã không áp dụng cho cửa hàng hoặc giỏ hàng này.'); return; }
    if (!item.dapUngDieuKien) { setLoiNhap(item.lyDo || 'Mã chưa đủ điều kiện áp dụng.'); return; }
    setLoiNhap(''); setMaNhap(''); chon(item);
  };
  const xacNhan = () => {
    const giuLai = maDaChon.filter((ma) => !maThuocPhamVi.has(ma));
    const maMoi = Object.values(banNhap).filter(Boolean);
    onThayDoi([...giuLai, ...maMoi]);
    setMo(false);
  };

  const hienDanhSach = (danhSach, tieuDe) => <section className="chonVoucherNhom" key={tieuDe}>
    <h3>{tieuDe}</h3>
    {danhSach.length === 0 ? <p className="chonVoucherTrong">Chưa có voucher phù hợp với giỏ hàng.</p> : danhSach.map((item) => <div className={`chonVoucherThe${item.dapUngDieuKien ? '' : ' chonVoucherKhongDu'}`} key={item.maVoucher}>
      <button type="button" className="chonVoucherLuaChon" disabled={!item.dapUngDieuKien} aria-pressed={banNhap[item.loaiVoucher] === item.maVoucher} onClick={() => chon(item)}>
        <span className="chonVoucherDau">{item.loaiVoucher === LOAI_VOUCHER.FREESHIP ? 'Freeship' : item.loaiVoucher === LOAI_VOUCHER.CUA_HANG ? 'Cửa hàng' : 'Toàn sàn'}</span>
        <span className="chonVoucherNoiDung"><strong>{item.tenVoucher}</strong><span>{moTaVoucher(item)}</span><small>{item.dapUngDieuKien ? 'Có thể áp dụng' : item.lyDo}</small></span>
        <span className="chonVoucherRadio" aria-hidden="true">{banNhap[item.loaiVoucher] === item.maVoucher ? '✓' : ''}</span>
      </button>
      <button type="button" className="chonVoucherDieuKien" onClick={() => setChiTiet(item)}>Xem điều kiện</button>
    </div>)}
  </section>;

  return <>
    <button className="chonVoucherDong" type="button" onClick={batDauChon} disabled={dangTai} aria-label={laCuaHang ? `Chọn voucher cửa hàng ${cuaHang.tenCuaHang}` : 'Chọn voucher toàn sàn và Freeship'}>
      <span><strong>{laCuaHang ? 'Voucher cửa hàng' : 'Voucher toàn sàn'}</strong><small>{daChon.length ? daChon.map((item) => item.maVoucher).join(' · ') : laCuaHang ? 'Chọn mã của cửa hàng này' : 'Chọn Freeship và mã giảm giá'}</small></span>
      <span className="chonVoucherDongPhai">{apDung.length > 0 && <b>−{dinhDangTien(apDung.reduce((tong, item) => tong + item.giaTriGiamThucTe, 0))}</b>}<span aria-hidden="true">›</span></span>
    </button>
    <Modal open={mo} onClose={() => { setMo(false); setChiTiet(null); }} title={chiTiet ? 'Điều kiện voucher' : laCuaHang ? `Voucher · ${cuaHang.tenCuaHang}` : 'Voucher toàn sàn'}>
      {chiTiet ? <div className="chonVoucherChiTiet">
        <button type="button" className="chonVoucherQuayLai" onClick={() => setChiTiet(null)}>← Quay lại danh sách</button>
        <h3>{chiTiet.tenVoucher}</h3>
        <p><strong>Mã:</strong> {chiTiet.maVoucher}</p>
        <p><strong>Ưu đãi:</strong> {moTaVoucher(chiTiet)}</p>
        <p><strong>Đơn tối thiểu:</strong> {dinhDangTien(chiTiet.giaTriDonToiThieu || 0)} {chiTiet.loaiVoucher === LOAI_VOUCHER.CUA_HANG ? 'tiền hàng của cửa hàng' : 'tiền hàng của cả giỏ'}</p>
        {chiTiet.giamToiDa != null && <p><strong>Giảm tối đa:</strong> {dinhDangTien(chiTiet.giamToiDa)}</p>}
        <p><strong>Phạm vi:</strong> {chiTiet.loaiVoucher === LOAI_VOUCHER.CUA_HANG ? cuaHang.tenCuaHang : chiTiet.loaiVoucher === LOAI_VOUCHER.FREESHIP ? 'Phí vận chuyển của các đơn trong giỏ' : 'Các đơn trong giỏ'}</p>
        {chiTiet.ngayKetThuc && <p><strong>Hạn sử dụng:</strong> {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(chiTiet.ngayKetThuc))}</p>}
        {!chiTiet.dapUngDieuKien && <p className="chonVoucherLoi" role="status">{chiTiet.lyDo}</p>}
      </div> : <>
        <form className="chonVoucherNhap" onSubmit={nhapMa}><label className="chiDocBangManHinh" htmlFor={laCuaHang ? `ma-shop-${cuaHang._id}` : 'ma-toan-san'}>Nhập mã voucher</label><input id={laCuaHang ? `ma-shop-${cuaHang._id}` : 'ma-toan-san'} value={maNhap} onChange={(event) => { setMaNhap(event.target.value); setLoiNhap(''); }} placeholder={laCuaHang ? 'Nhập mã của cửa hàng' : 'Nhập mã toàn sàn hoặc Freeship'} /><button type="submit" disabled={!maNhap.trim()}>Chọn mã</button></form>
        {loiNhap && <p className="chonVoucherLoi" role="alert">{loiNhap}</p>}
        <p className="chonVoucherHuongDan">{laCuaHang ? 'Chọn tối đa một mã cho cửa hàng này.' : 'Chọn tối đa một mã Freeship và một mã giảm giá toàn sàn.'}</p>
        {laCuaHang ? hienDanhSach(voucher, 'Voucher cửa hàng') : <>{hienDanhSach(voucher.filter((item) => item.loaiVoucher === LOAI_VOUCHER.FREESHIP), 'Ưu đãi phí vận chuyển')}{hienDanhSach(voucher.filter((item) => item.loaiVoucher === LOAI_VOUCHER.TOAN_SAN), 'Giảm giá toàn sàn')}</>}
        <div className="chonVoucherChan"><span>{Object.values(banNhap).filter(Boolean).length} mã đã chọn</span><button type="button" onClick={xacNhan}>Áp dụng</button></div>
      </>}
    </Modal>
  </>;
}
