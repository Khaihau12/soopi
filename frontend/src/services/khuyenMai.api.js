import { goiApi } from './httpClient.js';

export const layDanhSachKhuyenMaiDangDienRa = (query) => goiApi('/khuyen-mai', { query });
export const nguoiBanLayDanhSachKhuyenMai = (query) => goiApi('/nguoi-ban/khuyen-mai', { query });
export const nguoiBanLayChiTietKhuyenMai = (id) => goiApi(`/nguoi-ban/khuyen-mai/${id}`);
export const nguoiBanTaoKhuyenMai = (body) => goiApi('/nguoi-ban/khuyen-mai', { method: 'POST', body });
export const nguoiBanCapNhatKhuyenMai = (id, body) => goiApi(`/nguoi-ban/khuyen-mai/${id}`, { method: 'PATCH', body });
export const nguoiBanXoaKhuyenMai = (id) => goiApi(`/nguoi-ban/khuyen-mai/${id}`, { method: 'DELETE' });
export const quanTriLayDanhSachKhuyenMai = (query) => goiApi('/quan-tri-vien/khuyen-mai', { query });
export const quanTriLayChiTietKhuyenMai = (id) => goiApi(`/quan-tri-vien/khuyen-mai/${id}`);
export const quanTriTaoKhuyenMai = (body) => goiApi('/quan-tri-vien/khuyen-mai', { method: 'POST', body });
export const quanTriCapNhatKhuyenMai = (id, body) => goiApi(`/quan-tri-vien/khuyen-mai/${id}`, { method: 'PATCH', body });
export const quanTriXoaKhuyenMai = (id) => goiApi(`/quan-tri-vien/khuyen-mai/${id}`, { method: 'DELETE' });
export const quanTriVoHieuHoaKhuyenMai = (id) => goiApi(`/quan-tri-vien/khuyen-mai/${id}/vo-hieu-hoa`, { method: 'PATCH' });
