const service = require('../services/danhMuc.service');

const layDanhSachDanhMuc = async (req, res, next) => {
  try {
    const danhSach = await service.layDanhSachDanhMuc();
    res.json({ success: true, message: 'Lấy danh sách danh mục thành công', data: { danhSach } });
  } catch (loi) { next(loi); }
};

const quanTriLayDanhSachDanhMuc = async (req, res, next) => {
  try {
    const danhSach = await service.quanTriLayDanhSachDanhMuc();
    res.json({ success: true, message: 'Lấy danh sách danh mục thành công', data: { danhSach } });
  } catch (loi) { next(loi); }
};

const quanTriTaoDanhMuc = async (req, res, next) => {
  try {
    const danhMuc = await service.quanTriTaoDanhMuc(req.body);
    res.status(201).json({ success: true, message: 'Thêm danh mục thành công', data: { danhMuc } });
  } catch (loi) { next(loi); }
};

const quanTriSuaDanhMuc = async (req, res, next) => {
  try {
    const danhMuc = await service.quanTriSuaDanhMuc(req.params.id, req.body);
    res.json({ success: true, message: 'Cập nhật danh mục thành công', data: { danhMuc } });
  } catch (loi) { next(loi); }
};

const quanTriXoaDanhMuc = async (req, res, next) => {
  try {
    await service.quanTriXoaDanhMuc(req.params.id);
    res.json({ success: true, message: 'Xóa danh mục thành công', data: {} });
  } catch (loi) { next(loi); }
};

module.exports = { layDanhSachDanhMuc, quanTriLayDanhSachDanhMuc, quanTriTaoDanhMuc, quanTriSuaDanhMuc, quanTriXoaDanhMuc };
