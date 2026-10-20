const mongoose = require('mongoose');
const CuocTroChuyen = require('../models/cuocTroChuyen.model');
const TinNhan = require('../models/tinNhan.model');
const CuaHang = require('../models/cuaHang.model');
const TaiKhoan = require('../models/taiKhoan.model');
const { DO_DAI_TOI_DA, PHAN_TRANG, SO_TIN_NHAN_MOI_LAN } = require('../constants/cauHinh.constant');
const { TRANG_THAI_HOAT_DONG_CUA_HANG } = require('../constants/trangThai.constant');
const { VAI_TRO } = require('../constants/vaiTro.constant');
const { taoLoi } = require('../utils/taoLoi');
const { phatTinNhanMoi } = require('./thongBaoTinNhan.service');

const docSoNguyenDuong = (giaTri, macDinh, toiDa) => {
  if (giaTri !== undefined && (!/^\d+$/.test(String(giaTri)) || !Number.isSafeInteger(Number(giaTri)) || Number(giaTri) < 1)) {
    throw taoLoi(400, 'Trang và giới hạn phải là số nguyên dương');
  }
  return Math.min(Number(giaTri || macDinh), toiDa);
};

const docNoiDung = (body = {}) => {
  if (typeof body?.noiDung !== 'string' || !body.noiDung.trim()) throw taoLoi(400, 'Vui lòng nhập nội dung tin nhắn');
  const noiDung = body.noiDung.trim();
  if (noiDung.length > DO_DAI_TOI_DA.NOI_DUNG) throw taoLoi(400, `Nội dung tin nhắn không được quá ${DO_DAI_TOI_DA.NOI_DUNG} ký tự`);
  return noiDung;
};

const kiemTraThanhVien = async (id, taiKhoan) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(404, 'Không tìm thấy cuộc trò chuyện');
  const cuocTroChuyen = await CuocTroChuyen.findById(id).lean();
  if (!cuocTroChuyen) throw taoLoi(404, 'Không tìm thấy cuộc trò chuyện');
  if (String(cuocTroChuyen.taiKhoanId) === String(taiKhoan._id)) return cuocTroChuyen;
  if (taiKhoan.vaiTro.includes(VAI_TRO.NGUOI_BAN)) {
    const cuaHang = await CuaHang.findOne({ _id: cuocTroChuyen.cuaHangId, taiKhoanId: taiKhoan._id }).select('_id').lean();
    if (cuaHang) return cuocTroChuyen;
  }
  throw taoLoi(404, 'Không tìm thấy cuộc trò chuyện');
};

const dungTinNhan = (tin) => ({ _id: tin._id, noiDung: tin.noiDung, thoiGianGui: tin.thoiGianGui,
  cuocTroChuyenId: tin.cuocTroChuyenId, nguoiGuiId: tin.nguoiGuiId });

const guiTinChoCuocTroChuyen = async (cuocTroChuyen, nguoiGuiId, noiDung) => {
  const thoiGianGui = new Date();
  const tinNhan = await TinNhan.create({ cuocTroChuyenId: cuocTroChuyen._id, nguoiGuiId, noiDung, thoiGianGui });
  try {
    await CuocTroChuyen.updateOne({ _id: cuocTroChuyen._id }, { $max: { thoiGianCapNhat: thoiGianGui } });
  } catch (loi) { console.error('Không cập nhật được thời gian cuộc trò chuyện:', loi); }
  const tinDaLuu = dungTinNhan(tinNhan);
  await phatTinNhanMoi(cuocTroChuyen, tinDaLuu);
  return tinDaLuu;
};

const taoCuocTroChuyenVaGuiTinNhan = async (taiKhoan, body = {}) => {
  const noiDung = docNoiDung(body);
  if (!mongoose.isValidObjectId(body.cuaHangId)) throw taoLoi(404, 'Không tìm thấy cửa hàng');
  const cuaHang = await CuaHang.findById(body.cuaHangId).select('_id taiKhoanId tenCuaHang trangThaiHoatDong').lean();
  if (!cuaHang) throw taoLoi(404, 'Không tìm thấy cửa hàng');
  if (String(cuaHang.taiKhoanId) === String(taiKhoan._id)) throw taoLoi(409, 'Bạn không thể nhắn tin cho cửa hàng của chính mình');
  const dieuKien = { taiKhoanId: taiKhoan._id, cuaHangId: cuaHang._id };
  let cuocTroChuyen = await CuocTroChuyen.findOne(dieuKien).lean();
  let vuaTao = false;
  if (!cuocTroChuyen) {
    if (cuaHang.trangThaiHoatDong !== TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG) {
      throw taoLoi(409, 'Cửa hàng đã ngừng hoạt động, không thể bắt đầu trò chuyện mới');
    }
    const thoiGian = new Date();
    try {
      const ketQua = await CuocTroChuyen.findOneAndUpdate(dieuKien,
        { $setOnInsert: { ...dieuKien, thoiGianBatDau: thoiGian, thoiGianCapNhat: thoiGian } },
        { upsert: true, returnDocument: 'after', includeResultMetadata: true });
      cuocTroChuyen = ketQua.value.toObject();
      vuaTao = !ketQua.lastErrorObject?.updatedExisting;
    } catch (loi) {
      if (loi.code !== 11000) throw loi;
      cuocTroChuyen = await CuocTroChuyen.findOne(dieuKien).lean();
      if (!cuocTroChuyen) throw loi;
    }
  }
  try {
    const tinNhan = await guiTinChoCuocTroChuyen(cuocTroChuyen, taiKhoan._id, noiDung);
    const cuocMoi = await CuocTroChuyen.findById(cuocTroChuyen._id).lean();
    return { cuocTroChuyen: (await dungDanhSachCuocTroChuyen([cuocMoi]))[0], tinNhan };
  } catch (loi) {
    if (vuaTao && !(await TinNhan.exists({ cuocTroChuyenId: cuocTroChuyen._id }))) {
      await CuocTroChuyen.deleteOne({ _id: cuocTroChuyen._id });
    }
    throw loi;
  }
};

const guiTinNhan = async (taiKhoan, id, body = {}) => {
  const cuocTroChuyen = await kiemTraThanhVien(id, taiKhoan);
  const noiDung = docNoiDung(body);
  return guiTinChoCuocTroChuyen(cuocTroChuyen, taiKhoan._id, noiDung);
};

const docMocThoiGian = (moc) => {
  if (typeof moc !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(moc) || Number.isNaN(Date.parse(moc))) {
    throw taoLoi(400, 'Mốc thời gian phải là ISO 8601 hợp lệ');
  }
  return new Date(moc);
};

const layTinNhan = async (taiKhoan, id, query = {}) => {
  const cuocTroChuyen = await kiemTraThanhVien(id, taiKhoan);
  if (query.truoc && query.sau) throw taoLoi(400, 'Chỉ dùng một mốc trước hoặc sau');
  const sau = query.sau ? docMocThoiGian(query.sau) : null;
  const truoc = query.truoc ? docMocThoiGian(query.truoc) : null;
  const gioiHan = docSoNguyenDuong(query.gioiHan, SO_TIN_NHAN_MOI_LAN, sau ? 100 : PHAN_TRANG.TOI_DA);
  const dieuKien = { cuocTroChuyenId: cuocTroChuyen._id };
  if (sau) dieuKien.thoiGianGui = { $gte: sau };
  if (truoc) dieuKien.thoiGianGui = { $lte: truoc };
  const tin = await TinNhan.find(dieuKien).sort(sau ? { thoiGianGui: 1, _id: 1 } : { thoiGianGui: -1, _id: -1 })
    .limit(gioiHan + 1).lean();
  const coTinCuHon = !sau && tin.length > gioiHan;
  const danhSach = tin.slice(0, gioiHan);
  if (!sau) danhSach.reverse();
  return { danhSach: danhSach.map(dungTinNhan), coTinCuHon };
};

// Tin cuối được lấy cho cả trang bằng một phép nhóm, không truy vấn riêng cho từng cuộc trò chuyện.
const dungDanhSachCuocTroChuyen = async (cacCuocTroChuyen) => {
  const ids = cacCuocTroChuyen.map((item) => item._id);
  const [cacCuaHang, cacTaiKhoan, cacTinCuoi] = await Promise.all([
    CuaHang.find({ _id: { $in: cacCuocTroChuyen.map((item) => item.cuaHangId) } }).select('_id tenCuaHang').lean(),
    TaiKhoan.find({ _id: { $in: cacCuocTroChuyen.map((item) => item.taiKhoanId) } }).select('_id hoTen').lean(),
    TinNhan.aggregate([
      { $match: { cuocTroChuyenId: { $in: ids } } },
      { $sort: { thoiGianGui: -1, _id: -1 } },
      { $group: { _id: '$cuocTroChuyenId', tinNhan: { $first: '$$ROOT' } } },
    ]),
  ]);
  const bang = (danhSach) => new Map(danhSach.map((item) => [String(item._id), item]));
  const cuaHangTheoId = bang(cacCuaHang);
  const taiKhoanTheoId = bang(cacTaiKhoan);
  const tinTheoCuoc = new Map(cacTinCuoi.map((item) => [String(item._id), item.tinNhan]));
  return cacCuocTroChuyen.map((item) => {
    const cuaHang = cuaHangTheoId.get(String(item.cuaHangId));
    const nguoiDung = taiKhoanTheoId.get(String(item.taiKhoanId));
    const tin = tinTheoCuoc.get(String(item._id));
    return { _id: item._id, thoiGianBatDau: item.thoiGianBatDau, thoiGianCapNhat: item.thoiGianCapNhat,
      cuaHang: { _id: item.cuaHangId, tenCuaHang: cuaHang?.tenCuaHang || 'Cửa hàng không còn hiển thị' },
      nguoiDung: { _id: item.taiKhoanId, hoTen: nguoiDung?.hoTen || 'Người mua' },
      tinNhanCuoi: tin ? { noiDung: tin.noiDung, thoiGianGui: tin.thoiGianGui, nguoiGuiId: tin.nguoiGuiId } : null };
  });
};

const layDanhSach = async (dieuKien, query = {}) => {
  const trang = docSoNguyenDuong(query.trang, 1, Number.MAX_SAFE_INTEGER);
  const gioiHan = docSoNguyenDuong(query.gioiHan, PHAN_TRANG.MAC_DINH, PHAN_TRANG.TOI_DA);
  const [tongSo, cacCuoc] = await Promise.all([
    CuocTroChuyen.countDocuments(dieuKien),
    CuocTroChuyen.find(dieuKien).sort({ thoiGianCapNhat: -1, _id: -1 })
      .skip((trang - 1) * gioiHan).limit(gioiHan).lean(),
  ]);
  return { danhSach: await dungDanhSachCuocTroChuyen(cacCuoc),
    phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) } };
};

const layDanhSachCuocTroChuyenCuaToi = (taiKhoanId, query = {}) => {
  if (query.cuaHangId && !mongoose.isValidObjectId(query.cuaHangId)) throw taoLoi(400, 'ID cửa hàng không hợp lệ');
  return layDanhSach({ taiKhoanId, ...(query.cuaHangId ? { cuaHangId: query.cuaHangId } : {}) }, query);
};
const nguoiBanLayDanhSachCuocTroChuyen = (cuaHangId, query = {}) => layDanhSach({ cuaHangId }, query);

module.exports = { layDanhSachCuocTroChuyenCuaToi, taoCuocTroChuyenVaGuiTinNhan,
  layTinNhan, guiTinNhan, nguoiBanLayDanhSachCuocTroChuyen, kiemTraThanhVien };
