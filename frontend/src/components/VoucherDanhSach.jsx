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
import VoucherForm from './VoucherForm.jsx';
import useThongBao from '../hooks/useThongBao.js';
import * as api from '../services/voucher.api.js';
import { LOAI_VOUCHER, MAU_TINH_TRANG_VOUCHER, TRANG_THAI_VOUCHER } from '../utils/hangSo.js';
import { moTaVoucher, tinhTinhTrangVoucher } from '../utils/voucher.js';
import './VoucherDanhSach.css';

const CAC_TAB = [
  { value: '', label: 'Tất cả' }, { value: 'Đang hiệu lực', label: 'Đang hiệu lực' },
  { value: 'Sắp diễn ra', label: 'Sắp diễn ra' }, { value: 'Đã hết hạn', label: 'Đã hết hạn' },
  { value: 'Hết lượt', label: 'Hết lượt' }, { value: 'Đã tắt', label: 'Đã tắt' },
];
const tinhTrang = (voucher) => {
  const giaTri = tinhTinhTrangVoucher(voucher);
  return giaTri === 'Chưa bắt đầu' ? 'Sắp diễn ra' : giaTri === 'Hết số lượng' ? 'Hết lượt' : giaTri === 'Vô hiệu hóa' ? 'Đã tắt' : giaTri;
};
const hieuLuc = (voucher) => {
  const batDau = new Date(voucher.ngayBatDau), ketThuc = new Date(voucher.ngayKetThuc), now = new Date();
  const ngay = (moc) => moc.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const conNgay = Math.ceil((ketThuc - now) / 86400000);
  return <span>{ngay(batDau)} – {ngay(ketThuc)}<small>{ketThuc < now ? 'Đã hết hạn' : batDau > now ? 'Sắp diễn ra' : conNgay <= 3 ? 'Sắp hết hạn' : 'Còn ' + conNgay + ' ngày'}</small></span>;
};

export default function VoucherDanhSach({ laQuanTri = false }) {
  const thongBao = useThongBao();
  const [params, setParams] = useSearchParams();
  const [ketQua, setKetQua] = useState({ danhSach: [], phanTrang: { trang: 1, tongTrang: 0, tongSo: 0 } });
  const [dangTai, setDangTai] = useState(true), [loiTai, setLoiTai] = useState('');
  const [tuKhoa, setTuKhoa] = useState(params.get('tuKhoa') || '');
  const [form, setForm] = useState(null), [xoa, setXoa] = useState(null);
  const [dangGui, setDangGui] = useState(false), [loiGui, setLoiGui] = useState('');
  const [doiTrangThai, setDoiTrangThai] = useState(new Set());
  const [lanTai, setLanTai] = useState(0);
  const lay = laQuanTri ? api.quanTriLayDanhSachVoucher : api.nguoiBanLayDanhSachVoucher;
  const query = params.toString();
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
  const doiLoc = (ten, giaTri) => {
    const moi = new URLSearchParams(params);
    if (giaTri) moi.set(ten, giaTri); else moi.delete(ten);
    moi.delete('trang'); setParams(moi);
  };
  const taiLai = () => setLanTai((cu) => cu + 1);
  const moForm = (voucher = null, nhanBan = null) => { setLoiGui(''); setForm({ voucher, nhanBan }); };
  const saoChep = async (ma) => {
    try { await navigator.clipboard.writeText(ma); thongBao.thanhCong('Đã sao chép ' + ma); }
    catch { thongBao.loi('Không sao chép được mã ' + ma); }
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
      setForm(null); taiLai();
    } catch (loi) { setLoiGui(loi.message); }
    finally { setDangGui(false); }
  };
  const batTat = async (voucher) => {
    const id = String(voucher._id);
    if (doiTrangThai.has(id)) return;
    const moi = voucher.trangThai === TRANG_THAI_VOUCHER.KICH_HOAT ? TRANG_THAI_VOUCHER.VO_HIEU_HOA : TRANG_THAI_VOUCHER.KICH_HOAT;
    setDoiTrangThai((cu) => new Set(cu).add(id));
    setKetQua((cu) => ({ ...cu, danhSach: cu.danhSach.map((dong) => String(dong._id) === id ? { ...dong, trangThai: moi } : dong) }));
    try {
      if (laQuanTri) await api.quanTriCapNhatTrangThaiVoucher(id, moi);
      else await api.nguoiBanCapNhatTrangThaiVoucher(id, moi);
      thongBao.thanhCong('Đã ' + (moi === TRANG_THAI_VOUCHER.KICH_HOAT ? 'bật' : 'tắt') + ' voucher ' + voucher.maVoucher);
      taiLai();
    } catch (loi) {
      setKetQua((cu) => ({ ...cu, danhSach: cu.danhSach.map((dong) => String(dong._id) === id ? { ...dong, trangThai: voucher.trangThai } : dong) }));
      thongBao.loi(loi.message);
    } finally { setDoiTrangThai((cu) => { const tiep = new Set(cu); tiep.delete(id); return tiep; }); }
  };
  const xacNhanXoa = async () => {
    if (!xoa || dangGui) return;
    setDangGui(true); setLoiGui('');
    try {
      const data = laQuanTri ? await api.quanTriXoaVoucher(xoa._id) : await api.nguoiBanXoaVoucher(xoa._id);
      thongBao.thanhCong(data.message);
      setXoa(null); taiLai();
    } catch (loi) { setLoiGui(loi.message); }
    finally { setDangGui(false); }
  };
  const cot = [
    { khoa: 'maVoucher', tieuDe: 'Voucher', render: (_, voucher) => <div className="voucherListMa"><button type="button" onClick={() => saoChep(voucher.maVoucher)} aria-label={'Sao chép ' + voucher.maVoucher}>{voucher.maVoucher}</button><small>{voucher.tenVoucher}</small>{laQuanTri && <Badge variant="info">{voucher.loaiVoucher}</Badge>}</div> },
    { khoa: 'uuDai', tieuDe: 'Ưu đãi', render: (_, voucher) => moTaVoucher(voucher) },
    { khoa: 'hieuLuc', tieuDe: 'Hiệu lực', render: (_, voucher) => hieuLuc(voucher) },
    { khoa: 'luotDung', tieuDe: 'Lượt dùng', render: (_, voucher) => <span className={(voucher.soLuong > 0 && (voucher.soLuong <= 5 || voucher.soLuong <= (voucher.soLuong + voucher.soDonDaApDung) * 0.1)) ? 'voucherListCanhBao' : ''}>Còn {voucher.soLuong} lượt<small>Đã dùng {voucher.soDonDaApDung} đơn</small>{(voucher.soLuong > 0 && (voucher.soLuong <= 5 || voucher.soLuong <= (voucher.soLuong + voucher.soDonDaApDung) * 0.1)) && <small>Sắp hết lượt</small>}</span> },
    { khoa: 'tinhTrang', tieuDe: 'Tình trạng', render: (_, voucher) => <Badge variant={MAU_TINH_TRANG_VOUCHER[tinhTinhTrangVoucher(voucher)]}>{tinhTrang(voucher)}</Badge> },
    { khoa: 'thaoTac', tieuDe: 'Bật/tắt và thao tác', render: (_, voucher) => <div className="voucherListActions">
      <button type="button" className="voucherSwitch" role="switch" aria-checked={voucher.trangThai === TRANG_THAI_VOUCHER.KICH_HOAT} aria-label={(voucher.trangThai === TRANG_THAI_VOUCHER.KICH_HOAT ? 'Tắt ' : 'Bật ') + voucher.maVoucher} disabled={doiTrangThai.has(String(voucher._id))} onClick={() => batTat(voucher)}>{voucher.trangThai === TRANG_THAI_VOUCHER.KICH_HOAT ? 'Đang bật' : 'Đang tắt'}</button>
      <DropdownMenu label="⋯"><button role="menuitem" onClick={() => moForm(voucher)}>Sửa</button><button role="menuitem" onClick={() => moForm(null, voucher)}>Nhân bản</button><button role="menuitem" onClick={() => { setXoa(voucher); setLoiGui(''); }}>Xóa</button></DropdownMenu>
    </div> },
  ];
  const coLoc = [...params.keys()].some((ten) => ten !== 'trang');
  return <div className="voucherListPage">
    <PageHeader title="Voucher" description={laQuanTri ? 'Voucher Toàn sàn áp dụng cho mọi cửa hàng; Freeship giảm phí vận chuyển.' : 'Voucher chỉ áp dụng cho đơn hàng của cửa hàng bạn.'} actions={<Button onClick={() => moForm()}>Tạo voucher</Button>} />
    <Tabs items={CAC_TAB} value={params.get('tinhTrang') || ''} onChange={(giaTri) => doiLoc('tinhTrang', giaTri)} label="Lọc tình trạng voucher" />
    <div className="voucherListFilters">
      {laQuanTri && <Field label="Loại voucher"><Select value={params.get('loaiVoucher') || ''} onChange={(event) => doiLoc('loaiVoucher', event.target.value)}><option value="">Tất cả</option><option value={LOAI_VOUCHER.TOAN_SAN}>Toàn sàn</option><option value={LOAI_VOUCHER.FREESHIP}>Freeship</option></Select></Field>}
      <div className="voucherListSearch"><Field label="Tìm mã hoặc tên"><Input value={tuKhoa} onChange={(event) => setTuKhoa(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); doiLoc('tuKhoa', tuKhoa); } }} placeholder="Nhập mã hoặc tên voucher" /></Field>{tuKhoa && <Button variant="ghost" onClick={() => { setTuKhoa(''); doiLoc('tuKhoa', ''); }}>Xóa</Button>}</div>
      {coLoc && <Button variant="ghost" onClick={() => { setTuKhoa(''); setParams(new URLSearchParams()); }}>Xóa bộ lọc</Button>}
    </div>
    {loiTai && <ErrorState message={loiTai} taiLai={taiLai} />}
    {!loiTai && !ketQua.danhSach.length && dangTai && <Skeleton variant="block" count={3} />}
    {!loiTai && !dangTai && !ketQua.danhSach.length && <EmptyState title={coLoc ? 'Không có voucher khớp bộ lọc' : 'Chưa có voucher nào'} description={coLoc ? 'Thử xóa bộ lọc để xem tất cả.' : 'Tạo voucher đầu tiên cho chương trình của bạn.'} actionLabel={coLoc ? 'Xóa bộ lọc' : 'Tạo voucher đầu tiên'} onAction={coLoc ? () => { setTuKhoa(''); setParams(new URLSearchParams()); } : () => moForm()} />}
    {!!ketQua.danhSach.length && <div className={dangTai ? 'voucherListDangTai' : ''} aria-busy={dangTai}><DataTable cot={cot} hang={ketQua.danhSach} khoaHang="_id" /><Pagination trang={ketQua.phanTrang.trang} tongTrang={ketQua.phanTrang.tongTrang} onChange={(trang) => { const moi = new URLSearchParams(params); moi.set('trang', String(trang)); setParams(moi); }} /></div>}
    {form && <VoucherForm key={form.voucher?._id || form.nhanBan?._id || 'them'} voucher={form.voucher} nhanBan={form.nhanBan} laQuanTri={laQuanTri} dangGui={dangGui} loiChung={loiGui} onClose={() => setForm(null)} onSubmit={luu} />}
    <ConfirmDialog open={Boolean(xoa)} onClose={() => setXoa(null)} onConfirm={xacNhanXoa} title={xoa?.soDonDaApDung > 0 ? 'Vô hiệu hóa voucher' : 'Xóa voucher'} message={loiGui || (xoa?.soDonDaApDung > 0 ? 'Voucher đã dùng cho ' + xoa.soDonDaApDung + ' đơn nên chỉ vô hiệu hóa để giữ lịch sử.' : 'Xóa voucher ' + (xoa?.maVoucher || '') + '? Không thể hoàn tác.')} confirmLabel={xoa?.soDonDaApDung > 0 ? 'Vô hiệu hóa' : 'Xóa voucher'} danger loading={dangGui} />
  </div>;
}
