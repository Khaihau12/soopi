import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ThongBaoProvider from './components/ui/ThongBaoProvider.jsx';
import BaoVeRoute from './components/BaoVeRoute.jsx';
import { XacThucProvider } from './hooks/XacThucContext.jsx';
import UserLayout from './layouts/UserLayout.jsx';
import NguoiBanLayout from './layouts/NguoiBanLayout.jsx';
import QuanTriVienLayout from './layouts/QuanTriVienLayout.jsx';
import KhongTimThayPage from './pages/KhongTimThayPage.jsx';
import DangNhapPage from './pages/DangNhapPage.jsx';
import DangKyPage from './pages/DangKyPage.jsx';
import TrangChuPage from './pages/TrangChuPage.jsx';
import { GioHangProvider } from './hooks/GioHangContext.jsx';
import { DUONG_DAN, VAI_TRO } from './utils/hangSo.js';

const QuenMatKhauPage = lazy(() => import('./pages/QuenMatKhauPage.jsx'));
const DatLaiMatKhauPage = lazy(() => import('./pages/DatLaiMatKhauPage.jsx'));
const HoSoPage = lazy(() => import('./pages/HoSoPage.jsx'));
const DanhSachSanPhamPage = lazy(() => import('./pages/DanhSachSanPhamPage.jsx'));
const ChiTietSanPhamPage = lazy(() => import('./pages/ChiTietSanPhamPage.jsx'));
const DangKyNguoiBanPage = lazy(() => import('./pages/DangKyNguoiBanPage.jsx'));
const DanhMucQuanTriPage = lazy(() => import('./pages/quanTriVien/DanhMucQuanTriPage.jsx'));
const DuyetNguoiBanPage = lazy(() => import('./pages/quanTriVien/DuyetNguoiBanPage.jsx'));
const CuaHangNguoiBanPage = lazy(() => import('./pages/nguoiBan/CuaHangNguoiBanPage.jsx'));
const TongQuanNguoiBanPage = lazy(() => import('./pages/nguoiBan/TongQuanNguoiBanPage.jsx'));
const BaoCaoNguoiBanPage = lazy(() => import('./pages/nguoiBan/BaoCaoNguoiBanPage.jsx'));
const TongQuanQuanTriPage = lazy(() => import('./pages/quanTriVien/TongQuanQuanTriPage.jsx'));
const BaoCaoQuanTriPage = lazy(() => import('./pages/quanTriVien/BaoCaoQuanTriPage.jsx'));
const SanPhamNguoiBanPage = lazy(() => import('./pages/nguoiBan/SanPhamNguoiBanPage.jsx'));
const FormSanPhamPage = lazy(() => import('./pages/nguoiBan/FormSanPhamPage.jsx'));
const KhuyenMaiNguoiBanPage = lazy(() => import('./pages/nguoiBan/KhuyenMaiNguoiBanPage.jsx'));
const FormKhuyenMaiPage = lazy(() => import('./pages/nguoiBan/FormKhuyenMaiPage.jsx'));
const KhuyenMaiQuanTriPage = lazy(() => import('./pages/quanTriVien/KhuyenMaiQuanTriPage.jsx'));
const FormKhuyenMaiQuanTriPage = lazy(() => import('./pages/quanTriVien/FormKhuyenMaiQuanTriPage.jsx'));
const VoucherNguoiBanPage = lazy(() => import('./pages/nguoiBan/VoucherNguoiBanPage.jsx'));
const VoucherQuanTriPage = lazy(() => import('./pages/quanTriVien/VoucherQuanTriPage.jsx'));
const GioHangPage = lazy(() => import('./pages/GioHangPage.jsx'));
const ThanhToanPage = lazy(() => import('./pages/ThanhToanPage.jsx'));
const KetQuaThanhToanPage = lazy(() => import('./pages/KetQuaThanhToanPage.jsx'));
const DonHangPage = lazy(() => import('./pages/DonHangPage.jsx'));
const ChiTietDonHangPage = lazy(() => import('./pages/ChiTietDonHangPage.jsx'));
const DonHangNguoiBanPage = lazy(() => import('./pages/nguoiBan/DonHangNguoiBanPage.jsx'));
const ChiTietDonHangNguoiBanPage = lazy(() => import('./pages/nguoiBan/ChiTietDonHangNguoiBanPage.jsx'));
const DanhGiaNguoiBanPage = lazy(() => import('./pages/nguoiBan/DanhGiaNguoiBanPage.jsx'));
const DoiTraKhieuNaiPage = lazy(() => import('./pages/DoiTraKhieuNaiPage.jsx'));
const DoiTraKhieuNaiNguoiBanPage = lazy(() => import('./pages/nguoiBan/DoiTraKhieuNaiNguoiBanPage.jsx'));
const TroChuyenPage = lazy(() => import('./pages/TroChuyenPage.jsx'));
const TroChuyenNguoiBanPage = lazy(() => import('./pages/nguoiBan/TroChuyenNguoiBanPage.jsx'));
const TaiKhoanQuanTriPage = lazy(() => import('./pages/quanTriVien/TaiKhoanQuanTriPage.jsx'));
const CuaHangQuanTriPage = lazy(() => import('./pages/quanTriVien/CuaHangQuanTriPage.jsx'));
const GiaoDichQuanTriPage = lazy(() => import('./pages/quanTriVien/GiaoDichQuanTriPage.jsx'));
const SanPhamQuanTriPage = lazy(() => import('./pages/quanTriVien/SanPhamQuanTriPage.jsx'));
const BannerQuanTriPage = lazy(() => import('./pages/quanTriVien/BannerQuanTriPage.jsx'));

export default function App() {
  return (
    <ThongBaoProvider>
      <XacThucProvider>
      <GioHangProvider>
      <Routes>
        <Route path={DUONG_DAN.DANG_NHAP} element={<DangNhapPage />} />
        <Route path={DUONG_DAN.DANG_KY} element={<DangKyPage />} />
        <Route path={DUONG_DAN.QUEN_MAT_KHAU} element={<Suspense fallback={<p>Đang tải trang…</p>}><QuenMatKhauPage /></Suspense>} />
        <Route path={DUONG_DAN.DAT_LAI_MAT_KHAU} element={<Suspense fallback={<p>Đang tải trang…</p>}><DatLaiMatKhauPage /></Suspense>} />
        <Route element={<UserLayout />}>
          <Route path={DUONG_DAN.TRANG_CHU} element={<TrangChuPage />} />
          <Route path={DUONG_DAN.SAN_PHAM} element={<DanhSachSanPhamPage />} />
          <Route path="/san-pham/:id" element={<ChiTietSanPhamPage />} />
          <Route element={<BaoVeRoute />}>
            <Route path={DUONG_DAN.TAI_KHOAN} element={<HoSoPage />} />
            <Route path={DUONG_DAN.DANG_KY_NGUOI_BAN} element={<DangKyNguoiBanPage />} />
            <Route path={DUONG_DAN.GIO_HANG} element={<GioHangPage />} />
            <Route path={DUONG_DAN.THANH_TOAN} element={<ThanhToanPage />} />
            <Route path={DUONG_DAN.KET_QUA_THANH_TOAN} element={<KetQuaThanhToanPage />} />
            <Route path={DUONG_DAN.DON_HANG} element={<DonHangPage />} />
            <Route path="/don-hang/:id" element={<ChiTietDonHangPage />} />
            <Route path={DUONG_DAN.DOI_TRA_KHIEU_NAI} element={<DoiTraKhieuNaiPage />} />
            <Route path={DUONG_DAN.TRO_CHUYEN} element={<TroChuyenPage />} />
          </Route>
          <Route path="*" element={<KhongTimThayPage />} />
        </Route>
        <Route element={<BaoVeRoute vaiTro={VAI_TRO.NGUOI_BAN} />}>
          <Route path={DUONG_DAN.NGUOI_BAN.TONG_QUAN} element={<NguoiBanLayout />}>
            <Route index element={<Suspense fallback={<p>Đang tải tổng quan…</p>}><TongQuanNguoiBanPage /></Suspense>} />
            <Route path="bao-cao" element={<Suspense fallback={<p>Đang tải báo cáo…</p>}><BaoCaoNguoiBanPage /></Suspense>} />
            <Route path="cua-hang" element={<CuaHangNguoiBanPage />} />
            <Route path="san-pham" element={<SanPhamNguoiBanPage />} />
            <Route path="san-pham/them" element={<FormSanPhamPage />} />
            <Route path="san-pham/:id/sua" element={<FormSanPhamPage />} />
            <Route path="khuyen-mai" element={<KhuyenMaiNguoiBanPage />} />
            <Route path="khuyen-mai/them" element={<FormKhuyenMaiPage />} />
            <Route path="khuyen-mai/:id/sua" element={<FormKhuyenMaiPage />} />
            <Route path="voucher" element={<VoucherNguoiBanPage />} />
            <Route path="don-hang" element={<DonHangNguoiBanPage />} />
            <Route path="don-hang/:id" element={<ChiTietDonHangNguoiBanPage />} />
            <Route path="danh-gia" element={<DanhGiaNguoiBanPage />} />
            <Route path="doi-tra-khieu-nai" element={<DoiTraKhieuNaiNguoiBanPage />} />
            <Route path="tro-chuyen" element={<TroChuyenNguoiBanPage />} />
            <Route path="*" element={<KhongTimThayPage />} />
          </Route>
        </Route>
        <Route element={<BaoVeRoute vaiTro={VAI_TRO.QUAN_TRI_VIEN} />}>
          <Route path={DUONG_DAN.QUAN_TRI_VIEN.TONG_QUAN} element={<QuanTriVienLayout />}>
            <Route index element={<Suspense fallback={<p>Đang tải tổng quan…</p>}><TongQuanQuanTriPage /></Suspense>} />
            <Route path="bao-cao" element={<Suspense fallback={<p>Đang tải báo cáo…</p>}><BaoCaoQuanTriPage /></Suspense>} />
            <Route path="danh-muc" element={<DanhMucQuanTriPage />} />
            <Route path="tai-khoan" element={<TaiKhoanQuanTriPage />} />
            <Route path="cua-hang" element={<CuaHangQuanTriPage />} />
            <Route path="giao-dich" element={<GiaoDichQuanTriPage />} />
            <Route path="san-pham" element={<SanPhamQuanTriPage />} />
            <Route path="banner" element={<BannerQuanTriPage />} />
            <Route path="duyet-nguoi-ban" element={<DuyetNguoiBanPage />} />
            <Route path="khuyen-mai" element={<KhuyenMaiQuanTriPage />} />
            <Route path="khuyen-mai/them" element={<FormKhuyenMaiQuanTriPage />} />
            <Route path="khuyen-mai/:id/sua" element={<FormKhuyenMaiQuanTriPage />} />
            <Route path="voucher" element={<VoucherQuanTriPage />} />
            <Route path="*" element={<KhongTimThayPage />} />
          </Route>
        </Route>
      </Routes>
      </GioHangProvider>
      </XacThucProvider>
    </ThongBaoProvider>
  );
}
