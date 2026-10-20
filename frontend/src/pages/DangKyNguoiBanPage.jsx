import { useEffect, useState } from 'react';
import Button from '../components/ui/Button.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Field from '../components/ui/Field.jsx';
import Input from '../components/ui/Input.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import TrangThaiBadge from '../components/TrangThaiBadge.jsx';
import useThongBao from '../hooks/useThongBao.js';
import { guiYeuCauDangKyNguoiBan, layYeuCauCuaToi } from '../services/yeuCauDangKyNguoiBan.api.js';
import { dinhDangNgayGio } from '../utils/dinhDang.js';
import { DUONG_DAN, TRANG_THAI_YEU_CAU_NGUOI_BAN } from '../utils/hangSo.js';
import './DangKyNguoiBanPage.css';

const FORM_RONG = { tenCuaHang: '', diaChiCuaHang: '', moTaCuaHang: '' };

export default function DangKyNguoiBanPage() {
  const thongBao = useThongBao();
  const [duLieu, setDuLieu] = useState(null);
  const [form, setForm] = useState(FORM_RONG);
  const [loiForm, setLoiForm] = useState({});
  const [dangTai, setDangTai] = useState(true);
  const [dangGui, setDangGui] = useState(false);
  const [loiTai, setLoiTai] = useState('');
  const [loiGui, setLoiGui] = useState('');
  const [lanTai, setLanTai] = useState(0);

  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoiTai('');
    layYeuCauCuaToi().then((data) => {
      if (!conHieuLuc) return;
      setDuLieu(data);
      if (data.yeuCau?.trangThai === TRANG_THAI_YEU_CAU_NGUOI_BAN.DA_TU_CHOI) {
        setForm({ tenCuaHang: data.yeuCau.tenCuaHang || '', diaChiCuaHang: data.yeuCau.diaChiCuaHang || '', moTaCuaHang: data.yeuCau.moTaCuaHang || '' });
      }
    }).catch((loi) => { if (conHieuLuc) setLoiTai(loi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [lanTai]);

  const capNhat = (ten, giaTri) => {
    setForm((cu) => ({ ...cu, [ten]: giaTri }));
    setLoiForm((cu) => ({ ...cu, [ten]: '' }));
    setLoiGui('');
  };

  const gui = async (event) => {
    event.preventDefault();
    if (dangGui) return;
    const moi = {};
    if (!form.tenCuaHang.trim()) moi.tenCuaHang = 'Vui lòng nhập tên cửa hàng.';
    else if (form.tenCuaHang.trim().length > 100) moi.tenCuaHang = 'Tên cửa hàng không được quá 100 ký tự.';
    if (!form.diaChiCuaHang.trim()) moi.diaChiCuaHang = 'Vui lòng nhập địa chỉ cửa hàng.';
    else if (form.diaChiCuaHang.trim().length > 500) moi.diaChiCuaHang = 'Địa chỉ cửa hàng không được quá 500 ký tự.';
    if (form.moTaCuaHang.trim().length > 5000) moi.moTaCuaHang = 'Mô tả không được quá 5000 ký tự.';
    if (Object.keys(moi).length) {
      setLoiForm(moi);
      document.getElementById(Object.keys(moi)[0])?.focus();
      return;
    }
    setDangGui(true); setLoiGui('');
    try {
      const { yeuCau } = await guiYeuCauDangKyNguoiBan(form);
      setDuLieu({ yeuCau, daLaNguoiBan: false });
      thongBao.thanhCong('Đã gửi yêu cầu. Vui lòng chờ phê duyệt.');
    } catch (loi) {
      setLoiGui(loi.message);
      if (loi.status === 409) setLanTai((lan) => lan + 1);
    } finally { setDangGui(false); }
  };

  const yeuCau = duLieu?.yeuCau;
  return <div className="dangKyNguoiBanPage"><h1>Đăng ký trở thành Người bán</h1>
    {dangTai ? <Skeleton variant="block" count={3} /> : loiTai ? <ErrorState message={loiTai} taiLai={() => setLanTai((lan) => lan + 1)} /> : duLieu?.daLaNguoiBan ?
      <div className="dangKyNguoiBanCard"><h2>Bạn đã là Người bán</h2><p>Bạn có thể quản lý cửa hàng trong Kênh người bán.</p><Button to={DUONG_DAN.NGUOI_BAN.TONG_QUAN}>Đến kênh người bán</Button></div>
      : yeuCau?.trangThai === TRANG_THAI_YEU_CAU_NGUOI_BAN.CHO_PHE_DUYET ?
        <div className="dangKyNguoiBanCard"><TrangThaiBadge trangThai={yeuCau.trangThai} /><h2>{yeuCau.tenCuaHang}</h2><p>Đã gửi lúc {dinhDangNgayGio(yeuCau.ngayGui)}</p><p>Quản trị viên sẽ xem xét yêu cầu của bạn.</p></div>
        : <div className="dangKyNguoiBanCard">
          {yeuCau?.trangThai === TRANG_THAI_YEU_CAU_NGUOI_BAN.DA_TU_CHOI && <div className="dangKyNguoiBanCanhBao"><strong>Yêu cầu trước của bạn đã bị từ chối.</strong><p>Bạn có thể chỉnh sửa thông tin và gửi lại.</p></div>}
          <form className="dangKyNguoiBanForm" noValidate onSubmit={gui}>
            <Field label="Tên cửa hàng" required error={loiForm.tenCuaHang}><Input id="tenCuaHang" value={form.tenCuaHang} maxLength={101} onChange={(event) => capNhat('tenCuaHang', event.target.value)} /></Field>
            <Field label="Địa chỉ cửa hàng" required error={loiForm.diaChiCuaHang}><Input id="diaChiCuaHang" value={form.diaChiCuaHang} maxLength={501} onChange={(event) => capNhat('diaChiCuaHang', event.target.value)} /></Field>
            <Field label="Mô tả cửa hàng" error={loiForm.moTaCuaHang}><Textarea id="moTaCuaHang" value={form.moTaCuaHang} maxLength={5001} onChange={(event) => capNhat('moTaCuaHang', event.target.value)} /></Field>
            {loiGui && <p className="dangKyNguoiBanLoi" role="alert">{loiGui}</p>}
            <Button type="submit" loading={dangGui}>Gửi yêu cầu</Button>
          </form>
        </div>}
  </div>;
}
