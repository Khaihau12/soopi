import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import SaoDanhGia from '../../components/SaoDanhGia.jsx';
import { nguoiBanLayDanhSachDanhGia } from '../../services/danhGia.api.js';
import { nguoiBanLayChiTietSanPham, nguoiBanLayDanhSachSanPham } from '../../services/sanPham.api.js';
import { dinhDangNgay, taoUrlAnh } from '../../utils/dinhDang.js';
import './DanhGiaNguoiBanPage.css';

export default function DanhGiaNguoiBanPage() {
  const [params, setParams] = useSearchParams();
  const sanPhamId = params.get('sanPhamId') || '';
  const soSao = params.get('soSao') || '';
  const trang = Math.max(1, Number(params.get('trang')) || 1);
  const [tuKhoa, setTuKhoa] = useState('');
  const [sanPham, setSanPham] = useState([]);
  const [tongSanPham, setTongSanPham] = useState(0);
  const [loiSanPham, setLoiSanPham] = useState('');
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const taiLai = () => setLanTai((lan) => lan + 1);
  const doiLoc = (ten, giaTri) => {
    const moi = new URLSearchParams(params);
    if (giaTri) moi.set(ten, giaTri); else moi.delete(ten);
    moi.delete('trang'); setParams(moi);
  };

  useEffect(() => {
    let conHieuLuc = true;
    setLoiSanPham('');
    nguoiBanLayDanhSachSanPham({ tuKhoa: tuKhoa.trim(), gioiHan: 50 }).then(async (data) => {
      let danhSach = data.danhSach;
      if (sanPhamId && !danhSach.some((item) => item._id === sanPhamId)) {
        try { const { sanPham: daChon } = await nguoiBanLayChiTietSanPham(sanPhamId); danhSach = [daChon, ...danhSach]; }
        catch { /* API đánh giá sẽ báo lỗi nếu sản phẩm không thuộc cửa hàng. */ }
      }
      if (conHieuLuc) { setSanPham(danhSach); setTongSanPham(data.phanTrang.tongSo); }
    }).catch((loiApi) => { if (conHieuLuc) setLoiSanPham(loiApi.message); });
    return () => { conHieuLuc = false; };
  }, [tuKhoa, sanPhamId]);

  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoi('');
    nguoiBanLayDanhSachDanhGia({ ...(sanPhamId ? { sanPhamId } : {}), ...(soSao ? { soSao } : {}), trang })
      .then((data) => { if (conHieuLuc) setDuLieu(data); })
      .catch((loiApi) => { if (conHieuLuc) { setDuLieu(null); setLoi(loiApi.message); } })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [sanPhamId, soSao, trang, lanTai]);

  return <div className="danhGiaBanPage">
    <PageHeader title="Đánh giá của khách" description="Xem nhận xét về sản phẩm của cửa hàng bạn." />
    <div className="danhGiaBanBoLoc"><Field label="Tìm sản phẩm"><Input value={tuKhoa} onChange={(event) => setTuKhoa(event.target.value)} placeholder="Nhập tên sản phẩm" maxLength={100} /></Field>
      <Field label="Sản phẩm"><Select value={sanPhamId} onChange={(event) => doiLoc('sanPhamId', event.target.value)}><option value="">Tất cả sản phẩm</option>
        {sanPham.map((item) => <option key={item._id} value={item._id}>{item.tenSanPham}</option>)}</Select></Field></div>
    {tongSanPham > 50 && <p className="danhGiaBanGoiY">Đang hiển thị tối đa 50 sản phẩm. Nhập tên để tìm sản phẩm khác.</p>}
    {loiSanPham && <p className="danhGiaBanLoi" role="alert">Không tải được bộ lọc sản phẩm: {loiSanPham}</p>}
    <div className="danhGiaBanLocSao" role="group" aria-label="Lọc theo số sao">{['', '5', '4', '3', '2', '1'].map((so) => <Button key={so || 'tat-ca'}
      variant={soSao === so ? 'primary' : 'secondary'} size="sm" onClick={() => doiLoc('soSao', so)}>{so ? `${so} sao` : 'Tất cả sao'}</Button>)}</div>
    {dangTai ? <Skeleton variant="block" count={3} /> : loi ? <ErrorState message={loi} taiLai={taiLai} /> : <>
      {duLieu.thongKe && <section className="danhGiaBanThongKe"><strong>{duLieu.thongKe.diemTrungBinh.toLocaleString('vi-VN', { minimumFractionDigits: 1 })}/5</strong>
        <SaoDanhGia giaTri={duLieu.thongKe.diemTrungBinh} /><span>{duLieu.thongKe.soDanhGia} đánh giá</span>
        <span>{[5, 4, 3, 2, 1].map((so) => `${so}★: ${duLieu.thongKe.phanBoSao[so]}`).join(' · ')}</span></section>}
      {duLieu.danhSach.length ? <><div className="danhGiaBanDanhSach">{duLieu.danhSach.map((danhGia) => <article key={danhGia._id} className="danhGiaBanDong">
        <div className="danhGiaBanSanPham">{taoUrlAnh(danhGia.sanPham.hinhAnh?.[0]) ? <img src={taoUrlAnh(danhGia.sanPham.hinhAnh[0])} alt="" /> : <span>Chưa có ảnh</span>}
          <strong>{danhGia.sanPham.tenSanPham}</strong></div>
        <div className="danhGiaBanNguoiMua"><Avatar hoTen={danhGia.taiKhoan.hoTen} /><strong>{danhGia.taiKhoan.hoTen}</strong><SaoDanhGia giaTri={danhGia.soSao} />
          <time dateTime={danhGia.ngayDanhGia}>{dinhDangNgay(danhGia.ngayDanhGia)}</time></div>
        <p>{danhGia.noiDung}</p></article>)}</div>
        <Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang}
          onChange={(soTrang) => { const moi = new URLSearchParams(params); moi.set('trang', soTrang); setParams(moi); }} /></>
        : <EmptyState title="Chưa có đánh giá phù hợp" description="Đánh giá của khách sẽ xuất hiện khi đơn hàng hoàn thành." />}
    </>}
  </div>;
}
