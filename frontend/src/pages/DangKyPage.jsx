import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Field from '../components/ui/Field.jsx';
import Input from '../components/ui/Input.jsx';
import useThongBao from '../hooks/useThongBao.js';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import * as xacThucApi from '../services/xacThuc.api.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './XacThucPage.css';

const TEN_TRUONG = ['hoTen', 'email', 'soDienThoai', 'matKhau', 'nhapLaiMatKhau'];

export default function DangKyPage() {
  const navigate = useNavigate();
  const thongBao = useThongBao();
  const { taiKhoan, dangTai } = useXacThuc();
  const [duLieu, setDuLieu] = useState({ hoTen: '', email: '', soDienThoai: '', matKhau: '', nhapLaiMatKhau: '' });
  const [loiTruong, setLoiTruong] = useState({});
  const [loiChung, setLoiChung] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [hienMatKhau, setHienMatKhau] = useState(false);

  if (dangTai) return <main className="xacThucTrang" role="status">Đang kiểm tra phiên đăng nhập...</main>;
  if (taiKhoan) return <Navigate to={DUONG_DAN.TRANG_CHU} replace />;

  const kiemTra = (ten, giaTri, hienTai = duLieu) => {
    if (ten === 'hoTen') return giaTri.trim() ? '' : 'Vui lòng nhập họ tên.';
    if (ten === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(giaTri.trim()) ? '' : 'Vui lòng nhập email hợp lệ.';
    if (ten === 'soDienThoai') return !giaTri.trim() || /^(0\d{9}|\+84\d{9})$/.test(giaTri.trim()) ? '' : 'Số điện thoại phải có 10 chữ số bắt đầu bằng 0 hoặc +84.';
    if (ten === 'matKhau') return giaTri.length >= 8 ? '' : 'Mật khẩu phải có ít nhất 8 ký tự.';
    return giaTri === hienTai.matKhau ? '' : 'Mật khẩu nhập lại chưa khớp.';
  };

  const capNhat = (ten, giaTri) => {
    const moi = { ...duLieu, [ten]: giaTri };
    setDuLieu(moi);
    if (loiTruong[ten]) setLoiTruong((cu) => ({ ...cu, [ten]: kiemTra(ten, giaTri, moi) }));
    setLoiChung('');
  };

  const xuLyGui = async (event) => {
    event.preventDefault();
    const loi = Object.fromEntries(TEN_TRUONG.map((ten) => [ten, kiemTra(ten, duLieu[ten])]));
    setLoiTruong(loi);
    const dauTien = TEN_TRUONG.find((ten) => loi[ten]);
    if (dauTien) { document.getElementById('dang-ky-' + dauTien)?.focus(); return; }
    setDangGui(true);
    setLoiChung('');
    try {
      const { nhapLaiMatKhau, ...body } = duLieu;
      await xacThucApi.dangKy(body);
      thongBao.thanhCong('Đăng ký thành công. Hãy đăng nhập.');
      navigate(DUONG_DAN.DANG_NHAP, { replace: true, state: { email: duLieu.email.trim() } });
    } catch (loi) { setLoiChung(loi.message); }
    finally { setDangGui(false); }
  };

  return <main className="xacThucTrang"><div className="xacThucThe">
    <Link to={DUONG_DAN.TRANG_CHU} className="xacThucLogo"><img src="/logo-soopi.svg" alt="Soopi - về trang chủ" /></Link>
    <h1>Đăng ký</h1><p>Tạo tài khoản để mua sắm trên Soopi.</p>
    <form noValidate onSubmit={xuLyGui} className="xacThucForm">
      <Field label="Họ tên" required error={loiTruong.hoTen}><Input id="dang-ky-hoTen" autoComplete="name" value={duLieu.hoTen} onChange={(e) => capNhat('hoTen', e.target.value)} onBlur={() => setLoiTruong((cu) => ({ ...cu, hoTen: kiemTra('hoTen', duLieu.hoTen) }))} /></Field>
      <Field label="Email" required error={loiTruong.email}><Input id="dang-ky-email" type="email" autoComplete="email" value={duLieu.email} onChange={(e) => capNhat('email', e.target.value)} onBlur={() => setLoiTruong((cu) => ({ ...cu, email: kiemTra('email', duLieu.email) }))} /></Field>
      <Field label="Số điện thoại" error={loiTruong.soDienThoai}><Input id="dang-ky-soDienThoai" type="tel" autoComplete="tel" value={duLieu.soDienThoai} onChange={(e) => capNhat('soDienThoai', e.target.value)} onBlur={() => setLoiTruong((cu) => ({ ...cu, soDienThoai: kiemTra('soDienThoai', duLieu.soDienThoai) }))} /></Field>
      <div className="field"><label className="fieldLabel" htmlFor="dang-ky-matKhau">Mật khẩu <span className="fieldRequired" aria-hidden="true">*</span></label><div className="xacThucMatKhau"><Input id="dang-ky-matKhau" type={hienMatKhau ? 'text' : 'password'} autoComplete="new-password" aria-invalid={Boolean(loiTruong.matKhau)} aria-describedby={loiTruong.matKhau ? 'dang-ky-matKhau-loi' : undefined} value={duLieu.matKhau} onChange={(e) => capNhat('matKhau', e.target.value)} onBlur={() => setLoiTruong((cu) => ({ ...cu, matKhau: kiemTra('matKhau', duLieu.matKhau) }))} /><button type="button" aria-label={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setHienMatKhau(!hienMatKhau)}>{hienMatKhau ? 'Ẩn' : 'Hiện'}</button></div>{loiTruong.matKhau && <p className="fieldError" id="dang-ky-matKhau-loi">{loiTruong.matKhau}</p>}</div>
      <Field label="Nhập lại mật khẩu" required error={loiTruong.nhapLaiMatKhau}><Input id="dang-ky-nhapLaiMatKhau" type="password" autoComplete="new-password" value={duLieu.nhapLaiMatKhau} onChange={(e) => capNhat('nhapLaiMatKhau', e.target.value)} onBlur={() => setLoiTruong((cu) => ({ ...cu, nhapLaiMatKhau: kiemTra('nhapLaiMatKhau', duLieu.nhapLaiMatKhau) }))} /></Field>
      {loiChung && <div className="xacThucLoi" role="alert">{loiChung}</div>}
      <Button type="submit" fullWidth loading={dangGui}>Tạo tài khoản</Button>
    </form>
    <p className="xacThucChuyen">Đã có tài khoản? <Link to={DUONG_DAN.DANG_NHAP}>Đăng nhập</Link></p>
  </div></main>;
}
