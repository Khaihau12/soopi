import Button from './Button.jsx';
import './Pagination.css';

export default function Pagination({ trang, tongTrang, onChange }) {
  if (tongTrang <= 1) return null;
  const dau = Math.max(1, Math.min(trang - 2, tongTrang - 4));
  const cuoi = Math.min(tongTrang, dau + 4);
  const cacTrang = [];
  if (dau > 1) cacTrang.push(1);
  if (dau > 2) cacTrang.push('dauChamDau');
  for (let so = dau; so <= cuoi; so++) cacTrang.push(so);
  if (cuoi < tongTrang - 1) cacTrang.push('dauChamCuoi');
  if (cuoi < tongTrang) cacTrang.push(tongTrang);

  return <nav className="pagination" aria-label="Phân trang"><Button variant="secondary" disabled={trang <= 1} onClick={() => onChange(trang - 1)}>Trước</Button><div className="paginationPages">{cacTrang.map((so) => typeof so === 'number' ? <button key={so} type="button" className="paginationPage" aria-label={'Trang ' + so} aria-current={so === trang ? 'page' : undefined} onClick={() => onChange(so)}>{so}</button> : <span key={so} aria-hidden="true">…</span>)}</div><Button variant="secondary" disabled={trang >= tongTrang} onClick={() => onChange(trang + 1)}>Sau</Button></nav>;
}
