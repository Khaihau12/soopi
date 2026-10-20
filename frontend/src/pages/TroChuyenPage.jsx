import { useCallback, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import DanhSachCuocTroChuyen from '../components/DanhSachCuocTroChuyen.jsx';
import KhungTroChuyen from '../components/KhungTroChuyen.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import { layDanhSachCuocTroChuyenCuaToi, nguoiBanLayDanhSachCuocTroChuyen } from '../services/cuocTroChuyen.api.js';
import { layGocMayChuApi } from '../services/httpClient.js';
import './TroChuyenPage.css';

export default function TroChuyenPage({ nguoiBan = false }) {
  const { taiKhoan } = useXacThuc();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const cuaHangId = nguoiBan ? '' : params.get('cuaHangId') || '';
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [trang, setTrang] = useState(1);
  const [cuocDaChon, setCuocDaChon] = useState(null);
  const [moKhungTin, setMoKhungTin] = useState(Boolean(cuaHangId));
  const [lanTai, setLanTai] = useState(0);
  const [tinMoi, setTinMoi] = useState(null);
  const [lanDongBo, setLanDongBo] = useState(0);
  const [daKetNoi, setDaKetNoi] = useState(false);

  const taiDanhSach = useCallback(async (hienDangTai = false) => {
    if (hienDangTai) setDangTai(true);
    try {
      const goi = nguoiBan ? nguoiBanLayDanhSachCuocTroChuyen : layDanhSachCuocTroChuyenCuaToi;
      const data = await goi({ trang, gioiHan: 20 });
      setDuLieu(data);
      setLoi('');
      setCuocDaChon((cu) => cu && (data.danhSach.find((item) => item._id === cu._id) || cu));
    } catch (loiApi) { setLoi(loiApi.message); }
    finally { if (hienDangTai) setDangTai(false); }
  }, [nguoiBan, trang]);

  useEffect(() => { taiDanhSach(true); }, [taiDanhSach, lanTai]);
  useEffect(() => {
    if (!taiKhoan?._id) return undefined;
    const socket = io(layGocMayChuApi(), { withCredentials: true });
    const ketNoi = () => { setDaKetNoi(true); setLanDongBo((lan) => lan + 1); void taiDanhSach(); };
    const matKetNoi = () => setDaKetNoi(false);
    const nhanTin = (tin) => {
      setTinMoi(tin);
      if (trang === 1) void taiDanhSach();
      else setTrang(1);
    };
    socket.on('connect', ketNoi);
    socket.on('disconnect', matKetNoi);
    socket.on('connect_error', matKetNoi);
    socket.on('tin-nhan-moi', nhanTin);
    return () => { socket.disconnect(); };
  }, [taiKhoan?._id, taiDanhSach, trang]);
  useEffect(() => {
    if (!cuaHangId) return undefined;
    let conHieuLuc = true;
    layDanhSachCuocTroChuyenCuaToi({ cuaHangId, gioiHan: 1 })
      .then((data) => { if (conHieuLuc) { setCuocDaChon(data.danhSach[0] || null); setMoKhungTin(true); } })
      .catch((loiApi) => { if (conHieuLuc) setLoi(loiApi.message); });
    return () => { conHieuLuc = false; };
  }, [cuaHangId]);

  const chonCuoc = (cuoc) => {
    setCuocDaChon(cuoc);
    setMoKhungTin(true);
    if (cuaHangId) setParams({}, { replace: true });
  };
  const vuaTao = (cuoc) => {
    setCuocDaChon(cuoc);
    setMoKhungTin(true);
    taiDanhSach();
  };
  const quayLai = () => {
    setMoKhungTin(false);
    if (cuaHangId) setParams({}, { replace: true });
  };
  const tenDoiPhuong = nguoiBan ? cuocDaChon?.nguoiDung?.hoTen : cuocDaChon?.cuaHang?.tenCuaHang
    || (cuaHangId ? location.state?.tenCuaHang || 'Cửa hàng' : '');
  const hienKhung = Boolean(cuocDaChon || cuaHangId);

  return <div className={`troChuyenPage ${moKhungTin ? 'moKhungTin' : ''}`}>
    <header className="troChuyenPageDau"><h1>Trao đổi</h1><p>{nguoiBan ? 'Tin nhắn giữa cửa hàng và người mua.' : 'Trao đổi với cửa hàng về sản phẩm hoặc đơn hàng.'}</p></header>
    <div className="troChuyenBoCuc">
      <aside className="troChuyenCotDanhSach" aria-label="Danh sách cuộc trò chuyện">
        <h2>Cuộc trò chuyện</h2>
        <DanhSachCuocTroChuyen duLieu={duLieu} dangTai={dangTai} loi={loi} taiLai={() => setLanTai((lan) => lan + 1)}
          nguoiBan={nguoiBan} daChonId={cuocDaChon?._id} onChon={chonCuoc} onTrang={setTrang} />
      </aside>
      <div className="troChuyenCotTin">{hienKhung
        ? <KhungTroChuyen key={cuocDaChon?._id || cuaHangId} cuoc={cuocDaChon} cuaHangId={cuaHangId}
          tenDoiPhuong={tenDoiPhuong} taiKhoanId={taiKhoan?._id} onTao={vuaTao} onGui={taiDanhSach} onQuayLai={quayLai}
          tinMoi={tinMoi} lanDongBo={lanDongBo} daKetNoi={daKetNoi} />
        : <EmptyState icon="chat" title="Chọn một cuộc trò chuyện" description="Chọn từ danh sách bên trái để xem và gửi tin nhắn." />}</div>
    </div>
  </div>;
}
