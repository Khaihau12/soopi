const service = require('../services/giaoDichThanhToan.service');

const layIp = (req) => {
  const chuyenTiep = req.headers['x-forwarded-for'];
  let ip = (typeof chuyenTiep === 'string' ? chuyenTiep.split(',')[0] : req.socket.remoteAddress || '').trim();
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  return ip === '::1' || !ip ? '127.0.0.1' : ip;
};

const taoThanhToanVnpay = async (req, res, next) => {
  try {
    const data = await service.taoThanhToanVnpay(req.taiKhoan._id, req.body?.giaoDichId, layIp(req));
    res.json({ success: true, message: 'Đã tạo đường dẫn thanh toán VNPay', data });
  } catch (loi) { next(loi); }
};

const xuLyKetQuaVnpay = async (req, res, next) => {
  try {
    const ketQua = await service.xuLyKetQuaVnpay(req.query);
    const duongDan = new URL('/thanh-toan/ket-qua', process.env.FRONTEND_URL);
    if (ketQua.loi) duongDan.searchParams.set('loi', ketQua.loi);
    else duongDan.searchParams.set('giaoDichId', String(ketQua.giaoDichId));
    res.redirect(302, duongDan.toString());
  } catch (loi) { next(loi); }
};

const layChiTietGiaoDich = async (req, res, next) => {
  try {
    const data = await service.layChiTietGiaoDich(req.taiKhoan._id, req.params.id);
    res.json({ success: true, message: 'Lấy chi tiết giao dịch thành công', data });
  } catch (loi) { next(loi); }
};

const quanTriLayDanhSachGiaoDich = async (req, res, next) => {
  try {
    const data = await service.quanTriLayDanhSachGiaoDich(req.query);
    res.json({ success: true, message: 'Lấy danh sách giao dịch thành công', data });
  } catch (loi) { next(loi); }
};
const quanTriLayChiTietGiaoDich = async (req, res, next) => {
  try {
    const giaoDich = await service.quanTriLayChiTietGiaoDich(req.params.id);
    res.json({ success: true, message: 'Lấy chi tiết giao dịch thành công', data: { giaoDich } });
  } catch (loi) { next(loi); }
};

module.exports = { taoThanhToanVnpay, xuLyKetQuaVnpay, layChiTietGiaoDich, quanTriLayDanhSachGiaoDich, quanTriLayChiTietGiaoDich };
