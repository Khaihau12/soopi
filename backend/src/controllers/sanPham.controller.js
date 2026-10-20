const service = require('../services/sanPham.service');

const layDanhSachSanPham = async (req, res, next) => {
  try {
    const data = await service.layDanhSachSanPham(req.query);
    res.json({ success: true, message: 'Lấy danh sách sản phẩm thành công', data });
  } catch (loi) { next(loi); }
};

const layChiTietSanPham = async (req, res, next) => {
  try {
    const sanPham = await service.layChiTietSanPham(req.params.id);
    res.json({ success: true, message: 'Lấy chi tiết sản phẩm thành công', data: { sanPham } });
  } catch (loi) { next(loi); }
};

const nguoiBanLayDanhSachSanPham = async (req, res, next) => {
  try {
    const data = await service.nguoiBanLayDanhSachSanPham(req.cuaHang._id, req.query);
    res.json({ success: true, message: 'Lấy danh sách sản phẩm thành công', data });
  } catch (loi) { next(loi); }
};

const nguoiBanLayChiTietSanPham = async (req, res, next) => {
  try {
    const sanPham = await service.nguoiBanLayChiTietSanPham(req.cuaHang._id, req.params.id);
    res.json({ success: true, message: 'Lấy chi tiết sản phẩm thành công', data: { sanPham } });
  } catch (loi) { next(loi); }
};

const nguoiBanTaoSanPham = async (req, res, next) => {
  try {
    const sanPham = await service.nguoiBanTaoSanPham(req.cuaHang._id, req.body);
    res.status(201).json({ success: true, message: 'Thêm sản phẩm thành công', data: { sanPham } });
  } catch (loi) { next(loi); }
};

const nguoiBanCapNhatSanPham = async (req, res, next) => {
  try {
    const sanPham = await service.nguoiBanCapNhatSanPham(req.cuaHang._id, req.params.id, req.body);
    res.json({ success: true, message: 'Cập nhật sản phẩm thành công', data: { sanPham } });
  } catch (loi) { next(loi); }
};

const nguoiBanCapNhatTonKho = async (req, res, next) => {
  try {
    const sanPham = await service.nguoiBanCapNhatTonKho(req.cuaHang._id, req.params.id, req.body?.soLuongTon);
    res.json({ success: true, message: 'Cập nhật tồn kho thành công', data: { sanPham } });
  } catch (loi) { next(loi); }
};

const nguoiBanXoaSanPham = async (req, res, next) => {
  try {
    const message = await service.nguoiBanXoaSanPham(req.cuaHang._id, req.params.id);
    res.json({ success: true, message, data: { message } });
  } catch (loi) { next(loi); }
};

const quanTriLayDanhSachSanPham = async (req, res, next) => {
  try { res.json({ success: true, message: 'Lấy danh sách sản phẩm thành công', data: await service.quanTriLayDanhSachSanPham(req.query) }); }
  catch (loi) { next(loi); }
};
const quanTriLayChiTietSanPham = async (req, res, next) => {
  try { res.json({ success: true, message: 'Lấy chi tiết sản phẩm thành công', data: { sanPham: await service.quanTriLayChiTietSanPham(req.params.id) } }); }
  catch (loi) { next(loi); }
};
const quanTriCapNhatTrangThaiSanPham = async (req, res, next) => {
  try { res.json({ success: true, message: 'Cập nhật trạng thái sản phẩm thành công', data: { sanPham: await service.quanTriCapNhatTrangThaiSanPham(req.params.id, req.body?.trangThaiKinhDoanh) } }); }
  catch (loi) { next(loi); }
};

module.exports = {
  layDanhSachSanPham, layChiTietSanPham,
  nguoiBanLayDanhSachSanPham, nguoiBanLayChiTietSanPham, nguoiBanTaoSanPham,
  nguoiBanCapNhatSanPham, nguoiBanCapNhatTonKho, nguoiBanXoaSanPham,
  quanTriLayDanhSachSanPham, quanTriLayChiTietSanPham, quanTriCapNhatTrangThaiSanPham,
};
