const service = require('../services/cuaHang.service');

const layDanhSachCuaHangCongKhai = async (req, res, next) => {
  try { res.json({ success: true, message: 'Lấy danh sách cửa hàng thành công',
    data: { danhSach: await service.layDanhSachCuaHangCongKhai() } }); }
  catch (loi) { next(loi); }
};

const layCuaHangCongKhai = async (req, res, next) => {
  try { res.json({ success: true, message: 'Lấy thông tin cửa hàng thành công',
    data: await service.layCuaHangCongKhai(req.params.id) }); }
  catch (loi) { next(loi); }
};

const layDanhGiaCuaCuaHang = async (req, res, next) => {
  try { res.json({ success: true, message: 'Lấy đánh giá cửa hàng thành công',
    data: await service.layDanhGiaCuaCuaHang(req.params.id, req.query) }); }
  catch (loi) { next(loi); }
};

const nguoiBanLayCuaHang = async (req, res, next) => {
  try {
    const cuaHang = service.nguoiBanLayCuaHang(req.cuaHang);
    res.json({ success: true, message: 'Lấy thông tin cửa hàng thành công', data: { cuaHang } });
  } catch (loi) { next(loi); }
};

const nguoiBanCapNhatCuaHang = async (req, res, next) => {
  try {
    const cuaHang = await service.nguoiBanCapNhatCuaHang(req.cuaHang, req.body);
    res.json({ success: true, message: 'Cập nhật cửa hàng thành công', data: { cuaHang } });
  } catch (loi) { next(loi); }
};

const quanTriLayDanhSachCuaHang = async (req, res, next) => {
  try { const data = await service.quanTriLayDanhSachCuaHang(req.query);
    res.json({ success: true, message: 'Lấy danh sách cửa hàng thành công', data }); }
  catch (loi) { next(loi); }
};
const quanTriCapNhatTrangThaiCuaHang = async (req, res, next) => {
  try { const cuaHang = await service.quanTriCapNhatTrangThaiCuaHang(req.params.id, req.body);
    res.json({ success: true, message: 'Cập nhật trạng thái cửa hàng thành công', data: { cuaHang } }); }
  catch (loi) { next(loi); }
};

module.exports = { layDanhSachCuaHangCongKhai, layCuaHangCongKhai, layDanhGiaCuaCuaHang,
  nguoiBanLayCuaHang, nguoiBanCapNhatCuaHang,
  quanTriLayDanhSachCuaHang, quanTriCapNhatTrangThaiCuaHang };
