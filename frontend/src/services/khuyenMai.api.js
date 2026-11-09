import { goiApi } from './httpClient.js';

export const layDanhSachKhuyenMaiDangDienRa = (query) => goiApi('/khuyen-mai', { query });
export const nguoiBanLayDanhSachKhuyenMai = (query) => goiApi('/nguoi-ban/khuyen-mai', { query });
export const nguoiBanLayChiTietKhuyenMai = (id) => goiApi(`/nguoi-ban/khuyen-mai/${id}`);
export const nguoiBanTaoKhuyenMai = (body) => goiApi('/nguoi-ban/khuyen-mai', { method: 'POST', body });
export const nguoiBanCapNhatKhuyenMai = (id, body) => goiApi(`/nguoi-ban/khuyen-mai/${id}`, { method: 'PATCH', body });
export const nguoiBanXoaKhuyenMai = (id) => goiApi(`/nguoi-ban/khuyen-mai/${id}`, { method: 'DELETE' });
