import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';
import Skeleton from './Skeleton.jsx';
import './DataTable.css';

export default function DataTable({ cot, hang, khoaHang, dangTai = false, loi, taiLai }) {
  if (dangTai) return <Skeleton variant="block" count={3} />;
  if (loi) return <ErrorState message={loi} taiLai={taiLai} />;
  if (!hang?.length) return <EmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện tại đây khi có thông tin." />;

  return <div className="dataTableWrap"><table className="dataTable"><thead><tr>{cot.map((col) => <th key={col.khoa} scope="col">{col.tieuDe}</th>)}</tr></thead><tbody>{hang.map((item, index) => <tr key={typeof khoaHang === 'function' ? khoaHang(item) : item[khoaHang] ?? index}>{cot.map((col) => <td key={col.khoa} data-label={col.tieuDe}>{col.render ? col.render(item[col.khoa], item) : item[col.khoa]}</td>)}</tr>)}</tbody></table></div>;
}
