const service = require('../services/cuaHang.service');

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

module.exports = { nguoiBanLayCuaHang, nguoiBanCapNhatCuaHang,
  quanTriLayDanhSachCuaHang, quanTriCapNhatTrangThaiCuaHang };
