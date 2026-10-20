const mongoose = require('mongoose');
const { laSoNguyen } = require('../utils/kiemTra');

const chiTietDonHangSchema = new mongoose.Schema({
  soLuong: { type: Number, required: true, min: 1, validate: { validator: laSoNguyen, message: 'Số lượng phải là số nguyên' } },
  giaGocTaiThoiDiemDat: { type: Number, required: true, min: 0, validate: { validator: laSoNguyen, message: 'Giá gốc phải là số nguyên' } },
  giaBanThucTe: { type: Number, required: true, min: 0, validate: { validator: laSoNguyen, message: 'Giá bán phải là số nguyên' } },
  thanhTien: { type: Number, required: true, min: 0, validate: { validator: laSoNguyen, message: 'Thành tiền phải là số nguyên' } },
  donHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'DonHang', required: true },
  sanPhamId: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham', required: true },
}, { collection: 'ChiTietDonHang' });

chiTietDonHangSchema.index({ donHangId: 1 });
chiTietDonHangSchema.index({ sanPhamId: 1 });

module.exports = mongoose.model('ChiTietDonHang', chiTietDonHangSchema);
