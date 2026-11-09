import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Icon from './ui/Icon.jsx';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import { demThongBaoChuaDoc } from '../services/thongBao.api.js';
import { layGocMayChuApi } from '../services/httpClient.js';
import './NutThongBao.css';

export default function NutThongBao({ to }) {
  const { taiKhoan } = useXacThuc();
  const location = useLocation();
  const [soChuaDoc, setSoChuaDoc] = useState(0);

  useEffect(() => {
    if (!taiKhoan?._id) { setSoChuaDoc(0); return undefined; }
    let conHieuLuc = true;
    const taiSo = () => demThongBaoChuaDoc().then((data) => { if (conHieuLuc) setSoChuaDoc(data.soChuaDoc); }).catch(() => {});
    void taiSo();
    const socket = io(layGocMayChuApi(), { withCredentials: true });
    const nhanThongBao = () => { void taiSo(); window.dispatchEvent(new Event('soopi-thong-bao-moi')); };
    socket.on('thong-bao-moi', nhanThongBao);
    socket.on('connect', taiSo);
    window.addEventListener('focus', taiSo);
    window.addEventListener('soopi-thong-bao-doi', taiSo);
    return () => { conHieuLuc = false; socket.disconnect(); window.removeEventListener('focus', taiSo);
      window.removeEventListener('soopi-thong-bao-doi', taiSo); };
  }, [taiKhoan?._id]);

  useEffect(() => {
    if (!taiKhoan?._id) return;
    demThongBaoChuaDoc().then((data) => setSoChuaDoc(data.soChuaDoc)).catch(() => {});
  }, [location.pathname, taiKhoan?._id]);

  if (!taiKhoan) return null;
  return <Link className="nutThongBao" to={to} aria-label={`Thông báo, ${soChuaDoc} chưa đọc`} title="Thông báo">
    <Icon name="bell" size={22} /><span className="nutThongBaoChu">Thông báo</span>
    {soChuaDoc > 0 && <span className="nutThongBaoSo" aria-hidden="true">{soChuaDoc > 99 ? '99+' : soChuaDoc}</span>}
  </Link>;
}
