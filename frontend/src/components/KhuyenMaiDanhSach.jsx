import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Badge from './ui/Badge.jsx';
import Button from './ui/Button.jsx';
import ConfirmDialog from './ui/ConfirmDialog.jsx';
import DataTable from './ui/DataTable.jsx';
import EmptyState from './ui/EmptyState.jsx';
import ErrorState from './ui/ErrorState.jsx';
import Field from './ui/Field.jsx';
import PageHeader from './ui/PageHeader.jsx';
import Pagination from './ui/Pagination.jsx';
import Select from './ui/Select.jsx';
import Skeleton from './ui/Skeleton.jsx';
import TrangThaiBadge from './TrangThaiBadge.jsx';
import useThongBao from '../hooks/useThongBao.js';
import * as api from '../services/khuyenMai.api.js';
import { dinhDangNgayGio } from '../utils/dinhDang.js';
import { DUONG_DAN, LOAI_KHUYEN_MAI, TRANG_THAI_KHUYEN_MAI } from '../utils/hangSo.js';
import './KhuyenMaiDanhSach.css';

export default function KhuyenMaiDanhSach({ laQuanTri = false }) {
  const thongBao = useThongBao();
  const [params, setParams] = useSearchParams();
  const [ketQua, setKetQua] = useState({ danhSach: [], phanTrang: { trang: 1, tongTrang: 0 } });
  const [dangTai, setDangTai] = useState(true);
  const [loiTai, setLoiTai] = useState('');
  const [hanhDong, setHanhDong] = useState(null);
  const [dangGui, setDangGui] = useState(false);
  const [loiGui, setLoiGui] = useState('');
  const duongDan = laQuanTri ? DUONG_DAN.QUAN_TRI_VIEN : DUONG_DAN.NGUOI_BAN;
  const taiLai = async () => {
    setDangTai(true); setLoiTai('');
    try {
      const lay = laQuanTri ? api.quanTriLayDanhSachKhuyenMai : api.nguoiBanLayDanhSachKhuyenMai;
      setKetQua(await lay(Object.fromEntries(params)));
    } catch (loi) { setLoiTai(loi.message); }
    finally { setDangTai(false); }
  };
  useEffect(() => { taiLai(); }, [params, laQuanTri]);
  const doiLoc = (ten, giaTri) => { const moi = new URLSearchParams(params); if (giaTri) moi.set(ten, giaTri); else moi.delete(ten); moi.delete('trang'); setParams(moi); };
  const thucHien = async () => {
    setDangGui(true); setLoiGui('');
    try {
      if (hanhDong.loai === 'vo-hieu-hoa') await api.quanTriVoHieuHoaKhuyenMai(hanhDong.khuyenMai._id);
      else if (laQuanTri) await api.quanTriXoaKhuyenMai(hanhDong.khuyenMai._id);
      else await api.nguoiBanXoaKhuyenMai(hanhDong.khuyenMai._id);
      thongBao.thanhCong(hanhDong.loai === 'vo-hieu-hoa' ? 'Đã vô hiệu hóa chương trình' : 'Đã xóa chương trình');
      setHanhDong(null); await taiLai();
    } catch (loi) { setLoiGui(loi.message); }
    finally { setDangGui(false); }
  };
  const cot = [
    { khoa: 'tenKhuyenMai', tieuDe: 'Chương trình', render: (_, muc) => <strong>{muc.tenKhuyenMai}</strong> },
    { khoa: 'loaiKhuyenMai', tieuDe: 'Loại', render: (giaTri) => <Badge variant="info">{giaTri}</Badge> },
    { khoa: 'thoiGian', tieuDe: 'Thời gian', render: (_, muc) => <span>{dinhDangNgayGio(muc.ngayBatDau)} – {dinhDangNgayGio(muc.ngayKetThuc)}</span> },
    { khoa: 'trangThai', tieuDe: 'Trạng thái', render: (giaTri) => <TrangThaiBadge trangThai={giaTri} /> },
    { khoa: 'soSanPham', tieuDe: 'Số sản phẩm' },
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, muc) => <div className="khuyenMaiListActions">
      {muc.trangThai !== TRANG_THAI_KHUYEN_MAI.DA_KET_THUC && <Button variant="ghost" size="sm" to={duongDan.suaKhuyenMai(muc._id)}>Sửa</Button>}
      <Button variant="ghost" size="sm" onClick={() => { setHanhDong({ loai: 'xoa', khuyenMai: muc }); setLoiGui(''); }}>Xóa</Button>
      {laQuanTri && muc.trangThai !== TRANG_THAI_KHUYEN_MAI.DA_KET_THUC && <Button variant="secondary" size="sm" onClick={() => { setHanhDong({ loai: 'vo-hieu-hoa', khuyenMai: muc }); setLoiGui(''); }}>Vô hiệu hóa</Button>}
    </div> },
  ];

  return <div className="khuyenMaiListPage">
    <PageHeader title="Khuyến mãi" description={laQuanTri ? 'Quản lý chương trình Giảm giá và Flash Sale toàn sàn.' : 'Quản lý chương trình giảm giá của cửa hàng bạn.'} actions={<Button to={duongDan.THEM_KHUYEN_MAI}>Tạo chương trình</Button>} />
    <div className="khuyenMaiListFilters">
      <Field label="Trạng thái"><Select value={params.get('trangThai') || ''} onChange={(event) => doiLoc('trangThai', event.target.value)}><option value="">Tất cả</option>{Object.values(TRANG_THAI_KHUYEN_MAI).map((giaTri) => <option key={giaTri}>{giaTri}</option>)}</Select></Field>
      {laQuanTri && <Field label="Loại"><Select value={params.get('loaiKhuyenMai') || ''} onChange={(event) => doiLoc('loaiKhuyenMai', event.target.value)}><option value="">Tất cả</option>{Object.values(LOAI_KHUYEN_MAI).map((giaTri) => <option key={giaTri}>{giaTri}</option>)}</Select></Field>}
      {[...params.keys()].some((ten) => ten !== 'trang') && <Button variant="ghost" onClick={() => setParams(new URLSearchParams())}>Xóa bộ lọc</Button>}
    </div>
    {dangTai ? <Skeleton variant="block" count={3} /> : loiTai ? <ErrorState message={loiTai} taiLai={taiLai} /> : !ketQua.danhSach.length ? <EmptyState title="Chưa có chương trình phù hợp" description="Tạo chương trình mới hoặc thay đổi bộ lọc." actionLabel="Tạo chương trình" actionTo={duongDan.THEM_KHUYEN_MAI} /> : <><DataTable cot={cot} hang={ketQua.danhSach} khoaHang="_id" /><Pagination trang={ketQua.phanTrang.trang} tongTrang={ketQua.phanTrang.tongTrang} onChange={(trang) => { const moi = new URLSearchParams(params); moi.set('trang', trang); setParams(moi); }} /></>}
    <ConfirmDialog open={Boolean(hanhDong)} onClose={() => setHanhDong(null)} onConfirm={thucHien} title={hanhDong?.loai === 'vo-hieu-hoa' ? 'Vô hiệu hóa chương trình' : 'Xóa chương trình'} message={loiGui || (hanhDong?.loai === 'vo-hieu-hoa' ? `Chương trình “${hanhDong?.khuyenMai.tenKhuyenMai}” sẽ dừng ngay và không thể bật lại.` : `Xóa “${hanhDong?.khuyenMai.tenKhuyenMai}” cùng các sản phẩm tham gia?`)} confirmLabel={hanhDong?.loai === 'vo-hieu-hoa' ? 'Vô hiệu hóa' : 'Xóa chương trình'} danger loading={dangGui} />
  </div>;
}
