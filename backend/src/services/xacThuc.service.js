const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const TaiKhoan = require('../models/taiKhoan.model');
const { VAI_TRO } = require('../constants/vaiTro.constant');
const { TRANG_THAI_TAI_KHOAN } = require('../constants/trangThai.constant');
const {
  DO_DAI_MAT_KHAU_TOI_THIEU,
  SO_VONG_BAM_MAT_KHAU,
  SO_NGAY_HET_HAN_TOKEN,
  THOI_HAN_TOKEN_DAT_LAI_PHUT,
  REGEX_SO_DIEN_THOAI,
} = require('../constants/cauHinh.constant');
const { taoLoi } = require('../utils/taoLoi');

const EMAIL_HOP_LE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CAC_TRUONG_CONG_KHAI = '_id email hoTen ngaySinh gioiTinh soDienThoai diaChiNhanHang vaiTro trangThaiTaiKhoan';

const chonThongTinCongKhai = (taiKhoan) => {
  const duLieu = taiKhoan.toObject();
  return Object.fromEntries(CAC_TRUONG_CONG_KHAI.split(' ').map((tenTruong) => [tenTruong, duLieu[tenTruong]]));
};

const dangKyTaiKhoan = async ({ email, matKhau, hoTen, soDienThoai } = {}) => {
  const emailChuan = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const hoTenChuan = typeof hoTen === 'string' ? hoTen.trim() : '';
  if (!EMAIL_HOP_LE.test(emailChuan)) throw taoLoi(400, 'Email không hợp lệ. Vui lòng nhập lại email.');
  if (!hoTenChuan) throw taoLoi(400, 'Vui lòng nhập họ tên.');
  if (typeof matKhau !== 'string' || matKhau.length < DO_DAI_MAT_KHAU_TOI_THIEU) {
    throw taoLoi(400, `Mật khẩu phải có ít nhất ${DO_DAI_MAT_KHAU_TOI_THIEU} ký tự.`);
  }
  const soDienThoaiChuan = typeof soDienThoai === 'string' ? soDienThoai.trim() : soDienThoai;
  if (soDienThoaiChuan !== undefined && soDienThoaiChuan !== '' && !REGEX_SO_DIEN_THOAI.test(soDienThoaiChuan)) {
    throw taoLoi(400, 'Số điện thoại không hợp lệ. Vui lòng dùng 10 chữ số bắt đầu bằng 0 hoặc +84.');
  }
  if (await TaiKhoan.exists({ email: emailChuan })) throw taoLoi(409, 'Email này đã được đăng ký. Vui lòng dùng email khác.');

  const matKhauBam = await bcrypt.hash(matKhau, SO_VONG_BAM_MAT_KHAU);
  try {
    const taiKhoan = await TaiKhoan.create({
      email: emailChuan,
      matKhau: matKhauBam,
      hoTen: hoTenChuan,
      ...(soDienThoaiChuan ? { soDienThoai: soDienThoaiChuan } : {}),
      vaiTro: [VAI_TRO.NGUOI_DUNG],
      trangThaiTaiKhoan: TRANG_THAI_TAI_KHOAN.HOAT_DONG,
    });
    return chonThongTinCongKhai(taiKhoan);
  } catch (loi) {
    if (loi.code === 11000) throw taoLoi(409, 'Email này đã được đăng ký. Vui lòng dùng email khác.');
    throw loi;
  }
};

const dangNhap = async ({ email, matKhau } = {}) => {
  if (typeof email !== 'string' || !email.trim() || typeof matKhau !== 'string' || !matKhau) {
    throw taoLoi(400, 'Vui lòng nhập email và mật khẩu.');
  }
  const taiKhoan = await TaiKhoan.findOne({ email: email.trim().toLowerCase() }).select('+matKhau +phienBanToken');
  const dungMatKhau = taiKhoan && await bcrypt.compare(matKhau, taiKhoan.matKhau);
  if (!dungMatKhau) throw taoLoi(401, 'Email hoặc mật khẩu không chính xác');
  if (taiKhoan.trangThaiTaiKhoan === TRANG_THAI_TAI_KHOAN.BI_KHOA) {
    throw taoLoi(403, 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên');
  }
  const token = jwt.sign({ taiKhoanId: taiKhoan._id.toString(), phienBanToken: taiKhoan.phienBanToken || 0 }, process.env.JWT_SECRET, {
    expiresIn: `${SO_NGAY_HET_HAN_TOKEN}d`,
  });
  return { taiKhoan: chonThongTinCongKhai(taiKhoan), token };
};

const layThongTinTaiKhoan = (taiKhoan) => chonThongTinCongKhai(taiKhoan);

const THONG_BAO_QUEN_MAT_KHAU = 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được tạo.';
const THONG_BAO_LIEN_KET_SAI = 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn';

const quenMatKhau = async ({ email } = {}) => {
  const emailChuan = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!EMAIL_HOP_LE.test(emailChuan)) throw taoLoi(400, 'Email không hợp lệ. Vui lòng nhập lại email.');

  const taiKhoan = await TaiKhoan.findOne({ email: emailChuan }).select('+matKhau');
  if (!taiKhoan || taiKhoan.trangThaiTaiKhoan === TRANG_THAI_TAI_KHOAN.BI_KHOA
    || taiKhoan.vaiTro.includes(VAI_TRO.QUAN_TRI_VIEN)) return {};

  const token = jwt.sign(
    { taiKhoanId: taiKhoan._id.toString(), mucDich: 'datLaiMatKhau' },
    process.env.JWT_SECRET + taiKhoan.matKhau,
    { expiresIn: `${THOI_HAN_TOKEN_DAT_LAI_PHUT}m` },
  );
  const lienKetDatLai = `${process.env.FRONTEND_URL.replace(/\/+$/, '')}/dat-lai-mat-khau?token=${encodeURIComponent(token)}`;
  console.info(`Liên kết đặt lại mật khẩu: ${lienKetDatLai}`);
  return process.env.NODE_ENV === 'development' ? { lienKetDatLai } : {};
};

const datLaiMatKhau = async ({ token, matKhauMoi } = {}) => {
  const payload = typeof token === 'string' ? jwt.decode(token) : null;
  if (!payload || typeof payload !== 'object' || !mongoose.isValidObjectId(payload.taiKhoanId)) {
    throw taoLoi(400, THONG_BAO_LIEN_KET_SAI);
  }

  const taiKhoan = await TaiKhoan.findById(payload.taiKhoanId).select('+matKhau');
  if (!taiKhoan || taiKhoan.trangThaiTaiKhoan === TRANG_THAI_TAI_KHOAN.BI_KHOA
    || taiKhoan.vaiTro.includes(VAI_TRO.QUAN_TRI_VIEN)) throw taoLoi(400, THONG_BAO_LIEN_KET_SAI);

  try {
    const daXacMinh = jwt.verify(token, process.env.JWT_SECRET + taiKhoan.matKhau);
    if (daXacMinh.mucDich !== 'datLaiMatKhau' || daXacMinh.taiKhoanId !== taiKhoan._id.toString()) {
      throw new Error('Sai mục đích');
    }
  } catch {
    throw taoLoi(400, THONG_BAO_LIEN_KET_SAI);
  }

  if (typeof matKhauMoi !== 'string' || matKhauMoi.length < DO_DAI_MAT_KHAU_TOI_THIEU) {
    throw taoLoi(400, `Mật khẩu mới phải có ít nhất ${DO_DAI_MAT_KHAU_TOI_THIEU} ký tự.`);
  }

  const matKhauBam = await bcrypt.hash(matKhauMoi, SO_VONG_BAM_MAT_KHAU);
  const ketQua = await TaiKhoan.updateOne(
    { _id: taiKhoan._id, matKhau: taiKhoan.matKhau,
      trangThaiTaiKhoan: { $ne: TRANG_THAI_TAI_KHOAN.BI_KHOA }, vaiTro: { $nin: [VAI_TRO.QUAN_TRI_VIEN] } },
    { $set: { matKhau: matKhauBam }, $inc: { phienBanToken: 1 } },
  );
  if (ketQua.modifiedCount !== 1) throw taoLoi(400, THONG_BAO_LIEN_KET_SAI);
};

module.exports = { dangKyTaiKhoan, dangNhap, layThongTinTaiKhoan, quenMatKhau, datLaiMatKhau, THONG_BAO_QUEN_MAT_KHAU };
