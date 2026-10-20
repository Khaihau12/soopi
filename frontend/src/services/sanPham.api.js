import { goiApi } from './httpClient.js';

export const layDanhSachSanPham = (query) => goiApi('/san-pham', { query });
export const layChiTietSanPham = (id) => goiApi(`/san-pham/${id}`);
export const nguoiBanLayDanhSachSanPham = (query) => goiApi('/nguoi-ban/san-pham', { query });
export const nguoiBanLayChiTietSanPham = (id) => goiApi(`/nguoi-ban/san-pham/${id}`);
export const nguoiBanTaoSanPham = (body) => goiApi('/nguoi-ban/san-pham', { method: 'POST', body });
export const nguoiBanCapNhatSanPham = (id, body) => goiApi(`/nguoi-ban/san-pham/${id}`, { method: 'PATCH', body });
export const nguoiBanCapNhatTonKho = (id, soLuongTon) => goiApi(`/nguoi-ban/san-pham/${id}/ton-kho`, { method: 'PATCH', body: { soLuongTon } });
export const nguoiBanXoaSanPham = (id) => goiApi(`/nguoi-ban/san-pham/${id}`, { method: 'DELETE' });
export const quanTriLayDanhSachSanPham = (query) => goiApi('/quan-tri-vien/san-pham', { query });
export const quanTriLayChiTietSanPham = (id) => goiApi(`/quan-tri-vien/san-pham/${encodeURIComponent(id)}`);
export const quanTriCapNhatTrangThaiSanPham = (id, trangThaiKinhDoanh) => goiApi(`/quan-tri-vien/san-pham/${encodeURIComponent(id)}/trang-thai`, { method: 'PATCH', body: { trangThaiKinhDoanh } });
