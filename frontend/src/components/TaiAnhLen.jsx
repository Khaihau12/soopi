import { useRef, useState } from 'react';
import Button from './ui/Button.jsx';
import { taiAnhLen } from '../services/tepTin.api.js';
import { taoUrlAnh } from '../utils/dinhDang.js';
import './TaiAnhLen.css';

const LOAI_ANH = ['image/jpeg', 'image/png', 'image/webp'];
const GIOI_HAN = 5 * 1024 * 1024;

export default function TaiAnhLen({ value = [], onChange, toiDa = 8, disabled = false, loaiAnh = 'sản phẩm' }) {
  const inputRef = useRef(null);
  const [dangTai, setDangTai] = useState('');
  const [loi, setLoi] = useState('');
  const [keoQua, setKeoQua] = useState(false);

  const xuLyTep = async (tepDuocChon) => {
    const cacTep = Array.from(tepDuocChon || []);
    if (!cacTep.length || dangTai || disabled) return;
    let danhSach = [...value];
    setLoi('');
    if (danhSach.length + cacTep.length > toiDa) {
      setLoi(`Chỉ được chọn tối đa ${toiDa} ảnh.`);
      return;
    }
    for (const tep of cacTep) {
      if (!LOAI_ANH.includes(tep.type)) { setLoi(`“${tep.name}”: chỉ nhận ảnh JPG, PNG, WEBP.`); continue; }
      if (tep.size > GIOI_HAN) { setLoi(`“${tep.name}”: ảnh vượt quá 5 MB.`); continue; }
      setDangTai(tep.name);
      try {
        const { duongDan } = await taiAnhLen(tep);
        danhSach = [...danhSach, duongDan];
        onChange(danhSach);
      } catch (loiTai) { setLoi(`“${tep.name}”: ${loiTai.message}`); }
    }
    setDangTai('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const boAnh = (viTri) => onChange(value.filter((_, index) => index !== viTri));
  const datAnhChinh = (viTri) => onChange([value[viTri], ...value.filter((_, index) => index !== viTri)]);

  return <div className="taiAnhLen">
    <div className={`taiAnhLenDrop ${keoQua ? 'taiAnhLenDropActive' : ''}`} onDragOver={(event) => { event.preventDefault(); if (!disabled) setKeoQua(true); }} onDragLeave={() => setKeoQua(false)} onDrop={(event) => { event.preventDefault(); setKeoQua(false); xuLyTep(event.dataTransfer.files); }}>
      <input ref={inputRef} id="san-pham-hinh-anh" type="file" accept="image/jpeg,image/png,image/webp" multiple={toiDa > 1} disabled={disabled || Boolean(dangTai) || value.length >= toiDa} className="taiAnhLenInput" onChange={(event) => xuLyTep(event.target.files)} />
      <label htmlFor="san-pham-hinh-anh">Chọn ảnh hoặc kéo ảnh vào đây</label>
      <p>Tối đa {toiDa} ảnh, JPG/PNG/WEBP, mỗi ảnh không quá 5 MB.{toiDa > 1 ? ' Ảnh đầu tiên là ảnh chính.' : ''}</p>
    </div>
    {dangTai && <p role="status">Đang tải “{dangTai}”…</p>}
    {loi && <p className="taiAnhLenLoi" role="alert">{loi}</p>}
    {value.length > 0 && <ul className="taiAnhLenList">{value.map((duongDan, index) => <li key={`${duongDan}-${index}`}>
      <img src={taoUrlAnh(duongDan)} alt={`Ảnh ${loaiAnh} ${index + 1}`} />
      <span>{toiDa === 1 ? `Ảnh ${loaiAnh}` : index === 0 ? 'Ảnh chính' : `Ảnh ${index + 1}`}</span>
      <div className="taiAnhLenActions">
        {index > 0 && <Button variant="ghost" size="sm" disabled={disabled || Boolean(dangTai)} onClick={() => datAnhChinh(index)} aria-label={`Đặt ảnh ${index + 1} làm ảnh chính`}>Đặt làm ảnh chính</Button>}
        <Button variant="ghost" size="sm" disabled={disabled || Boolean(dangTai)} onClick={() => boAnh(index)} aria-label={`Xóa ảnh ${index + 1}`}>Xóa</Button>
      </div>
    </li>)}</ul>}
  </div>;
}
