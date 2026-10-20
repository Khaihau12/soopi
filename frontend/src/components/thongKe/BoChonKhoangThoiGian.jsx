import { useEffect, useState } from 'react';
import Button from '../ui/Button.jsx';
import './ThongKe.css';

const MS_NGAY = 86400000;
const layHomNay = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const lay = (ten) => parts.find((item) => item.type === ten).value;
  return `${lay('year')}-${lay('month')}-${lay('day')}`;
};
const truNgay = (ngay, soNgay) => new Date(Date.parse(`${ngay}T00:00:00Z`) - soNgay * MS_NGAY).toISOString().slice(0, 10);
const cacMoc = (loai) => {
  const denNgay = layHomNay();
  const tuNgay = loai === 'hom-nay' ? denNgay : loai === '7-ngay' ? truNgay(denNgay, 6) : loai === 'thang-nay' ? `${denNgay.slice(0, 7)}-01` : truNgay(denNgay, 29);
  return { tuNgay, denNgay };
};

export default function BoChonKhoangThoiGian({ tuNgay, denNgay, onChange }) {
  const [tuyChon, setTuyChon] = useState(false);
  const [nhapTu, setNhapTu] = useState(tuNgay);
  const [nhapDen, setNhapDen] = useState(denNgay);
  const [loi, setLoi] = useState('');
  useEffect(() => { setNhapTu(tuNgay); setNhapDen(denNgay); }, [tuNgay, denNgay]);
  const apDung = (event) => {
    event.preventDefault();
    const batDau = Date.parse(`${nhapTu}T00:00:00Z`);
    const ketThuc = Date.parse(`${nhapDen}T00:00:00Z`);
    if (!Number.isFinite(batDau) || !Number.isFinite(ketThuc) || batDau > ketThuc || (ketThuc - batDau) / MS_NGAY >= 366) {
      setLoi('Khoảng thời gian không hợp lệ, vui lòng chọn lại (tối đa 366 ngày).'); return;
    }
    setLoi(''); onChange({ tuNgay: nhapTu, denNgay: nhapDen });
  };
  const chonNhanh = (loai) => { setTuyChon(false); setLoi(''); onChange(cacMoc(loai)); };
  return <div className="boChonKhoang">
    <div className="boChonKhoangNut" role="group" aria-label="Chọn khoảng thời gian">
      {[["hom-nay", 'Hôm nay'], ['7-ngay', '7 ngày'], ['30-ngay', '30 ngày'], ['thang-nay', 'Tháng này']].map(([loai, nhan]) => {
        const moc = cacMoc(loai);
        return <button type="button" key={loai} aria-pressed={!tuyChon && tuNgay === moc.tuNgay && denNgay === moc.denNgay} onClick={() => chonNhanh(loai)}>{nhan}</button>;
      })}
      <button type="button" aria-pressed={tuyChon} onClick={() => setTuyChon(true)}>Tùy chọn</button>
    </div>
    {tuyChon && <form className="boChonKhoangForm" onSubmit={apDung}>
      <label>Từ ngày<input type="date" required value={nhapTu} onChange={(event) => setNhapTu(event.target.value)} /></label>
      <label>Đến ngày<input type="date" required value={nhapDen} onChange={(event) => setNhapDen(event.target.value)} /></label>
      <Button type="submit">Xem báo cáo</Button>
    </form>}
    {loi && <p className="boChonKhoangLoi" role="alert">{loi}</p>}
  </div>;
}

export { cacMoc };
