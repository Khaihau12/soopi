import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Badge from './ui/Badge.jsx';
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
import Select from './ui/Select.jsx';
import Skeleton from './ui/Skeleton.jsx';
import Tabs from './ui/Tabs.jsx';
import TrangThaiBadge from './TrangThaiBadge.jsx';
import useThongBao from '../hooks/useThongBao.js';
import * as api from '../services/khuyenMai.api.js';
import { dinhDangNgayGio } from '../utils/dinhDang.js';
import { DUONG_DAN, LOAI_KHUYEN_MAI, TRANG_THAI_KHUYEN_MAI } from '../utils/hangSo.js';
import './KhuyenMaiDanhSach.css';

const TABS = [
  { value: '', label: 'Tất cả' },
  { value: TRANG_THAI_KHUYEN_MAI.DANG_HOAT_DONG, label: 'Đang diễn ra' },
  { value: TRANG_THAI_KHUYEN_MAI.CHUA_BAT_DAU, label: 'Sắp diễn ra' },
  { value: TRANG_THAI_KHUYEN_MAI.DA_KET_THUC, label: 'Đã kết thúc' },
];

export default function KhuyenMaiDanhSach({ laQuanTri = false }) {
  const thongBao = useThongBao();
  const [params, setParams] = useSearchParams();
  const [ketQua, setKetQua] = useState({ danhSach: [], phanTrang: { trang: 1, tongTrang: 0, tongSo: 0 } });
  const [dangTai, setDangTai] = useState(true), [loiTai, setLoiTai] = useState('');
  const [tuKhoa, setTuKhoa] = useState(params.get('tuKhoa') || '');
  const [hanhDong, setHanhDong] = useState(null), [dangGui, setDangGui] = useState(false), [loiGui, setLoiGui] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const duongDan = laQuanTri ? DUONG_DAN.QUAN_TRI_VIEN : DUONG_DAN.NGUOI_BAN;
  const lay = laQuanTri ? api.quanTriLayDanhSachKhuyenMai : api.nguoiBanLayDanhSachKhuyenMai;
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
    lay(Object.fromEntries(new URLSearchParams(query))).then((data) => { if (conHieuLuc) setKetQua(data); })
      .catch((loi) => { if (conHieuLuc) setLoiTai(loi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [query, laQuanTri, lanTai]);
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
      if (hanhDong.loai === 'vo-hieu-hoa') await api.quanTriVoHieuHoaKhuyenMai(hanhDong.khuyenMai._id);
      else if (laQuanTri) await api.quanTriXoaKhuyenMai(hanhDong.khuyenMai._id);
      else await api.nguoiBanXoaKhuyenMai(hanhDong.khuyenMai._id);
      thongBao.thanhCong(hanhDong.loai === 'vo-hieu-hoa' ? 'Đã vô hiệu hóa chương trình' : 'Đã xóa chương trình');
      setHanhDong(null); taiLai();
    } catch (loi) { setLoiGui(loi.message); }
    finally { setDangGui(false); }
  };
  const moHanhDong = (loai, khuyenMai) => { setHanhDong({ loai, khuyenMai }); setLoiGui(''); };
  const cot = [
    { khoa: 'tenKhuyenMai', tieuDe: 'Chương trình', render: (_, muc) => <strong>{muc.tenKhuyenMai}</strong> },
    ...(laQuanTri ? [{ khoa: 'loaiKhuyenMai', tieuDe: 'Loại', render: (giaTri) => <Badge variant="info">{giaTri}</Badge> }] : []),
    { khoa: 'thoiGian', tieuDe: 'Hiệu lực', render: (_, muc) => <span>{dinhDangNgayGio(muc.ngayBatDau)} – {dinhDangNgayGio(muc.ngayKetThuc)}<small>{muc.trangThai === TRANG_THAI_KHUYEN_MAI.DA_KET_THUC ? 'Đã kết thúc' : muc.trangThai === TRANG_THAI_KHUYEN_MAI.CHUA_BAT_DAU ? 'Sắp diễn ra' : 'Đang diễn ra'}</small></span> },
    { khoa: 'soSanPham', tieuDe: 'Sản phẩm', render: (giaTri) => giaTri + ' sản phẩm' },
    { khoa: 'trangThai', tieuDe: 'Trạng thái', render: (giaTri) => <TrangThaiBadge trangThai={giaTri} /> },
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, muc) => <DropdownMenu label="⋯">
      {muc.trangThai !== TRANG_THAI_KHUYEN_MAI.DA_KET_THUC && <Button role="menuitem" variant="ghost" size="sm" to={duongDan.suaKhuyenMai(muc._id)}>Sửa</Button>}
      <button type="button" role="menuitem" onClick={() => moHanhDong('xoa', muc)}>Xóa</button>
      {laQuanTri && muc.trangThai !== TRANG_THAI_KHUYEN_MAI.DA_KET_THUC && <button type="button" role="menuitem" onClick={() => moHanhDong('vo-hieu-hoa', muc)}>Vô hiệu hóa</button>}
    </DropdownMenu> },
  ];
  const coLoc = [...params.keys()].some((ten) => ten !== 'trang');
  return <div className="khuyenMaiListPage">
    <PageHeader title="Khuyến mãi" description={laQuanTri ? 'Quản lý chương trình Giảm giá và Flash Sale toàn sàn.' : 'Quản lý chương trình giảm giá của cửa hàng bạn.'} actions={<Button to={duongDan.THEM_KHUYEN_MAI}>Tạo chương trình</Button>} />
    <Tabs items={TABS} value={params.get('trangThai') || ''} onChange={(giaTri) => doiLoc('trangThai', giaTri)} label="Lọc trạng thái khuyến mãi" />
    <div className="khuyenMaiListFilters">
      {laQuanTri && <Field label="Loại chương trình"><Select value={params.get('loaiKhuyenMai') || ''} onChange={(event) => doiLoc('loaiKhuyenMai', event.target.value)}><option value="">Tất cả</option>{Object.values(LOAI_KHUYEN_MAI).map((giaTri) => <option key={giaTri}>{giaTri}</option>)}</Select></Field>}
      <div className="khuyenMaiListSearch"><Field label="Tìm theo tên chương trình"><Input value={tuKhoa} maxLength={100} onChange={(event) => setTuKhoa(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); doiLoc('tuKhoa', tuKhoa); } }} placeholder="Nhập tên chương trình" /></Field>{tuKhoa && <Button variant="ghost" onClick={() => { setTuKhoa(''); doiLoc('tuKhoa', ''); }}>Xóa</Button>}</div>
      {coLoc && <Button variant="ghost" onClick={xoaBoLoc}>Xóa bộ lọc</Button>}
    </div>
    {loiTai && <ErrorState message={loiTai} taiLai={taiLai} />}
    {!loiTai && !ketQua.danhSach.length && dangTai && <Skeleton variant="block" count={3} />}
    {!loiTai && !dangTai && !ketQua.danhSach.length && <EmptyState title={coLoc ? 'Không có chương trình khớp bộ lọc' : 'Chưa có chương trình nào'} description={coLoc ? 'Thử xóa bộ lọc để xem tất cả chương trình.' : 'Tạo chương trình khuyến mãi đầu tiên.'} actionLabel={coLoc ? 'Xóa bộ lọc' : 'Tạo chương trình đầu tiên'} actionTo={coLoc ? undefined : duongDan.THEM_KHUYEN_MAI} onAction={coLoc ? xoaBoLoc : undefined} />}
    {!!ketQua.danhSach.length && <div className={dangTai ? 'khuyenMaiListDangTai' : ''} aria-busy={dangTai}><DataTable cot={cot} hang={ketQua.danhSach} khoaHang="_id" /><Pagination trang={ketQua.phanTrang.trang} tongTrang={ketQua.phanTrang.tongTrang} onChange={(trang) => { const moi = new URLSearchParams(params); moi.set('trang', String(trang)); setParams(moi); }} /></div>}
    <ConfirmDialog open={Boolean(hanhDong)} onClose={() => setHanhDong(null)} onConfirm={thucHien} title={hanhDong?.loai === 'vo-hieu-hoa' ? 'Vô hiệu hóa chương trình' : 'Xóa chương trình'} message={loiGui || (hanhDong?.loai === 'vo-hieu-hoa' ? 'Chương trình “' + (hanhDong?.khuyenMai.tenKhuyenMai || '') + '” sẽ dừng ngay và không thể bật lại.' : 'Xóa “' + (hanhDong?.khuyenMai.tenKhuyenMai || '') + '” cùng các sản phẩm tham gia?')} confirmLabel={hanhDong?.loai === 'vo-hieu-hoa' ? 'Vô hiệu hóa' : 'Xóa chương trình'} danger loading={dangGui} />
  </div>;
}
