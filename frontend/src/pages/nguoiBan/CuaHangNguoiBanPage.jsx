import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import useThongBao from '../../hooks/useThongBao.js';
import { nguoiBanCapNhatCuaHang } from '../../services/cuaHang.api.js';
import { TRANG_THAI_HOAT_DONG_CUA_HANG } from '../../utils/hangSo.js';
import './CuaHangNguoiBanPage.css';

const taoBanNhap = (cuaHang) => ({
  tenCuaHang: cuaHang.tenCuaHang || '',
  diaChi: cuaHang.diaChi || '',
  moTa: cuaHang.moTa || '',
});

export default function CuaHangNguoiBanPage() {
  const { cuaHang, dangTai, loiTai, taiLai, capNhatCuaHang } = useOutletContext();
  const thongBao = useThongBao();
  const [dangSua, setDangSua] = useState(false);
  const [form, setForm] = useState(null);
  const [loiTruong, setLoiTruong] = useState({});
  const [loiChung, setLoiChung] = useState('');
  const [dangGui, setDangGui] = useState(false);

  const batDauSua = () => { setForm(taoBanNhap(cuaHang)); setLoiTruong({}); setLoiChung(''); setDangSua(true); };
  const huySua = () => { setDangSua(false); setForm(null); setLoiTruong({}); setLoiChung(''); };
  const capNhat = (ten, giaTri) => {
    setForm((cu) => ({ ...cu, [ten]: giaTri }));
    setLoiTruong((cu) => ({ ...cu, [ten]: '' }));
    setLoiChung('');
  };
  const daThayDoi = form && cuaHang && Object.keys(form).some((ten) => form[ten].trim() !== (cuaHang[ten] || ''));

  const luu = async (event) => {
    event.preventDefault();
    if (!daThayDoi || dangGui) return;
    const loi = {};
    if (!form.tenCuaHang.trim()) loi.tenCuaHang = 'Vui lòng nhập tên cửa hàng.';
    else if (form.tenCuaHang.trim().length > 100) loi.tenCuaHang = 'Tên cửa hàng không được quá 100 ký tự.';
    if (!form.diaChi.trim()) loi.diaChi = 'Vui lòng nhập địa chỉ.';
    else if (form.diaChi.trim().length > 500) loi.diaChi = 'Địa chỉ không được quá 500 ký tự.';
    if (form.moTa.trim().length > 5000) loi.moTa = 'Mô tả không được quá 5000 ký tự.';
    setLoiTruong(loi);
    if (Object.keys(loi).length) { document.getElementById(`cua-hang-${Object.keys(loi)[0]}`)?.focus(); return; }

    const duLieu = Object.fromEntries(Object.entries(form)
      .filter(([ten, giaTri]) => giaTri.trim() !== (cuaHang[ten] || ''))
      .map(([ten, giaTri]) => [ten, giaTri.trim()]));
    setDangGui(true); setLoiChung('');
    try {
      const { cuaHang: moi } = await nguoiBanCapNhatCuaHang(duLieu);
      capNhatCuaHang(moi);
      huySua();
      thongBao.thanhCong('Cập nhật cửa hàng thành công');
    } catch (loiApi) { setLoiChung(loiApi.message); }
    finally { setDangGui(false); }
  };

  const trangThai = cuaHang?.trangThaiHoatDong;
  return <div className="cuaHangNguoiBanPage">
    <PageHeader title="Cửa hàng của tôi" description="Xem và cập nhật thông tin cửa hàng của bạn." />
    {dangTai ? <Card className="cuaHangNguoiBanCard"><Skeleton count={5} /></Card> : loiTai ?
      <ErrorState message={loiTai} taiLai={taiLai} /> : cuaHang ?
      <Card className="cuaHangNguoiBanCard">
        <div className="cuaHangNguoiBanTrangThai"><span>Trạng thái cửa hàng</span><Badge variant={trangThai === TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG ? 'success' : 'neutral'}>{trangThai}</Badge></div>
        {dangSua ? <form noValidate onSubmit={luu} className="cuaHangNguoiBanForm">
          <Field label="Tên cửa hàng" required error={loiTruong.tenCuaHang}><Input id="cua-hang-tenCuaHang" value={form.tenCuaHang} maxLength={101} onChange={(event) => capNhat('tenCuaHang', event.target.value)} /></Field>
          <Field label="Địa chỉ" required error={loiTruong.diaChi}><Textarea id="cua-hang-diaChi" rows={3} value={form.diaChi} maxLength={501} onChange={(event) => capNhat('diaChi', event.target.value)} /></Field>
          <Field label="Mô tả" error={loiTruong.moTa}><Textarea id="cua-hang-moTa" rows={5} value={form.moTa} maxLength={5001} onChange={(event) => capNhat('moTa', event.target.value)} /></Field>
          {loiChung && <p className="cuaHangNguoiBanLoi" role="alert">{loiChung}</p>}
          <div className="cuaHangNguoiBanActions"><Button variant="secondary" onClick={huySua} disabled={dangGui}>Hủy</Button><Button type="submit" disabled={!daThayDoi} loading={dangGui}>Lưu thay đổi</Button></div>
        </form> : <><dl className="cuaHangNguoiBanChiTiet">
          <div><dt>Tên cửa hàng</dt><dd>{cuaHang.tenCuaHang || 'Chưa cập nhật'}</dd></div>
          <div><dt>Địa chỉ</dt><dd>{cuaHang.diaChi || 'Chưa cập nhật'}</dd></div>
          <div><dt>Mô tả</dt><dd>{cuaHang.moTa || 'Chưa cập nhật'}</dd></div>
        </dl><Button onClick={batDauSua}>Chỉnh sửa</Button></>}
      </Card> : <ErrorState message="Tài khoản của bạn chưa có cửa hàng" taiLai={taiLai} />}
  </div>;
}
