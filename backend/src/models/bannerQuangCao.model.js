const mongoose = require('mongoose');
const { TRANG_THAI_BANNER } = require('../constants/trangThai.constant');

const bannerQuangCaoSchema = new mongoose.Schema({
  tieuDe: { type: String, required: true },
  hinhAnh: { type: String, required: true },
  noiDung: { type: String },
  danhMucId: { type: mongoose.Schema.Types.ObjectId, ref: 'DanhMuc' },
  trangThai: { type: String, enum: Object.values(TRANG_THAI_BANNER), default: TRANG_THAI_BANNER.KICH_HOAT },
}, { collection: 'BannerQuangCao' });

module.exports = mongoose.model('BannerQuangCao', bannerQuangCaoSchema);
