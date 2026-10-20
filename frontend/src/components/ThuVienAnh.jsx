import { useEffect, useState } from 'react';
import Icon from './ui/Icon.jsx';
import { taoUrlAnh } from '../utils/dinhDang.js';
import './ThuVienAnh.css';

const HINH_ANH_RONG = [];

export default function ThuVienAnh({ hinhAnh = HINH_ANH_RONG, tenSanPham }) {
  const [viTri, setViTri] = useState(0);
  const [anhLoi, setAnhLoi] = useState([]);
  useEffect(() => { setViTri(0); setAnhLoi([]); }, [hinhAnh]);
  const danhSach = hinhAnh.map(taoUrlAnh).filter((url) => url && !anhLoi.includes(url));
  const baoAnhLoi = (url) => { setAnhLoi((cu) => [...cu, url]); setViTri(0); };
  return <div className="thuVienAnh">
    <div className="thuVienAnhChinh">{danhSach.length ? <img src={danhSach[viTri] || danhSach[0]} alt={tenSanPham} onError={() => baoAnhLoi(danhSach[viTri] || danhSach[0])} /> : <div className="thuVienAnhTrong"><Icon name="image" size={48} /><span>Chưa có ảnh sản phẩm</span></div>}</div>
    {danhSach.length > 1 && <div className="thuVienAnhNho" aria-label="Ảnh sản phẩm">{danhSach.map((url, index) => <button key={`${url}-${index}`} type="button" className={index === viTri ? 'thuVienAnhDangChon' : ''} aria-label={`Xem ảnh ${index + 1} của ${tenSanPham}`} aria-pressed={index === viTri} onClick={() => setViTri(index)}><img src={url} alt="" loading="lazy" onError={() => baoAnhLoi(url)} /></button>)}</div>}
  </div>;
}
