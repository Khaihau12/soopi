const service = require('../services/bannerQuangCao.service');

const layDanhSachBanner = async (req, res, next) => {
  try {
    const danhSach = await service.layDanhSachBanner();
    res.json({ success: true, message: 'Lấy danh sách banner thành công', data: { danhSach } });
  } catch (loi) { next(loi); }
};

const quanTriLayDanhSachBanner = async (req, res, next) => {
  try { res.json({ success: true, message: 'Lấy danh sách banner thành công', data: await service.quanTriLayDanhSachBanner(req.query) }); }
  catch (loi) { next(loi); }
};
const quanTriTaoBanner = async (req, res, next) => {
  try { res.status(201).json({ success: true, message: 'Thêm banner thành công', data: { banner: await service.quanTriTaoBanner(req.body) } }); }
  catch (loi) { next(loi); }
};
const quanTriCapNhatBanner = async (req, res, next) => {
  try { res.json({ success: true, message: 'Cập nhật banner thành công', data: { banner: await service.quanTriCapNhatBanner(req.params.id, req.body) } }); }
  catch (loi) { next(loi); }
};
const quanTriCapNhatTrangThaiBanner = async (req, res, next) => {
  try { res.json({ success: true, message: 'Cập nhật trạng thái banner thành công', data: { banner: await service.quanTriCapNhatTrangThaiBanner(req.params.id, req.body?.trangThai) } }); }
  catch (loi) { next(loi); }
};
const quanTriXoaBanner = async (req, res, next) => {
  try { await service.quanTriXoaBanner(req.params.id); res.json({ success: true, message: 'Xóa banner thành công', data: {} }); }
  catch (loi) { next(loi); }
};

module.exports = { layDanhSachBanner, quanTriLayDanhSachBanner, quanTriTaoBanner, quanTriCapNhatBanner, quanTriCapNhatTrangThaiBanner, quanTriXoaBanner };
