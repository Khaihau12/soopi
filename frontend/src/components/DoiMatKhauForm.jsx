import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button.jsx';
import Input from './ui/Input.jsx';
import Modal from './ui/Modal.jsx';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import useThongBao from '../hooks/useThongBao.js';
import * as taiKhoanApi from '../services/taiKhoan.api.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './DoiMatKhauForm.css';

const BAN_DAU = { matKhauHienTai: '', matKhauMoi: '', xacNhanMatKhauMoi: '' };
const TRUONG = [
  { ten: 'matKhauHienTai', nhan: 'Mật khẩu hiện tại', autoComplete: 'current-password' },
  { ten: 'matKhauMoi', nhan: 'Mật khẩu mới', autoComplete: 'new-password' },
  { ten: 'xacNhanMatKhauMoi', nhan: 'Nhập lại mật khẩu mới', autoComplete: 'new-password' },
];

export default function DoiMatKhauForm({ open, onClose }) {
  const [duLieu, setDuLieu] = useState(BAN_DAU);
  const [hien, setHien] = useState({});
  const [loi, setLoi] = useState({});
  const [loiChung, setLoiChung] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const { capNhatTaiKhoan } = useXacThuc();
  const thongBao = useThongBao();
  const navigate = useNavigate();

  const dong = () => {
    if (dangGui) return;
    setDuLieu(BAN_DAU); setHien({}); setLoi({}); setLoiChung('');
    onClose();
  };

  const xuLyGui = async (event) => {
    event.preventDefault();
    const moi = {};
    if (!duLieu.matKhauHienTai) moi.matKhauHienTai = 'Vui lòng nhập mật khẩu hiện tại.';
    if (duLieu.matKhauMoi.length < 8) moi.matKhauMoi = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
    else if (duLieu.matKhauMoi === duLieu.matKhauHienTai) moi.matKhauMoi = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
    if (!duLieu.xacNhanMatKhauMoi || duLieu.xacNhanMatKhauMoi !== duLieu.matKhauMoi) moi.xacNhanMatKhauMoi = 'Mật khẩu xác nhận chưa khớp.';
    setLoi(moi);
    if (Object.keys(moi).length) { document.getElementById(`doi-mat-khau-${Object.keys(moi)[0]}`)?.focus(); return; }
    setDangGui(true); setLoiChung('');
    try {
      await taiKhoanApi.doiMatKhau(duLieu);
      setDuLieu(BAN_DAU); setHien({}); setLoi({});
      capNhatTaiKhoan(null);
      onClose();
      thongBao.thanhCong('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      navigate(DUONG_DAN.DANG_NHAP, { replace: true });
    } catch (err) {
      const message = err.message;
      if (message.includes('không chính xác')) setLoi({ matKhauHienTai: message });
      else if (message.includes('xác nhận') || message.includes('chưa khớp')) setLoi({ xacNhanMatKhauMoi: message });
      else if (message.includes('mật khẩu mới') || message.includes('Mật khẩu mới')) setLoi({ matKhauMoi: message });
      else setLoiChung(message);
    } finally { setDangGui(false); }
  };

  return <Modal open={open} onClose={dangGui ? undefined : dong} title="Đổi mật khẩu">
    <p className="doiMatKhauMoTa">Sau khi đổi mật khẩu, bạn cần đăng nhập lại trên thiết bị này.</p>
    <form className="doiMatKhauForm" noValidate onSubmit={xuLyGui}>
      {TRUONG.map(({ ten, nhan, autoComplete }) => <div className="field" key={ten}>
        <label className="fieldLabel" htmlFor={`doi-mat-khau-${ten}`}>{nhan} <span className="fieldRequired" aria-hidden="true">*</span></label>
        <div className="doiMatKhauInput"><Input id={`doi-mat-khau-${ten}`} type={hien[ten] ? 'text' : 'password'} autoComplete={autoComplete} value={duLieu[ten]} aria-invalid={Boolean(loi[ten])} aria-describedby={loi[ten] ? `doi-mat-khau-${ten}-loi` : undefined} onChange={(event) => { setDuLieu({ ...duLieu, [ten]: event.target.value }); setLoi((cu) => ({ ...cu, [ten]: '' })); }} /><button type="button" aria-label={`${hien[ten] ? 'Ẩn' : 'Hiện'} ${nhan.toLowerCase()}`} onClick={() => setHien((cu) => ({ ...cu, [ten]: !cu[ten] }))}>{hien[ten] ? 'Ẩn' : 'Hiện'}</button></div>
        {ten === 'matKhauMoi' && <p className="fieldHint">Tối thiểu 8 ký tự, khác mật khẩu hiện tại.</p>}
        {loi[ten] && <p className="fieldError" id={`doi-mat-khau-${ten}-loi`}>{loi[ten]}</p>}
      </div>)}
      {loiChung && <p className="doiMatKhauLoi" role="alert">{loiChung}</p>}
      <div className="doiMatKhauActions"><Button variant="secondary" onClick={dong} disabled={dangGui}>Hủy</Button><Button type="submit" loading={dangGui}>Đổi mật khẩu</Button></div>
    </form>
  </Modal>;
}
