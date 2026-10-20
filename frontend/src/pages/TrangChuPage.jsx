import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BannerCarousel from '../components/BannerCarousel.jsx';
import DanhMucChips from '../components/DanhMucChips.jsx';
import LuoiSanPham from '../components/LuoiSanPham.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { layDanhSachBanner } from '../services/bannerQuangCao.api.js';
import { layDanhSachDanhMuc } from '../services/danhMuc.api.js';
import { layDanhSachSanPham } from '../services/sanPham.api.js';
import { layDanhSachKhuyenMaiDangDienRa } from '../services/khuyenMai.api.js';
import { dinhDangNgayGio } from '../utils/dinhDang.js';
import { DUONG_DAN, LOAI_KHUYEN_MAI, PHAN_TRANG } from '../utils/hangSo.js';
import './TrangChuPage.css';

export default function TrangChuPage() {
  const [banner, setBanner] = useState([]);
  const [danhMuc, setDanhMuc] = useState([]);
  const [sanPham, setSanPham] = useState([]);
  const [flashSale, setFlashSale] = useState(null);
  const [sanPhamFlashSale, setSanPhamFlashSale] = useState([]);
  const [khuyenMaiGiamGia, setKhuyenMaiGiamGia] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);

  useEffect(() => {
    let conHieuLuc = true;
    const taiDuLieu = async () => {
      setDangTai(true);
      setLoi('');
      const [ketQuaBanner, ketQuaDanhMuc, ketQuaSanPham, ketQuaKhuyenMai] = await Promise.allSettled([
        layDanhSachBanner(), layDanhSachDanhMuc(), layDanhSachSanPham({ trang: 1, gioiHan: PHAN_TRANG.MAC_DINH }), layDanhSachKhuyenMaiDangDienRa(),
      ]);
      if (!conHieuLuc) return;
      if (ketQuaBanner.status === 'fulfilled') setBanner(ketQuaBanner.value.danhSach);
      if (ketQuaDanhMuc.status === 'fulfilled') setDanhMuc(ketQuaDanhMuc.value.danhSach);
      if (ketQuaSanPham.status === 'fulfilled') setSanPham(ketQuaSanPham.value.danhSach);
      else setLoi(ketQuaSanPham.reason.message);
      setFlashSale(null);
      setSanPhamFlashSale([]);
      setKhuyenMaiGiamGia([]);
      if (ketQuaKhuyenMai.status === 'fulfilled') {
        const cacChuongTrinh = ketQuaKhuyenMai.value.danhSach;
        const sapKetThuc = cacChuongTrinh.find((muc) => muc.loaiKhuyenMai === LOAI_KHUYEN_MAI.FLASH_SALE);
        setKhuyenMaiGiamGia(cacChuongTrinh.filter((muc) => muc.loaiKhuyenMai === LOAI_KHUYEN_MAI.GIAM_GIA));
        if (sapKetThuc) {
          const ketQuaFlashSale = await layDanhSachSanPham({ khuyenMaiId: sapKetThuc._id, trang: 1, gioiHan: 6 }).catch(() => null);
          if (conHieuLuc && ketQuaFlashSale?.danhSach.length) { setFlashSale(sapKetThuc); setSanPhamFlashSale(ketQuaFlashSale.danhSach); }
        }
      }
      setDangTai(false);
    };
    taiDuLieu();
    return () => { conHieuLuc = false; };
  }, [lanTai]);

  return <div className="trangChuPage">
    <BannerCarousel danhSach={banner} />
    <section className="trangChuSection" aria-labelledby="trang-chu-danh-muc"><h2 id="trang-chu-danh-muc">Danh mục</h2><DanhMucChips danhSach={danhMuc} /></section>
    {flashSale && <section className="trangChuSection" aria-labelledby="trang-chu-flash-sale"><div className="trangChuHeading"><div><h2 id="trang-chu-flash-sale">Flash Sale</h2><p>Kết thúc lúc {dinhDangNgayGio(flashSale.ngayKetThuc)}</p></div><Link to={`${DUONG_DAN.SAN_PHAM}?khuyenMaiId=${flashSale._id}`}>Xem tất cả</Link></div><LuoiSanPham danhSach={sanPhamFlashSale} /></section>}
    {khuyenMaiGiamGia.length > 0 && <section className="trangChuSection" aria-labelledby="trang-chu-khuyen-mai"><h2 id="trang-chu-khuyen-mai">Khuyến mãi đang diễn ra</h2><div className="trangChuKhuyenMai">{khuyenMaiGiamGia.map((muc) => <Link key={muc._id} to={`${DUONG_DAN.SAN_PHAM}?khuyenMaiId=${muc._id}`}><strong>{muc.tenKhuyenMai}</strong><span>Kết thúc lúc {dinhDangNgayGio(muc.ngayKetThuc)}</span></Link>)}</div></section>}
    <section className="trangChuSection" aria-labelledby="trang-chu-san-pham"><div className="trangChuHeading"><h1 id="trang-chu-san-pham">Sản phẩm mới</h1><Link to={DUONG_DAN.SAN_PHAM}>Xem tất cả sản phẩm</Link></div>
      {loi ? <ErrorState message={loi} taiLai={() => setLanTai((lan) => lan + 1)} /> : <><LuoiSanPham danhSach={sanPham} dangTai={dangTai} />{!dangTai && !sanPham.length && <EmptyState title="Chưa có sản phẩm" description="Hãy quay lại sau để khám phá sản phẩm mới." />}</>}
    </section>
  </div>;
}
