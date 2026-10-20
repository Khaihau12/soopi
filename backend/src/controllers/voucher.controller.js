const service = require('../services/voucher.service');

const xuLy = (ham, status = 200, message = 'Thao tác voucher thành công') => async (req, res, next) => {
  try { res.status(status).json({ success: true, message, data: await ham(req) }); }
  catch (loi) { next(loi); }
};

const layDanhSachVoucherDangDung = xuLy((req) => service.layDanhSachVoucherDangDung(req.query), 200, 'Lấy danh sách voucher thành công');
const nguoiBanLayDanhSachVoucher = xuLy((req) => service.nguoiBanLayDanhSachVoucher(req.cuaHang._id, req.query), 200, 'Lấy danh sách voucher thành công');
const quanTriLayDanhSachVoucher = xuLy((req) => service.quanTriLayDanhSachVoucher(req.query), 200, 'Lấy danh sách voucher thành công');
const nguoiBanLayChiTietVoucher = xuLy(async (req) => ({ voucher: await service.nguoiBanLayChiTietVoucher(req.cuaHang._id, req.params.id) }));
const quanTriLayChiTietVoucher = xuLy(async (req) => ({ voucher: await service.quanTriLayChiTietVoucher(req.params.id) }));
const nguoiBanTaoVoucher = xuLy(async (req) => ({ voucher: await service.nguoiBanTaoVoucher(req.cuaHang._id, req.body) }), 201, 'Tạo voucher thành công');
const quanTriTaoVoucher = xuLy(async (req) => ({ voucher: await service.quanTriTaoVoucher(req.body) }), 201, 'Tạo voucher thành công');
const nguoiBanCapNhatVoucher = xuLy(async (req) => ({ voucher: await service.nguoiBanCapNhatVoucher(req.cuaHang._id, req.params.id, req.body) }), 200, 'Cập nhật voucher thành công');
const quanTriCapNhatVoucher = xuLy(async (req) => ({ voucher: await service.quanTriCapNhatVoucher(req.params.id, req.body) }), 200, 'Cập nhật voucher thành công');
const nguoiBanCapNhatTrangThaiVoucher = xuLy(async (req) => ({ voucher: await service.nguoiBanCapNhatTrangThaiVoucher(req.cuaHang._id, req.params.id, req.body) }), 200, 'Cập nhật trạng thái voucher thành công');
const quanTriCapNhatTrangThaiVoucher = xuLy(async (req) => ({ voucher: await service.quanTriCapNhatTrangThaiVoucher(req.params.id, req.body) }), 200, 'Cập nhật trạng thái voucher thành công');
const nguoiBanXoaVoucher = async (req, res, next) => {
  try { const data = await service.nguoiBanXoaVoucher(req.cuaHang._id, req.params.id); res.json({ success: true, message: data.message, data }); }
  catch (loi) { next(loi); }
};
const quanTriXoaVoucher = async (req, res, next) => {
  try { const data = await service.quanTriXoaVoucher(req.params.id); res.json({ success: true, message: data.message, data }); }
  catch (loi) { next(loi); }
};

module.exports = {
  layDanhSachVoucherDangDung, nguoiBanLayDanhSachVoucher, quanTriLayDanhSachVoucher,
  nguoiBanLayChiTietVoucher, quanTriLayChiTietVoucher, nguoiBanTaoVoucher, quanTriTaoVoucher,
  nguoiBanCapNhatVoucher, quanTriCapNhatVoucher, nguoiBanCapNhatTrangThaiVoucher, quanTriCapNhatTrangThaiVoucher,
  nguoiBanXoaVoucher, quanTriXoaVoucher,
};
