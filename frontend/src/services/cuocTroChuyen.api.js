import { goiApi } from './httpClient.js';

export const layDanhSachCuocTroChuyenCuaToi = (query) => goiApi('/cuoc-tro-chuyen', { query });
export const taoCuocTroChuyenVaGuiTinNhan = (body) => goiApi('/cuoc-tro-chuyen', { method: 'POST', body });
export const layTinNhan = (id, query) => goiApi(`/cuoc-tro-chuyen/${id}/tin-nhan`, { query });
export const guiTinNhan = (id, noiDung) => goiApi(`/cuoc-tro-chuyen/${id}/tin-nhan`, { method: 'POST', body: { noiDung } });
export const nguoiBanLayDanhSachCuocTroChuyen = (query) => goiApi('/nguoi-ban/cuoc-tro-chuyen', { query });
