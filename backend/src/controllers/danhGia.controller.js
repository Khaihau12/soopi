const service = require('../services/danhGia.service');

const layDanhSachDanhGia = async (req, res, next) => {
  try {
    const data = await service.layDanhSachDanhGia(req.query);
    res.json({ success: true, message: 'Lấy danh sách đánh giá thành công', data });
  } catch (loi) { next(loi); }
};

const layDongCoTheDanhGia = async (req, res, next) => {
  try {
    const danhSach = await service.layDongCoTheDanhGia(req.taiKhoan._id, req.query.sanPhamId);
    res.json({ success: true, message: 'Lấy đơn hàng có thể đánh giá thành công', data: { danhSach } });
  } catch (loi) { next(loi); }
};

const taoDanhGia = async (req, res, next) => {
  try {
    const danhGia = await service.taoDanhGia(req.taiKhoan._id, req.body);
    res.status(201).json({ success: true, message: 'Cảm ơn bạn đã đánh giá', data: { danhGia } });
  } catch (loi) { next(loi); }
};

const nguoiBanLayDanhSachDanhGia = async (req, res, next) => {
  try {
    const data = await service.nguoiBanLayDanhSachDanhGia(req.cuaHang._id, req.query);
    res.json({ success: true, message: 'Lấy đánh giá của cửa hàng thành công', data });
  } catch (loi) { next(loi); }
};

const nguoiBanLayDanhSachSanPhamDanhGia = async (req, res, next) => {
  try {
    const data = await service.nguoiBanLayDanhSachSanPhamDanhGia(req.cuaHang._id, req.query);
    res.json({ success: true, message: 'Lấy sản phẩm và thống kê đánh giá thành công', data });
  } catch (loi) { next(loi); }
};

module.exports = { layDanhSachDanhGia, layDongCoTheDanhGia, taoDanhGia,
  nguoiBanLayDanhSachDanhGia, nguoiBanLayDanhSachSanPhamDanhGia };
