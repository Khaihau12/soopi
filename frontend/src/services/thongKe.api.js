import { goiApi } from './httpClient.js';

const goc = '/nguoi-ban/thong-ke';
export const nguoiBanLayTongQuan = (query = {}) => goiApi(`${goc}/tong-quan`, { query });
export const nguoiBanLayDoanhThu = (query = {}) => goiApi(`${goc}/doanh-thu`, { query });
export const nguoiBanLaySanPhamBanChay = (query = {}) => goiApi(`${goc}/san-pham-ban-chay`, { query });
export const nguoiBanLayLichSuGiaoDich = (query = {}) => goiApi(`${goc}/lich-su-giao-dich`, { query });

const gocQuanTri = '/quan-tri-vien/thong-ke';
export const quanTriLayTongQuan = (query = {}) => goiApi(`${gocQuanTri}/tong-quan`, { query });
export const quanTriLayDoanhThu = (query = {}) => goiApi(`${gocQuanTri}/doanh-thu`, { query });
export const quanTriLaySanPhamBanChay = (query = {}) => goiApi(`${gocQuanTri}/san-pham-ban-chay`, { query });
export const quanTriLayDanhMucQuanTam = (query = {}) => goiApi(`${gocQuanTri}/danh-muc-quan-tam`, { query });
export const quanTriLayHieuSuatNguoiBan = (query = {}) => goiApi(`${gocQuanTri}/hieu-suat-nguoi-ban`, { query });
