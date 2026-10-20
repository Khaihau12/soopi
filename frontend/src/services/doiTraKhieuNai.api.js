import { goiApi } from './httpClient.js';

export const guiYeuCauDoiTraKhieuNai = (body) => goiApi('/doi-tra-khieu-nai', { method: 'POST', body });
export const layDanhSachYeuCauCuaToi = (query) => goiApi('/doi-tra-khieu-nai', { query });
export const layChiTietYeuCauCuaToi = (id) => goiApi(`/doi-tra-khieu-nai/${id}`);
export const nguoiBanLayDanhSachYeuCau = (query) => goiApi('/nguoi-ban/doi-tra-khieu-nai', { query });
export const nguoiBanLayChiTietYeuCau = (id) => goiApi(`/nguoi-ban/doi-tra-khieu-nai/${id}`);
export const nguoiBanXuLyYeuCau = (id, ketQuaXuLy) => goiApi(`/nguoi-ban/doi-tra-khieu-nai/${id}/xu-ly`, { method: 'PATCH', body: { ketQuaXuLy } });
