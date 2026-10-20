const xacThucService = require('../services/xacThuc.service');
const { datCookieDangNhap, xoaCookieDangNhap } = require('../utils/cookie');

const dangKy = async (req, res, next) => {
  try {
    const taiKhoan = await xacThucService.dangKyTaiKhoan(req.body);
    res.status(201).json({ success: true, message: 'Đăng ký thành công', data: { taiKhoan } });
  } catch (loi) { next(loi); }
};

const dangNhap = async (req, res, next) => {
  try {
    const { taiKhoan, token } = await xacThucService.dangNhap(req.body);
    datCookieDangNhap(res, token);
    res.json({ success: true, message: 'Đăng nhập thành công', data: { taiKhoan } });
  } catch (loi) { next(loi); }
};

const dangXuat = (req, res) => {
  xoaCookieDangNhap(res);
  res.json({ success: true, message: 'Đăng xuất thành công', data: {} });
};

const layThongTinToi = (req, res) => {
  const taiKhoan = xacThucService.layThongTinTaiKhoan(req.taiKhoan);
  res.json({ success: true, message: 'Lấy thông tin tài khoản thành công', data: { taiKhoan } });
};

const quenMatKhau = async (req, res, next) => {
  try {
    const data = await xacThucService.quenMatKhau(req.body);
    res.json({ success: true, message: xacThucService.THONG_BAO_QUEN_MAT_KHAU, data });
  } catch (loi) { next(loi); }
};

const datLaiMatKhau = async (req, res, next) => {
  try {
    await xacThucService.datLaiMatKhau(req.body);
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Hãy đăng nhập.', data: {} });
  } catch (loi) { next(loi); }
};

module.exports = { dangKy, dangNhap, dangXuat, layThongTinToi, quenMatKhau, datLaiMatKhau };
