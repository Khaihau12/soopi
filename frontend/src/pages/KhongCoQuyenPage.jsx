import Button from '../components/ui/Button.jsx';
import { DUONG_DAN } from '../utils/hangSo.js';

export default function KhongCoQuyenPage() {
  return <main className="xacThucTrang"><div className="xacThucThe"><h1>Không có quyền truy cập</h1><p>Tài khoản của bạn không có quyền xem trang này.</p><Button to={DUONG_DAN.TRANG_CHU}>Về trang chủ</Button></div></main>;
}
