import { useEffect, useState } from 'react';
import Button from './ui/Button.jsx';
import ConfirmDialog from './ui/ConfirmDialog.jsx';
import Field from './ui/Field.jsx';
import Input from './ui/Input.jsx';
import Modal from './ui/Modal.jsx';
import Select from './ui/Select.jsx';
import { KIEU_GIAM, LOAI_VOUCHER } from '../utils/hangSo.js';
import { dinhDangTien } from '../utils/dinhDang.js';
import { moTaVoucher } from '../utils/voucher.js';
import './VoucherForm.css';

const gioVietNam = (ngay) => {
  const moc = new Date(ngay);
  return Number.isNaN(moc.getTime()) ? '' : new Date(moc.getTime() + 7 * 3600000).toISOString().slice(0, 16);
};
const ngayUtc = (giaTri) => new Date(giaTri + ':00+07:00');
const taoDuLieu = (voucher, nhanBan, laQuanTri) => {
  const goc = voucher || nhanBan;
  const batDau = gioVietNam(new Date());
  const doDai = nhanBan ? Math.max(1, Math.round((new Date(nhanBan.ngayKetThuc) - new Date(nhanBan.ngayBatDau)) / 86400000)) : 7;
  return {
    maVoucher: voucher?.maVoucher || '', tenVoucher: goc?.tenVoucher || (laQuanTri ? 'Ưu đãi Soopi' : 'Ưu đãi cửa hàng'),
    loaiVoucher: laQuanTri ? (goc?.loaiVoucher || LOAI_VOUCHER.TOAN_SAN) : LOAI_VOUCHER.CUA_HANG,
    kieuGiam: goc?.kieuGiam || KIEU_GIAM.PHAN_TRAM, giaTriGiam: goc?.giaTriGiam ?? '',
    giamToiDa: goc?.giamToiDa ?? '', giaTriDonToiThieu: goc?.giaTriDonToiThieu ?? 0, soLuong: goc?.soLuong ?? 1,
    ngayBatDau: voucher ? gioVietNam(voucher.ngayBatDau) : batDau,
    ngayKetThuc: voucher ? gioVietNam(voucher.ngayKetThuc) : gioVietNam(new Date(new Date().getTime() + doDai * 86400000)),
  };
};

export default function VoucherForm({ voucher, nhanBan, laQuanTri, dangGui, loiChung, onClose, onSubmit }) {
  const [duLieu, setDuLieu] = useState(() => taoDuLieu(voucher, nhanBan, laQuanTri));
  const [banDau] = useState(() => taoDuLieu(voucher, nhanBan, laQuanTri));
  const [loi, setLoi] = useState({});
  const [xacNhanHuy, setXacNhanHuy] = useState(false);
  const daSua = Object.keys(duLieu).some((ten) => String(duLieu[ten]) !== String(banDau[ten]));
  const doi = (ten, giaTri) => { setDuLieu((cu) => ({ ...cu, [ten]: giaTri })); setLoi((cu) => ({ ...cu, [ten]: '' })); };
  const dong = () => daSua ? setXacNhanHuy(true) : onClose();
  const taoMa = () => {
    const chu = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const so = crypto.getRandomValues(new Uint8Array(8));
    doi('maVoucher', 'SOOPI' + Array.from(so, (muc) => chu[muc % chu.length]).join(''));
  };
  const datNgay = (so) => {
    const batDau = ngayUtc(duLieu.ngayBatDau);
    if (!Number.isNaN(batDau.getTime())) doi('ngayKetThuc', gioVietNam(new Date(batDau.getTime() + so * 86400000)));
  };
  const luu = (event) => {
    event.preventDefault();
    if (dangGui) return;
    const cacLoi = {};
    const ma = duLieu.maVoucher.trim(), so = Number(duLieu.giaTriGiam);
    const toiDa = Number(duLieu.giamToiDa), toiThieu = Number(duLieu.giaTriDonToiThieu), soLuong = Number(duLieu.soLuong);
    if (!voucher && !/^[A-Z0-9]{4,20}$/.test(ma)) cacLoi.maVoucher = 'Mã chỉ gồm 4–20 chữ hoặc số.';
    if (!duLieu.tenVoucher.trim() || duLieu.tenVoucher.trim().length > 200) cacLoi.tenVoucher = 'Tên voucher cần từ 1 đến 200 ký tự.';
    if (duLieu.giaTriGiam === '' || !Number.isSafeInteger(so) || so < 1 || (duLieu.kieuGiam === KIEU_GIAM.PHAN_TRAM && so > 100)) cacLoi.giaTriGiam = 'Mức giảm phải là số nguyên hợp lệ.';
    if (duLieu.kieuGiam === KIEU_GIAM.PHAN_TRAM && duLieu.giamToiDa !== '' && (!Number.isSafeInteger(toiDa) || toiDa < 1)) cacLoi.giamToiDa = 'Giảm tối đa phải từ 1đ.';
    if (duLieu.giaTriDonToiThieu === '' || !Number.isSafeInteger(toiThieu) || toiThieu < 0) cacLoi.giaTriDonToiThieu = 'Đơn tối thiểu phải là số nguyên không âm.';
    if (duLieu.soLuong === '' || !Number.isSafeInteger(soLuong) || soLuong < (voucher ? 0 : 1)) cacLoi.soLuong = voucher ? 'Số lượt không được âm.' : 'Số lượt phải từ 1 trở lên.';
    if (!duLieu.ngayBatDau || Number.isNaN(ngayUtc(duLieu.ngayBatDau).getTime())) cacLoi.ngayBatDau = 'Chọn thời gian bắt đầu hợp lệ.';
    if (!duLieu.ngayKetThuc || Number.isNaN(ngayUtc(duLieu.ngayKetThuc).getTime()) || ngayUtc(duLieu.ngayKetThuc) <= ngayUtc(duLieu.ngayBatDau) || (!voucher && ngayUtc(duLieu.ngayKetThuc) <= new Date())) cacLoi.ngayKetThuc = 'Kết thúc phải sau bắt đầu' + (voucher ? '.' : ' và sau hiện tại.');
    setLoi(cacLoi);
    if (Object.keys(cacLoi).length) { document.getElementById('voucher-' + Object.keys(cacLoi)[0])?.focus(); return; }
    onSubmit({
      ...(!voucher ? { maVoucher: ma, ...(laQuanTri ? { loaiVoucher: duLieu.loaiVoucher } : {}) } : {}),
      tenVoucher: duLieu.tenVoucher.trim(), kieuGiam: duLieu.kieuGiam, giaTriGiam: so,
      giamToiDa: duLieu.kieuGiam === KIEU_GIAM.PHAN_TRAM && duLieu.giamToiDa !== '' ? toiDa : null,
      giaTriDonToiThieu: toiThieu, soLuong,
      ngayBatDau: ngayUtc(duLieu.ngayBatDau).toISOString(), ngayKetThuc: ngayUtc(duLieu.ngayKetThuc).toISOString(),
    });
  };
  const xemTruoc = { ...duLieu, giaTriGiam: Number(duLieu.giaTriGiam) || 0, giamToiDa: duLieu.kieuGiam === KIEU_GIAM.PHAN_TRAM && duLieu.giamToiDa !== '' ? Number(duLieu.giamToiDa) : null, giaTriDonToiThieu: Number(duLieu.giaTriDonToiThieu) || 0 };
  const loiMa = loi.maVoucher || (!voucher && loiChung?.includes('Mã voucher đã tồn tại') ? loiChung : '');
  useEffect(() => { if (loiChung?.includes('Mã voucher đã tồn tại')) document.getElementById('voucher-maVoucher')?.focus(); }, [loiChung]);
  const hieuLuc = (ngayUtc(duLieu.ngayKetThuc) - ngayUtc(duLieu.ngayBatDau)) / 86400000;
  return <>
    <Modal open onClose={dangGui ? undefined : dong} title={voucher ? 'Sửa voucher' : 'Tạo voucher'}>
      <form className="voucherForm" noValidate onSubmit={luu}>
        <div className="voucherFormMain"><div className="voucherFormGroups">
          <section><h3>Thông tin</h3>
            <div className="voucherFormInline"><Field label="Mã voucher" required error={loiMa}><Input id="voucher-maVoucher" value={duLieu.maVoucher} maxLength={20} readOnly={Boolean(voucher)} disabled={dangGui} onChange={(event) => doi('maVoucher', event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} /></Field><Button variant="secondary" onClick={voucher ? () => navigator.clipboard.writeText(duLieu.maVoucher) : taoMa}>{voucher ? 'Sao chép' : 'Tạo mã gợi ý'}</Button></div><small>{duLieu.maVoucher.length}/20 ký tự</small>
            <Field label="Tên voucher" required error={loi.tenVoucher}><Input id="voucher-tenVoucher" value={duLieu.tenVoucher} maxLength={201} disabled={dangGui} onChange={(event) => doi('tenVoucher', event.target.value)} /></Field>
            {laQuanTri && <Field label="Loại voucher" required><Select value={duLieu.loaiVoucher} disabled={Boolean(voucher) || dangGui} onChange={(event) => doi('loaiVoucher', event.target.value)}><option value={LOAI_VOUCHER.TOAN_SAN}>Toàn sàn</option><option value={LOAI_VOUCHER.FREESHIP}>Freeship</option></Select></Field>}
          </section>
          <section><h3>Ưu đãi</h3>
            <div className="voucherFormSegment" role="group" aria-label="Kiểu giảm">{Object.values(KIEU_GIAM).map((muc) => <button type="button" key={muc} aria-pressed={duLieu.kieuGiam === muc} onClick={() => doi('kieuGiam', muc)}>{muc}</button>)}</div>
            <Field label={duLieu.kieuGiam === KIEU_GIAM.PHAN_TRAM ? 'Giá trị giảm (%)' : 'Giá trị giảm (đ)'} required error={loi.giaTriGiam}><Input id="voucher-giaTriGiam" type="number" min="1" max={duLieu.kieuGiam === KIEU_GIAM.PHAN_TRAM ? '100' : undefined} step="1" value={duLieu.giaTriGiam} disabled={dangGui} onChange={(event) => doi('giaTriGiam', event.target.value)} /></Field>
            <div className="voucherFormChips">{(duLieu.kieuGiam === KIEU_GIAM.PHAN_TRAM ? [5, 10, 15, 20, 30, 50] : [10000, 20000, 50000, 100000]).map((muc) => <Button key={muc} size="sm" variant="secondary" onClick={() => doi('giaTriGiam', String(muc))}>{duLieu.kieuGiam === KIEU_GIAM.PHAN_TRAM ? muc + '%' : dinhDangTien(muc)}</Button>)}</div>
            {duLieu.kieuGiam !== KIEU_GIAM.PHAN_TRAM && duLieu.giaTriGiam !== '' && <small>Giảm {dinhDangTien(Number(duLieu.giaTriGiam))}</small>}
            {duLieu.kieuGiam === KIEU_GIAM.PHAN_TRAM && <Field label="Giảm tối đa (đ)" hint="Để trống nếu không giới hạn" error={loi.giamToiDa}><Input id="voucher-giamToiDa" type="number" min="1" step="1" value={duLieu.giamToiDa} disabled={dangGui} onChange={(event) => doi('giamToiDa', event.target.value)} /></Field>}
            <Field label="Đơn tối thiểu (đ)" required hint={laQuanTri ? 'Tính theo tổng tiền hàng toàn bộ đơn.' : 'Tính theo tổng tiền hàng của cửa hàng bạn trong đơn.'} error={loi.giaTriDonToiThieu}><Input id="voucher-giaTriDonToiThieu" type="number" min="0" step="1" value={duLieu.giaTriDonToiThieu} disabled={dangGui} onChange={(event) => doi('giaTriDonToiThieu', event.target.value)} /></Field>
            {duLieu.kieuGiam === KIEU_GIAM.SO_TIEN_CO_DINH && Number(duLieu.giaTriDonToiThieu) > 0 && Number(duLieu.giaTriGiam) > Number(duLieu.giaTriDonToiThieu) && <p className="voucherFormHint">Mức giảm lớn hơn giá trị đơn tối thiểu.</p>}
          </section>
          <section><h3>Số lượng và thời gian</h3>
            {voucher?.soDonDaApDung > 0 && <p>Voucher đã được dùng cho {voucher.soDonDaApDung} đơn.</p>}
            <Field label={voucher ? 'Số lượt còn lại' : 'Số lượt sử dụng'} required error={loi.soLuong}><Input id="voucher-soLuong" type="number" min={voucher ? '0' : '1'} step="1" value={duLieu.soLuong} disabled={dangGui} onChange={(event) => doi('soLuong', event.target.value)} /></Field>
            <div className="voucherFormInline"><Field label="Bắt đầu" required hint="Giờ Việt Nam" error={loi.ngayBatDau}><Input id="voucher-ngayBatDau" type="datetime-local" value={duLieu.ngayBatDau} disabled={dangGui} onChange={(event) => doi('ngayBatDau', event.target.value)} /></Field><Button variant="secondary" onClick={() => doi('ngayBatDau', gioVietNam(new Date()))}>Bây giờ</Button></div>
            <Field label="Kết thúc" required hint="Giờ Việt Nam" error={loi.ngayKetThuc}><Input id="voucher-ngayKetThuc" type="datetime-local" value={duLieu.ngayKetThuc} disabled={dangGui} onChange={(event) => doi('ngayKetThuc', event.target.value)} /></Field>
            <div className="voucherFormChips">{[7, 14, 30].map((so) => <Button key={so} size="sm" variant="secondary" onClick={() => datNgay(so)}>{so} ngày</Button>)}</div>
            {Number.isFinite(hieuLuc) && hieuLuc > 0 && <small>Hiệu lực {Math.round(hieuLuc * 10) / 10} ngày</small>}
          </section>
        </div><aside className="voucherFormPreview"><strong>Xem trước voucher</strong><div className="voucherFormTicket"><strong>{duLieu.maVoucher || 'MÃ VOUCHER'}</strong><p>{moTaVoucher(xemTruoc)}</p><small>Hạn dùng: {duLieu.ngayKetThuc ? new Date(ngayUtc(duLieu.ngayKetThuc)).toLocaleString('vi-VN') : 'Chưa chọn'}</small></div></aside></div>
        {loiChung && !loiMa && <p className="voucherFormLoi" role="alert">{loiChung}</p>}
        <div className="voucherFormActions"><Button variant="secondary" disabled={dangGui} onClick={dong}>Hủy</Button><Button type="submit" loading={dangGui}>Lưu voucher</Button></div>
      </form>
    </Modal>
    <ConfirmDialog open={xacNhanHuy} title="Hủy thay đổi?" message="Những thay đổi chưa lưu sẽ bị mất." danger confirmLabel="Hủy thay đổi" onClose={() => setXacNhanHuy(false)} onConfirm={onClose} />
  </>;
}
