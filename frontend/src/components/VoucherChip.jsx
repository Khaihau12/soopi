import { useState } from 'react';
import Button from './ui/Button.jsx';
import { dinhDangNgayGio } from '../utils/dinhDang.js';
import { moTaVoucher } from '../utils/voucher.js';
import './VoucherChip.css';

export default function VoucherChip({ voucher }) {
  const [thongBao, setThongBao] = useState('');
  const saoChep = async () => {
    try { await navigator.clipboard.writeText(voucher.maVoucher); setThongBao('Đã sao chép'); }
    catch { setThongBao('Không sao chép được, hãy chọn mã để sao chép'); }
  };
  return <div className="voucherChip">
    <strong className="voucherChipMa">{voucher.maVoucher}</strong>
    <span>{moTaVoucher(voucher)}</span>
    <small>Hết hạn {dinhDangNgayGio(voucher.ngayKetThuc)}</small>
    <Button variant="secondary" size="sm" onClick={saoChep}>Sao chép mã</Button>
    {thongBao && <small role="status">{thongBao}</small>}
  </div>;
}
