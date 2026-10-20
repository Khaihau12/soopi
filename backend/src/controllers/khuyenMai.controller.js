const service = require('../services/khuyenMai.service');

const xuLy = (ham, status = 200, message = 'Thao tác khuyến mãi thành công') => async (req, res, next) => {
  try {
    const data = await ham(req);
    res.status(status).json({ success: true, message, data });
  } catch (loi) { next(loi); }
};

const layDanhSachKhuyenMaiDangDienRa = xuLy((req) => service.layDanhSachKhuyenMaiDangDienRa(req.query), 200, 'Lấy danh sách khuyến mãi thành công');
const nguoiBanLayDanhSachKhuyenMai = xuLy((req) => service.nguoiBanLayDanhSachKhuyenMai(req.cuaHang._id, req.query), 200, 'Lấy danh sách khuyến mãi thành công');
const quanTriLayDanhSachKhuyenMai = xuLy((req) => service.quanTriLayDanhSachKhuyenMai(req.query), 200, 'Lấy danh sách khuyến mãi thành công');
const nguoiBanLayChiTietKhuyenMai = xuLy(async (req) => ({ khuyenMai: await service.nguoiBanLayChiTietKhuyenMai(req.cuaHang._id, req.params.id) }), 200, 'Lấy chi tiết khuyến mãi thành công');
const quanTriLayChiTietKhuyenMai = xuLy(async (req) => ({ khuyenMai: await service.quanTriLayChiTietKhuyenMai(req.params.id) }), 200, 'Lấy chi tiết khuyến mãi thành công');
const nguoiBanTaoKhuyenMai = xuLy(async (req) => ({ khuyenMai: await service.nguoiBanTaoKhuyenMai(req.cuaHang._id, req.body) }), 201, 'Tạo chương trình khuyến mãi thành công');
const quanTriTaoKhuyenMai = xuLy(async (req) => ({ khuyenMai: await service.quanTriTaoKhuyenMai(req.body) }), 201, 'Tạo chương trình khuyến mãi thành công');
const nguoiBanCapNhatKhuyenMai = xuLy(async (req) => ({ khuyenMai: await service.nguoiBanCapNhatKhuyenMai(req.cuaHang._id, req.params.id, req.body) }), 200, 'Cập nhật khuyến mãi thành công');
const quanTriCapNhatKhuyenMai = xuLy(async (req) => ({ khuyenMai: await service.quanTriCapNhatKhuyenMai(req.params.id, req.body) }), 200, 'Cập nhật khuyến mãi thành công');
const nguoiBanXoaKhuyenMai = xuLy(async (req) => { await service.nguoiBanXoaKhuyenMai(req.cuaHang._id, req.params.id); return {}; }, 200, 'Đã xóa chương trình khuyến mãi');
const quanTriXoaKhuyenMai = xuLy(async (req) => { await service.quanTriXoaKhuyenMai(req.params.id); return {}; }, 200, 'Đã xóa chương trình khuyến mãi');
const quanTriVoHieuHoaKhuyenMai = xuLy(async (req) => ({ khuyenMai: await service.quanTriVoHieuHoaKhuyenMai(req.params.id) }), 200, 'Đã vô hiệu hóa chương trình khuyến mãi');

module.exports = {
  layDanhSachKhuyenMaiDangDienRa, nguoiBanLayDanhSachKhuyenMai, quanTriLayDanhSachKhuyenMai,
  nguoiBanLayChiTietKhuyenMai, quanTriLayChiTietKhuyenMai,
  nguoiBanTaoKhuyenMai, quanTriTaoKhuyenMai, nguoiBanCapNhatKhuyenMai, quanTriCapNhatKhuyenMai,
  nguoiBanXoaKhuyenMai, quanTriXoaKhuyenMai, quanTriVoHieuHoaKhuyenMai,
};
