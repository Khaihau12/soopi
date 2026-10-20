import { useState } from 'react';
import Button from './ui/Button.jsx';
import Field from './ui/Field.jsx';
import Input from './ui/Input.jsx';
import Modal from './ui/Modal.jsx';
import Select from './ui/Select.jsx';
import { KIEU_GIAM, LOAI_VOUCHER } from '../utils/hangSo.js';
import { moTaVoucher } from '../utils/voucher.js';
import './VoucherForm.css';

const gioVietNam = (ngay) => {
  if (!ngay) return '';
  const phan = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ngay));
  const lay = (ten) => phan.find((muc) => muc.type === ten)?.value;
  return `${lay('year')}-${lay('month')}-${lay('day')}T${lay('hour')}:${lay('minute')}`;
};

export default function VoucherForm({ voucher, laQuanTri, dangGui, loiChung, onClose, onSubmit }) {
  const [duLieu, setDuLieu] = useState({
    maVoucher: voucher?.maVoucher || '', tenVoucher: voucher?.tenVoucher || '',
    loaiVoucher: voucher?.loaiVoucher || LOAI_VOUCHER.TOAN_SAN,
    kieuGiam: voucher?.kieuGiam || KIEU_GIAM.PHAN_TRAM,
    giaTriGiam: voucher?.giaTriGiam ?? '', giamToiDa: voucher?.giamToiDa ?? '',
    giaTriDonToiThieu: voucher?.giaTriDonToiThieu ?? 0, soLuong: voucher?.soLuong ?? '',
    ngayBatDau: gioVietNam(voucher?.ngayBatDau), ngayKetThuc: gioVietNam(voucher?.ngayKetThuc),
  });
  const [loi, setLoi] = useState({});
  const doi = (ten, giaTri) => { setDuLieu((cu) => ({ ...cu, [ten]: giaTri })); setLoi((cu) => ({ ...cu, [ten]: '' })); };
  const luu = (event) => {
    event.preventDefault();
    const cacLoi = {};
    const ma = duLieu.maVoucher.trim().toUpperCase();
    const so = Number(duLieu.giaTriGiam);
    const toiDa = Number(duLieu.giamToiDa);
    const toiThieu = Number(duLieu.giaTriDonToiThieu);
    const soLuong = Number(duLieu.soLuong);
    if (!voucher && !/^[A-Z0-9]{4,20}$/.test(ma)) cacLoi.maVoucher = 'Mã chỉ gồm 4–20 chữ hoặc số, không có khoảng trắng.';
    if (!duLieu.tenVoucher.trim() || duLieu.tenVoucher.trim().length > 200) cacLoi.tenVoucher = 'Tên voucher cần từ 1 đến 200 ký tự.';
    if (duLieu.giaTriGiam === '' || !Number.isInteger(so) || so < 1 || (duLieu.kieuGiam === KIEU_GIAM.PHAN_TRAM && so > 100)) cacLoi.giaTriGiam = 'Giá trị giảm phải là số nguyên từ 1 đến 100% hoặc từ 1đ.';
    if (duLieu.giamToiDa !== '' && (!Number.isInteger(toiDa) || toiDa < 1)) cacLoi.giamToiDa = 'Giảm tối đa phải là số nguyên từ 1đ.';
    if (duLieu.giaTriDonToiThieu === '' || !Number.isInteger(toiThieu) || toiThieu < 0) cacLoi.giaTriDonToiThieu = 'Đơn tối thiểu phải là số nguyên không âm.';
    if (duLieu.soLuong === '' || !Number.isInteger(soLuong) || soLuong < (voucher ? 0 : 1)) cacLoi.soLuong = voucher ? 'Số lượng không được âm.' : 'Số lượng phải từ 1 trở lên.';
    if (!duLieu.ngayBatDau) cacLoi.ngayBatDau = 'Vui lòng chọn thời gian bắt đầu.';
    if (!duLieu.ngayKetThuc || new Date(`${duLieu.ngayKetThuc}:00+07:00`) <= new Date(`${duLieu.ngayBatDau}:00+07:00`) || (!voucher && new Date(`${duLieu.ngayKetThuc}:00+07:00`) <= new Date())) {
      cacLoi.ngayKetThuc = 'Thời gian kết thúc phải sau lúc bắt đầu' + (voucher ? '.' : ' và sau hiện tại.');
    }
    setLoi(cacLoi);
    if (Object.keys(cacLoi).length) { document.getElementById(`voucher-${Object.keys(cacLoi)[0]}`)?.focus(); return; }
    onSubmit({
      ...(!voucher ? { maVoucher: ma, ...(laQuanTri ? { loaiVoucher: duLieu.loaiVoucher } : {}) } : {}),
      tenVoucher: duLieu.tenVoucher.trim(), kieuGiam: duLieu.kieuGiam, giaTriGiam: so,
      giamToiDa: duLieu.giamToiDa === '' ? null : toiDa,
      giaTriDonToiThieu: toiThieu, soLuong,
      ngayBatDau: new Date(`${duLieu.ngayBatDau}:00+07:00`).toISOString(),
      ngayKetThuc: new Date(`${duLieu.ngayKetThuc}:00+07:00`).toISOString(),
    });
  };
  const xemTruoc = { ...duLieu, giaTriGiam: Number(duLieu.giaTriGiam) || 0, giamToiDa: duLieu.giamToiDa === '' ? null : Number(duLieu.giamToiDa), giaTriDonToiThieu: Number(duLieu.giaTriDonToiThieu) || 0, loaiVoucher: laQuanTri ? duLieu.loaiVoucher : LOAI_VOUCHER.CUA_HANG };
  return <Modal open onClose={dangGui ? undefined : onClose} title={voucher ? 'Sửa voucher' : 'Tạo voucher'}>
    <form className="voucherForm" noValidate onSubmit={luu}>
      <div className="voucherFormFields">
        <Field label="Mã voucher" required error={loi.maVoucher}><Input id="voucher-maVoucher" value={duLieu.maVoucher} maxLength={20} disabled={Boolean(voucher) || dangGui} onChange={(event) => doi('maVoucher', event.target.value)} /></Field>
        <Field label="Tên voucher" required error={loi.tenVoucher}><Input id="voucher-tenVoucher" value={duLieu.tenVoucher} maxLength={201} disabled={dangGui} onChange={(event) => doi('tenVoucher', event.target.value)} /></Field>
        {laQuanTri && <Field label="Loại voucher" required><Select value={duLieu.loaiVoucher} disabled={Boolean(voucher) || dangGui} onChange={(event) => doi('loaiVoucher', event.target.value)}><option value={LOAI_VOUCHER.TOAN_SAN}>{LOAI_VOUCHER.TOAN_SAN}</option><option value={LOAI_VOUCHER.FREESHIP}>{LOAI_VOUCHER.FREESHIP}</option></Select></Field>}
        <Field label="Kiểu giảm" required><Select value={duLieu.kieuGiam} disabled={dangGui} onChange={(event) => doi('kieuGiam', event.target.value)}>{Object.values(KIEU_GIAM).map((muc) => <option key={muc}>{muc}</option>)}</Select></Field>
        <Field label={`Giá trị giảm (${duLieu.kieuGiam === KIEU_GIAM.PHAN_TRAM ? '%' : 'đ'})`} required error={loi.giaTriGiam}><Input id="voucher-giaTriGiam" type="number" min="1" max={duLieu.kieuGiam === KIEU_GIAM.PHAN_TRAM ? '100' : undefined} step="1" value={duLieu.giaTriGiam} disabled={dangGui} onChange={(event) => doi('giaTriGiam', event.target.value)} /></Field>
        <Field label="Giảm tối đa (đ)" hint="Để trống nếu không giới hạn" error={loi.giamToiDa}><Input id="voucher-giamToiDa" type="number" min="1" step="1" value={duLieu.giamToiDa} disabled={dangGui} onChange={(event) => doi('giamToiDa', event.target.value)} /></Field>
        <Field label="Đơn tối thiểu (đ)" required error={loi.giaTriDonToiThieu}><Input id="voucher-giaTriDonToiThieu" type="number" min="0" step="1" value={duLieu.giaTriDonToiThieu} disabled={dangGui} onChange={(event) => doi('giaTriDonToiThieu', event.target.value)} /></Field>
        <Field label="Số lượng còn lại" required error={loi.soLuong}><Input id="voucher-soLuong" type="number" min={voucher ? '0' : '1'} step="1" value={duLieu.soLuong} disabled={dangGui} onChange={(event) => doi('soLuong', event.target.value)} /></Field>
        <Field label="Bắt đầu" required hint="Giờ Việt Nam" error={loi.ngayBatDau}><Input id="voucher-ngayBatDau" type="datetime-local" value={duLieu.ngayBatDau} disabled={dangGui} onChange={(event) => doi('ngayBatDau', event.target.value)} /></Field>
        <Field label="Kết thúc" required hint="Giờ Việt Nam" error={loi.ngayKetThuc}><Input id="voucher-ngayKetThuc" type="datetime-local" value={duLieu.ngayKetThuc} disabled={dangGui} onChange={(event) => doi('ngayKetThuc', event.target.value)} /></Field>
      </div>
      <p className="voucherFormPreview">Xem trước: {moTaVoucher(xemTruoc)}</p>
      {loiChung && <p className="voucherFormLoi" role="alert">{loiChung}</p>}
      <div className="voucherFormActions"><Button variant="secondary" disabled={dangGui} onClick={onClose}>Hủy</Button><Button type="submit" loading={dangGui}>Lưu voucher</Button></div>
    </form>
  </Modal>;
}
