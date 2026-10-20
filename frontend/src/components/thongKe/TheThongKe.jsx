import { Link } from 'react-router-dom';
import Skeleton from '../ui/Skeleton.jsx';
import './ThongKe.css';

export default function TheThongKe({ nhan, giaTri, chuThich, den, dangTai, nhanManh }) {
  const noiDung = <><span className="theThongKeNhan">{nhan}</span>{dangTai ? <Skeleton /> : <strong className="theThongKeGiaTri">{giaTri}</strong>}{chuThich && <small>{chuThich}</small>}</>;
  const lop = `theThongKe${nhanManh ? ' theThongKeNhanManh' : ''}`;
  return den ? <Link className={lop} to={den}>{noiDung}</Link> : <div className={lop}>{noiDung}</div>;
}
