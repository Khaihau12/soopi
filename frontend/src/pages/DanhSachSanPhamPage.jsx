import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DanhMucChips from '../components/DanhMucChips.jsx';
import LuoiSanPham from '../components/LuoiSanPham.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { layDanhSachDanhMuc } from '../services/danhMuc.api.js';
import { layDanhSachSanPham } from '../services/sanPham.api.js';
import { layDanhSachKhuyenMaiDangDienRa } from '../services/khuyenMai.api.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './DanhSachSanPhamPage.css';

export default function DanhSachSanPhamPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tuKhoa = searchParams.get('tuKhoa')?.trim() || '';
  const danhMucId = searchParams.get('danhMucId') || '';
  const khuyenMaiId = searchParams.get('khuyenMaiId') || '';
  const trang = searchParams.get('trang') || '1';
  const [danhMuc, setDanhMuc] = useState([]);
  const [tenKhuyenMai, setTenKhuyenMai] = useState('');
  const [ketQua, setKetQua] = useState({ danhSach: [], phanTrang: { trang: 1, tongSo: 0, tongTrang: 0 } });
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);

  useEffect(() => {
    let conHieuLuc = true;
    layDanhSachDanhMuc().then((data) => { if (conHieuLuc) setDanhMuc(data.danhSach); }).catch(() => {});
    return () => { conHieuLuc = false; };
  }, []);

  useEffect(() => {
    let conHieuLuc = true;
    if (!khuyenMaiId) { setTenKhuyenMai(''); return undefined; }
    layDanhSachKhuyenMaiDangDienRa().then((data) => {
      if (conHieuLuc) setTenKhuyenMai(data.danhSach.find((muc) => muc._id === khuyenMaiId)?.tenKhuyenMai || 'Chương trình không còn hiệu lực');
    }).catch(() => { if (conHieuLuc) setTenKhuyenMai('Khuyến mãi'); });
    return () => { conHieuLuc = false; };
  }, [khuyenMaiId]);

  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true);
    setLoi('');
    layDanhSachSanPham({ tuKhoa, danhMucId, khuyenMaiId, trang }).then((data) => {
      if (conHieuLuc) setKetQua(data);
    }).catch((loiApi) => {
      if (conHieuLuc) setLoi(loiApi.message);
    }).finally(() => {
      if (conHieuLuc) setDangTai(false);
    });
    return () => { conHieuLuc = false; };
  }, [tuKhoa, danhMucId, khuyenMaiId, trang, lanTai]);

  const chuyenTrang = (soTrang) => {
    const query = new URLSearchParams(searchParams);
    if (soTrang === 1) query.delete('trang'); else query.set('trang', String(soTrang));
    setSearchParams(query);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return <div className="danhSachSanPhamPage">
    <div className="danhSachSanPhamHeading"><h1>{khuyenMaiId ? tenKhuyenMai || 'Sản phẩm khuyến mãi' : tuKhoa ? `Kết quả cho “${tuKhoa}”` : 'Tất cả sản phẩm'}</h1>{!dangTai && !loi && <p>{ketQua.phanTrang.tongSo} sản phẩm</p>}</div>
    {khuyenMaiId && <Link to={DUONG_DAN.SAN_PHAM}>Xem tất cả sản phẩm</Link>}
    <DanhMucChips danhSach={danhMuc} danhMucId={danhMucId} tuKhoa={tuKhoa} khuyenMaiId={khuyenMaiId} />
    {loi ? <ErrorState message={loi} taiLai={() => setLanTai((lan) => lan + 1)} /> : <>
      <LuoiSanPham danhSach={ketQua.danhSach} dangTai={dangTai} />
      {!dangTai && !ketQua.danhSach.length && <EmptyState title="Không tìm thấy sản phẩm phù hợp" description="Thử từ khóa hoặc danh mục khác." actionLabel="Xóa bộ lọc" actionTo={DUONG_DAN.SAN_PHAM} />}
      {!dangTai && <Pagination trang={ketQua.phanTrang.trang} tongTrang={ketQua.phanTrang.tongTrang} onChange={chuyenTrang} />}
    </>}
  </div>;
}
