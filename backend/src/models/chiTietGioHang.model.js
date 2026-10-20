const mongoose = require('mongoose');
const { laSoNguyen } = require('../utils/kiemTra');

const chiTietGioHangSchema = new mongoose.Schema({
  soLuong: { type: Number, required: true, min: 1, validate: { validator: laSoNguyen, message: 'Số lượng phải là số nguyên' } },
  duocChon: { type: Boolean, default: true },
  gioHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'GioHang', required: true },
  sanPhamId: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham', required: true },
}, { collection: 'ChiTietGioHang' });

chiTietGioHangSchema.index({ gioHangId: 1, sanPhamId: 1 }, { unique: true });

module.exports = mongoose.model('ChiTietGioHang', chiTietGioHangSchema);
