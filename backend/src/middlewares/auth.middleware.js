const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const TaiKhoan = require('../models/taiKhoan.model');
const { TRANG_THAI_TAI_KHOAN } = require('../constants/trangThai.constant');
const { TEN_COOKIE_TOKEN } = require('../constants/cauHinh.constant');
const { taoLoi } = require('../utils/taoLoi');

const layTaiKhoanTuToken = async (token) => {
  if (!token) throw taoLoi(401, 'Vui lòng đăng nhập để tiếp tục');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw taoLoi(401, 'Vui lòng đăng nhập để tiếp tục');
  }
  if (!payload || !mongoose.isValidObjectId(payload.taiKhoanId)) throw taoLoi(401, 'Vui lòng đăng nhập để tiếp tục');
  const taiKhoan = await TaiKhoan.findById(payload.taiKhoanId).select('+phienBanToken');
  if (!taiKhoan) throw taoLoi(401, 'Vui lòng đăng nhập để tiếp tục');
  if ((payload.phienBanToken || 0) !== (taiKhoan.phienBanToken || 0)) {
    throw taoLoi(401, 'Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.');
  }
  if (taiKhoan.trangThaiTaiKhoan === TRANG_THAI_TAI_KHOAN.BI_KHOA) {
    throw taoLoi(403, 'Tài khoản của bạn đã bị khóa');
  }
  return taiKhoan;
};

const batBuocDangNhap = async (req, res, next) => {
  try {
    const taiKhoan = await layTaiKhoanTuToken(req.cookies?.[TEN_COOKIE_TOKEN]);
    taiKhoan.phienBanToken = undefined;
    req.taiKhoan = taiKhoan;
    next();
  } catch (loi) {
    next(loi);
  }
};

module.exports = { batBuocDangNhap, layTaiKhoanTuToken };
