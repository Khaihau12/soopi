const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '';
const THONG_BAO_MAT_KET_NOI = 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.';

let xuLyHetPhien = null;

export class LoiApi extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'LoiApi';
    this.status = status;
  }
}

export function dangKyXuLyHetPhien(callback) {
  xuLyHetPhien = callback;
  return () => {
    if (xuLyHetPhien === callback) xuLyHetPhien = null;
  };
}

export function layGocMayChuApi() {
  return API_URL ? new URL(API_URL).origin : '';
}

export async function goiApi(duongDan, { method = 'GET', query, body, formData } = {}) {
  if (!API_URL) {
    throw new LoiApi('Chưa cấu hình địa chỉ API.', 0);
  }

  const duongDanChuan = '/' + duongDan.replace(/^\/+/, '');
  const url = new URL(API_URL + duongDanChuan);
  if (query) {
    Object.entries(query).forEach(([ten, giaTri]) => {
      if (giaTri !== undefined && giaTri !== null && giaTri !== '') {
        url.searchParams.set(ten, giaTri);
      }
    });
  }

  const tuyChon = { method, credentials: 'include' };
  if (formData !== undefined) {
    tuyChon.body = formData;
  } else if (body !== undefined) {
    tuyChon.headers = { 'Content-Type': 'application/json' };
    tuyChon.body = JSON.stringify(body);
  }

  let response;
  let ketQua;
  try {
    response = await fetch(url, tuyChon);
    ketQua = await response.json();
  } catch {
    throw new LoiApi(THONG_BAO_MAT_KET_NOI, 0);
  }

  if (!response.ok || ketQua?.success !== true) {
    const message = typeof ketQua?.message === 'string' && ketQua.message
      ? ketQua.message
      : 'Yêu cầu không thành công. Vui lòng thử lại.';
    const duongDanXacThuc = duongDanChuan.split('?')[0];
    if (response.status === 401 && !['/xac-thuc/dang-nhap', '/xac-thuc/toi'].includes(duongDanXacThuc)) {
      xuLyHetPhien?.();
    }
    throw new LoiApi(message, response.status);
  }

  return ketQua.data;
}
