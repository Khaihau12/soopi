const { layKhoangNgay } = require('./thoiGian');
const { taoLoi } = require('./taoLoi');
const { SO_NGAY_THONG_KE_MAC_DINH, SO_NGAY_THONG_KE_TOI_DA } = require('../constants/cauHinh.constant');

const MS_NGAY = 86400000;
const NGAY_VIET_NAM = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' });
const thongBaoNgay = 'Khoảng thời gian không hợp lệ, vui lòng chọn lại';

const layNgayHomNay = () => {
  const phan = NGAY_VIET_NAM.formatToParts(new Date());
  const lay = (ten) => phan.find((item) => item.type === ten).value;
  return `${lay('year')}-${lay('month')}-${lay('day')}`;
};

const truNgay = (ngay, soNgay) => new Date(Date.parse(`${ngay}T00:00:00Z`) - soNgay * MS_NGAY).toISOString().slice(0, 10);

const layKhoangThongKe = ({ tuNgay, denNgay } = {}) => {
  const den = denNgay || layNgayHomNay();
  const tu = tuNgay || truNgay(den, SO_NGAY_THONG_KE_MAC_DINH - 1);
  try {
    const khoang = layKhoangNgay(tu, den);
    const soNgay = (Date.parse(`${den}T00:00:00Z`) - Date.parse(`${tu}T00:00:00Z`)) / MS_NGAY + 1;
    if (!Number.isInteger(soNgay) || soNgay < 1 || soNgay > SO_NGAY_THONG_KE_TOI_DA) throw new Error('Ngày vượt giới hạn');
    return { tuNgay: tu, denNgay: den, khoang };
  } catch { throw taoLoi(400, thongBaoNgay); }
};

const dienMocTrong = (danhSach, tuNgay, denNgay, nhom) => {
  const duLieu = new Map(danhSach.map((item) => [item.moc, item]));
  const ketQua = [];
  let moc = Date.parse(`${nhom === 'thang' ? tuNgay.slice(0, 7) + '-01' : tuNgay}T00:00:00Z`);
  const ketThuc = Date.parse(`${denNgay}T00:00:00Z`);
  while (moc <= ketThuc) {
    const ngay = new Date(moc).toISOString().slice(0, 10);
    const khoa = nhom === 'thang' ? ngay.slice(0, 7) : ngay;
    ketQua.push(duLieu.get(khoa) || { moc: khoa, doanhThu: 0, soDon: 0 });
    if (nhom === 'thang') {
      const [nam, thang] = khoa.split('-').map(Number);
      moc = Date.UTC(nam, thang, 1);
    } else moc += MS_NGAY;
  }
  return ketQua;
};

module.exports = { layKhoangThongKe, dienMocTrong };
