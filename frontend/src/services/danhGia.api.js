import { goiApi } from './httpClient.js';

export const layDanhSachDanhGia = (query) => goiApi('/danh-gia', { query });
export const layDongCoTheDanhGia = (sanPhamId) => goiApi('/danh-gia/co-the-danh-gia', { query: { sanPhamId } });
export const taoDanhGia = (body) => goiApi('/danh-gia', { method: 'POST', body });
export const nguoiBanLayDanhSachDanhGia = (query) => goiApi('/nguoi-ban/danh-gia', { query });
export const nguoiBanLayDanhSachSanPhamDanhGia = (query) => goiApi('/nguoi-ban/danh-gia/san-pham', { query });
export const nguoiBanPhanHoiDanhGia = (id, noiDung) => goiApi(`/nguoi-ban/danh-gia/${id}/phan-hoi`, { method: 'POST', body: { noiDung } });
