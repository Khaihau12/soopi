const mongoose = require('mongoose');
const YeuCauDangKyNguoiBan = require('../models/yeuCauDangKyNguoiBan.model');
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

const dinhDangYeuCau = (yeuCau) => {
  if (!yeuCau) return null;
  const { taiKhoanId, ...duLieu } = yeuCau;
  return { ...duLieu, taiKhoan: taiKhoanId || null };
};

const guiYeuCauDangKyNguoiBan = async (taiKhoan, body = {}) => {
  const duLieu = body && typeof body === 'object' ? body : {};
  const tenCuaHang = kiemTraChuoi(duLieu.tenCuaHang, 'tên cửa hàng', DO_DAI_TOI_DA.TEN_CUA_HANG);
  const diaChiCuaHang = kiemTraChuoi(duLieu.diaChiCuaHang, 'địa chỉ cửa hàng', DO_DAI_TOI_DA.DIA_CHI);
  const moTaCuaHang = kiemTraChuoi(duLieu.moTaCuaHang, 'mô tả cửa hàng', DO_DAI_TOI_DA.MO_TA, false);
  const taiKhoanId = taiKhoan._id;
  if (taiKhoan.vaiTro.includes(VAI_TRO.NGUOI_BAN) || await CuaHang.exists({ taiKhoanId })) {
    throw taoLoi(409, 'Tài khoản của bạn đã là Người bán.');
  }
  if (await YeuCauDangKyNguoiBan.exists({ taiKhoanId, trangThai: TRANG_THAI_YEU_CAU_NGUOI_BAN.CHO_PHE_DUYET })) {
    throw taoLoi(409, 'Bạn đã có yêu cầu đang chờ phê duyệt.');
  }
  return YeuCauDangKyNguoiBan.create({ tenCuaHang, diaChiCuaHang, ...(moTaCuaHang !== undefined ? { moTaCuaHang } : {}), taiKhoanId, ngayGui: new Date(), trangThai: TRANG_THAI_YEU_CAU_NGUOI_BAN.CHO_PHE_DUYET });
};

const layYeuCauCuaToi = async (taiKhoan) => ({
  yeuCau: await YeuCauDangKyNguoiBan.findOne({ taiKhoanId: taiKhoan._id }, '_id tenCuaHang diaChiCuaHang moTaCuaHang ngayGui trangThai').sort({ _id: -1 }).lean(),
  daLaNguoiBan: taiKhoan.vaiTro.includes(VAI_TRO.NGUOI_BAN),
});

const quanTriLayDanhSachYeuCau = async ({ trangThai, trang, gioiHan } = {}) => {
  if (trangThai && !Object.values(TRANG_THAI_YEU_CAU_NGUOI_BAN).includes(trangThai)) throw taoLoi(400, 'Trạng thái yêu cầu không hợp lệ.');
  const trangChuan = docSoPhanTrang(trang, 1, Number.MAX_SAFE_INTEGER);
  const gioiHanChuan = docSoPhanTrang(gioiHan, PHAN_TRANG.MAC_DINH, PHAN_TRANG.TOI_DA);
  const dieuKien = { _id: { $type: 'objectId' }, ...(trangThai ? { trangThai } : {}) };
  const tongSo = await YeuCauDangKyNguoiBan.countDocuments(dieuKien);
  const danhSach = await YeuCauDangKyNguoiBan.find(dieuKien, '_id tenCuaHang diaChiCuaHang moTaCuaHang ngayGui trangThai taiKhoanId')
    .sort({ _id: -1 }).skip((trangChuan - 1) * gioiHanChuan).limit(gioiHanChuan)
    .populate({ path: 'taiKhoanId', select: '_id hoTen email soDienThoai' }).lean();
  return { danhSach: danhSach.map(dinhDangYeuCau), phanTrang: { trang: trangChuan, gioiHan: gioiHanChuan, tongSo, tongTrang: Math.ceil(tongSo / gioiHanChuan) } };
};

const quanTriLayChiTietYeuCau = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID yêu cầu không hợp lệ.');
  const yeuCau = await YeuCauDangKyNguoiBan.findById(id, '_id tenCuaHang diaChiCuaHang moTaCuaHang ngayGui trangThai taiKhoanId')
    .populate({ path: 'taiKhoanId', select: '_id hoTen email soDienThoai diaChiNhanHang vaiTro trangThaiTaiKhoan' }).lean();
  if (!yeuCau) throw taoLoi(404, 'Không tìm thấy yêu cầu đăng ký Người bán.');
  return dinhDangYeuCau(yeuCau);
};

const quanTriXetDuyetYeuCau = async (id, trangThai) => {
  const { CHO_PHE_DUYET, DA_PHE_DUYET, DA_TU_CHOI } = TRANG_THAI_YEU_CAU_NGUOI_BAN;
  if (![DA_PHE_DUYET, DA_TU_CHOI].includes(trangThai)) throw taoLoi(400, 'Vui lòng chọn phê duyệt hoặc từ chối.');
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID yêu cầu không hợp lệ.');
  const yeuCau = await YeuCauDangKyNguoiBan.findOneAndUpdate(
    { _id: id, trangThai: CHO_PHE_DUYET }, { $set: { trangThai } }, { returnDocument: 'after' },
  );
  if (!yeuCau) {
    if (!await YeuCauDangKyNguoiBan.exists({ _id: id })) throw taoLoi(404, 'Không tìm thấy yêu cầu đăng ký Người bán.');
    throw taoLoi(409, 'Yêu cầu đã được xử lý.');
  }
  if (trangThai === DA_TU_CHOI) return yeuCau;

  let cuaHangMoi = null;
  try {
    const taiKhoan = await TaiKhoan.findById(yeuCau.taiKhoanId, '_id trangThaiTaiKhoan');
    if (!taiKhoan) throw taoLoi(404, 'Tài khoản gửi yêu cầu không còn tồn tại.');
    if (taiKhoan.trangThaiTaiKhoan !== TRANG_THAI_TAI_KHOAN.HOAT_DONG) {
      throw taoLoi(409, 'Tài khoản đang bị khóa nên chưa thể phê duyệt.');
    }
    const cuaHang = await CuaHang.findOne({ taiKhoanId: taiKhoan._id }, '_id');
    if (!cuaHang) {
      cuaHangMoi = await CuaHang.create({
        tenCuaHang: yeuCau.tenCuaHang,
        moTa: yeuCau.moTaCuaHang,
        diaChi: yeuCau.diaChiCuaHang,
        trangThaiHoatDong: TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG,
        taiKhoanId: taiKhoan._id,
      });
    }
    const capNhat = await TaiKhoan.updateOne(
      { _id: taiKhoan._id, trangThaiTaiKhoan: TRANG_THAI_TAI_KHOAN.HOAT_DONG },
      { $addToSet: { vaiTro: VAI_TRO.NGUOI_BAN } },
    );
    if (capNhat.matchedCount !== 1) throw taoLoi(409, 'Tài khoản đang bị khóa nên chưa thể phê duyệt.');
    return yeuCau;
  } catch (loi) {
    // MongoDB local không có transaction; chỉ xóa cửa hàng được tạo trong lần duyệt này.
    try {
      if (cuaHangMoi) await CuaHang.deleteOne({ _id: cuaHangMoi._id });
    } finally {
      await YeuCauDangKyNguoiBan.updateOne({ _id: id, trangThai: DA_PHE_DUYET }, { $set: { trangThai: CHO_PHE_DUYET } });
    }
    throw loi;
  }
};

module.exports = { guiYeuCauDangKyNguoiBan, layYeuCauCuaToi, quanTriLayDanhSachYeuCau, quanTriLayChiTietYeuCau, quanTriXetDuyetYeuCau };
