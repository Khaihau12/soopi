const mongoose = require('mongoose');
const { laSoNguyen } = require('../utils/kiemTra');
const { PHUONG_THUC_THANH_TOAN, TRANG_THAI_GIAO_DICH } = require('../constants/trangThai.constant');

const giaoDichThanhToanSchema = new mongoose.Schema({
  maGiaoDich: { type: String, required: true, unique: true },
  soTien: { type: Number, required: true, min: 0, validate: { validator: laSoNguyen, message: 'Số tiền phải là số nguyên' } },
  phuongThucThanhToan: { type: String, enum: Object.values(PHUONG_THUC_THANH_TOAN), default: PHUONG_THUC_THANH_TOAN.VNPAY },
  trangThaiThanhToan: { type: String, enum: Object.values(TRANG_THAI_GIAO_DICH), default: TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN },
  thoiGianTao: { type: Date, default: Date.now },
  thoiGianHoanTat: { type: Date },
}, { collection: 'GiaoDichThanhToan' });

module.exports = mongoose.model('GiaoDichThanhToan', giaoDichThanhToanSchema);
