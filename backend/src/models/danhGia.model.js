const mongoose = require('mongoose');
const { laSoNguyen } = require('../utils/kiemTra');
const { DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');

const danhGiaSchema = new mongoose.Schema({
  soSao: { type: Number, required: true, min: 1, max: 5, validate: { validator: laSoNguyen, message: 'Số sao phải là số nguyên' } },
  noiDung: { type: String, required: true, trim: true, maxlength: DO_DAI_TOI_DA.NOI_DUNG },
  ngayDanhGia: { type: Date, default: Date.now },
  taiKhoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan', required: true },
  sanPhamId: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham', required: true },
  chiTietDonHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChiTietDonHang', required: true, unique: true },
}, { collection: 'DanhGia' });

danhGiaSchema.index({ sanPhamId: 1 });

module.exports = mongoose.model('DanhGia', danhGiaSchema);
