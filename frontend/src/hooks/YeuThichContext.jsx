import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useXacThuc } from './XacThucContext.jsx';
import { boLuuSanPhamYeuThich, layCacIdDaLuu, luuSanPhamYeuThich } from '../services/sanPhamYeuThich.api.js';
import { VAI_TRO } from '../utils/hangSo.js';

const YeuThichContext = createContext(null);

export function YeuThichProvider({ children }) {
  const { taiKhoan } = useXacThuc();
  const idTaiKhoan = taiKhoan?._id;
  const laQuanTri = taiKhoan?.vaiTro?.includes(VAI_TRO.QUAN_TRI_VIEN);
  const [daLuu, setDaLuu] = useState(new Set());
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);

  useEffect(() => {
    if (!idTaiKhoan || laQuanTri) { setDaLuu(new Set()); setDangTai(false); return undefined; }
    let conHieuLuc = true;
    setDaLuu(new Set()); setDangTai(true); setLoi('');
    layCacIdDaLuu().then((data) => { if (conHieuLuc) setDaLuu(new Set(data.danhSachId)); })
      .catch((loiApi) => { if (conHieuLuc) setLoi(loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [idTaiKhoan, laQuanTri, lanTai]);

  const chuyenTrangThai = useCallback(async (id) => {
    const hienDaLuu = daLuu.has(String(id));
    const ketQua = hienDaLuu ? await boLuuSanPhamYeuThich(id) : await luuSanPhamYeuThich(id);
    setDaLuu((cu) => {
      const moi = new Set(cu);
      if (ketQua.daLuu) moi.add(String(id)); else moi.delete(String(id));
      return moi;
    });
    return ketQua.daLuu;
  }, [daLuu]);

  return <YeuThichContext.Provider value={{ daLuu, dangTai, loi, taiLai: () => setLanTai((cu) => cu + 1), chuyenTrangThai }}>
    {children}
  </YeuThichContext.Provider>;
}

export function useYeuThich() {
  const context = useContext(YeuThichContext);
  if (!context) throw new Error('useYeuThich cần được dùng trong YeuThichProvider');
  return context;
}
