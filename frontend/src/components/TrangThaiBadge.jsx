import Badge from './ui/Badge.jsx';
import { MAU_TRANG_THAI } from '../utils/hangSo.js';
import './TrangThaiBadge.css';

export default function TrangThaiBadge({ trangThai }) {
  return <span className="trangThaiBadge"><Badge variant={MAU_TRANG_THAI[trangThai] || 'neutral'}>{trangThai}</Badge></span>;
}
