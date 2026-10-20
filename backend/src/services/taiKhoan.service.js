const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const TaiKhoan = require('../models/taiKhoan.model');
const CuaHang = require('../models/cuaHang.model');
const { GIOI_TINH, TRANG_THAI_TAI_KHOAN } = require('../constants/trangThai.constant');
const { VAI_TRO } = require('../constants/vaiTro.constant');
const { DO_DAI_MAT_KHAU_TOI_THIEU, SO_VONG_BAM_MAT_KHAU, REGEX_SO_DIEN_THOAI, DO_DAI_TOI_DA, PHAN_TRANG } = require('../constants/cauHinh.constant');
const { layThongTinTaiKhoan } = require('./xacThuc.service');
const { taoLoi } = require('../utils/taoLoi');
const { thoatKyTuRegex } = require('../utils/thoatKyTuRegex');

const TRUONG_HO_SO = ['hoTen', 'ngaySinh', 'gioiTinh', 'soDienThoai', 'diaChiNhanHang'];

const layHoSo = (taiKhoan) => layThongTinTaiKhoan(taiKhoan);

const capNhatHoSo = async (taiKhoanId, body = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw taoLoi(400, 'Dữ liệu hồ sơ không hợp lệ.');
  const set = {};
  const unset = {};
  for (const ten of TRUONG_HO_SO) {
    if (!Object.hasOwn(body, ten)) continue;
    const giaTri = body[ten];
    if (typeof giaTri !== 'string') throw taoLoi(400, `${ten} phải là chuỗi.`);
    const chuan = giaTri.trim();
    if (ten === 'hoTen') {
      if (!chuan) throw taoLoi(400, 'Họ tên không được để trống.');
      if (chuan.length > DO_DAI_TOI_DA.HO_TEN) throw taoLoi(400, `Họ tên không được quá ${DO_DAI_TOI_DA.HO_TEN} ký tự.`);
      set[ten] = chuan;
    } else if (!chuan) {
      unset[ten] = '';
    } else if (ten === 'ngaySinh') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(chuan)) throw taoLoi(400, 'Ngày sinh không hợp lệ.');
      const ngay = new Date(`${chuan}T00:00:00.000Z`);
      if (Number.isNaN(ngay.getTime()) || ngay.toISOString().slice(0, 10) !== chuan) throw taoLoi(400, 'Ngày sinh không hợp lệ.');
      const homNayVietNam = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (chuan > homNayVietNam) throw taoLoi(400, 'Ngày sinh không được ở tương lai.');
      set[ten] = ngay;
    } else if (ten === 'gioiTinh') {
      if (!Object.values(GIOI_TINH).includes(chuan)) throw taoLoi(400, 'Giới tính không hợp lệ.');
      set[ten] = chuan;
    } else if (ten === 'soDienThoai') {
      if (!REGEX_SO_DIEN_THOAI.test(chuan)) throw taoLoi(400, 'Số điện thoại không hợp lệ. Vui lòng dùng 10 chữ số bắt đầu bằng 0 hoặc +84.');
      set[ten] = chuan;
    } else {
      if (chuan.length > DO_DAI_TOI_DA.DIA_CHI) throw taoLoi(400, `Địa chỉ nhận hàng không được quá ${DO_DAI_TOI_DA.DIA_CHI} ký tự.`);
      set[ten] = chuan;
    }
  }
  if (Object.keys(set).length || Object.keys(unset).length) {
    await TaiKhoan.updateOne({ _id: taiKhoanId }, {
      ...(Object.keys(set).length ? { $set: set } : {}),
      ...(Object.keys(unset).length ? { $unset: unset } : {}),
    }, { runValidators: true });
  }
  const taiKhoan = await TaiKhoan.findById(taiKhoanId);
  if (!taiKhoan) throw taoLoi(401, 'Vui lòng đăng nhập để tiếp tục');
  return layHoSo(taiKhoan);
};

const doiMatKhau = async (taiKhoanId, body = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw taoLoi(400, 'Dữ liệu đổi mật khẩu không hợp lệ.');
  const { matKhauHienTai, matKhauMoi, xacNhanMatKhauMoi } = body;
  if (typeof matKhauHienTai !== 'string' || !matKhauHienTai || typeof matKhauMoi !== 'string' || !matKhauMoi || typeof xacNhanMatKhauMoi !== 'string' || !xacNhanMatKhauMoi) {
    throw taoLoi(400, 'Vui lòng nhập đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới.');
  }
  const taiKhoan = await TaiKhoan.findById(taiKhoanId).select('+matKhau');
  if (!taiKhoan) throw taoLoi(401, 'Vui lòng đăng nhập để tiếp tục');
  if (!await bcrypt.compare(matKhauHienTai, taiKhoan.matKhau)) throw taoLoi(400, 'Mật khẩu hiện tại không chính xác.');
  if (matKhauMoi.length < DO_DAI_MAT_KHAU_TOI_THIEU) throw taoLoi(400, `Mật khẩu mới phải có ít nhất ${DO_DAI_MAT_KHAU_TOI_THIEU} ký tự.`);
  if (matKhauMoi !== xacNhanMatKhauMoi) throw taoLoi(400, 'Mật khẩu xác nhận chưa khớp.');
  if (matKhauMoi === matKhauHienTai) throw taoLoi(400, 'Mật khẩu mới phải khác mật khẩu hiện tại.');
  const matKhauBam = await bcrypt.hash(matKhauMoi, SO_VONG_BAM_MAT_KHAU);
  const ketQua = await TaiKhoan.updateOne({ _id: taiKhoanId, matKhau: taiKhoan.matKhau }, { $set: { matKhau: matKhauBam }, $inc: { phienBanToken: 1 } });
  if (ketQua.modifiedCount !== 1) throw taoLoi(409, 'Mật khẩu vừa được thay đổi. Vui lòng thử lại.');
};

const docSoTrang = (giaTri, macDinh, toiDa) => {
  const so = Number(giaTri ?? macDinh);
  if (!Number.isSafeInteger(so) || so < 1) throw taoLoi(400, 'Trang và giới hạn phải là số nguyên dương.');
  return Math.min(so, toiDa);
};

const quanTriLayDanhSachTaiKhoan = async (query = {}) => {
  if (query.vaiTro && ![VAI_TRO.NGUOI_DUNG, VAI_TRO.NGUOI_BAN].includes(query.vaiTro)) throw taoLoi(400, 'Vai trò lọc không hợp lệ.');
  if (query.trangThaiTaiKhoan && !Object.values(TRANG_THAI_TAI_KHOAN).includes(query.trangThaiTaiKhoan)) throw taoLoi(400, 'Trạng thái tài khoản không hợp lệ.');
  if (query.tuKhoa !== undefined && typeof query.tuKhoa !== 'string') throw taoLoi(400, 'Từ khóa không hợp lệ.');
  const tuKhoa = query.tuKhoa?.trim() || '';
  if (tuKhoa.length > 100) throw taoLoi(400, 'Từ khóa không được quá 100 ký tự.');
  const trang = docSoTrang(query.trang, 1, Number.MAX_SAFE_INTEGER);
  const gioiHan = docSoTrang(query.gioiHan, PHAN_TRANG.MAC_DINH, PHAN_TRANG.TOI_DA);
  const dieuKien = { vaiTro: { $nin: [VAI_TRO.QUAN_TRI_VIEN] } };
  if (query.vaiTro) dieuKien.vaiTro = { $all: [query.vaiTro], $nin: [VAI_TRO.QUAN_TRI_VIEN] };
  if (query.trangThaiTaiKhoan) dieuKien.trangThaiTaiKhoan = query.trangThaiTaiKhoan;
  if (tuKhoa) {
    const regex = new RegExp(thoatKyTuRegex(tuKhoa), 'i');
    dieuKien.$or = [{ email: regex }, { hoTen: regex }, { soDienThoai: regex }];
  }
  const [tongSo, danhSach] = await Promise.all([
    TaiKhoan.countDocuments(dieuKien),
    TaiKhoan.find(dieuKien, '_id email hoTen soDienThoai vaiTro trangThaiTaiKhoan')
      .sort({ _id: -1 }).skip((trang - 1) * gioiHan).limit(gioiHan).lean(),
  ]);
  return { danhSach, phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) } };
};

const kiemTraIdTaiKhoan = (id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID tài khoản không hợp lệ.');
};

const quanTriLayChiTietTaiKhoan = async (id) => {
  kiemTraIdTaiKhoan(id);
  const taiKhoan = await TaiKhoan.findOne({ _id: id, vaiTro: { $nin: [VAI_TRO.QUAN_TRI_VIEN] } },
    '_id email hoTen soDienThoai vaiTro trangThaiTaiKhoan ngaySinh gioiTinh diaChiNhanHang').lean();
  if (!taiKhoan) throw taoLoi(404, 'Không tìm thấy tài khoản.');
  const cuaHang = await CuaHang.findOne({ taiKhoanId: taiKhoan._id }, '_id tenCuaHang trangThaiHoatDong').lean();
  return { ...taiKhoan, cuaHang: cuaHang || null };
};

const kiemTraTaiKhoanCoTheThaoTac = async (id) => {
  kiemTraIdTaiKhoan(id);
  const taiKhoan = await TaiKhoan.findById(id, '_id vaiTro trangThaiTaiKhoan').lean();
  if (!taiKhoan) throw taoLoi(404, 'Không tìm thấy tài khoản.');
  if (taiKhoan.vaiTro.includes(VAI_TRO.QUAN_TRI_VIEN)) throw taoLoi(409, 'Không thể thao tác với tài khoản Quản trị viên.');
  return taiKhoan;
};

const quanTriCapNhatTrangThaiTaiKhoan = async (id, body = {}) => {
  const trangThai = body?.trangThaiTaiKhoan;
  if (!Object.values(TRANG_THAI_TAI_KHOAN).includes(trangThai)) throw taoLoi(400, 'Trạng thái tài khoản không hợp lệ.');
  const taiKhoan = await kiemTraTaiKhoanCoTheThaoTac(id);
  if (taiKhoan.trangThaiTaiKhoan === trangThai) throw taoLoi(409, 'Tài khoản đã ở trạng thái này.');
  const moi = await TaiKhoan.findOneAndUpdate({ _id: id, vaiTro: { $nin: [VAI_TRO.QUAN_TRI_VIEN] }, trangThaiTaiKhoan: { $ne: trangThai } },
    { $set: { trangThaiTaiKhoan: trangThai } }, { returnDocument: 'after', runValidators: true })
    .select('_id email hoTen soDienThoai vaiTro trangThaiTaiKhoan').lean();
  if (!moi) { await kiemTraTaiKhoanCoTheThaoTac(id); throw taoLoi(409, 'Tài khoản đã ở trạng thái này.'); }
  return moi;
};

const quanTriDatLaiMatKhau = async (id, body = {}) => {
  await kiemTraTaiKhoanCoTheThaoTac(id);
  const matKhauMoi = body?.matKhauMoi;
  if (typeof matKhauMoi !== 'string' || matKhauMoi.length < DO_DAI_MAT_KHAU_TOI_THIEU) {
    throw taoLoi(400, `Mật khẩu mới phải có ít nhất ${DO_DAI_MAT_KHAU_TOI_THIEU} ký tự.`);
  }
  const matKhauBam = await bcrypt.hash(matKhauMoi, SO_VONG_BAM_MAT_KHAU);
  const ketQua = await TaiKhoan.updateOne({ _id: id, vaiTro: { $nin: [VAI_TRO.QUAN_TRI_VIEN] } }, { $set: { matKhau: matKhauBam }, $inc: { phienBanToken: 1 } });
  if (ketQua.modifiedCount !== 1) { await kiemTraTaiKhoanCoTheThaoTac(id); throw taoLoi(409, 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'); }
};

module.exports = { layHoSo, capNhatHoSo, doiMatKhau, quanTriLayDanhSachTaiKhoan, quanTriLayChiTietTaiKhoan,
  quanTriCapNhatTrangThaiTaiKhoan, quanTriDatLaiMatKhau };
