import './Avatar.css';

export default function Avatar({ hoTen = '' }) {
  const chu = hoTen.trim().charAt(0).toLocaleUpperCase('vi-VN') || '?';
  return <span className="avatar" aria-label={hoTen || 'Tài khoản'}>{chu}</span>;
}
