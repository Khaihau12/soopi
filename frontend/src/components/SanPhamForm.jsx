import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import Field from './ui/Field.jsx';
import Input from './ui/Input.jsx';
import Select from './ui/Select.jsx';
import Textarea from './ui/Textarea.jsx';
import TaiAnhLen from './TaiAnhLen.jsx';
import { dinhDangNgay, dinhDangTien } from '../utils/dinhDang.js';
import { DUONG_DAN, TRANG_THAI_KINH_DOANH } from '../utils/hangSo.js';
import './SanPhamForm.css';

const banDau = (sanPham) => ({
  tenSanPham: sanPham?.tenSanPham || '', danhMucId: sanPham?.danhMucId || '', moTa: sanPham?.moTa || '',
  hinhAnh: sanPham?.hinhAnh || [], giaGoc: sanPham?.giaGoc === undefined ? '' : String(sanPham.giaGoc),
  soLuongTon: sanPham?.soLuongTon === undefined ? '' : String(sanPham.soLuongTon),
  trangThaiKinhDoanh: sanPham?.trangThaiKinhDoanh || TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH,
});

export default function SanPhamForm({ sanPham, danhMuc, onSubmit, dangGui, loiChung }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => banDau(sanPham));
  const [loiTruong, setLoiTruong] = useState({});
  const thayDoi = (ten, giaTri) => { setForm((cu) => ({ ...cu, [ten]: giaTri })); setLoiTruong((cu) => ({ ...cu, [ten]: '' })); };

  const luu = (event) => {
    event.preventDefault();
    const loi = {};
    if (!form.tenSanPham.trim()) loi.tenSanPham = 'Vui lòng nhập tên sản phẩm.';
    else if (form.tenSanPham.trim().length > 200) loi.tenSanPham = 'Tên sản phẩm không được quá 200 ký tự.';
    if (!form.danhMucId) loi.danhMucId = 'Vui lòng chọn danh mục.';
    if (form.moTa.trim().length > 5000) loi.moTa = 'Mô tả không được quá 5000 ký tự.';
    if (!Number.isSafeInteger(Number(form.giaGoc)) || Number(form.giaGoc) < 1) loi.giaGoc = 'Giá gốc phải là số nguyên từ 1 đồng.';
    if (!sanPham && (!Number.isSafeInteger(Number(form.soLuongTon)) || Number(form.soLuongTon) < 0 || form.soLuongTon === '')) loi.soLuongTon = 'Tồn kho phải là số nguyên từ 0.';
    setLoiTruong(loi);
    if (Object.keys(loi).length) { document.getElementById(`san-pham-${Object.keys(loi)[0]}`)?.focus(); return; }
    const duLieu = {
      tenSanPham: form.tenSanPham.trim(), danhMucId: form.danhMucId, moTa: form.moTa.trim(),
      hinhAnh: form.hinhAnh, giaGoc: Number(form.giaGoc), trangThaiKinhDoanh: form.trangThaiKinhDoanh,
      ...(!sanPham ? { soLuongTon: Number(form.soLuongTon) } : {}),
    };
    onSubmit(duLieu);
  };

  const khuyenMai = sanPham?.khuyenMaiDangApDung || [];
  return <form className="sanPhamForm" noValidate onSubmit={luu}>
    <Card><h2>Thông tin cơ bản</h2><div className="sanPhamFormFields">
      <Field label="Tên sản phẩm" required error={loiTruong.tenSanPham}><Input id="san-pham-tenSanPham" value={form.tenSanPham} maxLength={201} disabled={dangGui} onChange={(event) => thayDoi('tenSanPham', event.target.value)} /></Field>
      <Field label="Danh mục" required error={loiTruong.danhMucId}><Select id="san-pham-danhMucId" value={form.danhMucId} disabled={dangGui} onChange={(event) => thayDoi('danhMucId', event.target.value)}><option value="">Chọn danh mục</option>{danhMuc.map((muc) => <option key={muc._id} value={muc._id}>{muc.tenDanhMuc}</option>)}</Select></Field>
      <Field label="Mô tả" error={loiTruong.moTa}><Textarea id="san-pham-moTa" value={form.moTa} maxLength={5001} rows={5} disabled={dangGui} onChange={(event) => thayDoi('moTa', event.target.value)} /></Field>
    </div></Card>
    <Card><h2>Hình ảnh</h2><TaiAnhLen value={form.hinhAnh} onChange={(giaTri) => thayDoi('hinhAnh', giaTri)} disabled={dangGui} /></Card>
    <Card><h2>Giá và kho</h2><div className="sanPhamFormFields">
      <Field label="Giá gốc (đ)" required error={loiTruong.giaGoc} hint={form.giaGoc && Number(form.giaGoc) >= 1 ? `Giá gốc: ${dinhDangTien(form.giaGoc)}` : 'Nhập số nguyên từ 1 đồng.'}><Input id="san-pham-giaGoc" type="number" min="1" step="1" value={form.giaGoc} disabled={dangGui} onChange={(event) => thayDoi('giaGoc', event.target.value)} /></Field>
      {sanPham ? <div><strong>Tồn kho hiện tại: {sanPham.soLuongTon}</strong><p>Để thay đổi tồn kho, dùng nút “Cập nhật” ở danh sách sản phẩm.</p><Button variant="secondary" to={DUONG_DAN.NGUOI_BAN.SAN_PHAM}>Về danh sách cập nhật tồn kho</Button></div> : <Field label="Tồn kho ban đầu" required error={loiTruong.soLuongTon}><Input id="san-pham-soLuongTon" type="number" min="0" step="1" value={form.soLuongTon} disabled={dangGui} onChange={(event) => thayDoi('soLuongTon', event.target.value)} /></Field>}
      <Field label="Trạng thái kinh doanh"><Select id="san-pham-trangThaiKinhDoanh" value={form.trangThaiKinhDoanh} disabled={dangGui} onChange={(event) => thayDoi('trangThaiKinhDoanh', event.target.value)}>{Object.values(TRANG_THAI_KINH_DOANH).map((giaTri) => <option key={giaTri} value={giaTri}>{giaTri}</option>)}</Select></Field>
      {sanPham && khuyenMai.length > 0 && <div className="sanPhamFormKhuyenMai"><strong>Giá bán hiện tại: {dinhDangTien(sanPham.giaBanThucTe)}</strong>{khuyenMai.map((muc, index) => <p key={muc._id || index}>Đang áp dụng chương trình “{muc.tenKhuyenMai || 'Khuyến mãi'}”{muc.ngayKetThuc ? ` đến ${dinhDangNgay(muc.ngayKetThuc)}` : ''}.</p>)}</div>}
    </div></Card>
    {loiChung && <p className="sanPhamFormLoi" role="alert">{loiChung}</p>}
    <div className="sanPhamFormActions"><Button variant="secondary" disabled={dangGui} onClick={() => navigate(DUONG_DAN.NGUOI_BAN.SAN_PHAM)}>Hủy</Button><Button type="submit" loading={dangGui}>Lưu sản phẩm</Button></div>
  </form>;
}
