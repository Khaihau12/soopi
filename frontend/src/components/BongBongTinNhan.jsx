import { dinhDangNgayGio } from '../utils/dinhDang.js';

export default function BongBongTinNhan({ tinNhan, cuaToi }) {
  return <article className={`bongBongTinNhan ${cuaToi ? 'cuaToi' : 'cuaDoiPhuong'}`}>
    <p>{tinNhan.noiDung}</p><time dateTime={tinNhan.thoiGianGui}>{dinhDangNgayGio(tinNhan.thoiGianGui)}</time>
  </article>;
}
