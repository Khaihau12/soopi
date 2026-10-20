import { Link } from 'react-router-dom';
import { DUONG_DAN } from '../utils/hangSo.js';

export default function KhoiDiaChiNhanHang({ diaChiHoSo, kieuDiaChi, setKieuDiaChi, diaChiKhac, setDiaChiKhac, onThayDoi, thieuDiaChi, textareaRef }) {
  return <section className="thanhToanCard"><h2>Địa chỉ nhận hàng</h2>
    {diaChiHoSo && <label className="thanhToanLuaChon"><input type="radio" name="diaChi" checked={kieuDiaChi === 'ho-so'} onChange={() => { setKieuDiaChi('ho-so'); onThayDoi(undefined); }} /><span>Dùng địa chỉ trong hồ sơ<small>{diaChiHoSo}</small></span></label>}
    <label className="thanhToanLuaChon"><input type="radio" name="diaChi" checked={kieuDiaChi === 'khac'} onChange={() => { setKieuDiaChi('khac'); onThayDoi(diaChiKhac); }} /><span>Nhập địa chỉ khác</span></label>
    {kieuDiaChi === 'khac' && <label className="thanhToanNhan">Địa chỉ giao hàng
      <textarea ref={textareaRef} value={diaChiKhac} maxLength={500} onChange={(event) => setDiaChiKhac(event.target.value)} onBlur={() => onThayDoi(diaChiKhac)} placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố" />
    </label>}
    {thieuDiaChi && <p className="thanhToanCanhBao" role="status">Vui lòng nhập địa chỉ nhận hàng trước khi đặt hàng.</p>}
    <p className="thanhToanGhiChu">Địa chỉ khác chỉ áp dụng cho lần mua này. <Link to={DUONG_DAN.TAI_KHOAN}>Sửa địa chỉ trong hồ sơ</Link></p>
  </section>;
}
