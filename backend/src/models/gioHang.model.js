const mongoose = require('mongoose');
const { laSoNguyen } = require('../utils/kiemTra');

const gioHangSchema = new mongoose.Schema({
  tongGiaTri: { type: Number, min: 0, default: 0, validate: { validator: laSoNguyen, message: 'Tổng giá trị phải là số nguyên' } },
  taiKhoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan', required: true, unique: true },
}, { collection: 'GioHang' });

module.exports = mongoose.model('GioHang', gioHangSchema);
