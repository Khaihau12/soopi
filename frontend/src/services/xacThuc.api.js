import { goiApi } from './httpClient.js';

export const dangKy = (duLieu) => goiApi('/xac-thuc/dang-ky', { method: 'POST', body: duLieu });
export const dangNhap = (duLieu) => goiApi('/xac-thuc/dang-nhap', { method: 'POST', body: duLieu });
export const dangXuat = () => goiApi('/xac-thuc/dang-xuat', { method: 'POST' });
export const layThongTinToi = () => goiApi('/xac-thuc/toi');
export const quenMatKhau = (duLieu) => goiApi('/xac-thuc/quen-mat-khau', { method: 'POST', body: duLieu });
export const datLaiMatKhau = (duLieu) => goiApi('/xac-thuc/dat-lai-mat-khau', { method: 'POST', body: duLieu });
