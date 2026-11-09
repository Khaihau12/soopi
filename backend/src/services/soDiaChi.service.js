const mongoose = require('mongoose');
const TaiKhoan = require('../models/taiKhoan.model');
const { DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');
const { taoLoi } = require('../utils/taoLoi');

const SO_DIA_CHI_TOI_DA = 10;

const layTaiKhoan = async (taiKhoanId) => {
  const taiKhoan = await TaiKhoan.findById(taiKhoanId);
  if (!taiKhoan) throw taoLoi(401, 'Vui lòng đăng nhập để tiếp tục');
  // Địa chỉ hồ sơ cũ trở thành địa chỉ mặc định mà không tạo collection mới.
  if (!taiKhoan.diaChiDaLuu.length && taiKhoan.diaChiNhanHang?.trim()) {
    await TaiKhoan.updateOne({ _id: taiKhoanId, $or: [
      { diaChiDaLuu: { $exists: false } }, { diaChiDaLuu: { $size: 0 } },
    ] }, { $push: { diaChiDaLuu: { _id: new mongoose.Types.ObjectId(), tenGoi: 'Nhà riêng',
      diaChi: taiKhoan.diaChiNhanHang.trim(), macDinh: true } } });
    return TaiKhoan.findById(taiKhoanId);
  }
  return taiKhoan;
};

const ketQua = (taiKhoan) => taiKhoan.diaChiDaLuu.map((item) => ({
  _id: item._id, tenGoi: item.tenGoi, diaChi: item.diaChi, macDinh: item.macDinh,
}));

const chuanHoa = (body = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw taoLoi(400, 'Dữ liệu địa chỉ không hợp lệ');
  if (typeof body.tenGoi !== 'string' || !body.tenGoi.trim() || body.tenGoi.trim().length > 40) {
    throw taoLoi(400, 'Tên gợi nhớ phải có từ 1 đến 40 ký tự');
  }
  if (typeof body.diaChi !== 'string' || !body.diaChi.trim() || body.diaChi.trim().length > DO_DAI_TOI_DA.DIA_CHI) {
    throw taoLoi(400, `Địa chỉ phải có từ 1 đến ${DO_DAI_TOI_DA.DIA_CHI} ký tự`);
  }
  return { tenGoi: body.tenGoi.trim(), diaChi: body.diaChi.trim() };
};

const luu = async (taiKhoan) => {
  const macDinh = taiKhoan.diaChiDaLuu.find((item) => item.macDinh);
  taiKhoan.diaChiNhanHang = macDinh?.diaChi || '';
  await taiKhoan.save();
  return ketQua(taiKhoan);
};

const laySoDiaChi = async (taiKhoanId) => ketQua(await layTaiKhoan(taiKhoanId));

const themDiaChi = async (taiKhoanId, body) => {
  const duLieu = chuanHoa(body);
  const taiKhoan = await layTaiKhoan(taiKhoanId);
  if (taiKhoan.diaChiDaLuu.length >= SO_DIA_CHI_TOI_DA) throw taoLoi(409, `Chỉ lưu tối đa ${SO_DIA_CHI_TOI_DA} địa chỉ`);
  const macDinh = !taiKhoan.diaChiDaLuu.length || body.macDinh === true;
  if (macDinh) taiKhoan.diaChiDaLuu.forEach((item) => { item.macDinh = false; });
  taiKhoan.diaChiDaLuu.push({ ...duLieu, macDinh });
  return luu(taiKhoan);
};

const suaDiaChi = async (taiKhoanId, id, body) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(404, 'Không tìm thấy địa chỉ');
  const duLieu = chuanHoa(body);
  const taiKhoan = await layTaiKhoan(taiKhoanId);
  const diaChi = taiKhoan.diaChiDaLuu.id(id);
  if (!diaChi) throw taoLoi(404, 'Không tìm thấy địa chỉ');
  diaChi.set(duLieu);
  return luu(taiKhoan);
};

const datMacDinh = async (taiKhoanId, id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(404, 'Không tìm thấy địa chỉ');
  const taiKhoan = await layTaiKhoan(taiKhoanId);
  if (!taiKhoan.diaChiDaLuu.id(id)) throw taoLoi(404, 'Không tìm thấy địa chỉ');
  taiKhoan.diaChiDaLuu.forEach((item) => { item.macDinh = String(item._id) === String(id); });
  return luu(taiKhoan);
};

const xoaDiaChi = async (taiKhoanId, id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(404, 'Không tìm thấy địa chỉ');
  const taiKhoan = await layTaiKhoan(taiKhoanId);
  const diaChi = taiKhoan.diaChiDaLuu.id(id);
  if (!diaChi) throw taoLoi(404, 'Không tìm thấy địa chỉ');
  const laMacDinh = diaChi.macDinh;
  diaChi.deleteOne();
  if (laMacDinh && taiKhoan.diaChiDaLuu.length) taiKhoan.diaChiDaLuu[0].macDinh = true;
  return luu(taiKhoan);
};

// Giữ endpoint hồ sơ cũ đồng bộ nếu một client cũ vẫn sửa địa chỉ tại đó.
const dongBoDiaChiHoSo = async (taiKhoanId, diaChiMoi) => {
  const taiKhoan = await layTaiKhoan(taiKhoanId);
  const macDinh = taiKhoan.diaChiDaLuu.find((item) => item.macDinh);
  if (!diaChiMoi) {
    if (macDinh) macDinh.deleteOne();
    if (taiKhoan.diaChiDaLuu.length) taiKhoan.diaChiDaLuu[0].macDinh = true;
  } else if (macDinh) macDinh.diaChi = diaChiMoi;
  else taiKhoan.diaChiDaLuu.push({ tenGoi: 'Nhà riêng', diaChi: diaChiMoi, macDinh: true });
  return luu(taiKhoan);
};

module.exports = { laySoDiaChi, themDiaChi, suaDiaChi, datMacDinh, xoaDiaChi, dongBoDiaChiHoSo };
