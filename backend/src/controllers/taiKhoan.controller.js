const service = require('../services/taiKhoan.service');
const { xoaCookieDangNhap } = require('../utils/cookie');

const layHoSo = (req, res) => {
  res.json({ success: true, message: 'Lấy hồ sơ thành công', data: { taiKhoan: service.layHoSo(req.taiKhoan) } });
};

const capNhatHoSo = async (req, res, next) => {
  try {
    const taiKhoan = await service.capNhatHoSo(req.taiKhoan._id, req.body);
    res.json({ success: true, message: 'Cập nhật thông tin thành công', data: { taiKhoan } });
  } catch (loi) { next(loi); }
};

const doiMatKhau = async (req, res, next) => {
  try {
    await service.doiMatKhau(req.taiKhoan._id, req.body);
    xoaCookieDangNhap(res);
    res.json({ success: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.', data: {} });
  } catch (loi) { next(loi); }
};

const quanTriLayDanhSachTaiKhoan = async (req, res, next) => {
  try { const data = await service.quanTriLayDanhSachTaiKhoan(req.query);
    res.json({ success: true, message: 'Lấy danh sách tài khoản thành công', data }); }
  catch (loi) { next(loi); }
};
const quanTriLayChiTietTaiKhoan = async (req, res, next) => {
  try { const taiKhoan = await service.quanTriLayChiTietTaiKhoan(req.params.id);
    res.json({ success: true, message: 'Lấy chi tiết tài khoản thành công', data: { taiKhoan } }); }
  catch (loi) { next(loi); }
};
const quanTriCapNhatTrangThaiTaiKhoan = async (req, res, next) => {
  try { const taiKhoan = await service.quanTriCapNhatTrangThaiTaiKhoan(req.params.id, req.body);
    res.json({ success: true, message: 'Cập nhật trạng thái tài khoản thành công', data: { taiKhoan } }); }
  catch (loi) { next(loi); }
};
const quanTriDatLaiMatKhau = async (req, res, next) => {
  try { await service.quanTriDatLaiMatKhau(req.params.id, req.body);
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công', data: {} }); }
  catch (loi) { next(loi); }
};

module.exports = { layHoSo, capNhatHoSo, doiMatKhau, quanTriLayDanhSachTaiKhoan,
  quanTriLayChiTietTaiKhoan, quanTriCapNhatTrangThaiTaiKhoan, quanTriDatLaiMatKhau };
