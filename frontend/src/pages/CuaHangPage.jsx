import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import SaoDanhGia from '../components/SaoDanhGia.jsx';
import PhanHoiDanhGia from '../components/PhanHoiDanhGia.jsx';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import { layCuaHangCongKhai, layDanhGiaCuaCuaHang } from '../services/cuaHang.api.js';
import { dinhDangNgay } from '../utils/dinhDang.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import DanhSachSanPhamPage from './DanhSachSanPhamPage.jsx';
import './CuaHangPage.css';

export default function CuaHangPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tabDanhGia = params.get('tab') === 'danh-gia';
  const trangDanhGia = params.get('trangDanhGia') || '1';
  const { taiKhoan } = useXacThuc();
  const [thongTin, setThongTin] = useState(null);
  const [danhGia, setDanhGia] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [dangTaiDanhGia, setDangTaiDanhGia] = useState(false);
  const [loi, setLoi] = useState('');
  const [loiDanhGia, setLoiDanhGia] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [lanTaiDanhGia, setLanTaiDanhGia] = useState(0);

  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoi(''); setThongTin(null);
    layCuaHangCongKhai(id).then((data) => { if (conHieuLuc) setThongTin(data); })
      .catch((loiApi) => { if (conHieuLuc) setLoi(loiApi.status === 404 ? 'Cửa hàng không tồn tại hoặc đã ngừng hoạt động.' : loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [id, lanTai]);
  useEffect(() => {
    if (!tabDanhGia || !thongTin) return undefined;
    let conHieuLuc = true;
    setDangTaiDanhGia(true); setLoiDanhGia('');
    layDanhGiaCuaCuaHang(id, { trang: trangDanhGia }).then((data) => { if (conHieuLuc) setDanhGia(data); })
      .catch((loiApi) => { if (conHieuLuc) setLoiDanhGia(loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTaiDanhGia(false); });
    return () => { conHieuLuc = false; };
  }, [id, tabDanhGia, thongTin, trangDanhGia, lanTaiDanhGia]);

  const taoDuongDanTab = (danhGiaTab) => {
    const query = new URLSearchParams(params);
    query.delete('trangDanhGia');
    if (danhGiaTab) query.set('tab', 'danh-gia'); else query.delete('tab');
    return DUONG_DAN.chiTietCuaHang(id) + (query.size ? `?${query}` : '');
  };
  const chuyenTrangDanhGia = (trang) => {
    const query = new URLSearchParams(params);
    if (trang === 1) query.delete('trangDanhGia'); else query.set('trangDanhGia', String(trang));
    setParams(query);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (dangTai) return <div className="cuaHangDangTai" aria-busy="true"><Skeleton variant="block" count={3} /></div>;
  if (loi) return <div className="cuaHangLoi"><ErrorState message={loi} taiLai={() => setLanTai((lan) => lan + 1)} /><Link to={DUONG_DAN.SAN_PHAM}>Xem sản phẩm khác</Link></div>;
  if (!thongTin) return null;
  const { cuaHang, soSanPham, thongKeDanhGia } = thongTin;
  const laCuaHangCuaToi = taiKhoan && String(taiKhoan._id) === String(cuaHang.taiKhoanId);
  const duongDanChat = `${DUONG_DAN.TRO_CHUYEN}?cuaHangId=${encodeURIComponent(id)}`;
  return <div className="cuaHangPage">
    <nav className="cuaHangDuongDan" aria-label="Đường dẫn"><Link to={DUONG_DAN.TRANG_CHU}>Trang chủ</Link><span aria-hidden="true">/</span><span>{cuaHang.tenCuaHang}</span></nav>
    <header className="cuaHangHero">
      <div className="cuaHangDau"><div className="cuaHangAvatar" aria-hidden="true">{cuaHang.tenCuaHang.charAt(0).toLocaleUpperCase('vi')}</div>
        <div><span className="cuaHangNhan">Cửa hàng trên Soopi</span><h1>{cuaHang.tenCuaHang}</h1>{cuaHang.diaChi && <p className="cuaHangDiaChi">{cuaHang.diaChi}</p>}</div></div>
      {cuaHang.moTa && <p className="cuaHangMoTa">{cuaHang.moTa}</p>}
      <div className="cuaHangThongKe"><div><strong>{soSanPham}</strong><span>Sản phẩm đang bán</span></div>
        <div><strong>{thongKeDanhGia.soDanhGia ? `${thongKeDanhGia.diemTrungBinh}/5` : '—'}</strong><span>{thongKeDanhGia.soDanhGia ? `${thongKeDanhGia.soDanhGia} đánh giá sản phẩm` : 'Chưa có đánh giá'}</span></div></div>
      <div className="cuaHangHanhDong">{!laCuaHangCuaToi && <Button variant="secondary" to={taiKhoan ? duongDanChat : DUONG_DAN.DANG_NHAP}
        state={taiKhoan ? { tenCuaHang: cuaHang.tenCuaHang } : { quayLai: duongDanChat }}>Chat với cửa hàng</Button>}</div>
    </header>
    <nav className="cuaHangTabs" aria-label="Nội dung cửa hàng">
      <Link to={taoDuongDanTab(false)} aria-current={!tabDanhGia ? 'page' : undefined}>Sản phẩm ({soSanPham})</Link>
      <Link to={taoDuongDanTab(true)} aria-current={tabDanhGia ? 'page' : undefined}>Đánh giá ({thongKeDanhGia.soDanhGia})</Link>
    </nav>
    {tabDanhGia ? <section className="cuaHangDanhGia" aria-label="Đánh giá sản phẩm của cửa hàng">
      <div className="cuaHangDanhGiaHeading"><h2>Đánh giá từ đơn hàng đã hoàn thành</h2>
        {thongKeDanhGia.soDanhGia > 0 && <div><SaoDanhGia giaTri={thongKeDanhGia.diemTrungBinh} /> <strong>{thongKeDanhGia.diemTrungBinh}/5</strong> · {thongKeDanhGia.soDanhGia} đánh giá</div>}</div>
      {loiDanhGia ? <ErrorState message={loiDanhGia} taiLai={() => setLanTaiDanhGia((lan) => lan + 1)} />
        : dangTaiDanhGia || !danhGia ? <Skeleton variant="block" count={3} />
          : danhGia.danhSach.length ? <><div className="cuaHangDanhGiaList">{danhGia.danhSach.map((item) => <article className="cuaHangDanhGiaItem" key={item._id}>
            <div className="cuaHangDanhGiaMeta"><strong>{item.taiKhoan.hoTen}</strong><span>{dinhDangNgay(item.ngayDanhGia)}</span></div>
            <SaoDanhGia giaTri={item.soSao} /><p>{item.noiDung}</p><PhanHoiDanhGia danhGia={item} /><span className="cuaHangDanhGiaSanPham">Sản phẩm: {item.sanPham.tenSanPham}</span>
          </article>)}</div><Pagination trang={danhGia.phanTrang.trang} tongTrang={danhGia.phanTrang.tongTrang} onChange={chuyenTrangDanhGia} /></>
            : <EmptyState title="Chưa có đánh giá" description="Đánh giá sẽ xuất hiện sau khi người mua hoàn thành đơn hàng và gửi nhận xét." />}
    </section> : <DanhSachSanPhamPage cuaHangCoDinhId={id} />}
  </div>;
}
