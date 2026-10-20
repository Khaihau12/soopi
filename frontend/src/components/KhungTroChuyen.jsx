import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import BongBongTinNhan from './BongBongTinNhan.jsx';
import Button from './ui/Button.jsx';
import ErrorState from './ui/ErrorState.jsx';
import Skeleton from './ui/Skeleton.jsx';
import { guiTinNhan, layTinNhan, taoCuocTroChuyenVaGuiTinNhan } from '../services/cuocTroChuyen.api.js';
import { dinhDangNgay } from '../utils/dinhDang.js';

const hopTin = (cu, moi) => {
  const theoId = new Map([...cu, ...moi].map((tin) => [tin._id, tin]));
  return [...theoId.values()].sort((a, b) => new Date(a.thoiGianGui) - new Date(b.thoiGianGui) || a._id.localeCompare(b._id));
};

export default function KhungTroChuyen({ cuoc, cuaHangId, tenDoiPhuong, taiKhoanId, onTao, onGui, onQuayLai, tinMoi, lanDongBo, daKetNoi }) {
  const [danhSach, setDanhSach] = useState([]);
  const [coTinCuHon, setCoTinCuHon] = useState(false);
  const [dangTai, setDangTai] = useState(false);
  const [dangTaiCu, setDangTaiCu] = useState(false);
  const [loi, setLoi] = useState('');
  const [noiDung, setNoiDung] = useState('');
  const [loiGui, setLoiGui] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [lanTai, setLanTai] = useState(0);
  const vungTinRef = useRef(null);
  const noiDungRef = useRef(null);
  const tinRef = useRef([]);
  const dangDongBoRef = useRef(false);
  const cuonXuongRef = useRef(false);
  const giuCuonRef = useRef(null);
  const cuocId = cuoc?._id;
  tinRef.current = danhSach;

  useEffect(() => {
    setDanhSach([]); setCoTinCuHon(false); setNoiDung(''); setLoiGui(''); setLoi('');
    if (!cuocId) { setDangTai(false); return undefined; }
    let conHieuLuc = true;
    cuonXuongRef.current = true;
    setDangTai(true);
    layTinNhan(cuocId).then((data) => {
      if (conHieuLuc) { cuonXuongRef.current = true; setDanhSach((cu) => hopTin(data.danhSach, cu)); setCoTinCuHon(data.coTinCuHon); }
    }).catch((loiApi) => { if (conHieuLuc) setLoi(loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [cuocId, lanTai]);

  useEffect(() => {
    if (!cuocId) return undefined;
    if (!lanDongBo) return undefined;
    let conHieuLuc = true;
    const dongBoTinMoi = async () => {
      if (dangDongBoRef.current) return;
      dangDongBoRef.current = true;
      try {
        const tinCuoi = tinRef.current.at(-1);
        const data = await layTinNhan(cuocId, tinCuoi ? { sau: tinCuoi.thoiGianGui, gioiHan: 100 } : {});
        if (conHieuLuc && data.danhSach.length) {
          const vung = vungTinRef.current;
          cuonXuongRef.current = Boolean(vung && vung.scrollHeight - vung.scrollTop - vung.clientHeight < 80);
          setDanhSach((cu) => hopTin(cu, data.danhSach));
        }
      } catch (loiApi) { if (conHieuLuc) setLoi(loiApi.message); }
      finally { dangDongBoRef.current = false; }
    };
    void dongBoTinMoi();
    return () => { conHieuLuc = false; };
  }, [cuocId, lanDongBo]);

  useEffect(() => {
    if (!cuocId || String(tinMoi?.cuocTroChuyenId) !== String(cuocId)) return;
    const vung = vungTinRef.current;
    cuonXuongRef.current = Boolean(vung && vung.scrollHeight - vung.scrollTop - vung.clientHeight < 80);
    setDanhSach((cu) => hopTin(cu, [tinMoi]));
  }, [cuocId, tinMoi]);

  useLayoutEffect(() => {
    const vung = vungTinRef.current;
    if (!vung) return;
    if (giuCuonRef.current) {
      vung.scrollTop = giuCuonRef.current.scrollTop + vung.scrollHeight - giuCuonRef.current.scrollHeight;
      giuCuonRef.current = null;
    } else if (cuonXuongRef.current) vung.scrollTop = vung.scrollHeight;
    cuonXuongRef.current = false;
  }, [danhSach]);

  const xemTinCu = async () => {
    if (dangTaiCu || !danhSach.length) return;
    setDangTaiCu(true); setLoi('');
    try {
      const vung = vungTinRef.current;
      const data = await layTinNhan(cuocId, { truoc: danhSach[0].thoiGianGui });
      giuCuonRef.current = { scrollHeight: vung.scrollHeight, scrollTop: vung.scrollTop };
      setDanhSach((cu) => hopTin(data.danhSach, cu));
      setCoTinCuHon(data.coTinCuHon && data.danhSach.some((tin) => !tinRef.current.some((cu) => cu._id === tin._id)));
    } catch (loiApi) { setLoi(loiApi.message); }
    finally { setDangTaiCu(false); }
  };

  const gui = async () => {
    const noiDungGui = noiDung.trim();
    if (!noiDungGui || dangGui) return;
    setDangGui(true); setLoiGui('');
    try {
      if (cuocId) {
        const { tinNhan } = await guiTinNhan(cuocId, noiDungGui);
        cuonXuongRef.current = true;
        setDanhSach((cu) => hopTin(cu, [tinNhan]));
        onGui?.();
      } else {
        const data = await taoCuocTroChuyenVaGuiTinNhan({ cuaHangId, noiDung: noiDungGui });
        onTao?.(data.cuocTroChuyen);
      }
      setNoiDung('');
      if (noiDungRef.current) noiDungRef.current.style.height = '';
    } catch (loiApi) { setLoiGui(loiApi.message); }
    finally { setDangGui(false); }
  };
  const xuLyPhim = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); gui(); }
  };
  const xuLyNhap = (event) => {
    setNoiDung(event.target.value);
    event.target.style.height = 'auto';
    event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
  };

  return <section className="troChuyenKhung" aria-label={`Trò chuyện với ${tenDoiPhuong}`}>
    <header className="troChuyenKhungDau">{onQuayLai && <Button className="troChuyenQuayLai" variant="secondary" onClick={onQuayLai}>Quay lại</Button>}
      <div><h2>{tenDoiPhuong}</h2><small>{daKetNoi ? 'Đang kết nối trực tiếp' : 'Đang kết nối lại…'}</small></div></header>
    <div className="troChuyenVungTin" ref={vungTinRef} role="log" aria-live="polite" aria-label="Tin nhắn">
      {dangTai ? <Skeleton variant="block" count={3} /> : loi && !danhSach.length ? <ErrorState message={loi} taiLai={() => setLanTai((lan) => lan + 1)} /> : <>
        {coTinCuHon && <Button variant="secondary" size="sm" className="troChuyenTinCu" loading={dangTaiCu} onClick={xemTinCu}>Xem tin nhắn cũ hơn</Button>}
        {!cuocId && <p className="troChuyenBatDau">Hãy gửi tin nhắn đầu tiên cho {tenDoiPhuong}.</p>}
        {loi && danhSach.length > 0 && <p className="troChuyenLoi" role="alert">{loi}</p>}
        {danhSach.map((tin, index) => {
          const ngay = dinhDangNgay(tin.thoiGianGui);
          const ngayTruoc = index > 0 && dinhDangNgay(danhSach[index - 1].thoiGianGui);
          return <div key={tin._id}>{ngay !== ngayTruoc && <p className="troChuyenMocNgay">{ngay}</p>}
            <BongBongTinNhan tinNhan={tin} cuaToi={String(tin.nguoiGuiId) === String(taiKhoanId)} /></div>;
        })}</>}
    </div>
    <div className="troChuyenSoanTin"><label className="chiDocBangManHinh" htmlFor="noi-dung-tro-chuyen">Nội dung tin nhắn</label>
      <textarea ref={noiDungRef} id="noi-dung-tro-chuyen" rows={2} maxLength={1000} value={noiDung}
        onChange={xuLyNhap} onKeyDown={xuLyPhim} placeholder="Nhập tin nhắn…" disabled={dangTai} />
      {noiDung.length > 800 && <small>{noiDung.length}/1000 ký tự</small>}
      {loiGui && <p className="troChuyenLoi" role="alert">{loiGui}</p>}
      <Button onClick={gui} disabled={!noiDung.trim() || dangTai} loading={dangGui}>Gửi tin nhắn</Button></div>
  </section>;
}
