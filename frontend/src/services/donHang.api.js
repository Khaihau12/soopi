import { goiApi } from './httpClient.js';

export const xemTruocDonHang = (body = {}) => goiApi('/don-hang/xem-truoc', { method: 'POST', body });
export const datHang = (body = {}) => goiApi('/don-hang', { method: 'POST', body });
export const layDanhSachDonHang = (query = {}) => goiApi('/don-hang', { query });
export const layChiTietDonHang = (id) => goiApi(`/don-hang/${encodeURIComponent(id)}`);
export const huyDonHang = (id) => goiApi(`/don-hang/${encodeURIComponent(id)}/huy`, { method: 'PATCH' });
export const nguoiBanLayDanhSachDonHang = (query = {}) => goiApi('/nguoi-ban/don-hang', { query });
export const nguoiBanLayChiTietDonHang = (id) => goiApi(`/nguoi-ban/don-hang/${encodeURIComponent(id)}`);
export const capNhatTrangThaiDonHang = (id, trangThaiXuLy) => goiApi(`/don-hang/${encodeURIComponent(id)}/trang-thai`, {
  method: 'PATCH', body: { trangThaiXuLy },
});
