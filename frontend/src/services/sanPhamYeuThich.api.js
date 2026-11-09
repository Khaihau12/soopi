import { goiApi } from './httpClient.js';

export const laySanPhamYeuThich = (query) => goiApi('/san-pham-yeu-thich', { query });
export const layCacIdDaLuu = () => goiApi('/san-pham-yeu-thich/ids');
export const layTrangThaiYeuThich = (id) => goiApi(`/san-pham-yeu-thich/${id}`);
export const luuSanPhamYeuThich = (id) => goiApi(`/san-pham-yeu-thich/${id}`, { method: 'POST' });
export const boLuuSanPhamYeuThich = (id) => goiApi(`/san-pham-yeu-thich/${id}`, { method: 'DELETE' });
