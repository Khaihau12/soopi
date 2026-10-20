import { goiApi } from './httpClient.js';

export const taoThanhToanVnpay = (giaoDichId) => goiApi('/giao-dich-thanh-toan/vnpay/tao-thanh-toan', {
  method: 'POST', body: { giaoDichId },
});

export const layChiTietGiaoDich = (giaoDichId) => goiApi(`/giao-dich-thanh-toan/${encodeURIComponent(giaoDichId)}`);
export const quanTriLayDanhSachGiaoDich = (query) => goiApi('/quan-tri-vien/giao-dich-thanh-toan', { query });
export const quanTriLayChiTietGiaoDich = (id) => goiApi(`/quan-tri-vien/giao-dich-thanh-toan/${encodeURIComponent(id)}`);
