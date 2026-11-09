import { useState } from 'react';
import { Link } from 'react-router-dom';
import GiaTien from './GiaTien.jsx';
import Icon from './ui/Icon.jsx';
import NutYeuThich from './NutYeuThich.jsx';
import { taoUrlAnh } from '../utils/dinhDang.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './SanPhamCard.css';

export default function SanPhamCard({ sanPham, hienCuaHang = true }) {
  const [anhLoi, setAnhLoi] = useState(false);
  const hinhAnh = taoUrlAnh(sanPham.hinhAnh?.[0]);
  const hetHang = sanPham.soLuongTon === 0;
  return <article className="sanPhamCard"><Link className="sanPhamCardMain" to={DUONG_DAN.chiTietSanPham(sanPham._id)}>
    <div className={'sanPhamCardImage' + (hetHang ? ' sanPhamCardHetHang' : '')}>
      {hinhAnh && !anhLoi ? <img src={hinhAnh} alt={sanPham.tenSanPham} loading="lazy" onError={() => setAnhLoi(true)} /> : <span className="sanPhamCardPlaceholder"><Icon name="image" size={32} /><span>Chưa có ảnh</span></span>}
      {hetHang && <span className="sanPhamCardStock">Hết hàng</span>}
    </div>
    <div className="sanPhamCardBody"><h3>{sanPham.tenSanPham}</h3><GiaTien giaGoc={sanPham.giaGoc} giaBanThucTe={sanPham.giaBanThucTe} kichThuoc="nho" />
      {sanPham.thongKeDanhGia?.soDanhGia > 0 && <span className="sanPhamCardDanhGia"><Icon name="starFill" size={16} /> {sanPham.thongKeDanhGia.diemTrungBinh}/5 · {sanPham.thongKeDanhGia.soDanhGia} đánh giá</span>}
    </div></Link><NutYeuThich sanPhamId={sanPham._id} gon />
    {hienCuaHang && sanPham.cuaHang?._id && <Link className="sanPhamCardShop" to={DUONG_DAN.chiTietCuaHang(sanPham.cuaHang._id)} aria-label={`Xem cửa hàng ${sanPham.cuaHang.tenCuaHang}`}>{sanPham.cuaHang.tenCuaHang}</Link>}
  </article>;
}
