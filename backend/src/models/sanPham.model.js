const mongoose = require('mongoose');
const { TRANG_THAI_KINH_DOANH } = require('../constants/trangThai.constant');
const { DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');
const { laSoNguyen } = require('../utils/kiemTra');
const { NGUONG_CANH_BAO_MAC_DINH, LOAI_BIEN_DONG_TON_KHO } = require('../constants/tonKho.constant');

const bienDongTonKhoSchema = new mongoose.Schema({
  loai: { type: String, required: true, enum: Object.values(LOAI_BIEN_DONG_TON_KHO) },
  soLuongThayDoi: { type: Number, required: true, validate: { validator: laSoNguyen, message: 'Biến động phải là số nguyên' } },
  ngayTao: { type: Date, required: true },
  donHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'DonHang' },
  taiKhoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan' },
}, { _id: true });

const sanPhamSchema = new mongoose.Schema({
  tenSanPham: { type: String, required: true, trim: true, maxlength: DO_DAI_TOI_DA.TEN_SAN_PHAM },
  hinhAnh: { type: [String], default: [] },
  moTa: { type: String, maxlength: DO_DAI_TOI_DA.MO_TA },
  giaGoc: { type: Number, required: true, min: 1, validate: { validator: laSoNguyen, message: 'Giá gốc phải là số nguyên' } },
  soLuongTon: { type: Number, required: true, min: 0, default: 0, validate: { validator: laSoNguyen, message: 'Số lượng tồn phải là số nguyên' } },
  nguongCanhBaoTon: { type: Number, min: 0, default: NGUONG_CANH_BAO_MAC_DINH,
    validate: { validator: laSoNguyen, message: 'Ngưỡng cảnh báo phải là số nguyên' } },
  bienDongTonKho: { type: [bienDongTonKhoSchema], default: [], select: false },
  trangThaiKinhDoanh: { type: String, enum: Object.values(TRANG_THAI_KINH_DOANH), default: TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH },
  cuaHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'CuaHang', required: true },
  danhMucId: { type: mongoose.Schema.Types.ObjectId, ref: 'DanhMuc', required: true },
}, { collection: 'SanPham' });

sanPhamSchema.index({ cuaHangId: 1 });
sanPhamSchema.index({ danhMucId: 1 });
sanPhamSchema.index({ tenSanPham: 'text' }, { default_language: 'none' });

module.exports = mongoose.model('SanPham', sanPhamSchema);
