import { Link } from 'react-router-dom';
import { DUONG_DAN } from '../utils/hangSo.js';

export default function KhoiDiaChiNhanHang({ danhSachDiaChi, dangTaiDiaChi, loiDiaChi, taiLaiDiaChi, kieuDiaChi, setKieuDiaChi, diaChiKhac, setDiaChiKhac, onThayDoi, thieuDiaChi, textareaRef }) {
  return <section className="thanhToanCard"><h2>Địa chỉ nhận hàng</h2>
    {dangTaiDiaChi && <p className="thanhToanGhiChu" role="status">Đang tải địa chỉ đã lưu…</p>}
    {loiDiaChi && <p className="thanhToanCanhBao" role="alert">Không tải được sổ địa chỉ: {loiDiaChi} <button type="button" onClick={taiLaiDiaChi}>Thử lại</button></p>}
    {danhSachDiaChi.map((item) => <label className="thanhToanLuaChon" key={item._id}><input type="radio" name="diaChi" checked={kieuDiaChi === item._id}
      onChange={() => { setKieuDiaChi(item._id); onThayDoi(item.diaChi); }} /><span><strong>{item.tenGoi}</strong>{item.macDinh && <em className="thanhToanDiaChiMacDinh">Mặc định</em>}<small>{item.diaChi}</small></span></label>)}
    <label className="thanhToanLuaChon"><input type="radio" name="diaChi" checked={kieuDiaChi === 'khac'} onChange={() => { setKieuDiaChi('khac'); onThayDoi(diaChiKhac); }} /><span>Nhập địa chỉ cho lần mua này</span></label>
    {kieuDiaChi === 'khac' && <label className="thanhToanNhan">Địa chỉ giao hàng
      <textarea ref={textareaRef} value={diaChiKhac} maxLength={500} onChange={(event) => setDiaChiKhac(event.target.value)} onBlur={() => onThayDoi(diaChiKhac)} placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố" />
    </label>}
    {thieuDiaChi && <p className="thanhToanCanhBao" role="status">Vui lòng nhập địa chỉ nhận hàng trước khi đặt hàng.</p>}
    <p className="thanhToanGhiChu">Bạn có thể <Link to={DUONG_DAN.TAI_KHOAN}>quản lý sổ địa chỉ trong hồ sơ</Link>. Địa chỉ mới nhập ở đây chỉ áp dụng cho lần mua này.</p>
  </section>;
}
