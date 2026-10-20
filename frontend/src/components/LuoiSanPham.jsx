import SanPhamCard from './SanPhamCard.jsx';
import Skeleton from './ui/Skeleton.jsx';
import './LuoiSanPham.css';

export default function LuoiSanPham({ danhSach = [], dangTai = false }) {
  return <div className="luoiSanPham" aria-busy={dangTai}>
    {dangTai ? Array.from({ length: 8 }, (_, index) => <div className="luoiSanPhamSkeleton" key={index}><Skeleton variant="block" count={2} /></div>)
      : danhSach.map((sanPham) => <SanPhamCard key={sanPham._id} sanPham={sanPham} />)}
  </div>;
}
