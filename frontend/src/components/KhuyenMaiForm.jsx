import { useEffect, useState } from 'react';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import Field from './ui/Field.jsx';
import Input from './ui/Input.jsx';
import Modal from './ui/Modal.jsx';
import Pagination from './ui/Pagination.jsx';
import Select from './ui/Select.jsx';
import { layDanhSachSanPham, nguoiBanLayDanhSachSanPham } from '../services/sanPham.api.js';
import { dinhDangTien, taoUrlAnh } from '../utils/dinhDang.js';
import { LOAI_KHUYEN_MAI, PHAM_VI_KHUYEN_MAI } from '../utils/hangSo.js';
import './KhuyenMaiForm.css';

const gioVietNam = (giaTri) => {
  if (!giaTri) return '';
  const phan = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(giaTri));
  const lay = (ten) => phan.find((muc) => muc.type === ten)?.value;
  return `${lay('year')}-${lay('month')}-${lay('day')}T${lay('hour')}:${lay('minute')}`;
};

const taoDong = (muc) => ({
  sanPham: muc.sanPham,
  kieu: muc.tyLeGiam != null ? 'tyLeGiam' : 'giaKhuyenMai',
  giaTri: String(muc.tyLeGiam ?? muc.giaKhuyenMai ?? ''),
});

export default function KhuyenMaiForm({ phamVi, khuyenMai, onSubmit, dangGui, loiChung, onCancel }) {
  const laQuanTri = phamVi === PHAM_VI_KHUYEN_MAI.TOAN_SAN;
  const [tenKhuyenMai, setTenKhuyenMai] = useState(khuyenMai?.tenKhuyenMai || '');
  const [loaiKhuyenMai, setLoaiKhuyenMai] = useState(laQuanTri ? (khuyenMai?.loaiKhuyenMai || LOAI_KHUYEN_MAI.GIAM_GIA) : LOAI_KHUYEN_MAI.GIAM_GIA);
  const [ngayBatDau, setNgayBatDau] = useState(gioVietNam(khuyenMai?.ngayBatDau));
  const [ngayKetThuc, setNgayKetThuc] = useState(gioVietNam(khuyenMai?.ngayKetThuc));
  const [chiTiet, setChiTiet] = useState((khuyenMai?.chiTiet || []).filter((muc) => muc.sanPham).map(taoDong));
  const [loi, setLoi] = useState({});
  const [moChon, setMoChon] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trang, setTrang] = useState(1);
  const [ketQua, setKetQua] = useState({ danhSach: [], phanTrang: { trang: 1, tongTrang: 0 } });
  const [dangTaiSanPham, setDangTaiSanPham] = useState(false);
  const [loiSanPham, setLoiSanPham] = useState('');

  useEffect(() => {
    if (!moChon) return undefined;
    let conHieuLuc = true;
    setDangTaiSanPham(true); setLoiSanPham('');
    const lay = laQuanTri ? layDanhSachSanPham : nguoiBanLayDanhSachSanPham;
    lay({ tuKhoa, trang, gioiHan: 12 }).then((data) => { if (conHieuLuc) setKetQua(data); })
      .catch((loiApi) => { if (conHieuLuc) setLoiSanPham(loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTaiSanPham(false); });
    return () => { conHieuLuc = false; };
  }, [moChon, tuKhoa, trang, laQuanTri]);

  const themSanPham = (sanPham) => {
    if (chiTiet.some((dong) => dong.sanPham._id === sanPham._id)) return;
    setChiTiet((cu) => [...cu, { sanPham, kieu: 'tyLeGiam', giaTri: '' }]);
    setLoi((cu) => ({ ...cu, chiTiet: '' }));
  };
  const doiDong = (id, ten, giaTri) => {
    setChiTiet((cu) => cu.map((dong) => dong.sanPham._id === id ? { ...dong, [ten]: giaTri } : dong));
    setLoi((cu) => ({ ...cu, [id]: '' }));
  };
  const giaXemTruoc = (dong) => {
    const goc = Number(dong.sanPham.giaGoc);
    const so = Number(dong.giaTri);
    if (!dong.giaTri || !Number.isFinite(so) || so <= 0) return null;
    if (dong.kieu === 'tyLeGiam') return so < 100 ? Math.min(goc, Math.round(goc * (100 - so) / 100)) : null;
    return Number.isInteger(so) && so <= goc ? so : null;
  };

  const luu = (event) => {
    event.preventDefault();
    const cacLoi = {};
    if (!tenKhuyenMai.trim() || tenKhuyenMai.trim().length > 200) cacLoi.tenKhuyenMai = 'Tên chương trình cần từ 1 đến 200 ký tự.';
    if (!ngayBatDau) cacLoi.ngayBatDau = 'Vui lòng chọn thời gian bắt đầu.';
    if (!ngayKetThuc || new Date(`${ngayKetThuc}:00+07:00`) <= new Date(`${ngayBatDau}:00+07:00`) || new Date(`${ngayKetThuc}:00+07:00`) <= new Date()) cacLoi.ngayKetThuc = 'Thời gian kết thúc phải sau thời gian bắt đầu và sau hiện tại.';
    if (!chiTiet.length) cacLoi.chiTiet = 'Chọn ít nhất một sản phẩm.';
    for (const dong of chiTiet) {
      const so = Number(dong.giaTri);
      if (!dong.giaTri || !Number.isFinite(so) || (dong.kieu === 'tyLeGiam' ? so <= 0 || so >= 100 : !Number.isInteger(so) || so < 1 || so > dong.sanPham.giaGoc)) {
        cacLoi[dong.sanPham._id] = dong.kieu === 'tyLeGiam' ? 'Tỷ lệ giảm phải lớn hơn 0 và nhỏ hơn 100.' : 'Giá sau giảm phải là số nguyên từ 1 đồng đến giá gốc.';
      }
    }
    setLoi(cacLoi);
    if (Object.keys(cacLoi).length) { document.getElementById(`khuyen-mai-${Object.keys(cacLoi)[0]}`)?.focus(); return; }
    onSubmit({
      tenKhuyenMai: tenKhuyenMai.trim(), loaiKhuyenMai,
      ngayBatDau: new Date(`${ngayBatDau}:00+07:00`).toISOString(), ngayKetThuc: new Date(`${ngayKetThuc}:00+07:00`).toISOString(),
      chiTiet: chiTiet.map((dong) => ({ sanPhamId: dong.sanPham._id, [dong.kieu]: Number(dong.giaTri) })),
    });
  };

  return <form className="khuyenMaiForm" noValidate onSubmit={luu}>
    <Card><h2>Thông tin chương trình</h2><div className="khuyenMaiFormFields">
      <Field label="Tên chương trình" required error={loi.tenKhuyenMai}><Input id="khuyen-mai-tenKhuyenMai" value={tenKhuyenMai} maxLength={201} disabled={dangGui} onChange={(event) => setTenKhuyenMai(event.target.value)} /></Field>
      {laQuanTri ? <Field label="Loại khuyến mãi" required><Select value={loaiKhuyenMai} disabled={dangGui} onChange={(event) => setLoaiKhuyenMai(event.target.value)}>{Object.values(LOAI_KHUYEN_MAI).map((giaTri) => <option key={giaTri}>{giaTri}</option>)}</Select></Field>
        : <p>Người bán chỉ tạo chương trình giảm giá. Mức giảm được tính từ giá gốc của từng sản phẩm.</p>}
      <Field label="Bắt đầu" required hint="Giờ Việt Nam" error={loi.ngayBatDau}><Input id="khuyen-mai-ngayBatDau" type="datetime-local" value={ngayBatDau} disabled={dangGui} onChange={(event) => setNgayBatDau(event.target.value)} /></Field>
      <Field label="Kết thúc" required hint="Giờ Việt Nam" error={loi.ngayKetThuc}><Input id="khuyen-mai-ngayKetThuc" type="datetime-local" value={ngayKetThuc} disabled={dangGui} onChange={(event) => setNgayKetThuc(event.target.value)} /></Field>
    </div></Card>
    <Card><div className="khuyenMaiFormHeading"><h2>Sản phẩm tham gia</h2><Button variant="secondary" disabled={dangGui} onClick={() => setMoChon(true)}>Chọn sản phẩm</Button></div>
      {loi.chiTiet && <p className="khuyenMaiFormLoi" role="alert">{loi.chiTiet}</p>}
      {!chiTiet.length ? <p>Chưa chọn sản phẩm nào.</p> : <div className="khuyenMaiFormRows">{chiTiet.map((dong) => <div className="khuyenMaiFormRow" key={dong.sanPham._id}>
        <div><strong>{dong.sanPham.tenSanPham}</strong><span>Giá gốc: {dinhDangTien(dong.sanPham.giaGoc)}</span></div>
        <Field label={`Kiểu giảm cho ${dong.sanPham.tenSanPham}`}><Select value={dong.kieu} disabled={dangGui} onChange={(event) => { doiDong(dong.sanPham._id, 'kieu', event.target.value); doiDong(dong.sanPham._id, 'giaTri', ''); }}><option value="tyLeGiam">Theo phần trăm</option><option value="giaKhuyenMai">Theo giá sau giảm</option></Select></Field>
        <Field label={dong.kieu === 'tyLeGiam' ? 'Mức giảm (%)' : 'Giá sau giảm (đ)'} error={loi[dong.sanPham._id]}><Input id={`khuyen-mai-${dong.sanPham._id}`} type="number" min={dong.kieu === 'tyLeGiam' ? '0.01' : '1'} max={dong.kieu === 'tyLeGiam' ? '99.99' : dong.sanPham.giaGoc} step={dong.kieu === 'tyLeGiam' ? '0.01' : '1'} value={dong.giaTri} disabled={dangGui} onChange={(event) => doiDong(dong.sanPham._id, 'giaTri', event.target.value)} /></Field>
        <div className="khuyenMaiFormPreview">Giá sau khuyến mãi: <strong>{giaXemTruoc(dong) === null ? '—' : dinhDangTien(giaXemTruoc(dong))}</strong></div>
        <Button variant="ghost" disabled={dangGui} onClick={() => setChiTiet((cu) => cu.filter((muc) => muc.sanPham._id !== dong.sanPham._id))} aria-label={`Bỏ sản phẩm ${dong.sanPham.tenSanPham}`}>Bỏ</Button>
      </div>)}</div>}
    </Card>
    {loiChung && <p className="khuyenMaiFormLoi" role="alert">{loiChung}</p>}
    <div className="khuyenMaiFormActions"><Button variant="secondary" disabled={dangGui} onClick={onCancel}>Hủy</Button><Button type="submit" loading={dangGui}>Lưu chương trình</Button></div>
    <Modal open={moChon} onClose={() => setMoChon(false)} title="Chọn sản phẩm"><div className="khuyenMaiPicker">
      <Field label="Tìm sản phẩm"><Input value={tuKhoa} onChange={(event) => { setTuKhoa(event.target.value); setTrang(1); }} placeholder="Nhập tên sản phẩm" /></Field>
      {dangTaiSanPham ? <p>Đang tải sản phẩm…</p> : loiSanPham ? <p className="khuyenMaiFormLoi" role="alert">{loiSanPham}</p> : !ketQua.danhSach.length ? <p>Không có sản phẩm phù hợp.</p> : <div className="khuyenMaiPickerList">{ketQua.danhSach.map((sanPham) => <div key={sanPham._id}>
        {taoUrlAnh(sanPham.hinhAnh?.[0]) && <img src={taoUrlAnh(sanPham.hinhAnh[0])} alt="" />}
        <span>{sanPham.tenSanPham}<small>{dinhDangTien(sanPham.giaGoc)}</small></span>
        <Button variant="secondary" size="sm" disabled={chiTiet.some((dong) => dong.sanPham._id === sanPham._id)} onClick={() => themSanPham(sanPham)}>{chiTiet.some((dong) => dong.sanPham._id === sanPham._id) ? 'Đã chọn' : 'Chọn'}</Button>
      </div>)}</div>}
      <Pagination trang={ketQua.phanTrang.trang} tongTrang={ketQua.phanTrang.tongTrang} onChange={setTrang} />
      <Button onClick={() => setMoChon(false)}>Xong</Button>
    </div></Modal>
  </form>;
}
