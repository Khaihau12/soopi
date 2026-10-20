import { goiApi } from './httpClient.js';

export const layDanhSachVoucherDangDung = (query) => goiApi('/voucher', { query });
export const nguoiBanLayDanhSachVoucher = (query) => goiApi('/nguoi-ban/voucher', { query });
export const nguoiBanLayChiTietVoucher = (id) => goiApi(`/nguoi-ban/voucher/${id}`);
export const nguoiBanTaoVoucher = (body) => goiApi('/nguoi-ban/voucher', { method: 'POST', body });
export const nguoiBanCapNhatVoucher = (id, body) => goiApi(`/nguoi-ban/voucher/${id}`, { method: 'PATCH', body });
export const nguoiBanCapNhatTrangThaiVoucher = (id, trangThai) => goiApi(`/nguoi-ban/voucher/${id}/trang-thai`, { method: 'PATCH', body: { trangThai } });
export const nguoiBanXoaVoucher = (id) => goiApi(`/nguoi-ban/voucher/${id}`, { method: 'DELETE' });
export const quanTriLayDanhSachVoucher = (query) => goiApi('/quan-tri-vien/voucher', { query });
export const quanTriLayChiTietVoucher = (id) => goiApi(`/quan-tri-vien/voucher/${id}`);
export const quanTriTaoVoucher = (body) => goiApi('/quan-tri-vien/voucher', { method: 'POST', body });
export const quanTriCapNhatVoucher = (id, body) => goiApi(`/quan-tri-vien/voucher/${id}`, { method: 'PATCH', body });
export const quanTriCapNhatTrangThaiVoucher = (id, trangThai) => goiApi(`/quan-tri-vien/voucher/${id}/trang-thai`, { method: 'PATCH', body: { trangThai } });
export const quanTriXoaVoucher = (id) => goiApi(`/quan-tri-vien/voucher/${id}`, { method: 'DELETE' });
