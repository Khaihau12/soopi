import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as xacThucApi from '../services/xacThuc.api.js';
import { dangKyXuLyHetPhien } from '../services/httpClient.js';

const XacThucContext = createContext(null);

export function XacThucProvider({ children }) {
  const [taiKhoan, setTaiKhoan] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const yeuCauBanDau = useRef(null);

  useEffect(() => {
    let conHieuLuc = true;
    const huyXuLy = dangKyXuLyHetPhien(() => setTaiKhoan(null));
    if (!yeuCauBanDau.current) yeuCauBanDau.current = xacThucApi.layThongTinToi();
    yeuCauBanDau.current
      .then(({ taiKhoan: taiKhoanHienTai }) => { if (conHieuLuc) setTaiKhoan(taiKhoanHienTai); })
      .catch(() => { if (conHieuLuc) setTaiKhoan(null); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; huyXuLy(); };
  }, []);

  useEffect(() => {
    if (!taiKhoan) return undefined;
    let conHieuLuc = true;
    let dangLamMoi = false;
    const lamMoiKhiQuayLai = async () => {
      if (document.visibilityState !== 'visible' || dangLamMoi) return;
      dangLamMoi = true;
      try {
        const { taiKhoan: moi } = await xacThucApi.layThongTinToi();
        if (conHieuLuc) setTaiKhoan(moi);
      } catch (loi) {
        if (conHieuLuc && [401, 403].includes(loi.status)) setTaiKhoan(null);
      } finally { dangLamMoi = false; }
    };
    window.addEventListener('focus', lamMoiKhiQuayLai);
    document.addEventListener('visibilitychange', lamMoiKhiQuayLai);
    return () => {
      conHieuLuc = false;
      window.removeEventListener('focus', lamMoiKhiQuayLai);
      document.removeEventListener('visibilitychange', lamMoiKhiQuayLai);
    };
  }, [taiKhoan]);

  const dangNhap = useCallback(async (duLieu) => {
    const { taiKhoan: taiKhoanMoi } = await xacThucApi.dangNhap(duLieu);
    setTaiKhoan(taiKhoanMoi);
    return taiKhoanMoi;
  }, []);

  const dangXuat = useCallback(async () => {
    await xacThucApi.dangXuat();
    setTaiKhoan(null);
  }, []);

  const coVaiTro = useCallback((vaiTro) => taiKhoan?.vaiTro?.includes(vaiTro) ?? false, [taiKhoan]);

  return <XacThucContext.Provider value={{ taiKhoan, dangTai, dangNhap, dangXuat, capNhatTaiKhoan: setTaiKhoan, coVaiTro }}>
    {children}
  </XacThucContext.Provider>;
}

export function useXacThuc() {
  const giaTri = useContext(XacThucContext);
  if (!giaTri) throw new Error('useXacThuc cần được dùng trong XacThucProvider');
  return giaTri;
}
