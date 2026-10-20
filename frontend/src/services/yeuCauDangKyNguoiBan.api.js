import { goiApi } from './httpClient.js';

export const guiYeuCauDangKyNguoiBan = (duLieu) => goiApi('/yeu-cau-dang-ky-nguoi-ban', { method: 'POST', body: duLieu });
export const layYeuCauCuaToi = () => goiApi('/yeu-cau-dang-ky-nguoi-ban/cua-toi');
export const quanTriLayDanhSachYeuCau = (query) => goiApi('/quan-tri-vien/yeu-cau-dang-ky-nguoi-ban', { query });
export const quanTriLayChiTietYeuCau = (id) => goiApi(`/quan-tri-vien/yeu-cau-dang-ky-nguoi-ban/${id}`);
export const quanTriXetDuyetYeuCau = (id, trangThai) => goiApi(`/quan-tri-vien/yeu-cau-dang-ky-nguoi-ban/${id}/xet-duyet`, { method: 'PATCH', body: { trangThai } });
