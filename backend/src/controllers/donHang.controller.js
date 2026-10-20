const service = require('../services/donHang.service');

const xemTruocDonHang = async (req, res, next) => {
  try {
    const data = await service.xemTruocDonHang(req.taiKhoan, req.body);
    res.json({ success: true, message: 'Đã tính xem trước đơn hàng', data });
  } catch (loi) { next(loi); }
};

const datHang = async (req, res, next) => {
  try {
    const data = await service.datHang(req.taiKhoan, req.body);
    res.status(201).json({ success: true, message: 'Đặt hàng thành công', data });
  } catch (loi) { next(loi); }
};

const layDanhSachDonHangCuaToi = async (req, res, next) => {
  try {
    const data = await service.layDanhSachDonHangCuaToi(req.taiKhoan._id, req.query);
    res.json({ success: true, message: 'Lấy danh sách đơn hàng thành công', data });
  } catch (loi) { next(loi); }
};

const layChiTietDonHangCuaToi = async (req, res, next) => {
  try {
    const donHang = await service.layChiTietDonHangCuaToi(req.taiKhoan._id, req.params.id);
    res.json({ success: true, message: 'Lấy chi tiết đơn hàng thành công', data: { donHang } });
  } catch (loi) { next(loi); }
};

const huyDonHangCuaToi = async (req, res, next) => {
  try {
    const data = await service.huyDonHangCuaToi(req.taiKhoan._id, req.params.id);
    res.json({ success: true, message: data.ketQua.thongBao, data });
  } catch (loi) { next(loi); }
};

const nguoiBanLayDanhSachDonHang = async (req, res, next) => {
  try {
    const data = await service.nguoiBanLayDanhSachDonHang(req.cuaHang, req.query);
    res.json({ success: true, message: 'Lấy danh sách đơn hàng của cửa hàng thành công', data });
  } catch (loi) { next(loi); }
};

const nguoiBanLayChiTietDonHang = async (req, res, next) => {
  try {
    const donHang = await service.nguoiBanLayChiTietDonHang(req.cuaHang, req.params.id);
    res.json({ success: true, message: 'Lấy chi tiết đơn hàng thành công', data: { donHang } });
  } catch (loi) { next(loi); }
};

const capNhatTrangThaiXuLyDonHang = async (req, res, next) => {
  try {
    const donHang = await service.capNhatTrangThaiXuLyDonHang(req.cuaHang, req.params.id, req.body?.trangThaiXuLy);
    res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công', data: { donHang } });
  } catch (loi) { next(loi); }
};

module.exports = { xemTruocDonHang, datHang, layDanhSachDonHangCuaToi, layChiTietDonHangCuaToi, huyDonHangCuaToi,
  nguoiBanLayDanhSachDonHang, nguoiBanLayChiTietDonHang, capNhatTrangThaiXuLyDonHang };
