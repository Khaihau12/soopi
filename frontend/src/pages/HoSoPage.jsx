import { useEffect, useState } from 'react';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Field from '../components/ui/Field.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import DoiMatKhauForm from '../components/DoiMatKhauForm.jsx';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import useThongBao from '../hooks/useThongBao.js';
import * as taiKhoanApi from '../services/taiKhoan.api.js';
import { GIOI_TINH } from '../utils/hangSo.js';
import './HoSoPage.css';

const TEN_TRUONG = ['hoTen', 'ngaySinh', 'gioiTinh', 'soDienThoai', 'diaChiNhanHang'];
const NHAN = { hoTen: 'Họ tên', ngaySinh: 'Ngày sinh', gioiTinh: 'Giới tính', soDienThoai: 'Số điện thoại', diaChiNhanHang: 'Địa chỉ nhận hàng' };
const homNayVietNam = () => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
const taoBanNhap = (taiKhoan) => ({
  hoTen: taiKhoan.hoTen || '',
  ngaySinh: taiKhoan.ngaySinh ? taiKhoan.ngaySinh.slice(0, 10) : '',
  gioiTinh: taiKhoan.gioiTinh || '',
  soDienThoai: taiKhoan.soDienThoai || '',
  diaChiNhanHang: taiKhoan.diaChiNhanHang || '',
});

export default function HoSoPage() {
  const { taiKhoan: trongContext, capNhatTaiKhoan } = useXacThuc();
  const thongBao = useThongBao();
  const [taiKhoan, setTaiKhoan] = useState(trongContext);
  const [dangTai, setDangTai] = useState(true);
  const [loiTai, setLoiTai] = useState('');
  const [dangSua, setDangSua] = useState(false);
  const [duLieu, setDuLieu] = useState(null);
  const [loiTruong, setLoiTruong] = useState({});
  const [loiChung, setLoiChung] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [moDoiMatKhau, setMoDoiMatKhau] = useState(false);

  const taiLai = async () => {
    setDangTai(true); setLoiTai('');
    try {
      const { taiKhoan: moi } = await taiKhoanApi.layHoSo();
      setTaiKhoan(moi); capNhatTaiKhoan(moi);
    } catch (loi) { setLoiTai(loi.message); }
    finally { setDangTai(false); }
  };
  useEffect(() => { taiLai(); }, []);

  const batDauSua = () => { setDuLieu(taoBanNhap(taiKhoan)); setLoiTruong({}); setLoiChung(''); setDangSua(true); };
  const huySua = () => { setDuLieu(null); setLoiTruong({}); setLoiChung(''); setDangSua(false); };
  const capNhat = (ten, giaTri) => { setDuLieu((cu) => ({ ...cu, [ten]: giaTri })); setLoiTruong((cu) => ({ ...cu, [ten]: '' })); setLoiChung(''); };
  const daThayDoi = duLieu && TEN_TRUONG.some((ten) => duLieu[ten] !== taoBanNhap(taiKhoan)[ten]);

  const xuLyLuu = async (event) => {
    event.preventDefault();
    const loi = {};
    if (!duLieu.hoTen.trim()) loi.hoTen = 'Vui lòng nhập họ tên.';
    else if (duLieu.hoTen.trim().length > 100) loi.hoTen = 'Họ tên không được quá 100 ký tự.';
    if (duLieu.ngaySinh && duLieu.ngaySinh > homNayVietNam()) loi.ngaySinh = 'Ngày sinh không được ở tương lai.';
    if (duLieu.soDienThoai && !/^(0\d{9}|\+84\d{9})$/.test(duLieu.soDienThoai.trim())) loi.soDienThoai = 'Số điện thoại phải có 10 chữ số bắt đầu bằng 0 hoặc +84.';
    if (duLieu.diaChiNhanHang.trim().length > 500) loi.diaChiNhanHang = 'Địa chỉ nhận hàng không được quá 500 ký tự.';
    setLoiTruong(loi);
    if (Object.keys(loi).length) { document.getElementById(`ho-so-${Object.keys(loi)[0]}`)?.focus(); return; }
    setDangGui(true); setLoiChung('');
    try {
      const { taiKhoan: moi } = await taiKhoanApi.capNhatHoSo(duLieu);
      setTaiKhoan(moi); capNhatTaiKhoan(moi); huySua();
      thongBao.thanhCong('Cập nhật thông tin thành công');
    } catch (err) {
      const ten = TEN_TRUONG.find((item) => err.message.toLowerCase().includes(NHAN[item].toLowerCase()));
      if (ten) setLoiTruong((cu) => ({ ...cu, [ten]: err.message }));
      else setLoiChung(err.message);
    } finally { setDangGui(false); }
  };

  return <div className="hoSoPage"><div className="hoSoHeading"><h1>Hồ sơ cá nhân</h1><p>Xem và cập nhật thông tin tài khoản của bạn.</p></div>
    {dangTai ? <Card className="hoSoCard"><Skeleton count={7} /></Card> : loiTai ? <ErrorState message={loiTai} taiLai={taiLai} /> : <>
      <Card className="hoSoCard"><div className="hoSoIdentity"><div className="hoSoAvatar"><Avatar hoTen={taiKhoan.hoTen} /></div><div className="hoSoIdentityText"><h2>{taiKhoan.hoTen}</h2><p>{taiKhoan.email}</p><div className="hoSoRoles">{taiKhoan.vaiTro?.map((vaiTro) => <Badge key={vaiTro} variant="info">{vaiTro}</Badge>)}</div></div></div>
        {dangSua ? <form noValidate onSubmit={xuLyLuu} className="hoSoForm">
          <Field label="Họ tên" required error={loiTruong.hoTen}><Input id="ho-so-hoTen" autoComplete="name" value={duLieu.hoTen} onChange={(e) => capNhat('hoTen', e.target.value)} /></Field>
          <Field label="Ngày sinh" error={loiTruong.ngaySinh}><Input id="ho-so-ngaySinh" type="date" max={homNayVietNam()} value={duLieu.ngaySinh} onChange={(e) => capNhat('ngaySinh', e.target.value)} /></Field>
          <Field label="Giới tính" error={loiTruong.gioiTinh}><Select id="ho-so-gioiTinh" value={duLieu.gioiTinh} onChange={(e) => capNhat('gioiTinh', e.target.value)}><option value="">Chưa cập nhật</option>{Object.values(GIOI_TINH).map((giaTri) => <option key={giaTri} value={giaTri}>{giaTri}</option>)}</Select></Field>
          <Field label="Số điện thoại" error={loiTruong.soDienThoai}><Input id="ho-so-soDienThoai" type="tel" autoComplete="tel" value={duLieu.soDienThoai} onChange={(e) => capNhat('soDienThoai', e.target.value)} /></Field>
          <Field label="Địa chỉ nhận hàng" hint="Địa chỉ này được dùng khi đặt hàng." error={loiTruong.diaChiNhanHang}><Textarea id="ho-so-diaChiNhanHang" rows={4} maxLength={500} autoComplete="street-address" value={duLieu.diaChiNhanHang} onChange={(e) => capNhat('diaChiNhanHang', e.target.value)} /></Field>
          {loiChung && <p className="hoSoLoi" role="alert">{loiChung}</p>}
          <div className="hoSoActions"><Button variant="secondary" onClick={huySua} disabled={dangGui}>Hủy</Button><Button type="submit" disabled={!daThayDoi} loading={dangGui}>Lưu thay đổi</Button></div>
        </form> : <><dl className="hoSoDetails">{TEN_TRUONG.map((ten) => <div key={ten}><dt>{NHAN[ten]}</dt><dd className={taiKhoan[ten] ? '' : 'hoSoEmpty'}>{ten === 'ngaySinh' && taiKhoan[ten] ? new Date(taiKhoan[ten]).toLocaleDateString('vi-VN') : taiKhoan[ten] || 'Chưa cập nhật'}</dd></div>)}</dl><Button onClick={batDauSua}>Chỉnh sửa</Button></>}
      </Card>
      <Card className="hoSoCard hoSoSecurity"><div><h2>Bảo mật</h2><p>Mật khẩu</p><span>Đổi định kỳ để bảo vệ tài khoản của bạn.</span></div><Button variant="secondary" onClick={() => setMoDoiMatKhau(true)}>Đổi mật khẩu</Button></Card>
    </>}
    <DoiMatKhauForm open={moDoiMatKhau} onClose={() => setMoDoiMatKhau(false)} />
  </div>;
}
