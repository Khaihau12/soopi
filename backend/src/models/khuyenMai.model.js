const mongoose = require('mongoose');
const { LOAI_KHUYEN_MAI, PHAM_VI_KHUYEN_MAI, TRANG_THAI_KHUYEN_MAI } = require('../constants/trangThai.constant');

const khuyenMaiSchema = new mongoose.Schema({
  tenKhuyenMai: { type: String, required: true },
  loaiKhuyenMai: { type: String, enum: Object.values(LOAI_KHUYEN_MAI), required: true },
  phamVi: { type: String, enum: Object.values(PHAM_VI_KHUYEN_MAI), required: true },
  ngayBatDau: { type: Date, required: true },
  ngayKetThuc: { type: Date, required: true },
  trangThai: { type: String, enum: Object.values(TRANG_THAI_KHUYEN_MAI), default: TRANG_THAI_KHUYEN_MAI.CHUA_BAT_DAU },
  cuaHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'CuaHang', default: null },
}, { collection: 'KhuyenMai' });

module.exports = mongoose.model('KhuyenMai', khuyenMaiSchema);
