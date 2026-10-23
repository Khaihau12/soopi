const { taoLoi } = require('../utils/taoLoi');
const { batBuocDangNhap } = require('./auth.middleware');
const { VAI_TRO } = require('../constants/vaiTro.constant');
const CuaHang = require('../models/cuaHang.model');

const batBuocVaiTro = (...cacVaiTro) => (req, res, next) => {
  if (!req.taiKhoan) return next(taoLoi(401, 'Vui lòng đăng nhập để tiếp tục'));
  if (!cacVaiTro.some((vaiTro) => req.taiKhoan.vaiTro.includes(vaiTro))) {
    return next(taoLoi(403, 'Bạn không có quyền thực hiện chức năng này'));
  }
  next();
};

// Tài khoản quản trị chỉ thao tác trong khu vực quản lý, kể cả khi dữ liệu cũ còn vai trò Người dùng.
const camQuanTriMuaSam = (req, res, next) => {
  if (req.taiKhoan?.vaiTro.includes(VAI_TRO.QUAN_TRI_VIEN)) {
    return next(taoLoi(403, 'Tài khoản Quản trị viên chỉ sử dụng khu vực quản lý'));
  }
  next();
};

const batBuocCuaHang = async (req, res, next) => {
  try {
    const cuaHang = await CuaHang.findOne({ taiKhoanId: req.taiKhoan._id });
    if (!cuaHang) throw taoLoi(403, 'Tài khoản của bạn chưa có cửa hàng');
    req.cuaHang = cuaHang;
    next();
  } catch (loi) { next(loi); }
};

const batBuocNguoiBan = [batBuocDangNhap, camQuanTriMuaSam, batBuocVaiTro(VAI_TRO.NGUOI_BAN), batBuocCuaHang];
const batBuocQuanTriVien = [batBuocDangNhap, batBuocVaiTro(VAI_TRO.QUAN_TRI_VIEN)];

module.exports = { batBuocVaiTro, batBuocCuaHang, camQuanTriMuaSam, batBuocNguoiBan, batBuocQuanTriVien };
