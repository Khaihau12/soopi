import { Link } from 'react-router-dom';
import { DUONG_DAN } from '../utils/hangSo.js';
import './KhongTimThayPage.css';

export default function KhongTimThayPage() {
  return (
    <section className="khongTimThayPage">
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn này không tồn tại. Hãy quay về trang chủ.</p>
      <Link to={DUONG_DAN.TRANG_CHU}>Về trang chủ</Link>
    </section>
  );
}
