import { useEffect, useState } from 'react';
import Icon from './ui/Icon.jsx';
import { taoUrlAnh } from '../utils/dinhDang.js';
import { CHU_KY_BANNER_MS } from '../utils/hangSo.js';
import './BannerCarousel.css';

export default function BannerCarousel({ danhSach = [] }) {
  const [viTri, setViTri] = useState(0);
  const [tamDung, setTamDung] = useState(false);
  const [giamChuyenDong, setGiamChuyenDong] = useState(false);
  const [anhLoi, setAnhLoi] = useState([]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const capNhat = () => setGiamChuyenDong(media.matches);
    capNhat(); media.addEventListener('change', capNhat);
    return () => media.removeEventListener('change', capNhat);
  }, []);
  useEffect(() => {
    if (danhSach.length < 2 || tamDung || giamChuyenDong) return undefined;
    const timer = window.setInterval(() => setViTri((hienTai) => (hienTai + 1) % danhSach.length), CHU_KY_BANNER_MS);
    return () => window.clearInterval(timer);
  }, [danhSach.length, tamDung, giamChuyenDong]);

  if (!danhSach.length) return null;
  const banner = danhSach[viTri % danhSach.length];
  const hinhAnh = taoUrlAnh(banner.hinhAnh);
  const doiBanner = (buoc) => setViTri((hienTai) => (hienTai + buoc + danhSach.length) % danhSach.length);
  return <section className="bannerCarousel" aria-label="Banner Soopi" onMouseEnter={() => setTamDung(true)} onMouseLeave={() => setTamDung(false)} onFocusCapture={() => setTamDung(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setTamDung(false); }}>
    <div className="bannerSlide"><div className="bannerImage">{hinhAnh && !anhLoi.includes(hinhAnh) ? <img src={hinhAnh} alt={banner.tieuDe} onError={() => setAnhLoi((cu) => [...cu, hinhAnh])} /> : <span className="bannerImageTrong"><Icon name="image" size={44} /><span>Chưa có ảnh banner</span></span>}</div><div className="bannerContent"><h2>{banner.tieuDe}</h2>{banner.noiDung && <p>{banner.noiDung}</p>}</div></div>
    {danhSach.length > 1 && <div className="bannerControls"><button type="button" aria-label="Banner trước" onClick={() => doiBanner(-1)}><Icon name="chevronLeft" /></button><div className="bannerDots">{danhSach.map((item, index) => <button key={item._id} type="button" aria-label={`Đến banner ${index + 1}`} aria-current={index === viTri ? 'true' : undefined} className={index === viTri ? 'bannerDotActive' : ''} onClick={() => setViTri(index)} />)}</div><button type="button" aria-label="Banner sau" onClick={() => doiBanner(1)}><Icon name="chevronRight" /></button></div>}
  </section>;
}
