import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar.jsx';
import DropdownMenu from '../components/ui/DropdownMenu.jsx';
import Icon from '../components/ui/Icon.jsx';
import { DUONG_DAN } from '../utils/hangSo.js';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import useThongBao from '../hooks/useThongBao.js';
import DoiMatKhauForm from '../components/DoiMatKhauForm.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import './QuanLyLayout.css';

const FOCUS = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function QuanLyLayout({ tieuDe, menu, veMuaSam = false, noiDungSidebar, canhBao, outletContext }) {
  const [mo, setMo] = useState(false);
  const [moDoiMatKhau, setMoDoiMatKhau] = useState(false);
  const sidebarRef = useRef(null);
  const nutMoRef = useRef(null);
  const { taiKhoan, dangXuat } = useXacThuc();
  const thongBao = useThongBao();
  const navigate = useNavigate();

  const xuLyDangXuat = async () => {
    try { await dangXuat(); navigate(DUONG_DAN.TRANG_CHU); }
    catch (loi) { thongBao.loi(loi.message); }
  };

  useEffect(() => {
    if (!mo) return undefined;
    const truoc = document.activeElement;
    const overflowTruoc = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebarRef.current?.querySelector(FOCUS)?.focus();
    const xuLyPhim = (event) => {
      if (event.key === 'Escape') { setMo(false); return; }
      if (event.key !== 'Tab') return;
      const cacMuc = Array.from(sidebarRef.current?.querySelectorAll(FOCUS) || []);
      if (!cacMuc.length) return;
      const dau = cacMuc[0];
      const cuoi = cacMuc[cacMuc.length - 1];
      if (event.shiftKey && document.activeElement === dau) { event.preventDefault(); cuoi.focus(); }
      else if (!event.shiftKey && document.activeElement === cuoi) { event.preventDefault(); dau.focus(); }
    };
    document.addEventListener('keydown', xuLyPhim);
    return () => { document.removeEventListener('keydown', xuLyPhim); document.body.style.overflow = overflowTruoc; truoc?.focus?.(); };
  }, [mo]);

  const sidebar = <aside ref={sidebarRef} className={'quanLySidebar' + (mo ? ' quanLySidebarOpen' : '')} aria-label={'Điều hướng ' + tieuDe}><div className="quanLyBrand"><Link to={DUONG_DAN.TRANG_CHU} onClick={() => setMo(false)}><img src="/logo-soopi.svg" alt="Soopi" /></Link><span>{tieuDe}</span><button type="button" className="quanLyClose" aria-label="Đóng menu" onClick={() => setMo(false)}><Icon name="close" /></button></div>{noiDungSidebar}<nav aria-label={'Menu ' + tieuDe}>{menu.map((muc) => <NavLink key={muc.duongDan} to={muc.duongDan} end={muc.duongDan === menu[0].duongDan} onClick={() => setMo(false)} className={({ isActive }) => 'quanLyLink' + (isActive ? ' quanLyLinkActive' : '')}><Icon name={muc.bieuTuong} /><span>{muc.nhan}</span></NavLink>)}</nav>{veMuaSam && <Link className="quanLyVeMuaSam" to={DUONG_DAN.TRANG_CHU} onClick={() => setMo(false)}>Về trang mua sắm</Link>}</aside>;

  return <div className="quanLyLayout">{mo && <button type="button" className="quanLyBackdrop" aria-label="Đóng menu" onClick={() => setMo(false)} />}{sidebar}<div className="quanLyMain"><header className="quanLyTopbar"><button ref={nutMoRef} className="quanLyMenuButton" type="button" aria-label="Mở menu" aria-expanded={mo} onClick={() => setMo(true)}><Icon name="menu" /></button><span>{tieuDe}</span><div className="quanLyTopbarAccount"><DropdownMenu label={<><Avatar hoTen={taiKhoan?.hoTen || ''} /><span>{taiKhoan?.hoTen}</span></>}><button role="menuitem" type="button" onClick={() => setMoDoiMatKhau(true)}>Đổi mật khẩu</button><button role="menuitem" type="button" onClick={xuLyDangXuat}>Đăng xuất</button></DropdownMenu></div></header>{canhBao}<main className="quanLyContent"><Suspense fallback={<Skeleton variant="block" count={2} />}><Outlet context={outletContext} /></Suspense></main></div><DoiMatKhauForm open={moDoiMatKhau} onClose={() => setMoDoiMatKhau(false)} /></div>;
}
