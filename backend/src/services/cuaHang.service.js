const mongoose = require('mongoose');
const CuaHang = require('../models/cuaHang.model');
const SanPham = require('../models/sanPham.model');
const { DO_DAI_TOI_DA, PHAN_TRANG } = require('../constants/cauHinh.constant');
const { TRANG_THAI_HOAT_DONG_CUA_HANG } = require('../constants/trangThai.constant');
const { taoLoi } = require('../utils/taoLoi');
const { thoatKyTuRegex } = require('../utils/thoatKyTuRegex');

const dinhDangCuaHang = ({ _id, tenCuaHang, moTa, diaChi, trangThaiHoatDong }) =>
  ({ _id, tenCuaHang, moTa: moTa || '', diaChi: diaChi || '', trangThaiHoatDong });

const nguoiBanLayCuaHang = (cuaHang) => dinhDangCuaHang(cuaHang);

const nguoiBanCapNhatCuaHang = async (cuaHang, body = {}) => {
  const duLieu = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const cacTruong = [
    ['tenCuaHang', DO_DAI_TOI_DA.TEN_CUA_HANG, true, 'tên cửa hàng'],
    ['moTa', DO_DAI_TOI_DA.MO_TA, false, 'mô tả'],
    ['diaChi', DO_DAI_TOI_DA.DIA_CHI, true, 'địa chỉ'],
  ];
  const capNhat = {};
  for (const [ten, toiDa, batBuoc, nhan] of cacTruong) {
    if (!Object.hasOwn(duLieu, ten)) continue;
    if (typeof duLieu[ten] !== 'string') throw taoLoi(400, `${nhan} phải là chuỗi ký tự.`);
    const giaTri = duLieu[ten].trim();
    if (batBuoc && !giaTri) throw taoLoi(400, `Vui lòng nhập ${nhan}.`);
    if (giaTri.length > toiDa) throw taoLoi(400, `${nhan} không được quá ${toiDa} ký tự.`);
    capNhat[ten] = giaTri;
  }
  if (!Object.keys(capNhat).length) throw taoLoi(400, 'Vui lòng chọn thông tin cửa hàng cần cập nhật.');

  const cuaHangMoi = await CuaHang.findOneAndUpdate(
    { _id: cuaHang._id, taiKhoanId: cuaHang.taiKhoanId },
    { $set: capNhat },
    { returnDocument: 'after', runValidators: true },
  );
  if (!cuaHangMoi) throw taoLoi(403, 'Tài khoản của bạn chưa có cửa hàng');
  return dinhDangCuaHang(cuaHangMoi);
};

const docSoTrang = (giaTri, macDinh, toiDa) => {
  const so = Number(giaTri ?? macDinh);
  if (!Number.isSafeInteger(so) || so < 1) throw taoLoi(400, 'Trang và giới hạn phải là số nguyên dương.');
  return Math.min(so, toiDa);
};

const quanTriLayDanhSachCuaHang = async (query = {}) => {
  if (query.trangThaiHoatDong && !Object.values(TRANG_THAI_HOAT_DONG_CUA_HANG).includes(query.trangThaiHoatDong)) {
    throw taoLoi(400, 'Trạng thái cửa hàng không hợp lệ.');
  }
  if (query.tuKhoa !== undefined && typeof query.tuKhoa !== 'string') throw taoLoi(400, 'Từ khóa không hợp lệ.');
  const tuKhoa = query.tuKhoa?.trim() || '';
  if (tuKhoa.length > 100) throw taoLoi(400, 'Từ khóa không được quá 100 ký tự.');
  const trang = docSoTrang(query.trang, 1, Number.MAX_SAFE_INTEGER);
  const gioiHan = docSoTrang(query.gioiHan, PHAN_TRANG.MAC_DINH, PHAN_TRANG.TOI_DA);
  const dieuKien = {};
  if (query.trangThaiHoatDong) dieuKien.trangThaiHoatDong = query.trangThaiHoatDong;
  if (tuKhoa) dieuKien.tenCuaHang = { $regex: thoatKyTuRegex(tuKhoa), $options: 'i' };
  const [tongSo, cuaHang] = await Promise.all([
    CuaHang.countDocuments(dieuKien),
    CuaHang.find(dieuKien, '_id tenCuaHang diaChi trangThaiHoatDong taiKhoanId')
      .sort({ _id: -1 }).skip((trang - 1) * gioiHan).limit(gioiHan)
      .populate({ path: 'taiKhoanId', select: '_id hoTen email' }).lean(),
  ]);
  // Nhóm một lần cho cả trang; số truy vấn không tăng theo số cửa hàng.
  const soLuong = await SanPham.aggregate([
    { $match: { cuaHangId: { $in: cuaHang.map((item) => item._id) } } },
    { $group: { _id: '$cuaHangId', soSanPham: { $sum: 1 } } },
  ]);
  const soTheoCuaHang = new Map(soLuong.map((item) => [String(item._id), item.soSanPham]));
  const danhSach = cuaHang.map(({ taiKhoanId, ...item }) => ({ ...item,
    chuCuaHang: taiKhoanId ? { _id: taiKhoanId._id, hoTen: taiKhoanId.hoTen, email: taiKhoanId.email } : null,
    soSanPham: soTheoCuaHang.get(String(item._id)) || 0 }));
  return { danhSach, phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) } };
};

const quanTriCapNhatTrangThaiCuaHang = async (id, body = {}) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID cửa hàng không hợp lệ.');
  const trangThai = body?.trangThaiHoatDong;
  if (!Object.values(TRANG_THAI_HOAT_DONG_CUA_HANG).includes(trangThai)) throw taoLoi(400, 'Trạng thái cửa hàng không hợp lệ.');
  const cuaHang = await CuaHang.findById(id, '_id trangThaiHoatDong').lean();
  if (!cuaHang) throw taoLoi(404, 'Không tìm thấy cửa hàng.');
  if (cuaHang.trangThaiHoatDong === trangThai) throw taoLoi(409, 'Cửa hàng đã ở trạng thái này.');
  const moi = await CuaHang.findOneAndUpdate({ _id: id, trangThaiHoatDong: { $ne: trangThai } },
    { $set: { trangThaiHoatDong: trangThai } }, { returnDocument: 'after', runValidators: true })
    .select('_id tenCuaHang diaChi trangThaiHoatDong taiKhoanId').lean();
  if (!moi) throw taoLoi(409, 'Cửa hàng đã ở trạng thái này.');
  return moi;
};

module.exports = { nguoiBanLayCuaHang, nguoiBanCapNhatCuaHang,
  quanTriLayDanhSachCuaHang, quanTriCapNhatTrangThaiCuaHang };
