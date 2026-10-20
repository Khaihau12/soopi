import { useEffect, useState } from 'react';
import Skeleton from '../components/ui/Skeleton.jsx';
import { nguoiBanLayCuaHang } from '../services/cuaHang.api.js';
import { MENU_NGUOI_BAN, TRANG_THAI_HOAT_DONG_CUA_HANG } from '../utils/hangSo.js';
import QuanLyLayout from './QuanLyLayout.jsx';
import './NguoiBanLayout.css';

export default function NguoiBanLayout() {
  const [cuaHang, setCuaHang] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loiTai, setLoiTai] = useState('');

  const taiLai = async () => {
    setDangTai(true); setLoiTai('');
    try {
      const data = await nguoiBanLayCuaHang();
      setCuaHang(data.cuaHang);
    } catch (loi) { setLoiTai(loi.message); }
    finally { setDangTai(false); }
  };
  useEffect(() => { taiLai(); }, []);

  const noiDungSidebar = <div className="nguoiBanTenCuaHang" aria-label="Cửa hàng của bạn">
    {dangTai ? <Skeleton /> : cuaHang ? <strong>{cuaHang.tenCuaHang}</strong> : <span>Chưa tải được cửa hàng</span>}
  </div>;
  const canhBao = cuaHang?.trangThaiHoatDong === TRANG_THAI_HOAT_DONG_CUA_HANG.NGUNG_HOAT_DONG
    ? <div className="nguoiBanCanhBao" role="status">Cửa hàng đang ngừng hoạt động nên sản phẩm không hiển thị với khách hàng. Vui lòng liên hệ quản trị viên.</div>
    : null;

  return <QuanLyLayout tieuDe="Khu vực Người bán" menu={MENU_NGUOI_BAN} veMuaSam
    noiDungSidebar={noiDungSidebar} canhBao={canhBao}
    outletContext={{ cuaHang, dangTai, loiTai, taiLai, capNhatCuaHang: setCuaHang }} />;
}
