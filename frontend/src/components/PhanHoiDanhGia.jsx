import { useState } from 'react';
import Button from './ui/Button.jsx';
import Field from './ui/Field.jsx';
import Textarea from './ui/Textarea.jsx';
import useThongBao from '../hooks/useThongBao.js';
import { nguoiBanPhanHoiDanhGia } from '../services/danhGia.api.js';
import { dinhDangNgay } from '../utils/dinhDang.js';
import './PhanHoiDanhGia.css';

export default function PhanHoiDanhGia({ danhGia, nguoiBan = false, onThanhCong }) {
  const [moForm, setMoForm] = useState(false);
  const [noiDung, setNoiDung] = useState('');
  const [loi, setLoi] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const thongBao = useThongBao();
  if (danhGia.phanHoiNguoiBan) return <div className="phanHoiDanhGia">
    <div className="phanHoiDanhGiaDau"><strong>Phản hồi từ cửa hàng</strong>
      {danhGia.ngayPhanHoi && <time dateTime={danhGia.ngayPhanHoi}>{dinhDangNgay(danhGia.ngayPhanHoi)}</time>}</div>
    <p>{danhGia.phanHoiNguoiBan}</p></div>;
  if (!nguoiBan) return null;

  const guiPhanHoi = async () => {
    if (!noiDung.trim()) { setLoi('Vui lòng nhập nội dung phản hồi'); return; }
    setDangGui(true); setLoi('');
    try {
      await nguoiBanPhanHoiDanhGia(danhGia._id, noiDung.trim());
      setMoForm(false); setNoiDung('');
      thongBao.thanhCong('Đã phản hồi đánh giá');
      onThanhCong?.();
    } catch (loiApi) { setLoi(loiApi.message); }
    finally { setDangGui(false); }
  };

  return moForm ? <div className="phanHoiDanhGiaForm"><Field label="Phản hồi của cửa hàng" required
    hint={`${noiDung.length}/1000 ký tự. Phản hồi sẽ hiển thị công khai dưới đánh giá.`} error={loi}>
      <Textarea value={noiDung} maxLength={1000} onChange={(event) => { setNoiDung(event.target.value); setLoi(''); }} />
    </Field><div className="phanHoiDanhGiaHanhDong"><Button loading={dangGui} onClick={guiPhanHoi}>Gửi phản hồi</Button>
      <Button variant="ghost" disabled={dangGui} onClick={() => { setMoForm(false); setLoi(''); }}>Hủy</Button></div></div>
    : <Button variant="secondary" size="sm" onClick={() => setMoForm(true)}>Trả lời đánh giá</Button>;
}
