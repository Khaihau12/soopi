const service = require('../services/sanPhamYeuThich.service');

const layDanhSach = async (req, res, next) => {
  try { res.json({ success: true, message: 'Lấy sản phẩm yêu thích thành công',
    data: await service.layDanhSach(req.taiKhoan._id, req.query) }); } catch (loi) { next(loi); }
};
const layTrangThai = async (req, res, next) => {
  try { res.json({ success: true, message: 'Lấy trạng thái yêu thích thành công',
    data: await service.layTrangThai(req.taiKhoan._id, req.params.id) }); } catch (loi) { next(loi); }
};
const layCacIdDaLuu = async (req, res, next) => {
  try { res.json({ success: true, message: 'Lấy sản phẩm đã lưu thành công',
    data: await service.layCacIdDaLuu(req.taiKhoan._id) }); } catch (loi) { next(loi); }
};
const luuSanPham = async (req, res, next) => {
  try { res.json({ success: true, message: 'Đã lưu sản phẩm yêu thích',
    data: await service.luuSanPham(req.taiKhoan._id, req.params.id) }); } catch (loi) { next(loi); }
};
const boLuuSanPham = async (req, res, next) => {
  try { res.json({ success: true, message: 'Đã bỏ lưu sản phẩm',
    data: await service.boLuuSanPham(req.taiKhoan._id, req.params.id) }); } catch (loi) { next(loi); }
};
module.exports = { layDanhSach, layTrangThai, layCacIdDaLuu, luuSanPham, boLuuSanPham };
