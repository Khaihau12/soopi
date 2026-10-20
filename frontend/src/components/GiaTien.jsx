import { dinhDangTien } from '../utils/dinhDang.js';
import './GiaTien.css';

export default function GiaTien({ giaGoc, giaBanThucTe, kichThuoc = 'vua' }) {
  const giaGocSo = Number(giaGoc);
  const giaBanSo = giaBanThucTe === undefined || giaBanThucTe === null ? giaGocSo : Number(giaBanThucTe);
  if (!Number.isFinite(giaBanSo) || giaBanSo < 0) return null;
  const coKhuyenMai = Number.isFinite(giaGocSo) && giaGocSo > 0 && giaBanSo < giaGocSo;
  const phanTram = coKhuyenMai ? Math.round((giaGocSo - giaBanSo) / giaGocSo * 100) : 0;

  return <div className={'giaTien giaTien' + kichThuoc[0].toUpperCase() + kichThuoc.slice(1)}><strong className={coKhuyenMai ? 'giaTienGiam' : ''}>{dinhDangTien(giaBanSo)}</strong>{coKhuyenMai && <><del>{dinhDangTien(giaGocSo)}</del><span className="giaTienNhan">-{phanTram}%</span></>}</div>;
}
