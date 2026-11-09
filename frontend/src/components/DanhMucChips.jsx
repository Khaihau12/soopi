import { Link } from 'react-router-dom';
import { DUONG_DAN } from '../utils/hangSo.js';
import './DanhMucChips.css';

export default function DanhMucChips({ danhSach = [], danhMucId = '', query, duongDan = DUONG_DAN.SAN_PHAM, onChon }) {
  const danhMucHopLe = danhSach.filter((danhMuc) => /^[0-9a-f]{24}$/i.test(danhMuc._id));
  const taoDuongDan = (id) => {
    const moi = new URLSearchParams(query);
    moi.delete('trang');
    if (id) moi.set('danhMucId', id); else moi.delete('danhMucId');
    return duongDan + (moi.size ? `?${moi}` : '');
  };
  return <nav className="danhMucChips" aria-label="Lọc theo danh mục">
    <Link to={taoDuongDan('')} onClick={onChon} className={'danhMucChip' + (!danhMucId ? ' danhMucChipActive' : '')} aria-current={!danhMucId ? 'page' : undefined}>Tất cả</Link>
    {danhMucHopLe.map((danhMuc) => <Link key={danhMuc._id} to={taoDuongDan(danhMuc._id)} onClick={onChon} className={'danhMucChip' + (danhMucId === danhMuc._id ? ' danhMucChipActive' : '')} aria-current={danhMucId === danhMuc._id ? 'page' : undefined}>{danhMuc.tenDanhMuc}</Link>)}
  </nav>;
}
