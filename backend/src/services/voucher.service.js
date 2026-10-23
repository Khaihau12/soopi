const mongoose = require('mongoose');
const Voucher = require('../models/voucher.model');
const ApDungVoucher = require('../models/apDungVoucher.model');
const CuaHang = require('../models/cuaHang.model');
const { LOAI_VOUCHER, KIEU_GIAM, TRANG_THAI_VOUCHER, TRANG_THAI_HOAT_DONG_CUA_HANG } = require('../constants/trangThai.constant');
const { PHAN_TRANG, REGEX_MA_VOUCHER } = require('../constants/cauHinh.constant');
const { taoLoi } = require('../utils/taoLoi');
const { thoatKyTuRegex } = require('../utils/thoatKyTuRegex');

const kiemTraDieuKienVoucher = (voucher, { cuaHangId, tongTienHangCuaHang, tongTienHangToanBo, thoiDiem = new Date() } = {}) => {
  if (!voucher || voucher.trangThai !== TRANG_THAI_VOUCHER.KICH_HOAT) return { hopLe: false, lyDo: 'Voucher đã bị vô hiệu hóa' };
  if (thoiDiem < new Date(voucher.ngayBatDau)) return { hopLe: false, lyDo: 'Voucher chưa đến thời gian sử dụng' };
  if (thoiDiem > new Date(voucher.ngayKetThuc)) return { hopLe: false, lyDo: 'Voucher đã hết hạn' };
  if (!Number.isInteger(voucher.soLuong) || voucher.soLuong < 1) return { hopLe: false, lyDo: 'Voucher đã hết lượt sử dụng' };
  if (voucher.loaiVoucher === LOAI_VOUCHER.CUA_HANG && (!cuaHangId || String(voucher.cuaHangId) !== String(cuaHangId))) {
    return { hopLe: false, lyDo: 'Voucher không áp dụng cho cửa hàng này' };
  }
  const tongTien = voucher.loaiVoucher === LOAI_VOUCHER.CUA_HANG ? tongTienHangCuaHang : tongTienHangToanBo;
  const toiThieu = voucher.giaTriDonToiThieu ?? 0;
  if (!Number.isFinite(tongTien) || tongTien < toiThieu) return { hopLe: false, lyDo: `Đơn chưa đạt giá trị tối thiểu ${toiThieu.toLocaleString('vi-VN')}đ` };
  return { hopLe: true };
};

const tinhMucGiamVoucher = (voucher, giaTriCoSo) => {
  if (!voucher || !Number.isFinite(giaTriCoSo) || giaTriCoSo <= 0) return 0;
  const mucGiam = voucher.kieuGiam === KIEU_GIAM.PHAN_TRAM
    ? Math.round(giaTriCoSo * voucher.giaTriGiam / 100) : voucher.giaTriGiam;
  if (!Number.isFinite(mucGiam)) return 0;
  return Math.max(0, Math.min(Math.round(giaTriCoSo), Math.round(mucGiam), voucher.giamToiDa ?? Infinity));
};

const soTrang = (value, macDinh, toiDa) => {
  const so = Number(value);
  return Number.isSafeInteger(so) && so > 0 ? Math.min(so, toiDa) : macDinh;
};

const dinhDangVoucher = (voucher, soDonDaApDung = 0) => ({
  _id: voucher._id,
  maVoucher: voucher.maVoucher,
  tenVoucher: voucher.tenVoucher,
  loaiVoucher: voucher.loaiVoucher,
  kieuGiam: voucher.kieuGiam,
  giaTriGiam: voucher.giaTriGiam,
  giamToiDa: voucher.giamToiDa ?? null,
  giaTriDonToiThieu: voucher.giaTriDonToiThieu,
  soLuong: voucher.soLuong,
  ngayBatDau: voucher.ngayBatDau,
  ngayKetThuc: voucher.ngayKetThuc,
  trangThai: voucher.trangThai,
  cuaHang: voucher.cuaHangId?.tenCuaHang ? { _id: voucher.cuaHangId._id, tenCuaHang: voucher.cuaHangId.tenCuaHang } : null,
  soDonDaApDung,
});

const demDonApDung = async (ids) => {
  if (!ids.length) return new Map();
  const dem = await ApDungVoucher.aggregate([
    { $match: { voucherId: { $in: ids } } },
    { $group: { _id: '$voucherId', donHangIds: { $addToSet: '$donHangId' } } },
    { $project: { soDonDaApDung: { $size: '$donHangIds' } } },
  ]);
  return new Map(dem.map((dong) => [String(dong._id), dong.soDonDaApDung]));
};

const layDanhSach = async (dieuKien, query = {}) => {
  const trang = soTrang(query.trang, 1, Number.MAX_SAFE_INTEGER);
  const gioiHan = soTrang(query.gioiHan, PHAN_TRANG.MAC_DINH, PHAN_TRANG.TOI_DA);
  const tongSo = await Voucher.countDocuments(dieuKien);
  const danhSach = await Voucher.find(dieuKien).sort({ _id: -1 }).skip((trang - 1) * gioiHan).limit(gioiHan)
    .populate({ path: 'cuaHangId', select: '_id tenCuaHang' }).lean();
  const dem = await demDonApDung(danhSach.map((voucher) => voucher._id));
  return {
    danhSach: danhSach.map((voucher) => dinhDangVoucher(voucher, dem.get(String(voucher._id)) ?? 0)),
    phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) },
  };
};

const kiemTraBoLoc = (query, laQuanTri) => {
  if (query.trangThai && !Object.values(TRANG_THAI_VOUCHER).includes(query.trangThai)) throw taoLoi(400, 'Trạng thái voucher không hợp lệ');
  if (laQuanTri && query.loaiVoucher && ![LOAI_VOUCHER.TOAN_SAN, LOAI_VOUCHER.FREESHIP].includes(query.loaiVoucher)) throw taoLoi(400, 'Quản trị viên chỉ xem voucher Toàn sàn hoặc Freeship');
  if (query.tuKhoa && (typeof query.tuKhoa !== 'string' || query.tuKhoa.trim().length > 100)) throw taoLoi(400, 'Từ khóa tối đa 100 ký tự');
};

const taoBoLoc = (query) => ({
  ...(query.trangThai ? { trangThai: query.trangThai } : {}),
  ...(query.loaiVoucher ? { loaiVoucher: query.loaiVoucher } : {}),
  ...(query.tuKhoa?.trim() ? { $or: [
    { maVoucher: { $regex: thoatKyTuRegex(query.tuKhoa.trim()), $options: 'i' } },
    { tenVoucher: { $regex: thoatKyTuRegex(query.tuKhoa.trim()), $options: 'i' } },
  ] } : {}),
});

const nguoiBanLayDanhSachVoucher = (cuaHangId, query = {}) => {
  kiemTraBoLoc(query, false);
  return layDanhSach({ cuaHangId, ...taoBoLoc({ ...query, loaiVoucher: undefined }) }, query);
};
const boLocVoucherHeThong = { loaiVoucher: { $in: [LOAI_VOUCHER.TOAN_SAN, LOAI_VOUCHER.FREESHIP] }, cuaHangId: null };
const quanTriLayDanhSachVoucher = (query = {}) => {
  kiemTraBoLoc(query, true);
  return layDanhSach({ ...boLocVoucherHeThong, ...taoBoLoc(query) }, query);
};

const layDanhSachVoucherDangDung = async ({ cuaHangId } = {}) => {
  if (cuaHangId && !mongoose.isValidObjectId(cuaHangId)) throw taoLoi(400, 'ID cửa hàng không hợp lệ');
  const hienTai = new Date();
  const dieuKien = {
    trangThai: TRANG_THAI_VOUCHER.KICH_HOAT,
    ngayBatDau: { $lte: hienTai }, ngayKetThuc: { $gte: hienTai }, soLuong: { $gte: 1 },
    $or: [{ loaiVoucher: { $in: [LOAI_VOUCHER.TOAN_SAN, LOAI_VOUCHER.FREESHIP] }, cuaHangId: null }],
  };
  if (cuaHangId && await CuaHang.exists({ _id: cuaHangId, trangThaiHoatDong: TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG })) {
    dieuKien.$or.push({ loaiVoucher: LOAI_VOUCHER.CUA_HANG, cuaHangId });
  }
  const danhSach = await Voucher.find(dieuKien).sort({ ngayKetThuc: 1, _id: 1 }).lean();
  return { danhSach: danhSach.map(({ maVoucher, tenVoucher, loaiVoucher, kieuGiam, giaTriGiam, giamToiDa, giaTriDonToiThieu, ngayKetThuc }) => ({
    maVoucher, tenVoucher, loaiVoucher, kieuGiam, giaTriGiam, giamToiDa: giamToiDa ?? null, giaTriDonToiThieu, ngayKetThuc,
  })) };
};

const layVoucher = async (id, dieuKien = {}) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(404, 'Không tìm thấy voucher');
  const voucher = await Voucher.findOne({ _id: id, ...dieuKien }).populate({ path: 'cuaHangId', select: '_id tenCuaHang' }).lean();
  if (!voucher) throw taoLoi(404, 'Không tìm thấy voucher');
  const dem = await demDonApDung([voucher._id]);
  return dinhDangVoucher(voucher, dem.get(String(voucher._id)) ?? 0);
};
const nguoiBanLayChiTietVoucher = (cuaHangId, id) => layVoucher(id, { cuaHangId });
const quanTriLayChiTietVoucher = (id) => layVoucher(id, boLocVoucherHeThong);

const kiemTraSoNguyen = (value, ten, toiThieu, macDinh) => {
  if (value === undefined && macDinh !== undefined) return macDinh;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < toiThieu) throw taoLoi(400, `${ten} phải là số nguyên từ ${toiThieu} trở lên`);
  return value;
};

const kiemTraDuLieuVoucher = (body, hienTai = null) => {
  const duLieu = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  if (hienTai && ['maVoucher', 'loaiVoucher', 'cuaHangId'].some((ten) => Object.hasOwn(duLieu, ten))) {
    throw taoLoi(400, 'Không được sửa mã, loại hoặc cửa hàng của voucher');
  }
  const maVoucher = hienTai?.maVoucher ?? (typeof duLieu.maVoucher === 'string' ? duLieu.maVoucher.trim().toUpperCase() : '');
  if (!REGEX_MA_VOUCHER.test(maVoucher)) throw taoLoi(400, 'Mã voucher chỉ gồm 4–20 chữ hoặc số, không có khoảng trắng');
  const tenVoucher = duLieu.tenVoucher === undefined ? hienTai?.tenVoucher : duLieu.tenVoucher;
  if (typeof tenVoucher !== 'string' || !tenVoucher.trim() || tenVoucher.trim().length > 200) throw taoLoi(400, 'Tên voucher phải từ 1 đến 200 ký tự');
  const kieuGiam = duLieu.kieuGiam === undefined ? hienTai?.kieuGiam : duLieu.kieuGiam;
  if (!Object.values(KIEU_GIAM).includes(kieuGiam)) throw taoLoi(400, 'Kiểu giảm không hợp lệ');
  const giaTriGiam = kiemTraSoNguyen(duLieu.giaTriGiam === undefined ? hienTai?.giaTriGiam : duLieu.giaTriGiam, 'Giá trị giảm', 1);
  if (kieuGiam === KIEU_GIAM.PHAN_TRAM && giaTriGiam > 100) throw taoLoi(400, 'Giá trị giảm theo phần trăm không được vượt 100');
  const giamToiDaNhap = duLieu.giamToiDa === undefined ? hienTai?.giamToiDa : duLieu.giamToiDa;
  const giamToiDa = giamToiDaNhap === null || giamToiDaNhap === '' || giamToiDaNhap === undefined ? null : kiemTraSoNguyen(giamToiDaNhap, 'Giảm tối đa', 1);
  const giaTriDonToiThieu = kiemTraSoNguyen(duLieu.giaTriDonToiThieu === undefined ? hienTai?.giaTriDonToiThieu : duLieu.giaTriDonToiThieu, 'Đơn tối thiểu', 0, 0);
  const soLuong = kiemTraSoNguyen(duLieu.soLuong === undefined ? hienTai?.soLuong : duLieu.soLuong, 'Số lượng', hienTai ? 0 : 1);
  const batDauNhap = duLieu.ngayBatDau === undefined ? hienTai?.ngayBatDau : duLieu.ngayBatDau;
  const ketThucNhap = duLieu.ngayKetThuc === undefined ? hienTai?.ngayKetThuc : duLieu.ngayKetThuc;
  if (!(batDauNhap instanceof Date || typeof batDauNhap === 'string') || !(ketThucNhap instanceof Date || typeof ketThucNhap === 'string') || !batDauNhap || !ketThucNhap) {
    throw taoLoi(400, 'Vui lòng nhập thời gian bắt đầu và kết thúc');
  }
  const ngayBatDau = new Date(batDauNhap);
  const ngayKetThuc = new Date(ketThucNhap);
  if (Number.isNaN(ngayBatDau.getTime()) || Number.isNaN(ngayKetThuc.getTime()) || ngayKetThuc <= ngayBatDau || (!hienTai && ngayKetThuc <= new Date())) {
    throw taoLoi(400, 'Thời gian hiệu lực không hợp lệ; khi tạo, ngày kết thúc phải sau hiện tại');
  }
  return { maVoucher, tenVoucher: tenVoucher.trim(), kieuGiam, giaTriGiam, giamToiDa, giaTriDonToiThieu, soLuong, ngayBatDau, ngayKetThuc };
};

const taoVoucher = async (body, loaiVoucher, cuaHangId = null) => {
  const duLieu = kiemTraDuLieuVoucher(body);
  if (await Voucher.exists({ maVoucher: duLieu.maVoucher })) throw taoLoi(409, 'Mã voucher đã tồn tại');
  try {
    const voucher = await Voucher.create({ ...duLieu, ...(duLieu.giamToiDa === null ? { giamToiDa: undefined } : {}), loaiVoucher, cuaHangId, trangThai: TRANG_THAI_VOUCHER.KICH_HOAT });
    return layVoucher(voucher._id);
  } catch (loi) {
    if (loi.code === 11000) throw taoLoi(409, 'Mã voucher đã tồn tại');
    throw loi;
  }
};
const nguoiBanTaoVoucher = (cuaHangId, body) => taoVoucher(body, LOAI_VOUCHER.CUA_HANG, cuaHangId);
const quanTriTaoVoucher = (body) => {
  if (![LOAI_VOUCHER.TOAN_SAN, LOAI_VOUCHER.FREESHIP].includes(body?.loaiVoucher)) throw taoLoi(400, 'Quản trị viên chỉ tạo voucher Toàn sàn hoặc Freeship');
  return taoVoucher(body, body.loaiVoucher);
};

const capNhatVoucher = async (id, dieuKien, body) => {
  const hienTai = await layVoucher(id, dieuKien);
  const duLieu = kiemTraDuLieuVoucher(body, hienTai);
  const { maVoucher, giamToiDa, ...thayDoi } = duLieu;
  const capNhat = { $set: giamToiDa === null ? thayDoi : { ...thayDoi, giamToiDa } };
  if (giamToiDa === null) capNhat.$unset = { giamToiDa: '' };
  await Voucher.updateOne({ _id: id, ...dieuKien }, capNhat);
  return layVoucher(id, dieuKien);
};
const nguoiBanCapNhatVoucher = (cuaHangId, id, body) => capNhatVoucher(id, { cuaHangId }, body);
const quanTriCapNhatVoucher = (id, body) => capNhatVoucher(id, boLocVoucherHeThong, body);

const capNhatTrangThaiVoucher = async (id, dieuKien, trangThai) => {
  if (!Object.values(TRANG_THAI_VOUCHER).includes(trangThai)) throw taoLoi(400, 'Trạng thái voucher không hợp lệ');
  await layVoucher(id, dieuKien);
  await Voucher.updateOne({ _id: id, ...dieuKien }, { $set: { trangThai } });
  return layVoucher(id, dieuKien);
};
const nguoiBanCapNhatTrangThaiVoucher = (cuaHangId, id, body) => capNhatTrangThaiVoucher(id, { cuaHangId }, body?.trangThai);
const quanTriCapNhatTrangThaiVoucher = (id, body) => capNhatTrangThaiVoucher(id, boLocVoucherHeThong, body?.trangThai);

const xoaVoucher = async (id, dieuKien) => {
  await layVoucher(id, dieuKien);
  if (await ApDungVoucher.exists({ voucherId: id })) {
    await Voucher.updateOne({ _id: id, ...dieuKien }, { $set: { trangThai: TRANG_THAI_VOUCHER.VO_HIEU_HOA } });
    return { message: 'Voucher đã được sử dụng nên chỉ vô hiệu hóa, không xóa dữ liệu' };
  }
  await Voucher.deleteOne({ _id: id, ...dieuKien });
  return { message: 'Đã xóa voucher' };
};
const nguoiBanXoaVoucher = (cuaHangId, id) => xoaVoucher(id, { cuaHangId });
const quanTriXoaVoucher = (id) => xoaVoucher(id, boLocVoucherHeThong);

module.exports = {
  kiemTraDieuKienVoucher, tinhMucGiamVoucher, layDanhSachVoucherDangDung,
  nguoiBanLayDanhSachVoucher, nguoiBanLayChiTietVoucher, nguoiBanTaoVoucher, nguoiBanCapNhatVoucher, nguoiBanCapNhatTrangThaiVoucher, nguoiBanXoaVoucher,
  quanTriLayDanhSachVoucher, quanTriLayChiTietVoucher, quanTriTaoVoucher, quanTriCapNhatVoucher, quanTriCapNhatTrangThaiVoucher, quanTriXoaVoucher,
};
