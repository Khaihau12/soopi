const crypto = require('crypto');

const dinhDangGioVietNam = (ngay) => {
  const phan = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(ngay);
  const theoTen = Object.fromEntries(phan.map((item) => [item.type, item.value]));
  return `${theoTen.year}${theoTen.month}${theoTen.day}${theoTen.hour}${theoTen.minute}${theoTen.second}`;
};

// VNPay PAY v2.1.0 ký chuỗi query đã sắp xếp theo tên tham số và mã hóa dạng form.
const maHoaForm = (giaTri) => encodeURIComponent(String(giaTri))
  .replace(/[!'()*~]/g, (kyTu) => `%${kyTu.charCodeAt(0).toString(16).toUpperCase()}`)
  .replace(/%20/g, '+');
const chuoiThamSo = (thamSo) => Object.keys(thamSo).sort().filter((ten) => thamSo[ten] !== undefined && thamSo[ten] !== null && thamSo[ten] !== '')
  .map((ten) => `${maHoaForm(ten)}=${maHoaForm(thamSo[ten])}`).join('&');

const taoChuKy = (thamSo, hashSecret) => crypto.createHmac('sha512', hashSecret).update(chuoiThamSo(thamSo), 'utf8').digest('hex');

const taoDuongDanThanhToan = (vnpUrl, thamSo, hashSecret) => {
  const query = chuoiThamSo(thamSo);
  const chuKy = taoChuKy(thamSo, hashSecret);
  return `${vnpUrl}${vnpUrl.includes('?') ? '&' : '?'}${query}&vnp_SecureHash=${chuKy}`;
};

const xacThucChuKy = (thamSo, hashSecret) => {
  if (!hashSecret || !/^[a-f\d]{128}$/i.test(thamSo?.vnp_SecureHash || '')) return false;
  const { vnp_SecureHash } = thamSo;
  const duLieu = Object.fromEntries(Object.entries(thamSo).filter(([ten]) => ten.startsWith('vnp_') && !['vnp_SecureHash', 'vnp_SecureHashType'].includes(ten)));
  const mongDoi = Buffer.from(taoChuKy(duLieu, hashSecret), 'hex');
  const nhanDuoc = Buffer.from(vnp_SecureHash, 'hex');
  return crypto.timingSafeEqual(mongDoi, nhanDuoc);
};

module.exports = { dinhDangGioVietNam, taoDuongDanThanhToan, xacThucChuKy };
