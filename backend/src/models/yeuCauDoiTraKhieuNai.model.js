const mongoose = require('mongoose');
const { LOAI_YEU_CAU, TRANG_THAI_XU_LY_YEU_CAU, KET_QUA_XU_LY } = require('../constants/trangThai.constant');
const { DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');

const yeuCauDoiTraKhieuNaiSchema = new mongoose.Schema({
  loaiYeuCau: { type: String, enum: Object.values(LOAI_YEU_CAU), required: true },
  noiDung: { type: String, required: true, trim: true, maxlength: DO_DAI_TOI_DA.NOI_DUNG },
  trangThaiXuLy: { type: String, enum: Object.values(TRANG_THAI_XU_LY_YEU_CAU), default: TRANG_THAI_XU_LY_YEU_CAU.CHO_XU_LY },
  ketQuaXuLy: { type: String, enum: Object.values(KET_QUA_XU_LY) },
  ngayTao: { type: Date, default: Date.now },
  chiTietDonHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChiTietDonHang', required: true, unique: true },
}, { collection: 'YeuCauDoiTraKhieuNai' });

module.exports = mongoose.model('YeuCauDoiTraKhieuNai', yeuCauDoiTraKhieuNaiSchema);
