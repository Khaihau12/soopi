import { useState } from 'react';
import { Link } from 'react-router-dom';
import GiaTien from './GiaTien.jsx';
import QuantityInput from './ui/QuantityInput.jsx';
import Icon from './ui/Icon.jsx';
import { taoUrlAnh, dinhDangTien } from '../utils/dinhDang.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './DongGioHang.css';

export default function DongGioHang({ dong, dangGui, onChon, onSoLuong, onXoa }) {
  const [anhLoi, setAnhLoi] = useState(false);
  const anh = taoUrlAnh(dong.sanPham.hinhAnh?.[0]);
  const duongDan = DUONG_DAN.chiTietSanPham(dong.sanPham._id);
  const coTheGiamSoLuong = dong.sanPham.soLuongTon > 0 && dong.lyDoKhongMua?.startsWith('Chỉ còn');
  return <div className={'dongGioHang' + (!dong.coTheMua ? ' dongGioHangKhongMua' : '')}>
    <label className="dongGioHangChon"><input type="checkbox" aria-label={`Chọn ${dong.sanPham.tenSanPham}`} checked={dong.coTheMua && dong.duocChon} disabled={!dong.coTheMua || dangGui} onChange={(event) => onChon(dong._id, event.target.checked)} /></label>
    <Link to={duongDan} className="dongGioHangAnh">{anh && !anhLoi ? <img src={anh} alt={dong.sanPham.tenSanPham} loading="lazy" onError={() => setAnhLoi(true)} /> : <Icon name="image" size={28} />}</Link>
    <div className="dongGioHangNoiDung"><Link to={duongDan} className="dongGioHangTen">{dong.sanPham.tenSanPham}</Link><GiaTien giaGoc={dong.sanPham.giaGoc} giaBanThucTe={dong.sanPham.giaBanThucTe} kichThuoc="nho" />
      {dong.lyDoKhongMua && <p className="dongGioHangLyDo" role="status">{dong.lyDoKhongMua}</p>}
      <div className="dongGioHangCuoi"><QuantityInput value={dong.soLuong} max={Math.max(dong.soLuong, dong.sanPham.soLuongTon)} disabled={dangGui || (!dong.coTheMua && !coTheGiamSoLuong)} onChange={(soLuong) => onSoLuong(dong._id, soLuong)} /><strong>{dinhDangTien(dong.soLuong * dong.sanPham.giaBanThucTe)}</strong></div>
    </div>
    <button type="button" className="dongGioHangXoa" aria-label={`Xóa ${dong.sanPham.tenSanPham} khỏi giỏ hàng`} disabled={dangGui} onClick={() => onXoa(dong._id)}><Icon name="trash" /></button>
  </div>;
}
