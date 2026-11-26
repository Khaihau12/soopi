const mongoose = require('mongoose');
const { TRANG_THAI_HOAT_DONG_CUA_HANG, TRANG_THAI_YEU_CAU_NGUOI_BAN } = require('../constants/trangThai.constant');
const { DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');

const cuaHangSchema = new mongoose.Schema({
  tenCuaHang: { type: String, required: true, trim: true, maxlength: DO_DAI_TOI_DA.TEN_CUA_HANG },
  moTa: { type: String, maxlength: DO_DAI_TOI_DA.MO_TA },
  diaChi: { type: String, maxlength: DO_DAI_TOI_DA.DIA_CHI },
  trangThaiHoatDong: { type: String, enum: Object.values(TRANG_THAI_HOAT_DONG_CUA_HANG), default: TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG },
  trangThaiDuyet: { type: String, enum: Object.values(TRANG_THAI_YEU_CAU_NGUOI_BAN), default: TRANG_THAI_YEU_CAU_NGUOI_BAN.DA_PHE_DUYET },
  taiKhoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan', required: true },
  ngayGui: Date,
}, { collection: 'CuaHang' });

cuaHangSchema.index({ taiKhoanId: 1 }, { unique: true });

module.exports = mongoose.model('CuaHang', cuaHangSchema);
