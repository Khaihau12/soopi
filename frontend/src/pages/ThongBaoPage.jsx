import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import useThongBao from '../hooks/useThongBao.js';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import { danhDauTatCaThongBaoDaDoc, danhDauThongBaoDaDoc, layDanhSachThongBao } from '../services/thongBao.api.js';
import { dinhDangNgayGio } from '../utils/dinhDang.js';
import './ThongBaoPage.css';

export default function ThongBaoPage() {
  const [trang, setTrang] = useState(1);
  const [chuaDoc, setChuaDoc] = useState(false);
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [dangXuLy, setDangXuLy] = useState(false);
  const navigate = useNavigate();
  const thongBao = useThongBao();
  const { lamMoiTaiKhoan } = useXacThuc();

  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoi('');
    layDanhSachThongBao({ trang, chuaDoc }).then((data) => {
      if (!conHieuLuc) return;
      if (trang > 1 && !data.danhSach.length) { setTrang(trang - 1); return; }
      setDuLieu(data);
    }).catch((loiApi) => { if (conHieuLuc) setLoi(loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [trang, chuaDoc, lanTai]);

  useEffect(() => {
    const lamMoi = () => setLanTai((cu) => cu + 1);
    const thongBaoMoi = () => { setTrang(1); lamMoi(); };
    window.addEventListener('soopi-thong-bao-doi', lamMoi);
    window.addEventListener('soopi-thong-bao-moi', thongBaoMoi);
    return () => { window.removeEventListener('soopi-thong-bao-doi', lamMoi);
      window.removeEventListener('soopi-thong-bao-moi', thongBaoMoi); };
  }, []);

  const doiTab = (moi) => { setChuaDoc(moi); setTrang(1); };
  const moThongBao = async (item) => {
    if (dangXuLy) return;
    setDangXuLy(true);
    try {
      if (!item.ngayDoc) await danhDauThongBaoDaDoc(item._id);
      if (item.loai === 'Đăng ký bán hàng') await lamMoiTaiKhoan();
      window.dispatchEvent(new Event('soopi-thong-bao-doi'));
      navigate(item.duongDan);
    } catch (loiApi) { thongBao.loi(loiApi.message); }
    finally { setDangXuLy(false); }
  };
  const docTatCa = async () => {
    setDangXuLy(true);
    try { await danhDauTatCaThongBaoDaDoc(); thongBao.thanhCong('Đã đánh dấu tất cả là đã đọc');
      window.dispatchEvent(new Event('soopi-thong-bao-doi')); }
    catch (loiApi) { thongBao.loi(loiApi.message); }
    finally { setDangXuLy(false); }
  };

  return <div className="thongBaoPage"><PageHeader title="Thông báo" description="Theo dõi những cập nhật liên quan đến tài khoản và đơn hàng của bạn." />
    <div className="thongBaoCongCu"><div className="thongBaoTabs" role="group" aria-label="Lọc thông báo">
      <button type="button" aria-pressed={!chuaDoc} onClick={() => doiTab(false)}>Tất cả</button>
      <button type="button" aria-pressed={chuaDoc} onClick={() => doiTab(true)}>Chưa đọc{duLieu?.soChuaDoc > 0 ? ` (${duLieu.soChuaDoc})` : ''}</button>
    </div>{duLieu?.soChuaDoc > 0 && <Button variant="secondary" disabled={dangXuLy} onClick={docTatCa}>Đánh dấu tất cả đã đọc</Button>}</div>
    {dangTai && !duLieu ? <Skeleton variant="block" count={3} /> : loi ? <ErrorState message={loi} taiLai={() => setLanTai((cu) => cu + 1)} />
      : !duLieu?.danhSach.length ? <EmptyState icon="bell" title={chuaDoc ? 'Không có thông báo chưa đọc' : 'Bạn chưa có thông báo'}
        description={chuaDoc ? 'Các thông báo mới sẽ xuất hiện tại đây.' : 'Cập nhật từ đơn hàng, tin nhắn và cửa hàng sẽ xuất hiện tại đây.'} />
        : <><div className="thongBaoDanhSach" aria-busy={dangTai}>{duLieu.danhSach.map((item) => <button key={item._id} type="button"
          className={'thongBaoDong' + (!item.ngayDoc ? ' thongBaoDongMoi' : '')} disabled={dangXuLy} onClick={() => moThongBao(item)}>
          <span className="thongBaoDongDau"><strong>{item.tieuDe}</strong><time dateTime={item.ngayTao}>{dinhDangNgayGio(item.ngayTao)}</time></span>
          <span className="thongBaoDongLoai">{item.loai}{!item.ngayDoc && <span className="thongBaoDauMoi">Chưa đọc</span>}</span>
          <span className="thongBaoDongNoiDung">{item.noiDung}</span>
        </button>)}</div><Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang} onChange={setTrang} /></>}
  </div>;
}
