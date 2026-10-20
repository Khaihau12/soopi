import { goiApi } from './httpClient.js';

export const layHoSo = () => goiApi('/tai-khoan/ho-so');
export const capNhatHoSo = (body) => goiApi('/tai-khoan/ho-so', { method: 'PATCH', body });
export const doiMatKhau = (body) => goiApi('/tai-khoan/doi-mat-khau', { method: 'PATCH', body });
export const quanTriLayDanhSachTaiKhoan = (query) => goiApi('/quan-tri-vien/tai-khoan', { query });
export const quanTriLayChiTietTaiKhoan = (id) => goiApi(`/quan-tri-vien/tai-khoan/${id}`);
export const quanTriCapNhatTrangThaiTaiKhoan = (id, trangThaiTaiKhoan) => goiApi(`/quan-tri-vien/tai-khoan/${id}/trang-thai`,
  { method: 'PATCH', body: { trangThaiTaiKhoan } });
export const quanTriDatLaiMatKhau = (id, matKhauMoi) => goiApi(`/quan-tri-vien/tai-khoan/${id}/mat-khau`,
  { method: 'PATCH', body: { matKhauMoi } });
