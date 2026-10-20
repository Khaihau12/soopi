const mongoose = require('mongoose');
const { VAI_TRO } = require('../constants/vaiTro.constant');
const { GIOI_TINH, TRANG_THAI_TAI_KHOAN } = require('../constants/trangThai.constant');
const { REGEX_SO_DIEN_THOAI, DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');

const taiKhoanSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true },
  matKhau: { type: String, required: true, select: false },
  phienBanToken: { type: Number, default: 0, min: 0, select: false },
  hoTen: { type: String, required: true, trim: true },
  ngaySinh: { type: Date },
  gioiTinh: { type: String, enum: Object.values(GIOI_TINH) },
  soDienThoai: { type: String, match: REGEX_SO_DIEN_THOAI },
  diaChiNhanHang: { type: String, maxlength: DO_DAI_TOI_DA.DIA_CHI },
  vaiTro: {
    type: [{ type: String, enum: Object.values(VAI_TRO) }],
    required: true,
    default: [VAI_TRO.NGUOI_DUNG],
    validate: {
      validator: (vaiTro) => vaiTro.length > 0,
      message: 'Tài khoản phải có ít nhất một vai trò',
    },
  },
  trangThaiTaiKhoan: { type: String, enum: Object.values(TRANG_THAI_TAI_KHOAN), required: true, default: TRANG_THAI_TAI_KHOAN.HOAT_DONG },
}, { collection: 'TaiKhoan' });

taiKhoanSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('TaiKhoan', taiKhoanSchema);
