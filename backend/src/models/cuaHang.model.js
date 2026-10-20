const mongoose = require('mongoose');
const { TRANG_THAI_HOAT_DONG_CUA_HANG } = require('../constants/trangThai.constant');
const { DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');

const cuaHangSchema = new mongoose.Schema({
  tenCuaHang: { type: String, required: true, trim: true },
  moTa: { type: String },
  diaChi: { type: String, maxlength: DO_DAI_TOI_DA.DIA_CHI },
  trangThaiHoatDong: { type: String, enum: Object.values(TRANG_THAI_HOAT_DONG_CUA_HANG), default: TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG },
  taiKhoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan', required: true },
}, { collection: 'CuaHang' });

cuaHangSchema.index({ taiKhoanId: 1 }, { unique: true });

module.exports = mongoose.model('CuaHang', cuaHangSchema);
