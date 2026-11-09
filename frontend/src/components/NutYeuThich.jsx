import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './ui/Icon.jsx';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import { useYeuThich } from '../hooks/YeuThichContext.jsx';
import useThongBao from '../hooks/useThongBao.js';
import { DUONG_DAN, VAI_TRO } from '../utils/hangSo.js';
import './NutYeuThich.css';

export default function NutYeuThich({ sanPhamId, gon = false }) {
  const { taiKhoan } = useXacThuc();
  const { daLuu, dangTai, loi, taiLai, chuyenTrangThai } = useYeuThich();
  const [dangLuu, setDangLuu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const thongBao = useThongBao();
  if (taiKhoan?.vaiTro?.includes(VAI_TRO.QUAN_TRI_VIEN)) return null;
  const daYeuThich = daLuu.has(String(sanPhamId));
  const nhan = daYeuThich ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích';
  const xuLy = async () => {
    if (!taiKhoan) {
      navigate(DUONG_DAN.DANG_NHAP, { state: { quayLai: location.pathname + location.search } });
      return;
    }
    if (loi) { taiLai(); thongBao.loi('Đang tải lại danh sách yêu thích. Vui lòng bấm lại sau giây lát.'); return; }
    if (dangLuu || dangTai) return;
    setDangLuu(true);
    try { const moi = await chuyenTrangThai(sanPhamId); thongBao.thanhCong(moi ? 'Đã lưu sản phẩm yêu thích' : 'Đã bỏ lưu sản phẩm'); }
    catch (loiApi) { thongBao.loi(loiApi.message); }
    finally { setDangLuu(false); }
  };
  return <button type="button" className={'nutYeuThich' + (gon ? ' nutYeuThichGon' : '')}
    aria-label={nhan} aria-pressed={daYeuThich} title={nhan} disabled={dangLuu || (Boolean(taiKhoan) && dangTai)}
    onClick={xuLy}><Icon name="heart" size={20} />{!gon && <span>{nhan}</span>}</button>;
}
