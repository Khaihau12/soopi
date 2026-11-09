import { goiApi } from './httpClient.js';

export const nguoiBanLayCuaHang = () => goiApi('/nguoi-ban/cua-hang');
export const nguoiBanCapNhatCuaHang = (duLieu) => goiApi('/nguoi-ban/cua-hang', { method: 'PATCH', body: duLieu });
export const quanTriLayDanhSachCuaHang = (query) => goiApi('/quan-tri-vien/cua-hang', { query });
export const quanTriCapNhatTrangThaiCuaHang = (id, trangThaiHoatDong) => goiApi(`/quan-tri-vien/cua-hang/${id}/trang-thai`,
  { method: 'PATCH', body: { trangThaiHoatDong } });

export const layDanhSachCuaHangCongKhai = () => goiApi('/cua-hang');
export const layCuaHangCongKhai = (id) => goiApi(`/cua-hang/${encodeURIComponent(id)}`);
export const layDanhGiaCuaCuaHang = (id, query) => goiApi(`/cua-hang/${encodeURIComponent(id)}/danh-gia`, { query });
