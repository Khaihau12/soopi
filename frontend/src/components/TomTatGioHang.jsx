import Button from './ui/Button.jsx';
import { dinhDangTien } from '../utils/dinhDang.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './TomTatGioHang.css';

export default function TomTatGioHang({ tongGiaTri, soDongDaChon }) {
  return <aside className="tomTatGioHang" aria-label="Tóm tắt giỏ hàng">
    <div className="tomTatGioHangGia"><span>Tạm tính ({soDongDaChon} sản phẩm)</span><strong>{dinhDangTien(tongGiaTri)}</strong></div>
    <p>Phí vận chuyển và voucher sẽ được tính ở bước thanh toán.</p>
    <Button to={DUONG_DAN.THANH_TOAN} fullWidth disabled={soDongDaChon === 0}>Mua hàng</Button>
  </aside>;
}
