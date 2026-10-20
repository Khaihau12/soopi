const mongoose = require('mongoose');
const { laSoNguyen } = require('../utils/kiemTra');

const apDungVoucherSchema = new mongoose.Schema({
  giaTriGiamThucTe: { type: Number, required: true, min: 0, validate: { validator: laSoNguyen, message: 'Giá trị giảm phải là số nguyên' } },
  thoiGianApDung: { type: Date, default: Date.now },
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', required: true },
  donHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'DonHang', required: true },
}, { collection: 'ApDungVoucher' });

apDungVoucherSchema.index({ donHangId: 1 });

module.exports = mongoose.model('ApDungVoucher', apDungVoucherSchema);
