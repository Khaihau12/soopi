const service = require('../services/taiKhoan.service');
const soDiaChiService = require('../services/soDiaChi.service');
const sanPhamDaXemService = require('../services/sanPhamDaXem.service');
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

const laySoDiaChi = async (req, res, next) => {
  try { const danhSach = await soDiaChiService.laySoDiaChi(req.taiKhoan._id);
    res.json({ success: true, message: 'Lấy sổ địa chỉ thành công', data: { danhSach } }); }
  catch (loi) { next(loi); }
};
const themDiaChi = async (req, res, next) => {
  try { const danhSach = await soDiaChiService.themDiaChi(req.taiKhoan._id, req.body);
    res.status(201).json({ success: true, message: 'Đã lưu địa chỉ', data: { danhSach } }); }
  catch (loi) { next(loi); }
};
const suaDiaChi = async (req, res, next) => {
  try { const danhSach = await soDiaChiService.suaDiaChi(req.taiKhoan._id, req.params.id, req.body);
    res.json({ success: true, message: 'Đã cập nhật địa chỉ', data: { danhSach } }); }
  catch (loi) { next(loi); }
};
const datDiaChiMacDinh = async (req, res, next) => {
  try { const danhSach = await soDiaChiService.datMacDinh(req.taiKhoan._id, req.params.id);
    res.json({ success: true, message: 'Đã đặt địa chỉ mặc định', data: { danhSach } }); }
  catch (loi) { next(loi); }
};
const xoaDiaChi = async (req, res, next) => {
  try { const danhSach = await soDiaChiService.xoaDiaChi(req.taiKhoan._id, req.params.id);
    res.json({ success: true, message: 'Đã xóa địa chỉ', data: { danhSach } }); }
  catch (loi) { next(loi); }
};

const laySanPhamDaXem = async (req, res, next) => {
  try { const danhSach = await sanPhamDaXemService.layDanhSach(req.taiKhoan._id);
    res.json({ success: true, message: 'Lấy sản phẩm vừa xem thành công', data: { danhSach } }); }
  catch (loi) { next(loi); }
};
const ghiNhanSanPhamDaXem = async (req, res, next) => {
  try { await sanPhamDaXemService.ghiNhan(req.taiKhoan._id, req.params.id);
    res.json({ success: true, message: 'Đã lưu sản phẩm vừa xem', data: {} }); }
  catch (loi) { next(loi); }
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

module.exports = { layHoSo, capNhatHoSo, laySoDiaChi, themDiaChi, suaDiaChi, datDiaChiMacDinh, xoaDiaChi,
  laySanPhamDaXem, ghiNhanSanPhamDaXem, doiMatKhau, quanTriLayDanhSachTaiKhoan,
  quanTriLayChiTietTaiKhoan, quanTriCapNhatTrangThaiTaiKhoan, quanTriDatLaiMatKhau };
