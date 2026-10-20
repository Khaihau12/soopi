import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Field from '../components/ui/Field.jsx';
import Input from '../components/ui/Input.jsx';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import { DUONG_DAN, VAI_TRO } from '../utils/hangSo.js';
import './XacThucPage.css';

export default function DangNhapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { taiKhoan, dangTai, dangNhap } = useXacThuc();
  const [duLieu, setDuLieu] = useState({ email: location.state?.email || '', matKhau: '' });
  const [loiTruong, setLoiTruong] = useState({});
  const [loiChung, setLoiChung] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [hienMatKhau, setHienMatKhau] = useState(false);

  const quayLai = location.state?.quayLai;
  const duongDanSauDangNhap = (taiKhoanHienTai) => taiKhoanHienTai.vaiTro.includes(VAI_TRO.QUAN_TRI_VIEN)
    ? DUONG_DAN.QUAN_TRI_VIEN.TONG_QUAN
    : typeof quayLai === 'string' && quayLai.startsWith('/') && !quayLai.startsWith('//') ? quayLai : DUONG_DAN.TRANG_CHU;

  if (dangTai) return <main className="xacThucTrang" role="status">Đang kiểm tra phiên đăng nhập...</main>;
  if (taiKhoan) return <Navigate to={duongDanSauDangNhap(taiKhoan)} replace />;

  const kiemTra = (ten, giaTri) => {
    if (ten === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(giaTri.trim()) ? '' : 'Vui lòng nhập email hợp lệ.';
    return giaTri ? '' : 'Vui lòng nhập mật khẩu.';
  };

  const capNhat = (ten, giaTri) => {
    setDuLieu((cu) => ({ ...cu, [ten]: giaTri }));
    if (loiTruong[ten]) setLoiTruong((cu) => ({ ...cu, [ten]: kiemTra(ten, giaTri) }));
    setLoiChung('');
  };

  const xuLyGui = async (event) => {
    event.preventDefault();
    const loi = Object.fromEntries(['email', 'matKhau'].map((ten) => [ten, kiemTra(ten, duLieu[ten])]));
    setLoiTruong(loi);
    const dauTien = Object.keys(loi).find((ten) => loi[ten]);
    if (dauTien) { document.getElementById('dang-nhap-' + dauTien)?.focus(); return; }
    setDangGui(true);
    setLoiChung('');
    try {
      const taiKhoanMoi = await dangNhap(duLieu);
      navigate(duongDanSauDangNhap(taiKhoanMoi), { replace: true });
    } catch (loi) {
      setLoiChung(loi.message);
    } finally { setDangGui(false); }
  };

  return <main className="xacThucTrang"><div className="xacThucThe">
    <Link to={DUONG_DAN.TRANG_CHU} className="xacThucLogo"><img src="/logo-soopi.svg" alt="Soopi - về trang chủ" /></Link>
    <h1>Đăng nhập</h1><p>Chào mừng bạn quay lại Soopi.</p>
    <form noValidate onSubmit={xuLyGui} className="xacThucForm">
      <Field label="Email" required error={loiTruong.email}><Input id="dang-nhap-email" type="email" autoComplete="email" value={duLieu.email} onChange={(event) => capNhat('email', event.target.value)} onBlur={() => setLoiTruong((cu) => ({ ...cu, email: kiemTra('email', duLieu.email) }))} /></Field>
      <div className="field"><label className="fieldLabel" htmlFor="dang-nhap-matKhau">Mật khẩu <span className="fieldRequired" aria-hidden="true">*</span></label><div className="xacThucMatKhau"><Input id="dang-nhap-matKhau" type={hienMatKhau ? 'text' : 'password'} autoComplete="current-password" aria-invalid={Boolean(loiTruong.matKhau)} aria-describedby={loiTruong.matKhau ? 'dang-nhap-matKhau-loi' : undefined} value={duLieu.matKhau} onChange={(event) => capNhat('matKhau', event.target.value)} onBlur={() => setLoiTruong((cu) => ({ ...cu, matKhau: kiemTra('matKhau', duLieu.matKhau) }))} /><button type="button" aria-label={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setHienMatKhau(!hienMatKhau)}>{hienMatKhau ? 'Ẩn' : 'Hiện'}</button></div>{loiTruong.matKhau && <p className="fieldError" id="dang-nhap-matKhau-loi">{loiTruong.matKhau}</p>}</div>
      <Link className="xacThucLienKetPhu" to={DUONG_DAN.QUEN_MAT_KHAU}>Quên mật khẩu?</Link>
      {loiChung && <div className="xacThucLoi" role="alert">{loiChung}</div>}
      <Button type="submit" fullWidth loading={dangGui}>Đăng nhập</Button>
    </form>
    <p className="xacThucChuyen">Chưa có tài khoản? <Link to={DUONG_DAN.DANG_KY}>Đăng ký</Link></p>
  </div></main>;
}
