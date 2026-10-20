const service = require('../services/yeuCauDangKyNguoiBan.service');

const guiYeuCauDangKyNguoiBan = async (req, res, next) => {
  try {
    const yeuCau = await service.guiYeuCauDangKyNguoiBan(req.taiKhoan, req.body);
    res.status(201).json({ success: true, message: 'Đã gửi yêu cầu đăng ký Người bán.', data: { yeuCau } });
  } catch (loi) { next(loi); }
};

const layYeuCauCuaToi = async (req, res, next) => {
  try {
    const data = await service.layYeuCauCuaToi(req.taiKhoan);
    res.json({ success: true, message: 'Lấy yêu cầu đăng ký Người bán thành công.', data });
  } catch (loi) { next(loi); }
};

const quanTriLayDanhSachYeuCau = async (req, res, next) => {
  try {
    const data = await service.quanTriLayDanhSachYeuCau(req.query);
    res.json({ success: true, message: 'Lấy danh sách yêu cầu thành công.', data });
  } catch (loi) { next(loi); }
};

const quanTriLayChiTietYeuCau = async (req, res, next) => {
  try {
    const yeuCau = await service.quanTriLayChiTietYeuCau(req.params.id);
    res.json({ success: true, message: 'Lấy chi tiết yêu cầu thành công.', data: { yeuCau } });
  } catch (loi) { next(loi); }
};

const quanTriXetDuyetYeuCau = async (req, res, next) => {
  try {
    const yeuCau = await service.quanTriXetDuyetYeuCau(req.params.id, req.body?.trangThai);
    res.json({ success: true, message: 'Đã xét duyệt yêu cầu.', data: { yeuCau } });
  } catch (loi) { next(loi); }
};

module.exports = { guiYeuCauDangKyNguoiBan, layYeuCauCuaToi, quanTriLayDanhSachYeuCau, quanTriLayChiTietYeuCau, quanTriXetDuyetYeuCau };
