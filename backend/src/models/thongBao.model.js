const mongoose = require('mongoose');

const LOAI_THONG_BAO = ['Đơn hàng', 'Đăng ký bán hàng', 'Tin nhắn', 'Đánh giá'];
const thongBaoSchema = new mongoose.Schema({
  taiKhoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan', required: true },
  loai: { type: String, enum: LOAI_THONG_BAO, required: true },
  tieuDe: { type: String, required: true, maxlength: 120 },
  noiDung: { type: String, required: true, maxlength: 300 },
  duongDan: { type: String, required: true, maxlength: 250 },
  maSuKien: { type: String, required: true },
  ngayTao: { type: Date, default: Date.now },
  ngayDoc: { type: Date, default: null },
}, { collection: 'ThongBao' });

thongBaoSchema.index({ taiKhoanId: 1, maSuKien: 1 }, { unique: true });
thongBaoSchema.index({ taiKhoanId: 1, ngayTao: -1 });

module.exports = mongoose.model('ThongBao', thongBaoSchema);
