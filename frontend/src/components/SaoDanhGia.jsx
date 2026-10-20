import { useId } from 'react';
import Icon from './ui/Icon.jsx';
import './SaoDanhGia.css';

const NHAN_SAO = ['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Rất tốt'];

export default function SaoDanhGia({ giaTri = 0, onChange, nhap = false }) {
  const tenNhom = useId();
  if (nhap) return <fieldset className="saoDanhGiaNhap"><legend>Chọn số sao *</legend><div className="saoDanhGiaLuaChon">
    {[1, 2, 3, 4, 5].map((so) => <label key={so} className="saoDanhGiaNhan">
      <input type="radio" name={tenNhom} value={so} checked={giaTri === so} onChange={() => onChange(so)} required={so === 1} />
      <Icon name={so <= giaTri ? 'starFill' : 'star'} size={28} /><span className="srOnly">{so} sao</span>
    </label>)}
    <span className="saoDanhGiaGoiY">{giaTri ? NHAN_SAO[giaTri - 1] : 'Chọn 1–5 sao'}</span>
  </div></fieldset>;
  const diem = Math.max(0, Math.min(5, Number(giaTri) || 0));
  return <span className="saoDanhGiaXem" role="img" aria-label={`${String(diem).replace('.', ',')} trên 5 sao`}>
    {[0, 1, 2, 3, 4].map((i) => <span key={i} className="saoDanhGiaHinh" aria-hidden="true"><Icon name="star" size={18} />
      <span className="saoDanhGiaPhu" style={{ width: `${Math.max(0, Math.min(1, diem - i)) * 100}%` }}><Icon name="starFill" size={18} /></span></span>)}
  </span>;
}
