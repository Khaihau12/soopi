const mongoose = require('mongoose');
const CuaHang = require('../models/cuaHang.model');
const TaiKhoan = require('../models/taiKhoan.model');
const { VAI_TRO } = require('../constants/vaiTro.constant');
const { TRANG_THAI_YEU_CAU_NGUOI_BAN, TRANG_THAI_HOAT_DONG_CUA_HANG, TRANG_THAI_TAI_KHOAN } = require('../constants/trangThai.constant');
const { DO_DAI_TOI_DA, PHAN_TRANG } = require('../constants/cauHinh.constant');
const { taoLoi } = require('../utils/taoLoi');

const kiemTraChuoi = (giaTri, tenTruong, toiDa, batBuoc = true) => {
  if (giaTri === undefined && !batBuoc) return undefined;
  if (typeof giaTri !== 'string' || (batBuoc && !giaTri.trim())) {
    throw taoLoi(400, `Vui lòng nhập ${tenTruong}.`);
  }
  const chuoi = giaTri.trim();
  if (chuoi.length > toiDa) throw taoLoi(400, `${tenTruong} không được quá ${toiDa} ký tự.`);
  return chuoi;
};

const docSoPhanTrang = (giaTri, macDinh, toiDa) => {
  const so = Number(giaTri);
  return Number.isSafeInteger(so) && so > 0 ? Math.min(so, toiDa) : macDinh;
};

// Giữ tên trường của API đăng ký khi dữ liệu được lưu trong CuaHang.
const dinhDangYeuCau = (cuaHang) => {
  if (!cuaHang) return null;
  const { _id, tenCuaHang, diaChi, moTa, ngayGui, trangThaiDuyet, taiKhoanId } = cuaHang;
  return { _id, tenCuaHang, diaChiCuaHang: diaChi, moTaCuaHang: moTa,
    ngayGui, trangThai: trangThaiDuyet || TRANG_THAI_YEU_CAU_NGUOI_BAN.DA_PHE_DUYET,
    ...(taiKhoanId ? { taiKhoanId } : {}) };
};

const guiYeuCauDangKyNguoiBan = async (taiKhoan, body = {}) => {
  const duLieu = body && typeof body === 'object' ? body : {};
  const tenCuaHang = kiemTraChuoi(duLieu.tenCuaHang, 'tên cửa hàng', DO_DAI_TOI_DA.TEN_CUA_HANG);
  const diaChi = kiemTraChuoi(duLieu.diaChiCuaHang, 'địa chỉ cửa hàng', DO_DAI_TOI_DA.DIA_CHI);
  const moTa = kiemTraChuoi(duLieu.moTaCuaHang, 'mô tả cửa hàng', DO_DAI_TOI_DA.MO_TA, false);
  const taiKhoanId = taiKhoan._id;
  if (taiKhoan.vaiTro.includes(VAI_TRO.NGUOI_BAN)) throw taoLoi(409, 'Tài khoản của bạn đã là Người bán.');

  const cuaHang = await CuaHang.findOne({ taiKhoanId }, '_id trangThaiDuyet').lean();
  if (cuaHang?.trangThaiDuyet === TRANG_THAI_YEU_CAU_NGUOI_BAN.CHO_PHE_DUYET) {
    throw taoLoi(409, 'Bạn đã có yêu cầu đang chờ phê duyệt.');
  }
  if (cuaHang && cuaHang.trangThaiDuyet !== TRANG_THAI_YEU_CAU_NGUOI_BAN.DA_TU_CHOI) {
    throw taoLoi(409, 'Tài khoản của bạn đã là Người bán.');
  }

  const thongTin = { tenCuaHang, diaChi, moTa: moTa ?? '',
    ngayGui: new Date(), trangThaiDuyet: TRANG_THAI_YEU_CAU_NGUOI_BAN.CHO_PHE_DUYET,
    trangThaiHoatDong: TRANG_THAI_HOAT_DONG_CUA_HANG.NGUNG_HOAT_DONG };
  if (cuaHang) {
    const guiLai = await CuaHang.findOneAndUpdate(
      { _id: cuaHang._id, trangThaiDuyet: TRANG_THAI_YEU_CAU_NGUOI_BAN.DA_TU_CHOI },
      { $set: thongTin }, { returnDocument: 'after', runValidators: true },
    ).lean();
    if (!guiLai) throw taoLoi(409, 'Yêu cầu đã được xử lý.');
    return dinhDangYeuCau(guiLai);
  }
  try {
    const moi = await CuaHang.create({ ...thongTin, taiKhoanId });
    return dinhDangYeuCau(moi);
  } catch (loi) {
    if (loi.code === 11000) throw taoLoi(409, 'Bạn đã có yêu cầu đăng ký hoặc cửa hàng.');
    throw loi;
  }
};

const layYeuCauCuaToi = async (taiKhoan) => ({
  yeuCau: dinhDangYeuCau(await CuaHang.findOne({ taiKhoanId: taiKhoan._id },
    '_id tenCuaHang diaChi moTa ngayGui trangThaiDuyet').lean()),
  daLaNguoiBan: taiKhoan.vaiTro.includes(VAI_TRO.NGUOI_BAN),
});

const quanTriLayDanhSachYeuCau = async ({ trangThai, trang, gioiHan } = {}) => {
  if (trangThai && !Object.values(TRANG_THAI_YEU_CAU_NGUOI_BAN).includes(trangThai)) throw taoLoi(400, 'Trạng thái yêu cầu không hợp lệ.');
  const trangChuan = docSoPhanTrang(trang, 1, Number.MAX_SAFE_INTEGER);
  const gioiHanChuan = docSoPhanTrang(gioiHan, PHAN_TRANG.MAC_DINH, PHAN_TRANG.TOI_DA);
  const dieuKien = { ngayGui: { $exists: true }, ...(trangThai ? {
    trangThaiDuyet: trangThai === TRANG_THAI_YEU_CAU_NGUOI_BAN.DA_PHE_DUYET
      ? { $in: [trangThai, null] } : trangThai,
  } : {}) };
  const tongSo = await CuaHang.countDocuments(dieuKien);
  const danhSach = await CuaHang.find(dieuKien, '_id tenCuaHang diaChi moTa ngayGui trangThaiDuyet taiKhoanId')
    .sort({ ngayGui: -1, _id: -1 }).skip((trangChuan - 1) * gioiHanChuan).limit(gioiHanChuan)
    .populate({ path: 'taiKhoanId', select: '_id hoTen email soDienThoai' }).lean();
  return { danhSach: danhSach.map(({ taiKhoanId, ...shop }) => ({ ...dinhDangYeuCau(shop), taiKhoan: taiKhoanId || null })),
    phanTrang: { trang: trangChuan, gioiHan: gioiHanChuan, tongSo, tongTrang: Math.ceil(tongSo / gioiHanChuan) } };
};

const quanTriLayChiTietYeuCau = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID yêu cầu không hợp lệ.');
  const cuaHang = await CuaHang.findOne({ _id: id, ngayGui: { $exists: true } },
    '_id tenCuaHang diaChi moTa ngayGui trangThaiDuyet taiKhoanId')
    .populate({ path: 'taiKhoanId', select: '_id hoTen email soDienThoai diaChiNhanHang vaiTro trangThaiTaiKhoan' }).lean();
  if (!cuaHang) throw taoLoi(404, 'Không tìm thấy yêu cầu đăng ký Người bán.');
  const { taiKhoanId, ...shop } = cuaHang;
  return { ...dinhDangYeuCau(shop), taiKhoan: taiKhoanId || null };
};

const quanTriXetDuyetYeuCau = async (id, trangThai) => {
  const { CHO_PHE_DUYET, DA_PHE_DUYET, DA_TU_CHOI } = TRANG_THAI_YEU_CAU_NGUOI_BAN;
  if (![DA_PHE_DUYET, DA_TU_CHOI].includes(trangThai)) throw taoLoi(400, 'Vui lòng chọn phê duyệt hoặc từ chối.');
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID yêu cầu không hợp lệ.');
  const choDuyet = await CuaHang.findById(id, '_id taiKhoanId trangThaiDuyet').lean();
  if (!choDuyet) throw taoLoi(404, 'Không tìm thấy yêu cầu đăng ký Người bán.');
  if (choDuyet.trangThaiDuyet !== CHO_PHE_DUYET) throw taoLoi(409, 'Yêu cầu đã được xử lý.');

  if (trangThai === DA_PHE_DUYET) {
    const taiKhoan = await TaiKhoan.findById(choDuyet.taiKhoanId, '_id trangThaiTaiKhoan');
    if (!taiKhoan) throw taoLoi(404, 'Tài khoản gửi yêu cầu không còn tồn tại.');
    if (taiKhoan.trangThaiTaiKhoan !== TRANG_THAI_TAI_KHOAN.HOAT_DONG) {
      throw taoLoi(409, 'Tài khoản đang bị khóa nên chưa thể phê duyệt.');
    }
  }

  const cuaHang = await CuaHang.findOneAndUpdate(
    { _id: id, trangThaiDuyet: CHO_PHE_DUYET },
    { $set: { trangThaiDuyet: trangThai,
      trangThaiHoatDong: trangThai === DA_PHE_DUYET
        ? TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG : TRANG_THAI_HOAT_DONG_CUA_HANG.NGUNG_HOAT_DONG } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!cuaHang) throw taoLoi(409, 'Yêu cầu đã được xử lý.');
  if (trangThai === DA_TU_CHOI) return dinhDangYeuCau(cuaHang);

  try {
    const capNhat = await TaiKhoan.updateOne(
      { _id: cuaHang.taiKhoanId, trangThaiTaiKhoan: TRANG_THAI_TAI_KHOAN.HOAT_DONG },
      { $addToSet: { vaiTro: VAI_TRO.NGUOI_BAN } },
    );
    if (capNhat.matchedCount !== 1) throw taoLoi(409, 'Tài khoản đang bị khóa nên chưa thể phê duyệt.');
    return dinhDangYeuCau(cuaHang);
  } catch (loi) {
    // MongoDB local không có transaction; trả hồ sơ về trạng thái chờ khi cấp quyền thất bại.
    await CuaHang.updateOne({ _id: id, trangThaiDuyet: DA_PHE_DUYET },
      { $set: { trangThaiDuyet: CHO_PHE_DUYET, trangThaiHoatDong: TRANG_THAI_HOAT_DONG_CUA_HANG.NGUNG_HOAT_DONG } });
    throw loi;
  }
};

module.exports = { guiYeuCauDangKyNguoiBan, layYeuCauCuaToi, quanTriLayDanhSachYeuCau, quanTriLayChiTietYeuCau, quanTriXetDuyetYeuCau };
