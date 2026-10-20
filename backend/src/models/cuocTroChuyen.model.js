const mongoose = require('mongoose');

const cuocTroChuyenSchema = new mongoose.Schema({
  thoiGianBatDau: { type: Date, default: Date.now },
  thoiGianCapNhat: { type: Date, default: Date.now },
  taiKhoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan', required: true },
  cuaHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'CuaHang', required: true },
}, { collection: 'CuocTroChuyen' });

cuocTroChuyenSchema.index({ taiKhoanId: 1, cuaHangId: 1 }, { unique: true });

module.exports = mongoose.model('CuocTroChuyen', cuocTroChuyenSchema);
