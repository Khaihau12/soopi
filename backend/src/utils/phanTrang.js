const { PHAN_TRANG } = require('../constants/cauHinh.constant');

const layThamSoPhanTrang = (query = {}) => {
  const trangNhap = Number(query.trang);
  const gioiHanNhap = Number(query.gioiHan);
  const trang = Number.isInteger(trangNhap) && trangNhap > 0 ? trangNhap : 1;
  const gioiHan = Number.isInteger(gioiHanNhap) && gioiHanNhap > 0
    ? Math.min(gioiHanNhap, PHAN_TRANG.TOI_DA)
    : PHAN_TRANG.MAC_DINH;

  return { trang, gioiHan, boQua: (trang - 1) * gioiHan };
};

const taoThongTinPhanTrang = (tongSo, { trang, gioiHan }) => ({
  trang,
  gioiHan,
  tongSo,
  tongTrang: Math.ceil(tongSo / gioiHan),
});

module.exports = { layThamSoPhanTrang, taoThongTinPhanTrang };
