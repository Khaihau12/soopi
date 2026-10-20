import { goiApi } from './httpClient.js';

export const layGioHang = () => goiApi('/gio-hang');
export const themSanPhamVaoGio = (sanPhamId, soLuong = 1) => goiApi('/gio-hang/chi-tiet', { method: 'POST', body: { sanPhamId, soLuong } });
export const capNhatSoLuongDongGio = (id, soLuong) => goiApi(`/gio-hang/chi-tiet/${id}`, { method: 'PATCH', body: { soLuong } });
export const xoaDongGio = (id) => goiApi(`/gio-hang/chi-tiet/${id}`, { method: 'DELETE' });
export const chonDongGio = (duocChon, chiTietGioHangIds) => goiApi('/gio-hang/chon', { method: 'PATCH', body: { duocChon, ...(chiTietGioHangIds === undefined ? {} : { chiTietGioHangIds }) } });
