import { useEffect, useState } from 'react';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import ConfirmDialog from './ui/ConfirmDialog.jsx';
import ErrorState from './ui/ErrorState.jsx';
import Field from './ui/Field.jsx';
import Input from './ui/Input.jsx';
import Modal from './ui/Modal.jsx';
import Skeleton from './ui/Skeleton.jsx';
import Textarea from './ui/Textarea.jsx';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import useThongBao from '../hooks/useThongBao.js';
import * as api from '../services/taiKhoan.api.js';
import './SoDiaChi.css';

const BAN_NHAP = { tenGoi: '', diaChi: '', macDinh: false };

export default function SoDiaChi() {
  const { taiKhoan, capNhatTaiKhoan } = useXacThuc();
  const thongBao = useThongBao();
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loiTai, setLoiTai] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);
  const [banNhap, setBanNhap] = useState(null);
  const [dangSuaId, setDangSuaId] = useState(null);
  const [loiForm, setLoiForm] = useState('');
  const [canXoa, setCanXoa] = useState(null);

  const taiLai = async () => {
    setDangTai(true); setLoiTai('');
    try { const data = await api.laySoDiaChi(); setDanhSach(data.danhSach); }
    catch (loi) { setLoiTai(loi.message); }
    finally { setDangTai(false); }
  };
  useEffect(() => { taiLai(); }, []);

  const capNhatDanhSach = (moi) => {
    setDanhSach(moi);
    capNhatTaiKhoan({ ...taiKhoan, diaChiNhanHang: moi.find((item) => item.macDinh)?.diaChi || '' });
  };
  const moThem = () => { setBanNhap({ ...BAN_NHAP }); setDangSuaId(null); setLoiForm(''); };
  const moSua = (item) => { setBanNhap({ tenGoi: item.tenGoi, diaChi: item.diaChi, macDinh: item.macDinh }); setDangSuaId(item._id); setLoiForm(''); };
  const dongForm = () => { if (!dangXuLy) { setBanNhap(null); setDangSuaId(null); setLoiForm(''); } };

  const luu = async (event) => {
    event.preventDefault();
    const tenGoi = banNhap.tenGoi.trim();
    const diaChi = banNhap.diaChi.trim();
    if (!tenGoi || !diaChi) {
      setLoiForm('Vui lòng nhập tên gợi nhớ và địa chỉ.');
      document.getElementById(tenGoi ? 'so-dia-chi-diaChi' : 'so-dia-chi-tenGoi')?.focus();
      return;
    }
    setDangXuLy(true); setLoiForm('');
    try {
      const data = dangSuaId
        ? await api.suaDiaChi(dangSuaId, { tenGoi, diaChi })
        : await api.themDiaChi({ tenGoi, diaChi, macDinh: banNhap.macDinh });
      capNhatDanhSach(data.danhSach);
      setBanNhap(null); setDangSuaId(null); setLoiForm('');
      thongBao.thanhCong(dangSuaId ? 'Đã cập nhật địa chỉ' : 'Đã lưu địa chỉ');
    } catch (loi) { setLoiForm(loi.message); }
    finally { setDangXuLy(false); }
  };
  const datMacDinh = async (id) => {
    setDangXuLy(true);
    try { const data = await api.datDiaChiMacDinh(id); capNhatDanhSach(data.danhSach); thongBao.thanhCong('Đã đổi địa chỉ mặc định'); }
    catch (loi) { thongBao.loi(loi.message); }
    finally { setDangXuLy(false); }
  };
  const xoa = async () => {
    if (!canXoa) return;
    setDangXuLy(true);
    try { const data = await api.xoaDiaChi(canXoa._id); capNhatDanhSach(data.danhSach); setCanXoa(null); thongBao.thanhCong('Đã xóa địa chỉ'); }
    catch (loi) { thongBao.loi(loi.message); }
    finally { setDangXuLy(false); }
  };

  return <Card className="hoSoCard soDiaChiCard">
    <div className="soDiaChiDau"><div><h2>Sổ địa chỉ</h2><p>Lưu địa chỉ để chọn nhanh khi đặt hàng. Tối đa 10 địa chỉ.</p></div>
      <Button variant="secondary" onClick={moThem} disabled={dangTai || danhSach.length >= 10}>Thêm địa chỉ</Button></div>
    {dangTai ? <Skeleton count={2} /> : loiTai ? <ErrorState message={loiTai} taiLai={taiLai} /> : danhSach.length ?
      <div className="soDiaChiDanhSach">{danhSach.map((item) => <article className="soDiaChiDong" key={item._id}>
        <div><div className="soDiaChiTieuDe"><strong>{item.tenGoi}</strong>{item.macDinh && <span>Mặc định</span>}</div><p>{item.diaChi}</p></div>
        <div className="soDiaChiHanhDong">{!item.macDinh && <Button size="sm" variant="ghost" disabled={dangXuLy} onClick={() => datMacDinh(item._id)}>Đặt mặc định</Button>}
          <Button size="sm" variant="secondary" disabled={dangXuLy} onClick={() => moSua(item)}>Sửa</Button>
          <Button size="sm" variant="ghost" disabled={dangXuLy} onClick={() => setCanXoa(item)}>Xóa</Button></div>
      </article>)}</div> : <p className="soDiaChiTrong">Bạn chưa lưu địa chỉ nào. Thêm một địa chỉ để thanh toán nhanh hơn.</p>}
    <Modal open={Boolean(banNhap)} onClose={dangXuLy ? undefined : dongForm} title={dangSuaId ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}>
      {banNhap && <form className="soDiaChiForm" onSubmit={luu} noValidate>
        <Field label="Tên gợi nhớ" required hint="Ví dụ: Nhà riêng, Công ty"><Input id="so-dia-chi-tenGoi" maxLength={40} value={banNhap.tenGoi} onChange={(event) => { setBanNhap({ ...banNhap, tenGoi: event.target.value }); setLoiForm(''); }} /></Field>
        <Field label="Địa chỉ nhận hàng" required><Textarea id="so-dia-chi-diaChi" rows={4} maxLength={500} autoComplete="street-address" value={banNhap.diaChi} onChange={(event) => { setBanNhap({ ...banNhap, diaChi: event.target.value }); setLoiForm(''); }} /></Field>
        {!dangSuaId && danhSach.length > 0 && <label className="soDiaChiChonMacDinh"><input type="checkbox" checked={banNhap.macDinh} onChange={(event) => setBanNhap({ ...banNhap, macDinh: event.target.checked })} />Đặt làm địa chỉ mặc định</label>}
        {loiForm && <p className="hoSoLoi" role="alert">{loiForm}</p>}
        <div className="soDiaChiFormActions"><Button variant="secondary" onClick={dongForm} disabled={dangXuLy}>Hủy</Button><Button type="submit" loading={dangXuLy}>Lưu địa chỉ</Button></div>
      </form>}
    </Modal>
    <ConfirmDialog open={Boolean(canXoa)} onClose={dangXuLy ? undefined : () => setCanXoa(null)} onConfirm={xoa}
      title="Xóa địa chỉ" message={canXoa?.macDinh ? 'Địa chỉ này đang là mặc định. Nếu xóa, địa chỉ còn lại sẽ được chọn làm mặc định.' : 'Bạn có chắc muốn xóa địa chỉ đã lưu này?'}
      confirmLabel="Xóa địa chỉ" danger loading={dangXuLy} />
  </Card>;
}
