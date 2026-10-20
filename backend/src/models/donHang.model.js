const mongoose = require('mongoose');
const { laSoNguyen } = require('../utils/kiemTra');
const { DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');
const {
  PHUONG_THUC_THANH_TOAN,
  TRANG_THAI_THANH_TOAN_DON,
  TRANG_THAI_XU_LY,
} = require('../constants/trangThai.constant');

const donHangSchema = new mongoose.Schema({
  diaChiNhanHang: { type: String, required: true, maxlength: DO_DAI_TOI_DA.DIA_CHI },
  tongTienHang: { type: Number, required: true, min: 0, validate: { validator: laSoNguyen, message: 'Tổng tiền hàng phải là số nguyên' } },
  tongGiamVoucher: { type: Number, min: 0, default: 0, validate: { validator: laSoNguyen, message: 'Tổng giảm voucher phải là số nguyên' } },
  phiVanChuyen: { type: Number, min: 0, default: 0, validate: { validator: laSoNguyen, message: 'Phí vận chuyển phải là số nguyên' } },
  giamPhiVanChuyen: { type: Number, min: 0, default: 0, validate: { validator: laSoNguyen, message: 'Giảm phí vận chuyển phải là số nguyên' } },
  tongThanhToan: { type: Number, required: true, min: 0, validate: { validator: laSoNguyen, message: 'Tổng thanh toán phải là số nguyên' } },
  phuongThucThanhToan: { type: String, enum: Object.values(PHUONG_THUC_THANH_TOAN), default: PHUONG_THUC_THANH_TOAN.VNPAY },
  trangThaiThanhToan: { type: String, enum: Object.values(TRANG_THAI_THANH_TOAN_DON), default: TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN },
  trangThaiXuLy: { type: String, enum: Object.values(TRANG_THAI_XU_LY), default: TRANG_THAI_XU_LY.CHO_XAC_NHAN },
  ngayTao: { type: Date, default: Date.now },
  ngayHoanThanh: { type: Date },
  taiKhoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan', required: true },
  cuaHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'CuaHang', required: true },
  giaoDichId: { type: mongoose.Schema.Types.ObjectId, ref: 'GiaoDichThanhToan', required: true },
}, { collection: 'DonHang' });

donHangSchema.index({ taiKhoanId: 1, ngayTao: -1 });
donHangSchema.index({ cuaHangId: 1, ngayTao: -1 });
donHangSchema.index({ giaoDichId: 1 });

module.exports = mongoose.model('DonHang', donHangSchema);
