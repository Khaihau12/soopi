import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import TrangThaiBadge from '../../components/TrangThaiBadge.jsx';
import { quanTriLayDanhSachGiaoDich, quanTriLayChiTietGiaoDich } from '../../services/giaoDichThanhToan.api.js';
import { dinhDangNgayGio, dinhDangTien } from '../../utils/dinhDang.js';
import { TRANG_THAI_GIAO_DICH } from '../../utils/hangSo.js';
import './QuanTriF25.css';

export default function GiaoDichQuanTriPage() {
  const [params, setParams] = useSearchParams();
  const tuKhoa = params.get('tuKhoa') || '';
  const [oTim, setOTim] = useState(tuKhoa);
  const [duLieu, setDuLieu] = useState({ danhSach: [], phanTrang: { trang: 1, tongTrang: 0 } });
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [chiTiet, setChiTiet] = useState(null);
  const [loiChiTiet, setLoiChiTiet] = useState('');
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const tuNgay = params.get('tuNgay') || '';
  const denNgay = params.get('denNgay') || '';
  const loiNgay = tuNgay && denNgay && tuNgay > denNgay ? 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.' : '';
  useEffect(() => { setOTim(tuKhoa); }, [tuKhoa]);
  useEffect(() => {
    if (loiNgay) { setDangTai(false); return undefined; }
    let conHieuLuc = true;
    setDangTai(true); setLoi('');
    quanTriLayDanhSachGiaoDich(Object.fromEntries(params))
      .then((data) => { if (conHieuLuc) setDuLieu(data); })
      .catch((err) => { if (conHieuLuc) setLoi(err.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [params, lanTai, loiNgay]);
  const suaQuery = (ten, giaTri) => {
    const moi = new URLSearchParams(params);
    if (giaTri) moi.set(ten, giaTri); else moi.delete(ten);
    if (ten !== 'trang') moi.delete('trang');
    setParams(moi);
  };
  const moChiTiet = async (id) => {
    setChiTiet({}); setDangTaiChiTiet(true); setLoiChiTiet('');
    try { const data = await quanTriLayChiTietGiaoDich(id); setChiTiet(data.giaoDich); }
    catch (err) { setLoiChiTiet(err.message); }
    finally { setDangTaiChiTiet(false); }
  };
  const cot = [
    { khoa: 'maGiaoDich', tieuDe: 'Mã giao dịch', render: (giaTri, item) => <><strong>{giaTri}</strong>{item.soDonCanHoanTien > 0 && <small className="qtF25CanhBao">Cần hoàn tiền thủ công</small>}</> },
    { khoa: 'nguoiMua', tieuDe: 'Người mua', render: (giaTri) => giaTri ? <span>{giaTri.hoTen}<small className="qtF25Phu">{giaTri.email}</small></span> : '—' },
    { khoa: 'soTien', tieuDe: 'Số tiền', render: dinhDangTien },
    { khoa: 'phuongThucThanhToan', tieuDe: 'Phương thức' },
    { khoa: 'trangThaiThanhToan', tieuDe: 'Trạng thái', render: (giaTri) => <TrangThaiBadge trangThai={giaTri} /> },
    { khoa: 'thoiGianTao', tieuDe: 'Thời gian tạo', render: dinhDangNgayGio },
    { khoa: 'soDonHang', tieuDe: 'Số đơn' },
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, item) => <Button size="sm" variant="secondary" onClick={() => moChiTiet(item._id)}>Xem</Button> },
  ];
  const cotDon = [
    { khoa: 'cuaHang', tieuDe: 'Cửa hàng', render: (giaTri) => giaTri?.tenCuaHang || '—' },
    { khoa: 'tongThanhToan', tieuDe: 'Tổng đơn', render: (giaTri, item) => <>{dinhDangTien(giaTri)}{item.canHoanTien && <small className="qtF25CanhBao">Cần hoàn tiền thủ công: {dinhDangTien(giaTri)}</small>}</> },
    { khoa: 'phuongThucThanhToan', tieuDe: 'Phương thức' },
    { khoa: 'trangThaiThanhToan', tieuDe: 'Thanh toán', render: (giaTri) => <TrangThaiBadge trangThai={giaTri} /> },
    { khoa: 'trangThaiXuLy', tieuDe: 'Xử lý', render: (giaTri) => <TrangThaiBadge trangThai={giaTri} /> },
  ];
  return <div className="qtF25Page">
    <PageHeader title="Giao dịch thanh toán" description="Tra cứu giao dịch VNPay và COD trên toàn hệ thống." />
    <form className="qtF25Filters" onSubmit={(event) => { event.preventDefault(); suaQuery('tuKhoa', oTim.trim()); }}>
      <Field label="Mã giao dịch"><Input value={oTim} onChange={(event) => setOTim(event.target.value)} maxLength={100} /></Field>
      <Field label="Trạng thái"><Select value={params.get('trangThaiThanhToan') || ''} onChange={(event) => suaQuery('trangThaiThanhToan', event.target.value)}><option value="">Tất cả</option>{Object.values(TRANG_THAI_GIAO_DICH).map((giaTri) => <option key={giaTri}>{giaTri}</option>)}</Select></Field>
      <Field label="Phương thức"><Select value={params.get('phuongThucThanhToan') || ''} onChange={(event) => suaQuery('phuongThucThanhToan', event.target.value)}><option value="">Tất cả</option><option>VNPay</option><option>COD</option></Select></Field>
      <Field label="Từ ngày"><Input type="date" value={tuNgay} onChange={(event) => suaQuery('tuNgay', event.target.value)} /></Field>
      <Field label="Đến ngày" error={loiNgay}><Input type="date" value={denNgay} onChange={(event) => suaQuery('denNgay', event.target.value)} /></Field>
      <Button type="submit" variant="secondary">Tìm kiếm</Button>
    </form>
    <label className="qtF25Checkbox"><input type="checkbox" checked={params.get('canHoanTien') === 'true'} onChange={(event) => suaQuery('canHoanTien', event.target.checked ? 'true' : '')} /> Chỉ hiện giao dịch cần hoàn tiền</label>
    {loiNgay ? <p role="alert" className="qtF25Loi">{loiNgay}</p> : dangTai ? <Skeleton variant="block" count={3} /> : loi ? <ErrorState message={loi} taiLai={() => setLanTai((so) => so + 1)} /> : duLieu.danhSach.length ? <><DataTable cot={cot} hang={duLieu.danhSach} khoaHang="_id" /><Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang} onChange={(so) => suaQuery('trang', so === 1 ? '' : String(so))} /></> : <EmptyState title="Không có giao dịch phù hợp" description="Thử thay đổi bộ lọc hoặc khoảng thời gian." />}
    <Modal open={Boolean(chiTiet)} onClose={() => setChiTiet(null)} title="Chi tiết giao dịch">
      {dangTaiChiTiet ? <Skeleton variant="block" count={2} /> : loiChiTiet ? <ErrorState message={loiChiTiet} taiLai={() => setChiTiet(null)} /> : chiTiet && <>
        <div className="qtF25ChiTiet"><p><strong>Mã:</strong> {chiTiet.maGiaoDich}</p><p><strong>Người mua:</strong> {chiTiet.nguoiMua?.hoTen || '—'} {chiTiet.nguoiMua?.email || ''}</p><p><strong>Số tiền:</strong> {dinhDangTien(chiTiet.soTien)}</p><p><strong>Phương thức:</strong> {chiTiet.phuongThucThanhToan}</p><p><strong>Trạng thái:</strong> <TrangThaiBadge trangThai={chiTiet.trangThaiThanhToan} /></p><p><strong>Tạo lúc:</strong> {dinhDangNgayGio(chiTiet.thoiGianTao)}</p><p><strong>Hoàn tất:</strong> {dinhDangNgayGio(chiTiet.thoiGianHoanTat) || '—'}</p></div>
        <h3>Đơn hàng liên quan ({chiTiet.soDonHang})</h3><DataTable cot={cotDon} hang={chiTiet.danhSachDonHang} khoaHang="_id" />
      </>}
    </Modal>
  </div>;
}
