import { Suspense, useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import DropdownMenu from '../components/ui/DropdownMenu.jsx';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import { useGioHang } from '../hooks/GioHangContext.jsx';
import useThongBao from '../hooks/useThongBao.js';
import Skeleton from '../components/ui/Skeleton.jsx';
import { DUONG_DAN, MENU_TAI_KHOAN, VAI_TRO } from '../utils/hangSo.js';
import './UserLayout.css';

export default function UserLayout() {
  const [daCuon, setDaCuon] = useState(false);
  const [moMenu, setMoMenu] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { taiKhoan, dangTai, dangXuat } = useXacThuc();
  const { soLuongSanPham } = useGioHang();
  const thongBao = useThongBao();
  const menuTaiKhoan = MENU_TAI_KHOAN(taiKhoan?.vaiTro?.includes(VAI_TRO.NGUOI_BAN));
  const duongDanGioHang = taiKhoan ? DUONG_DAN.GIO_HANG : DUONG_DAN.DANG_NHAP;
  const nhanGioHang = `Giỏ hàng, ${taiKhoan ? soLuongSanPham : 0} sản phẩm`;
  const huyHieuGioHang = taiKhoan && soLuongSanPham > 0 ? <span className="userCartBadge">{soLuongSanPham > 9 ? '9+' : soLuongSanPham}</span> : null;

  const xuLyDangXuat = async () => {
    try { await dangXuat(); navigate(DUONG_DAN.TRANG_CHU); setMoMenu(false); }
    catch (loi) { thongBao.loi(loi.message); }
  };

  useEffect(() => {
    const capNhat = () => setDaCuon(window.scrollY > 0);
    window.addEventListener('scroll', capNhat, { passive: true });
    capNhat();
    return () => window.removeEventListener('scroll', capNhat);
  }, []);

  useEffect(() => {
    setTuKhoa(new URLSearchParams(location.search).get('tuKhoa') || '');
  }, [location.pathname, location.search]);

  const timKiem = (event) => {
    event.preventDefault();
    const query = tuKhoa.trim();
    navigate(query ? DUONG_DAN.SAN_PHAM + '?tuKhoa=' + encodeURIComponent(query) : DUONG_DAN.SAN_PHAM);
    setMoMenu(false);
  };

  if (!dangTai && taiKhoan?.vaiTro?.includes(VAI_TRO.QUAN_TRI_VIEN)) {
    return <Navigate to={DUONG_DAN.QUAN_TRI_VIEN.TONG_QUAN} replace />;
  }

  return <div className="userLayout"><header className={'userHeader' + (daCuon ? ' userHeaderScrolled' : '')}><div className="userHeaderInner container"><Link to={DUONG_DAN.TRANG_CHU} className="userLogo"><img src="/logo-soopi.svg" alt="Soopi" /></Link><form className="userSearch" role="search" onSubmit={timKiem}><label className="chiDocBangManHinh" htmlFor="tim-san-pham">Tìm sản phẩm</label><input id="tim-san-pham" value={tuKhoa} onChange={(event) => setTuKhoa(event.target.value)} placeholder="Tìm sản phẩm" /><button type="submit" aria-label="Tìm sản phẩm"><Icon name="search" /></button></form><nav className="userHeaderLinks" aria-label="Tài khoản"><Link className="userCartLink" to={duongDanGioHang} state={!taiKhoan ? { quayLai: DUONG_DAN.GIO_HANG } : undefined} aria-label={nhanGioHang}><Icon name="cart" /> Giỏ hàng{huyHieuGioHang}</Link>{!dangTai && (taiKhoan ? <DropdownMenu label={<><Avatar hoTen={taiKhoan.hoTen} /><span>{taiKhoan.hoTen}</span></>}>{menuTaiKhoan.map((muc) => <Link key={muc.duongDan} role="menuitem" to={muc.duongDan}>{muc.nhan}</Link>)}<button role="menuitem" type="button" onClick={xuLyDangXuat}>Đăng xuất</button></DropdownMenu> : <><Link to={DUONG_DAN.DANG_NHAP}>Đăng nhập</Link><Link className="userDangKy" to={DUONG_DAN.DANG_KY}>Đăng ký</Link></>)}</nav><Link className="userCartMobile" to={duongDanGioHang} state={!taiKhoan ? { quayLai: DUONG_DAN.GIO_HANG } : undefined} aria-label={nhanGioHang}><Icon name="cart" size={24} />{huyHieuGioHang}</Link><button className="userMenuButton" type="button" aria-label="Mở menu" aria-expanded={moMenu} onClick={() => setMoMenu(!moMenu)}><Icon name={moMenu ? 'close' : 'menu'} size={24} /></button></div>{moMenu && <nav className="userMobileLinks" aria-label="Tài khoản">{taiKhoan ? <><span>{taiKhoan.hoTen}</span>{menuTaiKhoan.map((muc) => <Link key={muc.duongDan} to={muc.duongDan} onClick={() => setMoMenu(false)}>{muc.nhan}</Link>)}<button type="button" onClick={xuLyDangXuat}>Đăng xuất</button></> : <><Link to={DUONG_DAN.DANG_NHAP} onClick={() => setMoMenu(false)}>Đăng nhập</Link><Link to={DUONG_DAN.DANG_KY} onClick={() => setMoMenu(false)}>Đăng ký</Link></>}</nav>}</header><main className="userMain container"><Suspense fallback={<Skeleton variant="block" count={2} />}><Outlet /></Suspense></main><footer className="userFooter"><div className="container"><span>Soopi · Sàn thương mại điện tử đa người bán</span><Link to={DUONG_DAN.TRANG_CHU}>Trang chủ</Link></div></footer></div>;
}

