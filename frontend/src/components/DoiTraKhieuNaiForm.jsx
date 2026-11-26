import { useEffect, useState } from 'react';
import Button from './ui/Button.jsx';
import Field from './ui/Field.jsx';
import Modal from './ui/Modal.jsx';
import Textarea from './ui/Textarea.jsx';
import useThongBao from '../hooks/useThongBao.js';
import { guiYeuCauDoiTraKhieuNai } from '../services/doiTraKhieuNai.api.js';
import { dinhDangNgay } from '../utils/dinhDang.js';
import './DoiTraKhieuNaiForm.css';

export default function DoiTraKhieuNaiForm({ open, onClose, onThanhCong, dong, hanGuiYeuCau }) {
  const [noiDung, setNoiDung] = useState('');
  const [loi, setLoi] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const thongBao = useThongBao();
  useEffect(() => {
    if (open) { setNoiDung(''); setLoi(''); }
  }, [open, dong?._id]);
  const conNgay = hanGuiYeuCau ? Math.max(0, Math.ceil((new Date(hanGuiYeuCau).getTime() - Date.now()) / 86400000)) : 0;
  const daHetHan = !hanGuiYeuCau || Date.now() > new Date(hanGuiYeuCau).getTime();
  const gui = async (event) => {
    event.preventDefault();
    if (dangGui || daHetHan) return;
    if (!noiDung.trim()) { setLoi('Vui lòng nhập lý do đổi trả'); return; }
    setDangGui(true); setLoi('');
    try {
      await guiYeuCauDoiTraKhieuNai({ chiTietDonHangId: dong._id, noiDung: noiDung.trim() });
      thongBao.thanhCong('Đã gửi yêu cầu đổi trả');
      onClose(); onThanhCong?.();
    } catch (loiApi) { setLoi(loiApi.message); }
    finally { setDangGui(false); }
  };
  return <Modal open={open} onClose={dangGui ? undefined : onClose} title="Gửi yêu cầu đổi trả">
    {dong && <form className="doiTraForm" onSubmit={gui}>
      <p className="doiTraFormSanPham"><strong>{dong.sanPham.tenSanPham}</strong><span>Đơn hoàn thành · Hạn gửi {dinhDangNgay(hanGuiYeuCau)}</span></p>
      <p className="doiTraFormLuuY">Mỗi sản phẩm chỉ gửi một yêu cầu và không thể gửi lại sau khi bị từ chối. Hãy mô tả đầy đủ. {daHetHan ? 'Đã quá thời hạn gửi yêu cầu.' : `Bạn còn ${conNgay} ngày để gửi yêu cầu cho đơn này.`}</p>
      <Field label="Lý do đổi trả" required hint={`${noiDung.length}/1000 ký tự`}>
        <Textarea value={noiDung} rows={5} maxLength={1000} onChange={(event) => setNoiDung(event.target.value)} placeholder="Mô tả rõ vấn đề bạn gặp phải" /></Field>
      {loi && <p className="doiTraFormLoi" role="alert">{loi}</p>}
      <div className="doiTraFormHanhDong"><Button variant="secondary" onClick={onClose} disabled={dangGui}>Hủy</Button>
        {daHetHan ? <strong>Đã quá thời hạn gửi yêu cầu</strong> : <Button type="submit" loading={dangGui}>Gửi yêu cầu</Button>}</div>
    </form>}
  </Modal>;
}
