import { goiApi } from './httpClient.js';

export const layDanhSachBanner = () => goiApi('/banner-quang-cao');
export const quanTriLayDanhSachBanner = (query) => goiApi('/quan-tri-vien/banner-quang-cao', { query });
export const quanTriTaoBanner = (body) => goiApi('/quan-tri-vien/banner-quang-cao', { method: 'POST', body });
export const quanTriCapNhatBanner = (id, body) => goiApi(`/quan-tri-vien/banner-quang-cao/${encodeURIComponent(id)}`, { method: 'PATCH', body });
export const quanTriCapNhatTrangThaiBanner = (id, trangThai) => goiApi(`/quan-tri-vien/banner-quang-cao/${encodeURIComponent(id)}/trang-thai`, { method: 'PATCH', body: { trangThai } });
export const quanTriXoaBanner = (id) => goiApi(`/quan-tri-vien/banner-quang-cao/${encodeURIComponent(id)}`, { method: 'DELETE' });
