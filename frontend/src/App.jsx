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
import QuenMatKhauPage from './pages/QuenMatKhauPage.jsx';
import DatLaiMatKhauPage from './pages/DatLaiMatKhauPage.jsx';
import HoSoPage from './pages/HoSoPage.jsx';
import TrangChuPage from './pages/TrangChuPage.jsx';
import DanhSachSanPhamPage from './pages/DanhSachSanPhamPage.jsx';
import ChiTietSanPhamPage from './pages/ChiTietSanPhamPage.jsx';
import DangKyNguoiBanPage from './pages/DangKyNguoiBanPage.jsx';
import DanhMucQuanTriPage from './pages/quanTriVien/DanhMucQuanTriPage.jsx';
import DuyetNguoiBanPage from './pages/quanTriVien/DuyetNguoiBanPage.jsx';
import CuaHangNguoiBanPage from './pages/nguoiBan/CuaHangNguoiBanPage.jsx';
const TongQuanNguoiBanPage = lazy(() => import('./pages/nguoiBan/TongQuanNguoiBanPage.jsx'));
const BaoCaoNguoiBanPage = lazy(() => import('./pages/nguoiBan/BaoCaoNguoiBanPage.jsx'));
const TongQuanQuanTriPage = lazy(() => import('./pages/quanTriVien/TongQuanQuanTriPage.jsx'));
const BaoCaoQuanTriPage = lazy(() => import('./pages/quanTriVien/BaoCaoQuanTriPage.jsx'));
import SanPhamNguoiBanPage from './pages/nguoiBan/SanPhamNguoiBanPage.jsx';
import FormSanPhamPage from './pages/nguoiBan/FormSanPhamPage.jsx';
import KhuyenMaiNguoiBanPage from './pages/nguoiBan/KhuyenMaiNguoiBanPage.jsx';
import FormKhuyenMaiPage from './pages/nguoiBan/FormKhuyenMaiPage.jsx';
import KhuyenMaiQuanTriPage from './pages/quanTriVien/KhuyenMaiQuanTriPage.jsx';
import FormKhuyenMaiQuanTriPage from './pages/quanTriVien/FormKhuyenMaiQuanTriPage.jsx';
import VoucherNguoiBanPage from './pages/nguoiBan/VoucherNguoiBanPage.jsx';
import VoucherQuanTriPage from './pages/quanTriVien/VoucherQuanTriPage.jsx';
import GioHangPage from './pages/GioHangPage.jsx';
import ThanhToanPage from './pages/ThanhToanPage.jsx';
import KetQuaThanhToanPage from './pages/KetQuaThanhToanPage.jsx';
import DonHangPage from './pages/DonHangPage.jsx';
import ChiTietDonHangPage from './pages/ChiTietDonHangPage.jsx';
import DonHangNguoiBanPage from './pages/nguoiBan/DonHangNguoiBanPage.jsx';
import ChiTietDonHangNguoiBanPage from './pages/nguoiBan/ChiTietDonHangNguoiBanPage.jsx';
import DanhGiaNguoiBanPage from './pages/nguoiBan/DanhGiaNguoiBanPage.jsx';
import DoiTraKhieuNaiPage from './pages/DoiTraKhieuNaiPage.jsx';
import DoiTraKhieuNaiNguoiBanPage from './pages/nguoiBan/DoiTraKhieuNaiNguoiBanPage.jsx';
import TroChuyenPage from './pages/TroChuyenPage.jsx';
import TroChuyenNguoiBanPage from './pages/nguoiBan/TroChuyenNguoiBanPage.jsx';
import TaiKhoanQuanTriPage from './pages/quanTriVien/TaiKhoanQuanTriPage.jsx';
import CuaHangQuanTriPage from './pages/quanTriVien/CuaHangQuanTriPage.jsx';
import GiaoDichQuanTriPage from './pages/quanTriVien/GiaoDichQuanTriPage.jsx';
import SanPhamQuanTriPage from './pages/quanTriVien/SanPhamQuanTriPage.jsx';
import BannerQuanTriPage from './pages/quanTriVien/BannerQuanTriPage.jsx';
import { GioHangProvider } from './hooks/GioHangContext.jsx';
import { DUONG_DAN, VAI_TRO } from './utils/hangSo.js';

export default function App() {
  return (
    <ThongBaoProvider>
      <XacThucProvider>
      <GioHangProvider>
      <Routes>
        <Route path={DUONG_DAN.DANG_NHAP} element={<DangNhapPage />} />
        <Route path={DUONG_DAN.DANG_KY} element={<DangKyPage />} />
        <Route path={DUONG_DAN.QUEN_MAT_KHAU} element={<QuenMatKhauPage />} />
        <Route path={DUONG_DAN.DAT_LAI_MAT_KHAU} element={<DatLaiMatKhauPage />} />
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
