import { goiApi } from './httpClient.js';

export const layDanhSachThongBao = (query) => goiApi('/thong-bao', { query });
export const demThongBaoChuaDoc = () => goiApi('/thong-bao/chua-doc');
export const danhDauThongBaoDaDoc = (id) => goiApi(`/thong-bao/${id}/da-doc`, { method: 'PATCH' });
export const danhDauTatCaThongBaoDaDoc = () => goiApi('/thong-bao/da-doc', { method: 'PATCH' });
