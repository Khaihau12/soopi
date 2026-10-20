const service = require('../services/doiTraKhieuNai.service');

const guiYeuCauDoiTraKhieuNai = async (req, res, next) => {
  try {
    const yeuCau = await service.guiYeuCauDoiTraKhieuNai(req.taiKhoan._id, req.body);
    res.status(201).json({ success: true, message: 'Đã gửi yêu cầu', data: { yeuCau } });
  } catch (loi) { next(loi); }
};
const layDanhSachYeuCauCuaToi = async (req, res, next) => {
  try {
    const data = await service.layDanhSachYeuCauCuaToi(req.taiKhoan._id, req.query);
    res.json({ success: true, message: 'Lấy danh sách yêu cầu thành công', data });
  } catch (loi) { next(loi); }
};
const layChiTietYeuCauCuaToi = async (req, res, next) => {
  try {
    const yeuCau = await service.layChiTietYeuCauCuaToi(req.taiKhoan._id, req.params.id);
    res.json({ success: true, message: 'Lấy chi tiết yêu cầu thành công', data: { yeuCau } });
  } catch (loi) { next(loi); }
};
const nguoiBanLayDanhSachYeuCau = async (req, res, next) => {
  try {
    const data = await service.nguoiBanLayDanhSachYeuCau(req.cuaHang._id, req.query);
    res.json({ success: true, message: 'Lấy danh sách yêu cầu thành công', data });
  } catch (loi) { next(loi); }
};
const nguoiBanLayChiTietYeuCau = async (req, res, next) => {
  try {
    const yeuCau = await service.nguoiBanLayChiTietYeuCau(req.cuaHang._id, req.params.id);
    res.json({ success: true, message: 'Lấy chi tiết yêu cầu thành công', data: { yeuCau } });
  } catch (loi) { next(loi); }
};
const nguoiBanXuLyYeuCau = async (req, res, next) => {
  try {
    const yeuCau = await service.nguoiBanXuLyYeuCau(req.cuaHang._id, req.params.id, req.body?.ketQuaXuLy);
    res.json({ success: true, message: 'Đã ghi nhận kết quả xử lý', data: { yeuCau } });
  } catch (loi) { next(loi); }
};
module.exports = { guiYeuCauDoiTraKhieuNai, layDanhSachYeuCauCuaToi, layChiTietYeuCauCuaToi,
  nguoiBanLayDanhSachYeuCau, nguoiBanLayChiTietYeuCau, nguoiBanXuLyYeuCau };
