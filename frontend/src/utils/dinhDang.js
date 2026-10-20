import { layGocMayChuApi } from '../services/httpClient.js';

const MUI_GIO = 'Asia/Ho_Chi_Minh';

const layNgayHopLe = (giaTri) => {
  if (giaTri === undefined || giaTri === null || giaTri === '') return null;
  const ngay = new Date(giaTri);
  return Number.isNaN(ngay.getTime()) ? null : ngay;
};

export function dinhDangTien(so) {
  if (so === undefined || so === null || so === '' || !Number.isFinite(Number(so))) return '';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(so));
}

export function maDonHangHienThi(id) {
  return '#' + String(id || '').slice(-8).toUpperCase();
}

export function dinhDangNgay(giaTri) {
  const ngay = layNgayHopLe(giaTri);
  return ngay ? new Intl.DateTimeFormat('vi-VN', { timeZone: MUI_GIO }).format(ngay) : '';
}

export function dinhDangNgayGio(giaTri) {
  const ngay = layNgayHopLe(giaTri);
  return ngay ? new Intl.DateTimeFormat('vi-VN', {
    timeZone: MUI_GIO,
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(ngay) : '';
}

export function dinhDangNgayChoInput(giaTri) {
  const ngay = layNgayHopLe(giaTri);
  if (!ngay) return '';
  const phanNgay = new Intl.DateTimeFormat('en-CA', {
    timeZone: MUI_GIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(ngay);
  const layPhan = (loai) => phanNgay.find((phan) => phan.type === loai).value;
  return layPhan('year') + '-' + layPhan('month') + '-' + layPhan('day');
}

export function taoUrlAnh(duongDan) {
  if (!duongDan) return '';
  if (/^https?:\/\//i.test(duongDan)) return duongDan;
  const gocMayChu = layGocMayChuApi();
  return gocMayChu && duongDan.startsWith('/uploads/')
    ? new URL(duongDan, gocMayChu).href
    : '';
}
