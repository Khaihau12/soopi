import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import { DUONG_DAN, VAI_TRO } from '../utils/hangSo.js';
import KhongCoQuyenPage from '../pages/KhongCoQuyenPage.jsx';
import './BaoVeRoute.css';

export default function BaoVeRoute({ vaiTro }) {
  const { taiKhoan, dangTai, coVaiTro } = useXacThuc();
  const location = useLocation();
  if (dangTai) return <div className="baoVeDangTai" role="status" aria-label="Đang kiểm tra phiên đăng nhập"><div className="baoVeSkeleton" /><div className="baoVeSkeleton" /></div>;
  if (!taiKhoan) return <Navigate to={DUONG_DAN.DANG_NHAP} replace state={{ quayLai: location.pathname + location.search }} />;
  if (taiKhoan.vaiTro?.includes(VAI_TRO.QUAN_TRI_VIEN) && vaiTro !== VAI_TRO.QUAN_TRI_VIEN) {
    return <Navigate to={DUONG_DAN.QUAN_TRI_VIEN.TONG_QUAN} replace />;
  }
  if (vaiTro && !coVaiTro(vaiTro)) return <KhongCoQuyenPage />;
  return <Outlet />;
}
