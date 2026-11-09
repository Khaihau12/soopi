import { useState } from 'react';
import { useGioHang } from './GioHangContext.jsx';
import useThongBao from './useThongBao.js';
import { muaLaiDonHang } from '../services/donHang.api.js';

export default function useMuaLai() {
  const [dangMuaLaiId, setDangMuaLaiId] = useState(null);
  const [ketQuaMuaLai, setKetQuaMuaLai] = useState(null);
  const { taiLai } = useGioHang();
  const thongBao = useThongBao();

  const muaLai = async (id) => {
    if (dangMuaLaiId) return;
    setDangMuaLaiId(id);
    try {
      const ketQua = await muaLaiDonHang(id);
      setKetQuaMuaLai(ketQua);
      if (ketQua.daThem.length) await taiLai().catch(() => {});
    } catch (loi) {
      await taiLai().catch(() => {});
      thongBao.loi(loi.message);
    } finally { setDangMuaLaiId(null); }
  };

  return { dangMuaLaiId, ketQuaMuaLai, dongKetQua: () => setKetQuaMuaLai(null), muaLai };
}
