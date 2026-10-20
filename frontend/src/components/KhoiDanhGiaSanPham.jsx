import { useEffect, useState } from 'react';
import Avatar from './ui/Avatar.jsx';
import Button from './ui/Button.jsx';
import EmptyState from './ui/EmptyState.jsx';
import ErrorState from './ui/ErrorState.jsx';
import Pagination from './ui/Pagination.jsx';
import Skeleton from './ui/Skeleton.jsx';
import DanhGiaForm from './DanhGiaForm.jsx';
import SaoDanhGia from './SaoDanhGia.jsx';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import { layDanhSachDanhGia, layDongCoTheDanhGia } from '../services/danhGia.api.js';
import { dinhDangNgay } from '../utils/dinhDang.js';
import './KhoiDanhGiaSanPham.css';

export default function KhoiDanhGiaSanPham({ sanPhamId, onThongKe }) {
  const { taiKhoan } = useXacThuc();
  const [duLieu, setDuLieu] = useState(null);
  const [dongDuocDanhGia, setDongDuocDanhGia] = useState([]);
  const [trang, setTrang] = useState(1);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [moForm, setMoForm] = useState(false);
  const [lanTai, setLanTai] = useState(0);
  const taiLai = () => setLanTai((lan) => lan + 1);

  useEffect(() => { setTrang(1); }, [sanPhamId]);
  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoi('');
    layDanhSachDanhGia({ sanPhamId, trang }).then((data) => {
      if (conHieuLuc) { setDuLieu(data); onThongKe?.(data.thongKe); }
    }).catch((loiApi) => { if (conHieuLuc) setLoi(loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [sanPhamId, trang, lanTai]);
  useEffect(() => {
    if (!taiKhoan) { setDongDuocDanhGia([]); return undefined; }
    let conHieuLuc = true;
    layDongCoTheDanhGia(sanPhamId).then((data) => {
      if (conHieuLuc) setDongDuocDanhGia(data.danhSach);
    }).catch(() => { if (conHieuLuc) setDongDuocDanhGia([]); });
    return () => { conHieuLuc = false; };
  }, [sanPhamId, taiKhoan?._id, lanTai]);

  const thongKe = duLieu?.thongKe;
  return <section className="khoiDanhGia" id="danh-gia" aria-labelledby="danh-gia-title">
    <div className="khoiDanhGiaDau"><div><h2 id="danh-gia-title">Đánh giá sản phẩm</h2><p>Chia sẻ từ người đã mua sản phẩm.</p></div>
      {dongDuocDanhGia.length > 0 && <Button onClick={() => setMoForm(true)}>Viết đánh giá</Button>}
    </div>
    {!taiKhoan && <p className="khoiDanhGiaGoiY">Đăng nhập và mua sản phẩm để viết đánh giá.</p>}
    {dangTai ? <Skeleton variant="block" count={2} /> : loi ? <ErrorState message={loi} taiLai={taiLai} /> : <>
      <div className="khoiDanhGiaTongQuan"><div className="khoiDanhGiaDiem"><strong>{thongKe?.diemTrungBinh.toLocaleString('vi-VN', { minimumFractionDigits: 1 }) || '0,0'}</strong>
        <SaoDanhGia giaTri={thongKe?.diemTrungBinh || 0} /><span>{thongKe?.soDanhGia || 0} đánh giá</span></div>
        <div className="khoiDanhGiaPhanBo">{[5, 4, 3, 2, 1].map((so) => <div key={so} className="khoiDanhGiaThanh">
          <span>{so} sao</span><div className="khoiDanhGiaDuong" aria-hidden="true"><span style={{ width: `${thongKe?.soDanhGia ? (thongKe.phanBoSao[so] / thongKe.soDanhGia) * 100 : 0}%` }} /></div>
          <span>{thongKe?.phanBoSao[so] || 0}</span></div>)}</div></div>
      {duLieu.danhSach.length ? <><div className="khoiDanhGiaDanhSach">{duLieu.danhSach.map((danhGia) => <article key={danhGia._id} className="khoiDanhGiaDong">
        <Avatar hoTen={danhGia.taiKhoan.hoTen} /><div><strong>{danhGia.taiKhoan.hoTen}</strong><div className="khoiDanhGiaMeta"><SaoDanhGia giaTri={danhGia.soSao} /><time dateTime={danhGia.ngayDanhGia}>{dinhDangNgay(danhGia.ngayDanhGia)}</time></div>
          <p>{danhGia.noiDung}</p></div></article>)}</div>
        <Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang} onChange={setTrang} /></>
        : <EmptyState title="Sản phẩm chưa có đánh giá nào" description="Đánh giá đầu tiên sẽ xuất hiện khi khách đã mua và nhận hàng." />}
    </>}
    <DanhGiaForm open={moForm} onClose={() => setMoForm(false)} onThanhCong={() => { setTrang(1); taiLai(); }} danhSachDong={dongDuocDanhGia} />
  </section>;
}
