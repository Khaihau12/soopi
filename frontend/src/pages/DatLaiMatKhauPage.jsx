import { useLayoutEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Field from '../components/ui/Field.jsx';
import Input from '../components/ui/Input.jsx';
import useThongBao from '../hooks/useThongBao.js';
import { datLaiMatKhau } from '../services/xacThuc.api.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './XacThucPage.css';

export default function DatLaiMatKhauPage() {
  const navigate = useNavigate();
  const thongBao = useThongBao();
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [nhapLaiMatKhau, setNhapLaiMatKhau] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [loiTruong, setLoiTruong] = useState({});
  const [loiChung, setLoiChung] = useState('');
  const [dangGui, setDangGui] = useState(false);

  useLayoutEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('token')) {
      url.searchParams.delete('token');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    }
  }, []);

  const xuLyGui = async (event) => {
    event.preventDefault();
    const loi = {
      matKhauMoi: matKhauMoi.length >= 8 ? '' : 'Mật khẩu mới phải có ít nhất 8 ký tự.',
      nhapLaiMatKhau: nhapLaiMatKhau === matKhauMoi ? '' : 'Mật khẩu nhập lại chưa khớp.',
    };
    setLoiTruong(loi);
    const dauTien = Object.keys(loi).find((ten) => loi[ten]);
    if (dauTien) { document.getElementById('dat-lai-' + dauTien)?.focus(); return; }
    setDangGui(true);
    setLoiChung('');
    try {
      await datLaiMatKhau({ token, matKhauMoi });
      thongBao.thanhCong('Đặt lại mật khẩu thành công. Hãy đăng nhập.');
      navigate(DUONG_DAN.DANG_NHAP, { replace: true });
    } catch (loi) { setLoiChung(loi.message); }
    finally { setDangGui(false); }
  };

  return <main className="xacThucTrang"><div className="xacThucThe">
    <Link to={DUONG_DAN.TRANG_CHU} className="xacThucLogo"><img src="/logo-soopi.svg" alt="Soopi - về trang chủ" /></Link>
    <h1>Đặt lại mật khẩu</h1>
    {!token ? <><ErrorState message="Liên kết đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu liên kết mới." /><Link className="xacThucTroLai" to={DUONG_DAN.QUEN_MAT_KHAU}>Yêu cầu liên kết mới</Link></> : <>
      <p>Chọn mật khẩu mới cho tài khoản của bạn.</p>
      <form noValidate onSubmit={xuLyGui} className="xacThucForm">
        <div className="field"><label className="fieldLabel" htmlFor="dat-lai-matKhauMoi">Mật khẩu mới <span className="fieldRequired" aria-hidden="true">*</span></label><div className="xacThucMatKhau"><Input id="dat-lai-matKhauMoi" type={hienMatKhau ? 'text' : 'password'} autoComplete="new-password" aria-invalid={Boolean(loiTruong.matKhauMoi)} aria-describedby={loiTruong.matKhauMoi ? 'dat-lai-matKhauMoi-loi' : 'dat-lai-matKhauMoi-goi-y'} value={matKhauMoi} onChange={(event) => { setMatKhauMoi(event.target.value); setLoiTruong((cu) => ({ ...cu, matKhauMoi: '' })); }} /><button type="button" aria-label={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setHienMatKhau(!hienMatKhau)}>{hienMatKhau ? 'Ẩn' : 'Hiện'}</button></div><p className="fieldHint" id="dat-lai-matKhauMoi-goi-y">Tối thiểu 8 ký tự.</p>{loiTruong.matKhauMoi && <p className="fieldError" id="dat-lai-matKhauMoi-loi">{loiTruong.matKhauMoi}</p>}</div>
        <Field label="Nhập lại mật khẩu" required error={loiTruong.nhapLaiMatKhau}><Input id="dat-lai-nhapLaiMatKhau" type="password" autoComplete="new-password" value={nhapLaiMatKhau} onChange={(event) => { setNhapLaiMatKhau(event.target.value); setLoiTruong((cu) => ({ ...cu, nhapLaiMatKhau: '' })); }} /></Field>
        {loiChung && <div className="xacThucLoi" role="alert">{loiChung}<br /><Link to={DUONG_DAN.QUEN_MAT_KHAU}>Yêu cầu liên kết mới</Link></div>}
        <Button type="submit" fullWidth loading={dangGui}>Đặt lại mật khẩu</Button>
      </form>
      <Link className="xacThucTroLai" to={DUONG_DAN.DANG_NHAP}>Quay lại đăng nhập</Link>
    </>}
  </div></main>;
}
