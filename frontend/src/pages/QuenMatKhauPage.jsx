import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Field from '../components/ui/Field.jsx';
import Input from '../components/ui/Input.jsx';
import { quenMatKhau } from '../services/xacThuc.api.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './XacThucPage.css';

const THONG_BAO = 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được tạo.';

export default function QuenMatKhauPage() {
  const [email, setEmail] = useState('');
  const [loiEmail, setLoiEmail] = useState('');
  const [loiChung, setLoiChung] = useState('');
  const [lienKetDatLai, setLienKetDatLai] = useState('');
  const [daGui, setDaGui] = useState(false);
  const [dangGui, setDangGui] = useState(false);

  const kiemTraEmail = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? '' : 'Vui lòng nhập email hợp lệ.';

  const xuLyGui = async (event) => {
    event.preventDefault();
    const loi = kiemTraEmail();
    setLoiEmail(loi);
    if (loi) { document.getElementById('quen-mat-khau-email')?.focus(); return; }
    setDangGui(true);
    setLoiChung('');
    setDaGui(false);
    setLienKetDatLai('');
    try {
      const data = await quenMatKhau({ email: email.trim() });
      setLienKetDatLai(data?.lienKetDatLai || '');
      setDaGui(true);
    } catch (loiApi) { setLoiChung(loiApi.message); }
    finally { setDangGui(false); }
  };

  return <main className="xacThucTrang"><div className="xacThucThe">
    <Link to={DUONG_DAN.TRANG_CHU} className="xacThucLogo"><img src="/logo-soopi.svg" alt="Soopi - về trang chủ" /></Link>
    <h1>Quên mật khẩu</h1><p>Nhập email tài khoản để tạo hướng dẫn đặt lại mật khẩu.</p>
    <form noValidate onSubmit={xuLyGui} className="xacThucForm">
      <Field label="Email" required error={loiEmail}><Input id="quen-mat-khau-email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setLoiEmail(''); setDaGui(false); setLienKetDatLai(''); }} onBlur={() => setLoiEmail(kiemTraEmail())} /></Field>
      {loiChung && <div className="xacThucLoi" role="alert">{loiChung}</div>}
      {daGui && <div className="xacThucThongBao" role="status"><p>{THONG_BAO}</p>{lienKetDatLai && <><p><strong>Chỉ hiển thị ở môi trường phát triển:</strong></p><a href={lienKetDatLai}>Mở liên kết đặt lại mật khẩu</a></>}</div>}
      <Button type="submit" fullWidth loading={dangGui}>Gửi hướng dẫn</Button>
    </form>
    <Link className="xacThucTroLai" to={DUONG_DAN.DANG_NHAP}>Quay lại đăng nhập</Link>
  </div></main>;
}
