import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Badge from './ui/Badge.jsx';
import Button from './ui/Button.jsx';
import ConfirmDialog from './ui/ConfirmDialog.jsx';
import DataTable from './ui/DataTable.jsx';
import EmptyState from './ui/EmptyState.jsx';
import ErrorState from './ui/ErrorState.jsx';
import Field from './ui/Field.jsx';
import Input from './ui/Input.jsx';
import PageHeader from './ui/PageHeader.jsx';
import Pagination from './ui/Pagination.jsx';
import Select from './ui/Select.jsx';
import Skeleton from './ui/Skeleton.jsx';
import VoucherForm from './VoucherForm.jsx';
import useThongBao from '../hooks/useThongBao.js';
import * as api from '../services/voucher.api.js';
import { dinhDangNgayGio } from '../utils/dinhDang.js';
import { LOAI_VOUCHER, MAU_TINH_TRANG_VOUCHER, TRANG_THAI_VOUCHER } from '../utils/hangSo.js';
import { moTaVoucher, tinhTinhTrangVoucher } from '../utils/voucher.js';
import './VoucherDanhSach.css';

export default function VoucherDanhSach({ laQuanTri = false }) {
  const thongBao = useThongBao();
  const [params, setParams] = useSearchParams();
  const [ketQua, setKetQua] = useState({ danhSach: [], phanTrang: { trang: 1, tongTrang: 0 } });
  const [dangTai, setDangTai] = useState(true);
  const [loiTai, setLoiTai] = useState('');
  const [form, setForm] = useState(null);
  const [hanhDong, setHanhDong] = useState(null);
  const [dangGui, setDangGui] = useState(false);
  const [loiGui, setLoiGui] = useState('');
  const [thongBaoSaoChep, setThongBaoSaoChep] = useState('');

  const taiLai = async () => {
    setDangTai(true); setLoiTai('');
    try {
      const lay = laQuanTri ? api.quanTriLayDanhSachVoucher : api.nguoiBanLayDanhSachVoucher;
      setKetQua(await lay(Object.fromEntries(params)));
    } catch (loi) { setLoiTai(loi.message); }
    finally { setDangTai(false); }
  };
  useEffect(() => { taiLai(); }, [params, laQuanTri]);
  const doiLoc = (ten, giaTri) => {
    const moi = new URLSearchParams(params);
    if (giaTri) moi.set(ten, giaTri); else moi.delete(ten);
    moi.delete('trang'); setParams(moi);
  };
  const saoChep = async (ma) => {
    try { await navigator.clipboard.writeText(ma); setThongBaoSaoChep(`Đã sao chép ${ma}`); }
    catch { setThongBaoSaoChep(`Không sao chép được ${ma}; hãy chọn mã để sao chép`); }
  };
  const luu = async (body) => {
    if (dangGui) return;
    setDangGui(true); setLoiGui('');
    try {
      if (form.voucher) {
        if (laQuanTri) await api.quanTriCapNhatVoucher(form.voucher._id, body);
        else await api.nguoiBanCapNhatVoucher(form.voucher._id, body);
      } else if (laQuanTri) await api.quanTriTaoVoucher(body);
      else await api.nguoiBanTaoVoucher(body);
      thongBao.thanhCong(form.voucher ? 'Đã cập nhật voucher' : 'Đã tạo voucher');
      setForm(null); await taiLai();
    } catch (loi) { setLoiGui(loi.message); }
    finally { setDangGui(false); }
  };
  const thucHien = async () => {
    if (!hanhDong || dangGui) return;
    setDangGui(true); setLoiGui('');
    try {
      if (hanhDong.loai === 'xoa') {
        const data = laQuanTri ? await api.quanTriXoaVoucher(hanhDong.voucher._id) : await api.nguoiBanXoaVoucher(hanhDong.voucher._id);
        thongBao.thanhCong(data.message);
      } else {
        const trangThai = hanhDong.voucher.trangThai === TRANG_THAI_VOUCHER.KICH_HOAT ? TRANG_THAI_VOUCHER.VO_HIEU_HOA : TRANG_THAI_VOUCHER.KICH_HOAT;
        if (laQuanTri) await api.quanTriCapNhatTrangThaiVoucher(hanhDong.voucher._id, trangThai);
        else await api.nguoiBanCapNhatTrangThaiVoucher(hanhDong.voucher._id, trangThai);
        thongBao.thanhCong(`Đã ${trangThai === TRANG_THAI_VOUCHER.KICH_HOAT ? 'bật' : 'tắt'} voucher`);
      }
      setHanhDong(null); await taiLai();
    } catch (loi) { setLoiGui(loi.message); }
    finally { setDangGui(false); }
  };
  const cot = [
    { khoa: 'maVoucher', tieuDe: 'Mã', render: (ma) => <div className="voucherListMa"><strong>{ma}</strong><Button variant="ghost" size="sm" onClick={() => saoChep(ma)}>Sao chép</Button></div> },
    { khoa: 'tenVoucher', tieuDe: 'Tên' },
    { khoa: 'uuDai', tieuDe: 'Ưu đãi', render: (_, voucher) => moTaVoucher(voucher) },
    { khoa: 'hieuLuc', tieuDe: 'Hiệu lực', render: (_, voucher) => <span>{dinhDangNgayGio(voucher.ngayBatDau)} – {dinhDangNgayGio(voucher.ngayKetThuc)}</span> },
    { khoa: 'soLuong', tieuDe: 'Còn lại' },
    { khoa: 'soDonDaApDung', tieuDe: 'Đã áp dụng (đơn)' },
    { khoa: 'trangThai', tieuDe: 'Trạng thái', render: (_, voucher) => { const tinhTrang = tinhTinhTrangVoucher(voucher); return <Badge variant={MAU_TINH_TRANG_VOUCHER[tinhTrang]}>{tinhTrang}</Badge>; } },
    ...(laQuanTri ? [{ khoa: 'cuaHang', tieuDe: 'Cửa hàng', render: (cuaHang) => cuaHang?.tenCuaHang || 'Toàn hệ thống' }] : []),
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, voucher) => <div className="voucherListActions">
      {(!laQuanTri || voucher.loaiVoucher !== LOAI_VOUCHER.CUA_HANG) && <Button variant="ghost" size="sm" onClick={() => { setForm({ voucher }); setLoiGui(''); }}>Sửa</Button>}
      <button type="button" className="voucherSwitch" role="switch" aria-checked={voucher.trangThai === TRANG_THAI_VOUCHER.KICH_HOAT} aria-label={`${voucher.trangThai === TRANG_THAI_VOUCHER.KICH_HOAT ? 'Tắt' : 'Bật'} voucher ${voucher.maVoucher}`} onClick={() => { setHanhDong({ loai: 'trang-thai', voucher }); setLoiGui(''); }}>{voucher.trangThai === TRANG_THAI_VOUCHER.KICH_HOAT ? 'Đang bật' : 'Đang tắt'}</button>
      {(!laQuanTri || voucher.loaiVoucher !== LOAI_VOUCHER.CUA_HANG) && <Button variant="ghost" size="sm" onClick={() => { setHanhDong({ loai: 'xoa', voucher }); setLoiGui(''); }}>Xóa</Button>}
    </div> },
  ];
  return <div className="voucherListPage">
    <PageHeader title="Voucher" description={laQuanTri ? 'Quản lý voucher toàn hệ thống và trạng thái voucher cửa hàng.' : 'Quản lý voucher của cửa hàng bạn.'} actions={<Button onClick={() => { setForm({ voucher: null }); setLoiGui(''); }}>Tạo voucher</Button>} />
    <div className="voucherListFilters">
      <Field label="Trạng thái"><Select value={params.get('trangThai') || ''} onChange={(event) => doiLoc('trangThai', event.target.value)}><option value="">Tất cả</option>{Object.values(TRANG_THAI_VOUCHER).map((muc) => <option key={muc}>{muc}</option>)}</Select></Field>
      {laQuanTri && <Field label="Loại voucher"><Select value={params.get('loaiVoucher') || ''} onChange={(event) => doiLoc('loaiVoucher', event.target.value)}><option value="">Tất cả</option>{Object.values(LOAI_VOUCHER).map((muc) => <option key={muc}>{muc}</option>)}</Select></Field>}
      <Field label="Tìm mã hoặc tên"><Input value={params.get('tuKhoa') || ''} onChange={(event) => doiLoc('tuKhoa', event.target.value)} placeholder="Nhập mã hoặc tên voucher" /></Field>
      {[...params.keys()].some((ten) => ten !== 'trang') && <Button variant="ghost" onClick={() => setParams(new URLSearchParams())}>Xóa bộ lọc</Button>}
    </div>
    {thongBaoSaoChep && <p className="voucherListCopy" role="status">{thongBaoSaoChep}</p>}
    {dangTai ? <Skeleton variant="block" count={3} /> : loiTai ? <ErrorState message={loiTai} taiLai={taiLai} /> : !ketQua.danhSach.length ? <EmptyState title="Chưa có voucher phù hợp" description="Tạo voucher mới hoặc thay đổi bộ lọc." actionLabel="Tạo voucher" onAction={() => setForm({ voucher: null })} /> : <><DataTable cot={cot} hang={ketQua.danhSach} khoaHang="_id" /><Pagination trang={ketQua.phanTrang.trang} tongTrang={ketQua.phanTrang.tongTrang} onChange={(trang) => { const moi = new URLSearchParams(params); moi.set('trang', String(trang)); setParams(moi); }} /></>}
    {form && <VoucherForm key={form.voucher?._id || 'them'} voucher={form.voucher} laQuanTri={laQuanTri} dangGui={dangGui} loiChung={loiGui} onClose={() => setForm(null)} onSubmit={luu} />}
    <ConfirmDialog open={Boolean(hanhDong)} onClose={() => setHanhDong(null)} onConfirm={thucHien} title={hanhDong?.loai === 'xoa' ? 'Xóa voucher' : 'Đổi trạng thái voucher'} message={loiGui || (hanhDong?.loai === 'xoa' ? `Xóa ${hanhDong?.voucher.maVoucher}? Nếu voucher đã dùng, hệ thống chỉ vô hiệu hóa để giữ lịch sử.` : `${hanhDong?.voucher.trangThai === TRANG_THAI_VOUCHER.KICH_HOAT ? 'Tắt' : 'Bật'} voucher ${hanhDong?.voucher.maVoucher}?`)} confirmLabel={hanhDong?.loai === 'xoa' ? 'Xóa voucher' : 'Xác nhận'} danger={hanhDong?.loai === 'xoa' || hanhDong?.voucher.trangThai === TRANG_THAI_VOUCHER.KICH_HOAT} loading={dangGui} />
  </div>;
}
