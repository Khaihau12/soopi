import { Link } from 'react-router-dom';
import { DUONG_DAN } from '../utils/hangSo.js';
import './DanhMucChips.css';

export default function DanhMucChips({ danhSach = [], danhMucId = '', tuKhoa = '', khuyenMaiId = '' }) {
  const danhMucHopLe = danhSach.filter((danhMuc) => /^[0-9a-f]{24}$/i.test(danhMuc._id));
  const taoDuongDan = (id) => {
    const query = new URLSearchParams();
    if (tuKhoa) query.set('tuKhoa', tuKhoa);
    if (khuyenMaiId) query.set('khuyenMaiId', khuyenMaiId);
    if (id) query.set('danhMucId', id);
    return DUONG_DAN.SAN_PHAM + (query.size ? `?${query}` : '');
  };
  return <nav className="danhMucChips" aria-label="Lọc theo danh mục">
    <Link to={taoDuongDan('')} className={'danhMucChip' + (!danhMucId ? ' danhMucChipActive' : '')} aria-current={!danhMucId ? 'page' : undefined}>Tất cả</Link>
    {danhMucHopLe.map((danhMuc) => <Link key={danhMuc._id} to={taoDuongDan(danhMuc._id)} className={'danhMucChip' + (danhMucId === danhMuc._id ? ' danhMucChipActive' : '')} aria-current={danhMucId === danhMuc._id ? 'page' : undefined}>{danhMuc.tenDanhMuc}</Link>)}
  </nav>;
}
