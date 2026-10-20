import { useState } from 'react';
import { Link } from 'react-router-dom';
import GiaTien from './GiaTien.jsx';
import Icon from './ui/Icon.jsx';
import { taoUrlAnh } from '../utils/dinhDang.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './SanPhamCard.css';

export default function SanPhamCard({ sanPham }) {
  const [anhLoi, setAnhLoi] = useState(false);
  const hinhAnh = taoUrlAnh(sanPham.hinhAnh?.[0]);
  const hetHang = sanPham.soLuongTon === 0;
  return <Link className="sanPhamCard" to={DUONG_DAN.chiTietSanPham(sanPham._id)}>
    <div className={'sanPhamCardImage' + (hetHang ? ' sanPhamCardHetHang' : '')}>
      {hinhAnh && !anhLoi ? <img src={hinhAnh} alt={sanPham.tenSanPham} loading="lazy" onError={() => setAnhLoi(true)} /> : <span className="sanPhamCardPlaceholder"><Icon name="image" size={32} /><span>Chưa có ảnh</span></span>}
      {hetHang && <span className="sanPhamCardStock">Hết hàng</span>}
    </div>
    <div className="sanPhamCardBody"><h3>{sanPham.tenSanPham}</h3><GiaTien giaGoc={sanPham.giaGoc} giaBanThucTe={sanPham.giaBanThucTe} kichThuoc="nho" /><span className="sanPhamCardShop">{sanPham.cuaHang?.tenCuaHang || 'Cửa hàng'}</span></div>
  </Link>;
}
