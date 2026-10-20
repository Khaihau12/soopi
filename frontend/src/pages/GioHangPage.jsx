import { useState } from 'react';
import { Link } from 'react-router-dom';
import DongGioHang from '../components/DongGioHang.jsx';
import TomTatGioHang from '../components/TomTatGioHang.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { useGioHang } from '../hooks/GioHangContext.jsx';
import useThongBao from '../hooks/useThongBao.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './GioHangPage.css';

export default function GioHangPage() {
  const { gioHang, dangTai, loi, taiLai, doiSoLuong, xoaDong, chonDong } = useGioHang();
  const thongBao = useThongBao();
  const [dangGui, setDangGui] = useState('');
  const danhSach = gioHang?.danhSach || [];
  const muaDuoc = danhSach.filter((dong) => dong.coTheMua);
  const soDongDaChon = muaDuoc.filter((dong) => dong.duocChon).length;
  const nhom = new Map();
  for (const dong of danhSach) {
    const id = String(dong.cuaHang?._id || 'khong-co-cua-hang');
    if (!nhom.has(id)) nhom.set(id, { cuaHang: dong.cuaHang, danhSach: [] });
    nhom.get(id).danhSach.push(dong);
  }

  const thucHien = async (khoa, ham, thongBaoThanhCong) => {
    if (dangGui) return;
    setDangGui(khoa);
    try { await ham(); if (thongBaoThanhCong) thongBao.thanhCong(thongBaoThanhCong); }
    catch (loiApi) { thongBao.loi(loiApi.message); if (loiApi.status === 409) await taiLai(); }
    finally { setDangGui(''); }
  };
  const thayDoiSoLuong = (id, soLuong) => thucHien(id, () => doiSoLuong(id, soLuong));
  const xoa = (id) => thucHien(id, () => xoaDong(id), 'Đã xóa khỏi giỏ hàng');
  const chon = (duocChon, ids) => thucHien('chon', () => chonDong(duocChon, ids));

  return <div className="gioHangPage"><h1>Giỏ hàng</h1>
    {dangTai && !gioHang ? <Skeleton variant="block" count={3} /> : loi && !gioHang ? <ErrorState message={loi} taiLai={taiLai} /> : !danhSach.length ? <EmptyState icon="cart" title="Giỏ hàng đang trống" description="Chọn sản phẩm bạn muốn mua để bắt đầu." actionLabel="Xem sản phẩm" actionTo={DUONG_DAN.SAN_PHAM} /> : <div className="gioHangBoCuc">
      <div className="gioHangDanhSach">
        {loi && <div role="alert" className="gioHangLoi">{loi} <button type="button" onClick={taiLai}>Thử lại</button></div>}
        <div className="gioHangChonTatCa"><label><input type="checkbox" checked={muaDuoc.length > 0 && soDongDaChon === muaDuoc.length} disabled={!muaDuoc.length || Boolean(dangGui)} onChange={(event) => chon(event.target.checked)} /> Chọn tất cả</label><span>{soDongDaChon} / {muaDuoc.length} sản phẩm mua được</span></div>
        {[...nhom.entries()].map(([id, nhomCuaHang]) => {
          const cacDongMuaDuoc = nhomCuaHang.danhSach.filter((dong) => dong.coTheMua);
          const tatCaDaChon = cacDongMuaDuoc.length > 0 && cacDongMuaDuoc.every((dong) => dong.duocChon);
          return <section key={id} className="gioHangNhom"><header className="gioHangNhomHeader"><label><input type="checkbox" checked={tatCaDaChon} disabled={!cacDongMuaDuoc.length || Boolean(dangGui)} onChange={(event) => chon(event.target.checked, cacDongMuaDuoc.map((dong) => dong._id))} /> <strong>{nhomCuaHang.cuaHang?.tenCuaHang || 'Cửa hàng không còn tồn tại'}</strong></label></header>
            {nhomCuaHang.danhSach.map((dong) => <DongGioHang key={dong._id} dong={dong} dangGui={Boolean(dangGui)} onChon={(dongId, duocChon) => chon(duocChon, [dongId])} onSoLuong={thayDoiSoLuong} onXoa={xoa} />)}
          </section>;
        })}
        <Link className="gioHangMuaTiep" to={DUONG_DAN.SAN_PHAM}>Xem thêm sản phẩm</Link>
      </div>
      <TomTatGioHang tongGiaTri={gioHang.gioHang.tongGiaTri} soDongDaChon={soDongDaChon} />
    </div>}
  </div>;
}
