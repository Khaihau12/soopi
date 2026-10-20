const mongoose = require('mongoose');
const { TRANG_THAI_YEU_CAU_NGUOI_BAN } = require('../constants/trangThai.constant');
const { DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');

const yeuCauDangKyNguoiBanSchema = new mongoose.Schema({
  tenCuaHang: { type: String, required: true, trim: true, maxlength: DO_DAI_TOI_DA.TEN_CUA_HANG },
  moTaCuaHang: { type: String, maxlength: DO_DAI_TOI_DA.MO_TA },
  diaChiCuaHang: { type: String, required: true, maxlength: DO_DAI_TOI_DA.DIA_CHI },
  ngayGui: { type: Date, default: Date.now },
  trangThai: { type: String, enum: Object.values(TRANG_THAI_YEU_CAU_NGUOI_BAN), default: TRANG_THAI_YEU_CAU_NGUOI_BAN.CHO_PHE_DUYET },
  taiKhoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan', required: true },
}, { collection: 'YeuCauDangKyNguoiBan' });

module.exports = mongoose.model('YeuCauDangKyNguoiBan', yeuCauDangKyNguoiBanSchema);
