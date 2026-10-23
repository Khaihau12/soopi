import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useXacThuc } from './XacThucContext.jsx';
import * as api from '../services/gioHang.api.js';
import { VAI_TRO } from '../utils/hangSo.js';

const GioHangContext = createContext(null);

export function GioHangProvider({ children }) {
  const { taiKhoan, dangTai: dangTaiXacThuc } = useXacThuc();
  const taiKhoanIdRef = useRef(taiKhoan?._id);
  taiKhoanIdRef.current = taiKhoan?._id;
  const lanYeuCauRef = useRef(0);
  const [gioHang, setGioHang] = useState(null);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState('');

  const taiLai = useCallback(async () => {
    const id = taiKhoan?._id;
    if (!id || taiKhoan?.vaiTro?.includes(VAI_TRO.QUAN_TRI_VIEN)) return;
    const lan = ++lanYeuCauRef.current;
    setDangTai(true); setLoi('');
    try { const data = await api.layGioHang(); if (taiKhoanIdRef.current === id && lanYeuCauRef.current === lan) setGioHang(data); }
    catch (loiApi) { if (taiKhoanIdRef.current === id && lanYeuCauRef.current === lan) setLoi(loiApi.message); }
    finally { if (taiKhoanIdRef.current === id && lanYeuCauRef.current === lan) setDangTai(false); }
  }, [taiKhoan?._id]);

  useEffect(() => {
    const lan = ++lanYeuCauRef.current;
    if (dangTaiXacThuc) return undefined;
    if (!taiKhoan || taiKhoan.vaiTro?.includes(VAI_TRO.QUAN_TRI_VIEN)) {
      setGioHang(null); setLoi(''); setDangTai(false); return undefined;
    }
    let conHieuLuc = true;
    setGioHang(null);
    setDangTai(true); setLoi('');
    api.layGioHang().then((data) => { if (conHieuLuc && lanYeuCauRef.current === lan) setGioHang(data); })
      .catch((loiApi) => { if (conHieuLuc && lanYeuCauRef.current === lan) setLoi(loiApi.message); })
      .finally(() => { if (conHieuLuc && lanYeuCauRef.current === lan) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [taiKhoan?._id, dangTaiXacThuc]);

  const thayDoiGioHang = async (yeuCau) => {
    const taiKhoanId = taiKhoanIdRef.current;
    const lan = ++lanYeuCauRef.current;
    try {
      const data = await yeuCau();
      if (taiKhoanIdRef.current === taiKhoanId && lanYeuCauRef.current === lan) setGioHang(data);
      return data;
    } finally {
      if (taiKhoanIdRef.current === taiKhoanId && lanYeuCauRef.current === lan) setDangTai(false);
    }
  };
  const themVaoGio = (sanPhamId, soLuong) => thayDoiGioHang(() => api.themSanPhamVaoGio(sanPhamId, soLuong));
  const doiSoLuong = (id, soLuong) => thayDoiGioHang(() => api.capNhatSoLuongDongGio(id, soLuong));
  const xoaDong = (id) => thayDoiGioHang(() => api.xoaDongGio(id));
  const chonDong = (duocChon, ids) => thayDoiGioHang(() => api.chonDongGio(duocChon, ids));

  return <GioHangContext.Provider value={{ gioHang, soLuongSanPham: gioHang?.soLuongSanPham || 0, dangTai, loi, taiLai, themVaoGio, doiSoLuong, xoaDong, chonDong }}>
    {children}
  </GioHangContext.Provider>;
}

export function useGioHang() {
  const giaTri = useContext(GioHangContext);
  if (!giaTri) throw new Error('useGioHang cần được dùng trong GioHangProvider');
  return giaTri;
}
