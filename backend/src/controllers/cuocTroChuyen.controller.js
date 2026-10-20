const service = require('../services/cuocTroChuyen.service');

const layDanhSachCuocTroChuyenCuaToi = async (req, res, next) => {
  try { const data = await service.layDanhSachCuocTroChuyenCuaToi(req.taiKhoan._id, req.query);
    res.json({ success: true, message: 'Lấy danh sách trò chuyện thành công', data }); }
  catch (loi) { next(loi); }
};
const taoCuocTroChuyenVaGuiTinNhan = async (req, res, next) => {
  try { const data = await service.taoCuocTroChuyenVaGuiTinNhan(req.taiKhoan, req.body);
    res.status(201).json({ success: true, message: 'Đã gửi tin nhắn', data }); }
  catch (loi) { next(loi); }
};
const layTinNhan = async (req, res, next) => {
  try { const data = await service.layTinNhan(req.taiKhoan, req.params.id, req.query);
    res.json({ success: true, message: 'Lấy tin nhắn thành công', data }); }
  catch (loi) { next(loi); }
};
const guiTinNhan = async (req, res, next) => {
  try { const tinNhan = await service.guiTinNhan(req.taiKhoan, req.params.id, req.body);
    res.status(201).json({ success: true, message: 'Đã gửi tin nhắn', data: { tinNhan } }); }
  catch (loi) { next(loi); }
};
const nguoiBanLayDanhSachCuocTroChuyen = async (req, res, next) => {
  try { const data = await service.nguoiBanLayDanhSachCuocTroChuyen(req.cuaHang._id, req.query);
    res.json({ success: true, message: 'Lấy danh sách trò chuyện thành công', data }); }
  catch (loi) { next(loi); }
};
module.exports = { layDanhSachCuocTroChuyenCuaToi, taoCuocTroChuyenVaGuiTinNhan,
  layTinNhan, guiTinNhan, nguoiBanLayDanhSachCuocTroChuyen };
