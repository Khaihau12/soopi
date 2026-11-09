import Button from './ui/Button.jsx';
import Modal from './ui/Modal.jsx';
import { DUONG_DAN } from '../utils/hangSo.js';
import './KetQuaMuaLai.css';

export default function KetQuaMuaLai({ ketQua, onClose }) {
  return <Modal open={Boolean(ketQua)} onClose={onClose} title="Kết quả mua lại">
    {ketQua && <div className="ketQuaMuaLai">
      {ketQua.daThem.length > 0 ? <section><h3>Đã thêm vào giỏ ({ketQua.daThem.length})</h3><ul>{ketQua.daThem.map((item, index) => <li key={index}>{item.tenSanPham} × {item.soLuong}</li>)}</ul></section>
        : <p>Chưa thêm được sản phẩm nào vào giỏ.</p>}
      {ketQua.boQua.length > 0 && <section><h3>Chưa thêm được ({ketQua.boQua.length})</h3><ul>{ketQua.boQua.map((item, index) => <li key={index}><strong>{item.tenSanPham}</strong>: {item.lyDo}</li>)}</ul></section>}
      <p>Giá và khuyến mãi hiện tại sẽ được tính lại khi bạn xem giỏ và đặt hàng.</p>
      <div className="ketQuaMuaLaiActions"><Button variant="secondary" onClick={onClose}>Đóng</Button>{ketQua.daThem.length > 0 && <Button to={DUONG_DAN.GIO_HANG} onClick={onClose}>Xem giỏ hàng</Button>}</div>
    </div>}
  </Modal>;
}
