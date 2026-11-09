import { goiApi } from './httpClient.js';

export const layHoSo = () => goiApi('/tai-khoan/ho-so');
export const capNhatHoSo = (body) => goiApi('/tai-khoan/ho-so', { method: 'PATCH', body });
export const laySoDiaChi = () => goiApi('/tai-khoan/so-dia-chi');
export const themDiaChi = (body) => goiApi('/tai-khoan/so-dia-chi', { method: 'POST', body });
export const suaDiaChi = (id, body) => goiApi(`/tai-khoan/so-dia-chi/${encodeURIComponent(id)}`, { method: 'PATCH', body });
export const datDiaChiMacDinh = (id) => goiApi(`/tai-khoan/so-dia-chi/${encodeURIComponent(id)}/mac-dinh`, { method: 'PATCH' });
export const xoaDiaChi = (id) => goiApi(`/tai-khoan/so-dia-chi/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const laySanPhamDaXem = () => goiApi('/tai-khoan/san-pham-da-xem');
export const ghiNhanSanPhamDaXem = (id) => goiApi(`/tai-khoan/san-pham-da-xem/${encodeURIComponent(id)}`, { method: 'POST' });
export const doiMatKhau = (body) => goiApi('/tai-khoan/doi-mat-khau', { method: 'PATCH', body });
export const quanTriLayDanhSachTaiKhoan = (query) => goiApi('/quan-tri-vien/tai-khoan', { query });
export const quanTriLayChiTietTaiKhoan = (id) => goiApi(`/quan-tri-vien/tai-khoan/${id}`);
export const quanTriCapNhatTrangThaiTaiKhoan = (id, trangThaiTaiKhoan) => goiApi(`/quan-tri-vien/tai-khoan/${id}/trang-thai`,
  { method: 'PATCH', body: { trangThaiTaiKhoan } });
export const quanTriDatLaiMatKhau = (id, matKhauMoi) => goiApi(`/quan-tri-vien/tai-khoan/${id}/mat-khau`,
  { method: 'PATCH', body: { matKhauMoi } });
