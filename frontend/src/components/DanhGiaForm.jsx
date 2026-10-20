import { useEffect, useState } from 'react';
import SaoDanhGia from './SaoDanhGia.jsx';
import Button from './ui/Button.jsx';
import Field from './ui/Field.jsx';
import Modal from './ui/Modal.jsx';
import Select from './ui/Select.jsx';
import Textarea from './ui/Textarea.jsx';
import useThongBao from '../hooks/useThongBao.js';
import { taoDanhGia } from '../services/danhGia.api.js';
import { dinhDangNgay, maDonHangHienThi } from '../utils/dinhDang.js';
import './DanhGiaForm.css';

export default function DanhGiaForm({ open, onClose, onThanhCong, chiTietDonHangId, danhSachDong = [] }) {
  const [dongId, setDongId] = useState('');
  const [soSao, setSoSao] = useState(0);
  const [noiDung, setNoiDung] = useState('');
  const [loi, setLoi] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const thongBao = useThongBao();
  useEffect(() => {
    if (open) { setDongId(chiTietDonHangId || danhSachDong[0]?.chiTietDonHangId || ''); setSoSao(0); setNoiDung(''); setLoi(''); }
  }, [open, chiTietDonHangId, danhSachDong[0]?.chiTietDonHangId]);
  const gui = async (event) => {
    event.preventDefault();
    if (dangGui) return;
    if (!dongId) { setLoi('Vui lòng chọn đơn hàng để đánh giá'); return; }
    if (!soSao) { setLoi('Vui lòng chọn số sao'); return; }
    if (!noiDung.trim()) { setLoi('Vui lòng nhập nội dung đánh giá'); return; }
    setDangGui(true); setLoi('');
    try {
      await taoDanhGia({ chiTietDonHangId: dongId, soSao, noiDung: noiDung.trim() });
      thongBao.thanhCong('Cảm ơn bạn đã đánh giá');
      onClose(); onThanhCong?.();
    } catch (loiApi) { setLoi(loiApi.message); }
    finally { setDangGui(false); }
  };
  return <Modal open={open} onClose={dangGui ? undefined : onClose} title="Viết đánh giá">
    <form className="danhGiaForm" onSubmit={gui}>
      {!chiTietDonHangId && danhSachDong.length > 1 && <Field label="Đơn hàng" required><Select value={dongId} onChange={(event) => setDongId(event.target.value)}>
        {danhSachDong.map((dong) => <option key={dong.chiTietDonHangId} value={dong.chiTietDonHangId}>{maDonHangHienThi(dong.donHangId)} · {dinhDangNgay(dong.ngayTao)}</option>)}
      </Select></Field>}
      <SaoDanhGia nhap giaTri={soSao} onChange={setSoSao} />
      <Field label="Nội dung đánh giá" required hint={`${noiDung.length}/1000 ký tự`}><Textarea value={noiDung} maxLength={1000}
        onChange={(event) => setNoiDung(event.target.value)} rows={5} placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm" /></Field>
      {loi && <p className="danhGiaFormLoi" role="alert">{loi}</p>}
      <div className="danhGiaFormHanhDong"><Button variant="secondary" onClick={onClose} disabled={dangGui}>Hủy</Button>
        <Button type="submit" loading={dangGui}>Gửi đánh giá</Button></div>
    </form>
  </Modal>;
}
