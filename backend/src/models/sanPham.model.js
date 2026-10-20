const mongoose = require('mongoose');
const { TRANG_THAI_KINH_DOANH } = require('../constants/trangThai.constant');
const { DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');
const { laSoNguyen } = require('../utils/kiemTra');

const sanPhamSchema = new mongoose.Schema({
  tenSanPham: { type: String, required: true, trim: true, maxlength: DO_DAI_TOI_DA.TEN_SAN_PHAM },
  hinhAnh: { type: [String], default: [] },
  moTa: { type: String, maxlength: DO_DAI_TOI_DA.MO_TA },
  giaGoc: { type: Number, required: true, min: 1, validate: { validator: laSoNguyen, message: 'Giá gốc phải là số nguyên' } },
  soLuongTon: { type: Number, required: true, min: 0, default: 0, validate: { validator: laSoNguyen, message: 'Số lượng tồn phải là số nguyên' } },
  trangThaiKinhDoanh: { type: String, enum: Object.values(TRANG_THAI_KINH_DOANH), default: TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH },
  cuaHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'CuaHang', required: true },
  danhMucId: { type: mongoose.Schema.Types.ObjectId, ref: 'DanhMuc', required: true },
}, { collection: 'SanPham' });

sanPhamSchema.index({ cuaHangId: 1 });
sanPhamSchema.index({ danhMucId: 1 });
sanPhamSchema.index({ tenSanPham: 'text' }, { default_language: 'none' });

module.exports = mongoose.model('SanPham', sanPhamSchema);
