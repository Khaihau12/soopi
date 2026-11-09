const service = require('../services/thongBao.service');

const layDanhSach = async (req, res, next) => {
  try { res.json({ success: true, message: 'Lấy thông báo thành công', data: await service.layDanhSach(req.taiKhoan._id, req.query) }); }
  catch (loi) { next(loi); }
};
const demChuaDoc = async (req, res, next) => {
  try { res.json({ success: true, message: 'Lấy số thông báo chưa đọc thành công', data: await service.demChuaDoc(req.taiKhoan._id) }); }
  catch (loi) { next(loi); }
};
const danhDauDaDoc = async (req, res, next) => {
  try { res.json({ success: true, message: 'Đã đánh dấu thông báo đã đọc', data: await service.danhDauDaDoc(req.taiKhoan._id, req.params.id) }); }
  catch (loi) { next(loi); }
};
const danhDauTatCaDaDoc = async (req, res, next) => {
  try { res.json({ success: true, message: 'Đã đánh dấu tất cả thông báo đã đọc', data: await service.danhDauTatCaDaDoc(req.taiKhoan._id) }); }
  catch (loi) { next(loi); }
};
module.exports = { layDanhSach, demChuaDoc, danhDauDaDoc, danhDauTatCaDaDoc };
