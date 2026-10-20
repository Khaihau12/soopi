const service = require('../services/thongKe.service');

const xuLy = (ham, message) => async (req, res, next) => {
  try {
    const data = await ham(req.cuaHang, req.query);
    res.json({ success: true, message, data });
  } catch (loi) { next(loi); }
};

const xuLyQuanTri = (ham, message) => async (req, res, next) => {
  try {
    const data = await ham(req.query);
    res.json({ success: true, message, data });
  } catch (loi) { next(loi); }
};

module.exports = {
  nguoiBanLayTongQuan: xuLy(service.nguoiBanLayTongQuan, 'Lấy tổng quan thành công'),
  nguoiBanLayDoanhThu: xuLy(service.nguoiBanLayDoanhThu, 'Lấy doanh thu thành công'),
  nguoiBanLaySanPhamBanChay: xuLy(service.nguoiBanLaySanPhamBanChay, 'Lấy sản phẩm bán chạy thành công'),
  nguoiBanLayLichSuGiaoDich: xuLy(service.nguoiBanLayLichSuGiaoDich, 'Lấy lịch sử giao dịch thành công'),
  quanTriLayTongQuan: xuLyQuanTri(service.quanTriLayTongQuan, 'Lấy tổng quan hệ thống thành công'),
  quanTriLayDoanhThu: xuLyQuanTri(service.quanTriLayDoanhThu, 'Lấy doanh thu hệ thống thành công'),
  quanTriLaySanPhamBanChay: xuLyQuanTri(service.quanTriLaySanPhamBanChay, 'Lấy sản phẩm bán chạy thành công'),
  quanTriLayDanhMucQuanTam: xuLyQuanTri(service.quanTriLayDanhMucQuanTam, 'Lấy danh mục được quan tâm thành công'),
  quanTriLayHieuSuatNguoiBan: xuLyQuanTri(service.quanTriLayHieuSuatNguoiBan, 'Lấy hiệu suất Người bán thành công'),
};
