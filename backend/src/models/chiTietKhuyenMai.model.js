const mongoose = require('mongoose');
const { laSoNguyen } = require('../utils/kiemTra');

const chiTietKhuyenMaiSchema = new mongoose.Schema({
  tyLeGiam: { type: Number, min: 0, max: 100 },
  giaKhuyenMai: { type: Number, min: 0, validate: { validator: laSoNguyen, message: 'Giá khuyến mãi phải là số nguyên' } },
  khuyenMaiId: { type: mongoose.Schema.Types.ObjectId, ref: 'KhuyenMai', required: true },
  sanPhamId: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham', required: true },
}, { collection: 'ChiTietKhuyenMai' });

chiTietKhuyenMaiSchema.index({ khuyenMaiId: 1, sanPhamId: 1 });

module.exports = mongoose.model('ChiTietKhuyenMai', chiTietKhuyenMaiSchema);
