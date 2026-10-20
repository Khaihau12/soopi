import { goiApi } from './httpClient.js';

export const layDanhSachDanhMuc = () => goiApi('/danh-muc');
export const quanTriLayDanhSachDanhMuc = () => goiApi('/quan-tri-vien/danh-muc');
export const quanTriThemDanhMuc = (tenDanhMuc) => goiApi('/quan-tri-vien/danh-muc', { method: 'POST', body: { tenDanhMuc } });
export const quanTriSuaDanhMuc = (id, tenDanhMuc) => goiApi(`/quan-tri-vien/danh-muc/${id}`, { method: 'PATCH', body: { tenDanhMuc } });
export const quanTriXoaDanhMuc = (id) => goiApi(`/quan-tri-vien/danh-muc/${id}`, { method: 'DELETE' });
