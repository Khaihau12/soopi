import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from './ui/Button.jsx';
import ConfirmDialog from './ui/ConfirmDialog.jsx';
import DataTable from './ui/DataTable.jsx';
import DropdownMenu from './ui/DropdownMenu.jsx';
import EmptyState from './ui/EmptyState.jsx';
import ErrorState from './ui/ErrorState.jsx';
import Field from './ui/Field.jsx';
import Input from './ui/Input.jsx';
import PageHeader from './ui/PageHeader.jsx';
import Pagination from './ui/Pagination.jsx';
import Skeleton from './ui/Skeleton.jsx';
import Tabs from './ui/Tabs.jsx';
import TrangThaiBadge from './TrangThaiBadge.jsx';
import useThongBao from '../hooks/useThongBao.js';
import * as api from '../services/khuyenMai.api.js';
import { dinhDangNgayGio } from '../utils/dinhDang.js';
import { DUONG_DAN, TRANG_THAI_KHUYEN_MAI } from '../utils/hangSo.js';
import './KhuyenMaiDanhSach.css';

const TABS = [
  { value: '', label: 'Tất cả' },
  { value: TRANG_THAI_KHUYEN_MAI.DANG_HOAT_DONG, label: 'Đang diễn ra' },
  { value: TRANG_THAI_KHUYEN_MAI.CHUA_BAT_DAU, label: 'Sắp diễn ra' },
  { value: TRANG_THAI_KHUYEN_MAI.DA_KET_THUC, label: 'Đã kết thúc' },
];

export default function KhuyenMaiDanhSach() {
  const thongBao = useThongBao();
  const [params, setParams] = useSearchParams();
  const [ketQua, setKetQua] = useState({ danhSach: [], phanTrang: { trang: 1, tongTrang: 0, tongSo: 0 } });
  const [dangTai, setDangTai] = useState(true), [loiTai, setLoiTai] = useState('');
  const [tuKhoa, setTuKhoa] = useState(params.get('tuKhoa') || '');
  const [hanhDong, setHanhDong] = useState(null), [dangGui, setDangGui] = useState(false), [loiGui, setLoiGui] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const duongDan = DUONG_DAN.NGUOI_BAN;
  const query = params.toString();
  const doiLoc = (ten, giaTri) => {
    const moi = new URLSearchParams(params);
    if (giaTri) moi.set(ten, giaTri); else moi.delete(ten);
    moi.delete('trang'); setParams(moi);
  };
  const xoaBoLoc = () => { setTuKhoa(''); setParams(new URLSearchParams()); };
  const taiLai = () => setLanTai((cu) => cu + 1);
  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoiTai('');
    api.nguoiBanLayDanhSachKhuyenMai(Object.fromEntries(new URLSearchParams(query))).then((data) => { if (conHieuLuc) setKetQua(data); })
      .catch((loi) => { if (conHieuLuc) setLoiTai(loi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [query, lanTai]);
  useEffect(() => { setTuKhoa(params.get('tuKhoa') || ''); }, [params.get('tuKhoa')]);
  useEffect(() => {
    if (tuKhoa === (params.get('tuKhoa') || '')) return undefined;
    const hen = setTimeout(() => doiLoc('tuKhoa', tuKhoa), 350);
    return () => clearTimeout(hen);
  }, [tuKhoa, params]);
  const thucHien = async () => {
    if (!hanhDong || dangGui) return;
    setDangGui(true); setLoiGui('');
    try {
      await api.nguoiBanXoaKhuyenMai(hanhDong.khuyenMai._id);
      thongBao.thanhCong('Đã xóa chương trình');
      setHanhDong(null); taiLai();
    } catch (loi) { setLoiGui(loi.message); }
    finally { setDangGui(false); }
  };
  const moHanhDong = (loai, khuyenMai) => { setHanhDong({ loai, khuyenMai }); setLoiGui(''); };
  const cot = [
    { khoa: 'tenKhuyenMai', tieuDe: 'Chương trình', render: (_, muc) => <strong>{muc.tenKhuyenMai}</strong> },
    { khoa: 'thoiGian', tieuDe: 'Hiệu lực', render: (_, muc) => <span>{dinhDangNgayGio(muc.ngayBatDau)} – {dinhDangNgayGio(muc.ngayKetThuc)}<small>{muc.trangThai === TRANG_THAI_KHUYEN_MAI.DA_KET_THUC ? 'Đã kết thúc' : muc.trangThai === TRANG_THAI_KHUYEN_MAI.CHUA_BAT_DAU ? 'Sắp diễn ra' : 'Đang diễn ra'}</small></span> },
    { khoa: 'soSanPham', tieuDe: 'Sản phẩm', render: (giaTri) => giaTri + ' sản phẩm' },
    { khoa: 'trangThai', tieuDe: 'Trạng thái', render: (giaTri) => <TrangThaiBadge trangThai={giaTri} /> },
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, muc) => <DropdownMenu label="⋯">
      {muc.trangThai !== TRANG_THAI_KHUYEN_MAI.DA_KET_THUC && <Button role="menuitem" variant="ghost" size="sm" to={duongDan.suaKhuyenMai(muc._id)}>Sửa</Button>}
      <button type="button" role="menuitem" onClick={() => moHanhDong('xoa', muc)}>Xóa</button>
    </DropdownMenu> },
  ];
  const coLoc = [...params.keys()].some((ten) => ten !== 'trang');
  return <div className="khuyenMaiListPage">
    <PageHeader title="Khuyến mãi" description="Quản lý chương trình giảm giá của cửa hàng bạn." actions={<Button to={duongDan.THEM_KHUYEN_MAI}>Tạo chương trình</Button>} />
    <Tabs items={TABS} value={params.get('trangThai') || ''} onChange={(giaTri) => doiLoc('trangThai', giaTri)} label="Lọc trạng thái khuyến mãi" />
    <div className="khuyenMaiListFilters">
      <div className="khuyenMaiListSearch"><Field label="Tìm theo tên chương trình"><Input value={tuKhoa} maxLength={100} onChange={(event) => setTuKhoa(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); doiLoc('tuKhoa', tuKhoa); } }} placeholder="Nhập tên chương trình" /></Field>{tuKhoa && <Button variant="ghost" onClick={() => { setTuKhoa(''); doiLoc('tuKhoa', ''); }}>Xóa</Button>}</div>
      {coLoc && <Button variant="ghost" onClick={xoaBoLoc}>Xóa bộ lọc</Button>}
    </div>
    {loiTai && <ErrorState message={loiTai} taiLai={taiLai} />}
    {!loiTai && !ketQua.danhSach.length && dangTai && <Skeleton variant="block" count={3} />}
    {!loiTai && !dangTai && !ketQua.danhSach.length && <EmptyState title={coLoc ? 'Không có chương trình khớp bộ lọc' : 'Chưa có chương trình nào'} description={coLoc ? 'Thử xóa bộ lọc để xem tất cả chương trình.' : 'Tạo chương trình khuyến mãi đầu tiên.'} actionLabel={coLoc ? 'Xóa bộ lọc' : 'Tạo chương trình đầu tiên'} actionTo={coLoc ? undefined : duongDan.THEM_KHUYEN_MAI} onAction={coLoc ? xoaBoLoc : undefined} />}
    {!!ketQua.danhSach.length && <div className={dangTai ? 'khuyenMaiListDangTai' : ''} aria-busy={dangTai}><DataTable cot={cot} hang={ketQua.danhSach} khoaHang="_id" /><Pagination trang={ketQua.phanTrang.trang} tongTrang={ketQua.phanTrang.tongTrang} onChange={(trang) => { const moi = new URLSearchParams(params); moi.set('trang', String(trang)); setParams(moi); }} /></div>}
    <ConfirmDialog open={Boolean(hanhDong)} onClose={() => setHanhDong(null)} onConfirm={thucHien} title="Xóa chương trình" message={loiGui || 'Xóa “' + (hanhDong?.khuyenMai.tenKhuyenMai || '') + '” cùng các sản phẩm tham gia?'} confirmLabel="Xóa chương trình" danger loading={dangGui} />
  </div>;
}
