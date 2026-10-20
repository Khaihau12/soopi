import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GiaTien from '../../components/GiaTien.jsx';
import TrangThaiBadge from '../../components/TrangThaiBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
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
import useThongBao from '../../hooks/useThongBao.js';
import { layDanhSachDanhMuc } from '../../services/danhMuc.api.js';
import { nguoiBanLayDanhSachSanPham, nguoiBanCapNhatTonKho, nguoiBanXoaSanPham } from '../../services/sanPham.api.js';
import { taoUrlAnh } from '../../utils/dinhDang.js';
import { DUONG_DAN, TRANG_THAI_KINH_DOANH } from '../../utils/hangSo.js';
import './SanPhamNguoiBanPage.css';

export default function SanPhamNguoiBanPage() {
  const thongBao = useThongBao();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tuKhoaNhap, setTuKhoaNhap] = useState(params.get('tuKhoa') || '');
  const [danhMuc, setDanhMuc] = useState([]);
  const [danhSach, setDanhSach] = useState([]);
  const [phanTrang, setPhanTrang] = useState({ trang: 1, tongTrang: 0 });
  const [dangTai, setDangTai] = useState(true);
  const [loiTai, setLoiTai] = useState('');
  const [sanPhamKho, setSanPhamKho] = useState(null);
  const [soLuongTon, setSoLuongTon] = useState('');
  const [loiKho, setLoiKho] = useState('');
  const [sanPhamXoa, setSanPhamXoa] = useState(null);
  const [loiXoa, setLoiXoa] = useState('');
  const [dangGui, setDangGui] = useState(false);

  const doiLoc = (ten, giaTri) => { const moi = new URLSearchParams(params); if (giaTri) moi.set(ten, giaTri); else moi.delete(ten); moi.delete('trang'); setParams(moi); };
  const taiLai = async () => {
    setDangTai(true); setLoiTai('');
    try {
      const { danhSach: moi, phanTrang: phanTrangMoi } = await nguoiBanLayDanhSachSanPham(Object.fromEntries(params));
      setDanhSach(moi); setPhanTrang(phanTrangMoi);
    } catch (loi) { setLoiTai(loi.message); }
    finally { setDangTai(false); }
  };
  useEffect(() => { taiLai(); }, [params]);
  useEffect(() => { layDanhSachDanhMuc().then((duLieu) => setDanhMuc(duLieu.danhSach || [])).catch(() => {}); }, []);
  useEffect(() => { setTuKhoaNhap(params.get('tuKhoa') || ''); }, [params]);

  const moKho = (sanPham) => { setSanPhamKho(sanPham); setSoLuongTon(String(sanPham.soLuongTon)); setLoiKho(''); };
  const luuKho = async (event) => {
    event.preventDefault();
    const so = Number(soLuongTon);
    if (soLuongTon === '' || !Number.isSafeInteger(so) || so < 0) { setLoiKho('Số lượng tồn kho phải là số nguyên từ 0.'); return; }
    setDangGui(true); setLoiKho('');
    try {
      await nguoiBanCapNhatTonKho(sanPhamKho._id, so);
      setSanPhamKho(null); thongBao.thanhCong('Cập nhật tồn kho thành công'); await taiLai();
    } catch (loi) { setLoiKho(loi.message); }
    finally { setDangGui(false); }
  };
  const xoa = async () => {
    setDangGui(true); setLoiXoa('');
    try {
      const ketQua = await nguoiBanXoaSanPham(sanPhamXoa._id);
      setSanPhamXoa(null); thongBao.thanhCong(ketQua.message || 'Đã xử lý sản phẩm'); await taiLai();
    } catch (loi) { setLoiXoa(loi.message); }
    finally { setDangGui(false); }
  };
  const coLoc = ['tuKhoa', 'trangThaiKinhDoanh', 'danhMucId'].some((ten) => params.get(ten));
  const cot = [
    { khoa: 'tenSanPham', tieuDe: 'Sản phẩm', render: (_, sanPham) => <div className="sanPhamBanTen">{taoUrlAnh(sanPham.hinhAnh?.[0]) ? <img src={taoUrlAnh(sanPham.hinhAnh[0])} alt="" /> : <span className="sanPhamBanAnhTrong">Chưa có ảnh</span>}<div><strong>{sanPham.tenSanPham}</strong><small>{sanPham.danhMuc?.tenDanhMuc || 'Chưa có danh mục'}</small></div></div> },
    { khoa: 'giaGoc', tieuDe: 'Giá', render: (_, sanPham) => <GiaTien giaGoc={sanPham.giaGoc} giaBanThucTe={sanPham.giaBanThucTe} kichThuoc="nho" /> },
    { khoa: 'soLuongTon', tieuDe: 'Tồn kho', render: (_, sanPham) => <div className="sanPhamBanKho"><span>{sanPham.soLuongTon}{sanPham.soLuongTon === 0 && <small>Hết hàng</small>}</span><Button variant="ghost" size="sm" onClick={() => moKho(sanPham)}>Cập nhật</Button></div> },
    { khoa: 'trangThaiKinhDoanh', tieuDe: 'Trạng thái', render: (giaTri) => <TrangThaiBadge trangThai={giaTri} /> },
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, sanPham) => <div className="sanPhamBanActions"><Button variant="ghost" size="sm" to={`${DUONG_DAN.NGUOI_BAN.DANH_GIA}?sanPhamId=${sanPham._id}`}>Xem đánh giá</Button><Button variant="ghost" size="sm" to={DUONG_DAN.NGUOI_BAN.suaSanPham(sanPham._id)}>Sửa</Button><Button variant="danger" size="sm" onClick={() => { setSanPhamXoa(sanPham); setLoiXoa(''); }}>Xóa</Button></div> },
  ];

  return <div className="sanPhamBanPage">
    <PageHeader title="Sản phẩm" description="Quản lý sản phẩm, giá và tồn kho của cửa hàng bạn." actions={<Button to={DUONG_DAN.NGUOI_BAN.THEM_SAN_PHAM}>Thêm sản phẩm</Button>} />
    <form className="sanPhamBanFilters" onSubmit={(event) => { event.preventDefault(); doiLoc('tuKhoa', tuKhoaNhap.trim()); }}>
      <Field label="Tìm theo tên"><Input value={tuKhoaNhap} maxLength={100} onChange={(event) => setTuKhoaNhap(event.target.value)} placeholder="Tên sản phẩm" /></Field>
      <Button type="submit" variant="secondary">Tìm</Button>
      <Field label="Trạng thái"><Select value={params.get('trangThaiKinhDoanh') || ''} onChange={(event) => doiLoc('trangThaiKinhDoanh', event.target.value)}><option value="">Tất cả</option>{Object.values(TRANG_THAI_KINH_DOANH).map((giaTri) => <option key={giaTri}>{giaTri}</option>)}</Select></Field>
      <Field label="Danh mục"><Select value={params.get('danhMucId') || ''} onChange={(event) => doiLoc('danhMucId', event.target.value)}><option value="">Tất cả</option>{danhMuc.map((muc) => <option key={muc._id} value={muc._id}>{muc.tenDanhMuc}</option>)}</Select></Field>
      {coLoc && <Button variant="ghost" onClick={() => setParams(new URLSearchParams())}>Xóa bộ lọc</Button>}
    </form>
    {dangTai ? <Skeleton variant="block" count={3} /> : loiTai ? <ErrorState message={loiTai} taiLai={taiLai} /> : !danhSach.length ? <EmptyState title={coLoc ? 'Không có sản phẩm phù hợp' : 'Cửa hàng chưa có sản phẩm'} description={coLoc ? 'Thử thay đổi hoặc xóa bộ lọc.' : 'Thêm sản phẩm đầu tiên để bắt đầu bán hàng.'} actionLabel={coLoc ? 'Xóa bộ lọc' : 'Thêm sản phẩm'} onAction={coLoc ? () => setParams(new URLSearchParams()) : () => navigate(DUONG_DAN.NGUOI_BAN.THEM_SAN_PHAM)} /> : <><DataTable cot={cot} hang={danhSach} khoaHang="_id" /><Pagination trang={phanTrang.trang} tongTrang={phanTrang.tongTrang} onChange={(trang) => { const moi = new URLSearchParams(params); moi.set('trang', trang); setParams(moi); }} /></>}
    <Modal open={Boolean(sanPhamKho)} onClose={dangGui ? undefined : () => setSanPhamKho(null)} title="Cập nhật tồn kho"><form className="sanPhamBanModal" onSubmit={luuKho}><p>{sanPhamKho?.tenSanPham}</p><Field label="Số lượng tồn kho" required error={loiKho}><Input type="number" min="0" step="1" value={soLuongTon} onChange={(event) => { setSoLuongTon(event.target.value); setLoiKho(''); }} /></Field><div><Button variant="secondary" onClick={() => setSanPhamKho(null)} disabled={dangGui}>Hủy</Button><Button type="submit" loading={dangGui}>Lưu</Button></div></form></Modal>
    <ConfirmDialog open={Boolean(sanPhamXoa)} onClose={() => setSanPhamXoa(null)} onConfirm={xoa} title="Xóa sản phẩm" message={loiXoa || `Xóa “${sanPhamXoa?.tenSanPham}”? Nếu đã phát sinh dữ liệu, sản phẩm sẽ chuyển sang Ngừng kinh doanh.`} confirmLabel="Xóa sản phẩm" danger loading={dangGui} />
  </div>;
}
