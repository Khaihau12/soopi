import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import TrangThaiBadge from '../../components/TrangThaiBadge.jsx';
import useThongBao from '../../hooks/useThongBao.js';
import { layDanhSachDanhMuc } from '../../services/danhMuc.api.js';
import { quanTriCapNhatTrangThaiSanPham, quanTriLayChiTietSanPham, quanTriLayDanhSachSanPham } from '../../services/sanPham.api.js';
import { dinhDangTien, taoUrlAnh } from '../../utils/dinhDang.js';
import { TRANG_THAI_KINH_DOANH as TRANG_THAI } from '../../utils/hangSo.js';
import './QuanTriF25.css';

export default function SanPhamQuanTriPage() {
  const thongBao = useThongBao();
  const [params, setParams] = useSearchParams();
  const [oTim, setOTim] = useState(params.get('tuKhoa') || '');
  const [danhMuc, setDanhMuc] = useState([]);
  const [duLieu, setDuLieu] = useState({ danhSach: [], phanTrang: { trang: 1, tongTrang: 0 } });
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [chiTiet, setChiTiet] = useState(null);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const [loiChiTiet, setLoiChiTiet] = useState('');
  const [xacNhan, setXacNhan] = useState(null);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [loiXuLy, setLoiXuLy] = useState('');
  useEffect(() => { setOTim(params.get('tuKhoa') || ''); }, [params]);
  useEffect(() => { layDanhSachDanhMuc().then((data) => setDanhMuc(data.danhSach)).catch(() => {}); }, []);
  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoi('');
    quanTriLayDanhSachSanPham(Object.fromEntries(params))
      .then((data) => { if (conHieuLuc) setDuLieu(data); })
      .catch((err) => { if (conHieuLuc) setLoi(err.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [params, lanTai]);
  const suaQuery = (ten, giaTri) => {
    const moi = new URLSearchParams(params);
    if (giaTri) moi.set(ten, giaTri); else moi.delete(ten);
    if (ten !== 'trang') moi.delete('trang');
    setParams(moi);
  };
  const moChiTiet = async (id) => {
    setChiTiet({}); setDangTaiChiTiet(true); setLoiChiTiet('');
    try { const data = await quanTriLayChiTietSanPham(id); setChiTiet(data.sanPham); }
    catch (err) { setLoiChiTiet(err.message); }
    finally { setDangTaiChiTiet(false); }
  };
  const doiTrangThai = async () => {
    if (!xacNhan || dangXuLy) return;
    setDangXuLy(true); setLoiXuLy('');
    try {
      await quanTriCapNhatTrangThaiSanPham(xacNhan._id, xacNhan.dich);
      thongBao.thanhCong('Đã cập nhật trạng thái sản phẩm.');
      setXacNhan(null); setLanTai((so) => so + 1);
    } catch (err) { setLoiXuLy(err.message); }
    finally { setDangXuLy(false); }
  };
  const cot = [
    { khoa: 'tenSanPham', tieuDe: 'Sản phẩm', render: (giaTri, item) => <div className="qtF25SanPham">{taoUrlAnh(item.hinhAnh?.[0]) ? <img src={taoUrlAnh(item.hinhAnh[0])} alt="" loading="lazy" /> : <span className="qtF25AnhTrong">Chưa có ảnh</span>}<strong>{giaTri}</strong></div> },
    { khoa: 'cuaHang', tieuDe: 'Cửa hàng / Người bán', render: (giaTri, item) => <span>{giaTri?.tenCuaHang || '—'}<small className="qtF25Phu">{item.chuCuaHang?.hoTen || '—'}</small>{giaTri?.trangThaiHoatDong === 'Ngừng hoạt động' && <TrangThaiBadge trangThai={giaTri.trangThaiHoatDong} />}</span> },
    { khoa: 'giaBanThucTe', tieuDe: 'Giá', render: dinhDangTien },
    { khoa: 'soLuongTon', tieuDe: 'Tồn kho' },
    { khoa: 'trangThaiKinhDoanh', tieuDe: 'Trạng thái', render: (giaTri) => <TrangThaiBadge trangThai={giaTri} /> },
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, item) => <div className="qtF25Actions"><Button size="sm" variant="secondary" onClick={() => moChiTiet(item._id)}>Xem</Button><Button size="sm" variant={item.trangThaiKinhDoanh === TRANG_THAI.DANG_KINH_DOANH ? 'danger' : 'secondary'} onClick={() => { setLoiXuLy(''); setXacNhan({ _id: item._id, ten: item.tenSanPham, dich: item.trangThaiKinhDoanh === TRANG_THAI.DANG_KINH_DOANH ? TRANG_THAI.NGUNG_KINH_DOANH : TRANG_THAI.DANG_KINH_DOANH }); }}>{item.trangThaiKinhDoanh === TRANG_THAI.DANG_KINH_DOANH ? 'Ngừng kinh doanh' : 'Cho kinh doanh lại'}</Button></div> },
  ];
  const dangNgung = xacNhan?.dich === TRANG_THAI.NGUNG_KINH_DOANH;
  return <div className="qtF25Page">
    <PageHeader title="Sản phẩm toàn hệ thống" description="Kiểm tra sản phẩm và điều chỉnh trạng thái kinh doanh." />
    <form className="qtF25Filters" onSubmit={(event) => { event.preventDefault(); suaQuery('tuKhoa', oTim.trim()); }}>
      <Field label="Tên sản phẩm"><Input value={oTim} onChange={(event) => setOTim(event.target.value)} maxLength={100} /></Field>
      <Field label="Danh mục"><Select value={params.get('danhMucId') || ''} onChange={(event) => suaQuery('danhMucId', event.target.value)}><option value="">Tất cả</option>{danhMuc.map((item) => <option key={item._id} value={item._id}>{item.tenDanhMuc}</option>)}</Select></Field>
      <Field label="Trạng thái"><Select value={params.get('trangThaiKinhDoanh') || ''} onChange={(event) => suaQuery('trangThaiKinhDoanh', event.target.value)}><option value="">Tất cả</option>{Object.values(TRANG_THAI).map((giaTri) => <option key={giaTri}>{giaTri}</option>)}</Select></Field>
      <Button type="submit" variant="secondary">Tìm kiếm</Button>
    </form>
    {params.get('cuaHangId') && <p>Đang lọc theo cửa hàng. <Button size="sm" variant="ghost" onClick={() => suaQuery('cuaHangId', '')}>Bỏ lọc cửa hàng</Button></p>}
    {dangTai ? <Skeleton variant="block" count={3} /> : loi ? <ErrorState message={loi} taiLai={() => setLanTai((so) => so + 1)} /> : duLieu.danhSach.length ? <><DataTable cot={cot} hang={duLieu.danhSach} khoaHang="_id" /><Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang} onChange={(so) => suaQuery('trang', so === 1 ? '' : String(so))} /></> : <EmptyState title="Không có sản phẩm phù hợp" description="Thử thay đổi từ khóa hoặc bộ lọc." />}
    <Modal open={Boolean(chiTiet)} onClose={() => setChiTiet(null)} title="Chi tiết sản phẩm">{dangTaiChiTiet ? <Skeleton variant="block" count={2} /> : loiChiTiet ? <ErrorState message={loiChiTiet} taiLai={() => setChiTiet(null)} /> : chiTiet && <div className="qtF25ChiTiet"><h3>{chiTiet.tenSanPham}</h3><div className="qtF25Anh">{chiTiet.hinhAnh?.length ? chiTiet.hinhAnh.map((anh) => <img key={anh} src={taoUrlAnh(anh)} alt={chiTiet.tenSanPham} loading="lazy" />) : <span className="qtF25AnhTrong">Chưa có ảnh</span>}</div><p>{chiTiet.moTa || 'Chưa có mô tả.'}</p><p><strong>Danh mục:</strong> {chiTiet.danhMuc?.tenDanhMuc || '—'}</p><p><strong>Cửa hàng:</strong> {chiTiet.cuaHang?.tenCuaHang || '—'}</p><p><strong>Giá gốc:</strong> {dinhDangTien(chiTiet.giaGoc)}</p><p><strong>Giá bán:</strong> {dinhDangTien(chiTiet.giaBanThucTe)}</p><p><strong>Tồn kho:</strong> {chiTiet.soLuongTon}</p></div>}</Modal>
    <ConfirmDialog open={Boolean(xacNhan)} onClose={() => { if (!dangXuLy) setXacNhan(null); }} onConfirm={doiTrangThai} title={dangNgung ? 'Ngừng kinh doanh sản phẩm' : 'Cho sản phẩm kinh doanh lại'} message={loiXuLy || (dangNgung ? `Ngừng kinh doanh “${xacNhan?.ten}”? Sản phẩm sẽ ẩn khỏi trang bán. Đơn hàng đã đặt không bị ảnh hưởng.` : `Cho “${xacNhan?.ten}” kinh doanh lại? Sản phẩm có thể xuất hiện trên trang bán nếu cửa hàng đang hoạt động.`)} confirmLabel={dangNgung ? 'Ngừng kinh doanh' : 'Cho kinh doanh lại'} danger={dangNgung} loading={dangXuLy} />
  </div>;
}
