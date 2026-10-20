const service = require('../services/gioHang.service');

const xuLy = (ham, status, message) => async (req, res, next) => {
  try { res.status(status).json({ success: true, message, data: await ham(req) }); }
  catch (loi) { next(loi); }
};

const layGioHang = xuLy((req) => service.layGioHang(req.taiKhoan._id), 200, 'Lấy giỏ hàng thành công');
const themSanPhamVaoGio = xuLy((req) => service.themSanPhamVaoGio(req.taiKhoan._id, req.body), 201, 'Đã thêm sản phẩm vào giỏ hàng');
const capNhatSoLuongDongGio = xuLy((req) => service.capNhatSoLuongDongGio(req.taiKhoan._id, req.params.id, req.body), 200, 'Đã cập nhật số lượng');
const xoaDongGio = xuLy((req) => service.xoaDongGio(req.taiKhoan._id, req.params.id), 200, 'Đã xóa sản phẩm khỏi giỏ hàng');
const chonDongGio = xuLy((req) => service.chonDongGio(req.taiKhoan._id, req.body), 200, 'Đã cập nhật sản phẩm được chọn');

module.exports = { layGioHang, themSanPhamVaoGio, capNhatSoLuongDongGio, xoaDongGio, chonDongGio };
