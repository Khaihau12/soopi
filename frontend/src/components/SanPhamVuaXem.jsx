import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from './ui/Card.jsx';
import GiaTien from './GiaTien.jsx';
import ErrorState from './ui/ErrorState.jsx';
import Skeleton from './ui/Skeleton.jsx';
import { laySanPhamDaXem } from '../services/taiKhoan.api.js';
import { taoUrlAnh } from '../utils/dinhDang.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './SanPhamVuaXem.css';

function AnhSanPhamVuaXem({ sanPham }) {
  const [loiAnh, setLoiAnh] = useState(false);
  const url = taoUrlAnh(sanPham.hinhAnh?.[0]);
  return url && !loiAnh ? <img src={url} alt="" loading="lazy" onError={() => setLoiAnh(true)} />
    : <span className="sanPhamVuaXemKhongAnh">Chưa có ảnh</span>;
}

export default function SanPhamVuaXem() {
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loiTai, setLoiTai] = useState('');
  const [lanTai, setLanTai] = useState(0);

  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoiTai('');
    laySanPhamDaXem().then(({ danhSach: moi }) => { if (conHieuLuc) setDanhSach(moi); })
      .catch((loi) => { if (conHieuLuc) setLoiTai(loi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [lanTai]);

  return <Card className="hoSoCard sanPhamVuaXem" id="san-pham-vua-xem">
    <div className="sanPhamVuaXemDau"><h2>Sản phẩm vừa xem</h2><p>Tối đa 8 sản phẩm gần đây trên tài khoản của bạn.</p></div>
    {dangTai ? <div aria-busy="true"><Skeleton count={3} /></div>
      : loiTai ? <ErrorState message={loiTai} taiLai={() => setLanTai((lan) => lan + 1)} />
        : danhSach.length === 0 ? <div className="sanPhamVuaXemRong"><p>Bạn chưa xem sản phẩm nào gần đây.</p><Link to={DUONG_DAN.SAN_PHAM}>Khám phá sản phẩm</Link></div>
          : <ul className="sanPhamVuaXemDanhSach">{danhSach.map((sanPham) => <li key={sanPham._id}>
            <Link to={DUONG_DAN.chiTietSanPham(sanPham._id)} className="sanPhamVuaXemLienKet">
              <AnhSanPhamVuaXem sanPham={sanPham} />
              <span className="sanPhamVuaXemThongTin"><strong>{sanPham.tenSanPham}</strong>
                <GiaTien giaGoc={sanPham.giaGoc} giaBanThucTe={sanPham.giaBanThucTe} kichThuoc="nho" />
                {sanPham.soLuongTon === 0 && <small>Tạm hết hàng</small>}</span>
            </Link>
          </li>)}</ul>}
  </Card>;
}
