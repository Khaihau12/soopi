const mongoose = require('mongoose');
const { LOAI_VOUCHER, KIEU_GIAM, TRANG_THAI_VOUCHER } = require('../constants/trangThai.constant');
const { laSoNguyen } = require('../utils/kiemTra');

const soNguyen = { validator: laSoNguyen, message: 'Giá trị phải là số nguyên' };

const voucherSchema = new mongoose.Schema({
  maVoucher: { type: String, required: true, trim: true, uppercase: true },
  tenVoucher: { type: String, required: true },
  loaiVoucher: { type: String, enum: Object.values(LOAI_VOUCHER), required: true },
  kieuGiam: { type: String, enum: Object.values(KIEU_GIAM), required: true },
  giaTriGiam: { type: Number, required: true, min: 0, validate: soNguyen },
  giamToiDa: { type: Number, min: 0, validate: soNguyen },
  giaTriDonToiThieu: { type: Number, min: 0, default: 0, validate: soNguyen },
  soLuong: { type: Number, required: true, min: 0, validate: soNguyen },
  ngayBatDau: { type: Date, required: true },
  ngayKetThuc: { type: Date, required: true },
  trangThai: { type: String, enum: Object.values(TRANG_THAI_VOUCHER), default: TRANG_THAI_VOUCHER.KICH_HOAT },
  cuaHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'CuaHang', default: null },
}, { collection: 'Voucher' });

voucherSchema.index({ maVoucher: 1 }, { unique: true });

module.exports = mongoose.model('Voucher', voucherSchema);
