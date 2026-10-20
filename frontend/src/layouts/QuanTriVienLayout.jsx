import { MENU_QUAN_TRI_VIEN } from '../utils/hangSo.js';
import QuanLyLayout from './QuanLyLayout.jsx';
import './QuanTriVienLayout.css';

export default function QuanTriVienLayout() {
  return <QuanLyLayout tieuDe="Khu vực Quản trị viên" menu={MENU_QUAN_TRI_VIEN} />;
}
